/* Sentence Listening — Level 11 (Places in town): DRAG_TO_SHELF, HALVES, TICKER_STOP
 * L11a Library Shelving: drag the returned book to the shelf with the key word you heard.
 * L11b Sentence Halves: the sentence is torn in two; after listening, choose the right second half.
 * L11c News Ticker: words scroll past a window; press STOP when the key word of the sentence is inside. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (local to this level) ---------- */
  const toks = (s) => L.tokens(s).map((x) => x.w);
  /** does `sentence` contain `word` as whole word(s)? (so a distractor is never actually in the sentence) */
  const mentions = (sentence, word) => {
    const s = toks(sentence), w = toks(word); if (!w.length) return false;
    for (let i = 0; i + w.length <= s.length; i++) if (w.every((x, j) => s[i + j] === x)) return true;
    return false;
  };
  /** stage coordinates of an element (for floating score text) */
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const SPINE = ['#e03131', '#1971c2', '#2f9e44', '#f08c00', '#7048e8', '#0c8599', '#c2255c', '#5c940d'];
  const spine = (fresh) => u.el('span', { class: 'l11a-spine' + (fresh ? ' l11a-new' : ''), style: { background: u.pick(SPINE), height: u.randInt(62, 96) + '%' } });

  L.css('L11', `
.l11a-lib{width:100%;max-width:940px;display:flex;flex-direction:column;align-items:center;gap:clamp(10px,2.4vh,20px)}
.l11a-cart{display:flex;align-items:center;gap:12px;background:rgba(255,248,225,.95);color:#3d2a12;border-radius:18px;padding:8px 14px;box-shadow:0 5px 0 rgba(0,0,0,.25)}
.l11a-cart-lb{font-weight:900;font-size:.95rem;line-height:1.2;text-align:center}
.l11a-book{border:0;border-radius:6px 16px 16px 6px;background:linear-gradient(90deg,#1c3f8c 0 16%,#2b5fd9 16% 100%);color:#fff;padding:10px 18px 10px 24px;font-weight:900;font-size:clamp(1.15rem,3.4vw,1.45rem);box-shadow:0 6px 0 rgba(0,0,0,.3);cursor:grab;touch-action:none;display:flex;align-items:center;gap:8px;min-height:64px}
.l11a-book .l11a-bk-ic{font-size:2rem;line-height:1}
.l11a-book.l11a-gone{visibility:hidden}
.l11a-book.ls-ghost{cursor:grabbing}
.l11a-shelves{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:12px;width:100%}
@media (max-width:640px){.l11a-shelves{grid-template-columns:repeat(2,minmax(0,1fr))}}
.l11a-shelf{border:0;border-radius:16px;background:linear-gradient(180deg,#8a5a2b,#6b4220);padding:10px 10px 0;display:flex;flex-direction:column;align-items:stretch;gap:8px;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.32);min-height:clamp(120px,28vh,210px);font:inherit}
.l11a-sign{background:#fff8e1;color:#3d2a12;border-radius:12px;padding:6px 8px;font-weight:900;font-size:clamp(1.05rem,2.8vw,1.35rem);display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.15;box-shadow:inset 0 -3px 0 rgba(0,0,0,.12)}
.l11a-sign .ls-emoji{font-size:clamp(1.7rem,4.5vw,2.3rem)}
.l11a-sign .l11a-zh{font-size:.9rem;color:#5c3d00}
.l11a-row{margin-top:auto;display:flex;align-items:flex-end;justify-content:center;gap:3px;height:clamp(38px,7vh,56px);border-bottom:9px solid #4a2d14;overflow:hidden;padding:0 4px}
.l11a-spine{width:clamp(8px,1.4vw,12px);border-radius:3px 3px 0 0;box-shadow:inset -2px 0 0 rgba(0,0,0,.18);flex:none}
.l11a-new{animation:l11aDrop .45s cubic-bezier(.3,1.6,.6,1)}
@keyframes l11aDrop{from{transform:translateY(-120%)}}
.l11a-shelf.l11a-right{box-shadow:0 0 0 5px #8ce99a,0 6px 0 rgba(0,0,0,.32)}
.l11a-shelf.l11a-right .l11a-sign::after{content:'✔';color:#2b8a3e;font-weight:900}
.l11a-shelf.l11a-wrong{box-shadow:0 0 0 5px #ffa8a8,0 6px 0 rgba(0,0,0,.32)}
.l11a-shelf.l11a-wrong .l11a-sign::after{content:'✘';color:#c92a2a;font-weight:900}

.l11b-desk{width:100%;max-width:860px;display:flex;flex-direction:column;align-items:center;gap:14px}
.l11b-top{display:flex;align-items:stretch;justify-content:center;width:100%;filter:drop-shadow(0 5px 0 rgba(0,0,0,.2))}
.l11b-left,.l11b-slot,.l11b-piece{font-weight:800;font-size:clamp(1.2rem,3.8vw,1.7rem);line-height:1.25;color:#1d2340}
.l11b-left{background:#fffdf3;padding:14px 26px 14px 18px;border-radius:14px 0 0 14px;clip-path:polygon(0 0,100% 0,92% 12%,100% 25%,92% 38%,100% 50%,92% 62%,100% 75%,92% 88%,100% 100%,0 100%);display:flex;align-items:center}
.l11b-slot{min-width:min(38vw,240px);border:3px dashed rgba(255,255,255,.85);border-left:0;border-radius:0 14px 14px 0;padding:14px 18px;color:#fff;display:flex;align-items:center;justify-content:center}
.l11b-slot.l11b-filled{background:#fffdf3;border:0;color:#1d2340;clip-path:polygon(8% 0,100% 0,100% 100%,8% 100%,0 88%,8% 75%,0 62%,8% 50%,0 38%,8% 25%,0 12%);padding-left:30px;animation:l11bJoin .35s ease-out}
@keyframes l11bJoin{from{transform:translateX(30px)}}
.l11b-wait{color:#fff;font-weight:800;text-align:center}
.l11b-pieces{display:flex;flex-direction:column;gap:10px;width:min(100%,560px)}
.l11b-pieces[hidden]{display:none}
.l11b-piece{border:0;background:#fffdf3;cursor:pointer;padding:12px 18px 12px 34px;text-align:left;clip-path:polygon(6% 0,100% 0,100% 100%,6% 100%,0 88%,6% 75%,0 62%,6% 50%,0 38%,6% 25%,0 12%);border-radius:0 14px 14px 0;min-height:58px;font-family:inherit}
.l11b-piece:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l11b-piece.l11b-right{background:#d3f9d8}
.l11b-piece.l11b-wrongpick{background:#ffe3e3}
.l11b-piece.l11b-dim{opacity:.6}
.l11b-piece .l11b-tag{font-weight:900;margin-right:6px}

.l11c-tv{width:100%;max-width:900px;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:#101828;box-shadow:0 0 0 6px #343a40,0 10px 0 6px rgba(0,0,0,.35)}
.l11c-screen{position:relative;min-height:clamp(84px,17vh,150px);background:radial-gradient(circle at 70% 30%,#364fc7,#1b2a6b 70%);display:flex;align-items:center;justify-content:center;gap:16px;padding:10px 10px 30px}
.l11c-anchor{font-size:clamp(2.6rem,9vh,4.6rem);line-height:1}
.l11c-desk{background:#e7f5ff;color:#1b2a6b;border-radius:12px;padding:6px 12px;font-weight:900;text-align:center;line-height:1.2}
.l11c-live{position:absolute;left:10px;top:8px;background:#c92a2a;color:#fff;font-weight:900;border-radius:8px;padding:2px 8px;font-size:.85rem}
.l11c-tries{position:absolute;right:10px;top:8px;color:#fff;font-weight:800;font-size:.95rem}
.l11c-band{position:relative;height:clamp(64px,11vh,84px);background:#ffd43b;overflow:hidden;border-top:4px solid #f08c00}
.l11c-track{position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;white-space:nowrap;will-change:transform}
.l11c-grp{display:flex;align-items:center;flex:none}
.l11c-w{font-weight:900;font-size:clamp(1.25rem,3.6vw,1.8rem);color:#1d2340;padding:0 4px;display:inline-flex;align-items:center;gap:4px}
.l11c-w .ls-emoji{font-size:1.5rem}
.l11c-sep{color:#9c3d00;font-size:1rem;padding:0 clamp(18px,4.5vw,34px)}
.l11c-win{position:absolute;top:4px;bottom:4px;left:50%;transform:translateX(-50%);border:4px solid #1d2340;border-radius:12px;box-shadow:0 0 0 999px rgba(16,24,40,.28);pointer-events:none}
.l11c-mark{position:absolute;left:50%;bottom:0;transform:translateX(-50%);background:#1d2340;color:#fff;font-size:.8rem;font-weight:800;padding:2px 10px;border-radius:8px 8px 0 0;white-space:nowrap}
.l11c-win.l11c-ok{border-color:#2b8a3e;box-shadow:0 0 0 999px rgba(43,138,62,.25)}
.l11c-win.l11c-no{border-color:#c92a2a;box-shadow:0 0 0 999px rgba(201,42,42,.25)}
.l11c-stop{border:0;border-radius:50%;width:clamp(96px,16vh,128px);height:clamp(96px,16vh,128px);background:radial-gradient(circle at 40% 35%,#ff6b6b,#c92a2a 70%);color:#fff;font-weight:900;font-size:clamp(1.1rem,3vh,1.4rem);box-shadow:0 7px 0 #7d1a1a;cursor:pointer;line-height:1.15;flex:none}
.l11c-stop:active{transform:translateY(5px);box-shadow:0 2px 0 #7d1a1a}
.l11c-stop:focus-visible{outline:5px solid #ffd43b;outline-offset:3px}
.l11c-hit{background:#2b8a3e;color:#fff;border-radius:8px}
`);

  /* ---------- L11a Library Shelving — drag the book to the shelf whose word you heard ---------- */
  L.register({
    id: 'L11a',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#4a2f17,#8b5e34 55%,#c9a06b)' });
      const n = D === 'easy' ? 3 : 4;
      const showPic = D !== 'hard', showZh = D === 'easy';
      const book = u.el('button', { class: 'l11a-book', 'aria-label': 'Returned book 還回來的書：拖到書架，或先點書再點書架' },
        u.el('span', { class: 'l11a-bk-ic', 'aria-hidden': 'true' }, '📘'), u.el('span', { 'aria-hidden': 'true' }, '🔊 ?'));
      const cart = u.el('div', { class: 'l11a-cart' }, u.el('span', { class: 'l11a-cart-lb zh' }, '還書車', u.el('br'), 'Return cart'), book);
      const shelvesEl = u.el('div', { class: 'l11a-shelves', role: 'group', 'aria-label': 'Shelves 書架' });
      shelvesEl.style.setProperty('--n', n);
      const shelves = Array.from({ length: n }, () => {
        const sign = u.el('span', { class: 'l11a-sign' });
        const row = u.el('span', { class: 'l11a-row', 'aria-hidden': 'true' });
        for (let i = u.randInt(4, 7); i > 0; i--) row.appendChild(spine());
        const b = u.el('button', { class: 'ls-item l11a-shelf' }, sign, row);
        shelvesEl.appendChild(b);
        return { b, sign, row, w: null };
      });
      st.body.append(u.el('div', { class: 'l11a-lib' }, cart, shelvesEl));
      let cur = null;
      L.dnd(ctx, [book], shelves.map((s) => s.b), (d, t) => { if (cur) cur.drop(shelves.find((s) => s.b === t)); });

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('📚 聽句子，把書放到「寫著你聽到的字」的書架上！', 'Drag the book to the shelf with the word you heard.'), L.listenBar(ctx, item));
        // distractor shelves: never a word that is also in this sentence (e.g. "city" in "Tokyo is a big city.")
        const others = L.others(ctx, item, n - 1, { filter: (w) => !mentions(item.sentence, w.word) });
        const words = u.shuffle([item].concat(others));
        shelves.forEach((s, i) => {
          const w = words[i]; s.w = w;
          s.b.classList.remove('l11a-right', 'l11a-wrong');
          s.sign.innerHTML = '';
          const pic = showPic ? EP.pic(w) : '';
          s.sign.append(...[pic ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, pic) : null, u.el('span', {}, w.word), showZh ? u.el('span', { class: 'l11a-zh zh' }, w.zh) : null].filter(Boolean));
          s.b.setAttribute('aria-label', 'Shelf 書架：' + w.word + (showZh ? ' ' + w.zh : ''));
        });
        let answered = false;
        cur = {
          drop(s) {
            if (answered || !s) return; answered = true; cur = null;
            const ok = s.w === item;
            const right = shelves.find((x) => x.w === item);
            s.b.classList.add(ok ? 'l11a-right' : 'l11a-wrong');
            if (ok) { book.classList.add('l11a-gone'); s.row.appendChild(spine(true)); if (s.row.children.length > 9) s.row.firstChild.remove(); EP.sfx.pop(); }
            else { ctx.shake(s.b); right.b.classList.add('l11a-right'); }
            L.feedback(ctx, item, ok, Object.assign(rel(ctx, s.b), { wrongText: 'Wrong shelf 放錯書架了' })).then(() => { book.classList.remove('l11a-gone'); done(); });
          },
        };
        T.set(() => cur && cur.drop(shelves.find((s) => s.w === item)), () => cur && cur.drop(shelves.find((s) => s.w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L11b Sentence Halves — choose the right second half after listening ---------- */
  const DET = new Set(['a', 'an', 'the', 'my', 'some', 'every', 'this', 'that', 'your', 'his', 'her', 'our']);
  const PREP = new Set(['at', 'in', 'on', 'to', 'for', 'with']);
  const BE = new Set(['is', 'are', 'am']);
  const kind = (w) => (DET.has(w) ? 'det' : PREP.has(w) ? 'prep' : BE.has(w) ? 'be' : 'other');
  const HALF = new Map();
  /** split a sentence at a sensible word boundary near the middle (key word kept whole, preferably in the 2nd half) */
  function halves(item) {
    if (HALF.has(item.id)) return HALF.get(item.id);
    const raw = item.sentence.trim().split(/\s+/); const n = raw.length; const k = L.key(item);
    const low = raw.map((r) => r.replace(/[^A-Za-z']/g, '').toLowerCase());
    let best = null, bs = Infinity;
    for (let s = 1; s < n; s++) {
      if (k && s > k.index && s < k.index + k.words) continue; // never cut "post | office"
      let sc = Math.abs(s - n / 2);
      if (k && s <= k.index) sc -= 0.75;
      const c = kind(low[s]); if (c === 'prep') sc -= 0.6; else if (c === 'det' || c === 'be') sc -= 0.5;
      if (s === 1 && DET.has(low[0])) sc += 2; // never leave "The" alone
      if (sc < bs) { bs = sc; best = s; }
    }
    if (best == null) best = Math.max(1, Math.floor(n / 2));
    const res = { first: raw.slice(0, best).join(' '), second: raw.slice(best).join(' '), kind: kind(low[best]) };
    HALF.set(item.id, res); return res;
  }

  L.register({
    id: 'L11b',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#15aabf 60%,#99e9f2)' });
      const nChoices = D === 'easy' ? 2 : D === 'hard' ? 4 : 3;
      const desk = u.el('div', { class: 'l11b-desk' });
      st.body.append(desk);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; desk.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🧩 句子被撕成兩半！先聽句子，再選出正確的後半句。', 'Listen, then choose the right second half.'), bar);
        const h = halves(item);
        const right = u.norm(h.second);
        // other second halves from this level: same kind of start first ("a test." for "I have | a question."), never the same text
        const seen = new Set([right]); const same = [], diff = [];
        u.shuffle(ctx.pool.concat(EP.levelWords(item.level))).forEach((w) => {
          if (w.id === item.id) return; const hw = halves(w); const k = u.norm(hw.second);
          if (seen.has(k)) return; seen.add(k); (hw.kind === h.kind ? same : diff).push(hw.second);
        });
        const wrongs = same.concat(diff).slice(0, nChoices - 1);
        const opts = u.shuffle([{ text: h.second, ok: true }].concat(wrongs.map((t) => ({ text: t, ok: false }))));
        const slot = u.el('div', { class: 'l11b-slot' }, '？');
        const top = u.el('div', { class: 'l11b-top' }, u.el('div', { class: 'l11b-left' }, h.first + ' …'), slot);
        const wait = u.el('div', { class: 'l11b-wait zh', role: 'status' }, '🔊 先聽句子… Listen first');
        const pieces = u.el('div', { class: 'l11b-pieces', role: 'group', 'aria-label': 'Second halves 後半句', hidden: '' });
        const btns = opts.map((o, i) => {
          const b = u.el('button', { class: 'l11b-piece' }, u.el('span', { class: 'l11b-tag', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), '… ' + o.text);
          ctx.on(b, 'click', () => pick(i)); pieces.appendChild(b); return b;
        });
        desk.append(top, wait, pieces);
        // never show the halves before the sentence has been heard once (or after a short safety time)
        let shown = false;
        const reveal = () => { if (shown || ctx.ended) return; shown = true; wait.remove(); pieces.hidden = false; };
        ctx.timeout(() => { bar.play(false).then(reveal); }, 350);
        ctx.timeout(reveal, D === 'hard' ? 5000 : 4200);
        let answered = false;
        function pick(i) {
          if (answered) return; answered = true; reveal();
          const ok = opts[i].ok; const ri = opts.findIndex((o) => o.ok);
          btns.forEach((b, j) => b.classList.add(j === ri ? 'l11b-right' : j === i ? 'l11b-wrongpick' : 'l11b-dim'));
          if (ok) { slot.textContent = h.second; slot.classList.add('l11b-filled'); EP.sfx.pop(); }
          else ctx.shake(btns[i]);
          L.feedback(ctx, item, ok, Object.assign(rel(ctx, btns[i]), { wrongText: 'Not that half 不是這一半' })).then(done);
        }
        T.set(() => pick(opts.findIndex((o) => o.ok)), () => pick(opts.findIndex((o) => !o.ok)));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L11c News Ticker — press STOP when the key word is in the window ---------- */
  L.register({
    id: 'L11c',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#0b1020,#1b2a6b 60%,#364fc7)' });
      const speed = (D === 'easy' || reduce ? 75 : D === 'hard' ? 135 : 100); // px per second
      const winW = D === 'easy' ? 200 : D === 'hard' ? 140 : 170;
      const tol = D === 'easy' ? 26 : D === 'hard' ? 8 : 16;
      const nWords = D === 'easy' ? 4 : D === 'hard' ? 6 : 5;
      const tries = u.el('div', { class: 'l11c-tries', 'aria-live': 'polite' });
      const track = u.el('div', { class: 'l11c-track', 'aria-hidden': 'true' });
      const win = u.el('div', { class: 'l11c-win', 'aria-hidden': 'true' });
      const band = u.el('div', { class: 'l11c-band' }, track, win);
      const tv = u.el('div', { class: 'l11c-tv', role: 'group', 'aria-label': 'News ticker 新聞跑馬燈' },
        u.el('div', { class: 'l11c-screen' }, u.el('span', { class: 'l11c-live' }, '● LIVE 直播'), tries,
          u.el('span', { class: 'l11c-anchor', 'aria-hidden': 'true' }, '🧑‍💼'), u.el('span', { class: 'l11c-desk zh' }, 'Town News', u.el('br'), '小鎮新聞'), u.el('span', { class: 'l11c-mark zh', 'aria-hidden': 'true' }, '▼ STOP here 停在這 ▼')),
        band);
      const stopBtn = u.el('button', { class: 'l11c-stop', 'aria-label': 'STOP 停' }, '🛑', u.el('br'), 'STOP', u.el('br'), '停');
      st.body.append(tv);
      st.foot.append(stopBtn);
      ctx.on(stopBtn, 'click', () => stop());

      let p = 0; let R = null; // R = current round state
      const fitWin = () => { win.style.width = Math.min(winW, band.clientWidth * 0.46) + 'px'; };
      const xOf = (el) => band.clientWidth - p + el.offsetLeft + el.offsetWidth / 2; // centre of a word in band coords
      const setP = (v) => { p = v; if (R) R.keys.forEach((k) => (k._x = null)); track.style.transform = `translateX(${band.clientWidth - p}px)`; };
      ctx.loop((dt) => {
        if (!R || !R.running) return;
        const bw = band.clientWidth;
        p += speed * dt * ctx.speed;
        if (p >= bw + R.WA) p -= R.WA;
        track.style.transform = `translateX(${bw - p}px)`;
        // the key word left the window without STOP → a missed pass
        const lim = bw / 2 - win.offsetWidth / 2 - tol;
        for (const k of R.keys) {
          const x = xOf(k);
          if (k._x != null && k._x >= lim && x < lim) { R.miss(); if (!R || !R.running) return; }
          k._x = x;
        }
      });
      function stop() {
        if (!R || R.answered) return;
        const c = band.clientWidth / 2; let best = null, bd = Infinity;
        for (const el of R.words) { const d = Math.abs(xOf(el) - c); if (d < bd) { bd = d; best = el; } }
        const hit = best && best.classList.contains('l11c-key') && bd <= win.offsetWidth / 2 + tol;
        if (hit) R.win(best); else R.fail('stop');
      }

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('📰 聽新聞句子，你聽到的關鍵字跑進框框時，按「停」！', 'Press STOP when the key word is in the box.'), L.listenBar(ctx, item));
        const others = L.others(ctx, item, nWords - 1, { filter: (w) => !mentions(item.sentence, w.word) });
        const seq = u.shuffle(others); seq.splice(u.randInt(1, seq.length), 0, item); // never first: time to listen
        // one group = one pass of the news; repeated so the ticker loops seamlessly
        const group = () => u.el('span', { class: 'l11c-grp' }, seq.map((w) => [
          u.el('span', { class: 'l11c-w' + (w === item ? ' l11c-key' : '') }, D === 'easy' && EP.pic(w) ? u.el('span', { class: 'ls-emoji' }, EP.pic(w)) : null, w.word),
          u.el('span', { class: 'l11c-sep' }, '◆')]).flat());
        track.innerHTML = ''; win.classList.remove('l11c-ok', 'l11c-no'); fitWin();
        const g0 = group(); track.appendChild(g0);
        const WA = Math.max(200, g0.offsetWidth);
        const copies = 1 + Math.ceil(Math.max(band.clientWidth, window.innerWidth) / WA) + 1;
        for (let i = 1; i < copies; i++) track.appendChild(group());
        let attempts = 0;
        const showTries = () => { tries.textContent = attempts ? '🎯 最後一次 Last try' : ''; };
        showTries();
        R = {
          item, WA, running: true, answered: false,
          words: Array.from(track.querySelectorAll('.l11c-w')), keys: Array.from(track.querySelectorAll('.l11c-key')),
          win(el) { finish(true, el); },
          fail(why) {
            if (R.answered) return;
            attempts++;
            win.classList.remove('l11c-ok'); win.classList.add('l11c-no'); ctx.timeout(() => win.classList.remove('l11c-no'), 500);
            if (attempts >= 2) return finish(false, null, why);
            EP.sfx.wrong(); ctx.shake(band); showTries();
            ctx.toast(why === 'miss' ? '⏩ Missed! It comes again 錯過了，等它再跑一次' : '✋ Not yet! Try again 還不是它，再試一次');
          },
          miss() { R.fail('miss'); },
        };
        setP(0);
        function finish(ok, el, why) {
          if (R.answered) return; R.answered = true; R.running = false;
          if (el) el.classList.add('l11c-hit');
          win.classList.toggle('l11c-ok', ok);
          if (ok) EP.sfx.pop();
          const pos = rel(ctx, el || win);
          L.feedback(ctx, item, ok, Object.assign(pos, { points: attempts ? 60 : 100, wrongText: why === 'miss' ? 'It passed by 跑過去了' : 'Not that word 不是這個字' })).then(() => { R = null; tries.textContent = ''; done(); });
        }
        ctx.timeout(() => { try { stopBtn.focus({ preventScroll: true }); } catch (e) {} }, 50);
        // test hooks: line up a word in the window, then press STOP through the same code path
        const lineUp = (want) => { if (!R || R.answered) return; const el = R.words.find((x) => x.classList.contains('l11c-key') === want && R.words.indexOf(x) < seq.length); if (!el) return; setP(band.clientWidth - band.clientWidth / 2 + el.offsetLeft + el.offsetWidth / 2); stop(); };
        T.set(() => lineUp(true), () => lineUp(false));
      }));
      return { test: T.api };
    },
  });
})();
