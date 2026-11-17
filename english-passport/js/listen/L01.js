/* Sentence Listening — Level 1 (Animals · Transportation): SCENE_SEARCH, CONVEYOR_TAP, BINGO
 * Reference implementation for the other 72 games: L.stage → L.listenBar → task → L.feedback, T hooks for tests. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;
  L.css('L01', `
.l01a-scene{position:relative;width:100%;height:100%;min-height:260px;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 20% 80%,#2b4a2f,#16261a 60%,#0b140d);box-shadow:inset 0 0 0 4px rgba(255,255,255,.15);touch-action:none}
.l01a-dark{position:absolute;inset:0;pointer-events:none;z-index:2}
.l01a-item{position:absolute;transform:translate(-50%,-50%);border:0;background:transparent;cursor:pointer;padding:6px;border-radius:16px;z-index:1}
.l01a-item .ls-emoji{font-size:clamp(2.4rem,7vw,3.6rem)}
.l01a-found{background:rgba(64,192,87,.85)!important;z-index:3}
.l01a-miss{background:rgba(250,82,82,.85)!important;z-index:3}
.l01b-road{position:relative;width:100%;height:min(46vh,320px);margin-top:auto;border-top:6px dashed #ffd43b;overflow:hidden}
.l01b-sign{position:absolute;left:18px;top:-6px;font-size:3rem}
.l01b-car{position:absolute;left:0;top:28%;border:0;background:#fff;border-radius:20px;padding:10px 14px;box-shadow:0 6px 0 rgba(0,0,0,.25);cursor:pointer;will-change:transform}
.l01b-car .ls-emoji{font-size:clamp(2.6rem,7vw,3.6rem)}
.l01c-card{display:grid;grid-template-columns:repeat(3,clamp(64px,min(15vh,22vw),130px));gap:8px;background:#fff;padding:10px;border-radius:20px;box-shadow:0 8px 0 rgba(0,0,0,.2)}
.l01c-cell{aspect-ratio:1;border:3px solid #e5dbff;border-radius:14px;background:#f8f5ff;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative}
.l01c-cell .ls-emoji{font-size:clamp(2rem,6vw,3rem)}
.l01c-marked{background:#d3f9d8;border-color:#2f9e44}
.l01c-marked::after{content:'✔';position:absolute;right:4px;top:0;color:#2f9e44;font-weight:900;font-size:1.3rem}
.l01c-line{box-shadow:0 0 0 4px #fcc419 inset}
`);

  /* L01a Night Zoo Flashlight — find what the sentence is about in a dark scene */
  L.register({
    id: 'L01a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 30%,#1b2b4a,#05070f 75%)' });
      const scene = u.el('div', { class: 'l01a-scene', role: 'group', 'aria-label': 'Night zoo 夜間動物園' });
      const dark = u.el('div', { class: 'l01a-dark', 'aria-hidden': 'true' });
      st.body.append(scene); scene.appendChild(dark);
      const radius = ctx.difficulty === 'easy' ? 150 : ctx.difficulty === 'hard' ? 80 : 110;
      const setLight = (x, y) => { dark.style.background = `radial-gradient(circle ${radius}px at ${x}px ${y}px, rgba(0,0,0,0) 0, rgba(0,0,0,0) 70%, rgba(3,5,12,.94) 100%)`; };
      ctx.on(scene, 'pointermove', (e) => { const r = scene.getBoundingClientRect(); setLight(e.clientX - r.left, e.clientY - r.top); });
      ctx.on(scene, 'pointerdown', (e) => { const r = scene.getBoundingClientRect(); setLight(e.clientX - r.left, e.clientY - r.top); });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🔦 聽廣播，用手電筒找到句子說的動物或車子，點它！', 'Find what the sentence is about and tap it.'), L.listenBar(ctx, item));
        scene.querySelectorAll('.ls-item').forEach((b) => b.remove());
        const n = ctx.difficulty === 'easy' ? 4 : ctx.difficulty === 'hard' ? 8 : 6;
        const opts = u.shuffle([item].concat(L.others(ctx, item, n - 1, { needPic: true })));
        // spread the items on a jittered grid so they never overlap
        const cols = Math.ceil(Math.sqrt(opts.length * 1.6)), rows = Math.ceil(opts.length / cols);
        const cells = u.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, opts.length);
        let answered = false;
        const pick = (w, b) => {
          if (answered) return; answered = true;
          b.classList.add(w === item ? 'l01a-found' : 'l01a-miss');
          const r = b.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect();
          L.feedback(ctx, item, w === item, { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }).then(done);
        };
        const btns = opts.map((w, i) => {
          const c = cells[i]; const cx = (c % cols + 0.5 + u.rand(-0.2, 0.2)) / cols, cy = (Math.floor(c / cols) + 0.5 + u.rand(-0.15, 0.15)) / rows;
          const b = u.el('button', { class: 'ls-item l01a-item', style: { left: cx * 100 + '%', top: cy * 100 + '%' }, 'aria-label': w.zh }, L.face(w));
          ctx.on(b, 'click', () => pick(w, b)); scene.insertBefore(b, dark); return b;
        });
        const r = scene.getBoundingClientRect(); setLight(r.width / 2, r.height / 2);
        T.set(() => pick(item, btns[opts.indexOf(item)]), () => { const k = opts.findIndex((w) => w !== item); pick(opts[k], btns[k]); });
      }));
      return { test: T.api };
    },
  });

  /* L01b Bus Stop Announcer — things drive past; tap the one in the announcement before it leaves */
  L.register({
    id: 'L01b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(#8fd3ff 0%,#c9ecff 45%,#7c8a99 45%,#59636e 100%)' });
      const road = u.el('div', { class: 'l01b-road', role: 'group', 'aria-label': 'Road 馬路' });
      const sign = u.el('div', { class: 'l01b-sign', 'aria-hidden': 'true' }, '🚏');
      st.body.append(road); road.appendChild(sign);
      const speed = ctx.difficulty === 'easy' ? 70 : ctx.difficulty === 'hard' ? 140 : 100; // px / s
      let movers = []; let finish = null;
      ctx.loop((dt) => {
        const w = road.clientWidth;
        for (const m of movers) {
          if (m.gone) continue;
          m.x -= speed * dt * ctx.speed; m.el.style.transform = `translateX(${m.x}px)`;
          if (m.x < -140) { m.gone = true; m.el.remove(); if (m.target && finish) finish(null, null); }
        }
        if (movers.length && movers.every((m) => m.gone) && finish) finish(null, null);
        void w;
      });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🚏 聽廣播，在車子開走前點「句子說的那一個」！', 'Tap the one in the announcement before it leaves.'), bar);
        road.querySelectorAll('.ls-item').forEach((b) => b.remove());
        const others = L.others(ctx, item, 3, { needPic: true });
        const queue = u.shuffle(others).slice(0, 3); queue.splice(u.randInt(1, 2), 0, item);
        const w = road.clientWidth || 600; const gap = ctx.difficulty === 'hard' ? 170 : 210;
        movers = queue.map((wd, i) => {
          const b = u.el('button', { class: 'ls-item l01b-car', 'aria-label': wd.zh }, L.face(wd));
          road.appendChild(b); const m = { el: b, w: wd, x: w + 40 + i * gap, target: wd === item, gone: false };
          b.style.transform = `translateX(${m.x}px)`; ctx.on(b, 'click', () => finish && finish(wd, b)); return m;
        });
        let answered = false;
        finish = (wd, b) => {
          if (answered) return; answered = true; finish = null;
          const ok = wd === item; const r = b ? b.getBoundingClientRect() : null; const sr = ctx.root.getBoundingClientRect();
          if (b) b.classList.add(ok ? 'l01a-found' : 'l01a-miss');
          movers.forEach((m) => (m.gone = m.gone || !ok));
          L.feedback(ctx, item, ok, { x: r ? r.left - sr.left + r.width / 2 : sr.width / 2, y: r ? r.top - sr.top : sr.height / 2, wrongText: wd ? 'Not that one 不是這個' : 'It left! 車子開走了' }).then(() => { movers.forEach((m) => m.el.remove()); movers = []; done(); });
        };
        bar.play(false); // traffic starts with the announcement
        T.set(() => { const m = movers.find((x) => x.target); finish && finish(m.w, m.el); }, () => { const m = movers.find((x) => !x.target); finish && finish(m.w, m.el); });
      }));
      return { test: T.api };
    },
  });

  /* L01c Animal Bingo — mark the called picture if it is on your card; make lines */
  L.register({
    id: 'L01c',
    roundSize: 9,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#5f3dc4,#9775fa)' });
      const calls = ctx.items;
      // card: about two thirds of the called items + other pictures from this level
      const onCard = u.shuffle(calls).slice(0, Math.min(6, calls.length));
      const fill = L.others(ctx, calls[0], 22, { needPic: true, levelOnly: true }).filter((w) => !calls.includes(w));
      const card = u.shuffle(onCard.concat(fill).slice(0, 9));
      const grid = u.el('div', { class: 'l01c-card', role: 'grid', 'aria-label': 'Bingo card 賓果卡' });
      const cells = card.map((w) => { const b = u.el('button', { class: 'ls-cell l01c-cell', 'aria-label': w.zh }, L.face(w)); grid.appendChild(b); return { w, b, marked: false }; });
      const none = u.el('button', { class: 'btn big', style: { background: '#fff', color: '#5f3dc4' } }, '🙅 Not on my card 卡上沒有');
      const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      const won = new Set();
      st.body.append(grid); st.foot.append(none);
      L.rounds(ctx, calls, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎯 聽老師念句子：卡上有那張圖就點它，沒有就按「卡上沒有」。', 'Mark the picture if it is on your card.'), L.listenBar(ctx, item));
        const here = cells.find((c) => c.w === item);
        let answered = false;
        const pick = (c) => {
          if (answered) return; answered = true; offs.forEach((f) => f());
          const ok = c ? c === here : !here;
          if (ok && c) { c.marked = true; c.b.classList.add('l01c-marked'); c.b.setAttribute('aria-pressed', 'true'); }
          let bonus = 0;
          lines.forEach((ln, k) => { if (!won.has(k) && ln.every((i) => cells[i].marked)) { won.add(k); bonus += 300; ln.forEach((i) => cells[i].b.classList.add('l01c-line')); } });
          L.feedback(ctx, item, ok, { points: 100 + bonus, wrongText: here ? 'It is on your card! 卡上有喔' : 'Not on your card 卡上沒有' }).then(() => { if (bonus) { ctx.burst('BINGO! 賓果！'); EP.sfx.combo(5); } done(); });
        };
        const offs = cells.filter((c) => !c.marked).map((c) => { const f = () => pick(c); c.b.addEventListener('click', f); return () => c.b.removeEventListener('click', f); });
        const fn = () => pick(null); none.addEventListener('click', fn); offs.push(() => none.removeEventListener('click', fn));
        T.set(() => pick(here || null), () => pick(here ? null : cells.find((c) => !c.marked) || null));
      }));
      return { test: T.api };
    },
  });
})();
