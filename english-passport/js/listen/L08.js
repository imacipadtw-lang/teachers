/* Sentence Listening — Level 8 (Festivals 節日): MEMORY_PAIRS, MINIMAL_PAIR_TEXT, TRANSLATE
 * Only the official example sentences are played; every distractor is text, picture or Chinese. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (this level only) ---------- */
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const base = (w) => w.word.replace('...', '').replace(/[.!?]+$/, '').trim();
  const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** does sentence of a contain the word of b (e.g. "Christmas Eve" contains "Christmas")? */
  const mentions = (a, b) => new RegExp("(^|[^A-Za-z'])" + esc(base(b)) + '(s|es)?(?![A-Za-z])', 'i').test(a.sentence);
  const EXTRA = [['Chinese New Year', "New Year's"], ['trick', "April Fool's Day"]];
  /** two items that a child could confuse (same meaning, or one sentence names the other) */
  const clash = (a, b) => a === b || a.zh === b.zh || u.norm(a.word) === u.norm(b.word) || mentions(a, b) || mentions(b, a) ||
    EXTRA.some(([x, y]) => (a.word === x && b.word === y) || (a.word === y && b.word === x));
  const posOf = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const bag = (s) => new Set(L.tokens(s).map((t) => t.w).filter((w) => !['the', 'a', 'an'].includes(w)));
  /** word overlap of two sentences (0..1) — used to pick look-alike distractors */
  const sim = (a, b) => { const A = bag(a.sentence), B = bag(b.sentence); let n = 0; A.forEach((w) => { if (B.has(w)) n++; }); return n / Math.max(1, A.size + B.size - n); };
  const levelOf = (ctx, item) => { const seen = new Set(); return ctx.pool.concat(EP.levelWords(item.level)).filter((w) => (seen.has(w.id) ? false : seen.add(w.id))); };
  /** most similar other items first (with a little randomness) */
  const similar = (ctx, item, ok) => levelOf(ctx, item).filter((w) => w !== item && ok(w)).map((w) => ({ w, s: sim(item, w) + Math.random() * 0.12 })).sort((a, b) => b.s - a.s).map((x) => x.w);

  L.css('L08', `
.l08a-wrap{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.l08a-status{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.l08a-grid{--cw:min(150px,calc((100vw - 48px) / var(--cols) - 10px),calc((100vh - 330px) / var(--rows) * .8));display:grid;grid-template-columns:repeat(var(--cols),max(64px,var(--cw)));gap:clamp(6px,1.4vw,12px);justify-content:center}
.l08a-card{position:relative;width:100%;aspect-ratio:4/5;border:0;padding:0;background:transparent;cursor:pointer;perspective:700px;border-radius:14px}
.l08a-card:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l08a-in{position:absolute;inset:0;transition:transform .45s ease;transform-style:preserve-3d}
.l08a-up .l08a-in{transform:rotateY(180deg)}
.l08a-face{position:absolute;inset:0;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;-webkit-backface-visibility:hidden;backface-visibility:hidden;box-shadow:0 5px 0 rgba(0,0,0,.28);overflow:hidden;text-align:center}
.l08a-back{color:#fff;font-weight:900;font-size:clamp(.7rem,1.8vw,.9rem)}
.l08a-back .l08a-ic{font-size:clamp(1.6rem,5vw,2.4rem);line-height:1}
.l08a-snd .l08a-back{background:repeating-linear-gradient(45deg,#1864ab 0 10px,#1971c2 10px 20px);border:3px solid #a5d8ff}
.l08a-pic .l08a-back{background:repeating-linear-gradient(45deg,#a61e4d 0 10px,#c2255c 10px 20px);border:3px solid #ffd8a8}
.l08a-front{transform:rotateY(180deg);background:#fff;color:#1d2340;border:3px solid #ffe066}
.l08a-front .ls-emoji{font-size:clamp(1.8rem,5.5vw,2.8rem)}
.l08a-front .ls-zhcard{font-size:clamp(.85rem,2.4vw,1.1rem)}
.l08a-snd .l08a-front{background:#e7f5ff;border-color:#339af0}
.l08a-wave{font-size:clamp(1.6rem,5vw,2.4rem);line-height:1}
.l08a-active .l08a-wave{animation:l08a-pulse .8s ease-in-out infinite alternate}
@keyframes l08a-pulse{from{transform:scale(.9)}to{transform:scale(1.15)}}
.l08a-txt{font-size:clamp(.62rem,1.5vw,.82rem);font-weight:800;line-height:1.15;color:#1d2340}
.l08a-zh{font-size:clamp(.6rem,1.4vw,.78rem);color:#3d4470}
.l08a-active{transform:translateY(-6px)}
.l08a-active .l08a-front{box-shadow:0 0 0 4px #ffd43b,0 8px 0 rgba(0,0,0,.25)}
.l08a-done .l08a-front{border-color:#2f9e44;background:#ebfbee}
.l08a-done::after{content:'✔';position:absolute;right:4px;top:2px;color:#2b8a3e;font-weight:900;font-size:1.1rem;z-index:3}
.l08a-done{cursor:default}
.l08a-miss .l08a-front{border-color:#e03131;background:#fff5f5}
.l08a-miss{animation:l08a-shake .4s}
.l08a-hint .l08a-front{box-shadow:0 0 0 5px #ffd43b,0 0 24px #ffd43b}
@keyframes l08a-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.l08a-tip{background:#fff;color:#1d2340;border-radius:999px;padding:6px 14px;font-weight:800;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.l08a-timer{width:min(260px,70vw);height:10px;border-radius:999px;background:rgba(255,255,255,.3);overflow:hidden}
.l08a-timer i{display:block;height:100%;width:100%;background:#ffd43b;transform-origin:left;animation:l08a-shrink linear forwards}
@keyframes l08a-shrink{to{transform:scaleX(0)}}
.l08b-sky{position:relative;width:100%;max-width:940px;display:flex;flex-direction:column;align-items:center}
.l08b-rope{width:100%;height:6px;border-radius:6px;background:linear-gradient(90deg,#8d5524,#e8b04b,#8d5524);box-shadow:0 2px 0 rgba(0,0,0,.3)}
.l08b-row{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(8px,2vw,18px);width:100%;align-items:start}
.l08b-lan{position:relative;border:0;background:transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;padding:0 0 8px;transform-origin:50% 0;animation:l08b-swing 3.2s ease-in-out infinite alternate;color:#1d2340;border-radius:16px}
.l08b-lan:nth-child(2){animation-delay:-1.1s;margin-top:18px}.l08b-lan:nth-child(3){animation-delay:-2.2s;margin-top:6px}.l08b-lan:nth-child(4){animation-delay:-.6s;margin-top:22px}
.l08b-lan:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
@keyframes l08b-swing{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}
.l08b-cord{width:3px;height:16px;background:#e8b04b}
.l08b-body{position:relative;width:clamp(70px,13vw,104px);height:clamp(58px,10vw,82px);border-radius:46%/50%;background:repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 16%,rgba(120,0,0,.35) 16% 18%),radial-gradient(ellipse at 50% 38%,#ff8787,#e03131 55%,#a61e1e);box-shadow:0 0 18px rgba(255,146,43,.55);display:flex;align-items:center;justify-content:center;color:#fff3bf;font-weight:900;font-size:clamp(1.1rem,3vw,1.5rem);text-shadow:0 2px 0 rgba(0,0,0,.35)}
.l08b-body::before,.l08b-body::after{content:'';position:absolute;left:28%;right:28%;height:9px;background:#f0b429;border-radius:3px}
.l08b-body::before{top:-5px}.l08b-body::after{bottom:-5px}
.l08b-slip{margin-top:10px;background:#fff8e6;border:2px solid #f0b429;border-radius:6px;padding:8px 10px;font-weight:800;font-size:clamp(1rem,2.4vw,1.25rem);line-height:1.3;box-shadow:0 4px 0 rgba(0,0,0,.25);max-width:100%;overflow-wrap:anywhere}
.l08b-tassel{width:6px;height:16px;margin-top:-1px;background:linear-gradient(#f0b429,#e03131);border-radius:0 0 4px 4px}
.l08b-lit .l08b-body{background:radial-gradient(ellipse at 50% 40%,#fff3bf,#ffd43b 45%,#f08c00);color:#7a3d00;text-shadow:none;box-shadow:0 0 40px 12px rgba(255,212,59,.85)}
.l08b-lit .l08b-slip{background:#d3f9d8;border-color:#2f9e44}
.l08b-out .l08b-body{filter:grayscale(1) brightness(.6);box-shadow:none}
.l08b-out .l08b-slip{background:#ffe3e3;border-color:#e03131;text-decoration:line-through}
.l08b-right .l08b-slip{outline:4px solid #69db7c}
.l08b-stars{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(2px 2px at 12% 18%,#fff,transparent),radial-gradient(2px 2px at 78% 10%,#fff,transparent),radial-gradient(1.5px 1.5px at 40% 30%,#ffe066,transparent),radial-gradient(2px 2px at 90% 40%,#fff,transparent),radial-gradient(1.5px 1.5px at 22% 60%,#ffe066,transparent)}
@media (max-width:600px){.l08b-rope{display:none}.l08b-row{grid-template-columns:1fr;gap:16px}.l08b-body::before,.l08b-body::after{height:6px}.l08b-body::before{top:-3px}.l08b-body::after{bottom:-3px}.l08b-lan{flex-direction:row;flex-wrap:nowrap;gap:10px;margin-top:0!important;padding:0;animation:none;width:100%}.l08b-cord,.l08b-tassel{display:none}.l08b-body{flex:0 0 auto;width:62px;height:52px;font-size:1.1rem}.l08b-slip{margin-top:0;flex:1;text-align:left}}
.l08c-table{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(10px,2.4vw,22px);width:100%}
.l08c-env{position:relative;width:clamp(104px,29vw,200px);aspect-ratio:4/5;border:0;border-radius:14px;background:linear-gradient(160deg,#e03131,#a61e1e);box-shadow:0 7px 0 #6b1010,0 10px 18px rgba(0,0,0,.25);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 8px 10px;overflow:visible;animation:l08c-drop .45s ease-out both}
.l08c-env:nth-child(2){animation-delay:.08s}.l08c-env:nth-child(3){animation-delay:.16s}.l08c-env:nth-child(4){animation-delay:.24s}
@keyframes l08c-drop{from{transform:translateY(-40px)}to{transform:translateY(0)}}
.l08c-env:focus-visible{outline:4px solid #1971c2;outline-offset:4px}
.l08c-env:active{transform:translateY(3px)}
.l08c-flap{position:absolute;left:0;right:0;top:0;height:38%;background:linear-gradient(#c92a2a,#b02525);clip-path:polygon(0 0,100% 0,50% 100%);border-radius:14px 14px 0 0;transform-origin:50% 0;transition:transform .5s ease;z-index:2}
.l08c-seal{position:absolute;top:25%;left:50%;transform:translate(-50%,-50%);width:clamp(30px,6vw,44px);height:clamp(30px,6vw,44px);border-radius:50%;background:#ffd43b;color:#a61e1e;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:clamp(1rem,2.6vw,1.4rem);z-index:3;box-shadow:0 2px 0 rgba(0,0,0,.25);transition:transform .3s}
.l08c-label{position:relative;z-index:1;width:100%;background:#fff8e6;color:#7a1414;border:2px solid #f0b429;border-radius:10px;padding:6px;font-weight:900;font-size:clamp(.88rem,2.5vw,1.2rem);line-height:1.3;min-height:48%;display:flex;align-items:center;justify-content:center;text-align:center}
.l08c-prize{position:absolute;left:50%;top:10%;transform:translate(-50%,0);font-size:clamp(1.8rem,5vw,2.8rem);z-index:1;transition:transform .55s cubic-bezier(.2,1.6,.4,1)}
.l08c-open .l08c-flap{transform:rotateX(180deg)}
.l08c-open .l08c-seal{transform:translate(-50%,-50%) scale(0)}
.l08c-open.l08c-win .l08c-prize{transform:translate(-50%,-95%) scale(1.15);z-index:4}
.l08c-open.l08c-lose .l08c-prize{transform:translate(-50%,-55%);z-index:4}
.l08c-win{box-shadow:0 7px 0 #6b1010,0 0 30px 10px rgba(255,212,59,.9)}
.l08c-win .l08c-label{background:#d3f9d8;color:#1b4d24;border-color:#2f9e44}
.l08c-lose .l08c-label{background:#f1f3f5;color:#495057;text-decoration:line-through}
.l08c-right{outline:5px solid #2f9e44;outline-offset:4px}
.l08c-purse{background:#fff;color:#7a1414;border-radius:999px;padding:6px 14px;font-weight:900;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.l08c-gran{font-size:clamp(2.2rem,7vw,3.2rem);line-height:1}
@media (prefers-reduced-motion:reduce){.l08b-lan,.l08a-active .l08a-wave,.l08c-env{animation:none!important}}
`);

  /* ===== L08a Festival Memory — flip a sound card (hear the sentence), then its picture card ===== */
  L.register({
    id: 'L08a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 0%,#7a1f4d,#2b0f2e 72%)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const per = easy ? 3 : 4;
      const previewMs = easy ? 5000 : hard ? 2200 : 3500;
      // split the items into boards; items a child could confuse go to different boards
      const items = ctx.items.slice(); const nB = Math.max(1, Math.ceil(items.length / per));
      const sizes = Array.from({ length: nB }, (_, i) => Math.floor(items.length / nB) + (i < items.length % nB ? 1 : 0));
      let boards = null;
      for (let tries = 0; tries < 40 && !boards; tries++) {
        const bs = sizes.map(() => []); let ok = true;
        for (const it of (tries ? u.shuffle(items) : items)) {
          const b = bs.find((x, i) => x.length < sizes[i] && !x.some((y) => clash(y, it)));
          if (!b) { ok = false; break; } b.push(it);
        }
        if (ok) boards = bs;
      }
      if (!boards) { boards = sizes.map(() => []); items.forEach((it) => boards.find((x, i) => x.length < sizes[i]).push(it)); }

      const status = u.el('div', { class: 'l08a-status' });
      const grid = u.el('div', { class: 'l08a-grid', role: 'group', 'aria-label': 'Memory cards 翻牌' });
      st.body.append(u.el('div', { class: 'l08a-wrap' }, status, grid));
      const slot = u.el('div', { class: 'ls-listen' });
      st.head.append(L.say('🃏 翻開藍色聲音牌聽句子，再翻開跟它配對的紅色圖牌。', 'Flip a blue sound card, then find its picture card.'), slot);

      L.rounds(ctx, boards, (board, bi) => new Promise((done) => {
        T.clear(); grid.innerHTML = ''; slot.innerHTML = '';
        const nDec = board.length >= 4 ? 1 : 2;
        const decoys = L.others(ctx, board[0], nDec, { levelOnly: true, filter: (w) => !board.some((b) => clash(b, w)) && !ctx.items.includes(w) });
        const cards = [];
        const mk = (kind, w) => {
          const c = { kind, w, up: false, done: false };
          const back = u.el('span', { class: 'l08a-face l08a-back', 'aria-hidden': 'true' },
            u.el('span', { class: 'l08a-ic' }, kind === 'snd' ? '🎧' : '🎴'), kind === 'snd' ? 'Sound 聲音' : 'Picture 圖');
          c.front = u.el('span', { class: 'l08a-face l08a-front', 'aria-hidden': 'true' });
          if (kind === 'pic') c.front.append(L.face(w));
          else c.front.append(u.el('span', { class: 'l08a-wave' }, '🔊'), easy ? u.el('span', { class: 'l08a-txt' }, w.sentence) : u.el('span', { class: 'l08a-txt' }, 'Listen! 仔細聽'));
          c.b = u.el('button', { class: 'l08a-card l08a-' + kind }, u.el('span', { class: 'l08a-in' }, back, c.front));
          ctx.on(c.b, 'click', () => tap(c));
          cards.push(c); return c;
        };
        const snd = board.map((w) => mk('snd', w));
        const pic = u.shuffle(board.concat(decoys)).map((w) => mk('pic', w));
        const order = u.shuffle(cards);
        const total = order.length; const sr = ctx.root.getBoundingClientRect(); const portrait = sr.height > sr.width * 1.2;
        const cols = total <= 4 ? 2 : portrait || total === 6 || total === 9 || total === 5 ? 3 : 4;
        grid.style.setProperty('--cols', cols); grid.style.setProperty('--rows', Math.ceil(total / cols));
        order.forEach((c) => grid.appendChild(c.b));
        const num = { snd: 0, pic: 0 }; order.forEach((c) => (c.n = ++num[c.kind]));
        const label = (c) => {
          let t;
          if (c.kind === 'snd') t = c.done ? `${c.w.sentence} ✔` : c === active ? `Sound card ${c.n} 聲音牌 ${c.n}: playing, tap to replay 播放中，再點一次重播` : `Sound card ${c.n} 聲音牌 ${c.n}`;
          else t = c.up || c.done ? `${c.w.zh}${c.done ? ' ✔' : ''}` : `Picture card ${c.n} 圖牌 ${c.n}`;
          c.b.setAttribute('aria-label', t);
        };
        const setUp = (c, on) => { c.up = on; c.b.classList.toggle('l08a-up', on); label(c); };
        let active = null, busy = false, previewing = true, finished = false, matched = 0;
        const tried = new Set(); const misses = new Map();
        const showStatus = () => { status.innerHTML = ''; status.append(u.el('span', { class: 'chip' }, `🎴 Pairs 配對 ${matched}/${board.length}`), boards.length > 1 ? u.el('span', { class: 'chip' }, `Board 第 ${bi + 1}/${boards.length} 組`) : null); };
        const prompt = () => { slot.innerHTML = ''; slot.append(u.el('span', { class: 'l08a-tip' }, '👆 Tap a blue sound card 點一張藍色聲音牌')); };
        let bar = null;
        const listenTo = (w) => { slot.innerHTML = ''; bar = L.listenBar(ctx, w, { delay: 200 }); slot.append(bar); };
        cards.forEach(label); showStatus();

        const pair = (s, p, record) => {
          active = null; s.done = p.done = true;
          [s, p].forEach((c) => { c.b.classList.remove('l08a-active', 'l08a-hint', 'l08a-miss'); c.b.classList.add('l08a-done', 'l08a-up'); c.b.setAttribute('aria-disabled', 'true'); });
          s.front.innerHTML = ''; s.front.append(u.el('span', { class: 'l08a-txt' }, s.w.sentence), u.el('span', { class: 'l08a-zh zh' }, s.w.sentenceZh));
          label(s); label(p);
          if (record) ctx.answer(s.w, true, posOf(ctx, p.b)); else EP.sfx.correct();
          EP.sfx.coin(); matched++; showStatus();
          if (matched >= board.length) {
            finished = true; T.clear();
            ctx.timeout(() => { ctx.burst('🎉 Board clear! 全部配對'); EP.sfx.win(); ctx.timeout(done, 1100); }, 600);
          } else prompt();
        };
        const tap = (c) => {
          if (previewing || busy || finished || c.done) return;
          if (c.kind === 'snd') {
            if (active === c) { if (bar) bar.play(false); return; }
            if (active) { active.b.classList.remove('l08a-active'); const old = active; active = null; setUp(old, false); }
            active = c; c.b.classList.add('l08a-active'); setUp(c, true); EP.sfx.pop(); listenTo(c.w);
            return;
          }
          if (!active) { ctx.toast('先翻藍色聲音牌 Flip a blue sound card first'); ctx.shake(c.b); return; }
          if (c.up) return;
          setUp(c, true);
          const s = active, item = s.w;
          if (c.w === item) { pair(s, c, !tried.has(item)); return; }
          // wrong picture: the first miss for this sentence counts as wrong
          busy = true; c.b.classList.add('l08a-miss');
          const n = (misses.get(item) || 0) + 1; misses.set(item, n);
          if (!tried.has(item)) { tried.add(item); ctx.answer(item, false, Object.assign(posOf(ctx, c.b), { label: '✗' })); } else EP.sfx.wrong();
          ctx.timeout(() => {
            c.b.classList.remove('l08a-miss'); setUp(c, false);
            if (n >= 2) { // second miss: show the right card as a learning moment
              const r = pic.find((p) => p.w === item); setUp(r, true); r.b.classList.add('l08a-hint');
              ctx.toast('這一張才對！That one!'); ctx.say(item, { sentence: true });
              ctx.timeout(() => { busy = false; pair(s, r, false); }, 1300);
            } else { busy = false; if (bar) bar.play(false); }
          }, 900);
        };

        // preview: the picture cards are face up for a few seconds
        pic.forEach((c) => setUp(c, true));
        const ready = u.el('button', { class: 'btn small go' }, "▶ I'm ready 我記住了");
        const timer = u.el('div', { class: 'l08a-timer', 'aria-hidden': 'true' }, u.el('i', { style: { animationDuration: previewMs + 'ms' } }));
        slot.append(u.el('span', { class: 'l08a-tip' }, '👀 Remember the pictures! 記住圖牌位置'), ready, timer);
        const endPreview = () => {
          if (!previewing || ctx.ended) return; previewing = false;
          pic.forEach((c) => setUp(c, false)); EP.sfx.whoosh(); prompt();
          const next = () => active || snd.find((s) => !s.done);
          T.set(() => { const s = next(); if (!s) return; if (active !== s) tap(s); tap(pic.find((p) => p.w === s.w)); },
            () => { const s = next(); if (!s) return; if (active !== s) tap(s); tap(pic.find((p) => !p.done && !p.up && p.w !== s.w) || pic.find((p) => p.w === s.w)); });
        };
        ready.addEventListener('click', endPreview);
        ctx.timeout(endPreview, previewMs);
      }));
      return { test: T.api };
    },
  });

  /* ===== L08b Lantern Riddles — the lantern with exactly the heard sentence ===== */
  const AVOID = new Set(['day', 'eve']); // too general to read well in another sentence
  /** look-alike sentences: the key word swapped with another festival word, or other official sentences */
  function lookAlikes(ctx, item, n) {
    const out = []; const seen = new Set([u.norm(item.sentence)]);
    const add = (s) => { if (!s || out.length >= n) return; const k = u.norm(s); if (seen.has(k)) return; seen.add(k); out.push(s); };
    const k = L.key(item);
    if (k) {
      const toks = L.tokens(item.sentence); const prev = k.index > 0 ? toks[k.index - 1].w : '';
      const nounSlot = ['the', 'a', 'an', 'my'].includes(prev) || /^[a-z]/.test(item.word);
      const lowS = item.sentence.toLowerCase(), lowK = k.text.toLowerCase();
      const cands = levelOf(ctx, item).filter((o) => o !== item && u.norm(o.word) !== u.norm(item.word)).map((o) => {
        let r = L.key(o) ? L.keyText(o) : base(o);
        if (/s$/i.test(r) && !/s$/i.test(base(o))) r = base(o); // mooncakes → mooncake
        if (k.index === 0) r = capFirst(r); else if (/^[a-z]/.test(o.word)) r = r.charAt(0).toLowerCase() + r.slice(1);
        // same kind of word first (holiday name ↔ holiday name, thing ↔ thing with a picture)
        return { o, r, pref: ((/^[a-z]/.test(o.word)) === nounSlot ? 2 : 0) + (nounSlot && EP.pic(o) ? 1 : 0) + Math.random() };
      }).filter((c) => !lowS.includes(c.r.toLowerCase()) && !c.r.toLowerCase().includes(lowK) && !AVOID.has(c.r.toLowerCase()) &&
        !(prev === 'a' && /^[aeiou]/i.test(c.r)) && !(prev === 'an' && !/^[aeiou]/i.test(c.r)));
      const ranked = cands.sort((a, b) => b.pref - a.pref);
      ranked.forEach((c) => add(L.swapKey(item, c.r)));
    }
    similar(ctx, item, (w) => w.sentence !== item.sentence).forEach((w) => add(w.sentence));
    return out;
  }
  L.register({
    id: 'L08b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(#0b1033 0%,#2a1650 60%,#5a1a3a 100%)' });
      const n = ctx.difficulty === 'easy' ? 2 : ctx.difficulty === 'hard' ? 4 : 3;
      const sky = u.el('div', { class: 'l08b-sky' }, u.el('div', { class: 'l08b-stars', 'aria-hidden': 'true' }));
      st.body.append(sky);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🏮 燈籠下的燈謎紙寫著很像的句子，點「和你聽到的完全一樣」的那一個。', 'Tap the lantern with exactly the sentence you heard.'), L.listenBar(ctx, item));
        const texts = u.shuffle([item.sentence].concat(lookAlikes(ctx, item, n - 1)));
        const right = texts.indexOf(item.sentence);
        sky.querySelectorAll('.l08b-rope,.l08b-row').forEach((e) => e.remove());
        const row = u.el('div', { class: 'l08b-row', role: 'group', 'aria-label': 'Lanterns 燈籠' });
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true; T.clear();
          const ok = i === right; const b = btns[i];
          b.classList.add(ok ? 'l08b-lit' : 'l08b-out');
          if (!ok) btns[right].classList.add('l08b-right'); else ctx.burst('🎆');
          L.feedback(ctx, item, ok, Object.assign(posOf(ctx, b), { wrongText: 'Not that lantern 不是這一個' })).then(done);
        };
        const btns = texts.map((t, i) => {
          const letter = 'ABCD'[i];
          const b = u.el('button', { class: 'l08b-lan', 'aria-label': `Lantern ${letter} 燈籠 ${letter}: ${t}` },
            u.el('span', { class: 'l08b-cord', 'aria-hidden': 'true' }),
            u.el('span', { class: 'l08b-body', 'aria-hidden': 'true' }, letter),
            u.el('span', { class: 'l08b-slip' }, t),
            u.el('span', { class: 'l08b-tassel', 'aria-hidden': 'true' }));
          ctx.on(b, 'click', () => pick(i)); row.appendChild(b); return b;
        });
        row.style.setProperty('--n', texts.length);
        sky.append(u.el('div', { class: 'l08b-rope', 'aria-hidden': 'true' }), row);
        T.set(() => pick(right), () => pick(right === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });

  /* ===== L08c Red Envelope Quiz — open the envelope with the right Chinese meaning ===== */
  L.register({
    id: 'L08c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#fff3bf 0%,#ffd43b 55%,#f59f00 100%)', dark: false });
      const d = ctx.difficulty; const n = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
      let got = 0;
      const purse = u.el('span', { class: 'l08c-purse', role: 'status' });
      const showPurse = () => { purse.textContent = `🧧 紅包 Red envelopes: ${got}`; };
      showPurse(); st.foot.append(purse);
      const table = u.el('div', { class: 'l08c-table', role: 'group', 'aria-label': 'Red envelopes 紅包' });
      const gran = u.el('div', { class: 'l08c-gran', 'aria-hidden': 'true' }, '👵🧧');
      st.body.append(gran, table);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🧧 奶奶說一句英文，打開寫著「正確中文意思」的紅包！', 'Open the envelope with the right Chinese meaning.'), L.listenBar(ctx, item));
        const okZh = (w) => w.sentenceZh && w.sentenceZh !== item.sentenceZh && w.sentence !== item.sentence;
        let others = d === 'easy' ? u.shuffle(levelOf(ctx, item).filter((w) => w !== item && okZh(w))) : similar(ctx, item, okZh);
        if (d === 'normal') others = u.shuffle(others.slice(0, 5));
        const picked = []; const zs = new Set([item.sentenceZh]);
        for (const w of others) { if (picked.length >= n - 1) break; if (zs.has(w.sentenceZh)) continue; zs.add(w.sentenceZh); picked.push(w); }
        const opts = u.shuffle([item].concat(picked));
        const right = opts.indexOf(item);
        table.innerHTML = '';
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true; T.clear();
          const ok = i === right; const b = envs[i];
          b.querySelector('.l08c-prize').textContent = ok ? '🪙💰' : '💨';
          b.classList.add('l08c-open', ok ? 'l08c-win' : 'l08c-lose');
          if (ok) { got++; showPurse(); EP.sfx.coin(); ctx.timeout(() => EP.sfx.coin(), 160); } else envs[right].classList.add('l08c-right');
          L.feedback(ctx, item, ok, Object.assign(posOf(ctx, b), { showOnRight: true, wrongText: 'Empty! 空的，再聽一次' })).then(done);
        };
        const envs = opts.map((w, i) => {
          const b = u.el('button', { class: 'l08c-env', 'aria-label': `Envelope ${i + 1} 紅包 ${i + 1}: ${w.sentenceZh}` },
            u.el('span', { class: 'l08c-prize', 'aria-hidden': 'true' }),
            u.el('span', { class: 'l08c-flap', 'aria-hidden': 'true' }),
            u.el('span', { class: 'l08c-seal', 'aria-hidden': 'true' }, '福'),
            u.el('span', { class: 'l08c-label zh' }, w.sentenceZh));
          ctx.on(b, 'click', () => pick(i)); table.appendChild(b); return b;
        });
        T.set(() => pick(right), () => pick(right === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });
})();
