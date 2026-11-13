/* Level 18 — Robot Garden Defense (inspired by lane tower-defense games such as Plants vs. Zombies, Blooket Tower Defense
 * and Mindustry: lanes, seed cards, defenders that act on their own). Friendly delivery robots roll toward the garden
 * holding picture signs. Tap a robot, then the seed card with its English word: a bubble blossom grows and its bubbles
 * gently switch the robot off — and it turns into flowers. */
(function () {
  const EP = window.EP, u = EP.u;
  EP.registerGame({
    id: 'defense', level: 18, icon: '🌻', title: 'Robot Garden Defense', titleZh: '舊金山機器人花園保衛戰',
    model: 'Plants vs. Zombies / Blooket Tower Defense / Mindustry（Mindustry 在 GitHub 有約 2.97 萬顆星，2026-11-09）',
    howZh: '友善的機器人舉著圖片牌子走向花園！點一個機器人，再點寫著正確英文的種子卡（也可以把卡片拖到那一排），泡泡花會讓機器人關機變成花！',
    howEn: 'Tap a robot, then the seed card with its English word (or drag the card onto its lane). Bubbles switch it off!',
    skills: ['reading', 'meaning', 'listening'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit, D = ctx.difficulty, items = ctx.items, n = items.length;
      root.style.background = '#7cc45a';
      const c = K.canvas(root), g = c.g, parts = K.particles();
      const HAND = D === 'easy' ? 3 : D === 'hard' ? 5 : 4, WALK = D === 'easy' ? 30 : D === 'hard' ? 16 : 22;
      const GAP = D === 'easy' ? 7 : D === 'hard' ? 4.5 : 5.5, MAXON = D === 'easy' ? 2 : 3;
      const HUES = ['#9ad8e8', '#ffc9de', '#c5f6a3', '#ffe08a', '#d6c8ff', '#ffd0a8'];

      /* ---------- DOM: hint bar + seed cards ---------- */
      const hint = u.el('div', { style: { position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', justifyContent: 'center', width: '98%', pointerEvents: 'none' } });
      const bar = u.el('div', { style: { position: 'absolute', left: '6px', right: '6px', bottom: '6px', zIndex: 6, display: 'grid', gap: '6px', justifyContent: 'center' } });
      root.append(hint, bar);

      /* ---------- state ---------- */
      let lanesN = 4, L = {}, t = 0, spawnT = 0.8, si = 0, gnomes = 3, done = 0, freeze = 0, sel = null, finished = false;
      const robots = [], flowers = {}, bubbles = [], patches = [], hand = [];
      function layout() {
        const W = c.w, H = c.h; lanesN = H > 560 && W > 700 ? 5 : 4;
        const narrow = W < 560, cols = narrow ? 2 : HAND;
        bar.style.gridTemplateColumns = `repeat(${cols}, minmax(0, ${narrow ? '1fr' : '170px'}))`;
        const barH = bar.getBoundingClientRect().height || 80, top = Math.max(76, H * 0.15), bottom = H - barH - 14;
        const laneH = (bottom - top) / lanesN, fence = u.clamp(W * 0.08, 38, 86);
        L = { W, H, top, bottom, laneH, fence, plantX: fence + Math.min(laneH, 90) * 0.55, rs: Math.min(laneH * 0.98, W * 0.24, 132) };
      }
      const laneY = (ln) => L.top + (ln + 0.5) * L.laneH;
      const robX = (r) => L.plantX + 30 + (L.W - L.plantX - 30 - L.rs * 0.3) * r.x;
      const active = () => robots.filter((r) => r.state === 'walk');
      const front = () => active().sort((a, b) => a.x - b.x)[0] || null;

      /* ---------- seed cards ---------- */
      function needed() { return active().map((r) => r.item); }
      function newCardWord() {
        const inHand = hand.map((h) => h.w), need = needed().filter((w) => !inHand.includes(w));
        if (need.length) return need[0];
        const next = items[si]; if (next && !inHand.includes(next) && Math.random() < 0.5) return next;
        const pool = ctx.pool.filter((w) => !inHand.includes(w) && !needed().includes(w) && w.zh !== (next && next.zh));
        return u.pick(pool.length ? pool : ctx.pool);
      }
      function renderCards() {
        bar.innerHTML = '';
        hand.forEach((h, i) => {
          const cardW = c.w < 560 ? (c.w - 18) / 2 : 170, len = h.w.word.length, fs = u.clamp((cardW - 44) / (len * 0.6), 18, 26);
          const el = u.el('button', { class: 'seed', style: { minHeight: '62px', borderRadius: '16px', padding: '4px 8px', background: h.wilt ? 'linear-gradient(#ced4da,#adb5bd)' : 'linear-gradient(#fff8e1,#ffe3a3)', border: '3px solid ' + (h.wilt ? '#868e96' : '#e8a33d'), boxShadow: '0 5px 0 rgba(0,0,0,.2)', fontWeight: 900, fontSize: fs + 'px', color: h.wilt ? '#495057' : '#5c3b00', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', position: 'relative', transform: h.wilt ? 'rotate(-6deg) translateY(6px)' : h.fresh ? 'scale(.6)' : 'none', transition: 'transform .25s', touchAction: 'none', overflow: 'hidden', whiteSpace: 'nowrap' } },
            u.el('span', { style: { fontSize: '1.1rem' } }, h.wilt ? '🥀' : '🌱'), h.w.word);
          if (h.fresh) requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = 'none'; h.fresh = false; }));
          ctx.on(el, 'pointerdown', (e) => startDrag(e, i, el));
          bar.appendChild(el); h.el = el;
        });
        layout();
      }
      function refillHand() { while (hand.length < HAND) hand.push({ w: newCardWord(), fresh: true }); u.shuffle(hand); renderCards(); }
      function ensureInHand(word) {
        if (hand.some((h) => h.w === word)) return;
        const need = needed(); let i = hand.findIndex((h) => !need.includes(h.w));
        if (i < 0) i = 0; hand[i] = { w: word, fresh: true }; renderCards();
      }

      /* ---------- drag a card onto a lane, or tap it ---------- */
      let drag = null;
      function startDrag(e, i, el) {
        if (finished) return; e.preventDefault();
        drag = { i, x0: e.clientX, y0: e.clientY, el, ghost: null };
      }
      ctx.on(window, 'pointermove', (e) => {
        if (!drag) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.ghost && Math.hypot(dx, dy) > 14) { drag.ghost = drag.el.cloneNode(true); Object.assign(drag.ghost.style, { position: 'fixed', pointerEvents: 'none', zIndex: 60, width: drag.el.offsetWidth + 'px', opacity: 0.9 }); document.body.appendChild(drag.ghost); }
        if (drag.ghost) { drag.ghost.style.left = e.clientX - drag.el.offsetWidth / 2 + 'px'; drag.ghost.style.top = e.clientY - 30 + 'px'; }
      });
      ctx.on(window, 'pointerup', (e) => {
        if (!drag) return; const d = drag; drag = null;
        if (d.ghost) {
          d.ghost.remove(); const rc = c.cv.getBoundingClientRect(), y = e.clientY - rc.top;
          if (y > L.top && y < L.bottom) { const ln = Math.floor((y - L.top) / L.laneH); const r = active().filter((q) => q.lane === ln).sort((a, b) => a.x - b.x)[0]; if (r) return play(d.i, r); }
          return;
        }
        play(d.i, sel && sel.state === 'walk' ? sel : front());
      });
      ctx.onCleanup(() => { if (drag && drag.ghost) drag.ghost.remove(); });

      /* ---------- the core decision ---------- */
      function play(i, r) {
        const h = hand[i]; if (!h || h.wilt || !r || r.state !== 'walk' || freeze > 0 || ctx.paused || finished) return;
        const x = robX(r), y = laneY(r.lane) - L.rs * 0.6;
        if (h.w === r.item) {
          ctx.answer(r.item, true, { x, y }); r.state = 'hit'; r.sx = r.x; if (sel === r) sel = null;
          plant(r.lane, r); hand.splice(i, 1); refillHand(); EP.sfx.pop();
        } else {
          r.tries++; ctx.answer(r.item, false, { x, y, label: h.w.word + ' ✗' }); h.wilt = true; renderCards(); ctx.shake(h.el);
          freeze = 1; ctx.timeout(async () => {
            await ctx.reveal(r.item);
            const k = hand.indexOf(h); if (k >= 0) hand.splice(k, 1); refillHand(); freeze = 0;
            if (r.tries >= 2 && r.state === 'walk') { r.state = 'hit'; r.sx = r.x; plant(r.lane, r); ctx.float(robX(r), laneY(r.lane) - L.rs, '🐦 Helper!', 'good'); }
            else if (r.state === 'walk') { sel = r; ctx.say(r.item); }
          }, 350);
        }
        updateHint();
      }
      function plant(lane, r) {
        const f = flowers[lane] || (flowers[lane] = { lane, grow: 0, col: u.pick(['#ff6b9a', '#ffa94d', '#b197fc', '#4dabf7']), puff: 0 });
        f.target = r; f.shots = 3; f.shootT = 0.35; f.puff = 1;
        parts.burst(L.plantX, laneY(lane), '#8ce99a', 14, 160);
      }

      /* ---------- spawning ---------- */
      function spawn() {
        if (si >= n) return; const item = items[si++];
        const used = active().map((r) => r.lane); const free = Array.from({ length: lanesN }, (_, i) => i).filter((i) => !used.includes(i));
        const r = { item, lane: u.pick(free.length ? free : [0, 1, 2, 3]), x: 1, state: 'walk', tries: 0, hue: u.pick(HUES), ph: Math.random() * 6, offT: 0, sx: 1, enter: 0 };
        robots.push(r); ensureInHand(item); EP.sfx.whoosh();
        if (!sel || sel.state !== 'walk') sel = r;
        ctx.say(r.item); updateHint();
      }
      function updateHint() {
        hint.innerHTML = '';
        const r = sel && sel.state === 'walk' ? sel : front();
        hint.appendChild(u.el('div', { class: 'prompt-card', style: { padding: '4px 12px', gap: '10px', pointerEvents: 'auto' } },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); const q = sel && sel.state === 'walk' ? sel : front(); if (q) ctx.say(q.item); } }, '🔊'),
          u.el('div', { style: { fontWeight: 900, fontSize: '1rem', lineHeight: 1.2 } }, r ? 'Tap the robot, then its word!' : 'Robots are coming… 機器人來了',
            r ? u.el('div', { class: 'zh', style: { fontSize: '.9rem', color: 'var(--ink2)' } }, '點機器人，再點正確的英文種子卡') : null)));
      }

      /* ---------- update ---------- */
      function update(dt) {
        if (freeze <= 0) {
          spawnT -= dt;
          if (si < n && (spawnT <= 0 && active().length < MAXON || active().length === 0 && spawnT < GAP - 1.2)) { spawn(); spawnT = GAP; }
        }
        for (const r of robots) {
          r.enter = Math.min(1, r.enter + dt * 2);
          if (r.state === 'walk' && freeze <= 0) {
            r.x -= dt / WALK;
            if (r.x <= 0) { r.x = 0; reachFence(r); }
          } else if (r.state === 'off') { r.offT += dt; if (r.offT > 0.7) { r.state = 'bloom'; r.offT = 0; EP.sfx.chest(); parts.burst(robX(r), laneY(r.lane), '#ffd43b', 18, 220); } }
          else if (r.state === 'bloom') { r.offT += dt; if (r.offT > 0.9) { r.state = 'gone'; patches.push({ x: robX(r), lane: r.lane, e: u.pick(['🌷', '🌼', '🌸', '🌻']) }); resolved(); } }
          else if (r.state === 'leave') { r.x += dt * 0.22; if (r.x > 1.15) { r.state = 'gone'; resolved(); } }
        }
        for (const ln in flowers) {
          const f = flowers[ln]; f.grow = Math.min(1, f.grow + dt * 2.5); f.puff = Math.max(0, f.puff - dt * 2);
          if (f.target && f.shots > 0) { f.shootT -= dt; if (f.shootT <= 0) { f.shootT = 0.18; f.shots--; f.puff = 1; bubbles.push({ x: L.plantX + 14, y: laneY(f.lane) - L.laneH * 0.22, r: f.target, last: f.shots === 0 }); EP.sfx.pop(); } }
        }
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i], tx = robX(b.r); b.x += dt * 900; b.y += Math.sin(t * 12 + i) * 0.6;
          if (b.x >= tx - L.rs * 0.2) { bubbles.splice(i, 1); parts.burst(tx - L.rs * 0.2, b.y, '#d0ebff', 8, 160); if (b.last && b.r.state === 'hit') { b.r.state = 'off'; b.r.offT = 0; EP.sfx.coin(); } }
        }
        for (const r of robots) if (r.state === 'hit') r.x -= dt / WALK * 0.3;
      }
      async function reachFence(r) {
        r.state = 'leave'; gnomes = Math.max(0, gnomes - 1); ctx.hud.extra(`🏡 Gnomes ${gnomes}/3`); ctx.shake();
        ctx.float(L.fence + 40, laneY(r.lane) - 40, '🤖 took a gnome for a ride!', 'bad');
        if (r.tries === 0) ctx.answer(r.item, false, { x: L.fence + 60, y: laneY(r.lane), label: 'Too late! 太慢了' });
        if (sel === r) sel = null;
        freeze = 1; await ctx.reveal(r.item); freeze = 0; updateHint();
      }
      function resolved() {
        done++; ctx.hud.progress(done / n);
        if (done >= n && !finished) {
          finished = true; hint.innerHTML = ''; bar.innerHTML = '';
          ctx.burst('🌻 Garden saved! 花園得救了！'); EP.sfx.win(); ctx.confetti();
          for (let i = 0; i < 8; i++) parts.burst(u.rand(0, L.W), u.rand(L.top, L.bottom), null, 16, 260);
          const st = ctx.stats, tot = st.right + st.wrong, acc = tot ? st.right / tot : 0;
          let stars = acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0; if (gnomes === 0) stars = Math.max(0, stars - 1);
          ctx.timeout(() => ctx.end(gnomes === 0 ? { stars } : {}), 2200);
        }
      }

      /* ---------- input on the field: select a robot ---------- */
      ctx.on(c.cv, 'pointerdown', (e) => {
        const rc = c.cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
        const r = active().find((q) => Math.abs(robX(q) - x) < L.rs * 0.55 && y > laneY(q.lane) - L.rs * 1.05 && y < laneY(q.lane) + L.rs * 0.4);
        if (r) { sel = r; EP.sfx.click(); ctx.say(r.item); updateHint(); }
      });
      ctx.on(window, 'keydown', (e) => { const k = +e.key; if (k >= 1 && k <= HAND) play(k - 1, sel && sel.state === 'walk' ? sel : front()); });

      /* ---------- drawing ---------- */
      function ell(x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7); g.fill(); }
      function scenery() {
        const { W, top } = L; let gr = g.createLinearGradient(0, 0, 0, top); gr.addColorStop(0, '#8fd3ff'); gr.addColorStop(1, '#dff3ff'); g.fillStyle = gr; g.fillRect(0, 0, W, top);
        // hills, bridge and fog
        g.fillStyle = '#7fb069'; g.beginPath(); g.moveTo(0, top); for (let x = 0; x <= W; x += 30) g.lineTo(x, top - 18 - 14 * Math.sin(x / 90)); g.lineTo(W, top); g.fill();
        g.fillStyle = '#4a90c2'; g.fillRect(0, top - 14, W, 14);
        const bx = W * 0.55, bw = Math.min(W * 0.7, 640), deck = top - 22, tw = Math.max(6, bw * 0.02), th = Math.min(top * 0.8, 80);
        g.fillStyle = '#d9480f'; g.fillRect(bx - bw / 2, deck, bw, 5);
        [bx - bw * 0.28, bx + bw * 0.28].forEach((x) => { g.fillRect(x - tw / 2, deck - th, tw, th + 14); });
        g.strokeStyle = '#d9480f'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - bw / 2, deck - 4); g.quadraticCurveTo(bx - bw * 0.39, deck - th * 0.2, bx - bw * 0.28, deck - th); g.quadraticCurveTo(bx, deck + 4, bx + bw * 0.28, deck - th); g.quadraticCurveTo(bx + bw * 0.39, deck - th * 0.2, bx + bw / 2, deck - 4); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) ell(((i * 0.27 + t * 0.01) % 1.2 - 0.1) * W, top * (0.45 + 0.1 * (i % 2)), W * 0.12, top * 0.12, 'rgba(255,255,255,.55)');
        K.emoji(g, '🚋', ((t * 0.04) % 1.2 - 0.1) * W, top - 30, Math.min(34, top * 0.4));
        // lanes
        for (let i = 0; i < lanesN; i++) { g.fillStyle = i % 2 ? '#86cc5f' : '#77bf52'; g.fillRect(0, L.top + i * L.laneH, W, L.laneH + 1); g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = L.plantX + 40; x < W; x += 80) g.fillRect(x, L.top + i * L.laneH + 6, 36, L.laneH - 12); }
        // garden + fence + gnomes
        g.fillStyle = '#5c9e3d'; g.fillRect(0, L.top, L.fence, L.bottom - L.top);
        g.fillStyle = '#fff'; for (let y = L.top; y < L.bottom; y += 20) { g.fillRect(L.fence - 12, y, 9, 15); } g.fillRect(L.fence - 16, L.top, 4, L.bottom - L.top);
        for (let i = 0; i < 3; i++) { const gy = L.top + (L.bottom - L.top) * (i + 0.5) / 3; gnome(L.fence * 0.42, gy, Math.min(L.fence * 0.75, 46), i < gnomes ? 1 : 0.2); }
        for (const p of patches) K.emoji(g, p.e, p.x, laneY(p.lane) + 4, L.rs * 0.42);
      }
      function gnome(x, y, s, a) {
        g.save(); g.globalAlpha = a; ell(x, y + s * 0.5, s * 0.4, s * 0.1, 'rgba(0,0,0,.2)');
        g.fillStyle = '#4263eb'; K.roundRect(g, x - s * 0.3, y, s * 0.6, s * 0.5, s * 0.15); g.fill();
        ell(x, y - s * 0.05, s * 0.24, s * 0.22, '#ffd8b5'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - s * 0.24, y); g.quadraticCurveTo(x, y + s * 0.45, x + s * 0.24, y); g.fill();
        g.fillStyle = '#e03131'; g.beginPath(); g.moveTo(x - s * 0.3, y - s * 0.12); g.lineTo(x + s * 0.3, y - s * 0.12); g.lineTo(x + s * 0.05, y - s * 0.75); g.fill();
        g.restore();
      }
      function flowerDraw(f) {
        const x = L.plantX, y = laneY(f.lane) + L.laneH * 0.3, s = Math.min(L.laneH, 90) * 0.75 * (0.3 + 0.7 * f.grow), p = 1 + f.puff * 0.15;
        g.strokeStyle = '#2b8a3e'; g.lineWidth = Math.max(3, s * 0.07); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - s * 0.1, y - s * 0.3, x, y - s * 0.6); g.stroke();
        ell(x - s * 0.14, y - s * 0.25, s * 0.14, s * 0.06, '#40c057'); ell(x + s * 0.14, y - s * 0.18, s * 0.14, s * 0.06, '#40c057');
        const cy = y - s * 0.72; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + t * 0.5; ell(x + Math.cos(a) * s * 0.2 * p, cy + Math.sin(a) * s * 0.2 * p, s * 0.13, s * 0.13, f.col); }
        ell(x, cy, s * 0.17 * p, s * 0.17 * p, '#fff3bf'); ell(x - s * 0.06, cy - s * 0.02, s * 0.02, s * 0.03, '#1d2340'); ell(x + s * 0.06, cy - s * 0.02, s * 0.02, s * 0.03, '#1d2340');
        ell(x + s * 0.12, cy + s * 0.04, s * 0.05 * (1 + f.puff), s * 0.04 * (1 + f.puff), '#f06595');
      }
      function robotDraw(r) {
        const s = L.rs, x = robX(r), base = laneY(r.lane) + L.laneH * 0.36, off = r.state === 'off' || r.state === 'bloom', walk = r.state === 'walk' || r.state === 'leave';
        const bob = walk ? Math.abs(Math.sin(t * 7 + r.ph)) * s * 0.04 : 0, a = r.state === 'bloom' ? Math.max(0, 1 - r.offT / 0.9) : r.enter;
        g.save(); g.globalAlpha = a; if (r.state === 'leave') { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); }
        ell(x, base, s * 0.32, s * 0.07, 'rgba(0,0,0,.18)');
        const body = off ? '#c9d1d9' : r.hue, y0 = base - s * 0.12 - bob;
        // wheels
        for (const dx of [-0.16, 0.16]) { ell(x + dx * s, base - s * 0.06, s * 0.08, s * 0.08, '#495057'); ell(x + dx * s, base - s * 0.06, s * 0.035, s * 0.035, '#adb5bd'); }
        // body + chest light
        K.roundRect(g, x - s * 0.26, y0 - s * 0.36, s * 0.52, s * 0.38, s * 0.1); g.fillStyle = body; g.fill(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke();
        ell(x, y0 - s * 0.17, s * 0.07, s * 0.07, off ? '#868e96' : (Math.sin(t * 4 + r.ph) > 0 ? '#ff6b6b' : '#ffa8a8'));
        // head with screen face
        const hy = y0 - s * 0.68; K.roundRect(g, x - s * 0.25, hy, s * 0.5, s * 0.32, s * 0.1); g.fillStyle = body; g.fill(); g.stroke();
        K.roundRect(g, x - s * 0.2, hy + s * 0.05, s * 0.4, s * 0.22, s * 0.07); g.fillStyle = '#1d2340'; g.fill();
        g.strokeStyle = off ? '#868e96' : '#66d9e8'; g.lineWidth = Math.max(2, s * 0.03); g.lineCap = 'round'; g.beginPath();
        for (const ex of [-0.08, 0.08]) { if (off) { g.moveTo(x + (ex - 0.04) * s, hy + s * 0.16); g.lineTo(x + (ex + 0.04) * s, hy + s * 0.16); } else { g.moveTo(x + (ex - 0.045) * s, hy + s * 0.17); g.quadraticCurveTo(x + ex * s, hy + s * 0.09, x + (ex + 0.045) * s, hy + s * 0.17); } }
        g.stroke(); if (off) K.text(g, 'z', x + s * 0.3, hy - s * 0.05 - (r.offT * 20), s * 0.16, '#495057');
        // antenna
        g.strokeStyle = '#495057'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, hy); g.lineTo(x, hy - s * 0.12); g.stroke(); ell(x, hy - s * 0.14, s * 0.04, s * 0.04, off ? '#adb5bd' : '#ffd43b');
        // arm + sign (held out in front, i.e. to the left)
        if (r.state !== 'leave') {
          g.strokeStyle = '#495057'; g.lineWidth = Math.max(3, s * 0.04); g.beginPath(); g.moveTo(x - s * 0.24, y0 - s * 0.22); g.lineTo(x - s * 0.42, y0 - s * 0.42); g.stroke();
          const sw = s * 0.6, sx = x - s * 0.44 - sw / 2, sy = y0 - s * 0.4 - sw * 0.9;
          g.fillStyle = '#8d6e63'; g.fillRect(x - s * 0.43, sy + sw * 0.8, 4, sw * 0.15);
          K.roundRect(g, sx, sy, sw, sw * 0.8, 10); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = sel === r ? '#ffd43b' : '#adb5bd'; g.stroke();
          const pic = EP.pic(r.item);
          if (D === 'hard' && r.state === 'walk') K.emoji(g, '🔊', sx + sw / 2, sy + sw * 0.4, sw * 0.45);
          else if (pic) K.emoji(g, pic, sx + sw / 2, sy + sw * 0.41, sw * 0.62);
          else { const fs = K.fitSize(g, r.item.zh, sw * 0.86, sw * 0.38, 12); K.text(g, r.item.zh, sx + sw / 2, sy + sw * 0.42, fs, '#17246b', { font: "'Noto Sans TC','PingFang TC',sans-serif" }); }
        } else gnome(x, hy - s * 0.12, s * 0.36, 1);
        g.restore();
        if (sel === r && r.state === 'walk') { g.strokeStyle = `rgba(255,212,59,${0.6 + 0.4 * Math.sin(t * 8)})`; g.lineWidth = 4; g.beginPath(); g.ellipse(x, base, s * 0.4, s * 0.1, 0, 0, 7); g.stroke(); K.text(g, '▼', x + s * 0.12, y0 - s * 0.98 - Math.abs(Math.sin(t * 5)) * 6, Math.max(18, s * 0.2), '#ffd43b', { stroke: '#7a5a00' }); }
        if (r.state === 'bloom') { const k = r.offT / 0.9; ['🌷', '🌼', '🌸'].forEach((e, i) => K.emoji(g, e, x + (i - 1) * s * 0.25, base - s * 0.2 - k * s * 0.2, s * 0.35 * k)); }
      }
      layout(); updateHint(); refillHand(); ctx.hud.extra('🏡 Gnomes 3/3');
      ctx.loop((dt) => {
        t += dt; if (c.w !== L.W || c.h !== L.H) layout();
        update(dt); parts.update(dt);
        g.clearRect(0, 0, L.W, L.H); scenery();
        for (const ln in flowers) flowerDraw(flowers[ln]);
        robots.filter((r) => r.state !== 'gone').sort((a, b) => a.lane - b.lane).forEach(robotDraw);
        for (const b of bubbles) { g.fillStyle = 'rgba(208,235,255,.75)'; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); ell(b.x - 3, b.y - 3, 2.5, 2, '#fff'); }
        parts.draw(g);
      });
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { const r = sel && sel.state === 'walk' ? sel : front(); if (!r) return; const i = hand.findIndex((h) => h.w === r.item && !h.wilt); if (i >= 0) play(i, r); },
          wrong() { const r = sel && sel.state === 'walk' ? sel : front(); if (!r) return; const i = hand.findIndex((h) => h.w !== r.item && !h.wilt); if (i >= 0) play(i, r); },
        },
      };
    },
  });
})();
