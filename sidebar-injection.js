(function() {
  'use strict';

  /* ── Guard: skip on auth page ── */
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  if (currentFile === 'index.html' || currentFile === '') {
    console.log('[Zunexa Guard] Auth page detected. Sidebar injection disabled.');
    return;
  }

  /* ── Guard: skip if already injected ── */
  if (document.getElementById('zx-global-sidebar')) return;

  /* ── Domain whitelist check ── */
  const hostname = window.location.hostname;
  const ALLOWED  = ['localhost', '127.0.0.1', '', 'zunexa.com'];
  const isVercel = hostname.endsWith('.vercel.app');
  const isCustom = ALLOWED.includes(hostname);
  if (!isVercel && !isCustom) {
    console.warn('[Zunexa] Unrecognized domain — sidebar in read-only mode.');
  }

  /* ── 1. Read user from localStorage ── */
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('zx_user') || '{}'); }
    catch { return {}; }
  })();

  const username    = user.username   || user.first_name || 'User';
  const plan        = (user.plan      || 'free').toLowerCase();
  const tokens      = user.tokens     ?? 0;
  const avatarUrl   = user.avatar_url || '';
  const currentPage = location.pathname.split('/').pop() || 'dashboard.html';

  /* ── 2. Plan badge map ── */
  const PLAN_MAP = {
    free:   { label: 'Free',   cls: 'badge-free' },
    plus:   { label: 'Plus',   cls: 'badge-plus' },
    pro:    { label: 'Pro',    cls: 'badge-pro'  },
    senior: { label: 'Senior', cls: 'badge-senior' },
    owner:  { label: 'Owner',  cls: 'badge-owner'  },
  };
  const planInfo = PLAN_MAP[plan] || PLAN_MAP.free;

  /* ── 3. Nav items config ── */
  const NAV_ITEMS = [
    { icon: '⊞',  label: 'Dashboard',    href: 'dashboard.html',    section: 'main' },
    { icon: '✦',  label: 'Generator',    href: 'dashboard.html#generator', section: 'main' },
    { icon: '📊', label: 'Analytics',    href: 'dashboard.html#analytics', section: 'main' },
    { icon: '📄', label: 'SEO Tool',     href: 'dashboard.html#seo',       section: 'main' },
    { icon: '👥', label: 'Accounts',     href: 'pro_accounts.html',  section: 'main' },
    { icon: '🎯', label: 'Affiliate',    href: 'dashboard.html#affiliate', section: 'tools' },
    { icon: '📋', label: 'Docs',         href: 'dashboard.html#docs',      section: 'tools' },
    { icon: '⚙️', label: 'Settings',     href: 'settings.html',      section: 'tools' },
    { icon: '💳', label: 'Billing',      href: 'billing.html',       section: 'tools' },
    { icon: '📜', label: 'Changelog',    href: 'changelog.html',     section: 'info'  },
    { icon: '✉️', label: 'Contact',      href: 'dashboard.html#contact',   section: 'info'  },
  ];

  /* ── 4. Build nav items HTML ── */
  function buildNavItem(item) {
    const isActive = currentPage === item.href || currentPage === item.href.split('#')[0];
    return `
      <a href="${item.href}" class="zx-nav-item${isActive ? ' nav-active' : ''}" title="${item.label}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
        ${isActive ? '<span class="nav-pip"></span>' : ''}
      </a>`;
  }

  const navMain  = NAV_ITEMS.filter(i => i.section === 'main').map(buildNavItem).join('');
  const navTools = NAV_ITEMS.filter(i => i.section === 'tools').map(buildNavItem).join('');
  const navInfo  = NAV_ITEMS.filter(i => i.section === 'info').map(buildNavItem).join('');

  /* ── 5. Avatar markup ── */
  const avatarInner = avatarUrl
    ? `<img src="${avatarUrl}" alt="avatar" onerror="this.style.display='none'">`
    : `<span>${(username[0] || 'U').toUpperCase()}</span>`;

  /* ── 6. Full sidebar HTML ── */
  const sidebarHTML = `
<style id="zx-sidebar-styles">
/* ─ Sidebar Shell ─ */
#zx-global-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-w, 240px);
  background: #0e0e0e;
  border-right: 1px solid rgba(212,175,55,.14);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width .25s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  box-shadow: 2px 0 24px rgba(0,0,0,.6);
}
body.sidebar-compact #zx-global-sidebar { width: 64px; }
body.sidebar-mobile-open #zx-global-sidebar { transform: translateX(0) !important; }

/* ─ Logo ─ */
.zx-sb-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(36,36,36,.8);
  flex-shrink: 0;
  min-height: 64px;
  overflow: hidden;
}
.zx-sb-logo-hex {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #D4AF37, #8a7022);
  display: grid; place-items: center;
  font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: #000;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(212,175,55,.3);
}
.zx-sb-logo-text {
  font-family: 'Cinzel', serif; font-size: 17px; font-weight: 700;
  color: #D4AF37; letter-spacing: .08em; white-space: nowrap;
  opacity: 1; transition: opacity .2s;
}
body.sidebar-compact .zx-sb-logo-text { opacity: 0; pointer-events: none; }

/* ─ Nav ─ */
.zx-sb-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 8px; }
.zx-sb-nav::-webkit-scrollbar { width: 3px; }
.zx-sb-nav::-webkit-scrollbar-thumb { background: rgba(212,175,55,.2); }
.zx-sb-section-label {
  font-size: 9px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
  color: #333328; padding: 8px 10px 4px; white-space: nowrap;
  opacity: 1; transition: opacity .2s;
}
body.sidebar-compact .zx-sb-section-label { opacity: 0; height: 0; padding: 0; overflow: hidden; }

.zx-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px;
  font-size: 13px; color: #9a9a8a;
  transition: all .18s ease;
  text-decoration: none; position: relative; white-space: nowrap;
  margin-bottom: 1px;
}
.zx-nav-item:hover { background: rgba(212,175,55,.06); color: #D4AF37; }
.zx-nav-item.nav-active {
  background: rgba(212,175,55,.1);
  color: #D4AF37;
  border: 1px solid rgba(212,175,55,.2);
}
.nav-icon  { font-size: 16px; flex-shrink: 0; width: 22px; text-align: center; }
.nav-label { white-space: nowrap; overflow: hidden; opacity: 1; transition: opacity .2s; font-family: 'Rajdhani', sans-serif; font-weight: 500; }
body.sidebar-compact .nav-label { opacity: 0; width: 0; overflow: hidden; }
.nav-pip {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  width: 5px; height: 5px; border-radius: 50%; background: #D4AF37;
  box-shadow: 0 0 8px rgba(212,175,55,.8);
  opacity: 1; transition: opacity .2s;
}
body.sidebar-compact .nav-pip { opacity: 0; }

/* ─ User Footer ─ */
.zx-sb-user {
  padding: 12px 8px;
  border-top: 1px solid rgba(36,36,36,.8);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0; overflow: hidden;
}
.zx-sb-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #8a7022, #D4AF37);
  border: 2px solid rgba(212,175,55,.35);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; color: #000;
  overflow: hidden;
}
.zx-sb-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.zx-sb-user-info { flex: 1; overflow: hidden; opacity: 1; transition: opacity .2s; min-width: 0; }
body.sidebar-compact .zx-sb-user-info { opacity: 0; width: 0; overflow: hidden; }
.zx-sb-username { font-size: 13px; font-weight: 600; color: #f5f5f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.zx-sb-plan-row { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.zx-sb-plan-badge {
  font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 99px;
}
.zx-sb-tokens { font-size: 10px; color: #555548; }

.zx-sb-logout {
  width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
  background: transparent; border: 1px solid rgba(255,77,109,.2);
  color: #ff4d6d; font-size: 14px; display: grid; place-items: center;
  cursor: pointer; transition: all .18s ease;
  opacity: 1; transition: opacity .2s, background .18s, border .18s;
}
.zx-sb-logout:hover { background: rgba(255,77,109,.1); border-color: rgba(255,77,109,.5); }
body.sidebar-compact .zx-sb-logout { opacity: 0; pointer-events: none; }

/* ─ Compact toggle btn ─ */
.zx-sb-toggle {
  position: absolute; right: -12px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; border-radius: 50%;
  background: #141414; border: 1px solid rgba(212,175,55,.3);
  color: #D4AF37; font-size: 11px; display: grid; place-items: center;
  cursor: pointer; z-index: 10; transition: all .18s;
}
.zx-sb-toggle:hover { background: rgba(212,175,55,.1); border-color: #D4AF37; }

/* ─ Mobile overlay ─ */
#zx-sb-overlay {
  display: none; position: fixed; inset: 0; z-index: 99;
  background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
}
body.sidebar-mobile-open #zx-sb-overlay { display: block; }

/* ─ Top Navbar ─ */
#zx-global-navbar {
  position: fixed;
  top: 0; left: var(--sidebar-w, 240px); right: 0;
  height: 64px;
  background: rgba(8,8,8,.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(36,36,36,.8);
  display: flex; align-items: center;
  padding: 0 20px;
  gap: 16px;
  z-index: 99;
  transition: left .25s cubic-bezier(.4,0,.2,1);
}
body.sidebar-compact #zx-global-navbar { left: 64px; }

.zx-nb-burger {
  display: none; flex-direction: column; gap: 4px;
  cursor: pointer; padding: 8px; border: none; background: none;
}
.zx-nb-burger span {
  display: block; width: 20px; height: 2px;
  background: #9a9a8a; border-radius: 2px; transition: all .2s;
}
@media(max-width:768px){
  #zx-global-sidebar { transform: translateX(-100%); width: 240px !important; }
  #zx-global-navbar  { left: 0 !important; }
  .zx-nb-burger      { display: flex; }
}

.zx-nb-breadcrumb {
  flex: 1;
  font-family: 'Cinzel', serif;
  font-size: 13px; color: #555548; letter-spacing: .06em;
}
.zx-nb-breadcrumb .crumb-current { color: #D4AF37; }

.zx-nb-actions { display: flex; align-items: center; gap: 8px; }
.zx-nb-btn {
  width: 36px; height: 36px; border-radius: 8px;
  background: #141414; border: 1px solid #242424;
  color: #9a9a8a; font-size: 15px; display: grid; place-items: center;
  cursor: pointer; transition: all .18s;
  position: relative; text-decoration: none;
}
.zx-nb-btn:hover { border-color: rgba(212,175,55,.3); color: #D4AF37; }
.zx-nb-notif-dot {
  position: absolute; top: 6px; right: 6px;
  width: 6px; height: 6px; border-radius: 50%; background: #D4AF37;
  box-shadow: 0 0 6px rgba(212,175,55,.8);
  animation: zx-notif-pulse 2s ease-in-out infinite;
}
@keyframes zx-notif-pulse {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.3); }
}

/* ─ Body offset ─ */
body { padding-left: var(--sidebar-w, 240px); padding-top: 64px; }
body.sidebar-compact { padding-left: 64px; }
@media(max-width:768px){ body { padding-left: 0; } }

/* ─ Plan badge colors in sidebar ─ */
.plan-badge-free   { background: rgba(155,155,155,.12); color: #888;    border: 1px solid #444; }
.plan-badge-plus   { background: rgba(91,141,238,.12);  color: #5b8dee; border: 1px solid rgba(91,141,238,.3); }
.plan-badge-pro    { background: rgba(212,175,55,.15);  color: #D4AF37; border: 1px solid rgba(212,175,55,.35); }
.plan-badge-senior { background: rgba(167,139,250,.12); color: #a78bfa; border: 1px solid rgba(167,139,250,.3); }
.plan-badge-owner  { background: rgba(212,175,55,.25);  color: #D4AF37; border: 1px solid #D4AF37; }
</style>

<!-- Sidebar Overlay (mobile) -->
<div id="zx-sb-overlay" onclick="ZX_SB.closeMobile()"></div>

<!-- Global Sidebar -->
<div id="zx-global-sidebar">
  <!-- Logo -->
  <div class="zx-sb-logo">
    <div class="zx-sb-logo-hex">Z</div>
    <span class="zx-sb-logo-text">ZUNEXA</span>
  </div>

  <!-- Compact toggle -->
  <button class="zx-sb-toggle" onclick="ZX_SB.toggleCompact()" title="Toggle sidebar">⟪</button>

  <!-- Nav -->
  <nav class="zx-sb-nav">
    <div class="zx-sb-section-label">MAIN</div>
    ${navMain}

    <div class="zx-sb-section-label" style="margin-top:8px">TOOLS</div>
    ${navTools}

    <div class="zx-sb-section-label" style="margin-top:8px">INFO</div>
    ${navInfo}
  </nav>

  <!-- User footer -->
  <div class="zx-sb-user">
    <div class="zx-sb-avatar">${avatarInner}</div>
    <div class="zx-sb-user-info">
      <div class="zx-sb-username">${username}</div>
      <div class="zx-sb-plan-row">
        <span class="zx-sb-plan-badge plan-badge-${plan}">${planInfo.label}</span>
        <span class="zx-sb-tokens">⬡ ${tokens}</span>
      </div>
    </div>
    <button class="zx-sb-logout" onclick="ZX_SB.logout()" title="Sign out">⏻</button>
  </div>
</div>

<!-- Global Navbar -->
<div id="zx-global-navbar">
  <button class="zx-nb-burger" onclick="ZX_SB.openMobile()">
    <span></span><span></span><span></span>
  </button>

  <div class="zx-nb-breadcrumb">
    ZUNEXA &rsaquo; <span class="crumb-current" id="zx-nb-crumb">—</span>
  </div>

  <div class="zx-nb-actions">
    <!-- Changelog notifications -->
    <a href="changelog.html" class="zx-nb-btn" title="What's new">
      🔔 <span class="zx-nb-notif-dot"></span>
    </a>
    <!-- Settings shortcut -->
    <a href="settings.html" class="zx-nb-btn" title="Settings">⚙️</a>
    <!-- Billing shortcut -->
    <a href="billing.html" class="zx-nb-btn" title="Billing">💳</a>
  </div>
</div>
`;

  /* ── 7. Inject into DOM ── */
  document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

  /* ── 8. Set breadcrumb ── */
  const BREADCRUMB_MAP = {
    'dashboard.html':    'Dashboard',
    'changelog.html':    'Changelog',
    'pro_accounts.html': 'Pro Accounts',
    'settings.html':     'Settings',
    'billing.html':      'Billing',
    'index.html':        'Sign In',
  };
  const crumb = document.getElementById('zx-nb-crumb');
  if (crumb) crumb.textContent = BREADCRUMB_MAP[currentPage] || document.title || '—';

  /* ── 9. Toggle compact state ── */
  const ZX_SB = window.ZX_SB = {
    toggleCompact() {
      const compact = document.body.classList.toggle('sidebar-compact');
      localStorage.setItem('zx_sb_compact', compact ? '1' : '0');
      const btn = document.querySelector('.zx-sb-toggle');
      if (btn) btn.textContent = compact ? '⟫' : '⟪';
    },
    openMobile() {
      document.body.classList.add('sidebar-mobile-open');
    },
    closeMobile() {
      document.body.classList.remove('sidebar-mobile-open');
    },
    logout() {
      try {
        // Supabase sign-out if client available
        if (window._SB && window._SB.auth) {
          window._SB.auth.signOut();
        }
      } catch(_) {}
      localStorage.removeItem('zx_user');
      sessionStorage.clear();
      window.location.replace('index.html');
    }
  };

  /* ── 10. Restore compact preference ── */
  if (localStorage.getItem('zx_sb_compact') === '1') {
    document.body.classList.add('sidebar-compact');
    const btn = document.querySelector('.zx-sb-toggle');
    if (btn) btn.textContent = '⟫';
  }

  /* ── 11. Page transition on nav click ── */
  document.querySelectorAll('.zx-nav-item').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href.startsWith('#') || href === currentPage) return;
      e.preventDefault();
      document.body.style.transition = 'opacity .2s ease';
      document.body.style.opacity = '0';
      setTimeout(() => window.location.assign(href), 200);
    });
  });

})();


/* ZX LOGO INTERACTION SYSTEM */
(function initLogoInteraction() { /* Logic for Toast and Titles */ })();

/* ══ ZX LOGO INTERACTION — Archon Core ══ */
(function initLogoInteraction() {
  const TITLES = [
    { ar: 'مرحباً، أنا مساعدك في Zunexa ✦',      en: 'Hi, I\'m your Zunexa assistant ✦'   },
    { ar: '✦ محرك أرقام المستقبل الرقمي',          en: '✦ The Engine of Your Digital Future' },
    { ar: '◈ نظام Aether-Kernel — في خدمتك',      en: '◈ Aether-Kernel System — At Your Service' },
    { ar: '⬡ ذكاء اصطناعي متخصص للمحتوى العربي', en: '⬡ AI Specialized in Arabic Content'  },
    { ar: '✦ Zunexa V10 — الجيل العاشر حاضر',     en: '✦ Zunexa V10 — Tenth Gen Is Here'    },
  ];

  const toastCSS = `
    <style id="zx-logo-toast-css">
    #zx-logo-toast {
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(20px);
      background: #0e0e0e; border: 1px solid rgba(212,175,55,.45);
      border-radius: 10px; padding: 14px 24px; z-index: 9998;
      font-family: 'Cinzel', serif; font-size: 13px; color: #D4AF37;
      text-align: center; min-width: 280px; max-width: 380px;
      box-shadow: 0 8px 40px rgba(0,0,0,.8), 0 0 0 1px rgba(212,175,55,.1);
      opacity: 0; pointer-events: none;
      transition: opacity .35s ease, transform .35s cubic-bezier(.34,1.56,.64,1);
    }
    #zx-logo-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    #zx-logo-toast .zt-icon { font-size: 22px; display: block; margin-bottom: 6px; animation: zx-float 3s ease-in-out infinite; }
    #zx-logo-toast .zt-sub { font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #555548; margin-top: 4px; letter-spacing: .08em; }
    #zx-logo-toast .zt-bar { height: 2px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); margin-top: 10px; border-radius: 99px; animation: zx-shimmer 2s linear infinite; background-size: 200% auto; }
    </style>
  `;
  if(!document.getElementById('zx-logo-toast-css')) {
     document.head.insertAdjacentHTML('beforeend', toastCSS);
  }

  if(!document.getElementById('zx-logo-toast')) {
      const toastEl = document.createElement('div');
      toastEl.id = 'zx-logo-toast';
      toastEl.innerHTML = `
        <span class="zt-icon">✦</span>
        <span id="zt-msg"></span>
        <div class="zt-sub" id="zt-sub">ZUNEXA · ARCHON ENGINE · V10</div>
        <div class="zt-bar"></div>
      `;
      document.body.appendChild(toastEl);
  }

  const toastEl = document.getElementById('zx-logo-toast');
  let _toastTimer  = null;
  let _titleTimer  = null;
  let _titleIndex  = 0;
  let _isShowing   = false;

  const lang = () => (localStorage.getItem('zx_lang') || 'ar') === 'en' ? 'en' : 'ar';

  function showToast(msgObj) {
    const msg = document.getElementById('zt-msg');
    if (msg) msg.textContent = msgObj[lang()];
    toastEl.classList.add('show');
    _isShowing = true;

    clearTimeout(_toastTimer);
    clearInterval(_titleTimer);

    _titleIndex = 0;
    _titleTimer = setInterval(() => {
      _titleIndex = (_titleIndex + 1) % TITLES.length;
      const m = document.getElementById('zt-msg');
      if (m) {
        m.style.opacity = '0';
        setTimeout(() => {
          m.textContent = TITLES[_titleIndex][lang()];
          m.style.transition = 'opacity .3s';
          m.style.opacity = '1';
        }, 150);
      }
    }, 2200);

    _toastTimer = setTimeout(hideToast, TITLES.length * 2200 + 500);
  }

  function hideToast() {
    if(toastEl) toastEl.classList.remove('show');
    clearInterval(_titleTimer);
    _isShowing = false;
  }

  function bindLogoClick() {
    const logo = document.getElementById('zx-logo')
               || document.querySelector('.zx-brand')
               || document.querySelector('.sidebar-brand')
               || document.querySelector('[data-zx-logo]');

    if (!logo) {
      setTimeout(bindLogoClick, 800);
      return;
    }

    logo.style.cursor = 'pointer';
    logo.title        = 'ZUNEXA AI Assistant';

    logo.addEventListener('click', function(e) {
      e.stopPropagation();
      if (_isShowing) { hideToast(); return; }
      showToast(TITLES[0]);

      logo.style.transition = 'transform .15s ease';
      logo.style.transform  = 'scale(1.12)';
      setTimeout(() => { logo.style.transform = 'scale(1)'; }, 200);
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _isShowing) hideToast(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLogoClick);
  } else {
    bindLogoClick();
  }
})();
