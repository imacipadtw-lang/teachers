/* Level 8 — Gift Quest (inspired by Blooket "Gold Quest": answer, then open 1 of 3 chests with surprise rewards)
 * Santa's village in the snow. Answer a holiday question (listen→word, picture→word, word→Chinese).
 * Right → pick one of three gift boxes (+gold, ×2, +25%, swap with an elf, or rarely the reindeer eats some cookies).
 * Three elf bots collect gold too; live leaderboard and a final ranking. */
(function () {
  const EP = window.EP, u = EP.u;
  const GIFT_COL = [['#e03131', '#ff8787'], ['#2f9e44', '#8ce99a'], ['#1971c2', '#74c0fc']];
  const PRIZE = { gold: (r) => ['🪙', '+' + r.n], double: () => ['✨', '×2'], pct: () => ['📈', '+25%'], swap: () => ['🔄', 'Swap!'], reindeer: () => ['🦌', '−20%'] };

  EP.registerGame({
    id: 'chests', level: 8, icon: '🎁', title: 'Gift Quest', titleZh: '聖誕禮物大冒險',
    model: 'Blooket Gold Quest（答對開寶箱，金幣大逆轉）',
    howZh: '在聖誕老公公的村莊答題！答對可以從三個禮物盒選一個：金幣、加倍、交換金幣……也可能被麋鹿吃掉餅乾！和三個小精靈比誰的金幣最多。',
    howEn: 'Answer holiday questions. Right answers let you open 1 of 3 gifts: gold, ×2, swap with an elf… or the reindeer eats your cookies! Beat the elves!',
    skills: ['listening', 'reading', 'meaning'],
    start(ctx) {
      const root = ctx.root;
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      root.style.background = 'linear-gradient(#0b1b4d 0%, #1d3a8a 55%, #3d5fb8 100%)';
      root.appendChild(u.el('style', {}, `
        .gq-aur{position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 30% at 30% 12%,rgba(99,230,190,.28),transparent 70%),radial-gradient(50% 25% at 75% 8%,rgba(177,151,252,.25),transparent 70%)}
        .gq-snowl{position:absolute;inset:0;pointer-events:none;z-index:1}
        .gq-village{position:absolute;left:0;right:0;bottom:0;height:22%;pointer-events:none;z-index:0}
        .gq-ground{position:absolute;left:-10%;right:-10%;bottom:-30%;height:70%;background:#f1f6ff;border-radius:50% 50% 0 0;box-shadow:0 -6px 20px rgba(255,255,255,.4)}
        .gq-house{position:absolute;bottom:22%;font-size:clamp(2rem,6vw,3.4rem)}
        .gq-sleigh{position:absolute;top:9%;font-size:2.2rem;animation:gqFly 24s linear infinite;pointer-events:none;z-index:1;white-space:nowrap}
        @keyframes gqFly{from{left:-30%}to{left:110%}}
        .gq-main{position:absolute;inset:0;z-index:2;display:grid;grid-template-columns:1fr minmax(210px,250px);gap:12px;padding:12px}
        .gq-col{display:flex;flex-direction:column;align-items:center;gap:12px;min-height:0;color:#fff;justify-content:center}
        .gq-lb{align-self:start;background:rgba(255,255,255,.14);border-radius:20px;padding:10px;display:flex;flex-direction:column;gap:8px;color:#fff;border:2px solid rgba(255,255,255,.25)}
        .gq-lb h3{margin:2px 4px 2px;font-size:1.05rem}
        .gq-p{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.25);border-radius:14px;padding:6px 10px;font-weight:900;position:relative}
        .gq-p.me{background:linear-gradient(90deg,#f59f00,#e8590c);box-shadow:0 0 0 3px #fff}
        .gq-p .rk{width:26px;height:26px;border-radius:50%;background:#fff;color:#1d3a8a;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex:none}
        .gq-p .av{font-size:1.7rem;line-height:1}
        .gq-p .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:1rem}
        .gq-p .gd{font-size:1.15rem;white-space:nowrap}
        .gq-p .pop{position:absolute;right:6px;top:-14px;color:#b9ff9a;font-size:1rem;animation:floatUp 1.1s ease-out forwards;text-shadow:0 2px 0 rgba(0,0,0,.4)}
        .gq-p .pop.bad{color:#ffa8a8}
        .gq-q{font-size:clamp(1.15rem,3.8vw,1.5rem);font-weight:900;text-align:center;text-shadow:0 2px 0 rgba(0,0,0,.3)}
        .gq-big{font-size:clamp(4rem,14vw,6.5rem);line-height:1;filter:drop-shadow(0 6px 0 rgba(0,0,0,.25))}
        .gq-word{font-size:clamp(2.2rem,8vw,3.6rem);font-weight:900;text-shadow:0 4px 0 rgba(0,0,0,.3);text-align:center}
        .gq-gifts{display:flex;gap:clamp(10px,3vw,28px);justify-content:center;align-items:flex-end;flex-wrap:nowrap}
        .gq-gift{position:relative;width:clamp(96px,26vw,160px);height:clamp(110px,30vw,180px);animation:gqWob 1.4s ease-in-out infinite;border-radius:12px}
        .gq-gift:nth-child(2){animation-delay:.2s}.gq-gift:nth-child(3){animation-delay:.4s}
        @keyframes gqWob{0%,70%,100%{transform:none}78%{transform:rotate(-6deg)}86%{transform:rotate(6deg)}94%{transform:rotate(-3deg)}}
        .gq-gift .box{position:absolute;left:8%;right:8%;bottom:0;height:60%;border-radius:10px;background:var(--c);box-shadow:inset 0 -8px 0 rgba(0,0,0,.18),0 6px 0 rgba(0,0,0,.25)}
        .gq-gift .box::before{content:'';position:absolute;left:43%;width:14%;top:0;bottom:0;background:#ffd43b}
        .gq-gift .lid{position:absolute;left:2%;right:2%;top:24%;height:19%;border-radius:10px;background:var(--c2);box-shadow:0 4px 0 rgba(0,0,0,.2);transition:transform .55s cubic-bezier(.3,1.6,.5,1),opacity .55s;z-index:2}
        .gq-gift .lid::before{content:'';position:absolute;left:43%;width:14%;top:0;bottom:0;background:#ffd43b}
        .gq-gift .bow{position:absolute;left:50%;top:0;transform:translateX(-50%);font-size:clamp(2rem,7vw,2.8rem);transition:transform .55s,opacity .55s;z-index:3}
        .gq-gift .prize{position:absolute;left:-10%;right:-10%;top:0;bottom:36%;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(0) translateY(40%);transition:transform .5s cubic-bezier(.3,1.7,.5,1);z-index:4;font-weight:900;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.4)}
        .gq-gift .prize b{font-size:clamp(2.2rem,8vw,3.2rem);line-height:1}.gq-gift .prize span{font-size:clamp(1.3rem,4.5vw,1.8rem)}
        .gq-gift.open,.gq-gift.peek{animation:none}
        .gq-gift.open .lid{transform:translateY(-140%) rotate(-28deg);opacity:0}.gq-gift.open .bow{transform:translate(-50%,-160%) rotate(30deg);opacity:0}
        .gq-gift.open .prize,.gq-gift.peek .prize{transform:scale(1)}
        .gq-gift.peek{opacity:.5;filter:grayscale(.5)}.gq-gift.peek .lid,.gq-gift.peek .bow{opacity:0}
        .gq-msg{font-size:clamp(1.2rem,4vw,1.7rem);font-weight:900;text-align:center;background:rgba(0,0,0,.3);border-radius:16px;padding:8px 16px}
        .gq-swap{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        .gq-swap .btn{min-width:130px;flex-direction:column;gap:2px}
        .gq-rank{display:flex;flex-direction:column;gap:10px;width:min(560px,94%);}
        .gq-rank .gq-p{font-size:1.2rem;padding:10px 14px;animation:fadeIn .4s both}
        .gq-rank .gq-p .av{font-size:2.2rem}
        @media (max-width:760px){
          .gq-main{grid-template-columns:1fr;grid-template-rows:auto 1fr;padding:8px;gap:6px}
          .gq-lb{order:-1;flex-direction:row;padding:6px;gap:5px;justify-content:space-between;align-self:stretch}
          .gq-lb h3{display:none}
          .gq-lb .gq-p{flex:1;flex-direction:column;gap:0;padding:4px 2px;min-width:0}
          .gq-lb .gq-p .nm{display:none}.gq-lb .gq-p .rk{position:absolute;left:3px;top:3px;width:20px;height:20px;font-size:.8rem}
          .gq-lb .gq-p .av{font-size:1.5rem}.gq-lb .gq-p .gd{font-size:1rem}
        }`));
      // background: aurora, village, snowfall
      const snowLayer = u.el('div', { class: 'gq-snowl' });
      root.append(u.el('div', { class: 'gq-aur' }),
        u.el('div', { class: 'gq-village' }, u.el('div', { class: 'gq-ground' }),
          ...[['🏠', 4], ['🎄', 16], ['🏡', 74], ['🎄', 88], ['⛄', 62], ['🦌', 28]].map(([e, x]) => u.el('div', { class: 'gq-house', style: { left: x + '%' } }, e))),
        u.el('div', { class: 'gq-sleigh' }, '🦌🦌🛷🎅'), snowLayer);
      const c = ctx.kit.canvas(snowLayer); const g = c.g;
      const flakes = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: u.rand(1.2, 3.6), v: u.rand(0.03, 0.09), ph: Math.random() * 6 }));

      const col = u.el('div', { class: 'gq-col' });
      const lb = u.el('div', { class: 'gq-lb' }, u.el('h3', {}, '🏆 Gold 金幣榜'));
      const main = u.el('div', { class: 'gq-main' }, col, lb);
      root.appendChild(main);

      const players = [{ name: (EP.me && EP.me.name) || 'You', av: (EP.me && EP.me.avatar) || '🐼', me: true, skill: 1 },
        { name: 'Jingle', av: '🧝', skill: 0.72 }, { name: 'Twinkle', av: '🧝‍♀️', skill: 0.62 }, { name: 'Pip', av: '🧝‍♂️', skill: 0.52 }];
      if (hard) players.forEach((p) => { if (!p.me) p.skill += 0.12; });
      if (easy) players.forEach((p) => { if (!p.me) p.skill -= 0.1; });
      for (const p of players) {
        p.gold = 0; p.shown = 0;
        p.rk = u.el('span', { class: 'rk' }, '1'); p.gd = u.el('span', { class: 'gd' }, '🪙 0');
        p.el = u.el('div', { class: 'gq-p' + (p.me ? ' me' : '') }, p.rk, u.el('span', { class: 'av' }, p.av), u.el('span', { class: 'nm' }, p.name), p.gd);
        lb.appendChild(p.el);
      }
      const me = players[0];

      function pop(p, text, bad) { const e = u.el('span', { class: 'pop' + (bad ? ' bad' : '') }, text); p.el.appendChild(e); ctx.timeout(() => e.remove(), 1100); }
      function setGold(p, v, label) { const d = Math.round(v) - p.gold; p.gold = Math.max(0, Math.round(v)); if (label !== false) pop(p, label || (d >= 0 ? '+' + d : String(d)), d < 0); }
      function rank() {
        const before = new Map(players.map((p) => [p, p.el.getBoundingClientRect()]));
        const sorted = players.slice().sort((a, b) => b.gold - a.gold || (a.me ? -1 : 1));
        sorted.forEach((p, i) => { lb.appendChild(p.el); p.rk.textContent = i + 1; });
        for (const p of players) {
          const a = before.get(p), b = p.el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
          if ((dx || dy) && p.el.animate) p.el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
        }
        return sorted;
      }
      function roll(gold, canSwap) {
        const r = Math.random();
        if (r < 0.05 && gold >= 40) return { t: 'reindeer' };
        if (r < 0.14 && gold >= 30) return { t: 'double' };
        if (r < 0.26 && gold >= 30) return { t: 'pct' };
        if (r < 0.34 && canSwap) return { t: 'swap' };
        return { t: 'gold', n: u.pick([10, 15, 20, 25, 30, 40, 50, 60, 75, 100]) };
      }
      function botsTurn() {
        for (const b of players) {
          if (b.me || Math.random() > b.skill) continue;
          const r = roll(b.gold, false); // elves never swap away your gold
          if (r.t === 'gold') setGold(b, b.gold + r.n);
          else if (r.t === 'double') setGold(b, b.gold * 2, '×2');
          else if (r.t === 'pct') setGold(b, b.gold * 1.25, '+25%');
          else setGold(b, b.gold * 0.8, '🦌 −20%');
        }
        rank();
      }

      /* ---------- questions ---------- */
      const queue = ctx.items.slice(), requeued = new Set();
      let qi = 0, phase = 'idle', cur = null;
      const TYPES = hard ? ['listen', 'zh'] : ['listen', 'pic', 'zh'];
      function qtype(item, n) {
        const order = TYPES.slice(n % TYPES.length).concat(TYPES.slice(0, n % TYPES.length));
        return order.find((t) => t !== 'pic' || EP.pic(item)) || 'listen';
      }
      function ask() {
        if (qi >= queue.length) return finale();
        ctx.hud.progress(qi / queue.length);
        const item = queue[qi], type = qtype(item, qi);
        const opts = u.shuffle([item].concat(ctx.distractors(item, easy ? 2 : 3)));
        col.innerHTML = '';
        const sayBtn = (big) => u.el('button', { class: big ? 'btn blue big' : 'btn blue small', onclick: () => ctx.say(item) }, big ? '🔊 Listen 聽一聽' : '🔊');
        let q, prompt;
        if (type === 'listen') { q = '🔊 Which word do you hear? 你聽到哪個？'; prompt = sayBtn(true); }
        else if (type === 'pic') { q = '🎁 What is this? 這是什麼？'; prompt = u.el('div', { class: 'row', style: { justifyContent: 'center' } }, u.el('div', { class: 'gq-big' }, EP.pic(item)), sayBtn(false)); }
        else { q = '📜 What does it mean? 這是什麼意思？'; prompt = u.el('div', { class: 'row', style: { justifyContent: 'center' } }, u.el('div', { class: 'gq-word' }, item.word), sayBtn(false)); }
        const grid = ctx.kit.choiceGrid(opts.map((w) => (type === 'zh' ? { label: w.zh, zh: true } : { label: w.word })), (k) => choose(k));
        col.append(u.el('div', { class: 'chip' }, `🎄 ${qi + 1} / ${queue.length}`), u.el('div', { class: 'gq-q' }, q), prompt, grid.el);
        cur = { item, opts, grid, right: opts.indexOf(item) };
        phase = 'question';
        ctx.timeout(() => ctx.say(item), 300);
      }
      function choose(k) {
        if (phase !== 'question') return;
        phase = 'answered';
        const { item, grid, right } = cur, ok = k === right;
        grid.lock(); grid.mark(right, k);
        const b = grid.btns[k].getBoundingClientRect(), rr = root.getBoundingClientRect();
        ctx.answer(item, ok, { x: b.left - rr.left + b.width / 2, y: b.top - rr.top, label: ok ? null : '✗' });
        if (ok) ctx.timeout(() => gifts(), 650);
        else (async () => {
          await ctx.wait(500);
          await ctx.reveal(item);
          if (!requeued.has(item.id)) { requeued.add(item.id); queue.push(item); }
          col.innerHTML = ''; col.appendChild(u.el('div', { class: 'gq-msg' }, '❄️ No gift this time… 這次沒有禮物'));
          botsTurn(); ctx.timeout(next, 1100);
        })();
      }
      function next() { qi++; ask(); }

      /* ---------- gifts ---------- */
      function gifts() {
        phase = 'gift';
        const canSwap = players.some((p) => !p.me && p.gold > me.gold);
        const rewards = [0, 1, 2].map(() => roll(me.gold, canSwap));
        col.innerHTML = '';
        const row = u.el('div', { class: 'gq-gifts' });
        const boxes = rewards.map((rw, i) => {
          const [ic, tx] = PRIZE[rw.t](rw);
          const b = u.el('button', { class: 'gq-gift', style: { '--c': GIFT_COL[i][0], '--c2': GIFT_COL[i][1] }, onclick: () => openGift(i) },
            u.el('div', { class: 'box' }), u.el('div', { class: 'lid' }), u.el('div', { class: 'bow' }, '🎀'),
            u.el('div', { class: 'prize' }, u.el('b', {}, ic), u.el('span', {}, tx)));
          b.style.setProperty('--c', GIFT_COL[i][0]); b.style.setProperty('--c2', GIFT_COL[i][1]);
          row.appendChild(b); return b;
        });
        col.append(u.el('div', { class: 'gq-q', style: { fontSize: 'clamp(1.5rem,5vw,2.2rem)' } }, '✔ Correct! Pick a gift!', u.el('div', { class: 'zh', style: { fontSize: '.7em' } }, '答對了！選一個禮物 🎁')), row);
        cur.gifts = { rewards, boxes };
        EP.sfx.chest();
      }
      function openGift(i) {
        if (phase !== 'gift') return; phase = 'opening';
        const { rewards, boxes } = cur.gifts, rw = rewards[i];
        boxes[i].classList.add('open'); EP.sfx.pop(); ctx.timeout(() => EP.sfx.chest(), 150);
        ctx.timeout(() => boxes.forEach((b, j) => { if (j !== i) b.classList.add('peek'); }), 700);
        let msg;
        if (rw.t === 'gold') { setGold(me, me.gold + rw.n); msg = `🪙 +${rw.n} gold!`; EP.sfx.coin(); }
        else if (rw.t === 'double') { setGold(me, Math.max(me.gold * 2, me.gold + 20), '×2'); msg = '✨ Double gold! 金幣加倍！'; EP.sfx.coin(); }
        else if (rw.t === 'pct') { setGold(me, Math.max(me.gold * 1.25, me.gold + 10), '+25%'); msg = '📈 +25% gold!'; EP.sfx.coin(); }
        else if (rw.t === 'reindeer') { setGold(me, me.gold * 0.8, '🦌 −20%'); msg = '🦌 The reindeer ate 20% of your cookies! 麋鹿吃掉你 20% 的餅乾！'; EP.sfx.lose(); }
        else return ctx.timeout(swapPick, 800);
        rank();
        col.appendChild(u.el('div', { class: 'gq-msg' }, msg));
        ctx.timeout(() => { botsTurn(); ctx.timeout(next, 900); }, 1200);
      }
      function swapPick() {
        phase = 'swap';
        const btns = players.filter((p) => !p.me).map((p) => u.el('button', { class: 'btn primary', onclick: () => doSwap(p) }, u.el('span', { style: { fontSize: '2rem' } }, p.av), `${p.name} 🪙${p.gold}`));
        col.append(u.el('div', { class: 'gq-msg' }, `🔄 Swap gold with an elf! 和小精靈交換金幣（你有 🪙${me.gold}）`),
          u.el('div', { class: 'gq-swap' }, ...btns, u.el('button', { class: 'btn ghost', onclick: () => doSwap(null) }, 'Keep mine 不換')));
        cur.swap = true;
      }
      function doSwap(p) {
        if (phase !== 'swap') return; phase = 'opening';
        if (p) { const a = me.gold, b = p.gold; setGold(me, b); setGold(p, a); EP.sfx.whoosh(); }
        rank(); ctx.timeout(() => { botsTurn(); ctx.timeout(next, 900); }, 900);
      }

      /* ---------- final ranking ---------- */
      function finale() {
        phase = 'done'; ctx.hud.progress(1);
        const sorted = rank(), place = sorted.indexOf(me) + 1;
        col.innerHTML = '';
        col.append(u.el('h2', { style: { margin: 0, fontSize: 'clamp(1.6rem,5vw,2.4rem)', textShadow: '0 3px 0 rgba(0,0,0,.3)' } }, '🎅 Santa\'s Gold Ranking 金幣排行'),
          u.el('div', { class: 'gq-rank' }, sorted.map((p, i) => {
            const e = u.el('div', { class: 'gq-p' + (p.me ? ' me' : ''), style: { animationDelay: (sorted.length - i) * 0.25 + 's' } },
              u.el('span', { class: 'rk' }, i + 1), u.el('span', { class: 'av' }, ['🥇', '🥈', '🥉', '🎄'][i] + p.av), u.el('span', { class: 'nm' }, p.name), u.el('span', { class: 'gd' }, '🪙 ' + p.gold));
            return e;
          })),
          u.el('div', { class: 'gq-msg' }, place === 1 ? '🏆 You are #1! 你是第一名！' : `You are #${place}! 你是第 ${place} 名，下次再挑戰！`));
        EP.sfx.win(); ctx.confetti();
        ctx.timeout(() => ctx.end(), 4200);
      }

      ctx.loop((dt, now) => {
        const W = c.w, H = c.h; g.clearRect(0, 0, W, H); g.fillStyle = '#fff';
        for (const f of flakes) {
          f.y += f.v * dt; f.x += Math.sin(now * 0.8 + f.ph) * 0.0006; if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
          g.globalAlpha = 0.55 + f.r / 9; g.beginPath(); g.arc(f.x * W, f.y * H, f.r, 0, 7); g.fill();
        }
        g.globalAlpha = 1;
        for (const p of players) { if (p.shown !== p.gold) { const d = p.gold - p.shown; p.shown = Math.abs(d) < 1 ? p.gold : p.shown + d * Math.min(1, dt * 6); p.gd.textContent = '🪙 ' + Math.round(p.shown); } }
      });

      rank(); ask();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() {
            if (phase === 'question') choose(cur.right);
            else if (phase === 'gift') openGift(u.randInt(0, 2));
            else if (phase === 'swap') doSwap(players.filter((p) => !p.me).sort((a, b) => b.gold - a.gold)[0]);
          },
          wrong() {
            if (phase === 'question') choose((cur.right + 1) % cur.opts.length);
            else if (phase === 'gift') openGift(0);
            else if (phase === 'swap') doSwap(null);
          },
        },
      };
    },
  });
})();
