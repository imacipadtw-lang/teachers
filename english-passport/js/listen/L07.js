/* Sentence Listening — Level 7 (Numbers): COUNT_PLACE, KEYPAD, ELEVATOR
 * L07a Bakery Counter: hear how many, put exactly that many things on the tray with + / − / +5, then Serve.
 * L07b Phone Keypad: type the number heard in the sentence on a phone keypad (first/second/third → 1/2/3).
 * L07c Elevator Ride: press the floor button with the number heard; the elevator rides there. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;
  const numOf = (w) => L.NUM[w.word.toLowerCase()];
  const centre = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* the thing counted in each sentence (the noun right after the number) → [emoji, Chinese] */
  const OBJ = { dog: ['🐶', '狗'], brother: ['👦', '哥哥'], cat: ['🐱', '貓'], candy: ['🍬', '糖果'], book: ['📘', '書'], ball: ['⚽', '球'], pencil: ['✏️', '鉛筆'], friend: ['🧑', '朋友'], star: ['⭐', '星星'], apple: ['🍎', '蘋果'], sticker: ['🏷️', '貼紙'], bird: ['🐦', '鳥'], balloon: ['🎈', '氣球'], toy: ['🧸', '玩具'] };
  const objOf = (item) => {
    const toks = L.tokens(item.sentence); const k = L.key(item);
    const i = k ? k.index : toks.findIndex((t) => L.NUM[t.w] != null);
    const t = toks[i + 1]; if (!t) return ['🥐', '麵包'];
    const w = t.w; const sing = [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, '')];
    for (const s of sing) if (OBJ[s]) return OBJ[s];
    return ['🥐', '麵包'];
  };

  L.css('L07', `
.l07a-shop{display:flex;flex-direction:column;align-items:center;gap:clamp(8px,2vh,14px);width:100%;max-width:760px}
.l07a-counter{display:flex;align-items:center;gap:12px;background:#fff;color:#1d2340;border-radius:18px;padding:8px 14px;box-shadow:0 5px 0 rgba(0,0,0,.2)}
.l07a-cust{font-size:clamp(2.2rem,7vw,3rem);line-height:1}
.l07a-ticket{display:flex;flex-direction:column;align-items:flex-start;font-weight:900}
.l07a-ticket small{font-weight:800;color:#495057}
.l07a-want{display:flex;align-items:center;gap:6px;font-size:1.15rem}
.l07a-tray{position:relative;width:100%;min-height:clamp(150px,30vh,230px);border-radius:26px;background:radial-gradient(circle at 50% 40%,#fff9db,#ffec99 70%,#fcc419);border:8px solid #e8590c;box-shadow:0 10px 0 rgba(0,0,0,.22),inset 0 0 0 3px rgba(255,255,255,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 10px;transition:transform .5s ease}
.l07a-row{display:flex;gap:clamp(2px,1vw,8px);justify-content:center}
.l07a-group{display:flex;gap:clamp(1px,.6vw,4px);padding:2px 6px;border-radius:12px;background:rgba(232,89,12,.12)}
.l07a-obj{font-size:clamp(1.45rem,6vw,2.1rem);line-height:1.15;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l07a-obj.l07a-new{animation:l07a-pop .25s ease}
@keyframes l07a-pop{from{transform:scale(.2)}}
.l07a-empty{font-weight:800;color:#7a4b00}
.l07a-count{position:absolute;top:-16px;right:6px;min-width:52px;height:52px;border-radius:26px;background:#1d2340;color:#fff;font-weight:900;font-size:1.6rem;display:flex;align-items:center;justify-content:center;padding:0 8px;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.l07a-tray.l07a-served{transform:translateY(-30px) scale(.92)}
.l07a-pad{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.l07a-pad .btn{min-width:74px}
.l07b-phone{width:clamp(250px,74vw,320px);background:linear-gradient(160deg,#343a40,#1d2024);border-radius:36px;padding:14px 14px 16px;box-shadow:0 14px 0 rgba(0,0,0,.35),inset 0 0 0 3px #495057;display:flex;flex-direction:column;gap:10px}
.l07b-screen{background:linear-gradient(160deg,#e7f5ff,#d0ebff);color:#1d2340;border-radius:22px;padding:10px 12px;text-align:center;min-height:clamp(84px,14vh,110px);display:flex;flex-direction:column;justify-content:center;gap:2px}
.l07b-call{font-weight:800;font-size:.9rem;color:#1864ab}
.l07b-num{font-weight:900;font-size:clamp(2rem,8vw,2.6rem);letter-spacing:4px;min-height:1.2em;font-variant-numeric:tabular-nums}
.l07b-num.l07b-ph{color:#495057;letter-spacing:8px}
.l07b-num.ok{color:#2b8a3e}.l07b-num.bad{color:#c92a2a}
.l07b-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(6px,1.4vh,10px)}
.l07b-key{border:0;border-radius:50%;aspect-ratio:1;max-height:clamp(46px,8.6vh,70px);justify-self:center;width:100%;max-width:clamp(46px,8.6vh,70px);background:#495057;color:#fff;font:inherit;font-weight:900;font-size:clamp(1.3rem,3.6vh,1.7rem);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.4)}
.l07b-key small{font-size:.55rem;font-weight:800;letter-spacing:1px;color:#dee2e6}
.l07b-key:active{transform:translateY(2px)}
.l07b-key.del{background:#862e9c}.l07b-key.go{background:#2b8a3e}
.l07b-key:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l07c-lift{display:flex;gap:clamp(10px,3vw,26px);align-items:stretch;justify-content:center;width:100%;max-width:760px}
.l07c-shaft{position:relative;width:clamp(96px,24vw,170px);border-radius:16px;background:linear-gradient(90deg,#868e96,#adb5bd 50%,#868e96);box-shadow:inset 0 0 0 4px #495057;min-height:clamp(250px,52vh,420px)}
.l07c-tick{position:absolute;left:0;right:0;border-bottom:2px dashed rgba(29,35,64,.45);font-weight:900;font-size:.8rem;line-height:1.1;color:#1d2340;padding-left:5px}
.l07c-car{position:absolute;right:8px;width:clamp(44px,48%,90px);height:clamp(40px,8vh,60px);border-radius:10px;background:#f8f9fa;border:4px solid #343a40;display:flex;align-items:center;justify-content:center;font-size:clamp(1.4rem,4.5vw,2rem);transition:bottom .9s ease-in-out;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.l07c-car.l07c-fast{transition:none}
.l07c-panel{display:flex;flex-direction:column;align-items:center;gap:10px;background:linear-gradient(160deg,#ced4da,#adb5bd);border-radius:22px;padding:12px;box-shadow:0 8px 0 rgba(0,0,0,.25),inset 0 0 0 3px #f8f9fa}
.l07c-disp{min-width:130px;background:#111;color:#ffa94d;font-weight:900;font-size:clamp(1.6rem,6vw,2.2rem);border-radius:10px;padding:4px 14px;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:2px}
.l07c-btns{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(8px,1.6vh,14px)}
.l07c-btn{width:clamp(56px,9.5vh,76px);height:clamp(56px,9.5vh,76px);border-radius:50%;border:4px solid #868e96;background:radial-gradient(circle at 40% 35%,#ffffff,#dee2e6);color:#1d2340;font:inherit;font-weight:900;font-size:clamp(1.05rem,3vh,1.4rem);cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3)}
.l07c-btn.l07c-long{font-size:clamp(.9rem,2.4vh,1.1rem)}
.l07c-btn:focus-visible{outline:4px solid #1971c2;outline-offset:3px}
.l07c-btn.lit{border-color:#fd7e14;box-shadow:0 0 0 4px #ffc078,0 0 18px #ff922b}
.l07c-btn.ok{background:#2b8a3e;color:#fff;border-color:#1e6b2f}
.l07c-btn.bad{background:#c92a2a;color:#fff;border-color:#a51111}
.l07c-btn.show{border-color:#2b8a3e;box-shadow:0 0 0 5px #8ce99a}
.l07c-door{font-weight:800;font-size:.9rem;color:#1d2340}
`);

  /* ---------- L07a Bakery Counter (COUNT_PLACE) ---------- */
  L.register({
    id: 'L07a',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#fff4e6,#ffd8a8 60%,#e8590c)', dark: false });
      const MAX = 25;
      const showCount = ctx.difficulty !== 'hard';
      const want = u.el('div', { class: 'l07a-want' });
      const ticket = u.el('div', { class: 'l07a-ticket' }, u.el('small', {}, '🧾 Order 訂單'), want, u.el('small', {}, 'How many? 要幾個？聽句子！'));
      const counter = u.el('div', { class: 'l07a-counter' }, u.el('span', { class: 'l07a-cust', 'aria-hidden': 'true' }, '🧑‍🍳'), ticket);
      const countEl = u.el('div', { class: 'l07a-count', 'aria-live': 'polite' }, '0');
      const tray = u.el('div', { class: 'l07a-tray', role: 'img' });
      const minus = u.el('button', { class: 'btn', 'aria-label': 'Take one away 拿走一個', onclick: () => add(-1) }, '− 1');
      const plus = u.el('button', { class: 'btn blue', 'aria-label': 'Add one 加一個', onclick: () => add(1) }, '+ 1');
      const plus5 = u.el('button', { class: 'btn purple', 'aria-label': 'Add five 加五個', onclick: () => add(5) }, '+ 5');
      const reset = u.el('button', { class: 'btn small', 'aria-label': 'Empty the tray 清空托盤', onclick: () => add(-MAX) }, '↺ 0');
      st.body.append(u.el('div', { class: 'l07a-shop' }, counter, tray, u.el('div', { class: 'l07a-pad' }, minus, plus, plus5, reset)));
      const serveBtn = u.el('button', { class: 'btn go big', onclick: () => serve() }, '🛎️ Serve 送出');
      st.foot.append(serveBtn);
      let cur = null;

      const draw = (added) => {
        const n = cur.count; tray.innerHTML = '';
        if (showCount) { countEl.textContent = n; tray.appendChild(countEl); }
        if (!n) tray.appendChild(u.el('span', { class: 'l07a-empty zh' }, 'Empty tray 托盤是空的'));
        // rows of ten, in groups of five (easy to count)
        for (let r = 0; r * 10 < n; r++) {
          const row = u.el('div', { class: 'l07a-row' });
          for (let g = 0; g < 2 && r * 10 + g * 5 < n; g++) {
            const grp = u.el('div', { class: 'l07a-group' });
            for (let j = 0; j < 5; j++) { const idx = r * 10 + g * 5 + j; if (idx >= n) break; grp.appendChild(u.el('span', { class: 'l07a-obj' + (idx >= n - added ? ' l07a-new' : '') }, cur.obj[0])); }
            row.appendChild(grp);
          }
          tray.appendChild(row);
        }
        tray.setAttribute('aria-label', `Tray 托盤：${n} ${cur.obj[1]}`);
        minus.disabled = n <= 0; plus.disabled = n >= MAX; plus5.disabled = n > MAX - 5;
      };
      const add = (d) => {
        if (!cur || cur.answered) return;
        const before = cur.count; cur.count = u.clamp(cur.count + d, 0, MAX);
        if (cur.count === before) return;
        d > 0 ? EP.sfx.pop() : EP.sfx.click();
        draw(Math.max(0, cur.count - before));
      };
      const serve = () => {
        if (!cur || cur.answered) return;
        if (!cur.count) { ctx.toast('托盤是空的 The tray is empty'); ctx.shake(tray); return; }
        cur.answered = true; serveBtn.disabled = true;
        const { item, n, count, done } = cur; const ok = count === n;
        if (ok) { tray.classList.add('l07a-served'); EP.sfx.coin(); } else ctx.shake(tray);
        const p = centre(ctx, tray);
        ctx.timeout(() => L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: `要 ${n} 個${cur.obj[1]}，你放了 ${count} 個 They wanted ${n}` }).then(() => { tray.classList.remove('l07a-served'); done(); }), 400);
      };

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🥐 客人說要幾個？聽句子，按＋／－把托盤調到正確數量，再按送出。', 'Use + and − to put the right number on the tray.'), L.listenBar(ctx, item));
        const obj = objOf(item);
        want.innerHTML = ''; want.append(u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, obj[0]), u.el('span', { class: 'zh' }, obj[1]), ' × ?');
        cur = { item, n: numOf(item), obj, count: 0, answered: false, done };
        serveBtn.disabled = false; draw(0);
        const setTo = (k) => { add(-MAX); while (cur.count + 5 <= k) add(5); while (cur.count < k) add(1); serve(); };
        T.set(() => setTo(cur.n), () => setTo(cur.n >= MAX ? cur.n - 1 : cur.n + 1));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L07b Phone Keypad (KEYPAD) ---------- */
  const LETTERS = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ', 0: '+' };
  L.register({
    id: 'L07b',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(165deg,#0b7285,#1864ab 60%,#3b5bdb)' });
      const MAXLEN = 4;
      const num = u.el('div', { class: 'l07b-num', 'aria-live': 'polite' });
      const callLine = u.el('div', { class: 'l07b-call' });
      const screen = u.el('div', { class: 'l07b-screen' }, callLine, num);
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'go'].map((k) => {
        const b = k === 'del' ? u.el('button', { class: 'l07b-key del', 'aria-label': 'Delete 刪除' }, '⌫')
          : k === 'go' ? u.el('button', { class: 'l07b-key go', 'aria-label': 'OK 確認' }, '✓')
            : u.el('button', { class: 'l07b-key', 'aria-label': k }, k, LETTERS[k] ? u.el('small', { 'aria-hidden': 'true' }, LETTERS[k]) : null);
        ctx.on(b, 'click', () => (k === 'del' ? del() : k === 'go' ? submit() : press(k)));
        return b;
      });
      st.body.append(u.el('div', { class: 'l07b-phone', role: 'group', 'aria-label': 'Phone 手機' }, screen, u.el('div', { class: 'l07b-keys' }, keys)));
      let cur = null;
      const show = () => {
        num.className = 'l07b-num';
        if (ctx.difficulty === 'easy' && cur.typed.length < cur.ans.length) { num.textContent = cur.typed.padEnd(cur.ans.length, '_'); if (!cur.typed) num.classList.add('l07b-ph'); }
        else if (cur.typed) num.textContent = cur.typed;
        else { num.textContent = '—'; num.classList.add('l07b-ph'); }
        num.setAttribute('aria-label', cur.typed ? 'Typed 已輸入 ' + cur.typed : 'Nothing typed 尚未輸入');
      };
      const press = (d) => {
        if (!cur || cur.answered) return;
        if (cur.typed.length >= MAXLEN) { ctx.shake(screen); return; }
        cur.typed += d; EP.sfx.tick(); show();
      };
      const del = () => { if (!cur || cur.answered || !cur.typed) return; cur.typed = cur.typed.slice(0, -1); EP.sfx.click(); show(); };
      const submit = () => {
        if (!cur || cur.answered) return;
        if (!cur.typed) { ctx.toast('先輸入數字 Type a number first'); ctx.shake(screen); return; }
        cur.answered = true;
        const { item, ans, done } = cur; const typed = cur.typed.replace(/^0+(?=\d)/, '');
        const ok = typed === ans;
        num.classList.add(ok ? 'ok' : 'bad'); callLine.textContent = ok ? '✅ Saved 已記下' : '❌ Wrong number 號碼不對';
        const p = centre(ctx, screen);
        L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: `是 ${ans}，不是 ${typed} It is ${ans}` }).then(done);
      };
      // physical keyboard: digits, Backspace, Enter
      ctx.on(window, 'keydown', (e) => {
        if (!cur || cur.answered || e.ctrlKey || e.metaKey || e.altKey) return;
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); del(); }
        else if (e.key === 'Enter' && !keys.includes(e.target)) { e.preventDefault(); submit(); } // Enter on a keypad key presses that key
      });

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('📱 聽句子，用數字鍵盤輸入你聽到的數字，再按 ✓。', 'Type the number you hear on the keypad.'), L.listenBar(ctx, item));
        cur = { item, ans: String(numOf(item)), typed: '', answered: false, done };
        callLine.textContent = '📞 Note the number 記下數字';
        show();
        const typeIt = (s) => { if (!cur || cur.answered) return; while (cur.typed) del(); s.split('').forEach(press); submit(); };
        T.set(() => typeIt(cur.ans), () => typeIt(String(+cur.ans + 1)));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L07c Elevator Ride (ELEVATOR) ---------- */
  const PAIR = { 13: 30, 30: 13, 14: 40, 40: 14, 15: 50, 50: 15, 17: 70, 70: 17, 18: 80, 80: 18, 100: 1000, 1000: 100 };
  L.register({
    id: 'L07c',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#212529,#495057 55%,#868e96)' });
      const values = Array.from(new Set(Object.values(L.NUM))).sort((a, b) => a - b);
      const nOthers = ctx.difficulty === 'easy' ? 5 : ctx.difficulty === 'hard' ? 7 : 6;
      const shaft = u.el('div', { class: 'l07c-shaft', 'aria-hidden': 'true' });
      const car = u.el('div', { class: 'l07c-car' }, '🛗');
      const disp = u.el('div', { class: 'l07c-disp', role: 'status', 'aria-label': 'Floor 樓層' }, 'L');
      const door = u.el('div', { class: 'l07c-door zh' }, '🚪 Lobby 大廳');
      const btnBox = u.el('div', { class: 'l07c-btns', role: 'group', 'aria-label': 'Floor buttons 樓層按鈕' });
      st.body.append(u.el('div', { class: 'l07c-lift' }, shaft, u.el('div', { class: 'l07c-panel' }, disp, btnBox, door)));
      let cur = null; let anim = null; let shown = 0;
      ctx.loop((dt) => {
        if (!anim) return;
        anim.t += dt; const p = Math.min(1, anim.t / anim.dur); const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const v = Math.round(anim.from + (anim.to - anim.from) * e);
        if (v !== shown) { shown = v; disp.textContent = (anim.to >= anim.from ? '▲ ' : '▼ ') + v; }
        if (p >= 1) { const a = anim; anim = null; disp.textContent = String(a.to); a.done(); }
      });
      const posOf = (i, n) => 8 + (i + 1) * (84 / (n + 1)); // % from the bottom

      const press = (b) => {
        if (!cur || cur.answered) return; cur.answered = true;
        const { item, ans, list, done } = cur; const v = b._v; const ok = v === ans;
        b.classList.add('lit'); EP.sfx.click();
        const dur = reduced() ? 0.2 : 0.9;
        car.style.transition = reduced() ? 'none' : ''; car.style.bottom = posOf(list.indexOf(v), list.length) + '%';
        anim = {
          from: cur.at, to: v, t: 0, dur, done: () => {
            b.classList.remove('lit'); b.classList.add(ok ? 'ok' : 'bad');
            door.textContent = ok ? `🔔 Ding! Floor ${v} 到了` : `❌ Floor ${v} 樓層不對`;
            if (!ok) btns.find((x) => x._v === ans).classList.add('show');
            ok ? EP.sfx.coin() : null;
            const p = centre(ctx, b);
            L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: `要去 ${ans} 樓 Floor ${ans}` }).then(done);
          },
        };
      };
      let btns = [];

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🛗 聽電梯廣播的句子，按下你聽到的數字樓層！', 'Press the button with the number you hear.'), L.listenBar(ctx, item));
        const ans = numOf(item);
        // distractors: the teen/ty twin and neighbours first (13 ↔ 30, 14 ↔ 40 …), then other numbers of the level
        const near = [PAIR[ans], ans + 1, ans - 1, ans + 10, ans - 10].filter((v) => v != null && v !== ans && values.includes(v));
        const pick = [];
        u.shuffle(near).slice(0, 3).forEach((v) => { if (!pick.includes(v)) pick.push(v); });
        if (PAIR[ans] != null && !pick.includes(PAIR[ans])) pick[0] = PAIR[ans];
        u.shuffle(values.filter((v) => v !== ans && !pick.includes(v))).forEach((v) => { if (pick.length < nOthers) pick.push(v); });
        const list = [ans].concat(pick).sort((a, b) => a - b);
        // panel: highest floor on top
        btnBox.innerHTML = '';
        btns = list.slice().reverse().map((v) => { const b = u.el('button', { class: 'l07c-btn' + (String(v).length > 3 ? ' l07c-long' : ''), 'aria-label': `Floor ${v} 樓` }, String(v)); b._v = v; ctx.on(b, 'click', () => press(b)); btnBox.appendChild(b); return b; });
        shaft.innerHTML = '';
        list.forEach((v, i) => shaft.appendChild(u.el('div', { class: 'l07c-tick', style: { bottom: posOf(i, list.length) + '%' } }, String(v))));
        shaft.appendChild(car);
        car.style.transition = 'none'; car.style.bottom = '6%'; void car.offsetWidth; car.style.transition = '';
        disp.textContent = 'L'; door.textContent = '🚪 Lobby 大廳';
        cur = { item, ans, list, at: list[0], answered: false, done };
        T.set(() => press(btns.find((b) => b._v === ans)), () => press(btns.find((b) => b._v !== ans)));
      }));
      return { test: T.api };
    },
  });
})();
