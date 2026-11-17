/* Sentence Listening — Level 20 (Food · Fruit): COOKING, ORDER_QUEUE, SPEED
 * L20a Hot Pot Chef — drag the food you hear into the hot pot (tap-tap fallback).
 * L20b Food Truck Orders — serve each customer the dish from their sentence before their patience runs out.
 * L20c Speed Listening — pick the picture; the sentence plays faster as the streak grows (speedometer). */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen, el = u.el;

  /* level-20 items that are not food: they make no sense in a hot pot or a food truck (still used in L20c) */
  const NONFOOD = new Set(['flower', 'carnation']);
  const isFood = (w) => !NONFOOD.has(String(w.word).toLowerCase());
  /* pictures that need their Chinese name even on hard (the emoji alone is ambiguous: 🐄 = beef …) */
  const KEEP_ZH = new Set(['beef', 'pork', 'vegetable', 'food', 'fruit', 'soup', 'salad', 'flower', 'carnation']);
  /** picture + Chinese face for an item (hard: picture only when the picture is clear) */
  const face = (w, hideZh) => {
    const p = EP.pic(w);
    const zh = !p || !hideZh || KEEP_ZH.has(String(w.word).toLowerCase());
    return el('span', { class: 'l20a-face' + (p ? '' : ' l20a-only') }, p ? el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, p) : null, zh ? el('span', { class: 'zh l20a-zh' }, w.zh) : null);
  };
  const center = (ctx, node) => { const r = node.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 3 }; };
  const GUESTS = ['🧑', '👩', '👨', '👧', '👦', '👵', '👴', '🧒', '👩‍🦱', '🧔', '👱‍♀️', '🧑‍🦰'];

  L.css('L20', `
.l20a-face{display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.1;pointer-events:none}
.l20a-face .ls-emoji{font-size:clamp(2rem,5.4vw,2.8rem)}
.l20a-zh{font-size:clamp(.95rem,2.6vw,1.1rem);font-weight:900;color:#1d2340}
.l20a-only .l20a-zh{font-size:clamp(1.2rem,3.6vw,1.5rem);background:#fff3bf;color:#5c3d00;border-radius:10px;padding:4px 10px}
.l20a-kitchen{display:flex;flex-direction:column;align-items:center;gap:clamp(6px,1.4vh,14px);width:100%}
.l20a-order{display:flex;align-items:center;gap:10px;background:#fff8e6;color:#5c2b00;border-radius:16px;padding:4px 14px;font-weight:900;box-shadow:0 4px 0 rgba(0,0,0,.22)}
.l20a-order .l20a-guest{font-size:2rem;line-height:1}
.l20a-pot{position:relative;width:clamp(200px,min(64vw,40vh),330px);aspect-ratio:16/10;border-radius:24px;padding:0;background:transparent;flex:none}
.l20a-pot:focus-visible{outline:4px solid #ffd43b;outline-offset:4px}
.l20a-bowl{position:absolute;left:10%;right:10%;top:36%;bottom:16%;background:linear-gradient(#6c757d,#343a40 55%,#212529);border-radius:0 0 46% 46%/0 0 70% 70%;box-shadow:0 8px 0 rgba(0,0,0,.25);display:flex;align-items:flex-end;justify-content:center;padding-bottom:8%}
.l20a-label{color:#fff;font-weight:900;font-size:clamp(.8rem,2.4vw,1rem);text-shadow:0 2px 0 #000}
.l20a-handle{position:absolute;top:33%;width:11%;height:16%;border:6px solid #343a40;border-radius:50%}
.l20a-handle.l{left:1%}.l20a-handle.r{right:1%}
.l20a-broth{position:absolute;left:6%;right:6%;top:20%;height:32%;border-radius:50%;border:6px solid #343a40;background:radial-gradient(ellipse at 50% 40%,#ffa94d,#e8590c 55%,#b02525);overflow:hidden;box-shadow:inset 0 5px 10px rgba(0,0,0,.35)}
.l20a-bit{position:absolute;transform:translate(-50%,-50%);font-size:clamp(1rem,3vw,1.4rem);line-height:1;animation:l20aBob 2.4s ease-in-out infinite}
.l20a-bit.zh{font-size:.72rem;font-weight:900;background:#fff3bf;color:#5c3d00;border-radius:6px;padding:1px 4px}
.l20a-bub{position:absolute;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.55);animation:l20aBub 1.6s ease-in infinite}
.l20a-fire{position:absolute;left:50%;bottom:-4%;transform:translateX(-50%);font-size:clamp(1.1rem,3.4vw,1.6rem);letter-spacing:2px;line-height:1}
.l20a-steam,.l20a-smoke{position:absolute;left:0;right:0;top:-8%;height:40%;pointer-events:none}
.l20a-steam i,.l20a-smoke i{position:absolute;bottom:0;width:22%;aspect-ratio:1;border-radius:50%;filter:blur(4px)}
.l20a-steam i{background:rgba(255,255,255,.55);animation:l20aRise 2.6s ease-out infinite;opacity:.35}
.l20a-steam i:nth-child(1){left:22%}.l20a-steam i:nth-child(2){left:44%;animation-delay:.8s}.l20a-steam i:nth-child(3){left:64%;animation-delay:1.6s}
.l20a-boil .l20a-steam i{animation-duration:1s;background:rgba(255,255,255,.85)}
.l20a-boil .l20a-broth{animation:l20aBoil .3s ease-in-out 4}
.l20a-smoke i{background:rgba(20,20,24,.9);opacity:0}
.l20a-smoke i:nth-child(1){left:18%}.l20a-smoke i:nth-child(2){left:40%}.l20a-smoke i:nth-child(3){left:62%}
.l20a-burn .l20a-smoke i{animation:l20aSmoke 1.5s ease-out forwards}
.l20a-burn .l20a-smoke i:nth-child(2){animation-delay:.15s}.l20a-burn .l20a-smoke i:nth-child(3){animation-delay:.3s}
.l20a-tray{display:flex;flex-wrap:wrap;gap:clamp(6px,1.6vw,12px);justify-content:center;background:rgba(255,255,255,.2);border-radius:20px;padding:10px;max-width:760px}
.l20a-ing{min-width:clamp(76px,21vw,120px);min-height:clamp(74px,12vh,104px);background:#fff;color:#1d2340;border-radius:16px;box-shadow:0 5px 0 rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:6px 8px;touch-action:none;transition:transform .45s ease,opacity .45s ease}
.l20a-ing:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l20a-ing.l20a-gone{opacity:0;pointer-events:none}
.l20a-ing.l20a-nope{background:#c92a2a;animation:shake .35s}
.l20a-ing.l20a-nope .l20a-zh{color:#fff}
.l20a-ing.l20a-was{background:#2b8a3e}.l20a-ing.l20a-was .l20a-zh{color:#fff}
@keyframes l20aRise{0%{transform:translateY(30%) scale(.6);opacity:0}30%{opacity:.6}100%{transform:translateY(-70%) scale(1.3);opacity:0}}
@keyframes l20aSmoke{0%{transform:translateY(40%) scale(.5);opacity:0}25%{opacity:.95}100%{transform:translateY(-190%) scale(2.4);opacity:0}}
@keyframes l20aBub{0%{transform:scale(.2);opacity:0}60%{opacity:1}100%{transform:scale(1.3);opacity:0}}
@keyframes l20aBob{50%{transform:translate(-50%,-62%) rotate(6deg)}}
@keyframes l20aBoil{50%{transform:scale(1.04,1.1)}}

.l20b-scene{display:flex;align-items:flex-end;justify-content:center;gap:clamp(8px,3vw,28px);width:100%;max-width:900px;flex-wrap:wrap}
.l20b-truck{position:relative;width:clamp(150px,30vw,250px);aspect-ratio:5/3;flex:none}
.l20b-box{position:absolute;left:0;right:22%;top:12%;bottom:13%;background:linear-gradient(#fff,#e9ecef);border-radius:14px 6px 6px 14px;box-shadow:0 5px 0 rgba(0,0,0,.25)}
.l20b-cab{position:absolute;right:0;width:24%;top:34%;bottom:13%;background:#f76707;border-radius:6px 18px 6px 6px}
.l20b-cab::after{content:'';position:absolute;left:18%;right:14%;top:14%;height:36%;background:#a5d8ff;border-radius:4px 10px 4px 4px}
.l20b-awning{position:absolute;left:4%;right:26%;top:4%;height:16%;background:repeating-linear-gradient(90deg,#e03131 0 14px,#fff 14px 28px);border-radius:8px 8px 4px 4px}
.l20b-win{position:absolute;left:12%;right:34%;top:37%;height:34%;background:#ffe8cc;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:clamp(1.4rem,4vw,2.2rem)}
.l20b-sign{position:absolute;left:4%;right:26%;top:20%;text-align:center;color:#1d2340;font-weight:900;font-size:clamp(.7rem,1.9vw,.95rem)}
.l20b-wheel{position:absolute;bottom:0;width:14%;aspect-ratio:1;border-radius:50%;background:radial-gradient(#adb5bd 30%,#212529 34%)}
.l20b-wheel.a{left:10%}.l20b-wheel.b{right:6%}
.l20b-line{display:flex;align-items:flex-end;gap:clamp(6px,1.6vw,14px)}
.l20b-cust{display:flex;flex-direction:column;align-items:center;gap:4px}
.l20b-cust.l20b-in{animation:l20bIn .45s ease-out}
.l20b-cust.l20b-out{transition:transform .5s ease-in,opacity .5s;transform:translateX(-60px);opacity:0}
.l20b-bubble{background:#fff;color:#1d2340;border-radius:14px;padding:4px 10px;font-weight:900;position:relative;box-shadow:0 3px 0 rgba(0,0,0,.2);white-space:nowrap}
.l20b-bubble::after{content:'';position:absolute;left:50%;bottom:-8px;border:8px solid transparent;border-top-color:#fff;border-bottom:0;transform:translateX(-50%)}
.l20b-who{font-size:clamp(2.6rem,8vw,4rem);line-height:1;position:relative}
.l20b-mood{position:absolute;right:-12px;top:-6px;font-size:clamp(1.2rem,3.4vw,1.7rem)}
.l20b-got{position:absolute;left:-14px;bottom:-4px;font-size:clamp(1.2rem,3.4vw,1.7rem)}
.l20b-pat{width:clamp(90px,20vw,150px);height:14px;border-radius:999px;background:rgba(0,0,0,.35);overflow:hidden;border:2px solid #fff}
.l20b-pat>i{display:block;height:100%;width:100%;background:#40c057;transition:background .3s}
.l20b-angry .l20b-who{animation:shake .4s infinite}
.l20b-wait{font-size:clamp(1.6rem,4.6vw,2.4rem);line-height:1;filter:saturate(.8)}
.l20b-patlab{font-size:.8rem;font-weight:900;color:#1d2340;background:rgba(255,255,255,.92);border-radius:8px;padding:0 6px}
.l20b-menu{max-width:760px}
.l20b-menu .ls-choice{min-height:clamp(78px,12vh,110px)}
.l20b-menu .ls-choice.right .l20a-zh,.l20b-menu .ls-choice.wrongpick .l20a-zh{color:#fff}
@keyframes l20bIn{from{transform:translateX(80px);opacity:0}}

.l20c-dash{display:flex;align-items:center;justify-content:center;gap:clamp(8px,3vw,24px);flex-wrap:wrap}
.l20c-gauge{width:clamp(170px,min(34vw,30vh),250px);background:#0b1026;border-radius:22px 22px 14px 14px;padding:8px 10px 4px;box-shadow:0 6px 0 rgba(0,0,0,.35),inset 0 0 0 3px #4dabf7}
.l20c-gauge svg{display:block;width:100%;height:auto}
.l20c-needle{transition:transform .7s cubic-bezier(.3,1.6,.5,1)}
.l20c-read{text-align:center;color:#fff;font-weight:900;font-size:clamp(1.3rem,4vw,1.8rem);line-height:1.1}
.l20c-read small{display:block;font-size:.8rem;color:#c5f6fa}
.l20c-streak{background:#fff;color:#1d2340;border-radius:16px;padding:6px 12px;font-weight:900;text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.l20c-streak b{display:block;font-size:1.5rem}
.l20c-fast .l20c-gauge{animation:l20cRev .5s ease-out}
.l20c-choices .ls-choice{min-height:clamp(84px,14vh,130px)}
.l20c-choices .ls-choice.right .l20a-zh,.l20c-choices .ls-choice.wrongpick .l20a-zh{color:#fff}
@keyframes l20cRev{30%{transform:scale(1.08) rotate(-2deg)}60%{transform:scale(.98) rotate(1deg)}}
`);

  /* ---------------- L20a Hot Pot Chef ---------------- */
  L.register({
    id: 'L20a',
    pool: (ws) => ws.filter(isFood),
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 30%,#a8323c,#5c1018 70%,#2b070b)' });
      const n = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 5 : 4;
      const hideZh = ctx.difficulty === 'hard';
      const guest = el('span', { class: 'l20a-guest', 'aria-hidden': 'true' }, '🧑');
      const orderNo = el('span', {}, '');
      const order = el('div', { class: 'l20a-order' }, guest, el('span', {}, '🧾 ', orderNo));
      const broth = el('span', { class: 'l20a-broth' });
      for (let i = 0; i < 4; i++) broth.appendChild(el('span', { class: 'l20a-bub', style: { left: 15 + i * 22 + '%', top: 30 + (i % 2) * 30 + '%', animationDelay: i * 0.4 + 's' } }));
      const pot = el('button', { class: 'l20a-pot', 'aria-label': 'Hot pot 火鍋：把選好的食材放進來' },
        el('span', { class: 'l20a-steam', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
        el('span', { class: 'l20a-handle l', 'aria-hidden': 'true' }), el('span', { class: 'l20a-handle r', 'aria-hidden': 'true' }),
        el('span', { class: 'l20a-bowl', 'aria-hidden': 'true' }, el('span', { class: 'l20a-label zh' }, '⬇ 放進鍋裡 Drop here')),
        broth,
        el('span', { class: 'l20a-fire', 'aria-hidden': 'true' }, '🔥🔥🔥'),
        el('span', { class: 'l20a-smoke', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')));
      const tray = el('div', { class: 'l20a-tray', role: 'group', 'aria-label': 'Ingredients 食材' });
      const slots = Array.from({ length: n }, () => { const b = el('button', { class: 'l20a-ing' }); tray.appendChild(b); return b; });
      st.body.append(el('div', { class: 'l20a-kitchen' }, order, pot, tray));
      let cur = null;
      const drop = (b) => {
        if (!cur || cur.answered) return;
        const w = cur.map.get(b); if (!w) return;
        cur.answered = true;
        const ok = w === cur.item; const me = cur;
        pot.classList.remove('l20a-boil', 'l20a-burn');
        const p = center(ctx, pot);
        if (ok) {
          // the food flies into the pot and floats in the soup
          const r = b.getBoundingClientRect(), pr = broth.getBoundingClientRect();
          b.style.transform = `translate(${pr.left + pr.width / 2 - (r.left + r.width / 2)}px,${pr.top + pr.height / 2 - (r.top + r.height / 2)}px) scale(.3)`;
          b.classList.add('l20a-gone');
          ctx.timeout(() => {
            const pic = EP.pic(w);
            const bit = el('span', { class: 'l20a-bit' + (pic ? '' : ' zh'), 'aria-hidden': 'true', style: { left: u.rand(18, 82) + '%', top: u.rand(30, 70) + '%', animationDelay: u.rand(0, 1.5) + 's' } }, pic || w.zh);
            broth.appendChild(bit);
            const all = broth.querySelectorAll('.l20a-bit'); if (all.length > 9) all[0].remove();
            void pot.offsetWidth; pot.classList.add('l20a-boil'); EP.sfx.pop();
          }, 380);
        } else {
          b.classList.add('l20a-nope'); void pot.offsetWidth; pot.classList.add('l20a-burn'); ctx.shake(pot); EP.sfx.boom();
          const right = slots.find((s) => me.map.get(s) === me.item); if (right) right.classList.add('l20a-was');
        }
        ctx.timeout(() => L.feedback(ctx, me.item, ok, { x: p.x, y: p.y, wrongText: 'Wrong food! 放錯了，冒黑煙了' }).then(me.done), ok ? 420 : 750);
      };
      const dnd = L.dnd(ctx, slots, [pot], (d) => drop(d));
      // tapping the pot with nothing chosen: explain the tap-tap way
      ctx.on(pot, 'click', () => { if (cur && !cur.answered && !tray.querySelector('.ls-selected')) ctx.toast('先點一樣食材，再點鍋子 Tap a food first'); });
      L.rounds(ctx, ctx.items, (item, i) => new Promise((done) => {
        dnd.clear();
        st.head.innerHTML = '';
        st.head.append(L.say('🍲 客人點菜了！聽句子，把他說的食材拖進火鍋（也可以先點食材，再點鍋子）。', 'Drag the food you hear into the hot pot.'), L.listenBar(ctx, item));
        guest.textContent = GUESTS[i % GUESTS.length]; orderNo.textContent = `Order 點單 ${i + 1}/${ctx.items.length}`;
        pot.classList.remove('l20a-burn', 'l20a-boil');
        const opts = u.shuffle([item].concat(L.others(ctx, item, n - 1, { filter: isFood })));
        const map = new Map();
        slots.forEach((b, k) => {
          const w = opts[k]; b.className = 'l20a-ing'; b.style.transform = ''; b.innerHTML = '';
          if (!w) { b.hidden = true; return; }
          b.hidden = false; map.set(b, w); b.setAttribute('aria-label', w.zh + '（食材）'); b.appendChild(face(w, hideZh));
        });
        cur = { item, map, answered: false, done };
        const rightB = slots.find((b) => map.get(b) === item);
        T.set(() => drop(rightB), () => drop(slots.find((b) => map.get(b) && map.get(b) !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ---------------- L20b Food Truck Orders ---------------- */
  L.register({
    id: 'L20b',
    pool: (ws) => ws.filter(isFood),
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(#74c0fc 0%,#d0ebff 52%,#8ce99a 52%,#51cf66 100%)' });
      const n = ctx.difficulty === 'easy' ? 3 : 4;
      const hideZh = ctx.difficulty === 'hard';
      const total = ctx.difficulty === 'easy' ? 18 : ctx.difficulty === 'hard' ? 9 : 13; // seconds of patience
      const faces = ctx.items.map(() => u.pick(GUESTS));
      const truck = el('div', { class: 'l20b-truck', 'aria-hidden': 'true' },
        el('div', { class: 'l20b-box' }), el('div', { class: 'l20b-cab' }), el('div', { class: 'l20b-awning' }),
        el('div', { class: 'l20b-win' }, '🧑‍🍳'), el('div', { class: 'l20b-sign' }, 'FOOD TRUCK 餐車'),
        el('div', { class: 'l20b-wheel a' }), el('div', { class: 'l20b-wheel b' }));
      const line = el('div', { class: 'l20b-line' });
      st.body.append(el('div', { class: 'l20b-scene' }, truck, line));
      const menuBox = el('div', { class: 'l20b-menuwrap', style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.appendChild(menuBox);
      let cur = null;
      ctx.loop((dt) => {
        if (!cur || !cur.running || cur.answered) return;
        cur.left -= dt * (ctx.speed || 1);
        const f = Math.max(0, cur.left / total);
        cur.fill.style.width = f * 100 + '%';
        cur.fill.style.background = f > 0.6 ? '#40c057' : f > 0.3 ? '#fab005' : '#fa5252';
        const mood = f > 0.6 ? '🙂' : f > 0.3 ? '😐' : '😠';
        if (cur.mood.textContent !== mood) { cur.mood.textContent = mood; cur.cust.classList.toggle('l20b-angry', f <= 0.3); }
        const pct = Math.round(f * 10) * 10; if (cur.pat.getAttribute('aria-valuenow') !== String(pct)) cur.pat.setAttribute('aria-valuenow', pct);
        if (cur.left <= 0) cur.serve(-1, null);
      });
      L.rounds(ctx, ctx.items, (item, i) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🚚 客人排隊點餐！聽他說的句子，在耐心條用完前送上對的餐點。', 'Serve the right food before the patience bar runs out.'), bar);
        // the queue: the customer at the counter + the ones still waiting
        line.innerHTML = '';
        const mood = el('span', { class: 'l20b-mood', 'aria-hidden': 'true' }, '🙂');
        const got = el('span', { class: 'l20b-got', 'aria-hidden': 'true' }, '');
        const fill = el('i');
        const pat = el('div', { class: 'l20b-pat', role: 'progressbar', 'aria-label': 'Patience 耐心', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 100 }, fill);
        const cust = el('div', { class: 'l20b-cust l20b-in' },
          el('div', { class: 'l20b-bubble' }, '💬 🔊 …'),
          el('div', { class: 'l20b-who', role: 'img', 'aria-label': `Customer ${i + 1} 第 ${i + 1} 位客人` }, faces[i], mood, got),
          el('span', { class: 'l20b-patlab zh' }, '耐心 Patience'), pat);
        line.appendChild(cust);
        faces.slice(i + 1, i + 4).forEach((f) => line.appendChild(el('span', { class: 'l20b-wait', 'aria-hidden': 'true' }, f)));
        const opts = u.shuffle([item].concat(L.others(ctx, item, n - 1, { filter: isFood })));
        const right = opts.indexOf(item);
        const ch = L.choices(opts.map((w) => ({ el: face(w, hideZh), aria: w.zh })), (k, b) => serve(k, b), 'l20b-menu');
        menuBox.innerHTML = ''; menuBox.appendChild(ch.el);
        const me = { item, left: total, running: false, answered: false, fill, mood, cust, pat };
        const serve = (k, b) => {
          if (me.answered) return; me.answered = true; ch.lock();
          const ok = k === right; const timeUp = k < 0;
          ch.mark(right, timeUp ? -1 : k);
          const f = Math.max(0, me.left / total);
          mood.textContent = ok ? '😋' : timeUp ? '😤' : '😕'; cust.classList.remove('l20b-angry');
          if (ok) got.textContent = EP.pic(item) || '🍱';
          const p = b ? center(ctx, b) : center(ctx, cust);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: ok ? 100 + Math.round(60 * f) : undefined, wrongText: timeUp ? 'Too slow! 客人等不及走了' : 'Wrong order 送錯餐了' })
            .then(() => { cust.classList.add('l20b-out'); return ctx.wait(420); })
            .then(done);
        };
        me.serve = serve; cur = me;
        // patience starts after the customer has finished ordering (or after 6 s if the audio is slow)
        const go = () => { if (cur === me) me.running = true; };
        bar.play(false).then(go); ctx.timeout(go, 6000);
        T.set(() => serve(right, ch.btns[right]), () => { const k = opts.findIndex((w) => w !== item); serve(k, ch.btns[k]); });
      }));
      return { test: T.api };
    },
  });

  /* ---------------- L20c Speed Listening ---------------- */
  L.register({
    id: 'L20c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#1864ab 55%,#364fc7)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const RATES = easy ? [1.0, 1.1] : [1.0, 1.1, 1.2, 1.3];
      const n = easy ? 3 : 4;
      let streak = 0;
      // speedometer (×1.0 … ×1.3)
      const ang = (r) => -70 + ((r - 1) / 0.3) * 140;
      const NS = 'http://www.w3.org/2000/svg';
      const sv = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const svg = sv('svg', { viewBox: '0 0 200 118', 'aria-hidden': 'true' });
      const arc = (a0, a1, col) => { const p = (a) => { const t = (a - 90) * Math.PI / 180; return [100 + 80 * Math.cos(t), 104 + 80 * Math.sin(t)]; }; const [x0, y0] = p(a0), [x1, y1] = p(a1); svg.appendChild(sv('path', { d: `M${x0} ${y0} A80 80 0 0 1 ${x1} ${y1}`, stroke: col, 'stroke-width': 16, fill: 'none' })); };
      [[1.0, '#40c057'], [1.1, '#94d82d'], [1.2, '#fab005'], [1.3, '#fa5252']].forEach(([r, col]) => arc(ang(r) - 23, ang(r) + 23, RATES.includes(r) ? col : '#495057'));
      [1.0, 1.1, 1.2, 1.3].forEach((r) => { const t = (ang(r) - 90) * Math.PI / 180; const tx = sv('text', { x: 100 + 66 * Math.cos(t), y: 108 + 66 * Math.sin(t), fill: RATES.includes(r) ? '#fff' : '#868e96', 'font-size': 12, 'font-weight': 900, 'text-anchor': 'middle' }); tx.textContent = '×' + r.toFixed(1); svg.appendChild(tx); });
      const needle = sv('g', { class: 'l20c-needle' });
      needle.appendChild(sv('line', { x1: 100, y1: 104, x2: 100, y2: 58, stroke: '#ff6b6b', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      svg.appendChild(needle); svg.appendChild(sv('circle', { cx: 100, cy: 104, r: 9, fill: '#f8f9fa' }));
      needle.style.transformOrigin = '100px 104px'; needle.style.transform = `rotate(${ang(1)}deg)`;
      const read = el('div', { class: 'l20c-read' }, '×1.0');
      const gauge = el('div', { class: 'l20c-gauge', role: 'img', 'aria-label': 'Speed 速度 ×1.0' }, svg, read);
      const streakEl = el('b', {}, '0');
      const dash = el('div', { class: 'l20c-dash' }, gauge, el('div', { class: 'l20c-streak' }, '🔥 連對 Streak', streakEl, el('span', { class: 'zh', style: { fontSize: '.8rem' } }, easy ? '最快 ×1.1' : '最快 ×1.3')));
      const choiceBox = el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.append(dash, choiceBox);
      const setGauge = (r) => {
        needle.style.transform = `rotate(${ang(r)}deg)`;
        read.innerHTML = ''; read.append('×' + r.toFixed(1), el('small', { class: 'zh' }, r > 1 ? '加速中 Faster' : '一般速度 Normal'));
        gauge.setAttribute('aria-label', 'Speed 速度 ×' + r.toFixed(1));
      };
      const rateBar = (item, rate) => {
        let plays = 0; const max = hard ? 3 : 99;
        const tag = EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(item, 'sentence')) : null;
        const play = (slow) => { if (plays >= max) { ctx.toast('Hard 模式最多聽 3 次'); return Promise.resolve(); } plays++; return ctx.say(item, slow ? { sentence: true, slow: true } : { sentence: true, rate }); };
        const bar = el('div', { class: 'ls-listen' },
          el('button', { class: 'btn blue big ls-play', 'aria-label': `Play the sentence at ×${rate.toFixed(1)} speed 以 ×${rate.toFixed(1)} 速度播放句子`, onclick: () => play(false) }, '🔊 ', `Listen 聽 ×${rate.toFixed(1)}`),
          el('button', { class: 'btn small ls-slow', 'aria-label': 'Play slowly 慢速播放', onclick: () => play(true) }, '🐢 Slow 慢速'), tag);
        ctx.timeout(() => play(false), 450);
        return bar;
      };
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        const lvl = Math.min(streak, RATES.length - 1); const rate = RATES[lvl];
        setGauge(rate); streakEl.textContent = String(streak);
        st.head.innerHTML = '';
        st.head.append(L.say('⚡ 播報員越說越快！聽句子，選出句子說的那一個。連續答對會加速，答錯速度回到 ×1.0。', 'Pick the picture. Right answers make it faster.'), rateBar(item, rate));
        const opts = u.shuffle([item].concat(L.others(ctx, item, n - 1)));
        const right = opts.indexOf(item);
        let answered = false;
        const pick = (k, b) => {
          if (answered) return; answered = true; ch.lock(); ch.mark(right, k);
          const ok = k === right; const p = center(ctx, b);
          const before = lvl;
          streak = ok ? streak + 1 : 0;
          const next = Math.min(streak, RATES.length - 1);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: 100 + before * 40, wrongText: before > 0 ? 'Speed reset 速度回到 ×1.0' : 'Not quite 再聽一次' }).then(() => {
            streakEl.textContent = String(streak);
            if (next > before) { dash.classList.remove('l20c-fast'); void dash.offsetWidth; dash.classList.add('l20c-fast'); ctx.burst('⚡ ×' + RATES[next].toFixed(1) + ' Faster!'); EP.sfx.whoosh(); }
            setGauge(RATES[next]);
            return ctx.wait(next !== before ? 600 : 150);
          }).then(done);
        };
        const ch = L.choices(opts.map((w) => ({ el: face(w, hard), aria: w.zh })), pick, 'l20c-choices');
        choiceBox.innerHTML = ''; choiceBox.appendChild(ch.el);
        T.set(() => pick(right, ch.btns[right]), () => { const k = right === 0 ? 1 : 0; pick(k, ch.btns[k]); });
      }));
      return { test: T.api };
    },
  });
})();
