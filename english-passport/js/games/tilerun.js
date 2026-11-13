/* Level 15 — Glacier Tile Run (inspired by Fall Guys / Stumble Guys: hop across tile rows, fake tiles crack and fall,
 * checkpoints, wobbly bean racers and a crown at the finish). Listen / look, then tap the safe word tile to hop on it. */
(function () {
  const EP = window.EP, u = EP.u;
  EP.registerGame({
    id: 'tilerun', level: 15, icon: '⛸️', title: 'Glacier Tile Run', titleZh: '冰河跳格大賽',
    model: 'Fall Guys / Stumble Guys（派對闖關遊戲；Stumble Guys 下載超過 7 億次）',
    howZh: '看圖、聽發音，點正確的英文冰磚跳過去！踩錯的冰磚會裂開，你會掉回檢查點。最先跑到終點就能搶到皇冠👑！',
    howEn: 'Look and listen, then tap the safe word tile to hop. Wrong tiles crack! Race the bots to the crown.',
    skills: ['listening', 'meaning', 'reading'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit, D = ctx.difficulty, items = ctx.items, n = items.length;
      root.style.background = '#0b4f7c';
      const c = K.canvas(root), g = c.g, parts = K.particles();
      const top = u.el('div', { style: { position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', justifyContent: 'center', width: '96%' } });
      root.appendChild(top);

      const nOpt = D === 'hard' ? 4 : 3;
      const rows = items.map((it) => ({ item: it, solved: false, tries: 0,
        tiles: u.shuffle([it].concat(ctx.distractors(it, nOpt - 1, {}))).map((w) => ({ w, st: 'ok', ft: 0, glow: 0 })),
        side: [{ st: 'ok', ft: 0 }, { st: 'ok', ft: 0 }] }));
      const ci = (r) => r.tiles.findIndex((t) => t.w === r.item);
      const tileX = (r, i) => -0.5 + (i + 0.5) / r.tiles.length;

      /* ---------- layout & perspective ---------- */
      let L = {};
      function layout() {
        const W = c.w, H = c.h, side = u.clamp(W * 0.07, 22, 96), gap = Math.max(5, side * 0.1);
        let main = Math.min(760, W * 0.97 - 2 * (side + gap));
        const fit = (W / 2 - side * 1.25 - 1.5 * gap) / 0.75; if (fit >= 480) main = Math.min(main, fit); // wide screens: bot lanes stay visible
        L = { W, H, cx: W / 2, hy: H * 0.25, yc: H * 0.6, main, side, gap, k: 2, gF: gap / main, sF: side / main, bean: Math.min(main * 0.075, H * 0.055) };
      }
      const sc = (d) => (L.k + 1) / (L.k + d);
      const Y = (d) => L.hy + (L.yc - L.hy) * sc(d);
      const SX = (X, d) => L.cx + (X - camX) * L.main * sc(d);
      let cam = -1, camX = 0;
      function quad(d, x0, x1, ext) {
        const dt = d + ext, db = d - ext, yt = Y(dt), yb = Y(db);
        return [[SX(x0, dt), yt], [SX(x1, dt), yt], [SX(x1, db), yb], [SX(x0, db), yb]];
      }
      function path(q) { g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); }
      function inQuad(q, x, y) {
        if (y < q[0][1] || y > q[3][1]) return false;
        const f = (y - q[0][1]) / (q[3][1] - q[0][1]);
        return x >= q[0][0] + (q[3][0] - q[0][0]) * f && x <= q[1][0] + (q[2][0] - q[1][0]) * f;
      }
      const tileQuad = (r, i, d) => { const m = r.tiles.length, x0 = -0.5 + i / m + 0.012, x1 = -0.5 + (i + 1) / m - 0.012; return quad(d, x0, x1, 0.34); };

      /* ---------- sound: crowd cheer (filtered noise + whistles) ---------- */
      function cheer(big) {
        const a = EP.sfx.unlock && EP.sfx.unlock(); if (!a || !EP.settings.sfx) return;
        try {
          const dur = big ? 2 : 0.9, len = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < len; i++) { const p = i / len; d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.min(1, p * 1.6)) * (1 - p) * (0.7 + 0.3 * Math.sin(i / 900)); }
          const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.7;
          const gn = a.createGain(); gn.gain.value = big ? 0.5 : 0.28; s.connect(f).connect(gn).connect(a.destination); s.start();
          if (big) [0, 0.35].forEach((w) => { const o = a.createOscillator(), og = a.createGain(), t = a.currentTime + w; o.type = 'sine'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(2600, t + 0.25); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.05, t + 0.03); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(og).connect(a.destination); o.start(t); o.stop(t + 0.32); });
        } catch (e) { /* audio is optional */ }
      }

      /* ---------- the bean racers ---------- */
      const bean = { row: -1, x: 0, z: 0, hop: null, landT: 9, fall: null, hidden: false, col: '#ff6fb5', crown: false };
      const bots = [{ name: 'Pip', col: '#4dabf7', lane: -1, dx: 0, hat: ['#fab005', '#fff4cc'] }, { name: 'Momo', col: '#69db7c', lane: 1, dx: -0.22, hat: ['#7048e8', '#e5dbff'] }, { name: 'Kiki', col: '#ffa94d', lane: 1, dx: 0.22, hat: ['#1c7ed6', '#d0ebff'] }]
        .map((b, i) => Object.assign(b, { row: -1, z: 0, hop: null, landT: 9, fall: null, wait: 1.2 + i * 0.5, done: false }));
      let cur = 0, state = 'busy', mistakes = 0, t = 0, idleT = 0, crowdT = 0, crownT = -1, finishers = 0, place = 1, lastRank = '';
      const flakes = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: u.rand(1.5, 3.5), v: u.rand(0.03, 0.08) }));
      const trees = []; for (let k = -3; k <= n + 4; k++) for (const sgn of [-1, 1]) trees.push({ k: k + Math.random() * 0.6, sgn, o: u.rand(0.08, 0.5), s: u.rand(0.8, 1.25) });
      const crowd = Array.from({ length: 70 }, (_, i) => ({ x: i / 70 + Math.random() * 0.01, c: u.pick(['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#f783ac', '#b197fc', '#fff']), ph: Math.random() * 6, r: u.rand(0.8, 1.2) }));

      function hop(e, toRow, toX, dur, then) { e.hop = { fr: e.row, fx: e.x, tr: toRow, tx: toX, t: 0, dur, then }; EP.sfx.jump(); }
      const hopP = (row, x, dur) => new Promise((res) => hop(bean, row, x, dur, res));
      function stepHop(e, dt) {
        if (!e.hop) return; const h = e.hop; h.t += dt / h.dur; const p = Math.min(1, h.t);
        e.row = h.fr + (h.tr - h.fr) * p; e.x = h.fx + (h.tx - h.fx) * p; e.z = Math.sin(Math.PI * p) * (0.55 + 0.25 * Math.abs(h.tr - h.fr));
        if (p >= 1) { e.row = h.tr; e.x = h.tx; e.z = 0; e.hop = null; e.landT = 0; h.then && h.then(); }
      }

      /* ---------- game flow ---------- */
      function showPrompt(it) {
        top.innerHTML = '';
        const pic = EP.pic(it), hard = D === 'hard';
        top.appendChild(u.el('div', { class: 'prompt-card', style: { padding: '8px 16px' } },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(it); } }, '🔊'),
          hard ? null : pic ? u.el('div', { class: 'pic' }, pic) : u.el('div', { class: 'zh', style: { fontSize: '2rem', fontWeight: 900 } }, it.zh),
          !hard && pic && D === 'easy' ? u.el('div', { class: 'zh', style: { fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink2)' } }, it.zh) : null,
          u.el('div', { style: { fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 } }, hard ? 'Listen! Which tile?' : 'Which tile is safe?',
            u.el('div', { class: 'zh', style: { fontSize: '.9rem', color: 'var(--ink2)' } }, hard ? '仔細聽，跳到正確的冰磚' : '跳到正確的冰磚！'))));
      }
      function nextRow() {
        if (cur >= n) return finishRun();
        ctx.hud.progress(cur / n);
        const r = rows[cur]; showPrompt(r.item); state = 'choose'; idleT = 0;
        ctx.timeout(() => ctx.say(r.item), 200);
      }
      function pick(i) {
        if (state !== 'choose' || ctx.paused) return;
        const r = rows[cur], tl = r.tiles[i]; if (!tl || tl.st !== 'ok') return;
        state = 'busy'; const tx = tileX(r, i), d = cur - cam, sx = SX(tx, d), sy = Y(d) - 50;
        if (tl.w === r.item) {
          ctx.answer(r.item, true, { x: sx, y: sy });
          hop(bean, cur, tx, 0.42, () => {
            tl.st = 'safe'; r.solved = true; crowdT = 1.4; cheer(false); EP.sfx.pop();
            parts.burst(SX(tx, 0), Y(0), '#e7f8ff', 16, 200); parts.burst(SX(tx, 0), Y(0), null, 10, 260);
            if ((cur + 1) % 3 === 0 && cur < n - 1) { ctx.float(SX(tx, 0), Y(0) - 90, '🚩 Checkpoint!', 'good'); EP.sfx.coin(); }
            cur++; nextRow();
          });
        } else {
          r.tries++; mistakes++;
          ctx.answer(r.item, false, { x: sx, y: sy, label: tl.w.word + ' ✗' });
          hop(bean, cur, tx, 0.42, () => {
            tl.st = 'crack'; EP.sfx.slice(); ctx.shake();
            ctx.timeout(() => { tl.st = 'fall'; bean.fall = 0; bean.splashed = false; EP.sfx.whoosh(); }, 380);
          });
        }
      }
      async function afterFall() {
        bean.fall = null; bean.hidden = true;
        const r = rows[cur];
        await ctx.reveal(r.item);
        let cp = -1; for (let k = cur - 1; k >= 0; k--) if ((k + 1) % 3 === 0) { cp = k; break; }
        bean.row = cp; bean.x = cp < 0 ? 0 : tileX(rows[cp], ci(rows[cp])); bean.hidden = false; bean.landT = 0; cam = cp - 0.6;
        parts.burst(SX(bean.x, cp - cam), Y(cp - cam) - 20, '#ffffff', 20, 220); EP.sfx.pop();
        await ctx.wait(350);
        for (let k = cp + 1; k < cur; k++) await hopP(k, tileX(rows[k], ci(rows[k])), 0.3);
        if (r.tries >= 2) { // two misses: the safe tile glows and the bean hops over it — move on
          const i = ci(r); r.tiles[i].glow = 1; ctx.say(r.item); await ctx.wait(700);
          await hopP(cur, tileX(r, i), 0.42); r.tiles[i].st = 'safe'; r.solved = true; cur++; return nextRow();
        }
        state = 'choose'; idleT = 0; ctx.say(r.item);
      }
      function finishRun() {
        state = 'done'; top.innerHTML = ''; ctx.hud.progress(1);
        hop(bean, n, 0, 0.55, () => {
          place = 1 + finishers;
          crownT = 0; bean.crown = place === 1; crowdT = 3;
          ctx.burst(place === 1 ? '👑 CROWN! 你贏得皇冠！' : `🎉 Qualified! #${place}`);
          EP.sfx.win(); cheer(true); ctx.confetti();
          parts.burst(SX(0, n - cam), Y(n - cam) - 60, '#ffd43b', 40, 360);
          ctx.timeout(() => ctx.end(), 2800);
        });
      }

      /* ---------- bots ---------- */
      function botStep(b, dt) {
        stepHop(b, dt); b.landT += dt;
        if (b.hop || b.done) return;
        if (b.fall != null) {
          b.fall += dt;
          if (b.fall > 0.45 && !b.splashed) { b.splashed = true; const d = b.row - cam; parts.burst(SX(laneX(b), d), Y(d), '#bfe9ff', 14, 180); }
          if (b.fall > 1.3) { const st = rows[b.row] && rows[b.row].side[b.lane < 0 ? 0 : 1]; if (st) { st.st = 'ok'; st.ft = 0; } b.fall = null; b.row = Math.max(-1, b.row - u.randInt(1, 2)); b.landT = 0; b.wait = 0.8; }
          return;
        }
        b.wait -= dt; if (b.wait > 0 || state === 'busy' && cur === 0 && bean.row < 0 && t < 1) return;
        const me = bean.row, lead = b.row + 1 - me, maxLead = Math.min(2.6, 1.2 + mistakes * 0.5), to = b.row + 1;
        b.wait = u.rand(1.6, 2.8) * (lead > 1 ? 1.5 : lead < -2 ? 0.55 : 1);
        if (state !== 'done' && (lead > maxLead || (to >= n && mistakes < 2))) return;
        hop(b, to, 0, 0.42, () => {
          if (to >= n) { b.done = true; if (state !== 'done' || bean.row < n) finishers++; return; }
          if (Math.random() < 0.1) { b.fall = 0; b.splashed = false; const st = rows[to].side[b.lane < 0 ? 0 : 1]; st.st = 'fall'; st.ft = 0; }
        });
      }
      const laneX = (b) => (b.lane < 0 ? -0.5 - L.gF - L.sF / 2 : 0.5 + L.gF + L.sF / 2) + b.dx * L.sF;

      /* ---------- drawing ---------- */
      function ell(x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7); g.fill(); }
      /* original winter bean: face drawn on the body, knitted beanie with pom-pom, short striped scarf */
      function drawBean(x, y, w, col, o) {
        o = o || {}; const h = w * 1.4, sq = o.sq || 0, hat = o.hat || ['#e03131', '#ffffff'];
        g.save(); g.translate(x, y); g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
        ell(0, 0, w * 0.6, w * 0.16, 'rgba(0,30,60,.25)');
        g.translate(0, -(o.z || 0)); g.rotate(o.rot || 0); g.scale(1 + sq, 1 - sq);
        ell(-w * 0.2, -w * 0.04, w * 0.17, w * 0.1, '#2b2d42'); ell(w * 0.2, -w * 0.04, w * 0.17, w * 0.1, '#2b2d42');
        const arm = Math.sin(t * 8 + x) * w * 0.06 + (o.z ? -w * 0.25 : 0);
        ell(-w * 0.52, -w * 0.5 + arm, w * 0.13, w * 0.17, col); ell(w * 0.52, -w * 0.5 + arm, w * 0.13, w * 0.17, col);
        const top = -h - w * 0.06; K.roundRect(g, -w / 2, top, w, h, w / 2); g.fillStyle = col; g.fill();
        g.lineWidth = Math.max(1.5, w * 0.05); g.strokeStyle = 'rgba(0,0,0,.28)'; g.stroke();
        ell(-w * 0.24, -w * 0.62, w * 0.07, w * 0.22, 'rgba(255,255,255,.3)');
        // face right on the body
        const blink = (Math.sin(t * 1.7 + x * 3) > 0.985) ? 0.15 : 1, ey = -w * 0.74, big = o.scared ? 1.35 : 1;
        for (const ex of [-0.15, 0.15]) { ell(ex * w, ey, w * 0.065 * big, w * 0.09 * blink * big, '#1d2340'); if (blink === 1) ell(ex * w + w * 0.02, ey - w * 0.035, w * 0.022, w * 0.026, '#fff'); }
        ell(-w * 0.29, ey + w * 0.09, w * 0.07, w * 0.045, 'rgba(255,90,130,.45)'); ell(w * 0.29, ey + w * 0.09, w * 0.07, w * 0.045, 'rgba(255,90,130,.45)');
        g.strokeStyle = '#1d2340'; g.lineWidth = Math.max(1.5, w * 0.045); g.lineCap = 'round'; g.beginPath();
        if (o.scared) g.ellipse(0, ey + w * 0.16, w * 0.05, w * 0.06, 0, 0, 7); else g.arc(0, ey + w * 0.06, w * 0.1, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();
        // short striped scarf with a flapping tail
        const sy = -w * 0.44, flap = Math.sin(t * 6 + x) * 0.15;
        g.save(); g.translate(w * 0.2, sy); g.rotate(0.15 + flap); K.roundRect(g, -w * 0.07, 0, w * 0.15, w * 0.36, w * 0.05); g.fillStyle = hat[0]; g.fill();
        g.fillStyle = hat[1]; g.fillRect(-w * 0.07, w * 0.12, w * 0.15, w * 0.05); g.fillRect(-w * 0.07, w * 0.24, w * 0.15, w * 0.05); g.restore();
        K.roundRect(g, -w * 0.53, sy - w * 0.08, w * 1.06, w * 0.17, w * 0.08); g.fillStyle = hat[0]; g.fill();
        g.fillStyle = hat[1]; for (const sx of [-0.3, 0, 0.3]) g.fillRect(sx * w - w * 0.03, sy - w * 0.08, w * 0.06, w * 0.17);
        // knitted beanie + pom-pom
        const cy = top + w * 0.5; g.fillStyle = hat[0]; g.beginPath(); g.arc(0, cy, w * 0.54, Math.PI, 0); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = Math.max(1, w * 0.025); g.beginPath();
        for (const kx of [-0.3, -0.1, 0.1, 0.3]) { g.moveTo(kx * w, cy - w * 0.05); g.quadraticCurveTo(kx * w * 0.8, cy - w * 0.3, kx * w * 0.4, cy - w * 0.48); } g.stroke();
        K.roundRect(g, -w * 0.57, cy - w * 0.1, w * 1.14, w * 0.19, w * 0.08); g.fillStyle = hat[1]; g.fill();
        g.strokeStyle = 'rgba(0,0,0,.12)'; g.beginPath(); for (let kx = -0.5; kx <= 0.5; kx += 0.1) { g.moveTo(kx * w, cy - w * 0.08); g.lineTo(kx * w, cy + w * 0.07); } g.stroke();
        ell(0, cy - w * 0.56, w * 0.14, w * 0.14, hat[1]); ell(-w * 0.04, cy - w * 0.6, w * 0.05, w * 0.05, 'rgba(255,255,255,.8)');
        if (o.crown) K.emoji(g, '👑', 0, cy - w * 0.85, w * 0.7);
        g.restore();
        if (o.tag && o.tagSide) { // "YOU" pill beside the head: never on top of a word tile
          const fs = Math.max(12, w * 0.26), tx = x + w * 0.66, ty = y - (o.z || 0) - h * 0.8; g.font = `900 ${fs}px 'Baloo 2',sans-serif`;
          const tw = g.measureText(o.tag).width + fs * 0.8; K.roundRect(g, tx, ty - fs * 0.7, tw, fs * 1.4, fs * 0.7); g.fillStyle = '#ff6fb5'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
          K.text(g, o.tag, tx + tw / 2, ty, fs, '#fff', { align: 'center' });
        } else if (o.tag) K.text(g, o.tag, x, y + w * 0.32, Math.max(12, w * 0.3), '#fff', { stroke: '#1d2340', strokeW: 4 });
      }
      function iceTile(q, col, alpha) {
        g.globalAlpha = alpha; const thick = (q[3][1] - q[0][1]) * 0.14;
        g.fillStyle = 'rgba(10,60,100,.55)'; g.beginPath(); g.moveTo(q[3][0], q[3][1]); g.lineTo(q[2][0], q[2][1]); g.lineTo(q[2][0], q[2][1] + thick); g.lineTo(q[3][0], q[3][1] + thick); g.closePath(); g.fill();
        path(q); const gr = g.createLinearGradient(0, q[0][1], 0, q[3][1]); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); g.fillStyle = gr; g.fill();
        g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke(); g.globalAlpha = 1;
      }
      function drawRow(k, d, fog) {
        if (k < 0 || k >= n) { // start / finish platforms span all lanes
          const X = 0.5 + L.gF + L.sF + 0.02, q = quad(d, -X, X, 0.42);
          iceTile(q, k < 0 ? ['#ffffff', '#d7eefa'] : ['#fff3bf', '#ffd43b'], fog);
          const ccx = SX(0, d);
          if (k >= n) { // checkered line + arch + crown
            g.globalAlpha = fog; const cy = q[0][1] + (q[3][1] - q[0][1]) * 0.2, w0 = (q[1][0] - q[0][0]), sq = w0 / 24;
            for (let i = 0; i < 24; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#1d2340' : '#fff'; g.fillRect(q[0][0] + i * sq, cy + j * sq * 0.5, sq, sq * 0.5); }
            const s = sc(d), ax = L.main * 0.62 * s, ah = L.main * 0.32 * s, by = Y(d + 0.42);
            g.lineWidth = Math.max(6, 16 * s); g.strokeStyle = '#ff6b6b'; g.beginPath(); g.moveTo(ccx - ax, by); g.lineTo(ccx - ax, by - ah); g.lineTo(ccx + ax, by - ah); g.lineTo(ccx + ax, by); g.stroke();
            K.roundRect(g, ccx - ax * 0.6, by - ah - 22 * s, ax * 1.2, 44 * s, 12 * s); g.fillStyle = '#ffd43b'; g.fill();
            K.text(g, 'FINISH 終點', ccx, by - ah, Math.max(12, 28 * s), '#7a3b00');
            if (!bean.crown) K.emoji(g, '👑', ccx, by - ah * 0.55 + Math.sin(t * 3) * 8 * s, Math.max(26, 70 * s));
            g.globalAlpha = 1;
          } else { g.globalAlpha = fog; K.text(g, 'START', ccx, Y(d), Math.max(12, 30 * sc(d)), '#7fb7d6'); g.globalAlpha = 1; }
          return;
        }
        const r = rows[k], s = sc(d);
        // side lanes
        r.side.forEach((st, j) => {
          if (st.st === 'fall' && st.ft > 1) return;
          const x0 = j ? 0.5 + L.gF : -0.5 - L.gF - L.sF, q = quad(d + (st.st === 'fall' ? -st.ft * 0.3 : 0), x0, x0 + L.sF, 0.34);
          if (st.st === 'fall') { g.save(); g.translate(0, st.ft * st.ft * 160 * s); iceTile(q, ['#d0ecfa', '#9fd2ee'], fog * (1 - st.ft)); g.restore(); }
          else iceTile(q, ['#d0ecfa', '#9fd2ee'], fog);
        });
        // main tiles with words
        r.tiles.forEach((tl, i) => {
          if (tl.st === 'fall' && tl.ft > 1) return;
          const q = tileQuad(r, i, d), cur0 = k === cur && state === 'choose';
          g.save();
          if (tl.st === 'fall') { g.translate(0, tl.ft * tl.ft * 260 * s); g.globalAlpha = 1 - tl.ft; }
          const glow = tl.glow || (cur0 && D === 'easy' && idleT > 6 && i === ci(r) ? 0.5 + 0.5 * Math.sin(t * 6) : 0);
          const col = tl.st === 'safe' ? ['#d3f9d8', '#8ce99a'] : glow ? ['#fff9db', '#ffe066'] : cur0 ? ['#f3fbff', '#b9e4fa'] : ['#e4f5fd', '#a6d8f0'];
          iceTile(q, col, fog * (tl.st === 'fall' ? 1 - tl.ft : 1));
          if (cur0) { path(q); g.lineWidth = 3 + Math.sin(t * 5) * 1.5; g.strokeStyle = '#ffd43b'; g.stroke(); }
          if (tl.st === 'crack' || tl.st === 'fall') { g.strokeStyle = '#3b6b8c'; g.lineWidth = 2.5; g.beginPath(); const mx = (q[0][0] + q[2][0]) / 2, my = (q[0][1] + q[2][1]) / 2; for (let a = 0; a < 6; a++) { g.moveTo(mx, my); g.lineTo(mx + Math.cos(a * 1.1) * (q[1][0] - q[0][0]) * 0.45, my + Math.sin(a * 1.1) * (q[3][1] - q[0][1]) * 0.45); } g.stroke(); }
          const tw = (q[1][0] - q[0][0] + q[2][0] - q[3][0]) / 2, th = q[3][1] - q[0][1];
          g.globalAlpha = fog * (tl.st === 'fall' ? 1 - tl.ft : 1);
          const fs = K.fitSize(g, tl.w.word, tw * 0.88, Math.min(36, th * 0.46, 40 * s), Math.min(16, th * 0.4));
          K.text(g, tl.w.word, (q[0][0] + q[2][0]) / 2, (q[0][1] + q[3][1]) / 2, fs, tl.st === 'safe' ? '#1b6e2c' : '#17246b', { stroke: 'rgba(255,255,255,.85)', strokeW: 4 });
          g.restore();
        });
        if ((k + 1) % 3 === 0 && k < n - 1) { g.globalAlpha = fog; const fx = 0.5 + L.gF + L.sF + 0.04; K.emoji(g, k < bean.row + 0.5 ? '✅' : '🚩', SX(-fx, d), Y(d) - 14 * s, Math.max(16, 34 * s)); K.emoji(g, '🚩', SX(fx, d), Y(d) - 14 * s, Math.max(16, 34 * s)); g.globalAlpha = 1; }
      }
      function drawScene() {
        const W = L.W, H = L.H;
        // sky, mountains, water
        let gr = g.createLinearGradient(0, 0, 0, L.hy); gr.addColorStop(0, '#5fb4ec'); gr.addColorStop(1, '#d9f1ff'); g.fillStyle = gr; g.fillRect(0, 0, W, L.hy + 1);
        g.fillStyle = 'rgba(140,255,200,.18)'; g.beginPath(); g.moveTo(0, L.hy * 0.35); for (let x = 0; x <= W; x += 40) g.lineTo(x, L.hy * (0.3 + 0.08 * Math.sin(x / 120 + t * 0.5))); g.lineTo(W, L.hy * 0.5); g.lineTo(0, L.hy * 0.5); g.fill();
        const mts = [[0.05, 0.5], [0.2, 0.25], [0.38, 0.45], [0.55, 0.18], [0.72, 0.4], [0.9, 0.22], [1.05, 0.5]];
        mts.forEach(([mx, mh]) => { const x = mx * W, h = L.hy * (0.85 - mh), b = W * 0.14; g.fillStyle = '#7d9bb8'; g.beginPath(); g.moveTo(x - b, L.hy); g.lineTo(x, L.hy - h); g.lineTo(x + b, L.hy); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - b * 0.28, L.hy - h * 0.72); g.lineTo(x, L.hy - h); g.lineTo(x + b * 0.28, L.hy - h * 0.72); g.lineTo(x + b * 0.1, L.hy - h * 0.66); g.lineTo(x - b * 0.06, L.hy - h * 0.74); g.fill(); });
        // crowd on the far shore
        for (const p of crowd) { const bob = Math.abs(Math.sin(t * (crowdT > 0 ? 9 : 2) + p.ph)) * (crowdT > 0 ? 7 : 2); ell(p.x * W, L.hy - 6 * p.r - bob, 6 * p.r, 6 * p.r, p.c); }
        g.fillStyle = '#eaf6ff'; g.fillRect(0, L.hy - 3, W, 6);
        gr = g.createLinearGradient(0, L.hy, 0, H); gr.addColorStop(0, '#3a9fd0'); gr.addColorStop(1, '#0a4a78'); g.fillStyle = gr; g.fillRect(0, L.hy + 2, W, H - L.hy);
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2;
        for (let i = 0; i < 14; i++) { const yy = L.hy + (H - L.hy) * ((i / 14 + t * 0.02) % 1) ** 1.6, xx = ((i * 0.37 + t * 0.03) % 1) * W; g.beginPath(); g.moveTo(xx - 30, yy); g.lineTo(xx + 30, yy); g.stroke(); }
        // snowy banks with pine trees
        for (const tr of trees) { const d = tr.k - cam; if (d < -0.5 || d > 9) continue; const s = sc(d), X = tr.sgn * (0.5 + L.gF + L.sF + 0.1 + tr.o); const x = SX(X, d); if (x < -60 || x > W + 60) continue; g.globalAlpha = u.clamp((9 - d) / 3, 0, 1); K.emoji(g, '🌲', x, Y(d) - 26 * s * tr.s, 52 * s * tr.s); }
        g.globalAlpha = 1;
      }
      function rankChip() {
        const prog = bean.row; const ahead = bots.filter((b) => b.row > prog + 0.01).length; const r = ahead + 1;
        const lab = `🏁 ${r}${['st', 'nd', 'rd', 'th'][r - 1]}`; if (lab !== lastRank) { lastRank = lab; ctx.hud.extra(lab); }
      }

      /* ---------- input ---------- */
      ctx.on(c.cv, 'pointerdown', (e) => {
        if (state !== 'choose') return; const rc = c.cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
        const r = rows[cur], d = cur - cam; for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i].st === 'ok' && inQuad(tileQuad(r, i, d), x, y)) return pick(i);
      });
      ctx.on(window, 'keydown', (e) => { const k = +e.key; if (k >= 1 && k <= 4) pick(k - 1); else if (e.key === ' ' && state === 'choose') ctx.say(rows[cur].item); });

      /* ---------- main loop ---------- */
      layout();
      ctx.loop((dt) => {
        t += dt; if (c.w !== L.W || c.h !== L.H) layout();
        idleT += dt; crowdT = Math.max(0, crowdT - dt); bean.landT += dt;
        if (state === 'choose' && idleT > 9 && idleT - dt <= 9) ctx.say(rows[cur].item);
        stepHop(bean, dt); bots.forEach((b) => botStep(b, dt));
        rows.forEach((r) => { r.tiles.forEach((tl) => { if (tl.st === 'fall') tl.ft += dt * 1.4; }); r.side.forEach((st) => { if (st.st === 'fall') st.ft += dt * 1.4; }); });
        if (bean.fall != null) {
          bean.fall += dt;
          if (bean.fall > 0.5 && !bean.splashed) { bean.splashed = true; const d = bean.row - cam; parts.burst(SX(bean.x, d), Y(d), '#bfe9ff', 26, 260); parts.burst(SX(bean.x, d), Y(d), '#ffffff', 12, 180); EP.sfx.boom(); }
          if (bean.fall > 1 && !bean.afterFall) { bean.afterFall = true; afterFall().then(() => (bean.afterFall = false)); }
        }
        cam += (bean.row - cam) * Math.min(1, dt * 5); const cxMax = Math.max(0, (L.W / 2 - L.main / 2 - 6) / L.main); camX += (u.clamp(bean.x * 0.45, -cxMax, cxMax) - camX) * Math.min(1, dt * 4);
        if (crownT >= 0) crownT += dt;
        parts.update(dt); rankChip();
        // draw
        g.clearRect(0, 0, L.W, L.H); drawScene();
        const ents = [];
        if (!bean.hidden) ents.push({ k: Math.ceil(bean.row - 0.01), f: drawPlayer });
        bots.forEach((b) => ents.push({ k: Math.ceil(b.row - 0.01), f: () => drawBot(b) }));
        const k0 = Math.ceil(cam - 0.6), k1 = Math.floor(cam + 9);
        for (let k = Math.min(k1, n); k >= Math.max(k0, -1); k--) {
          const d = k - cam; if (L.k + d - 0.42 < 0.35) continue;
          drawRow(k, d, u.clamp((9.5 - d) / 3, 0, 1));
          ents.filter((e) => e.k === k).forEach((e) => e.f());
        }
        ents.filter((e) => e.k > Math.min(k1, n) || e.k < Math.max(k0, -1)).forEach((e) => e.f());
        // falling snow
        g.fillStyle = 'rgba(255,255,255,.85)';
        for (const f of flakes) { f.y += f.v * dt; if (f.y > 1) { f.y = 0; f.x = Math.random(); } g.beginPath(); g.arc((f.x + Math.sin(t + f.y * 6) * 0.01) * L.W, f.y * L.H, f.s, 0, 7); g.fill(); }
        parts.draw(g);
      });
      function drawPlayer() {
        const d = bean.row - cam; if (L.k + d < 0.3) return; const s = sc(d);
        let y = Y(d - 0.12), alpha = 1;
        if (bean.fall != null) { y += bean.fall * bean.fall * 220 * s; alpha = Math.max(0, 1 - bean.fall * 1.1); }
        const sq = bean.landT < 1 ? 0.28 * Math.exp(-bean.landT * 7) * Math.cos(bean.landT * 22) : 0;
        drawBean(SX(bean.x, d), y, L.bean * s, bean.col, { z: bean.z * 90 * s, sq, rot: Math.sin(t * 3) * 0.05, alpha, scared: bean.fall != null, crown: bean.crown, tag: 'YOU', tagSide: true, hat: ['#e03131', '#ffffff'] });
      }
      function drawBot(b) {
        const d = b.row - cam; if (L.k + d < 0.3 || d > 9) return; const s = sc(d);
        let y = Y(d - 0.12), alpha = u.clamp((9.5 - d) / 3, 0, 1);
        if (b.fall != null) { y += b.fall * b.fall * 160 * s; alpha *= Math.max(0, 1 - b.fall * 1.1); }
        const sq = b.landT < 1 ? 0.25 * Math.exp(-b.landT * 7) * Math.cos(b.landT * 22) : 0;
        drawBean(SX(laneX(b), d), y, Math.min(L.side * 0.62, L.bean) * s, b.col, { z: b.z * 70 * s, sq, rot: Math.sin(t * 3 + b.dx * 9) * 0.06, alpha, scared: b.fall != null, tag: L.side > 40 ? b.name : '', hat: b.hat });
      }

      ctx.timeout(nextRow, 300);
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { if (state === 'choose') pick(ci(rows[cur])); },
          wrong() { if (state !== 'choose') return; const r = rows[cur]; const i = r.tiles.findIndex((tl) => tl.st === 'ok' && tl.w !== r.item); if (i >= 0) pick(i); },
        },
      };
    },
  });
})();
