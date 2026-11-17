/* Sentence Listening — Level 2 (Family · Pronouns · Articles): LINES, FUNCTION_WORD, WORD_ORDER
 * L02a Family Phone Lines — several phones each play one official sentence; connect each to the right picture.
 * L02b Pronoun Radar      — which little word (pronoun / possessive / article) is in the sentence?
 * L02c Sentence Train     — rebuild the heard sentence by tapping the word cars in order. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen, el = u.el;
  const NS = 'http://www.w3.org/2000/svg';
  /** centre-top of an element in stage coordinates (for floating score text) */
  const at = (ctx, node) => { const r = node.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top }; };
  const srcTag = (item) => (EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(item, 'sentence')) : null);
  const sfx = (n) => { try { EP.sfx && EP.sfx[n] && EP.sfx[n](); } catch (e) { /* sound is optional */ } };
  /** display form of a word card: lower case, except I / I'm */
  const show = (t) => (/^i('|$)/i.test(t) ? 'I' + t.slice(1) : t.toLowerCase());

  L.css('L02', `
.l02a-board{position:relative;display:grid;grid-template-columns:minmax(78px,.9fr) minmax(34px,.8fr) minmax(128px,1.5fr);width:100%;max-width:760px;padding:10px 14px;border-radius:22px;background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 3px rgba(255,255,255,.3)}
.l02a-col{display:flex;flex-direction:column;justify-content:space-around;gap:8px;position:relative;z-index:1}
.l02a-svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:visible}
.l02a-phone{display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:18px;background:#fff;color:#1d2340;font-weight:900;font-size:1.3rem;padding:6px 10px;min-height:clamp(50px,8vh,62px);box-shadow:0 5px 0 rgba(0,0,0,.22);border-left:10px solid var(--c);cursor:pointer;touch-action:none}
.l02a-phone .ls-emoji{font-size:clamp(1.7rem,5vw,2.3rem)}
.l02a-ring .ls-emoji{display:inline-block;animation:l02aRing .45s ease-in-out 2}
@keyframes l02aRing{0%,100%{transform:rotate(0)}25%{transform:rotate(-20deg)}75%{transform:rotate(20deg)}}
.l02a-on{outline:4px solid #ffd43b;outline-offset:2px}
.l02a-pic{position:relative;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2px 8px;border:0;border-radius:18px;background:#fff;color:#1d2340;font-weight:800;padding:4px 10px 4px 18px;min-height:clamp(48px,8vh,62px);box-shadow:0 5px 0 rgba(0,0,0,.22);cursor:pointer;text-align:center}
.l02a-pic .ls-emoji{font-size:clamp(1.6rem,5vw,2.2rem);white-space:nowrap}
.l02a-lab{font-size:.95rem;line-height:1.2}
.l02a-badge{position:absolute;left:-13px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:var(--c);color:#fff;font-weight:900;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff}
.l02a-pic.ls-over{outline:4px dashed #ffd43b;outline-offset:3px}
.l02a-mark{font-weight:900;font-size:1.25rem;margin-left:4px}
.l02a-mark.ok{color:#2b8a3e}.l02a-mark.bad{color:#c92a2a}
.l02a-fbrow{margin-top:6px}
.l02b-radar{position:relative;flex-shrink:0;width:min(84vw,44vh,400px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#0f4c38 0,#07301f 68%,#031a10 100%);box-shadow:0 0 0 6px #2f9e44,0 0 34px rgba(105,219,124,.45),inset 0 0 40px rgba(0,0,0,.6)}
.l02b-clip{position:absolute;inset:0;border-radius:50%;overflow:hidden;pointer-events:none}
.l02b-rings{position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 17%,rgba(105,219,124,.35) 17% calc(17% + 2px));pointer-events:none}
.l02b-cross{position:absolute;inset:0;border-radius:50%;background:linear-gradient(90deg,transparent calc(50% - 1px),rgba(105,219,124,.35) 50%,transparent calc(50% + 1px)),linear-gradient(0deg,transparent calc(50% - 1px),rgba(105,219,124,.35) 50%,transparent calc(50% + 1px));pointer-events:none}
.l02b-sweep{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(105,219,124,.6),rgba(105,219,124,0) 22%,transparent);animation:l02bSweep 2.6s linear infinite;pointer-events:none}
@keyframes l02bSweep{to{transform:rotate(360deg)}}
.l02b-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:clamp(1.8rem,6vw,2.4rem);pointer-events:none}
.l02b-blip{position:absolute;transform:translate(-50%,-50%);min-width:68px;min-height:54px;padding:6px 14px;border:0;border-radius:999px;background:#ebfbee;color:#0b3d2e;font-weight:900;font-size:clamp(1.1rem,4vw,1.45rem);box-shadow:0 0 0 3px #69db7c,0 5px 0 rgba(0,0,0,.35);cursor:pointer;animation:l02bPop .35s ease-out backwards;white-space:nowrap}
.l02b-blip:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l02b-blip.right{background:#2b8a3e;color:#fff;box-shadow:0 0 0 3px #fff}
.l02b-blip.wrongpick{background:#c92a2a;color:#fff;box-shadow:0 0 0 3px #fff}
.l02b-blip.dim{background:#ced4da;color:#343a40;box-shadow:none}
@keyframes l02bPop{from{transform:translate(-50%,-50%) scale(.3)}}
.l02b-hint{font-size:clamp(1.1rem,4vw,1.5rem)}
.l02c-track{position:relative;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;gap:16px 6px;width:100%;max-width:900px;min-height:100px;padding:12px 10px 20px;border-radius:20px;background:rgba(255,255,255,.22);border-bottom:8px solid #8d5524}
.l02c-engine{font-size:clamp(2.4rem,8vw,3.4rem);line-height:1}
.l02c-car,.l02c-slot{position:relative;min-width:62px;min-height:54px;padding:8px 12px 12px;border-radius:12px;font-weight:900;font-size:clamp(1.05rem,3.8vw,1.4rem);display:inline-flex;align-items:center;justify-content:center;gap:4px}
.l02c-car{border:0;background:var(--cc,#fff);color:#1d2340;box-shadow:0 4px 0 rgba(0,0,0,.3);cursor:pointer}
.l02c-car::before,.l02c-car::after{content:'';position:absolute;bottom:-10px;width:16px;height:16px;border-radius:50%;background:#343a40;box-shadow:inset 0 0 0 4px #868e96}
.l02c-car::before{left:10px}.l02c-car::after{right:10px}
.l02c-slot{border:3px dashed #1d2340;color:#1d2340;background:rgba(255,255,255,.55)}
.l02c-bank{display:flex;flex-wrap:wrap;justify-content:center;gap:18px 10px;max-width:760px;padding-bottom:10px}
.l02c-used{visibility:hidden}
.l02c-fixed{background:#e9ecef;cursor:default}
.l02c-good{background:#b2f2bb}
.l02c-bad{background:#ffc9c9;outline:3px solid #c92a2a}
.l02c-go{animation:l02cGo 1s ease-in forwards}
@keyframes l02cGo{to{transform:translateX(-110vw)}}
`);

  /* ===================== L02a Family Phone Lines (LINES) ===================== */
  /** what each level-2 sentence is about: [picture, Chinese label, group]. Two sentences of the same group never share a round. */
  const FAM = {
    24: ['👧💗', '善良的姐姐', 'sister'], 25: ['👦👦', '有一個兄弟', 'brother'], 26: ['👨📏', '高高的爸爸', 'father'],
    27: ['👩✨', '美麗的媽媽', 'mother'], 28: ['👨‍👩‍👧‍👦', '幸福的一家人', 'family'], 29: ['👩‍🍳', '在煮飯的媽媽', 'mother'],
    30: ['👴📖', '講故事的爺爺', 'grandpa'], 31: ['👨‍💼', '努力工作的爸爸', 'father'], 32: ['👵🍪', '烤餅乾的奶奶', 'grandma'],
    33: ['👧', '我的姐姐', 'sister'], 34: ['🧑‍🤝‍🧑', '你是我的朋友', 'friend'], 35: ['🐶', '一隻狗', 'dog'],
    36: ['👦', '我的哥哥', 'brother'], 37: ['😄', '開心的我', 'me'], 38: ['🧒🎒', '當學生的我', 'me'],
    39: ['👒', '你的帽子', 'hat'], 40: ['🧑‍🤝‍🧑', '我們是朋友', 'friend'], 41: ['⚽👫', '他們在玩', 'play'],
    42: ['🎒🔵', '藍色的包包', 'bag'], 43: ['🐱💤', '在睡覺的貓', 'cat'], 44: ['🚗', '我有一輛車', 'car'],
    45: ['👧🍎', '吃蘋果的她', 'apple'],
  };
  const famOf = (w) => { const f = FAM[w.id]; return f ? { pic: f[0], zh: f[1], g: f[2] } : { pic: EP.pic(w) || '💬', zh: w.zh, g: 'w' + w.id }; };
  const PHONE_C = ['#c2410c', '#1d4ed8', '#15803d', '#7e22ce'];

  /** split items into rounds of ≤ k, never two items of the same group in one round */
  function chunk(items, k, groupOf) {
    const n = Math.max(1, Math.ceil(items.length / k));
    const caps = Array.from({ length: n }, (_, i) => Math.floor(items.length / n) + (i < items.length % n ? 1 : 0));
    const chunks = caps.map(() => []);
    const cnt = {}; items.forEach((w) => { const g = groupOf(w); cnt[g] = (cnt[g] || 0) + 1; });
    const order = u.shuffle(items).sort((a, b) => cnt[groupOf(b)] - cnt[groupOf(a)]);
    order.forEach((w) => {
      const g = groupOf(w); let best = -1;
      chunks.forEach((c, i) => { if (c.length < caps[i] && !c.some((x) => groupOf(x) === g) && (best < 0 || caps[i] - c.length > caps[best] - chunks[best].length)) best = i; });
      if (best < 0) { chunks.push([w]); caps.push(k); } else chunks[best].push(w);
    });
    return u.shuffle(chunks.filter((c) => c.length)).map((c) => u.shuffle(c));
  }

  /** answers + one feedback card for a multi-item round */
  async function multiFeedback(ctx, res, label) {
    res.forEach((r) => ctx.answer(r.item, r.ok, { x: r.x, y: r.y, silent: true }));
    const bad = res.filter((r) => !r.ok);
    sfx(bad.length ? 'wrong' : 'correct');
    const card = el('div', { class: 'ls-feedback ' + (bad.length ? 'bad' : 'ok'), role: 'status' },
      el('div', { class: 'ls-fb-head' }, bad.length ? `✘ ${res.length - bad.length} / ${res.length} 對 · Listen again 再聽一次` : '✔ All correct! 全部接對了'),
      bad.map((r) => el('div', { class: 'l02a-fbrow' }, el('div', { class: 'ls-fb-sent' }, label(r.item), ' ', r.item.sentence), el('div', { class: 'ls-fb-zh zh' }, r.item.sentenceZh))));
    ctx.root.appendChild(card);
    if (!bad.length) await ctx.wait(950);
    else { for (const r of bad) { if (ctx.ended) break; await Promise.all([ctx.say(r.item, { sentence: true }), ctx.wait(1000)]); } await ctx.wait(700); }
    card.remove();
  }

  L.register({
    id: 'L02a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#862e9c,#d6336c)' });
      const k = ctx.difficulty === 'easy' ? 3 : 4;
      const extra = ctx.difficulty === 'easy' ? 0 : ctx.difficulty === 'hard' ? 2 : 1;
      const showLab = ctx.difficulty !== 'hard';
      const rounds = chunk(ctx.items, k, (w) => famOf(w).g);
      const submit = el('button', { class: 'btn go big', disabled: true }, '📨 Submit 送出');
      st.foot.append(submit);
      let cur = null; // the running round's handlers
      ctx.on(submit, 'click', () => cur && cur.submit());
      ctx.on(window, 'pointermove', (e) => cur && cur.move(e));
      ctx.on(window, 'pointerup', (e) => cur && cur.up(e));
      ctx.on(window, 'resize', () => cur && cur.draw());

      const playRound = (group) => new Promise((resolve) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        const slowBtn = el('button', { class: 'btn small ls-slow', 'aria-label': 'Play the selected phone slowly 慢速播放選到的電話' }, '🐢 Slow 慢速');
        const tagBox = el('span', {}, srcTag(group[0]));
        st.head.append(L.say('☎️ 點電話聽句子，再點（或拖曳到）對的圖片；全部接好按「送出」。', 'Tap a phone to listen, then tap or drag to the right picture.'), el('div', { class: 'ls-listen' }, slowBtn, tagBox));
        // pictures: one per call + extra pictures from other sentences (never the same group)
        const used = new Set(group.map((w) => famOf(w).g));
        const extras = u.shuffle(ctx.pool.filter((w) => !group.includes(w))).filter((w) => { const g = famOf(w).g; if (used.has(g)) return false; used.add(g); return true; });
        const picItems = u.shuffle(group.concat(extras.slice(0, Math.max(extra, 3 - group.length))));
        const board = el('div', { class: 'l02a-board', role: 'group', 'aria-label': 'Phone lines 電話線' });
        const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'l02a-svg'); svg.setAttribute('aria-hidden', 'true');
        const colP = el('div', { class: 'l02a-col' }), colQ = el('div', { class: 'l02a-col' });
        board.append(svg, colP, el('div', { 'aria-hidden': 'true' }), colQ); st.body.append(board);
        const plays = group.map(() => 0);
        const phones = group.map((w, i) => {
          const b = el('button', { class: 'l02a-phone', 'aria-pressed': 'false', 'aria-label': `Phone ${i + 1} 電話 ${i + 1}：play 播放句子` }, el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '☎️'), el('span', { 'aria-hidden': 'true' }, String(i + 1)));
          b.style.setProperty('--c', PHONE_C[i]); colP.append(b); return b;
        });
        const pics = picItems.map((w) => {
          const f = famOf(w);
          const b = el('button', { class: 'l02a-pic', 'aria-label': f.zh }, el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, f.pic), showLab ? el('span', { class: 'l02a-lab zh', 'aria-hidden': 'true' }, f.zh) : null);
          colQ.append(b); return b;
        });
        let sel = -1, answered = false, drag = null, dragMoved = false, temp = null, final = null;
        const link = new Map(); // phone index -> picture index

        const play = (i, slow) => {
          if (ctx.difficulty === 'hard' && plays[i] >= 3) { ctx.toast('Hard 模式每支電話最多聽 3 次'); return; }
          plays[i]++;
          const p = phones[i]; p.classList.remove('l02a-ring'); void p.offsetWidth; p.classList.add('l02a-ring');
          tagBox.replaceChildren(); const tg = srcTag(group[i]); if (tg) tagBox.append(tg);
          ctx.say(group[i], { sentence: true, slow });
        };
        const select = (i) => { sel = i; phones.forEach((p, j) => { p.classList.toggle('l02a-on', j === i); p.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); };
        const anchor = (node, side) => { const r = node.getBoundingClientRect(), br = board.getBoundingClientRect(); return { x: (side === 'r' ? r.right : r.left) - br.left, y: r.top + r.height / 2 - br.top }; };
        const path = (a, b, color, dash, w) => {
          const p = document.createElementNS(NS, 'path'); const mx = (a.x + b.x) / 2;
          p.setAttribute('d', `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`);
          p.setAttribute('stroke', color); p.setAttribute('stroke-width', w); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round');
          if (dash) p.setAttribute('stroke-dasharray', dash);
          svg.append(p);
          const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', b.x); c.setAttribute('cy', b.y); c.setAttribute('r', w); c.setAttribute('fill', color); svg.append(c);
        };
        const draw = () => {
          if (!board.isConnected) return;
          svg.replaceChildren();
          const br = board.getBoundingClientRect(); svg.setAttribute('viewBox', `0 0 ${Math.max(1, br.width)} ${Math.max(1, br.height)}`);
          if (final) group.forEach((w, i) => { if (!final[i]) path(anchor(phones[i], 'r'), anchor(pics[picItems.indexOf(w)], 'l'), '#ffffff', '2 10', 5); });
          for (const [i, j] of link) { const ok = final ? final[i] : null; path(anchor(phones[i], 'r'), anchor(pics[j], 'l'), ok == null ? PHONE_C[i] : ok ? '#2b8a3e' : '#c92a2a', ok === false ? '12 9' : null, 7); }
          if (temp) path(anchor(phones[temp.i], 'r'), { x: temp.x, y: temp.y }, PHONE_C[temp.i], '4 9', 5);
        };
        const refresh = () => {
          pics.forEach((b, j) => {
            const old = b.querySelector('.l02a-badge'); if (old) old.remove();
            const p = Array.from(link).find(([, q]) => q === j);
            if (p) { const bd = el('span', { class: 'l02a-badge', 'aria-hidden': 'true' }, String(p[0] + 1)); bd.style.setProperty('--c', PHONE_C[p[0]]); b.append(bd); }
            b.setAttribute('aria-label', famOf(picItems[j]).zh + (p ? `（接到電話 ${p[0] + 1} connected to phone ${p[0] + 1}）` : ''));
          });
          submit.disabled = answered || link.size < group.length;
        };
        const connect = (i, j) => {
          if (answered || i < 0 || j < 0) return;
          for (const [p, q] of Array.from(link)) if (q === j && p !== i) link.delete(p);
          link.set(i, j); select(-1); sfx('pop'); refresh(); draw();
        };
        const pickPic = (j) => { if (answered) return; if (sel >= 0) connect(sel, j); else ctx.toast('先點一支電話 Tap a phone first'); };
        phones.forEach((b, i) => {
          ctx.on(b, 'click', () => { if (answered) return; if (dragMoved) { dragMoved = false; return; } select(i); play(i); });
          ctx.on(b, 'pointerdown', (e) => { if (!answered) { drag = { i, x: e.clientX, y: e.clientY }; dragMoved = false; } });
        });
        pics.forEach((b, j) => ctx.on(b, 'click', () => pickPic(j)));
        ctx.on(slowBtn, 'click', () => { if (!answered) play(sel >= 0 ? sel : 0, true); });
        const picAt = (x, y) => { const t = document.elementFromPoint(x, y); return pics.findIndex((p) => p === t || (t && p.contains(t))); };

        const submitFn = () => {
          if (answered || link.size < group.length) return;
          answered = true; submit.disabled = true; select(-1);
          final = group.map((w, i) => picItems[link.get(i)] === w);
          draw();
          phones.forEach((b, i) => b.append(el('span', { class: 'l02a-mark ' + (final[i] ? 'ok' : 'bad') }, final[i] ? '✔' : '✘')));
          const res = group.map((w, i) => Object.assign({ item: w, ok: final[i] }, at(ctx, phones[i])));
          multiFeedback(ctx, res, (w) => `☎️${group.indexOf(w) + 1} → ${famOf(w).pic}`).then(() => { cur = null; resolve(); });
        };
        cur = {
          submit: submitFn, draw,
          move(e) {
            if (!drag) return;
            if (!dragMoved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) { dragMoved = true; select(drag.i); }
            if (!dragMoved) return;
            const br = board.getBoundingClientRect(); temp = { i: drag.i, x: e.clientX - br.left, y: e.clientY - br.top };
            const j = picAt(e.clientX, e.clientY); pics.forEach((p, q) => p.classList.toggle('ls-over', q === j));
            draw();
          },
          up(e) {
            if (!drag) return; const d = drag; drag = null;
            if (dragMoved) { const j = picAt(e.clientX, e.clientY); temp = null; pics.forEach((p) => p.classList.remove('ls-over')); if (j >= 0) connect(d.i, j); else draw(); ctx.timeout(() => (dragMoved = false), 0); }
          },
        };
        refresh(); ctx.timeout(draw, 60);
        ctx.timeout(() => { if (!answered && sel < 0 && !link.size) { select(0); play(0); } }, 450);
        const rightPic = (i) => picItems.indexOf(group[i]);
        T.set(() => { group.forEach((w, i) => connect(i, rightPic(i))); submitFn(); },
          () => { group.forEach((w, i) => connect(i, group.length > 1 ? rightPic((i + 1) % group.length) : picItems.findIndex((x) => x !== group[i]))); submitFn(); });
      });

      (async () => {
        let n = 0;
        for (const group of rounds) {
          if (ctx.ended) return;
          ctx.hud.progress(n / ctx.items.length);
          await playRound(group);
          n += group.length;
        }
        ctx.hud.progress(1);
        if (!ctx.ended) ctx.end();
      })();
      return { test: T.api };
    },
  });

  /* ===================== L02b Pronoun Radar (FUNCTION_WORD) ===================== */
  const FW = { subj: ['I', 'you', 'he', 'she', 'it', 'we', 'they'], poss: ['my', 'your', 'his', 'her', 'our', 'their'], art: ['a', 'an', 'the', 'this', 'that'] };
  const FW_G = {}; Object.keys(FW).forEach((g) => FW[g].forEach((x) => (FW_G[x.toLowerCase()] = g)));
  const fwOf = (w) => FW_G[w] || (w.includes("'") ? FW_G[w.split("'")[0]] : null); // I'm → subj

  /** the radar question for one sentence: {target, options, index (token), fallback} */
  function radarTask(ctx, item, n) {
    const toks = L.tokens(item.sentence);
    const present = new Set(); toks.forEach((t) => { present.add(t.w); if (t.w.includes("'")) present.add(t.w.split("'")[0]); });
    const isIn = (x) => present.has(x.toLowerCase());
    const fws = toks.map((t, i) => ({ t, i })).filter((x) => fwOf(x.t.w));
    if (fws.length) {
      const own = fws.find((x) => x.t.w === item.word.toLowerCase());
      const tg = own || u.pick(fws); const g = fwOf(tg.t.w);
      const same = u.shuffle(FW[g].filter((x) => !isIn(x)));
      const other = u.shuffle(Object.keys(FW).filter((k) => k !== g).reduce((a, k) => a.concat(FW[k]), []).filter((x) => !isIn(x)));
      const target = show(tg.t.t);
      return { target, index: tg.i, fallback: false, options: u.shuffle([target].concat(same.concat(other).slice(0, n - 1).map(show))) };
    }
    // no pronoun / article in this sentence (e.g. "Grandpa tells stories."): find the key word instead
    const k = L.key(item); const ti = k ? k.index : Math.max(0, toks.findIndex((t) => t.w.length > 3));
    const target = show(toks[ti].t);
    const lv = EP.levelWords(item.level).filter((w) => w !== item);
    const cands = []; const add = (w) => { const kt = show(L.keyText(w).split(/\s+/)[0]); if (!isIn(kt) && kt !== target && !cands.includes(kt) && !fwOf(kt.toLowerCase())) cands.push(kt); };
    u.shuffle(lv.filter((w) => w.pos === item.pos)).forEach(add); u.shuffle(lv.filter((w) => w.pos !== item.pos)).forEach(add);
    return { target, index: ti, fallback: true, options: u.shuffle([target].concat(cands.slice(0, n - 1))) };
  }
  /** the sentence with one word replaced by a blank (easy hint) */
  function blanked(sentence, index) {
    const raws = String(sentence).split(/\s+/).filter((r) => r.replace(/[^A-Za-z0-9']/g, ''));
    const box = el('div', { class: 'ls-sentence l02b-hint' });
    raws.forEach((raw, i) => {
      if (i) box.append(' ');
      if (i !== index) { box.append(raw); return; }
      const m = raw.match(/^([^A-Za-z0-9']*)(.*?)([^A-Za-z0-9']*)$/);
      box.append(m[1], el('span', { class: 'ls-blank', role: 'img', 'aria-label': 'blank 空格' }, ' '), m[3]);
    });
    return box;
  }

  L.register({
    id: 'L02b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 40%,#0b7285,#073b4c 70%,#021c24)' });
      const n = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 5 : 4;
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        const task = radarTask(ctx, item, n);
        st.head.append(task.fallback
          ? L.say('📡 這句沒有代名詞或冠詞！雷達改找：你聽到哪一個字？', 'No pronoun or article here — which word do you hear?')
          : L.say('📡 雷達收到一句話：點出你聽到的那個小字（代名詞、所有格或冠詞）。', 'Tap the little word you hear (I, he, my, a, the…).'), L.listenBar(ctx, item));
        if (ctx.difficulty === 'easy') st.body.append(blanked(item.sentence, task.index));
        const radar = el('div', { class: 'l02b-radar', role: 'group', 'aria-label': 'Radar 雷達' },
          el('div', { class: 'l02b-clip', 'aria-hidden': 'true' }, el('div', { class: 'l02b-rings' }), el('div', { class: 'l02b-cross' }), el('div', { class: 'l02b-sweep' })),
          el('div', { class: 'l02b-center', 'aria-hidden': 'true' }, '📡'));
        st.body.append(radar);
        let answered = false;
        const off = u.rand(-15, 15);
        const blips = task.options.map((o, i) => {
          const a = (-90 + off + (360 / task.options.length) * i + u.rand(-6, 6)) * Math.PI / 180;
          const b = el('button', { class: 'l02b-blip', style: { left: 50 + 35 * Math.cos(a) + '%', top: 50 + 35 * Math.sin(a) + '%', animationDelay: i * 0.08 + 's' } }, o);
          ctx.on(b, 'click', () => pick(i)); radar.append(b); return b;
        });
        const pick = (i) => {
          if (answered) return; answered = true;
          const ok = task.options[i] === task.target;
          blips.forEach((b, j) => { b.classList.add(task.options[j] === task.target ? 'right' : j === i ? 'wrongpick' : 'dim'); if (j === i || task.options[j] === task.target) b.append(task.options[j] === task.target ? ' ✔' : ' ✘'); });
          L.feedback(ctx, item, ok, Object.assign(at(ctx, blips[i]), { wrongText: `It was “${task.target}” 答案是 ${task.target}` })).then(done);
        };
        const right = task.options.indexOf(task.target);
        T.set(() => pick(right), () => pick(right === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });

  /* ===================== L02c Sentence Train (WORD_ORDER) ===================== */
  const CAR_C = ['#fff3bf', '#d0ebff', '#d3f9d8', '#ffe3e3', '#e5dbff', '#ffe8cc', '#c3fae8'];

  L.register({
    id: 'L02c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#4dabf7 0%,#a5d8ff 58%,#8ce99a 58%,#40c057 100%)' });
      const clearBtn = el('button', { class: 'btn' }, '↩️ Clear 清除');
      const goBtn = el('button', { class: 'btn go big', disabled: true }, '🚂 Go! 出發');
      st.foot.append(clearBtn, goBtn);
      let cur = null;
      ctx.on(goBtn, 'click', () => cur && cur.go());
      ctx.on(clearBtn, 'click', () => cur && cur.clear());
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        st.head.append(L.say('🚂 聽句子，照聽到的順序點字卡，把車廂接成句子，再按「出發」。點火車上的車廂可以拿回來。', 'Tap the word cars in the order you hear them.'), L.listenBar(ctx, item));
        const toks = L.tokens(item.sentence).map((t, i) => ({ t: i === 0 ? show(t.t) : t.t, w: t.w }));
        const fixed = ctx.difficulty === 'easy' && toks.length >= 4 ? 1 : 0; // easy: the first car is already on the train
        const want = toks.slice(fixed).map((t) => t.w);
        const cars = toks.slice(fixed).map((t) => ({ t: t.t, w: t.w }));
        if (ctx.difficulty === 'hard') { // hard: one extra car from another sentence of this level
          const have = new Set(toks.map((t) => t.w));
          const words = u.shuffle(ctx.pool.filter((w) => w !== item).reduce((a, w) => a.concat(L.tokens(w.sentence)), []));
          const x = words.find((t) => !have.has(t.w));
          if (x) cars.push({ t: show(x.t), w: x.w, extra: true });
        }
        let bank = u.shuffle(cars);
        for (let k = 0; k < 8 && cars.length > 1 && bank.filter((c) => !c.extra).map((c) => c.w).join(' ') === want.join(' '); k++) bank = u.shuffle(cars);
        const track = el('div', { class: 'l02c-track', role: 'group', 'aria-label': 'Train 火車' });
        const bankEl = el('div', { class: 'l02c-bank', role: 'group', 'aria-label': 'Word cars 字卡車廂' });
        st.body.append(track, bankEl);
        const placed = []; const btnOf = new Map(); let answered = false;
        bank.forEach((c, i) => {
          c.color = CAR_C[i % CAR_C.length];
          const b = el('button', { class: 'l02c-car' }, c.t); b.style.setProperty('--cc', c.color);
          btnOf.set(c, b); bankEl.append(b); ctx.on(b, 'click', () => add(c));
        });
        const render = () => {
          track.replaceChildren(el('span', { class: 'l02c-engine', 'aria-hidden': 'true' }, '🚂'));
          if (fixed) track.append(el('span', { class: 'l02c-car l02c-fixed' }, toks[0].t));
          placed.forEach((c, i) => {
            const b = el('button', { class: 'l02c-car', 'aria-label': `${c.t}（第 ${fixed + i + 1} 節，點一下拿回來 tap to take back）` }, c.t); b.style.setProperty('--cc', c.color);
            ctx.on(b, 'click', () => removeAt(i)); track.append(b); c.el = b;
          });
          for (let i = fixed + placed.length; i < toks.length; i++) track.append(el('span', { class: 'l02c-slot', 'aria-hidden': 'true' }, String(i + 1)));
          btnOf.forEach((b, c) => { const used = placed.includes(c); b.classList.toggle('l02c-used', used); b.disabled = used; });
          goBtn.disabled = answered || fixed + placed.length !== toks.length;
        };
        const add = (c) => {
          if (answered || !c || placed.includes(c)) return;
          if (fixed + placed.length >= toks.length) { ctx.toast('火車滿了，先拿回一節 Train is full'); return; }
          placed.push(c); sfx('pop'); render();
        };
        const removeAt = (i) => { if (answered) return; placed.splice(i, 1); render(); };
        const clear = () => { if (answered) return; placed.length = 0; render(); };
        const go = () => {
          if (answered || fixed + placed.length !== toks.length) return;
          answered = true; goBtn.disabled = true;
          const ok = placed.every((c, i) => c.w === want[i]);
          placed.forEach((c, i) => { const good = c.w === want[i]; c.el.classList.add(good ? 'l02c-good' : 'l02c-bad'); c.el.append(good ? ' ✔' : ' ✘'); });
          if (ok) { track.classList.add('l02c-go'); sfx('whoosh'); }
          L.feedback(ctx, item, ok, Object.assign(at(ctx, track), { wrongText: 'Wrong order 順序不對' })).then(() => { cur = null; done(); });
        };
        cur = { go, clear };
        render();
        const order = () => { const used = []; return want.map((w) => { const c = cars.find((x) => x.w === w && !x.extra && !used.includes(x)); used.push(c); return c; }); };
        T.set(() => { clear(); order().forEach(add); go(); },
          () => {
            clear(); const o = order();
            const j = o.findIndex((c) => c.w !== o[0].w);
            if (j > 0) { const t = o[0]; o[0] = o[j]; o[j] = t; } else { const x = cars.find((c) => c.extra); if (x) o[0] = x; }
            o.forEach(add); go();
          });
      }));
      return { test: T.api };
    },
  });
})();
