/* Sentence Listening — Level 18 (Things at home & school 家裡與學校的東西): PUZZLE_REVEAL, SHOOT, MEMORY_CHAIN
 * L18a Mystery Picture · L18b Hoop Shot · L18c Memory Chain.
 * Audio rule: only the official sentences (and, for the mystery picture, its official word) are played. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (local to this level) ---------- */
  const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const inSent = (item, w) => [w.word, L.keyText(w)].some((x) => {
    x = String(x).replace('...', '').trim(); if (!x) return false;
    return new RegExp('(^|[^A-Za-z0-9\'-])' + esc(x) + '(s|es)?(?![A-Za-z0-9-])', 'i').test(item.sentence);
  });
  const lab = (w) => { const k = L.keyText(w); return /^[A-Z][a-z'-]+$/.test(k) && w.word[0] !== w.word[0].toUpperCase() ? k[0].toLowerCase() + k.slice(1) : k; };
  const others = (ctx, item, n, o) => {
    o = o || {}; const f = o.filter;
    return L.others(ctx, item, n, Object.assign({}, o, { filter: (w) => !inSent(item, w) && lab(w).toLowerCase() !== lab(item).toLowerCase() && (!o.difPic || !EP.pic(w) || EP.pic(w) !== EP.pic(item)) && (!f || f(w)) }));
  };
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 3 }; };
  const face = (w, zhOnly) => (zhOnly || !EP.pic(w) ? u.el('span', { class: 'ls-zhcard zh' }, w.zh) : L.face(w));
  /** a choice card: picture (or Chinese card) + Chinese caption on easy */
  const card = (w, zhOnly, easy) => u.el('span', { class: 'l18a-card' }, face(w, zhOnly), easy && !zhOnly ? u.el('span', { class: 'l18a-zh zh', 'aria-hidden': 'true' }, w.zh) : null);
  /** pause-aware tweens driven by ctx.loop */
  const tweener = (ctx) => {
    const list = new Set();
    ctx.loop((dt) => { for (const tw of Array.from(list)) { tw.t += dt * 1000; const k = Math.min(1, tw.t / tw.ms); tw.fn(k); if (k >= 1) { list.delete(tw); tw.res(); } } });
    return (ms, fn) => new Promise((res) => list.add({ t: 0, ms: RM() ? 1 : Math.max(1, ms), fn, res }));
  };

  L.css('L18', `
.l18a-card{display:flex;flex-direction:column;align-items:center;gap:2px}
.l18a-card .ls-emoji{font-size:clamp(2.3rem,6.5vw,3.1rem)}
.l18a-zh{font-size:.9rem;font-weight:800;color:#5c3d00}

.l18a-row{display:flex;gap:clamp(10px,3vw,28px);align-items:center;justify-content:center;width:100%;flex-wrap:wrap}
.l18a-puzzle{--s:clamp(150px,min(34vh,44vw),300px);position:relative;width:var(--s);height:var(--s);border-radius:20px;background:#fff9db;box-shadow:0 8px 0 rgba(0,0,0,.25),inset 0 0 0 6px #fab005;overflow:hidden;flex:none}
.l18a-pic{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--s) * .6);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l18a-cover{position:absolute;inset:6px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:0;perspective:600px}
.l18a-tile{border-radius:3px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:clamp(1.3rem,4vw,2rem);transition:transform .5s,opacity .5s;box-shadow:inset 0 0 0 3px rgba(255,255,255,.3),inset 0 -6px 0 rgba(0,0,0,.25)}
.l18a-open{transform:rotateY(90deg) scale(.4);opacity:0}
.l18a-panel{display:flex;flex-direction:column;align-items:center;gap:10px;flex:1 1 300px;max-width:560px;min-width:0}
.l18a-count{background:rgba(255,255,255,.94);color:#1d2340;border-radius:12px;padding:4px 12px;font-weight:900}
.l18a-choices{grid-template-columns:repeat(auto-fit,minmax(104px,1fr))}
.l18a-choices .ls-choice{min-height:96px}
.l18a-guess{display:flex;flex-direction:column;align-items:center;gap:2px}
.l18a-guess b{font-size:clamp(1rem,4vw,1.35rem);white-space:nowrap}
.l18a-result{background:#fff;color:#1d2340;border-radius:16px;padding:10px 16px;font-weight:900;font-size:1.2rem;text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.2)}

.l18b-court{position:relative;flex:1 1 auto;width:100%;min-height:clamp(290px,54vh,560px);border-radius:22px;overflow:hidden;background:radial-gradient(ellipse 34% 26% at 50% 104%,rgba(255,255,255,.22) 0 96%,transparent 100%),linear-gradient(180deg,#262a52 0,#363b74 36%,#c98a4f 36%,#a86b38 100%);box-shadow:inset 0 0 0 4px rgba(255,255,255,.18);touch-action:none;user-select:none}
.l18b-hoops{position:absolute;left:0;right:0;top:4%;display:flex;justify-content:space-around;align-items:flex-start;gap:6px;padding:0 8px}
.l18b-hoop{display:flex;flex-direction:column;align-items:center;border:0;background:transparent;padding:0;cursor:pointer;font:inherit;color:#1d2340;flex:1 1 0;max-width:200px;min-width:0}
.l18b-board{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:100%;min-height:clamp(62px,12vh,96px);background:#fff;border:4px solid #c92a2a;border-radius:10px;padding:4px 6px;font-weight:900;font-size:clamp(.95rem,3.3vw,1.45rem);box-shadow:0 5px 0 rgba(0,0,0,.3);overflow-wrap:anywhere;text-align:center;line-height:1.1}
.l18b-board .ls-emoji{font-size:1.7rem}
.l18b-rim{display:block;width:64%;height:10px;margin-top:2px;border-radius:6px;background:#f76707;box-shadow:0 3px 0 #a33e00}
.l18b-net{display:block;width:54%;height:clamp(26px,6vh,44px);background:repeating-linear-gradient(60deg,rgba(255,255,255,.85) 0 2px,transparent 2px 9px),repeating-linear-gradient(-60deg,rgba(255,255,255,.85) 0 2px,transparent 2px 9px);clip-path:polygon(0 0,100% 0,82% 100%,18% 100%);transform-origin:top}
.l18b-aim .l18b-board,.l18b-hoop:focus-visible .l18b-board{box-shadow:0 0 0 5px #ffd43b,0 5px 0 rgba(0,0,0,.3)}
.l18b-hoop:focus-visible{outline:none}
.l18b-swish .l18b-net{animation:l18b-net .5s}
@keyframes l18b-net{40%{transform:scaleY(1.4)}}
.l18b-good .l18b-board{background:#d3f9d8;border-color:#2b8a3e}
.l18b-bad .l18b-board{background:#ffe3e3}
.l18b-ball{position:absolute;left:0;top:0;width:clamp(62px,10vh,84px);height:clamp(62px,10vh,84px);display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:transparent;padding:0;font-size:clamp(2.9rem,7.6vh,3.9rem);line-height:1;cursor:grab;touch-action:none;z-index:4;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;will-change:transform}
.l18b-ball:focus-visible{outline:4px solid #ffd43b}
.l18b-arc{position:absolute;left:0;top:0;pointer-events:none;z-index:3;overflow:visible}
.l18b-tip{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);background:rgba(255,255,255,.95);color:#1d2340;font-weight:800;border-radius:12px;padding:3px 10px;font-size:.9rem;white-space:nowrap;z-index:2}
.l18b-call{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-weight:900;font-size:clamp(1.6rem,6vw,2.6rem);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.45);z-index:5;pointer-events:none;white-space:nowrap}

.l18c-chain{display:flex;align-items:stretch;justify-content:center;gap:clamp(6px,2vw,14px);width:100%;max-width:820px}
.l18c-card{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;color:#1d2340;border-radius:18px;padding:10px;box-shadow:0 5px 0 rgba(0,0,0,.25);min-height:92px;transition:transform .2s,box-shadow .2s}
.l18c-num{font-size:1.7rem;line-height:1}
.l18c-cap{font-weight:900}
.l18c-on{box-shadow:0 0 0 5px #ffd43b,0 5px 0 rgba(0,0,0,.25);transform:translateY(-4px)}
.l18c-asked{box-shadow:0 0 0 5px #f08c00,0 5px 0 rgba(0,0,0,.25)}
.l18c-text{font-weight:800;font-size:clamp(.95rem,2.6vw,1.15rem);text-align:center}
.l18c-text:empty{display:none}
.l18c-link{align-self:center;font-size:1.6rem}
.l18c-q{background:#fff3bf;color:#5c3d00;font-weight:900;border-radius:14px;padding:8px 16px;font-size:clamp(1.05rem,3.4vw,1.35rem);text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.2)}
.l18c-q:empty{display:none}
.l18c-choices{grid-template-columns:repeat(auto-fit,minmax(100px,1fr))}
.l18c-choices .ls-choice{min-height:100px}
.l18c-wait{color:#fff;font-weight:800;text-align:center}
`);

  /* ======================= L18a Mystery Picture (PUZZLE_REVEAL) ======================= */
  const TILE_BG = ['#364fc7', '#5f3dc4', '#a61e4d', '#1864ab', '#862e9c', '#087f5b', '#c92a2a', '#2b8a3e', '#5c3d99'];
  const FINAL = { final: true };
  L.register({
    id: 'L18a',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty; const easy = d === 'easy';
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#1098ad 60%,#3bc9db)' });
      const ids = new Set(ctx.items.map((w) => w.id)); const pics = new Set(ctx.items.map((w) => EP.pic(w)).filter(Boolean));
      const cand = ctx.pool.filter((w) => EP.pic(w) && !ids.has(w.id) && !pics.has(EP.pic(w)));
      const cand2 = EP.levelWords(ctx.level).filter((w) => EP.pic(w) && !ids.has(w.id));
      const mystery = u.pick(cand.length ? cand : cand2.length ? cand2 : ctx.items.filter((w) => EP.pic(w))) || ctx.items[0];
      const pic = u.el('div', { class: 'l18a-pic', 'aria-hidden': 'true' }, EP.pic(mystery) || mystery.zh);
      const tiles = TILE_BG.map((bg) => u.el('div', { class: 'l18a-tile', style: { background: bg } }, '?'));
      const puzzle = u.el('div', { class: 'l18a-puzzle', role: 'img', 'aria-label': 'Mystery picture 神秘圖片' }, pic, u.el('div', { class: 'l18a-cover', 'aria-hidden': 'true' }, tiles));
      const count = u.el('div', { class: 'l18a-count', role: 'status' }, '🧱 0 / 9');
      const panel = u.el('div', { class: 'l18a-panel' });
      st.body.append(u.el('div', { class: 'l18a-row' }, u.el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }, puzzle, count), panel));
      const open = new Set();
      const openTile = () => {
        const closed = tiles.map((_, i) => i).filter((i) => !open.has(i));
        if (!closed.length) return;
        const rest = closed.filter((i) => i !== 4); // the centre tile is opened last, so the final guess still needs thinking
        const k = rest.length ? u.pick(rest) : closed[0];
        open.add(k); tiles[k].classList.add('l18a-open'); count.textContent = `🧱 ${open.size} / 9`;
        puzzle.setAttribute('aria-label', `Mystery picture 神秘圖片：已翻開 ${open.size} / 9 塊`);
      };
      const finalRound = (done) => {
        st.head.innerHTML = '';
        st.head.append(L.say(`🕵️ 拼圖翻開了 ${open.size} 塊！神秘圖片是什麼？選一個（猜對有加分）。`, 'What is the mystery picture? Guess for a bonus!'));
        const n = easy ? 3 : 4;
        const opts = u.shuffle([mystery].concat(others(ctx, mystery, n - 1, { needPic: true, difPic: true })));
        const ch = L.choices(opts.map((w) => ({ el: u.el('span', { class: 'l18a-guess' }, u.el('b', { lang: 'en' }, w.word), u.el('span', { class: 'zh' }, w.zh)), aria: w.word + ' ' + w.zh })), (i, b) => pick(i, b), 'l18a-choices');
        panel.innerHTML = ''; panel.append(ch.el);
        let answered = false;
        const pick = (i, b) => {
          if (answered) return; answered = true; ch.lock();
          const ok = opts[i] === mystery; const right = opts.indexOf(mystery); ch.mark(right, i);
          tiles.forEach((t, k) => { open.add(k); t.classList.add('l18a-open'); }); count.textContent = '🧱 9 / 9';
          puzzle.setAttribute('aria-label', `Mystery picture 神秘圖片：${mystery.word} ${mystery.zh}`);
          const p = rel(ctx, b || puzzle);
          if (ok) { ctx.addScore(300); ctx.float(p.x, p.y, '+300 BONUS', 'good'); EP.sfx.win(); ctx.confetti(); } else EP.sfx.wrong();
          panel.append(u.el('div', { class: 'l18a-result', role: 'status' }, ok ? '🎉 Yes! 答對了！' : '🙂 It is… 答案是：', ' ', EP.pic(mystery), ' ', u.el('span', { lang: 'en' }, mystery.word), ' ', u.el('span', { class: 'zh' }, mystery.zh)));
          Promise.all([ctx.say(mystery), ctx.wait(1800)]).then(done);
        };
        T.set(() => pick(opts.indexOf(mystery), ch.btns[opts.indexOf(mystery)]), () => { const k = opts.findIndex((w) => w !== mystery); pick(k, ch.btns[k]); });
      };
      L.rounds(ctx, ctx.items.concat([FINAL]), (item) => new Promise((done) => {
        if (item === FINAL) return finalRound(done);
        st.head.innerHTML = '';
        st.head.append(L.say('🧩 聽句子，選出句子說的東西，答對就翻開一塊拼圖！', 'Pick the picture to open a tile.'), L.listenBar(ctx, item));
        const zhOnly = !EP.pic(item); const n = d === 'hard' ? 4 : 3;
        const opts = u.shuffle([item].concat(others(ctx, item, n - 1, { needPic: !zhOnly, difPic: true, filter: (w) => w.id !== mystery.id && EP.pic(w) !== EP.pic(mystery) })));
        const ch = L.choices(opts.map((w) => ({ el: card(w, zhOnly, easy), aria: w.zh })), (i, b) => pick(i, b), 'l18a-choices');
        panel.innerHTML = ''; panel.append(ch.el);
        let answered = false;
        const pick = (i, b) => {
          if (answered) return; answered = true; ch.lock();
          const ok = opts[i] === item; ch.mark(opts.indexOf(item), i);
          if (ok) openTile();
          const p = rel(ctx, b);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y }).then(done);
        };
        T.set(() => pick(opts.indexOf(item), ch.btns[opts.indexOf(item)]), () => { const k = opts.findIndex((w) => w !== item); pick(k, ch.btns[k]); });
      }));
      return { test: T.api };
    },
  });

  /* ======================= L18b Hoop Shot (SHOOT) ======================= */
  L.register({
    id: 'L18b',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#141733,#262a52)' });
      const tween = tweener(ctx);
      const court = u.el('div', { class: 'l18b-court', role: 'group', 'aria-label': 'Basketball court 籃球場' });
      const row = u.el('div', { class: 'l18b-hoops' });
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'l18b-arc'); svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#ffd43b'); path.setAttribute('stroke-width', '5'); path.setAttribute('stroke-dasharray', '4 12'); path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
      const ball = u.el('button', { class: 'l18b-ball', 'aria-label': 'Basketball 籃球：往籃框拖曳（或直接點籃框）投籃 Drag to a hoop' }, '🏀');
      const tip = u.el('div', { class: 'l18b-tip zh' }, '👆 拖曳籃球往上投，或點籃框');
      court.append(row, svg, ball, tip);
      st.body.append(court);
      const n = d === 'hard' ? 4 : 3;
      let hoops = []; let cur = null; let drag = null; let flying = false; let aim = -1;
      const BS = () => ball.offsetWidth || 72;
      const restPos = () => ({ x: court.clientWidth / 2, y: court.clientHeight - BS() * 0.62 - 26 });
      let last = { x: 0, y: 0 };
      const setBall = (x, y, s) => { const b = BS(); last = { x, y }; ball.style.transform = `translate(${x - b / 2}px, ${y - b / 2}px) scale(${s || 1})`; };
      const rimOf = (i) => { const r = hoops[i].el.querySelector('.l18b-rim').getBoundingClientRect(), c = court.getBoundingClientRect(); return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 }; };
      const showArc = (i) => {
        if (i < 0) { path.setAttribute('d', ''); return; }
        const a = restPos(), b = rimOf(i); const cy = Math.min(a.y, b.y) - 70;
        svg.setAttribute('width', court.clientWidth); svg.setAttribute('height', court.clientHeight);
        path.setAttribute('d', `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${cy} ${b.x} ${b.y - 12}`);
      };
      const setAim = (i) => { aim = i; hoops.forEach((h, k) => h.el.classList.toggle('l18b-aim', k === i)); showArc(i); };
      ctx.loop(() => { if (!drag && !flying) setBall(restPos().x, restPos().y, 1); });
      const aimFrom = (dx, dy) => {
        if (dy > -24) return -1;
        const a = restPos(); const by = rimOf(0).y; const xHit = a.x + dx * (by - a.y) / dy;
        let best = -1, bd = Infinity; hoops.forEach((h, k) => { const dd = Math.abs(rimOf(k).x - xHit); if (dd < bd) { bd = dd; best = k; } });
        return best;
      };
      ctx.on(ball, 'pointerdown', (e) => {
        if (!cur || cur.answered || flying) return;
        drag = { x: e.clientX, y: e.clientY, moved: false }; try { ball.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        e.preventDefault();
      });
      ctx.on(window, 'pointermove', (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 8) drag.moved = true;
        const a = restPos(); const lim = Math.min(court.clientHeight * 0.45, 220); const len = Math.hypot(dx, dy); const k = len > lim ? lim / len : 1;
        setBall(a.x + dx * k, a.y + dy * k, 1);
        setAim(aimFrom(dx, dy));
      });
      const endDrag = (e, cancel) => {
        if (!drag) return; const dr = drag; drag = null;
        const dy = e ? e.clientY - dr.y : 0;
        const i = cancel ? -1 : aim; setAim(-1);
        if (i >= 0 && dy < -24) shoot(i);
        else if (!dr.moved && !cancel) { tip.textContent = '👆 按住籃球往籃框拖，再放開！或直接點籃框'; EP.sfx.tick(); }
      };
      ctx.on(window, 'pointerup', (e) => endDrag(e, false));
      ctx.on(window, 'pointercancel', () => endDrag(null, true));
      ctx.on(ball, 'click', (e) => { if (e.detail === 0 && cur && !cur.answered) { tip.textContent = '⌨️ 用 Tab 移到籃框，按 Enter 投籃'; } });
      let shoot = () => {};
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🏀 聽句子，把籃球投進寫著句子裡那個字的籃框！（拖曳籃球，或點籃框）', 'Drag and throw the ball into the right hoop.'), L.listenBar(ctx, item));
        row.innerHTML = ''; tip.textContent = '👆 拖曳籃球往上投，或點籃框';
        const opts = u.shuffle([item].concat(others(ctx, item, n - 1)));
        hoops = opts.map((w, i) => {
          const el = u.el('button', { class: 'l18b-hoop', 'aria-label': `${lab(w)} — shoot here 投這一籃` },
            u.el('span', { class: 'l18b-board', lang: 'en' }, d === 'easy' && EP.pic(w) ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, EP.pic(w)) : null, u.el('span', {}, lab(w))),
            u.el('span', { class: 'l18b-rim', 'aria-hidden': 'true' }), u.el('span', { class: 'l18b-net', 'aria-hidden': 'true' }));
          row.appendChild(el); ctx.on(el, 'click', () => shoot(i));
          return { w, el };
        });
        const c = (cur = { item, answered: false });
        shoot = (i) => {
          if (c.answered || cur !== c || !hoops[i]) return; c.answered = true; flying = true; setAim(-1);
          const ok = hoops[i].w === item; const a = drag || last.x ? last : restPos(); const b = rimOf(i);
          const arcH = Math.max(60, Math.min(160, (a.y - b.y) * 0.45)); EP.sfx.whoosh(); tip.textContent = '';
          tween(650, (t) => setBall(a.x + (b.x - a.x) * t, a.y + (b.y - 14 - a.y) * t - arcH * 4 * t * (1 - t), 1 - 0.38 * t))
            .then(() => {
              if (ok) {
                hoops[i].el.classList.add('l18b-swish', 'l18b-good');
                return tween(260, (t) => setBall(b.x, b.y - 14 + 46 * t, 0.62));
              }
              hoops[i].el.classList.add('l18b-bad'); const r = hoops.findIndex((h) => h.w === item); if (r >= 0) hoops[r].el.classList.add('l18b-good');
              const side = b.x < court.clientWidth / 2 ? 1 : -1;
              return tween(480, (t) => setBall(b.x + side * 110 * t, b.y - 14 - 70 * 4 * t * (1 - t) + 90 * t, 0.62));
            })
            .then(() => {
              const call = u.el('div', { class: 'l18b-call', 'aria-hidden': 'true' }, ok ? 'SWISH! 進球！' : 'CLANG! 沒進'); court.appendChild(call);
              const p = rel(ctx, hoops[i].el);
              return L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: 'Wrong hoop 投錯籃框' }).then(() => call.remove());
            })
            .then(() => { flying = false; done(); });
        };
        T.set(() => shoot(opts.indexOf(item)), () => shoot(opts.findIndex((w) => w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ======================= L18c Memory Chain (MEMORY_CHAIN) ======================= */
  L.register({
    id: 'L18c',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty; const easy = d === 'easy';
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#5f3dc4,#845ef7 60%,#b197fc)' });
      const cards = [0, 1].map((k) => u.el('div', { class: 'l18c-card' },
        u.el('span', { class: 'l18c-num', 'aria-hidden': 'true' }, k ? '2️⃣' : '1️⃣'),
        u.el('span', { class: 'l18c-cap' }, k ? 'Second 第二句' : 'First 第一句'),
        u.el('span', { class: 'l18c-wave', 'aria-hidden': 'true' }, '🔈'),
        u.el('span', { class: 'l18c-text', lang: 'en' }, '')));
      const q = u.el('div', { class: 'l18c-q', role: 'status' }, '');
      const box = u.el('div', { class: 'l18c-box', style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.append(u.el('div', { class: 'l18c-chain' }, cards[0], u.el('span', { class: 'l18c-link', 'aria-hidden': 'true' }, '🔗'), cards[1]), q, box);
      const maxPlays = d === 'hard' ? 2 : 99;
      const order = u.shuffle(ctx.items.map((_, i) => (i % 2 ? 1 : 0)));
      L.rounds(ctx, ctx.items, (asked, ri) => new Promise((done) => {
        const which = order[ri];
        const zhOnly = !EP.pic(asked);
        const partner = others(ctx, asked, 1, { needPic: !zhOnly, difPic: true, filter: (w) => !inSent(w, asked) })[0] || others(ctx, asked, 1)[0];
        const seq = which === 0 ? [asked, partner] : [partner, asked];
        const n = d === 'hard' ? 4 : 3;
        const extra = others(ctx, asked, n - 2, { needPic: !zhOnly, difPic: true, filter: (w) => w !== partner && !inSent(partner, w) && (!EP.pic(w) || EP.pic(w) !== EP.pic(partner)) });
        const opts = u.shuffle([asked, partner].concat(extra).filter(Boolean));
        cards.forEach((c, k) => { c.className = 'l18c-card'; c.querySelector('.l18c-text').textContent = ''; c.querySelector('.l18c-wave').textContent = '🔈'; const old = c.querySelector('.src-tag'); if (old) old.remove(); const tg = EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(seq[k], 'sentence')) : null; if (tg) c.appendChild(tg); });
        q.textContent = '';
        const ch = L.choices(opts.map((w) => ({ el: card(w, zhOnly, easy), aria: w.zh })), (i, b) => pick(i, b), 'l18c-choices');
        box.innerHTML = ''; box.append(u.el('div', { class: 'l18c-wait' }, '👂 Listen to both sentences… 先聽完兩句話'));
        let answered = false; let plays = 0; let seqId = 0; let asking = false;
        const ask = () => {
          if (asking || answered) return; asking = true;
          q.textContent = which === 0 ? '❓ 第一句（First）在說什麼？ What was the FIRST one about?' : '❓ 第二句（Second）在說什麼？ What was the SECOND one about?';
          box.innerHTML = ''; box.append(ch.el);
          const b0 = ch.btns[0]; if (b0 && document.activeElement && document.activeElement.classList.contains('ls-play')) b0.focus();
        };
        const playBoth = async (slow, auto) => {
          if (answered) return;
          if (!auto && plays >= maxPlays) { ctx.toast('Hard 模式最多聽 2 次'); return; }
          plays++; const my = ++seqId;
          for (let k = 0; k < 2; k++) {
            if (my !== seqId || answered || ctx.ended) return;
            cards.forEach((c, j) => { c.classList.toggle('l18c-on', j === k); c.querySelector('.l18c-wave').textContent = j === k ? '🔊' : '🔈'; });
            await ctx.say(seq[k], { sentence: true, slow, rate: d === 'hard' && !slow ? 1.12 : undefined });
            if (my !== seqId || answered) return;
            cards[k].classList.remove('l18c-on'); cards[k].querySelector('.l18c-wave').textContent = '🔈';
            await ctx.wait(k === 0 ? 550 : 250);
          }
          if (my === seqId) ask();
        };
        st.head.innerHTML = '';
        st.head.append(L.say('🧠 朋友連說兩句話，記住順序！再回答第一句或第二句在說什麼。', 'Listen to two sentences; pick the picture for the one asked.'),
          u.el('div', { class: 'ls-listen' },
            u.el('button', { class: 'btn blue big ls-play', 'aria-label': 'Play both sentences again 再聽兩句', onclick: () => playBoth(false) }, '🔊 Listen again 再聽兩句'),
            u.el('button', { class: 'btn small ls-slow', 'aria-label': 'Play both slowly 慢速播放兩句', onclick: () => playBoth(true) }, '🐢 Slow 慢速')));
        ctx.timeout(() => playBoth(false, true), 400);
        const pick = (i, b) => {
          if (answered) return; answered = true; seqId++; ch.lock();
          if (!asking) { asking = true; box.innerHTML = ''; box.append(ch.el); }
          const ok = opts[i] === asked; ch.mark(opts.indexOf(asked), i);
          cards.forEach((c, k) => { c.classList.remove('l18c-on'); c.classList.toggle('l18c-asked', k === which); c.querySelector('.l18c-text').textContent = seq[k].sentence; });
          if (ok) EP.audio.stop();
          const p = b ? rel(ctx, b) : rel(ctx, cards[which]);
          L.feedback(ctx, asked, ok, { x: p.x, y: p.y, wrongText: which === 0 ? 'The first one was… 第一句是' : 'The second one was… 第二句是' }).then(done);
        };
        T.set(() => pick(opts.indexOf(asked), ch.btns[opts.indexOf(asked)]), () => { const k = opts.findIndex((w) => w !== asked); pick(k, ch.btns[k]); });
      }));
      return { test: T.api };
    },
  });
})();
