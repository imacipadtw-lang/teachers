/* Level 21 — Kitchen Craft (inspired by Minecraft: mine blocks, collect items, craft at the crafting table)
 * Osaka, "the nation's kitchen". Step 1: break the block wall and collect the hidden letter ores into the hotbar.
 * Step 2: place the letters in order on the crafting table to craft the food/drink. One ctx.answer per craft.
 * All pixel textures are generated at runtime on tiny 16x16 canvases (no image files). */
(function () {
  const EP = window.EP, u = EP.u;
  const PAL = {
    stone: ['#8a8a8a', '#7d7d7d', '#959595', '#727272', '#868686'],
    dirt: ['#8b6142', '#7a5537', '#97704f', '#6e4a2f', '#85603f'],
    grass: ['#6aa84f', '#5c9a42', '#79b85a', '#548c3b'],
    wool: ['#eef0f0', '#e2e6e6', '#f6f7f7', '#d9dede'],
    plank: ['#b48d55', '#a8814a', '#bf9a63', '#ad874f'],
  };
  const GEMS = ['#fcee4b', '#5decf5', '#17dd62', '#ff5555', '#5b7cff', '#ff9a3c', '#d36bff'];
  function tex(kind, gem) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let pal = kind === 'grass' ? (y < 3 + ((x * 7) % 3 === 0 ? 2 : 0) ? PAL.grass : PAL.dirt) : PAL[kind] || PAL.stone;
      g.fillStyle = u.pick(pal);
      if (kind === 'plank' && y % 4 === 3) g.fillStyle = '#7d5f35';
      g.fillRect(x, y, 1, 1);
    }
    if (gem) for (let k = 0; k < 4; k++) {
      const cx = u.randInt(2, 12), cy = u.randInt(2, 12);
      for (let j = 0; j < 5; j++) { g.fillStyle = j === 0 ? '#ffffff' : gem; g.fillRect(cx + u.randInt(-1, 1), cy + u.randInt(-1, 1), u.randInt(1, 2), 1); }
    }
    return 'url(' + cv.toDataURL() + ')';
  }
  function crackTex(stage) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d'); g.fillStyle = 'rgba(20,20,20,.85)';
    for (let k = 0; k < stage + 1; k++) { let x = 8, y = 8; for (let s = 0; s < 3 + stage * 3; s++) { g.fillRect(x, y, 1, 1); x = u.clamp(x + u.randInt(-1, 1), 0, 15); y = u.clamp(y + u.randInt(-1, 1), 0, 15); } }
    return 'url(' + cv.toDataURL() + ')';
  }
  const CSS = `
  .kc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 10px 14px;color:#fff;font-family:var(--font)}
  .kc-px{image-rendering:pixelated;background-size:100% 100%}
  .kc-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none}
  .kc-cloud{position:absolute;height:22px;background:#fff;opacity:.85;animation:kcDrift linear infinite}
  .kc-cloud::after{content:'';position:absolute;left:22%;top:-14px;width:46%;height:16px;background:#fff}
  @keyframes kcDrift{from{transform:translateX(-30vw)}to{transform:translateX(130vw)}}
  .kc-ground{position:absolute;left:0;right:0;bottom:0;height:40px;background-size:40px 40px;image-rendering:pixelated}
  .kc-panel{background:#c6c6c6;border:4px solid;border-color:#fff #555 #555 #fff;outline:3px solid #111;color:#3f3f3f;z-index:2}
  .kc-top{display:flex;align-items:center;gap:10px 14px;padding:6px 12px;flex-wrap:wrap;justify-content:center;max-width:100%}
  .kc-say{width:56px;height:56px;background:#5b8731;color:#fff;font-size:1.6rem;border:3px solid;border-color:#8fc75b #2d4a14 #2d4a14 #8fc75b}
  .kc-pic{font-size:2.7rem;line-height:1}
  .kc-zh{font-size:1.45rem;font-weight:900;font-family:var(--font-zh);color:#3f3f3f}
  .kc-phase{font-weight:900;font-size:1.1rem;color:#3f3f3f}
  .kc-bag{font-weight:900;font-size:1.1rem;background:#8b8b8b;color:#fff;padding:4px 10px;text-shadow:2px 2px 0 #3f3f3f}
  .kc-main{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;position:relative;z-index:2}
  .kc-wall{display:grid;padding:6px;background:rgba(0,0,0,.35);border:4px solid #222}
  .kc-b{position:relative;width:var(--bs);height:var(--bs);box-shadow:inset -3px -3px 0 rgba(0,0,0,.28),inset 3px 3px 0 rgba(255,255,255,.18);cursor:pointer;touch-action:none}
  .kc-b .crk{position:absolute;inset:0;pointer-events:none}
  .kc-b.ore::after{content:'✦';position:absolute;right:8%;top:4%;color:#fff;font-size:calc(var(--bs)*.24);animation:kcTw 1.4s infinite;pointer-events:none}
  .kc-b.hit{animation:kcHit .12s}
  .kc-b.air{background:rgba(0,0,0,.5)!important;box-shadow:inset 0 0 14px rgba(0,0,0,.7);cursor:default}
  .kc-b.air::after{display:none}
  @keyframes kcHit{50%{transform:scale(.9)}}
  @keyframes kcTw{50%{opacity:.2;transform:scale(.6)}}
  .kc-table{padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:10px;max-width:100%;animation:fadeIn .3s}
  .kc-title{font-weight:900;font-size:1.15rem}
  .kc-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}
  .kc-slots{display:flex;flex-wrap:wrap;gap:6px calc(var(--ss)*.4);justify-content:center;max-width:100%}.kc-word{display:flex;gap:3px;flex-wrap:wrap;justify-content:center}
  .kc-slot{width:var(--ss);height:var(--ss);background:#8b8b8b;border:3px solid;border-color:#373737 #fff #fff #373737;display:flex;align-items:center;justify-content:center;position:relative}
  .kc-slot.gap{background:none;border-color:transparent;width:calc(var(--ss)*.4)}
  .kc-slot.next{outline:4px solid #fff;animation:kcBlink .9s infinite}
  .kc-slot.hint{outline:4px solid #ffd43b}
  .kc-ghost{color:rgba(0,0,0,.28);font-weight:900;font-size:calc(var(--ss)*.55)}
  @keyframes kcBlink{50%{outline-color:#ffff55}}
  .kc-item{width:84%;height:84%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#2b2b2b;box-shadow:inset -3px -3px 0 rgba(0,0,0,.25),inset 3px 3px 0 rgba(255,255,255,.5);font-size:max(20px,calc(var(--ss)*.56));line-height:1}
  .kc-arrow{font-size:2.6rem;color:#8b8b8b;font-weight:900}
  .kc-out{width:calc(var(--ss)*1.6);height:calc(var(--ss)*1.6);min-width:76px;min-height:76px;font-size:2.6rem;flex-direction:column}
  .kc-out .zh{font-size:1.2rem;font-weight:900;color:#fff;text-shadow:2px 2px 0 #3f3f3f;text-align:center;line-height:1.1}
  .kc-out.ready{animation:kcGlow .7s infinite alternate;cursor:pointer}
  @keyframes kcGlow{to{box-shadow:0 0 0 6px #ffff55,0 0 22px #ffff55}}
  .kc-tip{font-weight:800;font-size:1rem;color:#3f3f3f;text-align:center}
  .kc-hot{display:flex;flex-wrap:wrap;justify-content:center;background:rgba(30,30,30,.88);border:3px solid #111;padding:3px;max-width:100%;z-index:3;min-height:calc(var(--hs) + 12px)}
  .kc-hs{width:var(--hs);height:var(--hs);border:3px solid;border-color:#373737 #9b9b9b #9b9b9b #373737;background:rgba(139,139,139,.55);display:flex;align-items:center;justify-content:center;position:relative;--ss:var(--hs)}
  .kc-hs .n{position:absolute;right:3px;bottom:-2px;font-weight:900;font-size:1.05rem;color:#fff;text-shadow:2px 2px 0 #3f3f3f}
  .kc-hs.empty .kc-item{opacity:.15}
  .kc-hs.bad{animation:shake .35s;background:rgba(255,70,70,.7)}
  .kc-hs.pend .kc-item{visibility:hidden}.kc-hs.ph{pointer-events:none}
  .kc-fly{position:absolute;z-index:35;pointer-events:none;transition:transform .38s cubic-bezier(.3,.7,.4,1),opacity .38s}
  .kc-ach{position:absolute;right:10px;z-index:45;background:#212121;border:3px solid #555;outline:2px solid #000;color:#fff;padding:8px 14px;display:flex;gap:12px;align-items:center;animation:kcIn .35s,kcOut .4s 2.7s forwards;max-width:calc(100% - 20px)}
  .kc-ach b{color:#ffff55;display:block;font-size:1.1rem}.kc-ach span{font-size:1.15rem;font-weight:800}
  .kc-ach .ic{font-size:2.2rem;line-height:1}
  @keyframes kcIn{from{transform:translateY(-120%)}}@keyframes kcOut{to{transform:translateY(-140%);opacity:0}}
  .kc-end{padding:18px;text-align:center;max-width:92%;animation:fadeIn .3s}
  .kc-end .list{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px}
  .kc-end .list span{background:#8b8b8b;color:#fff;padding:6px 10px;font-weight:900;font-size:1.3rem;text-shadow:2px 2px 0 #3f3f3f}`;

  EP.registerGame({
    id: 'craft', level: 21, icon: '⛏️', title: 'Kitchen Craft', titleZh: '方塊廚房',
    model: 'Minecraft（當個創世神：挖礦、收集、合成）',
    howZh: '先敲碎方塊，把藏在礦石裡的字母收進快捷欄；再到合成台照順序放字母，合成食物和飲料！',
    howEn: 'Mine the blocks to collect letters, then craft the food by placing letters in order!',
    skills: ['listening', 'meaning', 'spelling'],
    start(ctx) {
      const root = ctx.root, D = ctx.difficulty;
      root.style.background = 'linear-gradient(#78a7ff 0%, #a5c8ff 60%, #c9defd 100%)';
      root.appendChild(u.el('style', {}, CSS));
      const sky = u.el('div', { class: 'kc-sky' });
      for (let i = 0; i < 4; i++) sky.appendChild(u.el('div', { class: 'kc-cloud', style: { top: 6 + i * 13 + '%', width: 80 + i * 30 + 'px', animationDuration: 50 + i * 17 + 's', animationDelay: -i * 19 + 's' } }));
      sky.appendChild(u.el('div', { class: 'kc-ground', style: { backgroundImage: tex('grass') } }));
      sky.appendChild(u.el('div', { style: { position: 'absolute', left: '2%', bottom: '30px', fontSize: '4.5rem', opacity: 0.55 } }, '🏯'));
      root.appendChild(sky);
      const wrap = u.el('div', { class: 'kc' }); root.appendChild(wrap);
      const top = u.el('div', { class: 'kc-panel kc-top' }); const main = u.el('div', { class: 'kc-main' }); const hot = u.el('div', { class: 'kc-hot' });
      wrap.append(top, main, hot);
      const layer = u.el('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 } }); root.appendChild(layer);
      const pc = ctx.kit.canvas(layer); const ps = [];
      const burst = (x, y, cols, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = u.rand(80, 260); ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 160, s: u.rand(4, 9), c: u.pick(cols), t: 0, life: u.rand(0.5, 0.9) }); } };
      ctx.loop((dt) => {
        dt = Math.max(0, dt); // the first frame can report a negative dt
        pc.g.clearRect(0, 0, pc.w, pc.h);
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; if (p.t > p.life) { ps.splice(i, 1); continue; } pc.g.globalAlpha = 1 - p.t / p.life; pc.g.fillStyle = p.c; pc.g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
        pc.g.globalAlpha = 1;
      });
      const rel = (el) => { const r = el.getBoundingClientRect(), R = root.getBoundingClientRect(); return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height, cx: r.left - R.left + r.width / 2, cy: r.top - R.top + r.height / 2 }; };
      const CRACKS = [crackTex(0), crackTex(1), crackTex(2)];
      const WOOL = tex('wool');
      const letterItem = (ch) => u.el('div', { class: 'kc-item kc-px', style: { backgroundImage: WOOL } }, ch);

      const items = ctx.items; let idx = 0, item = null, key = '', letters = [], pos = 0, wrongs = 0, phase = 'idle';
      let blocks = [], oresLeft = 0, holding = null, slotEls = [], out = null, autoT = 0; const stacks = new Map(); const bag = [];
      const EXTRA = D === 'easy' ? 1 : D === 'hard' ? 3 : 2;
      const ORE_HP = D === 'easy' ? 1 : 2;

      function renderTop() {
        top.innerHTML = '';
        const pic = EP.pic(item);
        top.append(u.el('button', { class: 'kc-say', title: 'Listen 再聽一次', onclick: () => ctx.say(item) }, '🔊'));
        if (pic) top.append(u.el('div', { class: 'kc-pic' }, pic));
        if (!pic || (D !== 'hard' && EP.settings.showChinese)) top.append(u.el('div', { class: 'kc-zh' }, item.zh));
        top.append(u.el('div', { class: 'kc-phase' }, phase === 'mine' ? '⛏️ Mine! 挖礦' : '🛠️ Craft! 合成'), u.el('div', { class: 'kc-bag' }, '🎒 ' + bag.length));
      }
      function sizeHot() {
        const w = root.clientWidth; const n = Math.max(1, Math.min(9, hot.children.length || 6));
        hot.style.setProperty('--hs', u.clamp(Math.floor((w - 32) / n), 56, 72) + 'px');
      }
      function setup() {
        if (idx >= items.length) return finish();
        item = items[idx]; ctx.hud.progress(idx / items.length);
        key = EP.spellKey(item); letters = key.split('').filter((ch) => /[a-z]/i.test(ch)).map((ch) => ch.toLowerCase());
        pos = 0; wrongs = 0; stacks.clear(); hot.innerHTML = ''; phase = 'mine';
        renderTop(); buildWall();
        ctx.timeout(() => ctx.say(item), 300);
      }

      // ---------- step 1: mine ----------
      function buildWall() {
        main.innerHTML = '';
        const avoid = new Set(letters);
        const extras = u.shuffle('abcdefghiklmnoprstuwy'.split('').filter((x) => !avoid.has(x))).slice(0, EXTRA);
        const ores = u.shuffle(letters.concat(extras));
        hot.innerHTML = ''; for (let i = new Set(ores).size; i > 0; i--) hot.appendChild(u.el('div', { class: 'kc-hs ph' }));
        sizeHot();
        const r = main.getBoundingClientRect(); const aspect = Math.max(0.5, r.width / Math.max(1, r.height));
        const want = ores.length + Math.max(4, Math.ceil(ores.length * 0.5));
        const C = u.clamp(Math.round(Math.sqrt(want * aspect)), 4, 10), R = Math.ceil(want / C), total = C * R;
        const cells = u.shuffle(Array.from({ length: total }, (_, i) => i));
        const oreAt = new Map(); ores.forEach((ch, i) => oreAt.set(cells[i], ch));
        const bs = Math.floor(Math.min(r.width > 700 ? 112 : 90, (r.width - 24) / C, (r.height - 24) / R));
        const wall = u.el('div', { class: 'kc-wall', style: { gridTemplateColumns: `repeat(${C}, var(--bs))`, '--bs': bs + 'px' } });
        wall.style.setProperty('--bs', Math.max(44, bs) + 'px');
        blocks = []; oresLeft = ores.length;
        for (let i = 0; i < total; i++) {
          const row = (i / C) | 0, ch = oreAt.get(i) || '';
          const kind = ch ? 'stone' : row === 0 ? 'grass' : Math.random() < 0.45 ? 'dirt' : 'stone';
          const gem = ch ? u.pick(GEMS) : null;
          const el = u.el('div', { class: 'kc-b kc-px' + (ch ? ' ore' : ''), style: { backgroundImage: tex(kind, gem) } });
          const crk = u.el('div', { class: 'crk kc-px' }); el.appendChild(crk);
          const b = { el, crk, ch, kind, gem, hp: ch ? ORE_HP : kind === 'stone' ? 2 : 1, dmg: 0, air: false };
          ctx.on(el, 'pointerdown', (e) => { e.preventDefault(); holding = b; hit(b); });
          blocks.push(b); wall.appendChild(el);
        }
        main.appendChild(wall);
      }
      ctx.on(window, 'pointerup', () => (holding = null)); ctx.on(window, 'pointercancel', () => (holding = null));
      ctx.interval(() => { if (holding) hit(holding); }, 240);
      const colorsOf = (b) => (b.gem ? [b.gem, '#8a8a8a', '#ffffff'] : PAL[b.kind === 'grass' ? 'dirt' : b.kind]);
      function hit(b) {
        if (phase !== 'mine' || b.air || ctx.paused) return;
        b.dmg++; EP.sfx.click();
        b.el.classList.remove('hit'); void b.el.offsetWidth; b.el.classList.add('hit');
        const p = rel(b.el); burst(p.cx, p.cy, colorsOf(b), 4);
        if (b.dmg >= b.hp) breakBlock(b, false);
        else b.crk.style.backgroundImage = CRACKS[Math.min(2, Math.round((b.dmg / b.hp) * 2))];
      }
      function breakBlock(b, instant) {
        b.air = true; b.el.classList.add('air'); b.crk.style.backgroundImage = ''; if (holding === b) holding = null;
        const p = rel(b.el);
        if (!instant) { burst(p.cx, p.cy, colorsOf(b), 16); EP.sfx.slice(); }
        if (!b.ch) return;
        collect(b.ch, p, instant);
        if (--oresLeft <= 0) { phase = 'mined'; if (instant) startCraft(); else { ctx.toast('All letters found! 字母收集完成 → 合成台'); ctx.timeout(startCraft, 900); } }
      }
      function stackFor(ch) {
        let st = stacks.get(ch);
        if (!st) { const el = u.el('button', { class: 'kc-hs pend' }, letterItem(ch), u.el('span', { class: 'n' }, '')); st = { ch, count: 0, shown: 0, el }; stacks.set(ch, st); const ph = hot.querySelector('.ph'); ph ? hot.replaceChild(el, ph) : hot.appendChild(el); sizeHot(); ctx.on(el, 'click', () => place(ch)); }
        return st;
      }
      function renderStack(st) { st.el.classList.toggle('pend', st.shown <= 0 && st.count <= 0); st.el.classList.toggle('empty', st.count <= 0); st.el.querySelector('.n').textContent = st.count > 1 ? st.count : ''; }
      function collect(ch, from, instant) {
        const st = stackFor(ch); st.count++;
        if (instant) { st.shown = 1; return renderStack(st); }
        const f = letterItem(ch); const fl = u.el('div', { class: 'kc-fly', style: { left: from.cx - 26 + 'px', top: from.cy - 26 + 'px', width: '52px', height: '52px', '--ss': '52px', transform: 'scale(.6)' } }, f);
        root.appendChild(fl);
        ctx.timeout(() => { fl.style.transform = 'translateY(-36px) scale(1.1) rotate(12deg)'; }, 20);
        ctx.timeout(() => { const t = rel(st.el); fl.style.transform = `translate(${t.cx - from.cx}px, ${t.cy - from.cy}px) scale(.8)`; }, 330);
        ctx.timeout(() => { fl.remove(); st.shown = 1; renderStack(st); EP.sfx.pop(); }, 720);
      }

      // ---------- step 2: craft ----------
      function startCraft() {
        phase = 'craft'; renderTop(); main.innerHTML = '';
        for (const st of stacks.values()) { st.shown = 1; renderStack(st); }
        const r = main.getBoundingClientRect();
        const longest = Math.max(...key.split(' ').map((w) => w.length)); const avail = Math.min(r.width, 900) - 50;
        const ss = u.clamp(Math.min(Math.floor((avail + 3) / longest) - 3, Math.floor((avail * (r.width < 600 ? 1 : 0.8)) / Math.max(1, key.length)) + 20), 32, 76);
        const table = u.el('div', { class: 'kc-panel kc-table', style: { '--ss': ss + 'px' } });
        table.style.setProperty('--ss', ss + 'px');
        const slots = u.el('div', { class: 'kc-slots' }); slotEls = [];
        let wordEl = null;
        for (const ch of key) {
          if (ch === ' ') { wordEl = null; continue; }
          if (!wordEl) { wordEl = u.el('div', { class: 'kc-word' }); slots.appendChild(wordEl); }
          if (/[a-z]/i.test(ch)) { const s = u.el('div', { class: 'kc-slot' }, D === 'easy' ? u.el('span', { class: 'kc-ghost' }, ch) : ''); slotEls.push(s); wordEl.appendChild(s); }
          else wordEl.appendChild(u.el('div', { class: 'kc-slot' }, letterItem(ch)));
        }
        out = u.el('button', { class: 'kc-slot kc-out', onclick: () => phase === 'collect' && collectItem() });
        table.append(u.el('div', { class: 'kc-title' }, '🛠️ Crafting Table 合成台'), u.el('div', { class: 'kc-row' }, slots, u.el('div', { class: 'kc-arrow' }, '➜'), out),
          u.el('div', { class: 'kc-tip' }, 'Tap the letters in order 依序點快捷欄的字母'));
        main.appendChild(table); markNext();
      }
      function markNext() { slotEls.forEach((s, i) => s.classList.toggle('next', i === pos)); }
      function place(ch, isHint) {
        if (phase !== 'craft' || ctx.paused) return;
        const st = stacks.get(ch); if (!st || st.count <= 0) return;
        const want = letters[pos];
        if (ch === want) {
          st.count--; renderStack(st);
          const slot = slotEls[pos]; slot.innerHTML = ''; slot.appendChild(letterItem(ch)); slot.classList.toggle('hint', !!isHint);
          const p = rel(slot); burst(p.cx, p.cy, ['#ffffff', '#ffff55', '#c6c6c6'], 8); EP.sfx.pop();
          pos++; markNext();
          if (pos >= letters.length) craftDone();
        } else {
          wrongs++; EP.sfx.wrong(); st.el.classList.remove('bad'); void st.el.offsetWidth; st.el.classList.add('bad');
          const p = rel(slotEls[pos]); ctx.float(p.cx, p.y - 8, '✗ ' + ch, 'bad');
          if (wrongs % 3 === 0) ctx.timeout(() => { if (phase === 'craft') { ctx.toast('💡 Hint 提示：' + want); place(want, true); } }, 450);
        }
      }
      async function craftDone() {
        phase = 'crafted';
        const ok = wrongs === 0; const pic = EP.pic(item);
        out.innerHTML = ''; out.append(pic ? u.el('span', {}, pic) : u.el('span', { class: 'zh' }, item.zh));
        const p = rel(out); burst(p.cx, p.cy, ['#ffff55', '#7fff6a', '#ffffff', '#5decf5'], 30); EP.sfx.chest();
        ctx.answer(item, ok, { x: p.cx, y: p.y - 10, points: 100 + letters.length * 10 });
        if (!ok) { phase = 'reveal'; await ctx.reveal(item); } else ctx.say(item);
        phase = 'collect'; out.classList.add('ready');
        autoT = ctx.timeout(() => phase === 'collect' && collectItem(), 5000);
      }
      function collectItem() {
        if (phase !== 'collect') return; phase = 'next'; clearTimeout(autoT);
        bag.push(item); const pic = EP.pic(item); EP.sfx.levelUp();
        const p = rel(out); burst(p.cx, p.cy, ['#7fff6a', '#c3ff4d'], 18);
        const ach = u.el('div', { class: 'kc-ach' }, u.el('div', { class: 'ic' }, pic || '🍽️'), u.el('div', {}, u.el('b', {}, 'Achievement get!'), u.el('span', {}, `${item.word} ${item.zh}`)));
        ach.style.top = rel(top).y + rel(top).h + 8 + 'px'; root.appendChild(ach); ctx.timeout(() => ach.remove(), 3200);
        out.classList.remove('ready'); out.innerHTML = '';
        renderTop(); idx++; ctx.hud.progress(idx / items.length);
        ctx.timeout(setup, 1000);
      }
      function finish() {
        phase = 'end'; ctx.hud.progress(1); main.innerHTML = ''; hot.innerHTML = '';
        const panel = u.el('div', { class: 'kc-panel kc-end' }, u.el('div', { style: { fontSize: '2.6rem' } }, '🏆'),
          u.el('div', { style: { fontWeight: 900, fontSize: '1.5rem' } }, 'Recipe Book Complete! 食譜收集完成'),
          u.el('div', { class: 'list' }, bag.map((w) => u.el('span', {}, (EP.pic(w) || '🍽️') + ' ' + w.word))));
        main.appendChild(panel); EP.sfx.win(); ctx.confetti();
        ctx.timeout(() => ctx.end(), 2600);
      }
      function finishMine() { for (const b of blocks) if (b.ch && !b.air && phase === 'mine') breakBlock(b, true); }

      setup();
      return {
        destroy() { pc.destroy(); },
        test: {
          correct() {
            if (phase === 'mine') finishMine();
            let guard = 40; while (phase === 'craft' && guard--) place(letters[pos]);
            if (phase === 'collect') collectItem();
          },
          wrong() {
            if (phase === 'mine') finishMine();
            if (phase !== 'craft') return;
            const st = Array.from(stacks.values()).find((s) => s.ch !== letters[pos] && s.count > 0);
            if (st) place(st.ch);
          },
        },
      };
    },
  });
})();
