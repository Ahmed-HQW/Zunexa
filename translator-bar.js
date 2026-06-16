/**
 * ═══════════════════════════════════════════════════════════════
 * ZUNEXA V10 — TRANSLATION SYSTEM (ARCHON CORE)
 * File    : translator-bar.js
 * Author  : Zunexa Digital Brand
 * Version : 10.0.0 — Aether-Kernel Protocol
 * ═══════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';
  if (document.getElementById('zx-translator-root')) return;

  const style = document.createElement('style');
  style.innerHTML = `
    #zx-translator-root {
      position: fixed; top: 0; left: 0; right: 0; height: 40px;
      background: #0e0e0e; border-bottom: 1px solid rgba(212, 175, 55, 0.25);
      z-index: 9999; display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; font-family: 'Rajdhani', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    body { padding-top: 40px !important; }
    .zx-trans-brand { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: #D4AF37; }
    .zx-trans-flex { display: flex; align-items: center; gap: 8px; }
    .zx-trans-select {
      background: #141414; border: 1px solid #242424; color: #f5f5f0;
      font-size: 12px; padding: 3px 10px; border-radius: 4px; outline: none; cursor: pointer;
    }
    .zx-trans-select:focus { border-color: #D4AF37; }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'zx-translator-root';
  bar.innerHTML = `
    <div class="zx-trans-brand">✦ ZUNEXA ARCHON ENGINE</div>
    <div class="zx-trans-flex">
      <select id="zx-trans-lang" class="zx-trans-select" onchange="window.ZX_TRANS.changeLang(this.value)">
        <option value="ar">العربية (الأصلية)</option>
        <option value="mor">الدارجة المغربية</option>
        <option value="en">English</option>
      </select>
    </div>
  `;
  document.body.insertBefore(bar, document.body.firstChild);

  window.ZX_TRANS = {
    changeLang(lang) {
      console.log("Translating interface to:", lang);
      localStorage.setItem('zx_lang', lang);
    }
  };
})();
