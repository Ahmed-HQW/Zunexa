/**
 * ═══════════════════════════════════════════════════════════════
 * ZUNEXA V10 — INTERACTIVE ONBOARDING ENGINE
 * File    : onboarding.js
 * Author  : ahmed_dev_a | Zunexa Digital Brand | Bir Jdid, Morocco
 * Version : 10.0.0 — Archon Core
 * ═══════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';
  if (localStorage.getItem('zx_onboarded') === '1') return;

  const style = document.createElement('style');
  style.innerHTML = `
    #zx-onboard-overlay {
      position: fixed; inset: 0; background: rgba(8,8,8,0.85);
      backdrop-filter: blur(6px); z-index: 10000; display: grid; place-items: center;
    }
    .zx-ob-card {
      background: #141414; border: 1px solid #D4AF37; border-radius: 12px;
      padding: 24px; max-width: 420px; width: 90%; text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }
    .zx-ob-title { font-family: 'Cinzel', serif; color: #D4AF37; font-size: 18px; margin-bottom: 12px; }
    .zx-ob-desc { color: #888; font-size: 13px; line-height: 1.6; margin-bottom: 20px; }
    .zx-ob-btn {
      background: linear-gradient(135deg, #D4AF37, #8a7022); color: #000;
      border: none; padding: 10px 24px; border-radius: 6px; font-weight: 700;
      font-size: 13px; cursor: pointer; font-family: 'Cinzel', serif;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'zx-onboard-overlay';
  overlay.innerHTML = `
    <div class="zx-ob-card">
      <div class="zx-ob-title">✦ مرحباً بك في ZUNEXA V10</div>
      <div class="zx-ob-desc">اكتشف القوة الكاملة للجيل العاشر. مولد المحتوى الذكي، أدوات تحسين السيو، ونظام التوكنز الفائق مهيأ بالكامل لخدمة أهدافك الرقمية.</div>
      <button class="zx-ob-btn" onclick="window.ZX_OB.complete()">ابدأ الاستكشاف ⟫</button>
    </div>
  `;
  document.body.appendChild(overlay);

  window.ZX_OB = {
    complete() {
      overlay.remove();
      localStorage.setItem('zx_onboarded', '1');
    }
  };
})();
