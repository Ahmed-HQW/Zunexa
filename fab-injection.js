/**
 * ═══════════════════════════════════════════════════════════════
 * ZUNEXA V10 — FLOATING ACTION BUTTON (FAB) INJECTION
 * File    : fab-injection.js
 * Author  : Zunexa Digital Brand
 * Version : 10.0.0 — Aether-Kernel Protocol
 *
 * USAGE: Add ONE <script> tag before </body> in dashboard.html:
 *   <script src="fab-injection.js"></script>
 *
 * PURPOSE: Injects a gold FAB with expandable action menu into
 * any page. Designed for dashboard.html but works universally.
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  /* Guard: skip if already injected */
  if (document.getElementById('zx-fab-root')) return;

  /* ── FAB HTML ── */
  const fabHTML = `
<style id="zx-fab-styles">
#zx-fab-root { position: fixed; bottom: 28px; right: 28px; z-index: 300; }

/* ── Main button ── */
#zx-fab-btn {
  width: 54px; height: 54px; border-radius: 50%;
  background: linear-gradient(135deg, #D4AF37, #8a7022);
  color: #000; font-size: 24px;
  display: grid; place-items: center;
  box-shadow: 0 4px 24px rgba(212,175,55,.45), 0 0 0 1px rgba(212,175,55,.2);
  cursor: pointer; border: none;
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
  position: relative; z-index: 2;
}
#zx-fab-btn:hover { transform: scale(1.08); box-shadow: 0 8px 36px rgba(212,175,55,.6); }
#zx-fab-btn.open  { transform: rotate(45deg) scale(1.05); }

/* ── Menu ── */
#zx-fab-menu {
  position: absolute; bottom: 64px; right: 0;
  display: flex; flex-direction: column; gap: 10px;
  align-items: flex-end;
  pointer-events: none; opacity: 0;
  transform: translateY(12px) scale(.95);
  transition: opacity .25s ease, transform .25s ease;
}
#zx-fab-menu.open {
  opacity: 1; transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* ── Menu items ── */
.fab-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px;
  background: #141414;
  border: 1px solid rgba(212,175,55,.28);
  border-radius: 99px;
  font-size: 13px; color: #f5f5f0;
  cursor: pointer; white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,.5);
  transition: all .18s ease;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif; font-weight: 500;
  /* stagger animation */
  opacity: 0; transform: translateY(8px);
  animation: none;
}
#zx-fab-menu.open .fab-item {
  animation: fabItemIn .25s ease forwards;
}
#zx-fab-menu.open .fab-item:nth-child(1) { animation-delay: .00s; }
#zx-fab-menu.open .fab-item:nth-child(2) { animation-delay: .04s; }
#zx-fab-menu.open .fab-item:nth-child(3) { animation-delay: .08s; }
#zx-fab-menu.open .fab-item:nth-child(4) { animation-delay: .12s; }
#zx-fab-menu.open .fab-item:nth-child(5) { animation-delay: .16s; }
@keyframes fabItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fab-item:hover {
  background: #1a1a1a;
  border-color: rgba(212,175,55,.55);
  color: #D4AF37;
}
.fab-item .fi-icon { font-size: 16px; flex-shrink: 0; }
.fab-item .fi-label { flex: 1; }
.fab-item .fi-kbd {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 9px; color: #333328; margin-left: 4px;
}

/* ── Tooltip on compact hover ── */
#zx-fab-btn::after {
  content: 'Actions';
  position: absolute; right: 60px; top: 50%; transform: translateY(-50%);
  font-family: 'Rajdhani', sans-serif; font-size: 11px;
  background: #141414; border: 1px solid rgba(212,175,55,.3);
  color: #D4AF37; padding: 4px 10px; border-radius: 6px;
  white-space: nowrap; pointer-events: none;
  opacity: 0; transition: opacity .15s ease;
}
#zx-fab-btn:not(.open):hover::after { opacity: 1; }

/* ── Backdrop (mobile) ── */
#zx-fab-backdrop {
  display: none; position: fixed; inset: 0; z-index: 299;
}
#zx-fab-backdrop.open { display: block; }

/* ── Notification badge on FAB ── */
#zx-fab-notif {
  position: absolute; top: 2px; right: 2px;
  width: 14px; height: 14px; border-radius: 50%;
  background: #ff4d6d; border: 2px solid #080808;
  font-size: 8px; color: #fff; display: none;
  align-items: center; justify-content: center;
  font-family: 'Rajdhani', sans-serif; font-weight: 700;
  box-shadow: 0 0 8px rgba(255,77,109,.6);
}
#zx-fab-notif.show { display: flex; }

/* ── Keyboard shortcut hint ── */
#zx-fab-shortcut {
  position: absolute; bottom: -22px; right: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; color: #333328; white-space: nowrap; letter-spacing: .06em;
}
</style>

<!-- Backdrop -->
<div id="zx-fab-backdrop" onclick="ZX_FAB.close()"></div>

<!-- FAB Root -->
<div id="zx-fab-root">
  <!-- Menu (above button) -->
  <div id="zx-fab-menu">
    <a href="dashboard.html#generator" class="fab-item" onclick="ZX_FAB.close()">
      <span class="fi-icon">✦</span>
      <span class="fi-label">New Content</span>
      <span class="fi-kbd">G</span>
    </a>
    <a href="dashboard.html#seo" class="fab-item" onclick="ZX_FAB.close()">
      <span class="fi-icon">🔍</span>
      <span class="fi-label">Quick SEO</span>
      <span class="fi-kbd">S</span>
    </a>
    <a href="billing.html" class="fab-item" onclick="ZX_FAB.close()">
      <span class="fi-icon">⬡</span>
      <span class="fi-label">Buy Tokens</span>
      <span class="fi-kbd">T</span>
    </a>
    <a href="settings.html" class="fab-item" onclick="ZX_FAB.close()">
      <span class="fi-icon">⚙️</span>
      <span class="fi-label">Settings</span>
      <span class="fi-kbd">P</span>
    </a>
    <a href="dashboard.html#contact" class="fab-item" onclick="ZX_FAB.close()">
      <span class="fi-icon">✉️</span>
      <span class="fi-label">Support</span>
      <span class="fi-kbd">H</span>
    </a>
  </div>

  <!-- Main FAB button -->
  <button id="zx-fab-btn" onclick="ZX_FAB.toggle()" title="Quick Actions">
    ✦
    <span id="zx-fab-notif"></span>
  </button>

  <span id="zx-fab-shortcut">Alt+A</span>
</div>
`;

  /* ── Inject ── */
  document.body.insertAdjacentHTML('beforeend', fabHTML);

  /* ── Controller ── */
  const ZX_FAB = window.ZX_FAB = {
    _open: false,

    toggle() {
      this._open ? this.close() : this.open();
    },
    open() {
      this._open = true;
      document.getElementById('zx-fab-btn').classList.add('open');
      document.getElementById('zx-fab-menu').classList.add('open');
      document.getElementById('zx-fab-backdrop').classList.add('open');
    },
    close() {
      this._open = false;
      document.getElementById('zx-fab-btn').classList.remove('open');
      document.getElementById('zx-fab-menu').classList.remove('open');
      document.getElementById('zx-fab-backdrop').classList.remove('open');
    },
    /* Show notification badge */
    notify(count) {
      const n = document.getElementById('zx-fab-notif');
      if (count > 0) {
        n.textContent = count > 9 ? '9+' : count;
        n.classList.add('show');
      } else {
        n.classList.remove('show');
      }
    }
  };

  /* ── Keyboard shortcut: Alt+A ── */
  document.addEventListener('keydown', function(e) {
    /* Alt+A = toggle FAB menu */
    if (e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      ZX_FAB.toggle();
      return;
    }
    /* Quick actions (only when FAB is open) */
    if (!ZX_FAB._open) return;
    const map = {
      'g': 'dashboard.html#generator',
      's': 'dashboard.html#seo',
      't': 'billing.html',
      'p': 'settings.html',
      'h': 'dashboard.html#contact',
    };
    const dest = map[e.key.toLowerCase()];
    if (dest) { ZX_FAB.close(); window.location.assign(dest); }
    if (e.key === 'Escape') ZX_FAB.close();
  });

  /* ── Auto-notify: check changelog for unread ── */
  (function() {
    const lastSeen  = localStorage.getItem('zx_cl_seen') || '';
    const latestVer = 'v10.0.0';
    if (lastSeen !== latestVer) ZX_FAB.notify(1);
  })();

})();
