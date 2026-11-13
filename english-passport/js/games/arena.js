/* Level 25 — Home Arena, the finale (inspired by Clash Royale: elixir, a hand of 4 cards, two lanes, towers and crowns)
 * Played at the student's own school in Taiwan. Hear the prompt (+ Chinese), then play the matching English card
 * (tap it or drag it onto the arena). Your cute troop marches over a bridge and soaks the rival tower with water balloons
 * and confetti (non-violent). A wrong card lets the rival's troop splash your tower. Crowns 1–3, then fireworks:
 * the whole English Passport World Tour is complete! One ctx.answer per card played. */
(function () {
  const EP = window.EP, u = EP.u;
  const TROOPS = ['🐻', '🐼', '🐸', '🦄', '🐧', '🐯', '🐨', '🦊', '🐙', '🦖', '🐰', '🐵', '🐶', '🐱', '🦁', '🐮', '🐹', '🐲'];
  const CSS = `
  .ca{position:absolute;inset:0;pointer-events:none;z-index:5}
  .ca>*{pointer-events:auto}
  .ca-top{position:absolute;display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap;justify-content:center;background:linear-gradient(#ffffff,#e7f0ff);color:#1d2340;border-radius:20px;padding:8px 14px;box-shadow:0 6px 0 rgba(0,0,0,.2);border:3px solid #ffd43b}
  .ca.port .ca-top{left:50%;top:8px;transform:translateX(-50%);width:max-content;max-width:calc(100% - 16px)}
  .ca.land .ca-top{left:12px;top:50%;transform:translateY(-50%);width:var(--side);flex-direction:column;padding:14px}
  .ca-q{font-weight:900;font-size:1rem;color:#5c6bc0;width:100%;text-align:center}
  .ca-say{width:58px;height:58px;border-radius:50%;background:#7048e8;color:#fff;font-size:1.6rem;box-shadow:0 4px 0 #4c2ab5;flex:none}
  .ca-pic{font-size:2.8rem;line-height:1}.ca-zh{font-size:1.7rem;font-weight:900;font-family:var(--font-zh)}
  .ca-score{display:flex;gap:10px;font-weight:900;font-size:1.05rem;align-items:center;justify-content:center;width:100%}
  .ca-score span{padding:2px 10px;border-radius:999px;color:#fff}.ca-score .me{background:#1c7ed6}.ca-score .op{background:#e03131}
  .ca.port .ca-score{display:none}
  .ca-hand{position:absolute;display:flex;flex-direction:column;gap:6px;align-items:center;background:linear-gradient(rgba(20,26,70,.0),rgba(20,26,70,.75) 25%);padding:10px 8px 10px}
  .ca.port .ca-hand{left:0;right:0;bottom:0}
  .ca.land .ca-hand{right:12px;top:50%;transform:translateY(-50%);width:var(--side);background:rgba(20,26,70,.75);border-radius:20px;padding:12px}
  .ca-cards{display:grid;gap:8px;grid-template-columns:repeat(4,var(--cw))}
  .ca.land .ca-cards{grid-template-columns:repeat(2,var(--cw))}
  .ca-card{position:relative;width:var(--cw);height:var(--ch);border-radius:12px;border:3px solid #c5d0e6;background:#1f2a4d;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 5px 0 rgba(0,0,0,.35);touch-action:none;padding:0;transition:transform .12s,filter .2s;animation:caIn .35s backwards}
  .ca-card.r3{border-color:#ffa94d}.ca-card.r4{border-color:#b197fc}
  .ca-card .art{flex:1;display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.36);background:radial-gradient(circle at 50% 40%,#74c0fc,#1c7ed6);min-height:0}
  .ca-card.r3 .art{background:radial-gradient(circle at 50% 40%,#ffd8a8,#f76707)}.ca-card.r4 .art{background:radial-gradient(circle at 50% 40%,#e5dbff,#7048e8)}
  .ca-card .txt{color:#fff;font-weight:900;font-size:var(--fs);line-height:1.08;padding:5px 4px 6px;text-align:center;text-shadow:0 2px 0 rgba(0,0,0,.45);overflow-wrap:normal;word-break:keep-all}
  .ca-card .txt.long{font-size:calc(var(--fs)*.78)}.ca-card .txt.xlong{font-size:calc(var(--fs)*.62)}
  .ca-card .cost{position:absolute;left:3px;top:3px;width:30px;height:34px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 40% 35%,#f3a6ff,#be4bdb 55%,#862e9c);color:#fff;font-weight:900;font-size:1.15rem;display:flex;align-items:center;justify-content:center;text-shadow:0 2px 0 rgba(0,0,0,.4);border:2px solid #fff}
  .ca-card.dim{filter:grayscale(.75) brightness(.75)}
  .ca-card.dim .cost{background:#868e96}
  .ca-card.glow{outline:5px solid #ffd43b;animation:caGlow .6s infinite alternate}
  .ca-card.lift{transform:translateY(-10px) scale(1.05)}
  .ca-card.no{animation:shake .35s}
  .ca-card.gone{visibility:hidden}
  @keyframes caIn{from{transform:translateY(60px) scale(.7);opacity:0}}
  @keyframes caGlow{to{box-shadow:0 0 22px #ffd43b}}
  .ca-ghost{position:absolute;z-index:40;pointer-events:none;transform:translate(-50%,-50%) scale(.8);opacity:.85}
  .ca-elix{display:flex;align-items:center;gap:6px;width:100%;max-width:560px}
  .ca-elix .d{width:36px;height:40px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 40% 35%,#f3a6ff,#be4bdb 55%,#862e9c);color:#fff;font-weight:900;font-size:1.3rem;display:flex;align-items:center;justify-content:center;border:2px solid #fff;flex:none}
  .ca-elix .bar{flex:1;height:22px;border-radius:8px;background:#2b2d42;border:2px solid #000;overflow:hidden;position:relative}
  .ca-elix .bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#f3a6ff,#be4bdb);border-radius:6px}
  .ca-elix .bar b{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 2px),rgba(0,0,0,.55) calc(10% - 2px) 10%)}
  .ca-next{display:flex;align-items:center;gap:6px;color:#fff;font-weight:900;font-size:.95rem}
  .ca-next .ca-card{--cw:66px;--ch:82px;--fs:11px;animation:none;pointer-events:none}.ca-next .ca-card .cost{width:20px;height:23px;font-size:.8rem}
  .ca.port .ca-next{display:none}
  .ca.narrow .ca-card{flex-direction:row}.ca.narrow .ca-card .art{flex:0 0 34%;font-size:calc(var(--ch)*.42)}.ca.narrow .ca-card .txt{flex:1;display:flex;align-items:center;justify-content:center;padding:4px 6px}
  .ca.port.narrow .ca-cards{grid-template-columns:repeat(2,var(--cw))}
  .ca-vic{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:6%;gap:8px;pointer-events:none;text-align:center}
  .ca-vic .t{font-size:clamp(3rem,12vw,5.6rem);font-weight:900;color:#ffd43b;text-shadow:0 6px 0 #c25e00,0 0 34px rgba(255,212,59,.8);animation:caVic .9s ease-out backwards;line-height:1}
  @keyframes caVic{0%{transform:scale(.2) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:none}}
  .ca-crowns{display:flex;gap:10px;font-size:clamp(2.6rem,10vw,4.4rem)}
  .ca-crowns span{animation:caCrown .5s backwards}.ca-crowns span.off{filter:grayscale(1) brightness(.6);opacity:.6}
  @keyframes caCrown{0%{transform:scale(3) rotate(-30deg);opacity:0}100%{transform:none}}
  .ca-vic .p{background:rgba(255,255,255,.95);color:#1d2340;border-radius:20px;padding:12px 18px;font-weight:900;font-size:1.25rem;box-shadow:0 8px 30px rgba(0,0,0,.35);animation:fadeIn .5s 1.4s backwards;max-width:92%}
  .ca-vic .p small{display:block;font-size:1rem;color:#4a5275;margin-top:4px}`;

  EP.registerGame({
    id: 'arena', level: 25, icon: '🏫', title: 'Home Arena', titleZh: '主場對決',
    model: 'Clash Royale 皇室戰爭（聖水、四張手牌、兩條路線、皇冠）',
    howZh: '聽英文、看中文，打出正確的英文卡牌（點一下或拖到場上）！你的小兵會過橋用水球和彩帶淋濕對手的塔。拿下皇冠，完成整本英語護照！',
    howEn: 'Listen, then play the matching English card. Your troop soaks the rival towers with water balloons. Win the crowns!',
    skills: ['listening', 'meaning', 'reading'],
    start(ctx) {
      const root = ctx.root, D = ctx.difficulty;
      root.style.background = '#7cc4ff';
      root.appendChild(u.el('style', {}, CSS));
      let ready = false;
      const c = ctx.kit.canvas(root, () => ready && layout()); const g = c.g; const parts = ctx.kit.particles();
      const ui = u.el('div', { class: 'ca port' }); root.appendChild(ui);
      const top = u.el('div', { class: 'ca-top' }); const handWrap = u.el('div', { class: 'ca-hand' }); ui.append(top, handWrap);
      const cardsEl = u.el('div', { class: 'ca-cards' }); const nextEl = u.el('div', { class: 'ca-next' });
      const elixEl = u.el('div', { class: 'ca-elix' }); const elNum = u.el('div', { class: 'd' }, '5'); const elFill = u.el('i');
      elixEl.append(elNum, u.el('div', { class: 'bar' }, elFill, u.el('b')));
      handWrap.append(cardsEl, u.el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', width: '100%', justifyContent: 'center' } }, nextEl, elixEl));
      const LV = (EP.levels || []).find((l) => l.level === 25) || {};
      const school = LV.cityZh || '我的學校';

      const items = ctx.items, n = items.length;
      const REGEN = D === 'easy' ? 0.55 : D === 'hard' ? 0.95 : 0.75;
      let idx = 0, item = null, phase = 'busy', elixir = 6, crowns = 0, t = 0, land = false, A = { x: 0, y: 0, w: 100, h: 100 };
      let hand = [null, null, null, null], queued = null, drag = null, vic = false;
      const troops = [], balls = [], rockets = [];
      const pHP = Math.max(1, Math.round(n * 0.3)), kHP = Math.max(1, n - 2 * pHP - Math.floor(n * 0.1));
      const mk = (x, y, king, side, who) => ({ x, y, king, side, who, hp: king ? kHP : pHP, max: king ? kHP : pHP, pend: king ? kHP : pHP, dead: false, shake: 0 });
      const op = [mk(0.25, 0.28, false, 'op', '🐧'), mk(0.75, 0.28, false, 'op', '🐧'), mk(0.5, 0.155, true, 'op', '🦉')];
      const me = [mk(0.25, 0.75, false, 'me', '🧒'), mk(0.75, 0.75, false, 'me', '👧'), mk(0.5, 0.885, true, 'me', EP.me.avatar || '🐼')];
      me.forEach((tw) => { tw.hp = tw.max = tw.pend = 10; });
      const costOf = (w) => { const k = w.word.trim().split(/\s+/).length; return k <= 1 ? 2 : k <= 3 ? 3 : 4; };

      function layout() {
        const W = c.w, H = c.h; land = W > H * 1.1;
        ui.classList.toggle('land', land); ui.classList.toggle('port', !land);
        let cw, ch, side = 0;
        if (land) { side = u.clamp(W * 0.27, 210, 360); cw = Math.floor((side - 32) / 2); ch = Math.min(Math.floor(cw * 1.25), Math.floor((H - 150) / 2)); }
        else if (W < 600) { cw = Math.floor((W - 28) / 2); ch = Math.floor(u.clamp(H * 0.11, 84, 104)); }
        else { cw = Math.floor(u.clamp((W - 40) / 4, 74, 140)); ch = Math.floor(u.clamp(cw * 1.5, 118, 176)); }
        ui.classList.toggle('narrow', !land && W < 600);
        ui.style.setProperty('--side', side + 'px'); ui.style.setProperty('--cw', cw + 'px'); ui.style.setProperty('--ch', ch + 'px'); ui.style.setProperty('--fs', (cw < 110 ? 18 : 21) + 'px');
        const R = root.getBoundingClientRect(), tb = top.getBoundingClientRect(), hb = handWrap.getBoundingClientRect();
        if (land) { const aw = Math.min((H - 16) * 0.74, W - 2 * side - 40); A = { x: (W - aw) / 2, y: 8, w: aw, h: H - 16 }; }
        else { const y0 = tb.bottom - R.top + 6, y1 = hb.top - R.top + 4; let w = W - 12; const h = Math.max(120, y1 - y0); if (w > h * 0.86) w = h * 0.86; A = { x: (W - w) / 2, y: y0, w, h }; }
      }
      const P = (fx, fy) => ({ x: A.x + fx * A.w, y: A.y + fy * A.h });

      // ---------- cards ----------
      const valid = (w) => w.id !== item.id && w.zh !== item.zh && u.norm(w.word) !== u.norm(item.word);
      const inHand = (w) => hand.some((cd) => cd && cd.w.id === w.id);
      function makeCard(w, slot) {
        const cost = costOf(w), troop = TROOPS[w.id % TROOPS.length];
        const el = u.el('button', { class: 'ca-card r' + cost, style: { animationDelay: slot * 0.05 + 's' } }, u.el('div', { class: 'cost' }, cost), u.el('div', { class: 'art' }, troop), u.el('div', { class: 'txt' + (Math.max(...w.word.split(/\s+/).map((x) => x.length)) >= 9 ? ' xlong' : Math.max(...w.word.split(/\s+/).map((x) => x.length)) >= 7 ? ' long' : '') }, w.word));
        const cd = { w, cost, troop, el, slot };
        ctx.on(el, 'pointerdown', (e) => { if (phase !== 'play') return; e.preventDefault(); drag = { cd, x0: e.clientX, y0: e.clientY, moved: false, ghost: null }; el.classList.add('lift'); });
        return cd;
      }
      ctx.on(window, 'pointermove', (e) => {
        if (!drag) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 14) { drag.moved = true; drag.ghost = drag.cd.el.cloneNode(true); drag.ghost.classList.add('ca-ghost'); drag.ghost.classList.remove('lift'); root.appendChild(drag.ghost); }
        if (drag.ghost) { const R = root.getBoundingClientRect(); drag.gx = e.clientX - R.left; drag.gy = e.clientY - R.top; drag.ghost.style.left = drag.gx + 'px'; drag.ghost.style.top = drag.gy + 'px'; }
      });
      ctx.on(window, 'pointerup', () => {
        if (!drag) return; const d = drag; drag = null; d.cd.el.classList.remove('lift'); d.ghost && d.ghost.remove();
        if (!d.moved) return play(d.cd, null);
        const inA = d.gx > A.x && d.gx < A.x + A.w && d.gy > A.y && d.gy < A.y + A.h;
        if (inA) play(d.cd, d.gx < A.x + A.w / 2 ? 0 : 1);
      });
      function deal() {
        hand = hand.map((cd) => (cd && (cd.w.id === item.id || valid(cd.w)) ? cd : null));
        const empty = () => hand.map((cd, i) => (cd ? -1 : i)).filter((i) => i >= 0);
        if (!inHand(item)) { const e = empty(); const s = e.length ? u.pick(e) : u.randInt(0, 3); hand[s] = makeCard(item, s); }
        const fill = [queued].concat(ctx.distractors(item, 8, {})).filter((w) => w && valid(w) && !inHand(w));
        for (const s of empty()) { const w = fill.shift() || u.pick(ctx.pool.filter((x) => valid(x) && !inHand(x))); hand[s] = makeCard(w, s); }
        cardsEl.innerHTML = ''; hand.forEach((cd) => { cd.el.classList.remove('glow', 'gone', 'lift'); cardsEl.appendChild(cd.el); });
        const nx = items[idx + 1]; queued = nx && !inHand(nx) ? nx : u.pick(ctx.pool.filter((x) => !inHand(x) && x.id !== item.id));
        nextEl.innerHTML = ''; if (queued) { const p = makeCard(queued, 0); nextEl.append('Next', p.el); }
        updateElixir(true);
      }
      let lastWhole = -1;
      function updateElixir(force) {
        elFill.style.width = elixir * 10 + '%'; const whole = Math.floor(elixir);
        if (whole !== lastWhole || force) { lastWhole = whole; elNum.textContent = whole; hand.forEach((cd) => cd && cd.el.classList.toggle('dim', cd.cost > elixir)); }
      }

      // ---------- prompts ----------
      function setup() {
        if (idx >= n) return finale();
        item = items[idx]; ctx.hud.progress(idx / n);
        top.innerHTML = ''; const pic = EP.pic(item);
        top.append(...[u.el('div', { class: 'ca-q' }, 'Which card? 出哪張牌？'), u.el('button', { class: 'ca-say', title: 'Listen 再聽一次', onclick: () => ctx.say(item) }, '🔊'),
          pic && D !== 'hard' ? u.el('div', { class: 'ca-pic' }, pic) : null,
          D !== 'hard' ? u.el('div', { class: 'ca-zh' }, item.zh) : u.el('div', { class: 'ca-zh' }, '👂 Listen!'),
          u.el('div', { class: 'ca-score' }, u.el('span', { class: 'me' }, `👑 ${crowns}`), 'vs', u.el('span', { class: 'op' }, '🦉 隔壁班 Rival'))].filter(Boolean));
        deal(); layout(); phase = 'play';
        ctx.timeout(() => ctx.say(item), 300);
      }
      function laneFor(lane) {
        const alive = [0, 1].filter((l) => op[l].pend > 0);
        if (lane == null) lane = alive.length ? alive.sort((a, b) => op[a].pend - op[b].pend)[0] : u.randInt(0, 1);
        let target = op[lane].pend > 0 ? op[lane] : op[2].pend > 0 ? op[2] : null;
        return { lane, target };
      }
      async function play(cd, lane) {
        if (phase !== 'play' || ctx.paused) return;
        if (cd.cost > elixir) { cd.el.classList.remove('no'); void cd.el.offsetWidth; cd.el.classList.add('no'); const R = root.getBoundingClientRect(), r = cd.el.getBoundingClientRect(); ctx.float(r.left - R.left + r.width / 2, r.top - R.top, `💧 ${cd.cost}`, 'bad'); EP.sfx.click(); return; }
        elixir -= cd.cost; updateElixir(true); cd.el.classList.add('gone');
        const ok = cd.w.id === item.id; const L = laneFor(lane);
        const sp = P(L.lane ? 0.75 : 0.25, 0.66);
        hand[cd.slot] = null; phase = 'resolve';
        if (ok) {
          ctx.answer(item, true, { x: sp.x, y: sp.y - 30, points: 100 + cd.cost * 10 });
          if (L.target) L.target.pend--;
          spawn('me', L.lane, cd.troop, L.target);
          EP.sfx.jump(); ctx.say(item);
          if (ctx.combo >= 3 && ctx.combo % 3 === 0) ctx.burst(`⚡ ${ctx.combo} in a row! 連勝`);
          idx++; ctx.timeout(setup, 1300);
        } else {
          ctx.answer(item, false, { x: sp.x, y: sp.y - 30, label: `✗ ${cd.w.word}` });
          spawn('op', L.lane, '🐻‍❄️', me[L.lane]);
          const right = hand.find((h) => h && h.w.id === item.id); right && right.el.classList.add('glow');
          await ctx.reveal(item);
          idx++; setup();
        }
      }
      function spawn(side, lane, emoji, target) {
        const lx = lane ? 0.75 : 0.25;
        const path = side === 'me' ? [{ x: lx, y: 0.66 }, { x: lx, y: 0.5 }] : [{ x: lx, y: 0.34 }, { x: lx, y: 0.5 }];
        if (target) path.push({ x: target.x + (target.king ? (lx - 0.5) * 0.25 : 0), y: target.y + (side === 'me' ? 0.11 : -0.11) });
        else path.push({ x: lx, y: 0.3 });
        troops.push({ side, emoji, x: path[0].x, y: path[0].y, path, wi: 1, target, st: 'walk', tt: 0, ph: Math.random() * 6 });
        parts.burst(P(path[0].x, path[0].y).x, P(path[0].x, path[0].y).y, side === 'me' ? '#74c0fc' : '#ff8787', 14, 160);
      }
      function hitTower(tw, side) {
        const p = P(tw.x, tw.y); tw.shake = 0.35;
        parts.burst(p.x, p.y, '#4dabf7', 16, 260); parts.burst(p.x, p.y, null, 14, 220); EP.sfx.slice();
        if (side === 'op') { tw.hp = Math.max(1, tw.hp - 2); ctx.float(p.x, p.y - 20, '💦 Splash!', 'bad'); return; }
        if (tw.dead) return;
        tw.hp--; ctx.float(p.x, p.y - 30, '💦', 'good');
        if (tw.hp <= 0) knock(tw);
      }
      function knock(tw) {
        if (tw.dead) return; tw.dead = true; tw.hp = 0; tw.pend = 0; crowns++;
        const p = P(tw.x, tw.y); parts.burst(p.x, p.y, null, 50, 380); EP.sfx.boom(); ctx.timeout(() => EP.sfx.stamp(), 200);
        ctx.burst(tw.king ? '👑👑👑 KING TOWER! 國王塔！' : '👑 Crown! 拿下皇冠！'); ctx.confetti();
        if (tw.king) op.forEach((o) => { if (!o.dead) { o.dead = true; o.hp = 0; o.pend = 0; crowns++; } });
        crowns = Math.min(3, crowns);
        const sc = top.querySelector('.ca-score .me'); if (sc) sc.textContent = `👑 ${crowns}`;
      }

      // ---------- finale ----------
      function finale() {
        phase = 'finale'; ctx.hud.progress(1); cardsEl.innerHTML = ''; nextEl.innerHTML = '';
        top.innerHTML = ''; top.append(u.el('div', { class: 'ca-zh' }, '⏱️ Final whistle! 比賽結束！'));
        const wait = () => (troops.length || balls.length ? ctx.timeout(wait, 300) : overtime());
        wait();
      }
      function overtime() {
        if (crowns > 0) return victory();
        ctx.toast('⚡ Overtime! Everyone charge! 延長賽，全員出動！');
        const tw = op[0].hp <= op[1].hp ? op[0] : op[1]; const lane = tw === op[0] ? 0 : 1;
        tw.hp = 1; tw.pend = 1;
        ['🐻', '🐼', '🦄', '🐸', '🐯'].forEach((e, i) => ctx.timeout(() => spawn('me', lane, e, i === 0 ? tw : null), i * 220));
        const wait = () => (crowns > 0 && !troops.length ? victory() : ctx.timeout(wait, 300));
        ctx.timeout(wait, 900);
      }
      function victory() {
        if (vic) return; vic = true; phase = 'victory';
        handWrap.style.display = 'none'; top.style.display = 'none';
        const cr = u.el('div', { class: 'ca-crowns' }); for (let i = 0; i < 3; i++) cr.appendChild(u.el('span', { class: i < crowns ? '' : 'off', style: { animationDelay: 0.6 + i * 0.35 + 's' } }, '👑'));
        root.appendChild(u.el('div', { class: 'ca-vic' }, u.el('div', { class: 't' }, 'Victory!'), cr,
          u.el('div', { class: 'p' }, '🎓 English Passport complete! 英語護照環遊世界完成！', u.el('small', {}, `🏫 Welcome home to ${school}! 歡迎回家！ · 25 / 25 ✈️`))));
        EP.sfx.win(); ctx.confetti();
        for (let i = 0; i < 3; i++) if (i < crowns) ctx.timeout(() => EP.sfx.stamp(), 600 + i * 350);
        ctx.timeout(() => ctx.confetti(), 2200);
        ctx.timeout(() => ctx.end(), 6500);
      }

      // ---------- drawing ----------
      function drawTower(tw) {
        const p = P(tw.x, tw.y); const s = Math.min(A.w * (tw.king ? 0.18 : 0.14), A.h * (tw.king ? 0.12 : 0.1)); const sx = tw.shake > 0 ? Math.sin(t * 60) * 4 : 0;
        const x = p.x + sx, y = p.y; const col = tw.side === 'me' ? '#339af0' : '#f03e3e';
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y + s * 0.5, s * 0.6, s * 0.18, 0, 0, 6.3); g.fill();
        if (tw.dead) {
          g.fillStyle = '#adb5bd'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + (k - 2.5) * s * 0.16, y + s * 0.35 - (k % 2) * s * 0.1, s * 0.12, 0, 6.3); g.fill(); }
          ctx.kit.emoji(g, '🏳️', x, y + s * 0.05, s * 0.5); return;
        }
        g.fillStyle = '#ced4da'; g.fillRect(x - s * 0.45, y - s * 0.3, s * 0.9, s * 0.8);
        g.fillStyle = '#adb5bd'; for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) g.fillRect(x - s * 0.45 + ((k + (r % 2) * 0.5) % 3) * s * 0.3 + 2, y - s * 0.25 + r * s * 0.19, s * 0.26, s * 0.03);
        g.fillStyle = col; g.fillRect(x - s * 0.5, y - s * 0.38, s, s * 0.14);
        for (let k = 0; k < 4; k++) g.fillRect(x - s * 0.5 + k * s * 0.3, y - s * 0.5, s * 0.16, s * 0.14);
        ctx.kit.emoji(g, tw.who, x, y - s * 0.62 + Math.sin(t * 3 + tw.x * 9) * 2, s * 0.55);
        if (tw.king) { ctx.kit.emoji(g, '👑', x, y - s * 1.0, s * 0.3); }
        const bw = s * 0.95, by = y - s * (tw.king ? 1.25 : 1.0);
        g.fillStyle = 'rgba(0,0,0,.55)'; ctx.kit.roundRect(g, x - bw / 2 - 2, by - 2, bw + 4, 12, 5); g.fill();
        g.fillStyle = tw.side === 'me' ? '#4dabf7' : '#ff6b6b'; ctx.kit.roundRect(g, x - bw / 2, by, Math.max(4, (bw * tw.hp) / tw.max), 8, 4); g.fill();
      }
      function drawArena() {
        const W = c.w, H = c.h;
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#8fd3ff'); bg.addColorStop(0.5, '#c3f0ff'); bg.addColorStop(0.51, '#8ccf62'); bg.addColorStop(1, '#6fb84a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
        if (land) { ctx.kit.emoji(g, '🏫', A.x - 70, H * 0.42, 90); ctx.kit.emoji(g, '🌳', A.x - 40, H * 0.8, 70); ctx.kit.emoji(g, '🌳', A.x + A.w + 40, H * 0.82, 70); ctx.kit.emoji(g, '🏮', A.x + A.w + 30, H * 0.3, 44); ctx.kit.emoji(g, '🧋', A.x - 30, H * 0.62, 40); }
        g.fillStyle = 'rgba(0,0,0,.25)'; ctx.kit.roundRect(g, A.x - 4, A.y + 2, A.w + 8, A.h + 6, 18); g.fill();
        g.fillStyle = '#c0573e'; ctx.kit.roundRect(g, A.x - 5, A.y - 5, A.w + 10, A.h + 10, 18); g.fill();
        g.save(); ctx.kit.roundRect(g, A.x, A.y, A.w, A.h, 14); g.clip();
        const rows = 14; for (let r = 0; r < rows; r++) { g.fillStyle = r % 2 ? '#9ed36a' : '#8fca5c'; g.fillRect(A.x, A.y + (r * A.h) / rows, A.w, A.h / rows + 1); }
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(A.x + A.w / 2, A.y + A.h / 2, A.w * 0.16, 0, 6.3); g.stroke();
        if (drag && drag.moved) { g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(A.x, A.y + A.h * 0.55, A.w, A.h * 0.45); const side = drag.gx < A.x + A.w / 2 ? 0 : 1; g.fillStyle = 'rgba(77,171,247,.3)'; g.fillRect(A.x + side * A.w / 2, A.y + A.h * 0.55, A.w / 2, A.h * 0.45); }
        const ry = A.y + A.h * 0.5, rh = A.h * 0.07;
        g.fillStyle = '#4dabf7'; g.fillRect(A.x, ry - rh / 2, A.w, rh);
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const xx = A.x + ((k / 8 + t * 0.05) % 1) * A.w; g.beginPath(); g.arc(xx, ry, rh * 0.25, 0.2, 2.9); g.stroke(); }
        for (const lx of [0.25, 0.75]) { const bx = A.x + lx * A.w, bw = A.w * 0.13; g.fillStyle = '#a0682f'; g.fillRect(bx - bw / 2, ry - rh * 0.75, bw, rh * 1.5); g.fillStyle = '#7a4a1c'; for (let k = 0; k < 5; k++) g.fillRect(bx - bw / 2, ry - rh * 0.75 + (k * rh * 1.5) / 5, bw, 2); }
        const fs = Math.max(12, A.w * 0.035); ctx.kit.text(g, `🏫 ${school} Home Arena`, A.x + A.w / 2, ry, fs, '#fff', { stroke: 'rgba(0,0,0,.45)', strokeW: 4 });
        g.restore();
      }
      ctx.loop((dt) => {
        dt = Math.max(0, dt); // the first frame can report a negative dt
        t += dt; parts.update(dt);
        if (phase === 'play' || phase === 'resolve') { elixir = Math.min(10, elixir + dt / REGEN); updateElixir(); }
        drawArena();
        const towers = op.concat(me); for (const tw of towers) { if (tw.shake > 0) tw.shake -= dt; }
        towers.slice().sort((a, b) => a.y - b.y).forEach(drawTower);
        for (let i = troops.length - 1; i >= 0; i--) {
          const tr = troops[i];
          if (tr.st === 'walk') {
            const wp = tr.path[tr.wi]; const dx = wp.x - tr.x, dy = wp.y - tr.y, d = Math.hypot(dx, dy), st = 0.3 * dt;
            if (d <= st) { tr.x = wp.x; tr.y = wp.y; tr.wi++; if (tr.wi >= tr.path.length) { tr.st = 'throw'; tr.tt = 0; if (tr.target) { const tw = tr.target; balls.push({ a: P(tr.x, tr.y), tw, side: tr.side, k: 0 }); EP.sfx.whoosh(); } } }
            else { tr.x += (dx / d) * st; tr.y += (dy / d) * st; }
          } else { tr.tt += dt; if (tr.tt > 1.3) { const p = P(tr.x, tr.y); parts.burst(p.x, p.y, '#fff', 10, 120); troops.splice(i, 1); continue; } }
          const p = P(tr.x, tr.y), s = A.w * 0.11, bob = tr.st === 'walk' ? Math.abs(Math.sin(t * 10 + tr.ph)) * s * 0.18 : Math.abs(Math.sin(t * 16)) * s * 0.3;
          g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(p.x, p.y + s * 0.45, s * 0.4, s * 0.12, 0, 0, 6.3); g.fill();
          g.strokeStyle = tr.side === 'me' ? '#1c7ed6' : '#e03131'; g.lineWidth = 3; g.beginPath(); g.ellipse(p.x, p.y + s * 0.45, s * 0.42, s * 0.14, 0, 0, 6.3); g.stroke();
          ctx.kit.emoji(g, tr.emoji, p.x, p.y - bob, s);
          if (tr.st === 'throw' && !tr.target) ctx.kit.emoji(g, '🎉', p.x + s * 0.5, p.y - s * 0.6, s * 0.5);
        }
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i]; b.k += dt / 0.45; const e = Math.min(1, b.k), to = P(b.tw.x, b.tw.y);
          const x = b.a.x + (to.x - b.a.x) * e, y = b.a.y + (to.y - b.a.y) * e - Math.sin(e * Math.PI) * A.h * 0.08;
          g.fillStyle = b.side === 'me' ? '#4dabf7' : '#ff8787'; g.beginPath(); g.arc(x, y, A.w * 0.025, 0, 6.3); g.fill();
          g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x - 3, y - 3, A.w * 0.008, 0, 6.3); g.fill();
          if (e >= 1) { balls.splice(i, 1); hitTower(b.tw, b.side); }
        }
        if (phase === 'victory') {
          g.fillStyle = 'rgba(10,12,40,.45)'; g.fillRect(0, 0, c.w, c.h);
          if (Math.random() < dt * 3.5) { rockets.push({ x: u.rand(0.1, 0.9) * c.w, y: c.h, vy: -u.rand(420, 620), fuse: u.rand(0.7, 1.1), col: u.pick(['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#f783ac', '#b197fc']) }); }
          for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i]; r.y += r.vy * dt; r.fuse -= dt; g.fillStyle = r.col; g.beginPath(); g.arc(r.x, r.y, 3, 0, 6.3); g.fill(); if (r.fuse <= 0) { parts.burst(r.x, r.y, r.col, 40, 320); parts.burst(r.x, r.y, '#fff', 12, 200); EP.sfx.pop(); rockets.splice(i, 1); } }
        }
        parts.draw(g);
      });

      ready = true; layout(); setup();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { if (phase !== 'play') return; const cd = hand.find((h) => h && h.w.id === item.id); if (!cd) return; elixir = Math.max(elixir, cd.cost); play(cd, null); },
          wrong() { if (phase !== 'play') return; const cd = hand.find((h) => h && h.w.id !== item.id); if (!cd) return; elixir = Math.max(elixir, cd.cost); play(cd, null); },
        },
      };
    },
  });
})();
