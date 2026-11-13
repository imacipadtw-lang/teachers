/* bootstrap */
(function () {
  const EP = window.EP;
  function start() {
    try { EP.ui.show('home'); } catch (e) { console.error(e); document.getElementById('app').textContent = 'Error: ' + e.message; }
    // warm up all audio packs in the background
    setTimeout(() => EP.audio.ensureAll(), 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // keyboard: Escape closes modals
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = document.querySelector('.modal-back'); if (m) m.remove(); } });
})();
