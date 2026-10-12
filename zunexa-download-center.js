/*! Zunexa Download Center 1.0.0
 *
 * Cross-platform download section for Zunexa AI (Linux AppImage, Debian
 * package, Android APK) with:
 *   - browser platform detection (a HINT only, never a compatibility check)
 *   - consent-gated download analytics (nothing is sent before opt-in)
 *   - release asset verification through the public GitHub Releases API
 *
 * Usage
 *   Inline section : <div data-zunexa-download data-zdc-page="landing"></div>
 *   Compact/folded : add data-zdc-compact
 *   Modal dialog   : ZunexaDownloadCenter.openDialog({ page: 'ai' })
 *
 * Reuses the page's existing Supabase client (global `_SB`) when present.
 * Never creates a second client. Tracking failures can never block a
 * download: every download is a plain <a href>.
 *
 * Honest semantics
 *   download_started  = the user clicked the link. NOT proof of a finished
 *                       download and NOT an installation.
 *   Installation can't be observed from a web page. See the SQL migration
 *   (register_app_installation) for the optional in-app contract.
 */
(function (global) {
  'use strict';
  if (global.ZunexaDownloadCenter) return;

  var doc = global.document;

  /* ------------------------------------------------------------------ *
   * Configuration (override with window.ZUNEXA_DL_CONFIG before load)
   * ------------------------------------------------------------------ */
  var HF_BASE = 'https://huggingface.co/datasets/ahmed12dev/app_zunexa/resolve/main/';
  var HF_SUFFIX = '?download=true';
  var CFG = {
    product: 'zunexa-ai',
    version: '0.1.0',
    // Publishable (anon) key: public by design, protected by RLS + RPC checks.
    supabaseUrl: 'https://xrldhfsytysznyyhwjlr.supabase.co',
    supabaseKey: 'sb_publishable_qtZyzLSPVYjH0yB0BJY8yg_2r2ct35F',
    releasePage: 'https://huggingface.co/datasets/ahmed12dev/app_zunexa/tree/main',
    releaseApi: 'https://huggingface.co/api/datasets/ahmed12dev/app_zunexa/tree/main',
    webAppUrl: 'ai.html',
    consentKey: 'zunexa_dl_consent_v1',
    sessionKey: 'zunexa_dl_session_v1',
    releaseCacheKey: 'zunexa_dl_release_v1'
  };
  if (global.ZUNEXA_DL_CONFIG && typeof global.ZUNEXA_DL_CONFIG === 'object') {
    for (var ck in global.ZUNEXA_DL_CONFIG) {
      if (Object.prototype.hasOwnProperty.call(global.ZUNEXA_DL_CONFIG, ck)) CFG[ck] = global.ZUNEXA_DL_CONFIG[ck];
    }
  }

  // Stable Hugging Face dataset URLs (resolve/main, no expiring signatures).
  var ARTIFACTS = {
    appimage: { id: 'appimage', platform: 'linux', format: 'AppImage', arch: 'x86_64 / AMD64',
                file: 'zunexa_0.1.0_amd64.AppImage', url: HF_BASE + 'zunexa_0.1.0_amd64.AppImage' + HF_SUFFIX },
    deb:      { id: 'deb', platform: 'linux', format: '.deb', arch: 'AMD64',
                file: 'zunexa_0.1.0_amd64.deb', url: HF_BASE + 'zunexa_0.1.0_amd64.deb' + HF_SUFFIX },
    apk:      { id: 'apk', platform: 'android', format: 'APK', arch: null,
                file: 'zunexa_signed.apk', url: HF_BASE + 'zunexa_signed.apk' + HF_SUFFIX }
  };
  var ARTIFACT_IDS = ['appimage', 'deb', 'apk'];

  /* ------------------------------------------------------------------ *
   * Small utilities
   * ------------------------------------------------------------------ */
  var uidCounter = 0;
  function nextId(prefix) { uidCounter += 1; return prefix + '-' + uidCounter; }

  function uuidv4() {
    try { if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID(); } catch (e) {}
    var b = new Uint8Array(16);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(b);
    else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = [], j;
    for (j = 0; j < 16; j++) h.push((b[j] + 0x100).toString(16).slice(1));
    return h[0] + h[1] + h[2] + h[3] + '-' + h[4] + h[5] + '-' + h[6] + h[7] + '-' + h[8] + h[9] + '-' + h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
  }

  // Storage that never throws (private mode, blocked storage, etc.).
  var mem = {};
  function store(kind) {
    return {
      get: function (k) { try { var v = global[kind].getItem(k); return v === null ? (mem[kind + k] || null) : v; } catch (e) { return mem[kind + k] || null; } },
      set: function (k, v) { try { global[kind].setItem(k, v); } catch (e) { mem[kind + k] = v; } },
      del: function (k) { try { global[kind].removeItem(k); } catch (e) {} delete mem[kind + k]; }
    };
  }
  var local = store('localStorage');
  var session = store('sessionStorage');

  function el(tag, attrs, kids) {
    var n = doc.createElement(tag), k, v;
    if (attrs) {
      for (k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v === true ? '' : String(v));
      }
    }
    if (kids) for (var i = 0; i < kids.length; i++) if (kids[i]) n.appendChild(kids[i]);
    return n;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, kids) {
    var n = doc.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, String(attrs[k]));
    if (kids) for (var i = 0; i < kids.length; i++) n.appendChild(kids[i]);
    return n;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }

  function humanSize(bytes) {
    if (!bytes || bytes < 0) return '';
    var mb = bytes / 1048576;
    return mb >= 100 ? Math.round(mb) + ' MB' : mb.toFixed(1) + ' MB';
  }

  /* ------------------------------------------------------------------ *
   * Platform detection (a compatibility HINT, never a verification)
   * ------------------------------------------------------------------ */
  function detectPlatform(nav) {
    nav = nav || global.navigator || {};
    var ua = String(nav.userAgent || '');
    var uad = nav.userAgentData || null;
    var uadPlat = uad && uad.platform ? String(uad.platform).toLowerCase() : '';
    var touch = Number(nav.maxTouchPoints) || 0;
    var cat = 'unknown', via = 'none';

    if (uadPlat) {
      if (uadPlat === 'android') cat = 'android';
      else if (uadPlat === 'chrome os' || uadPlat === 'chromium os') cat = 'chromeos';
      else if (uadPlat === 'windows') cat = 'windows';
      else if (uadPlat === 'macos') cat = 'macos';
      else if (uadPlat === 'ios') cat = 'ios';
      else if (uadPlat === 'linux') cat = 'linux';
      if (cat !== 'unknown') via = 'userAgentData';
    }
    if (cat === 'unknown') {
      // Order matters: Android UAs also contain "Linux"; iPadOS Safari
      // reports "Macintosh" (touch points are only used to tell them apart).
      if (/Android/i.test(ua)) cat = 'android';
      else if (/CrOS/.test(ua)) cat = 'chromeos';
      else if (/iPhone|iPad|iPod/.test(ua)) cat = 'ios';
      else if (/Windows/i.test(ua)) cat = 'windows';
      else if (/Macintosh|Mac OS X/i.test(ua)) cat = touch > 1 ? 'ios' : 'macos';
      else if (/Linux|X11/i.test(ua)) cat = 'linux';
      if (cat !== 'unknown') via = 'userAgent';
    }

    var arch = 'unknown';
    if (/x86_64|x64|amd64|Win64|WOW64/i.test(ua)) arch = 'x64';
    else if (/aarch64|arm64|armv\d/i.test(ua)) arch = 'arm';
    else if (/i[3-6]86/i.test(ua)) arch = 'x86';

    return {
      category: cat,
      via: via,
      mobile: !!(uad && uad.mobile) || /Mobi|Android|iPhone|iPad|iPod/i.test(ua),
      arch: arch,
      debianLike: /Ubuntu|Debian/i.test(ua)   // Firefox exposes this on Ubuntu; Chromium does not
    };
  }

  // Optional refinement via UA-CH high-entropy hints (Chromium only).
  function refineArch(p) {
    var uad = global.navigator && global.navigator.userAgentData;
    if (!uad || typeof uad.getHighEntropyValues !== 'function' || p.category !== 'linux') return Promise.resolve(p);
    return withTimeout(uad.getHighEntropyValues(['architecture', 'bitness']), 1500).then(function (v) {
      if (v && v.architecture === 'arm') p.arch = 'arm';
      else if (v && v.architecture === 'x86') p.arch = (v.bitness === '32') ? 'x86' : 'x64';
      return p;
    }, function () { return p; });
  }

  function recommend(p) {
    if (p.category === 'android') return ['apk'];
    if (p.category === 'linux') {
      if (p.arch === 'arm' || p.arch === 'x86') return [];      // packages are AMD64-only
      return p.debianLike ? ['deb', 'appimage'] : ['appimage', 'deb'];
    }
    return [];
  }

  /* ------------------------------------------------------------------ *
   * Internationalisation (follows <html lang>)
   * ------------------------------------------------------------------ */
  var I18N = {
    en: {
      title: 'Get Zunexa AI',
      lead: 'Native apps for Linux and Android. No account needed to download.',
      foldTitle: 'Get the Linux and Android app',
      os: { linux: 'Linux', android: 'Android', windows: 'Windows', macos: 'macOS', ios: 'iOS', chromeos: 'ChromeOS', unknown: '' },
      hintKnown: function (os) { return 'Your browser reports ' + os + '. This is only a hint. A web page cannot verify your distribution, CPU or OS version.'; },
      hintUnknown: 'We could not identify your system. Choose the package that matches your device.',
      archWarn: 'Your browser reports a processor other than x86_64. The Linux packages below are built for x86_64 / AMD64 only.',
      unsupported: function (os) { return 'There is no native Zunexa app for ' + os + ' yet. You can keep using the web app. The packages below are still available if you are setting up another device.'; },
      openWeb: 'Open the web app',
      recommended: 'Suggested for your device',
      cardLabel: { appimage: 'Zunexa AI for Linux', deb: 'Zunexa AI for Debian', apk: 'Zunexa AI for Android' },
      meta: { format: 'Format', arch: 'Architecture', version: 'Version', file: 'File', size: 'Size' },
      download: 'Download',
      downloadFile: function (label) { return 'Download ' + label; },
      unavailable: 'This file is not listed on the release page right now.',
      viewRelease: 'View release page',
      guide: 'How to install',
      copy: 'Copy', copied: 'Copied',
      safe: 'Zunexa never installs or runs anything for you. Review each step before you run it.',
      steps: {
        appimage: [
          { t: 'Open a terminal in the folder where the file was saved.' },
          { t: 'Make the file executable:', c: 'chmod +x zunexa_0.1.0_amd64.AppImage' },
          { t: 'Start the app:', c: './zunexa_0.1.0_amd64.AppImage' },
          { t: 'If it does not start, your system may be missing FUSE 2. On Ubuntu 22.04 install libfuse2 (libfuse2t64 on 24.04):', c: 'sudo apt install libfuse2' }
        ],
        deb: [
          { t: 'Open a terminal in the folder where the file was saved.' },
          { t: 'Install the package (keep the ./ so apt reads the local file):', c: 'sudo apt install ./zunexa_0.1.0_amd64.deb' },
          { t: 'Open Zunexa AI from your applications menu.' }
        ],
        apk: [
          { t: 'Open the downloaded file from your notifications or the Downloads app.' },
          { t: 'If Android asks, allow your browser to install apps from this source. The setting is usually under Settings > Apps > Special access > Install unknown apps, but the path varies by device.' },
          { t: 'Confirm the installation. Afterwards you can switch that permission off again.' }
        ]
      },
      privTitle: 'Anonymous download statistics',
      consent: 'Count my download in anonymous statistics (optional)',
      privNote: 'If you allow this, Zunexa records which package you chose, your OS category and the app version, plus your account ID if you are signed in. No passwords, tokens, messages or device fingerprints. The ID of this browsing session is not kept after you close the tab. Downloads work the same either way, and you can change your choice at any time.',
      del: 'Delete my download records',
      delDone: 'Your download records were deleted.',
      delFail: 'Could not delete your records. Try again later.',
      close: 'Close',
      winLabel: 'Zunexa AI for Windows', winStatus: 'In development', winBtn: 'In development mode',
      winNote: 'The Windows app is in development mode and is not available to download yet. You can keep using the web app meanwhile.',
      metaStatus: 'Status'
    },
    ar: {
      title: 'حمّل تطبيق Zunexa AI',
      lead: 'تطبيقات أصلية لنظامَي Linux وAndroid. التحميل لا يتطلب حساباً.',
      foldTitle: 'حمّل تطبيق Linux وAndroid',
      os: { linux: 'Linux', android: 'Android', windows: 'Windows', macos: 'macOS', ios: 'iOS', chromeos: 'ChromeOS', unknown: '' },
      hintKnown: function (os) { return 'يشير المتصفح إلى أن جهازك يعمل بنظام ' + os + '. هذه إشارة تقريبية فقط، فصفحة الويب لا تستطيع التحقق من التوزيعة أو المعالج أو إصدار النظام.'; },
      hintUnknown: 'تعذّر التعرّف على نظامك. اختر الحزمة المناسبة لجهازك.',
      archWarn: 'يشير المتصفح إلى معالج غير x86_64. حزم Linux أدناه مبنية لمعمارية x86_64 / AMD64 فقط.',
      unsupported: function (os) { return 'لا يتوفر حالياً تطبيق Zunexa أصلي لنظام ' + os + '. يمكنك متابعة استعمال تطبيق الويب. الحزم أدناه متاحة إذا كنت تجهّز جهازاً آخر.'; },
      openWeb: 'افتح تطبيق الويب',
      recommended: 'مقترح لجهازك',
      cardLabel: { appimage: 'Zunexa AI لنظام Linux', deb: 'Zunexa AI لنظام Debian', apk: 'Zunexa AI لنظام Android' },
      meta: { format: 'الصيغة', arch: 'المعمارية', version: 'الإصدار', file: 'الملف', size: 'الحجم' },
      download: 'تحميل',
      downloadFile: function (label) { return 'تحميل ' + label; },
      unavailable: 'هذا الملف غير مدرج حالياً في صفحة الإصدار.',
      viewRelease: 'صفحة الإصدار',
      guide: 'طريقة التثبيت',
      copy: 'نسخ', copied: 'تم النسخ',
      safe: 'لا يثبّت Zunexa أو يشغّل أي شيء تلقائياً. راجع كل خطوة قبل تنفيذها.',
      steps: {
        appimage: [
          { t: 'افتح الطرفية داخل المجلد الذي حُفظ فيه الملف.' },
          { t: 'امنح الملف صلاحية التنفيذ:', c: 'chmod +x zunexa_0.1.0_amd64.AppImage' },
          { t: 'شغّل التطبيق:', c: './zunexa_0.1.0_amd64.AppImage' },
          { t: 'إن لم يعمل، فقد تحتاج مكتبة FUSE 2. على Ubuntu 22.04 ثبّت libfuse2 (وlibfuse2t64 على 24.04):', c: 'sudo apt install libfuse2' }
        ],
        deb: [
          { t: 'افتح الطرفية داخل المجلد الذي حُفظ فيه الملف.' },
          { t: 'ثبّت الحزمة (أبقِ ./ ليقرأ apt الملف المحلي):', c: 'sudo apt install ./zunexa_0.1.0_amd64.deb' },
          { t: 'افتح Zunexa AI من قائمة التطبيقات.' }
        ],
        apk: [
          { t: 'افتح الملف المحمَّل من الإشعارات أو من تطبيق التنزيلات.' },
          { t: 'إن طلب Android ذلك، اسمح للمتصفح بتثبيت التطبيقات من هذا المصدر. يوجد الإعداد عادةً في الإعدادات > التطبيقات > وصول خاص > تثبيت تطبيقات غير معروفة، لكن المسار يختلف بين الأجهزة.' },
          { t: 'أكّد التثبيت. بعدها يمكنك إيقاف هذه الصلاحية مجدداً.' }
        ]
      },
      privTitle: 'إحصاءات التحميل المجهولة',
      consent: 'احسب تحميلي ضمن الإحصاءات المجهولة (اختياري)',
      privNote: 'عند الموافقة يسجّل Zunexa الحزمة التي اخترتها وفئة نظام التشغيل وإصدار التطبيق، إضافة إلى معرّف حسابك إن كنت مسجلاً. لا كلمات مرور ولا رموز دخول ولا رسائل ولا بصمات أجهزة. لا يُحتفظ بمعرّف جلسة التصفح بعد إغلاق التبويب. يعمل التحميل بالطريقة نفسها في الحالتين، ويمكنك تغيير اختيارك في أي وقت.',
      del: 'احذف سجلات التحميل الخاصة بي',
      delDone: 'تم حذف سجلات التحميل الخاصة بك.',
      delFail: 'تعذّر حذف السجلات. حاول لاحقاً.',
      close: 'إغلاق',
      winLabel: 'Zunexa AI لنظام Windows', winStatus: 'قيد التطوير', winBtn: 'قيد التطوير',
      winNote: 'تطبيق Windows قيد التطوير حالياً وغير متاح للتحميل بعد. يمكنك متابعة استعمال تطبيق الويب في الوقت الحالي.',
      metaStatus: 'الحالة'
    }
  };
  function pickLang(opt) {
    var l = String(opt || (doc.documentElement && doc.documentElement.lang) || 'en').slice(0, 2).toLowerCase();
    return I18N[l] ? l : 'en';
  }

  /* ------------------------------------------------------------------ *
   * Consent + analytics (nothing is sent without explicit opt-in)
   * ------------------------------------------------------------------ */
  function getConsent() { return local.get(CFG.consentKey) === 'granted'; }
  function setConsent(on) {
    if (on) local.set(CFG.consentKey, 'granted');
    else { local.set(CFG.consentKey, 'denied'); session.del(CFG.sessionKey); }
  }
  function sessionId() {                      // pseudonymous, lives only for this tab session
    var s = session.get(CFG.sessionKey);
    if (!s) { s = uuidv4(); session.set(CFG.sessionKey, s); }
    return s;
  }

  function getClient() {                      // reuse the page's client, never create another
    try { if (typeof _SB !== 'undefined' && _SB && typeof _SB.rpc === 'function') return _SB; } catch (e) {}
    return null;
  }

  function callRpc(name, args) {
    var sb = getClient();
    if (sb) {
      return Promise.resolve(sb.rpc(name, args)).then(function (r) { if (r && r.error) throw r.error; return r && r.data; });
    }
    if (!CFG.supabaseUrl || !CFG.supabaseKey || typeof global.fetch !== 'function') return Promise.reject(new Error('no transport'));
    // publishable keys go in `apikey` only (they are not JWTs)
    return global.fetch(CFG.supabaseUrl + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': CFG.supabaseKey },
      body: JSON.stringify(args),
      keepalive: true
    }).then(function (r) { if (!r.ok) throw new Error('rpc ' + r.status); return r.json(); });
  }

  function referrerCategory() {
    var ref = doc.referrer;
    if (!ref) return 'direct';
    var host;
    try { host = new URL(ref).hostname.toLowerCase(); } catch (e) { return 'other'; }
    if (host === global.location.hostname) return 'internal';
    if (/(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia|brave)\./.test(host)) return 'search';
    if (/(^|\.)(facebook|instagram|linkedin|reddit|youtube|tiktok|whatsapp|telegram|pinterest|twitter)\./.test(host) ||
        /(^|\.)(x\.com|t\.co|youtu\.be|fb\.com)$/.test(host)) return 'social';
    return 'other';
  }
  function campaignId() {
    try {
      var q = new URLSearchParams(global.location.search);
      var c = String(q.get('utm_campaign') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
      return c || null;
    } catch (e) { return null; }
  }
  function cleanPage(s) { return String(s || 'unknown').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'unknown'; }

  var lastSent = {};
  // Fire-and-forget. Never throws, never blocks a download.
  function track(type, inst, artifactId, extra) {
    try {
      if (!getConsent()) return Promise.resolve(false);
      var a = artifactId ? ARTIFACTS[artifactId] : null;
      var meta = {
        page: cleanPage(inst.opts.page),
        ui_lang: inst.lang,
        detected_by: inst.platform.via,
        mobile: !!inst.platform.mobile
      };
      if (inst.platform.category === 'linux') meta.arch_hint = inst.platform.arch;
      if (a) meta.recommended = inst.recommended.indexOf(artifactId) !== -1;
      if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) meta[k] = extra[k];

      var args = {
        p_event_id: uuidv4(),                         // idempotency key
        p_event_type: type,
        p_session_id: sessionId(),
        p_platform: inst.platform.category,
        p_artifact: a ? a.id : null,
        p_app_version: CFG.version,
        p_referrer: referrerCategory(),
        p_campaign: campaignId(),
        p_metadata: meta,
        p_consent: true
      };
      return withTimeout(callRpc('log_download_event', args), 6000).then(function () { lastSent[type] = Date.now(); return true; })
        .catch(function () { return false; });       // analytics failure is silent
    } catch (e) { return Promise.resolve(false); }
  }

  /* ------------------------------------------------------------------ *
   * Release verification (Hugging Face tree API, cached, optional)
   * ------------------------------------------------------------------ */
  var release = { promise: null, assets: null, ok: false };
  function verifyRelease() {
    if (release.promise) return release.promise;
    var cached = session.get(CFG.releaseCacheKey);
    if (cached) {
      try {
        var c = JSON.parse(cached);
        if (c && Date.now() - c.t < 30 * 60 * 1000 && c.assets) { release.assets = c.assets; release.ok = true; return (release.promise = Promise.resolve(release)); }
      } catch (e) {}
    }
    if (typeof global.fetch !== 'function') return (release.promise = Promise.resolve(release));
    release.promise = withTimeout(global.fetch(CFG.releaseApi, { headers: { 'Accept': 'application/json' } }), 6000)
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (j) {
        var map = {};
        (Array.isArray(j) ? j : []).forEach(function (f) {
          if (f && f.type === 'file' && typeof f.path === 'string' && f.path.indexOf('/') === -1) {
            map[f.path] = { url: HF_BASE + encodeURIComponent(f.path) + HF_SUFFIX, size: Number(f.size) || 0 };
          }
        });
        release.assets = map; release.ok = true;
        session.set(CFG.releaseCacheKey, JSON.stringify({ t: Date.now(), assets: map }));
        return release;
      })
      .catch(function () { release.ok = false; return release; });   // unknown => keep static URLs, claim nothing
    return release.promise;
  }

  /* ------------------------------------------------------------------ *
   * Zellij-inspired decoration (8-point star lattice, inline SVG)
   * ------------------------------------------------------------------ */
  function starPoints(cx, cy, rOuter, rInner) {
    var pts = [], i, a, r;
    for (i = 0; i < 16; i++) {
      a = (Math.PI / 8) * i - Math.PI / 2;
      r = i % 2 === 0 ? rOuter : rInner;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }
  function latticeSvg() {
    var id = nextId('zdcp');
    var pattern = svg('pattern', { id: id, width: 56, height: 56, patternUnits: 'userSpaceOnUse' }, [
      svg('polygon', { points: starPoints(28, 28, 22, 11), fill: 'none', stroke: 'currentColor', 'stroke-width': '0.8' }),
      svg('polygon', { points: starPoints(28, 28, 11, 6.5), fill: 'none', stroke: 'currentColor', 'stroke-width': '0.6' }),
      svg('circle', { cx: 0, cy: 0, r: 2, fill: 'currentColor' }),
      svg('circle', { cx: 56, cy: 0, r: 2, fill: 'currentColor' }),
      svg('circle', { cx: 0, cy: 56, r: 2, fill: 'currentColor' }),
      svg('circle', { cx: 56, cy: 56, r: 2, fill: 'currentColor' })
    ]);
    return svg('svg', { 'class': 'zdc-lattice', 'aria-hidden': 'true', focusable: 'false', width: '100%', height: '100%' }, [
      svg('defs', null, [pattern]),
      svg('rect', { width: '100%', height: '100%', fill: 'url(#' + id + ')' })
    ]);
  }
  function starIcon() {
    return svg('svg', { 'class': 'zdc-star', viewBox: '0 0 24 24', width: '14', height: '14', 'aria-hidden': 'true', focusable: 'false' },
      [svg('polygon', { points: starPoints(12, 12, 11, 5.4), fill: 'currentColor' })]);
  }

  /* ------------------------------------------------------------------ *
   * Component
   * ------------------------------------------------------------------ */
  function createInstance(root, opts) {
    opts = opts || {};
    var lang = pickLang(opts.lang);
    var inst = {
      root: root, opts: opts, lang: lang, t: I18N[lang],
      platform: detectPlatform(), recommended: [], cards: {}, once: {}, viewed: false, clickAt: {}
    };
    inst.recommended = recommend(inst.platform);
    build(inst);
    refineArch(inst.platform).then(function () {
      inst.recommended = recommend(inst.platform);
      applyPlatform(inst);
    });
    return inst;
  }

  function osName(inst) { return inst.t.os[inst.platform.category] || ''; }

  function build(inst) {
    var t = inst.t, uid = nextId('zdc');
    var root = inst.root;
    root.textContent = '';
    root.classList.add('zdc');

    var title = el('h2', { 'class': 'zdc-title', id: uid + '-title', text: t.title });
    inst.titleId = uid + '-title';
    var head = el('header', { 'class': 'zdc-head' }, [
      latticeSvg(), title, el('p', { 'class': 'zdc-lead', text: t.lead })
    ]);

    inst.hintEl = el('p', { 'class': 'zdc-hint', role: 'status' });
    inst.noticeEl = el('div', { 'class': 'zdc-notice', hidden: true });
    inst.noticeText = el('p', { 'class': 'zdc-notice-text' });
    inst.noticeEl.appendChild(inst.noticeText);
    if (inst.opts.webAppUrl !== null) {
      inst.noticeEl.appendChild(el('a', { 'class': 'zdc-web', href: inst.opts.webAppUrl || CFG.webAppUrl, text: t.openWeb }));
    }

    inst.grid = el('ul', { 'class': 'zdc-grid' });
    ARTIFACT_IDS.forEach(function (id) { inst.cards[id] = buildCard(inst, id, uid); inst.grid.appendChild(inst.cards[id].li); });

    inst.winCard = buildWindowsCard(inst);
    inst.grid.appendChild(inst.winCard);

    var body = el('div', { 'class': 'zdc-body' }, [
      head, inst.hintEl, inst.noticeEl, inst.grid,
      el('p', { 'class': 'zdc-safe', text: t.safe }),
      buildPrivacy(inst, uid)
    ]);

    if (inst.opts.compact) {
      var fold = el('details', { 'class': 'zdc-fold' }, [
        el('summary', { 'class': 'zdc-fold-sum' }, [starIcon(), el('span', { text: t.foldTitle })]), body
      ]);
      fold.addEventListener('toggle', function () { if (fold.open) onVisible(inst); });
      root.appendChild(fold);
    } else {
      root.appendChild(body);
      watchVisible(inst, root);
    }
    applyPlatform(inst);
    wireDelegates(inst);
  }

  function buildCard(inst, id, uid) {
    var t = inst.t, a = ARTIFACTS[id], label = t.cardLabel[id];
    var li = el('li', { 'class': 'zdc-card', 'data-artifact': id });
    var badge = el('span', { 'class': 'zdc-badge', hidden: true }, [starIcon(), el('span', { text: t.recommended })]);
    var meta = el('dl', { 'class': 'zdc-meta' });
    function row(k, v, extraClass) {
      meta.appendChild(el('div', { 'class': 'zdc-meta-row' }, [
        el('dt', { text: t.meta[k] }),
        el('dd', { 'class': extraClass || null, dir: (k === 'file' || k === 'arch' || k === 'format' || k === 'version') ? 'ltr' : null, text: v })
      ]));
    }
    row('format', a.format);
    if (a.arch) row('arch', a.arch);
    row('version', CFG.version);
    row('file', a.file, 'zdc-file');
    var sizeDd = el('dd', { dir: 'ltr' });
    var sizeRow = el('div', { 'class': 'zdc-meta-row', hidden: true }, [el('dt', { text: t.meta.size }), sizeDd]);
    meta.appendChild(sizeRow);

    var status = el('p', { 'class': 'zdc-status', role: 'status', hidden: true });
    var link = el('a', {
      'class': 'zdc-btn', href: a.url, rel: 'noopener noreferrer', download: a.file,
      'aria-label': t.downloadFile(label) + ' (' + a.file + ')'
    }, [el('span', { text: t.download })]);

    var steps = el('ol', { 'class': 'zdc-steps' });
    t.steps[id].forEach(function (s) {
      var li2 = el('li', null, [el('span', { text: s.t })]);
      if (s.c) li2.appendChild(codeBlock(inst, s.c));
      steps.appendChild(li2);
    });
    var guide = el('details', { 'class': 'zdc-guide', 'data-artifact': id }, [el('summary', { text: t.guide }), steps]);

    li.appendChild(el('div', { 'class': 'zdc-card-top' }, [el('h3', { 'class': 'zdc-card-title', id: uid + '-' + id, text: label }), badge]));
    li.appendChild(meta);
    li.appendChild(status);
    li.appendChild(el('div', { 'class': 'zdc-actions' }, [link]));
    li.appendChild(guide);
    return { li: li, badge: badge, link: link, status: status, sizeRow: sizeRow, sizeDd: sizeDd, available: true, guide: guide, label: label };
  }

  // Windows: announced only. No link, no data-artifact => never tracked as a download.
  function buildWindowsCard(inst) {
    var t = inst.t;
    var btn = el('button', { 'class': 'zdc-btn zdc-btn--soon', type: 'button', disabled: true, 'aria-disabled': 'true', text: t.winBtn });
    return el('li', { 'class': 'zdc-card is-quiet zdc-card--soon' }, [
      el('div', { 'class': 'zdc-card-top' }, [el('h3', { 'class': 'zdc-card-title', text: t.winLabel })]),
      el('dl', { 'class': 'zdc-meta' }, [el('div', { 'class': 'zdc-meta-row' }, [el('dt', { text: t.metaStatus }), el('dd', { text: t.winStatus })])]),
      el('div', { 'class': 'zdc-actions' }, [btn])
    ]);
  }

  function codeBlock(inst, cmd) {
    var t = inst.t;
    var code = el('code', { text: cmd });
    var btn = el('button', { 'class': 'zdc-copy', type: 'button', text: t.copy });
    btn.addEventListener('click', function () {
      function done() { btn.textContent = t.copied; setTimeout(function () { btn.textContent = t.copy; }, 1600); }
      try {
        if (global.navigator.clipboard && global.navigator.clipboard.writeText) { global.navigator.clipboard.writeText(cmd).then(done, function () {}); return; }
      } catch (e) {}
      try {                                   // legacy fallback
        var ta = el('textarea', { readonly: true, 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;opacity:0' });
        ta.value = cmd; doc.body.appendChild(ta); ta.select(); doc.execCommand('copy'); doc.body.removeChild(ta); done();
      } catch (e2) {}
    });
    return el('div', { 'class': 'zdc-code', dir: 'ltr' }, [code, btn]);
  }

  function buildPrivacy(inst, uid) {
    var t = inst.t;
    var cb = el('input', { type: 'checkbox', id: uid + '-consent', 'class': 'zdc-check' });
    cb.checked = getConsent();
    cb.addEventListener('change', function () { setConsent(cb.checked); });
    var statusEl = el('span', { 'class': 'zdc-del-status', role: 'status' });
    var delBtn = el('button', { 'class': 'zdc-link', type: 'button', hidden: true, text: t.del });
    delBtn.addEventListener('click', function () {
      deleteMyRecords().then(function () { statusEl.textContent = t.delDone; }, function () { statusEl.textContent = t.delFail; });
    });
    inst.delBtn = delBtn;
    var actions = el('p', { 'class': 'zdc-priv-actions', hidden: true }, [delBtn, statusEl]);
    currentUserId().then(function (id) { if (id) { delBtn.hidden = false; actions.hidden = false; } });
    return el('section', { 'class': 'zdc-privacy', 'aria-labelledby': uid + '-priv' }, [
      el('h3', { 'class': 'zdc-priv-title', id: uid + '-priv', text: t.privTitle }),
      el('label', { 'class': 'zdc-consent', 'for': uid + '-consent' }, [cb, el('span', { text: t.consent })]),
      el('p', { 'class': 'zdc-priv-note', text: t.privNote }),
      actions
    ]);
  }

  function currentUserId() {
    var sb = getClient();
    if (!sb || !sb.auth || typeof sb.auth.getSession !== 'function') return Promise.resolve(null);
    return Promise.resolve(sb.auth.getSession()).then(function (r) {
      return r && r.data && r.data.session && r.data.session.user ? r.data.session.user.id : null;
    }).catch(function () { return null; });
  }
  function deleteMyRecords() {
    var sb = getClient();
    return currentUserId().then(function (uid) {
      if (!sb || !uid) throw new Error('not signed in');
      return sb.from('app_download_events').delete().eq('user_id', uid);   // RLS: own rows only
    }).then(function (r) { if (r && r.error) throw r.error; return true; });
  }

  /* Apply platform-dependent state: order, badges, hint, notices */
  function applyPlatform(inst) {
    var t = inst.t, p = inst.platform, rec = inst.recommended;
    var order = rec.concat(ARTIFACT_IDS.filter(function (i) { return rec.indexOf(i) === -1; }));
    order.forEach(function (id) { inst.grid.appendChild(inst.cards[id].li); });
    inst.grid.appendChild(inst.winCard);
    ARTIFACT_IDS.forEach(function (id) {
      var c = inst.cards[id], isRec = rec.indexOf(id) !== -1;
      c.li.classList.toggle('is-recommended', isRec);
      c.li.classList.toggle('is-quiet', !isRec);
      c.badge.hidden = !isRec;
    });
    inst.grid.classList.toggle('zdc-grid--solo', rec.length === 1);

    var native = (p.category === 'linux' || p.category === 'android');
    var os = osName(inst);
    if (p.category === 'unknown') inst.hintEl.textContent = t.hintUnknown;
    else if (p.category === 'linux' && (p.arch === 'arm' || p.arch === 'x86')) inst.hintEl.textContent = t.hintKnown(os) + ' ' + t.archWarn;
    else inst.hintEl.textContent = t.hintKnown(os);

    if (native) inst.noticeEl.hidden = true;
    else {
      inst.noticeText.textContent = p.category === 'unknown' ? t.hintUnknown : (p.category === 'windows' ? t.winNote : t.unsupported(os));
      inst.noticeEl.hidden = false;
      if (p.category === 'unknown') inst.hintEl.textContent = '';
    }
  }

  function updateFromRelease(inst) {
    if (!release.ok || !release.assets) return;          // unverified => change nothing, claim nothing
    ARTIFACT_IDS.forEach(function (id) {
      var a = ARTIFACTS[id], c = inst.cards[id], found = release.assets[a.file];
      if (found) {
        c.available = true;
        c.link.href = found.url;
        c.status.hidden = true;
        var s = humanSize(found.size);
        if (s) { c.sizeDd.textContent = s; c.sizeRow.hidden = false; }
        c.li.classList.remove('is-unavailable');
      } else {
        c.available = false;
        c.link.href = CFG.releasePage;
        c.link.removeAttribute('download');
        c.link.firstChild.textContent = inst.t.viewRelease;
        c.status.textContent = inst.t.unavailable;
        c.status.hidden = false;
        c.li.classList.add('is-unavailable');
      }
    });
  }

  /* Visibility => download_center_view (once per instance / dialog opening) */
  function onVisible(inst) {
    if (inst.viewed) return;
    inst.viewed = true;
    track('download_center_view', inst, null);
    verifyRelease().then(function () { updateFromRelease(inst); });
  }
  function watchVisible(inst, node) {
    if (!('IntersectionObserver' in global)) { onVisible(inst); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); onVisible(inst); } });
    }, { threshold: 0.3 });
    io.observe(node);
  }

  /* Delegated interaction tracking */
  function wireDelegates(inst) {
    var root = inst.root;
    function artifactOf(target) {
      var n = target && target.closest ? target.closest('[data-artifact]') : null;
      return n ? n.getAttribute('data-artifact') : null;
    }
    // first interaction with an option card => option selected (once per artifact)
    root.addEventListener('click', function (e) {
      var id = artifactOf(e.target);
      if (!id || !inst.cards[id]) return;
      if (!inst.once['sel:' + id]) {
        inst.once['sel:' + id] = true;
        track('download_option_selected', inst, id, { manual: inst.recommended.indexOf(id) === -1 });
      }
      var linkHit = e.target.closest && e.target.closest('a.zdc-btn');
      if (linkHit) {
        var now = Date.now();
        if (inst.clickAt[id] && now - inst.clickAt[id] < 1500) return;   // double-click debounce
        inst.clickAt[id] = now;
        if (inst.cards[id].available) track('download_started', inst, id);
        else track('download_failed', inst, id, { reason: 'asset_unavailable' });
      }
    });
    // install guide opened (toggle does not bubble => capture)
    root.addEventListener('toggle', function (e) {
      var d = e.target;
      if (d && d.classList && d.classList.contains('zdc-guide') && d.open) {
        var id = d.getAttribute('data-artifact');
        if (!inst.once['guide:' + id]) { inst.once['guide:' + id] = true; track('install_guide_opened', inst, id); }
      }
    }, true);
  }

  /* ------------------------------------------------------------------ *
   * Mounting + modal dialog
   * ------------------------------------------------------------------ */
  function mount(node, opts) {
    if (!node || node.__zdc) return node && node.__zdc;
    var o = opts || {};
    if (o.page === undefined) o.page = node.getAttribute('data-zdc-page');
    if (o.compact === undefined) o.compact = node.hasAttribute('data-zdc-compact');
    node.__zdc = createInstance(node, o);
    return node.__zdc;
  }
  function mountAll() {
    var nodes = doc.querySelectorAll('[data-zunexa-download]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  var dlg = null;
  function openDialog(opts) {
    opts = opts || {};
    if (!dlg) {
      var lang = pickLang(opts.lang), t = I18N[lang];
      var holder = el('div', { 'class': 'zdc-dialog-body' });
      var closeBtn = el('button', { 'class': 'zdc-close', type: 'button', 'aria-label': t.close }, [el('span', { 'aria-hidden': 'true', text: '\u00d7' })]);
      var d = el('dialog', { 'class': 'zdc-dialog' }, [el('div', { 'class': 'zdc-dialog-inner' }, [closeBtn, holder])]);
      doc.body.appendChild(d);
      var inst = createInstance(holder, { page: opts.page, lang: opts.lang, webAppUrl: opts.webAppUrl, compact: false });
      d.setAttribute('aria-labelledby', inst.titleId);
      closeBtn.addEventListener('click', function () { closeDialog(); });
      d.addEventListener('click', function (e) { if (e.target === d) closeDialog(); });   // backdrop
      d.addEventListener('close', function () { doc.documentElement.classList.remove('zdc-lock'); });
      dlg = { el: d, inst: inst };
    }
    dlg.inst.viewed = false;                   // one view per opening
    try { if (typeof dlg.el.showModal === 'function') { if (!dlg.el.open) dlg.el.showModal(); } else dlg.el.setAttribute('open', ''); }
    catch (e) { dlg.el.setAttribute('open', ''); }
    doc.documentElement.classList.add('zdc-lock');
    onVisible(dlg.inst);
  }
  function closeDialog() {
    if (!dlg) return;
    try { if (typeof dlg.el.close === 'function') dlg.el.close(); else dlg.el.removeAttribute('open'); } catch (e) { dlg.el.removeAttribute('open'); }
    doc.documentElement.classList.remove('zdc-lock');
  }

  global.ZunexaDownloadCenter = {
    version: '1.0.0',
    mount: mount, mountAll: mountAll, openDialog: openDialog, closeDialog: closeDialog,
    detectPlatform: detectPlatform, getConsent: getConsent, setConsent: setConsent,
    deleteMyRecords: deleteMyRecords,
    /* Owner dashboards: call after the page has an authenticated client.
       Server-side RLS/admin check decides what comes back. */
    admin: {
      summary: function () {
        var sb = getClient(); if (!sb) return Promise.reject(new Error('no client'));
        return Promise.all([
          sb.from('app_download_totals').select('*').maybeSingle(),
          sb.from('app_download_by_artifact').select('*'),
          sb.from('app_download_by_platform').select('*'),
          sb.from('app_download_by_version').select('*'),
          sb.from('app_download_daily').select('*').order('day', { ascending: false }).limit(30)
        ]);
      },
      recent: function (limit) {
        var sb = getClient(); if (!sb) return Promise.reject(new Error('no client'));
        return sb.rpc('admin_recent_download_events', { p_limit: limit || 50 });
      }
    }
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})(typeof window !== 'undefined' ? window : this);
