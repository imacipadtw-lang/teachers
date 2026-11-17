/* Sentence Listening — Level 9 (Adjectives 形容詞 1): SLOT_REELS, BINARY_OPPOSITE, STICKER_LABEL
 * Only the official example sentences are played; reels, seesaw words and stickers are text only. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (this level only) ---------- */
  const posOf = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  /** the thing the sentence describes, with a picture and Chinese name */
  const SUBJ = { book: ['📘', '書'], house: ['🏠', '房子'], food: ['🍱', '食物'], flowers: ['💐', '花'], he: ['👦', '他'], she: ['👧', '她'], box: ['📦', '箱子'], weather: ['⛅', '天氣'], tree: ['🌳', '樹'], I: ['🙋', '我'], elephant: ['🐘', '大象'], candy: ['🍬', '糖果'], lemon: ['🍋', '檸檬'], cat: ['🐱', '貓'], girl: ['👧', '女孩'], rock: ['🪨', '石頭'], cake: ['🍰', '蛋糕'], puppy: ['🐶', '小狗'], pillow: ['🛏️', '枕頭'], park: ['🏞️', '公園'], river: ['🌊', '河'], job: ['💼', '工作'], chicken: ['🍗', '雞肉'], tickets: ['🎟️', '門票'], baby: ['👶', '寶寶'], view: ['🌄', '景色'], you: ['🧒', '你'] };
  const LINK = new Set(['is', 'are', 'am', 'was', 'were', 'feel', 'feels', 'look', 'looks']);
  const fix = (w) => (w === 'i' ? 'I' : w);
  /** subject noun of the sentence: "a new book" → book; "The box is heavy" → box; "I feel lucky" → I */
  const subjectOf = (item) => {
    if (item._l09s !== undefined) return item._l09s;
    const t = L.tokens(item.sentence); const k = L.key(item); let s = null;
    if (k) {
      const after = t[k.index + k.words];
      if (after && !LINK.has(after.w)) s = fix(after.w);
      else { let v = k.index - 1; if (v >= 0 && LINK.has(t[v].w)) v--; if (v >= 0) s = fix(t[v].w); }
    }
    item._l09s = s; return s;
  };
  /** the adjective as heard in the sentence */
  const adjOf = (item) => { const k = L.key(item); return (k ? k.text : item.word).toLowerCase(); };
  const subjPic = (s) => (SUBJ[s] || SUBJ[String(s).toLowerCase()] || ['❓', s])[0];
  const subjZh = (s) => (SUBJ[s] || SUBJ[String(s).toLowerCase()] || ['', s])[1];
  const levelOf = (ctx, item) => { const seen = new Set(); return ctx.pool.concat(EP.levelWords(item.level)).filter((w) => (seen.has(w.id) ? false : seen.add(w.id))); };
  /** n other adjectives (text) that are not in the heard sentence */
  const otherAdjs = (ctx, item, n) => {
    const inS = new Set(L.tokens(item.sentence).map((t) => t.w)); const seen = new Set([adjOf(item)]); const out = [];
    for (const w of u.shuffle(levelOf(ctx, item))) {
      const a = adjOf(w); if (w === item || seen.has(a) || inS.has(a) || /\s/.test(a)) continue;
      seen.add(a); out.push({ a, zh: w.zh }); if (out.length >= n) break;
    }
    return out;
  };

  L.css('L09', `
.l09a-machine{position:relative;width:min(600px,100%);background:linear-gradient(180deg,#ffd43b,#f08c00);border-radius:28px;padding:12px clamp(10px,3vw,22px) 16px;box-shadow:0 10px 0 #a35200,0 16px 30px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;gap:10px;color:#1d2340}
.l09a-title{background:#1d2340;color:#ffd43b;border-radius:12px;padding:4px 14px;font-weight:900;letter-spacing:1px;font-size:clamp(.95rem,3vw,1.2rem);text-align:center}
.l09a-lights{display:flex;gap:clamp(6px,2vw,14px)}
.l09a-lights i{width:12px;height:12px;border-radius:50%;background:#fff3bf;box-shadow:0 0 6px #fff;animation:l09a-blink 1s steps(2) infinite}
.l09a-lights i:nth-child(even){animation-delay:.5s}
.l09a-win .l09a-lights i{background:#69db7c;animation-duration:.25s}
@keyframes l09a-blink{50%{background:#e8590c;box-shadow:none}}
.l09a-reels{display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,3vw,20px);width:100%}
.l09a-reel{display:flex;flex-direction:column;align-items:stretch;gap:6px;background:#862e9c;border-radius:18px;padding:8px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.35)}
.l09a-cap{color:#fff;font-weight:900;text-align:center;font-size:clamp(.85rem,2.6vw,1rem)}
.l09a-arrow{min-height:44px;border:0;border-radius:12px;background:#fff;color:#862e9c;font-size:1.3rem;font-weight:900;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.l09a-arrow:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.25)}
.l09a-arrow:focus-visible,.l09a-stop:focus-visible{outline:4px solid #1971c2;outline-offset:2px}
.l09a-window{position:relative;background:#fff;border-radius:12px;overflow:hidden;box-shadow:inset 0 6px 8px rgba(0,0,0,.25),inset 0 -6px 8px rgba(0,0,0,.25)}
.l09a-strip{display:flex;flex-direction:column}
.l09a-cell{height:clamp(46px,8vh,62px);display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;color:#1d2340;font-size:clamp(1.05rem,3.6vw,1.5rem);white-space:nowrap;padding:0 4px}
.l09a-cell.l09a-side{height:clamp(24px,4vh,32px);font-size:clamp(.8rem,2.4vw,1rem);color:#495057;background:#f1f3f5}
.l09a-cell.l09a-cur{border-top:3px solid #f03e3e;border-bottom:3px solid #f03e3e}
.l09a-cell .zh{font-size:.72em;color:#5c3d00}
.l09a-cell .ls-emoji{font-size:1.15em}
.l09a-up .l09a-strip{animation:l09a-up .18s ease-out}
.l09a-dn .l09a-strip{animation:l09a-dn .18s ease-out}
@keyframes l09a-up{from{transform:translateY(-28px)}to{transform:translateY(0)}}
@keyframes l09a-dn{from{transform:translateY(28px)}to{transform:translateY(0)}}
.l09a-ok .l09a-window{box-shadow:0 0 0 5px #2f9e44}
.l09a-bad .l09a-window{box-shadow:0 0 0 5px #e03131}
.l09a-stop{min-width:min(260px,80%);min-height:64px;border:0;border-radius:999px;background:radial-gradient(circle at 50% 35%,#ff8787,#e03131 60%,#a61e1e);color:#fff;font-size:1.5rem;font-weight:900;cursor:pointer;box-shadow:0 7px 0 #7a1414;text-shadow:0 2px 0 rgba(0,0,0,.3)}
.l09a-stop:active{transform:translateY(5px);box-shadow:0 2px 0 #7a1414}
.l09a-stop[aria-disabled=true]{background:#868e96;box-shadow:0 7px 0 #495057}
.l09b-scene{position:relative;width:min(760px,100%);height:clamp(230px,44vh,330px);display:flex;align-items:flex-end;justify-content:center}
.l09b-tilt{position:absolute;left:4%;right:4%;bottom:clamp(64px,12vh,92px);transition:transform .55s cubic-bezier(.3,1.5,.5,1);transform-origin:50% 100%}
.l09b-plank{height:16px;border-radius:10px;background:linear-gradient(#f08c00,#a35200);box-shadow:0 4px 0 rgba(0,0,0,.25)}
.l09b-seats{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
.l09b-side{width:clamp(130px,38%,240px);border:0;border-radius:20px;background:#fff;color:#1d2340;padding:10px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 6px 0 rgba(0,0,0,.22);font-weight:900}
.l09b-side:focus-visible{outline:4px solid #1971c2;outline-offset:3px}
.l09b-side .l09b-kid{font-size:clamp(2rem,6vw,2.8rem);line-height:1}
.l09b-side .l09b-w{font-size:clamp(1.5rem,5vw,2.2rem);line-height:1.1}
.l09b-side .zh{font-size:clamp(.9rem,2.6vw,1.1rem);color:#3d4470}
.l09b-side.l09b-right{background:#d3f9d8;box-shadow:0 0 0 5px #2f9e44,0 6px 0 rgba(0,0,0,.22)}
.l09b-side.l09b-wrong{background:#ffe3e3;box-shadow:0 0 0 5px #e03131,0 6px 0 rgba(0,0,0,.22)}
.l09b-pivot{position:absolute;bottom:clamp(14px,3vh,24px);left:50%;transform:translateX(-50%);width:0;height:0;border-left:38px solid transparent;border-right:38px solid transparent;border-bottom:clamp(50px,9vh,70px) solid #495057}
.l09b-frame{background:#fff;color:#1d2340;border-radius:14px;padding:6px 14px;font-weight:900;font-size:clamp(1.1rem,3.6vw,1.5rem);box-shadow:0 3px 0 rgba(0,0,0,.2)}
.l09b-bounce{animation:l09b-hop .5s ease-out}
@keyframes l09b-hop{40%{transform:translateY(-14px)}}
.l09c-page{width:min(760px,100%);background:#fffdf5;border-radius:22px;padding:clamp(10px,2.4vw,18px);box-shadow:0 8px 0 rgba(0,0,0,.2);display:flex;flex-direction:column;align-items:center;gap:26px;color:#1d2340;background-image:repeating-linear-gradient(0deg,transparent 0 30px,#e7f5ff 30px 31px)}
.l09c-frame{position:relative;width:clamp(170px,46vw,250px);aspect-ratio:1;border:4px dashed #74c0fc;border-radius:22px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#1d2340}
.l09c-frame:focus-visible{outline:4px solid #1971c2;outline-offset:3px}
.l09c-frame.ls-over{border-color:#f59f00;background:#fff9db}
.l09c-pic{font-size:clamp(3.6rem,13vw,5.4rem);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l09c-name{font-weight:900;font-size:clamp(1rem,3vw,1.25rem)}
.l09c-slot{position:absolute;right:-10px;bottom:-12px;min-width:96px;min-height:40px;border:3px dashed #adb5bd;border-radius:12px;background:#f8f9fa;color:#495057;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center;padding:2px 6px}
.l09c-tray{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
.l09c-st{min-width:clamp(110px,26vw,150px);min-height:62px;border:4px solid #fff;border-radius:16px;color:#1d2340;font-weight:900;font-size:clamp(1.2rem,3.8vw,1.55rem);cursor:grab;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 10px;box-shadow:0 5px 0 rgba(0,0,0,.2),0 0 0 2px rgba(0,0,0,.08);touch-action:none}
.l09c-st .zh{font-size:.62em;color:#3d4470}
.l09c-st:focus-visible{outline:4px solid #1971c2;outline-offset:3px}
.l09c-st:nth-child(4n+1){background:#ffe066;transform:rotate(-3deg)}.l09c-st:nth-child(4n+2){background:#b2f2bb;transform:rotate(2deg)}.l09c-st:nth-child(4n+3){background:#a5d8ff;transform:rotate(-1deg)}.l09c-st:nth-child(4n+4){background:#fcc2d7;transform:rotate(3deg)}
.l09c-stuck{position:absolute;right:-14px;bottom:-14px;background:#ffe066;border:4px solid #fff;border-radius:14px;padding:6px 12px;font-weight:900;font-size:1.3rem;color:#1d2340;transform:rotate(-8deg);box-shadow:0 5px 0 rgba(0,0,0,.2);animation:l09c-stick .35s ease-out}
@keyframes l09c-stick{from{transform:rotate(-8deg) scale(1.6)}to{transform:rotate(-8deg) scale(1)}}
.l09c-no{animation:l09c-wobble .45s}
@keyframes l09c-wobble{25%{transform:translateX(-8px) rotate(-6deg)}75%{transform:translateX(8px) rotate(6deg)}}
.l09c-done{background:#d3f9d8;border-style:solid;border-color:#2f9e44}
.l09c-book{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:100%}
.l09c-mini{background:#fff;color:#1d2340;border-radius:10px;padding:3px 8px;font-weight:800;font-size:.9rem;box-shadow:0 2px 0 rgba(0,0,0,.2)}
@media (prefers-reduced-motion:reduce){.l09a-lights i,.l09a-strip,.l09c-stuck,.l09b-bounce{animation:none!important}.l09b-tilt{transition:none}}
`);

  /* ===== L09a Describe-o-matic — turn two reels (subject + adjective) to the heard words, press STOP ===== */
  L.register({
    id: 'L09a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#5f3dc4,#c2255c)' });
      const d = ctx.difficulty; const nOpt = d === 'easy' ? 3 : d === 'hard' ? 6 : 4;
      const lights = u.el('div', { class: 'l09a-lights', 'aria-hidden': 'true' }, Array.from({ length: 9 }, () => u.el('i')));
      const reelsBox = u.el('div', { class: 'l09a-reels' });
      const stopBtn = u.el('button', { class: 'l09a-stop' }, '⏹ STOP 停');
      const machine = u.el('div', { class: 'l09a-machine' }, lights, u.el('div', { class: 'l09a-title' }, '🎰 DESCRIBE-O-MATIC 描述轉轉機'), reelsBox, stopBtn);
      st.body.append(machine);
      let onStop = null; ctx.on(stopBtn, 'click', () => onStop && onStop());
      const allSubj = () => { const s = new Set(); EP.levelWords(9).concat(ctx.pool).forEach((w) => { const x = subjectOf(w); if (x) s.add(x); }); return Array.from(s); };

      function makeReel(cap, capEn, opts, show) {
        const n = opts.length; const r = { idx: 0, opts };
        const strip = u.el('div', { class: 'l09a-strip' });
        const win = u.el('div', { class: 'l09a-window', role: 'status', 'aria-live': 'polite' }, strip);
        const up = u.el('button', { class: 'l09a-arrow', 'aria-label': `${capEn} up 上一個` }, '▲');
        const dn = u.el('button', { class: 'l09a-arrow', 'aria-label': `${capEn} down 下一個` }, '▼');
        r.el = u.el('div', { class: 'l09a-reel', role: 'group', 'aria-label': `${capEn} reel ${cap}轉輪` }, u.el('div', { class: 'l09a-cap' }, cap, ' ', capEn), up, win, dn);
        r.cur = () => opts[r.idx];
        r.render = (dir) => {
          strip.innerHTML = '';
          [-1, 0, 1].forEach((k) => { const v = opts[(r.idx + k + n) % n]; strip.append(u.el('div', { class: 'l09a-cell ' + (k ? 'l09a-side' : 'l09a-cur'), 'aria-hidden': k ? 'true' : null }, show(v, !k))); });
          if (dir) { r.el.classList.remove('l09a-up', 'l09a-dn'); void r.el.offsetWidth; r.el.classList.add(dir < 0 ? 'l09a-up' : 'l09a-dn'); }
        };
        r.set = (i, dir) => { r.idx = (i + n) % n; r.render(dir); };
        r.step = (dir) => { if (r.locked) return; r.set(r.idx + dir, dir); EP.sfx.tick(); };
        up.addEventListener('click', () => r.step(-1)); dn.addEventListener('click', () => r.step(1));
        r.render(0);
        return r;
      }

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎰 聽句子，用 ▲▼ 把「主角」和「形容詞」兩個轉輪轉到你聽到的字，再按 STOP。', 'Turn both reels to the words you heard and press STOP.'), L.listenBar(ctx, item));
        machine.classList.remove('l09a-win');
        const subj = subjectOf(item) || L.tokens(item.sentence)[0].t; const adj = adjOf(item);
        const inS = new Set(L.tokens(item.sentence).map((t) => t.w));
        const sOpts = u.shuffle([subj].concat(u.shuffle(allSubj().filter((s) => s !== subj && !inS.has(s.toLowerCase()))).slice(0, nOpt - 1)));
        const aList = otherAdjs(ctx, item, nOpt - 1); const zhOf = { [adj]: item.zh }; aList.forEach((x) => (zhOf[x.a] = x.zh));
        const aOpts = u.shuffle([adj].concat(aList.map((x) => x.a)));
        const showS = (v) => [d !== 'hard' ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, subjPic(v)) : null, v, d === 'easy' ? u.el('span', { class: 'zh' }, subjZh(v)) : null];
        const showA = (v) => [v, d === 'easy' ? u.el('span', { class: 'zh' }, zhOf[v] || '') : null];
        reelsBox.innerHTML = '';
        const r1 = makeReel('主角', 'WHO / WHAT', sOpts, showS), r2 = makeReel('形容詞', 'HOW', aOpts, showA);
        reelsBox.append(r1.el, r2.el);
        let answered = false, spinning = true;
        r1.locked = r2.locked = true; stopBtn.setAttribute('aria-disabled', 'true');
        // intro spin: the reels whirl and land on a wrong combination
        const spins = 7;
        for (let k = 0; k < spins; k++) ctx.timeout(() => { r1.set(r1.idx + 1, 1); r2.set(r2.idx + 1, 1); EP.sfx.tick(); }, 90 * k);
        ctx.timeout(() => {
          r1.set(u.randInt(0, sOpts.length - 1)); r2.set(u.randInt(0, aOpts.length - 1));
          if (r1.cur() === subj && r2.cur() === adj) r2.set(r2.idx + 1);
          spinning = false; r1.locked = r2.locked = false; stopBtn.removeAttribute('aria-disabled');
          T.set(() => { for (let i = 0; i < sOpts.length && r1.cur() !== subj; i++) r1.step(1); for (let i = 0; i < aOpts.length && r2.cur() !== adj; i++) r2.step(1); onStop(); },
            () => { if (r2.cur() === adj) r2.step(1); onStop(); });
        }, 90 * spins + 60);
        onStop = () => {
          if (spinning || answered) return; answered = true; T.clear(); onStop = null;
          r1.locked = r2.locked = true; stopBtn.setAttribute('aria-disabled', 'true');
          const ok1 = r1.cur() === subj, ok2 = r2.cur() === adj, ok = ok1 && ok2;
          r1.el.classList.add(ok1 ? 'l09a-ok' : 'l09a-bad'); r2.el.classList.add(ok2 ? 'l09a-ok' : 'l09a-bad');
          if (ok) { machine.classList.add('l09a-win'); EP.sfx.coin(); ctx.burst('🎰 JACKPOT!'); }
          else ctx.timeout(() => { if (!ok1) r1.set(sOpts.indexOf(subj), 1); if (!ok2) r2.set(aOpts.indexOf(adj), 1); }, 450);
          L.feedback(ctx, item, ok, Object.assign(posOf(ctx, stopBtn), { wrongText: `${subj} + ${adj}` })).then(done);
        };
      }));
      return { test: T.api };
    },
  });

  /* ===== L09b Opposites Seesaw — press the side (heard adjective or its opposite) ===== */
  L.register({
    id: 'L09b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(#74c0fc 0%,#d0ebff 58%,#8ce99a 58%,#40c057 100%)' });
      const d = ctx.difficulty;
      const tilt = u.el('div', { class: 'l09b-tilt' });
      const scene = u.el('div', { class: 'l09b-scene', role: 'group', 'aria-label': 'Seesaw 蹺蹺板' }, tilt, u.el('div', { class: 'l09b-pivot', 'aria-hidden': 'true' }));
      const frameBox = u.el('div', { style: { minHeight: '0' } });
      st.body.append(frameBox, scene);
      const kids = ['🧒', '👧', '👦', '🧑'];
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('⚖️ 蹺蹺板兩邊是一組相反詞，聽句子，按下你聽到的那一邊！', 'Press the side of the seesaw you heard.'), L.listenBar(ctx, item));
        const heard = adjOf(item); const opp = L.OPP[item.word.toLowerCase()] || ['?', '?'];
        const sides = u.shuffle([{ w: heard, zh: item.zh, ok: true }, { w: opp[0], zh: opp[1], ok: false }]);
        frameBox.innerHTML = '';
        if (d === 'easy') { const f = L.swapKey(item, '_____'); if (f) frameBox.append(u.el('div', { class: 'l09b-frame' }, '📝 ', f)); }
        tilt.innerHTML = ''; tilt.style.transform = 'rotate(0deg)';
        const ks = u.shuffle(kids);
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true; T.clear();
          const s = sides[i]; const b = btns[i];
          tilt.style.transform = `rotate(${i === 0 ? -12 : 12}deg)`; b.classList.add('l09b-bounce', s.ok ? 'l09b-right' : 'l09b-wrong');
          if (!s.ok) ctx.timeout(() => { const j = 1 - i; tilt.style.transform = `rotate(${j === 0 ? -12 : 12}deg)`; btns[j].classList.add('l09b-right'); }, 700);
          EP.sfx.jump();
          L.feedback(ctx, item, s.ok, Object.assign(posOf(ctx, b), { wrongText: `It was "${heard}" 是 ${heard}` })).then(done);
        };
        const btns = sides.map((s, i) => {
          const b = u.el('button', { class: 'l09b-side', 'aria-label': `${s.w} ${d === 'hard' ? '' : s.zh}`.trim() },
            u.el('span', { class: 'l09b-kid', 'aria-hidden': 'true' }, ks[i]),
            u.el('span', { class: 'l09b-w' }, s.w),
            d === 'hard' ? null : u.el('span', { class: 'zh' }, s.zh));
          ctx.on(b, 'click', () => pick(i)); return b;
        });
        tilt.append(u.el('div', { class: 'l09b-seats' }, btns), u.el('div', { class: 'l09b-plank', 'aria-hidden': 'true' }));
        const right = sides.findIndex((s) => s.ok);
        T.set(() => pick(right), () => pick(1 - right));
      }));
      return { test: T.api };
    },
  });

  /* ===== L09c Sticker Book — drag the heard adjective sticker onto the picture ===== */
  L.register({
    id: 'L09c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#99e9f2,#3bc9db 60%,#1098ad)' });
      const d = ctx.difficulty; const n = d === 'easy' ? 3 : 4;
      const page = u.el('div', { class: 'l09c-page' });
      const book = u.el('div', { class: 'l09c-book', 'aria-label': 'My stickers 我的貼紙', role: 'list' });
      st.body.append(page); st.foot.append(book);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🏷️ 聽句子，把描述這張圖的形容詞貼紙拖到圖片上（也可以先點貼紙、再點圖片）。', 'Drag the right adjective sticker onto the picture.'), L.listenBar(ctx, item));
        const subj = subjectOf(item); const adj = adjOf(item);
        const name = subj ? subjZh(subj) : item.zh;
        const opts = u.shuffle([{ a: adj, zh: item.zh }].concat(otherAdjs(ctx, item, n - 1)));
        page.innerHTML = '';
        const slot = u.el('span', { class: 'l09c-slot', 'aria-hidden': 'true' }, '🏷️ ?');
        const frame = u.el('button', { class: 'l09c-frame', 'aria-label': `Picture 圖片: ${name}${subj ? ' ' + subj : ''}. Put the sticker here 把貼紙貼在這裡` },
          u.el('span', { class: 'l09c-pic', 'aria-hidden': 'true' }, subj ? subjPic(subj) : (EP.pic(item) || '🖼️')),
          u.el('span', { class: 'l09c-name zh' }, name), slot);
        const tray = u.el('div', { class: 'l09c-tray', role: 'group', 'aria-label': 'Stickers 貼紙' });
        const stickers = opts.map((o) => {
          const b = u.el('button', { class: 'l09c-st', 'data-a': o.a, 'aria-label': `Sticker 貼紙: ${o.a}` }, o.a, d === 'easy' ? u.el('span', { class: 'zh' }, o.zh) : null);
          tray.appendChild(b); return b;
        });
        page.append(frame, tray);
        let answered = false;
        // a tap on the picture with no sticker chosen: tell how to play (registered before L.dnd's own handler)
        ctx.on(frame, 'click', () => { if (!answered && !stickers.some((s) => s.getAttribute('aria-pressed') === 'true')) ctx.toast('先選一張貼紙 Pick a sticker first'); });
        const drop = (s) => {
          if (answered) return; answered = true; T.clear();
          const ok = s.dataset.a === adj;
          if (ok) {
            slot.remove(); frame.classList.add('l09c-done'); frame.appendChild(u.el('span', { class: 'l09c-stuck', 'aria-hidden': 'true' }, adj));
            s.style.visibility = 'hidden'; EP.sfx.pop();
          } else {
            s.classList.add('l09c-no');
            const r = stickers.find((x) => x.dataset.a === adj); r.style.outline = '5px solid #2f9e44';
          }
          L.feedback(ctx, item, ok, Object.assign(posOf(ctx, frame), { wrongText: `It was "${adj}" 是 ${adj}` })).then(() => {
            if (ok) book.append(u.el('span', { class: 'l09c-mini', role: 'listitem' }, `${subj ? subjPic(subj) : '⭐'} ${adj}`));
            done();
          });
        };
        L.dnd(ctx, stickers, [frame], (s) => drop(s));
        const right = stickers.find((s) => s.dataset.a === adj); const wrong = stickers.find((s) => s !== right);
        T.set(() => { right.click(); frame.click(); }, () => { wrong.click(); frame.click(); });
      }));
      return { test: T.api };
    },
  });
})();
