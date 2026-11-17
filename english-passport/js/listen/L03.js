/* Sentence Listening — Level 3 (Body · Health): FORM_FILL, WORD_COUNT, SAME_DIFF
 * L03a School Nurse Form — fill two fields: the word you heard (body part / problem) + what the sentence means.
 * L03b Word Drum         — hit the drum once for every word you hear, then Done.
 * L03c Echo Twins        — twin A says a sentence, twin B says the same one or a close one: Same or Different? */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen, el = u.el;
  const at = (ctx, node) => { const r = node.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top }; };
  const srcTag = (item) => (EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(item, 'sentence')) : null);
  const sfx = (n) => { try { EP.sfx && EP.sfx[n] && EP.sfx[n](); } catch (e) { /* sound is optional */ } };
  const zhKey = (s) => String(s || '').replace(/[\s。！？，、.!?,]/g, '');

  L.css('L03', `
.l03a-form{width:100%;max-width:820px;background:#fff;color:#1d2340;border-radius:20px;padding:12px 14px 14px;box-shadow:0 8px 0 rgba(0,0,0,.18);border-top:14px solid #e03131;position:relative}
.l03a-form::before{content:'';position:absolute;left:50%;top:-24px;transform:translateX(-50%);width:90px;height:22px;border-radius:10px 10px 4px 4px;background:#868e96;box-shadow:inset 0 -4px 0 rgba(0,0,0,.2)}
.l03a-top{display:flex;align-items:center;gap:10px;font-size:1.1rem;font-weight:900;border-bottom:2px dashed #dee2e6;padding-bottom:6px}
.l03a-top .ls-emoji{font-size:clamp(1.7rem,6vw,2.2rem);white-space:nowrap}
.l03a-sub{font-size:.85rem;font-weight:700;color:#495057}
.l03a-field{margin-top:8px}
.l03a-lab{font-weight:900;font-size:1rem;margin-bottom:6px;color:#1d2340}
.l03a-lab .ls-en{font-weight:700;font-size:.85rem;color:#495057}
.l03a-row{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(96px,1fr))}
.l03a-row.zhs{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.l03a-opt{min-height:48px;border:3px solid #dee2e6;border-radius:14px;background:#f8f9fa;color:#1d2340;font-weight:800;font-size:1.1rem;padding:6px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;text-align:center}
.l03a-opt .ls-emoji{font-size:1.6rem}
.l03a-opt[aria-pressed="true"]{border-color:#1971c2;background:#d0ebff;box-shadow:inset 0 0 0 2px #1971c2}
.l03a-opt[aria-pressed="true"]::before{content:'✎';font-weight:900;color:#1864ab}
.l03a-opt.right{border-color:#2b8a3e;background:#d3f9d8}
.l03a-opt.wrongpick{border-color:#c92a2a;background:#ffe3e3}
.l03a-opt:focus-visible{outline:4px solid #f59f00;outline-offset:2px}
.l03a-stamp{position:absolute;right:14px;top:8px;font-size:1.6rem;font-weight:900;transform:rotate(-12deg);border:4px solid currentColor;border-radius:10px;padding:0 8px;animation:l03aStamp .3s ease-out}
.l03a-stamp.ok{color:#2b8a3e}.l03a-stamp.bad{color:#c92a2a}
@keyframes l03aStamp{from{transform:rotate(-12deg) scale(2.4)}}
.l03b-hint{background:rgba(255,255,255,.94);color:#1d2340;border-radius:12px;padding:4px 12px;font-weight:800}
.l03b-drum{position:relative;width:min(56vw,34vh,250px);aspect-ratio:1;border-radius:50%;border:0;cursor:pointer;background:radial-gradient(circle at 50% 42%,#fff8e6 0,#ffe8a3 52%,#e8a33c 53%,#c0392b 60%,#8e2a1f 100%);box-shadow:0 10px 0 #5c1a12,0 14px 24px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.l03b-drum .ls-emoji{font-size:clamp(3rem,10vw,4.6rem)}
.l03b-drum:active,.l03b-hit{transform:translateY(5px) scale(.97);box-shadow:0 5px 0 #5c1a12,0 8px 16px rgba(0,0,0,.35)}
.l03b-drum:focus-visible{outline:5px solid #ffd43b;outline-offset:4px}
.l03b-ring{position:absolute;inset:0;border-radius:50%;border:6px solid #ffd43b;animation:l03bRing .45s ease-out forwards;pointer-events:none}
@keyframes l03bRing{to{transform:scale(1.35);border-width:1px;border-color:rgba(255,212,59,0)}}
.l03b-dots{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:30px;max-width:420px}
.l03b-dot{width:26px;height:26px;border-radius:50%;background:#ffd43b;color:#5c3d00;font-weight:900;font-size:.85rem;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.25);animation:l03bPop .2s ease-out}
@keyframes l03bPop{from{transform:scale(.2)}}
.l03b-count{font-weight:900;font-size:1.25rem;background:rgba(0,0,0,.45);border-radius:999px;padding:2px 14px}
.l03b-words{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.l03b-w{background:#fff;color:#1d2340;border-radius:12px;padding:4px 10px;font-weight:900;font-size:1.2rem;animation:l03bPop .25s ease-out backwards}
.l03b-w b{display:inline-block;min-width:1.4em;border-radius:999px;background:#c92a2a;color:#fff;font-size:.85rem;margin-right:4px;text-align:center}
.l03c-stage{display:flex;gap:clamp(14px,6vw,70px);align-items:flex-end;justify-content:center;width:100%}
.l03c-twin{display:flex;flex-direction:column;align-items:center;gap:4px;position:relative}
.l03c-face{font-size:clamp(3.6rem,13vw,6rem);line-height:1;display:inline-block}
.l03c-name{font-weight:900;font-size:1.05rem;border-radius:999px;padding:2px 12px;color:#fff}
.l03c-a .l03c-name{background:#1864ab}.l03c-b .l03c-name{background:#c2255c}
.l03c-bub{min-width:86px;min-height:52px;border-radius:20px;background:#fff;color:#1d2340;font-size:1.6rem;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 4px 0 rgba(0,0,0,.18);visibility:hidden}
.l03c-bub::after{content:'';position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);border:10px solid transparent;border-top-color:#fff;border-bottom:0}
.l03c-talk .l03c-bub{visibility:visible;animation:l03cBub .5s ease-in-out infinite alternate}
.l03c-talk .l03c-face{animation:l03cTalk .35s ease-in-out infinite alternate}
@keyframes l03cBub{to{transform:translateY(-6px)}}
@keyframes l03cTalk{to{transform:rotate(-6deg) translateY(-4px)}}
.l03c-done .l03c-bub{visibility:visible}
.l03c-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:640px}
.l03c-btns .ls-choice{min-height:84px;font-size:clamp(1.15rem,4.4vw,1.5rem);flex-direction:column;gap:0;line-height:1.2}
.l03c-btns .ls-choice[disabled]:not(.right):not(.wrongpick){background:#e9ecef;color:#495057;cursor:default}
.l03c-sym{font-size:2rem;font-weight:900}
.l03c-fb-row{margin-top:6px}
`);

  /* ===================== L03a School Nurse Form (FORM_FILL) ===================== */
  const BODY = new Set(['hands', 'hand', 'nose', 'throat', 'foot', 'feet', 'eyes', 'eye', 'teeth', 'tooth', 'ears', 'ear', 'arm', 'back', 'leg', 'head', 'mouth', 'stomach']);
  const kindOf = (w) => (BODY.has(w.word.toLowerCase()) ? 'body' : 'problem');

  /** field ① options: the item + other words of the level that are NOT in the sentence (same kind first) */
  function wordOptions(item, n) {
    const toks = new Set(L.tokens(item.sentence).map((t) => t.w));
    const lv = EP.levelWords(item.level);
    const seen = new Set([u.norm(item.word)]);
    const ok = (w) => w !== item && !toks.has(w.word.toLowerCase()) && !seen.has(u.norm(w.word));
    const pick = []; const add = (w) => { if (pick.length < n - 1 && ok(w)) { seen.add(u.norm(w.word)); pick.push(w); } };
    u.shuffle(lv.filter((w) => kindOf(w) === kindOf(item))).forEach(add);
    u.shuffle(lv.filter((w) => kindOf(w) !== kindOf(item))).forEach(add);
    return u.shuffle([item].concat(pick));
  }
  /** field ② options: the item's sentenceZh + other meanings of the level (never the same Chinese text) */
  function zhOptions(item, n) {
    const seen = new Set([zhKey(item.sentenceZh)]); const out = [item];
    for (const w of u.shuffle(EP.levelWords(item.level))) { const z = zhKey(w.sentenceZh); if (!z || seen.has(z)) continue; seen.add(z); out.push(w); if (out.length >= n) break; }
    return u.shuffle(out);
  }

  L.register({
    id: 'L03a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#c3fae8,#63e6be 55%,#20c997)' });
      const nW = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 5 : 4;
      const nZ = ctx.difficulty === 'hard' ? 4 : 3;
      const pics = ctx.difficulty !== 'hard';
      const submit = el('button', { class: 'btn go big', disabled: true }, '✅ Submit 送出');
      st.foot.append(submit);
      let cur = null; ctx.on(submit, 'click', () => cur && cur());
      L.rounds(ctx, ctx.items, (item, idx) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        st.head.append(L.say('🏥 同學來健康中心說話了！聽句子，填好紀錄單的兩格，再按「送出」。', 'Fill in both fields, then submit.'), L.listenBar(ctx, item));
        const words = wordOptions(item, nW), zhs = zhOptions(item, nZ);
        let w1 = -1, w2 = -1, answered = false;
        const mk = (label, onPick) => el('button', { class: 'l03a-opt', 'aria-pressed': 'false', onclick: onPick }, label);
        const wordBtns = words.map((w, i) => { const p = pics && EP.pic(w); const b = mk(null, () => choose1(i)); if (p) b.append(el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, p)); b.append(el('span', {}, w.word)); return b; });
        const zhBtns = zhs.map((w, i) => { const b = mk(null, () => choose2(i)); b.append(el('span', { class: 'zh' }, w.sentenceZh)); return b; });
        const patient = u.pick(['🧒', '👧', '👦']);
        const form = el('div', { class: 'l03a-form', role: 'group', 'aria-label': "Nurse's form 健康中心紀錄單" },
          el('div', { class: 'l03a-top' }, el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, patient, '🤒'),
            el('div', {}, el('span', {}, "Nurse's Form "), el('span', { class: 'zh' }, '健康中心紀錄單'), el('div', { class: 'l03a-sub zh' }, `Student ${idx + 1} · 第 ${idx + 1} 位同學`))),
          el('div', { class: 'l03a-field' }, el('div', { class: 'l03a-lab zh' }, '① 聽到哪個部位或症狀？ ', el('span', { class: 'ls-en' }, 'Body part / problem')), el('div', { class: 'l03a-row', role: 'group', 'aria-label': '① Body part / problem 部位或症狀' }, wordBtns)),
          el('div', { class: 'l03a-field' }, el('div', { class: 'l03a-lab zh' }, '② 他說了什麼？ ', el('span', { class: 'ls-en' }, 'What does it mean?')), el('div', { class: 'l03a-row zhs', role: 'group', 'aria-label': '② Meaning 中文意思' }, zhBtns)));
        st.body.append(form);
        const press = (btns, i) => btns.forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
        const upd = () => { submit.disabled = answered || w1 < 0 || w2 < 0; };
        const choose1 = (i) => { if (answered) return; w1 = i; press(wordBtns, i); sfx('pop'); upd(); };
        const choose2 = (i) => { if (answered) return; w2 = i; press(zhBtns, i); sfx('pop'); upd(); };
        const send = () => {
          if (answered || w1 < 0 || w2 < 0) return;
          answered = true; upd();
          const ok1 = words[w1] === item, ok2 = zhs[w2] === item, ok = ok1 && ok2;
          const mark = (btns, list, pickI) => btns.forEach((b, j) => { if (list[j] === item) { b.classList.add('right'); b.append(' ✔'); } else if (j === pickI) { b.classList.add('wrongpick'); b.append(' ✘'); } });
          mark(wordBtns, words, w1); mark(zhBtns, zhs, w2);
          form.append(el('div', { class: 'l03a-stamp ' + (ok ? 'ok' : 'bad'), 'aria-hidden': 'true' }, ok ? 'OK' : '?'));
          const wrongText = !ok1 && !ok2 ? 'Both fields are wrong 兩格都不對' : !ok1 ? 'Field ① is wrong 第①格不對' : 'Field ② is wrong 第②格不對';
          L.feedback(ctx, item, ok, Object.assign(at(ctx, form), { wrongText })).then(() => { cur = null; done(); });
        };
        cur = send;
        const r1 = words.indexOf(item), r2 = zhs.indexOf(item);
        T.set(() => { choose1(r1); choose2(r2); send(); }, () => { choose1(r1 === 0 ? 1 : 0); choose2(r2); send(); });
      }));
      return { test: T.api };
    },
  });

  /* ===================== L03b Word Drum (WORD_COUNT) ===================== */
  L.register({
    id: 'L03b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 30%,#ff922b,#d9480f 55%,#7a2a08)' });
      const undo = ctx.difficulty !== 'hard';
      const minus = el('button', { class: 'btn', 'aria-label': 'Take back one hit 少敲一下' }, '➖ 1');
      const reset = el('button', { class: 'btn' }, '🔄 Reset 重來');
      const fin = el('button', { class: 'btn go big', disabled: true }, '✅ Done 完成');
      if (undo) st.foot.append(minus);
      st.foot.append(reset, fin);
      let cur = null;
      ctx.on(minus, 'click', () => cur && cur.minus());
      ctx.on(reset, 'click', () => cur && cur.reset());
      ctx.on(fin, 'click', () => cur && cur.done());
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        st.head.append(L.say('🥁 聽句子，每聽到一個字就敲一下鼓，敲完按「完成」。（I\'m、don\'t 這種縮寫算一個字）', 'Hit the drum once for every word. I\'m / don\'t = 1 word.'), L.listenBar(ctx, item));
        const toks = L.tokens(item.sentence); const n = toks.length; // contractions are one token = one word
        if (ctx.difficulty === 'easy') st.body.append(el('div', { class: 'l03b-hint zh' }, '💡 意思：', item.sentenceZh));
        const drum = el('button', { class: 'l03b-drum', 'aria-label': 'Drum 鼓：hit 敲一下' }, el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '🥁'));
        const dots = el('div', { class: 'l03b-dots', 'aria-hidden': 'true' });
        const count = el('div', { class: 'l03b-count', 'aria-live': 'polite' }, '0 hits 下');
        const words = el('div', { class: 'l03b-words' });
        st.body.append(drum, count, dots, words);
        let hits = 0, answered = false;
        const paint = () => {
          dots.replaceChildren(...Array.from({ length: hits }, (_, i) => el('span', { class: 'l03b-dot' }, String(i + 1))));
          count.textContent = `${hits} ${hits === 1 ? 'hit' : 'hits'} 下`;
          fin.disabled = answered || hits === 0; minus.disabled = answered || hits === 0;
        };
        const hit = () => {
          if (answered || hits >= 20) return;
          hits++; sfx('tick');
          drum.classList.remove('l03b-hit'); void drum.offsetWidth; drum.classList.add('l03b-hit');
          ctx.timeout(() => drum.classList.remove('l03b-hit'), 120);
          const ring = el('span', { class: 'l03b-ring', 'aria-hidden': 'true' }); drum.append(ring); ctx.timeout(() => ring.remove(), 500);
          paint();
        };
        ctx.on(drum, 'click', hit);
        const finish = () => {
          if (answered || hits === 0) return;
          answered = true; paint();
          const ok = hits === n;
          words.replaceChildren(...toks.map((t, i) => el('span', { class: 'l03b-w', style: { animationDelay: i * 0.12 + 's' } }, el('b', {}, String(i + 1)), t.t)));
          L.feedback(ctx, item, ok, Object.assign(at(ctx, drum), { wrongText: `${n} words — you hit ${hits} 這句有 ${n} 個字，你敲了 ${hits} 下` })).then(() => { cur = null; done(); });
        };
        const resetFn = () => { if (!answered) { hits = 0; paint(); } };
        cur = { minus() { if (!answered && hits > 0) { hits--; paint(); } }, reset: resetFn, done: finish };
        paint();
        const play = (k) => { if (answered) return; resetFn(); for (let i = 0; i < k; i++) hit(); finish(); };
        T.set(() => play(n), () => play(n + 1));
      }));
      return { test: T.api };
    },
  });

  /* ===================== L03c Echo Twins (SAME_DIFF) ===================== */
  /** how close two sentences are: shared words count, different length costs */
  const closeness = (a, b) => {
    const A = L.tokens(a.sentence).map((t) => t.w), B = L.tokens(b.sentence).map((t) => t.w); const sb = new Set(B);
    return A.filter((x) => sb.has(x)).length * 2 - Math.abs(A.length - B.length) * 1.5;
  };
  function partnerFor(ctx, item) {
    let cands = ctx.pool.filter((w) => w !== item && u.norm(w.sentence) !== u.norm(item.sentence));
    if (cands.length < 3) cands = EP.levelWords(item.level).filter((w) => w !== item && u.norm(w.sentence) !== u.norm(item.sentence));
    cands = u.shuffle(cands).sort((a, b) => closeness(item, b) - closeness(item, a));
    const top = ctx.difficulty === 'hard' ? 2 : ctx.difficulty === 'easy' ? 8 : 4;
    return u.pick(cands.slice(0, Math.max(1, top)));
  }

  L.register({
    id: 'L03c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#4c6ef5,#9775fa 60%,#f783ac)' });
      const FACE = u.pick(['🧒', '👧', '👦']);
      const flags = u.shuffle(ctx.items.map((_, i) => i % 2 === 0)); // half the rounds are the same sentence
      const max = ctx.difficulty === 'hard' ? 3 : 99;
      L.rounds(ctx, ctx.items, (item, idx) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = ''; T.clear();
        const same = flags[idx]; const other = same ? item : partnerFor(ctx, item) || item;
        const isSame = other === item;
        const again = el('button', { class: 'btn blue big ls-play', 'aria-label': 'Play A then B again 再聽一次 A 和 B' }, '🔊 Again 再聽一次');
        const slow = el('button', { class: 'btn small ls-slow', 'aria-label': 'Play A then B slowly 慢速播放' }, '🐢 Slow 慢速');
        const tags = [srcTag(item)]; if (!isSame && EP.audio.source(other, 'sentence') !== EP.audio.source(item, 'sentence')) tags.push(srcTag(other));
        st.head.append(L.say('👯 雙胞胎輪流說一句話：先聽 A，再聽 B，兩句一樣還是不一樣？', 'Listen to A, then B. Same sentence or different?'), el('div', { class: 'ls-listen' }, again, slow, tags));
        const twin = (cls, name) => el('div', { class: 'l03c-twin ' + cls }, el('div', { class: 'l03c-bub', 'aria-hidden': 'true' }, '🔊'), el('span', { class: 'l03c-face', 'aria-hidden': 'true' }, FACE), el('div', { class: 'l03c-name' }, name));
        const A = twin('l03c-a', 'Twin A 雙胞胎 A'), B = twin('l03c-b', 'Twin B 雙胞胎 B');
        const sameBtn = el('button', { class: 'ls-choice', disabled: true }, el('span', { class: 'l03c-sym', 'aria-hidden': 'true' }, '＝'), el('span', {}, 'Same 一樣'));
        const diffBtn = el('button', { class: 'ls-choice', disabled: true }, el('span', { class: 'l03c-sym', 'aria-hidden': 'true' }, '≠'), el('span', {}, 'Different 不一樣'));
        st.body.append(el('div', { class: 'l03c-stage', role: 'group', 'aria-label': 'Twins 雙胞胎' }, A, B), el('div', { class: 'l03c-btns' }, sameBtn, diffBtn));
        let answered = false, seq = 0, plays = 0, ready = false;
        const talk = (who) => { A.classList.toggle('l03c-talk', who === A); B.classList.toggle('l03c-talk', who === B); };
        const open = () => {
          if (ready) return; ready = true; sameBtn.disabled = false; diffBtn.disabled = false;
          T.set(() => pick(isSame), () => pick(!isSame));
        };
        const playBoth = async (slowly) => {
          if (answered) return;
          if (plays >= max) { ctx.toast('Hard 模式最多聽 3 次'); return; }
          plays++; const my = ++seq;
          talk(A); await ctx.say(item, { sentence: true, slow: slowly });
          if (my !== seq || answered || ctx.ended) return;
          talk(null); A.classList.add('l03c-done'); await ctx.wait(450);
          if (my !== seq || answered || ctx.ended) return;
          talk(B); open(); await ctx.say(other, { sentence: true, slow: slowly });
          if (my !== seq || answered) return;
          talk(null); B.classList.add('l03c-done');
        };
        const pick = (saidSame) => {
          if (answered || !ready) return; answered = true; seq++; talk(null);
          sameBtn.disabled = true; diffBtn.disabled = true;
          const ok = saidSame === isSame; const btn = saidSame ? sameBtn : diffBtn;
          btn.classList.add(ok ? 'right' : 'wrongpick'); btn.append(ok ? ' ✔' : ' ✘');
          if (!ok) { const rb = saidSame ? diffBtn : sameBtn; rb.classList.add('right'); rb.append(' ✔'); }
          feedback(ok, at(ctx, btn)).then(done);
        };
        const feedback = async (ok, pos) => {
          ctx.answer(item, ok, pos);
          const row = (who, w) => el('div', { class: 'l03c-fb-row' }, el('div', { class: 'ls-fb-sent' }, who, ' ', w.sentence), el('div', { class: 'ls-fb-zh zh' }, w.sentenceZh));
          const card = el('div', { class: 'ls-feedback ' + (ok ? 'ok' : 'bad'), role: 'status' },
            el('div', { class: 'ls-fb-head' }, ok ? '✔ Correct! 答對了' : isSame ? '✘ They were the same 是同一句' : '✘ They were different 不一樣喔'),
            row('A:', item), isSame ? el('div', { class: 'ls-fb-zh zh' }, 'B: ＝ A') : row('B:', other));
          ctx.root.appendChild(card);
          if (ok) await ctx.wait(1300);
          else {
            await Promise.all([ctx.say(item, { sentence: true }), ctx.wait(900)]);
            if (!isSame && !ctx.ended) await Promise.all([ctx.say(other, { sentence: true }), ctx.wait(900)]);
            await ctx.wait(600);
          }
          card.remove();
        };
        ctx.on(sameBtn, 'click', () => pick(true));
        ctx.on(diffBtn, 'click', () => pick(false));
        ctx.on(again, 'click', () => playBoth(false));
        ctx.on(slow, 'click', () => playBoth(true));
        ctx.timeout(() => playBoth(false), 400);
      }));
      return { test: T.api };
    },
  });
})();
