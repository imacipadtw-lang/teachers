/* Sentence Listening — Level 21 (Drinks · Meals · Festival food): VENDING, SPIN_WHEEL, TOWER_STACK
 * L21a Vending Machine — find the item from the sentence in a 3×3 machine and press its code (letter + number).
 * L21b Flavor Wheel — press STOP when the pointer is on the food/drink from the sentence.
 * L21c Dessert Tower — pick the picture; every right answer stacks a layer, a wrong one makes the tower wobble. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen, el = u.el;

  /* pictures for the level-21 words that have no emoji of their own (always shown together with the Chinese) */
  const EXTRA = { roast: '🍗', lunch: '🍱', breakfast: '🍳', dinner: '🍽️' };
  const KEEP_ZH = new Set(['roast', 'lunch', 'breakfast', 'dinner', 'salty', 'pork', 'tea', 'coffee', 'water']);
  const lw = (w) => String(w.word).toLowerCase();
  const picOf = (w) => EP.pic(w) || EXTRA[lw(w)] || '';
  /** picture + Chinese (hard: picture only when the picture is clear) */
  const face = (w, hideZh, cls) => {
    const p = picOf(w);
    const zh = !p || !hideZh || KEEP_ZH.has(lw(w));
    return el('span', { class: 'l21a-face' + (p ? '' : ' l21a-only') + (cls ? ' ' + cls : '') }, p ? el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, p) : null, zh ? el('span', { class: 'zh l21a-zh' }, w.zh) : null);
  };
  const center = (ctx, node) => { const r = node.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 3 }; };

  L.css('L21', `
.l21a-face{display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.1;pointer-events:none}
.l21a-face .ls-emoji{font-size:clamp(1.8rem,5vw,2.6rem)}
.l21a-zh{font-size:clamp(.85rem,2.4vw,1.05rem);font-weight:900;color:#1d2340}
.l21a-only .l21a-zh{font-size:clamp(1.05rem,3vw,1.35rem);background:#fff3bf;color:#5c3d00;border-radius:10px;padding:3px 8px}
.l21a-room{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,30px);flex-wrap:wrap;width:100%}
.l21a-machine{background:linear-gradient(#c92a2a,#8f1010);border-radius:22px;padding:10px;box-shadow:0 8px 0 rgba(0,0,0,.3),inset 0 0 0 4px rgba(255,255,255,.18);display:flex;flex-direction:column;gap:8px;width:min(100%,400px)}
.l21a-top{color:#fff;font-weight:900;text-align:center;font-size:clamp(.85rem,2.4vw,1.05rem);text-shadow:0 2px 0 rgba(0,0,0,.35)}
.l21a-glass{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:linear-gradient(135deg,#d0ebff,#e7f5ff 55%,#c5e4ff);border-radius:14px;padding:8px;box-shadow:inset 0 0 0 3px #1c7ed6}
.l21a-slot{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:2px;background:#fff;border-radius:10px;padding:4px 2px 0;min-height:clamp(70px,12.5vh,104px);overflow:hidden;transition:background .2s}
.l21a-slot .l21a-face{flex:1;justify-content:center}
.l21a-tag{display:flex;gap:6px;align-items:baseline;justify-content:center;width:100%;background:#1d2340;color:#fff;font-weight:900;font-size:clamp(.85rem,2.4vw,1rem);padding:1px 0;border-radius:0 0 10px 10px}
.l21a-tag small{color:#ffe066;font-size:.72rem}
.l21a-row{background:#fff3bf;box-shadow:0 0 0 3px #fab005}
.l21a-empty .l21a-face{visibility:hidden}
.l21a-out{min-height:clamp(46px,7vh,64px);background:#212529;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;color:#ced4da;font-weight:800;font-size:.85rem;overflow:hidden;position:relative}
.l21a-out .l21a-face{animation:l21aDrop .5s cubic-bezier(.3,1.4,.6,1)}
.l21a-out .l21a-face .ls-emoji{font-size:clamp(1.6rem,4.4vw,2.2rem)}
.l21a-out .l21a-zh{color:#fff}
.l21a-out .l21a-only .l21a-zh{color:#5c3d00}
.l21a-pad{background:#343a40;border-radius:22px;padding:12px;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 0 rgba(0,0,0,.3);width:min(100%,280px)}
.l21a-screen{display:flex;gap:8px;align-items:stretch}
.l21a-disp{flex:1;background:#0b3d0b;color:#8ce99a;border-radius:10px;font:900 clamp(1.6rem,5vw,2.2rem)/1.3 ui-monospace,Menlo,Consolas,monospace;text-align:center;letter-spacing:8px;box-shadow:inset 0 0 0 3px #2b8a3e}
.l21a-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.l21a-key{min-height:clamp(48px,8vh,62px);border-radius:14px;background:linear-gradient(#f8f9fa,#ced4da);color:#1d2340;font-weight:900;font-size:clamp(1.3rem,4vw,1.7rem);box-shadow:0 4px 0 #868e96}
.l21a-key:active{transform:translateY(3px);box-shadow:0 1px 0 #868e96}
.l21a-key.l21a-let{background:linear-gradient(#ffe066,#fab005);color:#4a2c00;box-shadow:0 4px 0 #e67700}
.l21a-key.l21a-on{outline:4px solid #4dabf7;outline-offset:1px}
.l21a-key.l21a-clr{min-height:auto;padding:0 12px;font-size:1rem;background:#fa5252;color:#fff;box-shadow:0 4px 0 #a51111}
.l21a-key:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l21a-help{color:#fff;font-size:.8rem;font-weight:800;text-align:center}
@keyframes l21aDrop{from{transform:translateY(-140%) rotate(-20deg)}}
@media (max-width:640px){.l21a-slot{min-height:clamp(62px,9vh,90px)}.l21a-pad{flex-direction:row;flex-wrap:wrap;width:min(100%,400px);padding:10px}.l21a-screen{width:100%}.l21a-keys{flex:1;grid-template-columns:repeat(6,1fr)}.l21a-help{display:none}}

.l21b-play{display:flex;flex-direction:column;align-items:center;gap:22px;padding:18px 0 4px}
.l21b-wrap{position:relative;width:clamp(220px,min(72vw,42vh),380px);aspect-ratio:1;flex:none}
.l21b-disc{position:absolute;inset:0;border-radius:50%;overflow:hidden;box-shadow:0 0 0 8px #fff,0 0 0 13px #f08c00,0 10px 24px rgba(0,0,0,.35)}
.l21b-wheel{position:absolute;inset:0;border-radius:50%;will-change:transform}
.l21b-seg{position:absolute;left:50%;top:0;height:50%;width:32%;margin-left:-16%;transform-origin:50% 100%;display:flex;flex-direction:column;align-items:center;padding-top:9%;gap:1px;color:#1d2340;text-align:center;line-height:1.05}
.l21b-seg .ls-emoji{font-size:clamp(1.5rem,4.6vw,2.3rem)}
.l21b-word{font-weight:900;font-size:clamp(.72rem,2.3vw,1rem);max-width:100%;overflow-wrap:anywhere}
.l21b-zh{font-size:clamp(.66rem,2vw,.85rem);font-weight:900}
.l21b-zhpic{font-size:clamp(.85rem,2.6vw,1.1rem);font-weight:900;background:#fff3bf;color:#5c3d00;border-radius:8px;padding:1px 5px}
.l21b-seg.l21b-hit{background:rgba(255,255,255,.75);border-radius:40% 40% 0 0;outline:3px solid #1d2340}
.l21b-ptr{position:absolute;left:50%;top:-14px;transform:translateX(-50%);z-index:3;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:30px solid #e03131;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35))}
.l21b-hub{position:absolute;left:50%;top:50%;width:16%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(#fff,#ffd43b);box-shadow:0 0 0 4px #f08c00;display:flex;align-items:center;justify-content:center;font-size:clamp(1rem,3vw,1.5rem);z-index:2}
.l21b-now{background:#fff;color:#1d2340;font-weight:900;border-radius:12px;padding:2px 12px;box-shadow:0 3px 0 rgba(0,0,0,.2);min-width:12em;text-align:center}
.l21b-stop{min-width:min(320px,80vw)}
.l21b-stop.btn.red{background:linear-gradient(180deg,#e03131,#a51111);color:#fff;font-size:1.6rem}
.l21b-wrap.l21b-bump .l21b-ptr{animation:l21bBump .4s}
@keyframes l21bBump{40%{transform:translateX(-50%) translateY(-8px)}}

.l21c-play{display:flex;align-items:flex-end;justify-content:center;gap:clamp(10px,3vw,30px);flex-wrap:wrap;width:100%}
.l21c-side{display:flex;flex-direction:column;align-items:center;gap:6px}
.l21c-meter{background:#fff;color:#5f3dc4;border-radius:14px;padding:4px 12px;font-weight:900;box-shadow:0 4px 0 rgba(0,0,0,.2);text-align:center}
.l21c-meter b{font-size:1.4rem}
.l21c-tower{position:relative;width:clamp(150px,30vw,240px);height:clamp(160px,40vh,340px);flex:none}
.l21c-stack{position:absolute;left:0;right:0;bottom:22px;top:0;display:flex;flex-direction:column-reverse;align-items:center;transform-origin:50% 100%}
.l21c-ruler{position:absolute;right:-16px;top:0;bottom:22px;width:10px;border-left:3px solid rgba(255,255,255,.8);background:repeating-linear-gradient(to top,rgba(255,255,255,.85) 0 3px,transparent 3px var(--lh,40px))}
.l21c-empty{position:absolute;left:8%;right:8%;bottom:40px;text-align:center;color:#5f3dc4;background:rgba(255,255,255,.92);border-radius:12px;padding:4px;font-weight:900}
.l21c-plate{position:absolute;left:-6%;right:-6%;bottom:0;height:24px;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#fff,#dee2e6 70%,#adb5bd);box-shadow:0 5px 0 rgba(0,0,0,.25)}
.l21c-layer{height:var(--lh,40px);border-radius:14px;display:flex;align-items:center;justify-content:center;gap:4px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12),0 2px 0 rgba(0,0,0,.18);flex:none;overflow:hidden;animation:l21cIn .45s cubic-bezier(.3,1.5,.6,1)}
.l21c-choices .ls-choices{max-width:none}
.l21c-layer .ls-emoji{font-size:calc(var(--lh,40px) * .62)}
.l21c-layer .l21c-lz{font-size:calc(var(--lh,40px) * .36);font-weight:900;color:#1d2340}
.l21c-cherry{font-size:clamp(1.6rem,4vw,2.2rem);line-height:1;animation:l21cIn .5s}
.l21c-wobble{animation:l21cWob .6s ease-in-out}
.l21c-fall{animation:l21cFall .6s ease-in forwards}
.l21c-choices{max-width:520px;flex:1 1 300px}
.l21c-choices .ls-choice{min-height:clamp(80px,13vh,120px)}
.l21c-choices .ls-choice.right .l21a-zh,.l21c-choices .ls-choice.wrongpick .l21a-zh{color:#fff}
@keyframes l21cIn{from{transform:translateY(-160px)}}
@keyframes l21cWob{20%{transform:rotate(-5deg)}40%{transform:rotate(4deg)}60%{transform:rotate(-3deg)}80%{transform:rotate(2deg)}}
@keyframes l21cFall{to{transform:translate(120px,60px) rotate(40deg);opacity:0}}
@media (max-width:640px){.l21c-play{flex-direction:column;align-items:center}.l21c-side{flex-direction:row;align-items:flex-end}.l21c-tower{height:clamp(150px,24vh,220px);width:clamp(140px,44vw,200px)}.l21c-choices{width:100%;flex:none}}
`);

  /* ---------------- L21a Vending Machine ---------------- */
  L.register({
    id: 'L21a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#1864ab,#4dabf7 60%,#a5d8ff)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const ROWS = ['A', 'B', 'C'];
      const glass = el('div', { class: 'l21a-glass', role: 'group', 'aria-label': 'Vending machine 販賣機' });
      const slots = [];
      ROWS.forEach((r) => [1, 2, 3].forEach((c) => { const s = el('div', { class: 'l21a-slot', role: 'img' }); s.code = r + c; glass.appendChild(s); slots.push(s); }));
      const out = el('div', { class: 'l21a-out' }, el('span', { class: 'zh' }, '取物口 Take out'));
      const machine = el('div', { class: 'l21a-machine' }, el('div', { class: 'l21a-top' }, '🥤 DRINKS & FOOD 飲料・食物'), glass, out);
      const disp = el('div', { class: 'l21a-disp', role: 'status', 'aria-label': 'Code 代碼' }, '– –');
      const keyBtns = {};
      const key = (k, label, cls, aria) => { const b = el('button', { class: 'l21a-key ' + (cls || ''), 'aria-label': aria || null }, label); ctx.on(b, 'click', () => press(k)); keyBtns[k] = b; return b; };
      const clr = key('clear', '⌫', 'l21a-clr', 'Clear 清除');
      const pad = el('div', { class: 'l21a-pad', role: 'group', 'aria-label': 'Keypad 按鍵' },
        el('div', { class: 'l21a-screen' }, disp, clr),
        el('div', { class: 'l21a-keys' }, ROWS.map((r) => key(r, r, 'l21a-let')), ['1', '2', '3'].map((n) => key(n, n))),
        el('div', { class: 'l21a-help zh' }, '先按字母，再按數字 Letter + number'));
      st.body.appendChild(el('div', { class: 'l21a-room' }, machine, pad));
      let cur = null;
      const show = () => {
        disp.textContent = (cur.letter || '–') + ' ' + (cur.num || '–');
        Object.keys(keyBtns).forEach((k) => keyBtns[k].classList.toggle('l21a-on', k === cur.letter || k === cur.num));
        if (easy) slots.forEach((s) => s.classList.toggle('l21a-row', !!cur.letter && s.code[0] === cur.letter));
      };
      const vend = (code) => {
        const me = cur; const s = slots.find((x) => x.code === code); const w = me.map.get(s);
        const ok = w === me.item; const rightCode = slots.find((x) => me.map.get(x) === me.item).code;
        s.classList.add('l21a-empty'); out.innerHTML = ''; out.appendChild(face(w, false)); EP.sfx.whoosh();
        const p = center(ctx, out);
        ctx.timeout(() => L.feedback(ctx, me.item, ok, { x: p.x, y: p.y, wrongText: `Wrong item 買錯了！正確代碼是 ${rightCode}` }).then(me.done), 450);
      };
      const press = (k) => {
        if (!cur || cur.answered) return;
        EP.sfx.click();
        if (k === 'clear') { cur.letter = cur.num = null; }
        else if (ROWS.includes(k)) cur.letter = k; else cur.num = k;
        show();
        if (cur.letter && cur.num) { cur.answered = true; const code = cur.letter + cur.num; ctx.timeout(() => vend(code), 280); }
      };
      ctx.on(window, 'keydown', (e) => {
        if (ctx.paused || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        const k = String(e.key).toUpperCase();
        if (['A', 'B', 'C', '1', '2', '3'].includes(k)) { e.preventDefault(); press(k); }
        else if (k === 'BACKSPACE' || k === 'DELETE') { e.preventDefault(); press('clear'); }
      });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🥤 照著句子買東西：在販賣機找到句子說的商品，再按它的代碼（例如 B2）。', 'Find the item and press its code, like B2.'), L.listenBar(ctx, item));
        const opts = u.shuffle([item].concat(L.others(ctx, item, 8)));
        const map = new Map();
        slots.forEach((s, k) => {
          const w = opts[k]; s.className = 'l21a-slot'; s.innerHTML = ''; map.set(s, w);
          if (!w) { s.setAttribute('aria-label', s.code + ' 空的 empty'); s.append(el('span', { class: 'l21a-face' }), el('span', { class: 'l21a-tag' }, s.code)); return; }
          s.setAttribute('aria-label', `${s.code} ${w.zh}`);
          s.append(face(w, hard), el('span', { class: 'l21a-tag' }, s.code, el('small', {}, '$' + u.randInt(2, 9) * 5)));
        });
        out.innerHTML = ''; out.appendChild(el('span', { class: 'zh' }, '取物口 Take out'));
        cur = { item, map, letter: null, num: null, answered: false, done };
        show();
        const code = slots.find((s) => map.get(s) === item).code;
        const wrong = slots.find((s) => map.get(s) && map.get(s) !== item).code;
        T.set(() => { press(code[0]); press(code[1]); }, () => { press(wrong[0]); press(wrong[1]); });
      }));
      return { test: T.api };
    },
  });

  /* ---------------- L21b Flavor Wheel ---------------- */
  L.register({
    id: 'L21b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 40%,#ffd8a8,#f76707 60%,#c2410c)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const SPEED = (easy ? 60 : hard ? 150 : 100) * (calm ? 0.6 : 1); // degrees per second (slower for reduced motion)
      const COLORS = ['#ffc9c9', '#ffec99', '#b2f2bb', '#a5d8ff', '#d0bfff', '#ffd8a8'];
      const wheel = el('div', { class: 'l21b-wheel', role: 'img' });
      wheel.style.background = 'conic-gradient(' + COLORS.map((c, i) => `${c} ${i * 60}deg ${(i + 1) * 60}deg`).join(',') + ')';
      const wrap = el('div', { class: 'l21b-wrap' }, el('div', { class: 'l21b-ptr', 'aria-hidden': 'true' }), el('div', { class: 'l21b-disc' }, wheel), el('div', { class: 'l21b-hub', 'aria-hidden': 'true' }, '🍴'));
      const now = el('div', { class: 'l21b-now' }, '');
      st.body.appendChild(el('div', { class: 'l21b-play' }, wrap, now));
      const stopBtn = el('button', { class: 'btn red big l21b-stop', 'aria-label': 'STOP 停：停在句子說的食物' }, '⏹ STOP 停！');
      st.foot.appendChild(stopBtn);
      let cur = null; let theta = 0;
      const under = () => Math.floor((((-theta) % 360) + 360) % 360 / 60) % 6;
      const showNow = () => { if (!cur) return; const w = cur.segs[under()]; const t = '▼ ' + (picOf(w) ? picOf(w) + ' ' : '') + w.word; if (now.textContent !== t) { now.textContent = t; if (cur.running) EP.sfx.tick(); } };
      ctx.loop((dt) => {
        if (!cur || !cur.running) return;
        let sp = SPEED * (ctx.speed || 1);
        if (easy) { // slow down while the target passes under the pointer
          const a = (((-theta) % 360) + 360) % 360; const c = cur.target * 60 + 30;
          let d = Math.abs(a - c); d = Math.min(d, 360 - d);
          if (d < 50) sp *= 0.35;
        }
        theta = (theta + sp * dt) % 360;
        wheel.style.transform = `rotate(${theta}deg)`;
        showNow();
      });
      const stop = () => {
        if (!cur || cur.answered) return;
        const me = cur; me.answered = true; me.running = false;
        const k = under(); const ok = me.segs[k] === me.item;
        wheel.style.transform = `rotate(${theta}deg)`; showNow();
        me.labels[k].classList.add('l21b-hit'); wrap.classList.remove('l21b-bump'); void wrap.offsetWidth; wrap.classList.add('l21b-bump');
        const p = center(ctx, wrap);
        L.feedback(ctx, me.item, ok, { x: p.x, y: p.y - 20, wrongText: `Stopped on ${me.segs[k].word} 停在 ${me.segs[k].zh}` }).then(me.done);
      };
      ctx.on(stopBtn, 'click', stop);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎡 轉盤轉啊轉！聽句子，指針指到句子說的食物或飲料時，按「STOP 停」。', 'Press STOP when the pointer is on the right food.'), L.listenBar(ctx, item));
        const segs = u.shuffle([item].concat(L.others(ctx, item, 5)));
        while (segs.length < 6) segs.push(segs[segs.length % Math.max(1, segs.length)]);
        wheel.innerHTML = '';
        const labels = segs.map((w, i) => {
          const p = picOf(w);
          const lab = el('div', { class: 'l21b-seg', style: { transform: `rotate(${i * 60 + 30}deg)` } },
            p ? el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, p) : el('span', { class: 'l21b-zhpic zh' }, w.zh),
            el('span', { class: 'l21b-word' }, w.word),
            easy && p ? el('span', { class: 'l21b-zh zh' }, w.zh) : null);
          wheel.appendChild(lab); return lab;
        });
        wheel.setAttribute('aria-label', 'Flavor wheel 美食轉盤：' + segs.map((w) => `${w.word} ${w.zh}`).join('、'));
        theta = u.rand(0, 360);
        cur = { item, segs, labels, target: segs.indexOf(item), running: true, answered: false, done };
        showNow();
        const at = (k) => { theta = (360 - (k * 60 + 30)) % 360; wheel.style.transform = `rotate(${theta}deg)`; };
        T.set(() => { at(cur.target); stop(); }, () => { at((cur.target + 1 + u.randInt(0, 4)) % 6); if (segs[under()] === item) at((cur.target + 3) % 6); stop(); });
      }));
      return { test: T.api };
    },
  });

  /* ---------------- L21c Dessert Tower ---------------- */
  L.register({
    id: 'L21c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#f783ac,#da77f2 55%,#9775fa)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 2 : hard ? 4 : 3;
      const LAYER = ['#ffdeeb', '#fff3bf', '#d3f9d8', '#e7f5ff', '#f3d9fa', '#ffe8cc', '#c5f6fa', '#ffe3e3'];
      const stack = el('div', { class: 'l21c-stack' });
      const empty = el('div', { class: 'l21c-empty zh', 'aria-hidden': 'true' }, '⬆ 疊高高！', el('br'), 'Stack it up!');
      const tower = el('div', { class: 'l21c-tower', role: 'img', 'aria-label': 'Dessert tower 甜點塔：0 層' }, el('div', { class: 'l21c-ruler', 'aria-hidden': 'true' }), empty, el('div', { class: 'l21c-plate' }), stack);
      const hEl = el('b', {}, '0'); let best = 0; const bestEl = el('span', {}, '0');
      const meter = el('div', { class: 'l21c-meter' }, '📏 ', el('span', { class: 'zh' }, '高度 Height '), hEl, el('div', { class: 'zh', style: { fontSize: '.78rem' } }, '最高 Best ', bestEl));
      const choiceBox = el('div', { class: 'l21c-choices' });
      st.body.appendChild(el('div', { class: 'l21c-play' }, el('div', { class: 'l21c-side' }, meter, tower), choiceBox));
      let layers = 0;
      const fit = () => {
        const avail = Math.max(60, stack.clientHeight - 4);
        const lh = Math.max(16, Math.min(46, Math.floor(avail / Math.max(5, layers + (stack.querySelector('.l21c-cherry') ? 1.2 : 0)))));
        tower.style.setProperty('--lh', lh + 'px'); empty.hidden = layers > 0;
        hEl.textContent = String(layers); best = Math.max(best, layers); bestEl.textContent = String(best);
        tower.setAttribute('aria-label', `Dessert tower 甜點塔：${layers} 層 layers`);
        ctx.hud.extra('🍰 ' + layers);
      };
      const addLayer = (w) => {
        const p = picOf(w); layers++;
        const width = Math.max(48, 100 - (layers - 1) * 5);
        stack.appendChild(el('div', { class: 'l21c-layer', style: { width: width + '%', background: LAYER[(layers - 1) % LAYER.length] }, 'aria-hidden': 'true' },
          p ? el('span', { class: 'ls-emoji' }, p) : null, !p || KEEP_ZH.has(lw(w)) ? el('span', { class: 'l21c-lz zh' }, w.zh) : null));
        fit();
      };
      const wobble = (lose) => {
        stack.classList.remove('l21c-wobble'); void stack.offsetWidth; stack.classList.add('l21c-wobble');
        if (lose && layers > 0) {
          const top = stack.lastElementChild; top.classList.add('l21c-fall'); layers--; fit();
          ctx.timeout(() => top.remove(), 600);
        }
      };
      const round = (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🍰 聽句子，選出句子說的那一個。答對就幫甜點塔加一層，答錯塔會搖晃' + (easy ? '。' : '、掉一層！'), 'Each right answer stacks the tower higher.'), L.listenBar(ctx, item));
        const opts = u.shuffle([item].concat(L.others(ctx, item, n - 1)));
        const right = opts.indexOf(item);
        let answered = false;
        const pick = (k, b) => {
          if (answered) return; answered = true; ch.lock(); ch.mark(right, k);
          const ok = k === right; const p = center(ctx, b);
          if (ok) { addLayer(item); EP.sfx.pop(); } else { wobble(!easy); EP.sfx.boom(); }
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: 100 + Math.min(layers, 10) * 10, wrongText: easy || !layers ? 'Wobble! 塔在搖晃' : 'Wobble! 掉了一層' }).then(done);
        };
        const ch = L.choices(opts.map((w) => ({ el: face(w, hard), aria: w.zh })), pick);
        ch.el.style.gridTemplateColumns = `repeat(${opts.length},1fr)`;
        choiceBox.innerHTML = ''; choiceBox.appendChild(ch.el);
        T.set(() => pick(right, ch.btns[right]), () => { const k = right === 0 ? 1 : 0; pick(k, ch.btns[k]); });
      });
      (async () => {
        const items = ctx.items;
        for (let i = 0; i < items.length; i++) { if (ctx.ended) return; ctx.hud.progress(i / items.length); await round(items[i]); }
        ctx.hud.progress(1); if (ctx.ended) return;
        T.clear();
        if (layers > 0) {
          stack.appendChild(el('div', { class: 'l21c-cherry', 'aria-hidden': 'true' }, '🍒')); fit();
          ctx.burst(`🍰 ${layers} 層 Layers!`); if (layers >= Math.ceil(items.length * 0.75)) { ctx.confetti(); EP.sfx.win(); }
          await ctx.wait(1300);
        }
        if (!ctx.ended) ctx.end();
      })();
      ctx.timeout(fit, 50);
      return { test: T.api };
    },
  });
})();
