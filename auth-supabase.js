/* ══════════════════════════════════════════════════════
   ZUNEXA AUTH — Supabase client + server-communication logic
   © Zunexa — All rights reserved

   Security notes (read before deploying):
   - The Supabase key below is the public "publishable"/anon key. It is
     DESIGNED to be visible in client-side code — that is not a leak.
     Real protection comes from Supabase Row Level Security (RLS)
     policies on every table, which must be verified server-side; no
     static HTML/JS file can enforce that on its own.
   - The 10s lockout in auth-ui.js is a client-side UX guard against
     casual brute forcing from a single browser tab. It slows down one
     script kiddie with one tab open — it is trivially bypassed by
     disabling JS or calling the API directly, so it is NOT a
     substitute for server-side rate limiting. Confirm in Supabase →
     Authentication → Rate Limits (and enable leaked-password
     protection) — this file cannot configure that for you.
   - Plan/tokens/role are never trusted from the client: they are only
     ever set via the redeem_plan_code RPC and DB triggers/policies.

   Rotation note: this is the ONLY file that should ever reference the
   Supabase URL/anon key directly. If you rotate the key, this is the
   one place to change it.

   Load order requirement: must load AFTER the supabase-js CDN script
   and BEFORE auth-ui.js (which calls _SB.auth.* on DOMContentLoaded).
════════════════════════════════════════════════════════ */

const _SB = supabase.createClient(
  'https://xrldhfsytysznyyhwjlr.supabase.co',
  'sb_publishable_qtZyzLSPVYjH0yB0BJY8yg_2r2ct35F'
);

// Use the current origin so OAuth + email-confirm redirects work
// identically on localhost, preview deployments, and production —
// no hardcoded domain to break in any environment.
const ZX_ORIGIN = window.location.origin;

/* ════════════════════════════════════════════════════════════
   GOOGLE ONE TAP / AUTO-SELECT
   ─────────────────────────────────────────────────────────────
   ⚠ REPLACE ME: this is a placeholder Client ID and will NOT work
   until you swap it for a real OAuth 2.0 Web Client ID from
   https://console.cloud.google.com/apis/credentials (the "Web
   application" type, with this site's origin(s) added under
   "Authorized JavaScript origins" — One Tap requires that, not a
   redirect URI). You also need the "Google" provider switched on
   in Supabase → Authentication → Providers, using that same
   Client ID/secret, so signInWithIdToken() below can verify it.

   How it works: GSI silently shows the "Continue as <name>" bubble
   for anyone with an active Google session in their browser/device.
   On tap, Google hands back a signed id_token; we pass that straight
   to Supabase (signInWithIdToken), which verifies it server-side and
   creates the session — no email/password typing, no redirect round
   trip like the classic OAuth button above.
════════════════════════════════════════════════════════════ */
const ZX_GOOGLE_CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';

async function handleGoogleOneTap(response) {
  if (!response || !response.credential) return;
  try {
    const { error } = await _SB.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });
    if (error) throw error;
    window.location.replace('ai.html');
  } catch (e) {
    console.warn('Google One Tap sign-in failed, falling back to the Google button', e);
    // Fail open: One Tap not configured yet (bad client ID, provider
    // off in Supabase, etc.) should never block sign-in entirely —
    // the classic "Google" OAuth button above still works normally.
  }
}

function initGoogleOneTap() {
  try {
    if (ZX_GOOGLE_CLIENT_ID.indexOf('REPLACE_WITH_YOUR') === 0) {
      console.warn('Google One Tap: placeholder Client ID still in place — skipping prompt until a real one is set.');
      return;
    }
    if (!(window.google && window.google.accounts && window.google.accounts.id)) return;
    // Don't prompt someone who's already mid-session or already signed in.
    _SB.auth.getSession().then(({ data }) => {
      if (data && data.session) return;
      window.google.accounts.id.initialize({
        client_id: ZX_GOOGLE_CLIENT_ID,
        callback: handleGoogleOneTap,
        auto_select: true,   // one tap for a returning user with one Google account
        cancel_on_tap_outside: false,
      });
      window.google.accounts.id.prompt(); // shows the One Tap bubble if eligible
    });
  } catch (e) {
    console.warn('Google One Tap: init skipped (best-effort)', e);
  }
}
// GSI's script tag is async; wait for it before initializing.
if (window.google && window.google.accounts) {
  initGoogleOneTap();
} else {
  window.addEventListener('load', initGoogleOneTap);
}

// ── Plan display labels (cosmetic only — the actual plan/tokens/role
//    are resolved server-side via the redeem_plan_code RPC) ──
const PLAN_DISPLAY = {
  Free:   { label:'○ Free Plan',   color:'#888'    },
  Plus:   { label:'⭐ Plus Plan',   color:'#5b8dee' },
  Pro:    { label:'✦ Pro Plan',    color:'#D4AF37' },
  Senior: { label:'◆ Senior Plan', color:'#a78bfa' },
};
const FREE_PLAN = PLAN_DISPLAY.Free;

// ── Redeem a plan code via secure server-side RPC (only with an active session) ──
async function redeemPlanCodeIfAny(codeVal){
  if (!codeVal || !codeVal.trim()) return null;
  try {
    const { data, error } = await _SB.rpc('redeem_plan_code', { p_code: codeVal.trim().toUpperCase() });
    if (error) {
      const messages = {
        invalid_code: 'Invalid code',
        code_inactive: 'This code is not active',
        code_expired: 'This code has expired',
        code_exhausted: 'This code has been fully redeemed',
        already_redeemed: 'You already redeemed a code',
      };
      showToast('✕', messages[error.message] || 'Could not activate code');
      return null;
    }
    return data; // { plan, tokens_bonus }
  } catch (e) { return null; }
}

// ── Sign In ──
async function handleSignIn(){
  hideErr();

  const waitMs = lockRemainingMs();
  if (waitMs) { showErr(`Too many attempts. Try again in ${Math.ceil(waitMs/1000)}s.`); return; }

  const email = document.getElementById('si-username').value.trim();
  const password = document.getElementById('si-password').value;
  const codeVal = document.getElementById('si-code').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { shakeField('si-username'); showToast('✕','Enter a valid email'); return; }
  if (!password) { shakeField('si-password'); showToast('✕','Enter your password'); return; }

  const btn = document.getElementById('si-submit');
  btn.disabled = true;
  btn.classList.add('loading');

  const { data, error } = await _SB.auth.signInWithPassword({ email, password });

  btn.classList.remove('loading');

  if (error) {
    btn.disabled = false;
    startLockout();
    shakeField('si-password');
    const msg = /email not confirmed/i.test(error.message)
      ? 'Please confirm your email first — check your inbox (and spam folder) for the activation link.'
      : /invalid login credentials/i.test(error.message)
      ? 'Incorrect email or password.'
      : 'Sign in failed — please try again.';
    showErr(msg);
    showToast('✕','Sign in failed');
    return;
  }

  localStorage.setItem('zunexa_last_email', email);
  localStorage.setItem('zunexa_remember', '1');
  let redeemed = null;
  if (codeVal && data.user) redeemed = await redeemPlanCodeIfAny(codeVal);
  const plan = redeemed ? (PLAN_DISPLAY[redeemed.plan] || FREE_PLAN) : FREE_PLAN;
  showSuccess(email, plan);
  // Sign-in is the hot path — go straight to ai.html, no artificial delay.
  window.location.replace('ai.html');
}

// ── Sign Up ──
async function handleSignUp(){
  hideErr();
  const fname = document.getElementById('su-fname').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const codeWrap = document.getElementById('su-code-wrap');
  const codeVal = (codeWrap && codeWrap.style.display !== 'none')
    ? (document.getElementById('su-code').value || '').trim()
    : '';

  if (!fname) { shakeField('su-fname'); showToast('✕','Enter your name'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { shakeField('su-email'); showToast('✕','Valid email required'); return; }
  if (password.length < 8) { shakeField('su-password'); showToast('✕','Min 8 characters'); return; }

  // Auto-generate a username from the email — no separate field to fill
  // in or validate; can be changed later in Settings.
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,16)
    + Math.floor(100 + Math.random()*900);

  const btn = document.getElementById('su-submit');
  btn.disabled = true;
  btn.classList.add('loading');

  const { data, error } = await _SB.auth.signUp({
    email, password,
    options: { data: { username, first_name: fname } }
  });

  btn.classList.remove('loading');
  btn.disabled = false;

  if (error) {
    const msg = /already registered/i.test(error.message)
      ? 'This email is already registered — try signing in instead.'
      : 'Could not create account — please try again.';
    showErr(msg);
    showToast('✕', msg);
    return;
  }

  // Only write to `profiles` when we actually have a session — with
  // email confirmation ON, data.session is null here and RLS will
  // reject the insert (no auth.uid() yet). That used to throw an
  // unhandled rejection and could strand the user on a blank/stuck
  // screen instead of showing "check your email". Guard it, and
  // never let a profile-write hiccup block the redirect to ai.html.
  if (data.user && data.session) {
    try {
      await _SB.from('profiles').upsert({
        id: data.user.id,
        username,
        first_name: fname,
        email,
        current_theme: 'zalij-dark',
      });
    } catch (e) { /* non-fatal — ai.html can self-heal the profile row on load */ }
  }

  let plan = FREE_PLAN;
  if (data.session) {
    if (codeVal) {
      const redeemed = await redeemPlanCodeIfAny(codeVal);
      if (redeemed) plan = PLAN_DISPLAY[redeemed.plan] || FREE_PLAN;
    }
    localStorage.setItem('zunexa_last_email', email);
    showSuccess(fname, plan);
    setTimeout(() => window.location.replace('ai.html'), 900);
  } else {
    // Email confirmation required — redeem the code on first ai
    // load instead (no session yet to call the RPC with).
    if (codeVal) localStorage.setItem('zx_pending_plan_code', codeVal);
    showEmailConfirmation(fname, email);
  }
}

// ── OAuth (Google / GitHub) ──
async function handleOAuth(provider){
  document.querySelectorAll('.btn-oauth, .btn-auth').forEach(b => { b.disabled = true; });
  // Redirect straight to ai.html on success — skip the sign-in page,
  // Supabase's own hash-token handler on ai.html/index.html finishes the job.
  const { error } = await _SB.auth.signInWithOAuth({
    provider,
    options: { redirectTo: ZX_ORIGIN + '/ai.html' }
  });
  if (error) {
    document.querySelectorAll('.btn-oauth, .btn-auth').forEach(b => { b.disabled = false; });
    const msg = /unsupported provider|provider is not enabled/i.test(error.message)
      ? `${provider} sign-in isn't set up yet — use email instead, or enable it in Supabase → Auth → Providers.`
      : `${provider} sign-in failed — please try again.`;
    showToast('✕', msg);
  }
}

// ── Fix localhost redirect after email confirm — intercepts the
//    Supabase token from the URL hash on any page it lands on ──
(async () => {
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace('#','?'));
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    if (access && refresh) {
      await _SB.auth.setSession({ access_token: access, refresh_token: refresh });
      window.location.replace(ZX_ORIGIN + '/ai.html');
    }
  }
})();
