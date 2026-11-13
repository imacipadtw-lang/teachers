/* Level 7 — Pyramid 2048 (inspired by 2048: slide the whole board, tiles glide and merge)
 * Tiles show a number either as digits ("7", "1st", "🔢") or as an English word ("seven", "first", "number").
 * Slide a digit tile into its matching word tile: they merge into a golden pyramid block that says the word and
 * flies to your pyramid. Non-matching tiles never merge. A full board is gently shuffled (no game over). */
(function () {
  const EP = window.EP, u = EP.u;
  const DIRS = ['left', 'right', 'up', 'down'];
  const coord = (d, i, j) => (d === 'left' ? [i, j] : d === 'right' ? [i, 3 - j] : d === 'up' ? [j, i] : [3 - j, i]);
  const matches = (a, b) => a.item.id === b.item.id && a.form !== b.form;
  /** pure slide (does not mutate tiles): returns new grid, final positions and merges */
  function slide(cells, dir) {
    const out = [0, 1, 2, 3].map(() => [null, null, null, null]); const moves = [], merges = []; let moved = false;
    for (let i = 0; i < 4; i++) {
      let pos = 0, last = null;
      for (let j = 0; j < 4; j++) {
        const [r, c] = coord(dir, i, j), t = cells[r][c]; if (!t) continue;
        if (last && matches(last, t)) { const [mr, mc] = coord(dir, i, pos - 1); merges.push({ a: last, b: t, r: mr, c: mc }); out[mr][mc] = null; moves.push({ t, r: mr, c: mc }); last = null; moved = true; }
        else { const [nr, nc] = coord(dir, i, pos); out[nr][nc] = t; moves.push({ t, r: nr, c: nc }); if (nr !== r || nc !== c) moved = true; last = t; pos++; }
      }
    }
    return { out, moves, merges, moved };
  }
  function digitOf(item) {
    if (/^\d+$/.test(item.zh)) return item.zh;
    const o = { '第一': '1st', '第二': '2nd', '第三': '3rd' }[item.zh]; if (o) return o;
    if (item.word === 'number') return '🔢';
    return EP.pic(item) || item.zh;
  }
  function wordLines(w, cs) {
    if (w.length <= 5 || (cs * 1.55) / w.length >= 20) return [w];
    if (/teen$/.test(w)) return [w.slice(0, -4), 'teen'];
    if (/ty$/.test(w)) return [w.slice(0, -2), 'ty'];
    const sp = { hundred: ['hun', 'dred'], thousand: ['thou', 'sand'], number: ['num', 'ber'], second: ['sec', 'ond'] }[w]; if (sp) return sp;
    const h = Math.ceil(w.length / 2); return [w.slice(0, h), w.slice(h)];
  }

  EP.registerGame({
    id: 'merge', level: 7, icon: '🔺', title: 'Pyramid 2048', titleZh: '金字塔 2048',
    model: '2048（滑動合併數字方塊）',
    howZh: '上下左右滑動（或按方向鍵）讓所有方塊一起移動。數字「7」碰到英文「seven」就合成金字塔！點方塊可以聽發音。',
    howEn: 'Swipe (or arrow keys) to slide all tiles. Push a number into its English word ("7" + "seven") to build a golden pyramid! Tap a tile to hear it.',
    skills: ['reading', 'meaning', 'listening'],
    start(ctx) {
      const root = ctx.root;
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const MAXA = easy ? 3 : hard ? 8 : 6;
      root.style.background = 'linear-gradient(#ff9a5a 0%, #ffc979 45%, #f3d29a 62%, #e7b46a 100%)';
      root.style.touchAction = 'none';
      root.appendChild(u.el('style', {}, `
        .pm-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
        .pm-sun{position:absolute;right:8%;top:6%;width:90px;height:90px;border-radius:50%;background:radial-gradient(#fff6c8,#ffd43b 60%,rgba(255,212,59,0) 72%)}
        .pm-far{position:absolute;bottom:34%;clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(110deg,#e9b36b 50%,#c98a43 50%);opacity:.75}
        .pm-dune{position:absolute;left:-10%;right:-10%;border-radius:50% 50% 0 0}
        .pm-camel{position:absolute;bottom:31%;font-size:2.2rem;animation:pmWalk 38s linear infinite}
        @keyframes pmWalk{from{left:-10%}to{left:105%}}
        .pm-wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:10px}
        .pm-wish{gap:10px;padding:6px 14px 6px 6px;min-height:62px}
        .pm-wish .txt{font-size:clamp(1rem,3.6vw,1.35rem);font-weight:900}
        .pm-wish .dg{font-size:1.8rem;font-weight:900;color:#173d82;background:#fff3bf;border-radius:12px;padding:0 10px}
        .pm-board{position:relative;flex:none;background:#c9a66b;border-radius:18px;box-shadow:inset 0 0 0 6px #a67c3d,0 10px 0 #7a5527,0 18px 30px rgba(0,0,0,.3)}
        .pm-cell{position:absolute;border-radius:12px;background:rgba(122,85,39,.33)}
        .pm-tile{position:absolute;left:0;top:0;transition:transform .12s ease-in-out;will-change:transform;cursor:pointer;z-index:2}
        .pm-tile .in{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;border-radius:13px;font-weight:900;line-height:1.02;animation:pmNew .22s ease-out;text-align:center}
        .pm-tile.d .in{background:linear-gradient(160deg,#2f74de,#173d82);color:#ffd43b;box-shadow:inset 0 0 0 4px #e8b923,0 5px 0 #0f2a5c;text-shadow:0 2px 0 rgba(0,0,0,.35)}
        .pm-tile.w .in{background:linear-gradient(160deg,#fff1c9,#e9bb62);color:#5a3410;box-shadow:inset 0 0 0 3px rgba(122,85,39,.45),0 5px 0 #a67c3d}
        .pm-tile.wish .in{outline:4px dashed #fff;outline-offset:-9px}
        .pm-tile.wig .in{animation:pmWig .35s}
        @keyframes pmNew{from{transform:scale(0)}60%{transform:scale(1.12)}to{transform:scale(1)}}
        @keyframes pmWig{25%{transform:rotate(-9deg) scale(1.08)}75%{transform:rotate(9deg) scale(1.08)}}
        .pm-pyr{position:absolute;left:0;top:0;z-index:6;pointer-events:none;transition:transform .75s cubic-bezier(.5,-0.35,.7,1),opacity .75s}
        .pm-pyr .tri{position:absolute;inset:0;clip-path:polygon(50% 2%,100% 100%,0 100%);background:linear-gradient(120deg,#fff9db 0%,#ffd43b 45%,#e8a400 46%,#c27c00 100%);animation:pmNew .35s ease-out}
        .pm-pyr .lab{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);background:#fff;color:#7a4b00;border-radius:999px;padding:1px 10px;font-weight:900;white-space:nowrap;box-shadow:0 3px 0 rgba(0,0,0,.2)}
        .pm-pyr .dg{position:absolute;left:0;right:0;top:40%;text-align:center;font-weight:900;color:#5a3410}
        .pm-track{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:40px}
        .pm-track .row{display:flex;gap:2px}
        .pm-track .b{width:20px;height:13px;border-radius:3px;background:rgba(122,85,39,.35);transition:background .4s,box-shadow .4s}
        .pm-track .b.on{background:linear-gradient(#ffe066,#e8a400);box-shadow:0 0 8px #ffd43b}
        .pm-end{position:absolute;left:0;right:0;top:34%;text-align:center;color:#fff;font-weight:900;font-size:clamp(2rem,7vw,3.4rem);text-shadow:0 4px 0 rgba(0,0,0,.4);z-index:9;pointer-events:none}`));
      const bgEl = u.el('div', { class: 'pm-bg' },
        u.el('div', { class: 'pm-sun' }),
        u.el('div', { class: 'pm-far', style: { left: '4%', width: '30%', height: '22%' } }), u.el('div', { class: 'pm-far', style: { left: '26%', width: '20%', height: '15%' } }), u.el('div', { class: 'pm-far', style: { right: '3%', width: '24%', height: '18%' } }),
        u.el('div', { class: 'pm-dune', style: { bottom: 0, height: '36%', background: '#e7b46a' } }), u.el('div', { class: 'pm-dune', style: { bottom: '-8%', height: '26%', background: '#d99d4f', left: '30%' } }),
        u.el('div', { class: 'pm-camel' }, '🐪'), u.el('div', { style: { position: 'absolute', left: '3%', bottom: '24%', fontSize: '2.6rem' } }, '🌴'));
      const wishEl = u.el('div', { class: 'prompt-card pm-wish' });
      const board = u.el('div', { class: 'pm-board' });
      const track = u.el('div', { class: 'pm-track' });
      const wrap = u.el('div', { class: 'pm-wrap' }, wishEl, board, track);
      root.append(bgEl, wrap);

      const items = ctx.items, N = items.length;
      const pending = u.shuffle(items.slice());
      let grid = [0, 1, 2, 3].map(() => [null, null, null, null]);
      let CS = 80, GAPPX = 8, busy = false, state = 'play', cleared = 0, uid = 0, wish = null, mistakes = new Set();
      const busyCells = new Set();
      const cells = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const e = u.el('div', { class: 'pm-cell' }); board.appendChild(e); cells.push({ r, c, e }); }

      // stepped-pyramid progress tracker (bottom rows first)
      let k = 1; while ((k * (k + 1)) / 2 < N) k++;
      const blocks = []; let left = N; const rows = [];
      for (let w = k; w >= 1 && left > 0; w--) { const n = Math.min(w, left); rows.unshift(n); left -= n; }
      rows.forEach((n) => { const row = u.el('div', { class: 'row' }); for (let i = 0; i < n; i++) row.appendChild(u.el('div', { class: 'b' })); track.appendChild(row); });
      Array.from(track.children).reverse().forEach((row) => Array.from(row.children).forEach((b) => blocks.push(b)));

      const xy = (r, c) => [GAPPX + c * (CS + GAPPX), GAPPX + r * (CS + GAPPX)];
      function layout() {
        const rr = root.getBoundingClientRect();
        const side = Math.max(200, Math.min(rr.width - 24, rr.height - 76 - 60 - 40, 600));
        GAPPX = Math.round(side * 0.025); CS = (side - GAPPX * 5) / 4;
        board.style.width = board.style.height = side + 'px';
        for (const ce of cells) { const [x, y] = xy(ce.r, ce.c); Object.assign(ce.e.style, { left: x + 'px', top: y + 'px', width: CS + 'px', height: CS + 'px' }); }
        eachTile((t) => { styleTile(t); place(t); });
      }
      const ro = new ResizeObserver(() => layout()); ro.observe(root); ctx.onCleanup(() => ro.disconnect());
      function eachTile(fn) { for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (grid[r][c]) fn(grid[r][c]); }
      function place(t) { const [x, y] = xy(t.r, t.c); t.el.style.transform = `translate(${x}px,${y}px)`; }
      function styleTile(t) {
        Object.assign(t.el.style, { width: CS + 'px', height: CS + 'px' });
        const inner = t.el.firstChild; inner.innerHTML = '';
        if (t.form === 'd') { const d = digitOf(t.item); inner.style.fontSize = Math.min(CS * 0.46, (CS * 1.5) / Math.max(1.6, d.length)) + 'px'; inner.textContent = d; }
        else { const lines = wordLines(t.item.word, CS), ml = Math.max(...lines.map((l) => l.length)); inner.style.fontSize = Math.min(CS * (lines.length > 1 ? 0.3 : 0.32), (CS * 1.55) / Math.max(3, ml)) + 'px'; lines.forEach((l) => inner.appendChild(u.el('div', {}, l))); }
      }
      function addTile(item, form, r, c) {
        const t = { id: ++uid, item, form, r, c, el: u.el('div', { class: 'pm-tile ' + form }, u.el('div', { class: 'in' })) };
        t.el._tile = t; grid[r][c] = t; styleTile(t); place(t); board.appendChild(t.el);
        if (easy && wish && wish.id === item.id) t.el.classList.add('wish');
        return t;
      }
      function boardInfo() {
        const m = new Map();
        eachTile((t) => { const e = m.get(t.item.id) || { item: t.item, d: null, w: null, first: t.id }; e[t.form] = t; e.first = Math.min(e.first, t.id); m.set(t.item.id, e); });
        return m;
      }
      function empties() { const out = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c] && !busyCells.has(r * 4 + c)) out.push([r, c]); return out; }
      function spawn(n) {
        for (let i = 0; i < (n || 1); i++) {
          const em = empties(); if (!em.length) return;
          const info = boardInfo(), halves = Array.from(info.values()).filter((x) => !x.d || !x.w).sort((a, b) => a.first - b.first);
          const canNew = pending.length && info.size < MAXA;
          let item, form;
          if (halves.length && (!canNew || Math.random() < 0.6)) { item = halves[0].item; form = halves[0].d ? 'w' : 'd'; }
          else if (canNew) { item = pending.shift(); form = Math.random() < 0.5 ? 'd' : 'w'; }
          else return;
          const [r, c] = u.pick(em); addTile(item, form, r, c);
        }
      }

      /* ---------- wish (listening bonus) ---------- */
      function setWish() {
        const all = Array.from(boardInfo().values()); if (!all.length) { wish = null; renderWish(); return; }
        const full = all.filter((x) => x.d && x.w);
        wish = u.pick(full.length ? full : all).item;
        eachTile((t) => t.el.classList.toggle('wish', easy && t.item.id === wish.id));
        renderWish(); ctx.timeout(() => { if (wish && !ctx.paused) ctx.say(wish); }, 300);
      }
      function renderWish() {
        wishEl.innerHTML = '';
        if (!wish) { wishEl.append(u.el('div', { class: 'txt' }, '🔺 Match number + word! 數字配英文')); return; }
        const w = wish;
        wishEl.append(u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(w); } }, '🔊'),
          u.el('div', { class: 'txt' }, '👑 Pharaoh wants 法老想要', easy ? u.el('span', { class: 'dg', style: { marginLeft: '8px' } }, digitOf(w)) : ' …?'));
      }

      /* ---------- moves ---------- */
      function doMove(dir) {
        if (busy || state !== 'play' || ctx.paused) return false;
        const res = slide(grid, dir);
        if (!res.moved) { board.animate && board.animate([{ transform: 'translateX(0)' }, { transform: `translate${dir === 'left' || dir === 'right' ? 'X' : 'Y'}(${dir === 'left' || dir === 'up' ? -6 : 6}px)` }, { transform: 'translateX(0)' }], { duration: 160 }); return false; }
        busy = true; EP.sfx.click();
        for (const m of res.moves) { m.t.r = m.r; m.t.c = m.c; place(m.t); }
        grid = res.out;
        for (const mg of res.merges) { mg.a.el.style.zIndex = 3; busyCells.add(mg.r * 4 + mg.c); }
        ctx.timeout(() => {
          for (const mg of res.merges) merged(mg);
          spawn(1); busy = false;
          if (state === 'play' && !DIRS.some((d) => slide(grid, d).moved)) stuck();
        }, 135);
        return true;
      }
      function merged(mg) {
        const item = mg.a.item; mg.a.el.remove(); mg.b.el.remove();
        const [x, y] = xy(mg.r, mg.c);
        const pyr = u.el('div', { class: 'pm-pyr', style: { width: CS + 'px', height: CS + 'px', transform: `translate(${x}px,${y}px)` } },
          u.el('div', { class: 'tri' }), u.el('div', { class: 'dg', style: { fontSize: Math.min(CS * 0.28, (CS * 1.1) / digitOf(item).length) + 'px' } }, digitOf(item)),
          u.el('div', { class: 'lab', style: { fontSize: Math.max(15, CS * 0.2) + 'px' } }, item.word));
        board.appendChild(pyr);
        const isWish = wish && wish.id === item.id;
        const br = board.getBoundingClientRect(), rr = root.getBoundingClientRect();
        ctx.answer(item, true, { x: br.left - rr.left + x + CS / 2, y: br.top - rr.top + y, points: isWish ? 150 : 100 });
        if (isWish) { ctx.addScore(100); ctx.float(br.left - rr.left + x + CS / 2, br.top - rr.top + y + CS, '👑 Wish granted! +100', 'good'); wish = null; }
        ctx.say(item); EP.sfx.chest();
        const blk = blocks[cleared]; cleared++;
        ctx.hud.progress(cleared / N);
        ctx.timeout(() => {
          const b = blk && blk.getBoundingClientRect(), p = pyr.getBoundingClientRect();
          if (b) pyr.style.transform = `translate(${x + b.left - p.left + b.width / 2 - CS / 2}px,${y + b.top - p.top + b.height / 2 - CS / 2}px) scale(.18)`;
          pyr.style.opacity = '0.2';
        }, 650);
        ctx.timeout(() => { pyr.remove(); busyCells.delete(mg.r * 4 + mg.c); if (blk) blk.classList.add('on'); }, 1450);
        if (cleared >= N) return finish();
        if (!wish || isWish) ctx.timeout(() => { if (state === 'play' && (!wish || !boardInfo().has(wish.id))) setWish(); }, 1500);
      }
      async function stuck() {
        state = 'shuffle';
        const info = Array.from(boardInfo().values()), pair = info.find((x) => x.d && x.w && !mistakes.has(x.item.id)) || info.find((x) => x.d && x.w) || info[0];
        const item = pair.item; mistakes.add(item.id);
        const br = board.getBoundingClientRect(), rr = root.getBoundingClientRect();
        ctx.answer(item, false, { x: br.left - rr.left + br.width / 2, y: br.top - rr.top + 30, label: 'Board full! 擠滿了' });
        ctx.shake(board);
        await ctx.reveal(item);
        // gentle shuffle: everything gets new seats, and the missed pair sits side by side
        const tiles = []; eachTile((t) => tiles.push(t));
        grid = [0, 1, 2, 3].map(() => [null, null, null, null]);
        const others = tiles.filter((t) => t !== pair.d && t !== pair.w);
        if (pair.d && pair.w) { const r = u.randInt(0, 3), c = u.randInt(0, 2); const a = r * 4 + c, b = a + 1; const rest = u.shuffle([...Array(16).keys()].filter((s) => s !== a && s !== b)); [[pair.d, a], [pair.w, b]].forEach(([t, s]) => { t.r = (s / 4) | 0; t.c = s % 4; grid[t.r][t.c] = t; }); rest.slice(0, others.length).forEach((s, i) => { const t = others[i]; t.r = (s / 4) | 0; t.c = s % 4; grid[t.r][t.c] = t; }); }
        else u.shuffle([...Array(16).keys()]).slice(0, tiles.length).forEach((s, i) => { const t = tiles[i]; t.r = (s / 4) | 0; t.c = s % 4; grid[t.r][t.c] = t; });
        EP.sfx.whoosh(); eachTile((t) => { t.el.style.transition = 'transform .45s cubic-bezier(.3,1.4,.5,1)'; place(t); });
        ctx.timeout(() => eachTile((t) => (t.el.style.transition = '')), 500);
        await ctx.wait(500);
        state = 'play';
      }
      function finish() {
        state = 'done'; ctx.hud.progress(1); wishEl.innerHTML = '';
        wishEl.append(u.el('div', { class: 'txt' }, '🔺 Pyramid complete! 金字塔完成！'));
        ctx.timeout(() => { EP.sfx.win(); ctx.confetti(); root.appendChild(u.el('div', { class: 'pm-end' }, '🔺 Pharaoh is proud! 🔺', u.el('div', { class: 'zh', style: { fontSize: '.5em' } }, '法老超開心！'))); }, 900);
        ctx.timeout(() => ctx.end(), 3200);
      }

      /* ---------- input ---------- */
      ctx.on(window, 'keydown', (e) => {
        const m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' }[e.key];
        if (m) { e.preventDefault(); doMove(m); }
      });
      let st = null;
      ctx.on(wrap, 'pointerdown', (e) => { if (e.target.closest('button')) return; st = { x: e.clientX, y: e.clientY, t: e.target }; });
      ctx.on(wrap, 'pointerup', (e) => {
        if (!st) return; const dx = e.clientX - st.x, dy = e.clientY - st.y, tEl = st.t; st = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 28) doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
        else { const te = tEl.closest && tEl.closest('.pm-tile'); if (te && te._tile) { ctx.say(te._tile.item); te.classList.remove('wig'); void te.offsetWidth; te.classList.add('wig'); } }
      });

      // start: two pairs on the board
      layout();
      for (let i = 0; i < 2 && pending.length; i++) { const it = pending.shift(); for (const f of ['d', 'w']) { const [r, c] = u.pick(empties()); addTile(it, f, r, c); } }
      ctx.hud.progress(0); setWish();

      function bestDir() {
        let best = null, bestScore = -1;
        for (const d1 of DIRS) {
          const r1 = slide(grid, d1); if (!r1.moved) continue;
          let s = r1.merges.length ? 100 + r1.merges.length * 10 + (r1.merges.some((m) => wish && m.a.item.id === wish.id) ? 5 : 0) : 0;
          if (!s) for (const d2 of DIRS) { const r2 = slide(r1.out, d2); if (r2.merges.length) { s = Math.max(s, 50); break; } if (!s) for (const d3 of DIRS) if (slide(r2.out, d3).merges.length) { s = Math.max(s, 20); break; } }
          s += Math.random();
          if (s > bestScore) { bestScore = s; best = d1; }
        }
        return best;
      }
      return {
        destroy() { ro.disconnect(); },
        test: {
          correct() { if (state === 'play' && !busy) { const d = bestDir(); if (d) doMove(d); } },
          wrong() { if (state === 'play' && !busy) { const d = DIRS.find((x) => { const r = slide(grid, x); return r.moved && !r.merges.length; }); if (d) doMove(d); } },
        },
      };
    },
  });
})();
