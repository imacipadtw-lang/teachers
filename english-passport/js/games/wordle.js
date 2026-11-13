/* Level 22 — Word Detective (inspired by Wordle from The New York Times)
 * Clue = picture/Chinese + audio. Guess the verb in 6 tries; tiles flip green / yellow / grey
 * and the keyboard remembers the colours. Any letters are accepted (no dictionary), but a guess must be full length.
 * One ctx.answer per puzzle (solved = true). A share-style result row of coloured squares ends each case. */
(function () {
  const EP = window.EP, u = EP.u;
  const ROWS = 6;
  const PRAISE = ['Genius! 天才！', 'Magnificent! 太厲害了！', 'Impressive! 好棒！', 'Splendid! 很好！', 'Great! 不錯！', 'Phew! 好險！'];
  const SQ = { correct: '🟩', present: '🟨', absent: '⬜' };
  const CSS = `
  .wd{position:absolute;inset:0;display:flex;justify-content:center;padding:8px}
  .wd-city{position:absolute;left:0;right:0;bottom:0;height:34%;display:flex;align-items:flex-end;gap:3px;pointer-events:none;opacity:.9}
  .wd-bld{flex:1;background-color:#141b3d;background-image:repeating-linear-gradient(0deg,transparent 0 9px,rgba(255,224,102,.55) 9px 13px),repeating-linear-gradient(90deg,#141b3d 0 7px,transparent 7px 12px);border-radius:3px 3px 0 0}
  .wd-card{position:relative;z-index:2;width:min(560px,100%);height:100%;background:#fff;color:#1a1a1b;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;padding:8px 8px 10px;gap:8px;overflow:hidden}
  .wd-clue{display:flex;align-items:center;gap:10px;width:100%;justify-content:center;border-bottom:1px solid #d3d6da;padding-bottom:8px;flex-wrap:wrap}
  .wd-say{width:56px;height:56px;border-radius:50%;background:#6aaa64;color:#fff;font-size:1.5rem;box-shadow:0 4px 0 #4c8048;flex:none}
  .wd-say.slow{background:#c9b458;box-shadow:0 4px 0 #9c8b3f;font-size:1.3rem}
  .wd-pic{font-size:2.8rem;line-height:1}
  .wd-zh{font-size:1.4rem;font-weight:900;font-family:var(--font-zh);color:#3a3a3c}
  .wd-lab{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
  .wd-lab small{font-weight:800;color:#787c7e;font-size:.85rem;letter-spacing:.06em}
  .wd-hint{font-weight:900;font-size:1.25rem;letter-spacing:.18em;color:#b59f3b;font-family:ui-monospace,monospace}
  .wd-board{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:var(--g)}
  .wd-row{display:flex;gap:var(--g);justify-content:center}
  .wd-row.shake{animation:shake .35s}
  .wd-t{width:var(--ts);height:var(--ts);border:2px solid #d3d6da;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:calc(var(--ts)*.55);text-transform:uppercase;color:#1a1a1b;user-select:none;font-family:'Helvetica Neue',Arial,sans-serif}
  .wd-t.fill{border-color:#878a8c;animation:wdPop .1s}
  .wd-t.given{border-color:#6aaa64;color:#6aaa64}
  .wd-t.correct{background:#6aaa64;border-color:#6aaa64;color:#fff}
  .wd-t.present{background:#c9b458;border-color:#c9b458;color:#fff}
  .wd-t.absent{background:#787c7e;border-color:#787c7e;color:#fff}
  .wd-t.flip{animation:wdFlip .5s ease-in-out}
  .wd-t.win{animation:wdJump .5s ease}
  @keyframes wdPop{50%{transform:scale(1.12)}}
  @keyframes wdFlip{0%{transform:rotateX(0)}50%{transform:rotateX(-90deg)}100%{transform:rotateX(0)}}
  @keyframes wdJump{0%,100%{transform:translateY(0)}40%{transform:translateY(-30%)}60%{transform:translateY(5%)}}
  .wd-kb{width:100%;display:flex;flex-direction:column;gap:6px}
  .wd-kr{display:flex;gap:5px;justify-content:center}
  .wd-k{flex:1;max-width:56px;height:58px;border-radius:6px;background:#d3d6da;color:#1a1a1b;font-weight:900;font-size:1.3rem;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;touch-action:manipulation;padding:0}
  .wd-k.wide{flex:1.6;max-width:86px;font-size:.95rem}
  .wd-k:active{filter:brightness(.85)}
  .wd-k.correct{background:#6aaa64;color:#fff}.wd-k.present{background:#c9b458;color:#fff}.wd-k.absent{background:#787c7e;color:#fff}
  .wd-res{position:absolute;inset:0;z-index:20;background:rgba(255,255,255,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center;animation:fadeIn .3s}
  .wd-res .t{font-size:1.7rem;font-weight:900}
  .wd-res .w{font-size:2.2rem;font-weight:900;letter-spacing:.06em}
  .wd-res .z{font-size:1.3rem;font-family:var(--font-zh);color:#3a3a3c}
  .wd-share{background:#f6f7f8;border:2px dashed #d3d6da;border-radius:14px;padding:10px 18px;font-size:1.05rem;font-weight:800;line-height:1.25;white-space:pre;font-family:ui-monospace,monospace}
  .wd-dist{width:min(360px,90%);display:flex;flex-direction:column;gap:4px;font-weight:900}
  .wd-dist div{display:flex;align-items:center;gap:6px}.wd-dist i{display:block;background:#787c7e;color:#fff;font-style:normal;text-align:right;padding:2px 8px;min-width:26px}
  .wd-dist i.hi{background:#6aaa64}`;

  EP.registerGame({
    id: 'wordle', level: 22, icon: '🟩', title: 'Word Detective', titleZh: '單字偵探',
    model: 'Wordle（紐約時報猜字遊戲）',
    howZh: '看圖、聽發音，猜出這個動詞！綠色＝字母和位置都對，黃色＝有這個字母但位置不對，灰色＝沒有這個字母。',
    howEn: 'Guess the verb in 6 tries. Green = right spot, yellow = wrong spot, grey = not in the word.',
    skills: ['listening', 'meaning', 'spelling'],
    start(ctx) {
      const root = ctx.root, D = ctx.difficulty;
      root.style.background = 'linear-gradient(#0d1333 0%, #26357a 55%, #4a5bb0 100%)';
      root.appendChild(u.el('style', {}, CSS));
      const city = u.el('div', { class: 'wd-city' });
      for (let i = 0; i < 22; i++) city.appendChild(u.el('div', { class: 'wd-bld', style: { height: u.randInt(30, 100) + '%', flex: u.rand(0.6, 1.6) } }));
      root.appendChild(city);
      const wrap = u.el('div', { class: 'wd' }); root.appendChild(wrap);
      const card = u.el('div', { class: 'wd-card' }); wrap.appendChild(card);
      const clue = u.el('div', { class: 'wd-clue' }); const board = u.el('div', { class: 'wd-board' }); const kb = u.el('div', { class: 'wd-kb' });
      card.append(clue, board, kb);

      const keyEls = {};
      [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back']].forEach((row) => {
        const r = u.el('div', { class: 'wd-kr' });
        for (const k of row) {
          const b = u.el('button', { class: 'wd-k' + (k.length > 1 ? ' wide' : ''), 'aria-label': k }, k === 'enter' ? 'ENTER ✔' : k === 'back' ? '⌫' : k);
          ctx.on(b, 'click', () => press(k)); keyEls[k] = b; r.appendChild(b);
        }
        kb.appendChild(r);
      });
      ctx.on(window, 'keydown', (e) => {
        if (ctx.paused || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (k === 'enter') { e.preventDefault(); press('enter'); } else if (k === 'backspace') { e.preventDefault(); press('back'); } else if (/^[a-z]$/.test(k)) press(k);
      });

      const items = ctx.items; let idx = 0, item = null, ans = '', L = 0, r = 0, cur = [], rowEls = [], hist = [], phase = 'busy', resEl = null, autoNext = 0, hintEl = null;
      const dist = [0, 0, 0, 0, 0, 0]; let solvedN = 0;
      const GIVEN = D === 'easy' ? 1 : 0;

      function size() {
        const bh = board.clientHeight || 300, bw = card.clientWidth - 20; const gap = 6;
        const ts = Math.floor(Math.min(66, (bw - gap * (L - 1)) / L, (bh - gap * (ROWS - 1)) / ROWS));
        board.style.setProperty('--ts', Math.max(30, ts) + 'px'); board.style.setProperty('--g', gap + 'px');
      }
      const ro = new ResizeObserver(() => L && size()); ro.observe(card);

      function setup() {
        if (idx >= items.length) return finish();
        item = items[idx]; ctx.hud.progress(idx / items.length);
        ans = EP.spellKey(item).toLowerCase().replace(/[^a-z]/g, ''); L = ans.length; r = 0; cur = []; hist = [];
        clue.innerHTML = '';
        const pic = EP.pic(item);
        hintEl = u.el('div', { class: 'wd-hint' });
        clue.append(...[u.el('button', { class: 'wd-say', title: 'Listen 再聽一次', onclick: () => ctx.say(item) }, '🔊'),
          u.el('button', { class: 'wd-say slow', title: 'Slow 慢速', onclick: () => ctx.say(item, { slow: true }) }, '🐢'),
          pic ? u.el('div', { class: 'wd-pic' }, pic) : null,
          u.el('div', { class: 'wd-lab' }, u.el('small', {}, `🕵️ CASE ${idx + 1} · ${L} LETTERS`), (!pic || (D !== 'hard' && EP.settings.showChinese)) ? u.el('div', { class: 'wd-zh' }, item.zh) : null, hintEl)].filter(Boolean));
        board.innerHTML = ''; rowEls = [];
        for (let i = 0; i < ROWS; i++) { const row = u.el('div', { class: 'wd-row' }); const ts = []; for (let j = 0; j < L; j++) { const t = u.el('div', { class: 'wd-t' }); ts.push(t); row.appendChild(t); } board.appendChild(row); rowEls.push({ row, ts }); }
        for (const k in keyEls) keyEls[k].classList.remove('correct', 'present', 'absent');
        size(); newRow(); phase = 'input';
        ctx.timeout(() => ctx.say(item), 300);
      }
      function newRow() { cur = ans.slice(0, GIVEN).split(''); paint(); updateHint(); }
      function paint() {
        const { ts } = rowEls[r];
        ts.forEach((t, j) => { const ch = cur[j] || ''; if (t.textContent !== ch) { t.textContent = ch; t.classList.toggle('fill', !!ch); } t.classList.toggle('given', j < GIVEN && !!ch); });
      }
      function updateHint() {
        const misses = r; const show = misses >= 4 ? Math.ceil(L / 2) : misses >= 2 || (D === 'easy' && misses >= 1) ? GIVEN + 1 : GIVEN;
        hintEl.textContent = show > 0 ? '💡 ' + ans.split('').map((ch, i) => (i < show ? ch : '_')).join(' ') : '';
      }
      function press(k) {
        if (phase === 'result') { if (k === 'enter') next(); return; }
        if (phase !== 'input') return;
        if (k === 'enter') return submit(false);
        if (k === 'back') { if (cur.length > GIVEN) { cur.pop(); paint(); } return; }
        if (cur.length < L) { cur.push(k); paint(); EP.sfx.click(); }
      }
      function score(guess) {
        const res = Array(L).fill('absent'); const cnt = {};
        for (let i = 0; i < L; i++) { if (guess[i] === ans[i]) res[i] = 'correct'; else cnt[ans[i]] = (cnt[ans[i]] || 0) + 1; }
        for (let i = 0; i < L; i++) if (res[i] !== 'correct' && cnt[guess[i]] > 0) { res[i] = 'present'; cnt[guess[i]]--; }
        return res;
      }
      function submit(fast) {
        if (cur.length < L) {
          const { row } = rowEls[r]; row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
          EP.sfx.wrong(); ctx.toast(`Not enough letters 需要 ${L} 個字母`); return;
        }
        const guess = cur.join(''); const res = score(guess); hist.push(res); phase = 'flipping';
        const { ts } = rowEls[r]; const st = fast ? 0 : 300;
        ts.forEach((t, i) => {
          const flip = () => { t.classList.add('flip'); EP.sfx.tick(); ctx.timeout(() => { t.classList.remove('fill', 'given'); t.classList.add(res[i]); }, fast ? 0 : 250); };
          fast ? flip() : ctx.timeout(flip, i * st);
        });
        const done = () => {
          guess.split('').forEach((ch, i) => { const k = keyEls[ch]; if (!k) return; const rank = { correct: 3, present: 2, absent: 1 }; const now = ['absent', 'present', 'correct'].find((c) => k.classList.contains(c)); if (!now || rank[res[i]] > rank[now]) { k.classList.remove('correct', 'present', 'absent'); k.classList.add(res[i]); } });
          r++;
          if (guess === ans) return solved();
          if (r >= ROWS) return failed();
          phase = 'input'; newRow(); if (r >= 2) ctx.say(item);
        };
        fast ? done() : ctx.timeout(done, L * st + 320);
      }
      function solved() {
        phase = 'won'; solvedN++; dist[r - 1]++;
        const rr = rowEls[r - 1]; rr.ts.forEach((t, i) => ctx.timeout(() => t.classList.add('win'), i * 90));
        const b = rr.row.getBoundingClientRect(), R = root.getBoundingClientRect();
        ctx.answer(item, true, { x: b.left - R.left + b.width / 2, y: b.top - R.top - 10, points: 100 + (ROWS - r) * 25 });
        ctx.burst(PRAISE[r - 1]); if (r <= 3) ctx.confetti();
        ctx.say(item);
        ctx.timeout(() => showResult(true), 1500);
      }
      async function failed() {
        phase = 'won';
        ctx.answer(item, false, {});
        await ctx.reveal(item);
        showResult(false);
      }
      function showResult(win) {
        phase = 'result';
        const grid = hist.map((row) => row.map((s) => SQ[s]).join('')).join('\n');
        resEl = u.el('div', { class: 'wd-res' },
          u.el('div', { class: 't' }, win ? '🕵️ Case solved! 破案了！' : '🔎 Case closed 下次加油！'),
          u.el('div', { class: 'w' }, item.word), u.el('div', { class: 'z' }, (EP.pic(item) || '') + ' ' + item.zh),
          u.el('div', { class: 'wd-share' }, `Word Detective #${idx + 1}  ${win ? hist.length : 'X'}/${ROWS}\n${grid}`),
          u.el('button', { class: 'btn go big', onclick: next }, 'Next case ▶ 下一題'));
        card.appendChild(resEl);
        autoNext = ctx.timeout(next, 4500);
      }
      function next() {
        if (phase !== 'result') return; phase = 'busy'; clearTimeout(autoNext);
        resEl && resEl.remove(); resEl = null; idx++; setup();
      }
      function finish() {
        phase = 'done'; ctx.hud.progress(1);
        const max = Math.max(1, ...dist);
        resEl = u.el('div', { class: 'wd-res' },
          u.el('div', { style: { fontSize: '3rem' } }, '🕵️‍♀️'), u.el('div', { class: 't' }, 'Detective Report 偵探報告'),
          u.el('div', { style: { fontSize: '1.2rem', fontWeight: 800 } }, `Solved ${solvedN} / ${items.length} cases`),
          u.el('div', { style: { fontWeight: 900, color: '#787c7e', fontSize: '.95rem' } }, 'GUESS DISTRIBUTION'),
          u.el('div', { class: 'wd-dist' }, dist.map((n, i) => u.el('div', {}, String(i + 1), u.el('i', { class: n === max && n ? 'hi' : '', style: { width: Math.max(8, (n / max) * 100) + '%' } }, n)))));
        card.appendChild(resEl); EP.sfx.win(); if (solvedN) ctx.confetti();
        ctx.timeout(() => ctx.end(), 3000);
      }

      setup();
      return {
        destroy() { ro.disconnect(); },
        test: {
          correct() {
            if (phase === 'result') return next();
            if (phase !== 'input') return;
            cur = ans.split(''); paint(); submit(true);
          },
          wrong() {
            if (phase === 'result') return next();
            let guard = ROWS;
            while (phase === 'input' && guard--) {
              cur = ans.split('').map((ch, i) => (i < GIVEN ? ch : String.fromCharCode(97 + ((ch.charCodeAt(0) - 97 + 1 + i) % 26))));
              if (cur.join('') === ans) cur[L - 1] = ans[L - 1] === 'z' ? 'a' : 'z';
              paint(); submit(true);
            }
          },
        },
      };
    },
  });
})();
