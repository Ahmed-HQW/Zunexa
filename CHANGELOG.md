# Changelog — Zunexa (ai.html / agent.html / index.html / settings.html)

All notable changes to the Zunexa front-end are documented in this file, merged from
`CHANGELOG.md` and `changelog-ai-html.md`. Sorted newest first.

## [Unreleased] — 2026-09-17 (Pass D — UX/retention)

### ✨ Added
- **Suggestion chips on the empty welcome screen** — HTML markup at `#welcomeEmpty` (~line 1467) and `newChat()` (~line 4886); new CSS `.wl-suggestions`/`.wl-sugg-chip` (~line 608, next to the existing `.welcome` rules); new `ZX_SUGGESTIONS` i18n table + `renderWelcomeSuggestions()` (~line 5682, next to `ZX_PLACEHOLDERS`); wired into `applyPageLang()` (~line 5762) and `newChat()`.
  Problem: a brand-new visitor's very first screen was the logo, a greeting, and an empty input box — no cue at all for what Zunexa actually does. For a solo founder with zero marketing budget, that empty first screen is a real, avoidable drop-off point: users who don't already know what to ask are the ones most likely to bounce immediately.
  Fix: added four short, tappable suggestion chips under the greeting — one for general Q&A ("كيفاش نبدا نتعلّم البرمجة؟"), one for summarization, one that surfaces the 🇲🇦 Morocco-official-sources mode specifically (a differentiator worth surfacing early), and one for code explanation. Tapping a chip fills the input and sends immediately via the existing `go(text)` helper — the same mechanism history items already use, so no new send path was introduced. Chips are styled with the existing design tokens (`--card`, `--b1`, `--gold3`, `--tr`) rather than new hardcoded colors, sit inside the existing `.welcome{animation:fadeUp}` block so they fade in with it, and automatically respect `zx-reduce-motion` (covered by the file's existing blanket `.zx-reduce-motion *{transition-duration:.001s!important}` rule — no new exception needed) and RTL (the chips wrap in a plain `flex-wrap` row inside the document's own `dir="rtl"`, no directional CSS required). Text is provided for `ary`/`ar`/`fr`/`en`, falling back to `ar` for any other UI language — matching the exact fallback pattern already used by `ZX_PLACEHOLDERS`.
  Verify: open the app with no chat history (or click "محادثة جديدة") — four chips should appear under the greeting; tapping one should immediately send that message. Switch UI language in Settings and reopen a new chat — chip text should update to match (falling back to Arabic for languages without their own entry).

### 🧭 Assumptions
- Picked 4 chips covering the product's most distinct capabilities (general chat, summarization, the Morocco-official mode, code) rather than more generic ones, since a solo founder's highest-leverage first-run move is showing users something Zunexa can do that a generic chatbot can't — assumption logged here since no one was available to confirm the exact four prompts.
- Only added translations for the 4 UI languages I judged most likely to cover the current user base (`ary`, `ar`, `fr`, `en`) rather than all 12 languages in `ZX_I18N` — the `ar` fallback means no language shows blank/broken chips, but the other 8 (`es`,`de`,`it`,`pt`,`ru`,`zh`,`tr`,`hi`) will show Arabic-fallback chips instead of chips in their own language until translated. Flagged as a follow-up rather than guessing translations I can't verify are natural-sounding in those languages.
- Did not add a "regenerate suggestions" or dynamic/contextual suggestion logic (e.g. based on `hist`) — kept it to a fixed, curated set for this pass, since dynamic suggestions would need their own design/testing pass.

### ⏭️ Deferred
- Translated suggestion chips for the remaining 8 `ZX_I18N` languages.
- The rest of Pass D's checklist from the mission brief: haptic/visual completion feedback beyond what already exists, a Zalij-motif progress indicator, a share/viral affordance, and progressive disclosure of the model selector — none of these were attempted in this pass; this pass focused specifically on the empty-state drop-off point as the single highest-leverage UX gap found.
- Pass E (hygiene — consistent `zx` naming audit, dead code removal, full JSDoc coverage, consistent Darija error toasts) — still entirely unattempted.

### 🔍 Loop Report
- Passes run so far: Pass A (XSS/URL sinks, complete for that sub-scope), Pass B (Supabase-init race, complete for that sub-scope), Pass C (render-blocking library loads, complete for that sub-scope), Pass D (empty-state suggestion chips only — complete for that specific sub-scope, not the rest of Pass D's checklist).
- Findings this session: 1 UX addition (4 new chips, i18n table, 1 new render function, ~15 lines of new CSS), 0 regressions found in re-reading the diff.
- Final cycle findings: not applicable — full A→F cycle across the entire file still not run; each pass so far has covered one specific, verified sub-scope rather than its full checklist.

## [Unreleased] — 2026-09-17 (Pass C — performance)

### ⚡ Performance
- **Lazy-loaded pdf.js, jszip, highlight.js, jsQR, mammoth and xlsx instead of blocking first paint** — `<head>` (was lines 47/48/59/61/62/63), plus `zxEnsureLib()`/`zxLoadScript()` added near `zxWaitForGlobal()` (~line 1916), and their six call sites: `highlightCodeIn()` (~4534), `onFilePicked()`'s PDF/.docx/.xlsx/.zip branches (~5893–5941), `scanAttachedImageForQR()` (~6018).
  Problem: all six libraries were hardcoded `<script src="https://cdnjs...">` tags in `<head>`, parsed and executed before first paint, even though every one of them is only needed on-demand (a code block appearing in a bot reply, a file attach, or a QR scan) — a chat with no attachment and no code block, which is common, paid the full combined download+parse+execute cost of all six libraries for zero benefit.
  Impact: on the Snapdragon 4xx-class Android devices and weak 3G/4G connections this app explicitly targets, this meant a slower time-to-first-paint and time-to-interactive on every single visit, regardless of whether the visitor ever touched a file-attach or code-highlighting feature.
  Fix: removed all six `<script src=...>` tags from `<head>`. Added `zxLoadScript(src)` (injects a `<script>` tag on demand, de-duplicates concurrent calls to the same URL) and `zxEnsureLib(globalName, src)` (returns the already-loaded global if present, else loads it and throws a clear Arabic error if the CDN fetch fails) near the existing `zxWaitForGlobal()` helper. Each library is now fetched only the first time its feature is actually used: `highlightCodeIn()` only fetches `hljs` when the message actually contains a `<pre><code>` block; `onFilePicked()` fetches `pdfjsLib`/`mammoth`/`XLSX`/`JSZip` only for the matching file type; `scanAttachedImageForQR()` fetches `jsQR` only when an image is attached. Also added `<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>` in `<head>` so that when one of these does load, the DNS+TLS handshake is already warm.
  Before/after (estimate — exact figures depend on CDN response at deploy time, not measured against a live network in this pass): combined size of the six libraries is roughly 1–1.5MB of unminified-equivalent JS parse/execute work removed from the critical rendering path on every visit; a typical chat session with no file attach and no code block now loads and executes **zero** of these six scripts at all, versus all six unconditionally before.
  Verify: open DevTools → Network tab, hard-reload `ai.html` — you should no longer see `pdf.min.js`, `jszip.min.js`, `highlight.min.js`, `jsQR.min.js`, `mammoth.browser.min.js`, or `xlsx.full.min.js` in the initial page-load waterfall. Then attach a `.pdf` — `pdf.min.js` (and `pdf.worker.min.js`) should now appear in the Network tab at that moment, not before. Same check for `.docx`→mammoth, `.xlsx`→xlsx, `.zip`→jszip, an image attach→jsQR, and a bot reply containing a code block→highlight.js.

### 🧭 Assumptions
- Kept `pdf.worker.min.js` as a separate, still-lazy fetch triggered by `pdfjsLib.GlobalWorkerOptions.workerSrc` — that's pdf.js's own internal lazy-load of its worker thread and was already effectively on-demand before this change; not modified further.
- Did not attempt to self-host any of these six libraries or move them to a bundler/build step — the mission brief is explicit that this project has no build pipeline, and self-hosting would need its own versioning/update process this pass didn't have room to design.
- `highlightCodeIn()` and `scanAttachedImageForQR()` were already called fire-and-forget (no `await`) at both call sites before this change, so converting them to `async` functions that internally `await zxEnsureLib(...)` required no change at their call sites — verified by re-checking both callers.
- Did not add a loading/spinner indicator while a lazy library fetches on a slow connection (e.g. while `pdf.min.js` downloads after a PDF attach) — the existing `toast('⏳ جاري قراءة الملف...')` already shown at the top of `onFilePicked()` covers this from the user's perspective (the toast appears immediately; the extra library-load latency now happens invisibly inside that same "reading the file" period rather than during the initial page load), so no separate UI change was made.

### ⏭️ Deferred
- No before/after Lighthouse or WebPageTest measurement was run against the live deployed site in this pass — the estimate above is based on the libraries' known approximate published sizes, not a live network trace. A real measurement should be taken after deploy.
- The rest of Pass C's checklist: render-blocking CSS, DOM batching/reflow-in-a-loop audit across the ~150 functions, debounce/throttle review beyond what already exists (`fitButtonRows()` resize debounce was already in place from an earlier pass), and the service-worker cache-versioning / `skipWaiting`/`clients.claim` requirement from the mission brief — `service-worker.js` itself was not opened or audited in this pass (it's a sibling file, not part of `ai.html`).
- Pass D (UX/retention) and Pass E (hygiene) — still entirely unattempted.

### 🔍 Loop Report
- Passes run so far: Pass A (XSS/URL sinks, complete for that sub-scope), Pass B (Supabase-init race, complete for that specific sub-scope), Pass C (render-blocking library loads, complete for that specific sub-scope — service-worker caching not yet covered).
- Findings this session: 1 performance fix spanning 6 libraries, 8 call sites, 2 new helper functions, 1 new preconnect hint.
- Final cycle findings: not applicable — full A→F cycle across the entire file still not run.

## [Unreleased] — 2026-09-17 (Pass B — correctness)

### 🐛 Fixed
- **[HIGH] Supabase CDN-load race could silently log out real users** — top-level auth-check IIFE @ ~line 1971 (was ~1946), `openSettings()` @ ~line 7870, `zxMoroccoSearch()` @ ~line 3697.
  Problem: a prior fix (comment still in the file, dated earlier) introduced `zxWaitForGlobal()` to poll for the Supabase SDK attaching from its CDN `<script>` tag, and claimed that using `_SB?.` (optional chaining) at every call site was sufficient protection against the SDK not being ready yet. That claim was incomplete: `_SB?.auth.getSession()` does avoid throwing on the property access, but the expression still evaluates to `await undefined` when `_SB` is null — and every call site that destructures the result, e.g. `const { data: { session } } = await _SB?.auth.getSession()`, throws a `TypeError` on that `undefined` regardless of the `?.`. The top-level auth-check IIFE wraps this in try/catch, so on any connection slow enough that the CDN script hadn't attached yet by the time this *synchronous, no-`await`-before-it* IIFE ran, the catch block fired and redirected an already-logged-in user straight back to `index.html` — a silent, network-timing-dependent logout with no error shown to the user. `openSettings()` had no try/catch at all around the equivalent bare `_SB.auth.getSession()`, so under the same race it just threw and the settings modal silently failed to open.
  Impact: on the weak 3G/4G Android connections this app explicitly targets, genuine logged-in users could be intermittently bounced to the login screen, and the Settings modal could intermittently fail to open — both with zero visible error, exactly the "kolshi wa9ef bla khata dahra" class of bug this codebase's own comments describe elsewhere.
  Fix: added `zxSB()` — an async helper that returns the resolved client (or `null` after the same 8s timeout) instead of the raw possibly-null `_SB` variable — and switched the three call sites above to `await zxSB()` before touching `.auth`/`.rpc`, so nothing destructures an `undefined` auth result anymore. On a genuine SDK failure (CDN blocked/down within the timeout), the auth IIFE now logs a console error and leaves the user on the page in degraded mode instead of forcing a redirect loop; `openSettings()` and `zxMoroccoSearch()` degrade to guest-view / `{ hit: false }` respectively, same as before, but via an intentional check instead of a caught crash.
  Verify: in devtools, throttle network to "Slow 3G" (or block `cdn.jsdelivr.net` via the Network tab's request blocking) and reload while logged in — you should stay on `ai.html` (possibly with a brief delay) instead of being bounced to `index.html`; opening Settings under the same throttling should no longer silently fail.

### 🧭 Assumptions
- Did not touch the remaining ~35 call sites still using `_SB?.` directly (e.g. `sendMsg`, `redeemCode`, `uploadAvatar`, etc.) in this pass — each one either (a) already runs long after the top-level auth IIFE has resolved `_SB` in practice, since they're only reachable via user interaction after the page has loaded, or (b) is already wrapped in a function-level try/catch that degrades safely even if the destructure throws (confirmed for `zxMoroccoSearch`, `saveProfileSettings`; not yet individually re-verified for the rest). Flagged as a follow-up: the theoretically correct fix is to migrate every `_SB?.` read to `await zxSB()`, but doing that across 35+ sites in this pass risked exactly the kind of broad, hard-to-verify diff the "zero regressions" rule warns against. Prioritized the three sites with a demonstrated, concrete failure mode (silent logout, silent settings-modal failure) instead.
- Left `saveProfileSettings()`'s bare `_SB.` calls unchanged — confirmed its existing try/catch already degrades correctly (local-only save + user-facing toast) even if `_SB` is null, so migrating it to `zxSB()` would be a style improvement, not a bug fix.

### ⏭️ Deferred
- Systematic migration of the remaining `_SB?.`/`_SB.` call sites to `zxSB()` for defense-in-depth (see Assumptions above).
- The rest of Pass B's checklist: unhandled promise rejections outside the auth path, crash behavior on malformed/huge/null inputs across the rest of the ~150 functions in the file, lying comments elsewhere, other race conditions. Only the Supabase-init race was investigated this pass, since it was the one explicitly flagged as high-risk in the mission brief and turned out to be a real, unresolved bug.
- Pass C (performance), Pass D (UX), Pass E (hygiene) — still entirely unattempted.

### 🔍 Loop Report
- Passes run: Pass A (XSS/URL sinks, complete for that sub-scope) + Pass B (Supabase-init race, complete for that specific sub-scope only)
- Findings this session: 1 high-impact bug found and fixed (silent auth-race logout/settings failure), touching 3 call sites + 1 new helper function.
- Final cycle findings: not applicable — full A→F cycle still not run.

## [Unreleased] — 2026-09-17 (Pass A continued)

### 🔒 Security
- **[MEDIUM] Unsanitized `imgUrl`/`audioUrl` from AI backend responses** — `addMsg()` @ ~line 4288.
  Problem: `res.imgUrl`/`res.audioUrl` (returned by the `ai-gemini`/`ai-groq`/`ai-openrouter` Edge Functions) were assigned straight to `img.src`/`audio.src` with no scheme check — the same gap as the file-library fix above, but on the live bot-message render path instead of the library view.
  Impact: a compromised or misbehaving Edge Function / upstream AI provider response could supply a `javascript:` URL that executes when the browser attempts to load it as a media source (browsers generally block `javascript:` on `<img>`/`<audio>` `src` today, but this was unenforced app-side and shouldn't rely on browser behavior alone).
  Fix: both now go through the same `zxSafeUrl()` allowlist added in the previous entry. No `esc()` needed here since these are DOM property assignments (`img.src = ...`), not string-concatenated HTML, so there's no attribute-breakout vector — only the scheme was the risk.
  Verify: temporarily have a test reply set `res.imgUrl = 'javascript:alert(1)'` before calling `addMsg`; the rendered `<img>` should get `src="#"` instead.

### 🔍 Audit notes — remaining `innerHTML` sites, traced and cleared
Every other `innerHTML`/`src`/`href` site left over from the previous entry's deferred list was traced to its data source this pass. Findings:
- Lines 2071, 2452, 4520, 4545, 4555, 4768, 4901, 5021/5022, 5957 — static strings or unconditional clears (`= ''`), no interpolation. Safe.
- Line 3594 (`thinkStart`) — text comes from the static internal `THINK_LIB` object, not user/AI input. Safe.
- Lines 4339–4380 (`meta.innerHTML` badges/confidence bar in `addMsg`) — all values are either hardcoded Arabic strings keyed by a fixed `src` enum, or `pct`/`color` computed from a `Math.round()` of a numeric score. No free-text interpolation. Safe.
- Lines 4643/4655 (`renderHist`) — chat titles go through `esc()`. Safe.
- Lines 4906 (`renderTasksList`), 5034 (`showCalDay`) — task titles go through `escapeHtml()`; the only unescaped interpolation is `t.id` inside an inline `onclick="...('${t.id}')"`, but `t.id` is always either a locally-generated `'local_' + Date.now()` string or a Postgres-assigned id from `zx_tasks.id` returned by `.select()` — never free user text, so there's no realistic quote-breakout path today. Left as-is rather than churn the diff, but flagging: if `zx_tasks.id` is ever changed to a user-editable/text primary key, this becomes exploitable and should get the same `esc()` treatment as titles.
- Lines 5102–5117 (`renderPlans`) — built entirely from the hardcoded `PLANS_TEAM`/individual-plans arrays in source. Safe.
- Line 5860 (file-attach chip preview) — `attachedFile.dataUrl` is a same-device `FileReader.readAsDataURL()` output on a file the user just picked; it's a well-formed `data:` URI that can't contain an unescaped `"`, and the only party who could tamper with it is the user attacking their own browser session. Not a meaningful risk. Safe as-is.
- Line 5935 (`showQRResultChip`) — decoded QR text already goes through `esc()`. Safe.
- Line 7857 (`renderPersonaList`) — persona name/description already go through `esc()`. Safe.

### 🧭 Assumptions
- Treated "browser blocks `javascript:` on img/audio src today" as not a sufficient control on its own (browser behavior isn't a contract Zunexa's code can rely on), so fixed it explicitly rather than leaving it as a theoretical non-issue.
- Did not touch the `t.id` inline-onclick pattern in the task/calendar views since tracing confirmed it's not currently attacker-reachable — changing it now would be pure churn against the "zero regressions" rule for no present security benefit. Documented as a watch-item instead.

### ⏭️ Deferred (still not done — needs dedicated follow-up passes)
- Pass A is now complete for `innerHTML`/`src`/`href` sinks specifically, but **not** for the rest of Pass A's scope: auth-bypass paths, the client-side-only gates the checklist calls out, prompt-injection surfaces, and whether any secrets leak client-side. None of those were audited in this session.
- Pass B (correctness — crash paths on malformed input, the async Supabase SDK CDN load race, unhandled promise rejections), Pass C (performance — pdf.js/jszip lazy-loading, service-worker cache-version bump), Pass D (UX/retention), Pass E (hygiene/JSDoc coverage) — still entirely unattempted.

### 🔍 Loop Report
- Passes run: Pass A (XSS/URL-injection sinks only) — complete for this sub-scope across all `innerHTML`/`src`/`href` sites identified in the file.
- Functions audited (this sub-scope): ~15 rendering functions covering every `innerHTML`/`img.src`/`audio.src`/`href` write site in the file.
- Findings this session: 1 fixed (imgUrl/audioUrl), 0 additional vulnerable sites found among the rest — all traced and cleared with reasoning above.
- Pass A other sub-scopes (auth bypass, prompt injection, secret leakage) and Passes B–F: not run.
- Final cycle findings: still not applicable — a full A→F cycle has not been run, so "0 findings" cannot be claimed for the file as a whole, only for the XSS/URL-injection sub-scope of Pass A.

## [Unreleased] — 2026-09-17

### 🔒 Security
- **[MEDIUM] Unsanitized, unrestricted URLs in the file/image library** — `renderLibImages()` @ ~line 5046, `renderLibFiles()` @ ~line 5054.
  Problem: `i.url` / `f.url` — sourced from synced chat-thread `imgUrl` fields and from `zx_file_lib` in `localStorage` (populated from Supabase Storage upload responses) — were interpolated directly into `href`/`src` with no HTML-escaping and no scheme check.
  Impact: if a stored URL value were ever anything other than a real file URL (a synced record edited via devtools, a compromised/buggy backend response, or a Storage response the client doesn't fully control), a `javascript:`-scheme value would execute on click, and the raw string could also break out of the attribute into new HTML if it contained a quote.
  Fix: added `zxSafeUrl()` (allowlists `https?:`, `blob:`, and root-relative `/` paths only, else returns `#`) and applied it together with the existing `esc()` at both interpolation sites. Also added the missing `rel="noopener noreferrer"` to both `target="_blank"` links (previously only the Morocco-source citation link at ~line 4366 had it), closing the reverse-tabnabbing gap on the other two.
  Verify: in the browser console, `addToFileLibrary('x','javascript:alert(1)','file')` then open the Library → Files tab; the link should render with `href="#"` instead of executing anything on click.

### 🧭 Assumptions
- Fixed the two vulnerable sites with an exact, minimal, verifiable diff rather than rewriting the full ~8000-line file in one pass. A whole-file rewrite claiming to have audited and fixed every function in this response would not be a trustworthy claim — I have not verified the other ~30 `innerHTML` sites, the auth/session logic, the Edge Function call sites, or the service-worker cache versioning in this pass, and I'm not going to represent that I have.
- Left the other 41 `target="_blank"` instance (already had `rel`) untouched — only the two missing it were changed.

### ⏭️ Deferred (not done in this pass — needs a dedicated follow-up)
- Full line-by-line Pass A (security) across the remaining ~30 `innerHTML` sites listed below, each needs individual data-flow tracing to confirm whether its inputs are attacker-reachable:
  lines ~2071, 2448, 2452, 3594, 4316, 4339, 4365, 4422, 4520, 4545, 4555, 4643, 4655, 4768, 4901, 4906, 5021–5034, 5102–5109, 5177/5239/5292 (spinner — likely safe, static string), 5858, 5935, 5957, 7857.
- Pass B (correctness — crash paths, lying comments, the Supabase SDK CDN race), Pass C (performance — pdf.js/jszip lazy-load, service-worker cache-version bump), Pass D (UX/retention), Pass E (hygiene/JSDoc) — none of these were attempted in this pass.
- Reason for deferral: this is genuinely a multi-hour, multi-session audit of an 8,000-line production file; doing it honestly (tracing every call site, not guessing) doesn't fit in one response without either truncating output or fabricating a "0 findings" result I can't actually back.

### 🔍 Loop Report
- Passes run: partial Pass A only (2 of an estimated 30+ `innerHTML` sites individually verified and fixed)
- Functions audited: 2 / ~150+ (rough function count in file)
- Findings per pass: A:2 (both fixed) B:not run C:not run D:not run E:not run F:not run
- Final cycle findings: not applicable — no full cycle was run, so "0 findings" cannot be honestly claimed

## [Unreleased] - 2026-09-08

### Fixed
- **ai.html — `.model-sel-menu` dropdowns (effort/model selectors) clipped by `.main{overflow:hidden}`**: `#effortSelMenu`/`#modelSelMenu` opened downward (`top:100%`) from inside `.mode-row`, which sits near the bottom of the page inside `.input-zone`; with `.main{overflow:hidden}` on the ancestor, the menu had no room to render fully below the trigger and was cut off. Fixed by flipping these two menus to open upward (`bottom:calc(100% + 6px)` instead of `top:calc(100% + 6px)`), with the open/close animation direction (`selMenuPop` keyframes) reversed to match, plus `max-height:min(60vh,420px); overflow-y:auto` as a safety net on very short viewports.
- **ai.html — `#tbShortcutsMenu` (⋯ button in the topbar) needed different positioning from the two menus above**: since `#tbShortcuts` sits in `.topbar` (top of the page, not the bottom), it doesn't share the clipping problem the effort/model menus have, and neither an upward nor an initial-downward open worked visually in practice — resolved by opening this one menu sideways instead (`left:calc(100% + 6px)`, sliding out from the button's left) via a dedicated `#tbShortcuts .model-sel-menu` override, with its own `selMenuPopSide` slide-in animation. Scoped to `#tbShortcuts` only — `#effortSelMenu`/`#modelSelMenu` are untouched by this rule.
- **ai.html — toggle `.switch`/`.slider` resized to an exact pixel spec**: track `40×22px` → `50×26px`, knob `16×16px` → `20×20px` (3px inset on all sides), travel distance `18px` → `24px`. Direction preserved as `translateX(-24px)` (not `+24px`) since the document is `dir="rtl"` and the original `-18px` already moved toward the RTL "on" side — flipping the sign would have reversed on/off visually. Added `:focus-visible` outline and `:hover`/`:active` feedback on the slider, none of which existed before.
- **ai.html — several button/toggle rows were outside the existing "never-clip" auto-shrink system**: `[data-fit="row"]` (driven by `fitButtonRows()`, added 2026-09-04) only covered `.mode-row`, `.tb-right`, `.billing-toggle`, `.set-tabs`. Added the same attribute to `.lib-tabs` (both the Library and Tasks/Calendar modal instances), `.code-bar-btns` (code-block copy/preview buttons), `.set-avatar-btns` (avatar upload/remove), and `.persona-actions` (per-persona edit/delete buttons) — and extended the `fit-1`…`fit-4` shrink-tier CSS to also target `.lib-tab`, `.code-btn`, `.set-avatar-upload`, `.set-avatar-remove` so the shrink actually takes effect on these newly-covered rows, not just the original four.
- **ai.html — `renderPersonaList()`-generated `.persona-actions` rows missed by the fit-system's `MutationObserver`**: that observer only attaches to rows present at `DOMContentLoaded`, so persona action rows (rebuilt from scratch every time the persona list re-renders) were never tracked. Added a small dedicated observer on `#personaList` that re-attaches the main observer to any newly-created `[data-fit="row"]` inside it and triggers a re-fit — scoped to that one container rather than watching the whole `document.body` (an earlier, broader `document.body` `MutationObserver` version of this fix was tried and reverted the same day after it turned out to interfere with `#modelSelBtn`/`#effortSelBtn`/`#tbShortcutsBtn`'s own open/close behavior).
- **ai.html — desktop container width**: added `.conv > *{max-width:1200px;margin:0 auto}` at `min-width:1024px` so message content is capped and centered on wide monitors instead of stretching edge-to-edge (matches the existing `.bubble`/`.input-shell` width caps already in place for narrower breakpoints). An equivalent cap briefly added to `.input-zone` in the same pass was reverted per user request to keep the input bar's original full-width layout unchanged.
- **ai.html — missing `:active`/`:focus-visible` states on desktop**: the 2026-09-04 mobile touch layer added `:hover` (mouse) and `:active` (touch) states, but real mouse+keyboard users on desktop had no press-down feedback or visible focus ring on buttons/chips/toggles. Added both, scoped to `@media (hover:hover) and (pointer:fine)` so they don't double up with the existing touch-specific rules. (A version of this that also matched `.model-sel-item` was found to conflict with dropdown open/close and was narrowed to exclude it.)

## [2026-09-04]

### Fixed
- **ai.html — auto-fit script actually reaching the nested buttons**: `#effortSelBtn`, `#tbShortcutsBtn`, `#modelSelLabel`/`#effortSelLabel`, etc. sit inside a `.model-sel` wrapper div, so the previous `[data-fit="row"] > *` (direct-child only) selector never touched them, and `#tbShortcutsBtn`/`#tempChatBtn` also carry an inline `style="padding:..."` that beats any non-`!important` class rule regardless of specificity — net effect: no visible change. Fixed by (a) switching the shrink-tier CSS to descendant selectors (`button`, `.model-sel-btn`, `.mode-chip`, `.model-sel-item`, `svg`) with `!important`, and (b) rewriting the fit-detection itself: `.tb-right`/`.mode-row` don't self-clip (`flex-shrink:0`, `overflow:visible`) — they just push wider than their parent (`.topbar`), so comparing the row's own `scrollWidth` vs `clientWidth` was always equal and never caught the real overflow. `fitButtonRows()` now measures available space as the parent's inner width minus every sibling's rendered width, which correctly detects both this ancestor-level overflow and true self-overflow (`.mode-row` on narrow screens).
- **ai.html — CSP-blocked highlight.js theme**: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/.../atom-one-dark.min.css">` was being blocked by the deployed `style-src` policy (`'self' 'unsafe-inline' https://fonts.googleapis.com` — no `cdnjs.cloudflare.com`), so code blocks rendered unstyled. Theme CSS inlined directly as a `<style>` block instead, which loads under the existing `'unsafe-inline'` allowance with no CSP change needed on the hosting side.

: `.mode-row`, `.tb-right`, `.billing-toggle`, `.set-tabs` marked `[data-fit="row"]` and driven by a new `fitButtonRows()` script (runs on load, on resize debounced 120ms, and via a `MutationObserver` when a row's contents change, e.g. the effort-selector label swapping). Guarantees every button/toggle in these rows stays fully visible — never clipped, never hidden behind a scrollbar: the row steps down through 4 real shrink tiers (`fit-1`…`fit-4`, actual font-size/padding/gap reduction, not a transform hack) until it stops overflowing; if it's still too tight at the smallest tier, wrapping is force-enabled (`fit-wrap`) as the final guarantee instead of ever clipping content.

: `.wl-icon`'s `✦` glyph + spinning `.wl-ring` replaced with the real `zunexa-logo.svg` mark, inlined directly as SVG (gold gradient circle/star/"Z", same artwork as the standalone file) so it themes correctly with no extra HTTP request.
- **ai.html — logo sizing made responsive** via `sm:`/`md:`/`lg:`-equivalent breakpoints (640 / 768 / 1024px) instead of one JS-driven size: 56px base → 66px ≥640px → 76px ≥768px → 84px ≥1024px. The old fixed 66px mobile override at the 768px breakpoint was removed since sizing is now handled by the dedicated rules.
- **ai.html — global mobile touch layer** applied to every button/toggle on the page (`button`, `.btn`, any `*-btn`/`btn*` class, `.mode-chip`, `.model-sel-item`, `.persona-act-btn`, `.toggle`, `[role="switch"]`, `[role="button"]`, checkboxes/radios), not component-by-component:
  - `-webkit-tap-highlight-color: transparent` + disabled `-webkit-touch-callout`/`user-select` so repeated taps on phones no longer flash the gray highlight or select the label text.
  - Guaranteed ≥44×44px touch target on ≤1024px screens via an invisible `::after` hit-area overlay — visible button size/shape is unchanged, only the tappable area grows for small icon buttons.
  - `:hover` effects now scoped to `@media (hover:hover) and (pointer:fine)` (real pointer devices only) so they can't "stick" after a tap; touchscreens instead get an immediate `@media (hover:none), (pointer:coarse)` `:active` state (brightness + slight scale) for instant tap feedback.

### Removed
- **ai.html** — dead `zunexa_qa_final.json` / `zunexa_multi_llm_config.json` wiring disconnected: both were empty placeholder consts (`ZUNEXA_QA_FINAL = []`, `ZUNEXA_MULTI_LLM_CONFIG = {}`) that never held real data. `loadKB()`'s local-KB branch (which only ever logged "loaded 0 entries") was removed — KB now comes solely from the reviewed/approved Supabase `ai_knowledge` table, as it effectively already did. `ZUNEXA_CONFIG.pickModel()`/`getFallbackChain()` simplified to explicit no-ops instead of branching on an object that was always empty.
- **ai.html** — 5 leftover debug `console.log()` lines removed: the `[ZunexaBridge]` window-exposure notice, the `[ZunexaExt]` BM25F/Jaccard integration notice, the `✅ Authenticated: <email>` line, the `[ZunexaExt.SystemPrompt]` archon-mode notice, and the `[ZunexaExt]` remote-integration-layer-ready notice. No behavior change — these only ever printed to devtools.

## [2026-08-30]

### Added
- **agent.html** — new professional agent identities replacing the 5 internal display names/roles (role keys unchanged, no Supabase column or Edge Function payload migration needed):
  - `info` → **Nexus** — مركز تجميع وتقصي المعلومات والبيانات
  - `planner` → **Architect** — التخطيط الهيكلي ورسم خرائط العمليات
  - `tasker` → **Orchestrator** — توزيع المهام وإدارة سير العمل والتنفيذ
  - `coder` → **Forge** — بناء وكتابة الأكواد والحلول البرمجية
  - `tester` → **Inspector** — الفحص، الجودة، وتتبع الأخطاء والتصحيح
  Each role's description is now also shown as a `title` tooltip on its button in the agent role bar.
- **agent.html** — language selector (🇲🇦 دارجة / 🇸🇦 عربية / 🇬🇧 English / 🇫🇷 Français) in the topbar, translating static chrome (title, back button, rail labels, bottom-nav labels, workspace tabs, token-usage label) and setting `dir`/`lang` accordingly. Persisted in `localStorage` (`zx_page_lang`), re-applied silently on reload. Dynamic Supabase content (project names/descriptions) stays in whatever language the user originally typed.
- **ai.html** — Extended Thinking switch (`#thinkToggle`) next to the model-name button in the input toolbar: on/off toggle backed by `localStorage` (`zx_extended_thinking`), styled to match existing selector chips.
- **ai.html** — Auth mini-modal (`#authModal`): full Sign In / Sign Up ported from `index.html`, reusing the existing `_SB` Supabase client (no duplicate client, no extra anon key). Includes email/password sign-in & sign-up, Google/GitHub OAuth buttons, password-strength meter, 10s client-side lockout after a failed attempt, email-confirmation screen, success screen. Closing the modal after success now refreshes the in-app user card via `loadUser()` instead of a full page redirect. The sidebar user card (`#sbUserCard`) opens this modal on click for guest sessions.
- **index.html** — Google One-Tap sign-in: `accounts.google.com/gsi/client` script, `handleGoogleOneTap()` passing the received `id_token` to `_SB.auth.signInWithIdToken()`, and `initGoogleOneTap()` showing a "Continue as..." prompt automatically when no session is active. Requires a real Google Cloud Console Client ID in `ZX_GOOGLE_CLIENT_ID` (currently a placeholder) and the Google provider enabled in Supabase Auth; fails open (safely) without breaking the existing Google sign-in button if not configured.
- **index.html / ai.html** — cross-device history sync: `logMsg()` now writes `user_id` alongside `device_id`; new `pullCloudHistory()` (called after `loadUser()` in `init()`) fetches all of a signed-in user's messages from Supabase, rebuilds them into local `zx_thread_<id>` format, and adds only conversations missing locally. Settings sync added via `app_settings` jsonb on `profiles`: `pushAppSettings()` (800ms debounce) and `applyRemoteAppSettings()` cover font, reduce-motion, notifications, adaptive learning, tools, page language, model, effort level, and voice preferences. Fully best-effort — fails silently and the app keeps working locally if the required SQL migration hasn't been run yet. **Action required:** run `ZUNEXA_DB_SETUP_SYNC2.sql` once in the Supabase SQL editor.
- **settings.html** (new, fully standalone) — every settings tab: profile, personas (full CRUD), preferences, voice, notifications, memory, tools, referral, account, plus a billing tab. Matching Zunexa CSS identity (gold/dark Zalij mode). Full JS logic: profile save, persona activate/edit/delete, referral system (RPC), billing (redeem/request), avatar upload/remove, sign-out, and cross-device settings sync (`app_settings` in Supabase). Uses its own Supabase client, reading/writing the exact same `localStorage` keys as `ai.html`, so changes reflect immediately back in the app.
- `last_reviewed`/`needs_review` fields added to every KB entry.
- `refreshKB()`, polling `ai_knowledge` every 5 minutes and rebuilding `IDF`, so learned entries reach the live matcher without a full page reload.
- `eval.js` + `eval_set.json` (40 cases) as the "run after any change" regression check — currently 100% (40/40); see the honesty caveat inside `eval.js` about what that number does and doesn't prove.
- `extract_core.py` + `tests.js`: 14 tests running against the real extracted `tok`/`mergeKB`/`rankKB`/`detectArchonMode`/`fmt` code (verbatim line-range extraction from `ai.html`, not a reimplementation) — all 14 currently pass.
- Explicit tooltips on the Lite model option and Quick effort option stating plainly that no generative AI is used.
- On-screen warning next to the API key fields: keys are stored in plaintext in `localStorage`, readable by any XSS on the page; recommends not storing high-limit/billing keys there.
- `origin_model` and `review_status` fields on every `autoLearn()` insert; UI badges now distinguish `learned` (human-approved) from `partial`/`learning` (unresolved).
- Visible one-line banner above the message bubble for `partial`/`learning`/`learned` states, not just a small end-of-message badge.
- `admin-review.html`: lists pending learned-KB rows, lets an admin approve/reject/edit inline. Requires a Supabase Auth admin account and an RLS policy permitting that account to read/update `ai_knowledge` rows where `is_active = false`.
- `sanitizeForPrompt()`, applied to attached-file text before it reaches `archonBrain`'s prompt, flagging and neutralizing common injection phrasings ("ignore instructions", "system prompt", etc.) — pattern-based, not a guarantee.
- Client-side sliding-window rate limit (`archonBrainRateLimitOk()`, 30 calls / 10 min per device) — explicitly not a security boundary, same caveat as `getDeviceId()`.
- `pricing.json` as the single canonical pricing source, with known gaps/conflicts flagged (Plus plan token count unconfirmed; `gen3_0011` references a nonexistent "Max" plan tier).
- `FREE_TIER_TOKEN_CAP = 2000`, applied to every effort level (`quick`/`balanced`/`deep`/`max`) via `Math.min(...)` and to the fallback API call path, so no level can exceed 2000 tokens. The app currently has no real paid-plan gating (`uPlan` is display-only), so this cap effectively applies to everyone; a future paid tier needs a real plan check, not just higher numbers in `EFFORT_CFG`.

### Changed
- Emoji used as UI chrome replaced with Font Awesome icons across `ai.html` and `agent.html` (topbar, rail nav, bottom nav, workspace tabs, role bar, modals, task list, toasts, payment-status pills, feature-list bullets, reload button, sidebar close, upgrade/billing button, hamburger menu, share-chat item, attach button, extended-thinking label, file-chip close, code-preview toggle, Library/Tasks modal headers/close buttons, conversation-history search field). `toast()` now recognizes a leading emoji glyph (⚠ ✓ ✕ ⏳ ℹ 🕶 📲 🗑 ⬆ ✉) via `ZX_EMOJI_ICON_MAP` and renders a Font Awesome `<i>` icon in its place; the 35 existing `toast('...')` call sites needed no changes. The ✦ brand-mark glyph and emoji inside AI-generated chat content are left untouched intentionally.
- `.wl-ring` loading-ring rotation slowed from 8s to 16s per cycle for a calmer spin.
- `rankKB()`'s weight multiplier changed from an unbounded `score *= item.w` to a bounded `0.85 + 0.15 * min(w,2)/2` factor; `incrWeight()`'s cap lowered from 5 to 2 to match. Still usage-count based rather than success/failure based — flagged as a follow-up needing real thumbs-up/down feedback wired into the schema and UI.
- `mergeKB()` now keys on the stable `id` field, with real collisions logged instead of silently dropped.
- `autoLearn()`'s upsert key changed from the raw question string to `norm(question)`; every `autoLearn()` insert now always writes `is_active: false, review_status: 'pending_review'` — nothing from Pollinations reaches the live KB without human approval via the review panel.
- All magic ranking thresholds (0.14/0.06/0.045/0.35/0.02) moved into one documented `THRESHOLDS` object at the top of the ranking code.
- `isFollowUp()` is now checked before the `zxModel === 'lite'` early exit; lite mode now explicitly tells the user a follow-up needs a higher mode instead of silently ignoring context.
- `zx_page_lang` is now passed into `archonSystemPrompt()` as an explicit, documented default-when-ambiguous hint instead of being silently unused by the brain.
- `_SB` Supabase client hardened: a polling guard now waits (up to 8s) for the Supabase library to finish loading instead of assuming it's already present; all 35 `_SB.xxx` call sites switched to `_SB?.xxx` optional chaining so a fully failed CDN load can no longer crash the page — Supabase-dependent features (auth, upload, etc.) fail quietly instead.
- `openSettings()`/`closeSettings()` rewritten with full DOM-existence guards (`if (el) ...`) on every element they touch, plus two-level `try/catch` (per sub-call and around the whole function) — the previous version crashed the whole modal if any of `settLoggedInInfo`/`settGuestInfo`/`uName`/`uEmail`/`uPlan`/`fName`/`settModal` was missing or `getSession()` was slow/failed. `savePagePrefs()`/`saveVoicePrefs()` rewritten the same way for `<select>`/`<input>` reads. The click-outside-to-close listener no longer breaks if `#settModal` isn't in the DOM yet when the script runs.
- Message bubbles (`.bubble`) capped at `max-width:min(76%,820px)` on very wide screens (≥1400px) — the percentage-only rule made text unreadably wide above ~3000px. `.input-shell`/`.mode-row` aligned to the same max width for visual consistency at that breakpoint.
- Touch targets raised to an effective 44px minimum (via an invisible `::after` hit-area expansion, no visible shape change) on: `.theme-toggle-btn`, `.user-icon-button`, `.persona-act-btn`, `.modal-x`, the temporary-chat button (`#tempChatBtn`), `.sb-fbtn` (sidebar buttons, up from 32px), `.code-btn` (copy/live-preview buttons under code blocks).
- `zunexa-seo-keywords.js` moved from after `</body>` into `<head>` with `defer`, so it doesn't block parsing but still executes early enough for meta tags/JSON-LD to be available to search engines promptly.
- **settings.html split out of ai.html**: the settings modal UI is fully removed from `ai.html`'s HTML; the sidebar settings button now navigates to `settings.html` via `goToSettings()`. All JS exclusive to the old in-page settings UI (modal open/close, tabs, persona editor, referral, etc.) removed from `ai.html`; functions the chat engine itself still needs (active persona lookup, API keys, settings sync, language/font applied at boot) were kept. Old settings-modal CSS removed from `ai.html`. JS syntax of both files verified via `node --check` (no errors).

### Fixed
- `loadKB()` now loads only `zunexa_qa_final.json` as the single source of truth (`zunexa_qa.json`/`zunexa_qa_merged.json` moved to `archive/`, removed from the production load path); on failure it now surfaces a visible warning (`toast()` if available, `console.error` otherwise) instead of silently falling back to an older/smaller file.
- 73 generic dev-tutorial KB entries (git/docker/react/sql/etc. with no platform reference) extracted into `general_dev_tips.json`, which is not part of the default Zunexa-assistant KB load.
- `orig_0123` (garbled pricing placeholder) and 9 further entries that answered as if the AI had personal human experiences ("yes I slept well", contradictory yes/no pairs) removed as not salvageable / not appropriate for a product assistant.
- One KB entry (`gen3_0032`) had unbalanced brackets / invalid JSON in a `json`-tagged fenced code block — flagged after checking every fenced block in the KB for bracket balance and JSON validity.
- Dead `search()` function removed (confirmed zero callers via full-file grep before removal).
- A stray duplicate closing brace in `archonSystemPrompt()`, introduced earlier in the same pass, which would have broken the entire inline `<script>` block — caught by syntax-checking the full script before considering the pass done.
- Removed `<div class="model-tag">` entirely — HTML, its CSS rule, the mobile `display:none` override, and the `setModel()`/`applyPageLang()` JS that populated it — with no dead references left behind.
- Removed the effort-selector button (`#effortSelBtn`, "سريع/متوازن/عميق/أقصى") and its dropdown, plus `toggleEffortSel()`/`setEffortUI()` and related DOM lookups; the underlying `zxEffort` state and `EFFORT_CFG` search-tuning logic were left intact internally (still defaults to `'max'`) so answer quality is unaffected — only the user-facing control was removed.
- Replaced the inline geometric Zalij-pattern SVG background with an external `background.svg` file rendered via `<img>` inside `#zalij-bg`.
- Removed the `.quick-chips` welcome-screen/`newChat()` elements entirely, their CSS (`.quick-chips`/`.qchip`, including the small-screen media query), and their leftover references in shared selector lists (ripple effect, `:active` state) in both CSS and JS (`RIPPLE_SEL`). Shortcut commands (`/طقس`, `/صورة`, `/جيت`, `/بحث`, `/صوت`) were left untouched and still work via `go()`.

### Security
- Expanded the code comment above `archonBrain` documenting exactly what data reaches Pollinations. (Editing the product's actual privacy-policy text is outside what this pass could touch.)

## [2026-08-02] - Zunexa AI audit fixes (40-item brief)

Scope: fixes to `ai.html`, the KB JSON files, and supporting tooling.

### Done (selected highlights not already listed above)
- Verified all KB entry ids are already unique — no regeneration needed.
- `clean_kb.py` reimplements `ai.html`'s own `tok`/`tfidfVec`/`cosine` in Python and reports any KB pair scoring above 0.85 cosine similarity (see `audit_report.md`).
- The original "27% off-brand" audit figure was found to be a measurement artifact of literal brand-string matching rather than an actual content problem — corrected reasoning documented instead of mechanically stuffing "Zunexa" into working answers.
- Flagged in a code comment: the "fluent in 30+ languages" system-prompt claim is unverified language-by-language in this pass.

### Not done — needs manual follow-up
- `archon-modes-patch.js` was never present in the uploaded files (nothing to delete); case-insensitive `/code` detection and the `setArchonMode` no-op guard were already correctly implemented — verified, not changed, now covered by tests in `tests.js`.
- Manual QA across 4 modes × 4 models × 3-message threads (see `MANUAL_QA_CHECKLIST.md`, written but not executed — needs the live hosted app).
- Supabase RLS policy review — needs direct access to the Supabase dashboard.
- Confirming no sensitive-data query uses `getDeviceId()` as an auth substitute needs the live RLS policies (spot-checked in code: no such usage found in `ai.html` itself).
- A real re-audit needs to run against the live, deployed state after the "Not done" items above are resolved.

## [2026-08-27] - Settings modal crash fix + touch targets + auth/sync foundation

(Superseded in part by the 2026-08-30 settings.html split above, which moved the settings UI out of `ai.html` entirely — see "Changed" above for the current state.)

- Root-caused and fixed the settings-modal crash described under "Fixed" above (missing DOM null-checks / no `try/catch` in `openSettings()`, `savePagePrefs()`, `saveVoicePrefs()`).
- Removed Quick Chips from the welcome screen (see "Fixed" above).
- Added the ≥1400px bubble/input-shell width cap and the 44px touch-target pass (see "Changed" above).
- Confirmed `index.html`'s login-redirect logic already reads `localStorage` synchronously with no network/Supabase-load wait (fastest technically possible path); no unverifiable timing claim (e.g. "4ms") was written into the code — documented the reasoning in a code comment instead.
- Moved `zunexa-seo-keywords.js` into `<head>` with `defer` (see "Changed" above). Verified UTF-8 encoding and RTL/LTR direction in both files are correct as-is (`ai.html` = ar/rtl, `index.html` = en/ltr by design for the login page) — RTL was not forced onto `index.html` to avoid breaking its intended LTR layout.
- Added Google One-Tap sign-in foundation (see "Added" above — still needs a real Client ID).
- Added the cross-device history/settings sync foundation (see "Added" above — still needs `ZUNEXA_DB_SETUP_SYNC2.sql` run once in Supabase).
- Added `FREE_TIER_TOKEN_CAP = 2000` (see "Added" above).

### File cleanup recommendations (not executed — no files were deleted)
Based on the file tree and what's actually referenced from inside `ai.html`/`index.html`; the listed files themselves were not opened, so final judgment call is manual:

| File | Recommendation | Reason |
|---|---|---|
| `review-cli.js` | Candidate for removal or moving out of the deployed repo | Looks like a local dev-only code-review CLI tool, unrelated to the deployed app |
| `admin-review.html` | Keep only if it's an actual in-use admin dashboard; ensure it's auth-protected if kept | Not referenced from `ai.html`/`index.html` — name suggests it may be experimental/incomplete |
| `agent-cors.ts` | Manual review: still used now that `supabase/functions/_shared/cors.ts` exists? | Likely a superseded duplicate now that a shared `cors.ts` exists |
| `auto-bot.js` | Manual review of actual usage | No call site found in `ai.html`/`index.html`; if it's an external automation script it could live in a separate repo |
| `archon-brain-ext.js` | Manual review | Not called from the current `ai.html` — may be legacy or intended for `agent.html`; check `agent.html` directly |
| `landing.html` + `portfolio.html` | Keep if genuinely separate live marketing pages | Fine to keep if actually linked from navigation or a subdomain; confirm they aren't stale experiments |
| `tables.md` | Consider merging into `README.md` or `zunexa_master_system.md` if it's small documentation | Documentation is currently spread across several Markdown files (`README.md`, `SECURITY.md`, `zunexa_master_system.md`, `tables.md`, `CHANGELOG.md`) |
| `zunexa_qa_final.json` | Delete only if this is a finished, no-longer-needed QA/test file | Name suggests a QA/test artifact rather than a runtime config file — confirm nothing still imports it before deleting |

**Not recommended for removal:** `agent.html` (actually linked from `ai.html`'s sidebar), `service-worker.js`/`manifest.json` (required for PWA functionality), all `supabase/functions/*` (live Edge Functions serving the AI), `zunexa-logo.svg`/PWA icons (used in the design/manifest).
