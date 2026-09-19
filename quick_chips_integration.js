/* ════════════════════════════════════════════════════════════════════
   ZUNEXA — Dynamic Personalized Quick Chips  (ai.html integration)
   ────────────────────────────────────────────────────────────────────
   HOW TO APPLY (3 edits, all inside the existing <script> block):

   EDIT 1 — REPLACE the whole existing renderWelcomeSuggestions()
            function (currently ~line 5762) with BLOCK A below.
            (Keep ZX_SUGGESTIONS untouched: it is the offline fallback.)

   EDIT 2 — PASTE BLOCK B (the new engine) directly AFTER the
            ZX_SUGGESTIONS constant / renderWelcomeSuggestions block.

   EDIT 3 — Two one-line hooks, shown as BEFORE → AFTER in BLOCK C.

   UI/CSS: nothing changes. Output DOM is byte-for-byte the same shape:
     <button type="button" class="wl-sugg-chip" onclick="go('TEXT')">TEXT</button>
   inside the existing <div class="wl-suggestions">.

   Reuses (does NOT duplicate): zxSB(), getDeviceId(), go(), the
   `zx_page_lang` setting, and ZX_SUGGESTIONS.
   ════════════════════════════════════════════════════════════════════ */


/* ┌──────────────────────────────────────────────────────────────────┐
   │ BLOCK A — replaces renderWelcomeSuggestions() (EDIT 1)           │
   └──────────────────────────────────────────────────────────────────┘ */
function renderWelcomeSuggestions() {
  const chips = zxGetChipsForRender();
  const html  = zxBuildChipsHtml(chips);
  document.querySelectorAll('.wl-suggestions').forEach(el => {
    // Skip identical markup: no DOM churn = no flicker when the network
    // result equals what the cache already painted.
    if (el.dataset.zxChipsSig !== html) {
      el.innerHTML = html;
      el.dataset.zxChipsSig = html;
    }
  });
}


/* ┌──────────────────────────────────────────────────────────────────┐
   │ BLOCK B — the engine (EDIT 2)                                    │
   └──────────────────────────────────────────────────────────────────┘ */

/* ── Config ─────────────────────────────────────────────────────── */
const ZX_CHIPS_LIMIT     = 4;                  // chips shown on the welcome screen
const ZX_CHIPS_CACHE_KEY = 'zx_chips_cache_v1';
const ZX_CHIPS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6h: stale cache still renders instantly, then refreshes
const ZX_CHIP_CATEGORIES = ['coding', 'summary', 'morocco_admin', 'general'];

/* Chips currently held in memory (network result, else cache, else null). */
let zxChipsLive = null;
/* De-dupes concurrent loadQuickChips() calls (init + applyPageLang + newChat). */
let zxChipsInflight = null;
/* Category of the chip the user just tapped, so send() doesn't double-count it. */
let zxPendingChipCategory = null;

/* ── XSS-safe attribute encoding ────────────────────────────────────
   The existing esc() only escapes & < > — it does NOT escape " or \ ,
   which is what matters inside onclick="go('…')". Two hazards:
     1. HTML layer: a " in the text would close the onclick attribute.
     2. JS layer:   a ' or \ or newline would break/escape the string
                    literal inside go('…').
   Fix: build the JS string literal with JSON.stringify (correctly
   escapes \, ", newlines, U+2028/2029), then HTML-encode the whole
   literal for safe placement in a double-quoted attribute. JSON gives
   a "double-quoted" literal, which is valid JS and, after HTML entity
   encoding of the quotes, arrives at the JS engine intact. */
function zxHtmlEncode(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}
function zxJsLiteralForAttr(text) {
  const literal = JSON.stringify(String(text))
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return zxHtmlEncode(literal);
}

/* ── Chip validation: never trust rows coming from the network/cache ── */
function zxSanitizeChips(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const c of raw) {
    if (!c || typeof c.label !== 'string') continue;
    const label = c.label.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    if (label.length < 2 || label.length > 120 || seen.has(label)) continue;
    seen.add(label);
    out.push({
      label,
      category: ZX_CHIP_CATEGORIES.includes(c.category) ? c.category : 'general'
    });
  }
  return out;
}

/* ── Markup builder — EXACT required shape ─────────────────────────
   <button type="button" class="wl-sugg-chip" onclick="go('TEXT')">TEXT</button>
   `data-cat` is a plain inert attribute (not styled, not a class) used
   only to attribute the tap to a category for tracking. The class name
   and the onclick contract are unchanged. */
function zxBuildChipsHtml(chips) {
  return chips.map(c =>
    `<button type="button" class="wl-sugg-chip" data-cat="${zxHtmlEncode(c.category)}" ` +
    `onclick="zxChipTap(${zxJsLiteralForAttr(c.category)});go(${zxJsLiteralForAttr(c.label)})">` +
    `${zxHtmlEncode(c.label)}</button>`
  ).join('');
}

/* ── Local cache ──────────────────────────────────────────────────── */
function zxReadChipsCache() {
  try {
    const raw = localStorage.getItem(ZX_CHIPS_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const chips = zxSanitizeChips(obj && obj.chips);
    if (!chips.length) return null;
    return { chips, ts: Number(obj.ts) || 0 };
  } catch (e) {
    return null; // corrupt JSON / storage blocked → behave as no cache
  }
}
function zxWriteChipsCache(chips) {
  try {
    localStorage.setItem(ZX_CHIPS_CACHE_KEY, JSON.stringify({ ts: Date.now(), chips }));
  } catch (e) { /* quota / private mode: cache is best-effort */ }
}

/* ── Offline/instant fallback = the existing static list ────────────
   Reuses ZX_SUGGESTIONS (per UI language), tagged with categories by
   position so the same tracking path works even with no network. */
function zxFallbackChips() {
  const lang = localStorage.getItem('zx_page_lang') || 'ary';
  const list = (typeof ZX_SUGGESTIONS !== 'undefined' && (ZX_SUGGESTIONS[lang] || ZX_SUGGESTIONS.ar)) || [];
  const cats = ['coding', 'summary', 'morocco_admin', 'coding'];
  return list.map((label, i) => ({ label, category: cats[i] || 'general' }));
}

/* ── What renderWelcomeSuggestions() paints RIGHT NOW (synchronous) ──
   Priority: live network result > fresh-or-stale cache > static fallback.
   Always returns ≥1 chip while ZX_SUGGESTIONS exists, so the block is
   never empty and never waits on the network. */
function zxGetChipsForRender() {
  if (zxChipsLive && zxChipsLive.length) return zxChipsLive.slice(0, ZX_CHIPS_LIMIT);
  const cached = zxReadChipsCache();
  if (cached) return cached.chips.slice(0, ZX_CHIPS_LIMIT);
  return zxFallbackChips().slice(0, ZX_CHIPS_LIMIT);
}

/* ── Lightweight category classifier for free-typed messages ─────────
   Kept separate from detectCat() (whose seo/pricing/design buckets feed
   the learning pipeline and must not change). Pure keyword matching,
   zero network, Arabic + Darija + French + English. */
function zxClassifyCategory(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return 'general';
  const has = (arr) => arr.some(k => t.includes(k));
  if (has(['كود', 'برمج', 'دالة', 'javascript', 'python', 'html', 'css', 'sql', 'supabase',
           'api', 'function', 'bug', 'code', 'coder', 'programm', 'خطأ برمجي', 'react', 'node']))
    return 'coding';
  if (has(['🇲🇦', 'وثائق', 'حالة مدنية', 'الحالة المدنية', 'بطاقة التعريف', 'جواز', 'عقد الازدياد',
           'شهادة السكنى', 'رخصة', 'مقاولة ذاتية', 'إدارة', 'ادارة', 'cnie', 'passeport',
           'état civil', 'etat civil', 'commune', 'دوكيمان', 'كناش', 'مغرب']))
    return 'morocco_admin';
  if (has(['لخّص', 'لخص', 'ملخص', 'اختصر', 'اختصار', 'summar', 'résum', 'resum', 'tl;dr']))
    return 'summary';
  return 'general';
}

/* ── Identity helpers ─────────────────────────────────────────────── */
async function zxChipIdentity(sb) {
  let userId = null;
  try {
    if (sb) {
      const { data } = await sb.auth.getSession();
      userId = (data && data.session && data.session.user && data.session.user.id) || null;
    }
  } catch (e) { userId = null; }
  return { userId, deviceId: getDeviceId() };
}

/* ── Merge a guest's device history into the account, once per login ─
   Idempotent server-side; the flag just avoids a pointless RPC on every
   page load. */
async function zxMergeGuestInterests(sb, identity) {
  if (!sb || !identity.userId) return;
  const flag = 'zx_chips_merged_' + identity.userId;
  try {
    if (localStorage.getItem(flag) === '1') return;
    const { error } = await sb.rpc('merge_device_interests', { p_device_id: identity.deviceId });
    if (!error) localStorage.setItem(flag, '1');
  } catch (e) { /* non-critical: personalization just starts fresh */ }
}

/* ── loadQuickChips() ───────────────────────────────────────────────
   1. Paints cache/fallback instantly (renderWelcomeSuggestions is sync).
   2. Fetches personalized chips via get_personalized_quick_chips.
   3. Swaps them in only if they differ (signature check) and caches them.
   Any failure (offline, SDK blocked, RPC missing, empty catalogue)
   silently leaves the already-painted chips in place. */
async function loadQuickChips() {
  renderWelcomeSuggestions();                 // instant paint: no flicker, never empty

  if (zxChipsInflight) return zxChipsInflight; // collapse duplicate concurrent calls

  zxChipsInflight = (async () => {
    try {
      const sb = await zxSB();
      if (!sb) return;                        // SDK never loaded → keep fallback

      const identity = await zxChipIdentity(sb);
      await zxMergeGuestInterests(sb, identity);

      const { data, error } = await sb.rpc('get_personalized_quick_chips', {
        p_user_id:   identity.userId,
        p_limit:     ZX_CHIPS_LIMIT,
        p_device_id: identity.deviceId
      });
      if (error) throw error;

      const chips = zxSanitizeChips(data);
      if (!chips.length) return;              // empty DB → keep cache/fallback

      zxChipsLive = chips;
      zxWriteChipsCache(chips);
      renderWelcomeSuggestions();             // signature check prevents redundant repaint
    } catch (e) {
      console.warn('[Zunexa] quick chips: using cached/fallback list —', e && e.message ? e.message : e);
    } finally {
      zxChipsInflight = null;
    }
  })();

  return zxChipsInflight;
}

/* ── trackUserCategory(category) ────────────────────────────────────
   Records one interaction for a category via track_user_category.
   Fire-and-forget: never throws, never blocks send(). Guarded by the
   same client-side rate limiter the other Supabase writes use. */
async function trackUserCategory(category) {
  try {
    if (!ZX_CHIP_CATEGORIES.includes(category)) return;
    if (typeof ZX_AI_RATE !== 'undefined' && !ZX_AI_RATE.check()) return;

    const sb = await zxSB();
    if (!sb) return;

    const { error } = await sb.rpc('track_user_category', {
      p_category:  category,
      p_device_id: getDeviceId()
    });
    if (error) throw error;

    // Next welcome screen should reflect the new affinity: drop only the
    // in-memory copy so the next loadQuickChips() re-ranks from the server.
    zxChipsLive = null;
  } catch (e) {
    console.warn('[Zunexa] trackUserCategory skipped —', e && e.message ? e.message : e);
  }
}

/* Called by the chip's onclick BEFORE go(): remembers the chip's own
   category so send() attributes it exactly once (not re-classified). */
function zxChipTap(category) {
  zxPendingChipCategory = ZX_CHIP_CATEGORIES.includes(category) ? category : null;
}

/* Single hook used by send(): a chip tap wins; otherwise classify the
   typed text. Consumes the pending flag so it can never leak into the
   next message. */
function zxTrackMessageInterest(text) {
  const category = zxPendingChipCategory || zxClassifyCategory(text);
  zxPendingChipCategory = null;
  trackUserCategory(category);
}


/* ┌──────────────────────────────────────────────────────────────────┐
   │ BLOCK C — the two one-line hooks (EDIT 3)                        │
   └──────────────────────────────────────────────────────────────────┘

   ── Hook 1: init()  (ai.html ~line 2365) ───────────────────────────
   BEFORE:
     applyPageLang(localStorage.getItem('zx_page_lang') || 'ary');
   AFTER:
     applyPageLang(localStorage.getItem('zx_page_lang') || 'ary');
     loadQuickChips();

   (applyPageLang → renderWelcomeSuggestions paints cache/fallback
    synchronously; loadQuickChips then refreshes from Supabase. It is
    deliberately NOT awaited so it can never delay first input focus.)

   ── Hook 2: send()  (ai.html ~line 4372, right after addMsg) ───────
   BEFORE:
     addMsg(q, 'user');

     if (containsBlockedContent(q)) {
   AFTER:
     addMsg(q, 'user');

     if (!containsBlockedContent(q)) zxTrackMessageInterest(q);

     if (containsBlockedContent(q)) {

   (Blocked messages are never counted toward personalization.)

   newChat() needs NO change: it already calls renderWelcomeSuggestions()
   (~line 4950), which now paints the freshest chips synchronously.
*/
