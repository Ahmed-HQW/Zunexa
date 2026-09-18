/* ══════════════════════════════════════════════════════
   ZUNEXA AUTH — UI helpers (toast, shake, password strength,
   tab switching, success/confirmation screens)

   Load order requirement: must load AFTER auth-supabase.js
   (uses _SB, PLAN_DISPLAY, FREE_PLAN, redeemPlanCodeIfAny) and
   AFTER the DOM (form markup) exists in the page.
════════════════════════════════════════════════════════ */

// ── 10-second post-failure lockout (client-side UX guard — see
//    auth-supabase.js header comment for why this is not real
//    rate limiting) ──
const LOCKOUT_MS = 10000;
const LOCKOUT_KEY = 'zx_signin_lock_until';

function lockRemainingMs(){
  const until = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  const rem = until - Date.now();
  return rem > 0 ? rem : 0;
}

let _lockTimer = null;
function applyLockoutUI(remainingMs){
  const btn = document.getElementById('si-submit');
  const label = btn.querySelector('.btn-label');
  btn.disabled = true;
  btn.classList.add('locked');
  clearInterval(_lockTimer);
  let remaining = Math.ceil(remainingMs / 1000);
  label.textContent = `Wait ${remaining}s…`;
  _lockTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(_lockTimer);
      sessionStorage.removeItem(LOCKOUT_KEY);
      btn.disabled = false;
      btn.classList.remove('locked');
      label.textContent = '✦  Enter Zunexa';
    } else {
      label.textContent = `Wait ${remaining}s…`;
    }
  }, 1000);
}
function startLockout(){
  sessionStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
  applyLockoutUI(LOCKOUT_MS);
}

document.addEventListener('DOMContentLoaded', () => {
  const rem = lockRemainingMs();
  if (rem > 0) applyLockoutUI(rem);

  const savedEmail = localStorage.getItem('zunexa_last_email');
  if (savedEmail) {
    document.getElementById('si-username').value = savedEmail;
    // Returning user with a saved email: jump straight to the password
    // field so sign-in is a single click/tap away.
    document.getElementById('si-password').focus();
  } else {
    document.getElementById('si-username').focus();
  }

  _SB.auth.getSession().then(({ data: { session } }) => {
    if (session) window.location.replace('ai.html');
  });
});

// ── Tab switch ──
function switchTab(tab){
  document.getElementById('form-signin').style.display = tab === 'signin' ? 'block' : 'none';
  document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('success-screen').style.display = 'none';
  document.querySelector('.auth-tabs').style.display = 'flex';
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-signin').setAttribute('aria-selected', tab === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('tab-signup').setAttribute('aria-selected', tab === 'signup');
  hideErr();
}

// ── Optional plan code field ──
function togglePlanCode(prefix){
  const wrap = document.getElementById(prefix + '-code-wrap');
  const toggle = document.getElementById(prefix + '-code-toggle');
  if (!wrap) return;
  const show = wrap.style.display === 'none';
  wrap.style.display = show ? '' : 'none';
  if (toggle) toggle.textContent = show ? '← Hide plan code' : 'Have a plan code? →';
}

// ── Plan code format check (cosmetic only — real validation is server-side) ──
function detectPlan(val, prefix){
  const code = val.trim().toUpperCase();
  const previewEl = document.getElementById(prefix + '-plan-preview');
  if (!previewEl) return;
  if (!code) { previewEl.className = 'plan-preview hidden'; return; }
  if (/^ZX-[A-Z0-9-]{3,20}$/.test(code)) {
    previewEl.className = 'plan-preview ok';
    previewEl.innerHTML = '<span>✓</span><span>Looks valid — verified after account creation</span>';
  } else {
    previewEl.className = 'plan-preview bad';
    previewEl.innerHTML = '<span>✕</span><span>Format should look like ZX-PLUS-XXXX</span>';
  }
}

// ── Error / toast / shake UI ──
function showErr(msg){ const b=document.getElementById('errBox'); const m=document.getElementById('errMsg'); if(b&&m){ m.textContent=msg; b.classList.add('show'); } }
function hideErr(){ const b=document.getElementById('errBox'); if(b) b.classList.remove('show'); }
function shakeField(id){ const el=document.getElementById(id); if(!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.style.borderColor='var(--red)'; setTimeout(()=>{ el.style.borderColor=''; el.classList.remove('shake'); },600); }
let _toastTimer;
function showToast(icon,msg){ const t=document.getElementById('toast'); document.getElementById('toast-icon').textContent=icon; document.getElementById('toast-msg').textContent=msg; t.classList.add('show'); clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>t.classList.remove('show'),3000); }
function togglePwdVisibility(inputId, iconEl){
  const el = document.getElementById(inputId);
  if (!el) return;
  const show = el.type === 'password';
  el.type = show ? 'text' : 'password';
  el.setAttribute('aria-label', show ? 'Password (visible)' : 'Password');
  if (iconEl) iconEl.style.opacity = show ? '1' : '.7';
}

// ── Password strength meter ──
document.getElementById('su-password').addEventListener('input', function(){
  const v = this.value;
  const rules = [
    { id:'r-len', ok: v.length >= 8 },
    { id:'r-upp', ok: /[A-Z]/.test(v) },
    { id:'r-num', ok: /[0-9]/.test(v) },
    { id:'r-sym', ok: /[^a-zA-Z0-9]/.test(v) },
  ];
  const score = rules.filter(r => r.ok).length;
  const bar = document.getElementById('pwd-bar');
  const label = document.getElementById('pwd-label');
  const colors = ['', '#ff4d6d', '#f59e0b', '#3ddc84', '#D4AF37'];
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Perfect ✦'];
  if (bar) { bar.style.width = (score/4*100) + '%'; bar.style.background = colors[score] || '#888'; }
  if (label) { label.textContent = v.length ? (labels[score] || '') : '— Enter password'; label.style.color = colors[score] || 'var(--text-muted)'; }
  rules.forEach(r => {
    const el = document.getElementById(r.id);
    if (el) { el.classList.toggle('ok', r.ok); el.classList.toggle('bad', v.length > 0 && !r.ok); }
  });
  const wrap = document.getElementById('zx-pwd-strength');
  if (wrap) wrap.classList.toggle('visible', v.length > 0);
});

// ── Email confirmation screen ──
let _pendingConfirmEmail = null;
let _resendCooldown = 0;

function showEmailConfirmation(name, email){
  ['form-signin','form-signup'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
  document.querySelector('.auth-tabs').style.display = 'none';
  document.getElementById('success-screen').style.display = 'block';

  document.getElementById('success-icon').textContent = '✉';
  document.getElementById('success-title').textContent = 'Almost there!';
  document.getElementById('success-name').innerHTML =
    `Hi ${escapeHtml(name)} 👋<br><span style="color:var(--text-muted);font-size:13px;font-weight:400">We sent an activation link to<br><b style="color:var(--gold)">${escapeHtml(email)}</b></span>`;
  document.getElementById('success-plan-badge').style.display = 'none';
  document.getElementById('redirect-msg').textContent = 'Open your email and click the activation link to sign in ✦';
  document.getElementById('progress-wrap').style.display = 'none';

  _pendingConfirmEmail = email;
  document.getElementById('resend-wrap').style.display = 'block';
}

async function resendConfirmation(){
  if (!_pendingConfirmEmail) return;
  if (Date.now() < _resendCooldown) { showToast('⏳', `Wait ${Math.ceil((_resendCooldown-Date.now())/1000)}s before resending`); return; }
  const { error } = await _SB.auth.resend({ type:'signup', email:_pendingConfirmEmail });
  if (error) { showToast('✕','Could not resend — please try again shortly.'); return; }
  _resendCooldown = Date.now() + 30000;
  showToast('✉','Confirmation email sent again — check your inbox/spam.');
}

// ── Success screen ──
function showSuccess(name, plan){
  ['form-signin','form-signup'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
  document.querySelector('.auth-tabs').style.display = 'none';
  document.getElementById('success-screen').style.display = 'block';

  document.getElementById('success-icon').textContent = '✓';
  document.getElementById('success-title').textContent = 'Welcome to Zunexa!';
  document.getElementById('redirect-msg').textContent = 'Redirecting to ai...';

  const progressWrap = document.getElementById('progress-wrap');
  progressWrap.style.display = '';
  const progressBar = document.getElementById('progress-bar');
  progressBar.style.transition = 'width .9s ease';
  progressBar.style.width = '0%';

  document.getElementById('success-name').textContent = `Hi, ${name} 👋`;
  const badge = document.getElementById('success-plan-badge');
  badge.style.display = '';
  badge.textContent = plan.label;
  badge.style.cssText = `background:${plan.color}22;border:1px solid ${plan.color}55;color:${plan.color};display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:99px;font-size:13px;font-weight:700;margin-bottom:20px;`;
  progressBar.style.transition = 'width .9s ease';
  requestAnimationFrame(() => { progressBar.style.width = '100%'; });
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
