/* Level 19 — Colosseum Kart (inspired by kart racers such as Mario Kart / SuperTuxKart: pseudo-3D road, rival karts,
 * boosts, pick-up items, 3 laps and a podium). Word gates span the 3 lanes: steer through the gate that matches the
 * prompt for a boost; the wrong gate makes you spin. Original art: emoji drivers in simple coloured karts. */
(function () {
  const EP = window.EP, u = EP.u;
  const SEG = 200, ROADW = 1000, CAMH = 1000, DEPTH = 0.84, DRAW = 110, PLAYERZ = CAMH * DEPTH, LANES = [-0.64, 0, 0.64], LAPS = 3;
  EP.registerGame({
    id: 'kart', level: 19, icon: '🏎️', title: 'Colosseum Kart', titleZh: '羅馬競技場賽車',
    model: 'Mario Kart / SuperTuxKart（Mario Kart 8 Deluxe 售出 7,153 萬套）',
    howZh: '聽英文、看圖片，左右換車道，從正確單字的拱門開過去就能加速！開錯會打轉。撿彩虹寶石拿道具，跑完三圈拿冠軍！',
    howEn: 'Steer left or right and drive through the gate with the right word for a boost. Win the 3-lap race!',
    skills: ['listening', 'reading', 'meaning'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit, D = ctx.difficulty, items = ctx.items, n = items.length;
      root.style.background = '#87c7f0';
      const c = K.canvas(root), g = c.g, parts = K.particles();
      const CRUISE = (D === 'easy' ? 18 : D === 'hard' ? 26 : 22) * SEG, GAPSEC = D === 'easy' ? 7 : D === 'hard' ? 5 : 6;
      const GAP = Math.round(CRUISE / SEG * GAPSEC), GPL = Math.ceil(n / LAPS), LAPN = Math.max(GPL * GAP, 160), TRACK = LAPN * SEG, FINISH = LAPS * TRACK;

      /* ---------- track: curves + roadside Rome ---------- */
      const segs = [];
      while (segs.length < LAPN) {
        const straight = u.randInt(25, 50), len = u.randInt(40, 80), curve = (Math.random() < 0.5 ? -1 : 1) * u.rand(1.5, 3.5) / 1000;
        for (let i = 0; i < straight; i++) segs.push({ curve: 0 });
        for (let i = 0; i < len; i++) { const e = Math.sin((i / len) * Math.PI); segs.push({ curve: curve * e }); }
      }
      segs.length = LAPN; for (let i = LAPN - 30; i < LAPN; i++) segs[i].curve *= (LAPN - i) / 30; for (let i = 0; i < 10; i++) segs[i].curve = 0;
      segs.forEach((s, i) => {
        s.i = i; s.sprites = [];
        if (i % 7 === 0) s.sprites.push({ k: 'cypress', off: -1.5 - Math.random() * 0.8 });
        if (i % 7 === 3) s.sprites.push({ k: 'cypress', off: 1.5 + Math.random() * 0.8 });
        if (i % 23 === 11) s.sprites.push({ k: 'pine', off: (Math.random() < 0.5 ? -1 : 1) * u.rand(2.2, 3.2) });
        if (i % 31 === 5) { s.sprites.push({ k: 'column', off: -1.35 }); s.sprites.push({ k: 'column', off: 1.35 }); }
        if (i % 97 === 50) s.sprites.push({ k: 'temple', off: (Math.random() < 0.5 ? -1 : 1) * 3 });
        if (i < 6 || i > LAPN - 4) s.sprites.push({ k: 'crowd', off: -1.9 }, { k: 'crowd', off: 1.9 });
      });

      /* ---------- gates, item orbs, rivals ---------- */
      const gates = items.map((it, k) => {
        const opts = u.shuffle([it].concat(ctx.distractors(it, 2, {}))); while (opts.length < 3) opts.push(null);
        return { item: it, opts, z: ((k + 0.7) * GAP + 20) * SEG, done: false, res: null };
      });
      const orbs = []; for (let k = 0; k < n; k++) if (k % 2 === 0 || D === 'easy') orbs.push({ z: ((k + 0.2) * GAP + 20) * SEG, lane: u.randInt(0, 2), taken: false });
      const faces = ['🦊', '🐸', '🐵', '🐧', '🐯', '🐨', '🐰', '🐶'].filter((f) => !EP.me || f !== EP.me.avatar);
      const ais = [{ col: '#1c7ed6', sk: 0.03 }, { col: '#2f9e44', sk: 0.0 }, { col: '#f59f00', sk: -0.03 }].map((a, i) =>
        Object.assign(a, { face: faces[i], name: ['Luca', 'Sofia', 'Marco'][i], z: (i + 1) * 4 * SEG, x: LANES[i % 3], lane: i % 3, spin: 0, swapT: u.rand(2, 5), done: false, fin: 0 }));
      const me = { face: (EP.me && EP.me.avatar) || '🐼', col: '#e03131', dist: 0, speed: 0, x: 0, lane: 1, spin: 0, boostT: 0, starT: 0, shield: false, item: null };
      let gi = 0, prompt = false, slow = false, t = 0, bgX = 0, lapShown = 0, lastHud = '', finished = false, finishOrder = 0, testLock = -1;

      /* ---------- DOM: prompt, lane chips, controls ---------- */
      const top = u.el('div', { style: { position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '98%', pointerEvents: 'none' } });
      const chips = u.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', width: 'min(640px, 100%)', pointerEvents: 'auto' } });
      root.appendChild(top);
      const btnS = { position: 'absolute', bottom: '12px', zIndex: 6, width: '76px', height: '76px', borderRadius: '50%', fontSize: '2rem', padding: 0 };
      const leftB = u.el('button', { class: 'btn', title: 'Left 左', style: Object.assign({ left: '12px' }, btnS) }, '◀');
      const rightB = u.el('button', { class: 'btn', title: 'Right 右', style: Object.assign({ right: '12px' }, btnS) }, '▶');
      const itemB = u.el('button', { class: 'btn', title: 'Use item 使用道具', style: Object.assign({}, btnS, { right: '12px', bottom: '100px', width: '68px', height: '68px', background: 'rgba(255,255,255,.75)' }) }, '');
      root.append(leftB, rightB, itemB);
      ctx.on(leftB, 'pointerdown', (e) => { e.preventDefault(); steer(-1); });
      ctx.on(rightB, 'pointerdown', (e) => { e.preventDefault(); steer(1); });
      ctx.on(itemB, 'pointerdown', (e) => { e.preventDefault(); useItem(); });
      function renderItem() { itemB.textContent = me.item || '·'; itemB.style.opacity = me.item ? 1 : 0.55; itemB.style.animation = me.item ? 'pulse 1.2s infinite' : ''; }
      function showPrompt() {
        top.innerHTML = ''; chips.innerHTML = ''; if (gi >= n) return;
        const gt = gates[gi], it = gt.item, pic = EP.pic(it), hard = D === 'hard';
        top.appendChild(u.el('div', { class: 'prompt-card', style: { padding: '6px 14px', pointerEvents: 'auto' } },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(it); } }, '🔊'),
          hard ? null : pic ? u.el('div', { class: 'pic', style: { fontSize: '2.6rem' } }, pic) : u.el('div', { class: 'zh', style: { fontSize: '1.7rem', fontWeight: 900 } }, it.zh),
          u.el('div', { style: { fontWeight: 900, fontSize: '1rem', lineHeight: 1.2 } }, hard ? 'Listen! Which gate?' : 'Drive through the right gate!', u.el('div', { class: 'zh', style: { fontSize: '.9rem', color: 'var(--ink2)' } }, '開進正確的拱門'))));
        gt.opts.forEach((w, i) => {
          const b = u.el('button', { class: 'lane-chip', style: { minHeight: '50px', borderRadius: '14px', fontWeight: 900, fontSize: w && w.word.length > 8 ? '1.15rem' : '1.4rem', background: 'rgba(255,255,255,.88)', color: '#3b2b00', boxShadow: '0 4px 0 rgba(0,0,0,.2)', border: '3px solid transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 6px' } }, w ? w.word : '—');
          ctx.on(b, 'pointerdown', (e) => { e.preventDefault(); setLane(i); });
          chips.appendChild(b);
        });
        top.appendChild(chips); prompt = true; markChips();
        ctx.timeout(() => ctx.say(it), 150);
      }
      function markChips() { Array.from(chips.children).forEach((b, i) => { b.style.borderColor = i === me.lane ? '#ffd43b' : 'transparent'; b.style.transform = i === me.lane ? 'translateY(-2px) scale(1.04)' : 'none'; }); }

      /* ---------- driving ---------- */
      function setLane(l) { if (finished || ctx.paused || testLock === gi) return; l = u.clamp(l, 0, 2); if (l !== me.lane) { me.lane = l; EP.sfx.click(); markChips(); } }
      function steer(d) { setLane(me.lane + d); }
      function useItem() {
        if (!me.item || finished || ctx.paused) return; const it = me.item; me.item = null; renderItem();
        if (it === '⚡') { me.boostT = 1.3; EP.sfx.whoosh(); ctx.float(c.w / 2, c.h * 0.6, '⚡ Boost!', 'good'); }
        else if (it === '🫧') { me.shield = true; EP.sfx.pop(); ctx.float(c.w / 2, c.h * 0.6, '🫧 Bubble shield!', 'good'); }
        else { me.starT = 3; EP.sfx.chest(); ctx.float(c.w / 2, c.h * 0.6, '⭐ Sparkle mode!', 'good'); }
      }
      function passGate(gt) {
        gt.done = true; prompt = false; const lane = LANES.map((x, i) => [Math.abs(x - me.x), i]).sort((a, b) => a[0] - b[0])[0][1];
        const pick = gt.opts[lane], ok = pick === gt.item; gt.res = { lane, ok }; testLock = -1;
        const fx = c.w / 2, fy = c.h * 0.55;
        if (ok) {
          ctx.answer(gt.item, true, { x: fx, y: fy }); me.boostT = 1.6; EP.sfx.whoosh(); ctx.float(fx, fy - 50, '🚀 BOOST!', 'good');
          gi++; ctx.hud.progress(gi / n); ctx.timeout(() => ctx.say(gt.item), 120); ctx.timeout(showPrompt, 700);
        } else {
          ctx.answer(gt.item, false, { x: fx, y: fy, label: (pick ? pick.word : '—') + ' ✗' });
          if (me.shield) { me.shield = false; ctx.float(fx, fy - 50, '🫧 Shield saved you!', 'good'); EP.sfx.pop(); } else { me.spin = 1; ctx.shake(); }
          gi++; ctx.hud.progress(gi / n); top.innerHTML = ''; slow = true;
          ctx.timeout(async () => { await ctx.reveal(gt.item); slow = false; showPrompt(); }, 250);
        }
      }
      function finishRace() {
        finished = true; top.innerHTML = ''; [leftB, rightB, itemB].forEach((b) => b.remove());
        const racers = [{ name: (EP.me && EP.me.name) || 'You', av: me.face, me: true, fin: finishOrder + 1 }].concat(ais.map((a) => ({ name: a.name, av: a.face, fin: a.done ? a.fin : 99, z: a.z })));
        ais.forEach((a) => { if (!a.done) a.after = true; });
        racers.sort((a, b) => a.fin - b.fin || (b.z || 0) - (a.z || 0));
        const place = racers.findIndex((r) => r.me) + 1;
        ctx.burst(place === 1 ? '🏆 Vittoria! 冠軍！' : `🏁 Finish! #${place}`); EP.sfx.win(); if (place <= 3) ctx.confetti();
        ctx.timeout(() => {
          const top3 = racers.slice(0, 3), order = [top3[1], top3[0], top3[2]].filter(Boolean), hts = ['84%', '62%', '46%'];
          const pod = u.el('div', { class: 'podium', style: { height: '46%', width: 'min(640px,94%)' } }, order.map((r) => {
            const p = top3.indexOf(r);
            return u.el('div', { class: 'col', style: { height: hts[p], background: ['#ffd43b', '#ced4da', '#e8a87c'][p], color: '#3b2b00', outline: r.me ? '5px solid #fff' : '', animationDelay: (2 - p) * 0.4 + 's' } },
              u.el('div', { style: { fontSize: '2.6rem' } }, r.av), u.el('div', {}, r.me ? 'YOU' : r.name), u.el('div', { style: { fontSize: '1.6rem' } }, ['🥇', '🥈', '🥉'][p]));
          }));
          root.appendChild(u.el('div', { style: { position: 'absolute', inset: 0, zIndex: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '4%', background: 'linear-gradient(transparent 30%, rgba(0,0,0,.45))' } },
            u.el('h2', { style: { color: '#fff', fontSize: '2rem', margin: '0 0 8px', textShadow: '0 3px 0 rgba(0,0,0,.3)' } }, `🏆 Podium 頒獎台 — #${place}`), pod));
        }, 900);
        ctx.timeout(() => ctx.end(), 4400);
      }

      /* ---------- input: keys + swipe / tap sides ---------- */
      ctx.on(window, 'keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') steer(-1); else if (e.key === 'ArrowRight' || e.key === 'd') steer(1);
        else if (e.key === ' ' || e.key === 'ArrowUp') useItem(); else return; e.preventDefault();
      });
      let p0 = null;
      ctx.on(c.cv, 'pointerdown', (e) => { p0 = { x: e.clientX, y: e.clientY }; });
      ctx.on(c.cv, 'pointerup', (e) => {
        if (!p0) return; const dx = e.clientX - p0.x; p0 = null;
        if (Math.abs(dx) > 30) return steer(Math.sign(dx));
        const rc = c.cv.getBoundingClientRect(), x = e.clientX - rc.left; if (x < rc.width / 3) steer(-1); else if (x > rc.width * 2 / 3) steer(1);
      });

      /* ---------- update ---------- */
      function update(dt) {
        if (finished) { me.speed = Math.max(0, me.speed - CRUISE * dt * 0.8); me.dist += me.speed * dt; return; }
        me.boostT = Math.max(0, me.boostT - dt); me.starT = Math.max(0, me.starT - dt); me.spin = Math.max(0, me.spin - dt * 0.9);
        let target = CRUISE * (me.boostT > 0 ? 1.7 : 1) * (me.starT > 0 ? 1.35 : 1) * (me.spin > 0 ? 0.45 : 1) * (slow ? 0.55 : 1);
        me.speed += (target - me.speed) * Math.min(1, dt * (me.speed < target ? 1.6 : 3));
        const prev = me.dist; me.dist += me.speed * dt;
        me.x += (LANES[me.lane] - me.x) * Math.min(1, dt * 7);
        const curSeg = segs[Math.floor((me.dist % TRACK) / SEG)]; bgX += curSeg.curve * me.speed * dt * 0.06;
        // gates + orbs
        const gt = gates[gi]; if (gt && !gt.done && me.dist >= gt.z) passGate(gt);
        for (const o of orbs) if (!o.taken && prev < o.z && me.dist >= o.z && Math.abs(me.x - LANES[o.lane]) < 0.35) {
          o.taken = true; me.item = me.item || u.pick(['⚡', '🫧', '⭐']); renderItem(); EP.sfx.coin(); parts.burst(c.w / 2, c.h * 0.8, null, 20, 260);
        }
        // laps
        const lap = Math.min(LAPS, Math.floor(me.dist / TRACK) + 1);
        if (lap > lapShown) { if (lapShown) { ctx.burst(lap === LAPS ? '🏁 Final lap! 最後一圈！' : `Lap ${lap}/${LAPS} 第${lap}圈`); EP.sfx.levelUp(); } lapShown = lap; }
        if (me.dist >= FINISH && gi >= n) return finishRace();
        // rivals with gentle rubber-banding
        for (const a of ais) {
          if (a.done) { a.z += CRUISE * 0.5 * dt; continue; }
          a.spin = Math.max(0, a.spin - dt * 0.9);
          const diff = (me.dist - a.z) / SEG, sp = (CRUISE / SEG * (0.95 + a.sk) + u.clamp(diff * 0.05, -3.5, 6)) * (a.spin > 0 ? 0.45 : 1);
          const pz = a.z; a.z += sp * SEG * dt;
          if (gates.some((q) => pz < q.z && a.z >= q.z) && Math.random() < 0.15) a.spin = 1;
          a.swapT -= dt; const near = Math.abs(a.z - me.dist) < 3 * SEG && a.lane === me.lane;
          if (a.swapT <= 0 || near) { a.swapT = u.rand(2.5, 6); a.lane = (a.lane + (Math.random() < 0.5 ? 1 : 2)) % 3; }
          a.x += (LANES[a.lane] - a.x) * Math.min(1, dt * 3);
          if (a.z >= FINISH) { a.done = true; a.fin = ++finishOrder; }
        }
        const rank = 1 + ais.filter((a) => a.z > me.dist).length, lab = `🏁 Lap ${lap}/${LAPS} · ${rank}${['st', 'nd', 'rd', 'th'][rank - 1]}`;
        if (lab !== lastHud) { lastHud = lab; ctx.hud.extra(lab); }
        if (me.boostT > 0 || me.starT > 0) for (let i = 0; i < 2; i++) parts.burst(c.w / 2 + u.rand(-30, 30), c.h * 0.92, me.starT > 0 ? null : u.pick(['#ffd43b', '#ff922b', '#fff']), 1, 120);
      }

      /* ---------- rendering ---------- */
      let V = {};
      function view() { const W = c.w, H = c.h; V = { W, H, hz: H * 0.4, Kx: Math.min(W * 0.62, H * 0.9), Ky: H * 0.95 - H * 0.4 }; }
      function poly(x1, y1, w1, x2, y2, w2, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x1 - w1, y1); g.lineTo(x2 - w2, y2); g.lineTo(x2 + w2, y2); g.lineTo(x1 + w1, y1); g.closePath(); g.fill(); }
      function ell(x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7); g.fill(); }
      function sky() {
        const { W, H, hz } = V; let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#6ec3f5'); gr.addColorStop(1, '#ffe8b8'); g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2);
        ell(W * 0.8, hz * 0.35, 34, 34, 'rgba(255,236,150,.9)');
        g.fillStyle = '#a8c98a'; g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 22 - 16 * Math.sin((x + bgX * 0.5) / 110)); g.lineTo(W, hz); g.fill();
        // Colosseum on the skyline (parallax)
        const cw = Math.min(W * 0.42, 420), ch = cw * 0.32, cx = (((W * 0.62 - bgX) % (W + cw)) + W + cw) % (W + cw) - cw / 2, cy = hz - ch;
        g.fillStyle = '#e4c79a'; g.beginPath(); g.moveTo(cx - cw / 2, hz); g.lineTo(cx - cw / 2, cy + ch * 0.1); g.quadraticCurveTo(cx, cy - ch * 0.12, cx + cw * 0.32, cy + ch * 0.05); g.lineTo(cx + cw / 2, cy + ch * 0.45); g.lineTo(cx + cw / 2, hz); g.fill();
        g.fillStyle = '#b8935f'; for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) { const ax = cx - cw * 0.46 + i * cw * 0.078, ay = cy + ch * (0.22 + r * 0.26); if (ax > cx + cw * 0.34 && r === 0) continue; K.roundRect(g, ax, ay, cw * 0.045, ch * 0.17, cw * 0.02); g.fill(); }
      }
      function sprite(k, x, y, s) { // x,y = ground point, s = px per world unit
        if (k === 'cypress') { const h = 1700 * s; g.fillStyle = '#6b4f2a'; g.fillRect(x - 40 * s, y - h * 0.12, 80 * s, h * 0.12); ell(x, y - h * 0.55, 190 * s, h * 0.47, '#245a35'); ell(x - 50 * s, y - h * 0.6, 60 * s, h * 0.3, 'rgba(255,255,255,.08)'); }
        else if (k === 'pine') { const h = 1500 * s; g.strokeStyle = '#6b4f2a'; g.lineWidth = Math.max(1, 70 * s); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 * s, y - h * 0.8); g.stroke(); ell(x + 60 * s, y - h * 0.85, 650 * s, 230 * s, '#3b7a3a'); }
        else if (k === 'column') { const h = 1500 * s, w = 160 * s; g.fillStyle = '#f1e7d4'; g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = '#d9c8a8'; g.fillRect(x - w * 0.8, y - h - 50 * s, w * 1.6, 70 * s); g.fillRect(x - w * 0.75, y - 60 * s, w * 1.5, 60 * s); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x - w * 0.2, y - h, w * 0.12, h); }
        else if (k === 'temple') K.emoji(g, '🏛️', x, y - 700 * s, 1400 * s);
        else if (k === 'crowd') { for (let i = 0; i < 5; i++) ell(x + (i - 2) * 180 * s, y - 260 * s - Math.abs(Math.sin(t * 6 + i)) * 60 * s, 90 * s, 90 * s, ['#e03131', '#ffd43b', '#1c7ed6', '#2f9e44', '#f783ac'][i]); }
      }
      function drawKart(x, y, w, col, face, o) {
        o = o || {}; const h = w * 0.6;
        g.save(); g.translate(x, y); g.rotate(o.rot || 0);
        ell(0, 0, w * 0.55, h * 0.12, 'rgba(0,0,0,.25)');
        if (o.star) { g.shadowColor = `hsl(${(t * 400) % 360},90%,60%)`; g.shadowBlur = 25; }
        g.fillStyle = '#222'; K.roundRect(g, -w * 0.55, -h * 0.42, w * 0.22, h * 0.42, w * 0.05); g.fill(); K.roundRect(g, w * 0.33, -h * 0.42, w * 0.22, h * 0.42, w * 0.05); g.fill();
        K.roundRect(g, -w * 0.38, -h * 0.62, w * 0.76, h * 0.5, h * 0.14); g.fillStyle = col; g.fill(); g.shadowBlur = 0;
        g.fillStyle = 'rgba(255,255,255,.3)'; K.roundRect(g, -w * 0.32, -h * 0.58, w * 0.64, h * 0.1, h * 0.05); g.fill();
        g.fillStyle = '#495057'; g.fillRect(-w * 0.2, -h * 0.17, w * 0.1, h * 0.08); g.fillRect(w * 0.1, -h * 0.17, w * 0.1, h * 0.08);
        g.fillStyle = '#343a40'; g.fillRect(-w * 0.3, -h * 0.98, w * 0.04, h * 0.36); g.fillRect(w * 0.26, -h * 0.98, w * 0.04, h * 0.36);
        K.emoji(g, face, 0, -h * 0.82, w * 0.38);
        K.roundRect(g, -w * 0.42, -h * 1.04, w * 0.84, h * 0.12, h * 0.05); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.stroke();
        if (o.shield) { g.strokeStyle = 'rgba(160,220,255,.9)'; g.fillStyle = 'rgba(200,235,255,.25)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -h * 0.5, w * 0.7, h * 0.85, 0, 0, 7); g.fill(); g.stroke(); }
        g.restore();
      }
      function gateDraw(gt, x, y, s) {
        const pw = 520 * s, ph = 250 * s, py = y - 520 * s;
        g.fillStyle = '#efe3c8'; [-1.12, 1.12].forEach((ox) => { g.fillRect(x + ox * ROADW * s - 70 * s, y - 900 * s, 140 * s, 900 * s); });
        g.fillStyle = '#d9c39a'; g.fillRect(x - 1.25 * ROADW * s, y - 960 * s, 2.5 * ROADW * s, 110 * s);
        if (s * 110 > 9) K.text(g, 'SPQR · ROMA', x, y - 905 * s, 80 * s, '#8a6a33', { weight: 900 });
        gt.opts.forEach((w, i) => {
          const px = x + LANES[i] * ROADW * s, res = gt.res;
          g.fillStyle = '#8a6a33'; g.fillRect(px - 8 * s, y - 850 * s, 16 * s, 330 * s);
          K.roundRect(g, px - pw / 2, py - ph / 2, pw, ph, 40 * s);
          g.fillStyle = res ? (w === gt.item ? '#b2f2bb' : i === res.lane ? '#ffc9c9' : '#dee2e6') : '#fffdf5'; g.fill(); g.lineWidth = Math.max(1.5, 22 * s); g.strokeStyle = '#d4a017'; g.stroke();
          if (w && pw > 26) { const fs = K.fitSize(g, w.word, pw * 0.88, ph * 0.62, 6); K.text(g, w.word, px, py + 4 * s, fs, '#3b2b00'); }
        });
      }
      function render() {
        const { W, H, hz, Kx, Ky } = V; sky();
        const camZ = me.dist - PLAYERZ, camLocal = ((camZ % TRACK) + TRACK) % TRACK, baseI = Math.floor(camLocal / SEG), basePct = (camLocal % SEG) / SEG;
        const camX = me.x * ROADW, proj = [];
        let x = 0, dx = -segs[baseI].curve * basePct * SEG;
        for (let nn = 0; nn <= DRAW + 1; nn++) {
          const dz = nn * SEG - basePct * SEG, sc = DEPTH / Math.max(1, dz);
          proj.push({ x: W / 2 + sc * (x - camX) * Kx, y: hz + sc * CAMH * Ky / 1, s: sc * Kx, dz, seg: segs[(baseI + nn) % LAPN] });
          x += dx; dx += segs[(baseI + nn) % LAPN].curve * SEG;
        }
        g.fillStyle = '#7cc45a'; g.fillRect(0, hz, W, H - hz);
        for (let nn = DRAW; nn >= 0; nn--) {
          const a = proj[nn], b = proj[nn + 1]; if (a.dz < 60) continue;
          const i = a.seg.i, alt = Math.floor(i / 3) % 2, ya = Math.min(a.y, H * 3) + 1;
          g.fillStyle = alt ? '#7cc45a' : '#6fb84f'; g.fillRect(0, b.y, W, ya - b.y + 1);
          poly(a.x, ya, a.s * ROADW * 1.12, b.x, b.y, b.s * ROADW * 1.12, alt ? '#e03131' : '#f8f9fa');
          poly(a.x, ya, a.s * ROADW, b.x, b.y, b.s * ROADW, alt ? '#cdb898' : '#c5af8e');
          if (alt) for (const lx of [-0.32, 0.32]) poly(a.x + lx * ROADW * a.s, ya, a.s * 22, b.x + lx * ROADW * b.s, b.y, b.s * 22, 'rgba(255,255,255,.75)');
          if (i < 2) for (let q = 0; q < 8; q++) { const f0 = -1 + q / 4, f1 = f0 + 0.25; g.fillStyle = (q + i) % 2 ? '#212529' : '#fff'; g.beginPath(); g.moveTo(a.x + f0 * ROADW * a.s, ya); g.lineTo(a.x + f1 * ROADW * a.s, ya); g.lineTo(b.x + f1 * ROADW * b.s, b.y); g.lineTo(b.x + f0 * ROADW * b.s, b.y); g.fill(); }
        }
        // collect sprites far → near
        const list = [];
        for (let nn = DRAW; nn >= 1; nn--) { const a = proj[nn]; for (const sp of a.seg.sprites) list.push({ dz: a.dz, f: () => sprite(sp.k, a.x + sp.off * ROADW * a.s, a.y, a.s) }); if (a.seg.i === 0) list.push({ dz: a.dz, f: () => { K.roundRect(g, a.x - ROADW * 1.2 * a.s, a.y - 1100 * a.s, ROADW * 2.4 * a.s, 160 * a.s, 30 * a.s); g.fillStyle = '#c92a2a'; g.fill(); if (a.s * 160 > 10) K.text(g, 'START · FINISH', a.x, a.y - 1020 * a.s, 100 * a.s, '#fff'); } }); }
        const at = (z) => { const dz = z - camZ; if (dz < 80 || dz > DRAW * SEG) return null; const f = dz / SEG + basePct, k = Math.floor(f), r = f - k, a = proj[k], b = proj[k + 1]; return { dz, x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r, s: a.s + (b.s - a.s) * r }; };
        for (const gt of gates) { const p = at(gt.z); if (p) list.push({ dz: p.dz, f: () => gateDraw(gt, p.x, p.y, p.s) }); }
        for (const o of orbs) { if (o.taken) continue; const p = at(o.z); if (p) list.push({ dz: p.dz, f: () => { const ox = p.x + LANES[o.lane] * ROADW * p.s, r = 150 * p.s, oy = p.y - 260 * p.s + Math.sin(t * 4 + o.z) * 40 * p.s; g.save(); g.translate(ox, oy); g.rotate(t * 2); const gr = g.createLinearGradient(-r, -r, r, r); ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'].forEach((cc, i) => gr.addColorStop(i / 4, cc)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, 0); g.lineTo(0, r); g.lineTo(-r * 0.8, 0); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, 20 * p.s); g.stroke(); g.restore(); if (r > 6) K.emoji(g, '✨', ox + r, oy - r, r); } }); }
        for (const a of ais) { const p = at(a.z); if (p) list.push({ dz: p.dz, f: () => drawKart(p.x + a.x * ROADW * p.s, p.y, 440 * p.s, a.col, a.face, { rot: a.spin > 0 ? (1 - a.spin) * Math.PI * 4 : 0 }) }); }
        list.sort((p, q) => q.dz - p.dz).forEach((o) => o.f());
        // speed lines while boosting
        if (me.boostT > 0 || me.starT > 0) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + t * 3, r0 = Math.min(W, H) * (0.35 + ((t * 3 + i * 0.37) % 1) * 0.3); g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, hz + Math.sin(a) * r0 * 0.6); g.lineTo(W / 2 + Math.cos(a) * (r0 + 60), hz + Math.sin(a) * (r0 + 60) * 0.6); g.stroke(); } }
        parts.draw(g);
        const kw = Math.min(Kx * 0.44, 230), tilt = (LANES[me.lane] - me.x) * -0.5 + (segs[baseI].curve * 60);
        drawKart(W / 2, H * 0.95, kw, me.col, me.face, { rot: me.spin > 0 ? (1 - me.spin) * Math.PI * 4 + Math.sin(t * 30) * 0.05 : u.clamp(tilt, -0.25, 0.25) + Math.sin(t * 25) * 0.01, shield: me.shield, star: me.starT > 0 });
      }
      view(); renderItem(); ctx.timeout(showPrompt, 400);
      ctx.loop((dt) => { t += dt; if (c.w !== V.W || c.h !== V.H) view(); update(dt); parts.update(dt); g.clearRect(0, 0, V.W, V.H); render(); });

      /* test hooks: commit to the right / a wrong lane for the current gate and skip ahead to it */
      function testDrive(right) {
        const gt = gates[gi]; if (!gt || !prompt || finished || testLock === gi) return;
        const ci = gt.opts.indexOf(gt.item), lane = right ? ci : [0, 1, 2].find((i) => i !== ci);
        me.lane = lane; me.x = LANES[lane]; markChips(); testLock = gi;
        me.dist = Math.max(me.dist, gt.z - me.speed * 0.5 - SEG);
      }
      return { destroy() { c.destroy(); }, test: { correct() { testDrive(true); }, wrong() { testDrive(false); } } };
    },
  });
})();
