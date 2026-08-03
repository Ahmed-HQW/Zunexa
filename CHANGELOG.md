# CHANGELOG — Zunexa AI audit fixes

Date executed: 2026-08-02
Scope: fixes to `ai.html`, the KB JSON files, and supporting tooling, against
the 40-item audit brief. Each entry below is the item number from the
original brief. Items not listed under "Done" were not completed by this
pass — see the honesty notes at the bottom, they are not silently skipped.

## Done

- **Item 5** — `zunexa_qa.json` and `zunexa_qa_merged.json` moved to
  `archive/` (not deleted), removed from the production load path.
- **Item 6** — `loadKB()` in `ai.html` now loads only `zunexa_qa_final.json`
  as the single source of truth. On failure it surfaces a visible warning
  (`toast()` if available, `console.error` otherwise) instead of silently
  falling back to an older/smaller file.
- **Item 7** — 73 generic dev-tutorial entries (git/docker/react/sql/etc.
  with no platform reference) extracted into `general_dev_tips.json`,
  which is NOT part of the default Zunexa-assistant KB load.
- **Item 8** — see `audit_report.md`. The original 27% figure was a
  measurement artifact of literal brand-string matching, not an actual
  content problem — corrected reasoning documented rather than
  mechanically stuffing "Zunexa" into working answers.
- **Item 9** — `orig_0123` (garbled pricing placeholder) removed, plus 9
  more entries found while building the eval set (item 36) that answered
  as if the AI had personal human experiences ("yes I slept well",
  "yes I ate", contradictory yes/no pairs) — same removal bucket, same
  reasoning: not salvageable, not appropriate for a product assistant.
- **Item 10** — `pricing.json` created as the single canonical pricing
  source, with known gaps/conflicts flagged (Plus plan token count is
  unconfirmed; `gen3_0011` references a nonexistent "Max" plan tier).
- **Item 11** — verified: all ids already unique, none missing/"unknown".
  No regeneration needed.
- **Item 12** — `clean_kb.py` re-implements `ai.html`'s own
  `tok`/`tfidfVec`/`cosine` in Python and reports any KB pair scoring
  above 0.85 cosine similarity (see `audit_report.md`).
- **Item 13** — every fenced code block in the KB checked for bracket
  balance and (for `json`-tagged blocks) actual JSON validity; 1 broken
  block flagged (`gen3_0032`).
- **Item 14** — `last_reviewed`/`needs_review` fields added to every KB
  entry.
- **Item 15** — `rankKB()`'s weight multiplier changed from an unbounded
  `score *= item.w` to a bounded `0.85 + 0.15 * min(w,2)/2` factor.
- **Item 16** — `incrWeight()`'s cap lowered from 5 to 2, to match the
  bounded range item 15 actually reads. Still usage-count based, not
  success/failure based — flagged as a follow-up needing real thumbs-up/
  down feedback wired into the schema and UI.
- **Item 17** — `mergeKB()` now keys on the stable `id` field, with any
  real collision logged instead of silently dropped.
- **Item 18** — added `refreshKB()`, polling `ai_knowledge` every 5
  minutes and rebuilding `IDF`, so learned entries reach the live
  matcher without a full page reload.
- **Item 19** — all magic thresholds (0.14/0.06/0.045/0.35/0.02) moved
  into one documented `THRESHOLDS` object at the top of the ranking code.
  `eval.js` + `eval_set.json` added as the "run after any change" check
  this item asked for.
- **Item 20** — dead `search()` function removed (confirmed zero callers
  via full-file grep before removing).
- **Item 21** — `autoLearn()` now always writes `is_active: false,
  review_status: 'pending_review'`. Nothing from Pollinations reaches the
  live KB without a human approving it via the review panel (item 22).
- **Item 22** — `admin-review.html` built: lists pending rows, lets an
  admin approve/reject/edit inline. Requires your Supabase Auth admin
  account and an RLS policy permitting that account to read/update
  `ai_knowledge` rows where `is_active = false` — I can't grant that
  policy myself (see "Not done" below).
- **Item 23** — `sanitizeForPrompt()` added; applied to attached-file text
  before it's included in the prompt sent to `archonBrain`, flagging and
  neutralizing common injection phrasings ("ignore instructions", "system
  prompt", etc.). Pattern-based, not a guarantee.
- **Item 24** — expanded the code comment above `archonBrain` documenting
  exactly what data reaches Pollinations. Product privacy-policy text
  itself is outside what I can edit from here.
- **Item 25** — client-side sliding-window rate limit added
  (`archonBrainRateLimitOk()`, 30 calls / 10 min per device). Explicitly
  documented as not a security boundary, same caveat as `getDeviceId()`.
- **Item 26** — `autoLearn()`'s upsert key is now `norm(question)` instead
  of the raw string.
- **Item 27** — `origin_model` and `review_status` fields added to every
  `autoLearn()` insert. UI badges (item 37) now distinguish `learned`
  (human-approved) from `partial`/`learning` (unresolved) instead of
  visually blending them.
- **Item 28** — `isFollowUp()` is now checked before the `zxModel ===
  'lite'` early exit; lite mode now tells the user explicitly that a
  follow-up needs a higher mode instead of silently ignoring context.
- **Item 29** — explicit tooltips added to the Lite model option and Quick
  effort option stating plainly that no generative AI is used.
- **Item 31** — explicit on-screen warning added next to the API key
  fields: keys are stored in plaintext in localStorage, readable by any
  XSS on the page; recommends not storing high-limit/billing keys there.
- **Item 34** — this file.
- **Item 35** — `extract_core.py` + `tests.js`: 14 tests running against
  the REAL extracted `tok/mergeKB/rankKB/detectArchonMode/fmt` code
  (verbatim line-range extraction from `ai.html`, not a reimplementation).
  All 14 currently pass.
- **Item 36** — `eval_set.json` (40 cases) + `eval.js`, currently 100%
  (40/40) — see the honesty caveat inside `eval.js` about what that
  number does and doesn't prove.
- **Item 37** — `partial`/`learning`/`learned` now get a visible one-line
  banner above the message bubble, not just a small end-of-message badge.
- **Item 38** — flagged in a code comment: the "fluent in 30+ languages"
  system-prompt claim is unverified language-by-language in this pass.
- **Item 39** — `zx_page_lang` is now passed into `archonSystemPrompt()`
  as an explicit, documented default-when-ambiguous hint instead of being
  silently unused by the brain.

## Not done — needs you, not more of my time

- **Item A (1–4)** — `archon-modes-patch.js` was never in the uploaded
  files; there's nothing on my end to delete. Items A.3 (case-insensitive
  `/code` detection) and A.4 (`setArchonMode` no-op guard) were already
  correctly implemented in the existing code — verified, not changed —
  and now have explicit tests in `tests.js`.
- **Item 30** — see `MANUAL_QA_CHECKLIST.md`, written but NOT executed —
  running it means clicking through the real hosted app across 4 modes ×
  4 models × 3-message threads, which needs the live app, not a static
  file copy.
- **Item 32** — Supabase RLS policy review needs your Supabase dashboard.
  I don't have access to your project.
- **Item 33** — spot-checked in code: no sensitive-data query in `ai.html`
  uses `getDeviceId()` as an auth substitute (only chat/file association,
  which was already the documented intent). A full audit needs the actual
  RLS policies (item 32) to confirm the DB side agrees.
- **Item 40** — a real re-audit needs to run against the live, deployed
  state after you've actually shipped these changes and resolved the
  "Not done" items above — running it now against my own local output
  would just confirm my own script agrees with itself.

## Also fixed, found along the way (not in the original 40)

- A stray duplicate closing brace in `archonSystemPrompt()`, introduced by
  an early edit in this same pass, which would have broken the entire
  inline `<script>` block. Caught by syntax-checking the full script
  before considering this done — worth keeping that habit for any future
  edits to this file.
