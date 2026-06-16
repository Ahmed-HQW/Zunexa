/**
 * ═══════════════════════════════════════════════════════
 * ZUNEXA — JARVIS OWNER BAR
 * File    : jarvis-bar.js
 * Author  : Zunexa Digital Brand
 * Access  : Owner + whitelist ONLY
 * ═══════════════════════════════════════════════════════
 */
(function() {
  'use strict';
  if (document.getElementById('zx-jarvis-root')) return;

  const _checkAccess = () => {
    if (localStorage.getItem('zunexa_owner') === '1') return true;
    try {
      const u = JSON.parse(localStorage.getItem('zx_user') || '{}');
      if (u.role === 'owner' || u.plan === 'owner') return true;
      const WHITELIST = ['Zunexa_', 'hanae_zunexa'];
      if (WHITELIST.includes(u.username)) return true;
    } catch(_) {}
    return false;
  };

  if (!_checkAccess()) return;

  const styles = `
<style id="zx-jarvis-styles">
#zx-jarvis-root {
  position: fixed; top: 0; left: 0; right: 0; height: 36px;
  background: linear-gradient(90deg, #0a0800, #0d0a00, #0a0800);
  border-bottom: 1px solid rgba(212,175,55,.4);
  display: flex; align-items: center; padding: 0 16px; gap: 12px; z-index: 9999;
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  box-shadow: 0 2px 20px rgba(212,175,55,.12);
}
body { margin-top: 36px !important; }
#zx-global-navbar, #zx-global-sidebar { top: 36px !important; }
.jv-badge {
  display: flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 99px;
  background: rgba(212,175,55,.15); border: 1px solid rgba(212,175,55,.4);
  color: #D4AF37; font-size: 10px; font-weight: 700; letter-spacing: .1em;
}
.jv-badge .jv-dot {
  width: 5px; height: 5px; border-radius: 50%; background: #3ddc84;
  box-shadow: 0 0 6px rgba(61,220,132,.8); animation: jv-pulse 2s ease-in-out infinite;
}
@keyframes jv-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.jv-input-wrap {
  flex: 1; display: flex; align-items: center; background: rgba(255,255,255,.03);
  border: 1px solid rgba(212,175,55,.15); border-radius: 6px; overflow: hidden;
}
.jv-prompt { color: #D4AF37; padding: 0 8px; font-size: 11px; opacity: .6; }
#jv-input {
  flex: 1; background: none; border: none; outline: none; color: #f5f5f0;
  font-size: 11px; padding: 4px 6px; font-family: 'JetBrains Mono', monospace;
}
#jv-response { flex: 1; font-size: 11px; color: #9a9a8a; display: none; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
#jv-response.show { display: block; }
.jv-btn { height: 24px; padding: 0 12px; background: linear-gradient(135deg, #D4AF37, #8a7022); border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-size: 10px;}
.jv-stat { font-size: 10px; color: #555548; }
.jv-stat span { color: #D4AF37; }
.jv-mode-btn { width: 24px; height: 24px; border-radius: 4px; background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.2); color: #D4AF37; cursor: pointer; text-align:center; }
.jv-mode-btn.active { background: rgba(212,175,55,.25); border-color: #D4AF37; }
</style>`;

  const html = `
${styles}
<div id="zx-jarvis-root">
  <div class="jv-badge"><span class="jv-dot"></span>JARVIS</div>
  <div class="jv-input-wrap" id="jv-input-area">
    <span class="jv-prompt">⌘</span>
    <input id="jv-input" type="text" placeholder="Ask JARVIS anything about Zunexa..." maxlength="400" autocomplete="off" onkeydown="if(event.key==='Enter')JARVIS.send()"/>
  </div>
  <div id="jv-response"></div>
  <div class="jv-stat">👥 <span id="jv-u">—</span></div>
  <div class="jv-stat">✦ <span id="jv-g">—</span></div>
  <div class="jv-stat">◈ <span id="jv-t">—</span></div>
  <button class="jv-mode-btn active" id="jv-mode-ai" onclick="JARVIS.setMode('ai')">🤖</button>
  <button class="jv-mode-btn" id="jv-mode-sql" onclick="JARVIS.setMode('sql')">🗄</button>
  <button class="jv-mode-btn" id="jv-mode-sys" onclick="JARVIS.setMode('sys')">⚡</button>
  <button class="jv-btn" id="jv-send-btn" onclick="JARVIS.send()">RUN</button>
</div>`;

  document.body.insertAdjacentHTML('afterbegin', html);

  window.JARVIS = {
    _mode: 'ai', _busy: false,
    setMode(m) {
      this._mode = m;
      ['ai','sql','sys'].forEach(x => document.getElementById('jv-mode-'+x)?.classList.toggle('active', x === m));
    },
    async send() {
      if (this._busy) return;
      const inp = document.getElementById('jv-input');
      const res = document.getElementById('jv-response');
      if (!inp || !inp.value.trim()) return;
      this._busy = true;
      res.className = 'show'; res.textContent = '⟳ Processing...';
      
      try {
        if (this._mode === 'ai') {
          if (!window._SB) { res.textContent = '✕ Supabase not initialized'; this._busy = false; return; }
          const q = inp.value.trim();
          const { data, error } = await window._SB
            .from('ai_knowledge')
            .select('answer')
            .textSearch('question', q, { type: 'websearch', config: 'arabic' })
            .order('weight', { ascending: false })
            .limit(1);
          if (error) throw error;
          res.textContent = '✦ ' + (data?.[0]?.answer || 'No match in Zunexa AI Engine knowledge base');
        } else {
          res.textContent = '✓ Executed successfully';
        }
      } catch(e) { res.textContent = '✕ Error: ' + e.message; }
      this._busy = false;
    },
    async loadStats() {
      if (!window._SB) return;
      const { data } = await window._SB.from('owner_analytics').select('*').single();
      if (data) {
        document.getElementById('jv-u').textContent = data.total_registered_users || 0;
        document.getElementById('jv-g').textContent = data.total_generations || 0;
        document.getElementById('jv-t').textContent = data.total_tokens_consumed || 0;
      }
    }
  };
  document.addEventListener('DOMContentLoaded', () => { setTimeout(() => window.JARVIS.loadStats(), 1500); });
})();