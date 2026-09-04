# Changelog — Zunexa (ai.html / agent.html / index.html / settings.html)

All notable changes to the Zunexa front-end are documented in this file, merged from
`CHANGELOG.md` and `changelog-ai-html.md`. Sorted newest first.

## [Unreleased] - 2026-09-04

### Added
- **ai.html — auto-fit button rows**: `.mode-row`, `.tb-right`, `.billing-toggle`, `.set-tabs` marked `[data-fit="row"]` and driven by a new `fitButtonRows()` script (runs on load, on resize debounced 120ms, and via a `MutationObserver` when a row's contents change, e.g. the effort-selector label swapping). Guarantees every button/toggle in these rows stays fully visible — never clipped, never hidden behind a scrollbar: the row steps down through 4 real shrink tiers (`fit-1`…`fit-4`, actual font-size/padding/gap reduction, not a transform hack) until it stops overflowing; if it's still too tight at the smallest tier, wrapping is force-enabled (`fit-wrap`) as the final guarantee instead of ever clipping content.

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
