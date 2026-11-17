/* Sentence Listening — Level 4 (Actions · Verbs): ANIMATED_CHOICE, CATCH, EMOJI_COMPOSE
 * L04a Action Charades — three actors act out actions; tap the one doing the action you hear.
 * L04b Verb Basket     — verbs fall from the sky; move the basket to catch the verb from the sentence.
 * L04c Emoji Text      — text a pen pal with two emoji: WHO (the subject) + WHAT (the action). */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen, el = u.el;
  const at = (ctx, node) => { const r = node.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top }; };
  const sfx = (n) => { try { EP.sfx && EP.sfx[n] && EP.sfx[n](); } catch (e) { /* sound is optional */ } };

  /** action picture for every level-4 sentence (many verbs have no emoji in the word list) */
  const ACT = { reuse: '♻️', rest: '😴', repeat: '🔁', run: '🏃', put: '📥', prepare: '🍳', pick: '💐', pay: '💵', write: '✍️', clean: '🧹', find: '🔍', hurt: '🤕', help: '🤝', miss: '💭', need: '🙏', 'want to': '🤩', try: '💪', 'have to': '⏰', 'wash hands': '🧼', 'wear a mask': '😷' };
  const actPic = (w) => ACT[w.word.toLowerCase()] || EP.pic(w) || '';
  /** the verb exactly as it is said in the sentence ("runs", "want to", "wear") */
  const verbOf = (w) => {
    const k = L.key(w);
    if (k) { const t = k.text.toLowerCase(); return /^(want|have|need|like) to$/.test(t) ? t : t.split(/\s+/)[0]; }
    const first = w.word.toLowerCase().split(/\s+/)[0];
    const tok = L.tokens(w.sentence).find((t) => t.w.startsWith(first.slice(0, 3)));
    return tok ? tok.w : first;
  };
  /** is this (one- or two-word) text said in the sentence? */
  const said = (sentence, text) => (' ' + L.tokens(sentence).map((t) => t.w).join(' ') + ' ').includes(' ' + text.toLowerCase() + ' ');

  L.css('L04', `
.l04a-stage{position:relative;width:100%;max-width:900px;flex:1 1 auto;min-height:260px;display:flex;align-items:flex-end;justify-content:center;padding:34px clamp(26px,7vw,70px) 0;border-radius:18px;overflow:hidden;background:radial-gradient(ellipse at 50% 0%,rgba(255,236,153,.35),transparent 60%),linear-gradient(#3b1f4f,#24123a)}
.l04a-stage::before{content:'';position:absolute;left:0;right:0;top:0;height:28px;background:repeating-linear-gradient(90deg,#a61e4d 0 28px,#c2255c 28px 56px);border-radius:0 0 50% 50%/0 0 100% 100%;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.l04a-curtain{position:absolute;top:0;bottom:0;width:clamp(20px,6vw,60px);background:repeating-linear-gradient(90deg,#9c1c47 0 10px,#c2255c 10px 20px);box-shadow:0 0 18px rgba(0,0,0,.5)}
.l04a-curtain.l{left:0;border-radius:0 0 40px 0}.l04a-curtain.r{right:0;border-radius:0 0 0 40px}
.l04a-floor{position:absolute;left:0;right:0;bottom:0;height:22%;background:repeating-linear-gradient(90deg,#8d5524 0 40px,#7a4a1f 40px 42px);box-shadow:inset 0 6px 0 rgba(0,0,0,.25)}
.l04a-row{position:relative;z-index:1;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(6px,2vw,18px);width:100%;padding-bottom:12px}
@media (max-width:560px){.l04a-row.l04a-four{grid-template-columns:repeat(2,minmax(0,1fr))}}
.l04a-actor{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;border-radius:18px;padding:8px 4px 10px;background:radial-gradient(ellipse at 50% 100%,rgba(255,244,200,.55),rgba(255,244,200,.08) 70%,transparent);color:#fff;cursor:pointer;min-width:0}
.l04a-actor:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l04a-prop{background:#fff;color:#1d2340;border-radius:16px;padding:4px 10px;box-shadow:0 4px 0 rgba(0,0,0,.25);animation:l04aFloat 1.3s ease-in-out infinite alternate}
.l04a-prop .ls-emoji{font-size:clamp(1.8rem,min(8vw,7vh),3.2rem)}
.l04a-body{display:inline-block;font-size:clamp(3rem,min(15vw,11vh),6.5rem);line-height:1.05;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l04a-m0{animation:l04aBounce .55s ease-in-out infinite alternate}
.l04a-m1{animation:l04aSway .8s ease-in-out infinite alternate}
.l04a-m2{animation:l04aHop .5s ease-in-out infinite alternate}
.l04a-m3{animation:l04aShake .32s ease-in-out infinite alternate}
@keyframes l04aBounce{to{transform:translateY(-14px)}}
@keyframes l04aSway{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
@keyframes l04aHop{from{transform:scale(1.08,.92)}to{transform:translateY(-10px) scale(.96,1.05)}}
@keyframes l04aShake{from{transform:translateX(-7px)}to{transform:translateX(7px)}}
@keyframes l04aFloat{to{transform:translateY(-6px) rotate(4deg)}}
.l04a-lab{background:rgba(0,0,0,.6);color:#fff;border-radius:999px;padding:2px 10px;font-weight:800;font-size:clamp(.85rem,3.2vw,1rem);max-width:100%}
.l04a-actor.right{background:rgba(43,138,62,.9)}
.l04a-actor.wrongpick{background:rgba(201,42,42,.9)}
.l04a-mark{position:absolute;right:6px;top:6px;font-size:1.4rem;font-weight:900;background:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center}
.l04a-mark.ok{color:#2b8a3e}.l04a-mark.bad{color:#c92a2a}
.l04b-hint{background:rgba(255,255,255,.94);color:#1d2340;border-radius:12px;padding:4px 12px;font-weight:800}
.l04b-field{position:relative;flex:1 1 auto;width:100%;max-width:620px;min-height:250px;border-radius:20px;overflow:hidden;background:linear-gradient(#e7f5ff,#a5d8ff 70%,#8ce99a 70%,#69db7c);box-shadow:inset 0 0 0 4px rgba(255,255,255,.6);touch-action:none;cursor:pointer}
.l04b-lane{position:absolute;top:0;bottom:0;border-left:2px dashed rgba(29,35,64,.18)}
.l04b-lane:first-child{border-left:0}
.l04b-cloud{position:absolute;top:6px;font-size:2rem;opacity:.9;pointer-events:none}
.l04b-word{position:absolute;top:0;left:0;white-space:nowrap;background:#fff;color:#1d2340;font-weight:900;font-size:clamp(.95rem,3.6vw,1.3rem);padding:6px 10px;border-radius:14px;border:3px solid #fab005;box-shadow:0 4px 0 rgba(0,0,0,.2);pointer-events:none;will-change:transform}
.l04b-word.l04b-ok{background:#2b8a3e;color:#fff;border-color:#fff}
.l04b-word.l04b-bad{background:#c92a2a;color:#fff;border-color:#fff}
.l04b-word.l04b-show{outline:4px dashed #2b8a3e;outline-offset:2px}
.l04b-basket{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;transition:left .12s ease-out;pointer-events:none}
.l04b-basket .ls-emoji{font-size:clamp(3rem,10vw,4rem);line-height:1}
.l04b-got{font-weight:900;font-size:1rem;background:#fff;color:#1d2340;border-radius:10px;padding:0 6px;min-height:1.2em}
.l04b-got:empty{visibility:hidden}
.l04b-bump{animation:l04bBump .35s ease-out}
@keyframes l04bBump{50%{transform:translateX(-50%) scale(1.18,.85)}}
.l04b-pad{min-width:96px}
.l04c-chat{flex-shrink:0;width:100%;max-width:640px;background:#f1f3f5;color:#1d2340;border-radius:24px;box-shadow:0 8px 0 rgba(0,0,0,.2);overflow:hidden;border:6px solid #212529}
.l04c-top{display:flex;align-items:center;gap:8px;background:#212529;color:#fff;font-weight:900;padding:4px 12px 8px}
.l04c-msgs{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:6px;padding:8px 10px}
.l04c-in,.l04c-out{max-width:85%;border-radius:18px;padding:6px 12px;font-size:1.6rem;line-height:1.2}
.l04c-in{background:#fff;box-shadow:0 2px 0 rgba(0,0,0,.1)}
.l04c-out{margin-left:auto;margin-top:14px;background:#d0ebff;display:flex;align-items:center;gap:6px;border:3px dashed #1971c2}
.l04c-out.sent{background:#1971c2;border-style:solid;animation:l04cSend .35s ease-out}
@keyframes l04cSend{from{transform:translateX(-20px) scale(.9)}}
.l04c-slot{min-width:58px;min-height:50px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;border:2px solid #74c0fc}
.l04c-slot.empty{font-size:1rem;font-weight:900;color:#1d2340}
.l04c-plus{font-weight:900;color:#1864ab;font-size:1.3rem}
.l04c-out.sent .l04c-plus{color:#fff}
.l04c-pick{padding:4px 10px 10px;border-top:2px solid #dee2e6;background:#fff}
.l04c-lab{font-weight:900;font-size:.95rem;margin:4px 0}
.l04c-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(66px,1fr));gap:6px}
.l04c-opt{min-height:52px;border:3px solid #dee2e6;border-radius:14px;background:#f8f9fa;color:#1d2340;font-weight:800;font-size:.9rem;padding:4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15}
.l04c-opt .ls-emoji{font-size:1.55rem}
.l04c-opt[aria-pressed="true"]{border-color:#1971c2;background:#d0ebff;box-shadow:inset 0 0 0 2px #1971c2}
.l04c-opt.right{border-color:#2b8a3e;background:#d3f9d8}
.l04c-opt.wrongpick{border-color:#c92a2a;background:#ffe3e3}
.l04c-opt:focus-visible{outline:4px solid #f59f00;outline-offset:2px}
`);

  /* ===================== L04a Action Charades (ANIMATED_CHOICE) ===================== */
  L.register({
    id: 'L04a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#1a0f26,#3b1f4f)' });
      const n = ctx.difficulty === 'hard' ? 4 : 3;
      const PEOPLE = ['🧑', '👩', '👨', '🧒', '👧', '👦'];
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        st.head.append(L.say('🎭 聽句子，點正在演那個動作的演員！', 'Tap the actor doing the action you hear.'), L.listenBar(ctx, item));
        const cast = u.shuffle([item].concat(L.others(ctx, item, n - 1)));
        const people = u.shuffle(PEOPLE); const moves = u.shuffle([0, 1, 2, 3]);
        const row = el('div', { class: 'l04a-row' + (cast.length > 3 ? ' l04a-four' : ''), role: 'group', 'aria-label': 'Actors 演員' }); row.style.setProperty('--n', String(cast.length));
        const stage = el('div', { class: 'l04a-stage' }, el('div', { class: 'l04a-floor', 'aria-hidden': 'true' }), el('div', { class: 'l04a-curtain l', 'aria-hidden': 'true' }), el('div', { class: 'l04a-curtain r', 'aria-hidden': 'true' }), row);
        st.body.append(stage);
        let answered = false;
        const btns = cast.map((w, i) => {
          const p = actPic(w);
          const b = el('button', { class: 'l04a-actor', 'aria-label': `Actor ${i + 1} 演員 ${i + 1}：${w.zh}` },
            el('span', { class: 'l04a-prop', 'aria-hidden': 'true', style: { animationDelay: -i * 0.4 + 's' } }, p ? el('span', { class: 'ls-emoji' }, p) : el('span', { class: 'ls-zhcard zh' }, w.zh)),
            el('span', { class: 'l04a-body l04a-m' + moves[i % 4], 'aria-hidden': 'true' }, people[i % people.length]),
            p ? el('span', { class: 'l04a-lab zh', 'aria-hidden': 'true' }, w.zh) : null);
          ctx.on(b, 'click', () => pick(i)); row.append(b); return b;
        });
        const pick = (i) => {
          if (answered) return; answered = true;
          const ok = cast[i] === item; const r = cast.indexOf(item);
          btns[i].classList.add(ok ? 'right' : 'wrongpick'); btns[i].append(el('span', { class: 'l04a-mark ' + (ok ? 'ok' : 'bad') }, ok ? '✔' : '✘'));
          if (!ok) { btns[r].classList.add('right'); btns[r].append(el('span', { class: 'l04a-mark ok' }, '✔')); }
          L.feedback(ctx, item, ok, Object.assign(at(ctx, btns[i]), { wrongText: 'Not that actor 不是這位演員' })).then(done);
        };
        const r = cast.indexOf(item);
        T.set(() => pick(r), () => pick(r === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });

  /* ===================== L04b Verb Basket (CATCH) ===================== */
  L.register({
    id: 'L04b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#1c7ed6,#74c0fc)' });
      const lanes = ctx.difficulty === 'easy' ? 3 : 4;
      const nWords = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 5 : 4;
      const fall = ctx.difficulty === 'easy' ? 5.6 : ctx.difficulty === 'hard' ? 3.6 : 4.6; // seconds from top to basket
      const gap = ctx.difficulty === 'easy' ? 1.7 : ctx.difficulty === 'hard' ? 1.05 : 1.35; // seconds between words
      const field = el('div', { class: 'l04b-field', role: 'group', 'aria-label': 'Sky 天空：move the basket with ◀ ▶ or the arrow keys 用 ◀ ▶ 或方向鍵移動籃子' });
      for (let i = 0; i < lanes; i++) field.append(el('div', { class: 'l04b-lane', 'aria-hidden': 'true', style: { left: (i / lanes) * 100 + '%', width: 100 / lanes + '%' } }));
      field.append(el('div', { class: 'l04b-cloud', 'aria-hidden': 'true', style: { left: '8%' } }, '☁️'), el('div', { class: 'l04b-cloud', 'aria-hidden': 'true', style: { right: '10%' } }, '☁️'));
      const got = el('div', { class: 'l04b-got', 'aria-live': 'polite' }, '');
      const basket = el('div', { class: 'l04b-basket', 'aria-hidden': 'true' }, got, el('span', { class: 'ls-emoji' }, '🧺'));
      field.append(basket);
      st.body.append(field);
      const leftB = el('button', { class: 'btn big l04b-pad', 'aria-label': 'Move the basket left 籃子向左' }, '◀');
      const rightB = el('button', { class: 'btn big l04b-pad', 'aria-label': 'Move the basket right 籃子向右' }, '▶');
      st.foot.append(leftB, rightB);
      let lane = Math.floor(lanes / 2), R = null, dragging = false;
      const laneX = (k) => ((k + 0.5) / lanes) * 100 + '%';
      const moveTo = (k) => { lane = u.clamp(k, 0, lanes - 1); basket.style.left = laneX(lane); };
      moveTo(lane);
      ctx.on(leftB, 'click', () => moveTo(lane - 1));
      ctx.on(rightB, 'click', () => moveTo(lane + 1));
      ctx.on(window, 'keydown', (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); moveTo(lane - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); moveTo(lane + 1); } });
      const laneAt = (x) => { const r = field.getBoundingClientRect(); return Math.floor(u.clamp((x - r.left) / Math.max(1, r.width), 0, 0.999) * lanes); };
      ctx.on(field, 'pointerdown', (e) => { dragging = true; moveTo(laneAt(e.clientX)); });
      ctx.on(window, 'pointermove', (e) => { if (dragging) moveTo(laneAt(e.clientX)); });
      ctx.on(window, 'pointerup', () => { dragging = false; });
      ctx.on(window, 'pointercancel', () => { dragging = false; });

      ctx.loop((dt) => {
        if (!R || R.over) return;
        const H = field.clientHeight; const catchY = H - basket.offsetHeight + 8;
        for (const w of R.words) {
          if (!w.live) continue;
          w.y += (H / fall) * dt * ctx.speed;
          w.el.style.transform = `translate(-50%, ${w.y}px)`;
          const bottom = w.y + w.h;
          if (!w.passed && bottom >= catchY) {
            if (w.lane === lane) { R.catchWord(w); return; }
            if (bottom >= catchY + 28) w.passed = true; // a short window to slide under it
          }
          if (w.y > H) { w.live = false; w.el.remove(); if (w.target) { R.catchWord(null); return; } }
        }
      });

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🧺 聽句子，左右移動籃子，只接住句子裡的那個動詞！接錯或漏接都不算。', 'Catch only the verb from the sentence.'), L.listenBar(ctx, item));
        if (ctx.difficulty === 'easy') st.head.append(el('div', { class: 'l04b-hint zh' }, '💡 意思：', item.sentenceZh));
        got.textContent = '';
        const tgt = verbOf(item);
        const seen = new Set([tgt]); const dis = [];
        for (const w of u.shuffle(ctx.pool.filter((x) => x !== item)).concat(u.shuffle(EP.levelWords(item.level)))) {
          const v = verbOf(w); if (seen.has(v) || said(item.sentence, v)) continue; seen.add(v); dis.push(v); if (dis.length >= nWords - 1) break;
        }
        const texts = u.shuffle(dis); const ti = u.randInt(1, Math.max(1, Math.min(2, texts.length))); texts.splice(ti, 0, tgt);
        let prev = -1;
        const words = texts.map((text, i) => { let ln = u.randInt(0, lanes - 1); if (ln === prev) ln = (ln + 1 + u.randInt(0, lanes - 2)) % lanes; prev = ln; return { text, target: i === ti, lane: ln, y: 0, h: 40, live: false, passed: false, el: null }; });
        let answered = false;
        const spawn = (w) => {
          if (w.el || answered) return;
          w.el = el('div', { class: 'l04b-word', 'aria-hidden': 'true' }, w.text); w.el.style.left = laneX(w.lane);
          field.append(w.el); w.h = w.el.offsetHeight || 40; w.y = -w.h; w.el.style.transform = `translate(-50%, ${w.y}px)`; w.live = true;
        };
        words.forEach((w, i) => ctx.timeout(() => spawn(w), (1300 + i * gap * 1000) / ctx.speed));
        const catchWord = (w) => {
          if (answered) return; answered = true; if (R) R.over = true;
          const ok = !!w && w.target;
          if (w) { w.y = Math.max(0, field.clientHeight - basket.offsetHeight - w.h + 14); w.el.style.transform = `translate(-50%, ${w.y}px)`; w.el.classList.add(ok ? 'l04b-ok' : 'l04b-bad'); w.el.textContent = w.text + (ok ? ' ✔' : ' ✘'); got.textContent = w.text; basket.classList.remove('l04b-bump'); void basket.offsetWidth; basket.classList.add('l04b-bump'); }
          const tw = words.find((x) => x.target); if (!ok && tw.el && tw.live) tw.el.classList.add('l04b-show');
          const pos = w && w.el ? at(ctx, w.el) : at(ctx, basket);
          L.feedback(ctx, item, ok, Object.assign(pos, { wrongText: w ? `“${w.text}” is not in the sentence 句子裡沒有 ${w.text}` : `Missed “${tgt}” 漏接了 ${tgt}` }))
            .then(() => { words.forEach((x) => x.el && x.el.remove()); R = null; done(); });
        };
        R = { words, over: false, catchWord };
        const force = (w) => { spawn(w); moveTo(w.lane); catchWord(w); };
        T.set(() => force(words.find((x) => x.target)), () => force(words.find((x) => !x.target)));
      }));
      return { test: T.api };
    },
  });

  /* ===================== L04c Emoji Text (EMOJI_COMPOSE) ===================== */
  /** WHO emoji for the subject of the sentence (imperatives like "Try again." are said to YOU) */
  const SUBJ = { i: ['🙋', '我', 'I'], we: ['👫', '我們', 'we'], he: ['👦', '他', 'he'], she: ['👧', '她', 'she'], they: ['👨‍👩‍👧', '他們', 'they'], you: ['👉', '你', 'you'] };
  function subjOf(w) {
    const toks = L.tokens(w.sentence); const f = toks[0] ? toks[0].w : ''; const k = L.key(w);
    if (SUBJ[f]) return { key: f, pic: SUBJ[f][0], zh: SUBJ[f][1], en: SUBJ[f][2] };
    if (/^(don't|please|let's)$/.test(f) || (k && k.index === 0)) return { key: 'you', pic: SUBJ.you[0], zh: SUBJ.you[1], en: SUBJ.you[2] };
    return { key: f, pic: '🧑', zh: toks[0] ? toks[0].t : '?', en: toks[0] ? toks[0].t : '?' }; // a noun subject (e.g. "Grandpa")
  }

  L.register({
    id: 'L04c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#3bc9db)' });
      const nWho = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 6 : 4;
      const nWhat = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 5 : 4;
      const en = ctx.difficulty === 'easy';
      const send = el('button', { class: 'btn go big', disabled: true }, '📤 Send 送出');
      st.foot.append(send);
      let cur = null; ctx.on(send, 'click', () => cur && cur());
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        st.head.append(L.say('💬 聽句子，選「誰」和「做什麼」傳給外國朋友，再按「送出」。命令句是對「你」說的。', 'Pick WHO and WHAT, then send.'), L.listenBar(ctx, item));
        const who = subjOf(item);
        const whoOpts = u.shuffle([who].concat(u.shuffle(Object.keys(SUBJ).filter((k) => k !== who.key)).slice(0, nWho - 1).map((k) => ({ key: k, pic: SUBJ[k][0], zh: SUBJ[k][1], en: SUBJ[k][2] }))));
        const whatOpts = u.shuffle([item].concat(L.others(ctx, item, nWhat - 1, { filter: (w) => actPic(w) !== actPic(item) })));
        let a = -1, b = -1, answered = false;
        const slotWho = el('span', { class: 'l04c-slot empty' }, '誰?'), slotWhat = el('span', { class: 'l04c-slot empty' }, '做什麼?');
        const draft = el('div', { class: 'l04c-out', 'aria-label': 'Your message 你的訊息' }, slotWho, el('span', { class: 'l04c-plus', 'aria-hidden': 'true' }, '+'), slotWhat);
        const msgs = el('div', { class: 'l04c-msgs', 'aria-live': 'polite' }, el('div', { class: 'l04c-in', 'aria-label': 'Friend: hi, what are you doing? 朋友：嗨，在做什麼？' }, '👋😃❓'), draft);
        const opt = (pic, zh, enTxt, onPick) => el('button', { class: 'l04c-opt', 'aria-pressed': 'false', 'aria-label': (enTxt ? enTxt + ' ' : '') + zh, onclick: onPick }, el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, pic), el('span', { class: 'zh', 'aria-hidden': 'true' }, enTxt ? `${enTxt} ${zh}` : zh));
        const whoBtns = whoOpts.map((s, i) => opt(s.pic, s.zh, en ? s.en : '', () => chooseWho(i)));
        const whatBtns = whatOpts.map((w, i) => opt(actPic(w) || '❔', w.zh, '', () => chooseWhat(i)));
        const chat = el('div', { class: 'l04c-chat' },
          el('div', { class: 'l04c-top' }, el('span', { 'aria-hidden': 'true' }, '🌏'), el('span', {}, 'Pen pal 外國朋友')),
          msgs,
          el('div', { class: 'l04c-pick' },
            el('div', { class: 'l04c-lab zh' }, '👤 WHO 誰'), el('div', { class: 'l04c-row', role: 'group', 'aria-label': 'WHO 誰' }, whoBtns),
            el('div', { class: 'l04c-lab zh' }, '🎬 WHAT 做什麼'), el('div', { class: 'l04c-row', role: 'group', 'aria-label': 'WHAT 做什麼' }, whatBtns)));
        st.body.append(chat);
        const press = (btns, i) => btns.forEach((x, j) => x.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
        const upd = () => { send.disabled = answered || a < 0 || b < 0; };
        const fill = (slot, pic) => { slot.className = 'l04c-slot'; slot.textContent = pic; };
        const chooseWho = (i) => { if (answered) return; a = i; press(whoBtns, i); fill(slotWho, whoOpts[i].pic); sfx('pop'); upd(); };
        const chooseWhat = (i) => { if (answered) return; b = i; press(whatBtns, i); fill(slotWhat, actPic(whatOpts[i]) || '❔'); sfx('pop'); upd(); };
        const sendFn = () => {
          if (answered || a < 0 || b < 0) return;
          answered = true; upd();
          const okWho = whoOpts[a] === who, okWhat = whatOpts[b] === item, ok = okWho && okWhat;
          draft.classList.add('sent'); sfx('whoosh');
          const mark = (btns, list, pickI, right) => btns.forEach((x, j) => { if (list[j] === right) x.classList.add('right'); else if (j === pickI) x.classList.add('wrongpick'); });
          mark(whoBtns, whoOpts, a, who); mark(whatBtns, whatOpts, b, item);
          msgs.append(el('div', { class: 'l04c-in', 'aria-label': ok ? 'Friend: got it! 朋友：懂了！' : 'Friend: what? 朋友：看不懂' }, ok ? '👍😄' : '🤔❓'));
          const wrongText = !okWho && !okWhat ? 'WHO and WHAT are wrong 「誰」和「做什麼」都不對' : !okWho ? 'WHO is wrong 「誰」不對' : 'WHAT is wrong 「做什麼」不對';
          L.feedback(ctx, item, ok, Object.assign(at(ctx, draft), { wrongText })).then(() => { cur = null; done(); });
        };
        cur = sendFn;
        const rw = whoOpts.indexOf(who), rt = whatOpts.indexOf(item);
        T.set(() => { chooseWho(rw); chooseWhat(rt); sendFn(); }, () => { chooseWho(rw === 0 ? 1 : 0); chooseWhat(rt); sendFn(); });
      }));
      return { test: T.api };
    },
  });
})();
