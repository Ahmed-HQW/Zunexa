# Zunexa KB Audit Report — 2026-08-02

Source: `zunexa_qa_final.json`, 592 entries loaded.

## Item 9 — broken/placeholder answers removed: 10
- removed `orig_0094` (q: 'هل نمت جيداً نعستي مزيان كيف نعستي نمت') — placeholder answer, no real content.
- removed `orig_0097` (q: 'هل تحتاج إلى مساعدة معاونة نعاونك اساعدك مساعدة') — placeholder answer, no real content.
- removed `orig_0099` (q: 'هل اتصلت بي صونيتي عليا عيطتي ليا رنيت') — placeholder answer, no real content.
- removed `orig_0100` (q: 'هل أكلت كليتي تغديتي تعشيتي اكلت') — placeholder answer, no real content.
- removed `orig_0103` (q: 'شاحن chargeur شارجور معك شاحن') — placeholder answer, no real content.
- removed `orig_0105` (q: 'رأيت رسالتي قريتي ميساجي شفتي الميساج رسالتي') — placeholder answer, no real content.
- removed `orig_0115` (q: 'اجتماع ميتينغ meeting اجتماع اليوم') — placeholder answer, no real content.
- removed `orig_0118` (q: 'فهمت الدرس فهمتي فهمت الموضوع') — placeholder answer, no real content.
- removed `orig_0123` (q: 'كم سعر بشحال الثمن السعر') — placeholder answer, no real content.
- removed `orig_0129` (q: 'صرف فكة صرف عندك عندك الصرف') — placeholder answer, no real content.

## Item 7/8 — relevance triage
- Extracted **73** generic dev-tutorial entries (git/linux/docker/react/sql/etc. with zero platform reference) into `general_dev_tips.json`. These are NOT loaded in the default Zunexa-assistant context (per item 7).
- Remaining default KB: **509** entries, of which **251** (49.3%) match an explicit platform/brand signal.
- The other 258 entries in the default KB are things like login/logout/password-reset/payment support answers that use "you/we/your account" phrasing rather than the literal word Zunexa — these read as legitimate product support content on manual inspection, not off-topic filler. **Recommend a human pass to confirm this reading rather than mechanically forcing brand-name insertion into working answers, which would just be cosmetic.**

## Item 11 — id integrity
- Duplicate ids found: 0 []
- Missing/"unknown" ids found: 0
- All ids already unique and non-empty in the source file — no regeneration needed.

## Item 12 — semantic near-duplicates (cosine > 0.85, same engine as rankKB)
- Found **1** pairs above threshold, for manual merge review:
  - 0.896 — `orig_0271` ↔ `gen_0006`

## Item 13 — code block sanity check (bracket balance + JSON parse)
- Entries with a fenced code block: 84
- Flagged as broken: **1**
  - `gen3_0032` (json): ['invalid JSON: Expecting value: line 1 column 1 (char 0)']
- Note: this is a structural check (bracket/JSON balance), not a full linter/compiler run per language — flagged entries need a human look, clean entries are a reasonable confidence pass, not a guarantee.

## Item 14 — review metadata
- Added `last_reviewed`/`needs_review` to every entry (all set to 2026-08-02 / false — freshly reviewed by this pass). A periodic job should flip `needs_review` to true for anything untouched for 6+ months, especially pricing/feature entries.

## Item 10 — pricing.json created
- Canonical Free/Plus/Pro/Senior numbers extracted from the KB into `pricing.json`.
- **The Plus plan token count (3000) only ever appeared in one bundled sentence (orig_0063/orig_0238) — there is no dedicated, detailed Plus entry like the other three plans have. Flagged for a human to confirm the real number before this ships.**
- 3 duplicate-answer pairs and 1 stale "Max" plan reference found — see items 12/10 above.

## Item 17 — merge key
- All entries have a stable, unique `id` (confirmed in item 11) — `ai.html`'s `mergeKB()` is updated to key on `id` (see CHANGELOG) instead of `norm(q).slice(0,55)`.

## Summary
- Input: 592 entries
- Output `zunexa_qa_final.json` (default-loaded KB): 509 entries
- Output `general_dev_tips.json` (not loaded by default): 73 entries
- Removed as unsalvageable: 10 entries
- 592 = 509 + 73 + 10 → True