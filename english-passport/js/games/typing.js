/* Level 23 — Rocket Typer (inspired by qwerty-learner and Monkeytype, two of GitHub's most-starred typing projects)
 * NASA Houston. Hear the verb + see Chinese, then type it. Each correct letter fuels the rocket; a wrong letter flashes red,
 * shakes and restarts the word (qwerty-learner). Finishing launches the rocket one stage higher. Live WPM + accuracy (Monkeytype).
 * Easy: word shown faintly to copy. Normal: shown after the first mistake. Hard: never shown. One ctx.answer per word. */
(function () {
  const EP = window.EP, u = EP.u;
  const ZONES = [
    { name: 'Launch Pad 發射台', a: '#7cc8ff', b: '#d8f1ff' }, { name: 'Blue Sky 藍天', a: '#3d8fe0', b: '#a6d6ff' },
    { name: 'Clouds 雲層', a: '#2f6fc4', b: '#7fb6ef' }, { name: 'Stratosphere 平流層', a: '#1c3d8f', b: '#4f7fd0' },
    { name: 'Orbit 地球軌道', a: '#0b1640', b: '#1d2f7a' }, { name: 'The Moon 月球', a: '#070b26', b: '#141c4d' },
    { name: 'Mars 火星', a: '#0a0620', b: '#2a1240' }, { name: 'Saturn 土星', a: '#05041a', b: '#1b0f3a' },
    { name: 'Deep Space 外太空', a: '#020210', b: '#0d0a2a' }];
  const SIGHTS = [{ A: 3.7, e: '🌍', s: 0.75, x: 0.5 }, { A: 5, e: '🌕', s: 0.32, x: 0.72 }, { A: 6, e: '🔴', s: 0.22, x: 0.3 }, { A: 7, e: '🪐', s: 0.36, x: 0.7 }, { A: 8, e: '🌌', s: 0.3, x: 0.35 }, { A: 7.6, e: '☄️', s: 0.14, x: 0.15 }, { A: 4.6, e: '🛰️', s: 0.12, x: 0.85 }];
  const mix = (c1, c2, f) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const a = p(c1), b = p(c2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`; };
  const CSS = `
  .rt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 10px 10px;z-index:3;pointer-events:none}
  .rt>*{pointer-events:auto}
  .rt.land{left:40%}
  .rt-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;max-width:100%}
  .rt-card{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.95);color:#1d2340;border-radius:18px;padding:6px 14px 6px 6px;box-shadow:0 5px 0 rgba(0,0,0,.2)}
  .rt-say{width:56px;height:56px;border-radius:50%;background:#e2b714;color:#323437;font-size:1.5rem;box-shadow:0 4px 0 #a88710;flex:none}
  .rt-pic{font-size:2.6rem;line-height:1}.rt-zh{font-size:1.5rem;font-weight:900;font-family:var(--font-zh)}
  .rt-stats{display:flex;gap:6px;background:#323437;border-radius:14px;padding:6px 12px;font-family:'Roboto Mono',ui-monospace,monospace;box-shadow:0 5px 0 rgba(0,0,0,.25)}
  .rt-stats div{display:flex;flex-direction:column;align-items:center;min-width:54px;line-height:1.05}
  .rt-stats small{color:#646669;font-size:.75rem;font-weight:800}.rt-stats b{color:#e2b714;font-size:1.45rem}
  .rt-space{flex:1;min-height:40px;width:100%;pointer-events:none}
  .rt-word{background:#323437;border-radius:18px;padding:10px 20px;display:flex;gap:2px;justify-content:center;font-family:'Roboto Mono',ui-monospace,monospace;font-weight:700;font-size:clamp(2.2rem,8vw,3.6rem);box-shadow:0 6px 0 rgba(0,0,0,.3);max-width:100%;flex-wrap:wrap;transition:background .15s}
  .rt-word.bad{background:#5a2730}
  .rt-l{color:#646669;min-width:.62em;text-align:center;position:relative}
  .rt-l.ok{color:#d1d0c5}.rt-l.ghost{color:#5f6266}.rt-l.hide{color:#7a7d80;margin:0 .08em}
  .rt-l.err{color:#ca4754}
  .rt-l.cur::before{content:'';position:absolute;left:-2px;top:12%;bottom:12%;width:3px;border-radius:2px;background:#e2b714;animation:rtBlink 1s infinite}
  .rt-l.end::before{left:auto;right:-3px}
  @keyframes rtBlink{50%{opacity:0}}
  .rt-msg{color:#fff;font-weight:800;font-size:1rem;text-shadow:0 2px 0 rgba(0,0,0,.4);min-height:1.3em;text-align:center}
  .rt-kb{width:min(720px,100%);display:flex;flex-direction:column;gap:5px;background:rgba(50,52,55,.88);border-radius:16px;padding:6px}
  .rt-kr{display:flex;gap:5px;justify-content:center}
  .rt-k{flex:1;max-width:60px;height:54px;border-radius:9px;background:#2c2e31;color:#d1d0c5;font-weight:800;font-size:1.3rem;font-family:'Roboto Mono',ui-monospace,monospace;box-shadow:0 3px 0 #1b1c1e;touch-action:manipulation;padding:0}
  .rt-k.hint{background:#e2b714;color:#323437;box-shadow:0 3px 0 #a88710,0 0 14px #e2b714}
  .rt-k.down{transform:translateY(3px);box-shadow:none;background:#646669}
  .rt-end{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(5,6,25,.55)}
  .rt-end .p{background:#323437;color:#d1d0c5;border-radius:22px;padding:22px 26px;text-align:center;font-family:'Roboto Mono',ui-monospace,monospace;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:fadeIn .3s;max-width:92%}
  .rt-end b{color:#e2b714;font-size:2.4rem;display:block}.rt-end .row{display:flex;gap:26px;justify-content:center;margin:10px 0}`;

  EP.registerGame({
    id: 'typing', level: 23, icon: '🚀', title: 'Rocket Typer', titleZh: '火箭打字員',
    model: 'qwerty-learner + Monkeytype（GitHub 星數約 2.37 萬與 2.10 萬）',
    howZh: '聽單字、看中文，用鍵盤打出英文！每打對一個字母就幫火箭加油，打錯會重來。打完整個字，火箭就往太空飛一層！',
    howEn: 'Listen and type the word. Every right letter fuels the rocket; finish the word to launch it higher!',
    skills: ['listening', 'meaning', 'spelling'],
    start(ctx) {
      const root = ctx.root, D = ctx.difficulty;
      root.style.background = '#0b1640';
      root.appendChild(u.el('style', {}, CSS));
      let ready = false;
      const c = ctx.kit.canvas(root, () => ready && layout()); const g = c.g; const parts = ctx.kit.particles();
      const ui = u.el('div', { class: 'rt' }); root.appendChild(ui);
      const top = u.el('div', { class: 'rt-top' }); const space = u.el('div', { class: 'rt-space' });
      const word = u.el('div', { class: 'rt-word' }); const msg = u.el('div', { class: 'rt-msg' }); const kb = u.el('div', { class: 'rt-kb' });
      ui.append(top, space, word, msg, kb);
      const card = u.el('div', { class: 'rt-card' }); const stats = u.el('div', { class: 'rt-stats' });
      const wpmEl = u.el('b', {}, '0'), accEl = u.el('b', {}, '100%'), stgEl = u.el('b', {}, '0');
      stats.append(u.el('div', {}, u.el('small', {}, 'wpm'), wpmEl), u.el('div', {}, u.el('small', {}, 'acc'), accEl), u.el('div', {}, u.el('small', {}, 'stage'), stgEl));
      top.append(card, stats);
      const keyEls = {};
      ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].forEach((row) => {
        const r = u.el('div', { class: 'rt-kr' });
        for (const k of row) { const b = u.el('button', { class: 'rt-k' }, k); ctx.on(b, 'pointerdown', (e) => { e.preventDefault(); type(k); }); keyEls[k] = b; r.appendChild(b); }
        kb.appendChild(r);
      });
      ctx.on(window, 'keydown', (e) => {
        if (ctx.paused || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        const k = e.key.length === 1 ? e.key.toLowerCase() : '';
        if (/^[a-z' -]$/.test(k)) { e.preventDefault(); type(k); }
      });

      const items = ctx.items; let idx = 0, item = null, target = '', pos = 0, fails = 0, phase = 'busy', shown = D === 'easy', stage = 0;
      let t = 0, alt = 0, altTo = 0, launchT = -1, fuel = 0, keysOk = 0, keysAll = 0, charsDone = 0, typeTime = 0, wordStarted = false, flash = 0;
      let rx = 0, ry = 0, RS = 100, land = false;
      const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4, tw: Math.random() * 6 }));
      const clouds = Array.from({ length: 9 }, (_, i) => ({ A: 1.1 + i * 0.22, x: Math.random(), w: 0.18 + Math.random() * 0.2 }));
      const smoke = [];

      function layout() {
        land = c.w > c.h * 1.15; ui.classList.toggle('land', land);
        if (land) { rx = c.w * 0.2; ry = c.h * 0.55; RS = Math.min(c.h * 0.32, c.w * 0.14, 190); }
        else { const s = space.getBoundingClientRect(), R = root.getBoundingClientRect(); const h = Math.max(60, s.height); rx = c.w * 0.5; ry = s.top - R.top + h * 0.55; RS = u.clamp(h * 0.62, 50, 170); }
      }
      function renderWord() {
        word.innerHTML = '';
        target.split('').forEach((ch, i) => {
          const done = i < pos; let cls = 'rt-l', txt = ch;
          if (done) cls += ' ok'; else if (shown) cls += ' ghost'; else { cls += ' hide'; txt = ch === ' ' ? '␣' : '_'; }
          if (i === pos) cls += ' cur';
          word.appendChild(u.el('span', { class: cls }, txt));
        });
        if (pos >= target.length && word.lastChild) word.lastChild.classList.add('cur', 'end');
        for (const k in keyEls) keyEls[k].classList.toggle('hint', D === 'easy' && phase === 'typing' && k === target[pos]);
      }
      function updateStats() {
        const mins = typeTime / 60; wpmEl.textContent = mins > 0.02 ? Math.round(charsDone / 5 / mins) : 0;
        accEl.textContent = keysAll ? Math.round((keysOk / keysAll) * 100) + '%' : '100%'; stgEl.textContent = stage;
      }
      function setup() {
        if (idx >= items.length) return finish();
        item = items[idx]; ctx.hud.progress(idx / items.length);
        target = EP.spellKey(item).toLowerCase(); pos = 0; fails = 0; fuel = 0; shown = D === 'easy'; wordStarted = false;
        card.innerHTML = ''; const pic = EP.pic(item);
        card.append(...[u.el('button', { class: 'rt-say', title: 'Listen 再聽一次', onclick: () => ctx.say(item) }, '🔊'), pic ? u.el('div', { class: 'rt-pic' }, pic) : null, u.el('div', { class: 'rt-zh' }, item.zh)].filter(Boolean));
        msg.textContent = D === 'hard' ? 'Listen and type! 聽音打字' : 'Type the word 打出英文單字 ⌨️';
        phase = 'typing'; renderWord(); layout();
        ctx.timeout(() => ctx.say(item), 250);
      }
      function press(k) { const b = keyEls[k]; if (!b) return; b.classList.add('down'); ctx.timeout(() => b.classList.remove('down'), 110); }
      function type(k) {
        if (phase !== 'typing' || ctx.paused) return;
        press(k); keysAll++; wordStarted = true;
        if (k === target[pos]) {
          keysOk++; pos++; fuel = pos / target.length; EP.sfx.tick();
          parts.burst(rx, ry + RS * 0.45, u.pick(['#ffd43b', '#ff922b', '#fff3bf']), 6, 120);
          if (pos >= target.length) { charsDone += target.length; renderWord(); updateStats(); return success(); }
          renderWord();
        } else {
          fails++; EP.sfx.wrong(); flash = 0.35; ctx.shake(word); word.classList.add('bad');
          const sp = word.children[pos]; if (sp) { sp.classList.add('err'); sp.textContent = k; }
          for (let i = 0; i < 8; i++) smoke.push({ x: rx + u.rand(-RS * 0.2, RS * 0.2), y: ry + RS * 0.5, r: RS * 0.08, vy: u.rand(-30, 10), vx: u.rand(-40, 40), t: 0 });
          phase = 'oops';
          if (fails >= 2) return failWord();
          if (D === 'normal') shown = true;
          msg.textContent = 'Oops! Start again 打錯了，從頭再來 🔁';
          ctx.timeout(() => { word.classList.remove('bad'); pos = 0; fuel = 0; phase = 'typing'; renderWord(); ctx.say(item); }, 600);
        }
        updateStats();
      }
      async function success() {
        phase = 'launch'; const ok = fails === 0;
        const b = word.getBoundingClientRect(), R = root.getBoundingClientRect();
        ctx.answer(item, ok, { x: b.left - R.left + b.width / 2, y: b.top - R.top - 10, points: 100 + target.length * 10 });
        stage++; altTo = (stage / items.length) * (ZONES.length - 1); launchT = 0;
        EP.sfx.whoosh(); EP.sfx.boom(); msg.textContent = '🚀 Lift off! 發射！';
        ctx.say(item);
        const waits = [ctx.wait(1900)];
        if (!ok) waits.push(ctx.wait(700).then(() => ctx.reveal(item)));
        else if (ctx.combo >= 3) ctx.burst(`🔥 ${ctx.combo} perfect words!`);
        await Promise.all(waits);
        const z = ZONES[Math.min(ZONES.length - 1, Math.round(alt))]; ctx.toast('🚀 ' + z.name);
        idx++; setup();
      }
      async function failWord() {
        phase = 'reveal'; msg.textContent = 'Let\'s learn it! 一起學起來 📖';
        ctx.answer(item, false, {});
        shown = true; pos = 0; renderWord();
        await ctx.reveal(item);
        word.classList.remove('bad'); idx++; setup();
      }
      function finish() {
        phase = 'done'; ctx.hud.progress(1); updateStats();
        const z = ZONES[Math.min(ZONES.length - 1, Math.round(altTo))];
        const end = u.el('div', { class: 'rt-end' }, u.el('div', { class: 'p' },
          u.el('div', { style: { fontSize: '3rem' } }, '👩‍🚀🚀'), u.el('div', { style: { fontSize: '1.5rem', fontWeight: 800, color: '#fff' } }, 'Mission Complete! 任務完成'),
          u.el('div', { class: 'row' }, u.el('div', {}, 'wpm', u.el('b', {}, wpmEl.textContent)), u.el('div', {}, 'acc', u.el('b', {}, accEl.textContent))),
          u.el('div', { style: { fontSize: '1.2rem' } }, 'You reached 抵達：', u.el('span', { style: { color: '#e2b714', fontWeight: 900 } }, z.name))));
        root.appendChild(end); EP.sfx.win(); ctx.confetti();
        ctx.timeout(() => ctx.end(), 3200);
      }

      // ---------- scene ----------
      function drawRocket(x, y, S) {
        g.save(); g.translate(x, y);
        const fl = launchT >= 0 ? 1.4 : fuel > 0 ? 0.35 + fuel * 0.6 : 0.12;
        const fh = S * fl * (0.85 + Math.random() * 0.3);
        if (fl > 0.1) {
          const gr = g.createLinearGradient(0, S * 0.42, 0, S * 0.42 + fh); gr.addColorStop(0, '#fff3bf'); gr.addColorStop(0.35, '#ffd43b'); gr.addColorStop(0.7, '#ff922b'); gr.addColorStop(1, 'rgba(255,80,40,0)');
          g.fillStyle = gr; g.beginPath(); g.moveTo(-S * 0.13, S * 0.42); g.quadraticCurveTo(0, S * 0.42 + fh * 1.2, S * 0.13, S * 0.42); g.fill();
        }
        g.fillStyle = '#868e96'; g.beginPath(); g.moveTo(-S * 0.14, S * 0.34); g.lineTo(S * 0.14, S * 0.34); g.lineTo(S * 0.18, S * 0.45); g.lineTo(-S * 0.18, S * 0.45); g.fill();
        g.fillStyle = '#e03131';
        for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.2, S * 0.05); g.lineTo(sx * S * 0.38, S * 0.4); g.lineTo(sx * S * 0.16, S * 0.36); g.fill(); }
        g.fillStyle = '#f8f9fa'; g.beginPath(); g.moveTo(0, -S * 0.5); g.bezierCurveTo(S * 0.3, -S * 0.3, S * 0.24, S * 0.2, S * 0.18, S * 0.36); g.lineTo(-S * 0.18, S * 0.36); g.bezierCurveTo(-S * 0.24, S * 0.2, -S * 0.3, -S * 0.3, 0, -S * 0.5); g.fill();
        g.save(); g.clip(); g.fillStyle = '#e03131'; g.fillRect(-S, -S, S * 2, S * 0.68); g.fillStyle = '#dee2e6'; g.fillRect(S * 0.06, -S, S, S * 2); g.restore();
        g.fillStyle = '#1c7ed6'; g.strokeStyle = '#adb5bd'; g.lineWidth = Math.max(2, S * 0.04); g.beginPath(); g.arc(0, -S * 0.08, S * 0.1, 0, 6.3); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-S * 0.03, -S * 0.11, S * 0.035, 0, 6.3); g.fill();
        g.fillStyle = '#e03131'; g.fillRect(-S * 0.025, S * 0.08, S * 0.05, S * 0.26);
        g.restore();
        // fuel gauge
        const gx = x + S * 0.5, gh = S * 0.8, gy = y - gh / 2, n = Math.max(1, target.length);
        g.fillStyle = 'rgba(0,0,0,.45)'; ctx.kit.roundRect(g, gx - 4, gy - 4, 22, gh + 8, 8); g.fill();
        for (let i = 0; i < n; i++) { const h = gh / n; g.fillStyle = i < pos ? (i / n < 0.5 ? '#ffd43b' : '#51cf66') : 'rgba(255,255,255,.15)'; g.fillRect(gx, gy + gh - (i + 1) * h + 1, 14, h - 2); }
        ctx.kit.emoji(g, '⛽', gx + 7, gy + gh + 18, 18);
      }
      ctx.loop((dt) => {
        dt = Math.max(0, dt); // the first frame can report a negative dt
        t += dt; parts.update(dt);
        if (launchT >= 0) { launchT += dt; if (launchT > 1.8) launchT = -1; }
        alt += (altTo - alt) * Math.min(1, dt * (launchT >= 0 ? 1.6 : 3));
        if (wordStarted && phase === 'typing') { typeTime += dt; if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) updateStats(); }
        const W = c.w, H = c.h, zi = Math.min(ZONES.length - 2, Math.floor(alt)), zf = alt - zi;
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, mix(ZONES[zi].a, ZONES[zi + 1].a, zf)); sky.addColorStop(1, mix(ZONES[zi].b, ZONES[zi + 1].b, zf));
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        const sa = u.clamp((alt - 1.8) / 2, 0, 1);
        if (sa > 0) for (const s of stars) { g.globalAlpha = sa * (0.6 + 0.4 * Math.sin(t * 2 + s.tw)); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x * W, ((s.y * H + alt * H * 0.35) % H), s.r, 0, 6.3); g.fill(); }
        g.globalAlpha = 1;
        const wy = (A) => ry + (alt - A) * H * 0.95;
        for (const sg of SIGHTS) { const y = wy(sg.A) - H * 0.25; if (y > -H && y < H * 2) ctx.kit.emoji(g, sg.e, sg.x * W, y, Math.min(W, H) * sg.s); }
        for (const cl of clouds) { const y = wy(cl.A); if (y < -60 || y > H + 60) continue; g.fillStyle = 'rgba(255,255,255,.85)'; const x = ((cl.x + t * 0.01) % 1.2) * W - W * 0.1, w = cl.w * W; g.beginPath(); g.ellipse(x, y, w / 2, w / 7, 0, 0, 6.3); g.ellipse(x - w * 0.15, y - w / 10, w / 4, w / 7, 0, 0, 6.3); g.fill(); }
        const gy = wy(0) + RS * 0.47;
        if (gy < H + 10) {
          g.fillStyle = '#69a84f'; g.fillRect(0, gy, W, H - gy + 200); g.fillStyle = '#5c9a42'; g.fillRect(0, gy, W, 10);
          g.fillStyle = '#495057'; g.fillRect(rx - RS * 0.9, gy - 8, RS * 1.8, 12);
          g.strokeStyle = '#fa5252'; g.lineWidth = 4; const tx = rx - RS * 0.55; g.beginPath(); g.moveTo(tx, gy - 8); g.lineTo(tx, gy - RS * 1.1); g.stroke();
          for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(tx - 10, gy - 8 - k * RS * 0.18); g.lineTo(tx, gy - 8 - (k + 1) * RS * 0.18); g.stroke(); }
          ctx.kit.emoji(g, '🏢', W * (land ? 0.36 : 0.86), gy - 26, 48); ctx.kit.emoji(g, '📡', W * (land ? 0.05 : 0.12), gy - 22, 40);
        }
        for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 30; if (s.t > 1) { smoke.splice(i, 1); continue; } g.fillStyle = `rgba(200,200,210,${0.6 * (1 - s.t)})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.3); g.fill(); }
        let ox = 0, oy = 0;
        if (phase === 'typing' && fuel > 0) { ox = (Math.random() - 0.5) * fuel * 4; oy = (Math.random() - 0.5) * fuel * 3; }
        if (launchT >= 0) { oy = -Math.sin(Math.min(1, launchT / 1.8) * Math.PI) * H * 0.12; if (Math.random() < 0.6) smoke.push({ x: rx + u.rand(-10, 10), y: ry + oy + RS * 0.6, r: RS * 0.1, vy: 60, vx: u.rand(-50, 50), t: 0 }); }
        drawRocket(rx + ox, ry + oy, RS);
        if (flash > 0) { flash -= dt; g.fillStyle = `rgba(224,49,49,${flash})`; g.fillRect(0, 0, W, H); }
        parts.draw(g);
      });

      ready = true; layout(); setup();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { let guard = 40; while (phase === 'typing' && guard--) type(target[pos]); },
          wrong() { if (phase !== 'typing') return; const want = target[pos]; type(want === 'q' ? 'z' : 'q'); },
        },
      };
    },
  });
})();
