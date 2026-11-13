/* Level 20 — Fruit Snake (inspired by Snake / slither.io: steer, eat, grow — walls wrap, nobody dies)
 * A floating-market raft in Bangkok. Hear the word, see the picture, then eat the letter-fruits IN ORDER.
 * Wrong fruit: the snake loses 2 segments and gets dizzy for a moment. One ctx.answer per word. */
(function () {
  const EP = window.EP, u = EP.u;
  const COLS = ['#ff922b', '#fa5252', '#be4bdb', '#f59f00', '#4c6ef5', '#f06595', '#12b886', '#e8590c', '#7950f2', '#0c8599', '#d6336c', '#5c940d'];
  const colOf = (ch) => COLS[(ch.toLowerCase().charCodeAt(0) * 7) % COLS.length];
  const CSS = `
  .fs-top{position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:6;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 12px;background:rgba(255,255,255,.94);border-radius:22px;padding:8px 14px;box-shadow:0 6px 0 rgba(0,0,0,.15);width:max-content;max-width:calc(100% - 16px);color:#1d2340}
  .fs-top .say{width:56px;height:56px;border-radius:50%;background:#47b8ff;color:#fff;font-size:1.6rem;box-shadow:0 4px 0 rgba(0,0,0,.2);flex:none}
  .fs-pic{font-size:2.9rem;line-height:1}
  .fs-zh{font-size:1.35rem;font-weight:800;color:#4a5275;font-family:var(--font-zh)}
  .fs-slots{display:flex;gap:4px}
  .fs-slot{display:flex;align-items:center;justify-content:center;border-radius:10px;background:#edf2ff;border:3px solid #dbe4ff;font-weight:900;color:#1d2340;line-height:1}
  .fs-slot.on{background:var(--c);border-color:rgba(0,0,0,.12);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.3);animation:fsPop .3s}
  .fs-slot.next{border-color:#fab005;box-shadow:0 0 0 4px rgba(250,176,5,.35)}
  .fs-slot.ghost{color:rgba(29,35,64,.25)}
  .fs-slot.gap{background:none;border-color:transparent}
  @keyframes fsPop{0%{transform:scale(1.6) rotate(-10deg)}100%{transform:scale(1)}}
  .fs-pad{position:absolute;z-index:6;display:grid;grid-template-columns:repeat(3,62px);grid-template-rows:repeat(3,62px);gap:5px}
  .fs-pad button{border-radius:18px;background:rgba(255,255,255,.88);font-size:1.7rem;color:#2b8a3e;box-shadow:0 5px 0 rgba(0,0,0,.22);touch-action:none}
  .fs-pad button:active,.fs-pad button.hit{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.22);background:#d3f9d8}
  .fs-pad .mid{background:rgba(255,255,255,.35);box-shadow:none;font-size:1.6rem}`;

  EP.registerGame({
    id: 'snake', level: 20, icon: '🐍', title: 'Fruit Snake', titleZh: '水果貪食蛇',
    model: 'Snake / slither.io（經典貪食蛇）',
    howZh: '聽單字、看圖，用方向鍵、滑動或按鈕控制小蛇，照順序吃掉字母水果拼出單字！吃錯字母會變短、頭暈一下。',
    howEn: 'Steer the snake and eat the letter-fruits in the right order to spell the word!',
    skills: ['listening', 'spelling'],
    start(ctx) {
      const root = ctx.root, D = ctx.difficulty;
      root.style.background = '#1aa38a';
      root.appendChild(u.el('style', {}, CSS));
      let ready = false;
      const c = ctx.kit.canvas(root, () => ready && layout()); const g = c.g; const parts = ctx.kit.particles();
      const top = u.el('div', { class: 'fs-top' }); root.appendChild(top);
      const pad = u.el('div', { class: 'fs-pad' }); root.appendChild(pad);
      const arrows = { up: [0, -1, '▲'], left: [-1, 0, '◀'], right: [1, 0, '▶'], down: [0, 1, '▼'] };
      const padCells = ['', 'up', '', 'left', 'mid', 'right', '', 'down', ''];
      padCells.forEach((k) => {
        if (!k) return pad.appendChild(u.el('div'));
        if (k === 'mid') return pad.appendChild(u.el('button', { class: 'mid', title: 'Listen', onclick: () => item && ctx.say(item) }, '🔊'));
        const b = u.el('button', { 'aria-label': k }, arrows[k][2]);
        ctx.on(b, 'pointerdown', (e) => { e.preventDefault(); turn(arrows[k][0], arrows[k][1]); b.classList.add('hit'); ctx.timeout(() => b.classList.remove('hit'), 120); });
        pad.appendChild(b);
      });

      const items = ctx.items; let idx = 0, item = null, seq = [], pos = 0, mistakes = 0, answered = false, guided = false;
      let phase = 'wait', started = false, t = 0, acc = 0, stun = 0, bubble = null, wave = -1, speedUp = 0;
      const ALLOW = D === 'hard' ? 0 : 1, FAIL_AT = 3;
      const STEP = D === 'easy' ? 0.27 : D === 'hard' ? 0.15 : 0.2;
      const DECOYS = D === 'easy' ? 1 : D === 'hard' ? 5 : 3;
      let cols = 10, rows = 10, cell = 40, x0 = 0, y0 = 0;
      let dir = { x: 1, y: 0 }; const queue = [];
      let body = []; const grow = []; let fruits = []; let slotEls = [];
      const boats = Array.from({ length: 4 }, (_, i) => ({ x: Math.random(), y: 0.2 + i * 0.22, sp: 0.015 + Math.random() * 0.02, e: u.pick(['🛶', '🛶', '🪷', '🌴']) }));

      function layout() {
        if (!top.isConnected) return;
        const W = c.w, H = c.h, land = W > H * 1.05, padS = 62 * 3 + 10;
        if (land) Object.assign(pad.style, { left: '', right: '14px', bottom: '14px', transform: '' });
        else Object.assign(pad.style, { left: '50%', right: '', bottom: '8px', transform: 'translateX(-50%)' });
        const topH = top.offsetHeight + 16;
        const ax = 10, ay = topH, aw = W - 20 - (land ? padS + 18 : 0), ah = H - topH - 10 - (land ? 0 : padS + 14);
        cell = u.clamp(Math.floor(Math.min(aw / (land ? 14 : 9), ah / (land ? 10 : 11))), 26, 68);
        const nc = Math.max(6, Math.floor(aw / cell)), nr = Math.max(5, Math.floor(ah / cell));
        if (nc !== cols || nr !== rows) {
          cols = nc; rows = nr;
          for (const s of body) { s.x = ((s.x % cols) + cols) % cols; s.y = ((s.y % rows) + rows) % rows; s.dx = s.dy = 0; }
          for (const f of fruits) if (f.x >= cols || f.y >= rows) place(f);
        }
        x0 = ax + (aw - cols * cell) / 2; y0 = ay + (ah - rows * cell) / 2;
      }

      // ---------- input ----------
      function turn(x, y) {
        if (phase === 'reveal' || phase === 'done') return;
        if (!started) { started = true; if (phase === 'wait') phase = 'play'; }
        const last = queue.length ? queue[queue.length - 1] : dir;
        if ((x === -last.x && y === -last.y) || (x === last.x && y === last.y)) return;
        if (queue.length < 2) queue.push({ x, y });
        EP.sfx.click();
      }
      ctx.on(window, 'keydown', (e) => {
        if (ctx.paused) return;
        const k = e.key.toLowerCase();
        const m = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k];
        if (m) { e.preventDefault(); turn(m[0], m[1]); }
      });
      let sw = null;
      ctx.on(c.cv, 'pointerdown', (e) => { sw = { x: e.clientX, y: e.clientY }; });
      ctx.on(c.cv, 'pointermove', (e) => {
        if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (Math.hypot(dx, dy) < 26) return;
        if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0); else turn(0, Math.sign(dy));
        sw = { x: e.clientX, y: e.clientY };
      });
      ctx.on(window, 'pointerup', () => (sw = null));

      // ---------- board helpers ----------
      const occupied = (x, y) => body.some((s) => s.x === x && s.y === y) || fruits.some((f) => !f.gone && f.x === x && f.y === y);
      function place(f) {
        const h = body[0] || { x: 0, y: 0 };
        for (let k = 0; k < 400; k++) {
          const x = u.randInt(0, cols - 1), y = u.randInt(0, rows - 1);
          if (occupied(x, y)) continue;
          const ddx = Math.min(Math.abs(x - h.x), cols - Math.abs(x - h.x)), ddy = Math.min(Math.abs(y - h.y), rows - Math.abs(y - h.y));
          if (ddx + ddy < 3 && k < 300) continue;
          if (k < 200 && fruits.some((o) => o !== f && !o.gone && Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1)) continue;
          f.x = x; f.y = y; f.born = t; return f;
        }
        f.x = u.randInt(0, cols - 1); f.y = u.randInt(0, rows - 1); f.born = t; return f;
      }
      const addFruit = (ch, decoy) => { const f = place({ ch, col: colOf(ch), decoy: !!decoy, gone: false, x: -1, y: -1 }); fruits.push(f); return f; };
      const need = () => (seq[pos] || '').toLowerCase();
      const px = (gx) => x0 + (gx + 0.5) * cell, py = (gy) => y0 + (gy + 0.5) * cell;

      function setupWord() {
        if (idx >= items.length) return finish();
        item = items[idx]; ctx.hud.progress(idx / items.length);
        const key = EP.spellKey(item);
        seq = key.split('').filter((ch) => /[a-z]/i.test(ch)); pos = 0; mistakes = 0; answered = false; guided = false;
        // prompt bar
        top.innerHTML = '';
        const pic = EP.pic(item);
        top.appendChild(u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: () => ctx.say(item) }, '🔊'));
        if (pic) top.appendChild(u.el('div', { class: 'fs-pic' }, pic));
        if (!pic || (D !== 'hard' && EP.settings.showChinese)) top.appendChild(u.el('div', { class: 'fs-zh' }, item.zh));
        const slots = u.el('div', { class: 'fs-slots' }); slotEls = [];
        const sz = u.clamp(Math.floor((c.w - 48) / key.length) - 4, 26, 46);
        for (const ch of key) {
          const s = u.el('div', { class: 'fs-slot' + (/[a-z]/i.test(ch) ? '' : ' gap'), style: { width: sz + 'px', height: Math.round(sz * 1.15) + 'px', fontSize: Math.round(sz * 0.62) + 'px' } }, /[a-z]/i.test(ch) ? (D === 'easy' ? ch : '') : ch === ' ' ? '' : ch);
          if (/[a-z]/i.test(ch)) { if (D === 'easy') s.classList.add('ghost'); slotEls.push(s); }
          slots.appendChild(s);
        }
        top.appendChild(slots);
        layout();
        // fruits: one per distinct letter still needed + decoys
        fruits = [];
        for (const ch of new Set(seq.map((x) => x.toLowerCase()))) addFruit(ch);
        const pool = 'abcdefghiklmnoprstuwy'.split('').filter((x) => !seq.some((s) => s.toLowerCase() === x));
        u.shuffle(pool).slice(0, DECOYS).forEach((ch) => addFruit(ch, true));
        markNext();
        phase = started ? 'play' : 'wait';
        ctx.timeout(() => ctx.say(item), 350);
      }
      function markNext() { slotEls.forEach((s, i) => s.classList.toggle('next', i === pos)); }

      // ---------- eating ----------
      function eat(f) {
        if (phase !== 'play' || f.gone) return;
        if (f.ch === need()) good(f);
        else if (!guided) bad(f);
      }
      function good(f) {
        const s = slotEls[pos]; s.textContent = seq[pos]; s.classList.remove('ghost'); s.classList.add('on'); s.style.setProperty('--c', f.col);
        pos++; EP.sfx.pop(); parts.burst(px(f.x), py(f.y), f.col, 18, 220);
        grow.push({ col: f.col, ch: f.ch });
        if (seq.slice(pos).some((x) => x.toLowerCase() === f.ch)) { place(f); } else f.gone = true;
        markNext();
        if (pos >= seq.length) complete();
      }
      function bad(f) {
        mistakes++; EP.sfx.wrong(); ctx.shake(); stun = D === 'easy' ? 0.6 : 0.85; queue.length = 0;
        ctx.float(px(f.x), py(f.y) - cell * 0.4, '✗ ' + f.ch, 'bad');
        parts.burst(px(f.x), py(f.y), '#868e96', 14, 180);
        for (let k = 0; k < 2 && body.length > 3; k++) { const s = body.pop(); parts.burst(px(s.x), py(s.y), s.col, 10, 160); }
        place(f);
        if (mistakes >= FAIL_AT && !answered) failWord();
      }
      async function failWord() {
        answered = true; phase = 'reveal';
        ctx.answer(item, false, { x: px(body[0].x), y: py(body[0].y) - cell, label: '💫' });
        await ctx.reveal(item);
        guided = true; fruits.forEach((f) => { if (f.decoy) f.gone = true; });
        ctx.toast('Follow the glowing fruit! 跟著發光的水果吃');
        phase = 'play'; stun = 0;
      }
      async function complete() {
        phase = 'between';
        const ok = !answered && mistakes <= ALLOW; const h = body[0];
        if (!answered) { answered = true; ctx.answer(item, ok, { x: px(h.x), y: py(h.y) - cell, points: 100 + seq.length * 10 }); }
        bubble = { text: item.word, t: 0 }; wave = 0;
        fruits.forEach((f) => { if (!f.gone) { f.gone = true; parts.burst(px(f.x), py(f.y), f.col, 8, 140); } });
        if (ok) { ctx.confetti(); ctx.burst(u.pick(['Yummy! 好吃！', 'Delicious! 讚！', 'Great spelling! 拼得好！'])); }
        speedUp = Math.min(0.3, speedUp + 0.03);
        if (!ok && !guided) { phase = 'reveal'; await ctx.reveal(item); phase = 'between'; }
        else await ctx.say(item);
        idx++; ctx.hud.progress(idx / items.length);
        ctx.timeout(setupWord, 700);
      }
      function finish() {
        phase = 'done'; ctx.hud.progress(1);
        ctx.burst(`🐍 Length ${body.length}!`); EP.sfx.win();
        ctx.timeout(() => ctx.end(), 1400);
      }

      // ---------- movement ----------
      const wrapD = (d, n) => (d > 1 ? d - n : d < -1 ? d + n : d);
      function stepSnake() {
        if (queue.length) dir = queue.shift();
        const h = body[0]; const tail = body[body.length - 1]; const tx = tail.x, ty = tail.y;
        for (let i = body.length - 1; i > 0; i--) { const s = body[i], p = body[i - 1]; s.dx = wrapD(p.x - s.x, cols); s.dy = wrapD(p.y - s.y, rows); s.x = p.x; s.y = p.y; }
        h.x = (h.x + dir.x + cols) % cols; h.y = (h.y + dir.y + rows) % rows; h.dx = dir.x; h.dy = dir.y;
        const maxLen = Math.max(14, Math.floor(cols * rows * 0.32));
        if (grow.length) { const gr = grow.shift(); if (body.length < maxLen) body.push({ x: tx, y: ty, dx: 0, dy: 0, col: gr.col, ch: gr.ch }); }
        const f = fruits.find((o) => !o.gone && o.x === h.x && o.y === h.y);
        if (f) eat(f);
      }

      // ---------- drawing ----------
      function drawBoard() {
        const W = c.w, H = c.h;
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#ffd6a5'); sky.addColorStop(0.22, '#8fe3cf'); sky.addColorStop(1, '#13917b');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
        for (let i = 0; i < 9; i++) { const yy = (i / 9) * H + 20, xx = ((t * 18 + i * 137) % (W + 80)) - 40; g.beginPath(); g.arc(xx, yy, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
        for (const b of boats) { b.x = (b.x + b.sp * 0.016) % 1.1; ctx.kit.emoji(g, b.e, b.x * W, b.y * H + Math.sin(t * 2 + b.y * 9) * 4, 34); }
        const bw = cols * cell, bh = rows * cell;
        g.fillStyle = 'rgba(0,0,0,.18)'; ctx.kit.roundRect(g, x0 - 9, y0 - 3, bw + 18, bh + 18, 16); g.fill();
        g.fillStyle = '#a0682f'; ctx.kit.roundRect(g, x0 - 9, y0 - 9, bw + 18, bh + 18, 16); g.fill();
        g.strokeStyle = '#7a4a1c'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x0 - 9, y0 - 9 + (bh + 18) * i / 4); g.lineTo(x0 - 4, y0 - 9 + (bh + 18) * i / 4); g.stroke(); }
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { g.fillStyle = (r + q) % 2 ? '#a9dc5c' : '#b8e56d'; g.fillRect(x0 + q * cell, y0 + r * cell, cell, cell); }
      }
      function drawFruit(f) {
        const age = t - f.born; const s0 = Math.min(1, age * 4); const pop = s0 < 1 ? s0 * (1.25 - 0.25 * s0) : 1;
        const isNext = f.ch === need() && phase === 'play' && (D !== 'hard' || guided);
        const pul = isNext ? 1 + 0.13 * Math.sin(t * 7) : 1;
        const r = cell * 0.42 * pop * pul; const x = px(f.x), y = py(f.y);
        if (isNext) { g.fillStyle = 'rgba(255,224,102,.55)'; g.beginPath(); g.arc(x, y, r * 1.45, 0, 6.3); g.fill(); }
        if (guided && !isNext) g.globalAlpha = 0.45;
        g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + r * 0.85, r * 0.8, r * 0.25, 0, 0, 6.3); g.fill();
        const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, f.col); gr.addColorStop(1, f.col);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
        g.fillStyle = '#2f9e44'; g.beginPath(); g.ellipse(x + r * 0.35, y - r * 0.95, r * 0.35, r * 0.16, -0.5, 0, 6.3); g.fill();
        g.strokeStyle = '#6b3e12'; g.lineWidth = Math.max(2, r * 0.1); g.beginPath(); g.moveTo(x, y - r * 0.8); g.lineTo(x + r * 0.05, y - r * 1.1); g.stroke();
        ctx.kit.text(g, f.ch, x, y + r * 0.05, Math.max(16, r * 1.15), '#fff', { stroke: 'rgba(0,0,0,.55)', strokeW: Math.max(3, r * 0.18) });
        g.globalAlpha = 1;
      }
      function segPos(s, p) { return { x: s.x - s.dx * (1 - p), y: s.y - s.dy * (1 - p) }; }
      function each(gx, gy, fn) { // draw a segment also on the opposite edge while it slides across the wrap
        fn(gx, gy);
        if (gx < 0) fn(gx + cols, gy); if (gx > cols - 1) fn(gx - cols, gy);
        if (gy < 0) fn(gx, gy + rows); if (gy > rows - 1) fn(gx, gy - rows);
      }
      function drawSnake(p) {
        const pts = body.map((s) => segPos(s, p));
        for (let i = body.length - 1; i >= 1; i--) {
          const s = body[i], q = pts[i], glow = wave >= 0 && body.length - 1 - i < seq.length && i > body.length - 1 - seq.length;
          each(q.x, q.y, (gx, gy) => {
            const x = x0 + (gx + 0.5) * cell, y = y0 + (gy + 0.5) * cell, r = cell * (0.46 - Math.min(0.12, i * 0.004));
            const wob = glow ? 1 + 0.18 * Math.max(0, Math.sin(wave * 9 - i * 0.6)) : 1;
            g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.arc(x + 2, y + 4, r, 0, 6.3); g.fill();
            g.fillStyle = s.col; g.beginPath(); g.arc(x, y, r * wob, 0, 6.3); g.fill();
            g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.35, 0, 6.3); g.fill();
            if (s.ch && cell >= 30) ctx.kit.text(g, s.ch, x, y + 1, cell * 0.5, '#fff', { stroke: 'rgba(0,0,0,.45)', strokeW: 3 });
          });
        }
        const h = pts[0]; const d = body[0];
        each(h.x, h.y, (gx, gy) => {
          const x = x0 + (gx + 0.5) * cell, y = y0 + (gy + 0.5) * cell, r = cell * 0.56;
          const ang = Math.atan2(dir.y, dir.x) + (stun > 0 ? Math.sin(t * 25) * 0.25 : 0);
          g.save(); g.translate(x, y); g.rotate(ang);
          if (stun <= 0 && Math.sin(t * 5) > 0.6) { g.strokeStyle = '#e03131'; g.lineWidth = 3; g.beginPath(); g.moveTo(r * 0.8, 0); g.lineTo(r * 1.35, 0); g.lineTo(r * 1.55, -r * 0.18); g.moveTo(r * 1.35, 0); g.lineTo(r * 1.55, r * 0.18); g.stroke(); }
          g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.arc(3, 5, r, 0, 6.3); g.fill();
          g.fillStyle = '#37b24d'; g.beginPath(); g.ellipse(0, 0, r * 1.05, r, 0, 0, 6.3); g.fill();
          g.fillStyle = '#69db7c'; g.beginPath(); g.ellipse(-r * 0.15, -r * 0.2, r * 0.6, r * 0.45, 0, 0, 6.3); g.fill();
          const ahead = fruits.some((f) => !f.gone && f.x === (d.x + dir.x + cols) % cols && f.y === (d.y + dir.y + rows) % rows);
          if (ahead) { g.fillStyle = '#862e2e'; g.beginPath(); g.arc(r * 0.6, 0, r * 0.35, -1.2, 1.2); g.fill(); }
          for (const sy of [-1, 1]) {
            g.fillStyle = '#fff'; g.beginPath(); g.arc(r * 0.3, sy * r * 0.42, r * 0.3, 0, 6.3); g.fill();
            if (stun > 0) { ctx.kit.text(g, '×', r * 0.3, sy * r * 0.42, r * 0.5, '#1d2340', { weight: 900 }); }
            else { g.fillStyle = '#1d2340'; g.beginPath(); g.arc(r * 0.4, sy * r * 0.42, r * 0.15, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(r * 0.45, sy * r * 0.38, r * 0.05, 0, 6.3); g.fill(); }
            g.fillStyle = 'rgba(255,135,170,.55)'; g.beginPath(); g.arc(-r * 0.1, sy * r * 0.72, r * 0.16, 0, 6.3); g.fill();
          }
          g.restore();
          if (stun > 0) for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.1; ctx.kit.emoji(g, '💫', x + Math.cos(a) * r, y - r * 1.1 + Math.sin(a) * r * 0.3, r * 0.6); }
        });
      }
      function drawBubble() {
        if (!bubble) return; if (bubble.t > 2.2) { bubble = null; return; }
        const h = segPos(body[0], 1); const x = u.clamp(x0 + (h.x + 0.5) * cell, 80, c.w - 80), y = Math.max(y0 + 30, y0 + (h.y + 0.5) * cell - cell * 1.3);
        const fs = Math.max(22, cell * 0.6); g.font = `900 ${fs}px 'Baloo 2',sans-serif`; const w = g.measureText(bubble.text).width + 30, hh = fs + 18;
        const sc = Math.min(1, bubble.t * 6);
        g.save(); g.translate(x, y); g.scale(sc, sc);
        g.fillStyle = '#fff'; ctx.kit.roundRect(g, -w / 2, -hh, w, hh, 14); g.fill();
        g.beginPath(); g.moveTo(-8, -1); g.lineTo(8, -1); g.lineTo(0, 12); g.fill();
        ctx.kit.text(g, bubble.text, 0, -hh / 2, fs, '#d6336c');
        g.restore();
      }

      ctx.loop((dt) => {
        dt = Math.max(0, dt); // the first frame can report a negative dt
        t += dt; parts.update(dt); if (bubble) bubble.t += dt; if (wave >= 0) { wave += dt; if (wave > 1.6) wave = -1; }
        const step = STEP * (1 - speedUp);
        if (phase === 'play' || phase === 'between') {
          if (stun > 0) stun -= dt;
          else { acc += dt; while (acc >= step) { acc -= step; stepSnake(); } }
        }
        const p = stun > 0 || phase === 'wait' || phase === 'reveal' ? 1 : acc / step;
        g.clearRect(0, 0, c.w, c.h);
        drawBoard();
        g.save(); g.beginPath(); g.rect(x0, y0, cols * cell, rows * cell); g.clip();
        for (const f of fruits) if (!f.gone) drawFruit(f);
        drawSnake(Math.min(1, p));
        g.restore();
        drawBubble(); parts.draw(g);
        if (!started && phase === 'wait') {
          const msg = 'Swipe or press ◀ ▲ ▶ ▼ to go!'; const fs = Math.max(20, Math.min(30, c.w / 18));
          g.fillStyle = 'rgba(29,35,64,.75)'; g.font = `900 ${fs}px 'Baloo 2',sans-serif`; const w = g.measureText(msg).width + 36;
          ctx.kit.roundRect(g, c.w / 2 - w / 2 - (c.w > c.h * 1.05 ? 100 : 0), y0 + rows * cell * 0.72, w, fs + 24, 16); g.fill();
          ctx.kit.text(g, msg, c.w / 2 - (c.w > c.h * 1.05 ? 100 : 0), y0 + rows * cell * 0.72 + (fs + 24) / 2, fs, '#fff');
        }
      });

      // start: a little green snake in the middle-left
      ready = true; layout();
      const sy = Math.floor(rows / 2), sx = Math.floor(cols / 3);
      body = [0, 1, 2].map((k) => ({ x: sx - k, y: sy, dx: 0, dy: 0, col: k % 2 ? '#40c057' : '#51cf66', ch: '' }));
      setupWord();

      return {
        destroy() { c.destroy(); },
        test: {
          correct() {
            if (phase === 'wait') { started = true; phase = 'play'; }
            let guard = 60;
            while (phase === 'play' && pos < seq.length && guard--) {
              const f = fruits.find((o) => !o.gone && o.ch === need()) || addFruit(need());
              eat(f);
            }
          },
          wrong() {
            if (phase === 'wait') { started = true; phase = 'play'; }
            let guard = 10;
            while (phase === 'play' && !guided && !answered && guard--) {
              const f = fruits.find((o) => !o.gone && o.ch !== need()); if (!f) break;
              stun = 0; eat(f);
            }
          },
        },
      };
    },
  });
})();
