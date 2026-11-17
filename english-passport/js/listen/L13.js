/* Sentence Listening — Level 13 (Jobs, school subjects & home): TOOL_MATCH, TIMETABLE_GRID, TRANSLATION_CHECK
 * L13a Ready for Work: someone waits at the tool desk; hear who/what it is and give the right tool (tap or drag).
 * L13b School & Home Planner: tap the subject or room of the sentence in the planner grid.
 * L13c Interpreter Booth: is the Chinese subtitle the right translation of the sentence? ✓ or ✗. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (local to this level) ---------- */
  const toks = (s) => L.tokens(s).map((x) => x.w);
  const mentions = (sentence, word) => {
    const s = toks(sentence), w = toks(word); if (!w.length) return false;
    for (let i = 0; i + w.length <= s.length; i++) if (w.every((x, j) => s[i + j] === x)) return true;
    return false;
  };
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const nodes = (...a) => a.filter(Boolean);

  L.css('L13', `
.l13a-shop{width:100%;max-width:900px;display:flex;flex-direction:column;align-items:center;gap:clamp(10px,2.4vh,18px)}
.l13a-counter{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;background:linear-gradient(#fff4e6,#ffe8cc);color:#5c2d00;border-radius:22px;padding:12px 26px 16px;min-width:min(300px,86vw);box-shadow:0 8px 0 #c2410c33,0 8px 0 rgba(0,0,0,.18);border:4px solid #fd7e14}
.l13a-counter.ls-over{background:#fff3bf}
.l13a-who{display:flex;align-items:center;justify-content:center;gap:10px;min-height:clamp(70px,13vh,104px)}
.l13a-who .l13a-mys{font-size:clamp(3rem,10vh,4.4rem);line-height:1;filter:grayscale(1) brightness(.35)}
.l13a-who .ls-emoji{font-size:clamp(3rem,10vh,4.4rem)}
.l13a-who .ls-zhcard{font-size:1.6rem;padding:10px 14px}
.l13a-got{font-size:clamp(2.2rem,7vh,3rem);animation:l13aGive .4s ease-out}
@keyframes l13aGive{from{transform:translateY(60px) scale(.6)}}
.l13a-name{font-weight:900;font-size:1.25rem;min-height:1.5em;text-align:center}
.l13a-bubble{background:#fff;color:#1d2340;border-radius:14px;padding:4px 12px;font-weight:800;font-size:.95rem;box-shadow:0 3px 0 rgba(0,0,0,.12)}
.l13a-frame{background:#1d2340;color:#fff;border-radius:12px;padding:6px 14px;font-weight:800;font-size:clamp(1.1rem,3vw,1.35rem)}
.l13a-tools{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:10px;width:100%}
@media (max-width:640px){.l13a-tools{grid-template-columns:repeat(var(--m,2),minmax(0,1fr))}}
.l13a-tool{border:0;border-radius:18px;background:#fff;color:#1d2340;font-weight:900;font-size:clamp(1rem,2.6vw,1.2rem);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px 6px;min-height:clamp(84px,15vh,120px);box-shadow:0 6px 0 rgba(0,0,0,.25);cursor:grab;touch-action:none;font-family:inherit}
.l13a-tool .ls-emoji{font-size:clamp(2.2rem,6.5vh,3rem)}
.l13a-tool[hidden]{display:none}
.l13a-tool:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l13a-tool.l13a-right{background:#2b8a3e;color:#fff}
.l13a-tool.l13a-wrongpick{background:#c92a2a;color:#fff}
.l13a-tool.l13a-dim{opacity:.55}

.l13b-board{width:100%;max-width:900px;background:#fff;color:#1d2340;border-radius:22px;padding:12px;box-shadow:0 8px 0 rgba(0,0,0,.22);display:flex;flex-direction:column;gap:10px;border-top:16px solid #1c7ed6;position:relative}
.l13b-board::before{content:'';position:absolute;top:-24px;left:12%;right:12%;height:14px;background:repeating-linear-gradient(90deg,transparent 0 18px,#adb5bd 18px 30px);border-radius:6px}
.l13b-title{font-weight:900;text-align:center;font-size:1.1rem}
.l13b-sec{display:grid;grid-template-columns:clamp(64px,13vw,104px) 1fr;gap:8px;align-items:stretch}
.l13b-lab{border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;text-align:center;padding:6px;line-height:1.2;font-size:.95rem}
.l13b-lab .ls-emoji{font-size:1.7rem}
.l13b-school .l13b-lab{background:#d0ebff;color:#0b4a8a}
.l13b-home .l13b-lab{background:#ffe8cc;color:#7a3500}
.l13b-cells{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(92px,17vw,132px),1fr));gap:8px}
.l13b-cell{border:3px solid #dee2e6;border-radius:14px;background:#f8f9fa;color:#1d2340;font-weight:900;font-size:clamp(1rem,2.5vw,1.2rem);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:clamp(70px,12vh,96px);padding:6px 4px;cursor:pointer;line-height:1.15;text-align:center;font-family:inherit}
.l13b-school .l13b-cell{border-color:#a5d8ff}
.l13b-home .l13b-cell{border-color:#ffc078}
.l13b-cell .ls-emoji{font-size:clamp(1.8rem,5vh,2.4rem)}
.l13b-cell .ls-zhcard{font-size:.95rem}
.l13b-cell .l13b-zh{font-size:.85rem;color:#495057}
.l13b-cell:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l13b-cell.l13b-right{background:#2b8a3e;border-color:#2b8a3e;color:#fff}
.l13b-cell.l13b-right .l13b-zh{color:#fff}
.l13b-cell.l13b-wrongpick{background:#c92a2a;border-color:#c92a2a;color:#fff}
.l13b-cell.l13b-wrongpick .l13b-zh{color:#fff}

@media (max-width:640px){
.l13b-board{padding:10px 8px}
.l13b-sec{grid-template-columns:1fr;gap:6px}
.l13b-lab{flex-direction:row;gap:6px;padding:3px 8px}
.l13b-lab .ls-emoji{font-size:1.2rem}
.l13b-cells{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.l13b-cell{min-height:62px;font-size:.98rem;padding:4px 2px}
.l13b-cell .ls-emoji{font-size:1.6rem}
}
.l13c-booth{width:100%;max-width:820px;display:flex;flex-direction:column;align-items:center;gap:14px}
.l13c-desk{display:flex;align-items:center;gap:14px;background:#212529;border-radius:22px;padding:12px 16px;box-shadow:0 0 0 5px #495057,0 9px 0 5px rgba(0,0,0,.35);width:100%}
.l13c-me{font-size:clamp(2.6rem,9vh,3.8rem);line-height:1;flex:none;position:relative}
.l13c-hint{display:inline-flex;align-items:center;gap:6px;margin-top:6px;background:#fff3bf;color:#5c3d00;border-radius:10px;padding:2px 10px;font-weight:800;font-size:.95rem}
.l13c-hint[hidden]{display:none}
.l13c-hint .ls-emoji{font-size:1.6rem}
.l13c-screen{flex:1;min-width:0;background:#0b1020;border-radius:14px;padding:10px 14px;border:3px solid #364fc7;color:#fff}
.l13c-cap{font-size:.8rem;font-weight:800;color:#a5d8ff;letter-spacing:.04em}
.l13c-zh{font-size:clamp(1.5rem,5vw,2.3rem);font-weight:900;line-height:1.3;color:#fff3bf}
.l13c-zh.l13c-x{text-decoration:line-through;text-decoration-color:#ff8787;text-decoration-thickness:4px}
.l13c-stamp{font-weight:900;font-size:1.05rem;margin-top:4px;min-height:1.4em}
.l13c-stamp.l13c-sok{color:#8ce99a}.l13c-stamp.l13c-sno{color:#ffa8a8}
@media (max-width:640px){.l13c-desk{flex-direction:column;gap:6px;padding:10px}.l13c-me{font-size:2.3rem}.l13c-screen{width:100%}}
.l13c-btns{display:grid;grid-template-columns:1fr 1fr;gap:14px;width:min(100%,560px)}
.l13c-btn{border:0;border-radius:22px;font-weight:900;font-size:clamp(1.3rem,4vw,1.7rem);min-height:clamp(78px,14vh,104px);color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;box-shadow:0 7px 0 rgba(0,0,0,.3);font-family:inherit}
.l13c-btn .l13c-ic{font-size:2.1rem}
.l13c-yes{background:#2b8a3e}.l13c-no{background:#c92a2a}
.l13c-btn:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.3)}
.l13c-btn:focus-visible{outline:5px solid #ffd43b;outline-offset:3px}
.l13c-btn.l13c-dim{opacity:.5}
.l13c-btn.l13c-picked{box-shadow:0 0 0 5px #fff,0 7px 0 rgba(0,0,0,.3)}
`);

  /* ---------- L13a Ready for Work — give the right tool ---------- */
  // pairs that are too close to be fair distractors (a nurse may use a stethoscope, a student a pencil …)
  const CONFLICT = [['money', 'dollar'], ['doctor', 'nurse'], ['teacher', 'student', 'homework'], ['kitchen', 'dining room']];
  const clash = (a, b) => CONFLICT.some((g) => g.includes(a.word) && g.includes(b.word));
  // who shows up at the desk after the answer, when their own picture is the same as the tool (🎨 art → 🎨 palette)
  const HELPER = { art: '🧑‍🎨', math: '🧑‍🎓', science: '🧑‍🔬', English: '🧑‍🎓', kitchen: '🏠', bathroom: '🏠', 'dining room': '🏠', dollar: '🪙' };

  L.register({
    id: 'L13a',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(165deg,#d9480f,#fd7e14 55%,#ffd8a8)' });
      const n = Math.min(D === 'easy' ? 3 : D === 'hard' ? 5 : 4, ctx.pool.length);
      const who = u.el('div', { class: 'l13a-who' });
      const name = u.el('div', { class: 'l13a-name', 'aria-live': 'polite' });
      const bubble = u.el('div', { class: 'l13a-bubble zh' }, '💬 I need something! 我需要一樣東西！');
      const frame = u.el('div', { class: 'l13a-frame' });
      const counter = u.el('div', { class: 'l13a-counter', role: 'group', 'aria-label': 'Tool desk 工具借用台' }, bubble, who, name);
      const toolsEl = u.el('div', { class: 'l13a-tools', role: 'group', 'aria-label': 'Tools 工具' });
      toolsEl.style.setProperty('--n', n); toolsEl.style.setProperty('--m', n === 4 ? 2 : n === 5 ? 3 : n);
      const slots = Array.from({ length: n }, () => { const b = u.el('button', { class: 'l13a-tool' }); toolsEl.appendChild(b); return { b, w: null }; });
      st.body.append(u.el('div', { class: 'l13a-shop' }, counter, D === 'easy' ? frame : null, toolsEl));
      let cur = null;
      const dnd = L.dnd(ctx, slots.map((s) => s.b), [counter], (d) => { if (cur) cur.give(slots.find((s) => s.b === d)); });
      slots.forEach((s) => ctx.on(s.b, 'click', () => { if (cur) cur.give(s); })); // a tap gives the tool straight away

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🧰 聽句子：是誰（什麼）需要幫忙？把對的工具或物品交給他！', 'Give the tool that goes with what you heard. Tap or drag.'), L.listenBar(ctx, item));
        dnd.clear();
        who.innerHTML = ''; who.append(u.el('span', { class: 'l13a-mys', 'aria-hidden': 'true' }, '👤'), u.el('span', { class: 'l13a-mys', 'aria-hidden': 'true' }, '❓'));
        name.textContent = ''; bubble.hidden = false;
        if (D === 'easy') frame.textContent = '📝 ' + (L.swapKey(item, '____') || '🔊 …');
        const others = L.others(ctx, item, n - 1, { poolOnly: true, filter: (w) => !!L.TOOL[w.word] && !clash(item, w) && !mentions(item.sentence, w.word) });
        const opts = u.shuffle([item].concat(others));
        slots.forEach((s, i) => {
          const w = opts[i]; s.w = w; s.b.className = 'l13a-tool'; s.b.innerHTML = ''; s.b.hidden = !w;
          if (!w) return;
          const [emo, zh] = L.TOOL[w.word];
          s.b.append(u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, emo), D === 'hard' ? null : u.el('span', { class: 'zh' }, zh));
          s.b.setAttribute('aria-label', `${zh} 交給他 give`);
        });
        let answered = false;
        cur = {
          give(s) {
            if (answered || !s || !s.w) return; answered = true; cur = null; dnd.clear();
            const ok = s.w === item; const ri = slots.findIndex((x) => x.w === item);
            slots.forEach((x, j) => x.b.classList.add(j === ri ? 'l13a-right' : x === s ? 'l13a-wrongpick' : 'l13a-dim'));
            // reveal who it was + the tool in their hands
            who.innerHTML = ''; bubble.hidden = true;
            const face = EP.pic(item) === L.TOOL[item.word][0] && HELPER[item.word] ? u.el('span', { class: 'ls-emoji', role: 'img', 'aria-label': item.zh }, HELPER[item.word]) : L.face(item);
            who.append(face, u.el('span', { class: 'l13a-got', 'aria-hidden': 'true' }, L.TOOL[s.w.word][0]));
            name.textContent = `${item.word} ${item.zh}` + (ok ? ' 😊' : ' 😟');
            if (ok) EP.sfx.pop(); else ctx.shake(counter);
            L.feedback(ctx, item, ok, Object.assign(rel(ctx, s.b), { wrongText: `Right tool 正確的是 ${L.TOOL[item.word][0]} ${L.TOOL[item.word][1]}` })).then(done);
          },
        };
        T.set(() => cur && cur.give(slots.find((s) => s.w === item)), () => cur && cur.give(slots.find((s) => s.w && s.w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L13b School & Home Planner — tap the subject or room ---------- */
  const ROOMS = new Set(['bathroom', 'living room', 'bedroom', 'kitchen', 'dining room']);
  L.register({
    id: 'L13b',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#3bc9db 55%,#c5f6fa)' });
      const nCells = Math.min(D === 'easy' ? 6 : D === 'hard' ? 12 : 9, ctx.pool.length);
      const board = u.el('div', { class: 'l13b-board', role: 'group', 'aria-label': 'Planner 格子表' });
      st.body.append(board);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; board.innerHTML = '';
        st.head.append(L.say('🗂️ 聽句子，在格子表上點出句子說的「科目」或「房間」！', 'Tap the subject or room in the planner.'), L.listenBar(ctx, item));
        const others = L.others(ctx, item, nCells - 1, { poolOnly: true, filter: (w) => L.PLANNER.has(w.word.toLowerCase()) && !mentions(item.sentence, w.word) });
        const set = [item].concat(others);
        const cells = [];
        const section = (cls, emo, en, zh, list) => {
          if (!list.length) return null;
          const box = u.el('div', { class: 'l13b-cells' });
          list.forEach((w) => {
            const b = u.el('button', { class: 'l13b-cell' }, ...nodes(D !== 'hard' ? L.face(w) : null, u.el('span', {}, w.word), D === 'easy' && EP.pic(w) ? u.el('span', { class: 'l13b-zh zh' }, w.zh) : null));
            const c = { w, b }; ctx.on(b, 'click', () => pick(c)); cells.push(c); box.appendChild(b);
          });
          return u.el('div', { class: 'l13b-sec ' + cls }, u.el('div', { class: 'l13b-lab' }, u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, emo), u.el('span', { class: 'zh' }, zh), u.el('span', {}, en)), box);
        };
        const school = u.shuffle(set.filter((w) => !ROOMS.has(w.word))), home = u.shuffle(set.filter((w) => ROOMS.has(w.word)));
        board.append(u.el('div', { class: 'l13b-title zh' }, '📒 My Planner 我的格子表'),
          ...nodes(section('l13b-school', '🏫', 'School', '學校', school), section('l13b-home', '🏠', 'Home', '家', home)));
        let answered = false;
        function pick(c) {
          if (answered || !c) return; answered = true;
          const ok = c.w === item; const r = cells.find((x) => x.w === item);
          c.b.classList.add(ok ? 'l13b-right' : 'l13b-wrongpick'); if (!ok) { r.b.classList.add('l13b-right'); ctx.shake(c.b); }
          L.feedback(ctx, item, ok, Object.assign(rel(ctx, c.b), { wrongText: 'Not that one 不是這一格' })).then(done);
        }
        T.set(() => pick(cells.find((c) => c.w === item)), () => pick(cells.find((c) => c.w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L13c Interpreter Booth — is the subtitle right? ---------- */
  const NOT_PAIR = [['money', 'TWD'], ['money', 'dollar'], ['dollar', 'TWD']];
  const badPair = (a, b) => NOT_PAIR.some((p) => p.includes(a.word) && p.includes(b.word));
  L.register({
    id: 'L13c',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(165deg,#212529,#343a40 50%,#495057)' });
      // about half of the subtitles are right
      const flags = u.shuffle(ctx.items.map((_, i) => i % 2 === 0));
      const zhEl = u.el('div', { class: 'l13c-zh zh' });
      const stamp = u.el('div', { class: 'l13c-stamp', role: 'status' });
      const hintPic = u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' });
      const hint = u.el('div', { class: 'l13c-hint zh' }, '💡 提示 Hint', hintPic);
      const desk = u.el('div', { class: 'l13c-desk' },
        u.el('div', { class: 'l13c-me', 'aria-hidden': 'true' }, '🧑‍💼🎧'),
        u.el('div', { class: 'l13c-screen' }, u.el('div', { class: 'l13c-cap zh' }, '中文字幕 SUBTITLE'), zhEl, hint, stamp));
      const yes = u.el('button', { class: 'l13c-btn l13c-yes' }, u.el('span', { class: 'l13c-ic', 'aria-hidden': 'true' }, '✓'), u.el('span', { class: 'zh' }, 'Right 翻譯對'));
      const no = u.el('button', { class: 'l13c-btn l13c-no' }, u.el('span', { class: 'l13c-ic', 'aria-hidden': 'true' }, '✗'), u.el('span', { class: 'zh' }, 'Wrong 翻譯錯'));
      st.body.append(u.el('div', { class: 'l13c-booth' }, desk, u.el('div', { class: 'l13c-btns' }, yes, no)));
      let cur = null;
      ctx.on(yes, 'click', () => cur && cur.pick(true));
      ctx.on(no, 'click', () => cur && cur.pick(false));
      const shared = (a, b) => { const A = new Set(toks(a.sentence)); return toks(b.sentence).filter((t) => A.has(t)).length + (toks(a.sentence).length === toks(b.sentence).length ? 1 : 0); };

      L.rounds(ctx, ctx.items, (item, i) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎧 你是口譯員：聽英文句子，螢幕上的中文翻譯對嗎？', 'Is the Chinese subtitle right? ✓ or ✗'), L.listenBar(ctx, item));
        const right = flags[i];
        let shown = item.sentenceZh;
        if (!right) {
          // another official sentence's translation; hard = the most similar sentences
          const cands = ctx.pool.filter((w) => w.id !== item.id && w.sentenceZh !== item.sentenceZh && !badPair(item, w))
            .map((w) => ({ w, s: shared(item, w) + Math.random() * 0.5 })).sort((a, b) => b.s - a.s);
          const lim = Math.max(1, Math.min(D === 'hard' ? 3 : D === 'easy' ? cands.length : 8, cands.length));
          const pickW = cands.length ? cands[u.randInt(0, lim - 1)].w : null;
          shown = pickW ? pickW.sentenceZh : item.sentenceZh;
        }
        const isRight = shown === item.sentenceZh;
        zhEl.textContent = shown; zhEl.classList.remove('l13c-x');
        stamp.textContent = ''; stamp.className = 'l13c-stamp';
        hintPic.textContent = D === 'easy' ? (EP.pic(item) || '') : ''; hint.hidden = !hintPic.textContent;
        hintPic.removeAttribute('aria-hidden'); hintPic.setAttribute('role', 'img'); hintPic.setAttribute('aria-label', item.zh);
        [yes, no].forEach((b) => b.classList.remove('l13c-dim', 'l13c-picked'));
        let answered = false;
        cur = {
          pick(saysRight) {
            if (answered) return; answered = true; cur = null;
            const ok = saysRight === isRight;
            (saysRight ? yes : no).classList.add('l13c-picked'); (saysRight ? no : yes).classList.add('l13c-dim');
            if (!isRight) zhEl.classList.add('l13c-x');
            stamp.textContent = isRight ? '✔ 這個翻譯是對的 The translation is right' : '✘ 翻譯錯了 → ' + item.sentenceZh;
            stamp.classList.add(isRight ? 'l13c-sok' : 'l13c-sno');
            if (!ok) ctx.shake(desk);
            L.feedback(ctx, item, ok, Object.assign(rel(ctx, saysRight ? yes : no), { showOnRight: !isRight, okMs: isRight ? 750 : 1500, wrongText: isRight ? 'It was right! 翻譯是對的' : 'It was wrong! 翻譯是錯的' })).then(done);
          },
        };
        T.set(() => cur && cur.pick(isRight), () => cur && cur.pick(!isRight));
      }));
      return { test: T.api };
    },
  });
})();
