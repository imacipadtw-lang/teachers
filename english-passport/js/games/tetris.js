/* Level 16 — Letter Drop (inspired by Tetris: falling blocks, ghost piece, next preview, soft / hard drop, line clears).
 * Letter blocks fall into the well. Build the target word left-to-right on any row: the run flashes and clears! */
(function () {
  const EP = window.EP, u = EP.u;
  const COLORS = ['#22b8cf', '#fab005', '#be4bdb', '#40c057', '#fa5252', '#4c6ef5', '#fd7e14'];
  EP.registerGame({
    id: 'tetris', level: 16, icon: '🧱', title: 'Letter Drop', titleZh: '柏林字母方塊',
    model: 'Tetris 俄羅斯方塊（累計售出超過 5.2 億套）',
    howZh: '字母方塊會掉下來！左右移動、旋轉、快速落下，在任一橫排由左到右拼出聽到的單字，就能消除！疊到頂端會被清掉一半。',
    howEn: 'Move and drop the letter blocks. Spell the word left to right on any row to clear it!',
    skills: ['listening', 'meaning', 'spelling'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit, D = ctx.difficulty, items = ctx.items, n = items.length;
      root.style.background = '#2b1d4f';
      const c = K.canvas(root), g = c.g, parts = K.particles();
      const keyOf = (it) => EP.spellKey(it).replace(/ /g, '');
      const maxLen = Math.max(...items.map((it) => keyOf(it).length));
      const COLS = Math.max(8, maxLen + 1), ROWS = 13;
      const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      const FALL = D === 'easy' ? 1.1 : D === 'hard' ? 0.55 : 0.8;

      /* ---------- DOM: prompt + next preview + controls ---------- */
      const top = u.el('div', { style: { position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', gap: '8px', alignItems: 'stretch', justifyContent: 'center', width: '98%' } });
      const nextBox = u.el('div', { style: { background: 'rgba(255,255,255,.92)', borderRadius: '16px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 rgba(0,0,0,.2)', minWidth: '62px' } });
      root.appendChild(top);
      const bar = u.el('div', { style: { position: 'absolute', left: 0, right: 0, bottom: '8px', zIndex: 6, display: 'flex', gap: '8px', justifyContent: 'center' } });
      const mkBtn = (label, title, down, up) => { const b = u.el('button', { class: 'btn', title, style: { minWidth: '62px', minHeight: '60px', fontSize: '1.6rem', padding: '4px 10px' } }, label); ctx.on(b, 'pointerdown', (e) => { e.preventDefault(); down(); }); if (up) { ctx.on(b, 'pointerup', up); ctx.on(b, 'pointerleave', up); } bar.appendChild(b); return b; };
      mkBtn('◀', 'Left 左', () => move(-1)); mkBtn('⟳', 'Turn 旋轉', () => rotate());
      mkBtn('▼', 'Soft drop 慢慢下', () => (soft = true), () => (soft = false)); mkBtn('⤓', 'Drop! 落下', () => hardDrop()); mkBtn('▶', 'Right 右', () => move(1));
      root.appendChild(bar);

      let idx = 0, item = null, target = '', tries = 0, pieces = [], piece = null, state = 'wait', fallT = 0, soft = false, spawnT = 0;
      let refills = 0, hinted = false, slotsEl = null, t = 0, wellShake = 0, sweep = null; const fx = [];
      let W0 = {};
      function layout() {
        const W = c.w, H = c.h, topH = Math.max(90, top.getBoundingClientRect().height + 16), botH = 84;
        const cs = Math.floor(Math.min((H - topH - botH) / ROWS, (W - 16) / COLS, 54));
        W0 = { W, H, cs, x: Math.round((W - cs * COLS) / 2), y: topH + Math.max(0, Math.round((H - topH - botH - cs * ROWS) / 2)) };
      }

      /* ---------- supply ---------- */
      function refill() {
        refills++;
        let ls = target.split('');
        if (D !== 'easy') {
          const nd = D === 'hard' ? u.randInt(2, 3) : 1;
          const dec = 'abcdefghiklmnoprstuwy'.split('').filter((x) => !target.toLowerCase().includes(x)); for (let i = 0; i < nd; i++) ls.push(dec.length ? u.pick(dec) : 'x');
          ls = u.shuffle(ls);
        }
        for (let i = 0; i < ls.length; i++) {
          if (i + 1 < ls.length && Math.random() < 0.22) { pieces.push([{ dx: 0, dy: 0, ch: ls[i] }, { dx: 1, dy: 0, ch: ls[i + 1] }]); i++; }
          else pieces.push([{ dx: 0, dy: 0, ch: ls[i] }]);
        }
        if (refills >= 3 && !hinted && D !== 'hard') showHint();
      }
      function showNext() {
        nextBox.innerHTML = ''; nextBox.appendChild(u.el('div', { style: { fontSize: '.75rem', fontWeight: 900, color: '#495057' } }, 'NEXT'));
        if (!pieces.length) refill();
        const p = pieces[0], row = u.el('div', { style: { display: 'flex', gap: '2px' } });
        p.forEach((cl) => row.appendChild(u.el('div', { style: { width: '30px', height: '30px', borderRadius: '6px', background: colorOf(cl.ch), color: '#fff', fontWeight: 900, fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 2px 0 rgba(0,0,0,.3)' } }, cl.ch)));
        nextBox.appendChild(row);
      }
      const colorOf = (ch) => COLORS[ch.toLowerCase().charCodeAt(0) % COLORS.length];

      /* ---------- prompt ---------- */
      function showPrompt() {
        top.innerHTML = '';
        const pic = EP.pic(item), hard = D === 'hard';
        const narrow = c.w < 600;
        slotsEl = u.el('div', { style: { display: 'flex', gap: '3px', marginTop: '2px', justifyContent: 'center', flexBasis: narrow ? '100%' : 'auto' } });
        renderSlots(D === 'easy' ? target.length : D === 'normal' ? 1 : 0);
        const card = u.el('div', { class: 'prompt-card', style: { padding: '6px 12px', gap: narrow ? '4px 10px' : '10px', flexWrap: narrow ? 'wrap' : 'nowrap', justifyContent: 'center' } },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(item); } }, '🔊'),
          hard ? null : pic ? u.el('div', { class: 'pic', style: { fontSize: '2.6rem' } }, pic) : u.el('div', { class: 'zh', style: { fontSize: '1.6rem', fontWeight: 900, whiteSpace: 'nowrap' } }, item.zh),
          narrow ? null : u.el('div', { style: { fontWeight: 900, fontSize: '.95rem', color: 'var(--ink2)', lineHeight: 1.15 } }, 'Spell it on one row', u.el('div', { class: 'zh' }, '在同一排由左到右拼出來'), slotsEl),
          D === 'hard' ? null : u.el('button', { class: 'btn small ghost', title: 'Hint 提示', style: { color: '#7a5a00', borderColor: '#ffd43b', minWidth: '48px' }, onclick: (e) => { e.stopPropagation(); showHint(); } }, '💡'),
          narrow ? slotsEl : null);
        top.append(card, nextBox); layout();
      }
      function renderSlots(show) {
        if (!slotsEl) return; slotsEl.innerHTML = '';
        target.split('').forEach((ch, i) => slotsEl.appendChild(u.el('span', { style: { width: '24px', height: '30px', borderBottom: '4px solid #7048e8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.35rem', color: i < show ? '#17246b' : 'transparent' } }, ch)));
      }
      function showHint() { hinted = true; renderSlots(target.length); ctx.say(item); if (D !== 'easy') ctx.timeout(() => item && renderSlots(D === 'normal' ? 1 : 0), 2600); }

      /* ---------- piece mechanics ---------- */
      const hits = (cells, x, y) => cells.some((cl) => { const cx = x + cl.dx, cy = y + cl.dy; return cx < 0 || cx >= COLS || cy >= ROWS || (cy >= 0 && grid[cy][cx]); });
      function spawn() {
        if (!pieces.length) refill();
        const cells = pieces.shift(); showNext();
        piece = { cells, x: Math.floor((COLS - (cells.length > 1 ? 2 : 1)) / 2), y: 0 };
        fallT = 0; spawnT = 0.2;
        if (hits(piece.cells, piece.x, piece.y)) { piece = null; topOut(); }
      }
      function move(dx) { if (state !== 'play' || !piece || ctx.paused) return false; if (!hits(piece.cells, piece.x + dx, piece.y)) { piece.x += dx; EP.sfx.click(); return true; } return false; }
      function moveTo(col) { if (!piece) return; let guard = 20; while (guard-- && piece.x !== col && move(Math.sign(col - piece.x))); }
      function rotate() {
        if (state !== 'play' || !piece || piece.cells.length < 2 || ctx.paused) return;
        const rc = piece.cells.map((cl) => ({ dx: -cl.dy, dy: cl.dx, ch: cl.ch }));
        for (const k of [0, -1, 1]) if (!hits(rc, piece.x + k, piece.y)) { piece.cells = rc; piece.x += k; EP.sfx.pop(); return; }
      }
      const ghostY = () => { let y = piece.y; while (!hits(piece.cells, piece.x, y + 1)) y++; return y; };
      function hardDrop() {
        if (state !== 'play' || !piece || ctx.paused) return;
        const y = ghostY(); const dist = y - piece.y; piece.y = y; wellShake = 0.25; EP.sfx.boom();
        piece.cells.forEach((cl) => parts.burst(W0.x + (piece.x + cl.dx + 0.5) * W0.cs, W0.y + (y + cl.dy + 1) * W0.cs, '#ffffff', 5, 120));
        if (dist > 0) ctx.addScore(dist);
        lock();
      }
      function lock() {
        const placed = [];
        for (const cl of piece.cells) { const x = piece.x + cl.dx, y = piece.y + cl.dy; if (y < 0) { piece = null; return topOut(); } grid[y][x] = { ch: cl.ch, pop: 0 }; placed.push([x, y]); }
        piece = null; EP.sfx.pop(); evaluate(placed);
      }

      /* ---------- word checks ---------- */
      const rowStr = (r) => grid[r].map((cl) => (cl ? cl.ch.toLowerCase() : ' ')).join('');
      function evaluate(placed) {
        const tl = target.toLowerCase(), rowsHit = Array.from(new Set(placed.map((p) => p[1])));
        for (const r of rowsHit) { const at = rowStr(r).indexOf(tl); if (at >= 0) return success(r, at); }
        for (const [x, r] of placed) { // a run of exactly the right letters but in the wrong order = a spelling attempt
          let a = x, b = x; while (a > 0 && grid[r][a - 1]) a--; while (b < COLS - 1 && grid[r][b + 1]) b++;
          const run = rowStr(r).slice(a, b + 1);
          if (run.length === tl.length && run !== tl && run.split('').sort().join('') === tl.split('').sort().join('')) return misspell(r, a, run);
        }
        if (lineClears()) return;
        spawn();
      }
      function cellXY(x, y) { return { x: W0.x + (x + 0.5) * W0.cs, y: W0.y + (y + 0.5) * W0.cs }; }
      function success(r, at) {
        state = 'anim'; const L = target.length, mid = cellXY(at + L / 2 - 0.5, r);
        for (let i = 0; i < L; i++) fx.push({ x: at + i, y: r, t: 0, col: '#ffe066', delay: i * 0.05 });
        ctx.answer(item, true, { x: mid.x, y: mid.y - 30, points: hinted ? 70 : 100 });
        ctx.float(mid.x, mid.y - 80, '✨ ' + item.word + '!', 'good'); renderSlots(L);
        ctx.timeout(() => ctx.say(item), 250);
        ctx.timeout(() => {
          for (let i = 0; i < L; i++) { const p = cellXY(at + i, r); parts.burst(p.x, p.y, colorOf(target[i]), 10, 240); }
          for (let i = 0; i < L; i++) { const x = at + i; for (let y = r; y > 0; y--) grid[y][x] = grid[y - 1][x]; grid[0][x] = null; }
          EP.sfx.slice(); fx.length = 0;
          ctx.timeout(() => { if (!lineClears(nextWord)) nextWord(); }, 250);
        }, 700);
      }
      async function misspell(r, a, run) {
        state = 'anim'; tries++; const L = target.length, mid = cellXY(a + L / 2 - 0.5, r);
        for (let i = 0; i < L; i++) fx.push({ x: a + i, y: r, t: 0, col: '#ff6b6b', delay: 0 });
        ctx.answer(item, false, { x: mid.x, y: mid.y - 30, label: run + ' ✗' }); ctx.shake();
        await ctx.wait(600);
        for (let i = 0; i < L; i++) { const x = a + i; for (let y = r; y > 0; y--) grid[y][x] = grid[y - 1][x]; grid[0][x] = null; }
        fx.length = 0; await afterMistake();
      }
      function topOut() {
        state = 'anim'; tries++; EP.sfx.whoosh(); sweep = { t: 0 };
        const half = Math.ceil(ROWS / 2);
        ctx.timeout(async () => {
          for (let y = ROWS - 1; y >= 0; y--) grid[y] = y - half >= 0 ? grid[y - half] : Array(COLS).fill(null);
          sweep = null; ctx.answer(item, false, { x: W0.W / 2, y: W0.y + W0.cs * 3, label: 'Too high! 太高了' });
          await afterMistake();
        }, 900);
      }
      async function afterMistake() {
        await ctx.reveal(item);
        if (tries >= 2) return nextWord();
        pieces = []; refills = 0; renderSlots(D === 'hard' ? 0 : D === 'normal' ? 1 : target.length);
        state = 'play'; ctx.say(item); spawn();
      }
      function lineClears(then) {
        const full = []; for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) full.push(y);
        if (!full.length) return false;
        state = 'anim'; full.forEach((y) => { for (let x = 0; x < COLS; x++) fx.push({ x, y, t: 0, col: '#ffffff', delay: x * 0.03 }); });
        const bonus = full.length * 50; ctx.addScore(bonus); ctx.float(W0.W / 2, W0.y + full[0] * W0.cs, `LINE CLEAR! +${bonus}`, 'good'); EP.sfx.chest();
        ctx.timeout(() => {
          full.forEach((y) => { for (let x = 0; x < COLS; x++) { const p = cellXY(x, y); parts.burst(p.x, p.y, null, 4, 200); } });
          for (const fy of full) { grid.splice(fy, 1); grid.unshift(Array(COLS).fill(null)); }
          fx.length = 0; if (then) then(); else { state = 'play'; spawn(); }
        }, 550);
        return true;
      }
      function nextWord() {
        if (idx >= n) return;
        idx++; ctx.hud.progress(idx / n);
        if (idx >= n) { state = 'done'; top.innerHTML = ''; EP.sfx.win(); ctx.confetti(); ctx.burst('🧱 Wunderbar! 太棒了！'); ctx.timeout(() => ctx.end(), 1600); return; }
        startWord();
      }
      function startWord() {
        item = items[idx]; target = keyOf(item); tries = 0; pieces = []; refills = 0; hinted = false;
        showPrompt(); state = 'play'; ctx.timeout(() => ctx.say(item), 200); spawn();
      }

      /* ---------- input ---------- */
      ctx.on(window, 'keydown', (e) => {
        if (state !== 'play') return;
        if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); else if (e.key === 'ArrowUp' || e.key === 'x') rotate();
        else if (e.key === 'ArrowDown') soft = true; else if (e.key === ' ') { e.preventDefault(); hardDrop(); } else return;
        e.preventDefault();
      });
      ctx.on(window, 'keyup', (e) => { if (e.key === 'ArrowDown') soft = false; });
      let ptr = null;
      const colAt = (e) => { const r = c.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      ctx.on(c.cv, 'pointerdown', (e) => { const p = colAt(e); ptr = { x0: p.x, y0: p.y, t0: performance.now() }; if (state === 'play' && piece) moveTo(Math.floor((p.x - W0.x) / W0.cs)); });
      ctx.on(c.cv, 'pointermove', (e) => { if (!ptr || state !== 'play' || !piece) return; const p = colAt(e); if (Math.abs(p.y - ptr.y0) < W0.cs * 1.5) moveTo(u.clamp(Math.floor((p.x - W0.x) / W0.cs), 0, COLS - 1)); });
      ctx.on(c.cv, 'pointerup', (e) => { if (!ptr) return; const p = colAt(e), dy = p.y - ptr.y0, dt = performance.now() - ptr.t0; if (dy > W0.cs * 2 && dy > Math.abs(p.x - ptr.x0) && dt < 600) hardDrop(); ptr = null; });

      /* ---------- drawing ---------- */
      function block(x, y, cs, ch, o) {
        o = o || {}; const col = o.col || colorOf(ch), s = cs - 3;
        g.save(); g.globalAlpha = o.alpha == null ? 1 : o.alpha; g.translate(x + cs / 2, y + cs / 2); if (o.scale) g.scale(o.scale, o.scale);
        K.roundRect(g, -s / 2, -s / 2, s, s, s * 0.18); g.fillStyle = col; g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; K.roundRect(g, -s / 2 + 3, -s / 2 + 3, s - 6, s * 0.3, s * 0.12); g.fill();
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-s / 2 + 3, s / 2 - s * 0.16, s - 6, s * 0.12);
        K.text(g, ch, 0, 1, s * 0.62, '#fff', { stroke: 'rgba(0,0,0,.35)', strokeW: Math.max(3, s * 0.1) });
        g.restore();
      }
      function backdrop() {
        const { W, H } = W0; let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3b2a78'); gr.addColorStop(0.6, '#c2557a'); gr.addColorStop(1, '#f59f6b');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(30,18,60,.55)'; const base = H - 40;
        for (let i = 0; i < 22; i++) { const bw = W / 22, bh = 60 + ((i * 53) % 90); g.fillRect(i * bw, base - bh, bw - 2, bh + 40); }
        // TV tower
        const tx = W * 0.82; g.fillRect(tx - 4, base - 330, 8, 330); g.beginPath(); g.arc(tx, base - 250, 22, 0, 7); g.fill(); g.fillRect(tx - 1.5, base - 400, 3, 80);
        // Brandenburg gate
        const bx = W * 0.14, bw2 = 150; g.fillRect(bx - bw2 / 2, base - 120, bw2, 22); g.fillRect(bx - bw2 / 2 + 10, base - 140, bw2 - 20, 22);
        for (let i = 0; i < 6; i++) g.fillRect(bx - bw2 / 2 + 6 + i * (bw2 - 22) / 5, base - 98, 10, 98);
        K.emoji(g, '🐎', bx, base - 158, 30);
      }
      ctx.loop((dt) => {
        t += dt; if (c.w !== W0.W || c.h !== W0.H) layout();
        if (state === 'play' && piece) {
          if (spawnT > 0) spawnT -= dt;
          else { fallT += dt; const iv = soft ? 0.05 : FALL; if (fallT >= iv) { fallT = 0; if (!hits(piece.cells, piece.x, piece.y + 1)) { piece.y++; if (soft) ctx.addScore(1); } else lock(); } }
        }
        wellShake = Math.max(0, wellShake - dt); parts.update(dt); fx.forEach((f) => (f.t += dt));
        const { cs } = W0; backdrop();
        const ox = W0.x + (wellShake ? Math.sin(t * 80) * 4 * wellShake * 4 : 0), oy = W0.y + wellShake * 10;
        g.fillStyle = '#16102e'; K.roundRect(g, ox - 8, oy - 8, cs * COLS + 16, cs * ROWS + 16, 14); g.fill();
        g.strokeStyle = '#ffd43b'; g.lineWidth = 4; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
        for (let x = 1; x < COLS; x++) { g.beginPath(); g.moveTo(ox + x * cs, oy); g.lineTo(ox + x * cs, oy + ROWS * cs); g.stroke(); }
        for (let y = 1; y < ROWS; y++) { g.beginPath(); g.moveTo(ox, oy + y * cs); g.lineTo(ox + COLS * cs, oy + y * cs); g.stroke(); }
        g.fillStyle = 'rgba(255,80,80,.18)'; g.fillRect(ox, oy, COLS * cs, cs); // danger zone
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const cl = grid[y][x]; if (!cl) continue;
          const f = fx.find((q) => q.x === x && q.y === y), on = f && f.t > f.delay;
          block(ox + x * cs, oy + y * cs, cs, cl.ch, on ? { col: Math.sin(f.t * 30) > 0 ? f.col : colorOf(cl.ch), scale: 1 + 0.12 * Math.sin(f.t * 12) } : null);
        }
        if (piece && state === 'play') {
          const gy = ghostY();
          piece.cells.forEach((cl) => { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.setLineDash([5, 4]); K.roundRect(g, ox + (piece.x + cl.dx) * cs + 3, oy + (gy + cl.dy) * cs + 3, cs - 6, cs - 6, 6); g.stroke(); g.setLineDash([]); });
          const drop = spawnT > 0 ? 0 : Math.min(1, fallT / (soft ? 0.05 : FALL)) * 0.25 * (hits(piece.cells, piece.x, piece.y + 1) ? 0 : 1);
          piece.cells.forEach((cl) => { if (piece.y + cl.dy >= 0) block(ox + (piece.x + cl.dx) * cs, oy + (piece.y + cl.dy + drop) * cs, cs, cl.ch); });
        }
        if (sweep) { // snow-plough sweep clears the lower half
          sweep.t += dt; const p = Math.min(1, sweep.t / 0.8), half = Math.ceil(ROWS / 2), y0 = oy + (ROWS - half) * cs;
          g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(ox, y0, COLS * cs * p, half * cs);
          K.emoji(g, '🧹', ox + COLS * cs * p, y0 + half * cs / 2, cs * 2.2);
          if (Math.random() < 0.5) parts.burst(ox + COLS * cs * p, y0 + Math.random() * half * cs, '#ffffff', 2, 160);
        }
        parts.draw(g);
      });

      layout(); ctx.timeout(startWord, 250);
      /* test hooks: place the word (or a scrambled version) straight onto the stack, as if dropped there */
      function place(str) {
        if (state !== 'play') return; const L = str.length;
        if (piece) { pieces.unshift(piece.cells.map((cl, i) => ({ dx: i ? 1 : 0, dy: 0, ch: cl.ch }))); piece = null; }
        let spot = null;
        for (const needSupport of [true, false]) {
          for (let r = ROWS - 1; r >= 1 && !spot; r--) for (let c0 = 0; c0 + L <= COLS && !spot; c0++) {
            let ok = (c0 === 0 || !grid[r][c0 - 1]) && (c0 + L === COLS || !grid[r][c0 + L]);
            for (let i = 0; i < L && ok; i++) ok = !grid[r][c0 + i] && (!needSupport || r === ROWS - 1 || !!grid[r + 1][c0 + i]);
            if (ok) spot = [r, c0];
          }
          if (spot) break;
        }
        if (!spot) return topOut();
        const placed = str.split('').map((ch, i) => { grid[spot[0]][spot[1] + i] = { ch }; return [spot[1] + i, spot[0]]; });
        evaluate(placed);
      }
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { place(target); },
          wrong() { if (state !== 'play') return; let s = target; for (let k = 0; k < 20 && s.toLowerCase() === target.toLowerCase(); k++) s = u.shuffle(target.split('')).join(''); if (s.toLowerCase() === target.toLowerCase()) s = target.split('').reverse().join('') + 'q'; place(s); },
        },
      };
    },
  });
})();
