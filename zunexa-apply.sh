#!/usr/bin/env bash
set -euo pipefail
ROOT="${ZUNEXA_ROOT:-$HOME/Zunexa}"
cd "$ROOT"
for f in settings.html zunexa-actions.js CHANGELOG.md; do
  [ -f "$f" ] || { echo "✗ ناقص: $f"; exit 1; }
done
command -v python3 >/dev/null || { echo "✗ python3 مطلوب"; exit 1; }

TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p .backups
tar czf ".backups/pre-connectors-$TS.tgz" settings.html zunexa-actions.js CHANGELOG.md vercel.json robots.txt ai.html zunexa-Time-Tracker.js 2>/dev/null || true
echo "✓ نسخة احتياطية: .backups/pre-connectors-$TS.tgz"

# ───────────────────────── zunexa-connectors.js ─────────────────────────
cat > zunexa-connectors.js <<'EOF'
/* zunexa-connectors.js — Unified Connector Layer (يوسّع ZunexaActions بدون تعديله)
   fetch موحّد لـ: Google Calendar / Google Status / Tasks / Geo / مزودي الذكاء الاصطناعي.
   كل استدعاء: timeout + عزل أخطاء (allSettled) + قياس زمن. */
(function (g) {
  'use strict';
  var TIMEOUT_MS = 8000;
  var PROVIDERS = { openrouter: 'ai-openrouter', gemini: 'ai-gemini', groq: 'ai-groq', deepseek: 'ai-deepseek' };

  function fnBase() {
    return (typeof ZX_SUPABASE_URL !== 'undefined' ? ZX_SUPABASE_URL : '') + '/functions/v1';
  }
  function anon() { return typeof ZX_SUPABASE_ANON_KEY !== 'undefined' ? ZX_SUPABASE_ANON_KEY : ''; }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('timeout ' + ms + 'ms')); }, ms || TIMEOUT_MS);
      Promise.resolve(p).then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function actions() {
    if (!g.ZunexaActions || !g.ZunexaActions._registry) throw new Error('ZunexaActions غير محمّل');
    return g.ZunexaActions;
  }
  function runAction(name, args) {
    var def = actions()._registry[name];
    if (!def) throw new Error('إجراء غير معروف: ' + name);
    return def.run(def.validate(args || {}));
  }
  async function sb() {
    if (typeof g.zxSB !== 'function') throw new Error('zxSB غير متوفر');
    var c = await g.zxSB();
    if (!c) throw new Error('Supabase client غير جاهز');
    return c;
  }
  function localTasks() {
    try { return JSON.parse(localStorage.getItem('zx_tasks_local') || '[]'); } catch (e) { return []; }
  }

  var connectors = {
    google_status: {
      label: 'Google (الحالة)',
      fetch: function () { return actions().refreshGoogleStatus(); }
    },
    calendar: {
      label: 'Google Calendar',
      fetch: function (a) { return runAction('list_events', a); }
    },
    tasks: {
      label: 'Zunexa Tasks',
      fetch: async function () {
        var c = await sb(), s = (await c.auth.getSession()).data.session;
        if (!s) return { source: 'local', items: localTasks() };
        var r = await c.from('zx_tasks').select('id,title,notes,due_at,done').eq('user_id', s.user.id).order('due_at', { ascending: true, nullsFirst: false }).limit(200);
        if (r.error) return { source: 'local', items: localTasks(), warn: r.error.message };
        return { source: 'supabase', items: r.data || [] };
      }
    },
    geo: {
      label: 'الموقع (IP)',
      fetch: function () {
        try { var c = JSON.parse(localStorage.getItem('zx_geo') || 'null'); return Promise.resolve(c && c.data ? c.data : null); }
        catch (e) { return Promise.resolve(null); }
      }
    },
    device_location: {
      label: 'موقع الجهاز',
      fetch: function () { return runAction('get_location', {}); }
    },
    providers: {
      label: 'مزودو الذكاء الاصطناعي',
      /* preflight OPTIONS: 404 = الدالة غير منشورة، 2xx/204 = موجودة */
      fetch: async function () {
        var out = {};
        await Promise.all(Object.keys(PROVIDERS).map(async function (k) {
          var t0 = performance.now();
          try {
            var r = await withTimeout(fetch(fnBase() + '/' + PROVIDERS[k], {
              method: 'OPTIONS',
              headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,apikey', 'Origin': location.origin }
            }), 6000);
            out[k] = { fn: PROVIDERS[k], deployed: r.status !== 404, http: r.status, ms: Math.round(performance.now() - t0) };
          } catch (e) {
            out[k] = { fn: PROVIDERS[k], deployed: false, error: e.message, ms: Math.round(performance.now() - t0) };
          }
        }));
        return out;
      }
    }
  };

  /* call(name, args) — استدعاء واحد موحّد */
  async function call(name, args) {
    var c = connectors[name];
    if (!c) throw new Error('connector غير معروف: ' + name);
    var t0 = performance.now();
    try {
      var data = await withTimeout(c.fetch(args || {}), TIMEOUT_MS);
      return { name: name, ok: true, data: data, ms: Math.round(performance.now() - t0) };
    } catch (e) {
      return { name: name, ok: false, error: e && e.message ? e.message : String(e), ms: Math.round(performance.now() - t0) };
    }
  }

  /* fetchAll({calendar:{from,to}, tasks:true, providers:true}) — كلها بالتوازي */
  async function fetchAll(spec) {
    spec = spec || {};
    var names = Object.keys(spec).length ? Object.keys(spec).filter(function (k) { return spec[k] && connectors[k]; }) : Object.keys(connectors);
    var results = await Promise.all(names.map(function (n) { return call(n, spec[n] && typeof spec[n] === 'object' ? spec[n] : {}); }));
    var map = {};
    results.forEach(function (r) { map[r.name] = r; });
    return map;
  }

  /* تسجيل connector جديد لاحقاً بدون تعديل الملف */
  function register(name, label, fetchFn) {
    if (!/^[a-z0-9_]{2,32}$/.test(name)) throw new Error('اسم غير صالح');
    if (typeof fetchFn !== 'function') throw new Error('fetch يجب أن تكون دالة');
    connectors[name] = { label: label || name, fetch: fetchFn };
  }

  g.ZunexaConnectors = {
    call: call, fetchAll: fetchAll, register: register,
    list: function () { return Object.keys(connectors).map(function (k) { return { name: k, label: connectors[k].label }; }); },
    PROVIDERS: PROVIDERS
  };
  /* إتاحتها كذلك من ZunexaActions */
  if (g.ZunexaActions) g.ZunexaActions.connectors = g.ZunexaConnectors;
  else g.addEventListener('DOMContentLoaded', function () { if (g.ZunexaActions) g.ZunexaActions.connectors = g.ZunexaConnectors; });
})(window);
EOF

# ───────────────────────── zunexa-control.js ─────────────────────────
cat > zunexa-control.js <<'EOF'
/* zunexa-control.js — لوحة التحكم الشاملة (تبويب "التحكم" فـ settings.html)
   1) فحص حي لكل الـ Connectors  2) عرض/حذف/تصدير/استيراد كل مفاتيح zx_*
   3) مزامنة الإعدادات لـ profiles.app_settings. */
(function (g) {
  'use strict';
  var SENSITIVE = ['zx_api_keys'];               // لا تُصدَّر ولا تُستورد
  var PROTECTED = /^sb-/;                        // جلسة Supabase: لا تُلمس أبداً
  var _esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var $ = function (id) { return document.getElementById(id); };
  var say = function (m) { if (typeof g.toast === 'function') g.toast(m); };

  function zxKeys() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('zx_') === 0 && !PROTECTED.test(k)) out.push(k);
    }
    return out.sort();
  }

  function statusBadge(ok) { return '<span style="color:var(--' + (ok ? 'green' : 'red') + ')">' + (ok ? '● متصل' : '● خطأ') + '</span>'; }

  function summarize(r) {
    if (!r.ok) return _esc(r.error);
    var d = r.data;
    if (r.name === 'providers') return Object.keys(d).map(function (k) { return k + ': ' + (d[k].deployed ? '✓' : '✗ غير منشورة'); }).join(' · ');
    if (r.name === 'google_status') return d.connected ? 'متصل ' + _esc(d.email || '') : 'غير متصل';
    if (r.name === 'tasks') return d.items.length + ' مهمة (' + d.source + ')';
    if (r.name === 'calendar') return d && d.events ? d.events.length + ' حدث' : 'تم';
    if (r.name === 'geo') return d ? _esc((d.country || '') + ' ' + (d.city || '')) : 'لا بيانات';
    return 'تم';
  }

  async function runChecks() {
    var box = $('ccConnectors');
    if (!g.ZunexaConnectors) { box.textContent = 'zunexa-connectors.js غير محمّل'; return; }
    box.innerHTML = '<div class="set-row-desc">⏳ جاري الفحص...</div>';
    var spec = { google_status: true, tasks: true, geo: true, providers: true, calendar: {} };
    var res = await g.ZunexaConnectors.fetchAll(spec);
    var labels = {}; g.ZunexaConnectors.list().forEach(function (c) { labels[c.name] = c.label; });
    box.innerHTML = Object.keys(res).map(function (k) {
      var r = res[k];
      return '<div class="set-row"><div class="set-row-txt"><div class="set-row-title">' + _esc(labels[k] || k) + ' ' + statusBadge(r.ok) +
        '</div><div class="set-row-desc" style="direction:ltr;text-align:start">' + summarize(r) + ' · ' + r.ms + 'ms</div></div></div>';
    }).join('');
  }

  function renderKeys() {
    var q = ($('ccFilter') && $('ccFilter').value || '').toLowerCase();
    var keys = zxKeys().filter(function (k) { return !q || k.toLowerCase().indexOf(q) !== -1; });
    $('ccKeys').innerHTML = keys.length ? keys.map(function (k) {
      var v = localStorage.getItem(k) || '';
      var shown = SENSITIVE.indexOf(k) !== -1 ? '••• (محمي)' : _esc(v.length > 90 ? v.slice(0, 90) + '…' : v);
      return '<div class="set-row"><div class="set-row-txt"><div class="set-row-title" style="direction:ltr;text-align:start">' + _esc(k) +
        '</div><div class="set-row-desc" style="direction:ltr;text-align:start;word-break:break-all">' + shown + '</div></div>' +
        '<button class="mini-ghost-btn" data-cc-del="' + _esc(k) + '">🗑</button></div>';
    }).join('') : '<div class="set-row-desc">لا مفاتيح.</div>';
    $('ccKeys').querySelectorAll('[data-cc-del]').forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-cc-del');
        if (!confirm('حذف ' + k + ' ؟')) return;
        localStorage.removeItem(k); renderKeys(); syncRemote(); say('🗑 ' + k);
      };
    });
    $('ccCount').textContent = keys.length + ' مفتاح';
  }

  function exportSettings() {
    var o = {};
    zxKeys().forEach(function (k) { if (SENSITIVE.indexOf(k) === -1) o[k] = localStorage.getItem(k); });
    var blob = new Blob([JSON.stringify({ v: 1, exported_at: new Date().toISOString(), data: o }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'zunexa-settings.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function importSettings(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var p = JSON.parse(r.result), d = p && p.data, n = 0;
        if (!d || typeof d !== 'object') throw new Error('ملف غير صالح');
        Object.keys(d).forEach(function (k) {
          if (k.indexOf('zx_') !== 0 || SENSITIVE.indexOf(k) !== -1 || PROTECTED.test(k) || typeof d[k] !== 'string') return;
          localStorage.setItem(k, d[k]); n++;
        });
        renderKeys(); syncRemote(); say('✓ تم استيراد ' + n + ' مفتاح — أعد تحميل الصفحة');
      } catch (e) { say('⚠ ' + e.message); }
    };
    r.readAsText(file);
  }

  function syncRemote() { if (typeof g.schedulePushAppSettings === 'function') g.schedulePushAppSettings(); }

  function resetAll() {
    if (!confirm('مسح كل إعدادات zx_* المحلية (الجلسة والمحادثات المحذوفة تبقى)؟')) return;
    zxKeys().filter(function (k) { return k !== 'zx_deleted_chats'; }).forEach(function (k) { localStorage.removeItem(k); });
    renderKeys(); syncRemote(); say('✓ تمت إعادة الضبط');
  }

  g.zxControlOpen = function () {
    if (!g.zxControlOpen._bound) {
      g.zxControlOpen._bound = true;
      $('ccRun').onclick = runChecks;
      $('ccExport').onclick = exportSettings;
      $('ccImport').onchange = function (e) { if (e.target.files[0]) importSettings(e.target.files[0]); e.target.value = ''; };
      $('ccFilter').oninput = renderKeys;
      $('ccReset').onclick = resetAll;
      $('ccPush').onclick = function () { if (typeof g.pushAppSettings === 'function') g.pushAppSettings().then(function () { say('✓ تمت المزامنة'); }); };
    }
    renderKeys(); runChecks();
  };
})(window);
EOF

# ───────────────────────── patch settings.html ─────────────────────────
python3 - <<'PY'
import re, sys
p = 'settings.html'
s = open(p, encoding='utf-8').read()
if 'zx-control-center' in s:
    print('= settings.html مُعدَّل مسبقاً'); sys.exit(0)

def rep(old, new, count=1):
    global s
    if old not in s:
        print('✗ نمط غير موجود:', old[:60]); sys.exit(1)
    s = s.replace(old, new, count)

rep('<script src="zunexa-actions.js" defer></script>',
    '<script src="zunexa-actions.js" defer></script>\n<script src="zunexa-connectors.js" defer></script>\n<script src="zunexa-control.js" defer></script>')

rep('<div class="set-tab" onclick="setSTab(\'account\')" id="tab-account">الحساب</div>',
    '<div class="set-tab" onclick="setSTab(\'control\')" id="tab-control">التحكم</div>\n      <div class="set-tab" onclick="setSTab(\'account\')" id="tab-account">الحساب</div>')

pane = '''    <!-- CONTROL CENTER (zx-control-center) -->
    <div class="set-pane" id="pane-control">
      <div class="billing-section-title" style="margin-top:0">حالة الـ Connectors</div>
      <div id="ccConnectors"></div>
      <button class="modal-save" id="ccRun" style="background:transparent;border:1px solid var(--bg);color:var(--gold)">↻ إعادة الفحص</button>

      <div class="billing-section-title">كل إعدادات zx_* <span id="ccCount" style="color:var(--tg);font-weight:400"></span></div>
      <input class="field-input" id="ccFilter" placeholder="🔍 فلترة المفاتيح...">
      <div id="ccKeys" style="max-height:320px;overflow-y:auto"></div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="mini-ghost-btn" id="ccExport">⬇ تصدير</button>
        <label class="mini-ghost-btn" style="cursor:pointer">⬆ استيراد<input type="file" id="ccImport" accept="application/json" style="display:none"></label>
        <button class="mini-ghost-btn" id="ccPush">☁ مزامنة للحساب</button>
      </div>
      <button class="modal-save" id="ccReset" style="margin-top:14px;background:transparent;border:1px solid var(--red);color:var(--red)">🗑 إعادة ضبط كل الإعدادات المحلية</button>
      <p style="font-size:11px;color:var(--tg);line-height:1.7;margin-top:10px">مفاتيح الجلسة (sb-*) ومفاتيح API (zx_api_keys) لا تُعرض ولا تُصدَّر ولا تُستورد.</p>
    </div>

'''
rep('    <!-- ACCOUNT -->', pane + '    <!-- ACCOUNT -->')

rep("if (name === 'integrations') zxLoadIntegrations();",
    "if (name === 'integrations') zxLoadIntegrations();\n  if (name === 'control' && window.zxControlOpen) window.zxControlOpen();")

rep("'account','integrations'];", "'account','integrations','control'];")
open(p, 'w', encoding='utf-8').write(s)
print('✓ settings.html')
PY

# ───────────────────────── إصلاحات البنية (من CHANGELOG) ─────────────────────────
# 1) اسم ملف Time Tracker (Vercel/Linux حساس لحالة الأحرف)
if [ -f zunexa-Time-Tracker.js ] && [ ! -f zunexa-time-tracker.js ]; then
  if git rev-parse --git-dir >/dev/null 2>&1; then git mv zunexa-Time-Tracker.js zunexa-time-tracker.js; else mv zunexa-Time-Tracker.js zunexa-time-tracker.js; fi
  echo "✓ أُعيد تسمية zunexa-Time-Tracker.js → zunexa-time-tracker.js"
fi
# 2) robots.txt: ai.html ما يجب حجبه
if grep -qiE '^Disallow:\s*/ai(\.html)?\s*$' robots.txt 2>/dev/null; then
  sed -i -E '/^Disallow:\s*\/ai(\.html)?\s*$/Id' robots.txt && echo "✓ أُزيل Disallow لـ ai.html من robots.txt"
else echo "= robots.txt سليم"; fi
# 3) vercel.json: rewrite لملف غير موجود
python3 - <<'PY'
import json, os
v = json.load(open('vercel.json', encoding='utf-8'))
bad = [r for r in v.get('rewrites', []) if not os.path.exists(r['destination'].lstrip('/'))]
if bad:
    v['rewrites'] = [r for r in v['rewrites'] if r not in bad]
    v['rewrites'] += [{"source": b['source'], "destination": "/ai.html"} for b in bad]
    json.dump(v, open('vercel.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('✓ vercel.json: أُعيد توجيه', [b['destination'] for b in bad], '→ /ai.html')
else:
    print('= vercel.json: كل وجهات rewrites موجودة')
PY

# ───────────────────────── CHANGELOG ─────────────────────────
python3 - <<'PY'
p = 'CHANGELOG.md'
s = open(p, encoding='utf-8').read()
if 'Unified Connectors' in s:
    print('= CHANGELOG مُحدَّث مسبقاً')
else:
    e = '''## [Unreleased] — 2026-11-04 (Unified Connectors + Settings Control Center)

### ✨ Added
- **`zunexa-connectors.js`** — `ZunexaConnectors.call(name,args)` / `.fetchAll(spec)` / `.register(name,label,fn)`: fetch موحّد بالتوازي (timeout 8s، `Promise.all` مع عزل الأخطاء، قياس الزمن) لـ `google_status`, `calendar`, `tasks` (Supabase `zx_tasks` مع fallback محلي), `geo`, `device_location`, `providers`. الإجراءات تمر عبر `ZunexaActions._registry` (validate ثم run) فلا تُكرَّر القواعد الأمنية. مُتاح أيضاً كـ `ZunexaActions.connectors`.
- **`providers` connector** — preflight `OPTIONS` لكل Edge Function (`ai-openrouter/gemini/groq/deepseek`)؛ 404 = غير منشورة (يكشف مباشرة غياب `ai-deepseek` و`agent-planner`).
- **`zunexa-control.js` + تبويب "التحكم" فـ `settings.html`** — فحص حي للـ Connectors، عرض/حذف/تصدير/استيراد كل مفاتيح `zx_*`، مزامنة لـ `profiles.app_settings`. مفاتيح `sb-*` و`zx_api_keys` مستثناة من العرض والتصدير والاستيراد.

### 🐛 Fixed
- `zunexa-Time-Tracker.js` → `zunexa-time-tracker.js` (ai.html كيحمّله بالحروف الصغيرة؛ Vercel حساس للحالة = 404).
- `robots.txt`: إزالة أي `Disallow` لـ `ai.html` إن وُجد.
- `vercel.json`: أي rewrite لوجهة غير موجودة يُحوَّل إلى `/ai.html`.

### ⏭️ Remaining
- `google-action` Edge Function و`google_integration.sql` لم تُفحص (غير مرفقة)؛ عقدها مستنتج من `zunexa-actions.js`.
- لم يُنفَّذ فحص حي لمشروع Supabase `xrldhfsytysznyyhwjlr`؛ استعمل تبويب "التحكم" ← حالة الـ Connectors للتحقق.
- `agent-planner` و`ai-deepseek` غير منشورتين (راجع إدخال 2026-10-21).

'''
    open(p, 'w', encoding='utf-8').write(e + s)
    print('✓ CHANGELOG.md')
PY

# ───────────────────────── تحقق ─────────────────────────
if command -v node >/dev/null; then
  node --check zunexa-connectors.js && node --check zunexa-control.js && echo "✓ node --check OK"
  python3 - <<'PY'
import re, subprocess, sys, tempfile
s = open('settings.html', encoding='utf-8').read()
blocks = re.findall(r'<script>([\s\S]*?)</script>', s)
bad = 0
for i, b in enumerate(blocks):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(b); n = f.name
    r = subprocess.run(['node', '--check', n], capture_output=True, text=True)
    if r.returncode: bad += 1; print('✗ inline script', i, r.stderr[:200])
print('✓ settings.html inline scripts OK' if not bad else '✗ أخطاء syntax')
sys.exit(bad)
PY
else echo "! node غير مثبّت — تخطّيت فحص syntax"; fi

for f in zunexa-connectors.js zunexa-control.js; do grep -q "$f" settings.html && echo "✓ $f مربوط فـ settings.html"; done
chmod 644 zunexa-connectors.js zunexa-control.js settings.html CHANGELOG.md
echo
echo "تم. افتح settings.html?tab=control ، ثم: git add -A && git commit -m 'feat: unified connectors + control center' && vercel --prod"
