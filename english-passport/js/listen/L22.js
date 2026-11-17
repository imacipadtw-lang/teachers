/* Sentence Listening — Level 22 (Verbs): TWO_PLAYER, COMIC_FILL, VERB_FORM
 * L22a Tug of War — two players share the screen; the first to pick the right picture pulls the rope.
 * L22b Comic Strip — a 3-panel comic misses its middle panel; pick the panel that matches the sentence.
 * L22c Verb Switch — has or have? does or do? pick the verb form you heard, then see it in the sentence. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen, el = u.el;

  /* who does it (picture + Chinese) */
  const WHO = { she: ['👧', '她'], he: ['👦', '他'], they: ['👫', '他們'], we: ['🧑‍🤝‍🧑', '我們'], i: ['🙋', '我'], dad: ['👨', '爸爸'], baby: ['👶', '嬰兒'], you: ['🧑', '你'] };
  /* one scene per level-22 sentence: act = picture of the action, cap = short caption (no subject),
   * pre = first comic panel (neutral time/place, never the answer), end = what happens afterwards */
  const SC = {
    have: { who: 'she', act: '🐶', cap: '有一隻狗', pre: ['🏠', '放學回家'], end: ['🦮', '一起去散步'] },
    do: { who: 'he', act: '📝', cap: '做功課', pre: ['🕖', '晚上七點'], end: ['✅', '功課寫完了'] },
    call: { who: 'they', act: '📞', cap: '打電話給朋友', pre: ['🏠', '週末在家'], end: ['👋', '朋友接電話了'] },
    are: { who: 'we', act: '😄', cap: '很快樂', pre: ['🏞️', '在公園'], end: ['🎉', '一起歡呼'] },
    want: { who: 'i', act: '🧸', cap: '想要一個玩具', pre: ['🏬', '在百貨公司'], end: ['🎁', '收到禮物了'] },
    take: { who: 'she', act: '📕', cap: '拿一本書', pre: ['🏫', '下課時間'], end: ['📖', '坐下來看書'] },
    paint: { who: 'he', act: '🖌️🖼️', cap: '畫一幅畫', pre: ['☀️', '星期六'], end: ['🏅', '作品得獎了'] },
    make: { who: 'they', act: '🎂', cap: '做蛋糕', pre: ['☀️', '星期天下午'], end: ['😋', '大家一起吃'] },
    give: { who: 'we', act: '🎁', cap: '送禮物', pre: ['🏫', '放學後'], end: ['🥰', '朋友好開心'] },
    decorate: { who: 'i', act: '🎈🎀', cap: '裝飾房間', pre: ['🏠', '在家'], end: ['🥳', '派對開始！'] },
    works: { who: 'dad', act: '🏦', cap: '在銀行工作', pre: ['🌅', '早上八點'], end: ['🏠', '下班回家'] },
    study: { who: 'they', act: '🔤📚', cap: '學英語', pre: ['🏫', '在學校'], end: ['💯', '考一百分'] },
    start: { who: 'we', act: '🏁', cap: '開始遊戲', pre: ['🏟️', '在操場'], end: ['🏆', '我們贏了'] },
    sleep: { who: 'he', act: '🛌', cap: '晚上九點睡覺', pre: ['🏠', '在家'], end: ['⏰', '早上起床'] },
    sit: { who: 'you', act: '🪑', cap: '請坐這裡', pre: ['🧑‍🏫', '老師說'], end: ['😊', '坐好了'] },
    send: { who: 'i', act: '✉️📮', cap: '寄信', pre: ['🏠', '下午'], end: ['📬', '朋友收到信'] },
    say: { who: 'she', act: '👋', cap: '說你好', pre: ['🏫', '早上在學校'], end: ['🤝', '交到新朋友'] },
    raise: { who: 'he', act: '✋', cap: '舉手', pre: ['🏫', '上課時'], end: ['🧑‍🏫', '老師請他回答'] },
    please: { who: 'you', act: '🙏🆘', cap: '請幫幫我', pre: ['📦', '東西好多'], end: ['🤝', '一起搬好了'] },
    plan: { who: 'we', act: '🗺️✈️', cap: '計劃旅行', pre: ['🏠', '晚餐後'], end: ['🏖️', '出發去海邊'] },
    nap: { who: 'baby', act: '💤', cap: '下午小睡', pre: ['🍼', '喝完奶'], end: ['😊', '睡飽醒來'] },
    mix: { who: 'she', act: '🎨', cap: '混合顏色', pre: ['☀️', '下午'], end: ['🌈', '調出新顏色'] },
    look: { who: 'they', act: '👀☁️', cap: '看天空', pre: ['🌳', '在公園'], end: ['✈️', '看到飛機'] },
    like: { who: 'i', act: '🍎❤️', cap: '喜歡蘋果', pre: ['🏠', '在家'], end: ['😋', '好好吃'] },
    know: { who: 'he', act: '💡', cap: '知道答案', pre: ['🏫', '上課時'], end: ['👏', '大家拍手'] },
    keep: { who: 'we', act: '🧹✨', cap: '保持房間整潔', pre: ['🏠', '在家'], end: ['👍', '媽媽說讚'] },
    jump: { who: 'she', act: '🦘⬆️', cap: '跳得很高', pre: ['🏟️', '運動會'], end: ['🏅', '得到獎牌'] },
    hunt: { who: 'they', act: '🌲🏹', cap: '在森林裡打獵', pre: ['🌄', '一大早'], end: ['🦌', '鹿跑掉了'] },
    going: { who: 'i', act: '🚶🏠', cap: '要回家', pre: ['🕓', '四點了'], end: ['🛋️', '在家休息'] },
    feel: { who: 'she', act: '💖', cap: '感到快樂', pre: ['☀️', '今天'], end: ['🎶', '開心地唱歌'] },
  };
  /* meanings that are too close to be used as each other's distractor */
  const CLOSE = [['are', 'feel'], ['sleep', 'nap'], ['do', 'study'], ['paint', 'mix'], ['sit', 'please']];
  const lw = (w) => String(w.word).toLowerCase();
  const scene = (w) => SC[lw(w)] || { who: 'i', act: EP.pic(w) || '❔', cap: w.zh, pre: ['☀️', '有一天'], end: ['😊', '太好了'] };
  const close = (a, b) => CLOSE.some((g) => g.includes(lw(a)) && g.includes(lw(b)));
  /** n other level items whose scenes are clearly different from item's */
  const sceneOthers = (ctx, item, n) => {
    const s = scene(item); const seen = new Set([s.cap, s.act]);
    const cand = u.shuffle(ctx.pool.length > n ? ctx.pool : EP.levelWords(item.level)).filter((w) => w !== item && lw(w) !== lw(item) && !close(w, item));
    const out = [];
    for (const w of cand) { const t = scene(w); if (seen.has(t.cap) || seen.has(t.act)) continue; seen.add(t.cap); seen.add(t.act); out.push(w); if (out.length >= n) break; }
    return out;
  };
  const center = (ctx, node) => { const r = node.getBoundingClientRect(), sr = ctx.root.getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 3 }; };

  L.css('L22', `
.l22a-arena{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:900px}
.l22a-ropebox{display:flex;align-items:center;gap:6px;width:100%}
.l22a-team{font-size:clamp(1.8rem,6vw,2.8rem);line-height:1;transition:transform .2s}
.l22a-team.l22a-pull{animation:l22aPull .5s}
.l22a-track{position:relative;flex:1;height:clamp(40px,7vh,56px)}
.l22a-rope{position:absolute;left:0;right:0;top:50%;height:12px;margin-top:-6px;border-radius:6px;background:repeating-linear-gradient(60deg,#c08a4a 0 8px,#8d5524 8px 14px);box-shadow:0 3px 0 rgba(0,0,0,.25)}
.l22a-mid{position:absolute;left:50%;top:0;bottom:0;border-left:3px dashed rgba(255,255,255,.85)}
.l22a-goal{position:absolute;top:4px;bottom:4px;width:6px;border-radius:3px}
.l22a-goal.l{left:8%;background:#1971c2}.l22a-goal.r{right:8%;background:#c92a2a}
.l22a-flag{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:clamp(1.4rem,4vw,2rem);line-height:1;transition:left .5s cubic-bezier(.3,1.4,.6,1)}
.l22a-time{width:100%;height:10px;border-radius:999px;background:rgba(255,255,255,.35);overflow:hidden}
.l22a-time>i{display:block;height:100%;width:100%;background:#ffd43b}
.l22a-sides{display:grid;grid-template-columns:1fr 1fr;gap:clamp(6px,2vw,16px);width:100%}
.l22a-side{border-radius:18px;padding:8px;display:flex;flex-direction:column;gap:8px}
.l22a-side.l{background:#1864ab}.l22a-side.r{background:#b02525}
.l22a-who{color:#fff;font-weight:900;text-align:center;font-size:clamp(.85rem,2.6vw,1.05rem)}
.l22a-who b{font-size:1.15em;background:#fff;border-radius:8px;padding:0 6px;margin-left:4px}
.l22a-side.l .l22a-who b{color:#1971c2}.l22a-side.r .l22a-who b{color:#c92a2a}
.l22a-opt{position:relative;flex-direction:column;gap:2px;min-height:clamp(70px,12vh,104px);padding:6px 8px}
.l22a-pic{font-size:clamp(1.6rem,5vw,2.4rem);line-height:1.1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l22a-cap{font-size:clamp(.82rem,2.5vw,1rem);font-weight:900}
.l22a-key{position:absolute;left:6px;top:4px;font-size:.72rem;font-weight:900;color:#495057;border:2px solid #adb5bd;border-radius:6px;padding:0 4px;line-height:1.2}
.l22a-side.l22a-out .l22a-opt:not(.wrongpick){background:#dee2e6}
.l22a-side.l22a-out .l22a-who::after{content:' ✘ 等對手 Wait';color:#fff}
.l22a-opt.right .l22a-key,.l22a-opt.wrongpick .l22a-key{color:#fff;border-color:#fff}
.l22a-end{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:45;background:#fff;color:#1d2340;border-radius:24px;padding:18px 26px;text-align:center;font-weight:900;font-size:clamp(1.3rem,4.5vw,2rem);box-shadow:0 14px 40px rgba(0,0,0,.4)}
@keyframes l22aPull{40%{transform:scale(1.25) rotate(-8deg)}}
@media (max-width:520px){.l22a-key{display:none}}

.l22b-book{display:flex;flex-direction:column;align-items:center;gap:clamp(8px,2vh,16px);width:100%;max-width:880px}
.l22b-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(4px,1.4vw,12px);width:100%;background:#fff;padding:clamp(5px,1.4vw,10px);border-radius:10px;box-shadow:0 6px 0 rgba(0,0,0,.25)}
.l22b-panel{position:relative;border:3px solid #1d2340;border-radius:6px;background:#fffdf5;min-height:clamp(110px,22vh,170px);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:clamp(24px,5vh,34px) 4px 8px;overflow:hidden;color:#1d2340}
.l22b-cap{position:absolute;left:0;top:0;right:0;background:#ffe066;border-bottom:3px solid #1d2340;font-weight:900;font-size:clamp(.72rem,2.3vw,.95rem);padding:2px 4px;text-align:center;line-height:1.2}
.l22b-art{font-size:clamp(1.7rem,5.4vw,2.8rem);line-height:1.1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;display:flex;gap:2px;align-items:flex-end;justify-content:center;flex-wrap:wrap}
.l22b-art .l22b-big{font-size:1.25em}
.l22b-no{position:absolute;right:4px;bottom:2px;font-size:.7rem;font-weight:900;color:#495057}
.l22b-miss{background:repeating-linear-gradient(45deg,#e7f5ff 0 10px,#d0ebff 10px 20px);border-style:dashed;justify-content:center}
.l22b-miss .l22b-q{font-size:clamp(2.2rem,7vw,3.4rem);font-weight:900;color:#1971c2;line-height:1}
.l22b-miss .l22b-ql{font-size:.8rem;font-weight:900;color:#1d2340}
.l22b-fill{animation:l22bPop .4s cubic-bezier(.3,1.5,.6,1)}
.l22b-end{position:absolute;right:-4px;bottom:16px;transform:rotate(-12deg);background:#e03131;color:#fff;font-weight:900;font-size:.72rem;padding:1px 6px;border-radius:6px}
.l22b-opts{display:grid;gap:clamp(6px,1.6vw,12px);width:100%}
.l22b-opt{border:3px solid #1d2340;border-radius:8px;background:#fffdf5;color:#1d2340;min-height:clamp(96px,17vh,140px);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:clamp(24px,4.5vh,32px) 4px 8px;box-shadow:0 5px 0 rgba(0,0,0,.3);overflow:hidden}
.l22b-opt:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l22b-opt.right{background:#d3f9d8;border-color:#2b8a3e;box-shadow:0 0 0 4px #2b8a3e}
.l22b-opt.wrongpick{background:#ffe3e3;border-color:#c92a2a;box-shadow:0 0 0 4px #c92a2a}
.l22b-opt.dim{filter:grayscale(.7)}
.l22b-opt.right::after,.l22b-opt.wrongpick::after{position:absolute;right:6px;top:30px;font-weight:900;font-size:1.4rem}
.l22b-opt.right::after{content:'✔';color:#2b8a3e}.l22b-opt.wrongpick::after{content:'✘';color:#c92a2a}
.l22b-hint{color:#1d2340;background:rgba(255,255,255,.92);border-radius:10px;padding:2px 10px;font-weight:800;font-size:.85rem;text-align:center}
@keyframes l22bPop{from{transform:scale(.6)}}

.l22c-machine{display:flex;flex-direction:column;align-items:center;gap:clamp(8px,1.8vh,14px);background:linear-gradient(#343a40,#212529);border-radius:26px;padding:clamp(10px,2vw,18px);box-shadow:0 8px 0 rgba(0,0,0,.35),inset 0 0 0 4px #20c997;width:min(100%,640px)}
.l22c-bot{display:flex;align-items:center;gap:10px;color:#fff;font-weight:900}
.l22c-face{font-size:clamp(2.2rem,7vw,3.2rem);line-height:1;transition:transform .3s}
.l22c-face.l22c-zap{animation:l22cZap .5s}
.l22c-hint{background:#fff;color:#1d2340;border-radius:14px;padding:6px 12px;text-align:center;font-weight:800}
.l22c-hint .l22c-frame{display:block;font-size:clamp(1.1rem,3.6vw,1.5rem);font-weight:900}
.l22c-hint .l22c-blank{display:inline-block;min-width:3em;border-bottom:4px solid #0ca678;margin:0 4px}
.l22c-hint .zh{font-size:.95rem;color:#4a5078}
.l22c-row{display:flex;align-items:center;gap:clamp(8px,2vw,16px);width:100%;justify-content:center}
.l22c-card{flex:1;max-width:240px;min-height:clamp(96px,18vh,150px);border-radius:20px;background:#fff;color:#1d2340;font-weight:900;font-size:clamp(2rem,7vw,3rem);box-shadow:0 6px 0 #0ca678;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.l22c-card small{font-size:.8rem;color:#495057}
.l22c-card:active{transform:translateY(3px);box-shadow:0 3px 0 #0ca678}
.l22c-card:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l22c-card.right{background:#2b8a3e;color:#fff;box-shadow:0 6px 0 #1b5e20}.l22c-card.right small{color:#fff}
.l22c-card.wrongpick{background:#c92a2a;color:#fff;box-shadow:0 6px 0 #7f1d1d}.l22c-card.wrongpick small{color:#fff}
.l22c-sw{flex:none;width:clamp(44px,9vw,64px);height:clamp(80px,14vh,110px);border-radius:999px;background:#495057;position:relative;box-shadow:inset 0 0 0 3px #868e96}
.l22c-lever{position:absolute;left:50%;top:50%;width:70%;aspect-ratio:1;border-radius:50%;background:radial-gradient(#fff,#ced4da);transform:translate(-50%,-50%);transition:transform .3s cubic-bezier(.3,1.5,.6,1)}
.l22c-sw.l .l22c-lever{transform:translate(-110%,-50%)}.l22c-sw.r .l22c-lever{transform:translate(10%,-50%)}
.l22c-time{width:100%;height:10px;border-radius:999px;background:rgba(255,255,255,.25);overflow:hidden}
.l22c-time>i{display:block;height:100%;width:100%;background:#ffd43b}
.l22c-reveal{background:#fff;color:#1d2340;border-radius:16px;padding:6px 14px;font-size:clamp(1.15rem,3.8vw,1.6rem);font-weight:900;box-shadow:0 4px 0 rgba(0,0,0,.2);text-align:center;animation:l22bPop .35s}
.l22c-reveal mark{background:#ffe066;color:#1d2340;border-radius:6px;padding:0 4px;box-shadow:0 0 0 2px #f08c00}
.l22c-reveal small{display:block;font-size:.85rem;color:#4a5078}
@keyframes l22cZap{30%{transform:rotate(-15deg) scale(1.2)}60%{transform:rotate(10deg)}}
`);

  /* ---------------- L22a Tug of War ---------------- */
  L.register({
    id: 'L22a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(#a5d8ff 0%,#e7f5ff 45%,#b2f2bb 45%,#69db7c 100%)' });
      const hard = ctx.difficulty === 'hard';
      const LIMIT = ctx.difficulty === 'easy' ? 20 : hard ? 10 : 15; // seconds per sentence
      const KEYS = { L: ['A', 'S', 'D'], R: ['J', 'K', 'L'] };
      const teamL = el('span', { class: 'l22a-team', 'aria-hidden': 'true' }, '🐯');
      const teamR = el('span', { class: 'l22a-team', 'aria-hidden': 'true' }, '🐼');
      const flag = el('span', { class: 'l22a-flag', 'aria-hidden': 'true' }, '🎀');
      const track = el('div', { class: 'l22a-track', role: 'img', 'aria-label': 'Rope 繩子：在中間' }, el('div', { class: 'l22a-rope' }), el('div', { class: 'l22a-goal l' }), el('div', { class: 'l22a-goal r' }), el('div', { class: 'l22a-mid' }), flag);
      const tfill = el('i');
      const time = el('div', { class: 'l22a-time', role: 'progressbar', 'aria-label': 'Time 時間', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 100 }, tfill);
      const scoreL = el('b', {}, '0'), scoreR = el('b', {}, '0');
      const sideL = el('div', { class: 'l22a-side l', role: 'group', 'aria-label': 'Player 1 玩家 1（藍隊）' }, el('div', { class: 'l22a-who' }, '🐯 玩家1 Blue', scoreL));
      const sideR = el('div', { class: 'l22a-side r', role: 'group', 'aria-label': 'Player 2 玩家 2（紅隊）' }, el('div', { class: 'l22a-who' }, '🐼 玩家2 Red', scoreR));
      const optsL = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }), optsR = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
      sideL.appendChild(optsL); sideR.appendChild(optsR);
      st.body.appendChild(el('div', { class: 'l22a-arena' }, el('div', { class: 'l22a-ropebox' }, teamL, track, teamR), time, el('div', { class: 'l22a-sides' }, sideL, sideR)));
      let pos = 0, pullsL = 0, pullsR = 0, cur = null;
      const moveRope = () => {
        flag.style.left = 50 + pos * 13 + '%';
        track.setAttribute('aria-label', 'Rope 繩子：' + (pos === 0 ? '在中間' : pos < 0 ? `往藍隊 ${-pos} 格` : `往紅隊 ${pos} 格`));
      };
      ctx.loop((dt) => {
        if (!cur || !cur.running || cur.done) return;
        cur.left -= dt * (ctx.speed || 1);
        const f = Math.max(0, cur.left / LIMIT); tfill.style.width = f * 100 + '%'; tfill.style.background = f > 0.3 ? '#ffd43b' : '#fa5252';
        const pct = Math.round(f * 10) * 10; if (time.getAttribute('aria-valuenow') !== String(pct)) time.setAttribute('aria-valuenow', pct);
        if (cur.left <= 0) cur.finish(null, null);
      });
      const optBtn = (w, key) => {
        const s = scene(w);
        return el('button', { class: 'ls-choice l22a-opt', 'aria-label': `${WHO[s.who][1]}${s.cap}（${key}）` },
          el('span', { class: 'l22a-key', 'aria-hidden': 'true' }, key),
          el('span', { class: 'l22a-pic', 'aria-hidden': 'true' }, WHO[s.who][0] + s.act),
          hard ? null : el('span', { class: 'l22a-cap zh' }, WHO[s.who][1] + s.cap));
      };
      ctx.on(window, 'keydown', (e) => {
        if (!cur || ctx.paused || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        const k = String(e.key).toUpperCase();
        ['L', 'R'].forEach((side) => { const i = KEYS[side].indexOf(k); if (i >= 0) { e.preventDefault(); cur.pick(side, i); } });
      });
      const run = async () => {
        const items = ctx.items;
        for (let i = 0; i < items.length; i++) { if (ctx.ended) return; ctx.hud.progress(i / items.length); await round(items[i]); }
        ctx.hud.progress(1); if (ctx.ended) return;
        T.clear();
        const win = pullsL > pullsR ? '🐯 藍隊獲勝！Blue wins!' : pullsR > pullsL ? '🐼 紅隊獲勝！Red wins!' : '🤝 平手！It\'s a tie!';
        const card = el('div', { class: 'l22a-end', role: 'status' }, '🏆 ', win, el('div', { style: { fontSize: '1rem', marginTop: '4px' } }, `🐯 ${pullsL} : ${pullsR} 🐼`));
        ctx.root.appendChild(card); ctx.confetti(); EP.sfx.win();
        await ctx.wait(1800); card.remove();
        if (!ctx.ended) ctx.end();
      };
      const round = (item) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🪢 兩人一起玩！聽句子，在自己那一邊選出對的圖，先選對的把繩子拉過來。', 'Two players: the first to pick the right picture pulls the rope.'), bar);
        const opts = [item].concat(sceneOthers(ctx, item, 2));
        const L1 = u.shuffle(opts), R1 = u.shuffle(opts);
        optsL.innerHTML = ''; optsR.innerHTML = '';
        sideL.classList.remove('l22a-out'); sideR.classList.remove('l22a-out');
        const bL = L1.map((w, k) => optBtn(w, KEYS.L[k])), bR = R1.map((w, k) => optBtn(w, KEYS.R[k]));
        bL.forEach((b, k) => { optsL.appendChild(b); ctx.on(b, 'click', () => me.pick('L', k)); });
        bR.forEach((b, k) => { optsR.appendChild(b); ctx.on(b, 'click', () => me.pick('R', k)); });
        tfill.style.width = '100%'; tfill.style.background = '#ffd43b';
        const me = { left: LIMIT, running: false, done: false, out: { L: false, R: false } };
        const markAll = () => {
          bL.forEach((b, k) => { b.disabled = true; if (L1[k] === item) b.classList.add('right'); });
          bR.forEach((b, k) => { b.disabled = true; if (R1[k] === item) b.classList.add('right'); });
        };
        me.finish = (side, b) => {
          if (me.done) return; me.done = true; markAll();
          const ok = !!side; let p;
          if (ok) {
            if (side === 'L') { pullsL++; pos = Math.max(-3, pos - 1); scoreL.textContent = pullsL; teamL.classList.remove('l22a-pull'); void teamL.offsetWidth; teamL.classList.add('l22a-pull'); }
            else { pullsR++; pos = Math.min(3, pos + 1); scoreR.textContent = pullsR; teamR.classList.remove('l22a-pull'); void teamR.offsetWidth; teamR.classList.add('l22a-pull'); }
            moveRope(); EP.sfx.whoosh();
            if (Math.abs(pos) === 3) { ctx.burst(side === 'L' ? '🐯 Blue 大力拉！' : '🐼 Red 大力拉！'); }
            p = center(ctx, b);
          } else p = center(ctx, track);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: b ? 'Nobody got it 兩個都選錯了' : 'Time\'s up 時間到' }).then(() => {
            if (Math.abs(pos) === 3) { pos = 0; moveRope(); }
            done();
          });
        };
        me.pick = (side, k) => {
          if (me.done || me.out[side]) return;
          const list = side === 'L' ? L1 : R1, btns = side === 'L' ? bL : bR;
          if (!btns[k]) return;
          if (list[k] === item) return me.finish(side, btns[k]);
          me.out[side] = true; btns[k].classList.add('wrongpick'); btns.forEach((b) => (b.disabled = true));
          (side === 'L' ? sideL : sideR).classList.add('l22a-out'); EP.sfx.wrong();
          if (me.out.L && me.out.R) me.finish(null, btns[k]);
        };
        cur = me;
        const go = () => { if (cur === me) me.running = true; };
        bar.play(false).then(go); ctx.timeout(go, 6000);
        T.set(() => me.pick('L', L1.indexOf(item)), () => { me.pick('L', L1.findIndex((w) => w !== item)); me.pick('R', R1.findIndex((w) => w !== item)); });
      });
      moveRope(); run();
      return { test: T.api };
    },
  });

  /* ---------------- L22b Comic Strip ---------------- */
  L.register({
    id: 'L22b',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 30% 20%,#ffe066,#fab005 45%,#e8590c)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 2 : hard ? 4 : 3;
      const GENERIC = [['😊', '太好了！'], ['👍', '讚！'], ['✨', '好棒的一天！']];
      const panel = (cap, art, no, cls) => el('div', { class: 'l22b-panel' + (cls ? ' ' + cls : '') },
        cap ? el('div', { class: 'l22b-cap zh' }, cap) : null, art, no ? el('span', { class: 'l22b-no', 'aria-hidden': 'true' }, no) : null);
      const art = (...parts) => el('div', { class: 'l22b-art', 'aria-hidden': 'true' }, parts.map((p, i) => el('span', { class: i === 0 ? 'l22b-big' : '' }, p)));
      const strip = el('div', { class: 'l22b-strip', role: 'group', 'aria-label': 'Comic 漫畫' });
      const optBox = el('div', { class: 'l22b-opts', role: 'group', 'aria-label': 'Panels 漫畫格' });
      const hint = el('div', { class: 'l22b-hint zh' }, '⬇ 選一格補進「？」 Pick the missing panel');
      st.body.appendChild(el('div', { class: 'l22b-book' }, strip, hint, optBox));
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🗯️ 漫畫少了中間那一格！聽句子，選出符合句子的那一格。', 'Pick the comic panel that matches the sentence.'), L.listenBar(ctx, item));
        const s = scene(item); const who = WHO[s.who];
        const gen = u.pick(GENERIC);
        const p1 = panel(`${s.pre[1]}，${who[1]}…`, art(who[0], s.pre[0]), '1');
        p1.setAttribute('role', 'img'); p1.setAttribute('aria-label', `第 1 格：${s.pre[1]}，${who[1]}…`);
        const miss = panel(null, el('div', {}, el('div', { class: 'l22b-q' }, '?'), el('div', { class: 'l22b-ql zh' }, '聽句子 Listen')), '2', 'l22b-miss');
        miss.setAttribute('role', 'img'); miss.setAttribute('aria-label', '第 2 格：缺少的這一格');
        const endData = easy ? [s.end[0], s.end[1]] : gen;
        const p3 = panel(endData[1], art(who[0], endData[0]), '3');
        p3.setAttribute('role', 'img'); p3.setAttribute('aria-label', `第 3 格：${endData[1]}`);
        strip.innerHTML = ''; strip.append(p1, miss, p3);
        // options: the same person doing different things, so only the heard action tells them apart
        const opts = u.shuffle([item].concat(sceneOthers(ctx, item, n - 1)));
        const right = opts.indexOf(item);
        optBox.style.gridTemplateColumns = `repeat(${opts.length},1fr)`;
        optBox.innerHTML = '';
        let answered = false;
        const btns = opts.map((w, k) => {
          const t = scene(w);
          const b = el('button', { class: 'l22b-opt', 'aria-label': `${who[1]}${t.cap}` },
            hard ? null : el('div', { class: 'l22b-cap zh' }, t.cap),
            art(who[0], t.act));
          ctx.on(b, 'click', () => pick(k)); optBox.appendChild(b); return b;
        });
        const pick = (k) => {
          if (answered) return; answered = true;
          const ok = k === right;
          btns.forEach((b, i) => { b.disabled = true; b.classList.add(i === right ? 'right' : i === k ? 'wrongpick' : 'dim'); });
          // the missing panel gets the right picture, the last panel shows how the story ends
          const fill = panel(s.cap, art(who[0], s.act), '2', 'l22b-fill');
          fill.setAttribute('role', 'img'); fill.setAttribute('aria-label', `第 2 格：${who[1]}${s.cap}`);
          miss.replaceWith(fill);
          const p3b = panel(s.end[1], art(who[0], s.end[0]), '3', 'l22b-fill'); p3b.appendChild(el('span', { class: 'l22b-end zh' }, '完 END'));
          p3b.setAttribute('role', 'img'); p3b.setAttribute('aria-label', `第 3 格：${s.end[1]}`);
          p3.replaceWith(p3b);
          EP.sfx.pop();
          // let the finished comic be seen for a moment before the feedback card covers it
          const p = center(ctx, btns[k]);
          ctx.timeout(() => L.feedback(ctx, item, ok, { x: p.x, y: p.y, okMs: 900, wrongText: 'Wrong panel 不是這一格' }).then(done), 900);
        };
        T.set(() => pick(right), () => pick(right === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });

  /* ---------------- L22c Verb Switch ---------------- */
  L.register({
    id: 'L22c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#087f5b,#0ca678 50%,#38d9a9)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const LIMIT = 8; // hard: seconds to choose after the sentence
      const face = el('span', { class: 'l22c-face', 'aria-hidden': 'true' }, '🤖');
      const hintBox = el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      const row = el('div', { class: 'l22c-row' });
      const tfill = el('i');
      const time = hard ? el('div', { class: 'l22c-time', role: 'progressbar', 'aria-label': 'Time 時間', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 100 }, tfill) : null;
      st.body.appendChild(el('div', { class: 'l22c-machine' }, el('div', { class: 'l22c-bot' }, face, el('span', {}, 'Verb Switch ', el('span', { class: 'zh' }, '動詞變身機'))), hintBox, row, time));
      let cur = null;
      ctx.loop((dt) => {
        if (!hard || !cur || !cur.running || cur.answered) return;
        cur.left -= dt * (ctx.speed || 1);
        const f = Math.max(0, cur.left / LIMIT); tfill.style.width = f * 100 + '%'; tfill.style.background = f > 0.3 ? '#ffd43b' : '#fa5252';
        const pct = Math.round(f * 10) * 10; if (time.getAttribute('aria-valuenow') !== String(pct)) time.setAttribute('aria-valuenow', pct);
        if (cur.left <= 0) cur.pick(-1);
      });
      /** the sentence with the verb form highlighted */
      const highlighted = (item, heard) => {
        const k = L.key(item); const s = item.sentence;
        let a = -1, len = 0;
        if (k && k.text.toLowerCase() === heard.toLowerCase()) { a = k.start; len = k.text.length; }
        else { const m = s.match(new RegExp('\\b' + heard + '\\b', 'i')); if (m) { a = m.index; len = m[0].length; } }
        return a < 0 ? [s] : [s.slice(0, a), el('mark', {}, s.slice(a, a + len)), s.slice(a + len)];
      };
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        const forms = L.VERBFORM[lw(item)] || [L.keyText(item), L.keyText(item) + 's'];
        const heard = forms[0];
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item, { auto: false });
        st.head.append(L.say('🔄 動詞會變身！聽句子，選出你聽到的是哪一種動詞形式。', 'Choose the verb form you heard (has / have, does / do…).'), bar);
        face.textContent = '🤖';
        hintBox.innerHTML = '';
        if (easy) { const fr = L.swapKey(item, '\u0000'); const parts = fr ? fr.split('\u0000') : null; hintBox.appendChild(el('div', { class: 'l22c-hint' }, parts ? el('span', { class: 'l22c-frame' }, parts[0], el('span', { class: 'l22c-blank' }, '\u2003'), parts[1]) : null, el('span', { class: 'zh' }, item.sentenceZh))); }
        else if (!hard) hintBox.appendChild(el('div', { class: 'l22c-hint' }, el('span', { class: 'zh' }, '意思：' + item.sentenceZh)));
        const order = u.shuffle([0, 1]);
        const sw = el('div', { class: 'l22c-sw', 'aria-hidden': 'true' }, el('div', { class: 'l22c-lever' }));
        const cards = order.map((fi, k) => {
          const b = el('button', { class: 'l22c-card', 'aria-label': `${forms[fi]}` }, forms[fi], el('small', { class: 'zh' }, k === 0 ? '⬅ 選這個' : '選這個 ➡'));
          ctx.on(b, 'click', () => me.pick(k)); return b;
        });
        row.innerHTML = ''; row.append(cards[0], sw, cards[1]);
        const right = order.indexOf(0);
        if (time) { tfill.style.width = '100%'; tfill.style.background = '#ffd43b'; }
        const me = { left: LIMIT, running: false, answered: false };
        me.pick = (k) => {
          if (me.answered) return; me.answered = true;
          const ok = k === right;
          sw.classList.add(k === 0 ? 'l' : k === 1 ? 'r' : 'mid'); EP.sfx.click();
          cards.forEach((b, i) => { b.disabled = true; if (i === right) b.classList.add('right'); else if (i === k) b.classList.add('wrongpick'); });
          face.textContent = ok ? '😃' : '😵'; face.classList.remove('l22c-zap'); void face.offsetWidth; face.classList.add('l22c-zap');
          // show the sentence with the form highlighted
          st.head.appendChild(el('div', { class: 'l22c-reveal', role: 'status' }, highlighted(item, heard), el('small', { class: 'zh' }, `聽到的是 ${heard}（不是 ${forms[1]}）`)));
          const p = k >= 0 ? center(ctx, cards[k]) : center(ctx, row);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, okMs: 1500, wrongText: k < 0 ? 'Time\'s up 時間到' : 'Not that form 不是這個形式' }).then(done);
        };
        cur = me;
        const go = () => { if (cur === me) me.running = true; };
        bar.play(false).then(go); ctx.timeout(go, 6000);
        T.set(() => me.pick(right), () => me.pick(1 - right));
      }));
      return { test: T.api };
    },
  });
})();
