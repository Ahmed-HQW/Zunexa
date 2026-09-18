/* ── Geo detection (IP-based, best-effort, non-blocking) ──────────
   Detects visitor country/currency once per day and caches it in
   localStorage under 'zx_geo'. Runs async — never blocks paint or
   the instant-session-redirect script in index.html's <head>. Any
   page (index.html or ai.html) can read window.ZX_GEO once it's
   set, or listen for the 'zx:geo-ready' event if it fires after
   they check. Failure (offline, ad-blocker, API down) just leaves
   ZX_GEO null — every caller must treat that as "no geo info",
   not an error.

   Loaded with <script defer> — safe because nothing here depends
   on the DOM, and nothing else depends on it running before
   DOMContentLoaded.
────────────────────────────────────────────────────────────────── */
(function(){
  var CACHE_KEY = 'zx_geo';
  var CACHE_MS = 24 * 60 * 60 * 1000; // 24h — country rarely changes mid-session
  window.ZX_GEO = null;

  function setGeo(geo){
    window.ZX_GEO = geo;
    try { document.dispatchEvent(new CustomEvent('zx:geo-ready', { detail: geo })); } catch(e){}
  }

  try {
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && cached.ts && (Date.now() - cached.ts < CACHE_MS)) {
      setGeo(cached.data);
      return;
    }
  } catch(e) { /* corrupted cache — fall through to a fresh fetch */ }

  // ipapi.co free tier: no key needed, ~30k req/month/IP is plenty
  // for a client-side per-visitor lookup. Swallow all errors — geo
  // is a progressive enhancement, never a requirement to use the app.
  fetch('https://ipapi.co/json/')
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      if (!j || j.error) return;
      var geo = {
        country: j.country_name || null,
        countryCode: j.country_code || null,
        city: j.city || null,
        currency: j.currency || null,
        languages: j.languages || null
      };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: geo })); } catch(e){}
      setGeo(geo);
    })
    .catch(function(){ /* offline / blocked — silently no-op */ });
})();
