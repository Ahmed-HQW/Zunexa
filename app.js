/**
 * app.js — Zarix Coaching Main Application Logic
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *   • Supabase Auth (Sign Up / Sign In / Sign Out)
 *   • Supabase Realtime — Global public chat
 *   • AI chat command (@ai <question>) with tier-based answer depth
 *   • Q&A database rendering, filtering, search
 *   • UI state management (modals, panels, toast)
 *   • Scroll-reveal animations
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { qaDatabase, searchQA, getAnswerForTier } from './qa-database.js';

// ═══════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://xrldhfsytysznyyhwjlr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qtZyzLSPVYjH0yB0BJY8yg_2r2ct35F';

// Load Supabase client via CDN (compatible with static hosting / Vercel)
const { createClient } = await import(
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════
let currentUser   = null;  // Supabase User object
let currentTier   = 'free'; // 'free' | 'plus' | 'pro' | 'max'
let authMode      = 'login'; // 'login' | 'signup'
let chatChannel   = null;  // Supabase Realtime channel
let chatOpen      = false;
let activeCategory = 'all';
let allQAs        = [...qaDatabase]; // local copy for filtering

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  renderQAGrid(allQAs);
  initScrollReveal();
  initCounterAnimations();
  // Chat is initialized only when opened to avoid unnecessary connections
});

// ═══════════════════════════════════════════════════════════
// AUTH — Supabase Authentication
// ═══════════════════════════════════════════════════════════

/**
 * initAuth — check session on page load and update UI accordingly
 */
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    await onSignIn(session.user);
  }

  // Listen for auth state changes (sign-in, sign-out, token refresh)
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      await onSignIn(session.user);
    } else {
      onSignOut();
    }
  });
}

/**
 * onSignIn — called after successful authentication
 * @param {Object} user - Supabase User object
 */
async function onSignIn(user) {
  currentUser = user;

  // Fetch tier from localStorage (set by billing.html plan selection)
  // In production, this would come from a `profiles` table in Supabase
  const storedPlan = localStorage.getItem('zarix_plan') || 'free';
  currentTier = storedPlan;

  updateUIForAuth(true);
  showToast(`Welcome back!`, 'success');
}

/**
 * onSignOut — called after user signs out
 */
function onSignOut() {
  currentUser = null;
  currentTier = 'free';
  updateUIForAuth(false);
  showToast('Signed out successfully.', 'info');
}

/**
 * updateUIForAuth — toggle UI elements based on auth state
 * @param {boolean} isLoggedIn
 */
function updateUIForAuth(isLoggedIn) {
  const topbarAuth   = document.getElementById('topbarAuth');
  const topbarUser   = document.getElementById('topbarUser');
  const topbarAvatar = document.getElementById('topbarAvatar');
  const topbarName   = document.getElementById('topbarUserName');
  const topbarTier   = document.getElementById('topbarTierBadge');
  const sidebarLabel = document.getElementById('sidebarAuthLabel');
  const sidebarBtn   = document.getElementById('sidebarAuthBtn');
  const signOutBtn   = document.getElementById('signOutBtn');
  const signInBtn    = document.getElementById('signInProfileBtn');

  if (isLoggedIn && currentUser) {
    const email     = currentUser.email || '';
    const initials  = email[0]?.toUpperCase() || 'U';
    const displayName = currentUser.user_metadata?.full_name || email.split('@')[0];

    // Topbar
    if (topbarAuth) topbarAuth.style.display = 'none';
    if (topbarUser) topbarUser.style.display = 'block';
    if (topbarAvatar) topbarAvatar.textContent = initials;
    if (topbarName)   topbarName.textContent   = displayName;
    if (topbarTier) {
      topbarTier.textContent = currentTier;
      topbarTier.className   = `tier-badge ${currentTier}`;
    }

    // Sidebar
    if (sidebarLabel) sidebarLabel.textContent = 'Profile';
    if (sidebarBtn)   sidebarBtn.onclick = openProfile;

    // Profile section
    document.getElementById('profileAvatarLarge').textContent = initials;
    document.getElementById('profileName').textContent = displayName;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('profilePlan').textContent = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);

    if (signOutBtn) signOutBtn.style.display = 'inline-flex';
    if (signInBtn)  signInBtn.style.display  = 'none';

  } else {
    // Logged out state
    if (topbarAuth) topbarAuth.style.display = 'block';
    if (topbarUser) topbarUser.style.display = 'none';

    if (sidebarLabel) sidebarLabel.textContent = 'Sign In';
    if (sidebarBtn)   sidebarBtn.onclick = openModal;

    document.getElementById('profileName').textContent  = 'Not signed in';
    document.getElementById('profileEmail').textContent = '';
    document.getElementById('profilePlan').textContent  = 'Free';
    document.getElementById('profileAvatarLarge').textContent = 'Z';

    if (signOutBtn) signOutBtn.style.display = 'none';
    if (signInBtn)  signInBtn.style.display  = 'inline-flex';
  }
}

// ─── Auth Modal Functions ───────────────────────────────────

/** Open the auth modal */
window.openModal = function() {
  document.getElementById('authModal').classList.add('open');
};

/** Close the auth modal */
window.closeModal = function() {
  document.getElementById('authModal').classList.remove('open');
  clearAuthError();
};

/** Toggle between login and signup mode */
window.toggleAuthMode = function() {
  authMode = authMode === 'login' ? 'signup' : 'login';
  const isLogin = authMode === 'login';

  document.getElementById('authTitle').textContent    = isLogin ? 'Welcome Back' : 'Create Account';
  document.getElementById('authSub').textContent      = isLogin
    ? 'Sign in to unlock your personalized coaching.'
    : 'Join Zarix and start your coaching journey.';
  document.getElementById('authBtnText').textContent  = isLogin ? 'Sign In' : 'Sign Up';
  document.getElementById('authToggleText').textContent = isLogin ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('authToggleLink').textContent = isLogin ? 'Sign Up' : 'Sign In';
  document.getElementById('nameGroup').style.display  = isLogin ? 'none' : 'block';

  clearAuthError();
};

/** Handle auth form submission */
window.handleAuth = async function() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name     = document.getElementById('authName')?.value.trim();
  const btn      = document.getElementById('authSubmit');

  if (!email || !password) {
    showAuthError('Please fill in all fields.');
    return;
  }

  btn.disabled = true;
  btn.textContent = authMode === 'login' ? 'Signing in…' : 'Creating account…';

  try {
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || '' } }
      });
      if (error) throw error;
      showToast('Account created! Check your email to confirm.', 'success');
      closeModal();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeModal();
    }
  } catch (err) {
    showAuthError(err.message || 'Authentication failed. Please try again.');
  } finally {
    btn.disabled = false;
    document.getElementById('authBtnText').textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
  }
};

/** Sign out the current user */
window.signOut = async function() {
  await supabase.auth.signOut();
  showSection('home');
};

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.add('show');
}

function clearAuthError() {
  const el = document.getElementById('authError');
  el.classList.remove('show');
  el.textContent = '';
}

// ─── Allow Enter key to submit auth form ───────────────────
document.getElementById('authPassword')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') window.handleAuth();
});

// ═══════════════════════════════════════════════════════════
// GLOBAL CHAT — Supabase Realtime
// ═══════════════════════════════════════════════════════════

/** Toggle chat panel open/closed */
window.toggleChat = function() {
  const panel = document.getElementById('chatPanel');
  chatOpen = !chatOpen;

  if (chatOpen) {
    panel.classList.add('open');
    if (!chatChannel) initChat();
    setTimeout(() => scrollChatToBottom(), 100);
  } else {
    panel.classList.remove('open');
  }
};

/**
 * initChat — subscribe to Supabase Realtime broadcast channel
 * Uses broadcast (no DB required) so works without table setup.
 * For production: use a `messages` table with row-level security.
 */
function initChat() {
  const messagesEl = document.getElementById('chatMessages');
  const countEl    = document.getElementById('chatOnlineCount');

  // Clear loading indicator
  messagesEl.innerHTML = '';

  // Add welcome message
  addSystemMessage('Welcome to the Zarix Global Chat! Type @ai followed by a question to get AI coaching.');

  // Subscribe to broadcast channel
  chatChannel = supabase
    .channel('zarix-global-chat', {
      config: { broadcast: { self: true } }
    })
    .on('broadcast', { event: 'message' }, ({ payload }) => {
      renderChatMessage(payload);
      scrollChatToBottom();
    })
    .on('presence', { event: 'sync' }, () => {
      const state = chatChannel.presenceState();
      const count = Object.keys(state).length;
      if (countEl) countEl.textContent = `${count} online`;
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this user's presence
        const displayName = currentUser
          ? (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous')
          : 'Guest';
        await chatChannel.track({ user: displayName, online_at: new Date().toISOString() });
        if (countEl) countEl.textContent = '1 online';
      }
    });
}

/**
 * sendMessage — broadcast a chat message
 */
window.sendMessage = async function() {
  const input   = document.getElementById('chatInput');
  const content = input.value.trim();
  if (!content) return;

  // Require sign-in to send
  if (!currentUser) {
    showToast('Sign in to send messages.', 'info');
    openModal();
    return;
  }

  const displayName = currentUser.user_metadata?.full_name
    || currentUser.email?.split('@')[0]
    || 'Anonymous';

  const message = {
    id:          Date.now(),
    content,
    sender:      displayName,
    senderId:    currentUser.id,
    tier:        currentTier,
    timestamp:   new Date().toISOString(),
    isOwn:       true,
    isAI:        false,
  };

  // Clear input immediately
  input.value = '';
  autoResizeTextarea(input);

  // Broadcast to channel
  if (chatChannel) {
    await chatChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    });
  } else {
    // Fallback: render locally if channel not ready
    renderChatMessage(message);
  }

  // Handle @ai command
  if (content.toLowerCase().startsWith('@ai')) {
    const query = content.slice(3).trim();
    if (query) {
      handleAIQuery(query, displayName);
    }
  }
};

/**
 * handleAIQuery — search the QA database and broadcast the AI response
 * @param {string} query - The question after @ai
 * @param {string} asker - Name of the person who asked
 */
async function handleAIQuery(query, asker) {
  // Show typing indicator
  const typingId = showAITyping();

  // Simulate network delay for realism
  await sleep(1200 + Math.random() * 800);

  removeTyping(typingId);

  // Search the QA database
  const results = searchQA(query, 1);

  let aiContent;
  if (results.length > 0) {
    const entry = results[0];
    const answer = getAnswerForTier(entry, currentTier);
    const tierLabel = tierDisplayLabel(currentTier);

    aiContent = `[${tierLabel} Response] Q: "${entry.question}"\n\n${answer}`;
    if (currentTier !== 'max') {
      aiContent += `\n\n— Upgrade to Max for the full ZARIX Blueprint response.`;
    }
  } else {
    aiContent = `I searched my knowledge base for "${query}" but couldn't find an exact match. Try asking about: strength training, running endurance, boxing footwork, calisthenics skills, nutrition, or recovery.`;
  }

  // Broadcast the AI response
  const aiMessage = {
    id:        Date.now() + 1,
    content:   aiContent,
    sender:    'Zarix AI',
    senderId:  'ai-bot',
    tier:      currentTier,
    timestamp: new Date().toISOString(),
    isOwn:     false,
    isAI:      true,
    asker,
  };

  if (chatChannel) {
    await chatChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: aiMessage,
    });
  } else {
    renderChatMessage(aiMessage);
  }
}

/**
 * renderChatMessage — build and append a message bubble
 * @param {Object} msg - message payload
 */
function renderChatMessage(msg) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const isOwn = msg.senderId === currentUser?.id;
  const time  = formatChatTime(msg.timestamp);
  const initials = msg.isAI ? 'AI' : (msg.sender?.[0] || 'U').toUpperCase();

  const wrapper = document.createElement('div');
  wrapper.className = `chat-msg ${isOwn ? 'own' : ''}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = `chat-avatar ${msg.isAI ? 'ai-avatar' : ''}`;
  avatar.textContent = initials;

  // Bubble content
  const bubbleWrap = document.createElement('div');
  bubbleWrap.style.display = 'flex';
  bubbleWrap.style.flexDirection = 'column';
  bubbleWrap.style.alignItems = isOwn ? 'flex-end' : 'flex-start';
  bubbleWrap.style.maxWidth = '80%';

  // Sender name (not for own messages)
  if (!isOwn) {
    const senderEl = document.createElement('div');
    senderEl.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px;';
    senderEl.textContent = msg.sender;

    if (msg.tier && !msg.isAI) {
      const badge = document.createElement('span');
      badge.className = `tier-badge ${msg.tier}`;
      badge.textContent = msg.tier;
      senderEl.appendChild(badge);
    }
    bubbleWrap.appendChild(senderEl);
  }

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${msg.isAI ? 'ai-bubble' : ''}`;

  if (msg.isAI) {
    const aiBadge = document.createElement('div');
    aiBadge.className = 'ai-badge';
    aiBadge.textContent = 'Zarix AI';
    bubble.appendChild(aiBadge);

    if (msg.asker) {
      const askerNote = document.createElement('div');
      askerNote.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:8px;';
      askerNote.textContent = `Answering ${msg.asker}`;
      bubble.appendChild(askerNote);
    }
  }

  const textNode = document.createElement('div');
  textNode.style.whiteSpace = 'pre-wrap';
  textNode.textContent = msg.content;
  bubble.appendChild(textNode);
  bubbleWrap.appendChild(bubble);

  const timeEl = document.createElement('div');
  timeEl.className = 'chat-time';
  timeEl.textContent = time;
  bubbleWrap.appendChild(timeEl);

  if (isOwn) {
    wrapper.appendChild(bubbleWrap);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubbleWrap);
  }

  container.appendChild(wrapper);
}

/** Add a system/info message to the chat */
function addSystemMessage(text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const el = document.createElement('div');
  el.style.cssText = 'text-align:center;font-size:12px;color:var(--text-muted);padding:8px 0;';
  el.textContent = text;
  container.appendChild(el);
}

/** Show AI typing indicator, return unique ID */
function showAITyping() {
  const container = document.getElementById('chatMessages');
  const id = `typing-${Date.now()}`;
  const el = document.createElement('div');
  el.id = id;
  el.className = 'chat-msg';
  el.innerHTML = `
    <div class="chat-avatar ai-avatar">AI</div>
    <div style="display:flex;flex-direction:column;">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Zarix AI</div>
      <div class="chat-bubble ai-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  container?.appendChild(el);
  scrollChatToBottom();
  return id;
}

/** Remove typing indicator by ID */
function removeTyping(id) {
  document.getElementById(id)?.remove();
}

/** Scroll chat to latest message */
function scrollChatToBottom() {
  const el = document.getElementById('chatMessages');
  if (el) el.scrollTop = el.scrollHeight;
}

/** Handle Enter key in chat input */
window.handleChatKey = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    window.sendMessage();
  }
};

/** Auto-resize textarea */
window.autoResizeTextarea = function(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

// ═══════════════════════════════════════════════════════════
// Q&A GRID RENDERING
// ═══════════════════════════════════════════════════════════

/**
 * renderQAGrid — render Q&A cards into the grid
 * @param {Array} items - array of QA entries to render
 */
function renderQAGrid(items) {
  const grid = document.getElementById('qaGrid');
  if (!grid) return;

  // Remove skeleton cards
  grid.querySelectorAll('.skeleton-card').forEach(el => el.remove());

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No results found</h3>
        <p>Try a different category or search term.</p>
      </div>
    `;
    return;
  }

  // Remove existing cards (not skeletons)
  grid.querySelectorAll('.qa-card:not(.skeleton-card)').forEach(el => el.remove());

  items.forEach((entry, i) => {
    const card = document.createElement('div');
    card.className = 'qa-card glass-card reveal';
    card.style.transitionDelay = `${(i % 6) * 0.06}s`;
    card.setAttribute('data-id', entry.id);

    const tagsHTML = entry.tags.map(t => `<span class="qa-tag">${t}</span>`).join('');

    card.innerHTML = `
      <div class="qa-cat">${entry.category}</div>
      <div class="qa-question">${entry.question}</div>
      <div class="qa-preview">${entry.answerShort}</div>
      <div class="qa-tags">${tagsHTML}</div>
    `;

    card.addEventListener('click', () => openQA(entry));
    grid.appendChild(card);
  });

  // Re-run scroll reveal on newly added cards
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/**
 * openQA — show expanded Q&A modal
 * @param {Object} entry - QA entry
 */
window.openQA = function(entry) {
  const answer = getAnswerForTier(entry, currentTier);
  const tierLabel = tierDisplayLabel(currentTier);

  document.getElementById('qaExpCat').textContent = entry.category;
  document.getElementById('qaExpQ').textContent   = entry.question;
  document.getElementById('qaExpTierNote').textContent =
    currentTier === 'max'
      ? '★ ZARIX MAX — Full Blueprint Response'
      : `Showing ${tierLabel} answer. Upgrade to Max for full blueprint.`;
  document.getElementById('qaExpAnswer').textContent = answer;
  document.getElementById('qaExpanded').classList.add('open');
};

window.closeQA = function() {
  document.getElementById('qaExpanded').classList.remove('open');
};

// Close QA modal on backdrop click
document.getElementById('qaExpanded')?.addEventListener('click', function(e) {
  if (e.target === this) window.closeQA();
});

// Close auth modal on backdrop click
document.getElementById('authModal')?.addEventListener('click', function(e) {
  if (e.target === this) window.closeModal();
});

// ═══════════════════════════════════════════════════════════
// FILTERING & SEARCH
// ═══════════════════════════════════════════════════════════

/** Filter Q&A by category */
window.filterCategory = function(cat, btn) {
  // Update active chip
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');

  activeCategory = cat;
  const filtered = cat === 'all'
    ? allQAs
    : allQAs.filter(e => e.category === cat);

  renderQAGrid(filtered);
};

/** Search Q&A by text */
window.handleSearch = function(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    const filtered = activeCategory === 'all'
      ? allQAs
      : allQAs.filter(e => e.category === activeCategory);
    renderQAGrid(filtered);
    return;
  }

  const results = searchQA(q, 20);
  const filtered = activeCategory === 'all'
    ? results
    : results.filter(e => e.category === activeCategory);

  renderQAGrid(filtered);
};

/** Focus search input from sidebar shortcut */
window.focusSearch = function() {
  document.getElementById('searchInput')?.focus();
};

// ═══════════════════════════════════════════════════════════
// PAGE NAVIGATION (SPA-light)
// ═══════════════════════════════════════════════════════════

window.openProfile = function() {
  showSection('profile');
};

window.scrollToQA = function() {
  document.getElementById('qaSection')?.scrollIntoView({ behavior: 'smooth' });
};

/**
 * showSection — show/hide main content sections
 * @param {string} section - 'home' | 'profile'
 */
function showSection(section) {
  const qaSection       = document.getElementById('qaSection');
  const heroSection     = document.getElementById('heroSection');
  const profileSection  = document.getElementById('profileSection');
  const mainFooter      = document.getElementById('mainFooter');

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  if (section === 'profile') {
    if (qaSection)    qaSection.style.display    = 'none';
    if (heroSection)  heroSection.style.display  = 'none';
    if (mainFooter)   mainFooter.style.display   = 'none';
    if (profileSection) profileSection.style.display = 'block';
  } else {
    if (qaSection)    qaSection.style.display    = 'block';
    if (heroSection)  heroSection.style.display  = 'flex';
    if (mainFooter)   mainFooter.style.display   = 'block';
    if (profileSection) profileSection.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

/**
 * showToast — display a toast notification
 * @param {string} msg  - Message text
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - ms before auto-dismiss (default 3500)
 */
window.showToast = function(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = (icons[type] || icons.info) + `<span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ═══════════════════════════════════════════════════════════
// SCROLL REVEAL ANIMATION
// ═══════════════════════════════════════════════════════════

let revealObserver;

function initScrollReveal() {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ═══════════════════════════════════════════════════════════
// COUNTER ANIMATIONS (stats bar)
// ═══════════════════════════════════════════════════════════

function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const target = parseInt(el.dataset.count, 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));
}

function animateCounter(el, target) {
  const duration = 1500;
  const start    = performance.now();
  const update   = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════════════
// MOBILE SIDEBAR TOGGLE
// ═══════════════════════════════════════════════════════════

window.toggleSidebar = function() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
};

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/** Sleep for n milliseconds */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Format ISO timestamp to readable time */
function formatChatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Get display label for a tier */
function tierDisplayLabel(tier) {
  const labels = { free: 'Free', plus: 'Plus', pro: 'Pro', max: 'Max ★' };
  return labels[tier] || 'Free';
}

// Show mobile menu button on small screens
if (window.innerWidth <= 600) {
  const btn = document.getElementById('mobileMenuBtn');
  if (btn) btn.style.display = 'flex';
}
