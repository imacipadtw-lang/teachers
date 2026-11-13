/* Level 4 — Metro Runner (inspired by Subway Surfers: 3-lane runner, swipe to switch lanes, jump barriers, grab coins)
 * See the picture / hear the verb, then run through the gate that carries it. No chasing guard: wrong gates just
 * slow you down and show the right word. Pseudo-3D tunnel on canvas, speed rises gently. */
(function () {
  const EP = window.EP, u = EP.u;
  const LANE_COL = ['#ff5c7a', '#3d9bff', '#ffc531'];
  EP.registerGame({
    id: 'metro', level: 4, icon: '🚇', title: 'Metro Runner', titleZh: '捷運跑酷',
    model: 'Subway Surfers 地鐵跑酷（三線道奔跑、換道、跳躍、吃金幣）',
    howZh: '看圖或聽發音，左右滑動（或按 ← →、點左右半邊）換到寫著正確動詞的閘門跑過去！往上滑或按空白鍵跳過路障，順便吃金幣。',
    howEn: 'Swipe left/right (or arrow keys) to run through the gate with the right verb. Swipe up or press Space to jump barriers. Grab coins!',
    skills: ['listening', 'reading', 'meaning'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit;
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      root.style.background = '#121530';
      root.appendChild(u.el('style', {}, `
        .mr-top{position:absolute;top:10px;left:0;right:0;display:flex;justify-content:center;z-index:6;pointer-events:none;padding:0 10px}
        .mr-card{pointer-events:auto;gap:12px;padding:8px 16px}
        .mr-card .pic{font-size:clamp(2.2rem,8vw,3rem)}
        .mr-card .txt{font-size:clamp(1.05rem,3.8vw,1.4rem)}
        .mr-card .zhs{white-space:nowrap}
        .mr-lanes{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:8px;z-index:6;padding:0 8px;pointer-events:none}
        .mr-lane{pointer-events:auto;flex:1;max-width:260px;min-height:60px;border-radius:16px;color:#fff;font-weight:900;font-size:clamp(1.15rem,4.2vw,1.6rem);line-height:1.1;padding:6px;text-shadow:0 2px 0 rgba(0,0,0,.35);box-shadow:0 5px 0 rgba(0,0,0,.3);opacity:.86;border:4px solid transparent;transition:transform .12s,opacity .12s}
        .mr-lane.on{opacity:1;border-color:#fff;transform:translateY(-4px)}
        .mr-lane.off{background:#495057!important;opacity:.5}
        .mr-end{position:absolute;left:0;right:0;top:36%;text-align:center;color:#fff;font-weight:900;font-size:clamp(2rem,7vw,3.4rem);text-shadow:0 4px 0 rgba(0,0,0,.4);z-index:8;pointer-events:none}`));
      const c = K.canvas(root); const g = c.g; const parts = K.particles();
      const top = u.el('div', { class: 'mr-top' }); const lanesEl = u.el('div', { class: 'mr-lanes' }); root.append(top, lanesEl);
      const laneBtns = [0, 1, 2].map((l) => { const b = u.el('button', { class: 'mr-lane', style: { background: LANE_COL[l] }, onclick: () => setLane(l) }, ''); lanesEl.appendChild(b); return b; });

      const zP = 2.4, ZN = 0.7, ZF = 60, GAP = easy ? 32 : hard ? 30 : 31;
      const BASE = (easy ? 5.2 : hard ? 8.2 : 6.8) * (ctx.speed || 1);
      let W = 1, H = 1, cx = 0, y0 = 0, fx = 1, fy = 1, AVS = 60;
      let travelled = 0, runMul = 0, runTarget = 1, boost = 1, t = 0, coins = 0, state = 'run', gate = null, lastCoinSfx = 0;
      const pl = { lane: 1, x: 0, jy: 0, vy: 0, stumble: 0 };
      let objs = [];
      const queue = ctx.items.slice(), requeued = new Set(); let qi = 0;
      const AV = (EP.me && EP.me.avatar) || '🐼';

      function geo() {
        W = c.w; H = c.h; cx = W / 2; y0 = H * (W > H ? 0.3 : 0.33);
        const laneW = Math.min(W * 0.3, H * 0.42); fx = laneW * zP; fy = (H * 0.8 - y0) * zP;
        AVS = Math.min(laneW * 0.62, 120);
      }
      const PX = (x, z) => cx + (x * fx) / Math.max(ZN, z);
      const PY = (y, z) => y0 + ((1 - y) * fy) / Math.max(ZN, z);
      function poly(pts, fill) { g.beginPath(); pts.forEach((p, i) => { const X = PX(p[0], p[2]), Y = PY(p[1], p[2]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fillStyle = fill; g.fill(); }

      /* ---------- gates & prompts ---------- */
      function showPrompt(item) {
        const pic = EP.pic(item);
        top.innerHTML = '';
        top.appendChild(u.el('div', { class: 'prompt-card mr-card' },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(item); } }, '🔊'),
          hard ? null : pic ? u.el('div', { class: 'pic' }, pic) : null,
          hard ? null : !pic || easy ? u.el('div', { class: 'zhs zh' }, item.zh) : null,
          u.el('div', { class: 'txt' }, hard ? '🎧 Listen! Run through it 聽音找門' : '🏃 Run through the gate! 跑過正確的門')));
      }
      function startGate(sBase) {
        if (qi >= queue.length) return finish();
        ctx.hud.progress(qi / queue.length);
        const item = queue[qi++];
        const words = u.shuffle([item].concat(ctx.distractors(item, easy ? 1 : 2)));
        const opts = [null, null, null]; let blocked = -1;
        if (easy) { blocked = u.randInt(0, 2); let k = 0; for (let l = 0; l < 3; l++) if (l !== blocked) opts[l] = words[k++]; }
        else words.forEach((w, l) => (opts[l] = w));
        gate = { type: 'gate', s: sBase + GAP, item, opts, blocked, right: opts.indexOf(item), done: false, fx: 0 };
        objs.push(gate);
        const lo = sBase + 5, hi = gate.s - 8, cl = u.randInt(0, 2);
        const bar = !easy || Math.random() < 0.5 ? { type: 'bar', s: u.rand(lo + 4, hi - 4), lane: u.randInt(0, 2) } : null;
        if (bar) objs.push(bar);
        for (let s = lo; s < hi; s += 1.5) {
          const d = bar && cl === bar.lane ? Math.abs(s - bar.s) : 9;
          if (d < 0.6 && !(bar && cl === bar.lane)) continue;
          objs.push({ type: 'coin', s, lane: cl, y: d < 2.2 ? 0.35 + 0.55 * Math.cos((d / 2.2) * Math.PI / 2) : 0.3 });
        }
        laneBtns.forEach((b, l) => { b.textContent = opts[l] ? opts[l].word : '🚧'; b.classList.toggle('off', !opts[l]); });
        lanesEl.style.visibility = 'visible';
        showPrompt(item); ctx.timeout(() => ctx.say(item), 300);
      }
      function passGate(o) {
        o.done = true;
        const lane = Math.round(pl.x + 1), x = PX(pl.x, zP), y = PY(1.3, zP);
        if (lane === o.blocked) { // easy mode: ran into the closed lane — gently send the gate around again
          ctx.float(x, y, '🚧 Pick a word gate! 選一個門', 'bad'); EP.sfx.boom(); ctx.shake();
          pl.stumble = 0.5; runMul = 0.2; o.done = false; o.s = travelled + zP + 16; ctx.say(o.item);
          return;
        }
        const w = o.opts[lane];
        if (w === o.item) {
          o.win = lane; boost = Math.min(1.3, boost + 0.025);
          ctx.answer(o.item, true, { x, y });
          const sx = PX(lane - 1, zP + 0.4), sy = PY(1.3, zP + 0.4);
          parts.burst(sx, sy, LANE_COL[lane], 30, 360); parts.burst(sx, sy, '#fff', 12, 260);
          gate = null; startGate(o.s);
        } else {
          o.lose = lane; state = 'reveal'; runTarget = 0; gate = null;
          ctx.answer(o.item, false, { x, y, label: '✗ ' + (w ? w.word : '') });
          ctx.shake(); lanesEl.style.visibility = 'hidden';
          failFlow(o.item);
        }
      }
      async function failFlow(item) {
        await ctx.wait(500);
        await ctx.reveal(item);
        if (!requeued.has(item.id)) { requeued.add(item.id); queue.push(item); }
        state = 'run'; runTarget = 1; startGate(travelled + zP);
      }
      function finish() {
        state = 'done'; gate = null; runTarget = 0.35; ctx.hud.progress(1); lanesEl.style.visibility = 'hidden'; top.innerHTML = '';
        EP.sfx.win();
        root.appendChild(u.el('div', { class: 'mr-end' }, '🏁 Next station!', u.el('div', { class: 'zh', style: { fontSize: '.5em' } }, `下一站到了！ 🪙 ${coins}`)));
        ctx.timeout(() => ctx.end(), 1800);
      }

      /* ---------- controls ---------- */
      function setLane(l) { if (ctx.paused || state === 'done') return; l = u.clamp(l, 0, 2); if (l !== pl.lane) { pl.lane = l; EP.sfx.whoosh(); } }
      function jump() { if (ctx.paused) return; if (pl.jy <= 0.001) { pl.vy = 4.6; EP.sfx.jump(); } }
      ctx.on(window, 'keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') setLane(pl.lane - 1);
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') setLane(pl.lane + 1);
        else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { jump(); e.preventDefault(); }
      });
      let st = null;
      ctx.on(c.cv, 'pointerdown', (e) => { st = { x: e.clientX, y: e.clientY, used: false }; });
      ctx.on(c.cv, 'pointermove', (e) => {
        if (!st || st.used) return; const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) { setLane(pl.lane + (dx > 0 ? 1 : -1)); st.used = true; }
        else if (dy < -28 && -dy > Math.abs(dx)) { jump(); st.used = true; }
      });
      ctx.on(c.cv, 'pointerup', (e) => {
        if (st && !st.used && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 14) { const r = c.cv.getBoundingClientRect(); setLane(pl.lane + (e.clientX - r.left < W / 2 ? -1 : 1)); }
        st = null;
      });

      /* ---------- update ---------- */
      ctx.loop((dt) => {
        geo(); t += dt;
        runMul += (runTarget - runMul) * Math.min(1, dt * 2.2);
        const v = BASE * boost * runMul * (pl.stumble > 0 ? 0.45 : 1);
        travelled += v * dt;
        pl.x += u.clamp(pl.lane - 1 - pl.x, -dt * 9, dt * 9);
        if (pl.jy > 0 || pl.vy > 0) { pl.jy += pl.vy * dt; pl.vy -= 12 * dt; if (pl.jy <= 0) { pl.jy = 0; pl.vy = 0; } }
        pl.stumble = Math.max(0, pl.stumble - dt);
        for (const o of objs) {
          const z = o.s - travelled;
          if (o.type === 'coin' && !o.got && z < zP + 0.3 && z > zP - 0.5 && Math.abs(o.lane - 1 - pl.x) < 0.45 && Math.abs(o.y - 0.3 - pl.jy) < 0.6) {
            o.got = true; coins++; ctx.addScore(5); parts.burst(PX(o.lane - 1, zP), PY(o.y, zP), '#ffd43b', 6, 140);
            if (t - lastCoinSfx > 0.09) { lastCoinSfx = t; EP.sfx.coin(); }
          }
          if (o.type === 'bar' && !o.done && z <= zP + 0.1) {
            o.done = true;
            if (Math.abs(o.lane - 1 - pl.x) < 0.5) {
              if (pl.jy < 0.42) { pl.stumble = 0.6; o.hit = true; const lost = Math.min(coins, 3); coins -= lost; ctx.float(PX(pl.x, zP), PY(1.1, zP), lost ? `Oops! −${lost}🪙` : 'Oops! 小心', 'bad'); EP.sfx.boom(); ctx.shake(); }
              else { ctx.addScore(10); ctx.float(PX(pl.x, zP), PY(1.4, zP), 'Nice jump! +10', 'good'); }
            }
          }
          if (o.type === 'gate' && !o.done && z <= zP && state === 'run') passGate(o);
        }
        objs = objs.filter((o) => o.s - travelled > -3);
        laneBtns.forEach((b, l) => b.classList.toggle('on', l === pl.lane));
        parts.update(dt);
        draw();
      });

      /* ---------- drawing ---------- */
      function draw() {
        g.fillStyle = '#141734'; g.fillRect(0, 0, W, H);
        // daylight at the end of the tunnel
        const ex0 = PX(-2, ZF), ex1 = PX(2, ZF), ey0 = PY(2.4, ZF), ey1 = PY(0, ZF);
        const rg = g.createRadialGradient(cx, (ey0 + ey1) / 2, 2, cx, (ey0 + ey1) / 2, Math.max(60, (ex1 - ex0) * 3));
        rg.addColorStop(0, 'rgba(255,248,220,.9)'); rg.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
        g.fillStyle = '#fff8dc'; g.fillRect(ex0, ey0, ex1 - ex0, ey1 - ey0);
        poly([[-2, 2.4, ZN], [2, 2.4, ZN], [2, 2.4, ZF], [-2, 2.4, ZF]], '#1d2550');
        for (const s of [-1, 1]) {
          poly([[2 * s, 0, ZN], [2 * s, 2.4, ZN], [2 * s, 2.4, ZF], [2 * s, 0, ZF]], '#2b3a78');
          poly([[2 * s, 0.85, ZN], [2 * s, 1.1, ZN], [2 * s, 1.1, ZF], [2 * s, 0.85, ZF]], '#12b886');
          poly([[2 * s, 0, ZN], [2 * s, 0.25, ZN], [2 * s, 0.25, ZF], [2 * s, 0, ZF]], '#1b2350');
        }
        poly([[-2, 0, ZN], [2, 0, ZN], [2, 0, ZF], [-2, 0, ZF]], '#3a3e5c');
        poly([[-1.62, 0, ZN], [1.62, 0, ZN], [1.62, 0, ZF], [-1.62, 0, ZF]], '#55596f');
        const off = travelled % 1;
        for (let k = 30; k >= 0; k--) { const z = k - off; if (z < ZN) continue; poly([[-1.55, 0, z], [1.55, 0, z], [1.55, 0, z + 0.22], [-1.55, 0, z + 0.22]], '#6e5236'); }
        for (let l = 0; l < 3; l++) for (const d of [-0.3, 0.3]) { const x = l - 1 + d; poly([[x - 0.035, 0.02, ZN], [x + 0.035, 0.02, ZN], [x + 0.035, 0.02, ZF], [x - 0.035, 0.02, ZF]], '#c9d1e6'); }
        const off5 = travelled % 5;
        for (let k = 12; k >= 0; k--) {
          const z = k * 5 - off5; if (z < ZN) continue;
          const glow = Math.max(0.25, 1 - z / 40);
          for (const s of [-1, 1]) poly([[1.995 * s, 1.55, z], [1.995 * s, 1.8, z], [1.995 * s, 1.8, z + 1.6], [1.995 * s, 1.55, z + 1.6]], `rgba(255,243,191,${glow})`);
          poly([[-0.35, 2.39, z], [0.35, 2.39, z], [0.35, 2.39, z + 0.9], [-0.35, 2.39, z + 0.9]], `rgba(255,232,163,${glow})`);
          if (k % 2 === 0) { g.strokeStyle = 'rgba(10,12,30,.55)'; g.lineWidth = Math.max(1, 22 / z); g.strokeRect(PX(-2, z), PY(2.4, z), PX(2, z) - PX(-2, z), PY(0, z) - PY(2.4, z)); }
        }
        const sorted = objs.slice().sort((a, b) => b.s - a.s);
        for (const o of sorted) if (o.s - travelled >= zP - 0.15) drawObj(o);
        drawPlayer();
        for (const o of sorted) if (o.s - travelled < zP - 0.15) drawObj(o);
        parts.draw(g);
        // speed streaks + coin counter
        if (runMul > 0.6) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * 1.7 + t * 3, r0 = ((t * 900 + i * 137) % (W * 0.6)) + W * 0.15; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, y0 + Math.sin(a) * r0 * 0.7); g.lineTo(cx + Math.cos(a) * (r0 + 60), y0 + Math.sin(a) * (r0 + 60) * 0.7); g.stroke(); } }
        g.fillStyle = 'rgba(0,0,0,.35)'; K.roundRect(g, 10, H * 0.5 - 22, 104, 44, 22); g.fill();
        K.emoji(g, '🪙', 34, H * 0.5, 26); K.text(g, String(coins), 78, H * 0.5 + 2, 24, '#ffd43b', { stroke: 'rgba(0,0,0,.4)' });
      }
      function drawObj(o) {
        const z = o.s - travelled; if (z < ZN || z > ZF) return;
        if (o.type === 'coin') {
          if (o.got) return; const x = PX(o.lane - 1, z), y = PY(o.y, z), r = (0.17 * fx) / z, sq = Math.abs(Math.cos(t * 5 + o.s));
          g.fillStyle = '#e8a400'; g.beginPath(); g.ellipse(x, y, Math.max(1, r * sq), r, 0, 0, 7); g.fill();
          g.fillStyle = '#ffd43b'; g.beginPath(); g.ellipse(x, y, Math.max(0.5, r * sq * 0.72), r * 0.72, 0, 0, 7); g.fill();
        } else if (o.type === 'bar') {
          const l = o.lane - 1;
          poly([[l - 0.42, 0.12, z], [l + 0.42, 0.12, z], [l + 0.42, 0.42, z], [l - 0.42, 0.42, z]], o.hit ? '#e8590c' : '#ffd43b');
          g.save(); g.beginPath(); g.rect(PX(l - 0.42, z), PY(0.42, z), PX(l + 0.42, z) - PX(l - 0.42, z), PY(0.12, z) - PY(0.42, z)); g.clip();
          g.fillStyle = '#212529'; const w = PX(l + 0.42, z) - PX(l - 0.42, z), h = PY(0.12, z) - PY(0.42, z);
          for (let i = -2; i < 8; i++) { const x0 = PX(l - 0.42, z) + (i * w) / 6; g.beginPath(); g.moveTo(x0, PY(0.12, z)); g.lineTo(x0 + w / 12, PY(0.12, z)); g.lineTo(x0 + w / 12 + h, PY(0.42, z)); g.lineTo(x0 + h, PY(0.42, z)); g.fill(); }
          g.restore();
          for (const d of [-0.36, 0.36]) poly([[l + d - 0.03, 0, z], [l + d + 0.03, 0, z], [l + d + 0.03, 0.12, z], [l + d - 0.03, 0.12, z]], '#868e96');
        } else if (o.type === 'gate') {
          for (let l = 0; l < 3; l++) {
            const xl = l - 1, w = o.opts[l];
            if (l === o.blocked) {
              poly([[xl - 0.45, 0, z], [xl + 0.45, 0, z], [xl + 0.45, 0.9, z], [xl - 0.45, 0.9, z]], 'rgba(73,80,87,.85)');
              for (let k = 0; k < 3; k++) poly([[xl - 0.45, 0.15 + k * 0.28, z], [xl + 0.45, 0.15 + k * 0.28, z], [xl + 0.45, 0.27 + k * 0.28, z], [xl - 0.45, 0.27 + k * 0.28, z]], k % 2 ? '#fff' : '#fa5252');
              K.emoji(g, '🚧', PX(xl, z), PY(1.2, z), Math.max(8, (0.5 * fx) / z));
              continue;
            }
            const col = o.win === l ? '#40c057' : o.lose === l ? '#fa5252' : LANE_COL[l];
            g.globalAlpha = 0.22 + (o.win === l || o.lose === l ? 0.3 : 0.08 * Math.sin(t * 6 + l));
            poly([[xl - 0.43, 0, z], [xl + 0.43, 0, z], [xl + 0.43, 1.05, z], [xl - 0.43, 1.05, z]], col);
            g.globalAlpha = 1;
            for (const d of [-0.47, 0.43]) poly([[xl + d, 0, z], [xl + d + 0.06, 0, z], [xl + d + 0.06, 1.55, z], [xl + d, 1.55, z]], '#dee2e6');
            poly([[xl - 0.5, 1.05, z], [xl + 0.5, 1.05, z], [xl + 0.5, 1.55, z], [xl - 0.5, 1.55, z]], col);
            if (w) {
              const sw = PX(xl + 0.46, z) - PX(xl - 0.46, z), sh = PY(1.05, z) - PY(1.55, z);
              const fs = K.fitSize(g, w.word, sw * 0.92, Math.max(6, sh * 0.7), 5);
              if (fs >= 6) K.text(g, w.word, PX(xl, z), PY(1.3, z), fs, '#fff', { stroke: 'rgba(0,0,0,.45)', strokeW: Math.max(2, fs / 6) });
            }
          }
        }
      }
      function drawPlayer() {
        const x = PX(pl.x, zP), gy = PY(0, zP), y = PY(pl.jy, zP), bob = pl.jy > 0 ? 0 : Math.abs(Math.sin(t * 13)) * AVS * 0.05 * runMul;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, gy, AVS * 0.42 / (1 + pl.jy), AVS * 0.1 / (1 + pl.jy), 0, 0, 7); g.fill();
        g.save(); g.translate(x, y - bob); g.rotate((pl.lane - 1 - pl.x) * 0.35 + (pl.stumble > 0 ? Math.sin(t * 30) * 0.2 : 0));
        const bw = AVS * 0.95, bh = AVS * 0.16;
        g.shadowColor = '#66d9e8'; g.shadowBlur = 14; g.fillStyle = '#15aabf'; K.roundRect(g, -bw / 2, -bh, bw, bh, bh / 2); g.fill(); g.shadowBlur = 0;
        g.fillStyle = '#ffe066'; g.fillRect(-bw / 2 + bh, -bh * 0.65, bw - bh * 2, bh * 0.25);
        if (ctx.combo >= 3) { g.globalAlpha = 0.5; K.emoji(g, '🔥', -bw * 0.55, -bh, AVS * 0.35); g.globalAlpha = 1; }
        K.emoji(g, AV, 0, -bh - AVS * 0.45, AVS * 0.9);
        g.restore();
      }

      geo(); startGate(travelled + zP - 6);
      function ff(l) {
        if (!gate || gate.done || state !== 'run') return;
        pl.lane = l; pl.x = l - 1; pl.jy = 0; pl.vy = 0;
        const target = gate.s - zP - 0.3;
        if (travelled < target) { for (const o of objs) if (o !== gate && o.s < gate.s) { o.done = true; o.got = o.got || o.type === 'coin'; } travelled = target; }
        runTarget = 1; runMul = Math.max(runMul, 0.6);
      }
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { if (gate) ff(gate.right); },
          wrong() { if (!gate) return; const l = [0, 1, 2].find((k) => k !== gate.right && gate.opts[k]); if (l != null) ff(l); },
        },
      };
    },
  });
})();
