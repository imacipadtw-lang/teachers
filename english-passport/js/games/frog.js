/* Level 14 — Canal Froggy (inspired by Flexbox Froggy: write the code that puts the frog on the right spot)
 * A playful code panel (`#frog { position: under; }`) + an Amsterdam canal pond. Item types:
 *  (a) in / on / under → a box on bricks with a dashed "ghost frog" target; choose the preposition, the frog jumps there.
 *  (b) months → 12 lily pads; "hear a month" or "which month comes after/before …?" → hop to the right pad.
 *  (c) this / that / these / those → near or far, one or many apples; pick the pad with the right word.
 *  (d) anything else → its example sentence with a gap (ctx.cloze); lily pads carry the options. */
(function () {
  const EP = window.EP, u = EP.u;
  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const HOUSES = ['#b5651d', '#2f4858', '#c0392b', '#f4d35e', '#6b4f3a', '#3d5a80', '#e07a5f', '#81b29a'];
  const CSS = `
  .fr-wrap{position:absolute;inset:0;display:flex;gap:10px;padding:8px}
  .fr-code{background:#1e2233;color:#f1f3f5;border-radius:18px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;overflow:auto;box-shadow:0 6px 0 rgba(0,0,0,.25);flex:none}
  .fr-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:900}
  .fr-dots{display:flex;gap:4px;flex-wrap:wrap}.fr-dots i{width:12px;height:12px;border-radius:50%;background:#495057;display:block}
  .fr-dots i.cur{background:#ffd43b;box-shadow:0 0 0 3px rgba(255,212,59,.35)}.fr-dots i.ok{background:#51cf66}.fr-dots i.no{background:#ff6b6b}
  .fr-ins{background:#2b3047;border-radius:14px;padding:8px 10px;display:flex;gap:10px;align-items:center}
  .fr-ins .say{width:56px;height:56px;border-radius:50%;background:#47b8ff;color:#fff;font-size:1.6rem;flex:none;box-shadow:0 4px 0 rgba(0,0,0,.3)}
  .fr-ins b{display:block;font-size:clamp(1.25rem,3.6vw,1.6rem);line-height:1.2}.fr-ins small{display:block;font-size:clamp(.95rem,2.8vw,1.1rem);color:#adb5bd;margin-top:2px}
  .fr-ins .gap{display:inline-block;min-width:2.6em;border-bottom:3px solid #ffd43b;margin:0 3px}
  .fr-ed{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:clamp(1rem,2.9vw,1.2rem);background:#151827;border-radius:12px;padding:8px 0;line-height:1.75}
  .fr-ed .ln{display:flex;white-space:pre}.fr-ed .ln i{width:2.2em;text-align:right;padding-right:.8em;color:#5c6378;font-style:normal;flex:none}
  .fr-ed .cm{color:#8ce99a;white-space:normal}.fr-ed .sel{color:#ffa94d}.fr-ed .pr{color:#74c0fc}
  .fr-ed .blank{display:inline-block;min-width:4.5em;background:#fff3bf;color:#1d2340;border-radius:6px;padding:0 6px;font-weight:900}
  .fr-ed .blank.ok{background:#b2f2bb}.fr-ed .blank.no{background:#ffc9c9;text-decoration:line-through}
  .fr-ed .blank.typing:after{content:'|';animation:frBlink .6s infinite}
  .fr-tip{font-size:.95rem;color:#adb5bd}
  .fr-pond{position:relative;flex:1;border-radius:18px;overflow:hidden;min-height:0;min-width:0;box-shadow:0 6px 0 rgba(0,0,0,.25)}
  @keyframes frBlink{50%{opacity:0}}`;

  EP.registerGame({
    id: 'frog', level: 14, icon: '🐸', title: 'Canal Froggy', titleZh: '運河青蛙',
    model: 'Flexbox Froggy（用程式碼把青蛙送到對的位置）',
    howZh: '看程式碼和句子，點選正確的荷葉：介系詞讓青蛙跳到箱子裡／上／下，月份就跳到對的月份荷葉！',
    howEn: 'Read the code, pick the right lily pad and the frog hops there: in/on/under, months, this/that and more!',
    skills: ['reading', 'sentence', 'listening', 'meaning'],
    start(ctx) {
      const root = ctx.root, kit = ctx.kit, diff = ctx.difficulty, items = ctx.items;
      root.style.background = 'linear-gradient(160deg,#2b8a3e,#0b7285)';
      root.appendChild(u.el('style', {}, CSS));
      const codeEl = u.el('div', { class: 'fr-code' }), pondEl = u.el('div', { class: 'fr-pond' });
      const wrap = u.el('div', { class: 'fr-wrap' }, codeEl, pondEl); root.appendChild(wrap);
      let idx = 0, R = null, phase = 'wait', t = 0, blank = null, results = [];
      const frog = { x: 0, y: 0, r: 30, face: 1, hop: null, spot: null, tongue: 0, think: 0 };
      const parts = kit.particles(); const ripples = [];
      const c = kit.canvas(pondEl, () => R && layoutRound()); const g = c.g;
      const lv14 = EP.levelWords(14);
      const monthItem = (i) => lv14.find((w) => w.word.toLowerCase() === MONTHS[(i + 12) % 12]);

      function sizeWrap() {
        const W = root.clientWidth || 390, H = root.clientHeight || 700; const land = W > H * 1.05;
        wrap.style.flexDirection = land ? 'row' : 'column';
        codeEl.style.width = land ? Math.min(460, Math.max(300, W * 0.38)) + 'px' : 'auto';
        codeEl.style.maxHeight = land ? 'none' : Math.round(H * 0.44) + 'px';
      }
      ctx.on(window, 'resize', sizeWrap); sizeWrap();

      /* ---------- round builders ---------- */
      function build(item, k) {
        const w = item.word.toLowerCase();
        const nOpt = diff === 'easy' ? 3 : 4;
        if (MONTHS.includes(w)) {
          const mi = MONTHS.indexOf(w); let v = diff === 'easy' ? 'listen' : ['listen', 'after', 'before'][k % 3];
          if (v === 'after' && mi === 0) v = 'before'; if (v === 'before' && mi === 11) v = 'after';
          const ref = v === 'after' ? monthItem(mi - 1) : v === 'before' ? monthItem(mi + 1) : null;
          const order = diff === 'hard' ? u.shuffle(MONTHS.map((_, i) => i)) : MONTHS.map((_, i) => i);
          const opts = order.map((i) => ({ label: monthItem(i) ? monthItem(i).word : MONTHS[i], i }));
          const en = v === 'listen' ? 'Hop to the month you hear!' : `Which month comes ${v} ${ref.word}?`;
          const zh = v === 'listen' ? (diff === 'easy' ? `跳到你聽到的月份（${item.zh}）` : '跳到你聽到的月份') : `${ref.zh}的${v === 'after' ? '下一個' : '前一個'}月是哪個月？`;
          return { type: 'month', v, opts, correct: opts.findIndex((o) => o.i === mi), en, zh, comment: en, sel: '#frog', prop: 'hop-to', speak: () => (v === 'listen' ? ctx.say(item) : ctx.sayText(en)) };
        }
        if (['in', 'on', 'under'].includes(w)) {
          const opts = ['in', 'on', 'under'].map((p) => ({ label: p, place: p }));
          return { type: 'place', target: w, opts, correct: opts.findIndex((o) => o.place === w), en: 'The frog is ___ the box.', zh: '看虛線青蛙在哪裡，選出正確的字', comment: 'The frog is ___ the box.', sel: '#frog', prop: 'position', speak: () => ctx.sayText('The frog is ... the box.') };
        }
        if (['this', 'that', 'these', 'those'].includes(w)) {
          const near = w === 'this' || w === 'these', many = w === 'these' || w === 'those';
          let words = ['this', 'that', 'these', 'those'];
          if (diff === 'easy') words = many ? ['these', 'those'] : ['this', 'that'];
          const opts = u.shuffle(words).map((x) => ({ label: x }));
          const sent = many ? '___ are my apples.' : '___ is my apple.';
          return { type: 'point', near, many, other: u.randInt(0, 1) === 1, opts, correct: opts.findIndex((o) => o.label === w), en: sent, zh: '看箭頭：近還是遠？一個還是很多個？', comment: sent, sel: '#frog', prop: 'point-at', speak: () => ctx.sayText(sent.replace('___', '...')) };
        }
        const cz = EP.cloze(item);
        const ds = ctx.distractors(item, nOpt - 1);
        const opts = u.shuffle([item].concat(ds)).map((x) => ({ label: cz && x === item ? cz.text.toLowerCase() === x.word.toLowerCase() ? cz.text : x.word : x.word, item: x }));
        if (cz) {
          const s = item.sentence, before = s.slice(0, cz.start), after = s.slice(cz.start + cz.text.length);
          const startCap = cz.start === 0;
          opts.forEach((o) => { if (startCap) o.label = o.label.charAt(0).toUpperCase() + o.label.slice(1); });
          return { type: 'cloze', opts, correct: opts.findIndex((o) => o.item === item), en: before + '___' + after, zh: item.sentenceZh, comment: before + '___' + after, sel: '.sentence', prop: 'missing-word', speak: () => ctx.sayText(before + ' ... ' + after) };
        }
        return { type: 'cloze', opts, correct: opts.findIndex((o) => o.item === item), en: 'Hop to the word you hear!', zh: '跳到你聽到的字', comment: 'Hop to the word you hear!', sel: '#frog', prop: 'hop-to', speak: () => ctx.say(item) };
      }

      /* ---------- code panel ---------- */
      function renderCode() {
        const ins = u.el('b', {}); const parts2 = R.en.split('___');
        parts2.forEach((p, i) => { ins.append(p); if (i < parts2.length - 1) ins.append(u.el('span', { class: 'gap' }, ' ')); });
        blank = u.el('span', { class: 'blank' }, ' ');
        codeEl.innerHTML = '';
        codeEl.append(
          u.el('div', { class: 'fr-head' }, '🐸 Canal Froggy', u.el('span', { style: { color: '#adb5bd', fontWeight: 800 } }, `Level ${idx + 1} of ${items.length}`),
            u.el('div', { class: 'fr-dots' }, items.map((_, i) => u.el('i', { class: i === idx ? 'cur' : results[i] === true ? 'ok' : results[i] === false ? 'no' : '' })))),
          u.el('div', { class: 'fr-ins' }, u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: () => R.speak() }, '🔊'), u.el('div', {}, ins, u.el('small', { class: 'zh' }, R.zh))),
          u.el('div', { class: 'fr-ed' },
            u.el('div', { class: 'ln' }, u.el('i', {}, '1'), u.el('span', { class: 'cm' }, `/* ${R.comment} */`)),
            u.el('div', { class: 'ln' }, u.el('i', {}, '2'), u.el('span', { class: 'sel' }, R.sel), ' {'),
            u.el('div', { class: 'ln' }, u.el('i', {}, '3'), u.el('span', { class: 'pr', style: { paddingLeft: '1.5em' } }, R.prop), ': ', blank, ';'),
            u.el('div', { class: 'ln' }, u.el('i', {}, '4'), '}')),
          u.el('div', { class: 'fr-tip' }, '👉 Tap a lily pad 點一片荷葉'));
      }
      function typeCode(text, cls) {
        blank.className = 'blank typing'; blank.textContent = '';
        [...text].forEach((ch, i) => ctx.timeout(() => { blank.textContent += ch; EP.sfx.tick(); if (i === text.length - 1) blank.className = 'blank' + (cls ? ' ' + cls : ''); }, 40 + i * 45));
      }

      /* ---------- pond layout ---------- */
      function layoutRound() {
        const W = c.w, H = c.h; const m = Math.min(W, H);
        frog.r = u.clamp(m * 0.065, 20, 38);
        R.bankH = R.type === 'point' ? H * 0.24 : H * 0.13;
        R.start = R.type === 'point' ? { x: W * 0.62, y: H - frog.r * 1.5 } : { x: W * 0.5, y: H - frog.r * 1.35 };
        const n = R.opts.length;
        if (R.type === 'month') {
          const cols = W > H * 1.1 ? 6 : W > 560 ? 4 : 3, rows = 12 / cols;
          const top = R.bankH + 6, bottom = H - frog.r * 3.1; const cw = W / cols, ch = (bottom - top) / rows;
          const rx = Math.min(cw * 0.46, ch * 0.9, 96), ry = Math.min(rx * 0.62, ch * 0.44);
          R.opts.forEach((o, i) => Object.assign(o, { x: cw * (i % cols + 0.5), y: top + ch * (Math.floor(i / cols) + 0.5), rx, ry }));
        } else {
          const two = W / n < 100 && n > 2; const per = two ? Math.ceil(n / 2) : n;
          const rowY = R.type === 'place' ? [H * 0.68, H * 0.82] : R.type === 'point' ? [H * 0.4, H * 0.62] : two ? [H * 0.36, H * 0.6] : [H * 0.48];
          const rx = Math.min(W / per * 0.42, 90), ry = Math.min(rx * 0.6, two ? (rowY[1] - rowY[0]) * 0.42 : 99);
          R.opts.forEach((o, i) => { const row = two ? Math.floor(i / per) : 0, col = two ? i % per : i; const cnt = two && row === 1 ? n - per : per; Object.assign(o, { x: W * (col + 0.5) / cnt, y: rowY[Math.min(row, rowY.length - 1)] + (two ? 0 : Math.sin(i * 2.1) * ry * 0.4), rx, ry }); });
        }
        R.opts.forEach((o) => { let F = u.clamp(o.rx * 0.42, 18, 28); g.font = `900 ${F}px 'Baloo 2',sans-serif`; const tw = g.measureText(o.label).width; if (tw > o.rx * 1.75) F = Math.max(14, F * o.rx * 1.75 / tw); o.F = F; });
        if (R.type === 'place') {
          const bw = Math.min(W * 0.36, 180), bh = bw * 0.5, ground = H * 0.53, brH = frog.r * 1.9;
          R.box = { x: W * 0.5, w: bw, h: bh, ground, bottom: ground - brH, top: ground - brH - bh };
          R.spots = { in: { x: W * 0.5, y: R.box.top + frog.r * 0.15 }, on: { x: W * 0.5, y: R.box.top - frog.r * 0.78 }, under: { x: W * 0.5, y: ground - frog.r * 0.8 } };
        }
        if (R.type === 'point') {
          R.groups = { near: { x: W * 0.22, y: H - frog.r * 1.7, s: frog.r * 1.2 }, far: { x: W * 0.72, y: R.bankH - frog.r * 0.75, s: frog.r * 0.9 } };
          R.counts = { near: R.near ? (R.many ? 3 : 1) : (R.other ? 3 : 1), far: !R.near ? (R.many ? 3 : 1) : (R.other ? 3 : 1) };
        }
        if (!frog.hop && phase !== 'hop') { if (frog.spot && R.spots) Object.assign(frog, R.spots[frog.spot]); else if (!frog.spot && frog.home !== 'pad') { frog.x = R.start.x; frog.y = R.start.y; } }
      }

      /* ---------- flow ---------- */
      function newRound() {
        if (idx >= items.length) return finish();
        ctx.hud.progress(idx / items.length);
        const item = items[idx]; R = build(item, idx); R.item = item;
        frog.spot = null; frog.home = null; frog.hop = null; frog.think = 0;
        renderCode(); layoutRound(); frog.x = R.start.x; frog.y = R.start.y;
        phase = 'choose';
        if (R.type === 'month' && R.v === 'listen') ctx.timeout(() => ctx.say(item), 400);
      }
      function destOf(i) {
        const o = R.opts[i];
        if (R.type === 'place') return Object.assign({ spot: o.place }, R.spots[o.place]);
        return { x: o.x, y: o.y - o.ry * 0.25, pad: i };
      }
      function hopTo(d, dur) {
        frog.face = d.x >= frog.x ? 1 : -1; frog.spot = null; frog.home = null;
        frog.hop = { fx: frog.x, fy: frog.y, tx: d.x, ty: d.y, t: 0, dur: dur || 0.55, d }; EP.sfx.jump();
      }
      function landed(d) {
        frog.spot = d.spot || null; frog.home = d.pad != null ? 'pad' : null;
        ripples.push({ x: d.x, y: d.y + frog.r * 0.6, t: 0 });
        if (d.pad != null) R.opts[d.pad].bob = 1;
      }
      function choose(i) {
        if (phase !== 'choose' || !R.opts[i]) return;
        phase = 'hop'; const ok = i === R.correct; const item = R.item;
        R.opts[i].tap = 1; EP.sfx.click();
        typeCode(R.opts[i].label);
        hopTo(destOf(i));
        ctx.timeout(async () => {
          const res = ctx.answer(item, ok, { x: frog.x + pondEl.offsetLeft, y: frog.y + pondEl.offsetTop - frog.r * 2 });
          results[idx] = ok; blank.classList.add(ok ? 'ok' : 'no');
          if (ok) {
            frog.tongue = 1; parts.burst(frog.x, frog.y - frog.r, null, 26, 260); EP.sfx.combo(Math.max(1, res.combo));
            ctx.say(item, { sentence: R.type === 'cloze' });
            await ctx.wait(1500);
          } else {
            frog.think = 1.4; if (frog.home === 'pad') R.opts[i].sink = 1; EP.sfx.wrong();
            await ctx.wait(700); await ctx.reveal(item, { sentence: R.type === 'cloze' });
            R.opts[R.correct].glow = 1; typeCode(R.opts[R.correct].label, 'ok'); hopTo(destOf(R.correct));
            await ctx.wait(1200);
          }
          idx++; newRound();
        }, 650);
      }
      function finish() { phase = 'done'; ctx.hud.progress(1); ctx.end(); }
      ctx.on(c.cv, 'pointerdown', (e) => {
        if (phase !== 'choose' || ctx.paused) return;
        const r = c.cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        let best = -1, bd = 1e9;
        R.opts.forEach((o, i) => { const d = ((x - o.x) / (o.rx + 10)) ** 2 + ((y - o.y) / (o.ry + 14)) ** 2; if (d < 1 && d < bd) { bd = d; best = i; } });
        if (best >= 0) choose(best);
      });

      /* ---------- drawing ---------- */
      function drawFrog(x, y, r, o) {
        o = o || {};
        g.save(); g.translate(x, y); g.scale((o.face || 1) * (o.sx || 1), o.sy || 1);
        if (o.ghost) { g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,255,255,.95)'; g.fillStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; }
        else { g.fillStyle = '#51cf66'; g.strokeStyle = '#2b8a3e'; g.lineWidth = 3; }
        g.beginPath(); g.ellipse(0, 0, r, r * 0.78, 0, 0, 6.3); g.fill(); g.stroke();
        for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * r * 0.45, -r * 0.7, r * 0.34, 0, 6.3); g.fill(); g.stroke(); }
        if (!o.ghost) {
          g.fillStyle = '#b2f2bb'; g.beginPath(); g.ellipse(0, r * 0.25, r * 0.6, r * 0.42, 0, 0, 6.3); g.fill();
          for (const sx of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(sx * r * 0.45, -r * 0.72, r * 0.22, 0, 6.3); g.fill(); g.fillStyle = '#1d2340'; g.beginPath(); g.arc(sx * r * 0.45 + r * 0.06, -r * 0.7, r * 0.11, 0, 6.3); g.fill(); }
          g.fillStyle = 'rgba(255,135,170,.6)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * 0.62, -r * 0.08, r * 0.14, r * 0.08, 0, 0, 6.3); g.fill(); }
          g.strokeStyle = '#1d2340'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, -r * 0.2, r * 0.32, 0.25, Math.PI - 0.25); g.stroke();
          g.fillStyle = '#40c057'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * 0.55, r * 0.7, r * 0.3, r * 0.14, 0, 0, 6.3); g.fill(); }
        }
        g.restore();
      }
      function drawPad(o) {
        const bob = Math.sin(t * 2 + o.x * 0.05) * 2, sink = o.sink ? o.sink * 6 : 0;
        const x = o.x, y = o.y + bob + sink;
        g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x + 3, y + 5, o.rx, o.ry, 0, 0, 6.3); g.fill();
        g.fillStyle = o.glow ? '#ffe066' : o.tap ? '#8ce99a' : '#5cb85c'; g.strokeStyle = '#2b8a3e'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, o.rx, o.ry, 0, -1.25, 4.95); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(43,138,62,.5)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = 5.2 + k * 0.9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * o.rx * 0.8, y + Math.sin(a) * o.ry * 0.8); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.92)'; kit.roundRect(g, x - o.rx * 0.88, y - o.F * 0.62, o.rx * 1.76, o.F * 1.3, 8); g.fill();
        kit.text(g, o.label, x, y + 1, o.F, '#1d4d1f');
        if (o.glow) { g.strokeStyle = `rgba(255,212,59,${0.6 + Math.sin(t * 8) * 0.4})`; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, o.rx + 8, o.ry + 8, 0, 0, 6.3); g.stroke(); }
      }
      function drawHouses(H0) {
        const W = c.w; const hw = Math.max(34, W / 14); let i = 0;
        for (let x = 0; x < W; x += hw, i++) {
          const h = H0 * (0.7 + ((i * 37) % 5) * 0.06), col = HOUSES[i % HOUSES.length], y = H0 - h;
          g.fillStyle = col; g.fillRect(x, y + hw * 0.35, hw - 2, h - hw * 0.35);
          g.beginPath(); if (i % 2) { g.moveTo(x, y + hw * 0.36); g.lineTo(x + hw / 2 - 1, y); g.lineTo(x + hw - 2, y + hw * 0.36); } else { g.moveTo(x, y + hw * 0.36); g.lineTo(x + hw * 0.2, y + hw * 0.36); g.lineTo(x + hw * 0.2, y + hw * 0.12); g.lineTo(x + hw * 0.78, y + hw * 0.12); g.lineTo(x + hw * 0.78, y + hw * 0.36); g.lineTo(x + hw - 2, y + hw * 0.36); } g.fill();
          g.fillStyle = 'rgba(255,255,255,.85)'; for (let wy = y + hw * 0.5; wy < H0 - hw * 0.35; wy += hw * 0.45) for (const wx of [0.2, 0.58]) g.fillRect(x + hw * wx, wy, hw * 0.2, hw * 0.25);
        }
        g.fillStyle = '#868e96'; g.fillRect(0, H0 - 4, W, 6);
      }
      function drawBox(part) {
        const b = R.box, x0 = b.x - b.w / 2;
        if (part === 'back') {
          g.fillStyle = '#e9c46a'; g.beginPath(); g.ellipse(b.x, b.ground + 8, b.w * 0.85, Math.max(12, b.h * 0.22), 0, 0, 6.3); g.fill(); g.fillStyle = '#f4d58d'; g.beginPath(); g.ellipse(b.x, b.ground + 4, b.w * 0.75, Math.max(8, b.h * 0.14), 0, 0, 6.3); g.fill();
          g.fillStyle = '#a5502e'; for (const sx of [-1, 1]) { g.fillRect(b.x + sx * b.w * 0.36 - b.w * 0.09, b.bottom, b.w * 0.18, b.ground - b.bottom); }
          g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (const sx of [-1, 1]) for (let yy = b.bottom + 8; yy < b.ground; yy += 10) { g.beginPath(); g.moveTo(b.x + sx * b.w * 0.36 - b.w * 0.09, yy); g.lineTo(b.x + sx * b.w * 0.36 + b.w * 0.09, yy); g.stroke(); }
          g.fillStyle = '#6b4423'; g.beginPath(); g.ellipse(b.x, b.top, b.w / 2, b.h * 0.14, 0, 0, 6.3); g.fill();
        } else {
          g.fillStyle = '#d4a066'; g.strokeStyle = '#8a5a2b'; g.lineWidth = 3; g.fillRect(x0, b.top, b.w, b.h); g.strokeRect(x0, b.top, b.w, b.h);
          g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(b.x - b.w * 0.07, b.top, b.w * 0.14, b.h);
          g.fillStyle = '#c08a52'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(b.x + sx * b.w / 2, b.top); g.lineTo(b.x + sx * b.w * 0.72, b.top - b.h * 0.32); g.lineTo(b.x + sx * b.w * 0.42, b.top - b.h * 0.3); g.lineTo(b.x + sx * b.w * 0.3, b.top); g.closePath(); g.fill(); g.stroke(); }
          kit.text(g, 'BOX', b.x, b.top + b.h * 0.55, Math.max(14, b.h * 0.3), 'rgba(90,50,20,.6)');
        }
      }
      function frogDraw() {
        let x = frog.x, y = frog.y, sx = 1, sy = 1;
        if (frog.hop) { const k = Math.min(1, frog.hop.t / frog.hop.dur); x = frog.hop.fx + (frog.hop.tx - frog.hop.fx) * k; y = frog.hop.fy + (frog.hop.ty - frog.hop.fy) * k - Math.sin(k * Math.PI) * frog.r * 3; sx = 0.9; sy = 1.15; }
        drawFrog(x, y, frog.r, { face: frog.face, sx, sy });
        if (frog.tongue > 0) { const k = Math.sin((1 - frog.tongue) * Math.PI); g.strokeStyle = '#ff6b9a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - frog.r * 0.15); g.lineTo(x + frog.face * frog.r * 2.2 * k, y - frog.r * 1.6 * k); g.stroke(); kit.emoji(g, '⭐', x + frog.face * frog.r * 2.2 * k, y - frog.r * 1.6 * k, frog.r * 0.8); }
        if (frog.think > 0) kit.emoji(g, '❓', x + frog.r, y - frog.r * 1.6, frog.r * 0.9);
      }

      ctx.loop((dt) => {
        t += dt; parts.update(dt);
        const W = c.w, H = c.h; g.clearRect(0, 0, W, H);
        if (!R) return;
        const wg = g.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, '#3aa6d0'); wg.addColorStop(1, '#1b6f96'); g.fillStyle = wg; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = R.bankH + (H - R.bankH) * (i + 0.5) / 6; g.beginPath(); for (let x = 0; x <= W; x += 24) g.lineTo(x, y + Math.sin(x * 0.03 + t * 1.5 + i) * 3); g.stroke(); }
        drawHouses(R.bankH);
        if (R.type === 'point') { g.fillStyle = '#8ce99a'; g.fillRect(0, H - frog.r * 3, W, frog.r * 3); g.fillStyle = '#69db7c'; g.fillRect(0, H - frog.r * 3, W, 5); kit.emoji(g, '🚲', W * 0.12, R.bankH - frog.r * 0.4, frog.r * 0.9); }
        else { g.fillStyle = '#6b4423'; kit.roundRect(g, R.start.x - frog.r * 1.6, R.start.y + frog.r * 0.35, frog.r * 3.2, frog.r * 0.7, frog.r * 0.35); g.fill(); g.fillStyle = '#8a5a2b'; g.beginPath(); g.ellipse(R.start.x + frog.r * 1.6, R.start.y + frog.r * 0.7, frog.r * 0.2, frog.r * 0.35, 0, 0, 6.3); g.fill(); }
        kit.emoji(g, '🌷', W * 0.06, H - frog.r * 0.8, frog.r * 1.1); kit.emoji(g, '🌷', W * 0.94, H - frog.r * 0.9, frog.r);
        for (let i = ripples.length - 1; i >= 0; i--) { const rp = ripples[i]; rp.t += dt; if (rp.t > 1) { ripples.splice(i, 1); continue; } g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - rp.t)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(rp.x, rp.y, frog.r * (0.8 + rp.t * 2), frog.r * (0.3 + rp.t * 0.7), 0, 0, 6.3); g.stroke(); }
        for (const o of R.opts) { o.tap = Math.max(0, (o.tap || 0) - dt * 2); o.sink = o.sink ? Math.max(0, o.sink - dt * 0.6) : 0; drawPad(o); }
        if (R.type === 'point') {
          for (const k of ['near', 'far']) {
            const gp = R.groups[k], n = R.counts[k]; const tgt = (k === 'near') === R.near;
            if (tgt) { g.strokeStyle = `rgba(255,212,59,${0.6 + Math.sin(t * 6) * 0.35})`; g.lineWidth = 5; g.beginPath(); g.ellipse(gp.x, gp.y, gp.s * 1.9, gp.s * 1.1, 0, 0, 6.3); g.stroke(); kit.emoji(g, '⬇️', gp.x, gp.y - gp.s * 1.9 + Math.sin(t * 6) * 5, gp.s); }
            const pts = n === 1 ? [[0, 0]] : [[-0.6, 0.15], [0.6, 0.15], [0, -0.45]];
            for (const [ax, ay] of pts) kit.emoji(g, '🍎', gp.x + ax * gp.s, gp.y + ay * gp.s, gp.s);
          }
          kit.text(g, 'near 近', R.groups.near.x + R.groups.near.s * 1.4, R.groups.near.y + 2, 16, '#1d4d1f', { align: 'left', stroke: '#fff', strokeW: 4 });
          kit.text(g, 'far 遠', R.groups.far.x - R.groups.far.s * 1.5, R.groups.far.y + 2, 16, '#1d2340', { align: 'right', stroke: '#fff', strokeW: 4 });
        }
        if (frog.hop) { frog.hop.t += dt; if (frog.hop.t >= frog.hop.dur) { const d = frog.hop.d; frog.x = d.x; frog.y = d.y; frog.hop = null; landed(d); } }
        frog.tongue = Math.max(0, frog.tongue - dt * 1.6); frog.think = Math.max(0, frog.think - dt);
        if (R.type === 'place') {
          const ghost = R.spots[R.target];
          drawBox('back');
          if (R.target === 'in') drawFrog(ghost.x, ghost.y, frog.r, { ghost: true });
          if (frog.spot === 'in' && !frog.hop) frogDraw();
          drawBox('front');
          if (R.target !== 'in') drawFrog(ghost.x, ghost.y, frog.r, { ghost: true });
          if (frog.spot !== 'in' || frog.hop) frogDraw();
        } else frogDraw();
        parts.draw(g);
      });

      newRound();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { if (phase === 'choose') choose(R.correct); },
          wrong() { if (phase === 'choose') choose((R.correct + 1) % R.opts.length); },
        },
      };
    },
  });
})();
