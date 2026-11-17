/* Sentence Listening — Level 14 (Months · little words): TIMELINE_INSERT, RADIO_TUNE, LETTER_TILES
 * L14a Month Line-Up: pick the heard month card and put it into its gap on the year line.
 * L14b Radio Tuner: slide the tuner (input range) to the station whose word was in the sentence, press OK.
 * L14c Word Speller: spell the key word of the heard sentence with letter tiles (EP.kit.speller). */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* season colour of a month index (white text on it has ≥ 4.5:1 contrast) */
  const SEASON = (m) => (m === 11 || m <= 1 ? ['#1864ab', '❄️'] : m <= 4 ? ['#237032', '🌸'] : m <= 7 ? ['#b33f00', '☀️'] : ['#7a4419', '🍁']);
  const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  /** easy-mode hint: the Chinese sentence with the answer's meaning blanked out (「這是我的＿＿。」), so it helps
   *  with the context but never shows the answer itself */
  const ZH_SYN = { 早晨: ['早上'], 夜晚: ['晚上'], 游泳: ['游'], 溜冰: ['滑冰'], 狩獵: ['打獵'], 假期: ['度假'], 聯絡: ['打電話'], 購物: ['買'], 夾克: ['外套'], 一些: ['有些'] };
  const ZH_D = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const zhHint = (item) => {
    const z = String(item.zh || '').replace(/[（(].*?[）)]/g, '');
    let parts = [z].concat(z.split(/\.\.\.|…|[；;、，,/]/));
    const m = z.match(/^(\d+)月$/); if (m && ZH_D[+m[1]]) parts.push(ZH_D[+m[1]] + '月');
    if (/日$/.test(z)) parts.push(z.replace(/日$/, '天'));
    parts = parts.concat(ZH_SYN[z] || []).map((x) => x.trim()).filter(Boolean);
    parts = parts.concat(parts.filter((x) => x.length === 1).map((x) => x + '子')).sort((a, b) => b.length - a.length);
    let s = item.sentenceZh || '';
    for (const p of parts) s = s.split(p).join('＿＿');
    return s.replace(/(＿＿)+/g, '＿＿');
  };
  /** lower-case words that are spoken in the sentence (a distractor must never be one of them) */
  const heard = (item) => new Set(L.tokens(item.sentence).map((x) => x.w));
  const isMonth = (w) => L.MONTHS.includes(w.word);
  /** set a CSS custom property (u.el's style object cannot) */
  const cssVar = (el, k, v) => { el.style.setProperty(k, v); return el; };
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top }; };

  L.css('L14', `
.l14a-line{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:6px;width:100%;max-width:960px;background:rgba(0,30,45,.35);padding:10px;border-radius:20px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.25)}
@media (max-width:720px){.l14a-line{grid-template-columns:repeat(6,minmax(0,1fr))}}
.l14a-cell{position:relative;min-height:clamp(60px,12.5vh,104px);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;color:#1d2340;font-weight:900;border-top:8px solid var(--sea,#1864ab);box-shadow:0 3px 0 rgba(0,0,0,.2);padding:3px 2px;text-align:center;line-height:1.05;min-width:0}
.l14a-num{font-size:clamp(1.15rem,3vw,2rem)}
.l14a-ab{font-size:clamp(.72rem,1.6vw,1rem);color:#3d4470;font-weight:800}
.l14a-sea{position:absolute;right:2px;top:1px;font-size:.7rem}
button.l14a-gap{border:3px dashed #fff;border-top-width:8px;border-top-style:solid;border-top-color:var(--sea,#fff);background:#0b3d4f;color:#fff;cursor:pointer;font:inherit;font-weight:900}
button.l14a-gap .l14a-num{color:#fff}
button.l14a-gap:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l14a-gap.ls-over,.l14a-gap.l14a-pulse{background:#145a70}
.l14a-good{background:#d3f9d8!important;color:#1d2340!important;border:3px solid #2b8a3e!important;border-top-width:8px!important}
.l14a-good .l14a-num,.l14a-bad .l14a-num{color:#1d2340!important}
.l14a-bad{background:#ffe3e3!important;color:#1d2340!important;border:3px solid #c92a2a!important;border-top-width:8px!important}
.l14a-mark{position:absolute;left:3px;top:0;font-size:.95rem;font-weight:900}
.l14a-tray{display:flex;gap:clamp(8px,2vw,16px);flex-wrap:wrap;justify-content:center;padding:6px}
.l14a-card{border:0;border-radius:16px;background:#fff;color:#1d2340;padding:6px 14px 10px;min-width:clamp(92px,22vw,150px);box-shadow:0 6px 0 rgba(0,0,0,.28);display:flex;flex-direction:column;align-items:center;gap:2px;cursor:grab;touch-action:none;font:inherit;font-weight:900;transition:transform .15s}
.l14a-card:hover{transform:translateY(-3px)}
.l14a-card:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l14a-badge{display:inline-flex;align-items:center;justify-content:center;min-width:2.2em;height:2.2em;border-radius:999px;background:var(--sea);color:#fff;font-size:1.25rem}
.l14a-name{font-size:clamp(1.05rem,2.8vw,1.55rem)}
.l14a-used{visibility:hidden}
.l14a-hint{font-weight:800;color:#fff;background:#0b3d4f;border-radius:999px;padding:4px 14px;text-align:center}
.l14b-radio{width:min(720px,100%);background:linear-gradient(180deg,#8a4b22,#5c2f12);border-radius:28px;padding:clamp(10px,2.4vw,18px);box-shadow:0 12px 0 #3a1c08,0 18px 40px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:10px;position:relative}
.l14b-ant{position:absolute;right:48px;top:-46px;width:6px;height:56px;background:#adb5bd;border-radius:4px;transform:rotate(18deg);transform-origin:bottom}
.l14b-ant::before{content:'';position:absolute;left:-5px;top:-8px;width:16px;height:16px;border-radius:50%;background:#fa5252}
.l14b-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#fff3d6;font-weight:900;letter-spacing:.06em}
.l14b-grill{flex:1;height:26px;border-radius:10px;background:repeating-linear-gradient(90deg,#3a1c08 0 4px,#6b3a17 4px 9px);max-width:240px}
.l14b-lamp{display:inline-block;padding:2px 10px;border-radius:999px;background:#3a1c08;color:#ffd8a8;font-size:.8rem}
.l14b-lamp.on{background:#e03131;color:#fff;box-shadow:0 0 12px #ff8787}
.l14b-dial{position:relative;height:clamp(118px,19vh,150px);border-radius:16px;background:linear-gradient(180deg,#fff8e1,#ffe8b0);box-shadow:inset 0 0 0 4px #3a1c08,inset 0 6px 14px rgba(0,0,0,.25);overflow:hidden}
.l14b-scale{position:absolute;left:4%;right:4%;top:50%;height:22px;transform:translateY(-50%);background:repeating-linear-gradient(90deg,#5c2f12 0 2px,transparent 2px 12px);opacity:.55}
.l14b-st{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;color:#3b2410;font-weight:900;white-space:nowrap;padding:2px 6px;border-radius:10px;transition:transform .15s,background .15s;z-index:2}
.l14b-st.up{top:6px}.l14b-st.down{bottom:6px;flex-direction:column-reverse}
.l14b-st small{font-size:.72rem;font-weight:800;color:#6b4423}
.l14b-st b{font-size:clamp(.92rem,2.4vw,1.2rem)}
.l14b-st.on{background:#ffd43b;box-shadow:0 0 0 3px #3a1c08;transform:translateX(-50%) scale(1.08)}
.l14b-needle{position:absolute;top:0;bottom:0;width:4px;margin-left:-2px;background:#e03131;box-shadow:0 0 8px rgba(224,49,49,.7);transition:left .2s ease-out;pointer-events:none;z-index:1}
.l14b-disp{background:#0b2e13;color:#8ce99a;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:800;border-radius:12px;padding:6px 12px;text-align:center;font-size:clamp(1rem,2.6vw,1.25rem);min-height:1.8em;box-shadow:inset 0 0 0 2px #2b8a3e}
.l14b-slider{-webkit-appearance:none;appearance:none;width:calc(76% + 40px);align-self:center;height:16px;border-radius:999px;background:#2b1405;outline:none;margin:10px 0;cursor:pointer}
.l14b-slider::-webkit-slider-thumb{-webkit-appearance:none;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3bf,#f59f00 60%,#a35f00);border:3px solid #3a1c08;cursor:grab}
.l14b-slider::-moz-range-thumb{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3bf,#f59f00 60%,#a35f00);border:3px solid #3a1c08;cursor:grab}
.l14b-slider:focus-visible{box-shadow:0 0 0 4px #ffd43b}
.l14b-ctrl{display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap}
.l14b-ctrl .btn.l14b-step{background:#fff3d6;color:#3b2410}
.l14b-good{background:#8ce99a!important}
.l14b-bad{background:#ffa8a8!important}
.l14b-sound{animation:l14bwave .5s ease-in-out 3}
@keyframes l14bwave{50%{transform:translateY(-3px) rotate(-1deg)}}
.l14c-card{background:#fff;color:#1d2340;border-radius:18px;padding:10px 16px;font-size:clamp(1.2rem,3.6vw,1.75rem);font-weight:800;text-align:center;box-shadow:0 5px 0 rgba(0,0,0,.2);max-width:860px}
.l14c-blank{display:inline-block;min-width:3.6em;border-bottom:4px solid #862e9c;margin:0 4px;color:#862e9c}
.l14c-zh{display:block;font-size:1rem;color:#4a5078;font-weight:700;margin-top:2px}
.l14c-box{background:rgba(255,255,255,.14);border-radius:22px;padding:clamp(10px,2vw,16px);box-shadow:inset 0 0 0 3px rgba(255,255,255,.25);max-width:100%}
.l14c-box .letter-tile{color:#1d2340;background:#fff;font-family:inherit;cursor:pointer}
.l14c-box .letter-tile:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l14c-box .btn.ghost{color:#fff}
.l14c-box .slot{margin:3px}
.l14c-score{color:#fff;font-weight:800;background:#5f3dc4;border-radius:999px;padding:4px 14px}
.l14c-score:empty{display:none}
@media (max-width:480px){.l14c-box .letter-tile{min-width:46px;height:54px;font-size:1.7rem}.l14c-box .slot{min-width:34px;height:50px;font-size:1.6rem}}
`);

  /* ===== L14a Month Line-Up — TIMELINE_INSERT ===== */
  L.register({
    id: 'L14a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#1098ad 55%,#3bc9db)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const nGaps = easy ? 3 : 4;
      const line = u.el('div', { class: 'l14a-line', role: 'group', 'aria-label': 'Year line 一年的時間線' });
      const tray = u.el('div', { class: 'l14a-tray', role: 'group', 'aria-label': 'Month cards 月份卡' });
      const hint = u.el('div', { class: 'l14a-hint zh' });
      st.body.append(line, hint, tray);

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        const t = L.MONTHS.indexOf(item.word);
        if (t < 0) { done(); return; } // only months are in this game's pool (spec filter 'month')
        st.head.innerHTML = '';
        st.head.append(L.say('📅 聽句子，選出聽到的月份卡，放進時間線上對的空格！', 'Put the month card you heard in the right gap.'), L.listenBar(ctx, item));
        // gaps: the heard month + other months that are NOT spoken in the sentence (e.g. "March comes after February")
        const said = heard(item);
        const cand = u.shuffle(Array.from({ length: 12 }, (_, m) => m).filter((m) => m !== t && !said.has(L.MONTHS[m].toLowerCase())));
        const near = (a, b) => Math.min(Math.abs(a - b), 12 - Math.abs(a - b)) <= 1;
        const gaps = [t];
        for (const m of cand) { if (gaps.length >= nGaps) break; if (!gaps.some((g) => near(g, m))) gaps.push(m); }
        for (const m of cand) { if (gaps.length >= nGaps) break; if (!gaps.includes(m)) gaps.push(m); }
        // year line
        line.innerHTML = '';
        const gapEls = {};
        for (let m = 0; m < 12; m++) {
          const [sea, ic] = SEASON(m);
          if (gaps.includes(m)) {
            let prev = m - 1; while (prev >= 0 && gaps.includes(prev)) prev--;
            const where = prev >= 0 ? `after ${L.MONTHS[prev]} 在${ZH_NUM[prev]}月後面` : 'at the start 在最前面';
            const g = cssVar(u.el('button', { class: 'l14a-cell l14a-gap', 'aria-label': `Empty slot 空格, ${where}` + (easy ? `, number ${m + 1}` : '') },
              u.el('span', { class: 'l14a-num' }, easy ? String(m + 1) : '?'), u.el('span', { class: 'l14a-ab' }, easy ? '?' : '')), '--sea', sea);
            g._m = m; gapEls[m] = g; line.appendChild(g);
          } else {
            line.appendChild(cssVar(u.el('div', { class: 'l14a-cell' },
              u.el('span', { class: 'l14a-sea', 'aria-hidden': 'true' }, ic),
              hard ? null : u.el('span', { class: 'l14a-num' }, String(m + 1)),
              u.el('span', { class: 'l14a-ab', style: hard ? { fontSize: 'clamp(.85rem,1.9vw,1.05rem)', color: '#1d2340' } : null }, L.MONTHS[m].slice(0, 3))), '--sea', sea));
          }
        }
        hint.textContent = easy ? '提示：空格上的數字就是月份 · The number shows the month.' : '';
        hint.hidden = !easy;
        // cards (one per gap): the month number is on every card
        tray.innerHTML = '';
        const cards = u.shuffle(gaps).map((m) => {
          const c = cssVar(u.el('button', { class: 'l14a-card', 'aria-label': `${L.MONTHS[m]}, month ${m + 1} 第${m + 1}個月` },
            u.el('span', { class: 'l14a-badge', 'aria-hidden': 'true' }, String(m + 1)), u.el('span', { class: 'l14a-name' }, L.MONTHS[m])), '--sea', SEASON(m)[0]);
          c._m = m; tray.appendChild(c); return c;
        });
        let answered = false;
        const fill = (g, m, cls, mark) => {
          g.classList.add(cls); g.innerHTML = '';
          g.append(u.el('span', { class: 'l14a-mark', 'aria-hidden': 'true', style: { color: cls === 'l14a-good' ? '#1b6b2e' : '#b02525' } }, mark),
            u.el('span', { class: 'l14a-num' }, String(m + 1)), u.el('span', { class: 'l14a-ab' }, L.MONTHS[m].slice(0, 3)));
        };
        const pick = (cm, gm) => {
          if (answered) return; answered = true; dd.clear();
          const ok = cm === t && gm === t;
          const g = gapEls[gm]; const card = cards.find((c) => c._m === cm);
          if (card) card.classList.add('l14a-used');
          fill(g, cm, ok ? 'l14a-good' : 'l14a-bad', ok ? '✔' : '✘');
          if (!ok && gm !== t) fill(gapEls[t], t, 'l14a-good', '✔');
          if (ok) EP.sfx.whoosh && EP.sfx.whoosh();
          const p = rel(ctx, g);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: hard ? 140 : 100,
            wrongText: cm !== t ? `It was ${item.word} 是 ${item.word}` : `Wrong place 位置不對` }).then(done);
        };
        const dd = L.dnd(ctx, cards, Object.values(gapEls), (d, g) => pick(d._m, g._m));
        Object.values(gapEls).forEach((g) => ctx.on(g, 'click', () => { if (!answered && !tray.querySelector('.ls-selected')) ctx.toast('先點一張月份卡，再點空格 Pick a card first'); }));
        const wrongCard = gaps.find((m) => m !== t);
        T.set(() => pick(t, t), () => pick(wrongCard, t));
      }));
      return { test: T.api };
    },
  });

  /* ===== L14b Radio Tuner — RADIO_TUNE ===== */
  L.register({
    id: 'L14b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 0%,#ffe8cc,#f4a261 45%,#7f3b13)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 5 : hard ? 7 : 6;
      const lamp = u.el('span', { class: 'l14b-lamp', 'aria-hidden': 'true' }, 'ON AIR');
      const dial = u.el('div', { class: 'l14b-dial', 'aria-hidden': 'true' }, u.el('div', { class: 'l14b-scale' }));
      const needle = u.el('div', { class: 'l14b-needle' });
      const disp = u.el('div', { class: 'l14b-disp', 'aria-hidden': 'true' }, 'FM --.-');
      const slider = u.el('input', { type: 'range', class: 'l14b-slider', min: '0', max: String(n - 1), step: '1', value: '0', 'aria-label': 'Tuner 調頻桿' });
      const prev = u.el('button', { class: 'btn small l14b-step', 'aria-label': 'Previous station 上一台' }, '◀');
      const next = u.el('button', { class: 'btn small l14b-step', 'aria-label': 'Next station 下一台' }, '▶');
      const okBtn = u.el('button', { class: 'btn go big' }, '✔ OK 確定');
      const zh = u.el('div', { class: 'ls-instr zh', style: { fontWeight: 700 } });
      const radio = u.el('div', { class: 'l14b-radio', role: 'group', 'aria-label': 'Radio 收音機' },
        u.el('div', { class: 'l14b-ant', 'aria-hidden': 'true' }),
        u.el('div', { class: 'l14b-top' }, u.el('span', {}, '📻 ENGLISH FM'), u.el('span', { class: 'l14b-grill', 'aria-hidden': 'true' }), lamp),
        dial, disp, slider, u.el('div', { class: 'l14b-ctrl' }, prev, okBtn, next));
      dial.appendChild(needle);
      st.body.append(zh, radio);

      let words = [], stEls = [], freqs = [];
      const pct = (i) => 12 + (i * 76) / (words.length - 1); // the slider below spans the same 12%–88% (see .l14b-slider)
      const tune = (i, quiet) => {
        i = u.clamp(i | 0, 0, words.length - 1);
        if (String(i) !== slider.value) slider.value = String(i);
        needle.style.left = pct(i) + '%';
        stEls.forEach((s, k) => s.classList.toggle('on', k === i));
        disp.textContent = `FM ${freqs[i]} MHz ♪ ${words[i].word}`;
        slider.setAttribute('aria-valuetext', `FM ${freqs[i]}: ${words[i].word}`);
        if (!quiet) EP.sfx.tick();
      };
      ctx.on(slider, 'input', () => tune(+slider.value));
      ctx.on(prev, 'click', () => tune(+slider.value - 1));
      ctx.on(next, 'click', () => tune(+slider.value + 1));
      let press = null;
      ctx.on(okBtn, 'click', () => press && press());

      /** n−1 station words: same kind first (months with months, little words with little words), never a word in the sentence */
      const stationWords = (item) => {
        const said = heard(item);
        const ok = (w) => !said.has(w.word.toLowerCase()) && !said.has(L.keyText(w).toLowerCase());
        let res = L.others(ctx, item, n - 1, { filter: (w) => ok(w) && isMonth(w) === isMonth(item), poolOnly: true });
        if (res.length < n - 1) res = res.concat(L.others(ctx, item, n - 1, { filter: (w) => ok(w) && !res.includes(w) && !res.some((r) => u.norm(r.word) === u.norm(w.word)) }).slice(0, n - 1 - res.length));
        return res;
      };

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('📻 聽廣播句子，把調頻桿拉到「句子裡有的字」那一台，按確定！', 'Slide the tuner to the word you heard and press OK.'), L.listenBar(ctx, item));
        zh.textContent = easy ? '中文意思：' + zhHint(item) : '';
        zh.hidden = !easy;
        words = u.shuffle([item].concat(stationWords(item)));
        const ti = words.indexOf(item);
        slider.max = String(words.length - 1);
        stEls.forEach((s) => s.remove());
        const base = 87.9 + Math.random() * 1.2;
        freqs = words.map((_, i) => (base + i * (19 / (words.length - 1))).toFixed(1));
        stEls = words.map((w, i) => {
          const s = u.el('div', { class: 'l14b-st ' + (i % 2 ? 'down' : 'up'), style: { left: pct(i) + '%' } }, u.el('small', {}, freqs[i]), u.el('b', {}, w.word));
          dial.insertBefore(s, needle); return s;
        });
        radio.classList.remove('l14b-sound'); lamp.classList.remove('on');
        let startAt = u.randInt(0, words.length - 1); if (startAt === ti) startAt = (ti + 1 + u.randInt(0, words.length - 2)) % words.length;
        tune(startAt, true);
        let answered = false;
        const ok = () => {
          if (answered) return; answered = true;
          const i = +slider.value; const right = i === ti; const s = stEls[i];
          s.classList.add(right ? 'l14b-good' : 'l14b-bad');
          if (right) { lamp.classList.add('on'); void radio.offsetWidth; radio.classList.add('l14b-sound'); }
          else stEls[ti].classList.add('l14b-good');
          const p = rel(ctx, s);
          L.feedback(ctx, item, right, { x: p.x, y: p.y, points: hard ? 140 : 100, wrongText: `The station was "${item.word}" 是「${item.word}」那一台` }).then(done);
        };
        press = ok;
        const wrongIdx = (ti + 1) % words.length;
        T.set(() => { slider.value = String(ti); slider.dispatchEvent(new Event('input')); ok(); },
          () => { slider.value = String(wrongIdx); slider.dispatchEvent(new Event('input')); ok(); });
      }));
      return { test: T.api };
    },
  });

  /* ===== L14c Word Speller — LETTER_TILES ===== */
  L.register({
    id: 'L14c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#5f3dc4,#862e9c 55%,#cc5de8)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      let streak = 0;
      const score = u.el('div', { class: 'l14c-score zh', 'aria-live': 'polite' });
      st.foot.append(score);

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = '';
        st.head.append(L.say('🔤 聽句子，用字母磚拼出空格裡的字！', 'Spell the missing key word with the letter tiles.'), L.listenBar(ctx, item));
        const k = L.key(item);
        const card = u.el('div', { class: 'l14c-card' });
        if (k) card.append(item.sentence.slice(0, k.start), u.el('span', { class: 'l14c-blank', 'aria-label': 'blank 空格' }, '?'), item.sentence.slice(k.start + k.text.length));
        else card.append('🎧 ', u.el('span', { class: 'l14c-blank', 'aria-label': 'blank 空格' }, '?'), ` (${item.zh})`); // key word not found in the sentence: spell the headword
        if (easy) card.append(u.el('span', { class: 'l14c-zh zh' }, item.sentenceZh));
        let answered = false, hints = 0;
        const finish = (ok) => {
          if (answered) return; answered = true;
          streak = ok ? streak + 1 : 0;
          score.textContent = streak >= 2 ? `🔥 連續拼對 ${streak} 個 · ${streak} in a row` : '';
          const len = EP.spellKey(item).replace(/ /g, '').length;
          L.feedback(ctx, item, ok, { points: 80 + len * 10, showOnRight: true, wrongText: `Not quite 有拼錯：${EP.spellKey(item)}` }).then(done);
        };
        const sp = ctx.kit.speller(ctx, item, (ok, mistakes) => finish(easy ? mistakes - hints <= 0 : ok), { extra: easy ? 0 : hard ? 4 : 2 });
        const hintBtn = Array.from(sp.querySelectorAll('button')).find((b) => !b.classList.contains('letter-tile'));
        if (hintBtn) {
          if (hard) hintBtn.remove();
          else if (easy) hintBtn.textContent = '💡 Hint 提示（不扣分）';
          else hintBtn.textContent = '💡 Hint 提示（這題算錯）';
        }
        // capture phase: counted before the speller's own handler (a hint can finish the word)
        sp.addEventListener('click', (e) => { if (hintBtn && e.target === hintBtn) hints++; }, true);
        sp.querySelectorAll('.letter-tile').forEach((b) => b.setAttribute('aria-label', 'Letter ' + b.textContent + ' 字母'));
        st.body.append(card, u.el('div', { class: 'l14c-box' }, sp));
        const letters = EP.spellKey(item).replace(/ /g, '').split('');
        const tiles = () => Array.from(sp.querySelectorAll('.letter-tile'));
        const spellRest = () => {
          for (let guard = 0; guard < 40 && !answered; guard++) {
            const filled = tiles().filter((x) => x.classList.contains('used')).length;
            if (filled >= letters.length) break;
            const want = letters[filled].toLowerCase();
            const tl = tiles().find((x) => !x.classList.contains('used') && x.textContent.toLowerCase() === want);
            if (!tl) break; tl.click();
          }
        };
        T.set(spellRest, () => {
          const filled = tiles().filter((x) => x.classList.contains('used')).length;
          const want = (letters[filled] || '').toLowerCase();
          const bad = tiles().find((x) => !x.classList.contains('used') && x.textContent.toLowerCase() !== want);
          if (bad) { bad.click(); spellRest(); } else finish(false);
        });
      }));
      return { test: T.api };
    },
  });
})();
