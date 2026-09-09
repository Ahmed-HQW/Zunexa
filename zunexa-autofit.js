/* zunexa-autofit.js
   نظام Auto-Fit لصفوف الأزرار — منقول حرفياً من ai.html بدون أي
   تغيير فالمنطق. يحمّل عبر: <script defer src="zunexa-autofit.js"></script> */
/* ════════════════════════════════════════════════════════
   AUTO-FIT BUTTON ROWS (2026-09-04)
   Every [data-fit="row"] container (.mode-row, .tb-right,
   .billing-toggle, .set-tabs) must show ALL its buttons/toggles
   fully on load and on every resize — nothing clipped, nothing
   hidden behind a scrollbar. Steps the row down through
   fit-1 → fit-2 → fit-3 → fit-4 (real font-size/padding/gap
   shrink) until it stops overflowing; if it's still too tight
   at the smallest tier, force-wraps as the final guarantee.
════════════════════════════════════════════════════════ */
(function () {
  const TIERS = ['fit-1', 'fit-2', 'fit-3', 'fit-4'];

  // The row itself never self-clips (flex-shrink:0, overflow:visible) —
  // it just pushes wider than its PARENT (.topbar / .input-zone), so
  // comparing the row's own scrollWidth vs clientWidth is always equal
  // and never detects the real overflow. Instead: available space =
  // parent's inner width minus every sibling that isn't this row.
  function availableWidth(el) {
    const parent = el.parentElement;
    if (!parent) return Infinity;
    const parentStyle = getComputedStyle(parent);
    let w = parent.clientWidth
          - parseFloat(parentStyle.paddingLeft || 0)
          - parseFloat(parentStyle.paddingRight || 0);
    Array.from(parent.children).forEach(sib => {
      if (sib === el) return;
      const cs = getComputedStyle(sib);
      if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') return;
      const rect = sib.getBoundingClientRect();
      w -= rect.width
         + parseFloat(cs.marginLeft || 0)
         + parseFloat(cs.marginRight || 0);
    });
    return Math.max(0, w - 4); // small safety margin
  }

  function fits(el) {
    return el.scrollWidth <= availableWidth(el) + 1;
  }

  function fitRow(el) {
    el.classList.remove(...TIERS, 'fit-wrap');
    if (fits(el)) return; // already all visible at full size

    for (const tier of TIERS) {
      el.classList.add(tier);
      if (fits(el)) return;
      el.classList.remove(tier);
    }

    // Still doesn't fit even at the smallest tier — guarantee every
    // button/toggle stays fully visible by wrapping to more than one
    // row instead of clipping/scrolling any of them out of sight.
    el.classList.add('fit-4', 'fit-wrap');
  }

  function fitAllRows() {
    document.querySelectorAll('[data-fit="row"]').forEach(fitRow);
  }

  window.fitButtonRows = fitAllRows; // exposed so menu-toggle code can re-fit on demand

  window.addEventListener('load', fitAllRows);
  window.addEventListener('resize', () => {
    clearTimeout(window.__fitRowsT);
    window.__fitRowsT = setTimeout(fitAllRows, 120);
  });

  // Re-fit whenever buttons/toggles are added or swapped inside a
  // tracked row (e.g. model/effort selector rebuilding its label).
  const mo = new MutationObserver(() => {
    clearTimeout(window.__fitRowsT);
    window.__fitRowsT = setTimeout(fitAllRows, 60);
  });
  document.addEventListener('DOMContentLoaded', () => {
    fitAllRows();
    document.querySelectorAll('[data-fit="row"]').forEach(el => {
      mo.observe(el, { childList: true, subtree: true, characterData: true });
    });
  });
  // renderPersonaList() rebuilds #personaList from scratch, so any
  // .persona-actions row it creates is missed by the observer above
  // (which only watches rows present at DOMContentLoaded). Re-scan
  // that one container specifically, instead of watching the whole
  // document body.
  const personaList = document.getElementById('personaList');
  if (personaList) {
    new MutationObserver(() => {
      personaList.querySelectorAll('[data-fit="row"]').forEach(el => {
        mo.observe(el, { childList: true, subtree: true, characterData: true });
      });
      clearTimeout(window.__fitRowsT);
      window.__fitRowsT = setTimeout(fitAllRows, 60);
    }).observe(personaList, { childList: true });
  }
})();
