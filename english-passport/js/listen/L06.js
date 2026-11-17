/* Sentence Listening — Level 6 (Verbs): SWIPE_TF, BLOCK_CODE, CLOZE
 * L06a Talent Show Judge: a performer card is shown while the sentence plays — swipe right ✓ (matches) or left ✗.
 * L06b Robot Coder: drag the action block that matches the sentence into the program, press ▶ Run.
 * L06c Recording Studio: the subtitle misses a word — pick the word you hear. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* what each official sentence shows (cards only, never spoken): [picture, short Chinese caption, block emoji] */
  const ACT = {
    sing: ['🧑‍🎤🎶', '唱歌唱得很好', '🎤'], dance: ['💃🕺', '一起跳舞', '💃'], see: ['🔭✨', '看見星星', '👀'], go: ['🎒🏫', '去學校', '➡️'],
    eat: ['😋🍎', '吃蘋果', '🍽️'], play: ['🧸🪀', '玩玩具', '🧸'], drink: ['🥤💧', '喝水', '🥤'], draw: ['✏️🐱', '畫一隻貓', '🖍️'],
    read: ['📖🤓', '讀一本書', '📖'], thank: ['🙏👩‍🏫', '感謝老師', '🙏'], ride: ['🚴💨', '騎腳踏車', '🚴'], welcome: ['👋🎉', '歡迎客人', '👋'],
    walk: ['🚶🚶‍♀️', '走路上學', '🚶'], cook: ['🧑‍🍳🍲', '煮晚餐', '🍳'], watch: ['📺🛋️', '看電視', '📺'], open: ['🚪🔑', '打開門', '🚪'],
    answer: ['🙋‍♀️💬', '回答問題', '🙋'], wash: ['🧼👐', '洗手', '🧼'], listen: ['🎧🎵', '聽音樂', '👂'], can: ['🏃💨', '可以跑很快', '💪'],
    "can't": ['🏊🚫', '不會游泳', '🚫'], will: ['🔜🏠', '將要回家', '🔜'], should: ['☝️🍚', '應該吃飯', '☝️'], is: ['👉📘', '這是我的書', '🟰'],
    fly: ['🐦🕊️', '鳥會飛', '🕊️'], climb: ['🐒🌳', '猴子爬樹', '🧗'],
  };
  const act = (w) => ACT[w.word.toLowerCase()] || ACT[w.word] || [EP.pic(w) || '⭐', w.zh, EP.pic(w) || '⭐'];
  /** pairs whose pictures tell almost the same story (never used as a "no match" pair) */
  const CONFUSE = [['go', 'walk'], ['go', 'will'], ['walk', 'will'], ['eat', 'should'], ['read', 'is'], ['see', 'watch'], ['can', 'ride']];
  const confusable = (a, b) => CONFUSE.some(([x, y]) => (a.word === x && b.word === y) || (a.word === y && b.word === x));
  /** does `sentence` also contain `word` (any form)? */
  const mentions = (sentence, word) => !!EP.cloze({ word, sentence });
  const centre = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  L.css('L06', `
.l06a-stage{position:relative;width:100%;flex:1;min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;border-radius:24px;overflow:hidden;background:radial-gradient(ellipse at 50% 18%,rgba(255,236,153,.55),rgba(255,236,153,0) 55%),linear-gradient(#3b0a45,#1a0526);box-shadow:inset 0 0 0 4px rgba(255,255,255,.12)}
.l06a-stage::before,.l06a-stage::after{content:'';position:absolute;top:0;bottom:0;width:11%;background:repeating-linear-gradient(90deg,#a51111 0 14px,#c92a2a 14px 28px);box-shadow:0 0 18px rgba(0,0,0,.5)}
.l06a-stage::before{left:0;border-radius:0 0 40px 0}.l06a-stage::after{right:0;border-radius:0 0 0 40px}
.l06a-card{position:relative;z-index:2;width:clamp(200px,58vw,300px);min-height:clamp(170px,30vh,250px);border:0;border-radius:24px;background:#fff;color:#1d2340;box-shadow:0 10px 0 rgba(0,0,0,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;font:inherit;cursor:grab;touch-action:none;user-select:none;transition:transform .35s ease}
.l06a-card.l06a-drag{transition:none;cursor:grabbing}
.l06a-card.l06a-reset{transition:none}
.l06a-card.l06a-in{animation:l06a-in .4s ease}
@keyframes l06a-in{from{transform:translateY(-40px) scale(.85)}}
.l06a-card:focus-visible{outline:5px solid #ffd43b;outline-offset:4px}
.l06a-pic{font-size:clamp(3rem,11vw,4.6rem);line-height:1.1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l06a-cap{font-weight:900;font-size:clamp(1rem,3.6vw,1.25rem);text-align:center}
.l06a-tag{font-size:.85rem;font-weight:800;color:#5f3dc4;background:#f3f0ff;border-radius:999px;padding:2px 10px}
.l06a-stamp{position:absolute;top:12px;font-weight:900;font-size:1.5rem;padding:2px 10px;border-radius:10px;border:4px solid;opacity:0;pointer-events:none}
.l06a-stamp.yes{left:12px;color:#2b8a3e;border-color:#2b8a3e;transform:rotate(-14deg)}
.l06a-stamp.no{right:12px;color:#c92a2a;border-color:#c92a2a;transform:rotate(14deg)}
.l06a-hint{position:relative;z-index:2;display:flex;justify-content:space-between;width:min(92%,420px);color:#fff;font-weight:800;font-size:.95rem}
.l06a-btns{display:flex;gap:10px;width:min(92vw,560px)}
.l06a-btn{flex:1 1 0;min-width:0;padding:12px 10px!important;font-size:clamp(1.05rem,4vw,1.4rem)!important}
.l06a-no{background:linear-gradient(180deg,#c92a2a,#a51111)!important;color:#fff!important}
.l06a-yes{background:linear-gradient(180deg,#2b8a3e,#1e6b2f)!important;color:#fff!important}
.l06b-lab{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr);gap:clamp(8px,2vw,18px);width:100%;align-items:stretch}
@media (max-width:640px){.l06b-lab{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.l06b-robot-box{grid-column:1 / -1;order:-1;min-height:120px!important}}
.l06b-panel{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.25);border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0}
.l06b-title{font-weight:900;font-size:.95rem;color:#fff;text-align:center}
.l06b-blocks{display:flex;flex-direction:column;gap:8px}
.l06b-block{position:relative;border:0;border-radius:10px 10px 10px 10px;padding:10px 12px 10px 16px;min-height:50px;color:#fff;font:inherit;font-weight:900;font-size:clamp(1rem,3.4vw,1.2rem);display:flex;align-items:center;gap:8px;cursor:grab;touch-action:none;box-shadow:0 4px 0 rgba(0,0,0,.35);text-align:left}
.l06b-block::before{content:'';position:absolute;left:18px;top:-6px;width:22px;height:8px;border-radius:0 0 6px 6px;background:inherit}
.l06b-block .ls-emoji{font-size:1.5rem}
.l06b-block[hidden]{display:none}
.l06b-block small{font-weight:800;font-size:.85rem;opacity:.95}
.l06b-block:focus-visible,.l06b-slot:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l06b-c0{background:#5f3dc4}.l06b-c1{background:#1864ab}.l06b-c2{background:#a61e4d}.l06b-c3{background:#2b7a3b}.l06b-c4{background:#862e9c}.l06b-c5{background:#0b7285}
.l06b-hat{background:#b35900;color:#fff;font-weight:900;border-radius:18px 18px 8px 8px;padding:8px 12px;text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.3)}
.l06b-slot{border:3px dashed #ffd43b;border-radius:12px;min-height:62px;background:rgba(0,0,0,.25);color:#fff;font:inherit;font-weight:800;display:flex;align-items:center;justify-content:center;padding:6px;cursor:pointer}
.l06b-slot.l06b-has{border-style:solid;background:rgba(255,255,255,.12)}
.l06b-slot .l06b-block{width:100%;cursor:default;box-shadow:none}
.l06b-end{background:#b35900;color:#fff;font-weight:900;border-radius:8px 8px 18px 18px;padding:6px 12px;text-align:center;font-size:.9rem}
.l06b-robot-box{position:relative;display:flex;align-items:center;justify-content:center;min-height:200px;border-radius:18px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 1px,transparent 1px 24px),repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 1px,transparent 1px 24px),#0b1a3a;border:2px solid rgba(255,255,255,.25)}
.l06b-robot{font-size:clamp(3.4rem,10vw,5rem);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l06b-bubble{position:absolute;top:8px;right:8px;background:#fff;color:#1d2340;border-radius:14px;padding:4px 10px;font-weight:900;display:none;align-items:center;gap:6px;max-width:90%}
.l06b-bubble.on{display:flex}
.l06b-bounce{animation:l06b-bounce .35s ease 3}
.l06b-spin{animation:l06b-spin .8s ease}
.l06b-move{animation:l06b-move .9s ease}
.l06b-up{animation:l06b-up .9s ease}
.l06b-wobble{animation:l06b-wobble .3s ease 3}
.l06b-err{animation:l06b-err .12s linear 6;filter:grayscale(.6)}
@keyframes l06b-bounce{50%{transform:translateY(-26px)}}
@keyframes l06b-spin{to{transform:rotate(360deg)}}
@keyframes l06b-move{35%{transform:translateX(60px)}70%{transform:translateX(-60px)}}
@keyframes l06b-up{50%{transform:translateY(-60px) rotate(-8deg)}}
@keyframes l06b-wobble{25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
@keyframes l06b-err{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.l06c-studio{width:100%;max-width:820px;display:flex;flex-direction:column;align-items:center;gap:clamp(8px,2vh,16px)}
.l06c-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}
.l06c-air{font-weight:900;letter-spacing:2px;color:#fff;background:#7a1010;border-radius:8px;padding:4px 10px;box-shadow:0 0 0 3px #3a0808}
.l06c-air.on{background:#e03131;box-shadow:0 0 18px #ff6b6b,0 0 0 3px #3a0808}
.l06c-wave{display:flex;align-items:center;gap:4px;height:44px}
.l06c-wave i{display:block;width:7px;height:12px;border-radius:4px;background:#63e6be}
.l06c-wave.on i{animation:l06c-bar .6s ease-in-out infinite alternate}
.l06c-wave i:nth-child(2n){animation-delay:.15s}.l06c-wave i:nth-child(3n){animation-delay:.3s}.l06c-wave i:nth-child(5n){animation-delay:.45s}
@keyframes l06c-bar{to{height:40px}}
.l06c-screen{width:100%;background:#0b0f1e;border:6px solid #343a40;border-radius:18px;padding:clamp(12px,3vh,22px) 14px;text-align:center;box-shadow:0 8px 0 rgba(0,0,0,.35)}
.l06c-sub{color:#fff;font-weight:900;font-size:clamp(1.35rem,5vw,2.2rem);line-height:1.35}
.l06c-blank{display:inline-block;min-width:3.4em;border-bottom:5px solid #ffd43b;margin:0 6px;color:#ffd43b}
.l06c-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.l06c-blank.ok{color:#8ce99a;border-color:#8ce99a}
.l06c-zh{color:#e9ecef;font-weight:700;font-size:1.05rem;margin-top:6px}
.l06c-choices .ls-choice{font-size:clamp(1.15rem,4vw,1.4rem)}
`);

  /* ---------- L06a Talent Show Judge (SWIPE_TF) ---------- */
  L.register({
    id: 'L06a',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#2b0a3d,#5f3dc4)' });
      const pic = u.el('div', { class: 'l06a-pic', 'aria-hidden': 'true' });
      const cap = u.el('div', { class: 'l06a-cap zh' });
      const tag = u.el('div', { class: 'l06a-tag' });
      const yesStamp = u.el('div', { class: 'l06a-stamp yes', 'aria-hidden': 'true' }, '✓ YES');
      const noStamp = u.el('div', { class: 'l06a-stamp no', 'aria-hidden': 'true' }, '✗ NO');
      const card = u.el('button', { class: 'l06a-card' }, yesStamp, noStamp, tag, pic, cap);
      const stage = u.el('div', { class: 'l06a-stage' }, card,
        u.el('div', { class: 'l06a-hint', 'aria-hidden': 'true' }, u.el('span', {}, '⬅ ✗ 不符合'), u.el('span', {}, '符合 ✓ ➡')));
      st.body.append(stage);
      const noBtn = u.el('button', { class: 'btn big l06a-btn l06a-no', onclick: () => judge(false) }, '✗ No match 不符合');
      const yesBtn = u.el('button', { class: 'btn big l06a-btn l06a-yes', onclick: () => judge(true) }, '✓ Match 符合');
      st.foot.append(u.el('div', { class: 'l06a-btns' }, noBtn, yesBtn));
      const showCap = ctx.difficulty !== 'hard';
      let cur = null;

      const setStamps = (dx) => { yesStamp.style.opacity = u.clamp(dx / 90, 0, 1); noStamp.style.opacity = u.clamp(-dx / 90, 0, 1); };
      const judge = (saysMatch) => {
        if (!cur || cur.answered) return; cur.answered = true; drag = null;
        const { item, match, shown, done } = cur;
        const ok = saysMatch === match;
        card.classList.remove('l06a-drag'); setStamps(saysMatch ? 200 : -200);
        card.style.transform = `translateX(${saysMatch ? '' : '-'}120vw) rotate(${saysMatch ? 28 : -28}deg)`;
        EP.sfx.whoosh();
        const p = centre(ctx, saysMatch ? yesBtn : noBtn);
        const what = match ? '其實相符 It matched!' : `其實不符：圖是「${act(shown)[1]}」 It did not match`;
        ctx.timeout(() => L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: what }).then(done), 380);
      };
      // real pointer swipe on the card
      let drag = null;
      ctx.on(card, 'pointerdown', (e) => {
        if (!cur || cur.answered) return;
        drag = { x: e.clientX, dx: 0 }; card.classList.add('l06a-drag');
        try { card.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      ctx.on(card, 'pointermove', (e) => {
        if (!drag) return; drag.dx = e.clientX - drag.x;
        card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 14}deg)`; setStamps(drag.dx);
      });
      const release = () => {
        if (!drag) return; const dx = drag.dx; drag = null; card.classList.remove('l06a-drag');
        const th = Math.min(110, card.offsetWidth * 0.3);
        if (dx > th) judge(true); else if (dx < -th) judge(false);
        else { card.style.transform = ''; setStamps(0); if (Math.abs(dx) < 6 && cur && !cur.answered) cur.bar.play(false); }
      };
      ctx.on(card, 'pointerup', release);
      ctx.on(card, 'pointercancel', () => { drag = null; card.classList.remove('l06a-drag'); card.style.transform = ''; setStamps(0); });
      ctx.on(card, 'keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); judge(true); } else if (e.key === 'ArrowLeft') { e.preventDefault(); judge(false); }
      });

      // about half of the performers match their introduction
      const plan = u.shuffle(ctx.items.map((_, i) => i % 2 === 0));
      L.rounds(ctx, ctx.items, (item, i) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { delay: 500 });
        st.head.append(L.say('🎤 主持人介紹表演者：介紹和表演一樣就向右滑 ✓，不一樣就向左滑 ✗。', 'Swipe right ✓ if the act matches, left ✗ if not.'), bar);
        let match = plan[i];
        let shown = item;
        if (!match) {
          const o = L.others(ctx, item, 1, { levelOnly: true, filter: (w) => !confusable(item, w) && !mentions(item.sentence, w.word) && act(w)[0] !== act(item)[0] })[0];
          if (o) shown = o; else match = true;
        }
        const a = act(shown);
        tag.textContent = `Performer 表演者 #${i + 1}`;
        pic.textContent = a[0];
        cap.textContent = ctx.difficulty === 'easy' ? shown.sentenceZh : showCap ? a[1] : '';
        cap.hidden = !cap.textContent;
        card.setAttribute('aria-label', `Performer card 表演者：${a[1]}。向右滑或按 → 表示符合，向左滑或按 ← 表示不符合 Swipe or press arrow keys`);
        card.classList.add('l06a-reset'); card.style.transform = ''; setStamps(0); void card.offsetWidth; card.classList.remove('l06a-reset');
        card.classList.remove('l06a-in'); void card.offsetWidth; card.classList.add('l06a-in');
        cur = { item, match, shown, answered: false, done, bar };
        T.set(() => judge(match), () => judge(!match));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L06b Robot Coder (BLOCK_CODE) ---------- */
  const ANIM = { dance: 'spin', walk: 'move', go: 'move', ride: 'move', will: 'move', fly: 'up', climb: 'up', sing: 'wobble', listen: 'wobble', thank: 'wobble', welcome: 'wobble', answer: 'wobble' };
  L.register({
    id: 'L06b',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b1a3a,#1c3d7a 60%,#2f5fb3)' });
      const nBlocks = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 6 : 4;
      const blocks = Array.from({ length: 6 }, (_, i) => u.el('button', { class: 'l06b-block l06b-c' + i }));
      const palette = u.el('div', { class: 'l06b-panel', role: 'group', 'aria-label': 'Action blocks 動作積木' }, u.el('div', { class: 'l06b-title' }, '🧩 Blocks 積木'), u.el('div', { class: 'l06b-blocks' }, blocks));
      const slot = u.el('button', { class: 'l06b-slot', 'aria-label': 'Program slot 程式格：先點積木再點這裡 Drop a block here' }, '⬇ 拖到這裡 Drop here');
      const runBtn = u.el('button', { class: 'btn go', style: { width: '100%' }, onclick: () => run() }, '▶ Run 執行');
      const program = u.el('div', { class: 'l06b-panel', role: 'group', 'aria-label': 'Program 程式' }, u.el('div', { class: 'l06b-title' }, '💻 Program 程式'),
        u.el('div', { class: 'l06b-hat' }, '🏁 When ▶ clicked 當 ▶ 被點'), slot, u.el('div', { class: 'l06b-end' }, '⏹ end 結束'), runBtn);
      const robot = u.el('div', { class: 'l06b-robot', role: 'img', 'aria-label': 'Robot 機器人' }, '🤖');
      const bubble = u.el('div', { class: 'l06b-bubble', role: 'status' });
      const robotBox = u.el('div', { class: 'l06b-robot-box l06b-panel' }, robot, bubble);
      st.body.append(u.el('div', { class: 'l06b-lab' }, palette, program, robotBox));
      let cur = null;

      const blockFace = (el, w) => {
        const a = act(w); el.innerHTML = '';
        el.append(...[ctx.difficulty === 'hard' ? null : u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, a[2]), u.el('span', {}, w.word),
          ctx.difficulty === 'easy' ? u.el('small', { class: 'zh' }, w.zh) : null].filter(Boolean));
        el.setAttribute('aria-label', `Block 積木：${w.word} ${w.zh}`);
      };
      const setSlot = (w) => {
        if (!cur || cur.answered) return;
        cur.chosen = w; slot.innerHTML = ''; slot.classList.add('l06b-has');
        const b = u.el('span', { class: 'l06b-block l06b-c' + blocks.findIndex((x) => x._w === w) }); blockFace(b, w); b.removeAttribute('aria-label');
        slot.append(b); slot.setAttribute('aria-label', `Program slot 程式格：${w.word} ${w.zh}`);
        EP.sfx.pop();
      };
      const clearSlot = () => { slot.innerHTML = ''; slot.classList.remove('l06b-has'); slot.append('⬇ 拖到這裡 Drop here'); slot.setAttribute('aria-label', 'Program slot 程式格：先點積木再點這裡 Drop a block here'); };
      const run = async () => {
        if (!cur || cur.answered) return;
        if (!cur.chosen) { ctx.toast('先放一個積木 Put a block in first'); ctx.shake(slot); return; }
        cur.answered = true; runBtn.disabled = true;
        const { item, chosen, done } = cur; const ok = chosen === item;
        const a = act(chosen);
        robot.className = 'l06b-robot'; void robot.offsetWidth;
        bubble.innerHTML = ''; bubble.classList.add('on');
        if (ok) { robot.classList.add('l06b-' + (ANIM[item.word] || 'bounce')); bubble.append(u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, a[2]), `${chosen.word}!`); EP.sfx.coin(); }
        else { robot.classList.add('l06b-err'); bubble.append('❓ ', `${chosen.word}? Error 錯誤`); }
        await ctx.wait(reduced() ? 250 : 950);
        const p = centre(ctx, robotBox);
        await L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: `應該用「${item.word}」積木 The block is "${item.word}"` });
        robot.className = 'l06b-robot'; bubble.classList.remove('on'); done();
      };
      L.dnd(ctx, blocks, [slot], (d) => setSlot(d._w));
      ctx.on(slot, 'click', () => { if (cur && !cur.answered && !cur.chosen) ctx.toast('先點一個積木，再點這裡 Tap a block first'); });

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🤖 聽句子，把對的動作積木拖進程式格，再按 ▶ 執行！', 'Drag the right action block into the program and run it.'), L.listenBar(ctx, item));
        // distractor blocks: other verbs that are not also inside this sentence ("I can see…" never offers "can")
        const opts = u.shuffle([item].concat(L.others(ctx, item, nBlocks - 1, { levelOnly: true, filter: (w) => !mentions(item.sentence, w.word) && !mentions(w.sentence, item.word) })));
        blocks.forEach((b, i) => { const w = opts[i]; b._w = w || null; b.hidden = !w; b.classList.remove('ls-selected'); if (w) blockFace(b, w); });
        clearSlot(); runBtn.disabled = false;
        cur = { item, chosen: null, answered: false, done };
        const right = blocks.find((b) => b._w === item); const wrong = blocks.find((b) => b._w && b._w !== item);
        T.set(() => { setSlot(right._w); run(); }, () => { setSlot(wrong._w); run(); });
      }));
      return { test: T.api };
    },
  });

  /* ---------- L06c Recording Studio (CLOZE) ---------- */
  const AUX = ['can', "can't", 'will', 'should'];
  const third = (b) => (/(s|sh|ch|x|o)$/.test(b) ? b + 'es' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ies' : b + 's');
  const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'am', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'our', 'your', 'to', 'in', 'on', 'at', 'with', 'this', 'that', 'and']);
  /** the blank: the key word, or (no key found) the longest content word */
  function blankOf(item) {
    const k = L.key(item); if (k) return { text: k.text, start: k.start, isKey: true };
    const toks = L.tokens(item.sentence).filter((t) => !STOP.has(t.w) && t.t.length > 2).sort((a, b) => b.t.length - a.t.length);
    const t = toks[0] || L.tokens(item.sentence)[0];
    return { text: t.t, start: item.sentence.indexOf(t.t), isKey: false };
  }
  /** answer options in the same form as the blank: other key words of the level */
  function optionsFor(ctx, item, blank, n) {
    const ans = blank.text; const base = item.word.toLowerCase(); const low = ans.toLowerCase();
    const inSentence = new Set(L.tokens(item.sentence).map((t) => t.w));
    let cands;
    const lvl = u.shuffle(EP.levelWords(item.level).filter((w) => w !== item));
    if (!blank.isKey) cands = lvl.map((w) => L.keyText(w).toLowerCase());
    else if (AUX.includes(base) || base === 'is') cands = AUX.filter((x) => x !== base);
    else {
      const verbs = lvl.filter((w) => !AUX.includes(w.word.toLowerCase()) && w.word.toLowerCase() !== 'is').map((w) => w.word.toLowerCase());
      cands = low === base ? verbs : verbs.map(third);
    }
    const out = []; const seen = new Set([low]);
    for (const c of cands) { if (seen.has(c) || inSentence.has(c)) continue; seen.add(c); out.push(c); if (out.length >= n - 1) break; }
    const cap = (s) => (blank.start === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    return u.shuffle([ans].concat(out.map(cap)));
  }

  L.register({
    id: 'L06c',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(165deg,#141517,#212529 50%,#343a40)' });
      const air = u.el('span', { class: 'l06c-air', 'aria-hidden': 'true' }, 'ON AIR');
      const wave = u.el('div', { class: 'l06c-wave', 'aria-hidden': 'true' }, Array.from({ length: 12 }, () => u.el('i')));
      const sub = u.el('div', { class: 'l06c-sub', 'aria-live': 'polite' });
      const zh = u.el('div', { class: 'l06c-zh zh' });
      const screen = u.el('div', { class: 'l06c-screen' }, sub, zh);
      const choiceBox = u.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.append(u.el('div', { class: 'l06c-studio' }, u.el('div', { class: 'l06c-top' }, air, u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '🎙️'), wave), screen, choiceBox));
      const n = ctx.difficulty === 'easy' ? 3 : 4;
      const onAir = (on) => { air.classList.toggle('on', on); wave.classList.toggle('on', on); };

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item);
        st.head.append(L.say('🎙️ 字幕少了一個字！聽錄音，選出空格裡的字。', 'Pick the missing word in the subtitle.'), bar);
        // light the ON AIR lamp whenever the sentence is played
        let airT = 0;
        const lamp = () => { onAir(true); clearTimeout(airT); airT = ctx.timeout(() => onAir(false), 2600); };
        bar.querySelectorAll('button').forEach((x) => ctx.on(x, 'click', lamp));
        lamp();
        const blank = blankOf(item);
        const hole = u.el('span', { class: 'l06c-blank' }, '\u00a0', u.el('span', { class: 'l06c-sr' }, '(blank 空格)'));
        sub.innerHTML = ''; sub.append(item.sentence.slice(0, blank.start), hole, item.sentence.slice(blank.start + blank.text.length));
        zh.textContent = ctx.difficulty === 'easy' ? item.sentenceZh : ''; zh.hidden = ctx.difficulty !== 'easy';
        const opts = optionsFor(ctx, item, blank, n);
        const right = opts.indexOf(blank.text);
        let answered = false;
        const pick = (i, b) => {
          if (answered) return; answered = true; ch.lock(); ch.mark(right, i);
          const ok = i === right;
          hole.textContent = blank.text; hole.classList.toggle('ok', ok);
          const r = b.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect();
          L.feedback(ctx, item, ok, { x: r.left - sr.left + r.width / 2, y: r.top - sr.top, wrongText: `空格是「${blank.text}」 The word is "${blank.text}"` }).then(done);
        };
        const ch = L.choices(opts.map((o) => ({ label: o, aria: 'Choose ' + o })), pick, 'l06c-choices');
        choiceBox.innerHTML = ''; choiceBox.append(ch.el);
        T.set(() => pick(right, ch.btns[right]), () => { const k = opts.findIndex((_, i) => i !== right); pick(k, ch.btns[k]); });
      }));
      return { test: T.api };
    },
  });
})();
