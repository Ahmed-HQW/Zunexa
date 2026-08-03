# Manual QA checklist — modes × models × follow-up context

Item 30 asked for a 3-message scenario (question → follow-up → second
follow-up) run across every mode × model combination, to confirm context
survives reasonably in each. This needs the live, deployed app (fetch(),
Supabase, and the real Pollinations endpoint all need to actually run) —
it can't be executed against a static file copy, so this is the checklist
to run yourself, not a report of results.

## Setup
1. Open the deployed app fresh (clear localStorage or use a private window
   so `zx_archon_mode`/`zx_model`/`zx_effort` start from defaults).
2. For each cell below, send exactly these 3 messages in order, in a new
   chat:
   - **Q1:** "شنو هو Generator Hub؟" (or any KB question you know the
     answer to)
   - **Q2 (follow-up):** "زيد شرح أكثر" (deliberately short/vague —
     this is what `isFollowUp()`/`FOLLOWUP_MARKERS` should catch)
   - **Q3 (second follow-up):** "و شنو كيفاش نبدا نستعملو؟"
3. Record, per cell: did Q2/Q3 actually reference Q1's topic, or did the
   bot answer as if each message were standalone?

## Matrix

| Mode ↓ / Model → | Lite | Pro | Max |
|---|---|---|---|
| chat (default) | | | |
| cowork (`/cowork` or keyword-triggered) | | | |
| code (`/code` or keyword-triggered) | | | |
| cli (`/cli` or keyword-triggered) | | | |

Expected behavior after this pass's fixes:
- **Lite** column: Q2/Q3 will NOT get real context (no LLM call at all in
  lite mode) — but the bot should now say so explicitly ("this needs a
  higher mode") instead of silently returning an unrelated KB lookup.
  That explicit message is the thing to verify, not full context
  understanding.
- **Pro/Max** columns: Q2/Q3 should visibly reference Generator Hub, not
  answer as if disconnected from Q1. `effortSel` also matters here —
  effort=`quick` disables the brain entirely even in Pro/Max, so re-test
  with effort=`balanced` or higher if a Pro/Max cell fails.
- **cowork/code/cli** rows should additionally reflect their mode-specific
  system prompt behavior (code → code-block-first replies, cli →
  terminal-commands-only, cowork → clarifying question + numbered steps)
  on top of the context check.

## Sign-off
- [ ] All 12 cells run
- [ ] Any cell where context clearly broke — note the exact 3 messages
      and screenshot before filing a bug, since KB score can be flaky
      near threshold boundaries depending on exact phrasing.
