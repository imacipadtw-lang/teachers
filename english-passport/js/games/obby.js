/* Level 2 — Taipei 101 Obby (inspired by Roblox "obby" obstacle courses: platform jumps, checkpoints, fall & retry)
 * Every floor shows a sentence with a gap. Tap the floating platform with the missing word and the avatar jumps on it.
 * The right platform holds and you climb; a wrong one crumbles and you drop to the last checkpoint flag (every 4 floors). */
(function () {
  const EP = window.EP, u = EP.u;
  const COLS = ['#ff4d6d', '#339af0', '#f59f00', '#20c997'];
  const hex = (h) => (h[0] === '#' ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).map(Number));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  const shade = (h, k) => mix(h, k > 0 ? '#ffffff' : '#000000', Math.abs(k));
  const back = (x) => { x = u.clamp(x, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const SKY = [[0, '#5bbcff', '#d4f1ff', '#5f9e7f'], [0.55, '#ff8f70', '#ffd59e', '#7a5a6b'], [1, '#101540', '#3b2a7a', '#1b2347']];
  function sky(p) {
    p = u.clamp(p, 0, 1);
    for (let i = 1; i < SKY.length; i++) if (p <= SKY[i][0]) { const a = SKY[i - 1], b = SKY[i], k = (p - a[0]) / (b[0] - a[0]); return [1, 2, 3].map((j) => mix(a[j], b[j], k)); }
    return SKY[2].slice(1);
  }

  EP.registerGame({
    id: 'obby', level: 2, icon: '🏙️', title: 'Taipei 101 Obby', titleZh: '台北101跑酷塔',
    model: 'Roblox Obby 障礙跑酷（跳平台、檢查點、掉下去再爬上來）',
    howZh: '看句子缺了哪個字，點那個浮空平台跳上去，一層一層爬上台北101！跳錯平台會碎掉，掉回上一面檢查點旗子。',
    howEn: 'Tap the platform with the missing word to jump up the tower. Wrong platforms crumble and drop you to the last checkpoint flag!',
    skills: ['listening', 'reading', 'sentence'],
    start(ctx) {
      const root = ctx.root, K = ctx.kit;
      root.style.background = '#5bbcff';
      root.appendChild(u.el('style', {}, `
        .ob-top{position:absolute;top:10px;left:0;right:0;display:flex;justify-content:center;z-index:6;pointer-events:none;padding:0 10px}
        .ob-card{pointer-events:auto;max-width:min(780px,100%);gap:12px;padding:10px 16px}
        .ob-card .pic{font-size:clamp(2.2rem,8vw,3.2rem)}
        .ob-sent{font-size:clamp(1.35rem,4.8vw,2.05rem);font-weight:900;line-height:1.25}
        .ob-gap{display:inline-block;min-width:2.3em;border-bottom:5px dashed #ff922b;color:#ff922b;text-align:center;margin:0 .12em;line-height:1.1}
        .ob-gap.ok{border-bottom-style:solid;border-color:#2f9e44;color:#2f9e44;animation:obPop .45s}
        @keyframes obPop{40%{transform:scale(1.35)}}
        .ob-win{position:absolute;left:0;right:0;top:16%;z-index:8;text-align:center;color:#fff;font-weight:900;font-size:clamp(1.7rem,6vw,3.2rem);text-shadow:0 4px 0 rgba(0,0,0,.35);pointer-events:none;animation:obPop .8s;padding:0 8px}`));
      const c = K.canvas(root); const g = c.g; const parts = K.particles();
      const top = u.el('div', { class: 'ob-top' }); root.appendChild(top);
      const items = ctx.items, N = items.length, CP = 4;
      const hard = ctx.difficulty === 'hard', easy = ctx.difficulty === 'easy';
      const nOpt = easy ? 2 : 3;
      const AV = (EP.me && EP.me.avatar) || '🐼';
      let W = 1, H = 1, FH = 120, baseY = 0, colW = 1, colX = 0, PW = 100, PH = 46, AVS = 56;
      let f = 0, cam = 0, t = 0, state = 'start', cur = null, plats = [], gapEl = null, tapped = false, fwT = 0;
      const solved = [];
      const av = { fx: 0.5, fy: 0, sq: 1, rot: 0, jump: null, fall: null };
      const pieces = [], rockets = [], sparks = [];
      const clouds = Array.from({ length: 10 }, (_, i) => ({ x: Math.random(), fy: i * 1.25 + 0.6, s: u.rand(0.6, 1.3), v: u.rand(0.004, 0.012) * (i % 2 ? -1 : 1), par: i % 3 === 0 ? 1.25 : 0.55 }));
      const stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.85, p: Math.random() * 6 }));
      const city = Array.from({ length: 24 }, (_, i) => ({ x: (i + Math.random() * 0.4) / 24, w: u.rand(0.028, 0.05), h: u.rand(0.35, 1.3) }));

      function geo() {
        W = c.w; H = c.h; FH = u.clamp(H * 0.2, 96, 170); baseY = H * 0.82; colW = Math.min(W - 24, 760); colX = (W - colW) / 2;
        PW = Math.min(colW / nOpt - 18, 230); PH = u.clamp(FH * 0.32, 42, 56); AVS = u.clamp(FH * 0.42, 44, 72);
      }
      const sy = (fy) => baseY - (fy - cam) * FH;
      const sx = (fx) => colX + fx * colW;
      const floorX = (k) => (k <= 0 || !solved[k] ? 0.5 : solved[k].fx);

      /* ---------- prompt ---------- */
      function showPrompt(item) {
        const cz = ctx.cloze(item), pic = EP.pic(item);
        top.innerHTML = ''; gapEl = null;
        let main;
        if (cz) { gapEl = u.el('span', { class: 'ob-gap' }, '?'); main = u.el('div', { class: 'ob-sent' }, item.sentence.slice(0, cz.start), gapEl, item.sentence.slice(cz.start + cz.text.length)); }
        else main = u.el('div', { class: 'ob-sent' }, hard ? 'Listen! 仔細聽' : 'Which word? 哪個字？');
        const helper = hard ? null : u.el('div', { class: 'zhs zh' }, cz ? item.sentenceZh : item.zh);
        top.appendChild(u.el('div', { class: 'prompt-card ob-card' },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(item); } }, '🔊'),
          !hard && pic ? u.el('div', { class: 'pic' }, pic) : null,
          u.el('div', { style: { minWidth: 0 } }, main, helper)));
      }
      function fillGap(item) { if (!gapEl) return; const cz = ctx.cloze(item); gapEl.textContent = cz ? cz.text : item.word; gapEl.classList.add('ok'); }

      /* ---------- floors ---------- */
      function nextFloor() {
        if (f >= N) return finale();
        ctx.hud.progress(f / N); ctx.hud.extra(W > 600 ? `🏢 ${f}/${N}` : '');
        const item = items[f]; cur = { item, tries: 0 };
        const opts = u.shuffle([item].concat(ctx.distractors(item, nOpt - 1)));
        setPlats(opts.map((w, i) => ({ w, col: COLS[i % COLS.length], alive: true, ph: Math.random() * 6, crack: 0, vanish: 0 })));
        showPrompt(item);
        ctx.timeout(() => ctx.say(item), 400);
        state = 'choose';
      }
      function setPlats(list) {
        const n = list.length, pos = n === 1 ? [0.5] : n === 2 ? [0.27, 0.73] : [0.17, 0.5, 0.83];
        list.forEach((p, i) => { p.bx = pos[i]; p.fx = pos[i]; p.fl = f + 1; p.ap = -i * 0.1; });
        plats = list;
      }
      function jumpTo(p) {
        if (state !== 'choose' || !p || !p.alive) return;
        state = 'jump'; tapped = true; EP.sfx.jump();
        av.jump = { x0: av.fx, y0: av.fy, y1: p.fl, p, t: 0, dur: 0.5, arc: 0.7, done: () => land(p) };
      }
      function land(p) {
        const item = cur.item, x = sx(p.fx), y = sy(p.fl);
        if (p.w === item) {
          ctx.answer(item, true, { x, y: y - AVS * 1.5 });
          climbed(p);
        } else {
          state = 'crack'; cur.tries++;
          ctx.answer(item, false, { x, y: y - AVS * 1.5, label: '✗ ' + p.w.word });
          p.crack = 0.01; EP.sfx.tick();
          ctx.timeout(() => crumble(p), 420);
        }
      }
      function climbed(p) {
        state = 'won';
        const x = sx(p.fx), y = sy(p.fl);
        parts.burst(x, y, '#69db7c', 22); parts.burst(x, y, '#ffd43b', 14, 320);
        fillGap(cur.item);
        solved[p.fl] = { fx: p.fx, word: p.w.word, col: p.col, flag: 0 };
        plats.forEach((q) => { if (q !== p) { q.alive = false; q.vanish = 0.01; } });
        plats = plats.filter((q) => q !== p);
        f = p.fl;
        const cpHit = f % CP === 0 && f < N;
        if (cpHit) { solved[f].flag = 0.01; EP.sfx.coin(); ctx.timeout(() => EP.sfx.coin(), 140); ctx.float(x, y - AVS * 2.3, '🚩 Checkpoint!', 'good'); }
        ctx.timeout(nextFloor, cpHit ? 1150 : 720);
      }
      function crumble(p) {
        p.alive = false;
        const x = sx(p.fx);
        for (let i = 0; i < 6; i++) pieces.push({ x: x - PW / 2 + (i + 0.5) * PW / 6, fy: p.fl, vx: u.rand(-90, 90), vy: u.rand(-1.2, 0.4), r: 0, vr: u.rand(-6, 6), w: PW / 6 - 2, col: p.col });
        parts.burst(x, sy(p.fl) + PH / 2, '#ced4da', 14, 180);
        plats = plats.filter((q) => q !== p);
        EP.sfx.boom(); ctx.shake();
        const to = Math.floor(f / CP) * CP;
        state = 'fall';
        av.jump = null; av.fall = { vy: -2.2, to, dir: Math.random() < 0.5 ? -1 : 1, done: () => afterFall(to) };
      }
      async function afterFall(to) {
        state = 'reveal'; EP.sfx.stamp(); parts.burst(sx(av.fx), sy(to), '#ffffff', 10, 140);
        ctx.float(sx(av.fx), sy(to) - AVS * 1.7, to > 0 ? '🚩 Back to checkpoint!' : 'Oops! 再試一次', 'bad');
        await ctx.reveal(cur.item);
        climbBack(to);
      }
      function climbBack(from) {
        state = 'climb'; let k = from;
        const step = () => {
          if (k >= f) return retry();
          const nk = k + 1;
          av.jump = { x0: av.fx, y0: k, y1: nk, tx: floorX(nk), t: 0, dur: 0.3, arc: 0.45, done: () => { k = nk; EP.sfx.pop(); step(); } };
        };
        step();
      }
      function retry() {
        const alive = plats.filter((p) => p.alive), right = alive.find((p) => p.w === cur.item);
        if (cur.tries >= 2 || alive.length < 2) { // after 2 tries (or only one platform left) the right one carries you up
          state = 'auto'; right.glow = 1;
          ctx.timeout(() => { EP.sfx.jump(); av.jump = { x0: av.fx, y0: av.fy, y1: right.fl, p: right, t: 0, dur: 0.55, arc: 0.7, done: () => climbed(right) }; }, 500);
          return;
        }
        setPlats(u.shuffle(alive));
        state = 'choose';
      }
      function finale() {
        state = 'top'; ctx.hud.progress(1);
        top.innerHTML = '';
        root.appendChild(u.el('div', { class: 'ob-win' }, '🎆 TOP OF TAIPEI 101! 🎆', u.el('div', { class: 'zh', style: { fontSize: '.55em' } }, '你登上台北101頂樓了！')));
        EP.sfx.win(); ctx.confetti();
        ctx.timeout(() => ctx.end(), 3800);
      }

      /* ---------- input ---------- */
      function platAt(x, y) {
        return plats.find((p) => p.alive && p.ap > 0.5 && Math.abs(x - sx(p.fx)) < PW / 2 + 10 && y > sy(p.fl) - AVS * 1.3 && y < sy(p.fl) + PH + 18);
      }
      ctx.on(c.cv, 'pointerdown', (e) => {
        if (ctx.paused) return;
        const r = c.cv.getBoundingClientRect(); const p = platAt(e.clientX - r.left, e.clientY - r.top);
        if (p) jumpTo(p);
      });
      ctx.on(window, 'keydown', (e) => {
        const k = '123'.indexOf(e.key); if (k < 0 || ctx.paused) return;
        const list = plats.filter((p) => p.alive).sort((a, b) => a.bx - b.bx); jumpTo(list[k]);
      });

      /* ---------- update ---------- */
      function updateAvatar(dt) {
        av.sq += (1 - av.sq) * Math.min(1, dt * 10);
        if (av.jump) {
          const J = av.jump; J.t += dt; const k = Math.min(1, J.t / J.dur);
          const tx = J.p ? J.p.fx : J.tx;
          av.fx = J.x0 + (tx - J.x0) * k; av.fy = J.y0 + (J.y1 - J.y0) * k + Math.sin(Math.PI * k) * J.arc;
          av.sq = 1 + Math.sin(Math.PI * k) * 0.18;
          if (k >= 1) { av.jump = null; av.fy = J.y1; av.sq = 0.7; J.done && J.done(); }
        } else if (av.fall) {
          const F = av.fall; F.vy += 16 * dt; av.fy -= F.vy * dt; av.rot += dt * 8 * F.dir;
          av.fx += (floorX(F.to) - av.fx) * Math.min(1, dt * 4);
          if (av.fy <= F.to) { av.fy = F.to; av.fx = floorX(F.to); av.fall = null; av.rot = 0; av.sq = 0.6; F.done(); }
        }
      }
      function updateFireworks(dt) {
        if (state === 'top') {
          fwT -= dt;
          if (fwT <= 0) { fwT = 0.3; rockets.push({ x: u.rand(0.12, 0.88) * W, y: H + 10, vy: -H * u.rand(1.0, 1.3), ty: u.rand(0.1, 0.45) * H, col: u.pick(['#ffd43b', '#ff6b6b', '#74c0fc', '#b197fc', '#69db7c', '#ff8cc6']) }); }
        }
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i]; r.y += r.vy * dt;
          if (r.y <= r.ty) {
            rockets.splice(i, 1); if (i % 2 === 0) EP.sfx.pop();
            for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, s = u.rand(90, 230); sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: u.rand(0.9, 1.4), col: k % 5 === 0 ? '#fff' : r.col }); }
          }
        }
        for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt; s.vy += 110 * dt; s.vx *= 0.985; s.x += s.vx * dt; s.y += s.vy * dt; if (s.t > s.life) sparks.splice(i, 1); }
      }

      /* ---------- drawing ---------- */
      function slab(cx, y, w, h, col, label, o) {
        o = o || {};
        g.save(); g.translate(cx, y);
        if (o.scale != null) g.scale(o.scale, o.scale);
        if (o.alpha != null) g.globalAlpha = o.alpha;
        if (o.glow) { g.shadowColor = '#fff3bf'; g.shadowBlur = 24 + Math.sin(t * 8) * 8; }
        g.fillStyle = 'rgba(0,0,0,.2)'; K.roundRect(g, -w / 2 + 5, 7, w, h, 11); g.fill();
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, shade(col, 0.2)); gr.addColorStop(1, shade(col, -0.28));
        g.fillStyle = gr; K.roundRect(g, -w / 2, 0, w, h, 11); g.fill(); g.shadowBlur = 0;
        g.fillStyle = shade(col, 0.5); K.roundRect(g, -w / 2 + 3, 2, w - 6, 8, 5); g.fill();
        g.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 1; i < w / 24; i++) { g.beginPath(); g.arc(-w / 2 + i * 24, 6, 2.6, 0, 7); g.fill(); }
        if (o.crack) {
          g.strokeStyle = 'rgba(40,20,20,.85)'; g.lineWidth = 3; g.beginPath();
          g.moveTo(-w * 0.1, 0); g.lineTo(w * 0.05, h * 0.35); g.lineTo(-w * 0.08, h * 0.6); g.lineTo(w * 0.04, h);
          g.moveTo(w * 0.05, h * 0.35); g.lineTo(w * 0.3, h * 0.5); g.stroke();
        }
        if (label) { const s = K.fitSize(g, label, w - 14, Math.min(30, h * 0.6), 16); K.text(g, label, 0, h / 2 + 4, s, '#fff', { stroke: 'rgba(0,0,0,.5)', strokeW: 5 }); }
        g.restore();
      }
      function drawFlag(x, y, k) {
        const up = solved[k] ? back(solved[k].flag) : 1, reached = f >= k;
        g.strokeStyle = '#495057'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - AVS * 1.5); g.stroke();
        const fy = y - AVS * 1.5 + (1 - up) * AVS * 1.0, wave = Math.sin(t * 6) * 4;
        g.fillStyle = reached ? '#40c057' : '#adb5bd';
        g.beginPath(); g.moveTo(x, fy); g.quadraticCurveTo(x + 22, fy + 6 + wave, x + 40, fy + 14); g.quadraticCurveTo(x + 20, fy + 20 - wave, x, fy + 28); g.fill();
      }
      function drawTower(p, tint) {
        const cx = W / 2, tw = Math.min(colW * 0.46, 280);
        const S = Math.max(1, Math.ceil(N / CP)), seg = (N + 0.5 - 0.55) / S;
        const glass = (y0, y1, wb, wt) => {
          if (y1 > H + 20 || y0 < -FH * 6) return;
          const gr = g.createLinearGradient(cx - wt / 2, 0, cx + wt / 2, 0);
          gr.addColorStop(0, mix('#1f6f6a', tint, p * 0.7)); gr.addColorStop(0.5, mix('#79d2c0', tint, p * 0.6)); gr.addColorStop(1, mix('#1f6f6a', tint, p * 0.7));
          g.fillStyle = gr; g.beginPath(); g.moveTo(cx - wb / 2, y0); g.lineTo(cx + wb / 2, y0); g.lineTo(cx + wt / 2, y1); g.lineTo(cx - wt / 2, y1); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.5;
          for (let k = 1; k < 8; k++) { const yy = y0 + (y1 - y0) * k / 8, ww = wb + (wt - wb) * k / 8; g.beginPath(); g.moveTo(cx - ww / 2, yy); g.lineTo(cx + ww / 2, yy); g.stroke(); }
          if (p > 0.5) { g.fillStyle = `rgba(255,224,102,${(p - 0.5) * 1.4})`; for (let k = 0; k < 10; k++) { const yy = y0 + (y1 - y0) * ((k * 7 % 10) + 0.5) / 10, xx = cx + ((k * 37 % 9) - 4) * wb / 11; g.fillRect(xx, yy, 6, 4); } }
          g.fillStyle = '#f2c94c'; g.beginPath(); g.arc(cx - wt / 2 + 8, y1 + 6, 6, 0, 7); g.arc(cx + wt / 2 - 8, y1 + 6, 6, 0, 7); g.fill();
        };
        g.fillStyle = mix('#3d7e78', tint, p * 0.7); g.fillRect(cx - tw * 0.62, sy(0.55), tw * 1.24, sy(0) - sy(0.55));
        for (let s = 0; s < S; s++) { const a = 0.55 + s * seg; glass(sy(a), sy(a + seg), tw * 0.78, tw); }
        const crownB = sy(N + 0.5), crownT = sy(N + 1.05);
        if (crownT < H) {
          glass(crownB, crownT, tw * 0.5, tw * 0.62);
          g.strokeStyle = '#ced4da'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, crownT); g.lineTo(cx, sy(N + 2.4)); g.stroke();
          g.fillStyle = Math.sin(t * 4) > 0 ? '#ff6b6b' : '#ffd8d8'; g.beginPath(); g.arc(cx, sy(N + 2.4), 6, 0, 7); g.fill();
        }
      }
      function draw() {
        const p = cam / Math.max(1, N), [s1, s2, tint] = sky(p);
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, s1); gr.addColorStop(1, s2);
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        if (p > 0.45) { const a = Math.min(1, (p - 0.45) * 2); g.fillStyle = '#fff'; for (const s of stars) { g.globalAlpha = a * (0.45 + 0.55 * Math.sin(t * 2 + s.p)); g.fillRect(s.x * W, s.y * H, 2.2, 2.2); } g.globalAlpha = 1; }
        K.emoji(g, p > 0.75 ? '🌙' : '☀️', W * 0.86, H * (0.16 + p * 0.06), 50);
        const gY = sy(0), mY = baseY + (gY - baseY) * 0.3 + 30, cY = baseY + (gY - baseY) * 0.6 + 14;
        if (mY - 120 < H) { // Taipei basin hills
          g.fillStyle = mix('#5f9e7f', '#141c3a', p); g.beginPath(); g.moveTo(0, H);
          for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, mY - 60 - 45 * Math.sin(x * 0.006 + 1) - 25 * Math.sin(x * 0.019));
          g.lineTo(W, H); g.fill();
        }
        if (cY - FH * 1.6 < H) { // city skyline
          for (const b of city) {
            const bh = b.h * FH * 1.1, bx = b.x * W;
            g.fillStyle = mix('#4a6fa5', '#121834', p); g.fillRect(bx, cY - bh, b.w * W, bh + H);
            if (p > 0.4) { g.fillStyle = 'rgba(255,224,102,.7)'; for (let k = 0; k < 4; k++) g.fillRect(bx + 4 + (k % 2) * 8, cY - bh + 8 + k * 14, 4, 5); }
          }
        }
        for (const cl of clouds) drawCloud(cl, cl.par > 1 ? 0.55 : 0.75);
        drawTower(p, tint);
        if (gY < H + 10) { // street plaza (floor 0)
          g.fillStyle = '#6c757d'; g.fillRect(0, gY, W, H - gY + 10); g.fillStyle = '#51cf66'; g.fillRect(0, gY, W, 10);
          g.fillStyle = '#868e96'; for (let x = 10; x < W; x += 60) g.fillRect(x, gY + 30, 34, 6);
          drawFlag(sx(0.06), gY, 0);
          K.text(g, 'START 起點', sx(0.5), gY + 34, 20, '#fff', { stroke: 'rgba(0,0,0,.4)' });
        }
        for (let k = 1; k < solved.length; k++) {
          const s = solved[k]; if (!s) continue; const y = sy(k); if (y < -80 || y > H + 80) continue;
          slab(sx(s.fx), y, PW, PH, s.col, s.word, { alpha: k === f ? 1 : 0.88 });
          if (k % CP === 0) drawFlag(sx(s.fx) - PW / 2 + 10, y, k);
        }
        for (const q of plats) {
          const y = sy(q.fl) + Math.sin(t * 2.2 + q.ph) * 4;
          const shake = q.crack ? Math.sin(t * 70) * 3 : 0;
          slab(sx(q.fx) + shake, y, PW, PH, q.col, q.w.word, { scale: q.vanish ? 1 + q.vanish * 0.4 : back(q.ap), alpha: q.vanish ? 1 - q.vanish : 1, crack: q.crack > 0, glow: q.glow });
        }
        if (state === 'choose' && !tapped && f === 0 && plats[0]) K.emoji(g, '👆', sx(plats[plats.length > 2 ? 1 : 0].fx), sy(f + 1) + PH + 34 + Math.sin(t * 6) * 8, 40);
        for (const pc of pieces) { g.save(); g.translate(pc.x, sy(pc.fy)); g.rotate(pc.r); g.fillStyle = shade(pc.col, -0.1); g.fillRect(-pc.w / 2, -PH / 2, pc.w, PH); g.restore(); }
        drawAvatar();
        parts.draw(g);
        for (const r of rockets) { g.fillStyle = r.col; g.fillRect(r.x - 2, r.y, 4, 14); }
        for (const s of sparks) { g.globalAlpha = Math.max(0, 1 - s.t / s.life); g.fillStyle = s.col; g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); }
        g.globalAlpha = 1;
      }
      function drawCloud(cl, alpha) {
        let y = baseY - (cl.fy - cam * cl.par) * FH;
        const span = (H + 400) / FH;
        if (y > H + 150) { cl.fy += span; y -= span * FH; } else if (y < -250) { cl.fy -= span; y += span * FH; }
        const x = ((cl.x % 1.3) + 1.3) % 1.3 * W - 0.15 * W, s = cl.s * (cl.par > 1 ? 70 : 45);
        g.globalAlpha = alpha; g.fillStyle = mix('#ffffff', '#7d7fb5', u.clamp(cam / Math.max(1, N) * 1.4 - 0.3, 0, 1)); g.beginPath();
        g.ellipse(x, y, s * 1.4, s * 0.55, 0, 0, 7); g.ellipse(x - s * 0.6, y + 4, s * 0.8, s * 0.45, 0, 0, 7); g.ellipse(x + s * 0.5, y - s * 0.25, s * 0.75, s * 0.55, 0, 0, 7);
        g.fill(); g.globalAlpha = 1;
      }
      function drawAvatar() {
        const x = sx(av.fx), y = sy(av.fy);
        if (!av.jump && !av.fall) { g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x, y + 3, AVS * 0.36, AVS * 0.1, 0, 0, 7); g.fill(); }
        if (ctx.combo >= 3) { const rg = g.createRadialGradient(x, y - AVS * 0.5, 4, x, y - AVS * 0.5, AVS); rg.addColorStop(0, 'rgba(255,212,59,.6)'); rg.addColorStop(1, 'rgba(255,212,59,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y - AVS * 0.5, AVS, 0, 7); g.fill(); }
        g.save(); g.translate(x, y); g.rotate(av.rot);
        const sq = av.sq + (state === 'choose' ? Math.sin(t * 5) * 0.03 : 0); g.scale(1 / Math.sqrt(sq), sq);
        K.emoji(g, AV, 0, -AVS * 0.5, AVS);
        g.restore();
      }

      ctx.loop((dt) => {
        t += dt; geo();
        for (const q of plats) { q.ap += dt * 3; if (q.alive) q.fx = q.bx + (hard ? Math.sin(t * 1.2 + q.ph) * 0.045 : 0); if (q.crack) q.crack += dt; if (q.vanish) q.vanish = Math.min(1, q.vanish + dt * 3); }
        plats = plats.filter((q) => !(q.vanish >= 1));
        for (const s of solved) if (s && s.flag && s.flag < 1) s.flag = Math.min(1, s.flag + dt * 2);
        for (const cl of clouds) cl.x += cl.v * dt;
        updateAvatar(dt);
        const target = state === 'top' ? N + 0.5 : av.fy;
        cam += (target - cam) * Math.min(1, dt * (av.fall ? 9 : state === 'top' ? 1.2 : 4.5));
        for (let i = pieces.length - 1; i >= 0; i--) { const pc = pieces[i]; pc.vy += 14 * dt; pc.fy -= pc.vy * dt; pc.x += pc.vx * dt; pc.r += pc.vr * dt; if (sy(pc.fy) > H + 120) pieces.splice(i, 1); }
        parts.update(dt); updateFireworks(dt);
        draw();
      });

      geo(); nextFloor();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { if (state === 'choose') jumpTo(plats.find((p) => p.alive && p.w === cur.item)); },
          wrong() { if (state === 'choose') jumpTo(plats.find((p) => p.alive && p.w !== cur.item)); },
        },
      };
    },
  });
})();
