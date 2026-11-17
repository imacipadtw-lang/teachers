/* Sentence Listening — Level 24 (Adverbs & little words 副詞與常用小字): DARTS, GO_STOP, LANE_SWITCH
 * 32 items, every key word is found in its sentence; only 9 have an emoji, so the games show words, not pictures.
 * Distractor words that also occur in the heard sentence are never used ("I have too much homework" has "too"). */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;
  const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /** key word as written on a label (sentence-start capital removed, "I" kept) */
  const lab = (w) => { const k = L.key(w); let t = k ? k.text : L.keyText(w); if (!/^I\b/.test(t)) t = t.charAt(0).toLowerCase() + t.slice(1); return t; };
  const inSent = (item, text) => { const toks = new Set(L.tokens(item.sentence).map((x) => x.w)); return String(text).toLowerCase().split(/\s+/).some((x) => toks.has(x)); };
  /** n distractor items of this level with a different label that is not in the target sentence */
  const distract = (ctx, item, n) => {
    const seen = new Set([lab(item).toLowerCase()]);
    return L.others(ctx, item, n + 10, { levelOnly: true, needKey: true }).filter((w) => { const t = lab(w).toLowerCase(); if (seen.has(t) || inSent(item, t)) return false; seen.add(t); return true; }).slice(0, n);
  };
  const center = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; };
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
  const hint = (item, cls) => u.el('div', { class: 'ls-instr zh ' + cls }, '💡 ' + item.sentenceZh);

  L.css('L24', `
.l24a-hint,.l24c-hint{font-size:.95rem;padding:4px 12px}
.l24a-wrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;--d:clamp(180px,min(35vh,80vw),340px)}
.l24a-aimword{background:#fff;color:#1d2340;font-weight:900;border-radius:12px;padding:1px 14px;font-size:clamp(1.1rem,3.6vw,1.4rem);min-width:7em;text-align:center;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.l24a-aimword small{font-size:.72rem;color:#495057;font-weight:800;margin-right:6px}
.l24a-arrow{font-size:1.9rem;line-height:1;color:#ffd43b;margin-bottom:-14px;z-index:3;text-shadow:0 2px 0 #000}
.l24a-disc{position:relative;width:var(--d);height:var(--d);border-radius:50%;border:10px solid #343a40;box-shadow:0 0 0 4px #ffd43b,0 10px 0 rgba(0,0,0,.35);overflow:hidden;box-sizing:content-box}
.l24a-board{position:absolute;inset:0;border-radius:50%;will-change:transform}
.l24a-arm{position:absolute;left:50%;top:50%;width:0;height:0}
.l24a-txt{position:absolute;left:0;top:calc(var(--d) * -.31);transform:translate(-50%,-50%);width:max-content;max-width:calc(var(--d) * .4);text-align:center;font-weight:900;font-size:clamp(.85rem,2.7vw,1.15rem);line-height:1.1;color:#1d2340;padding:2px 5px;border-radius:8px}
.l24a-txt.l24a-hit{background:#237032;color:#fff;outline:3px solid #fff}
.l24a-txt.l24a-miss{background:#c92a2a;color:#fff;outline:3px solid #fff}
.l24a-bull{position:absolute;left:50%;top:50%;width:16%;height:16%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#e03131 0 40%,#fff 41% 55%,#2f9e44 56%);box-shadow:0 0 0 3px #343a40}
.l24a-dart{position:absolute;left:50%;bottom:2px;width:26px;height:68px;margin-left:-13px;z-index:4;transition:bottom .26s ease-in;filter:drop-shadow(0 3px 2px rgba(0,0,0,.5));pointer-events:none}
.l24a-throw{background:#237032;color:#fff;text-shadow:none}
.l24b-scene{position:relative;width:100%;max-width:900px;flex:1;min-height:250px;max-height:440px;border-radius:22px;overflow:hidden;background:linear-gradient(#74c0fc 0,#d0ebff 55%,#69db7c 55%,#40c057 62%,#495057 62%,#343a40 100%)}
.l24b-sign{position:absolute;left:50%;top:5%;transform:translateX(-50%);width:min(90%,600px);background:#1b5e2a;color:#fff;border:4px solid #fff;border-radius:14px;padding:8px 14px 10px;box-shadow:0 6px 0 rgba(0,0,0,.3);text-align:center;z-index:2}
.l24b-signhead{font-size:.8rem;font-weight:800;letter-spacing:.06em;color:#d3f9d8}
.l24b-text{display:block;font-weight:900;font-size:clamp(1.2rem,4.3vw,1.9rem);line-height:1.25}
.l24b-diff{background:#ffd43b;color:#1d2340;border-radius:6px;padding:0 4px}
.l24b-post{position:absolute;top:20%;bottom:38%;width:10px;background:#868e96;z-index:1}
.l24b-light{position:absolute;bottom:calc(38% + 6px);left:calc(70% - 88px);display:flex;gap:5px;background:#212529;border-radius:12px;padding:5px 7px;z-index:2}
.l24b-light i{display:block;width:20px;height:20px;border-radius:50%;background:#495057}
.l24b-light .l24b-on.l24b-r{background:#ff6b6b;box-shadow:0 0 10px #ff6b6b}.l24b-light .l24b-on.l24b-a{background:#ffd43b;box-shadow:0 0 10px #ffd43b}.l24b-light .l24b-on.l24b-g{background:#69db7c;box-shadow:0 0 10px #69db7c}
.l24b-line{position:absolute;bottom:0;height:38%;left:70%;width:10px;background:repeating-linear-gradient(#fff 0 10px,transparent 10px 18px)}
.l24b-dash{position:absolute;left:0;right:0;bottom:19%;height:4px;background:repeating-linear-gradient(90deg,#ffd43b 0 26px,transparent 26px 50px)}
.l24b-car{position:absolute;bottom:20%;left:0;font-size:clamp(2.6rem,8vw,4rem);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l24b-car>span{display:inline-block;transform:scaleX(-1)}
.l24b-drive{transition:left 1.1s ease-in}
.l24b-skid{position:absolute;bottom:20%;font-size:1.8rem}
.l24b-btn{min-height:72px;min-width:150px;border:0;border-radius:22px;font-weight:900;font-size:1.35rem;color:#fff;padding:10px 20px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.l24b-btn:active{transform:translateY(4px)}
.l24b-btn:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l24b-go{background:#237032;box-shadow:0 6px 0 #0f3d18}.l24b-stop{background:#c92a2a;box-shadow:0 6px 0 #7d1a1a}
.l24c-track{position:relative;width:min(94%,520px);flex:1;min-height:260px;max-height:470px;border-radius:22px;overflow:hidden;background:#b54a2a;box-shadow:inset 0 0 0 5px #fff,0 8px 0 rgba(0,0,0,.25);touch-action:none;user-select:none;-webkit-user-select:none}
.l24c-mid{position:absolute;top:0;bottom:0;left:50%;width:6px;margin-left:-3px;background:repeating-linear-gradient(#fff 0 22px,transparent 22px 44px);animation:l24c-run .5s linear infinite}
@keyframes l24c-run{to{background-position:0 44px}}
.l24c-gate{position:absolute;top:0;width:42%;height:70px;transform:translateX(-50%);border:6px solid #ffd43b;border-bottom:0;border-radius:14px 14px 0 0;display:flex;justify-content:center;align-items:flex-start;padding-top:6px;z-index:2}
.l24c-word{background:#fff;color:#1d2340;font-weight:900;font-size:clamp(1.05rem,3.8vw,1.45rem);border-radius:10px;padding:2px 10px;box-shadow:0 3px 0 rgba(0,0,0,.25);max-width:100%;overflow-wrap:anywhere;text-align:center}
.l24c-pass{border-color:#69db7c}.l24c-pass .l24c-word{background:#237032;color:#fff}
.l24c-crash{border-color:#ff6b6b}.l24c-crash .l24c-word{background:#c92a2a;color:#fff}
.l24c-runner{position:absolute;bottom:14px;left:25%;transform:translateX(-50%);font-size:clamp(2.6rem,8vw,3.6rem);line-height:1;transition:left .18s ease-out;z-index:3;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l24c-runner>span{display:inline-block;animation:l24c-bob .32s ease-in-out infinite alternate}
@keyframes l24c-bob{to{transform:translateY(-6px)}}
.l24c-ready{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);background:rgba(255,255,255,.95);color:#1d2340;border-radius:14px;padding:6px 14px;font-weight:900;z-index:2;text-align:center}
.l24c-status{background:rgba(255,255,255,.94);color:#1d2340;border-radius:14px;padding:6px 12px;font-weight:800;align-self:center}
.l24c-btn{background:#fff;color:#1d2340;min-width:120px}
`);

  /** which key words of this level can replace each other in a sentence and still make good English (L24b signs) */
  const SWAP = {
    not: ['very', 'too', 'quite'], very: ['not', 'too', 'quite'], too: ['very', 'quite', 'not'], quite: ['very', 'too', 'not'],
    usually: ['sometimes'], sometimes: ['usually'], now: ['soon', 'again'], soon: ['now', 'again'], again: ['now'], 'every day': ['again', 'now'],
    true: ['right', 'okay'], right: ['sure', 'okay', 'sorry'], okay: ['right'], sure: ['okay', 'sorry', 'right'], sorry: ['sure', 'okay'],
    up: ['down'], down: ['up'], here: ['at home', 'there'], 'at home': ['here', 'there'], there: ['here'],
  };
  const DART = '<svg viewBox="0 0 26 68" width="26" height="68" aria-hidden="true"><polygon points="13,0 17,16 9,16" fill="#868e96"/><rect x="11" y="15" width="4" height="36" rx="2" fill="#c92a2a"/><polygon points="13,46 25,66 13,59 1,66" fill="#1c7ed6"/></svg>';

  /* L24a Word Darts — a spinning dartboard; throw when the heard word is under the aim */
  L.register({
    id: 'L24a',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty; const rm = RM();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 45%,#3b2f63,#140f2a 75%)' });
      const n = d === 'easy' ? 4 : d === 'hard' ? 6 : 5;
      const spd = d === 'easy' ? 40 : d === 'hard' ? 92 : 62; // degrees per second
      const stepDur = d === 'easy' ? 1.6 : d === 'hard' ? 0.8 : 1.15; // reduced motion: one sector per step
      const aimWord = u.el('div', { class: 'l24a-aimword' });
      const arrow = u.el('div', { class: 'l24a-arrow', 'aria-hidden': 'true' }, '▼');
      const board = u.el('div', { class: 'l24a-board', role: 'img', 'aria-label': 'Spinning dartboard 旋轉的飛鏢靶' });
      const dart = u.el('div', { class: 'l24a-dart', html: DART });
      const disc = u.el('div', { class: 'l24a-disc' }, board); // fixed frame clips the rotating board
      const wrap = u.el('div', { class: 'l24a-wrap' }, aimWord, arrow, disc, dart);
      const throwBtn = u.el('button', { class: 'btn big l24a-throw', type: 'button' }, '🎯 Throw 射飛鏢！');
      st.body.append(wrap); st.foot.append(throwBtn);
      let A = 0, s = 90, dir = 1, flipT = 2, stepT = 0, spinning = false, answered = true, sectors = [], shownIdx = -1, cur = null, finishRound = null;
      const under = () => Math.floor((((-A % 360) + 360) % 360) / s) % sectors.length;
      const paint = () => {
        board.style.transform = `rotate(${A}deg)`;
        const i = under(); if (i === shownIdx || !sectors[i]) return; shownIdx = i;
        aimWord.innerHTML = ''; aimWord.append(u.el('small', {}, 'At the aim 準心：'), sectors[i].text);
      };
      ctx.loop((dt) => {
        if (!spinning || !sectors.length) return;
        if (rm) { stepT += dt; if (stepT >= stepDur) { stepT = 0; A -= s; } }
        else {
          A += spd * dir * dt * (ctx.speed || 1);
          if (d === 'hard') { flipT -= dt; if (flipT <= 0) { flipT = u.rand(1.6, 3.4); dir = -dir; } }
        }
        paint();
      });
      const fire = () => {
        if (answered || !sectors.length) return; answered = true; spinning = false;
        const item = cur; const sec = sectors[under()]; const ok = sec.w === item;
        EP.sfx.whoosh();
        dart.style.bottom = Math.round(board.offsetHeight * 0.9 - 60) + 'px'; // the tip lands in the sector under the aim
        ctx.wait(rm ? 60 : 280).then(() => {
          EP.sfx.stamp(); sec.el.classList.add(ok ? 'l24a-hit' : 'l24a-miss');
          const p = center(ctx, arrow);
          return L.feedback(ctx, item, ok, { x: p.x, y: p.y + 30, wrongText: `You hit “${sec.text}” 你射中了「${sec.text}」` });
        }).then(() => finishRound && finishRound());
      };
      ctx.on(throwBtn, 'click', fire);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        cur = item; finishRound = done;
        st.head.innerHTML = '';
        st.head.append(L.say('🎯 聽句子，你聽到的字轉到最上面的準心 ▼ 時，按「射飛鏢」！', 'Throw when the word you hear is under the aim.'), L.listenBar(ctx, item));
        if (d === 'easy') st.head.append(hint(item, 'l24a-hint'));
        const opts = u.shuffle([item].concat(distract(ctx, item, n - 1)));
        s = 360 / opts.length;
        const cols = ['#fff3bf', '#d0ebff', '#ffe3e3', '#d3f9d8', '#e5dbff', '#ffe8cc'];
        board.innerHTML = '';
        board.style.background = `conic-gradient(${opts.map((w, i) => `${cols[i % cols.length]} ${i * s}deg ${(i + 1) * s}deg`).join(',')})`;
        sectors = opts.map((w, i) => {
          const el = u.el('span', { class: 'l24a-txt' }, lab(w));
          board.appendChild(u.el('div', { class: 'l24a-arm', style: { transform: `rotate(${(i + 0.5) * s}deg)` } }, el));
          // thin divider line at the start of the sector
          board.appendChild(u.el('div', { class: 'l24a-arm', 'aria-hidden': 'true', style: { transform: `rotate(${i * s}deg)` } }, u.el('i', { style: { position: 'absolute', left: '-1px', top: 'calc(var(--d) * -.5)', width: '2px', height: 'calc(var(--d) * .5)', background: 'rgba(29,35,64,.35)' } })));
          return { w, el, text: lab(w) };
        });
        board.appendChild(u.el('div', { class: 'l24a-bull', 'aria-hidden': 'true' }));
        // start with another sector at the aim
        const ti = sectors.findIndex((x) => x.w === item); let si = u.randInt(0, sectors.length - 1); if (si === ti) si = (si + 1) % sectors.length;
        A = -(si + 0.5) * s; shownIdx = -1; dir = 1; flipT = u.rand(1.6, 3.4); stepT = 0;
        dart.style.bottom = '';
        paint(); spinning = true; answered = false;
        const aimAt = (i) => { A = -(i + 0.5) * s; paint(); };
        T.set(() => { if (answered) return; aimAt(ti); fire(); }, () => { if (answered) return; aimAt(sectors.findIndex((x) => x.w !== item)); fire(); });
      }));
      return { test: T.api };
    },
  });

  /* L24b Go or Stop? — a road sign shows a sentence; GO if it is what you heard, STOP if it is not */
  L.register({
    id: 'L24b',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#1864ab,#4dabf7)' });
      const travel = d === 'easy' ? 13 : d === 'hard' ? 7 : 10; // seconds until the car reaches the stop line
      const swapShare = d === 'easy' ? 0.3 : d === 'hard' ? 0.8 : 0.55; // non-matching signs: one-word swaps vs other sentences
      const text = u.el('span', { class: 'l24b-text', lang: 'en' });
      const sign = u.el('div', { class: 'l24b-sign' }, u.el('div', { class: 'l24b-signhead' }, 'ROAD SIGN 路牌'), text);
      const lamps = { r: u.el('i', { class: 'l24b-r' }), a: u.el('i', { class: 'l24b-a' }), g: u.el('i', { class: 'l24b-g' }) };
      const light = u.el('div', { class: 'l24b-light', 'aria-hidden': 'true' }, lamps.r, lamps.a, lamps.g);
      const car = u.el('div', { class: 'l24b-car', 'aria-hidden': 'true' }, u.el('span', {}, '🚗'));
      const scene = u.el('div', { class: 'l24b-scene', role: 'group', 'aria-label': 'Road 馬路' },
        u.el('div', { class: 'l24b-post', 'aria-hidden': 'true', style: { left: 'calc(50% - min(45%, 300px) * .7)' } }), u.el('div', { class: 'l24b-post', 'aria-hidden': 'true', style: { left: 'calc(50% + min(45%, 300px) * .7 - 10px)' } }),
        sign, u.el('div', { class: 'l24b-dash', 'aria-hidden': 'true' }), u.el('div', { class: 'l24b-line', 'aria-hidden': 'true' }), light, car);
      const goBtn = u.el('button', { class: 'l24b-btn l24b-go', type: 'button', 'aria-label': 'GO — the sign is the same as what I heard 一樣，前進' }, '🟢 GO 一樣');
      const stopBtn = u.el('button', { class: 'l24b-btn l24b-stop', type: 'button', 'aria-label': 'STOP — the sign is different 不一樣，停車' }, '🔴 STOP 不一樣');
      st.body.append(scene); st.foot.append(goBtn, stopBtn);
      const N = ctx.items.length;
      const plan = u.shuffle(Array.from({ length: N }, (_, i) => i < Math.ceil(N / 2))); // about half of the signs match
      let match = true, prog = 0, rolling = false, answered = true, cur = null, diffEl = null, finishRound = null, skid = null;
      const lamp = (k) => Object.keys(lamps).forEach((x) => lamps[x].classList.toggle('l24b-on', x === k));
      const carMax = () => Math.max(20, scene.clientWidth * 0.7 - car.offsetWidth - 6);
      const placeCar = () => { car.style.left = 8 + prog * (carMax() - 8) + 'px'; };
      /** a sign that differs from the heard sentence: its key word swapped for another key word of the level that
       *  fits the same place (so the sign is still good English, text only), or another sentence of the level */
      const variant = (item) => {
        const k = L.key(item); const alts = k ? SWAP[k.text.toLowerCase()] || [] : [];
        if (alts.length && Math.random() < swapShare) {
          for (const a of u.shuffle(alts)) {
            if (inSent(item, a) || !EP.levelWords(24).some((w) => lab(w).toLowerCase() === a)) continue;
            let t = a; if (k.index === 0) t = t.charAt(0).toUpperCase() + t.slice(1);
            const s = L.swapKey(item, t);
            if (s && norm(s) !== norm(item.sentence)) return { before: item.sentence.slice(0, k.start), word: t, after: item.sentence.slice(k.start + k.text.length) };
          }
        }
        const o = L.others(ctx, item, 6, { levelOnly: true }).find((w) => norm(w.sentence) !== norm(item.sentence));
        return o ? { whole: o.sentence } : null;
      };
      const decide = (go) => {
        if (answered) return; answered = true; rolling = false;
        const item = cur; const ok = go === match;
        lamp(go ? 'g' : 'r');
        if (diffEl) diffEl.classList.add('l24b-diff');
        if (go) { car.classList.add('l24b-drive'); void car.offsetWidth; car.style.left = scene.clientWidth + 60 + 'px'; EP.sfx.whoosh(); }
        else { EP.sfx.stamp(); skid = u.el('div', { class: 'l24b-skid', 'aria-hidden': 'true', style: { left: Math.max(0, car.offsetLeft - 30) + 'px' } }, '💨'); scene.appendChild(skid); }
        const p = center(ctx, sign);
        L.feedback(ctx, item, ok, { x: p.x, y: p.y + 30, showOnRight: !match, okMs: match ? 750 : 1400, wrongText: match ? 'Same! 路牌和聽到的一樣' : 'Different! 路牌和聽到的不一樣' }).then(() => finishRound && finishRound());
      };
      const late = () => {
        if (answered) return; answered = true; rolling = false; lamp('r');
        const p = center(ctx, car);
        L.feedback(ctx, cur, false, { x: p.x, y: p.y - 30, wrongText: 'Too late! 太慢了，要在停止線前決定' }).then(() => finishRound && finishRound());
      };
      ctx.on(goBtn, 'click', () => decide(true)); ctx.on(stopBtn, 'click', () => decide(false));
      ctx.loop((dt) => {
        if (!rolling || answered) return;
        prog = Math.min(1, prog + (dt * (ctx.speed || 1)) / travel); placeCar();
        if (prog >= 1) late();
      });
      L.rounds(ctx, ctx.items, (item, idx) => new Promise((done) => {
        cur = item; finishRound = done; rolling = false; prog = 0; diffEl = null;
        match = plan[idx % plan.length];
        let v = null; if (!match) { v = variant(item); if (!v) match = true; }
        text.innerHTML = '';
        if (match) text.textContent = item.sentence;
        else if (v.whole) text.textContent = v.whole;
        else { diffEl = u.el('span', {}, v.word); text.append(v.before, diffEl, v.after); }
        if (skid) { skid.remove(); skid = null; }
        car.classList.remove('l24b-drive'); placeCar(); lamp('a');
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🚥 看路牌、聽句子：一樣按綠燈 GO，不一樣按紅燈 STOP！', 'GO if the sign matches what you hear, STOP if not.'), bar);
        answered = false;
        ctx.timeout(() => { Promise.race([bar.play(false), ctx.wait(4000)]).then(() => { if (cur === item && !answered) rolling = true; }); }, 450);
        T.set(() => decide(match), () => decide(!match));
      }));
      return { test: T.api };
    },
  });

  /* L24c Two-Lane Run — switch lanes so you run through the gate with the heard word */
  L.register({
    id: 'L24c',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#2b8a3e,#8ce99a)' });
      const travel = d === 'easy' ? 7.5 : d === 'hard' ? 3.8 : 5.5; // seconds for the gates to reach the runner
      const runner = u.el('div', { class: 'l24c-runner', 'aria-hidden': 'true' }, u.el('span', {}, '🏃'));
      const ready = u.el('div', { class: 'l24c-ready', 'aria-hidden': 'true' });
      const track = u.el('div', { class: 'l24c-track', role: 'group', 'aria-label': 'Two-lane track 雙線跑道' }, u.el('div', { class: 'l24c-mid', 'aria-hidden': 'true' }), ready, runner);
      const status = u.el('div', { class: 'l24c-status zh', role: 'status' });
      const leftBtn = u.el('button', { class: 'btn big l24c-btn', type: 'button', 'aria-label': 'Move to the left lane 換到左邊跑道' }, '⬅️ 左 Left');
      const rightBtn = u.el('button', { class: 'btn big l24c-btn', type: 'button', 'aria-label': 'Move to the right lane 換到右邊跑道' }, 'Right 右 ➡️');
      st.body.append(track, status); st.foot.append(leftBtn, rightBtn);
      let lane = 0, prog = 0, moving = false, answered = true, pair = [], gateEls = [], cur = null, finishRound = null;
      const say = () => { status.textContent = (lane ? '你在右邊跑道 Right lane' : '你在左邊跑道 Left lane') + (pair.length ? `：「${lab(pair[lane])}」` : ''); };
      const setLane = (l) => { if (answered || l === lane) return; lane = l; runner.style.left = l ? '75%' : '25%'; EP.sfx.jump(); say(); };
      const gateTop = () => { const runTop = track.clientHeight - 14 - runner.offsetHeight; return 6 + prog * Math.max(0, runTop - 30 - 6); };
      const placeGates = () => { const y = gateTop() + 'px'; gateEls.forEach((g) => (g.style.top = y)); };
      /** the gates reach the runner: judged by the lane the runner is in */
      const arrive = () => {
        if (answered) return; answered = true; moving = false;
        const item = cur; const ok = pair[lane] === item;
        gateEls[lane].classList.add(ok ? 'l24c-pass' : 'l24c-crash');
        if (ok) EP.sfx.coin(); else EP.sfx.boom();
        const p = center(ctx, gateEls[lane]);
        L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: `Wrong gate 跑進「${lab(pair[lane])}」門了` }).then(() => finishRound && finishRound());
      };
      ctx.on(leftBtn, 'click', () => setLane(0)); ctx.on(rightBtn, 'click', () => setLane(1));
      ctx.on(window, 'keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); setLane(0); }
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); setLane(1); }
      });
      let sw = null; // swipe or tap on the track
      ctx.on(track, 'pointerdown', (e) => { sw = { x: e.clientX }; });
      ctx.on(track, 'pointerup', (e) => {
        if (!sw) return; const dx = e.clientX - sw.x; sw = null;
        if (Math.abs(dx) > 30) setLane(dx > 0 ? 1 : 0);
        else { const r = track.getBoundingClientRect(); setLane(e.clientX - r.left > r.width / 2 ? 1 : 0); }
      });
      ctx.loop((dt) => {
        if (!moving || answered) return;
        prog = Math.min(1, prog + (dt * (ctx.speed || 1)) / travel); placeGates();
        if (prog >= 1) arrive();
      });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        cur = item; finishRound = done; moving = false; prog = 0;
        const other = distract(ctx, item, 1)[0];
        pair = other ? u.shuffle([item, other]) : [item, item];
        gateEls.forEach((g) => g.remove());
        gateEls = pair.map((w, i) => { const g = u.el('div', { class: 'l24c-gate', style: { left: i ? '75%' : '25%' } }, u.el('span', { class: 'l24c-word' }, lab(w))); track.insertBefore(g, runner); return g; });
        placeGates();
        ready.textContent = '👂 Listen… 先聽句子'; ready.style.display = '';
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🏃 聽句子，按 ⬅️ ➡️（或左右滑）換跑道，穿過寫著你聽到的字的門！', 'Switch lanes and run through the gate with the word you hear.'), bar);
        if (d === 'easy') st.head.append(hint(item, 'l24c-hint'));
        answered = false; say();
        ctx.timeout(() => { Promise.race([bar.play(false), ctx.wait(3500)]).then(() => { if (cur === item && !answered) { moving = true; ready.style.display = 'none'; } }); }, 400);
        T.set(() => { if (answered) return; setLane(pair.indexOf(item)); arrive(); }, () => { if (answered) return; setLane(pair.indexOf(item) ? 0 : 1); arrive(); });
      }));
      return { test: T.api };
    },
  });
})();
