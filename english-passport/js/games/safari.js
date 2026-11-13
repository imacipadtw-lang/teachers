/* Level 1 — Safari GO (inspired by Pokémon GO: find, throw, catch, collect)
 * Listen to the word, then flick the Catch Ball at the matching animal / vehicle.
 * The shrinking ring rewards good timing (Nice / Great / Excellent) like the original. */
(function () {
  const EP = window.EP, u = EP.u;
  EP.registerGame({
    id: 'safari', level: 1, icon: '🦁', title: 'Safari GO', titleZh: '狩獵捕捉大冒險',
    model: 'Pokémon GO（每週超過 2,000 萬人在玩，2025 年）',
    howZh: '聽英文單字，把捕捉球「往上滑」丟向正確的動物或交通工具！圈圈變小時丟中有額外加分。',
    howEn: 'Listen, then flick the ball at the right one. Throw when the ring is small for a bonus!',
    skills: ['listening', 'meaning'],
    start(ctx) {
      const root = ctx.root;
      root.style.background = 'linear-gradient(#ffcf8a 0%, #ffe9b5 38%, #b7e07a 38%, #7cc45a 100%)';
      const c = ctx.kit.canvas(root);
      const g = c.g; const parts = ctx.kit.particles();
      const top = u.el('div', { style: { position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', gap: '10px', alignItems: 'center' } });
      root.appendChild(top);
      const speakBtn = u.el('button', { class: 'btn purple small hidden', style: { position: 'absolute', right: '12px', bottom: '16px', zIndex: 6 } }, '🎤 Say it! 說說看 +50');
      root.appendChild(speakBtn);

      const items = ctx.items; let idx = 0; let creatures = []; let target = null; let ball = null; let busy = false; let t = 0;
      const W = () => c.w, H = () => c.h;
      const trees = Array.from({ length: 6 }, (_, i) => ({ x: (i + 0.5) / 6, y: 0.36 + Math.random() * 0.03, s: 40 + Math.random() * 30 }));

      function setupRound() {
        if (idx >= items.length) return finish();
        ctx.hud.progress(idx / items.length);
        target = items[idx];
        const n = ctx.difficulty === 'easy' ? 2 : ctx.difficulty === 'hard' ? 4 : 3;
        const opts = u.shuffle([target].concat(ctx.distractors(target, n - 1, { needPic: true })));
        creatures = opts.map((w, i) => ({
          w, pic: EP.pic(w) || '❓', bx: (i + 0.5) / opts.length, by: 0.55 + (i % 2) * 0.12,
          ph: Math.random() * 6, amp: 0.04 + Math.random() * 0.03, sp: 0.6 + Math.random() * 0.6,
          ring: 1, ringSp: 0.45 + Math.random() * 0.25, x: 0, y: 0, r: 0, state: 'idle', alpha: 0,
        }));
        top.innerHTML = '';
        const hideWord = ctx.difficulty === 'hard';
        top.appendChild(u.el('div', { class: 'prompt-card' },
          u.el('button', { class: 'say', onclick: () => ctx.say(target) }, '🔊'),
          u.el('div', { class: 'txt' }, hideWord ? 'Listen! 仔細聽' : `A wild “${target.word}” appeared!`)));
        speakBtn.classList.add('hidden');
        ctx.timeout(() => ctx.say(target), 350);
        busy = false;
      }
      function finish() { ctx.hud.progress(1); ctx.end(); }

      function layout(cr) {
        const s = Math.min(W(), H());
        cr.r = Math.max(34, s * 0.085);
        cr.x = cr.bx * W() + Math.sin(t * cr.sp + cr.ph) * cr.amp * W();
        cr.y = cr.by * H() + Math.cos(t * cr.sp * 1.3 + cr.ph) * 0.02 * H();
      }

      function throwAt(tx, ty, power) {
        if (busy || !target) return;
        busy = true; EP.sfx.whoosh();
        const sx = W() / 2, sy = H() - 60;
        ball = { sx, sy, tx, ty, p: 0, dur: 0.55 / (power || 1), x: sx, y: sy, spin: 0 };
      }
      function land() {
        const hit = creatures.find((cr) => cr.state === 'idle' && Math.hypot(cr.x - ball.tx, cr.y - ball.ty) < cr.r * 1.25);
        const bx = ball.tx, by = ball.ty; ball = null;
        if (!hit) { ctx.float(bx, by, 'Miss!', 'bad'); busy = false; return; }
        if (hit.w === target) {
          const ring = hit.ring; const bonus = ring < 0.35 ? ['Excellent!', 60] : ring < 0.6 ? ['Great!', 30] : ['Nice!', 0];
          hit.state = 'caught'; hit.catchT = 0;
          ctx.answer(target, true, { x: hit.x, y: hit.y - hit.r - 20, points: 100 + bonus[1] });
          ctx.float(hit.x, hit.y - hit.r - 60, bonus[0], 'good');
          parts.burst(hit.x, hit.y, null, 26);
          EP.me.stickers = EP.me.stickers || [];
          if (EP.speech.available && EP.settings.speakChecks) { speakBtn.classList.remove('hidden'); speakBtn.onclick = speakBonus; }
          ctx.timeout(next, 1500);
        } else {
          hit.state = 'flee'; hit.fleeT = 0;
          ctx.answer(target, false, { x: hit.x, y: hit.y - hit.r - 20, label: `That's ${hit.w.word}` });
          ctx.shake();
          ctx.timeout(async () => { await ctx.reveal(target); next(); }, 700);
        }
      }
      let speaking = false;
      async function speakBonus() {
        if (speaking) return; speaking = true; speakBtn.textContent = '👂 Listening… 請說';
        const w = items[idx - 1] || target;
        const r = await EP.speech.listen(w.word);
        speaking = false; speakBtn.textContent = '🎤 Say it! 說說看 +50'; speakBtn.classList.add('hidden');
        if (r.ok) { ctx.addScore(50); ctx.float(W() / 2, H() / 2, '🎤 +50 Great speaking!', 'good'); EP.sfx.coin(); EP.questEvent('speak', 1); }
        else if (!r.unsupported) ctx.toast(`I heard “${r.heard || '…'}”. Try next time! 下次再試`);
      }
      function next() { idx++; setupRound(); }

      // input: flick (swipe up) or tap a creature
      let start = null;
      ctx.on(c.cv, 'pointerdown', (e) => { const r = c.cv.getBoundingClientRect(); start = { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; });
      ctx.on(c.cv, 'pointerup', (e) => {
        if (!start) return; const r = c.cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        const dx = x - start.x, dy = y - start.y; const dist = Math.hypot(dx, dy);
        if (dist > 40 && dy < 0) {
          // project the flick direction to the creatures' row
          const sx = W() / 2, sy = H() - 60; const k = (sy - H() * 0.6) / Math.max(20, -dy);
          let tx = sx + dx * k, ty = H() * 0.6;
          const near = creatures.filter((cr) => cr.state === 'idle').sort((a, b) => Math.abs(a.x - tx) - Math.abs(b.x - tx))[0];
          if (near && Math.abs(near.x - tx) < near.r * 1.6) { tx = near.x; ty = near.y; }
          throwAt(tx, ty, u.clamp(dist / 160, 0.8, 1.6));
        } else {
          const hit = creatures.find((cr) => cr.state === 'idle' && Math.hypot(cr.x - x, cr.y - y) < cr.r * 1.3);
          if (hit) throwAt(hit.x, hit.y, 1);
        }
        start = null;
      });

      ctx.loop((dt) => {
        t += dt; parts.update(dt);
        g.clearRect(0, 0, W(), H());
        // background details
        for (const tr of trees) ctx.kit.emoji(g, '🌳', tr.x * W(), tr.y * H(), tr.s);
        ctx.kit.emoji(g, '☀️', W() * 0.88, H() * 0.12, 54);
        for (const cr of creatures) {
          layout(cr);
          cr.alpha = Math.min(1, cr.alpha + dt * 3);
          if (cr.state === 'idle') { cr.ring -= dt * cr.ringSp; if (cr.ring < 0.15) cr.ring = 1; }
          g.save(); g.globalAlpha = cr.alpha;
          let scale = 1, yoff = 0;
          if (cr.state === 'caught') { cr.catchT += dt; scale = Math.max(0, 1 - cr.catchT * 2.2); }
          if (cr.state === 'flee') { cr.fleeT += dt; yoff = -cr.fleeT * 400; g.globalAlpha = Math.max(0, 1 - cr.fleeT * 1.5); }
          // shadow
          g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(cr.x, cr.y + cr.r * 0.95, cr.r * 0.8, cr.r * 0.22, 0, 0, 6.3); g.fill();
          // catch ring
          if (cr.state === 'idle') {
            const col = cr.ring < 0.35 ? '#2f9e44' : cr.ring < 0.6 ? '#f59f00' : '#e03131';
            g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.arc(cr.x, cr.y, cr.r * (0.5 + cr.ring * 0.9), 0, 6.3); g.stroke();
            g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(cr.x, cr.y, cr.r * 1.45, 0, 6.3); g.stroke();
          }
          if (cr.pic.length <= 4 && /\p{Extended_Pictographic}/u.test(cr.pic)) ctx.kit.emoji(g, cr.pic, cr.x, cr.y + yoff, cr.r * 1.5 * scale);
          else ctx.kit.text(g, cr.w.zh, cr.x, cr.y + yoff, cr.r * 0.6 * scale, '#333', { stroke: '#fff' });
          g.restore();
          if (cr.state === 'caught' && cr.catchT < 1.2) { // ball wobble
            const wob = Math.sin(cr.catchT * 18) * 0.3 * Math.max(0, 1 - cr.catchT);
            drawBall(cr.x, cr.y + 10, 22, wob);
          }
        }
        // the ball
        const bx0 = W() / 2, by0 = H() - 60;
        if (ball) {
          ball.p += dt / ball.dur; const p = Math.min(1, ball.p);
          ball.x = ball.sx + (ball.tx - ball.sx) * p; ball.y = ball.sy + (ball.ty - ball.sy) * p - Math.sin(p * Math.PI) * 140; ball.spin += dt * 20;
          drawBall(ball.x, ball.y, 26 - p * 8, ball.spin);
          if (p >= 1) land();
        } else if (!busy) drawBall(bx0, by0, 28, Math.sin(t * 3) * 0.15);
        parts.draw(g);
      });
      function drawBall(x, y, r, rot) {
        g.save(); g.translate(x, y); g.rotate(rot || 0);
        g.fillStyle = '#1c7ed6'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.fill();
        g.fillStyle = '#fff3bf'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill();
        g.strokeStyle = '#1d2340'; g.lineWidth = Math.max(2, r / 7); g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.stroke();
        g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke();
        g.fillStyle = '#fcc419'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, 6.3); g.fill(); g.stroke();
        g.restore();
      }
      setupRound();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { const cr = creatures.find((x) => x.w === target && x.state === 'idle'); if (cr && !busy) throwAt(cr.x, cr.y, 2); },
          wrong() { const cr = creatures.find((x) => x.w !== target && x.state === 'idle'); if (cr && !busy) throwAt(cr.x, cr.y, 2); },
        },
      };
    },
  });
})();
