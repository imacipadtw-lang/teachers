/* Level 13 — Gold Souk Word Shop (inspired by Gimkit Classic: answer to earn money, spend it on upgrades & power-ups)
 * Multiple-choice questions (listen / picture / Chinese / meaning / sentence gap) earn cash. The Shop sells upgrades with
 * rising prices (Money per Question, Streak Bonus, Multiplier) and power-ups (remove 2 wrong answers, x2 for 3 questions).
 * Wrong items come back later in the round; the round ends when every item was answered correctly once (max 2 repeats). */
(function () {
  const EP = window.EP, u = EP.u;
  const UP = [
    { key: 'mpq', icon: '💵', name: 'Money per Question', zh: '每題獎金', vals: [10, 20, 50, 100, 250, 500, 1000], prices: [0, 40, 150, 400, 1000, 2500, 6000], fmt: (v) => '$' + v },
    { key: 'streak', icon: '🔥', name: 'Streak Bonus', zh: '連勝加成', vals: [0, 5, 15, 40, 100, 250, 600], prices: [0, 30, 120, 350, 900, 2200, 5000], fmt: (v) => '+$' + v + ' / 🔥' },
    { key: 'mult', icon: '✨', name: 'Multiplier', zh: '倍數', vals: [1, 1.5, 2, 3, 5, 8, 12], prices: [0, 100, 300, 800, 2000, 5000, 12000], fmt: (v) => 'x' + v },
  ];
  const PW = [
    { key: 'fifty', icon: '🧹', name: 'Remove 2 wrong', zh: '刪去兩個錯誤選項', base: 25 },
    { key: 'x2', icon: '⚡', name: 'x2 for 3 questions', zh: '接下來3題雙倍', base: 50 },
  ];
  const CSS = `
  .gk-bgdeco{position:absolute;left:0;right:0;top:0;height:46px;background:radial-gradient(circle at 50% 100%,transparent 22px,#7a4300 23px) 0 0/56px 46px;opacity:.55;pointer-events:none}
  .gk-wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 10px 14px;color:#fff;overflow:auto}
  .gk-bar{width:min(900px,100%);display:flex;align-items:center;gap:8px;flex-wrap:wrap;z-index:1}
  .gk-money{display:flex;align-items:center;gap:4px;background:linear-gradient(180deg,#fff3bf,#ffd43b);color:#5c3a00;border-radius:16px;padding:2px 14px;font-weight:900;font-size:clamp(1.5rem,6vw,2.3rem);box-shadow:0 5px 0 #b07d00;min-width:130px}
  .gk-money.bump{animation:gkBump .35s}
  .gk-shopbtn{margin-left:auto}
  .gk-shopbtn.pulse{animation:gkPulse 1s infinite}
  .gk-pw{min-height:48px!important}
  .gk-q{width:min(900px,100%);background:#fffaf0;color:#1d2340;border-radius:22px;padding:10px 16px;text-align:center;box-shadow:0 6px 0 rgba(0,0,0,.2);display:flex;flex-direction:column;align-items:center;gap:6px;border:4px solid #f0b429;animation:gkIn .25s both}
  .gk-q .lab{font-weight:800;color:#8a5a00;font-size:clamp(1rem,3.4vw,1.25rem)}
  .gk-q .qpic{font-size:clamp(3.2rem,13vw,5rem);line-height:1}
  .gk-q .word{font-size:clamp(2.2rem,9vw,3.4rem);font-weight:900;line-height:1.1}
  .gk-q .zhp{font-size:clamp(2rem,8vw,3rem);font-weight:900}
  .gk-q .sent{font-size:clamp(1.3rem,4.6vw,2rem);font-weight:800;line-height:1.3}
  .gk-q .gap{display:inline-block;min-width:3.2em;border-bottom:4px solid #f0b429;margin:0 4px}
  .gk-q .say{width:56px;height:56px;border-radius:50%;background:#47b8ff;color:#fff;font-size:1.6rem;box-shadow:0 4px 0 rgba(0,0,0,.2)}
  .gk-wrap .choice.gone{visibility:hidden}
  .gk-fb{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20;border-radius:26px;padding:16px 28px;text-align:center;font-weight:900;color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.4);animation:gkIn .25s both;min-width:260px;max-width:92%}
  .gk-fb.ok{background:linear-gradient(180deg,#51cf66,#2b8a3e)}.gk-fb.no{background:linear-gradient(180deg,#ff8787,#c92a2a)}
  .gk-fb .amt{font-size:clamp(2.6rem,10vw,4.2rem);line-height:1.1}.gk-fb .sub{font-size:1.2rem;font-weight:800;opacity:.95}
  .gk-coin{position:absolute;z-index:22;font-size:28px;transition:left .6s ease-in,top .6s ease-in,opacity .6s;pointer-events:none;transform:translate(-50%,-50%)}
  .gk-shop{position:absolute;inset:0;z-index:25;background:rgba(40,20,0,.72);display:flex;align-items:center;justify-content:center;padding:8px}
  .gk-sp{width:min(900px,100%);max-height:100%;overflow:auto;background:linear-gradient(160deg,#6b3d00,#2b1600);border:4px solid #f0b429;border-radius:24px;padding:12px;color:#fff;animation:gkIn .25s both}
  .gk-sp h3{margin:2px 0 8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:clamp(1.15rem,4vw,1.5rem)}
  .gk-sp h4{margin:10px 0 6px;color:#ffd43b;font-size:1.1rem}
  .gk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:10px}
  .gk-card{background:linear-gradient(180deg,#fffaf0,#ffe8a3);color:#3b2400;border-radius:18px;padding:8px 10px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:center;box-shadow:0 5px 0 #b07d00}
  .gk-card .ic{font-size:2.2rem;grid-row:span 3}.gk-card b{font-size:1.1rem}.gk-card small{font-size:.95rem;color:#7a5a20}
  .gk-card .lv{display:flex;gap:3px;grid-column:1/-1}.gk-card .lv i{flex:1;height:8px;border-radius:4px;background:#e6d39a}.gk-card .lv i.on{background:#f08c00}
  .gk-card .val{font-weight:800}
  .gk-card .btn{grid-column:1/-1;min-height:52px}
  .gk-card.flash{animation:gkBump .4s}
  .gk-end{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(40,20,0,.55)}
  @keyframes gkBump{50%{transform:scale(1.12)}}
  @keyframes gkPulse{50%{transform:scale(1.08);box-shadow:0 0 0 8px rgba(255,212,59,.35)}}
  @keyframes gkIn{from{transform:scale(.85);opacity:0}}`;

  EP.registerGame({
    id: 'shop', level: 13, icon: '💰', title: 'Gold Souk Word Shop', titleZh: '杜拜黃金市集',
    model: 'Gimkit Classic（答題賺錢、商店升級、道具）',
    howZh: '答對題目賺金幣，到商店買升級（每題獎金、連勝加成、倍數）和道具！答錯的字等一下會再出現。',
    howEn: 'Answer to earn money, then buy upgrades and power-ups in the Shop. Missed words come back later!',
    skills: ['listening', 'meaning', 'reading', 'sentence'],
    start(ctx) {
      const root = ctx.root, diff = ctx.difficulty, items = ctx.items;
      root.style.background = 'radial-gradient(circle at 50% -10%,#ffe8a3 0,#f0b429 32%,#a8660b 72%,#5c3300 100%)';
      root.appendChild(u.el('style', {}, CSS));
      root.appendChild(u.el('div', { class: 'gk-bgdeco' }));
      const lvl = { mpq: 0, streak: 0, mult: 0 }; const pwPrice = { fifty: PW[0].base, x2: PW[1].base };
      let money = 0, shown = 0, earned = 0, streak = 0, fifty = 0, x2Left = 0, state = 'q', cur = null, qn = 0, doneN = 0;
      const queue = u.shuffle(items).map((it) => ({ it, tries: 0 }));

      const moneyEl = u.el('span', {}, '0');
      const moneyPill = u.el('div', { class: 'gk-money' }, '🪙 $', moneyEl);
      const streakChip = u.el('span', { class: 'chip' }, '🔥 0');
      const fiftyBtn = u.el('button', { class: 'btn small purple gk-pw hidden', onclick: () => useFifty() }, '🧹 x0');
      const x2Chip = u.el('span', { class: 'chip hidden' }, '');
      const shopBtn = u.el('button', { class: 'btn primary gk-shopbtn', onclick: () => openShop() }, '🛒 Shop 商店');
      const qBox = u.el('div', { class: 'gk-q' });
      const choicesBox = u.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      const wrap = u.el('div', { class: 'gk-wrap' }, u.el('div', { class: 'gk-bar' }, moneyPill, streakChip, fiftyBtn, x2Chip, shopBtn), u.el('div', { style: { flex: '1 1 0' } }), qBox, choicesBox, u.el('div', { style: { flex: '1.4 1 0' } }));
      root.appendChild(wrap);

      const val = (k) => UP.find((x) => x.key === k).vals[lvl[k]];
      const nextPrice = (up) => (lvl[up.key] + 1 < up.vals.length ? up.prices[lvl[up.key] + 1] : null);
      function refreshBar() {
        streakChip.textContent = `🔥 ${streak}`;
        fiftyBtn.textContent = `🧹 Use x${fifty}`; fiftyBtn.classList.toggle('hidden', fifty <= 0);
        x2Chip.textContent = `⚡ x2 · ${x2Left}`; x2Chip.classList.toggle('hidden', x2Left <= 0);
        const canBuy = UP.some((up) => nextPrice(up) != null && nextPrice(up) <= money) || PW.some((p) => pwPrice[p.key] <= money);
        shopBtn.classList.toggle('pulse', canBuy);
      }
      const stagePos = (el) => { const a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 }; };
      function coinRain(from, n) {
        const to = stagePos(moneyPill);
        for (let k = 0; k < n; k++) {
          const cn = u.el('div', { class: 'gk-coin', style: { left: from.x + u.rand(-50, 50) + 'px', top: from.y + u.rand(-30, 30) + 'px' } }, '🪙');
          root.appendChild(cn);
          ctx.timeout(() => { cn.style.left = to.x + 'px'; cn.style.top = to.y + 'px'; cn.style.opacity = '0.4'; }, 60 + k * 60);
          ctx.timeout(() => { cn.remove(); EP.sfx.coin(); moneyPill.classList.remove('bump'); void moneyPill.offsetWidth; moneyPill.classList.add('bump'); }, 680 + k * 60);
        }
      }

      /* ---------- questions ---------- */
      const TYPES = diff === 'easy' ? ['listen', 'pic', 'meaning'] : diff === 'hard' ? ['listen', 'zh', 'cloze', 'meaning'] : ['listen', 'pic', 'zh', 'meaning', 'cloze'];
      function qtype(item) {
        const n = qn++;
        for (let k = 0; k < TYPES.length; k++) {
          const t = TYPES[(n + k) % TYPES.length];
          if (t === 'pic' && !EP.pic(item)) continue;
          if (t === 'cloze' && !EP.cloze(item)) continue;
          return t;
        }
        return 'listen';
      }
      function next() {
        ctx.hud.progress(doneN / items.length);
        if (!queue.length) return finish();
        cur = queue.shift(); ask(cur);
      }
      function ask(entry) {
        if (state !== 'shop') state = 'q';
        const item = entry.it, type = qtype(item);
        const n = diff === 'easy' ? 3 : 4;
        const opts = u.shuffle([item].concat(ctx.distractors(item, n - 1)));
        const sayBtn = u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: () => sayPrompt() }, '🔊');
        const again = entry.tries ? u.el('span', { class: 'chip', style: { background: '#e8590c' } }, '🔁 Try again 再挑戰') : null;
        let body;
        if (type === 'listen') body = [u.el('div', { class: 'lab' }, '👂 Which word do you hear? 你聽到哪個字？'), u.el('button', { class: 'btn blue big', onclick: () => ctx.say(item) }, '🔊 Listen 再聽一次')];
        else if (type === 'pic') body = [u.el('div', { class: 'lab' }, 'What is this? 這是哪個字？'), u.el('div', { class: 'row', style: { justifyContent: 'center' } }, u.el('div', { class: 'qpic' }, EP.pic(item)), sayBtn)];
        else if (type === 'zh') body = [u.el('div', { class: 'lab' }, 'Which English word? 哪個是這個意思？'), u.el('div', { class: 'row', style: { justifyContent: 'center' } }, u.el('div', { class: 'zhp zh' }, item.zh), sayBtn)];
        else if (type === 'meaning') body = [u.el('div', { class: 'lab' }, 'What does it mean? 這是什麼意思？'), u.el('div', { class: 'row', style: { justifyContent: 'center' } }, u.el('div', { class: 'word' }, item.word), sayBtn)];
        else {
          const cz = EP.cloze(item), s = item.sentence;
          body = [u.el('div', { class: 'lab' }, 'Fill in the blank 填入正確的字'), u.el('div', { class: 'sent' }, s.slice(0, cz.start), u.el('span', { class: 'gap' }, ' '), s.slice(cz.start + cz.text.length)),
            u.el('div', { class: 'row', style: { justifyContent: 'center' } }, u.el('div', { class: 'zh', style: { color: '#4a5275', fontSize: '1.1rem' } }, item.sentenceZh), sayBtn)];
        }
        qBox.innerHTML = ''; qBox.style.animation = 'none'; void qBox.offsetWidth; qBox.style.animation = '';
        qBox.append(...(again ? [again] : []), ...body);
        const grid = ctx.kit.choiceGrid(opts.map((w) => type === 'meaning' ? { label: w.zh, zh: true } : { label: w.word }), (k) => choose(k));
        choicesBox.innerHTML = ''; choicesBox.appendChild(grid.el);
        const right = opts.indexOf(item);
        cur = Object.assign(entry, { item, opts, grid, right, type, answered: false });
        function sayPrompt() {
          if (type === 'cloze') { const cz = EP.cloze(item); ctx.sayText(item.sentence.slice(0, cz.start) + ' ... ' + item.sentence.slice(cz.start + cz.text.length)); }
          else ctx.say(item);
        }
        if (type === 'listen' || type === 'meaning') ctx.timeout(() => ctx.say(item), 300);
        refreshBar();
      }
      function useFifty() {
        if (state !== 'q' || !cur || fifty <= 0 || cur.used50) return;
        const wrongs = u.shuffle(cur.opts.map((_, i) => i).filter((i) => i !== cur.right)).slice(0, Math.min(2, cur.opts.length - 2));
        wrongs.forEach((i) => cur.grid.btns[i].classList.add('gone'));
        fifty--; cur.used50 = true; EP.sfx.whoosh(); refreshBar();
      }
      function choose(k) {
        if (state !== 'q' || !cur || cur.answered) return;
        cur.answered = true; state = 'fb'; cur.grid.lock(); cur.grid.mark(cur.right, k);
        const ok = k === cur.right, entry = cur, item = cur.item;
        entry.tries++;
        const at = stagePos(cur.grid.btns[k]);
        ctx.answer(item, ok, { x: at.x, y: at.y - 30 });
        if (ok) {
          streak++; doneN++;
          const gain = Math.round((val('mpq') + val('streak') * Math.min(streak, 10)) * val('mult') * (x2Left > 0 ? 2 : 1));
          if (x2Left > 0) x2Left--;
          money += gain; earned += gain;
          const fb = u.el('div', { class: 'gk-fb ok' }, u.el('div', { class: 'amt' }, `+$${gain.toLocaleString()}`), u.el('div', { class: 'sub' }, '✔ Correct! 答對了' + (streak >= 2 ? `  🔥 ${streak}` : '')));
          root.appendChild(fb); coinRain(stagePos(fb), Math.min(8, 3 + Math.floor(gain / 40)));
          refreshBar();
          ctx.timeout(() => { fb.remove(); next(); }, 1100);
        } else {
          streak = 0;
          if (entry.tries < 3) queue.splice(Math.min(queue.length, u.randInt(2, 3)), 0, entry); else doneN++;
          const fb = u.el('div', { class: 'gk-fb no' }, u.el('div', { class: 'amt', style: { fontSize: 'clamp(1.8rem,7vw,2.6rem)' } }, '✘ ' + item.word), u.el('div', { class: 'sub zh' }, `= ${item.zh}` + (entry.tries < 3 ? '  · 等一下會再出現 🔁' : '')));
          root.appendChild(fb); refreshBar();
          ctx.timeout(async () => { fb.remove(); await ctx.reveal(item); next(); }, 900);
        }
      }

      /* ---------- shop ---------- */
      let shopEl = null;
      function openShop() {
        if (state === 'shop' || state === 'done') return;
        const prev = state; state = 'shop'; EP.sfx.click();
        const moneyTag = u.el('span', { class: 'gk-money', style: { fontSize: '1.5rem', minWidth: 0 } }, '🪙 $' + money.toLocaleString());
        const head = u.el('h3', {}, '🛒 Gold Souk Shop 黃金市集', moneyTag);
        const body = u.el('div');
        const render = () => {
          moneyTag.textContent = '🪙 $' + money.toLocaleString();
          body.innerHTML = '';
          body.append(u.el('h4', {}, '⬆️ Upgrades 升級'), u.el('div', { class: 'gk-grid' }, UP.map((up) => {
            const p = nextPrice(up), L = lvl[up.key];
            const card = u.el('div', { class: 'gk-card' }, u.el('div', { class: 'ic' }, up.icon), u.el('b', {}, up.name), u.el('small', { class: 'zh' }, up.zh),
              u.el('div', { class: 'val' }, p == null ? `${up.fmt(up.vals[L])} · MAX` : `${up.fmt(up.vals[L])} → ${up.fmt(up.vals[L + 1])}`),
              u.el('div', { class: 'lv' }, up.vals.map((_, i) => u.el('i', { class: i <= L ? 'on' : '' }))),
              u.el('button', { class: 'btn ' + (p != null && p <= money ? 'go' : ''), disabled: p == null || p > money, onclick: () => buyUp(up, card) }, p == null ? 'MAX ⭐' : `Buy 購買 $${p.toLocaleString()}`));
            return card;
          })), u.el('h4', {}, '🎁 Power-ups 道具'), u.el('div', { class: 'gk-grid' }, PW.map((pw) => {
            const p = pwPrice[pw.key];
            const card = u.el('div', { class: 'gk-card' }, u.el('div', { class: 'ic' }, pw.icon), u.el('b', {}, pw.name), u.el('small', { class: 'zh' }, pw.zh),
              u.el('div', { class: 'val' }, pw.key === 'fifty' ? `Owned 擁有: ${fifty}` : x2Left ? `Active 啟動中: ${x2Left}` : 'Ready 準備好'),
              u.el('button', { class: 'btn ' + (p <= money ? 'purple' : ''), disabled: p > money, onclick: () => buyPw(pw, card) }, `Buy 購買 $${p.toLocaleString()}`));
            return card;
          })));
        };
        function pay(n) { money -= n; EP.sfx.chest(); ctx.float(root.clientWidth / 2, root.clientHeight * 0.2, `-$${n.toLocaleString()}`, 'bad'); }
        function buyUp(up, card) { const p = nextPrice(up); if (p == null || p > money) return; pay(p); lvl[up.key]++; render(); refreshBar(); }
        function buyPw(pw, card) { const p = pwPrice[pw.key]; if (p > money) return; pay(p); if (pw.key === 'fifty') fifty++; else x2Left += 3; pwPrice[pw.key] = Math.round(p * 1.6); render(); refreshBar(); }
        render();
        // resume whatever the current question needs: it may have advanced while the shop was open
        const close = () => { if (!shopEl) return; shopEl.remove(); shopEl = null; state = cur && !cur.answered ? 'q' : 'fb'; refreshBar(); EP.sfx.click(); };
        head.appendChild(u.el('button', { class: 'btn go small', style: { marginLeft: 'auto', minHeight: '52px' }, onclick: close }, '▶ Back 返回'));
        shopEl = u.el('div', { class: 'gk-shop' }, u.el('div', { class: 'gk-sp' }, head, body,
          u.el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } }, u.el('button', { class: 'btn go big', onclick: close }, '▶ Back to questions 回到題目'))));
        root.appendChild(shopEl);
      }

      function finish() {
        if (state === 'done') return;
        state = 'done'; ctx.hud.progress(1); EP.sfx.win(); ctx.confetti();
        const bonus = Math.min(200, Math.round(earned / 50)); if (bonus) ctx.addScore(bonus);
        root.appendChild(u.el('div', { class: 'gk-end' }, u.el('div', { class: 'panel', style: { textAlign: 'center', animation: 'gkIn .3s both', border: '4px solid #f0b429' } },
          u.el('div', { style: { fontSize: '3rem' } }, '💰'), u.el('h2', { style: { margin: '4px 0' } }, `You earned $${earned.toLocaleString()}!`),
          u.el('div', { class: 'zh', style: { fontSize: '1.2rem' } }, `總共賺了 $${earned.toLocaleString()}` + (bonus ? ` · ⭐ +${bonus}` : '')),
          u.el('div', { style: { marginTop: '6px', fontWeight: 800 } }, UP.map((up) => `${up.icon} Lv${lvl[up.key] + 1}`).join('  ')))));
        ctx.timeout(() => ctx.end(), 2600);
      }

      ctx.loop((dt) => {
        if (shown !== money) { const d = money - shown; shown = Math.abs(d) < 1 ? money : shown + Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) * Math.min(1, dt * 5))); moneyEl.textContent = Math.round(shown).toLocaleString(); }
      });
      next();
      return {
        destroy() {},
        test: {
          correct() { if (shopEl) { shopEl.querySelector('.btn.go.big').click(); return; } if (state === 'q' && cur && !cur.answered) choose(cur.right); },
          wrong() { if (shopEl) { shopEl.querySelector('.btn.go.big').click(); return; } if (state === 'q' && cur && !cur.answered) choose((cur.right + 1) % cur.opts.length); },
        },
      };
    },
  });
})();
