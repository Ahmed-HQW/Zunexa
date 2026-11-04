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
