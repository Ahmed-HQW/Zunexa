/* zunexa-ripple.js
   تأثير الريبل/الوميض الأبيض للأزرار — منقول حرفياً من ai.html
   بدون أي تغيير فالمنطق. يحمّل عبر: <script defer src="zunexa-ripple.js"></script> */
/* White ripple/glow feedback — purely additive UI polish, no app logic touched */
(function(){
  const RIPPLE_SEL = '.send-btn,.sb-upgrade,.sb-new,.mode-chip,.model-sel-btn,.modal-save,.off-btn,.lim-upgrade,.mini-ghost-btn,.code-btn,.attach-btn';
  document.addEventListener('pointerdown', function(e){
    const el = e.target.closest(RIPPLE_SEL);
    if (!el || el.disabled) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'zx-ripple';
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - rect.left - size / 2) + 'px';
    span.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  }, { passive: true });
})();
