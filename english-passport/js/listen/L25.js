/* Sentence Listening — Level 25 (Questions & classroom English 問句與教室用語): TPR_COMMAND, QUESTION_STATEMENT, WH_ANSWER
 * L25a uses the 25 classroom commands of L.CMD (filter 'command'), L25c the 13 questions/greetings of L.QA (filter 'qa'),
 * L25b all 39 items (9 end with "?"). Several items have no key word in their sentence — none of these games needs one. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;
  const center = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; };
  const isQ = (w) => /\?\s*$/.test(w.sentence);

  L.css('L25', `
.l25a-room{display:flex;align-items:flex-end;justify-content:center;gap:clamp(10px,4vw,40px);width:100%;max-width:820px;background:linear-gradient(#2b5e3b,#244f32);border:8px solid #8d5524;border-radius:18px;padding:10px 14px 8px;box-shadow:0 6px 0 rgba(0,0,0,.25)}
.l25a-tch,.l25a-kid{font-size:clamp(2.6rem,8vw,3.8rem);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l25a-bubble{background:#fff;color:#1d2340;border-radius:16px 16px 16px 4px;padding:6px 12px;font-weight:900;align-self:flex-start}
.l25a-kidbox{display:flex;align-items:center;gap:6px;min-width:5.5em;justify-content:center;color:#fff;font-weight:800}
.l25a-act{font-size:clamp(2rem,6vw,3rem);line-height:1}
.l25a-do{animation:l25a-do .5s ease-out 2}
@keyframes l25a-do{40%{transform:translateY(-12px) rotate(-8deg)}70%{transform:translateY(0) rotate(6deg)}}
.l25a-cards{max-width:820px}
.l25a-n3{grid-template-columns:repeat(3,1fr)}.l25a-n4{grid-template-columns:repeat(4,1fr)}.l25a-n6{grid-template-columns:repeat(3,1fr)}
@media (max-width:560px){.l25a-n4,.l25a-n6{grid-template-columns:repeat(2,1fr)}}
.l25a-cards .ls-choice{flex-direction:column;min-height:clamp(100px,17vh,140px);gap:4px}
.l25a-cards .ls-emoji{font-size:clamp(2.4rem,7vw,3.4rem)}
.l25a-zh{font-size:clamp(1rem,3.4vw,1.25rem)}
.l25b-row{display:flex;gap:12px;justify-content:center;align-items:stretch;width:100%;max-width:820px}
.l25b-bin{flex:1;min-width:0;min-height:clamp(120px,24vh,190px);border:4px solid #fff;border-radius:22px;color:#fff;font-weight:900;font-size:clamp(1.1rem,3.8vw,1.5rem);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.3);padding:8px}
.l25b-bin:focus-visible,.l25b-card:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l25b-bin .ls-emoji{font-size:clamp(2.4rem,8vw,3.6rem)}
.l25b-q{background:#5f3dc4}.l25b-n{background:#0b7285}
.l25b-bin.l25b-right{background:#237032}.l25b-bin.l25b-wrong{background:#c92a2a}
.l25b-card{display:flex;align-items:center;gap:10px;border:3px dashed #5f3dc4;border-radius:18px;background:#fff;color:#1d2340;font-weight:900;font-size:clamp(1.05rem,3.6vw,1.35rem);padding:10px 18px;cursor:grab;touch-action:none;box-shadow:0 5px 0 rgba(0,0,0,.25)}
.l25b-card .ls-emoji{font-size:2.2rem}
.l25b-card.l25b-gone{visibility:hidden}
.l25b-tip{background:#fff3bf;color:#5c3d00;border-radius:14px;padding:6px 12px;font-weight:800;max-width:720px;text-align:center}
.l25b-said{background:#fff;color:#1d2340;border-radius:14px;padding:6px 14px;font-weight:900;font-size:clamp(1.1rem,4vw,1.5rem)}
.l25b-said b{color:#c92a2a;font-size:1.25em}
.l25c-chat{width:min(660px,100%);background:#e7f5ff;border-radius:22px;padding:12px;display:flex;flex-direction:column;gap:10px;color:#1d2340;box-shadow:0 6px 0 rgba(0,0,0,.2)}
.l25c-msg{display:flex;gap:8px;align-items:flex-end}
.l25c-msg.l25c-me{flex-direction:row-reverse}
.l25c-av{font-size:2.3rem;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l25c-bub{background:#fff;border-radius:18px 18px 18px 4px;padding:8px 14px;font-weight:800;box-shadow:0 2px 0 rgba(0,0,0,.12);max-width:80%}
.l25c-msg.l25c-me .l25c-bub{background:#d3f9d8;border-radius:18px 18px 4px 18px}
.l25c-wave{display:inline-flex;gap:3px;align-items:flex-end;height:22px;vertical-align:middle;margin-left:6px}
.l25c-wave i{display:block;width:5px;border-radius:3px;background:#1c7ed6;animation:l25c-wave .9s ease-in-out infinite alternate}
.l25c-wave i:nth-child(1){height:30%}.l25c-wave i:nth-child(2){height:80%;animation-delay:.15s}.l25c-wave i:nth-child(3){height:55%;animation-delay:.3s}.l25c-wave i:nth-child(4){height:95%;animation-delay:.45s}.l25c-wave i:nth-child(5){height:40%;animation-delay:.6s}
@keyframes l25c-wave{to{transform:scaleY(.35)}}
.l25c-zhq{display:block;font-size:.95rem;color:#495057;margin-top:2px}
.l25c-opts{grid-template-columns:repeat(auto-fit,minmax(min(200px,80vw),1fr));max-width:820px}
.l25c-opts .ls-choice{flex-direction:column;gap:2px}
.l25c-en{font-size:clamp(1.05rem,3.6vw,1.3rem)}
.l25c-zh{font-size:.9rem;color:#495057;font-weight:700}
.l25c-opts .ls-choice.right .l25c-zh,.l25c-opts .ls-choice.wrongpick .l25c-zh{color:#fff}
.l25c-hint{background:#fff;color:#1d2340}
`);

  /* L25a Classroom Commands — the teacher gives a command; pick the picture of that action */
  // minimal pairs and look-alike commands are used as distractors first
  const PAIRS = {
    'Open the door.': ['Close the door.'], 'Close the door.': ['Open the door.'],
    'Turn on the light.': ['Turn off the light.'], 'Turn off the light.': ['Turn on the light.'],
    'Open your book.': ['Close your book.', 'Read a book.'], 'Close your book.': ['Open your book.'],
    'Stand up.': ['Sit down.', 'Line up.'], 'Sit down.': ['Stand up.'], 'Line up.': ['Stand up.', 'Come here.'],
    'Draw a picture.': ['Draw a sun.', 'Color the picture.'], 'Draw a sun.': ['Draw a picture.'], 'Color the picture.': ['Draw a picture.'],
    'Look at the board.': ['Look at the rainbow.'], 'Look at the rainbow.': ['Look at the board.'],
    'Wash your hands.': ['Clap your hands.'], 'Clap your hands.': ['Wash your hands.', 'Raise your hand.'], 'Raise your hand.': ['Clap your hands.'],
    'Read a book.': ['Open your book.'], 'Write your name.': ['Draw a picture.'], 'Be quiet.': ['Listen carefully.'], 'Listen carefully.': ['Be quiet.'],
    'Come here.': ['Line up.'], 'Wear your glasses.': ['Look at the board.'], 'Say cheese!': ['Clap your hands.'],
  };
  L.register({
    id: 'L25a',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#e67700,#fab005)' });
      const n = d === 'easy' ? 3 : d === 'hard' ? 6 : 4;
      const kidBox = u.el('div', { class: 'l25a-kidbox', 'aria-hidden': 'true' }, u.el('span', { class: 'l25a-kid' }, '🧒'));
      const room = u.el('div', { class: 'l25a-room', 'aria-hidden': 'true' },
        u.el('span', { class: 'l25a-tch' }, '👩‍🏫'), u.el('div', { class: 'l25a-bubble' }, '🔊 Listen! 注意聽'), kidBox);
      const cardBox = u.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.append(room, cardBox);
      const cmds = ctx.pool.filter((w) => L.CMD[w.word]);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🙋 老師下指令！聽句子，點做出正確動作的圖卡。', 'Tap the picture doing what the teacher says.'), L.listenBar(ctx, item));
        kidBox.innerHTML = ''; kidBox.append(u.el('span', { class: 'l25a-kid' }, '🧒'), u.el('span', { class: 'zh' }, '我要做…?'));
        const others = cmds.filter((w) => w !== item && L.CMD[w.word] !== L.CMD[item.word]);
        const pairs = (PAIRS[item.word] || []).map((t) => others.find((w) => w.word === t)).filter(Boolean);
        const rest = u.shuffle(others.filter((w) => !pairs.includes(w)));
        const opts = u.shuffle([item].concat(pairs.concat(rest).slice(0, n - 1)));
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true; ch.lock();
          const w = opts[i]; const ok = w === item; const right = opts.indexOf(item);
          ch.mark(right, i);
          kidBox.innerHTML = ''; kidBox.append(u.el('span', { class: 'l25a-kid' }, '🧒'), u.el('span', { class: 'l25a-act l25a-do' }, L.CMD[w.word]));
          const p = center(ctx, ch.btns[i]);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y - 40, wrongText: `Not “${L.CMD_ZH[w.word]}” 不是這個動作` }).then(done);
        };
        const ch = L.choices(opts.map((w) => ({
          el: [u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, L.CMD[w.word]), u.el('span', { class: 'zh l25a-zh' }, L.CMD_ZH[w.word])],
          aria: L.CMD_ZH[w.word],
        })), pick, 'l25a-cards l25a-n' + opts.length);
        cardBox.innerHTML = ''; cardBox.appendChild(ch.el);
        T.set(() => pick(opts.indexOf(item)), () => pick(opts.findIndex((w) => w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* L25b Question or Not? — sort the heard sentence into "Question" or "Not a question" (ends with "?" or not) */
  L.register({
    id: 'L25b',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#364fc7,#7048e8)' });
      // only 9 of the 39 sentences are questions: make sure about 40 % of the round are questions
      let list = ctx.items.slice();
      const want = Math.min(Math.round(list.length * 0.4), ctx.pool.filter(isQ).length);
      const have = list.filter(isQ).length;
      if (have < want) {
        const extra = u.shuffle(ctx.pool.filter((w) => isQ(w) && !list.includes(w))).slice(0, want - have);
        for (const e of extra) { const i = list.findIndex((w) => !isQ(w) && !extra.includes(w)); if (i >= 0) list[i] = e; }
      } else if (list.length - have < want) {
        const extra = u.shuffle(ctx.pool.filter((w) => !isQ(w) && !list.includes(w))).slice(0, want - (list.length - have));
        for (const e of extra) { const i = list.findIndex((w) => isQ(w) && !extra.includes(w)); if (i >= 0) list[i] = e; }
      }
      list = u.shuffle(list);
      const card = u.el('button', { class: 'l25b-card', type: 'button', 'aria-label': 'Sentence card: drag it to a box, or tap it and then a box 句子卡：拖到箱子，或先點卡再點箱子' },
        u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '🎧'), u.el('span', {}, 'This sentence 這句話'));
      const binQ = u.el('button', { class: 'l25b-bin l25b-q', type: 'button' }, u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '❓'), u.el('span', {}, 'Question'), u.el('span', { class: 'zh' }, '問句'));
      const binN = u.el('button', { class: 'l25b-bin l25b-n', type: 'button' }, u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '💬'), u.el('span', {}, 'Not a question'), u.el('span', { class: 'zh' }, '不是問句'));
      const said = u.el('div', { class: 'l25b-said', 'aria-live': 'polite' });
      st.body.append(card, said, u.el('div', { class: 'l25b-row' }, binQ, binN));
      if (d === 'easy') st.foot.append(u.el('div', { class: 'l25b-tip zh' }, '💡 問句常用 What／Who／Where／When／Why／How／Which 開頭，說完會等別人回答。指令或說明不用回答。'));
      let answered = true, cur = null, finishRound = null;
      const choose = (q) => {
        if (answered) return; answered = true;
        const item = cur; const ok = q === isQ(item); const bin = q ? binQ : binN;
        bin.classList.add(ok ? 'l25b-right' : 'l25b-wrong'); card.classList.add('l25b-gone');
        // learning moment: show the sentence and its end mark
        const s = item.sentence.replace(/\s+$/, ''); said.innerHTML = '';
        said.append(s.slice(0, -1), u.el('b', {}, s.slice(-1)));
        const p = center(ctx, bin);
        L.feedback(ctx, item, ok, { x: p.x, y: p.y - 30, showOnRight: true, okMs: 1300, wrongText: isQ(item) ? 'It is a question 這是問句' : 'Not a question 這不是問句' }).then(() => finishRound && finishRound());
      };
      L.dnd(ctx, [card], [binQ, binN], (dEl, t) => choose(t === binQ));
      ctx.on(binQ, 'click', () => choose(true)); ctx.on(binN, 'click', () => choose(false));
      L.rounds(ctx, list, (item) => new Promise((done) => {
        cur = item; finishRound = done;
        st.head.innerHTML = '';
        st.head.append(L.say('❔ 聽句子：老師在問問題嗎？把句子卡拖到（或點）對的箱子。', 'Is it a question? Drag the card or tap a box.'), L.listenBar(ctx, item));
        [binQ, binN].forEach((b) => b.classList.remove('l25b-right', 'l25b-wrong'));
        card.classList.remove('l25b-gone'); said.textContent = '🎧 …';
        answered = false;
        T.set(() => choose(isQ(item)), () => choose(!isQ(item)));
      }));
      return { test: T.api };
    },
  });

  /* L25c Ask & Answer — someone asks a question or greets you; choose the best reply (replies are text only) */
  const AVATARS = ['👧', '👦', '🧑', '👩‍🏫', '👨‍🏫', '👵'];
  const AVOID = { when: ['What time is it?'], 'What time is it?': ['when'], 'Good night!': ['Good job!'] }; // replies that could almost fit
  L.register({
    id: 'L25c',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#20c997)' });
      const n = d === 'hard' ? 4 : 3; const showZh = d !== 'hard';
      const chat = u.el('div', { class: 'l25c-chat', role: 'log', 'aria-label': 'Chat 對話' });
      const optBox = u.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.append(chat, optBox);
      const qa = ctx.pool.filter((w) => L.QA[w.word]);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('💁 有人問你問題或跟你打招呼，選出最合適的回答！', 'Choose the best reply.'), L.listenBar(ctx, item));
        const av = u.pick(AVATARS);
        const qBub = u.el('div', { class: 'l25c-bub' }, u.el('span', { 'aria-label': 'Listen to the question 聽問題' }, '🔊 …'), u.el('span', { class: 'l25c-wave', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map(() => u.el('i'))));
        chat.innerHTML = ''; chat.append(u.el('div', { class: 'l25c-msg' }, u.el('span', { class: 'l25c-av', 'aria-hidden': 'true' }, av), qBub));
        if (d === 'easy') {
          const hb = u.el('button', { class: 'btn small l25c-hint', type: 'button' }, '💡 中文提示 Hint');
          ctx.on(hb, 'click', () => { hb.replaceWith(u.el('span', { class: 'l25c-zhq zh' }, item.sentenceZh)); });
          qBub.appendChild(u.el('div', {}, hb));
        }
        const avoid = AVOID[item.word] || [];
        const pool = u.shuffle(qa.filter((w) => w !== item && L.QA[w.word] !== L.QA[item.word] && !avoid.includes(w.word)));
        const opts = u.shuffle([item].concat(pool.slice(0, n - 1)));
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true; ch.lock();
          const w = opts[i]; const ok = w === item;
          ch.mark(opts.indexOf(item), i);
          chat.append(u.el('div', { class: 'l25c-msg l25c-me' }, u.el('span', { class: 'l25c-av', 'aria-hidden': 'true' }, '🙂'), u.el('div', { class: 'l25c-bub' }, L.QA[w.word])));
          chat.append(u.el('div', { class: 'l25c-msg' }, u.el('span', { class: 'l25c-av', 'aria-hidden': 'true' }, av), u.el('div', { class: 'l25c-bub' }, ok ? '😄 👍' : '🤔 ?')));
          const p = center(ctx, ch.btns[i]);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y - 30, wrongText: 'That reply does not fit 這個回答不合適', showOnRight: false }).then(done);
        };
        const ch = L.choices(opts.map((w) => ({
          el: [u.el('span', { class: 'l25c-en', lang: 'en' }, L.QA[w.word]), showZh ? u.el('span', { class: 'zh l25c-zh' }, L.QA_ZH[w.word]) : null],
          aria: L.QA[w.word] + (showZh ? ' ' + L.QA_ZH[w.word] : ''),
        })), pick, 'l25c-opts');
        optBox.innerHTML = ''; optBox.appendChild(ch.el);
        T.set(() => pick(opts.indexOf(item)), () => pick(opts.findIndex((w) => w !== item)));
      }));
      return { test: T.api };
    },
  });
})();
