/* Level 9 — Kangaroo Slingshot (inspired by Angry Birds: pull back, aim with a dotted arc, launch, topple towers)
 * Hear an adjective, then sling the kangaroo-ball at the tower whose sign shows that word.
 * Right tower = it tumbles down. Wrong tower = it wobbles, then the answer is revealed.
 * A miss just reloads (no answer recorded); after 3 misses the answer is revealed and we move on. */
(function () {
  const EP = window.EP, u = EP.u;
  const MAT = { wood: ['#e0a05a', '#9a5f26'], stone: ['#c3cad5', '#7d8696'], ice: ['#c9ecff', '#6fb3e0'] };
  const FONT = (s) => `900 ${s}px 'Baloo 2','Nunito','Noto Sans TC',sans-serif`;
  EP.registerGame({
    id: 'sling', level: 9, icon: '🦘', title: 'Kangaroo Slingshot', titleZh: '雪梨袋鼠彈弓',
    model: 'Angry Birds 憤怒鳥（拉弓瞄準、拋物線發射、撞倒高塔）',
    howZh: '聽形容詞，把袋鼠球往後拉，看虛線瞄準，放手發射！撞倒掛著那個單字的高塔。',
    howEn: 'Listen, pull the kangaroo back, aim with the dotted line, let go! Knock down the tower with that word.',
    skills: ['listening', 'reading', 'meaning'],
    start(ctx) {
      const root = ctx.root, kit = ctx.kit, diff = ctx.difficulty;
      root.style.background = '#9ad8ff';
      let towers = [], ball = null, phase = 'wait', target = null, idx = 0, misses = 0, t = 0, drag = null, idle = 0, acc = 0, shotNo = 0;
      const L = { W: 1, H: 1, ground: 1, S: 30, r: 18, R: 90, sx: 0, sy: 0, G: 1000, V: 1000, portrait: false };
      const parts = kit.particles(); const puffs = [];
      const clouds = Array.from({ length: 4 }, (_, i) => ({ x: Math.random(), y: 0.08 + i * 0.06 + Math.random() * 0.04, s: 0.7 + Math.random() * 0.6, v: 0.006 + Math.random() * 0.01 }));
      const c = kit.canvas(root, (w, h) => layout(w, h));
      const g = c.g;
      const nTowers = diff === 'easy' ? 2 : diff === 'hard' ? 4 : 3;
      const previewT = diff === 'easy' ? 1.1 : diff === 'hard' ? 0.32 : 0.6;

      const top = u.el('div', { style: { position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, maxWidth: '96%', width: 'max-content' } });
      root.appendChild(top);

      /* ---------- layout ---------- */
      function layout(W, H) {
        W = W || c.w; H = H || c.h;
        const portrait = W < H * 0.95;
        const S = u.clamp(Math.min(W, H) / 14, 22, 44);
        const ground = H - u.clamp(H * 0.1, 36, 80);
        const R = u.clamp(Math.min(W, H) * 0.17, 60, 130);
        Object.assign(L, { W, H, S, portrait, ground, R, r: S * 0.62, G: H * 1.5 });
        L.sx = Math.max(W * (portrait ? 0.15 : 0.13), R * 0.8 + L.r + 8); L.sy = ground - S * 2.7;
        const n = towers.length;
        towers.forEach((tw, i) => {
          if (!portrait) { tw.x = W * (n === 1 ? 0.72 : 0.52 + 0.4 * i / (n - 1)); tw.base = ground; tw.plat = null; }
          else {
            const gap = Math.min(H * 0.2, (ground - H * 0.3) / Math.max(1, n - 1));
            tw.base = ground - i * gap; tw.x = W * (i % 2 ? 0.78 : 0.63);
            tw.plat = i > 0 ? { x0: tw.x - S * 2.1, x1: tw.x + S * 2.1, y: tw.base } : null;
          }
          tw.maxSign = portrait ? W * 0.4 : Math.min(240, (W * 0.4 / Math.max(1, n - 1)) * 0.92);
          if (tw.state !== 'fall') buildBlocks(tw);
        });
        let need = 0;
        for (const tw of towers) { const dx = tw.x - L.sx, dy = tw.top - L.sy; need = Math.max(need, Math.sqrt(L.G * dx * dx / Math.max(20, dy + dx))); }
        L.V = Math.max(need * 1.35, H * 1.1);
      }
      function buildBlocks(tw) {
        const S = L.S, pw = S * 0.42, ph = S * 1.05, plh = S * 0.32, bw = S * 2.3;
        const B = []; let y = 0;
        for (let s = 0; s < tw.stories; s++) {
          B.push({ rx: -bw / 2 + pw / 2, ry: -(y + ph / 2), w: pw, h: ph, m: tw.mat });
          B.push({ rx: bw / 2 - pw / 2, ry: -(y + ph / 2), w: pw, h: ph, m: tw.mat });
          if (s === 0) B.push({ rx: 0, ry: -ph * 0.32, w: S * 0.62, h: ph * 0.62, m: tw.mat2 });
          y += ph;
          B.push({ rx: 0, ry: -(y + plh / 2), w: bw + S * 0.24, h: plh, m: tw.mat });
          y += plh;
        }
        B.push({ rx: 0, ry: -(y + S * 0.3), w: S * 0.2, h: S * 0.6, pole: true }); y += S * 0.6;
        // sign: word (+ picture), fitted to the space
        const pic = diff === 'hard' ? '' : EP.pic(tw.w);
        let F = u.clamp(S * 0.78, 20, 32); g.font = FONT(F);
        const tw0 = g.measureText(tw.w.word).width; const picW = pic ? 1.25 : 0;
        let sw = tw0 + picW * F + F * 0.9;
        if (sw > tw.maxSign) { F = Math.max(15, F * (tw.maxSign - F * 0.9) / (tw0 + picW * F)); g.font = FONT(F); sw = g.measureText(tw.w.word).width + picW * F + F * 0.9; }
        const sh = F * 1.75;
        const sign = { rx: 0, ry: -(y + sh / 2), w: Math.max(sw, S * 2), h: sh, sign: true, F, pic };
        B.push(sign); y += sh;
        B.forEach((b) => (b.owner = tw)); tw.blocks = B; tw.sign = sign;
        const wide = Math.max(bw + S * 0.24, sign.w);
        tw.rect = { x: tw.x - wide / 2, y: tw.base - y, w: wide, h: y };
        tw.top = tw.base - y + sh / 2;
      }

      /* ---------- rounds ---------- */
      function setupRound() {
        if (idx >= ctx.items.length) return finish();
        ctx.hud.progress(idx / ctx.items.length);
        target = ctx.items[idx]; misses = 0; shotNo = 0;
        const words = u.shuffle([target].concat(ctx.distractors(target, nTowers - 1)));
        const mats = u.shuffle(['wood', 'stone', 'ice', 'wood']);
        towers = words.map((w, i) => ({ w, stories: u.randInt(L.portrait ? 1 : 2, L.portrait ? 2 : 3), mat: mats[i % 4], mat2: u.pick(['wood', 'stone', 'ice']), state: 'stand', enter: 1 + i * 0.18, landed: false, wobT: 0, glow: false }));
        layout(c.w, c.h);
        ball = null; phase = 'aim'; idle = 0; drag = null;
        showPrompt(); hudShots();
        ctx.timeout(() => ctx.say(target), 450);
      }
      function showPrompt() {
        top.innerHTML = '';
        top.appendChild(u.el('div', { class: 'prompt-card', style: { padding: '6px 16px 6px 6px', gap: '10px' } },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(target); } }, '🔊'),
          u.el('div', {},
            u.el('div', { class: 'txt', style: { fontSize: 'clamp(1.05rem,3.6vw,1.4rem)' } }, '🎯 Hit the word you hear!'),
            u.el('div', { class: 'zhs zh', style: { fontSize: 'clamp(.95rem,3vw,1.15rem)' } }, diff === 'easy' ? `提示：${target.zh}` : '打中你聽到的形容詞'))));
      }
      function hudShots() { ctx.hud.extra('🦘'.repeat(Math.max(0, 3 - misses))); }
      function finish() { phase = 'done'; ctx.hud.progress(1); ctx.hud.extra(''); ctx.end(); }
      function next() { idx++; setupRound(); }

      /* ---------- physics ---------- */
      const DT = 1 / 120;
      function stepBall(b, dt) { b.vy += L.G * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
      function circRect(x, y, r, R) { const cx = u.clamp(x, R.x, R.x + R.w), cy = u.clamp(y, R.y, R.y + R.h); return (x - cx) ** 2 + (y - cy) ** 2 < r * r; }
      function collide(b) {
        const r = L.r * 0.85;
        for (const tw of towers) if (tw.state !== 'fall' && circRect(b.x, b.y, r, tw.rect)) return { tower: tw };
        for (const tw of towers) if (tw.plat && circRect(b.x, b.y, r, { x: tw.plat.x0, y: tw.plat.y, w: tw.plat.x1 - tw.plat.x0, h: L.S * 0.8 })) return { solid: true };
        if (b.y > L.ground - L.r * 0.6) return { ground: true };
        if (b.x > L.W + L.r * 3 || b.x < -L.r * 6 || b.y > L.H + L.r * 2) return { out: true };
        return null;
      }
      function simulate(x, y, vx, vy, tmax, collect) {
        const b = { x, y, vx, vy }; const pts = [];
        for (let k = 0; k * DT < tmax; k++) { stepBall(b, DT); if (collect && k % 6 === 5) pts.push([b.x, b.y]); const h = collide(b); if (h) return { hit: h, pts }; }
        return { hit: null, pts };
      }
      function pulled() {
        let dx = drag ? drag.dx : 0, dy = drag ? drag.dy : 0;
        if (L.sy + dy > L.ground - L.r * 1.2) dy = L.ground - L.r * 1.2 - L.sy;
        return { x: L.sx + dx, y: L.sy + dy, dx, dy };
      }
      function launch(vx, vy, x0, y0) {
        if (phase !== 'aim') return;
        phase = 'fly'; shotNo++; acc = 0; idle = 0;
        ball = { x: x0, y: y0, vx, vy, rot: 0, age: 0, dead: false, trail: [], tt: 0 };
        EP.sfx.whoosh(); EP.sfx.jump();
        for (let i = 0; i < 6; i++) puffs.push({ x: x0, y: y0, r: L.r * 0.4, t: 0, life: 0.4, vx: -vx * 0.05 * Math.random(), vy: -vy * 0.05 * Math.random() });
      }
      function onHit(h) {
        if (phase !== 'fly') return;
        phase = 'result'; ball.dead = true;
        if (h.tower) {
          const tw = h.tower; const right = tw.w === target;
          ball.vx *= -0.25; ball.vy = -Math.abs(ball.vy) * 0.2 - 160;
          if (right) {
            ctx.answer(target, true, { x: tw.x, y: tw.rect.y - 10, points: 100 + (shotNo === 1 ? 50 : 0) });
            topple(tw, Math.max(260, Math.abs(ball.vx) * 3 + 200));
            ctx.float(tw.x, tw.rect.y - 50, shotNo === 1 ? 'Perfect shot! 🎯' : 'Great! 🎉', 'good');
            parts.burst(tw.x, tw.rect.y + 20, null, 34, 340); EP.sfx.boom(); ctx.shake();
            ctx.timeout(() => ctx.say(target), 500);
            ctx.timeout(next, 2000);
          } else {
            ctx.answer(target, false, { x: tw.x, y: tw.rect.y - 10, label: `That's “${tw.w.word}”` });
            tw.state = 'wobble'; tw.wobT = 0; EP.sfx.pop(); ctx.shake();
            const good = towers.find((x) => x.w === target); if (good) good.glow = true;
            ctx.timeout(async () => { await ctx.reveal(target); if (good) topple(good, 220); EP.sfx.boom(); ctx.timeout(next, 900); }, 800);
          }
        } else {
          misses++; hudShots(); EP.sfx.pop();
          ball.vx *= 0.35; ball.vy = -Math.min(260, Math.abs(ball.vy) * 0.3);
          const mx = u.clamp(ball.x, 60, L.W - 60), my = u.clamp(ball.y - 40, 90, L.H - 40);
          for (let i = 0; i < 5; i++) puffs.push({ x: mx, y: L.ground, r: L.r * 0.5, t: 0, life: 0.6, vx: u.rand(-60, 60), vy: u.rand(-80, -20) });
          if (misses >= 3) {
            ctx.float(mx, my, 'Here it is! 答案在這', 'bad');
            const good = towers.find((x) => x.w === target); if (good) good.glow = true;
            ctx.timeout(async () => { await ctx.reveal(target); if (good) topple(good, 220); ctx.timeout(next, 900); }, 700);
          } else {
            ctx.float(mx, my, misses === 2 ? 'Miss! Longer aim line 🔭' : 'Miss! Try again 再試一次', 'bad');
            ctx.timeout(() => { if (phase === 'result') { phase = 'aim'; ball = null; idle = 0; } }, 1000);
          }
        }
      }
      function topple(tw, push) {
        if (tw.state === 'fall') return;
        tw.state = 'fall';
        for (const b of tw.blocks) {
          b.x = tw.x + b.rx; b.y = tw.base + b.ry; b.rot = 0; b.rest = false;
          const hf = u.clamp((tw.base - b.y) / (L.S * 4), 0.2, 1.6);
          b.vx = push * (0.3 + Math.random() * 0.5) * hf; b.vy = -80 - Math.random() * 240 * hf; b.vr = (Math.random() - 0.35) * 7;
        }
        for (let i = 0; i < 10; i++) puffs.push({ x: tw.x + u.rand(-L.S, L.S), y: tw.base - u.rand(0, L.S * 2), r: L.S * 0.5, t: 0, life: 0.7, vx: u.rand(-80, 80), vy: u.rand(-90, 0) });
      }
      function floorFor(tw, b) { const p = tw.plat; return p && b.x > p.x0 && b.x < p.x1 && b.y <= p.y + 2 ? p.y : L.ground; }

      /* ---------- input ---------- */
      const pt = (e) => { const r = c.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      ctx.on(c.cv, 'pointerdown', (e) => {
        if (phase !== 'aim' || ctx.paused) return;
        const p = pt(e); drag = { x0: p.x, y0: p.y, dx: 0, dy: 0 };
        if (Math.hypot(p.x - L.sx, p.y - L.sy) < L.r * 2.6) { drag.x0 = L.sx; drag.y0 = L.sy; }
        try { c.cv.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
        EP.sfx.click();
      });
      ctx.on(c.cv, 'pointermove', (e) => {
        if (!drag) return; const p = pt(e);
        let dx = p.x - drag.x0, dy = p.y - drag.y0; const d = Math.hypot(dx, dy);
        if (d > L.R) { dx *= L.R / d; dy *= L.R / d; }
        if (Math.abs(Math.hypot(dx, dy) - Math.hypot(drag.dx, drag.dy)) > L.R * 0.25) EP.sfx.tick();
        drag.dx = dx; drag.dy = dy;
      });
      ctx.on(c.cv, 'pointerup', () => {
        if (!drag) return; const p = pulled(); drag = null;
        if (phase !== 'aim') return;
        if (Math.hypot(p.dx, p.dy) < L.R * 0.18) { ctx.float(L.sx, L.sy - L.r * 2.2, 'Pull back! 往後拉', 'bad'); return; }
        launch(-p.dx / L.R * L.V, -p.dy / L.R * L.V, p.x, p.y);
      });
      ctx.on(c.cv, 'pointercancel', () => (drag = null));

      /* ---------- drawing ---------- */
      function drawBG() {
        const { W, H, ground: gr } = L; const hz = gr - H * 0.15;
        const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#4fc0ff'); sky.addColorStop(1, '#d4f3ff');
        g.fillStyle = sky; g.fillRect(0, 0, W, hz + 2);
        g.fillStyle = 'rgba(255,224,102,.35)'; g.beginPath(); g.arc(W * 0.88, H * 0.13, L.S * 2.1, 0, 6.3); g.fill();
        g.fillStyle = '#ffe066'; g.beginPath(); g.arc(W * 0.88, H * 0.13, L.S * 1.3, 0, 6.3); g.fill();
        g.fillStyle = 'rgba(255,255,255,.9)';
        for (const cl of clouds) { const x = ((cl.x + t * cl.v) % 1.2 - 0.1) * W, y = cl.y * H, s = L.S * cl.s; g.beginPath(); g.arc(x, y, s, 0, 6.3); g.arc(x + s, y + s * 0.2, s * 0.8, 0, 6.3); g.arc(x - s, y + s * 0.25, s * 0.7, 0, 6.3); g.fill(); }
        // Harbour Bridge (arch)
        const bx0 = W * 0.5, bx1 = W * 0.98, by = hz - H * 0.02;
        g.strokeStyle = '#7a8597'; g.lineWidth = Math.max(3, L.S * 0.16);
        g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo((bx0 + bx1) / 2, by - H * 0.2, bx1, by); g.stroke();
        g.lineWidth = Math.max(2, L.S * 0.08);
        for (let i = 1; i < 10; i++) { const x = bx0 + (bx1 - bx0) * i / 10; const yy = by - H * 0.4 * (i / 10) * (1 - i / 10); g.beginPath(); g.moveTo(x, by); g.lineTo(x, by - (by - yy) * 0.98); g.stroke(); }
        g.fillStyle = '#5f6b7d'; g.fillRect(bx0 - 4, by - 4, bx1 - bx0 + 8, Math.max(4, L.S * 0.18));
        g.fillRect(bx0 - L.S * 0.5, by - H * 0.05, L.S * 0.5, H * 0.05); g.fillRect(bx1, by - H * 0.05, L.S * 0.5, H * 0.05);
        // Opera House sails
        const ox = W * (L.portrait ? 0.3 : 0.27), s = L.S * 1.25;
        g.fillStyle = '#d9cbb0'; g.fillRect(ox - s * 2.6, hz - s * 0.35, s * 5.4, s * 0.4);
        [[-2, 1.1], [-0.9, 1.6], [0.4, 1.9], [1.6, 1.3]].forEach(([dx, hgt]) => {
          g.fillStyle = '#fbfbf7'; g.strokeStyle = '#c9ced8'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(ox + dx * s, hz - s * 0.35); g.quadraticCurveTo(ox + (dx + 0.15) * s, hz - s * 0.35 - hgt * s, ox + (dx + 1.2) * s, hz - s * 0.35 - hgt * s * 1.05);
          g.quadraticCurveTo(ox + (dx + 0.9) * s, hz - s * 0.6, ox + (dx + 1.1) * s, hz - s * 0.35); g.closePath(); g.fill(); g.stroke();
        });
        // sea
        g.fillStyle = '#2b9fd6'; g.fillRect(0, hz, W, gr - hz);
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const y = hz + (gr - hz) * (0.2 + i * 0.2); g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin(x * 0.04 + t * 2 + i) * 2); g.stroke(); }
        // ground
        g.fillStyle = '#d9a55f'; g.fillRect(0, gr, W, L.H - gr);
        g.fillStyle = '#7cc45a'; g.fillRect(0, gr - 4, W, Math.max(10, (L.H - gr) * 0.35));
        g.fillStyle = '#5aa33e'; g.fillRect(0, gr - 4, W, 4);
      }
      function block(b, x, y, rot, alpha) {
        g.save(); g.translate(x, y); g.rotate(rot || 0); if (alpha != null) g.globalAlpha = alpha;
        const w = b.w, h = b.h;
        if (b.sign) {
          g.fillStyle = 'rgba(0,0,0,.18)'; kit.roundRect(g, -w / 2 + 3, -h / 2 + 4, w, h, 10); g.fill();
          g.fillStyle = '#fff8e6'; g.strokeStyle = '#8a5a2b'; g.lineWidth = 4; kit.roundRect(g, -w / 2, -h / 2, w, h, 10); g.fill(); g.stroke();
          const tw = (g.font = FONT(b.F), g.measureText(b.owner.w.word).width); const pw = b.pic ? b.F * 1.25 : 0; const x0 = -(tw + pw) / 2;
          if (b.pic) kit.emoji(g, b.pic, x0 + pw / 2 - 2, 2, b.F * 1.05);
          kit.text(g, b.owner.w.word, x0 + pw + tw / 2, 2, b.F, '#3b2207');
        } else if (b.pole) { g.fillStyle = '#8a5a2b'; g.fillRect(-w / 2, -h / 2, w, h); }
        else {
          const [f, s] = MAT[b.m] || MAT.wood;
          g.fillStyle = f; g.strokeStyle = s; g.lineWidth = 3; kit.roundRect(g, -w / 2, -h / 2, w, h, Math.min(5, w / 4)); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w / 2 + 4, -h / 2 + 4); g.lineTo(w / 2 - 4, -h / 2 + 4); g.stroke();
          if (b.m === 'wood') { g.strokeStyle = 'rgba(110,60,20,.35)'; g.beginPath(); if (w > h) { g.moveTo(-w / 2 + 6, 1); g.lineTo(w / 2 - 6, 1); } else { g.moveTo(0, -h / 2 + 6); g.lineTo(0, h / 2 - 6); } g.stroke(); }
        }
        g.restore();
      }
      function drawTower(tw) {
        if (tw.plat) { const p = tw.plat; g.fillStyle = '#9b6b3c'; kit.roundRect(g, p.x0, p.y, p.x1 - p.x0, L.S * 0.8, 10); g.fill(); g.fillStyle = '#7cc45a'; kit.roundRect(g, p.x0 - 3, p.y - 3, p.x1 - p.x0 + 6, L.S * 0.3, 6); g.fill(); }
        if (tw.state === 'fall') { for (const b of tw.blocks) block(b, b.x, b.y, b.rot); return; }
        const e = u.clamp(tw.enter, 0, 1); const oy = -e * e * L.H * 0.7;
        g.save(); g.translate(tw.x, tw.base + oy);
        if (tw.state === 'wobble') g.rotate(Math.sin(tw.wobT * 17) * 0.1 * Math.exp(-tw.wobT * 1.6));
        if (tw.glow) { const s = tw.sign; g.strokeStyle = `rgba(255,212,59,${0.6 + Math.sin(t * 8) * 0.4})`; g.lineWidth = 8; kit.roundRect(g, -s.w / 2 - 8, s.ry - s.h / 2 - 8, s.w + 16, s.h + 16, 16); g.stroke(); }
        for (const b of tw.blocks) block(b, b.rx, b.ry, 0);
        g.restore();
        if (tw.glow) kit.emoji(g, '⬇️', tw.x, tw.rect.y - L.S * 0.9 + Math.sin(t * 7) * 6, L.S * 1.1);
      }
      function drawRoo(x, y, r, rot) {
        g.save(); g.translate(x, y); g.rotate(rot || 0);
        g.fillStyle = '#b06d33';
        for (const sx of [-1, 1]) { g.save(); g.translate(sx * r * 0.45, -r * 0.82); g.rotate(sx * 0.35); g.beginPath(); g.ellipse(0, 0, r * 0.24, r * 0.52, 0, 0, 6.3); g.fill(); g.fillStyle = '#f2a7b8'; g.beginPath(); g.ellipse(0, r * 0.06, r * 0.11, r * 0.32, 0, 0, 6.3); g.fill(); g.restore(); g.fillStyle = '#b06d33'; }
        g.fillStyle = '#cf8a4b'; g.strokeStyle = '#6b3d16'; g.lineWidth = Math.max(2, r * 0.1); g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.fill(); g.stroke();
        g.fillStyle = '#f6dbb3'; g.beginPath(); g.ellipse(0, r * 0.35, r * 0.62, r * 0.48, 0, 0, 6.3); g.fill();
        for (const sx of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(sx * r * 0.33, -r * 0.18, r * 0.22, 0, 6.3); g.fill(); g.fillStyle = '#1d2340'; g.beginPath(); g.arc(sx * r * 0.33 + r * 0.07, -r * 0.15, r * 0.11, 0, 6.3); g.fill(); }
        g.strokeStyle = '#4a2a10'; g.lineWidth = Math.max(2, r * 0.09); g.beginPath(); g.moveTo(-r * 0.55, -r * 0.5); g.lineTo(-r * 0.15, -r * 0.38); g.moveTo(r * 0.55, -r * 0.5); g.lineTo(r * 0.15, -r * 0.38); g.stroke();
        g.fillStyle = '#3b2412'; g.beginPath(); g.ellipse(0, r * 0.14, r * 0.14, r * 0.1, 0, 0, 6.3); g.fill();
        g.strokeStyle = '#3b2412'; g.lineWidth = Math.max(1.5, r * 0.07); g.beginPath(); g.arc(0, r * 0.28, r * 0.2, 0.3, Math.PI - 0.3); g.stroke();
        g.restore();
      }
      function drawSling(front, bx, by) {
        const S = L.S, x = L.sx, y = L.sy;
        const lp = [x - S * 0.55, y - S * 0.2], rp = [x + S * 0.5, y - S * 0.3];
        if (!front) {
          g.lineCap = 'round';
          for (const [col, wd] of [['#5a3415', S * 0.5], ['#9a6232', S * 0.34]]) {
            g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); g.moveTo(x, L.ground); g.lineTo(x, y + S * 0.6); g.lineTo(rp[0], rp[1]); g.moveTo(x, y + S * 0.6); g.lineTo(lp[0], lp[1]); g.stroke();
          }
          g.strokeStyle = '#3b1f0a'; g.lineWidth = S * 0.16; g.beginPath(); g.moveTo(rp[0], rp[1]); g.lineTo(bx + L.r * 0.6, by); g.stroke();
        } else { g.strokeStyle = '#3b1f0a'; g.lineWidth = S * 0.16; g.lineCap = 'round'; g.beginPath(); g.moveTo(lp[0], lp[1]); g.lineTo(bx - L.r * 0.6, by); g.stroke(); }
      }

      /* ---------- main loop ---------- */
      ctx.loop((dt) => {
        t += dt; parts.update(dt); idle += dt;
        const { W, H } = L;
        g.clearRect(0, 0, W, H);
        drawBG();
        // towers
        for (const tw of towers) {
          if (tw.enter > 0) { tw.enter -= dt * 2.4; if (tw.enter <= 0 && !tw.landed) { tw.landed = true; EP.sfx.pop(); for (let i = 0; i < 4; i++) puffs.push({ x: tw.x + u.rand(-L.S, L.S), y: tw.base, r: L.S * 0.4, t: 0, life: 0.5, vx: u.rand(-50, 50), vy: -20 }); } }
          if (tw.state === 'wobble') tw.wobT += dt;
          if (tw.state === 'fall') for (const b of tw.blocks) {
            if (b.rest) continue;
            b.vy += L.G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
            const fl = floorFor(tw, b); const half = (Math.abs(Math.cos(b.rot)) * b.h + Math.abs(Math.sin(b.rot)) * b.w) / 2;
            if (b.y + half > fl) {
              b.y = fl - half;
              if (b.vy > 140) { b.vy *= -0.32; puffs.push({ x: b.x, y: fl, r: L.S * 0.35, t: 0, life: 0.4, vx: 0, vy: -20 }); } else b.vy = 0;
              b.vx *= 0.72; b.vr *= 0.6; if (Math.abs(b.vx) < 6 && b.vy === 0) { b.rest = true; }
            }
          }
          drawTower(tw);
        }
        // slingshot + ball
        const p = pulled();
        const loaded = phase === 'aim';
        drawSling(false, loaded ? p.x : L.sx, loaded ? p.y : L.sy);
        const waiting = Math.max(0, 2 - misses);
        const left = L.sx - L.S * 2.9 > L.r; for (let k = 0; k < Math.min(2, waiting); k++) drawRoo(left ? L.sx - L.S * 1.6 - k * L.S * 1.3 : L.sx + L.S * 1.5 + k * L.S * 1.3, L.ground - L.r * 0.7 - Math.abs(Math.sin(t * 4 + k)) * 6, L.r * 0.7, 0);
        if (loaded) {
          if (drag && Math.hypot(p.dx, p.dy) > 4) {
            const vx = -p.dx / L.R * L.V, vy = -p.dy / L.R * L.V;
            const sim = simulate(p.x, p.y, vx, vy, misses >= 2 ? 2.2 : previewT, true);
            g.fillStyle = '#fff'; sim.pts.forEach(([x, y], i) => { g.globalAlpha = 1 - i / (sim.pts.length + 4); g.beginPath(); g.arc(x, y, Math.max(2.5, L.S * 0.13), 0, 6.3); g.fill(); }); g.globalAlpha = 1;
          }
          drawRoo(p.x, p.y, L.r, drag ? Math.atan2(-p.dy, -p.dx) * 0.2 : Math.sin(t * 2) * 0.08);
          drawSling(true, p.x, p.y);
          if (!drag && idle > 2.2) { // tutorial hand
            const k = (t * 0.8) % 1; kit.emoji(g, '👆', L.sx - L.R * 0.6 * k + L.r, L.sy + L.R * 0.35 * k + L.r * 1.6, L.S * 1.2);
          }
        } else drawSling(true, L.sx, L.sy);
        if (ball) {
          if (phase === 'fly') {
            acc += dt;
            while (acc >= DT && phase === 'fly') { acc -= DT; stepBall(ball, DT); const h = collide(ball); if (h) onHit(h); }
            ball.age += dt; if (phase === 'fly' && ball.age > 6) onHit({ out: true });
            ball.tt += dt; if (ball.tt > 0.04) { ball.tt = 0; ball.trail.push([ball.x, ball.y]); }
          } else if (ball.dead) {
            stepBall(ball, dt); if (ball.y > L.ground - L.r) { ball.y = L.ground - L.r; ball.vy = -ball.vy * 0.3; ball.vx *= 0.8; }
          }
          g.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y] of ball.trail) { g.beginPath(); g.arc(x, y, Math.max(2, L.S * 0.1), 0, 6.3); g.fill(); }
          ball.rot += dt * (ball.dead ? 3 : 9);
          drawRoo(ball.x, ball.y, L.r, ball.rot);
        }
        for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; const k = q.t / q.life; if (k >= 1) { puffs.splice(i, 1); continue; } g.fillStyle = `rgba(240,235,225,${0.75 * (1 - k)})`; g.beginPath(); g.arc(q.x, q.y, q.r * (1 + k * 1.5), 0, 6.3); g.fill(); }
        parts.draw(g);
      });

      /* ---------- test hooks ---------- */
      function solveShot(tw) {
        const x0 = L.sx, y0 = L.sy, dx = tw.x - x0, dy = tw.top - y0; const base = Math.atan2(-dy, dx);
        for (let a = Math.min(1.4, base + 1.0); a > base + 0.04; a -= 0.05) {
          const den = 2 * Math.cos(a) ** 2 * (dy + dx * Math.tan(a)); if (den <= 0) continue;
          const v = Math.sqrt(L.G * dx * dx / den); const vx = v * Math.cos(a), vy = -v * Math.sin(a);
          const s = simulate(x0, y0, vx, vy, 6); if (s.hit && s.hit.tower === tw) return { vx, vy };
        }
        return null;
      }
      function shootAt(tw) {
        if (phase !== 'aim' || !tw || tw.enter > 0) return;
        const s = solveShot(tw);
        if (s) launch(s.vx, s.vy, L.sx, L.sy);
        else { launch(0, 0, tw.x, tw.top); onHit({ tower: tw }); }
      }
      setupRound();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { shootAt(towers.find((x) => x.w === target)); },
          wrong() { shootAt(towers.find((x) => x.w !== target)); },
        },
      };
    },
  });
})();
