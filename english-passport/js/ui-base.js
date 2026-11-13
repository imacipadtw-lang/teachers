/* toast + confetti (shared by menus and games) */
(function () {
  const EP = window.EP, u = EP.u;
  EP.ui = EP.ui || {};
  let wrap = null;
  EP.ui.toast = function (msg, icon) {
    if (!wrap) { wrap = u.el('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(wrap); }
    const t = u.el('div', { class: 'toast' }, icon ? u.el('span', { style: { fontSize: '1.6rem' } }, icon) : null, u.el('span', {}, msg));
    wrap.appendChild(t); setTimeout(() => t.remove(), 3100);
  };
  EP.ui.confetti = function (n) {
    const cv = u.el('canvas', { class: 'confetti' }); document.body.appendChild(cv);
    const g = cv.getContext('2d'); const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
    const cs = ['#ffd43b', '#69db7c', '#4dabf7', '#f783ac', '#ff922b', '#b197fc'];
    const ps = Array.from({ length: n || 140 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: u.rand(-60, 60), vy: u.rand(120, 320), r: u.rand(0, 6.28), vr: u.rand(-6, 6), s: u.rand(6, 12), c: u.pick(cs) }));
    let last = performance.now(); const t0 = last;
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; g.clearRect(0, 0, W, H);
      for (const p of ps) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
      if (now - t0 < 3200) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  };
})();
