/* Sentence Listening — Level 10 (Adjectives 形容詞 2 · Feelings): SPOT_WRONG_WORD, ODD_ONE_OUT, MOOD_METER
 * Only the official example sentences are played; changed subtitles, balloons and faces are text/pictures only. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (this level only) ---------- */
  const posOf = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const FUNC = new Set(['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'that', 'this', 'my', 'your', 'our', 'up', 'to', "let's", 'go', 'getting', 'and', 'of', 'on', 'in', 'at']);
  const DET = new Set(['the', 'that', 'a', 'an', 'this', 'my']);
  const levelOf = (ctx, item) => { const seen = new Set(); return ctx.pool.concat(EP.levelWords(item.level)).filter((w) => (seen.has(w.id) ? false : seen.add(w.id))); };
  const keyIdx = (item) => { const k = L.key(item); return k ? new Set(Array.from({ length: k.words }, (_, i) => k.index + i)) : new Set(); };
  /** nouns of a sentence = content words right after the/that/a (e.g. "The ground is wet." → ground) */
  const nounsOf = (item) => { const t = L.tokens(item.sentence); const kk = keyIdx(item); return t.filter((x, i) => i > 0 && !kk.has(i) && !FUNC.has(x.w) && DET.has(t[i - 1].w)).map((x) => x.w); };
  /** other words of the level (not in this sentence): adjectives (key words) and nouns */
  const otherWords = (ctx, item) => {
    const inS = new Set(L.tokens(item.sentence).map((t) => t.w)); const adj = new Set(), noun = new Set();
    levelOf(ctx, item).forEach((w) => {
      if (w === item) return;
      const k = L.key(w); if (k && k.words === 1) { const a = k.text; if (!inS.has(a.toLowerCase())) adj.add(/^[A-Z]{2,}$/.test(a) ? a : a.toLowerCase()); }
      nounsOf(w).forEach((n) => { if (!inS.has(n)) noun.add(n); });
    });
    return { adj: Array.from(adj), noun: Array.from(noun) };
  };
  /** other small changes a subtitle could have (normal / hard): he ↔ she, we → they, Mom → Dad … */
  const ALT = { he: 'she', she: 'he', we: 'they', they: 'we', mom: 'dad', everything: 'nothing', wake: 'get', go: 'eat', you: 'we' };
  /** how a word is written on a balloon/subtitle: lower case except I and OK */
  const show = (t) => (t === 'I' || /^[A-Z]{2,}$/.test(t) ? t : t.toLowerCase());

  L.css('L10', `
.l10a-tv{position:relative;width:min(860px,100%);background:#212529;border-radius:26px;padding:clamp(10px,2.4vw,18px);box-shadow:0 10px 0 #000,0 0 0 4px #495057 inset}
.l10a-screen{position:relative;border-radius:16px;min-height:clamp(150px,30vh,250px);background:radial-gradient(circle at 30% 30%,#364fc7,#1b2a6b 60%,#0b1033);display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:clamp(10px,2vw,16px);overflow:hidden}
.l10a-deco{position:absolute;top:10px;left:14px;right:14px;display:flex;justify-content:space-between;font-weight:900;color:#ffd43b;font-size:.95rem}
.l10a-deco .l10a-rec{color:#ff8787}
.l10a-spy{position:absolute;top:34%;left:50%;transform:translate(-50%,-50%);font-size:clamp(2.6rem,9vw,4rem);line-height:1;animation:l10a-scan 3s ease-in-out infinite alternate}
@keyframes l10a-scan{from{transform:translate(-90%,-50%)}to{transform:translate(-10%,-50%)}}
.l10a-sub{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(6px,1.4vw,10px);padding-top:28px}
.l10a-w{position:relative;border:0;border-radius:12px;background:#000;color:#ffd43b;font-weight:900;font-size:clamp(1.35rem,4.6vw,2rem);padding:6px 12px;min-height:52px;display:inline-flex;align-items:center;box-shadow:0 0 0 2px #ffd43b55}
button.l10a-w{cursor:pointer;box-shadow:0 0 0 2px #ffd43b,0 4px 0 #ffd43b88}
button.l10a-w:hover{background:#343a40}
button.l10a-w:focus-visible{outline:4px solid #fff;outline-offset:3px}
.l10a-off{color:#ced4da;background:#343a40;box-shadow:none}
.l10a-caught{background:#c92a2a;color:#fff;text-decoration:line-through;text-decoration-thickness:3px}
.l10a-fine{background:#2b8a3e;color:#fff}
.l10a-fix{position:absolute;left:50%;bottom:100%;transform:translate(-50%,-6px);background:#d3f9d8;color:#1b4d24;border-radius:10px;padding:2px 10px;font-size:1rem;white-space:nowrap;box-shadow:0 3px 0 rgba(0,0,0,.25);text-decoration:none}
.l10a-score{background:#fff;color:#1d2340;border-radius:999px;padding:6px 14px;font-weight:900;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.l10b-sky{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:48px clamp(10px,3vw,26px);width:min(900px,100%);padding:10px 0 40px}
.l10b-bal{position:relative;width:clamp(96px,29vw,150px);aspect-ratio:5/6;border:0;border-radius:50% 50% 46% 46%/56% 56% 44% 44%;color:#1d2340;font-weight:900;font-size:clamp(1rem,3.6vw,1.5rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:6px;box-shadow:inset -10px -12px 0 rgba(0,0,0,.08),inset 10px 10px 0 rgba(255,255,255,.35),0 6px 10px rgba(0,0,0,.18);animation:l10b-bob 2.6s ease-in-out infinite alternate;overflow-wrap:anywhere}
.l10b-bal:nth-child(2){animation-delay:-.7s}.l10b-bal:nth-child(3){animation-delay:-1.4s}.l10b-bal:nth-child(4){animation-delay:-2s}.l10b-bal:nth-child(5){animation-delay:-1s}
.l10b-bal::before{content:'';position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:10px solid var(--c)}
.l10b-bal::after{content:'';position:absolute;left:50%;top:100%;width:2px;height:34px;margin-top:8px;background:#868e96}
.l10b-bal:focus-visible{outline:4px solid #1d2340;outline-offset:4px}
@keyframes l10b-bob{from{transform:translateY(-6px)}to{transform:translateY(6px)}}
.l10b-pop{animation:l10b-pop .4s ease-in forwards}
@keyframes l10b-pop{40%{transform:scale(1.3)}100%{transform:scale(0)}}
.l10b-boom{position:absolute;font-size:3rem;transform:translate(-50%,-50%);pointer-events:none;z-index:30}
.l10b-in{animation:l10b-boing .5s ease-out;box-shadow:0 0 0 5px #2f9e44,0 6px 10px rgba(0,0,0,.18)}
.l10b-odd{box-shadow:0 0 0 6px #e03131,0 0 22px #e03131}
.l10b-tag{position:absolute;left:50%;top:-14px;transform:translateX(-50%);background:#fff;color:#1b4d24;border-radius:10px;padding:1px 8px;font-size:.8rem;white-space:nowrap;box-shadow:0 2px 0 rgba(0,0,0,.2)}
@keyframes l10b-boing{30%{transform:scale(1.12,.9)}60%{transform:scale(.95,1.06)}}
.l10b-count{background:#fff;color:#1d2340;border-radius:999px;padding:6px 14px;font-weight:900;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.l10c-room{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(620px,100%)}
.l10c-kid{display:flex;align-items:center;gap:8px;background:#fff;color:#1d2340;border-radius:18px;padding:6px 14px;font-weight:800;box-shadow:0 3px 0 rgba(0,0,0,.18)}
.l10c-kid .l10c-av{font-size:2rem;line-height:1}
.l10c-meter{display:grid;grid-template-columns:44px 1fr;gap:12px;width:100%;background:#fff;border-radius:24px;padding:12px;box-shadow:0 8px 0 rgba(0,0,0,.18)}
.l10c-tube{position:relative;border-radius:22px;background:#f1f3f5;box-shadow:inset 0 0 0 3px #adb5bd;margin-bottom:22px}
.l10c-merc{position:absolute;left:9px;right:9px;bottom:0;height:8%;border-radius:12px;background:linear-gradient(#ff8787,#e03131);transition:height .6s cubic-bezier(.3,1.3,.5,1)}
.l10c-bulb{position:absolute;left:50%;bottom:-22px;transform:translateX(-50%);width:42px;height:42px;border-radius:50%;background:#e03131;box-shadow:inset 0 0 0 3px #a61e1e}
.l10c-ticks{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 18px,rgba(0,0,0,.18) 18px 20px);border-radius:22px;pointer-events:none}
.l10c-faces{display:flex;flex-direction:column;gap:8px}
.l10c-face{display:flex;align-items:center;gap:12px;min-height:clamp(52px,8.4vh,66px);border:3px solid #dee2e6;border-radius:16px;background:#f8f9fa;color:#1d2340;cursor:pointer;padding:4px 12px;text-align:left;font-weight:900}
.l10c-face:hover{background:#fff3bf}
.l10c-face:focus-visible{outline:4px solid #1971c2;outline-offset:2px}
.l10c-face .l10c-em{font-size:clamp(2rem,6vw,2.6rem);line-height:1}
.l10c-face .l10c-en{font-size:clamp(1.15rem,3.6vw,1.45rem)}
.l10c-face .zh{font-size:clamp(.95rem,3vw,1.1rem);color:#3d4470;font-weight:800}
.l10c-right{background:#d3f9d8;border-color:#2f9e44}
.l10c-right .l10c-em{animation:l10c-hop .5s ease-out 2}
.l10c-wrong{background:#ffe3e3;border-color:#e03131}
@keyframes l10c-hop{50%{transform:translateY(-8px) scale(1.15)}}
@media (prefers-reduced-motion:reduce){.l10a-spy,.l10b-bal,.l10c-right .l10c-em{animation:none!important}.l10c-merc{transition:none}}
`);

  /* ===== L10a Typo Detective — one word of the subtitle is different from the recording ===== */
  function makeTypo(ctx, item, d) {
    const t = L.tokens(item.sentence); const k = L.key(item); const kk = keyIdx(item);
    let units = t.map((x, i) => ({ raw: x.raw, t: x.t, w: x.w, i }));
    if (k && k.words > 1) { const span = units.splice(k.index, k.words); units.splice(k.index, 0, { raw: span.map((s) => s.raw).join(' '), t: span.map((s) => s.t).join(' '), w: span.map((s) => s.w).join(' '), i: k.index }); }
    units.forEach((x) => { x.key = kk.has(x.i); x.shown = x.raw; });
    const pool = otherWords(ctx, item);
    const fit = (x, r) => (x.i === 0 ? capFirst(r) : r);
    const ways = [];
    const keyU = units.find((x) => x.key);
    if (keyU && pool.adj.length) ways.push(() => [keyU, u.pick(pool.adj)]);
    const nounU = units.filter((x) => !x.key && !FUNC.has(x.w) && x.i > 0 && DET.has(t[x.i - 1].w));
    if (nounU.length && pool.noun.length) ways.push(() => { const x = u.pick(nounU); const pl = /s$/.test(x.w); const same = pool.noun.filter((n) => /s$/.test(n) === pl); return [x, u.pick(same.length ? same : pool.noun)]; });
    const alt = units.filter((x) => !x.key && ALT[x.w] && !units.some((y) => y.w === ALT[x.w]));
    if (d !== 'easy' && alt.length) ways.push(() => { const x = u.pick(alt); return [x, ALT[x.w]]; });
    let ci = -1;
    if (ways.length) {
      const [x, r] = u.pick(ways)();
      x.shown = x.raw.replace(x.t, fit(x, r)); x.orig = x.t; ci = units.indexOf(x);
    } else { // no usable word: change the last content word to another word of the level (never happens with the worksheet data)
      const x = units[units.length - 1]; x.orig = x.t; x.shown = x.raw.replace(x.t, fit(x, x.t === 'happy' ? 'sad' : 'happy')); ci = units.length - 1;
    }
    return { units, ci };
  }
  L.register({
    id: 'L10a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#343a40,#0b1033)' });
      const d = ctx.difficulty;
      const sub = u.el('div', { class: 'l10a-sub', role: 'group', 'aria-label': 'Subtitle 字幕' });
      const tv = u.el('div', { class: 'l10a-tv' }, u.el('div', { class: 'l10a-screen' },
        u.el('div', { class: 'l10a-deco', 'aria-hidden': 'true' }, u.el('span', {}, '🎬 SUBTITLE CHECK'), u.el('span', { class: 'l10a-rec' }, '● REC')),
        u.el('div', { class: 'l10a-spy', 'aria-hidden': 'true' }, '🕵️🔍'), sub));
      let solved = 0; const score = u.el('span', { class: 'l10a-score', role: 'status' });
      const showScore = () => { score.textContent = `🕵️ Cases solved 破案: ${solved}`; };
      showScore(); st.body.append(tv); st.foot.append(score);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say(d === 'easy' ? '🔍 字幕有一個字打錯了！聽句子，在發亮的可疑字裡點出錯的那一個。' : '🔍 字幕有一個字打錯了！聽句子，點出和錄音不一樣的那個字。', 'Tap the word in the subtitle that is different.'), bar);
        ctx.timeout(() => bar.play(d === 'easy'), 350); // easy: first play is slow
        const { units, ci } = makeTypo(ctx, item, d);
        // easy: only 3 suspects light up (the changed word + 2 others)
        const suspects = new Set(d === 'easy' ? [ci].concat(u.shuffle(units.map((_, j) => j).filter((j) => j !== ci)).slice(0, 2)) : units.map((_, j) => j));
        sub.innerHTML = '';
        let answered = false;
        const pick = (j) => {
          if (answered) return; answered = true; T.clear();
          const ok = j === ci; const b = els[ci];
          b.classList.add('l10a-caught'); b.appendChild(u.el('span', { class: 'l10a-fix' }, '✔ ' + units[ci].orig));
          if (!ok) els[j].classList.add('l10a-fine'); else { solved++; showScore(); }
          L.feedback(ctx, item, ok, Object.assign(posOf(ctx, els[j]), { wrongText: `"${units[j].t}" is right 這個字沒錯` })).then(done);
        };
        const els = units.map((x, j) => {
          if (!suspects.has(j)) return u.el('span', { class: 'l10a-w l10a-off' }, x.shown);
          const b = u.el('button', { class: 'l10a-w' }, x.shown); ctx.on(b, 'click', () => pick(j)); return b;
        });
        sub.append(...els);
        const other = Array.from(suspects).find((j) => j !== ci);
        T.set(() => pick(ci), () => pick(other));
      }));
      return { test: T.api };
    },
  });

  /* ===== L10b Odd Balloon Out — pop the balloon whose word is NOT in the sentence ===== */
  const BAL = ['#ffa8a8', '#ffd43b', '#8ce99a', '#74c0fc', '#d0bfff', '#ffc078'];
  L.register({
    id: 'L10b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(#a5d8ff 0%,#e7f5ff 70%,#b2f2bb 100%)' });
      const d = ctx.difficulty; const nIn = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
      const sky = u.el('div', { class: 'l10b-sky', role: 'group', 'aria-label': 'Balloons 氣球' });
      let popped = 0; const count = u.el('span', { class: 'l10b-count', role: 'status' });
      const showCount = () => { count.textContent = `🎈 Popped 戳破: ${popped}`; };
      showCount(); st.body.append(sky); st.foot.append(count);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎈 聽句子，戳破「句子裡沒有」的那個字的氣球！', 'Pop the balloon with the word that is NOT in the sentence.'), L.listenBar(ctx, item));
        const toks = L.tokens(item.sentence); const kk = keyIdx(item); const seen = new Set(); const uniq = [];
        toks.forEach((x, i) => { if (!seen.has(x.w)) { seen.add(x.w); uniq.push({ t: x.t, w: x.w, key: kk.has(i), func: FUNC.has(x.w) }); } });
        // words in the sentence: the key word first, then content words, then the rest
        const order = uniq.filter((x) => x.key).concat(u.shuffle(uniq.filter((x) => !x.key && !x.func)), u.shuffle(uniq.filter((x) => !x.key && x.func)));
        const ins = order.slice(0, Math.min(nIn, order.length)).map((x) => show(x.t));
        const pool = otherWords(ctx, item);
        // the odd word: half the time another adjective of the level, otherwise a noun from another sentence
        const kind = pool.noun.length && Math.random() < 0.5 ? 'noun' : 'adj';
        const cand = (pool[kind].length ? pool[kind] : pool.adj.concat(pool.noun)).filter((w) => !ins.some((x) => x.toLowerCase() === w.toLowerCase()));
        const odd = show(u.pick(cand) || (ins.includes('happy') ? 'sad' : 'happy'));
        const words = u.shuffle(ins.map((w) => ({ w, odd: false })).concat([{ w: odd, odd: true }]));
        sky.innerHTML = '';
        const cols = u.shuffle(BAL);
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true; T.clear();
          const ok = words[i].odd; const b = btns[i]; const p = posOf(ctx, b);
          if (ok) {
            b.classList.add('l10b-pop'); EP.sfx.pop(); popped++; showCount();
            const boom = u.el('div', { class: 'l10b-boom', 'aria-hidden': 'true', style: { left: p.x + 'px', top: p.y + 60 + 'px' } }, '💥'); ctx.root.appendChild(boom); ctx.timeout(() => boom.remove(), 700);
          } else {
            b.classList.add('l10b-in'); b.appendChild(u.el('span', { class: 'l10b-tag' }, '✓ in the sentence 有'));
            btns[words.findIndex((x) => x.odd)].classList.add('l10b-odd');
          }
          L.feedback(ctx, item, ok, Object.assign(p, { showOnRight: true, wrongText: `"${words[i].w}" is in the sentence 句子裡有這個字` })).then(done);
        };
        const btns = words.map((x, i) => {
          const c = cols[i % cols.length];
          const b = u.el('button', { class: 'l10b-bal', style: { background: `radial-gradient(circle at 35% 30%,#fff 0,${c} 38%)` }, 'aria-label': `Balloon 氣球: ${x.w}` }, x.w);
          b.style.setProperty('--c', c);
          ctx.on(b, 'click', () => pick(i)); sky.appendChild(b); return b;
        });
        const right = words.findIndex((x) => x.odd);
        T.set(() => pick(right), () => pick(right === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });

  /* ===== L10c Mood Meter — choose the face for the feeling in the sentence ===== */
  const ORDER = ['excited', 'happy', 'fine', 'peaceful', 'busy', 'tired', 'sad', 'scared', 'angry', 'terrible'];
  const AV = { she: '👧', he: '👦', i: '🧒', mom: '👩', kids: '🧒', story: '📖', garden: '🌷', movie: '🎬', everything: '🌈' };
  L.register({
    id: 'L10c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#ffe8cc,#ffc9c9 50%,#d0bfff)', dark: false });
      const d = ctx.difficulty; const n = d === 'easy' ? 3 : d === 'hard' ? 6 : 5;
      const zhOf = {}; EP.words.forEach((w) => { const m = w.word.toLowerCase(); if (L.MOOD[m] && !zhOf[m] && w.level === 10) zhOf[m] = w.zh; });
      const room = u.el('div', { class: 'l10c-room' }); st.body.append(room);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🌡️ 輔導室的心情溫度計：聽同學說話，選出句子裡的心情！', 'Choose the face that shows the feeling.'), L.listenBar(ctx, item));
        const mood = item.word.toLowerCase();
        const pickedMoods = [mood].concat(u.shuffle(ORDER.filter((m) => m !== mood)).slice(0, n - 1));
        const faces = ORDER.filter((m) => pickedMoods.includes(m));
        const who = L.tokens(item.sentence).map((t) => AV[t.w]).find(Boolean) || '🧒';
        room.innerHTML = '';
        const merc = u.el('div', { class: 'l10c-merc' });
        const tube = u.el('div', { class: 'l10c-tube', 'aria-hidden': 'true' }, u.el('div', { class: 'l10c-ticks' }), merc, u.el('div', { class: 'l10c-bulb' }));
        const col = u.el('div', { class: 'l10c-faces', role: 'group', 'aria-label': 'Mood faces 心情表情' });
        room.append(u.el('div', { class: 'l10c-kid', 'aria-hidden': 'true' }, u.el('span', { class: 'l10c-av' }, who), '💬 🔊 …'), u.el('div', { class: 'l10c-meter' }, tube, col));
        const level = (i) => { merc.style.height = Math.round(((faces.length - i - 0.5) / faces.length) * 100) + '%'; };
        let answered = false;
        const right = faces.indexOf(mood);
        const pick = (i) => {
          if (answered) return; answered = true; T.clear();
          const ok = i === right; level(i);
          btns[i].classList.add(ok ? 'l10c-right' : 'l10c-wrong');
          if (!ok) ctx.timeout(() => { level(right); btns[right].classList.add('l10c-right'); }, 700);
          L.feedback(ctx, item, ok, Object.assign(posOf(ctx, btns[i]), { wrongText: `${L.MOOD[mood]} ${mood} ${zhOf[mood] || ''}`.trim() })).then(done);
        };
        const btns = faces.map((m, i) => {
          const zh = zhOf[m] || '';
          const b = u.el('button', { class: 'l10c-face', 'aria-label': d === 'hard' ? zh || m : `${m} ${zh}`.trim() },
            u.el('span', { class: 'l10c-em', 'aria-hidden': 'true' }, L.MOOD[m]),
            d === 'hard' ? null : u.el('span', { class: 'l10c-en' }, m),
            zh ? u.el('span', { class: 'zh' }, zh) : null);
          ctx.on(b, 'click', () => pick(i)); col.appendChild(b); return b;
        });
        T.set(() => pick(right), () => pick(right === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });
})();
