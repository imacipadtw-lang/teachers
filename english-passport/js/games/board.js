/* Level 11 — Lion City Board Dash (inspired by Monopoly GO!: roll dice, hop round the board, build landmarks, collect coins)
 * 16-tile loop: GO, 2 Chance, a Rest stop and 12 places (round words first). Land on a place → answer a question
 * about the next round word (listen / picture-or-Chinese / meaning / spell). Correct → build a landmark there + coins.
 * The round ends when every round word has been asked once. */
(function () {
  const EP = window.EP, u = EP.u;
  const POS = [[4, 4], [4, 3], [4, 2], [4, 1], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4]];
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const SPECIAL = { 0: { kind: 'go', icon: '🏁', name: 'GO', zh: '起點 +200' }, 4: { kind: 'chance', icon: '🎁', name: 'Chance', zh: '機會' }, 8: { kind: 'rest', icon: '☕', name: 'Rest Stop', zh: '休息站' }, 12: { kind: 'chance', icon: '🎁', name: 'Chance', zh: '機會' } };
  const SIDE = ['#f76707', '#e64980', '#7048e8', '#1c7ed6'];
  const LM = ['', '🏠', '🏨', '🏰'];
  const CSS = `
  .bd-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .bd-board{position:relative;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(5,1fr);gap:3px;padding:4px;background:#0b3d4a;border-radius:18px;box-shadow:0 8px 0 rgba(0,0,0,.25),0 18px 40px rgba(0,0,0,.3)}
  .bd-tile{position:relative;background:#fffaf0;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:#1d2340;text-align:center;padding:2px;transition:transform .15s,box-shadow .25s,background .25s}
  .bd-tile .band{position:absolute;left:0;right:0;top:0;height:13%}
  .bd-tile .e{font-size:var(--te);line-height:1.05;margin-top:6%}
  .bd-tile .n{font-size:max(9px,calc(var(--tn) * var(--f,1)));font-weight:900;line-height:1.05;padding:0 2px}
  .bd-tile .lm{position:absolute;right:1px;top:10%;font-size:calc(var(--te)*.72);filter:drop-shadow(0 2px 0 rgba(0,0,0,.25))}
  .bd-tile .lm.pop{animation:bdPop .6s cubic-bezier(.2,1.8,.4,1) both}
  .bd-tile.go{background:linear-gradient(135deg,#d3f9d8,#69db7c)}.bd-tile.chance{background:linear-gradient(135deg,#fff3bf,#ffd43b)}.bd-tile.rest{background:linear-gradient(135deg,#e7f5ff,#74c0fc)}
  .bd-tile.step{transform:scale(1.07);z-index:2}
  .bd-tile.owned{background:#fff4d6;box-shadow:inset 0 0 0 4px var(--oc)}
  .bd-center{grid-row:2/5;grid-column:2/5;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;gap:4px;background:radial-gradient(circle at 50% 25%,#15aabf,#0b3d4a 80%);border-radius:12px;color:#fff;padding:6px;overflow:hidden;text-align:center}
  .bd-title{font-weight:900;font-size:var(--ct);line-height:1.05;text-shadow:0 3px 0 rgba(0,0,0,.3)}
  .bd-stats{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
  .bd-stats .chip{font-size:var(--cs)}
  .bd-dice{display:flex;gap:12px}
  .bd-die{width:var(--dk);height:var(--dk);background:#fff;border-radius:20%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:10%;box-shadow:0 5px 0 #c9cde3,0 8px 14px rgba(0,0,0,.3)}
  .bd-die i{display:block;border-radius:50%;margin:14%}.bd-die i.on{background:#e03131}
  .bd-die.rolling{animation:bdRoll .14s linear infinite}
  .bd-roll{min-height:60px;font-size:var(--cb)!important;padding:8px 18px!important}
  .bd-roll.ready{animation:bdPulse 1.1s ease-in-out infinite}
  .bd-info{font-weight:800;font-size:var(--cs);min-height:1.3em}
  .bd-sky{position:relative;width:calc(var(--dk)*1.9);height:calc(var(--dk)*.75)}
  .bd-sky i{position:absolute;bottom:0;width:18%;height:84%;background:linear-gradient(90deg,#f1f3f5,#adb5bd);border-radius:3px 3px 0 0}
  .bd-sky i:nth-child(1){left:8%}.bd-sky i:nth-child(2){left:36%}.bd-sky i:nth-child(3){left:64%}
  .bd-sky b{position:absolute;top:2%;left:2%;width:90%;height:14%;background:#e9ecef;border-radius:8px 30px 30px 8px;box-shadow:0 2px 0 rgba(0,0,0,.25)}
  .bd-sky span{position:absolute;right:-24%;bottom:0;font-size:calc(var(--dk)*.55)}
  .bd-token{position:absolute;z-index:5;transform:translate(-50%,-60%);transition:left .16s ease-out,top .16s ease-out;pointer-events:none}
  .bd-token span{display:flex;align-items:center;justify-content:center;width:var(--tk);height:var(--tk);border-radius:50%;background:#fff;border:3px solid #f59f00;font-size:calc(var(--tk)*.64);box-shadow:0 6px 8px rgba(0,0,0,.35)}
  .bd-token.hop span{animation:bdHop .2s ease-out}
  .bd-q{position:absolute;inset:0;z-index:30;background:rgba(5,20,30,.62);display:flex;align-items:center;justify-content:center;padding:8px}
  .bd-qp{width:min(780px,100%);max-height:100%;overflow:auto;background:linear-gradient(160deg,#0b7285,#0b3d4a);border-radius:24px;padding:12px;color:#fff;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 18px 40px rgba(0,0,0,.45);animation:bdIn .25s ease-out both;border:4px solid #ffd43b;text-align:center}
  .bd-qp .choices{width:100%}
  .bd-qh{font-weight:900;font-size:clamp(1.05rem,3.6vw,1.4rem);display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}
  .bd-qp .qpic{font-size:clamp(3.4rem,14vw,5.6rem);line-height:1}
  .bd-qp .zhbig{font-size:clamp(2rem,8vw,3rem);font-weight:900}
  .bd-qp .word{font-size:clamp(2.2rem,9vw,3.6rem);font-weight:900}
  .bd-coin{position:absolute;z-index:6;font-size:26px;transition:left .55s ease-in,top .55s ease-in,opacity .55s;pointer-events:none;transform:translate(-50%,-50%)}
  .bd-end{position:absolute;inset:0;z-index:35;display:flex;align-items:center;justify-content:center;background:rgba(5,20,30,.55)}
  @keyframes bdRoll{0%{transform:rotate(-16deg) translateY(-8px)}50%{transform:rotate(16deg) translateY(2px)}100%{transform:rotate(-16deg) translateY(-8px)}}
  @keyframes bdHop{50%{transform:translateY(-55%) scale(1.1)}}
  @keyframes bdPop{0%{transform:scale(0) translateY(20px)}100%{transform:scale(1)}}
  @keyframes bdPulse{50%{transform:scale(1.06)}}
  @keyframes bdIn{from{transform:scale(.7);opacity:0}}`;

  EP.registerGame({
    id: 'board', level: 11, icon: '🎲', title: 'Lion City Board Dash', titleZh: '獅城大富翁',
    model: 'Monopoly GO! 地產大亨GO（擲骰子、走格子、蓋地標）',
    howZh: '擲骰子前進！停在地點格就回答問題，答對就在那裡蓋地標、賺金幣。經過起點、抽到機會卡還有獎勵！',
    howEn: 'Roll the dice and hop around Singapore! Answer where you land to build landmarks and earn coins.',
    skills: ['listening', 'meaning', 'spelling', 'reading'],
    start(ctx) {
      const root = ctx.root, diff = ctx.difficulty, items = ctx.items;
      root.style.background = 'linear-gradient(180deg,#0c8599 0%,#22b8cf 60%,#66d9e8 100%)';
      root.appendChild(u.el('style', {}, CSS));
      const placeWords = items.slice(0, 12);
      for (const w of u.shuffle(ctx.pool)) { if (placeWords.length >= 12) break; if (!placeWords.includes(w)) placeWords.push(w); }
      const order = u.shuffle(placeWords); let pi = 0;
      const tiles = POS.map((_, i) => SPECIAL[i] ? Object.assign({ i }, SPECIAL[i]) : order[pi] ? { i, kind: 'place', w: order[pi++], lvl: 0, color: SIDE[Math.floor(i / 4)] } : Object.assign({ i }, SPECIAL[8]));
      const board = u.el('div', { class: 'bd-board' });
      tiles.forEach((tl) => {
        const [r, c] = POS[tl.i];
        const pic = tl.kind === 'place' ? EP.pic(tl.w) : tl.icon;
        tl.lmEl = u.el('div', { class: 'lm' });
        tl.el = u.el('div', { class: 'bd-tile ' + tl.kind, style: { gridRow: r + 1, gridColumn: c + 1, '--oc': tl.color || '#ffd43b' } },
          tl.kind === 'place' ? u.el('div', { class: 'band', style: { background: tl.color } }) : null,
          pic ? u.el('div', { class: 'e' }, pic) : null,
          u.el('div', { class: 'n', style: { '--f': Math.min(1, 7 / Math.max(...(tl.kind === 'place' ? tl.w.word : tl.name).split(' ').map((x) => x.length))) } }, tl.kind === 'place' ? tl.w.word : tl.name), tl.lmEl);
        board.appendChild(tl.el);
      });
      const coinEl = u.el('b', {}, '0'), lmEl = u.el('b', {}, '0');
      const coinChip = u.el('span', { class: 'chip light' }, '🪙 ', coinEl);
      const mkDie = () => { const cells = Array.from({ length: 9 }, () => u.el('i')); const el = u.el('div', { class: 'bd-die' }, cells); return { el, set(n) { cells.forEach((x, i) => x.classList.toggle('on', PIPS[n].includes(i))); } }; };
      const dice = [mkDie(), mkDie()]; dice[0].set(5); dice[1].set(2);
      const rollBtn = u.el('button', { class: 'btn primary bd-roll ready', onclick: () => roll() }, '🎲 Roll 擲骰子');
      const info = u.el('div', { class: 'bd-info' }, 'Roll the dice! 擲骰子出發');
      board.appendChild(u.el('div', { class: 'bd-center' },
        u.el('div', { class: 'bd-title' }, '🦁 Lion City Dash'),
        u.el('div', { class: 'bd-sky' }, u.el('i'), u.el('i'), u.el('i'), u.el('b'), u.el('span', {}, '🎡')),
        u.el('div', { class: 'bd-stats' }, coinChip, u.el('span', { class: 'chip light' }, '🏠 ', lmEl)),
        u.el('div', { class: 'bd-dice' }, dice.map((d) => d.el)), rollBtn, info));
      const token = u.el('div', { class: 'bd-token' }, u.el('span', {}, (EP.me && EP.me.avatar) || '🐼'));
      board.appendChild(token);
      root.appendChild(u.el('div', { class: 'bd-wrap' }, board));

      const remaining = items.slice();
      let state = 'roll', pos = 0, coins = 0, shown = 0, asked = 0, built = 0, qn = 0, cur = null;

      function size() {
        const W = root.clientWidth || 390, H = root.clientHeight || 700;
        let bw, bh;
        if (W > H * 1.02) { bw = bh = Math.min(H, W) - 12; } else { bw = W - 10; bh = Math.min(H - 10, bw * 1.62); }
        board.style.width = bw + 'px'; board.style.height = bh + 'px';
        const tw = bw / 5, th = bh / 5, m = Math.min(tw, th);
        const S = (k, v) => board.style.setProperty(k, v);
        S('--te', (m * 0.4) + 'px'); S('--tn', u.clamp(tw * 0.15, 11, 20) + 'px'); S('--tk', (m * 0.52) + 'px');
        S('--dk', u.clamp(m * 0.62, 42, 84) + 'px'); S('--ct', u.clamp(tw * 0.26, 16, 32) + 'px'); S('--cs', u.clamp(tw * 0.17, 13, 20) + 'px'); S('--cb', u.clamp(tw * 0.22, 16, 26) + 'px');
        placeToken(pos, false);
      }
      function placeToken(i, hop) {
        const el = tiles[i].el;
        token.style.left = (el.offsetLeft + el.offsetWidth / 2) + 'px'; token.style.top = (el.offsetTop + el.offsetHeight / 2) + 'px';
        if (hop) { token.classList.remove('hop'); void token.offsetWidth; token.classList.add('hop'); }
      }
      const stagePos = (el) => { const a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 }; };
      function addCoins(n, fromEl, label) {
        coins += n;
        const a = { x: fromEl.offsetLeft + fromEl.offsetWidth / 2, y: fromEl.offsetTop + fromEl.offsetHeight / 2 };
        const tgt = stagePos(coinChip), bp = stagePos(board), bo = { x: tgt.x - bp.x + board.offsetWidth / 2, y: tgt.y - bp.y + board.offsetHeight / 2 };
        for (let k = 0; k < Math.min(8, 2 + n / 60); k++) {
          const cn = u.el('div', { class: 'bd-coin', style: { left: a.x + u.rand(-16, 16) + 'px', top: a.y + u.rand(-16, 16) + 'px' } }, '🪙');
          board.appendChild(cn);
          ctx.timeout(() => { cn.style.left = bo.x + 'px'; cn.style.top = bo.y + 'px'; cn.style.opacity = '0.3'; }, 40 + k * 70);
          ctx.timeout(() => { cn.remove(); EP.sfx.coin(); }, 640 + k * 70);
        }
        if (label) { const p = stagePos(fromEl); ctx.float(p.x, p.y - 20, label, 'good'); }
      }
      function ready() { state = 'roll'; rollBtn.disabled = false; rollBtn.classList.add('ready'); }

      async function roll() {
        if (state !== 'roll') return;
        state = 'rolling'; rollBtn.disabled = true; rollBtn.classList.remove('ready'); EP.sfx.click();
        const a = u.randInt(1, 6), b = u.randInt(1, 6);
        dice.forEach((d) => d.el.classList.add('rolling'));
        for (let f = 0; f < 9; f++) { dice[0].set(u.randInt(1, 6)); dice[1].set(u.randInt(1, 6)); EP.sfx.tick(); await ctx.wait(65); }
        dice[0].set(a); dice[1].set(b); dice.forEach((d) => d.el.classList.remove('rolling')); EP.sfx.pop();
        const steps = a + b;
        info.textContent = `🎲 ${a} + ${b} = ${steps}` + (a === b ? ' · DOUBLES! 🎉' : '');
        if (a === b) addCoins(100, rollBtn, 'Doubles! +100');
        await ctx.wait(300);
        state = 'moving';
        for (let s = 1; s <= steps; s++) {
          tiles[pos].el.classList.remove('step');
          pos = (pos + 1) % 16; placeToken(pos, true); tiles[pos].el.classList.add('step'); EP.sfx.jump();
          await ctx.wait(200);
          if (pos === 0 && s < steps) addCoins(200, tiles[0].el, 'Passed GO! +200');
        }
        ctx.timeout(() => tiles[pos].el.classList.remove('step'), 400);
        await ctx.wait(220);
        land();
      }
      function land() {
        const tl = tiles[pos];
        if (tl.kind === 'go') { addCoins(300, tl.el, 'GO! +300 🪙'); EP.sfx.chest(); return ready(); }
        if (tl.kind === 'rest') { addCoins(50, tl.el, '☕ Kopi break! +50'); return ready(); }
        ask(tl);
      }

      function qType(item) {
        const types = diff === 'easy' ? ['listen', 'see'] : diff === 'hard' ? ['listen', 'spell', 'meaning', 'see'] : ['listen', 'see', 'spell', 'meaning'];
        let t = types[qn++ % types.length];
        const letters = EP.spellKey(item).replace(/[^A-Za-z]/g, '').length;
        if (t === 'spell' && (letters < 2 || (diff !== 'hard' && letters > 8))) t = 'listen';
        return t;
      }
      function ask(tl) {
        let ri = remaining.findIndex((w) => w !== tl.w); if (ri < 0) ri = 0; // never quiz the word printed on the tile you stand on
        const item = remaining.splice(ri, 1)[0]; asked++;
        state = 'q'; const bonus = tl.kind === 'chance';
        const type = qType(item);
        const n = diff === 'easy' ? 3 : 4;
        const opts = u.shuffle([item].concat(ctx.distractors(item, n - 1)));
        const head = u.el('div', { class: 'bd-qh' }, bonus ? '🎁 Chance! Bonus question · 機會題 x2 🪙' : '🏗️ Answer to build on this tile! 答對就在這格蓋地標');
        const sayBtn = (big) => u.el('button', { class: 'btn blue ' + (big ? 'big' : 'small'), style: big ? {} : { minHeight: '56px', minWidth: '56px', fontSize: '1.4rem' }, onclick: () => ctx.say(item) }, big ? '🔊 Listen 再聽一次' : '🔊');
        const panel = u.el('div', { class: 'bd-qp' }, head);
        const pic = diff === 'hard' ? '' : EP.pic(item);
        let answered = false;
        const doneQ = async (ok) => {
          if (answered) return; answered = true; cur = null;
          const p = stagePos(panel);
          ctx.answer(item, ok, { x: p.x, y: p.y - 40, points: bonus ? 150 : 100 });
          ctx.hud.progress(asked / items.length);
          if (ok) {
            await ctx.wait(650); q.remove();
            if (tl.kind === 'place') {
              tl.lvl = Math.min(3, tl.lvl + 1); built++; lmEl.textContent = built;
              tl.lmEl.textContent = LM[tl.lvl]; tl.lmEl.classList.remove('pop'); void tl.lmEl.offsetWidth; tl.lmEl.classList.add('pop');
              tl.el.classList.add('owned'); EP.sfx.stamp();
              addCoins(100 * tl.lvl, tl.el, tl.lvl === 1 ? '🏠 Built! +100' : tl.lvl === 2 ? '🏨 Hotel! +200' : '🏰 Landmark! +300');
            } else { addCoins(250, tl.el, '🎁 Bonus +250'); EP.sfx.chest(); }
          } else {
            await ctx.wait(500); await ctx.reveal(item); q.remove();
          }
          await ctx.wait(500);
          if (asked >= items.length) finish(); else ready();
        };
        if (type === 'spell') {
          panel.append(u.el('div', { class: 'bd-qh' }, 'Spell it! 拼拼看', sayBtn(false)), pic ? u.el('div', { class: 'qpic' }, pic) : u.el('div', { class: 'zhbig zh' }, item.zh));
          const sp = ctx.kit.speller(ctx, item, (ok, mistakes) => doneQ(mistakes <= (diff === 'hard' ? 0 : 1)));
          panel.append(sp);
          cur = {
            right() { fillSpeller(sp, item, 0); }, wrong() { fillSpeller(sp, item, 2); },
          };
        } else {
          if (type === 'listen') panel.append(u.el('div', { class: 'bd-qh' }, '👂 Which place do you hear? 你聽到哪個字？'), sayBtn(true));
          else if (type === 'see') panel.append(u.el('div', { class: 'bd-qh' }, 'Which word is it? 這是哪個字？', sayBtn(false)), pic ? u.el('div', { class: 'qpic' }, pic) : u.el('div', { class: 'zhbig zh' }, item.zh));
          else panel.append(u.el('div', { class: 'bd-qh' }, 'What does it mean? 這是什麼意思？', sayBtn(false)), u.el('div', { class: 'word' }, item.word));
          const grid = ctx.kit.choiceGrid(opts.map((w) => type === 'meaning' ? { label: w.zh, zh: true } : { label: w.word }), (k) => { grid.lock(); grid.mark(opts.indexOf(item), k); doneQ(opts[k] === item); });
          panel.append(grid.el);
          const right = opts.indexOf(item);
          cur = { right() { grid.btns[right].click(); }, wrong() { grid.btns[(right + 1) % opts.length].click(); } };
        }
        const q = u.el('div', { class: 'bd-q' }, panel);
        root.appendChild(q);
        if (type !== 'see') ctx.timeout(() => ctx.say(item), 350);
      }
      function fillSpeller(sp, item, wrongTaps) {
        const letters = EP.spellKey(item).replace(/ /g, '').split('');
        const slots = Array.from(sp.querySelectorAll('.slot:not(.space)')); let p = slots.filter((s) => s.textContent).length;
        const tilesEl = () => Array.from(sp.querySelectorAll('.letter-tile:not(.used)'));
        for (let k = 0; k < wrongTaps && p < letters.length; k++) { const bad = tilesEl().find((x) => x.textContent.toLowerCase() !== letters[p].toLowerCase()); if (bad) bad.click(); }
        for (; p < letters.length; p++) { const ok = tilesEl().find((x) => x.textContent.toLowerCase() === letters[p].toLowerCase()); if (!ok) break; ok.click(); }
      }
      function finish() {
        if (state === 'done') return;
        state = 'done'; ctx.hud.progress(1); EP.sfx.win(); if (built > 0) ctx.confetti();
        root.appendChild(u.el('div', { class: 'bd-end' }, u.el('div', { class: 'panel', style: { textAlign: 'center', animation: 'bdIn .3s both' } },
          u.el('div', { style: { fontSize: '3rem' } }, '🏆'), u.el('h2', { style: { margin: '4px 0' } }, 'Board Dash complete! 完成！'),
          u.el('div', { style: { fontSize: '1.4rem', fontWeight: 900 } }, `🏠 ${built} landmarks · 🪙 ${coins} coins`))));
        ctx.timeout(() => ctx.end(), 2200);
      }

      ctx.loop((dt) => {
        if (shown !== coins) { shown = shown < coins ? Math.min(coins, shown + Math.max(1, Math.ceil((coins - shown) * dt * 4))) : coins; coinEl.textContent = shown.toLocaleString(); }
      });
      ctx.on(window, 'resize', () => size());
      size(); ctx.timeout(size, 50);
      return {
        destroy() {},
        test: {
          correct() { if (state === 'roll') roll(); else if (state === 'q' && cur) cur.right(); },
          wrong() { if (state === 'roll') roll(); else if (state === 'q' && cur) cur.wrong(); },
        },
      };
    },
  });
})();
