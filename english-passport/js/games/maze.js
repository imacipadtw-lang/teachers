/* Level 12 — Seoul Maze Muncher (inspired by Pac-Man: munch dots in a maze, dodge the wanderers, power dots turn the tables)
 * See the picture / hear the word, then eat the letter-dots IN ORDER to spell it (next letter glows on easy/normal).
 * Wrong letter = short dizzy stun (3 wrong letters → reveal, next word). Touching a cloud puff = soft reset to the start.
 * A power dot makes the puffs sleepy (boop them home for bonus points). Player = the student's own avatar. */
(function () {
  const EP = window.EP, u = EP.u;
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const PUFF = ['#ffd6e7', '#d3f0ff', '#e5dbff', '#d3f9d8'];
  const CSS = `
  .mz-top{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:5;max-width:96%;width:max-content}
  .mz-card{padding:6px 14px 6px 6px!important;gap:10px!important}
  .mz-card .pic{font-size:2.5rem!important}
  .mz-slots{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px}
  .mz-slots span{min-width:24px;height:34px;border-bottom:4px solid #adb5bd;font-size:1.55rem;font-weight:900;text-align:center;line-height:34px;color:#1d2340;padding:0 1px}
  .mz-slots span.on{border-color:#40c057;color:#2b8a3e;animation:mzPop .3s}
  .mz-slots span.ghost{color:rgba(29,35,64,.28)}
  .mz-slots span.gap{border:0;min-width:10px}
  .mz-slots span.nx{border-color:#fab005}
  .mz-slots span.bad{color:#e03131;border-color:#e03131}
  .mz-pad{position:absolute;z-index:5;display:grid;grid-template-columns:repeat(3,var(--pb));grid-template-rows:repeat(3,var(--pb));gap:6px}
  .mz-pad button{border-radius:18px;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.45);color:#fff;font-size:calc(var(--pb)*.42);touch-action:none}
  .mz-pad button:active{background:rgba(255,255,255,.42)}
  @keyframes mzPop{0%{transform:scale(1.8)}100%{transform:scale(1)}}`;

  EP.registerGame({
    id: 'maze', level: 12, icon: '👾', title: 'Seoul Maze Muncher', titleZh: '首爾迷宮吃字母',
    model: 'Pac-Man 小精靈（迷宮吃豆、躲開遊蕩者、能量豆）',
    howZh: '看圖或聽發音，在迷宮裡按照順序吃掉字母拼出單字！碰到雲朵怪會回到起點，吃到能量豆雲朵怪會睡著。',
    howEn: 'Eat the letters in order to spell the word! Cloud puffs send you back to start; a power dot makes them sleepy.',
    skills: ['spelling', 'listening', 'meaning'],
    start(ctx) {
      const root = ctx.root, kit = ctx.kit, diff = ctx.difficulty, items = ctx.items;
      root.style.background = 'linear-gradient(180deg,#0b1030,#24135a)';
      root.appendChild(u.el('style', {}, CSS));
      let M = null, L = { W: 1, H: 1, s: 30, ox: 0, oy: 0, area: null, portrait: true }, wallCv = null;
      let idx = 0, item = null, letters = [], pos = 0, mistakes = 0, state = 'wait', readyT = 0, sleepT = 0, t = 0, tickT = 0;
      const dots = new Map(); const parts = kit.particles();
      const player = { x: 0, y: 0, tx: 0, ty: 0, p: 0, moving: false, dir: null, want: null, stun: 0, inv: 0, munch: 0 };
      let puffs = [];
      const avatar = (EP.me && EP.me.avatar) || '🐼';
      const top = u.el('div', { class: 'mz-top' }); root.appendChild(top);
      const pad = u.el('div', { class: 'mz-pad' });
      [['up', '▲', 1, 2], ['left', '◀', 2, 1], ['right', '▶', 2, 3], ['down', '▼', 3, 2]].forEach(([d, ch, r, c]) => {
        const b = u.el('button', { style: { gridRow: r, gridColumn: c }, 'aria-label': d }, ch);
        ctx.on(b, 'pointerdown', (e) => { e.preventDefault(); setWant(d); });
        pad.appendChild(b);
      });
      root.appendChild(pad);
      const c = kit.canvas(root, (w, h) => layout(w, h)); const g = c.g;
      let slotsEl = null, slotSpans = [];

      /* ---------- maze ---------- */
      function canGo(x, y, d) {
        if (!M) return false;
        if (d === 'right') return x < M.C - 1 && !M.E[y][x];
        if (d === 'left') return x > 0 && !M.E[y][x - 1];
        if (d === 'down') return y < M.R - 1 && !M.S[y][x];
        if (d === 'up') return y > 0 && !M.S[y - 1][x];
        return false;
      }
      function genMaze(C, R) {
        const E = Array.from({ length: R }, () => Array(C).fill(true)), S = Array.from({ length: R }, () => Array(C).fill(true));
        const m = (C - 1) >> 1; const seen = Array.from({ length: R }, () => Array(C).fill(false));
        const open = (x, y, dx, dy) => { if (dx === 1) E[y][x] = false; else if (dx === -1) E[y][x - 1] = false; else if (dy === 1) S[y][x] = false; else S[y - 1][x] = false; };
        const st = [[m, R - 1]]; seen[R - 1][m] = true;
        while (st.length) {
          const [x, y] = st[st.length - 1];
          const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && nx <= m && ny >= 0 && ny < R && !seen[ny][nx]);
          if (!nb.length) { st.pop(); continue; }
          const [nx, ny, dx, dy] = u.pick(nb); open(x, y, dx, dy); seen[ny][nx] = true; st.push([nx, ny]);
        }
        for (let y = 0; y < R; y++) { for (let x = m + 1; x < C; x++) S[y][x] = S[y][C - 1 - x]; for (let x = m; x < C - 1; x++) E[y][x] = E[y][C - 2 - x]; }
        M = { C, R, E, S, m };
        const setOpen = (x, y, d) => { // symmetric opening
          if (d === 'down') { S[y][x] = false; S[y][C - 1 - x] = false; } else if (d === 'up') { S[y - 1][x] = false; S[y - 1][C - 1 - x] = false; }
          else if (d === 'right') { E[y][x] = false; E[y][C - 2 - x] = false; } else { E[y][x - 1] = false; E[y][C - 1 - x] = false; }
        };
        const inb = (x, y, d) => { const nx = x + D[d][0], ny = y + D[d][1]; return nx >= 0 && nx < C && ny >= 0 && ny < R; };
        for (let y = 0; y < R; y++) for (let x = 0; x <= m; x++) { // braid: no dead ends (Pac-Man mazes loop)
          const ex = Object.keys(D).filter((d) => canGo(x, y, d));
          if (ex.length <= 1) { const cl = Object.keys(D).filter((d) => !canGo(x, y, d) && inb(x, y, d)); if (cl.length) setOpen(x, y, u.pick(cl)); }
        }
        for (let k = 0; k < C * R * 0.05; k++) { const x = u.randInt(0, m), y = u.randInt(0, R - 1); const cl = Object.keys(D).filter((d) => !canGo(x, y, d) && inb(x, y, d)); if (cl.length) setOpen(x, y, u.pick(cl)); }
      }
      function bfs(sx, sy) {
        const dist = Array.from({ length: M.R }, () => Array(M.C).fill(-1)); dist[sy][sx] = 0; const q = [[sx, sy]];
        while (q.length) { const [x, y] = q.shift(); for (const d in D) if (canGo(x, y, d)) { const nx = x + D[d][0], ny = y + D[d][1]; if (dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); } } }
        return dist;
      }

      /* ---------- layout ---------- */
      function layout(W, H) {
        W = W || c.w; H = H || c.h;
        const portrait = W < H * 1.05; const topH = (top.offsetHeight || 84) + 14;
        const padS = portrait ? u.clamp(H * 0.25, 170, 200) : u.clamp(W * 0.18, 190, 220);
        const pb = Math.floor(Math.min(64, (padS - 16) / 3));
        pad.style.setProperty('--pb', pb + 'px');
        Object.assign(pad.style, portrait ? { left: '50%', bottom: '8px', top: 'auto', right: 'auto', transform: 'translateX(-50%)' } : { right: '14px', top: `calc(50% + ${topH / 2}px)`, left: 'auto', bottom: 'auto', transform: 'translateY(-50%)' });
        const area = portrait ? { x: 6, y: topH, w: W - 12, h: H - topH - (pb * 3 + 28) } : { x: 8, y: topH, w: W - (pb * 3 + 50), h: H - topH - 8 };
        Object.assign(L, { W, H, portrait, area });
        if (M) {
          L.s = Math.min(area.w / M.C, area.h / M.R); L.ox = area.x + (area.w - M.C * L.s) / 2; L.oy = area.y + (area.h - M.R * L.s) / 2;
          drawWalls();
        }
      }
      function drawWalls() {
        const dpr = Math.min(2, window.devicePixelRatio || 1), s = L.s;
        wallCv = wallCv || document.createElement('canvas');
        wallCv.width = Math.ceil((M.C * s + 20) * dpr); wallCv.height = Math.ceil((M.R * s + 20) * dpr);
        const w = wallCv.getContext('2d'); w.setTransform(dpr, 0, 0, dpr, 10, 10); w.lineCap = 'round';
        w.fillStyle = 'rgba(8,10,40,.75)'; kit.roundRect(w, -6, -6, M.C * s + 12, M.R * s + 12, 14); w.fill();
        const seg = [];
        for (let y = 0; y < M.R; y++) for (let x = 0; x < M.C; x++) {
          if (x < M.C - 1 && M.E[y][x]) seg.push([(x + 1) * s, y * s, (x + 1) * s, (y + 1) * s]);
          if (y < M.R - 1 && M.S[y][x]) seg.push([x * s, (y + 1) * s, (x + 1) * s, (y + 1) * s]);
        }
        for (const [col, lw, blur] of [['rgba(77,171,247,.45)', s * 0.22, 10], ['#a5d8ff', s * 0.08, 0]]) {
          w.strokeStyle = col; w.lineWidth = lw; w.shadowColor = '#4dabf7'; w.shadowBlur = blur;
          w.beginPath(); for (const [a, b, c2, d] of seg) { w.moveTo(a, b); w.lineTo(c2, d); } w.stroke();
          w.beginPath(); kit.roundRect(w, -3, -3, M.C * s + 6, M.R * s + 6, 10); w.stroke();
        }
        w.shadowBlur = 0;
      }

      /* ---------- words ---------- */
      function newWord() {
        if (idx >= items.length) return finish();
        ctx.hud.progress(idx / items.length);
        item = items[idx]; const key = EP.spellKey(item);
        letters = key.split('').filter((ch) => /[A-Za-z]/.test(ch)); pos = 0; mistakes = 0;
        renderTop(key);
        layout(c.w, c.h);
        const a = L.area; const cs = u.clamp(Math.min(a.w, a.h) / 10, 34, 60);
        let C = Math.floor(a.w / cs); if (C % 2 === 0) C--; C = u.clamp(C, 7, 17);
        const R = u.clamp(Math.floor(a.h / cs), 7, 13);
        genMaze(C, R); layout(c.w, c.h);
        const sx = M.m, sy = R - 1; player.home = [sx, sy];
        Object.assign(player, { x: sx, y: sy, tx: sx, ty: sy, p: 0, moving: false, dir: null, want: null, stun: 0, inv: 0 });
        const hy = Math.max(0, Math.floor(R / 2) - 1);
        const nP = diff === 'hard' ? 3 : 2;
        puffs = Array.from({ length: nP }, (_, i) => { const hx = u.clamp(M.m + [0, -2, 2][i], 0, C - 1); return { x: hx, y: hy, tx: hx, ty: hy, p: 0, moving: false, dir: null, home: [hx, hy], col: PUFF[(idx + i) % 4], ph: Math.random() * 6 }; });
        // dots: letters (+ decoys), power dots, pellets
        dots.clear();
        const dist = bfs(sx, sy); const free = [];
        for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (!(x === sx && y === sy) && !puffs.some((q) => q.x === x && q.y === y)) free.push([x, y]);
        const far = u.shuffle(free.filter(([x, y]) => dist[y][x] >= 3));
        const wordSet = new Set(letters.map((ch) => ch.toLowerCase()));
        const decoyN = diff === 'easy' ? 2 : diff === 'hard' ? 5 : 3;
        const decoys = u.shuffle('abcdefghijklmnoprstuwy'.split('').filter((ch) => !wordSet.has(ch))).slice(0, decoyN);
        const all = letters.concat(decoys); const used = [];
        for (const ch of all) {
          let cell = far.find(([x, y]) => !used.some(([a2, b2]) => Math.abs(a2 - x) + Math.abs(b2 - y) < 2)) || far[0] || free.find(([x, y]) => !dots.has(x + ',' + y));
          if (!cell) break; far.splice(far.indexOf(cell), 1); used.push(cell); dots.set(cell[0] + ',' + cell[1], { kind: 'letter', ch });
        }
        for (const [x, y] of [[0, 0], [C - 1, 0]]) if (!dots.has(x + ',' + y)) dots.set(x + ',' + y, { kind: 'power' });
        for (const [x, y] of free) if (!dots.has(x + ',' + y)) dots.set(x + ',' + y, { kind: 'pellet' });
        sleepT = 0; readyT = 1.1; state = 'ready'; hudLetters();
        ctx.timeout(() => ctx.say(item), 300);
      }
      function renderTop(key) {
        const pic = diff === 'hard' ? '' : EP.pic(item);
        slotsEl = u.el('div', { class: 'mz-slots' }); slotSpans = [];
        for (const ch of key) {
          if (/[A-Za-z]/.test(ch)) { const sp = u.el('span', { class: diff === 'easy' ? 'ghost' : '' }, diff === 'easy' ? ch : ''); slotSpans.push(sp); slotsEl.appendChild(sp); }
          else slotsEl.appendChild(u.el('span', { class: 'gap' }, ch === ' ' ? '' : ch));
        }
        top.innerHTML = '';
        top.appendChild(u.el('div', { class: 'prompt-card mz-card' },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(item); } }, '🔊'),
          pic ? u.el('div', { class: 'pic' }, pic) : null,
          u.el('div', {}, diff === 'hard' ? u.el('div', { class: 'zhs' }, 'Listen & spell! 聽音拼字') : (!pic || diff === 'easy') ? u.el('div', { class: 'zhs zh' }, item.zh) : null, slotsEl)));
        markNext();
      }
      function markNext() { slotSpans.forEach((s, i) => s.classList.toggle('nx', i === pos && diff !== 'hard')); }
      function hudLetters() { ctx.hud.extra(`🔤 ${pos}/${letters.length}` + (mistakes ? `  💫 ${mistakes}/3` : '')); }
      const px = (e) => L.ox + (e.x + (e.tx - e.x) * e.p + 0.5) * L.s;
      const py = (e) => L.oy + (e.y + (e.ty - e.y) * e.p + 0.5) * L.s;

      function eatAt(x, y) {
        const k = x + ',' + y; const d = dots.get(k); if (!d || state !== 'play') return;
        const X = L.ox + (x + 0.5) * L.s, Y = L.oy + (y + 0.5) * L.s;
        if (d.kind === 'pellet') { dots.delete(k); ctx.addScore(1); player.munch = 0.18; if (t - tickT > 0.12) { tickT = t; EP.sfx.tick(); } return; }
        if (d.kind === 'power') { dots.delete(k); sleepT = 6; EP.sfx.chest(); ctx.float(X, Y - 20, 'Sleepy time! 💤', 'good'); parts.burst(X, Y, '#ff8cc6', 18); return; }
        const want = letters[pos];
        if (d.ch.toLowerCase() === want.toLowerCase()) {
          dots.delete(k); const sp = slotSpans[pos]; sp.textContent = want; sp.className = 'on'; pos++; markNext(); hudLetters();
          player.munch = 0.3; EP.sfx.combo(pos); parts.burst(X, Y, '#ffd43b', 16, 200); ctx.float(X, Y - 18, want, 'good');
          if (pos >= letters.length) wordDone();
        } else {
          mistakes++; player.stun = 0.9; EP.sfx.wrong(); ctx.float(X, Y - 18, '✗ ' + d.ch, 'bad'); hudLetters();
          if (!letters.slice(pos).some((ch) => ch.toLowerCase() === d.ch.toLowerCase())) dots.delete(k);
          if (mistakes >= 3) wordFail();
        }
      }
      function wordDone() {
        state = 'clear';
        const ok = mistakes <= (diff === 'hard' ? 0 : 1); // one accidental bump is forgiven on easy/normal
        ctx.answer(item, ok, { x: px(player), y: py(player) - 30, points: 100 + letters.length * 10 });
        if (ok) { ctx.float(L.W / 2, L.oy + M.R * L.s / 2, 'Yummy! 好吃！🎉', 'good'); EP.sfx.chest(); }
        for (let i = 0; i < 3; i++) parts.burst(px(player), py(player), null, 20, 300);
        ctx.say(item);
        ctx.timeout(async () => { if (!ok) await ctx.reveal(item); idx++; newWord(); }, 1700);
      }
      async function wordFail() {
        state = 'clear';
        ctx.answer(item, false, { x: px(player), y: py(player) - 30 });
        slotSpans.forEach((s, i) => { if (i >= pos) { s.textContent = letters[i]; s.className = 'bad'; } });
        await ctx.wait(600); await ctx.reveal(item); idx++; newWord();
      }
      function finish() { state = 'done'; ctx.hud.progress(1); ctx.hud.extra(''); ctx.end(); }

      /* ---------- movement ---------- */
      function setWant(d) {
        if (ctx.paused || !D[d]) return;
        player.want = d;
        if (player.moving && d === OPP[player.dir]) { [player.x, player.tx] = [player.tx, player.x]; [player.y, player.ty] = [player.ty, player.y]; player.p = 1 - player.p; player.dir = d; }
      }
      function step(e, speed, dt, choose, onArrive) {
        if (!e.moving) { const d = choose(e); if (d) { e.dir = d; e.tx = e.x + D[d][0]; e.ty = e.y + D[d][1]; e.moving = true; e.p = 0; } return; }
        e.p += speed * dt;
        if (e.p >= 1) {
          e.x = e.tx; e.y = e.ty; e.moving = false; const rest = e.p - 1; e.p = 0;
          onArrive && onArrive(e);
          if (state !== 'play') return;
          const d = choose(e); if (d) { e.dir = d; e.tx = e.x + D[d][0]; e.ty = e.y + D[d][1]; e.moving = true; e.p = Math.min(0.9, rest); }
        }
      }
      const choosePlayer = (e) => (e.want && canGo(e.x, e.y, e.want) ? e.want : e.dir && canGo(e.x, e.y, e.dir) ? e.dir : null);
      function choosePuff(e) {
        let ds = Object.keys(D).filter((d) => canGo(e.x, e.y, d) && d !== OPP[e.dir]);
        if (!ds.length) ds = Object.keys(D).filter((d) => canGo(e.x, e.y, d));
        if (diff === 'hard' && sleepT <= 0 && Math.random() < 0.4) ds.sort((a, b) => Math.hypot(e.x + D[a][0] - player.x, e.y + D[a][1] - player.y) - Math.hypot(e.x + D[b][0] - player.x, e.y + D[b][1] - player.y));
        else ds = u.shuffle(ds);
        return ds[0] || null;
      }

      /* ---------- input ---------- */
      const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
      ctx.on(window, 'keydown', (e) => { const d = KEYS[e.key]; if (d) { e.preventDefault(); setWant(d); } });
      let sw = null;
      ctx.on(c.cv, 'pointerdown', (e) => { sw = { x: e.clientX, y: e.clientY }; });
      ctx.on(c.cv, 'pointermove', (e) => {
        if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (Math.hypot(dx, dy) > 22) { setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); sw = { x: e.clientX, y: e.clientY }; }
      });
      ctx.on(c.cv, 'pointerup', () => (sw = null));

      /* ---------- drawing ---------- */
      function drawPuff(q) {
        const x = px(q), y = py(q) + Math.sin(t * 3 + q.ph) * L.s * 0.05, r = L.s * 0.24; const sleepy = sleepT > 0;
        const blink = sleepy && sleepT < 1.5 && Math.floor(t * 6) % 2;
        g.fillStyle = sleepy ? (blink ? '#ffffff' : '#b9c3f0') : q.col; g.strokeStyle = 'rgba(29,35,64,.55)'; g.lineWidth = 2;
        const bumps = [[-0.95, 0.15, 0.8], [0.95, 0.15, 0.8], [-0.45, -0.45, 0.95], [0.45, -0.4, 0.9], [0, 0.25, 1.15]];
        g.beginPath(); for (const [bx, by, br] of bumps) { g.moveTo(x + bx * r + br * r, y + by * r); g.arc(x + bx * r, y + by * r, br * r, 0, 6.3); } g.stroke();
        for (const [bx, by, br] of bumps) { g.beginPath(); g.arc(x + bx * r, y + by * r, br * r, 0, 6.3); g.fill(); }
        const look = q.dir ? D[q.dir] : [0, 0];
        if (sleepy) {
          g.strokeStyle = '#1d2340'; g.lineWidth = 2; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * r * 0.42, y, r * 0.18, 0.2, Math.PI - 0.2); g.stroke(); }
          kit.text(g, 'z', x + r * 1.2, y - r * 1.3 - (t * 10 % 10), L.s * 0.3, '#fff');
        } else {
          for (const sx of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + sx * r * 0.42, y - r * 0.05, r * 0.3, 0, 6.3); g.fill(); g.fillStyle = '#1d2340'; g.beginPath(); g.arc(x + sx * r * 0.42 + look[0] * r * 0.12, y - r * 0.05 + look[1] * r * 0.12, r * 0.15, 0, 6.3); g.fill(); }
          g.strokeStyle = '#1d2340'; g.lineWidth = 2; g.beginPath(); g.arc(x, y + r * 0.35, r * 0.2, 0.2, Math.PI - 0.2); g.stroke();
        }
        g.fillStyle = 'rgba(255,120,160,.55)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(x + sx * r * 0.85, y + r * 0.3, r * 0.17, r * 0.1, 0, 0, 6.3); g.fill(); }
      }
      function draw() {
        const { W, H, s } = L;
        g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 30; i++) { const sx = (i * 137.5) % W, sy = (i * 71.3) % H; g.fillRect(sx, sy, 1.5, 1.5); }
        if (!M) return;
        g.drawImage(wallCv, L.ox - 10, L.oy - 10, wallCv.width / Math.min(2, window.devicePixelRatio || 1), wallCv.height / Math.min(2, window.devicePixelRatio || 1));
        const nextCh = letters[pos] ? letters[pos].toLowerCase() : '';
        for (const [k, d] of dots) {
          const [x, y] = k.split(',').map(Number); const X = L.ox + (x + 0.5) * s, Y = L.oy + (y + 0.5) * s;
          if (d.kind === 'pellet') { g.fillStyle = '#ffe8a3'; g.beginPath(); g.arc(X, Y, Math.max(2, s * 0.07), 0, 6.3); g.fill(); }
          else if (d.kind === 'power') { const r = s * (0.2 + Math.sin(t * 6) * 0.04); g.fillStyle = '#ff8cc6'; g.shadowColor = '#ff8cc6'; g.shadowBlur = 12; g.beginPath(); g.arc(X, Y, r, 0, 6.3); g.fill(); g.shadowBlur = 0; }
          else {
            const glow = diff !== 'hard' && d.ch.toLowerCase() === nextCh && state === 'play';
            if (glow) { g.fillStyle = `rgba(255,212,59,${0.35 + Math.sin(t * 7) * 0.2})`; g.beginPath(); g.arc(X, Y, s * 0.52, 0, 6.3); g.fill(); }
            g.fillStyle = glow ? '#fff3bf' : '#ffffff'; g.strokeStyle = glow ? '#f59f00' : '#748ffc'; g.lineWidth = 3;
            g.beginPath(); g.arc(X, Y, s * 0.38, 0, 6.3); g.fill(); g.stroke();
            kit.text(g, d.ch, X, Y + 1, s * 0.5, '#1d2340');
          }
        }
        for (const q of puffs) drawPuff(q);
        // player = the student's avatar
        const X = px(player), Y = py(player);
        const mk = player.munch > 0 ? 1 + Math.sin(player.munch * 30) * 0.12 : 1;
        g.save(); if (player.inv > 0 && Math.floor(t * 10) % 2) g.globalAlpha = 0.35;
        g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(X, Y, s * 0.46, 0, 6.3); g.fill();
        g.translate(X, Y); g.scale(mk, 2 - mk); kit.emoji(g, avatar, 0, 2, s * 0.78); g.restore();
        if (player.stun > 0) for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; kit.emoji(g, '⭐', X + Math.cos(a) * s * 0.4, Y - s * 0.5 + Math.sin(a) * s * 0.12, s * 0.25); }
        parts.draw(g);
        if (state === 'ready') kit.text(g, 'READY!', W / 2, L.oy + M.R * s / 2, Math.min(60, s * 1.2), '#ffd43b', { stroke: '#1d2340' });
      }

      ctx.loop((dt) => {
        t += dt; parts.update(dt);
        if (state === 'ready') { readyT -= dt; if (readyT <= 0) state = 'play'; }
        if (state === 'play') {
          player.stun = Math.max(0, player.stun - dt); player.inv = Math.max(0, player.inv - dt); player.munch = Math.max(0, player.munch - dt);
          sleepT = Math.max(0, sleepT - dt);
          if (player.stun <= 0) step(player, diff === 'easy' ? 3.6 : 4.2, dt, choosePlayer, (e) => eatAt(e.x, e.y));
          const ps = (diff === 'easy' ? 3.6 : 4.2) * (diff === 'easy' ? 0.5 : diff === 'hard' ? 0.75 : 0.6) * (sleepT > 0 ? 0.5 : 1);
          for (const q of puffs) { if (state !== 'play') break; step(q, ps, dt, choosePuff); }
          if (state === 'play') for (const q of puffs) {
            if (Math.hypot(px(q) - px(player), py(q) - py(player)) > L.s * 0.6) continue;
            if (sleepT > 0) { parts.burst(px(q), py(q), '#b9c3f0', 16); ctx.addScore(50); ctx.float(px(q), py(q) - 20, 'Boop! +50', 'good'); EP.sfx.pop(); Object.assign(q, { x: q.home[0], y: q.home[1], tx: q.home[0], ty: q.home[1], p: 0, moving: false }); }
            else if (player.inv <= 0) {
              EP.sfx.whoosh(); ctx.float(px(player), py(player) - 20, 'Oops! Back to start 回起點', 'bad'); ctx.shake();
              Object.assign(player, { x: player.home[0], y: player.home[1], tx: player.home[0], ty: player.home[1], p: 0, moving: false, dir: null, want: null, inv: 2 });
            }
          }
        }
        draw();
      });

      /* ---------- test hooks ---------- */
      function nearestDot(pred) {
        const dist = bfs(player.x, player.y); let best = null, bd = 1e9;
        for (const [k, d] of dots) if (d.kind === 'letter' && pred(d)) { const [x, y] = k.split(',').map(Number); const dd = dist[y][x] < 0 ? 999 : dist[y][x]; if (dd < bd) { bd = dd; best = [x, y]; } }
        return best;
      }
      function hop(cell) { if (!cell) return false; Object.assign(player, { x: cell[0], y: cell[1], tx: cell[0], ty: cell[1], p: 0, moving: false, dir: null, want: null, stun: 0 }); eatAt(cell[0], cell[1]); return true; }
      newWord();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { let guard = 40; while (state === 'play' && pos < letters.length && guard--) if (!hop(nearestDot((d) => d.ch.toLowerCase() === letters[pos].toLowerCase()))) break; },
          wrong() { if (state !== 'play') return; const want = letters[pos].toLowerCase(); hop(nearestDot((d) => d.ch.toLowerCase() !== want && !letters.slice(pos).some((ch) => ch.toLowerCase() === d.ch.toLowerCase())) || nearestDot((d) => d.ch.toLowerCase() !== want)); },
        },
      };
    },
  });
})();
