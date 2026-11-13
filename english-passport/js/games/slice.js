/* Level 3 — Word Ninja (inspired by Fruit Ninja: fruit is tossed up, swipe to slice it, blade trail, juice, combos)
 * Listen to a body-part / feeling word, then swipe through the fruit that carries it.
 * A missed target is tossed again (2 misses → reveal). No bombs: on hard a harmless rotten fruit is the decoy. */
(function () {
  const EP = window.EP, u = EP.u;
  const FRUITS = [
    { e: '🍉', j: '#ff4d6d', f: '#ff8fa3' }, { e: '🍊', j: '#ff922b', f: '#ffc078' }, { e: '🍎', j: '#ff6b6b', f: '#fff3bf' },
    { e: '🥝', j: '#94d82d', f: '#d8f5a2' }, { e: '🍋', j: '#fcc419', f: '#fff3bf' }, { e: '🍑', j: '#ffa8a8', f: '#ffd8a8' },
    { e: '🍍', j: '#fab005', f: '#ffec99' }, { e: '🥭', j: '#ffa94d', f: '#ffd8a8' }, { e: '🍐', j: '#a9e34b', f: '#f4fce3' }, { e: '🍇', j: '#9775fa', f: '#e5dbff' },
  ];
  const segHit = (x0, y0, x1, y1, cx, cy, r) => {
    const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy;
    const k = L ? u.clamp(((cx - x0) * dx + (cy - y0) * dy) / L, 0, 1) : 0;
    return Math.hypot(x0 + dx * k - cx, y0 + dy * k - cy) < r;
  };

  EP.registerGame({
    id: 'slice', level: 3, icon: '🍉', title: 'Word Ninja', titleZh: '單字忍者切水果',
    model: 'Fruit Ninja 水果忍者（滑動刀光切水果）',
    howZh: '聽英文單字，用手指或滑鼠「劃過」寫著那個字的水果把它切開！切錯會噴汁，連續切對有連擊。',
    howEn: 'Listen, then swipe through the fruit with that word. Slice the right ones in a row for combos!',
    skills: ['listening', 'reading', 'meaning'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit;
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      root.style.background = '#6b3f1f';
      root.appendChild(u.el('style', {}, `
        .sl-top{position:absolute;top:10px;left:0;right:0;display:flex;justify-content:center;z-index:6;pointer-events:none;padding:0 10px}
        .sl-card{pointer-events:auto;gap:12px;padding:8px 16px}
        .sl-card .pic{font-size:clamp(2rem,7vw,2.8rem)}
        .sl-card .txt{font-size:clamp(1.1rem,4vw,1.5rem)}
        .sl-end{position:absolute;left:0;right:0;top:38%;text-align:center;color:#fff;font-weight:900;font-size:clamp(2rem,7vw,3.4rem);text-shadow:0 4px 0 rgba(0,0,0,.4);z-index:8;pointer-events:none}`));
      let W = 1, H = 1, R = 50, bgDirty = true;
      const c = K.canvas(root, () => (bgDirty = true)); const g = c.g; const parts = K.particles();
      const top = u.el('div', { class: 'sl-top' }); root.appendChild(top);
      const bg = document.createElement('canvas');
      const queue = ctx.items.slice(), requeued = new Set();
      let qi = 0, target = null, fruits = [], halves = [], stains = [], trail = [];
      let state = 'idle', decided = null, decidedT = 0, misses = 0, waveT = 0, slow = 1, picMode = false, card = null, lastWhoosh = 0, t = 0;
      const G = () => H * (easy ? 0.55 : hard ? 1.0 : 0.78);

      function renderBg() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        bg.width = Math.round(W * dpr); bg.height = Math.round(H * dpr);
        const b = bg.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
        const plank = Math.max(70, W / 7);
        for (let i = 0, x = 0; x < W; i++, x += plank) {
          const base = ['#8a5a2b', '#7a4e24', '#93622f'][i % 3];
          const gr = b.createLinearGradient(x, 0, x + plank, 0); gr.addColorStop(0, '#5e3a18'); gr.addColorStop(0.15, base); gr.addColorStop(0.85, base); gr.addColorStop(1, '#5e3a18');
          b.fillStyle = gr; b.fillRect(x, 0, plank, H);
          b.strokeStyle = 'rgba(55,28,8,.28)'; b.lineWidth = 1.5;
          for (let k = 0; k < 6; k++) { const gx = x + plank * (0.12 + k * 0.15); b.beginPath(); b.moveTo(gx, 0); for (let y = 0; y <= H + 40; y += 40) b.lineTo(gx + Math.sin(y * 0.018 + i * 2 + k) * 5, y); b.stroke(); }
          b.fillStyle = 'rgba(55,28,8,.35)'; b.beginPath(); b.ellipse(x + plank * 0.55, ((i * 173) % 100) / 100 * H, 6, 13, 0, 0, 7); b.fill();
          b.fillStyle = 'rgba(0,0,0,.4)'; b.fillRect(x + plank - 3, 0, 3, H);
        }
        const rg = b.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
        rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.5)'); b.fillStyle = rg; b.fillRect(0, 0, W, H);
        bgDirty = false;
      }

      /* ---------- rounds ---------- */
      function showPrompt() {
        top.innerHTML = '';
        const hint = easy || (misses > 0 && !hard) ? u.el('div', { class: 'zhs zh' }, target.zh) : null;
        card = u.el('div', { class: 'prompt-card sl-card' },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(target); } }, '🔊'),
          hint, u.el('div', { class: 'txt' }, picMode ? '🔪 Slice the picture! 切圖片' : '🔪 Slice the word! 切單字'));
        top.appendChild(card);
      }
      function nextItem() {
        for (const f of fruits) if (f.state === 'fly' || f.state === 'wait') f.state = 'fade';
        if (qi >= queue.length) return finish();
        ctx.hud.progress(qi / queue.length);
        target = queue[qi++]; misses = 0;
        picMode = !hard && !easy && !!EP.pic(target) && qi % 2 === 0;
        const n = easy ? 2 : 3;
        target._opts = u.shuffle([target].concat(ctx.distractors(target, n - 1, { needPic: picMode })));
        showPrompt(); state = 'prompt';
        ctx.timeout(() => ctx.say(target), 250);
        ctx.timeout(launchWave, 950);
      }
      function launchWave() {
        state = 'wave'; decided = null; waveT = 0; slow = 1;
        const opts = u.shuffle(target._opts.slice());
        const list = opts.map((w) => ({ w })); if (hard) list.splice(u.randInt(0, list.length), 0, { w: null, rotten: true });
        const n = list.length, kinds = u.shuffle(FRUITS);
        let topSafe = 110;
        if (card) { const cr = card.getBoundingClientRect(), rr = root.getBoundingClientRect(); topSafe = cr.bottom - rr.top + 12; }
        const span = Math.min(0.68, (W - 2 * R - 50) / W);
        fruits = list.map((o, i) => {
          const x0 = W * (0.5 - span / 2 + span * (n === 1 ? 0.5 : i / (n - 1)));
          const apex = Math.max(topSafe + R, H * u.rand(0.24, 0.4));
          const y0 = H + R + 5, vy = -Math.sqrt(2 * G() * (y0 - apex)), T = (2 * -vy) / G();
          const tx = u.clamp(x0 + u.rand(-0.07, 0.07) * W, R, W - R);
          return { w: o.w, rotten: !!o.rotten, kind: kinds[i % kinds.length], x: x0, y: y0, vx: (tx - x0) / T, vy, rot: u.rand(-0.4, 0.4), vr: u.rand(-1.6, 1.6), state: 'wait', delay: i === 0 ? 0 : u.rand(0.1, 0.5), launchT: 0, sp: 0, a: 1 };
        });
        EP.sfx.whoosh();
      }
      function onMiss() {
        misses++;
        if (misses < 2) {
          state = 'prompt'; ctx.float(W / 2, H * 0.55, 'Missed! 再來一次', 'bad');
          for (const f of fruits) if (f.state === 'fly' || f.state === 'wait') f.state = 'fade';
          showPrompt(); ctx.say(target); ctx.timeout(launchWave, 1100);
        } else {
          state = 'reveal';
          ctx.answer(target, false, { x: W / 2, y: H * 0.55, label: 'Missed 沒切到' });
          failFlow();
        }
      }
      async function failFlow() {
        await ctx.wait(350);
        await ctx.reveal(target);
        if (!requeued.has(target.id)) { requeued.add(target.id); queue.push(target); }
        nextItem();
      }
      function finish() {
        state = 'done'; ctx.hud.progress(1); EP.sfx.win();
        root.appendChild(u.el('div', { class: 'sl-end' }, '🥷 Ninja Master!', u.el('div', { class: 'zh', style: { fontSize: '.5em' } }, '單字忍者大師！')));
        ctx.timeout(() => ctx.end(), 1500);
      }

      /* ---------- slicing ---------- */
      function cutFruit(f, ang) {
        f.state = 'cut';
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        for (const s of [-1, 1]) halves.push({ f, side: s, ang, x: f.x, y: f.y, vx: f.vx * 0.4 + nx * s * 130, vy: Math.min(f.vy, 0) * 0.3 - 60 + ny * s * 60, rot: f.rot, vr: s * u.rand(2, 5), t: 0 });
        const col = f.rotten ? '#6b8e23' : f.kind.j;
        parts.burst(f.x, f.y, col, 26, 320); parts.burst(f.x, f.y, f.rotten ? '#a9a9a9' : f.kind.f, 10, 200);
        stains.push({ x: f.x, y: f.y, r: R * u.rand(0.9, 1.3), col, t: 0, blobs: Array.from({ length: 7 }, () => [u.rand(-1, 1), u.rand(-1, 1), u.rand(0.2, 0.5)]) });
        EP.sfx.slice();
      }
      function sliceFruit(f, ang) {
        if (f.state !== 'fly' && f.state !== 'wait') return;
        if (decided === 'wrong' || state !== 'wave') return;
        if (f.rotten) {
          cutFruit(f, ang); ctx.float(f.x, f.y - R, 'Yuck! 🤢', 'bad'); EP.sfx.wrong();
          if (ctx.score >= 30) ctx.addScore(-30);
          return;
        }
        if (decided) { cutFruit(f, ang); return; } // bonus slices after the right one: just juice
        if (f.w === target) {
          decided = 'right'; decidedT = waveT; cutFruit(f, ang);
          const swift = waveT - f.launchT < 1.1;
          ctx.answer(target, true, { x: f.x, y: f.y - R - 10, points: swift ? 150 : 100 });
          f.done = { word: target.word, t: 0, x: f.x, y: f.y };
          if (swift) ctx.float(f.x, f.y + R, '⚡ Swift!', 'good');
        } else {
          decided = 'wrong'; state = 'reveal'; f.state = 'splat'; f.sp = 0;
          stains.push({ x: f.x, y: f.y, r: R * 1.5, col: f.kind.j, t: 0, blobs: Array.from({ length: 9 }, () => [u.rand(-1.2, 1.2), u.rand(-1.2, 1.2), u.rand(0.2, 0.6)]) });
          parts.burst(f.x, f.y, f.kind.j, 30, 380);
          ctx.answer(target, false, { x: f.x, y: f.y - R - 10, label: '✗ ' + f.w.word });
          ctx.shake(); failFlow();
        }
      }
      function cutLine(x0, y0, x1, y1) {
        const hits = fruits.filter((f) => f.state === 'fly' && segHit(x0, y0, x1, y1, f.x, f.y, R * 0.95));
        hits.sort((a, b) => Math.hypot(a.x - x0, a.y - y0) - Math.hypot(b.x - x0, b.y - y0));
        const ang = Math.atan2(y1 - y0, x1 - x0);
        for (const f of hits) sliceFruit(f, ang);
      }
      let down = false, last = null, moved = 0;
      const pt = (e) => { const r = c.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      ctx.on(c.cv, 'pointerdown', (e) => {
        if (ctx.paused) return; down = true; moved = 0; last = pt(e); trail = [{ x: last.x, y: last.y, t }];
        try { c.cv.setPointerCapture(e.pointerId); } catch (err) {}
      });
      ctx.on(c.cv, 'pointermove', (e) => {
        if (!down || ctx.paused) return; const p = pt(e); const d = Math.hypot(p.x - last.x, p.y - last.y);
        if (d < 2) return;
        cutLine(last.x, last.y, p.x, p.y); moved += d; trail.push({ x: p.x, y: p.y, t });
        if (d > 18 && t - lastWhoosh > 0.25) { lastWhoosh = t; EP.sfx.whoosh(); }
        last = p;
      });
      const up = (e) => {
        if (!down) return; down = false;
        if (moved < 12 && last) { const f = fruits.find((q) => q.state === 'fly' && Math.hypot(q.x - last.x, q.y - last.y) < R * 1.05); if (f) { trail.push({ x: last.x + 40, y: last.y - 30, t }); sliceFruit(f, -0.6); } }
      };
      ctx.on(c.cv, 'pointerup', up); ctx.on(c.cv, 'pointercancel', up);

      /* ---------- loop ---------- */
      ctx.loop((dt0) => {
        if (c.w !== W || c.h !== H) { W = c.w; H = c.h; bgDirty = true; }
        R = u.clamp(Math.min(W, H) * 0.085, 44, 66);
        if (bgDirty) renderBg();
        t += dt0;
        slow += ((decided === 'wrong' ? 0.08 : 1) - slow) * Math.min(1, dt0 * 8);
        const dt = dt0 * (ctx.speed || 1) * slow;
        if (state === 'wave') waveT += dt;
        for (const f of fruits) {
          if (f.state === 'wait') { f.delay -= dt; if (f.delay <= 0) { f.state = 'fly'; f.launchT = waveT; } }
          if (f.state === 'fly' || f.state === 'fade') {
            f.vy += G() * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
            if (f.state === 'fade') f.a = Math.max(0, f.a - dt0 * 3);
            if (f.vy > 0 && f.y > H + R + 10) { const was = f.state; f.state = 'gone'; if (was === 'fly' && f.w === target && !decided && state === 'wave') onMiss(); }
          }
          if (f.state === 'splat') f.sp = Math.min(1, f.sp + dt0 * 4);
          if (f.done) f.done.t += dt0;
        }
        if (state === 'wave' && decided === 'right') {
          const alive = fruits.some((f) => f.state === 'fly' || f.state === 'wait');
          if (!alive || waveT - decidedT > 1.4) { state = 'next'; ctx.timeout(nextItem, 250); }
        }
        for (let i = halves.length - 1; i >= 0; i--) { const h = halves[i]; h.t += dt; h.vy += G() * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; if (h.y > H + R * 2) halves.splice(i, 1); }
        for (let i = stains.length - 1; i >= 0; i--) { stains[i].t += dt0; if (stains[i].t > 4) stains.splice(i, 1); }
        trail = trail.filter((p) => t - p.t < 0.14);
        parts.update(dt0);
        draw();
      });

      function draw() {
        g.drawImage(bg, 0, 0, W, H);
        for (const s of stains) {
          g.globalAlpha = 0.55 * Math.max(0, 1 - s.t / 4); g.fillStyle = s.col;
          g.beginPath(); g.arc(s.x, s.y, s.r * 0.6, 0, 7); g.fill();
          for (const b of s.blobs) { g.beginPath(); g.arc(s.x + b[0] * s.r, s.y + b[1] * s.r, s.r * b[2], 0, 7); g.fill(); }
        }
        g.globalAlpha = 1;
        for (const f of fruits) {
          if (f.state === 'fly' || f.state === 'fade' || f.state === 'splat') drawFruit(f);
        }
        for (const h of halves) drawHalf(h);
        for (const f of fruits) if (f.state === 'fly' || f.state === 'fade') drawLabel(f);
        for (const f of fruits) if (f.done && f.done.t < 1.2) { g.globalAlpha = Math.max(0, 1 - f.done.t / 1.2); K.text(g, '✔ ' + f.done.word, f.done.x, f.done.y - f.done.t * 60, 34, '#b9ff9a', { stroke: '#1b4d1b' }); g.globalAlpha = 1; }
        parts.draw(g);
        if (trail.length > 1) {
          g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = '#74c0fc'; g.shadowBlur = 16;
          for (let i = 1; i < trail.length; i++) {
            const k = i / trail.length; g.strokeStyle = `rgba(255,255,255,${0.4 + k * 0.6})`; g.lineWidth = 2 + k * 11;
            g.beginPath(); g.moveTo(trail[i - 1].x, trail[i - 1].y); g.lineTo(trail[i].x, trail[i].y); g.stroke();
          }
          g.restore();
        }
      }
      function drawFruit(f) {
        g.save(); g.globalAlpha = f.a; g.translate(f.x, f.y); g.rotate(f.rot);
        if (f.state === 'splat') { g.scale(1 + f.sp * 0.6, 1 - f.sp * 0.55); g.globalAlpha = Math.max(0, 1 - f.sp * 0.6); }
        if (f.rotten) drawRotten(); else K.emoji(g, f.kind.e, 0, 0, R * 2);
        g.restore();
      }
      function drawRotten() {
        const rg = g.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R); rg.addColorStop(0, '#8d7346'); rg.addColorStop(1, '#4a3a1e');
        g.fillStyle = rg; g.beginPath(); g.arc(0, 0, R * 0.85, 0, 7); g.fill();
        g.fillStyle = '#2f2410'; for (const [a, b, r] of [[-0.3, 0.2, 0.18], [0.35, -0.1, 0.14], [0.1, 0.45, 0.1]]) { g.beginPath(); g.arc(a * R, b * R, r * R, 0, 7); g.fill(); }
        g.strokeStyle = '#82c91e'; g.lineWidth = 3; g.globalAlpha *= 0.8;
        for (let k = -1; k <= 1; k++) { g.beginPath(); for (let y = 0; y < R * 0.7; y += 4) g.lineTo(k * R * 0.35 + Math.sin(y * 0.2 + t * 6 + k) * 5, -R - y); g.stroke(); }
      }
      function drawHalf(h) {
        const f = h.f;
        g.save(); g.translate(h.x, h.y); g.rotate(h.ang + (h.rot - f.rot));
        g.beginPath(); g.rect(-R * 1.4, h.side < 0 ? -R * 1.4 : 0, R * 2.8, R * 1.4); g.clip();
        g.save(); g.rotate(f.rot - h.ang);
        if (f.rotten) drawRotten(); else K.emoji(g, f.kind.e, 0, 0, R * 2);
        g.restore();
        g.fillStyle = f.rotten ? '#c2b280' : f.kind.f; g.beginPath(); g.ellipse(0, 0, R * 0.78, R * 0.16, 0, 0, 7); g.fill();
        g.restore();
      }
      function drawLabel(f) {
        if (f.rotten || !f.w) return;
        g.save(); g.globalAlpha = f.a;
        const pic = EP.pic(f.w);
        if (picMode && pic) {
          g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(f.x, f.y + R * 0.2, R * 0.62, 0, 7); g.fill();
          K.emoji(g, pic, f.x, f.y + R * 0.22, R * 0.8);
        } else {
          const showPic = easy && pic, fs = K.fitSize(g, f.w.word, R * 2.6, 26, 18);
          g.font = `900 ${fs}px 'Baloo 2',sans-serif`; const tw = g.measureText(f.w.word).width;
          const bw = tw + 22 + (showPic ? fs + 6 : 0), bh = fs + 16, bx = u.clamp(f.x - bw / 2, 4, W - bw - 4), by = f.y + R * 0.15 - bh / 2;
          g.fillStyle = 'rgba(255,255,255,.95)'; K.roundRect(g, bx, by, bw, bh, bh / 2); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
          if (showPic) K.emoji(g, pic, bx + 11 + fs / 2, by + bh / 2, fs);
          K.text(g, f.w.word, bx + bw / 2 + (showPic ? (fs + 6) / 2 : 0), by + bh / 2 + 1, fs, '#1d2340');
        }
        g.restore();
      }

      W = c.w; H = c.h; nextItem();
      const live = (fn) => fruits.find((f) => (f.state === 'fly' || f.state === 'wait') && fn(f));
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { if (state !== 'wave' || decided) return; const f = live((q) => q.w === target); if (f) sliceFruit(f, -0.5); },
          wrong() { if (state !== 'wave' || decided) return; const f = live((q) => q.w && q.w !== target); if (f) sliceFruit(f, 0.4); },
        },
      };
    },
  });
})();
