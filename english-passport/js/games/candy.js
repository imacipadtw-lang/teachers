/* Level 17 — Piñata Crush (inspired by Candy Crush Saga: swap to match 3, cascades, striped candies, orders).
 * Each round word is an order: first tap the candy that matches the English word, then match it to fill the order. */
(function () {
  const EP = window.EP, u = EP.u;
  EP.registerGame({
    id: 'candy', level: 17, icon: '🪅', title: 'Piñata Crush', titleZh: '墨西哥糖果消消樂',
    model: 'Candy Crush Saga（系列累計營收超過 200 億美元）',
    howZh: '先聽英文、點出正確的糖果！再交換相鄰糖果，連成三個就能消除。收集訂單上的糖果，四連會變成條紋糖！',
    howEn: 'Tap the candy that matches the word, then swap candies to match 3 and fill the order!',
    skills: ['listening', 'reading', 'meaning'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit, D = ctx.difficulty, items = ctx.items, n = items.length;
      root.style.background = 'linear-gradient(165deg,#ff7aa8 0%,#ffa66b 55%,#ffd56b 100%)';
      const c = K.canvas(root), g = c.g, parts = K.particles();
      const N = 7, NT = D === 'hard' ? 6 : 5, GOAL = D === 'hard' ? 4 : 3;
      const COL = [['#ff6b8b', '#d6214d'], ['#ffb347', '#e8590c'], ['#ffe066', '#e6a700'], ['#63e6be', '#0ca678'], ['#74c0fc', '#1c7ed6'], ['#d0a6ff', '#7048e8']];
      const panel = u.el('div', { style: { position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', justifyContent: 'center', width: '98%' } });
      root.appendChild(panel);

      /* ---------- candy types (one per word) ---------- */
      const extras = u.shuffle(ctx.pool.filter((w) => !items.includes(w) && EP.pic(w)));
      const types = items.slice(0, NT).concat(extras).slice(0, NT).map((w, i) => ({ w, col: COL[i] }));
      const board = Array.from({ length: N }, () => Array(N).fill(null));
      const popping = []; let t = 0, phase = 'busy', order = null, oi = -1, lastSay = 0, shimmer = 0, pinata = { sw: 0, hit: 0 }, sel = null;
      const mk = (ti, r, cc, fromY) => ({ t: ti, sp: null, x: cc, y: fromY == null ? r : fromY, vy: 0, jump: 0, shake: 0 });
      for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) {
        let ti; do { ti = u.randInt(0, NT - 1); } while ((cc >= 2 && board[r][cc - 1].t === ti && board[r][cc - 2].t === ti) || (r >= 2 && board[r - 1][cc].t === ti && board[r - 2][cc].t === ti));
        board[r][cc] = mk(ti, r, cc, r - N - 1);
      }

      /* ---------- layout ---------- */
      let B = {};
      function layout() {
        const W = c.w, H = c.h, topH = Math.max(118, panel.getBoundingClientRect().height + 18);
        const bs = Math.floor(Math.min(W - 16, H - topH - 12, 680)), cs = bs / N, free = H - topH - 12 - bs;
        B = { W, H, bs, cs, x: Math.round((W - bs) / 2), y: Math.round(topH + Math.min(24, free * 0.15)) };
      }
      const center = (r, cc) => ({ x: B.x + (cc + 0.5) * B.cs, y: B.y + (r + 0.5) * B.cs });
      const at = (k) => board[(k / N) | 0][k % N];

      /* ---------- matching logic ---------- */
      const matchable = (cd) => cd && cd.sp !== 'b';
      function findRuns() {
        const runs = [];
        for (const dir of ['h', 'v']) for (let a = 0; a < N; a++) {
          let b = 0;
          while (b < N) {
            const cd = dir === 'h' ? board[a][b] : board[b][a]; let e = b + 1;
            if (matchable(cd)) while (e < N) { const o = dir === 'h' ? board[a][e] : board[e][a]; if (matchable(o) && o.t === cd.t) e++; else break; }
            if (matchable(cd) && e - b >= 3) { const cells = []; for (let i = b; i < e; i++) cells.push(dir === 'h' ? a * N + i : i * N + a); runs.push({ t: cd.t, dir, cells }); }
            b = e;
          }
        }
        return runs;
      }
      function swapCells(a, b) { const A = board[a[0]][a[1]]; board[a[0]][a[1]] = board[b[0]][b[1]]; board[b[0]][b[1]] = A; }
      /** a swap that makes a match (of type ti, or any type when ti is null) */
      function findMove(ti) {
        for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr, c2 = cc + dc; if (r2 >= N || c2 >= N) continue;
          const A = board[r][cc], Bc = board[r2][c2]; if (!A || !Bc) continue;
          if (A.sp === 'b' || Bc.sp === 'b') { if (ti == null || A.t === ti || Bc.t === ti) return [[r, cc], [r2, c2]]; continue; }
          if (A.t === Bc.t) continue;
          swapCells([r, cc], [r2, c2]); const ok = findRuns().some((run) => ti == null || run.t === ti); swapCells([r, cc], [r2, c2]);
          if (ok) return [[r, cc], [r2, c2]];
        }
        return null;
      }
      function findNoMove() {
        for (let k = 0; k < 200; k++) { const r = u.randInt(0, N - 1), cc = u.randInt(0, N - 2); const A = board[r][cc], Bc = board[r][cc + 1]; if (!A || !Bc || A.t === Bc.t || A.sp || Bc.sp) continue; swapCells([r, cc], [r, cc + 1]); const ok = findRuns().length === 0; swapCells([r, cc], [r, cc + 1]); if (ok) return [[r, cc], [r, cc + 1]]; }
        return null;
      }
      /** make sure the order candy can be matched: reshuffle or sprinkle a little candy magic */
      function ensureMove(ti) {
        if (findMove(ti)) return;
        for (let k = 0; k < 300; k++) {
          const r = u.randInt(0, N - 2), cc = u.randInt(0, N - 3), cells = [[r, cc], [r, cc + 1], [r + 1, cc + 2]];
          if (cells.some(([a, b]) => board[a][b].sp)) continue;
          const old = cells.map(([a, b]) => board[a][b].t); cells.forEach(([a, b]) => (board[a][b].t = ti));
          if (!findRuns().length && findMove(ti)) { cells.forEach(([a, b]) => { board[a][b].jump = 1; const p = center(a, b); parts.burst(p.x, p.y, '#fff', 6, 140); }); return; }
          cells.forEach(([a, b], i) => (board[a][b].t = old[i]));
        }
      }
      function reshuffleIfStuck() {
        if (findMove(null)) return;
        ctx.toast('🔀 Shuffle! 洗牌'); EP.sfx.whoosh();
        for (let k = 0; k < 100; k++) {
          const all = board.flat(); const ts = u.shuffle(all.map((cd) => cd.t)); all.forEach((cd, i) => (cd.t = ts[i]));
          if (!findRuns().length && findMove(null)) break;
        }
        shimmer = 1;
      }

      /* ---------- clearing, specials, gravity ---------- */
      function blast(keys, pivotKeep) {
        const seen = new Set(), q = Array.from(keys), byType = {};
        while (q.length) {
          const k = q.shift(); if (seen.has(k) || pivotKeep.has(k)) continue; const cd = at(k); if (!cd) continue; seen.add(k);
          const r = (k / N) | 0, cc = k % N;
          if (cd.sp === 'h' || cd.sp === 'v') { for (let i = 0; i < N; i++) q.push(cd.sp === 'h' ? r * N + i : i * N + cc); laser(r, cc, cd.sp); }
          if (cd.sp === 'b') { const ti = mostCommon(); board.flat().forEach((o, i) => { if (o && o.t === ti && o.sp !== 'b') q.push(i); }); }
        }
        seen.forEach((k) => {
          const r = (k / N) | 0, cc = k % N, cd = board[r][cc];
          popping.push({ cd, r, cc, p: 0 }); board[r][cc] = null; byType[cd.t] = (byType[cd.t] || 0) + 1;
          const p = center(r, cc); parts.burst(p.x, p.y, cd.sp === 'b' ? null : types[cd.t].col[0], 7, 220);
          if (order && order.found && cd.t === order.ti && cd.sp !== 'b') order.got++;
        });
        return byType;
      }
      function mostCommon() { const cnt = {}; board.flat().forEach((o) => { if (o && o.sp !== 'b') cnt[o.t] = (cnt[o.t] || 0) + 1; }); const pref = order && order.found ? order.ti : null; if (pref != null && cnt[pref]) return pref; return +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; }
      const lasers = [];
      function laser(r, cc, sp) { lasers.push({ r, cc, sp, t: 0 }); EP.sfx.slice(); }
      function gravity() {
        for (let cc = 0; cc < N; cc++) {
          let w = N - 1;
          for (let r = N - 1; r >= 0; r--) if (board[r][cc]) { const cd = board[r][cc]; board[r][cc] = null; board[w][cc] = cd; w--; }
          let k = 0;
          for (let r = w; r >= 0; r--) {
            let ti = u.randInt(0, NT - 1); if (order && order.found && Math.random() < 0.22) ti = order.ti;
            board[r][cc] = mk(ti, r, cc, -1 - k++);
          }
        }
      }
      const settled = () => board.every((row, r) => row.every((cd, cc) => !cd || (Math.abs(cd.y - r) < 0.02 && Math.abs(cd.x - cc) < 0.02)));
      async function settle() { for (let i = 0; i < 40 && !settled(); i++) await ctx.wait(40); }
      function speak(byType) {
        const now = performance.now(); if (now - lastSay < 900) return;
        const ks = Object.keys(byType).map(Number); if (!ks.length) return;
        const ti = order && ks.includes(order.ti) ? order.ti : ks[0]; lastSay = now; ctx.say(types[ti].w);
      }
      async function resolve(pivots, first) {
        let chain = 0, initial = first;
        for (;;) {
          const runs = initial ? [] : findRuns(); if (!runs.length && !initial) break;
          chain++; const clear = new Set(initial || []), specials = []; initial = null;
          for (const run of runs) {
            run.cells.forEach((k) => clear.add(k));
            if (run.cells.length >= 4) { const pv = run.cells.find((k) => pivots.includes(k)) || run.cells[run.cells.length >> 1]; if (!specials.some((s) => s.k === pv)) specials.push({ k: pv, t: run.t, sp: run.cells.length >= 5 ? 'b' : run.dir === 'h' ? 'v' : 'h' }); }
          }
          const keep = new Set(specials.filter((s) => !at(s.k) || !at(s.k).sp).map((s) => s.k));
          const byType = blast(clear, keep); speak(byType); ctx.addScore(Object.values(byType).reduce((x, y) => x + y, 0) * 10 * chain);
          specials.forEach((s) => { const r = (s.k / N) | 0, cc = s.k % N; const cd = board[r][cc] || (board[r][cc] = mk(s.t, r, cc)); cd.sp = s.sp; cd.jump = 1; EP.sfx.coin(); });
          if (specials.length) ctx.float(center((specials[0].k / N) | 0, specials[0].k % N).x, center((specials[0].k / N) | 0, specials[0].k % N).y, specials[0].sp === 'b' ? '🪅 Piñata!' : '✨ Striped!', 'good');
          EP.sfx.combo(chain); updatePanel();
          if (chain >= 2) ctx.burst(['Sweet! 甜！', 'Yummy! 好吃！', '¡Olé! 太棒！', '¡Fantástico!'][Math.min(chain - 2, 3)]);
          await ctx.wait(230); gravity(); await settle(); pivots = [];
        }
        return chain;
      }

      /* ---------- player actions ---------- */
      async function doSwap(a, b) {
        if (phase !== 'collect' || ctx.paused) return; phase = 'busy'; sel = null;
        const A = board[a[0]][a[1]], Bc = board[b[0]][b[1]]; swapCells(a, b); EP.sfx.pop(); await settle();
        if (A.sp === 'b' || Bc.sp === 'b') {
          const other = A.sp === 'b' ? Bc : A, bombK = (A.sp === 'b' ? b : a), ks = [bombK[0] * N + bombK[1]];
          board.flat().forEach((o, i) => { if (o && (other.sp === 'b' || (o.t === other.t && o.sp !== 'b'))) ks.push(i); });
          pinata.hit = 1; ctx.shake(); await resolve([], ks);
        } else if (!findRuns().length) { swapCells(a, b); EP.sfx.click(); await settle(); phase = 'collect'; return; }
        else await resolve([a[0] * N + a[1], b[0] * N + b[1]]);
        afterMoves();
      }
      function afterMoves() {
        if (order.got >= GOAL) return completeOrder();
        reshuffleIfStuck(); ensureMove(order.ti); phase = 'collect'; updatePanel();
      }
      function identify(r, cc) {
        const cd = board[r][cc]; if (phase !== 'identify' || !cd || cd.sp === 'b' || ctx.paused) return;
        phase = 'busy'; const p = center(r, cc);
        if (cd.t === order.ti) {
          ctx.answer(order.item, true, { x: p.x, y: p.y - 30 }); cd.jump = 1; parts.burst(p.x, p.y, null, 18, 260); ctx.say(order.item); toCollect();
        } else {
          ctx.answer(order.item, false, { x: p.x, y: p.y - 30, label: types[cd.t].w.word + ' ✗' }); cd.shake = 1; ctx.shake();
          ctx.timeout(async () => { await ctx.reveal(order.item); toCollect(); }, 450);
        }
      }
      function toCollect() { order.found = true; ensureMove(order.ti); phase = 'collect'; updatePanel(); }
      function completeOrder() {
        phase = 'busy'; pinata.hit = 1; EP.sfx.chest(); ctx.float(B.W / 2, B.y + 30, '✔ Order done! 完成訂單', 'good');
        ctx.addScore(50); for (let i = 0; i < 4; i++) parts.burst(u.rand(B.x, B.x + B.bs), u.rand(B.y, B.y + B.bs * 0.5), null, 14, 300);
        ctx.timeout(nextOrder, 900);
      }
      function nextOrder() {
        oi++; ctx.hud.progress(oi / n);
        if (oi >= n) { phase = 'done'; panel.innerHTML = ''; ctx.burst('🪅 ¡Fiesta! 派對時間！'); EP.sfx.win(); ctx.confetti(); pinata.hit = 2; ctx.timeout(() => ctx.end(), 2000); return; }
        const it = items[oi]; let ti = types.findIndex((tp) => tp.w === it);
        if (ti < 0) { // swap a finished word out for the new one; the whole board shimmers so nothing is given away
          const future = items.slice(oi); const cand = types.map((tp, i) => i).filter((i) => !future.includes(types[i].w));
          ti = cand.length ? u.pick(cand) : types.map((tp, i) => i).sort((a, b) => future.indexOf(types[b].w) - future.indexOf(types[a].w))[0];
          types[ti].w = it; shimmer = 1; EP.sfx.chest();
        }
        order = { item: it, ti, got: 0, found: false }; phase = 'identify'; updatePanel();
        ctx.timeout(() => ctx.say(it), 300);
      }

      /* ---------- order panel ---------- */
      function candyChip(tp, size) {
        const pic = EP.pic(tp.w);
        return u.el('span', { style: { width: size + 'px', height: size + 'px', borderRadius: '30%', background: `radial-gradient(circle at 35% 30%, ${tp.col[0]}, ${tp.col[1]})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: pic ? size * 0.6 + 'px' : size * 0.32 + 'px', fontWeight: 900, color: '#fff', boxShadow: '0 3px 0 rgba(0,0,0,.2)', flex: 'none' }, class: pic ? '' : 'zh' }, pic || tp.w.zh);
      }
      function updatePanel() {
        if (!order || phase === 'done') return; panel.innerHTML = '';
        const it = order.item, pic = EP.pic(it), tp = types[order.ti];
        const say = u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(it); } }, '🔊');
        const word = u.el('div', { style: { fontSize: 'clamp(1.6rem,6vw,2.3rem)', fontWeight: 900, lineHeight: 1, color: '#c2255c' } }, it.word);
        let body;
        if (!order.found) body = u.el('div', { style: { lineHeight: 1.15 } }, u.el('div', { style: { fontWeight: 800, fontSize: '1rem' } }, 'Tap the candy: 點出這個糖果'), word);
        else {
          const dots = u.el('div', { style: { display: 'flex', gap: '4px', marginTop: '4px' } }); for (let i = 0; i < GOAL; i++) dots.appendChild(u.el('span', { style: { width: '18px', height: '18px', borderRadius: '50%', background: i < order.got ? '#2fb463' : '#dee2e6', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.15)' } }));
          body = u.el('div', { style: { lineHeight: 1.15 } }, u.el('div', { style: { fontWeight: 800, fontSize: '1rem' } }, `Collect ${GOAL} 收集 ${Math.min(order.got, GOAL)}/${GOAL}`), u.el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, candyChip(tp, 40), word), dots);
        }
        panel.appendChild(u.el('div', { class: 'prompt-card', style: { padding: '8px 16px' } }, say, D === 'easy' && pic && !order.found ? u.el('div', { class: 'pic', style: { fontSize: '2.6rem' } }, pic) : null, body));
        if (c.w) layout();
      }

      /* ---------- input: tap / tap-tap / swipe ---------- */
      const cellAt = (e) => { const rc = c.cv.getBoundingClientRect(), x = e.clientX - rc.left - B.x, y = e.clientY - rc.top - B.y; const cc = Math.floor(x / B.cs), r = Math.floor(y / B.cs); return r >= 0 && r < N && cc >= 0 && cc < N ? { r, cc, x: e.clientX, y: e.clientY } : null; };
      let down = null;
      ctx.on(c.cv, 'pointerdown', (e) => { down = cellAt(e); });
      ctx.on(c.cv, 'pointermove', (e) => {
        if (!down || phase !== 'collect') return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < B.cs * 0.4) return;
        const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0]; const r2 = down.r + dr, c2 = down.cc + dc; const a = [down.r, down.cc]; down = null;
        if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N) doSwap(a, [r2, c2]);
      });
      ctx.on(c.cv, 'pointerup', (e) => {
        if (!down) return; const cl = down; down = null;
        if (phase === 'identify') return identify(cl.r, cl.cc);
        if (phase !== 'collect') return;
        if (sel && Math.abs(sel.r - cl.r) + Math.abs(sel.cc - cl.cc) === 1) doSwap([sel.r, sel.cc], [cl.r, cl.cc]);
        else { sel = sel && sel.r === cl.r && sel.cc === cl.cc ? null : cl; EP.sfx.click(); }
      });

      /* ---------- drawing ---------- */
      function drawCandy(cd, x, y, s, o) {
        o = o || {}; const tp = types[cd.t];
        g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(o.scale || 1, o.scale || 1); g.globalAlpha = o.alpha == null ? 1 : o.alpha;
        const r = s * 0.44;
        if (cd.sp === 'b') { K.emoji(g, '🪅', 0, 0, s * 0.8); g.restore(); return; }
        g.fillStyle = 'rgba(0,0,0,.18)'; K.roundRect(g, -r, -r + s * 0.05, r * 2, r * 2, r * 0.55); g.fill();
        const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.3); gr.addColorStop(0, tp.col[0]); gr.addColorStop(1, tp.col[1]);
        g.fillStyle = gr; K.roundRect(g, -r, -r, r * 2, r * 2, r * 0.55); g.fill();
        if (cd.sp) { g.save(); K.roundRect(g, -r, -r, r * 2, r * 2, r * 0.55); g.clip(); g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = -3; i <= 3; i++) cd.sp === 'h' ? g.fillRect(-r, i * r * 0.3 - r * 0.06, r * 2, r * 0.12) : g.fillRect(i * r * 0.3 - r * 0.06, -r, r * 0.12, r * 2); g.restore(); }
        g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(0, 0, r * 0.72, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-r * 0.45, -r * 0.62, r * 0.28, r * 0.13, -0.5, 0, 7); g.fill();
        const pic = EP.pic(tp.w);
        if (pic) K.emoji(g, pic, 0, s * 0.02, s * 0.5);
        else { const fs = K.fitSize(g, tp.w.zh, r * 1.36, s * 0.34, 10); K.text(g, tp.w.zh, 0, s * 0.02, fs, tp.col[1], { font: "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif" }); }
        g.restore();
      }
      function backdrop() {
        const { W } = B; const cols = ['#e64980', '#fab005', '#12b886', '#4c6ef5', '#fd7e14', '#be4bdb'];
        for (let row = 0; row < 2; row++) {
          const y0 = 6 + row * 40, fw = 34, cnt = Math.ceil(W / (fw + 6)) + 1;
          g.strokeStyle = 'rgba(80,40,20,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(W / 2, y0 + 14, W, y0); g.stroke();
          for (let i = 0; i < cnt; i++) {
            const x = i * (fw + 6) + (row ? 18 : 0), sag = 14 * (1 - Math.pow((x - W / 2) / (W / 2), 2)) * 0.5, sw = Math.sin(t * 2 + i) * 2;
            g.save(); g.translate(x, y0 + sag); g.rotate(sw * 0.02); g.fillStyle = cols[(i + row * 3) % cols.length]; g.globalAlpha = 0.8;
            g.beginPath(); g.moveTo(0, 0); g.lineTo(fw, 0); g.lineTo(fw, 26); for (let z = 4; z >= 0; z--) g.lineTo(z * fw / 4, 26 + (z % 2 ? 6 : 0)); g.closePath(); g.fill();
            g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(fw / 2, 12, 4, 0, 7); g.fill(); g.restore();
          }
        }
        if (B.x > 120) { // swinging piñata + cactus on wide screens
          pinata.sw += 0.016; const px = B.x / 2, py = B.y + 40, ang = Math.sin(pinata.sw * 2) * 0.25 + (pinata.hit ? Math.sin(t * 30) * 0.3 * pinata.hit : 0);
          g.strokeStyle = '#7a4a1f'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, 0); g.lineTo(px + Math.sin(ang) * (py - 10), py - 10); g.stroke();
          g.save(); g.translate(px + Math.sin(ang) * py, py + 50); g.rotate(-ang); K.emoji(g, '🪅', 0, 0, Math.min(140, B.x * 0.7)); g.restore();
          K.emoji(g, '🌵', B.x + B.bs + (B.W - B.x - B.bs) / 2, B.y + B.bs - 60, Math.min(120, B.x * 0.6));
          K.emoji(g, '🎸', B.x + B.bs + (B.W - B.x - B.bs) / 2, B.y + 120, Math.min(90, B.x * 0.45));
        } else if (B.H - B.y - B.bs > 110) { // tall phones: a little fiesta under the board
          const fy = B.y + B.bs + (B.H - B.y - B.bs) / 2, fs = Math.min(84, (B.H - B.y - B.bs) * 0.55);
          ['🌵', '🪅', '🎸', '🌮', '🌵'].forEach((e, i) => K.emoji(g, e, B.W * (i + 0.5) / 5, fy + Math.sin(t * 3 + i) * 6 - (i === 1 && pinata.hit ? Math.sin(t * 40) * 10 : 0), i === 1 ? fs * 1.2 : fs * 0.8));
        }
      }
      ctx.loop((dt) => {
        t += dt; if (c.w !== B.W || c.h !== B.H) layout();
        shimmer = Math.max(0, shimmer - dt * 1.2); pinata.hit = Math.max(0, pinata.hit - dt * 1.5); parts.update(dt);
        g.clearRect(0, 0, B.W, B.H); backdrop();
        g.fillStyle = 'rgba(255,255,255,.28)'; K.roundRect(g, B.x - 8, B.y - 8, B.bs + 16, B.bs + 16, 22); g.fill();
        for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) { g.fillStyle = (r + cc) % 2 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.38)'; g.fillRect(B.x + cc * B.cs, B.y + r * B.cs, B.cs, B.cs); }
        g.save(); g.beginPath(); g.rect(B.x - 8, B.y, B.bs + 16, B.bs + 8); g.clip();
        for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) {
          const cd = board[r][cc]; if (!cd) continue;
          cd.x += (cc - cd.x) * Math.min(1, dt * 16); if (Math.abs(cd.x - cc) < 0.01) cd.x = cc;
          if (cd.y < r) { cd.vy += 38 * dt; cd.y = Math.min(r, cd.y + cd.vy * dt); if (cd.y >= r) { cd.vy = 0; cd.jump = Math.max(cd.jump, 0.35); } } else if (cd.y > r) cd.y = Math.max(r, cd.y - dt * 12);
          cd.jump = Math.max(0, cd.jump - dt * 2.5); cd.shake = Math.max(0, cd.shake - dt * 1.5);
          const glow = order && order.found && phase !== 'identify' && cd.t === order.ti && cd.sp !== 'b';
          const px = B.x + (cd.x + 0.5) * B.cs + Math.sin(t * 50) * 6 * cd.shake, py = B.y + (cd.y + 0.5) * B.cs - Math.sin(cd.jump * Math.PI) * B.cs * 0.18;
          if (glow) { g.strokeStyle = `rgba(255,255,255,${0.55 + 0.4 * Math.sin(t * 6)})`; g.lineWidth = 4; g.beginPath(); g.arc(px, py, B.cs * 0.47, 0, 7); g.stroke(); }
          if (sel && sel.r === r && sel.cc === cc) { g.strokeStyle = '#fff'; g.lineWidth = 5; K.roundRect(g, px - B.cs * 0.48, py - B.cs * 0.48, B.cs * 0.96, B.cs * 0.96, 14); g.stroke(); }
          const sh = shimmer > 0 ? 1 + Math.sin(t * 20 + r + cc) * 0.08 * shimmer : 1;
          drawCandy(cd, px, py, B.cs, { scale: (1 + Math.sin(cd.jump * Math.PI) * 0.12) * sh, rot: cd.sp === 'b' ? Math.sin(t * 4) * 0.2 : 0 });
        }
        g.restore();
        for (let i = popping.length - 1; i >= 0; i--) { const pp = popping[i]; pp.p += dt * 4; if (pp.p >= 1) { popping.splice(i, 1); continue; } const p = center(pp.r, pp.cc); drawCandy(pp.cd, p.x, p.y, B.cs, { scale: 1 + pp.p * 0.5, alpha: 1 - pp.p }); }
        for (let i = lasers.length - 1; i >= 0; i--) { const L = lasers[i]; L.t += dt * 2.5; if (L.t >= 1) { lasers.splice(i, 1); continue; } g.fillStyle = `rgba(255,255,255,${1 - L.t})`; const p = center(L.r, L.cc), w = B.cs * 0.35 * (1 - L.t); if (L.sp === 'h') g.fillRect(B.x, p.y - w / 2, B.bs, w); else g.fillRect(p.x - w / 2, B.y, w, B.bs); }
        if (shimmer > 0) { g.fillStyle = `rgba(255,255,255,${shimmer * 0.25})`; g.fillRect(B.x, B.y, B.bs, B.bs); }
        parts.draw(g);
      });

      layout();
      ctx.timeout(() => { nextOrder(); layout(); }, 700);
      return {
        destroy() { c.destroy(); },
        test: {
          correct() {
            if (phase === 'identify') { for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) if (board[r][cc] && board[r][cc].t === order.ti && board[r][cc].sp !== 'b') return identify(r, cc); }
            else if (phase === 'collect') { ensureMove(order.ti); const m = findMove(order.ti); if (m) doSwap(m[0], m[1]); }
          },
          wrong() {
            if (phase === 'identify') { for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) if (board[r][cc] && board[r][cc].t !== order.ti && board[r][cc].sp !== 'b') return identify(r, cc); }
            else if (phase === 'collect') { const m = findNoMove(); if (m) doSwap(m[0], m[1]); }
          },
        },
      };
    },
  });
})();
