/* Sentence Listening — Level 5 (Places · Weather · Seasons · People): SEQUENCE, SORT_BINS, DRAG_TO_MAP
 * L05a Day Trip Planner: hear 2–3 official sentences in a row, put the trip cards in the order heard.
 * L05b Town Post Office: hear a sealed postcard, drag it to the Weather / Season / People / Place mailbox.
 * L05c Where's My Friend?: hear where your friend is, drag the friend token onto the right map pin. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* pictures for level-5 words without an emoji in the data (cards only, never spoken) */
  const PIC = { classroom: '🏫', street: '🛣️', weather: '🌦️', warm: '🌤️', children: '🧒', Miss: '👩‍🏫', 'Mr.': '👨', 'Mrs.': '👩‍⚕️' };
  const pic = (w) => EP.pic(w) || PIC[w.word] || '';
  /** does `sentence` also name `word` (any inflected form)? e.g. "It is cold in winter." names winter */
  const mentions = (sentence, word) => !!EP.cloze({ word, sentence });
  /** two items that cannot be told apart from their sentences / cards */
  const clash = (a, b) => a === b || a.zh === b.zh || (!!pic(a) && pic(a) === pic(b)) || mentions(a.sentence, b.word) || mentions(b.sentence, a.word);
  /** picture + Chinese card */
  const card = (w, extra) => u.el('span', { class: 'l05-card' },
    pic(w) ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, pic(w)) : null,
    u.el('span', { class: 'l05-zh zh' }, w.zh), extra || null);
  const centre = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };

  L.css('L05', `
.l05-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1.15;text-align:center}
.l05-card .ls-emoji{font-size:clamp(1.8rem,5.5vw,2.5rem)}
.l05-zh{font-weight:900;font-size:clamp(.95rem,3.3vw,1.12rem);color:#1d2340}
.l05a-dots{display:flex;gap:6px}
.l05a-dot{width:30px;height:30px;border-radius:50%;background:#0b4f5c;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;transition:transform .2s,background .2s;box-shadow:0 2px 0 rgba(0,0,0,.25)}
.l05a-dot.on{background:#ffd43b;color:#5c3d00;transform:scale(1.25)}
.l05a-trip{position:relative;display:flex;gap:clamp(8px,3vw,30px);justify-content:center;width:100%;padding:12px 4px 4px}
.l05a-trip::before{content:'';position:absolute;left:10%;right:10%;top:55%;border-top:5px dashed rgba(255,255,255,.7);z-index:0}
.l05a-bus{position:absolute;left:4%;top:55%;transform:translate(-50%,-60%);font-size:clamp(1.6rem,5vw,2.3rem);z-index:2;transition:left .5s}
@media (max-width:560px){.l05a-bus{display:none}}
.l05a-slot{position:relative;z-index:1;width:clamp(98px,27vw,168px);min-height:clamp(128px,21vh,158px);border-radius:18px;border:3px dashed #fff;background:#0c8599;color:#fff;display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px 8px;cursor:pointer;font:inherit}
.l05a-slot.filled{background:#fff;border-style:solid;border-color:#ffd43b;color:#1d2340}
.l05a-slot .l05-card{margin:auto}
.l05a-slot:focus-visible,.l05a-card:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l05a-time{font-weight:900;font-size:.88rem;background:#0b4f5c;color:#fff;border-radius:999px;padding:2px 9px;white-space:nowrap}
.l05a-hole{font-size:2.2rem;font-weight:900;margin:auto}
.l05a-slot.ok{border-color:#2f9e44;background:#d3f9d8}
.l05a-slot.bad{border-color:#e03131;background:#ffe3e3}
.l05a-mark{position:absolute;top:-12px;right:-10px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:1.1rem}
.l05a-slot.ok .l05a-mark{background:#2b8a3e}.l05a-slot.bad .l05a-mark{background:#c92a2a}
.l05a-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:10px;border-radius:18px;background:rgba(0,0,0,.22);width:100%;max-width:640px}
.l05a-tray-title{width:100%;text-align:center;font-weight:800;color:#fff;font-size:.95rem}
.l05a-card{border:0;border-radius:16px;background:#fff;padding:8px 10px;min-width:98px;min-height:92px;box-shadow:0 5px 0 rgba(0,0,0,.22);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:inherit;color:#1d2340;transition:transform .15s}
.l05a-card:hover{transform:translateY(-3px)}
.l05a-card.used{visibility:hidden}
.l05a-szh{font-size:.8rem;font-weight:700;color:#495057;max-width:9.5em}
.l05a-list{text-align:left;margin:8px 0 0;padding-left:1.4em;font-size:1.05rem;line-height:1.35}
.l05a-list li{margin:4px 0}
.l05b-desk{display:flex;flex-direction:column;align-items:center;gap:clamp(12px,3.5vh,30px);width:100%}
.l05b-post{position:relative;width:clamp(210px,56vw,300px);border:0;border-radius:14px;padding:9px;cursor:grab;touch-action:none;font:inherit;color:#1d2340;background:repeating-linear-gradient(45deg,#e03131 0 12px,#fff 12px 24px,#1971c2 24px 36px,#fff 36px 48px);box-shadow:0 8px 0 rgba(0,0,0,.22);transition:transform .45s ease-in}
.l05b-post.l05b-reset{transition:none}
.l05b-inner{position:relative;background:#fffdf5;border-radius:8px;min-height:clamp(112px,19vh,150px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 10px}
.l05b-stamp{position:absolute;top:6px;right:6px;border:2px dashed #c92a2a;border-radius:6px;padding:0 4px;font-size:1.4rem;background:#fff5f5}
.l05b-big{font-size:clamp(2.4rem,8vw,3.2rem)}
.l05b-no{font-weight:800;font-size:.95rem;color:#495057}
.l05b-boxes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(10px,2vw,18px);width:100%;max-width:820px}
.l05b-box{position:relative;border:0;border-radius:42px 42px 14px 14px;padding:26px 6px 10px;color:#fff;font:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.28);min-height:clamp(112px,21vh,168px)}
.l05b-box b{font-size:1.35rem}
.l05b-box .ls-emoji{font-size:clamp(1.8rem,5vw,2.4rem)}
.l05b-en{font-weight:800;font-size:.95rem}
.l05b-slot{position:absolute;top:11px;left:25%;right:25%;height:7px;border-radius:4px;background:rgba(0,0,0,.5)}
.l05b-weather{background:#1864ab}.l05b-season{background:#2b7a3b}.l05b-people{background:#a61e4d}.l05b-place{background:#5f3dc4}
.l05b-count{position:absolute;top:6px;right:8px;min-width:30px;height:30px;border-radius:15px;background:#ffd43b;color:#5c3d00;font-weight:900;display:flex;align-items:center;justify-content:center;padding:0 6px;box-shadow:0 2px 0 rgba(0,0,0,.25)}
.l05b-box:focus-visible,.l05b-post:focus-visible{outline:4px solid #1d2340;outline-offset:3px}
.l05b-box.l05b-right{outline:6px solid #ffd43b;outline-offset:3px;animation:l05b-pulse .5s 3}
@keyframes l05b-pulse{50%{transform:scale(1.06)}}
@media (max-width:560px){.l05b-boxes{grid-template-columns:repeat(2,minmax(0,1fr))}.l05b-box{min-height:clamp(96px,15vh,140px)}}
.l05c-map{position:relative;width:100%;flex:1;min-height:300px;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 30% 30%,#c3fae8,#b2f2bb 60%,#8ce99a);box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
.l05c-road{position:absolute;background:#6c757d}
.l05c-road.h{left:0;right:0;top:38%;height:9%;background:#6c757d repeating-linear-gradient(90deg,transparent 0 18px,#ffe066 18px 34px) center/100% 4px no-repeat}
.l05c-road.v{top:0;bottom:0;left:46%;width:8%;background:#6c757d repeating-linear-gradient(180deg,transparent 0 18px,#ffe066 18px 34px) center/4px 100% no-repeat}
.l05c-river{position:absolute;right:-8%;top:-10%;width:16%;height:125%;background:#74c0fc;transform:rotate(14deg)}
.l05c-deco{position:absolute;transform:translate(-50%,-50%);font-size:clamp(1.2rem,3.8vw,1.9rem);pointer-events:none;line-height:1}
.l05c-pin{position:absolute;transform:translate(-50%,-50%);border:3px solid #fff;border-radius:16px;background:#fff;color:#1d2340;padding:14px 8px 6px;min-width:clamp(78px,22vw,118px);box-shadow:0 6px 0 rgba(0,0,0,.25);cursor:pointer;font:inherit;z-index:2}
.l05c-pin::before{content:'📍';position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:1.5rem;line-height:1}
.l05c-pin.ok{border-color:#2f9e44;background:#d3f9d8}
.l05c-pin.bad{border-color:#e03131;background:#ffe3e3}
.l05c-pin.l05c-show{border-color:#fcc419;animation:l05b-pulse .5s 3}
.l05c-pin:focus-visible,.l05c-token:focus-visible{outline:4px solid #1d2340;outline-offset:2px}
.l05c-token{position:absolute;transform:translate(-50%,-50%);z-index:4;border:4px solid #fff;border-radius:999px;background:#f59f00;color:#1d2340;padding:4px 12px 4px 6px;display:flex;align-items:center;gap:4px;font:inherit;font-weight:900;box-shadow:0 6px 0 rgba(0,0,0,.28);cursor:grab;touch-action:none;transition:left .5s ease,top .5s ease}
.l05c-token .ls-emoji{font-size:clamp(1.8rem,5vw,2.3rem)}
.l05c-home{position:absolute;transform:translate(-50%,-50%);font-weight:800;font-size:.85rem;color:#1d2340;background:#fff;border-radius:999px;padding:2px 8px;pointer-events:none;z-index:1}
`);

  /* ---------- L05a Day Trip Planner (SEQUENCE) ---------- */
  /** split the round into trips of k stops whose sentences/cards can all be told apart */
  function makeTrips(ctx, items, k) {
    const left = items.slice(); const out = [];
    while (left.length) {
      const g = [left.shift()];
      for (let i = 0; i < left.length && g.length < k;) { if (g.every((x) => !clash(x, left[i]))) g.push(left.splice(i, 1)[0]); else i++; }
      out.push(g);
    }
    // a one-stop trip is no sequence: add another stop from the level (it is tested too) or join another trip
    for (let gi = 0; gi < out.length; gi++) {
      const g = out[gi]; if (g.length >= 2) continue;
      const f = u.shuffle(ctx.pool).find((w) => !items.includes(w) && !out.some((x) => x.includes(w)) && g.every((x) => !clash(x, w)));
      if (f) { g.push(f); continue; }
      const host = out.find((h) => h !== g && h.length < 4 && h.every((x) => !clash(x, g[0])));
      if (host) { host.push(g[0]); out.splice(gi, 1); gi--; }
    }
    return out.map((g) => u.shuffle(g));
  }

  L.register({
    id: 'L05a',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#0b7285,#1098ad 55%,#3bc9db)' });
      const k = ctx.difficulty === 'easy' ? 2 : 3;
      const trips = makeTrips(ctx, ctx.items, k);
      const maxPlays = ctx.difficulty === 'hard' ? 3 : 99;
      const gap = ctx.difficulty === 'easy' ? 800 : ctx.difficulty === 'hard' ? 250 : 500;
      const rate = ctx.difficulty === 'hard' ? 1.1 : undefined;
      const TIMES = { 1: ['🕘 9:00'], 2: ['🕘 9:00', '🕑 2:00'], 3: ['🕘 9:00', '🕛 12:00', '🕒 3:00'], 4: ['🕘 9:00', '🕚 11:00', '🕑 2:00', '🕓 4:00'] };

      L.rounds(ctx, trips, (trip) => new Promise((done) => {
        st.head.innerHTML = ''; st.body.innerHTML = ''; st.foot.innerHTML = '';
        const n = trip.length; let answered = false; let playId = 0; let plays = 0;
        const dots = trip.map((_, i) => u.el('span', { class: 'l05a-dot', 'aria-hidden': 'true' }, String(i + 1)));
        const playAll = async (slow) => {
          if (answered) return;
          if (plays >= maxPlays) { ctx.toast('Hard 模式最多聽 3 次'); return; }
          plays++; const id = ++playId;
          for (let i = 0; i < n; i++) {
            if (id !== playId || ctx.ended) return;
            dots.forEach((d, j) => d.classList.toggle('on', j === i));
            await ctx.say(trip[i], { sentence: true, slow, rate });
            if (id !== playId) return;
            await ctx.wait(gap);
          }
          if (id === playId) dots.forEach((d) => d.classList.remove('on'));
        };
        const tag = EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(trip[0], 'sentence')) : null;
        const bar = u.el('div', { class: 'ls-listen' },
          u.el('button', { class: 'btn blue big ls-play', 'aria-label': `Play the ${n} sentences 播放 ${n} 句行程`, onclick: () => playAll(false) }, '🔊 ', `Listen 聽 ${n} 句`),
          u.el('button', { class: 'btn small ls-slow', 'aria-label': 'Play slowly 慢速播放', onclick: () => playAll(true) }, '🐢 Slow 慢速'),
          u.el('span', { class: 'l05a-dots' }, dots), tag);
        st.head.append(L.say(`🗓️ 導遊一口氣說了 ${n} 句話，照聽到的順序點行程卡排好！`, 'Tap the cards in the order you hear.'), bar);

        // itinerary slots
        const placed = trip.map(() => null);
        const bus = u.el('span', { class: 'l05a-bus', 'aria-hidden': 'true' }, '🚌');
        const slots = trip.map((_, i) => {
          const b = u.el('button', { class: 'l05a-slot' });
          ctx.on(b, 'click', () => unplace(i)); return b;
        });
        const tripEl = u.el('div', { class: 'l05a-trip', role: 'group', 'aria-label': 'Today\'s trip 今天的行程' }, bus, slots);
        // shuffled cards (never already in the heard order)
        let deck; do { deck = u.shuffle(trip); } while (n > 1 && deck.every((w, i) => w === trip[i]));
        const cards = deck.map((w) => {
          const b = u.el('button', { class: 'l05a-card', 'aria-label': w.zh + (ctx.difficulty === 'easy' ? ' ' + w.sentenceZh : '') },
            card(w, ctx.difficulty === 'easy' ? u.el('span', { class: 'l05a-szh zh' }, w.sentenceZh) : null));
          b._w = w; ctx.on(b, 'click', () => place(w)); return b;
        });
        const tray = u.el('div', { class: 'l05a-tray' }, u.el('div', { class: 'l05a-tray-title' }, '🎫 Trip cards 行程卡'), cards);
        st.body.append(tripEl, tray);
        const clearBtn = u.el('button', { class: 'btn small', onclick: () => { if (answered) return; placed.fill(null); render(); } }, '↺ Clear 重排');
        const checkBtn = u.el('button', { class: 'btn go big', onclick: () => check() }, '✅ Check 確認');
        st.foot.append(clearBtn, checkBtn);

        function render() {
          slots.forEach((b, i) => {
            const w = placed[i];
            b.innerHTML = ''; b.classList.toggle('filled', !!w);
            b.append(u.el('span', { class: 'l05a-time' }, TIMES[n][i]), w ? card(w) : u.el('span', { class: 'l05a-hole', 'aria-hidden': 'true' }, '?'));
            b.setAttribute('aria-label', `Stop ${i + 1} 第 ${i + 1} 站：` + (w ? w.zh + '（點一下拿回 tap to remove）' : 'empty 空的'));
          });
          cards.forEach((c) => { const used = placed.includes(c._w); c.classList.toggle('used', used); c.disabled = used || answered; });
          const full = !placed.includes(null);
          checkBtn.disabled = !full || answered; clearBtn.disabled = answered;
          const last = placed.reduce((a, w, i) => (w ? i : a), -1);
          bus.style.left = (last < 0 ? 4 : ((last + 0.5) / n) * 92 + 4) + '%';
        }
        function place(w) {
          if (answered || placed.includes(w)) return;
          const i = placed.indexOf(null); if (i < 0) return;
          placed[i] = w; EP.sfx.pop(); render();
          if (!placed.includes(null)) checkBtn.focus();
        }
        function unplace(i) { if (answered || !placed[i]) return; placed[i] = null; EP.sfx.click(); render(); }
        async function check() {
          if (answered || placed.includes(null)) return;
          answered = true; playId++; render();
          let right = 0;
          trip.forEach((w, i) => {
            const ok = placed[i] === w; if (ok) right++;
            slots[i].classList.add(ok ? 'ok' : 'bad');
            slots[i].append(u.el('span', { class: 'l05a-mark', 'aria-hidden': 'true' }, ok ? '✔' : '✘'));
            const p = centre(ctx, slots[i]);
            ctx.answer(w, ok, { x: p.x, y: p.y, silent: true });
          });
          const all = right === n;
          if (all) { EP.sfx.correct(); if (n >= 3) EP.sfx.coin(); } else EP.sfx.wrong();
          const fb = u.el('div', { class: 'ls-feedback ' + (all ? 'ok' : 'bad'), role: 'status' },
            u.el('div', { class: 'ls-fb-head' }, all ? '✔ Perfect trip! 行程全對' : `✘ ${right} / ${n} 對 — 正確順序 The right order`),
            all ? null : u.el('ol', { class: 'l05a-list' }, trip.map((w) => u.el('li', {}, u.el('b', {}, w.sentence), ' ', u.el('span', { class: 'zh' }, w.sentenceZh)))));
          await ctx.wait(450);
          ctx.root.appendChild(fb);
          if (all) await ctx.wait(900);
          else { for (const w of trip) { await ctx.say(w, { sentence: true }); await ctx.wait(200); } await ctx.wait(700); }
          fb.remove(); done();
        }
        render();
        ctx.timeout(() => playAll(false), 450);
        const fillWith = (order) => { if (answered) return; placed.fill(null); render(); order.forEach((w) => place(w)); check(); };
        T.set(() => fillWith(trip), () => fillWith(trip.slice(1).concat(trip[0])));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L05b Town Post Office (SORT_BINS) ---------- */
  const BINS = [
    { k: 'weather', zh: '天氣', en: 'Weather', ic: '🌦️' },
    { k: 'season', zh: '季節', en: 'Season', ic: '🍁' },
    { k: 'people', zh: '人物', en: 'People', ic: '🧑‍🤝‍🧑' },
    { k: 'place', zh: '地點', en: 'Place', ic: '📍' },
  ];
  /** topics a sentence fits: its own word's topic plus any other topic word it names ("It is cold in winter." → weather + season) */
  const topicsOf = (item) => {
    const s = new Set(); const own = L.sort5(item); if (own) s.add(own);
    Object.keys(L.SORT5).forEach((k) => L.SORT5[k].forEach((w) => { if (mentions(item.sentence, w)) s.add(k); }));
    return s;
  };

  L.register({
    id: 'L05b',
    roundSize: 8,
    pool: (ws) => ws.filter((w) => !!L.sort5(w)),
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#fff4e6,#ffe8cc 55%,#ffc078)', dark: false });
      const inner = u.el('div', { class: 'l05b-inner' });
      const post = u.el('button', { class: 'l05b-post', 'aria-label': 'Postcard 明信片：拖到信箱，或先點明信片再點信箱 Drag it to a mailbox' }, inner);
      const boxes = BINS.map((b) => {
        const n = u.el('span', { class: 'l05b-count', 'aria-hidden': 'true' }, '0');
        const el = u.el('button', { class: 'l05b-box l05b-' + b.k, 'aria-label': `${b.en} ${b.zh} mailbox 信箱` },
          u.el('span', { class: 'l05b-slot', 'aria-hidden': 'true' }), u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, b.ic),
          u.el('b', { class: 'zh' }, b.zh), u.el('span', { class: 'l05b-en' }, b.en), n);
        el._bin = b; el._n = n; el._count = 0; return el;
      });
      st.body.append(u.el('div', { class: 'l05b-desk' }, post, u.el('div', { class: 'l05b-boxes', role: 'group', 'aria-label': 'Mailboxes 信箱' }, boxes)));
      const hintBtn = ctx.difficulty === 'easy' ? u.el('button', { class: 'btn small', onclick: () => showHint() }, '💡 Hint 提示') : null;
      if (hintBtn) st.foot.append(hintBtn);
      let cur = null;
      const showFront = (no) => { inner.innerHTML = ''; inner.append(u.el('span', { class: 'l05b-stamp', 'aria-hidden': 'true' }, '🏤'), u.el('span', { class: 'l05b-big', 'aria-hidden': 'true' }, '💌'), u.el('span', { class: 'l05b-no' }, `Postcard 明信片 No. ${no}`)); };
      const reveal = (w) => { inner.innerHTML = ''; inner.append(u.el('span', { class: 'l05b-stamp', 'aria-hidden': 'true' }, '🏤'), card(w)); };
      const showHint = () => { if (cur && !cur.answered) { reveal(cur.item); EP.sfx.pop(); } };

      const drop = (box) => {
        if (!cur || cur.answered) return; cur.answered = true; ctl.clear();
        const { item, ok: okSet, done } = cur;
        const ok = okSet.has(box._bin.k);
        reveal(item);
        const p = centre(ctx, box);
        if (ok) {
          const pr = post.getBoundingClientRect(), br = box.getBoundingClientRect();
          post.style.transform = `translate(${br.left + br.width / 2 - (pr.left + pr.width / 2)}px,${br.top + br.height / 3 - (pr.top + pr.height / 2)}px) scale(.15) rotate(-12deg)`;
          box._count++; box._n.textContent = box._count; EP.sfx.whoosh();
        } else {
          ctx.shake(post);
          boxes.filter((b) => okSet.has(b._bin.k)).forEach((b) => b.classList.add('l05b-right'));
        }
        const names = BINS.filter((b) => okSet.has(b.k));
        ctx.timeout(() => {
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, showOnRight: names.length > 1, wrongText: `應該寄到「${names.map((b) => b.zh).join('／')}」It goes to ${names.map((b) => b.en).join(' / ')}` }).then(() => {
            boxes.forEach((b) => b.classList.remove('l05b-right'));
            post.classList.add('l05b-reset'); post.style.transform = ''; void post.offsetWidth; post.classList.remove('l05b-reset');
            done();
          });
        }, ok ? 480 : 250);
      };
      const ctl = L.dnd(ctx, [post], boxes, (d, t) => drop(t));
      boxes.forEach((b) => ctx.on(b, 'click', () => drop(b))); // one postcard: a mailbox can also be tapped directly

      L.rounds(ctx, ctx.items, (item, i) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('📮 聽明信片上的句子，把它寄到對的信箱：天氣、季節、人物、地點。', 'Drag the postcard to the right mailbox.'), L.listenBar(ctx, item));
        showFront(i + 1);
        cur = { item, ok: topicsOf(item), answered: false, done };
        const okBox = boxes.find((b) => cur.ok.has(b._bin.k));
        const badBox = boxes.find((b) => !cur.ok.has(b._bin.k));
        T.set(() => drop(okBox), () => drop(badBox));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L05c Where's My Friend? (DRAG_TO_MAP) ---------- */
  const SPOTS = [[18, 20], [50, 16], [82, 22], [17, 62], [83, 60], [50, 60]];
  const HOME = [50, 88];
  const DECO = [['🏪', 8, 40], ['🌳', 31, 30], ['🏠', 66, 30], ['🌲', 92, 8], ['🚗', 36, 43], ['🌳', 68, 78], ['🏡', 30, 82], ['🌷', 92, 88], ['🚦', 58, 36]];

  L.register({
    id: 'L05c',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(165deg,#2b8a3e,#40c057 60%,#8ce99a)' });
      const map = u.el('div', { class: 'l05c-map', role: 'group', 'aria-label': 'Town map 小鎮地圖' },
        u.el('div', { class: 'l05c-river', 'aria-hidden': 'true' }), u.el('div', { class: 'l05c-road h', 'aria-hidden': 'true' }), u.el('div', { class: 'l05c-road v', 'aria-hidden': 'true' }),
        DECO.map(([e, x, y]) => u.el('span', { class: 'l05c-deco', 'aria-hidden': 'true', style: { left: x + '%', top: y + '%' } }, e)),
        u.el('span', { class: 'l05c-home', style: { left: HOME[0] + '%', top: (HOME[1] + 8) + '%' } }, '🏠 Start 起點'));
      const nPins = ctx.difficulty === 'easy' ? 3 : ctx.difficulty === 'hard' ? 5 : 4;
      const pins = Array.from({ length: 5 }, () => { const b = u.el('button', { class: 'l05c-pin' }); map.appendChild(b); return b; });
      const token = u.el('button', { class: 'l05c-token', 'aria-label': 'Your friend 你的朋友：拖到圖釘，或先點朋友再點圖釘 Drag to a pin' },
        u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, '🧒'), u.el('span', {}, 'Friend 朋友'));
      map.appendChild(token);
      st.body.append(map);
      const setPos = (el, x, y) => { el.style.left = x + '%'; el.style.top = y + '%'; };
      let cur = null;

      const go = (pin) => {
        if (!cur || cur.answered || pin.hidden || !pin._w) return; cur.answered = true; ctl.clear();
        const ok = pin._w === cur.item;
        setPos(token, pin._x, pin._y - 15); EP.sfx.whoosh();
        const { item, done } = cur;
        ctx.timeout(() => {
          pin.classList.add(ok ? 'ok' : 'bad');
          if (!ok) { const r = pins.find((p) => p._w === item); r && r.classList.add('l05c-show'); }
          const p = centre(ctx, pin);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: `朋友在「${item.zh}」那裡 Your friend is at ${pic(item) || ''} ${item.zh}` }).then(done);
        }, 520);
      };
      const ctl = L.dnd(ctx, [token], pins, (d, t) => go(t));
      pins.forEach((p) => ctx.on(p, 'click', () => go(p))); // one token: a pin can also be tapped directly

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🧭 朋友打電話來！聽他說的句子，把朋友拖到地圖上對的圖釘。', 'Drag your friend to the right pin on the map.'), L.listenBar(ctx, item));
        const opts = u.shuffle([item].concat(L.others(ctx, item, nPins - 1, { filter: (w) => !clash(item, w) })));
        const spots = u.shuffle(SPOTS).slice(0, opts.length);
        pins.forEach((p, i) => {
          p.className = 'l05c-pin'; p.innerHTML = '';
          const w = opts[i];
          if (!w) { p.hidden = true; p._w = null; return; }
          p.hidden = false; p._w = w; p._x = spots[i][0]; p._y = spots[i][1];
          setPos(p, p._x, p._y); p.append(card(w)); p.setAttribute('aria-label', `Pin 圖釘：${w.zh}`);
        });
        token.style.transition = 'none'; setPos(token, HOME[0], HOME[1]); void token.offsetWidth; token.style.transition = '';
        cur = { item, answered: false, done };
        const right = pins.find((p) => p._w === item); const wrong = pins.find((p) => p._w && p._w !== item);
        T.set(() => go(right), () => go(wrong));
      }));
      return { test: T.api };
    },
  });
})();
