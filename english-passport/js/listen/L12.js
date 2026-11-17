/* Sentence Listening — Level 12 (Town, time & health): MULTI_SELECT, MAZE_PATH, REVERSE_MATCH
 * L12a Errand Checklist: Mom's voice messages (2–3 official sentences in a row) → tick every item mentioned → Submit.
 * L12b City Maze Signs: one crossing per sentence; take the road whose sign matches what you heard; reach the goal.
 * L12c Which One Says It?: one picture, three friends each say an official sentence; who is talking about the picture? */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (local to this level) ---------- */
  const toks = (s) => L.tokens(s).map((x) => x.w);
  /** does `sentence` contain `word` as whole word(s)? */
  const mentions = (sentence, word) => {
    const s = toks(sentence), w = toks(word); if (!w.length) return false;
    for (let i = 0; i + w.length <= s.length; i++) if (w.every((x, j) => s[i + j] === x)) return true;
    return false;
  };
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top }; };
  const srcTag = (item) => (EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(item, 'sentence')) : null);
  const nodes = (...a) => a.filter(Boolean);

  L.css('L12', `
.l12a-desk{width:100%;max-width:900px;display:flex;flex-direction:column;align-items:center;gap:12px}
.l12a-phone{display:flex;align-items:center;gap:10px;background:#fff;color:#1d2340;border-radius:20px;padding:8px 14px;box-shadow:0 5px 0 rgba(0,0,0,.2);font-weight:900}
.l12a-phone .l12a-mom{font-size:2rem;line-height:1;white-space:nowrap}
.l12a-msgs{display:flex;gap:6px}
.l12a-msg{min-width:44px;min-height:44px;border-radius:12px;border:3px solid #ced4da;background:#f1f3f5;color:#1d2340;font-weight:900;font-size:1.05rem;display:flex;align-items:center;justify-content:center;padding:0 8px}
button.l12a-msg{cursor:pointer}
.l12a-msg.l12a-on{border-color:#e64980;background:#ffdeeb;transform:scale(1.08)}
.l12a-msg.l12a-heard{border-color:#2f9e44}
.l12a-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%;background:#fffdf0;border-radius:18px;padding:12px;box-shadow:0 6px 0 rgba(0,0,0,.18);background-image:repeating-linear-gradient(#fffdf0 0 46px,#e7f5ff 46px 48px)}
@media (max-width:640px){.l12a-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
.l12a-chk{border:3px solid #dee2e6;border-radius:14px;background:#fff;color:#1d2340;font-weight:900;font-size:clamp(1.05rem,2.6vw,1.3rem);display:flex;align-items:center;gap:8px;padding:8px 10px;min-height:64px;cursor:pointer;text-align:left;font-family:inherit}
.l12a-chk .l12a-box{flex:none;width:30px;height:30px;border-radius:8px;border:3px solid #868e96;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#fff}
.l12a-chk[aria-pressed="true"]{border-color:#1c7ed6;background:#e7f5ff}
.l12a-chk[aria-pressed="true"] .l12a-box{background:#1c7ed6;border-color:#1c7ed6}
.l12a-chk .ls-emoji{font-size:1.9rem}
.l12a-chk .ls-zhcard{font-size:.95rem;white-space:nowrap}
.l12a-chk .l12a-txt{display:flex;flex-direction:column;line-height:1.15;min-width:0;overflow-wrap:break-word}
.l12a-chk .l12a-zh{font-size:.85rem;color:#495057}
.l12a-chk:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l12a-chk.l12a-good{border-color:#2b8a3e;background:#d3f9d8}
.l12a-chk.l12a-miss{border-color:#e8590c;background:#fff4e6}
.l12a-chk.l12a-extra{border-color:#c92a2a;background:#ffe3e3}
.l12a-chk .l12a-note{font-size:.8rem;font-weight:900;white-space:nowrap}
.l12a-chk .l12a-note:empty{display:none}
.l12a-good .l12a-note{color:#2b8a3e}.l12a-miss .l12a-note{color:#a63c06}.l12a-extra .l12a-note{color:#c92a2a}
@media (max-width:640px){
.l12a-chk{flex-direction:column;justify-content:center;position:relative;padding:8px 6px 6px;text-align:center;gap:2px}
.l12a-chk .l12a-box{position:absolute;left:6px;top:6px;width:26px;height:26px;font-size:1rem}
.l12a-chk .l12a-txt{align-items:center}
.l12a-chk .l12a-note{margin-left:0}
.l12a-phone{padding:6px 10px;gap:8px}
}
.l12a-hi.btn.blue{background:linear-gradient(180deg,#1c7ed6,#1864ab)}
.l12a-done.btn.go{background:linear-gradient(180deg,#2f9e44,#2b8a3e)}
.ls-feedback.l12a-fbtop{top:8px;transform:translateX(-50%);max-height:calc(100% - 16px);overflow:auto}
.l12a-fb-list{margin-top:8px;text-align:left;display:flex;flex-direction:column;gap:4px;font-size:1.05rem}
.l12a-fb-list .zh{font-size:.95rem;opacity:.95}

.l12b-map{width:100%;max-width:860px;display:flex;flex-direction:column;align-items:center;gap:10px}
.l12b-trail{display:flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:6px;background:rgba(255,255,255,.94);color:#1d2340;border-radius:999px;padding:4px 14px;font-weight:900;box-shadow:0 3px 0 rgba(0,0,0,.18)}
.l12b-dot{width:14px;height:14px;border-radius:50%;background:#ced4da;display:inline-block}
.l12b-dot.l12b-ok{background:#2f9e44}.l12b-dot.l12b-bad{background:#e8590c}.l12b-dot.l12b-now{background:#1c7ed6;box-shadow:0 0 0 3px #a5d8ff}
.l12b-cross{position:relative;width:100%;height:clamp(260px,50vh,400px);border-radius:24px;overflow:hidden;background:radial-gradient(circle at 20% 20%,#8ce99a,#51cf66 55%,#2f9e44);box-shadow:inset 0 0 0 4px rgba(255,255,255,.25)}
.l12b-main{position:absolute;left:0;right:0;bottom:0;height:62px;background:#495057;border-top:4px solid #adb5bd}
.l12b-main::after{content:'';position:absolute;left:0;right:0;top:50%;border-top:4px dashed #ffd43b}
.l12b-cols{position:absolute;inset:0 0 62px 0;display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr))}
.l12b-col{position:relative;display:flex;flex-direction:column;align-items:center;padding-top:10px;min-width:0}
.l12b-road{position:relative;flex:1;width:clamp(40px,8vw,58px);background:#495057;border-left:3px solid #adb5bd;border-right:3px solid #adb5bd}
.l12b-road::after{content:'';position:absolute;top:0;bottom:0;left:50%;border-left:3px dashed #ffd43b}
.l12b-sign{position:relative;z-index:2;border:0;border-radius:14px;background:#1971c2;color:#fff;font-weight:900;font-size:clamp(1rem,2.8vw,1.3rem);padding:6px 10px;min-height:64px;max-width:94%;display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.15;box-shadow:0 0 0 3px #fff,0 6px 0 3px rgba(0,0,0,.25);cursor:pointer;overflow-wrap:anywhere;text-align:center;font-family:inherit;justify-content:center}
.l12b-sign .ls-emoji{font-size:clamp(1.6rem,4vw,2.2rem)}
.l12b-sign .ls-zhcard{font-size:.9rem}
.l12b-sign .l12b-zh{font-size:.85rem;font-weight:800;color:#e7f5ff}
.l12b-sign:focus-visible{outline:4px solid #ffd43b;outline-offset:4px}
.l12b-sign.l12b-right{background:#2b8a3e}
.l12b-sign.l12b-wrong{background:#c92a2a}
.l12b-post{position:relative;z-index:1;width:8px;height:12px;background:#868e96;flex:none}
.l12b-block{position:absolute;z-index:3;top:62%;left:50%;transform:translateX(-50%);font-size:2.2rem;background:#fff;border-radius:12px;padding:0 6px;color:#1d2340;font-weight:900;text-align:center;line-height:1.1}
.l12b-block small{display:block;font-size:.75rem}
.l12b-walker{position:absolute;z-index:4;left:50%;top:0;font-size:clamp(2.4rem,6vh,3rem);line-height:1;transform:translate(-50%,-50%);transition:left .45s ease-in-out,top .5s ease-in-out;pointer-events:none}
.l12b-deco{position:absolute;bottom:68px;font-size:1.8rem;pointer-events:none}
@media (max-width:640px){.l12b-deco{display:none}}
.l12b-goal{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.92);color:#1d2340;font-weight:900;font-size:clamp(1.6rem,5vw,2.4rem);z-index:6;text-align:center}
.l12b-goal span{font-size:4rem}

.l12c-wrap{width:100%;max-width:900px;display:flex;flex-direction:column;align-items:center;gap:14px}
.l12c-card{background:#fff;color:#1d2340;border-radius:22px;padding:12px 26px;box-shadow:0 8px 0 rgba(0,0,0,.2);display:flex;flex-direction:column;align-items:center;gap:4px;min-width:min(240px,80vw);border:6px solid #ffe066}
.l12c-card .l12c-lb{font-size:.9rem;font-weight:800;color:#495057}
.l12c-card .ls-emoji{font-size:clamp(3.4rem,11vh,5rem)}
.l12c-card .ls-zhcard{font-size:clamp(1.6rem,5vh,2.2rem);padding:10px 16px}
.l12c-card .l12c-word{font-weight:900;font-size:1.3rem}
.l12c-friends{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%}
.l12c-f{background:rgba(255,255,255,.95);color:#1d2340;border-radius:20px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 5px 0 rgba(0,0,0,.18);border:4px solid transparent;min-width:0}
.l12c-f.l12c-talk{border-color:#f59f00}
.l12c-f.l12c-talk .l12c-av{animation:l12cTalk .5s ease-in-out infinite alternate}
@keyframes l12cTalk{to{transform:translateY(-6px) rotate(-4deg)}}
.l12c-av{font-size:clamp(2.4rem,7vh,3.2rem);line-height:1;position:relative}
.l12c-bub{position:absolute;right:-22px;top:-12px;font-size:1.4rem;visibility:hidden}
.l12c-talk .l12c-bub{visibility:visible}
.l12c-name{font-weight:900;font-size:.95rem}
.l12c-f .btn{width:100%;padding-left:6px;padding-right:6px;font-size:clamp(.95rem,2.4vw,1.1rem)}
.l12c-f.l12c-right{border-color:#2b8a3e;background:#d3f9d8}
.l12c-f.l12c-wrong{border-color:#c92a2a;background:#ffe3e3}
.l12c-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.l12c-tools .btn[aria-pressed="true"]{background:#ffd43b;color:#1d2340}
.l12c-hi.btn.blue{background:linear-gradient(180deg,#1c7ed6,#1864ab)}
.l12c-hi.btn.go{background:linear-gradient(180deg,#2f9e44,#2b8a3e)}
@media (max-width:420px){.l12c-f .btn{min-height:46px}}
`);

  /* ---------- L12a Errand Checklist — tick every item Mom mentions ---------- */
  L.register({
    id: 'L12a',
    roundSize: 8,
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#a61e4d,#e64980 55%,#fcc2d7)' });
      // groups of 2 (easy) or 3 sentences; never a group of 1 when it can be avoided
      const per = D === 'easy' ? 2 : 3; const n = ctx.items.length;
      let g = Math.ceil(n / per); if (g > 1 && Math.floor(n / g) < 2) g = Math.max(1, Math.floor(n / per));
      const groups = []; let at = 0;
      for (let i = 0; i < g; i++) { const sz = Math.floor(n / g) + (i < n % g ? 1 : 0); groups.push(ctx.items.slice(at, at + sz)); at += sz; }
      const desk = u.el('div', { class: 'l12a-desk' });
      st.body.append(desk);
      const submitBtn = u.el('button', { class: 'btn go big l12a-done' }, '✅ Done 送出');
      st.foot.append(submitBtn);
      let cur = null;
      ctx.on(submitBtn, 'click', () => cur && cur.submit());

      L.rounds(ctx, groups, (grp) => new Promise((done) => {
        st.head.innerHTML = ''; desk.innerHTML = '';
        // checklist: the mentioned items + other items of the level never mentioned in these sentences, no look-alikes
        const said = (w) => grp.some((x) => mentions(x.sentence, w.word));
        const used = new Set(grp.map((w) => w.zh)); const usedPic = new Set(grp.map((w) => EP.pic(w)).filter(Boolean));
        const fill = [];
        for (const w of u.shuffle(ctx.pool.concat(EP.levelWords(grp[0].level)))) {
          if (fill.length >= 6 - grp.length) break;
          if (grp.includes(w) || fill.includes(w) || said(w) || used.has(w.zh) || (EP.pic(w) && usedPic.has(EP.pic(w)))) continue;
          if (fill.some((x) => u.norm(x.word) === u.norm(w.word))) continue;
          fill.push(w); used.add(w.zh); if (EP.pic(w)) usedPic.add(EP.pic(w));
        }
        const list = u.shuffle(grp.concat(fill));
        // Mom's messages: play all in order (easy: each message can be replayed on its own)
        let plays = 0, playing = false, heardAll = false, token = {};
        const maxPlays = D === 'hard' ? 3 : 99;
        const msgEls = grp.map((w, i) => D === 'easy'
          ? u.el('button', { class: 'l12a-msg', 'aria-label': `Play message ${i + 1} 播放第 ${i + 1} 句` }, '🔊' + (i + 1))
          : u.el('span', { class: 'l12a-msg', 'aria-hidden': 'true' }, String(i + 1)));
        msgEls.forEach((b, i) => { if (b.tagName === 'BUTTON') ctx.on(b, 'click', () => playOne(i)); });
        const myToken = token;
        async function playAll(slow) {
          if (playing || cur === null) return;
          if (plays >= maxPlays) { ctx.toast('Hard 模式最多聽 3 次'); return; }
          plays++; playing = true;
          for (let i = 0; i < grp.length; i++) {
            if (ctx.ended || token !== myToken) break;
            msgEls.forEach((m, j) => m.classList.toggle('l12a-on', j === i));
            await ctx.say(grp[i], { sentence: true, slow });
            msgEls[i].classList.add('l12a-heard');
            if (i < grp.length - 1) await ctx.wait(500);
          }
          msgEls.forEach((m) => m.classList.remove('l12a-on'));
          playing = false;
          if (!heardAll) { heardAll = true; submitBtn.disabled = false; }
        }
        async function playOne(i) {
          if (playing) return; playing = true;
          msgEls.forEach((m, j) => m.classList.toggle('l12a-on', j === i));
          await ctx.say(grp[i], { sentence: true });
          msgEls[i].classList.add('l12a-heard'); msgEls[i].classList.remove('l12a-on'); playing = false;
        }
        const bar = u.el('div', { class: 'ls-listen' },
          u.el('button', { class: 'btn blue big l12a-hi', onclick: () => playAll(false) }, '🔊 Play all 全部播放'),
          u.el('button', { class: 'btn small', onclick: () => playAll(true) }, '🐢 Slow 慢速'), srcTag(grp[0]));
        st.head.append(L.say(`🛒 媽媽留了 ${grp.length} 句話：聽完後勾選「所有提到的」，再按送出！`, 'Tick every item mentioned, then press Done.'), bar);
        desk.append(u.el('div', { class: 'l12a-phone' }, u.el('span', { class: 'l12a-mom', 'aria-hidden': 'true' }, '👩📱'), u.el('span', { class: 'zh' }, '媽媽的留言 Mom'), u.el('span', { class: 'l12a-msgs' }, msgEls)));
        const box = u.el('div', { class: 'l12a-list', role: 'group', 'aria-label': 'Checklist 清單' });
        const entries = list.map((w) => {
          const pic = D !== 'hard' ? L.face(w) : null;
          const note = u.el('span', { class: 'l12a-note' });
          const b = u.el('button', { class: 'l12a-chk', 'aria-pressed': 'false' }, u.el('span', { class: 'l12a-box', 'aria-hidden': 'true' }),
            pic, u.el('span', { class: 'l12a-txt' }, nodes(u.el('span', {}, w.word), D === 'easy' ? u.el('span', { class: 'l12a-zh zh' }, w.zh) : null, note)));
          const e = { w, b, note, on: false };
          ctx.on(b, 'click', () => toggle(e));
          box.appendChild(b); return e;
        });
        desk.append(box);
        submitBtn.disabled = true;
        ctx.timeout(() => { submitBtn.disabled = false; }, 7000); // never stuck if audio is slow
        ctx.timeout(() => playAll(false), 400);
        let answered = false;
        function toggle(e) {
          if (answered) return;
          e.on = !e.on; e.b.setAttribute('aria-pressed', String(e.on)); e.b.querySelector('.l12a-box').textContent = e.on ? '✔' : ''; EP.sfx.pop();
        }
        cur = {
          submit() {
            if (answered) return; answered = true; cur = null; token = {}; EP.audio.stop(); submitBtn.disabled = true;
            const extras = entries.filter((e) => e.on && !grp.includes(e.w));
            const res = grp.map((w) => { const e = entries.find((x) => x.w === w); return { w, e, ok: e.on }; });
            // extra ticks count against: each one cancels a correct tick
            let pen = extras.length;
            for (const r of res.slice().reverse()) { if (pen <= 0) break; if (r.ok) { r.ok = false; r.cancel = true; pen--; } }
            res.forEach((r) => { r.e.b.classList.add(r.e.on ? 'l12a-good' : 'l12a-miss'); r.e.note.textContent = r.e.on ? '✔' : '漏勾 missed'; });
            extras.forEach((e) => { e.b.classList.add('l12a-extra'); e.note.textContent = '✘ 沒說 not said'; });
            res.forEach((r) => ctx.answer(r.w, r.ok, Object.assign(rel(ctx, r.e.b), { silent: true, points: 100 })));
            const all = res.every((r) => r.ok);
            all ? EP.sfx.correct() : EP.sfx.wrong();
            const nOk = res.filter((r) => r.ok).length;
            const card = u.el('div', { class: 'ls-feedback l12a-fbtop ' + (all ? 'ok' : 'bad'), role: 'status' },
              u.el('div', { class: 'ls-fb-head' }, all ? '✔ All done! 全部勾對了' : `✘ ${nOk} / ${res.length} 再聽一次`),
              extras.length ? u.el('div', { class: 'ls-fb-zh zh' }, `多勾了 ${extras.length} 個，會扣分 Extra ticks count against you`) : null,
              all ? null : u.el('div', { class: 'l12a-fb-list' }, grp.map((w, i) => u.el('div', {}, u.el('b', {}, `${i + 1}. ${w.sentence}`), ' ', u.el('span', { class: 'zh' }, w.sentenceZh)))));
            ctx.root.appendChild(card);
            (async () => {
              if (all) await ctx.wait(1100);
              else { for (const r of res) { if (!r.ok && !ctx.ended) await ctx.say(r.w, { sentence: true }); } await ctx.wait(1200); }
              card.remove(); done();
            })();
          },
        };
        T.set(() => { if (!cur) return; entries.forEach((e) => { if (e.on !== grp.includes(e.w)) toggle(e); }); cur.submit(); },
          () => { if (!cur) return; const x = entries.find((e) => !grp.includes(e.w)); entries.forEach((e) => { if (e.on !== (e === x)) toggle(e); }); cur.submit(); });
      }));
      return { test: T.api };
    },
  });

  /* ---------- L12b City Maze Signs — one crossing per sentence ---------- */
  L.register({
    id: 'L12b',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(170deg,#1864ab,#4dabf7 60%,#d0ebff)' });
      const nSigns = D === 'easy' ? 2 : 3;
      const items = ctx.items;
      const trail = u.el('div', { class: 'l12b-trail', role: 'img', 'aria-label': `${items.length} crossings to the goal 到終點有 ${items.length} 個路口` },
        u.el('span', { 'aria-hidden': 'true' }, '🚶'), items.map(() => u.el('span', { class: 'l12b-dot' })), u.el('span', { 'aria-hidden': 'true' }, '🏁'));
      const dots = Array.from(trail.querySelectorAll('.l12b-dot'));
      const cross = u.el('div', { class: 'l12b-cross' });
      const main = u.el('div', { class: 'l12b-main', 'aria-hidden': 'true' });
      const cols = u.el('div', { class: 'l12b-cols', role: 'group', 'aria-label': 'Road signs 路標' });
      cols.style.setProperty('--n', nSigns);
      const walker = u.el('div', { class: 'l12b-walker', 'aria-hidden': 'true' }, '🚶');
      cross.append(main, cols, walker, u.el('span', { class: 'l12b-deco', style: { left: '8px' }, 'aria-hidden': 'true' }, '🏠🌳'), u.el('span', { class: 'l12b-deco', style: { right: '8px' }, 'aria-hidden': 'true' }, '🌳🏢'));
      st.body.append(u.el('div', { class: 'l12b-map' }, trail, cross));
      const H = () => cross.clientHeight;
      const home = () => { walker.style.left = '50%'; walker.style.top = 'calc(100% - 31px)'; walker.style.transform = 'translate(-50%,-50%)'; };
      const walkTo = async (col) => {
        const cr = cross.getBoundingClientRect(), r = col.getBoundingClientRect(), sg = col.querySelector('.l12b-sign').getBoundingClientRect();
        const x = r.left - cr.left + r.width / 2;
        walker.style.transform = 'translate(-50%,-50%)' + (x > cr.width / 2 + 4 ? ' scaleX(-1)' : '');
        walker.style.left = x + 'px'; await ctx.wait(480);
        walker.style.top = Math.round(Math.min(H() - 70, sg.bottom - cr.top + 46)) + 'px'; await ctx.wait(520);
      };
      home();

      L.rounds(ctx, items, (item, idx) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🗺️ 每個路口聽一句話，走向「寫著你聽到的字」的路標！', 'Take the road with the right sign.'), L.listenBar(ctx, item));
        dots.forEach((d, i) => d.classList.toggle('l12b-now', i === idx));
        const others = L.others(ctx, item, nSigns - 1, { filter: (w) => !mentions(item.sentence, w.word) && !(EP.pic(w) && EP.pic(w) === EP.pic(item)) });
        const signs = u.shuffle([item].concat(others));
        cols.innerHTML = ''; home();
        const colEls = signs.map((w, i) => {
          const pic = D !== 'hard' ? EP.pic(w) : '';
          const b = u.el('button', { class: 'l12b-sign', 'aria-label': `Road ${i + 1} 第 ${i + 1} 條路：${w.word}` + (D === 'easy' ? ' ' + w.zh : '') },
            ...nodes(pic ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, pic) : null, u.el('span', {}, w.word), D === 'easy' ? u.el('span', { class: 'l12b-zh zh' }, w.zh) : null));
          const col = u.el('div', { class: 'l12b-col' }, b, u.el('div', { class: 'l12b-post', 'aria-hidden': 'true' }), u.el('div', { class: 'l12b-road', 'aria-hidden': 'true' }));
          ctx.on(b, 'click', () => pick(i));
          cols.appendChild(col); return { w, b, col };
        });
        let answered = false;
        async function pick(i) {
          if (answered) return; answered = true;
          const c = colEls[i]; const ok = c.w === item; const right = colEls.find((x) => x.w === item);
          EP.sfx.whoosh && EP.sfx.whoosh();
          const fb = L.feedback(ctx, item, ok, Object.assign(rel(ctx, c.b), { wrongText: 'Dead end! 走錯路了' }));
          c.b.classList.add(ok ? 'l12b-right' : 'l12b-wrong');
          dots[idx].classList.remove('l12b-now'); dots[idx].classList.add(ok ? 'l12b-ok' : 'l12b-bad');
          await walkTo(c.col);
          if (!ok) {
            c.col.appendChild(u.el('div', { class: 'l12b-block', 'aria-hidden': 'true' }, '🚧', u.el('small', { class: 'zh' }, '死路')));
            ctx.shake(c.b);
            walker.style.top = 'calc(100% - 31px)'; await ctx.wait(500);
            right.b.classList.add('l12b-right'); await walkTo(right.col);
          }
          await fb;
          if (idx === items.length - 1 && !ctx.ended) {
            const goal = u.el('div', { class: 'l12b-goal', role: 'status' }, u.el('span', { 'aria-hidden': 'true' }, '🏁'), 'Goal! ', u.el('div', { class: 'zh' }, '到達終點！'));
            cross.appendChild(goal); EP.sfx.win && EP.sfx.win(); ctx.confetti && ctx.confetti(); await ctx.wait(1200);
          }
          done();
        }
        T.set(() => pick(colEls.findIndex((c) => c.w === item)), () => pick(colEls.findIndex((c) => c.w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ---------- L12c Which One Says It? — three friends, one picture ---------- */
  L.register({
    id: 'L12c',
    start(ctx) {
      const T = L.tester();
      const D = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#5f3dc4,#845ef7 55%,#d0bfff)' });
      const rate = D === 'hard' ? 1.15 : undefined;
      const FR = [['🧒', 'Ben'], ['👧', 'Amy'], ['🧑', 'Leo']];
      let slow = false;
      const slowBtn = u.el('button', { class: 'btn small', 'aria-pressed': 'false' }, '🐢 Slow 慢速');
      ctx.on(slowBtn, 'click', () => { slow = !slow; slowBtn.setAttribute('aria-pressed', String(slow)); });
      const allBtn = u.el('button', { class: 'btn small blue l12c-hi' }, '🔁 Play all 三句都播放');
      const wrap = u.el('div', { class: 'l12c-wrap' });
      st.body.append(wrap);
      let R = null;
      ctx.on(allBtn, 'click', () => R && R.playAll());

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = ''; wrap.innerHTML = '';
        st.head.append(L.say('🔁 看圖，聽三位朋友說的話，誰說的是這張圖？', 'Who is talking about the picture? Play and choose.'), u.el('div', { class: 'l12c-tools' }, allBtn, slowBtn, srcTag(item)));
        // other official sentences that are NOT about this picture
        const others = L.others(ctx, item, 2, { filter: (w) => !mentions(w.sentence, item.word) && !(EP.pic(w) && EP.pic(w) === EP.pic(item)) });
        const says = u.shuffle([item].concat(others));
        const card = u.el('div', { class: 'l12c-card' }, u.el('div', { class: 'l12c-lb zh' }, '📷 這張圖 The picture'), L.face(item),
          D === 'easy' ? u.el('div', { class: 'l12c-word' }, item.word, ' ', u.el('span', { class: 'zh' }, item.zh)) : null);
        const heard = says.map(() => false);
        const fr = says.map((w, i) => {
          const [av, name] = FR[i];
          const playB = u.el('button', { class: 'btn blue l12c-hi', 'aria-label': `Play 聽 ${name}` }, '🔊 Play 聽');
          const pickB = u.el('button', { class: 'btn go l12c-hi', disabled: '', 'aria-label': `This one 是他 ${name}` }, '✋ This one 是他');
          const box = u.el('div', { class: 'l12c-f' }, u.el('div', { class: 'l12c-av', 'aria-hidden': 'true' }, av, u.el('span', { class: 'l12c-bub' }, '💬')), u.el('div', { class: 'l12c-name' }, name), playB, pickB);
          ctx.on(playB, 'click', () => R && R.play(i));
          ctx.on(pickB, 'click', () => pick(i));
          return { w, box, playB, pickB };
        });
        wrap.append(card, u.el('div', { class: 'l12c-friends', role: 'group', 'aria-label': 'Three friends 三位朋友' }, fr.map((f) => f.box)));
        let answered = false, busy = false; const myR = {};
        const say1 = async (i) => {
          fr.forEach((f, j) => f.box.classList.toggle('l12c-talk', j === i));
          heard[i] = true; fr[i].pickB.disabled = false;
          await ctx.say(says[i], { sentence: true, slow, rate: slow ? undefined : rate });
          fr[i].box.classList.remove('l12c-talk');
        };
        Object.assign(myR, {
          async play(i) { if (answered || busy) return; busy = true; await say1(i); busy = false; },
          async playAll() {
            if (answered || busy) return; busy = true;
            for (let i = 0; i < says.length; i++) { if (answered || R !== myR || ctx.ended) break; await say1(i); if (i < says.length - 1) await ctx.wait(450); }
            busy = false;
          },
        });
        R = myR;
        ctx.timeout(() => myR.playAll(), 450);
        function pick(i) {
          if (answered) return; answered = true; R = null; EP.audio.stop();
          fr.forEach((f) => { f.box.classList.remove('l12c-talk'); f.pickB.disabled = true; });
          const ok = says[i] === item; const ri = says.indexOf(item);
          fr[i].box.classList.add(ok ? 'l12c-right' : 'l12c-wrong');
          if (!ok) fr[ri].box.classList.add('l12c-right');
          L.feedback(ctx, item, ok, Object.assign(rel(ctx, fr[i].box), { wrongText: `It was ${FR[ri][1]} 是 ${FR[ri][1]} 說的` })).then(done);
        }
        T.set(() => pick(says.indexOf(item)), () => pick(says.findIndex((w) => w !== item)));
      }));
      return { test: T.api };
    },
  });
})();
