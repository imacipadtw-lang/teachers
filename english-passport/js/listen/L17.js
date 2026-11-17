/* Sentence Listening — Level 17 (Things around us 生活用品): DRAG_GIVE, FISHING, DICTATION_BLANKS
 * L17a Lost & Found Desk · L17b Word Fishing · L17c Dictation Blanks.
 * Audio rule: only the official sentences are played; distractors are pictures / text only. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (local to this level) ---------- */
  const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /** is the word of `w` (or its plural) said in the sentence of `item`? (then it can't be a distractor) */
  const inSent = (item, w) => [w.word, L.keyText(w)].some((x) => {
    x = String(x).replace('...', '').trim(); if (!x) return false;
    return new RegExp('(^|[^A-Za-z0-9\'-])' + esc(x) + '(s|es)?(?![A-Za-z0-9-])', 'i').test(item.sentence);
  });
  /** label of an item's key word as heard (sentence-initial capital removed for common nouns) */
  const lab = (w) => { const k = L.keyText(w); return /^[A-Z][a-z'-]+$/.test(k) && w.word[0] !== w.word[0].toUpperCase() ? k[0].toLowerCase() + k.slice(1) : k; };
  /** distractor items: never mentioned in the sentence, different label (and picture when asked) */
  const others = (ctx, item, n, o) => {
    o = o || {}; const f = o.filter;
    return L.others(ctx, item, n, Object.assign({}, o, { filter: (w) => !inSent(item, w) && lab(w).toLowerCase() !== lab(item).toLowerCase() && (!o.difPic || !EP.pic(w) || EP.pic(w) !== EP.pic(item)) && (!f || f(w)) }));
  };
  /** centre of an element in stage coordinates (for floating points) */
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 3 }; };
  /** picture of an item, or its Chinese card (zhOnly: all choices as Chinese cards when the answer has no picture) */
  const face = (w, zhOnly) => (zhOnly || !EP.pic(w) ? u.el('span', { class: 'ls-zhcard zh' }, w.zh) : L.face(w));
  /** a word as shown on a tile: lower case unless it is always written with capitals (I, TV, T-shirt, COVID-19) */
  const disp = (t) => (t === 'I' || /[A-Z].*[A-Z]|^[A-Z]-|\d/.test(t) ? t : t.toLowerCase());
  const STOP = new Set("a an the is are am was were be been i you he she we they it its my your his her our their me him us them this that these those there here what who whom where when why how which do does did can could will would shall should to of in on at for with from by about and or but so not no yes let's lets very".split(' '));

  L.css('L17', `
.l17a-desk{display:flex;align-items:center;justify-content:center;gap:clamp(8px,3vw,22px);row-gap:22px;width:100%;max-width:780px;flex-wrap:wrap}
.l17a-sign{background:#fff3bf;color:#5c3d00;font-weight:900;border-radius:12px;padding:6px 12px;box-shadow:0 4px 0 rgba(0,0,0,.28);transform:rotate(-3deg)}
.l17a-owner{position:relative;display:flex;align-items:center;gap:12px;border:0;border-radius:24px;background:#fff;color:#1d2340;padding:10px 16px 10px 12px;min-height:92px;box-shadow:0 6px 0 rgba(0,0,0,.28);cursor:pointer;font:inherit;max-width:100%}
.l17a-who{font-size:clamp(2.8rem,9vw,4.2rem);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l17a-mood{position:absolute;left:4px;top:-14px;font-size:1.7rem;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l17a-bubble{position:relative;background:#e7f5ff;color:#1d2340;border-radius:16px;padding:8px 12px;font-weight:800;font-size:clamp(1rem,3.4vw,1.3rem);max-width:min(420px,58vw);text-align:left}
.l17a-bubble::before{content:'';position:absolute;left:-9px;top:50%;margin-top:-8px;border:8px solid transparent;border-right-color:#e7f5ff;border-left:0}
.l17a-owner.ls-over,.l17a-owner:focus-visible{outline:4px dashed #ffd43b;outline-offset:3px}
.l17a-shelf{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,2vw,16px);padding:14px 12px 20px;border-radius:18px;background:linear-gradient(#8d5a2b,#6b4423);box-shadow:inset 0 -12px 0 rgba(0,0,0,.25),0 6px 0 rgba(0,0,0,.25);width:100%;max-width:780px}
.l17a-shelf-lbl{width:100%;text-align:center;color:#fff3bf;font-weight:900;font-size:.95rem}
.l17a-thing{width:clamp(74px,19vw,112px);aspect-ratio:1;border:0;border-radius:18px;background:#fff8e6;color:#1d2340;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:grab;box-shadow:0 5px 0 rgba(0,0,0,.28);touch-action:none;font:inherit;padding:4px}
.l17a-thing .ls-emoji{font-size:clamp(2.1rem,7vw,3.1rem)}
.l17a-thing .ls-zhcard{font-size:clamp(.95rem,3.4vw,1.2rem)}
.l17a-zh{font-size:.85rem;font-weight:800;color:#5c3d00}
.l17a-gone{visibility:hidden}
.l17a-right{background:#d3f9d8!important;box-shadow:0 0 0 4px #2b8a3e,0 5px 0 rgba(0,0,0,.25)!important}
.l17a-wrong{background:#ffe3e3!important;box-shadow:0 0 0 4px #c92a2a!important}
.l17a-fly{position:absolute;z-index:30;pointer-events:none;transition:transform .45s ease-in;margin:0}
.l17a-happy{animation:l17a-hop .5s}
.l17a-sad{animation:l17a-no .45s}
@keyframes l17a-hop{50%{transform:translateY(-10px)}}
@keyframes l17a-no{25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}

.l17b-sea{position:relative;flex:1 1 auto;width:100%;min-height:clamp(250px,50vh,520px);border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#d0ebff 0,#a5d8ff 20%,#1c7ed6 20%,#1864ab 62%,#0b3d75 100%);box-shadow:inset 0 0 0 4px rgba(255,255,255,.25);touch-action:manipulation}
.l17b-zone{position:absolute;top:20%;bottom:0;border-left:3px dashed rgba(255,255,255,.8);border-right:3px dashed rgba(255,255,255,.8);background:rgba(255,255,255,.12);pointer-events:none}
.l17b-boat{position:absolute;left:50%;top:20%;transform:translate(-50%,-86%);font-size:clamp(2.6rem,8vw,3.6rem);line-height:1;pointer-events:none;z-index:3;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l17b-line{position:absolute;width:3px;margin-left:-1.5px;background:#f8f9fa;z-index:2;pointer-events:none}
.l17b-hook{position:absolute;left:50%;bottom:0;transform:translate(-50%,65%);font-size:1.5rem;line-height:1}
.l17b-fish{position:absolute;left:0;top:0;display:flex;align-items:center;gap:4px;border:0;background:transparent;padding:4px;cursor:pointer;will-change:transform;z-index:1;font:inherit;border-radius:16px;color:#1d2340}
.l17b-body{font-size:clamp(2.1rem,6vw,2.9rem);line-height:1;display:inline-block;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l17b-flip{transform:scaleX(-1)}
.l17b-tag{display:inline-flex;align-items:center;gap:4px;background:#fff;color:#1d2340;border-radius:12px;padding:4px 10px;font-weight:900;font-size:clamp(.95rem,2.8vw,1.25rem);box-shadow:0 3px 0 rgba(0,0,0,.3);white-space:nowrap}
.l17b-tag .ls-emoji{font-size:1.3rem}
.l17b-under .l17b-tag{box-shadow:0 0 0 4px #ffd43b,0 3px 0 rgba(0,0,0,.3)}
.l17b-caught .l17b-tag{background:#d3f9d8;box-shadow:0 0 0 4px #2b8a3e}
.l17b-bad .l17b-tag{background:#ffe3e3;box-shadow:0 0 0 4px #c92a2a}
.l17b-fish:focus-visible{outline:4px solid #ffd43b}
.l17b-drop{min-width:min(320px,88vw)}
.l17b-msg{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:#fff;color:#1d2340;font-weight:900;border-radius:12px;padding:4px 12px;z-index:4;white-space:nowrap;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.l17b-msg:empty{display:none}

.l17c-paper{color:#1d2340;border-radius:18px;padding:12px 16px 14px;box-shadow:0 6px 0 rgba(0,0,0,.22);width:100%;max-width:840px;display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff;border-left:8px solid #ff8787}
.l17c-title{font-weight:900;color:#364fc7;font-size:1rem}
.l17c-sent{font-size:clamp(1.25rem,4.4vw,2rem);font-weight:800;line-height:2;text-align:center}
.l17c-blank{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:4.4em;min-height:1.6em;margin:0 3px;padding:0 10px;border:0;border-bottom:4px solid #3b5bdb;border-radius:10px 10px 4px 4px;background:#edf2ff;color:#1d2340;font:inherit;cursor:pointer;vertical-align:middle;line-height:1.2}
.l17c-num{display:inline-flex;align-items:center;justify-content:center;width:1.35em;height:1.35em;border-radius:50%;background:#3b5bdb;color:#fff;font-size:.6em;font-weight:900;flex:none}
.l17c-word{display:inline-flex;flex-direction:column;align-items:center}
.l17c-active{box-shadow:0 0 0 3px #f08c00}
.l17c-ok{background:#d3f9d8;border-bottom-color:#2b8a3e}
.l17c-no{background:#ffe3e3;border-bottom-color:#c92a2a}
.l17c-fix{display:block;font-size:.55em;color:#1d6b2f;line-height:1.1}
.l17c-zh{font-size:1rem;color:#4a5078;font-weight:700}
.l17c-bank{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;width:100%;max-width:840px}
.l17c-banklbl{width:100%;text-align:center;font-weight:900}
.l17c-tile{min-width:92px;min-height:56px;padding:8px 16px;border:0;border-radius:14px;background:#fff3bf;color:#1d2340;font:inherit;font-weight:900;font-size:clamp(1.1rem,3.6vw,1.5rem);box-shadow:0 5px 0 #e0a800;cursor:grab;touch-action:none}
.l17c-tile:focus-visible,.l17c-blank:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l17c-used{visibility:hidden}
.l17c-nw{white-space:nowrap}
`);

  /* ======================= L17a Lost & Found Desk (DRAG_GIVE) ======================= */
  const WHO = { she: '👩', her: '👩', he: '👨', his: '👨', i: '🧒', my: '🧒', me: '🧒', we: '👫', they: '👪', you: '🧑' };
  const whoOf = (item) => { for (const t of L.tokens(item.sentence)) if (WHO[t.w]) return WHO[t.w]; return u.pick(['🧑', '👧', '👦', '👵', '👴']); };

  L.register({
    id: 'L17a',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#2b1d4e 0%,#4c2f7a 55%,#7048a8 100%)' });
      const n = d === 'easy' ? 3 : d === 'hard' ? 5 : 4;
      const who = u.el('span', { class: 'l17a-who', 'aria-hidden': 'true' }, '🧑');
      const mood = u.el('span', { class: 'l17a-mood', 'aria-hidden': 'true' }, '');
      const bubble = u.el('span', { class: 'l17a-bubble' }, '');
      const owner = u.el('button', { class: 'l17a-owner', 'aria-label': 'Owner 失主：把失物交給他 Give it here' }, mood, who, bubble);
      const desk = u.el('div', { class: 'l17a-desk' }, u.el('div', { class: 'l17a-sign' }, '🧳 Lost & Found 失物招領'), owner);
      const shelf = u.el('div', { class: 'l17a-shelf', role: 'group', 'aria-label': 'Lost and found shelf 失物架' }, u.el('div', { class: 'l17a-shelf-lbl' }, '📦 失物架 Lost things'));
      const slots = Array.from({ length: n }, () => { const b = u.el('button', { class: 'ls-item l17a-thing' }); shelf.appendChild(b); return b; });
      st.body.append(desk, shelf);
      let give = null;
      const dnd = L.dnd(ctx, slots, [owner], (dEl) => { if (give) give(slots.indexOf(dEl)); });
      // keyboard: after choosing an item with Enter/Space, jump to the owner so one more Enter gives it
      slots.forEach((b) => ctx.on(b, 'click', (e) => { if (e.detail === 0 && b.classList.contains('ls-selected')) owner.focus(); }));
      const fly = (from, to) => {
        const wr = st.wrap.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        const g = from.cloneNode(true); g.classList.add('l17a-fly'); g.classList.remove('ls-selected'); g.setAttribute('aria-hidden', 'true'); g.setAttribute('tabindex', '-1');
        Object.assign(g.style, { left: a.left - wr.left + 'px', top: a.top - wr.top + 'px', width: a.width + 'px', height: a.height + 'px' });
        st.wrap.appendChild(g); void g.offsetWidth;
        g.style.transform = `translate(${b.left + b.width * 0.3 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.55)`;
        ctx.timeout(() => g.remove(), RM() ? 60 : 520);
      };
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🧳 失主說他掉了什麼？把對的失物拖給他（或先點失物，再點失主）。', 'Drag the right lost item to its owner.'), L.listenBar(ctx, item));
        dnd.clear();
        who.textContent = whoOf(item); mood.textContent = '❓'; owner.classList.remove('l17a-happy', 'l17a-sad');
        bubble.textContent = d === 'easy' ? (L.swapKey(item, '____') || '🔊 …') : '🔊 ♪ ♪ ♪';
        const zhOnly = !EP.pic(item);
        const opts = u.shuffle([item].concat(others(ctx, item, n - 1, { needPic: !zhOnly, difPic: true })));
        slots.forEach((b, i) => {
          const w = opts[i]; b.innerHTML = ''; b.className = 'ls-item l17a-thing'; b.hidden = !w; if (!w) return;
          b.setAttribute('aria-label', w.zh);
          b.append(...[face(w, zhOnly), d === 'easy' && !zhOnly ? u.el('span', { class: 'l17a-zh zh', 'aria-hidden': 'true' }, w.zh) : null].filter(Boolean));
        });
        let answered = false;
        give = (i) => {
          const w = opts[i]; if (answered || !w) return; answered = true; give = null; dnd.clear();
          const ok = w === item; const b = slots[i];
          fly(b, owner); b.classList.add('l17a-gone'); EP.sfx.whoosh();
          ctx.timeout(() => {
            owner.classList.add(ok ? 'l17a-happy' : 'l17a-sad'); mood.textContent = ok ? '😄' : '😕';
            bubble.textContent = ok ? 'Thank you! 謝謝你！' : 'That is not mine. 這不是我的。';
            if (!ok) { b.classList.remove('l17a-gone'); b.classList.add('l17a-wrong'); slots[opts.indexOf(item)].classList.add('l17a-right'); }
            const p = rel(ctx, owner);
            L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: 'Not that one 不是這個' }).then(done);
          }, RM() ? 60 : 480);
        };
        T.set(() => give && give(opts.indexOf(item)), () => give && give(opts.findIndex((w) => w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ======================= L17b Word Fishing (FISHING) ======================= */
  L.register({
    id: 'L17b',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#0b4f8a,#1c7ed6)' });
      const sea = u.el('div', { class: 'l17b-sea', role: 'group', 'aria-label': 'Pond 池塘：魚在游 fish are swimming' });
      const zone = u.el('div', { class: 'l17b-zone', 'aria-hidden': 'true' });
      const boat = u.el('div', { class: 'l17b-boat', 'aria-hidden': 'true' }, '🚣');
      const line = u.el('div', { class: 'l17b-line', 'aria-hidden': 'true' }, u.el('span', { class: 'l17b-hook' }, '🪝'));
      const msg = u.el('div', { class: 'l17b-msg', role: 'status' }, '');
      sea.append(zone, boat, line, msg);
      const dropBtn = u.el('button', { class: 'btn big go l17b-drop' }, '🎣 DROP 放下魚鉤');
      st.body.append(sea); st.foot.append(dropBtn);
      const nFish = d === 'easy' ? 3 : d === 'hard' ? 5 : 4;
      const crossT = d === 'easy' ? 9 : d === 'hard' ? 5.5 : 7;     // seconds for one crossing
      const winT = d === 'easy' ? 1.6 : d === 'hard' ? 0.8 : 1.15;   // seconds a fish stays in the catch zone
      // All fish swim as one evenly spaced school (same speed and direction, different depths), so at most
      // one fish is ever inside the catch zone: pressing DROP at the right moment is always fair.
      let fish = []; let cur = null; let tol = 45; let lineDepth = 14, lineTarget = 14; let msgT = 0;
      let maxW = 140, dir = 1, v0 = 100, clock = 0;
      const geo = () => { const W = sea.clientWidth, H = sea.clientHeight; return { W, H, hx: W / 2, sy: Math.round(H * 0.2) }; };
      const say = (t) => { msg.textContent = t; if (msgT) clearTimeout(msgT); msgT = ctx.timeout(() => (msg.textContent = ''), 1300); };
      ctx.loop((dt) => {
        const g = geo(); if (!g.W) return; clock += dt;
        lineDepth += (lineTarget - lineDepth) * Math.min(1, dt * 14);
        line.style.left = g.hx + 'px'; line.style.top = g.sy + 'px'; line.style.height = Math.max(4, lineDepth) + 'px';
        zone.style.left = g.hx - tol + 'px'; zone.style.width = tol * 2 + 'px';
        const ring = g.W + maxW; const n = fish.length; const top = g.H * 0.36, bot = g.H * 0.86;
        for (const f of fish) {
          let y = (n > 1 ? top + (bot - top) * f.lane / (n - 1) : (top + bot) / 2) + (RM() ? 0 : Math.sin(clock * 2.2 + f.lane * 1.7) * 4);
          if (f.hooked) { f.x = g.hx; y = g.sy + lineDepth + f.h0 * 0.35; }
          else {
            if (cur && !cur.frozen) {
              f.p += dir * v0 * dt * ctx.speed;
              if (f.p >= ring) { f.p -= ring; f.passes++; } else if (f.p < 0) { f.p += ring; f.passes++; }
              if (f.target && f.passes >= 2) swimAway();
            }
            f.x = f.p - maxW / 2;
          }
          f.y = y;
          f.el.style.transform = `translate(${Math.round(f.x - f.w0 / 2)}px, ${Math.round(y - f.h0 / 2)}px)`;
          f.el.classList.toggle('l17b-under', !f.hooked && Math.abs(f.x - g.hx) <= tol);
        }
      });
      let catchFish = () => {}, swimAway = () => {};
      const drop = () => {
        if (!cur || cur.answered || cur.dropping) return;
        const g = geo();
        const cand = fish.filter((f) => Math.abs(f.x - g.hx) <= tol).sort((a, b) => Math.abs(a.x - g.hx) - Math.abs(b.x - g.hx))[0];
        if (cand) return catchFish(cand);
        const c = cur; c.dropping = true; EP.sfx.whoosh(); lineTarget = g.H * 0.9 - g.sy;
        say('💨 Missed! 沒釣到，再試一次');
        ctx.timeout(() => { lineTarget = 14; c.dropping = false; }, RM() ? 120 : 520);
      };
      ctx.on(dropBtn, 'click', drop);
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎣 聽句子！句子裡的那條魚游到魚鉤下面（虛線之間）時，按「放下魚鉤」或點那條魚。', 'Drop the hook when the right fish swims under it.'), L.listenBar(ctx, item));
        fish.forEach((f) => f.el.remove()); fish = []; lineTarget = 14; msg.textContent = '';
        const opts = u.shuffle([item].concat(others(ctx, item, nFish - 1)));
        const lanes = u.shuffle(opts.map((_, i) => i));
        dir = Math.random() < 0.5 ? 1 : -1;
        fish = opts.map((w, i) => {
          const body = u.pick(['🐟', '🐠', '🐡']);
          const el = u.el('button', { class: 'l17b-fish', 'aria-label': `Fish 魚：${lab(w)}` },
            u.el('span', { class: 'l17b-body' + (dir > 0 ? ' l17b-flip' : ''), 'aria-hidden': 'true' }, body),
            u.el('span', { class: 'l17b-tag' }, d === 'easy' && EP.pic(w) ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, EP.pic(w)) : null, lab(w)));
          el.style.transform = 'translate(-9999px,0)'; sea.appendChild(el);
          const f = { w, el, lane: lanes[i], passes: 0, target: w === item, p: 0, x: -9999, y: 0, hooked: false, w0: el.offsetWidth || 120, h0: el.offsetHeight || 50 };
          ctx.on(el, 'click', () => {
            if (!cur || cur.answered) return;
            if (Math.abs(f.x - geo().hx) <= tol) catchFish(f); else say('⏳ Wait! 等牠游到魚鉤下面');
          });
          return f;
        });
        const g = geo(); const W = g.W || 600;
        maxW = Math.max.apply(null, fish.map((f) => f.w0)) + 10;
        const ring = W + maxW; v0 = ring / crossT;
        tol = Math.max(24, Math.min(u.clamp((v0 * winT) / 2, 30, 90), (ring / fish.length - 16) / 2));
        const ti = opts.indexOf(item); const delay = d === 'easy' ? 3.6 : d === 'hard' ? 2.6 : 3.1; // the right fish reaches the hook after the sentence
        const pT = u.clamp(g.hx + maxW / 2 - dir * v0 * delay, 0, ring - 1);
        fish.forEach((f, i) => { f.p = (((pT + ((i - ti) * ring) / fish.length) % ring) + ring) % ring; });
        const c = (cur = { item, answered: false, frozen: false, dropping: false });
        const finish = (ok, wrongText, at) => {
          const p = at ? rel(ctx, at) : { x: ctx.root.clientWidth / 2, y: ctx.root.clientHeight / 2 };
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText }).then(() => { fish.forEach((f) => f.el.remove()); fish = []; lineTarget = 14; done(); });
        };
        catchFish = (f) => {
          if (c.answered || cur !== c) return; c.answered = true; c.frozen = true;
          const gg = geo(); EP.sfx.whoosh();
          lineTarget = Math.max(20, f.y - gg.sy - f.h0 * 0.35);
          ctx.timeout(() => {
            f.hooked = true; lineTarget = 16; const ok = f.target;
            f.el.classList.add(ok ? 'l17b-caught' : 'l17b-bad');
            if (!ok) { const t = fish.find((x) => x.target); if (t) t.el.classList.add('l17b-caught'); }
            ctx.timeout(() => finish(ok, 'Wrong fish 釣錯魚了', f.el), RM() ? 80 : 480);
          }, RM() ? 60 : 300);
        };
        swimAway = () => {
          if (c.answered || cur !== c) return; c.answered = true; c.frozen = true;
          const t = fish.find((x) => x.target); if (t) t.el.classList.add('l17b-caught');
          finish(false, 'It swam away! 魚游走了', t ? t.el : null);
        };
        T.set(() => catchFish(fish.find((f) => f.target)), () => catchFish(fish.find((f) => !f.target) || fish[0]));
      }));
      return { test: T.api };
    },
  });

  /* ======================= L17c Dictation Blanks (DICTATION_BLANKS) ======================= */
  /** the two blanks of a sentence: the key word + one other content word, in sentence order */
  function blanksOf(item) {
    const toks = L.tokens(item.sentence); const k = L.key(item);
    const all = toks.map((t, i) => ({ t, i }));
    const inKey = (i) => k && i >= k.index && i < k.index + k.words;
    let keyTok = k ? all.find((x) => x.i === k.index) : null;
    const pool = (f) => all.filter((x) => !inKey(x.i) && (!keyTok || x.t.w !== keyTok.t.w) && f(x));
    let c = pool((x) => !STOP.has(x.t.w) && x.t.w.length > 1);
    if (!c.length) c = pool((x) => x.t.w.length > 1);
    if (!c.length) c = pool(() => true);
    if (!keyTok) { keyTok = c.length ? c.splice(u.randInt(0, c.length - 1), 1)[0] : all[0]; }
    const other = c.length ? u.pick(c) : all.find((x) => x !== keyTok);
    return [keyTok, other].filter(Boolean).sort((a, b) => a.i - b.i);
  }

  L.register({
    id: 'L17c',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#364fc7,#5c7cfa)' });
      const nTiles = d === 'easy' ? 3 : d === 'hard' ? 5 : 4;
      const sent = u.el('div', { class: 'l17c-sent', lang: 'en' });
      const zh = u.el('div', { class: 'l17c-zh zh' });
      const paper = u.el('div', { class: 'l17c-paper' }, u.el('div', { class: 'l17c-title' }, '📝 Dictation 聽寫考卷'), sent, zh);
      const bank = u.el('div', { class: 'l17c-bank', role: 'group', 'aria-label': 'Word bank 字庫' }, u.el('div', { class: 'l17c-banklbl' }, '🔤 字庫 Word bank'));
      const tiles = Array.from({ length: nTiles }, () => { const b = u.el('button', { class: 'l17c-tile', lang: 'en' }); bank.appendChild(b); return b; });
      const blanks = [0, 1].map((k) => u.el('button', { class: 'l17c-blank' }, u.el('span', { class: 'l17c-num', 'aria-hidden': 'true' }, String(k + 1)), u.el('span', { class: 'l17c-word' }, '')));
      st.body.append(paper, bank);
      let cur = null; let lastPlace = 0;
      const dnd = L.dnd(ctx, tiles, blanks, (dEl, tEl) => place(tiles.indexOf(dEl), blanks.indexOf(tEl)));
      tiles.forEach((b, ti) => ctx.on(b, 'click', () => { if (b.classList.contains('ls-selected')) { dnd.clear(); place(ti, null); } }));
      blanks.forEach((b, bi) => ctx.on(b, 'click', () => { if (Date.now() - lastPlace < 300 || !cur || cur.checking || cur.answered) return; if (cur.fill[bi] != null) unplace(bi); }));
      const render = () => {
        if (!cur) return;
        blanks.forEach((b, bi) => {
          const ti = cur.fill[bi]; const wEl = b.querySelector('.l17c-word');
          wEl.textContent = ti == null ? '____' : (cur.ans[bi].i === 0 ? cur.words[ti][0].toUpperCase() + cur.words[ti].slice(1) : cur.words[ti]);
          b.classList.toggle('l17c-active', ti == null && cur.fill.indexOf(null) === bi);
          b.setAttribute('aria-label', `Blank ${bi + 1} 第${bi + 1}格：` + (ti == null ? 'empty 空的' : cur.words[ti] + '（tap to remove 點一下拿掉）'));
        });
        tiles.forEach((t, ti) => t.classList.toggle('l17c-used', cur.fill.includes(ti)));
      };
      const unplace = (bi) => { cur.fill[bi] = null; EP.sfx.tick(); render(); };
      function place(ti, bi) {
        if (!cur || cur.answered || cur.checking || ti < 0 || !tiles[ti] || tiles[ti].hidden || cur.fill.includes(ti)) return;
        if (bi == null || bi < 0) bi = cur.fill.indexOf(null);
        if (bi < 0) return;
        cur.fill[bi] = ti; lastPlace = Date.now(); EP.sfx.pop(); render();
        if (cur.fill.every((x) => x != null)) { cur.checking = true; const c = cur; ctx.timeout(() => check(c), 420); }
      }
      function check(c) {
        if (c !== cur || c.answered) return; c.answered = true;
        const res = c.fill.map((ti, bi) => c.words[ti] === c.ansWords[bi]);
        const ok = res.every(Boolean);
        blanks.forEach((b, bi) => {
          b.classList.remove('l17c-active'); b.classList.add(res[bi] ? 'l17c-ok' : 'l17c-no');
          if (!res[bi]) b.querySelector('.l17c-word').append(u.el('span', { class: 'l17c-fix' }, '✔ ' + c.ans[bi].t.t));
        });
        const p = rel(ctx, paper);
        L.feedback(ctx, c.item, ok, { x: p.x, y: p.y, wrongText: 'Check the blanks 看看正確答案' }).then(c.done);
      }
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('📝 聽句子，把字庫的字依序填進空格 1、2（點字或拖曳；點空格可拿掉）。', 'Fill both blanks with words from the word bank.'), L.listenBar(ctx, item));
        dnd.clear();
        const ans = blanksOf(item);
        const ansWords = ans.map((a) => disp(a.t.t));
        // distractors: one key-like word (another item's key word) + content words from other sentences of the level
        const used = new Set(L.tokens(item.sentence).map((t) => t.w)); ansWords.forEach((w) => used.add(w.toLowerCase()));
        const dis = [];
        const add = (w) => { const k = w.toLowerCase(); if (!w || used.has(k) || dis.length >= nTiles - 2) return; used.add(k); dis.push(w); };
        others(ctx, item, 4).forEach((w) => { if (dis.length < (nTiles - 2 === 1 ? 1 : nTiles - 3)) add(disp(lab(w))); });
        const contentPool = u.shuffle(ctx.pool.filter((w) => w !== item)).flatMap((w) => L.tokens(w.sentence).map((t) => t.t)).filter((t) => !STOP.has(t.toLowerCase()) && t.length > 1);
        for (const t of contentPool) add(disp(t));
        for (const w of others(ctx, item, 8)) add(disp(lab(w)));
        const words = u.shuffle(ansWords.concat(dis));
        tiles.forEach((b, i) => { b.hidden = i >= words.length; b.textContent = words[i] || ''; b.setAttribute('aria-label', words[i] ? words[i] + '（字庫）' : 'empty'); b.classList.remove('l17c-used', 'ls-selected'); });
        sent.innerHTML = '';
        const raws = String(item.sentence).split(/\s+/).filter(Boolean);
        let ti = 0;
        raws.forEach((raw, ri) => {
          const clean = raw.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');
          if (ri) sent.append(' ');
          if (!clean) { sent.append(raw); return; }
          const bi = ans.findIndex((a) => a.i === ti);
          if (bi >= 0) {
            const at = raw.indexOf(clean); sent.append(u.el('span', { class: 'l17c-nw' }, raw.slice(0, at), blanks[bi], raw.slice(at + clean.length)));
            blanks[bi].className = 'l17c-blank'; blanks[bi].querySelector('.l17c-word').textContent = '____';
          } else sent.append(raw);
          ti++;
        });
        zh.textContent = d === 'easy' ? '💡 ' + item.sentenceZh : '';
        zh.hidden = d !== 'easy';
        cur = { item, ans, ansWords, words, fill: ans.map(() => null), answered: false, checking: false, done };
        render();
        const tileOf = (w) => words.indexOf(w);
        T.set(() => { place(tileOf(ansWords[0]), 0); place(tileOf(ansWords[1]), 1); },
          () => { const wr = words.findIndex((w) => !ansWords.includes(w)); place(wr, 0); place(tileOf(ansWords[1]), 1); });
      }));
      return { test: T.api };
    },
  });
})();
