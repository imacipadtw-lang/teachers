/* Sentence Listening — Level 15 (Clothes · Activities · Things): DRESS_UP, SHADOW_MATCH, TYPING_KEYWORD
 * L15a Dress-Up Closet: drag the heard clothing item from the closet onto the friend (it then appears on them).
 * L15b Shadow Guess: tap the black silhouette (emoji with brightness(0)) of what the sentence is about; colour is revealed.
 * L15c Fashion Chat: reply in a chat app by typing the key word of the sentence (Enter sends). */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

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
  const heard = (item) => new Set(L.tokens(item.sentence).map((x) => x.w));
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top }; };
  /* pairs that would be ambiguous as pictures (sneakers ARE shoes, a trip IS a vacation …) — never shown together */
  const CLASH = [['shoes', 'sneakers'], ['sock', 'stockings'], ['jacket', 'raincoat'], ['hat', 'cap'], ['trip', 'vacation'], ['swim', 'swimming'], ['jogging', 'race'], ['card', 'contact']];
  const clash = (a, b) => { const x = a.word.toLowerCase(), y = b.word.toLowerCase(); return CLASH.some(([p, q]) => (p === x && q === y) || (p === y && q === x)); };
  /** distractors that cannot be confused with the target: not spoken in its sentence, not a clashing pair, other picture */
  const safe = (item) => { const said = heard(item); return (w) => !said.has(w.word.toLowerCase()) && !said.has(L.keyText(w).toLowerCase()) && !clash(item, w) && (!EP.pic(w) || EP.pic(w) !== EP.pic(item)); };

  L.css('L15', `
.l15a-room{display:flex;gap:clamp(12px,3vw,32px);align-items:center;justify-content:center;width:100%;flex-wrap:wrap}
.l15a-closet{background:linear-gradient(180deg,#9c6644,#7f4f24);border-radius:22px;padding:14px 12px 12px;box-shadow:0 10px 0 #4a2c14,inset 0 0 0 4px #b08968;position:relative;width:min(380px,100%)}
.l15a-rail{height:8px;border-radius:6px;background:#dee2e6;margin:0 6px 10px;box-shadow:0 2px 0 #495057}
.l15a-title{color:#fff;background:#4a2c14;border-radius:999px;padding:2px 12px;width:max-content;margin:0 auto 6px;font-weight:900;text-align:center}
.l15a-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.l15a-item{position:relative;border:0;border-radius:16px;background:#fff8ee;color:#1d2340;min-height:clamp(86px,15vh,118px);padding:18px 6px 8px;display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;box-shadow:0 5px 0 rgba(0,0,0,.25);font:inherit}
.l15a-item::before{content:'🪝';position:absolute;top:-6px;left:50%;transform:translateX(-50%);font-size:1.2rem}
.l15a-item .ls-emoji{font-size:clamp(2.6rem,7vw,3.6rem)}
.l15a-item .ls-zhcard{font-size:clamp(1.1rem,3vw,1.35rem)}
.l15a-item:focus-visible,.l15a-doll:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l15a-item.l15a-gone{visibility:hidden}
.l15a-items.l15a-five{grid-template-columns:repeat(3,minmax(0,1fr))}
.l15a-five .l15a-item{min-height:clamp(80px,13vh,104px)}
@media (max-width:560px){.l15a-items,.l15a-items.l15a-five{grid-template-columns:repeat(auto-fit,minmax(58px,1fr));gap:8px}.l15a-item{min-height:80px;padding:14px 4px 6px}.l15a-item .ls-emoji{font-size:2.4rem}.l15a-item .ls-zhcard{font-size:1rem;padding:4px 5px}.l15a-closet{padding:10px 8px}.l15a-doll{--w:clamp(140px,min(42vw,30vh),200px)}}
.l15a-item.l15a-no{background:#ffe3e3;box-shadow:0 0 0 4px #c92a2a}
.l15a-item.l15a-yes{background:#d3f9d8;box-shadow:0 0 0 4px #2b8a3e}
.l15a-doll{--w:clamp(150px,min(30vw,26vh),230px);position:relative;width:var(--w);height:calc(var(--w)*1.6);border:0;border-radius:28px;background:radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.55),rgba(255,255,255,.15) 70%);cursor:pointer;padding:0;flex:none;box-shadow:inset 0 0 0 3px rgba(255,255,255,.5)}
.l15a-doll.ls-over{background:rgba(255,236,153,.6)}
.l15a-p{position:absolute;display:block;pointer-events:none}
.l15a-head{left:50%;top:1%;transform:translateX(-50%);font-size:calc(var(--w)*.34);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l15a-torso{left:27%;top:26%;width:46%;height:31%;background:#f8f9fa;border-radius:22% 22% 10% 10%;box-shadow:inset 0 0 0 2px #ced4da}
.l15a-arm{top:27%;width:13%;height:28%;background:#ffd8a8;border-radius:40px}
.l15a-arm.l{left:14%;transform:rotate(14deg)}.l15a-arm.r{right:14%;transform:rotate(-14deg)}
.l15a-leg{top:56%;width:17%;height:31%;background:#ffd8a8;border-radius:0 0 30px 30px}
.l15a-leg.l{left:31%}.l15a-leg.r{right:31%}
.l15a-shorts{left:29%;top:55%;width:42%;height:11%;background:#4dabf7;border-radius:6px 6px 4px 4px}
.l15a-wear{position:absolute;left:50%;transform:translateX(-50%);line-height:1;pointer-events:none;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;animation:l15apop .35s ease-out;white-space:nowrap}
@keyframes l15apop{from{transform:translateX(-50%) scale(.3)}to{transform:translateX(-50%) scale(1)}}
.l15a-z-head{top:-7%;font-size:calc(var(--w)*.34)}
.l15a-z-neck{top:21%;font-size:calc(var(--w)*.24)}
.l15a-z-top{top:24%;font-size:calc(var(--w)*.44)}
.l15a-z-dress{top:23%;font-size:calc(var(--w)*.62)}
.l15a-z-legs{top:52%;font-size:calc(var(--w)*.34)}
.l15a-z-feet{top:84%;font-size:calc(var(--w)*.2);letter-spacing:calc(var(--w)*.06)}
.l15a-shape{display:flex;align-items:center;justify-content:center;font-family:'Noto Sans TC',sans-serif;font-weight:900;font-size:calc(var(--w)*.09);border-radius:14px}
.l15a-s-sweater{top:25%;width:62%;height:33%;background:repeating-linear-gradient(45deg,#c2255c 0 7px,#a61e4d 7px 14px);color:#fff;border-radius:26% 26% 12% 12%}
.l15a-s-raincoat{top:24%;width:58%;height:44%;background:#fcc419;color:#1d2340;border-radius:30% 30% 14% 14%;box-shadow:inset 0 0 0 3px #e67700}
.l15a-s-skirt{top:55%;width:56%;height:20%;background:#6741d9;color:#fff;clip-path:polygon(22% 0,78% 0,100% 100%,0 100%);border-radius:0}
.l15a-s-stockings{top:62%;width:42%;height:26%;background:repeating-linear-gradient(0deg,#f783ac 0 8px,#fcc2d7 8px 16px);color:#1d2340;border-radius:4px 4px 20px 20px}
.l15a-s-tag{top:40%;background:#fff3bf;color:#5c3d00;padding:2px 6px}
.l15a-zh{background:#fff;color:#1d2340;border-radius:14px;padding:4px 12px;font-weight:700}
.l15b-theatre{width:min(920px,100%);background:linear-gradient(90deg,#5c0f0f,#8b1a1a 8%,transparent 8%,transparent 92%,#8b1a1a 92%,#5c0f0f);border-radius:26px;padding:14px clamp(18px,5vw,48px);box-shadow:0 0 0 6px #3b0a0a}
.l15b-screen{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:clamp(8px,2vw,16px);background:radial-gradient(ellipse at 50% 35%,#fffef5,#fff0c2 55%,#ffd98a);border-radius:18px;padding:clamp(10px,2.4vw,20px);box-shadow:inset 0 0 30px rgba(160,100,0,.35)}
@media (max-width:560px){.l15b-screen{grid-template-columns:repeat(2,minmax(0,1fr))}}
.l15b-sh{position:relative;border:3px dashed rgba(92,15,15,.35);border-radius:20px;background:rgba(255,255,255,.45);min-height:clamp(110px,22vh,180px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:#1d2340;font:inherit;padding:8px 4px}
.l15b-sh:focus-visible{outline:4px solid #1971c2;outline-offset:2px}
.l15b-sh:hover{background:rgba(255,255,255,.75)}
.l15b-sh .ls-emoji{font-size:clamp(3.4rem,10vw,6rem);filter:brightness(0);transition:filter .6s ease,transform .3s}
.l15b-blur .l15b-sh .ls-emoji{filter:brightness(0) blur(1.4px)}
.l15b-sh.l15b-color .ls-emoji{filter:none!important;transform:scale(1.08)}
.l15b-sh .ls-zhcard{background:#212529;color:#fff}
.l15b-sh.l15b-color .ls-zhcard{background:#fff3bf;color:#5c3d00}
.l15b-cap{font-weight:900;font-size:1rem;min-height:1.3em;color:#1d2340}
.l15b-sh.right{border:4px solid #2b8a3e;background:#d3f9d8}
.l15b-sh.wrongpick{border:4px solid #c92a2a;background:#ffe3e3}
.l15b-lamp{font-size:2rem;text-align:center;line-height:1;margin-bottom:4px}
.l15c-phone{width:min(560px,100%);flex:1 1 auto;min-height:280px;display:flex;flex-direction:column;background:#f8f0ff;color:#1d2340;border-radius:26px;overflow:hidden;box-shadow:0 0 0 6px #1d2340,0 16px 40px rgba(0,0,0,.35)}
.l15c-top{display:flex;align-items:center;gap:10px;padding:8px 14px;background:linear-gradient(90deg,#c2255c,#9c36b5);color:#fff;font-weight:900}
.l15c-av{font-size:1.7rem;line-height:1}
.l15c-on{font-size:.8rem;font-weight:700;color:#ffe3f1}
.l15c-log{flex:1 1 auto;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.l15c-msg{max-width:84%;padding:8px 12px;border-radius:18px;font-weight:700;line-height:1.35;box-shadow:0 2px 0 rgba(0,0,0,.08);animation:l15cin .25s ease-out}
@keyframes l15cin{from{transform:translateY(10px)}to{transform:none}}
.l15c-msg.them{align-self:flex-start;background:#fff;border-bottom-left-radius:6px}
.l15c-msg.me{align-self:flex-end;background:#d0bfff;border-bottom-right-radius:6px}
.l15c-msg.me.ok{background:#b2f2bb}.l15c-msg.me.bad{background:#ffc9c9}
.l15c-cloze{font-size:clamp(1.15rem,3.4vw,1.45rem);font-weight:900}
.l15c-blank{display:inline-block;min-width:3.4em;border-bottom:3px solid #9c36b5;color:#862e9c;letter-spacing:.18em;text-align:center;margin:0 3px}
.l15c-sub{display:block;font-size:.9rem;color:#4a5078;font-weight:700}
.l15c-vm{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#9c36b5;color:#fff;font:inherit;font-weight:900;padding:6px 14px;cursor:pointer}
.l15c-vm:focus-visible,.l15c-send:focus-visible,.l15c-key:focus-visible,.l15c-kb:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l15c-compose{display:flex;gap:8px;padding:8px;background:#fff;border-top:2px solid #e5dbff;align-items:center}
.l15c-compose input.l15c-input{flex:1;min-width:0;font:inherit;font-size:1.3rem;font-weight:800;padding:8px 12px;border-radius:999px;border:2px solid #9c36b5;background:#fff;color:#1d2340;min-height:48px}
.l15c-compose input.l15c-input:focus{outline:3px solid #ffd43b}
.l15c-compose input.l15c-input::placeholder{color:#6c6f86}
.l15c-send{border:0;border-radius:999px;background:#237032;color:#fff;font:inherit;font-weight:900;min-height:48px;padding:0 16px;cursor:pointer}
.l15c-kb{border:0;border-radius:12px;background:#e5dbff;color:#1d2340;min-height:48px;min-width:48px;font-size:1.3rem;cursor:pointer}
.l15c-osk{display:flex;flex-direction:column;gap:5px;padding:6px 4px 8px;background:#e9ecef}
.l15c-osk[hidden]{display:none}
.l15c-row{display:flex;gap:4px;justify-content:center}
.l15c-key{flex:1 1 0;max-width:46px;min-width:0;min-height:44px;border:0;border-radius:8px;background:#fff;color:#1d2340;font:inherit;font-weight:900;font-size:1.15rem;box-shadow:0 2px 0 #adb5bd;cursor:pointer;padding:0}
.l15c-key.wide{max-width:96px;flex-grow:2;font-size:1rem}
`);

  /* ===== L15a Dress-Up Closet — DRESS_UP ===== */
  const ZONE = { hat: 'head', cap: 'head', scarf: 'neck', jacket: 'top', vest: 'top', shirt: 'top', sweater: 'top', raincoat: 'top', dress: 'dress', skirt: 'legs', stockings: 'legs', sock: 'feet', socks: 'feet', sneakers: 'feet', shoes: 'feet' };
  L.register({
    id: 'L15a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#f783ac,#e64980 45%,#a61e4d)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 3 : hard ? 5 : 4;
      const P = (cls) => u.el('span', { class: 'l15a-p ' + cls, 'aria-hidden': 'true' });
      const doll = u.el('button', { class: 'l15a-doll', 'aria-label': 'My friend 我的朋友：把衣服放到這裡 Put the clothes here' },
        P('l15a-arm l'), P('l15a-arm r'), P('l15a-leg l'), P('l15a-leg r'), P('l15a-shorts'), P('l15a-torso'), u.el('span', { class: 'l15a-p l15a-head', 'aria-hidden': 'true' }, '🧒'));
      const items = u.el('div', { class: 'l15a-items' + (n >= 5 ? ' l15a-five' : ''), role: 'group', 'aria-label': 'Closet 衣櫃' });
      const closet = u.el('div', { class: 'l15a-closet' }, u.el('div', { class: 'l15a-title zh' }, '🚪 衣櫃 Closet'), u.el('div', { class: 'l15a-rail', 'aria-hidden': 'true' }), items);
      const zh = u.el('div', { class: 'l15a-zh zh' });
      st.body.append(zh, u.el('div', { class: 'l15a-room' }, closet, doll));
      const worn = {}; let waiting = false;
      ctx.on(doll, 'click', () => { if (waiting && !items.querySelector('.ls-selected')) ctx.toast('先點衣櫃裡的衣服，再點朋友 Pick clothes first'); });
      const wear = (w) => {
        const key = w.word.toLowerCase(); const zone = ZONE[key] || 'top';
        const clear = zone === 'dress' ? ['dress', 'top', 'legs'] : zone === 'top' || zone === 'legs' ? [zone, 'dress'] : [zone];
        clear.forEach((z) => { if (worn[z]) { worn[z].remove(); delete worn[z]; } });
        const pic = EP.pic(w); let el;
        if (pic) el = u.el('span', { class: 'l15a-wear l15a-z-' + zone, 'aria-hidden': 'true' }, zone === 'feet' ? pic + pic : pic);
        else {
          const shape = ['sweater', 'raincoat', 'skirt', 'stockings'].includes(key) ? key : 'tag';
          el = u.el('span', { class: 'l15a-wear l15a-shape l15a-s-' + shape, 'aria-hidden': 'true' }, w.zh);
        }
        el.dataset.zh = w.zh; worn[zone] = el; doll.appendChild(el);
        doll.setAttribute('aria-label', `My friend 我的朋友（穿著：${Object.keys(worn).map((z) => worn[z].dataset.zh).join('、')}）：把衣服放到這裡 Put the clothes here`);
      };

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('👗 朋友說他要穿什麼？從衣櫃把那件衣服拖到他身上（或先點衣服再點朋友）。', 'Drag the right clothes onto your friend.'), L.listenBar(ctx, item));
        zh.textContent = easy ? '中文意思：' + zhHint(item) : ''; zh.hidden = !easy;
        const opts = u.shuffle([item].concat(L.others(ctx, item, n - 1, { filter: safe(item) })));
        items.innerHTML = '';
        const btns = opts.map((w) => { const b = u.el('button', { class: 'l15a-item', 'aria-label': w.zh }, L.face(w)); b._w = w; items.appendChild(b); return b; });
        let answered = false; waiting = true;
        const pick = (b) => {
          if (answered) return; answered = true; waiting = false; dd.clear();
          const ok = b._w === item;
          if (ok) { b.classList.add('l15a-gone'); wear(item); EP.sfx.pop(); }
          else { b.classList.add('l15a-no'); ctx.shake(b); const r = btns.find((x) => x._w === item); r && r.classList.add('l15a-yes'); }
          const p = rel(ctx, ok ? doll : b);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: hard ? 140 : 100, wrongText: 'Not that one 不是這件' }).then(done);
        };
        const dd = L.dnd(ctx, btns, [doll], (d) => pick(d));
        T.set(() => pick(btns.find((b) => b._w === item)), () => pick(btns.find((b) => b._w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ===== L15b Shadow Guess — SHADOW_MATCH ===== */
  L.register({
    id: 'L15b',
    // silhouettes need a picture: play the items that have an emoji (all items if a level had too few)
    pool: (ws) => { const p = ws.filter((w) => EP.pic(w)); return p.length >= 4 ? p : ws; },
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'radial-gradient(circle at 50% 10%,#5c1a1a,#2b0606 70%)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 3 : 4;
      const screen = u.el('div', { class: 'l15b-screen', role: 'group', 'aria-label': 'Shadows 影子' }); screen.style.setProperty('--n', String(n));
      const theatre = u.el('div', { class: 'l15b-theatre' + (hard ? ' l15b-blur' : '') }, u.el('div', { class: 'l15b-lamp', 'aria-hidden': 'true' }, '💡'), screen);
      const zh = u.el('div', { class: 'ls-instr zh', style: { fontWeight: 700 } });
      st.body.append(zh, theatre);

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('👤 燈光下只看得到影子！聽句子，點出句子說的那個影子。', 'Tap the right shadow.'), L.listenBar(ctx, item));
        zh.textContent = easy ? '中文意思：' + zhHint(item) : ''; zh.hidden = !easy;
        const ok = safe(item);
        // shadows need pictures: emoji distractors first, Chinese cards only if there are not enough
        let others = EP.pic(item) ? L.others(ctx, item, n - 1, { needPic: true, filter: ok }) : [];
        if (others.length < n - 1) others = others.concat(L.others(ctx, item, n - 1, { filter: (w) => ok(w) && !others.includes(w) }).slice(0, n - 1 - others.length));
        const opts = u.shuffle([item].concat(others));
        screen.innerHTML = '';
        const btns = opts.map((w, i) => {
          const cap = u.el('span', { class: 'l15b-cap', 'aria-hidden': 'true' }, '');
          const b = u.el('button', { class: 'l15b-sh', 'aria-label': `Shadow ${i + 1} 影子 ${i + 1}：${w.zh}` }, L.face(w), cap);
          b._w = w; b._cap = cap; screen.appendChild(b); return b;
        });
        let answered = false;
        const pick = (b) => {
          if (answered) return; answered = true;
          const right = b._w === item; const rb = btns.find((x) => x._w === item);
          b.classList.add('l15b-color', right ? 'right' : 'wrongpick'); rb.classList.add('l15b-color', 'right');
          btns.forEach((x) => { x._cap.textContent = x === rb || x === b ? x._w.word : ''; });
          EP.sfx.whoosh && EP.sfx.whoosh();
          const p = rel(ctx, b);
          L.feedback(ctx, item, right, { x: p.x, y: p.y, points: hard ? 140 : 100, wrongText: 'Wrong shadow 不是這個影子' }).then(async () => {
            btns.forEach((x) => { x.classList.add('l15b-color'); x._cap.textContent = x._w.word; });
            await ctx.wait(700); done();
          });
        };
        btns.forEach((b) => ctx.on(b, 'click', () => pick(b)));
        T.set(() => pick(btns.find((b) => b._w === item)), () => pick(btns.find((b) => b._w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ===== L15c Fashion Chat — TYPING_KEYWORD ===== */
  const STOP = new Set(['i', 'we', 'you', 'he', 'she', 'they', 'it', 'a', 'an', 'the', 'my', 'your', 'his', 'her', 'our', 'their', 'is', 'am', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'with', 'of', 'and', 'for', 'this', 'that', 'can', 'will']);
  /** the key word as heard in the sentence: {text, start}. Falls back to the verb form of an -ing word
   *  (swimming → swim, jogging → jogs) and then to the longest content word (shopping → "We buy toys." → toys). */
  const keyOf = (item) => {
    if (item._l15ckey) return item._l15ckey;
    const k = L.key(item); let res = null;
    if (k) res = { text: k.text, start: k.start, exact: true };
    else {
      const toks = L.tokens(item.sentence); const w = item.word.toLowerCase().replace(/[^a-z' ]/g, '');
      let stem = w.replace(/ing$/, ''); const stems = [];
      if (stem !== w) { stems.push(stem); if (/(.)\1$/.test(stem)) stems.push(stem.slice(0, -1)); }
      let tok = null;
      for (const s of stems) { if (s.length >= 3) tok = toks.find((x) => x.w.startsWith(s)); if (tok) break; }
      if (!tok) tok = toks.filter((x) => !STOP.has(x.w)).sort((a, b) => b.t.length - a.t.length)[0] || toks[toks.length - 1];
      const m = item.sentence.match(new RegExp('(^|[^A-Za-z])(' + tok.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[^A-Za-z]|$)'));
      res = { text: tok.t, start: m ? m.index + m[1].length : item.sentence.indexOf(tok.t), exact: false };
    }
    item._l15ckey = res; return res;
  };
  const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9']/g, '');

  L.register({
    id: 'L15c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#9c36b5,#e64980 60%,#ff8787)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const log = u.el('div', { class: 'l15c-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Chat 聊天紀錄' });
      const input = u.el('input', { type: 'text', class: 'l15c-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'send', 'aria-label': 'Type the key word 打出關鍵字', placeholder: 'Type here 在這裡打字' });
      const send = u.el('button', { type: 'submit', class: 'l15c-send', 'aria-label': 'Send 送出' }, '➤ Send');
      const kbBtn = u.el('button', { type: 'button', class: 'l15c-kb', 'aria-label': 'On-screen keyboard 螢幕鍵盤', 'aria-pressed': 'false' }, '⌨️');
      const form = u.el('form', { class: 'l15c-compose' }, kbBtn, input, send);
      const osk = u.el('div', { class: 'l15c-osk', role: 'group', 'aria-label': 'Keyboard 鍵盤' });
      const phone = u.el('div', { class: 'l15c-phone' },
        u.el('div', { class: 'l15c-top' }, u.el('span', { class: 'l15c-av', 'aria-hidden': 'true' }, '👧'), u.el('div', {}, 'Mia', u.el('div', { class: 'l15c-on zh' }, '● online 線上 · Fashion Chat 穿搭聊天室'))),
        log, form, osk);
      st.body.append(phone);
      const keyRow = (chars, extra) => u.el('div', { class: 'l15c-row' }, chars.split('').map((ch) => u.el('button', { type: 'button', class: 'l15c-key', 'data-k': ch, 'aria-label': 'Letter ' + ch }, ch)), extra || []);
      osk.append(keyRow('qwertyuiop'), keyRow('asdfghjkl', [u.el('button', { type: 'button', class: 'l15c-key wide', 'data-k': 'back', 'aria-label': 'Backspace 刪除' }, '⌫')]), keyRow('zxcvbnm', [u.el('button', { type: 'button', class: 'l15c-key wide', 'data-k': 'send', 'aria-label': 'Send 送出' }, '⏎')]));
      let oskOn = false;
      const setOsk = (on) => { oskOn = on; osk.hidden = !on; kbBtn.setAttribute('aria-pressed', String(on)); if (on) input.setAttribute('inputmode', 'none'); else input.removeAttribute('inputmode'); };
      setOsk(!!(window.matchMedia && matchMedia('(pointer: coarse)').matches));
      ctx.on(kbBtn, 'click', () => setOsk(!oskOn));
      let onSend = null;
      ctx.on(form, 'submit', (e) => { e.preventDefault(); onSend && onSend(); });
      ctx.on(osk, 'click', (e) => {
        const b = e.target.closest && e.target.closest('button'); if (!b) return; const k = b.dataset.k;
        if (k === 'send') { onSend && onSend(); return; }
        if (k === 'back') input.value = input.value.slice(0, -1); else input.value += k;
        EP.sfx.tick();
      });
      const add = (who, ...kids) => {
        const m = u.el('div', { class: 'l15c-msg ' + who }, ...kids); log.appendChild(m);
        while (log.children.length > 9) log.firstChild.remove();
        log.scrollTop = log.scrollHeight; return m;
      };
      const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        const bar = L.listenBar(ctx, item);
        st.head.append(L.say('⌨️ Mia 傳來語音訊息！聽句子，打出句子裡少了的那個字，按 Enter 送出。', 'Type the key word from the sentence.'), bar);
        const k = keyOf(item); const kt = k.text;
        const letters = clean(kt).length;
        const blankTxt = easy ? kt[0] + ' _'.repeat(Math.max(0, letters - 1)) : '?';
        const blank = u.el('span', { class: 'l15c-blank', 'aria-label': easy ? `blank, starts with ${kt[0]}, ${letters} letters` : 'blank 空格' }, blankTxt);
        add('them', u.el('button', { type: 'button', class: 'l15c-vm', 'aria-label': 'Play voice message 播放語音訊息', onclick: () => bar.play(false) }, '🎤 ▶ 0:0' + Math.min(9, 2 + Math.round(item.sentence.length / 12))));
        add('them', u.el('div', { class: 'l15c-cloze' }, item.sentence.slice(0, k.start), blank, item.sentence.slice(k.start + kt.length)),
          easy ? u.el('span', { class: 'l15c-sub zh' }, `${letters} 個字母 letters · ${item.sentenceZh}`) : null,
          hard ? null : u.el('span', { class: 'l15c-sub zh' }, 'Which word? 少了哪個字？'));
        input.value = '';
        if (!coarse && !oskOn) try { input.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        let answered = false;
        const go = () => {
          if (answered) return;
          const typed = clean(input.value);
          if (!typed) { ctx.toast('先打字再送出 Type the word first'); return; }
          answered = true; onSend = null;
          const ok = typed === clean(kt) || (k.exact && typed === clean(item.word));
          add('me ' + (ok ? 'ok' : 'bad'), input.value.trim());
          input.value = '';
          add('them', ok ? `👍 Yes! “${kt}” 對！` : `🤔 It's “${kt}”. 是 ${kt} 喔！`);
          L.feedback(ctx, item, ok, { points: (hard ? 120 : 90) + letters * 5, wrongText: `The word is “${kt}” 答案是 ${kt}` }).then(done);
        };
        onSend = go;
        T.set(() => { input.value = kt; go(); }, () => { input.value = 'zzq'; go(); });
      }));
      return { test: T.api };
    },
  });
})();
