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
