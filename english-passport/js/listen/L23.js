/* Sentence Listening — Level 23 (Verbs 動詞): ROCKET_HOLD, CAMERA_SNAP, BUBBLE_ORDER
 * Level 23 has 19 verbs; 7 have no emoji (dye, borrow, wear, turn, tell, show, sell) → L.face shows a Chinese card.
 * Every key word is found in its sentence (L.key), but the games fall back to L.keyText if not. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;
  const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /** key word as written on a card (sentence-start capital removed, "I" kept) */
  const lab = (w) => { const k = L.key(w); let t = k ? k.text : L.keyText(w); if (!/^I\b/.test(t)) t = t.charAt(0).toLowerCase() + t.slice(1); return t; };
  /** does any word of `text` occur in the item's sentence? (such a distractor would also be "heard") */
  const inSent = (item, text) => { const toks = new Set(L.tokens(item.sentence).map((x) => x.w)); return String(text).toLowerCase().split(/\s+/).some((x) => toks.has(x)); };
  /** n distractor items of this level with a different label that is not in the target sentence */
  const distract = (ctx, item, n) => {
    const seen = new Set([lab(item).toLowerCase()]);
    return L.others(ctx, item, n + 8, { levelOnly: true }).filter((w) => { const t = lab(w).toLowerCase(); if (seen.has(t) || inSent(item, t) || inSent(item, w.word)) return false; seen.add(t); return true; }).slice(0, n);
  };
  const center = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; };

  L.css('L23', `
.l23a-sky{position:relative;width:100%;max-width:860px;flex:1;min-height:250px;max-height:470px;border-radius:24px;overflow:hidden;background:radial-gradient(circle at 20% 25%,rgba(255,255,255,.9) 0 1px,transparent 2px),radial-gradient(circle at 70% 15%,rgba(255,255,255,.8) 0 1px,transparent 2px),radial-gradient(circle at 45% 40%,rgba(255,255,255,.7) 0 1px,transparent 2px),radial-gradient(circle at 85% 45%,rgba(255,255,255,.8) 0 1px,transparent 2px),linear-gradient(#0b1d4d,#1f3f8f 60%,#3d6fd1);box-shadow:inset 0 0 0 4px rgba(255,255,255,.15)}
.l23a-clouds,.l23a-pad{position:absolute;left:0;right:0;display:flex;justify-content:space-around;gap:6px;padding:0 6px}
.l23a-clouds{top:6px;pointer-events:none}
.l23a-cloud{display:inline-block;font-size:clamp(2.2rem,7vw,3.2rem);line-height:1;transition:transform .3s}
.l23a-cloud.l23a-puff{transform:scale(1.45)}
.l23a-ground{position:absolute;left:0;right:0;bottom:0;height:34px;background:linear-gradient(#495057,#343a40);border-top:4px solid #868e96}
.l23a-pad{bottom:30px;align-items:flex-end}
.l23a-rocket{position:relative;border:0;background:#fff;color:#1d2340;border-radius:22px 22px 14px 14px;padding:6px 8px 8px;width:clamp(76px,21vw,150px);display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;box-shadow:0 6px 0 rgba(0,0,0,.35);transition:transform .9s cubic-bezier(.55,0,.85,.35),opacity .9s}
.l23a-rocket:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l23a-ship{display:block;font-size:clamp(2.4rem,7.5vw,3.6rem);line-height:1.15;transform:rotate(-45deg);font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l23a-flame{position:absolute;left:50%;bottom:-30px;font-size:1.6rem;transform:translateX(-50%) rotate(180deg);opacity:0;pointer-events:none}
.l23a-word{font-weight:900;font-size:clamp(1.05rem,3.6vw,1.45rem);line-height:1.15;word-break:break-word;text-align:center}
.l23a-fuel{display:block;width:100%;height:12px;border-radius:99px;background:#e9ecef;border:2px solid #495057;overflow:hidden}
.l23a-fuel>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f59f00,#e8590c)}
.l23a-holding{transform:translateY(3px);box-shadow:0 0 0 4px #ffd43b,0 3px 0 rgba(0,0,0,.35)}
.l23a-holding .l23a-ship{animation:l23a-rumble .12s infinite}
.l23a-holding .l23a-flame,.l23a-fly .l23a-flame,.l23a-tocloud .l23a-flame{opacity:1}
@keyframes l23a-rumble{50%{transform:rotate(-45deg) translate(1px,-1px)}}
.l23a-fly{transform:translateY(-130vh)!important}
.l23a-tocloud{opacity:0}
.l23a-tip{background:rgba(255,255,255,.94);color:#1d2340;border-radius:14px;padding:8px 14px;font-weight:800;text-align:center;max-width:680px}
.l23a-tip.l23a-warn{background:#fff3bf;color:#5c3d00;outline:3px solid #f59f00}
.l23b-cam{position:relative;margin-top:14px;width:min(560px,96%);flex:1;min-height:230px;max-height:420px;border-radius:26px;background:#212529;padding:12px 12px 10px;box-shadow:0 10px 0 rgba(0,0,0,.3);display:flex;flex-direction:column;gap:8px}
.l23b-cam::before{content:'';position:absolute;top:-12px;left:22%;width:70px;height:16px;border-radius:8px 8px 0 0;background:#212529}
.l23b-view{position:relative;flex:1;min-height:0;border-radius:16px;overflow:hidden;background:radial-gradient(circle at 50% 40%,#fff9db,#ffe8a1 60%,#f4c95d);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:#1d2340}
.l23b-c{position:absolute;width:26px;height:26px;border:4px solid #fff;filter:drop-shadow(0 0 2px rgba(0,0,0,.5))}
.l23b-c1{left:10px;top:10px;border-right:0;border-bottom:0}.l23b-c2{right:10px;top:10px;border-left:0;border-bottom:0}.l23b-c3{left:10px;bottom:10px;border-right:0;border-top:0}.l23b-c4{right:10px;bottom:10px;border-left:0;border-top:0}
.l23b-rec{position:absolute;left:44px;top:10px;font-weight:900;font-size:.9rem;color:#c92a2a;background:#fff;border-radius:8px;padding:0 6px}
.l23b-actor{display:flex;align-items:center;justify-content:center;gap:10px;min-height:1.2em}
.l23b-actor .ls-emoji,.l23b-kid{font-size:clamp(3rem,10vw,5rem)}
.l23b-actor .ls-zhcard{font-size:clamp(1.6rem,6vw,2.4rem);padding:8px 14px}
.l23b-in{animation:l23b-in .25s ease-out}
@keyframes l23b-in{from{transform:scale(.6) rotate(-6deg)}to{transform:none}}
.l23b-label{font-weight:900;font-size:clamp(1.3rem,4.6vw,2rem);background:#fff;border-radius:12px;padding:2px 14px;box-shadow:0 3px 0 rgba(0,0,0,.15)}
.l23b-label .zh{font-size:.8em;color:#495057}
.l23b-dots{display:flex;gap:8px;justify-content:center}
.l23b-dot{display:block;width:13px;height:13px;border-radius:50%;background:#495057;border:2px solid #adb5bd}
.l23b-dot.l23b-on{background:#ffd43b;border-color:#fff}
.l23b-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.l23b-flash.l23b-go{animation:l23b-flash .45s ease-out}
@keyframes l23b-flash{from{opacity:1}to{opacity:0}}
.l23b-stamp{position:absolute;right:14px;bottom:12px;font-size:clamp(1.1rem,4vw,1.5rem);font-weight:900;color:#fff;border-radius:12px;padding:2px 10px;transform:rotate(-8deg)}
.l23b-stamp.l23b-ok{background:#237032}.l23b-stamp.l23b-bad{background:#c92a2a}
.l23b-shutter{display:inline-flex;align-items:center;gap:10px;min-height:72px;padding:10px 30px;border:0;border-radius:999px;background:#c92a2a;color:#fff;font-weight:900;font-size:1.5rem;box-shadow:0 6px 0 #7d1a1a;cursor:pointer}
.l23b-shutter:active{transform:translateY(4px);box-shadow:0 2px 0 #7d1a1a}
.l23b-shutter:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l23c-strip{display:flex;flex-wrap:wrap;gap:6px 10px;justify-content:center;align-items:flex-end;background:rgba(255,255,255,.96);color:#1d2340;border-radius:16px;padding:8px 14px;min-height:50px;max-width:760px;box-shadow:0 4px 0 rgba(0,0,0,.18)}
.l23c-slot{min-width:2.6em;border-bottom:4px solid #0b7285;text-align:center;font-weight:900;font-size:clamp(1.1rem,3.8vw,1.5rem);line-height:1.3;padding:0 4px;color:#1d2340}
.l23c-slot.l23c-on{border-color:#237032;color:#237032}
.l23c-zh{background:rgba(255,255,255,.94);color:#1d2340;border-radius:12px;padding:4px 12px;font-weight:800}
.l23c-tank{position:relative;width:100%;max-width:860px;flex:1;min-height:230px;max-height:460px;border-radius:24px;overflow:hidden;background:linear-gradient(#0c8599,#0b7285 55%,#095c6b);box-shadow:inset 0 0 0 4px rgba(255,255,255,.18)}
.l23c-tank::after{content:'';position:absolute;inset:auto 0 0 0;height:26px;background:repeating-radial-gradient(circle at 10% 100%,#e9c46a 0 6px,#d4a373 6px 12px);opacity:.8;pointer-events:none}
.l23c-bubble{position:absolute;left:0;top:0;transform:translateX(-50%);border:3px solid rgba(255,255,255,.95);border-radius:999px;background:radial-gradient(circle at 30% 28%,#fff 0 10%,#eef8ff 12%,#d6eeff 70%,#b3dcff);color:#0b3d5c;font-weight:900;font-size:clamp(1.05rem,3.4vw,1.4rem);padding:10px 16px;min-width:64px;min-height:54px;white-space:nowrap;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);z-index:2}
.l23c-bubble:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l23c-pop{animation:l23c-pop .3s forwards;pointer-events:none}
@keyframes l23c-pop{to{transform:translateX(-50%) scale(1.7);opacity:0}}
.l23c-bad{animation:l23c-shake .35s;background:#ffe3e3;color:#7d1a1a;border-color:#c92a2a}
@keyframes l23c-shake{20%{transform:translateX(calc(-50% - 9px))}40%{transform:translateX(calc(-50% + 9px))}60%{transform:translateX(calc(-50% - 5px))}80%{transform:translateX(calc(-50% + 5px))}}
.l23c-lives{background:rgba(255,255,255,.94);color:#1d2340;border-radius:14px;padding:6px 14px;font-weight:800}
`);

  /* L23a Word Rocket — press and HOLD the rocket with the key word until its tank is full */
  L.register({
    id: 'L23a',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#0b1d4d,#1c3d8c)' });
      const sky = u.el('div', { class: 'l23a-sky', role: 'group', 'aria-label': 'Launch pad 火箭發射台' });
      const clouds = u.el('div', { class: 'l23a-clouds', 'aria-hidden': 'true' });
      const pad = u.el('div', { class: 'l23a-pad' });
      sky.append(clouds, u.el('div', { class: 'l23a-ground', 'aria-hidden': 'true' }), pad);
      const tip = u.el('div', { class: 'l23a-tip zh', role: 'status' });
      st.body.append(sky); st.foot.append(tip);
      const n = d === 'easy' ? 2 : d === 'hard' ? 4 : 3;
      const holdT = d === 'easy' ? 0.8 : d === 'hard' ? 1.2 : 1.0; // seconds to fill the tank
      let rockets = [], hold = null, answered = true, cur = null, finishRound = null;
      const setTip = (t, warn) => { tip.textContent = t; tip.classList.toggle('l23a-warn', !!warn); };
      const paint = (r) => { r.bar.style.width = Math.round(r.fuel * 100) + '%'; };
      const startHold = (r) => {
        if (answered || hold) return;
        hold = r; r.el.classList.add('l23a-holding'); EP.sfx.tick(); setTip('🔥 加油中…按住不要放！ Fuelling… keep holding!');
      };
      const stopHold = (r) => {
        if (hold !== r) return;
        hold = null; r.el.classList.remove('l23a-holding');
        if (!answered && r.fuel < 1) setTip('⛽ 放開太早了！要一直按住到油箱加滿。 Too early — hold until the tank is full.', true);
      };
      /** the rocket takes off (same path for a full tank and for the tests) */
      const launch = (r) => {
        if (answered || !r) return; answered = true; hold = null;
        r.fuel = 1; paint(r); r.el.classList.remove('l23a-holding');
        const item = cur; const ok = r.w === item; const p = center(ctx, r.el);
        EP.sfx.whoosh();
        if (ok) { r.el.classList.add('l23a-fly'); setTip('🚀 發射成功！ Lift-off!'); }
        else {
          const c = r.cloud.getBoundingClientRect(), b = r.el.getBoundingClientRect();
          r.el.style.transform = `translate(${c.left + c.width / 2 - (b.left + b.width / 2)}px,${c.top + c.height / 2 - (b.top + b.height / 2)}px) scale(.3)`;
          r.el.classList.add('l23a-tocloud'); setTip('☁️ 撞進雲裡了！ Into the clouds!', true);
        }
        ctx.wait(RM() ? 120 : 650).then(() => {
          if (!ok) { r.cloud.textContent = '⛈️'; r.cloud.classList.add('l23a-puff'); }
          return L.feedback(ctx, item, ok, { x: p.x, y: Math.max(40, p.y - 60), wrongText: 'Into the clouds! 撞進雲裡了' });
        }).then(() => finishRound && finishRound());
      };
      ctx.loop((dt) => {
        if (answered) return;
        for (const r of rockets) {
          if (hold === r) { r.fuel = Math.min(1, r.fuel + (dt * (ctx.speed || 1)) / holdT); paint(r); if (r.fuel >= 1) { launch(r); return; } }
          else if (r.fuel > 0) { r.fuel = Math.max(0, r.fuel - dt * 3); paint(r); }
        }
      });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        cur = item; finishRound = done; hold = null;
        st.head.innerHTML = '';
        st.head.append(L.say('🚀 聽句子，按住寫著你聽到的字的火箭，油箱加滿就發射！', 'Press and HOLD the rocket with the word you hear.'), L.listenBar(ctx, item));
        pad.innerHTML = ''; clouds.innerHTML = '';
        const opts = u.shuffle([item].concat(distract(ctx, item, n - 1)));
        rockets = opts.map((w) => {
          const r = { w, fuel: 0, bar: u.el('i') };
          r.el = u.el('button', { class: 'l23a-rocket', type: 'button', 'aria-label': `${lab(w)} — press and hold 按住發射` },
            d === 'easy' ? L.face(w, '1.6rem') : null,
            u.el('span', { class: 'l23a-ship', 'aria-hidden': 'true' }, '🚀'),
            u.el('span', { class: 'l23a-word' }, lab(w)),
            u.el('span', { class: 'l23a-fuel', 'aria-hidden': 'true' }, r.bar),
            u.el('span', { class: 'l23a-flame', 'aria-hidden': 'true' }, '🔥'));
          r.cloud = u.el('span', { class: 'l23a-cloud' }, '☁️');
          clouds.appendChild(r.cloud); pad.appendChild(r.el);
          const up = () => stopHold(r);
          ctx.on(r.el, 'pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); try { r.el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } startHold(r); });
          ctx.on(r.el, 'pointerup', up); ctx.on(r.el, 'pointercancel', up); ctx.on(r.el, 'lostpointercapture', up); ctx.on(r.el, 'blur', up);
          ctx.on(r.el, 'keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startHold(r); } });
          ctx.on(r.el, 'keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); up(); } });
          ctx.on(r.el, 'contextmenu', (e) => e.preventDefault());
          return r;
        });
        setTip('👆 按住火箭（鍵盤：Tab 選火箭，按住空白鍵） Hold the rocket (keyboard: hold Space).');
        answered = false;
        T.set(() => launch(rockets.find((r) => r.w === item)), () => launch(rockets.find((r) => r.w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* L23b Snapshot Camera — the character cycles through actions; snap the one in the sentence */
  L.register({
    id: 'L23b',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#862e9c,#d6336c)' });
      const n = d === 'easy' ? 3 : 4;
      const dur = d === 'easy' ? 1.7 : d === 'hard' ? 0.95 : 1.25; // seconds each action is shown
      const showZh = d !== 'hard';
      const cam = u.el('div', { class: 'l23b-cam' });
      const actor = u.el('div', { class: 'l23b-actor' });
      const label = u.el('div', { class: 'l23b-label' });
      const flash = u.el('div', { class: 'l23b-flash', 'aria-hidden': 'true' });
      const view = u.el('div', { class: 'l23b-view', role: 'group', 'aria-label': 'Camera screen 相機畫面' },
        ['l23b-c1', 'l23b-c2', 'l23b-c3', 'l23b-c4'].map((c) => u.el('span', { class: 'l23b-c ' + c, 'aria-hidden': 'true' })),
        u.el('span', { class: 'l23b-rec', 'aria-hidden': 'true' }, '● REC'), actor, label, flash);
      const dots = u.el('div', { class: 'l23b-dots', 'aria-hidden': 'true' });
      cam.append(view, dots);
      const shutter = u.el('button', { class: 'l23b-shutter', type: 'button', 'aria-label': 'Snap the photo 按快門' }, u.el('span', { 'aria-hidden': 'true' }, '📸'), 'Snap! 按快門');
      st.body.append(cam); st.foot.append(shutter);
      let frames = [], t = 0, shown = -1, running = false, answered = true, cur = null, finishRound = null, stamp = null;
      const showFrame = (i) => {
        if (i === shown) return; shown = i; const w = frames[i];
        actor.innerHTML = ''; actor.append(u.el('span', { class: 'l23b-kid', 'aria-hidden': 'true' }, '🧒'), L.face(w));
        // no emoji → L.face already shows the Chinese card, so the label only adds the English word
        label.innerHTML = ''; label.append(u.el('span', {}, w.word), showZh && EP.pic(w) ? u.el('span', { class: 'zh' }, ' ' + w.zh) : '');
        actor.classList.remove('l23b-in'); void actor.offsetWidth; actor.classList.add('l23b-in');
        Array.from(dots.children).forEach((x, k) => x.classList.toggle('l23b-on', k === i));
        EP.sfx.tick();
      };
      /** press the shutter (null = the show ran twice without a photo) */
      const snap = (missed) => {
        if (answered || (!running && !missed)) return;
        answered = true; running = false;
        const item = cur; const w = missed ? null : frames[shown]; const ok = !!w && w === item;
        if (!missed) { flash.classList.remove('l23b-go'); void flash.offsetWidth; flash.classList.add('l23b-go'); EP.sfx.click(); }
        stamp = u.el('div', { class: 'l23b-stamp ' + (ok ? 'l23b-ok' : 'l23b-bad') }, missed ? '⌛ Missed 錯過了' : ok ? '✔ Nice shot!' : '✘ Wrong action');
        view.appendChild(stamp);
        const p = center(ctx, view);
        L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: missed ? 'Missed it! 錯過了' : 'Wrong action 拍錯動作了' }).then(() => finishRound && finishRound());
      };
      ctx.on(shutter, 'click', () => snap(false));
      // Space / Enter anywhere (except on another button) also presses the shutter
      ctx.on(window, 'keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !(e.target && e.target.closest && e.target.closest('button'))) { e.preventDefault(); snap(false); } });
      ctx.loop((dt) => {
        if (!running || answered) return;
        t += dt * (ctx.speed || 1);
        if (t >= frames.length * dur * 2) { snap(true); return; }
        showFrame(Math.floor(t / dur) % frames.length);
      });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        cur = item; finishRound = done; running = false; answered = false; t = 0; shown = -1;
        if (stamp) { stamp.remove(); stamp = null; }
        frames = u.shuffle(distract(ctx, item, n - 1));
        frames.splice(u.randInt(1, frames.length), 0, item); // the heard action is never the first one
        dots.innerHTML = ''; frames.forEach(() => dots.appendChild(u.el('i', { class: 'l23b-dot' })));
        actor.innerHTML = ''; actor.append(u.el('span', { class: 'l23b-kid', 'aria-hidden': 'true' }, '🎬'));
        label.textContent = 'Ready… 準備';
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('📸 聽句子，角色做出句子說的動作時，馬上按快門！', 'Snap when the character does the action you hear.'), bar);
        const go = () => { if (answered || running || cur !== item) return; running = true; t = 0; showFrame(0); };
        // the show starts when the sentence has been played (or after 4 s at most)
        ctx.timeout(() => { Promise.race([bar.play(false), ctx.wait(4000)]).then(go); }, 350);
        const jumpTo = (i) => { go(); t = i * dur + 0.01; showFrame(i); };
        T.set(() => { if (answered) return; jumpTo(frames.indexOf(item)); snap(false); },
          () => { if (answered) return; jumpTo(frames.findIndex((w) => w !== item)); snap(false); });
      }));
      return { test: T.api };
    },
  });

  /* L23c Bubble Sentence — the words float up as bubbles; pop them in the order of the sentence */
  L.register({
    id: 'L23c',
    start(ctx) {
      const T = L.tester();
      const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#0b7285,#3bc9db)' });
      const allowed = d === 'easy' ? 1 : 0; const maxMiss = 3;
      const speed = RM() ? 0 : d === 'easy' ? 20 : d === 'hard' ? 44 : 30; // px / s
      const strip = u.el('div', { class: 'l23c-strip', role: 'group', 'aria-label': 'Your sentence 你的句子' });
      const zh = u.el('div', { class: 'l23c-zh zh' });
      const tank = u.el('div', { class: 'l23c-tank', role: 'group', 'aria-label': 'Bubbles 泡泡' });
      const lives = u.el('div', { class: 'l23c-lives', role: 'status' });
      st.body.append(strip); if (d === 'easy') st.body.append(zh); st.body.append(tank); st.foot.append(lives);
      let words = [], bs = [], slots = [], pos = 0, miss = 0, answered = true, cur = null, finishRound = null;
      const paintLives = () => { lives.textContent = '❤️'.repeat(Math.max(0, maxMiss - miss)) + '💔'.repeat(Math.min(miss, maxMiss)) + `  Mistakes 失誤 ${miss}/${maxMiss}`; };
      /** text on a bubble: easy keeps the capital letter of the first word (a hint) */
      const shownText = (tok, i) => (d === 'easy' || i > 0 || /^I\b/.test(tok.t) ? tok.t : tok.t.charAt(0).toLowerCase() + tok.t.slice(1));
      const finish = (ok) => {
        if (answered) return; answered = true;
        const item = cur;
        strip.innerHTML = ''; strip.append(u.el('span', { class: 'l23c-slot l23c-on' }, item.sentence));
        const p = center(ctx, strip);
        L.feedback(ctx, item, ok, { x: p.x, y: p.y + 30, wrongText: miss >= maxMiss ? 'Too many wrong pops 戳錯太多次' : 'Mind the order 注意順序' }).then(() => finishRound && finishRound());
      };
      const pop = (b) => {
        if (answered || !b || b.done) return;
        const want = words[pos];
        if (!b.fake && b.w === want.w) {
          b.done = true; b.el.classList.add('l23c-pop'); b.el.setAttribute('aria-hidden', 'true'); b.el.tabIndex = -1;
          const hadFocus = document.activeElement === b.el;
          ctx.timeout(() => b.el.remove(), 320);
          slots[pos].textContent = want.t; slots[pos].classList.add('l23c-on'); pos++;
          EP.sfx.pop();
          if (hadFocus) { const nx = bs.find((x) => !x.done); if (nx) nx.el.focus({ preventScroll: true }); }
          if (pos >= words.length) finish(miss <= allowed);
        } else {
          miss++; EP.sfx.wrong(); paintLives();
          b.el.classList.remove('l23c-bad'); void b.el.offsetWidth; b.el.classList.add('l23c-bad');
          if (miss >= maxMiss) finish(false);
        }
      };
      const place = () => {
        const W = tank.clientWidth || 600, H = tank.clientHeight || 300;
        const lanes = Math.max(2, Math.min(bs.length, Math.floor(W / 118)));
        const order = u.shuffle(bs);
        for (let k = 0; k < lanes; k++) {
          const mem = order.filter((_, j) => j % lanes === k); const off = u.rand(0, H);
          mem.forEach((b, m) => {
            b.x = ((k + 0.5) / lanes) * 100;
            // start inside the visible band (evenly spaced in the lane); while rising they wrap from the top to the bottom
            const band = Math.max(60, H - 64);
            b.y = speed ? 4 + ((off + (m * band) / mem.length) % band) : 4 + ((m + 0.5) * band) / mem.length - 27;
            b.ph = u.rand(0, 6);
          });
        }
      };
      ctx.loop((dt, now) => {
        if (!bs.length) return;
        const span = (tank.clientHeight || 300) + 60;
        for (const b of bs) {
          if (b.done) continue;
          if (speed) { b.y -= speed * dt * (ctx.speed || 1); if (b.y < -60) b.y += span; }
          b.el.style.top = b.y + 'px';
          b.el.style.left = `calc(${b.x}% + ${speed ? Math.sin(now * 1.4 + b.ph) * 10 : 0}px)`;
        }
      });
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        cur = item; finishRound = done; pos = 0; miss = 0;
        words = L.tokens(item.sentence);
        st.head.innerHTML = '';
        st.head.append(L.say('🫧 聽句子，照字的順序一個一個戳破泡泡！', 'Pop the bubbles in the order of the words.'), L.listenBar(ctx, item));
        zh.textContent = '💡 ' + item.sentenceZh;
        strip.innerHTML = ''; slots = words.map(() => strip.appendChild(u.el('span', { class: 'l23c-slot' }, ' ')));
        tank.querySelectorAll('.l23c-bubble').forEach((x) => x.remove());
        const list = words.map((tok, i) => ({ text: shownText(tok, i), w: tok.w }));
        if (d === 'hard') { const o = distract(ctx, item, 1)[0]; if (o) list.push({ text: lab(o), w: '#' + lab(o).toLowerCase(), fake: true }); }
        bs = u.shuffle(list).map((b) => {
          b.el = u.el('button', { class: 'l23c-bubble', type: 'button' }, b.text);
          ctx.on(b.el, 'click', () => pop(b)); tank.appendChild(b.el); return b;
        });
        place(); paintLives();
        answered = false;
        T.set(() => { if (answered) return; while (!answered && pos < words.length) { const b = bs.find((x) => !x.done && !x.fake && x.w === words[pos].w); if (!b) break; pop(b); } },
          () => { if (answered) return; let g = 0; while (!answered && g++ < maxMiss + 1) pop(bs.find((x) => !x.done && (x.fake || x.w !== words[pos].w))); });
      }));
      return { test: T.api };
    },
  });
})();
