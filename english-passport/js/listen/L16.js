/* Sentence Listening — Level 16 (School things · Days · Times): DIAL_ROTATE, PACK_BAG, INTRUDER_DELETE
 * L16a Day & Week Wheel: turn the wheel (⟲ ⟳ / arrow keys / drag) until the pointer shows the heard time word, press OK.
 * L16b School Bag Pack: drag the heard thing from the desk into the school bag.
 * L16c Clean the Sentence: the subtitle has ONE extra word that was not said — tap it to wipe it away. */
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
  const notSaid = (item) => { const said = heard(item); return (w) => !said.has(w.word.toLowerCase()) && !said.has(L.keyText(w).toLowerCase()); };

  L.css('L16', `
.l16a-box{position:relative;width:min(78vw,36vh,340px);aspect-ratio:1;margin-top:16px;flex:none}
.l16a-clip{position:absolute;inset:0;border-radius:50%;overflow:hidden;box-shadow:0 10px 0 rgba(0,0,0,.25),0 0 0 4px #1d2340}
.l16a-wheel{position:absolute;inset:0;border-radius:50%;border:7px solid #fff;transition:transform .45s cubic-bezier(.3,1.35,.5,1);touch-action:none;cursor:grab}
.l16a-wheel.l16a-drag,.l16a-wheel.l16a-drag .l16a-lab{transition:none}
.l16a-spoke{position:absolute;left:50%;top:0;width:0;height:50%;transform-origin:50% 100%;pointer-events:none}
.l16a-lab{position:absolute;left:0;top:33%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;color:#1d2340;font-weight:900;font-size:clamp(.82rem,2.5vw,1.08rem);white-space:nowrap;padding:2px 6px;border-radius:10px;transition:transform .45s cubic-bezier(.3,1.35,.5,1),background .2s}
.l16a-lab .l16a-ic{font-size:1.35em;line-height:1}
.l16a-lab.on{background:#fff;box-shadow:0 0 0 3px #e03131}
.l16a-pointer{position:absolute;left:50%;top:-20px;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:30px solid #e03131;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35));z-index:3}
.l16a-hub{position:absolute;left:50%;top:50%;width:22%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#ced4da);box-shadow:0 4px 0 rgba(0,0,0,.25),0 0 0 4px #1d2340;display:flex;align-items:center;justify-content:center;font-size:clamp(1.4rem,4vw,2rem);z-index:2;pointer-events:none}
.l16a-live{background:#fff;color:#1d2340;border-radius:999px;padding:6px 16px;font-weight:900;box-shadow:0 3px 0 rgba(0,0,0,.2);text-align:center}
.l16a-ctrl{display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap}
.l16a-ctrl .btn.l16a-turn{background:#fff;color:#1d2340;font-size:1.6rem;min-width:64px}
.l16a-good{background:#b2f2bb!important;box-shadow:0 0 0 4px #2b8a3e!important}
.l16a-bad{background:#ffc9c9!important;box-shadow:0 0 0 4px #c92a2a!important}
.l16b-room{display:flex;gap:clamp(12px,3vw,36px);align-items:center;justify-content:center;flex-wrap:wrap;width:100%}
.l16b-desk{width:min(520px,100%);background:linear-gradient(180deg,#c08552,#8d5b32);border-radius:20px;padding:14px;box-shadow:0 12px 0 #5e3a1e,inset 0 0 0 4px #d9a066}
.l16b-desk-t{color:#fff;background:#5e3a1e;border-radius:999px;padding:2px 12px;width:max-content;margin:0 auto 8px;font-weight:900;text-align:center}
.l16b-items{display:grid;grid-template-columns:repeat(auto-fit,minmax(60px,1fr));gap:8px}
.l16b-item{border:0;border-radius:16px;background:#fff8ee;color:#1d2340;min-height:clamp(84px,14vh,112px);display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;box-shadow:0 5px 0 rgba(0,0,0,.25);font:inherit;transition:transform .45s ease-in}
.l16b-item .ls-emoji{font-size:clamp(2.5rem,7vw,3.5rem)}
.l16b-item:focus-visible,.l16b-bag:focus-visible{outline:4px solid #ffd43b;outline-offset:3px}
.l16b-item.l16b-no{background:#ffe3e3;box-shadow:0 0 0 4px #c92a2a}
.l16b-item.l16b-yes{background:#d3f9d8;box-shadow:0 0 0 4px #2b8a3e}
.l16b-bagwrap{display:flex;flex-direction:column;align-items:center;gap:8px}
.l16b-bag{border:4px dashed rgba(255,255,255,.75);border-radius:30px;background:rgba(255,255,255,.18);width:clamp(150px,30vw,210px);aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#fff;font:inherit;font-weight:900;padding:6px}
.l16b-bag.ls-over{background:rgba(255,236,153,.45)}
.l16b-lab{background:#1d2340;color:#fff;border-radius:999px;padding:2px 10px;margin-top:4px}
.l16b-bag .l16b-big{font-size:clamp(5rem,14vw,7.5rem);line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l16b-bag.l16b-gulp .l16b-big{animation:l16bgulp .45s ease-out}
@keyframes l16bgulp{40%{transform:scale(1.18,.9)}100%{transform:none}}
.l16b-in{min-height:2.2em;max-width:min(320px,90vw);background:#fff;color:#1d2340;border-radius:14px;padding:4px 10px;font-weight:800;text-align:center;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center}
.l16b-in .ls-emoji{font-size:1.5rem}.l16b-in .ls-zhcard{font-size:.85rem;padding:2px 6px}
.l16c-tv{width:min(860px,100%);background:#212529;border-radius:28px;padding:clamp(10px,2.4vw,18px);box-shadow:0 0 0 6px #495057,0 14px 0 #343a40,0 20px 40px rgba(0,0,0,.4);position:relative}
.l16c-tv::after{content:'';position:absolute;left:50%;bottom:-30px;width:34%;height:14px;transform:translateX(-50%);background:#495057;border-radius:0 0 12px 12px}
.l16c-screen{background:radial-gradient(ellipse at 50% 30%,#4dabf7,#1864ab 70%);border-radius:18px;min-height:clamp(170px,30vh,260px);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:12px 10px;overflow:hidden}
.l16c-scene{font-size:clamp(3rem,10vw,4.6rem);line-height:1;margin-top:4px}
.l16c-rec{align-self:flex-start;background:#c92a2a;color:#fff;border-radius:999px;padding:2px 10px;font-size:.8rem;font-weight:900}
.l16c-sub{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(4px,1vw,8px);background:rgba(0,0,0,.82);border-radius:14px;padding:8px 10px;max-width:100%}
.l16c-w{border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff;font:inherit;font-weight:900;font-size:clamp(1.15rem,3.6vw,1.65rem);border-radius:12px;padding:4px 10px;min-height:48px;cursor:pointer;max-width:20ch;overflow:hidden;white-space:nowrap;transition:max-width .5s ease,padding .5s ease,opacity .5s ease}
.l16c-w:hover{border-color:#ffd43b}
.l16c-w:focus-visible{outline:4px solid #ffd43b;outline-offset:2px}
.l16c-w.l16c-wipe{text-decoration:line-through 4px #ff8787;background:#c92a2a;border-color:#fff}
.l16c-w.l16c-gone{max-width:0;padding-left:0;padding-right:0;border-width:0;opacity:0}
.l16c-w.l16c-miss{background:#c92a2a;border-color:#fff}
.l16c-w.l16c-show{border:3px dashed #ffd43b;background:#5c3d00}
.l16c-w.l16c-show::after{content:' ← extra 多的字';font-size:.7em;color:#ffd43b}
.l16c-zh{background:#fff;color:#1d2340;border-radius:14px;padding:4px 12px;font-weight:700}
.l16c-count{color:#fff;font-weight:800;background:#212529;border-radius:999px;padding:4px 14px}
.l16c-count:empty{display:none}
`);

  /* ===== L16a Day & Week Wheel — DIAL_ROTATE ===== */
  const COLORS = ['#ffe066', '#a5d8ff', '#ffc9c9', '#b2f2bb', '#d0bfff', '#ffd8a8', '#99e9f2', '#fcc2d7'];
  L.register({
    id: 'L16a',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#0b1d51 0%,#364fc7 45%,#ffa94d 100%)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 4 : 6; let m = n, step = 360 / n;
      const wheel = u.el('div', { class: 'l16a-wheel', 'aria-hidden': 'true' });
      const box = u.el('div', { class: 'l16a-box' }, u.el('div', { class: 'l16a-pointer', 'aria-hidden': 'true' }), u.el('div', { class: 'l16a-clip' }, wheel), u.el('div', { class: 'l16a-hub', 'aria-hidden': 'true' }, '🌗'));
      const live = u.el('div', { class: 'l16a-live', 'aria-live': 'polite' });
      const left = u.el('button', { class: 'btn l16a-turn', 'aria-label': 'Turn left 向左轉' }, '⟲');
      const right = u.el('button', { class: 'btn l16a-turn', 'aria-label': 'Turn right 向右轉' }, '⟳');
      const okBtn = u.el('button', { class: 'btn go big' }, '✔ OK 確定');
      const zh = u.el('div', { class: 'ls-instr zh', style: { fontWeight: 700 } });
      st.body.append(zh, box, live, u.el('div', { class: 'l16a-ctrl' }, left, okBtn, right));

      let rot = 0, words = [], labs = [];
      const at = () => (((-rot) % m) + m) % m; // index of the word under the pointer
      const paint = (deg) => {
        wheel.style.transform = `rotate(${deg}deg)`;
        labs.forEach((lb, i) => { lb.style.transform = `translate(-50%,-50%) rotate(${-(i * step + deg)}deg)`; });
      };
      const render = () => {
        paint(rot * step);
        const i = at(); labs.forEach((lb, k) => lb.classList.toggle('on', k === i));
        if (words[i]) live.textContent = `▼ Pointer 指針：${words[i].word}`;
      };
      let locked = true;
      const turn = (d) => { if (locked) return; rot += d; render(); EP.sfx.tick(); };
      ctx.on(left, 'click', () => turn(-1));
      ctx.on(right, 'click', () => turn(1));
      ctx.on(window, 'keydown', (e) => {
        if (ctx.paused || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
      });
      // drag the wheel round with a finger / mouse; it snaps to the nearest word
      let drag = null;
      const ang = (e) => { const r = wheel.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
      ctx.on(wheel, 'pointerdown', (e) => { if (locked) return; drag = { a0: ang(e), d0: rot * step, deg: rot * step, moved: false }; });
      ctx.on(window, 'pointermove', (e) => {
        if (!drag) return; let d = ang(e) - drag.a0; if (d > 180) d -= 360; if (d < -180) d += 360;
        if (!drag.moved && Math.abs(d) < 4) return; drag.moved = true; wheel.classList.add('l16a-drag');
        drag.deg = drag.d0 + d; paint(drag.deg);
      });
      ctx.on(window, 'pointerup', () => {
        if (!drag) return; const dg = drag; drag = null; wheel.classList.remove('l16a-drag');
        if (!dg.moved) return; void wheel.offsetWidth; const nr = Math.round(dg.deg / step); const ch = nr !== rot; rot = nr; render(); if (ch) EP.sfx.tick();
      });
      let press = null;
      ctx.on(okBtn, 'click', () => press && press());

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🌗 聽句子，轉動轉輪，讓紅色指針對準句子裡的時間字，按確定！', 'Turn the wheel to the right time word and press OK.'), L.listenBar(ctx, item));
        zh.textContent = easy ? '中文意思：' + zhHint(item) : ''; zh.hidden = !easy;
        // "Yesterday was Monday." → yesterday can never be a wrong answer on the wheel
        let others = L.others(ctx, item, n - 1, { filter: notSaid(item), poolOnly: true });
        if (others.length < n - 1) others = others.concat(L.others(ctx, item, n - 1, { filter: (w) => notSaid(item)(w) && !others.includes(w) }).slice(0, n - 1 - others.length));
        words = u.shuffle([item].concat(others));
        const ti = words.indexOf(item); m = words.length; step = 360 / m;
        const stp = step;
        wheel.innerHTML = '';
        wheel.style.background = `conic-gradient(from ${-stp / 2}deg, ${words.map((_, i) => `${COLORS[i % COLORS.length]} ${i * stp}deg ${(i + 1) * stp}deg`).join(', ')})`;
        labs = words.map((w, i) => {
          const pic = !hard && EP.pic(w);
          const lb = u.el('span', { class: 'l16a-lab' }, pic ? u.el('span', { class: 'l16a-ic', 'aria-hidden': 'true' }, pic) : null, u.el('span', {}, w.word));
          wheel.appendChild(u.el('div', { class: 'l16a-spoke', style: { transform: `rotate(${i * stp}deg)` } }, lb));
          return lb;
        });
        wheel.classList.add('l16a-drag'); // jump to the start position without spinning
        rot = -(((ti + u.randInt(1, m - 1)) % m)); render(); void wheel.offsetWidth; wheel.classList.remove('l16a-drag');
        locked = false;
        let answered = false;
        const ok = () => {
          if (answered) return; answered = true; locked = true; drag = null;
          const i = at(); const good = i === ti;
          labs[i].classList.add(good ? 'l16a-good' : 'l16a-bad');
          if (!good) labs[ti].classList.add('l16a-good');
          const p = rel(ctx, box);
          L.feedback(ctx, item, good, { x: p.x, y: p.y + 20, points: hard ? 140 : 100, wrongText: `The word was “${item.word}” 是「${item.word}」` }).then(done);
        };
        press = ok;
        T.set(() => { for (let g = 0; g < 12 && at() !== ti; g++) turn(1); ok(); }, () => { if (at() === ti) turn(1); ok(); });
      }));
      return { test: T.api };
    },
  });

  /* ===== L16b School Bag Pack — PACK_BAG ===== */
  L.register({
    id: 'L16b',
    // only things that fit in a school bag (pencil, pen, eraser, spoon, scissors, ruler); not days/times
    pool: (ws) => { const p = ws.filter((w) => !L.TIME.has(w.word.toLowerCase())); return p.length >= 4 ? p : ws; },
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#2f9e44,#37b24d 50%,#8ce99a)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const n = easy ? 3 : hard ? 5 : 4;
      const items = u.el('div', { class: 'l16b-items', role: 'group', 'aria-label': 'Desk 書桌' });
      const desk = u.el('div', { class: 'l16b-desk' }, u.el('div', { class: 'l16b-desk-t zh' }, '🪑 書桌 Desk'), items);
      const bag = u.el('button', { class: 'l16b-bag', 'aria-label': 'School bag 書包：放進這裡 Put it in here' }, u.el('span', { class: 'l16b-big', 'aria-hidden': 'true' }, '🎒'), u.el('span', { class: 'zh l16b-lab' }, '書包 Bag'));
      const inBag = u.el('div', { class: 'l16b-in', 'aria-live': 'polite' }, u.el('span', { class: 'zh' }, '書包裡 In the bag：'));
      const zh = u.el('div', { class: 'l16c-zh zh' });
      st.body.append(zh, u.el('div', { class: 'l16b-room' }, desk, u.el('div', { class: 'l16b-bagwrap' }, bag, inBag)));
      const packed = []; let waiting = false;
      ctx.on(bag, 'click', () => { if (waiting && !items.querySelector('.ls-selected')) ctx.toast('先點書桌上的東西，再點書包 Pick a thing first'); });

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎒 聽句子，把句子說的東西從書桌拖進書包（或先點東西再點書包）！', 'Drag the right thing into the school bag.'), L.listenBar(ctx, item));
        zh.textContent = easy ? '中文意思：' + zhHint(item) : ''; zh.hidden = !easy;
        let others = L.others(ctx, item, n - 1, { filter: (w) => notSaid(item)(w) && !L.TIME.has(w.word.toLowerCase()) });
        if (others.length < n - 1) others = others.concat(L.others(ctx, item, n - 1, { filter: (w) => notSaid(item)(w) && !others.includes(w) }).slice(0, n - 1 - others.length));
        const opts = u.shuffle([item].concat(others));
        items.innerHTML = '';
        const btns = opts.map((w) => { const b = u.el('button', { class: 'l16b-item', 'aria-label': w.zh }, L.face(w)); b._w = w; items.appendChild(b); return b; });
        let answered = false; waiting = true;
        const pick = (b) => {
          if (answered) return; answered = true; waiting = false; dd.clear();
          const ok = b._w === item;
          if (ok) {
            const r = b.getBoundingClientRect(), g = bag.getBoundingClientRect();
            b.style.transform = `translate(${g.left + g.width / 2 - (r.left + r.width / 2)}px,${g.top + g.height / 2 - (r.top + r.height / 2)}px) scale(.2)`;
            ctx.timeout(() => { b.style.visibility = 'hidden'; bag.classList.remove('l16b-gulp'); void bag.offsetWidth; bag.classList.add('l16b-gulp'); EP.sfx.pop(); }, 420);
            if (!packed.includes(item)) { packed.push(item); inBag.appendChild(L.face(item)); }
          } else {
            b.classList.add('l16b-no'); ctx.shake(bag); const rb = btns.find((x) => x._w === item); rb && rb.classList.add('l16b-yes');
          }
          const p = rel(ctx, bag);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: hard ? 140 : 100, wrongText: 'Not that one 不是這個' }).then(done);
        };
        const dd = L.dnd(ctx, btns, [bag], (d) => pick(d));
        T.set(() => pick(btns.find((b) => b._w === item)), () => pick(btns.find((b) => b._w !== item)));
      }));
      return { test: T.api };
    },
  });

  /* ===== L16c Clean the Sentence — INTRUDER_DELETE ===== */
  /* the subtitle with ONE extra word in [brackets], chosen so the sentence still reads naturally
   * (you have to LISTEN to find it). Each entry is checked at run time: removing the word must give the real sentence. */
  const INS = {
    pencil: ['I use a [new] pencil.', 'I use a pencil [today].', 'I [often] use a pencil.'],
    pen: ['I write with a [red] pen.', 'I write with a pen [today].', 'I [always] write with a pen.'],
    eraser: ['I have an [old] eraser.', 'I [also] have an eraser.', 'I have an eraser [today].'],
    spoon: ['I eat with a [big] spoon.', 'I eat with a spoon [today].', 'I [always] eat with a spoon.'],
    scissors: ['I cut paper with [my] scissors.', 'I cut [red] paper with scissors.', 'I cut paper with scissors [today].'],
    ruler: ['I measure with a [long] ruler.', 'I measure with a ruler [today].', 'I [often] measure with a ruler.'],
    year: ['It is a [happy] new year.', 'It is a new [school] year.'],
    monday: ['Yesterday was Monday [morning].', 'Yesterday was [not] Monday.', 'Yesterday was Monday [night].'],
    tuesday: ['Today is Tuesday [afternoon].', 'Today is [not] Tuesday.', 'Today is Tuesday [morning].'],
    wednesday: ['We go to school on Wednesday [morning].', 'We [also] go to school on Wednesday.', 'We go to school on Wednesday [afternoon].'],
    thursday: ['Tomorrow is [not] Thursday.', 'Tomorrow is [a] Thursday.'],
    friday: ['Friday is a [very] fun day!', 'Friday is [always] a fun day!', 'Friday is a fun [school] day!'],
    saturday: ['We play on Saturday [morning].', 'We [all] play on Saturday.', 'We play [ball] on Saturday.'],
    sunday: ['Sunday is a [good] rest day.', 'Sunday is [always] a rest day.', 'Sunday is [not] a rest day.'],
    weekend: ['The weekend is [almost] here!', 'The [long] weekend is here!', 'The weekend is [not] here!'],
    morning: ['I wake up [early] in the morning.', 'I [always] wake up in the morning.'],
    today: ['Today is a [very] good day.', 'Today is [not] a good day.', 'Today is a good [school] day.'],
    tomorrow: ['I will go [home] tomorrow.', 'I will [not] go tomorrow.', 'I will go tomorrow [morning].'],
    yesterday: ['Yesterday was [very] fun.', 'Yesterday was [not] fun.', 'Yesterday was [so] fun.'],
    night: ['We [always] sleep at night.', 'We sleep [well] at night.'],
    afternoon: ['I [always] eat lunch in the afternoon.', 'I eat [my] lunch in the afternoon.', 'I eat lunch [late] in the afternoon.'],
    week: ['I [also] go to school this week.', 'I go to school this week [too].', 'I go to school [early] this week.'],
    noon: ['We [always] eat lunch at noon.', 'We eat [our] lunch at noon.', 'We eat lunch at noon [today].'],
  };
  /** parse 'I use a [new] pencil.' → {words, idx} if removing the word gives exactly the real sentence */
  const parseIns = (sentence, mod) => {
    const raw = mod.split(/\s+/); const idx = raw.findIndex((t) => /\[[^\]]+\]/.test(t)); if (idx < 0) return null;
    const ex = raw[idx].match(/\[([^\]]+)\]/)[1];
    const words = raw.map((t) => t.replace(/[[\]]/g, ''));
    const rest = words.slice(); rest.splice(idx, 1);
    if (idx === words.length - 1) rest[rest.length - 1] += words[idx].slice(ex.length);
    if (rest.join(' ') !== sentence.trim().replace(/\s+/g, ' ')) return null;
    if (heard({ sentence }).has(ex.toLowerCase())) return null;
    return { words, idx, extra: ex };
  };
  /** fallback for any sentence: put the headword of another item in (a time word at the end when it fits) */
  const genericIns = (ctx, item) => {
    const words = item.sentence.trim().split(/\s+/); const said = heard(item);
    const cand = L.others(ctx, item, 10, { filter: (w) => !/\s/.test(w.word.trim()) && !said.has(w.word.toLowerCase()) }).map((w) => w.word.replace(/[.!?]+$/, ''));
    const adv = cand.find((t) => /^(today|tomorrow|yesterday)$/i.test(t));
    const ex = adv || cand[0] || 'today';
    if (adv || words.length < 2) {
      const last = words[words.length - 1]; const m = last.match(/^(.*?)([.!?,]*)$/);
      words[words.length - 1] = m[1]; words.push(ex + m[2]);
      return { words, idx: words.length - 1, extra: ex };
    }
    const idx = u.randInt(1, words.length - 1); words.splice(idx, 0, ex);
    return { words, idx, extra: ex };
  };

  L.register({
    id: 'L16c',
    start(ctx) {
      const T = L.tester();
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#343a40,#495057 50%,#868e96)' });
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      const scene = u.el('div', { class: 'l16c-scene', 'aria-hidden': 'true' });
      const sub = u.el('div', { class: 'l16c-sub', role: 'group', 'aria-label': 'Subtitle 字幕' });
      const tv = u.el('div', { class: 'l16c-tv' }, u.el('div', { class: 'l16c-screen' }, u.el('span', { class: 'l16c-rec', 'aria-hidden': 'true' }, '● LIVE'), scene, sub));
      const zh = u.el('div', { class: 'l16c-zh zh' });
      const count = u.el('div', { class: 'l16c-count zh', 'aria-live': 'polite' });
      st.body.append(zh, tv); st.foot.append(count);
      let cleaned = 0;

      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🧽 字幕裡多了一個沒說的字！聽句子，點掉多出來的那個字。', 'Tap the extra word that was not said.'), L.listenBar(ctx, item));
        zh.textContent = easy ? '中文意思：' + item.sentenceZh : ''; zh.hidden = !easy;
        scene.textContent = EP.pic(item) || u.pick(['🎬', '📺', '🎞️']);
        const list = (INS[item.word.toLowerCase()] || []).map((m) => parseIns(item.sentence, m)).filter(Boolean);
        const ins = list.length ? u.pick(list) : genericIns(ctx, item);
        sub.innerHTML = '';
        const btns = ins.words.map((t, i) => { const b = u.el('button', { class: 'l16c-w' }, t); b._i = i; sub.appendChild(b); return b; });
        let answered = false;
        const pick = (i) => {
          if (answered) return; answered = true;
          const ok = i === ins.idx; const b = btns[i]; const xb = btns[ins.idx];
          if (ok) {
            b.classList.add('l16c-wipe'); EP.sfx.whoosh && EP.sfx.whoosh();
            ctx.timeout(() => b.classList.add('l16c-gone'), 300);
            cleaned++; count.textContent = `🧽 已清理 ${cleaned} 句字幕 · ${cleaned} cleaned`;
          } else { b.classList.add('l16c-miss'); ctx.shake(b); xb.classList.add('l16c-show'); }
          const p = rel(ctx, b);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, points: hard ? 140 : 100, wrongText: `Extra word 多的字：${ins.extra}` }).then(done);
        };
        btns.forEach((b, i) => ctx.on(b, 'click', () => pick(i)));
        T.set(() => pick(ins.idx), () => pick(ins.idx === 0 ? 1 : 0));
      }));
      return { test: T.api };
    },
  });
})();
