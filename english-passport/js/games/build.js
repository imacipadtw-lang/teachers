/* Level 24 — Storm Builder (inspired by Fortnite: fast building + the shrinking storm circle)
 * Reykjavik, Iceland. The example sentence is split into word blocks (punctuation stays on the word) that appear as
 * building pieces in random order. Tap them in order to build a ramp left-to-right; the target word is gold.
 * A purple storm circle slowly closes as a soft timer (finish first = bonus; it never eliminates anyone).
 * One ctx.answer per sentence (correct if built with at most 1 wrong tap). Easy: the first half is pre-built. */
(function () {
  const EP = window.EP, u = EP.u;
  const CSS = `
  .sb-top{position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:6;display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap;justify-content:center;background:rgba(255,255,255,.95);color:#1d2340;border-radius:20px;padding:8px 14px;box-shadow:0 6px 0 rgba(0,0,0,.2);width:max-content;max-width:calc(100% - 16px)}
  .sb-say{height:56px;min-width:56px;border-radius:28px;background:#4dabf7;color:#fff;font-size:1.05rem;font-weight:900;padding:0 14px;box-shadow:0 4px 0 #1971c2;display:flex;align-items:center;gap:4px}
  .sb-say.w{background:#fab005;box-shadow:0 4px 0 #e67700}
  .sb-zh{font-size:1.35rem;font-weight:900;font-family:var(--font-zh);text-align:center}
  .sb-tag{font-size:1rem;font-weight:800;color:#e67700;background:#fff3bf;border-radius:999px;padding:2px 10px}
  .sb-tray{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;padding:12px 10px 14px;background:linear-gradient(rgba(16,24,64,0),rgba(16,24,64,.55) 30%)}
  .sb-p{min-height:62px;min-width:62px;padding:6px 16px;border-radius:10px;font-weight:900;font-size:1.45rem;color:#3b2410;background:repeating-linear-gradient(0deg,#d39d5e 0 11px,#c08a4d 11px 13px);border:3px solid #7a4e22;box-shadow:0 5px 0 #6b4219,inset 0 2px 0 rgba(255,255,255,.35);touch-action:manipulation;animation:sbIn .3s backwards}
  .sb-p.gold{background:repeating-linear-gradient(0deg,#ffe066 0 11px,#fcc419 11px 13px);border-color:#e67700;box-shadow:0 5px 0 #c25e00,0 0 16px rgba(255,212,59,.8)}
  .sb-p.hint{outline:4px solid #4dabf7;animation:sbHint .7s infinite alternate}
  .sb-p.bad{animation:shake .35s;background:#ff8787;border-color:#c92a2a}
  .sb-p.used{visibility:hidden}
  @keyframes sbIn{from{transform:translateY(40px) scale(.6);opacity:0}}
  @keyframes sbHint{to{box-shadow:0 5px 0 #6b4219,0 0 22px #4dabf7}}
  .sb-vic{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(40,10,80,.45);pointer-events:none}
  .sb-vic .t{font-size:clamp(2.4rem,9vw,4.6rem);font-weight:900;color:#ffd43b;text-shadow:0 5px 0 #7048e8,0 0 30px rgba(255,212,59,.7);animation:comboAnim 1.2s ease-out backwards;transform:none;text-align:center;line-height:1}
  .sb-vic .s{font-size:1.4rem;font-weight:900;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.4)}`;

  EP.registerGame({
    id: 'build', level: 24, icon: '🌋', title: 'Storm Builder', titleZh: '暴風建築師',
    model: 'Fortnite 要塞英雄（快速建築＋縮小的暴風圈）',
    howZh: '聽句子、看中文，照順序點單字積木蓋出斜坡！金色積木是今天的單字。紫色暴風圈縮小前蓋好有額外加分。',
    howEn: 'Tap the word blocks in order to build the sentence ramp. Beat the storm for a bonus!',
    skills: ['listening', 'reading', 'sentence'],
    start(ctx) {
      const root = ctx.root, D = ctx.difficulty;
      root.style.background = '#0f1c4d';
      root.appendChild(u.el('style', {}, CSS));
      let ready = false;
      const c = ctx.kit.canvas(root, () => ready && layout()); const g = c.g; const parts = ctx.kit.particles();
      const top = u.el('div', { class: 'sb-top' }); const tray = u.el('div', { class: 'sb-tray' }); root.append(top, tray);
      const STORM_T = D === 'easy' ? 45 : D === 'hard' ? 25 : 35;

      const items = ctx.items; let idx = 0, item = null, words = [], gold = new Set(), pos = 0, wrongs = 0, phase = 'busy', btns = [];
      let t = 0, stormT = 0, stormHit = false, pieces = [], fs = 28, ph = 50, zone = { x: 0, y: 0, w: 100, h: 100 }, slots = [], builder = { x: 0, y: 0, fx: 0, fy: 0, k: 1 };
      const aurora = Array.from({ length: 3 }, (_, i) => ({ ph: i * 2, c: ['rgba(99,230,190,', 'rgba(151,117,250,', 'rgba(105,219,124,'][i] }));

      function layout() {
        if (!top.isConnected) return;
        const R = root.getBoundingClientRect(), tb = top.getBoundingClientRect(), rb = tray.getBoundingClientRect();
        zone = { x: 10, y: tb.bottom - R.top + 10, w: c.w - 20, h: Math.max(80, rb.top - tb.bottom - 16) };
        if (!words.length) return;
        // fit the ramp in the zone
        let size = Math.min(zone.w > 700 ? 42 : 34, Math.max(20, zone.h / 5.2)); g.font = `900 ${size}px 'Baloo 2',sans-serif`;
        const meas = () => words.map((w) => g.measureText(w).width + size * 1.1);
        let ws = meas(); const gap = 4; let total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
        const room = zone.w - 30 - size * 1.4; if (total > room) { size = Math.max(16, size * room / total); g.font = `900 ${size}px 'Baloo 2',sans-serif`; ws = meas(); total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1); }
        fs = size; ph = size * 1.9; const rise = Math.min(ph * 0.6, (zone.h - ph * 2.4) / Math.max(1, words.length - 1));
        const baseY = zone.y + zone.h - ph * 0.55, lead = size * 1.4; let x = zone.x + lead + (zone.w - lead - total) / 2;
        slots = ws.map((w, i) => { const s = { x, y: baseY - ph - i * Math.max(6, rise), w, h: ph }; x += w + gap; return s; });
        pieces.forEach((p) => { const s = slots[p.i]; p.x = s.x; p.y = s.y; });
        placeBuilder(true);
      }
      function placeBuilder(now) {
        const s = pos > 0 ? slots[pos - 1] : null; const gy = zone.y + zone.h - ph * 0.55;
        const tx = s ? s.x + s.w / 2 : (slots[0] ? Math.max(zone.x + ph * 0.35, slots[0].x - ph * 0.5) : zone.x + 40), ty = s ? s.y : gy;
        if (now) { builder.x = builder.fx = tx; builder.y = builder.fy = ty; builder.k = 1; } else { builder.fx = builder.x; builder.fy = builder.y; builder.tx = tx; builder.ty = ty; builder.k = 0; }
        if (now) { builder.tx = tx; builder.ty = ty; }
      }

      function setup() {
        if (idx >= items.length) return finish();
        item = items[idx]; ctx.hud.progress(idx / items.length);
        words = item.sentence.trim().split(/\s+/); pos = 0; wrongs = 0; pieces = []; stormT = 0; stormHit = false;
        // which blocks hold the target word?
        gold = new Set(); const cz = EP.cloze(item); let at = 0;
        words.forEach((w, i) => { const st = item.sentence.indexOf(w, at); at = st + w.length; if (cz && st < cz.start + cz.text.length && st + w.length > cz.start) gold.add(i); });
        if (!gold.size) { const key = u.norm(item.word); words.forEach((w, i) => { if (u.norm(w.replace(/[,.!?]/g, '')) === key) gold.add(i); }); }
        top.innerHTML = '';
        top.append(u.el('button', { class: 'sb-say', title: 'Sentence 聽句子', onclick: () => ctx.say(item, { sentence: true }) }, '🔊 ', u.el('span', {}, 'Sentence')),
          u.el('button', { class: 'sb-say w', title: 'Word 聽單字', onclick: () => ctx.say(item) }, '🔊 ', u.el('span', {}, item.word)),
          u.el('div', { class: 'sb-zh' }, item.sentenceZh, ' ', u.el('span', { class: 'sb-tag' }, `⭐ ${item.word} = ${item.zh}`)));
        tray.innerHTML = '';
        const extra = D === 'hard' ? ctx.distractors(item, 1, {}).map((w) => w.word.replace(/[.!?]$/, '')).filter((w) => !words.some((x) => u.norm(x) === u.norm(w))).slice(0, 1) : [];
        const order = u.shuffle(words.map((w, i) => ({ w, i })).concat(extra.map((w) => ({ w, i: -1 }))));
        btns = order.map((o, k) => {
          const b = u.el('button', { class: 'sb-p' + (gold.has(o.i) ? ' gold' : ''), style: { animationDelay: k * 0.06 + 's' } }, o.w);
          b._w = o.w; b._i = o.i; ctx.on(b, 'click', () => tap(b)); tray.appendChild(b); return b;
        });
        layout();
        if (D === 'easy') { const pre = Math.floor(words.length / 2); for (let i = 0; i < pre; i++) tap(btns.find((b) => !b._used && u.norm(b._w) === u.norm(words[pos])), true); }
        placeBuilder(true);
        phase = 'build'; ctx.hud.extra('🌀 ' + STORM_T);
        ctx.timeout(() => ctx.say(item, { sentence: true }), 350);
      }
      function tap(b, silent) {
        if (!b || b._used || (phase !== 'build' && !silent) || ctx.paused) return;
        const want = words[pos];
        if (u.norm(b._w) === u.norm(want) && b._i !== -1) {
          b._used = true; b.classList.add('used'); b.classList.remove('hint');
          const R = root.getBoundingClientRect(), r = b.getBoundingClientRect(); const s = slots[pos];
          pieces.push({ i: pos, w: words[pos], gold: gold.has(pos), x: s.x, y: s.y, sx: r.left - R.left + r.width / 2 - s.w / 2, sy: r.top - R.top, k: silent ? 1 : 0, built: silent ? 1 : 0 });
          pos++;
          if (!silent) { EP.sfx.pop(); EP.sfx.click(); }
          placeBuilder(!!silent);
          if (pos >= words.length && !silent) ctx.timeout(complete, 380);
        } else {
          wrongs++; EP.sfx.wrong(); b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); ctx.timeout(() => b.classList.remove('bad'), 400);
          const R = root.getBoundingClientRect(), r = b.getBoundingClientRect(); ctx.float(r.left - R.left + r.width / 2, r.top - R.top - 10, '✗', 'bad');
          if (wrongs >= 2) { const nb = btns.find((x) => !x._used && u.norm(x._w) === u.norm(words[pos]) && x._i !== -1); nb && nb.classList.add('hint'); }
        }
      }
      async function complete() {
        if (phase !== 'build') return; phase = 'done';
        const ok = wrongs <= 1, beat = !stormHit; const s = slots[slots.length - 1];
        ctx.answer(item, ok, { x: s.x + s.w / 2, y: s.y - 30, points: 100 + (beat && ok ? 50 : 0) });
        for (const p of pieces) parts.burst(p.x + slots[p.i].w / 2, p.y + ph / 2, u.pick(['#ffd43b', '#d39d5e', '#74c0fc', '#b197fc']), 8, 200);
        if (ok && beat) { ctx.burst('Storm dodged! 躲過暴風圈 +50'); EP.sfx.coin(); }
        if (!ok) { await ctx.reveal(item, { sentence: true }); } else await ctx.say(item, { sentence: true });
        idx++; ctx.timeout(setup, 500);
      }
      function finish() {
        phase = 'end'; ctx.hud.progress(1); ctx.hud.extra(''); tray.innerHTML = ''; top.innerHTML = '';
        top.append(u.el('div', { class: 'sb-zh' }, '🏗️ All sentences built! 全部句子蓋好了！'));
        root.appendChild(u.el('div', { class: 'sb-vic' }, u.el('div', { style: { fontSize: '4rem' } }, '🦙🎉'), u.el('div', { class: 't' }, '#1 Victory Builder!'), u.el('div', { class: 's' }, '勝利建築師！')));
        EP.sfx.win(); ctx.confetti(); ctx.timeout(() => ctx.end(), 3000);
      }

      // ---------- drawing ----------
      function drawPiece(x, y, w, h, word, isGold, built, alpha) {
        g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
        g.fillStyle = 'rgba(77,171,247,.25)'; g.strokeStyle = '#74c0fc'; g.lineWidth = 2; ctx.kit.roundRect(g, x, y, w, h, 6); g.fill(); g.stroke();
        if (built > 0) {
          g.save(); g.beginPath(); g.rect(x - 2, y + h * (1 - built) - 2, w + 4, h * built + 4); g.clip();
          g.fillStyle = isGold ? '#fcc419' : '#c8925a'; ctx.kit.roundRect(g, x, y, w, h, 6); g.fill();
          g.fillStyle = isGold ? 'rgba(255,240,150,.7)' : 'rgba(255,255,255,.18)'; for (let k = 1; k < 4; k++) g.fillRect(x + 3, y + (h * k) / 4 - 1, w - 6, 2);
          g.strokeStyle = isGold ? '#e67700' : '#7a4e22'; g.lineWidth = 3; ctx.kit.roundRect(g, x, y, w, h, 6); g.stroke();
          g.fillStyle = '#5c3a16'; for (const [px, py] of [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]) { g.beginPath(); g.arc(x + px, y + py, 2.2, 0, 6.3); g.fill(); }
          ctx.kit.text(g, word, x + w / 2, y + h / 2 + 1, fs, isGold ? '#5c3300' : '#3b2410');
          g.restore();
        }
        g.restore();
      }
      ctx.loop((dt) => {
        dt = Math.max(0, dt); // the first frame can report a negative dt
        t += dt; parts.update(dt);
        const W = c.w, H = c.h;
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0f1c4d'); sky.addColorStop(0.45, '#3b5bdb'); sky.addColorStop(0.75, '#91a7ff'); sky.addColorStop(1, '#d0ebff');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        for (const a of aurora) { g.fillStyle = a.c + '0.22)'; g.beginPath(); g.moveTo(0, H * 0.08); for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.1 + Math.sin(x / 90 + t * 0.6 + a.ph) * 26 + a.ph * 9); for (let x = W; x >= 0; x -= 20) g.lineTo(x, H * 0.22 + Math.sin(x / 70 + t * 0.5 + a.ph) * 30 + a.ph * 9); g.fill(); }
        const gy = zone.y + zone.h - ph * 0.55;
        ctx.kit.emoji(g, '🌋', W * 0.84, gy - Math.min(W, H) * 0.09, Math.min(W, H) * 0.24);
        g.fillStyle = '#5c7cfa'; g.beginPath(); g.moveTo(0, gy - 20); g.lineTo(W * 0.18, gy - 70); g.lineTo(W * 0.32, gy - 20); g.fill();
        g.fillStyle = '#4dabf7'; g.fillRect(0, gy + 8, W, H);
        g.fillStyle = '#f3d9a4'; g.beginPath(); g.ellipse(W / 2, gy + 12, W * 0.48, 34, 0, 0, 6.3); g.fill();
        g.fillStyle = '#69b34c'; g.beginPath(); g.ellipse(W / 2, gy + 6, W * 0.45, 26, 0, 0, 6.3); g.fill();
        // supports + pieces
        for (const p of pieces) {
          p.k = Math.min(1, p.k + dt / 0.28); const e = 1 - Math.pow(1 - p.k, 3);
          const x = p.sx + (p.x - p.sx) * e, y = p.sy + (p.y - p.sy) * e - Math.sin(e * Math.PI) * 60;
          if (p.k >= 1 && p.built < 1) { if (p.built === 0) parts.burst(p.x + slots[p.i].w / 2, p.y + ph, '#d39d5e', 10, 160); p.built = Math.min(1, p.built + dt / 0.22); }
          if (p.k >= 1) { g.fillStyle = 'rgba(122,78,34,.55)'; const s = slots[p.i]; g.fillRect(s.x + s.w * 0.15, s.y + ph, s.w * 0.12, gy - s.y - ph + 4); g.fillRect(s.x + s.w * 0.73, s.y + ph, s.w * 0.12, gy - s.y - ph + 4); }
          drawPiece(x, y, slots[p.i].w, ph, p.w, p.gold, p.k >= 1 ? p.built : 1);
        }
        if (phase === 'build' && slots[pos]) { const s = slots[pos]; g.setLineDash([6, 5]); drawPiece(s.x, s.y, s.w, ph, '', false, 0, 0.6 + 0.4 * Math.sin(t * 6)); g.setLineDash([]); }
        // builder hops up the ramp
        builder.k = Math.min(1, builder.k + dt / 0.35); const bk = builder.k;
        builder.x = builder.fx + (builder.tx - builder.fx) * bk; builder.y = builder.fy + (builder.ty - builder.fy) * bk - Math.sin(bk * Math.PI) * ph * 0.8;
        ctx.kit.emoji(g, stormHit && phase === 'build' ? '☂️' : '🔨', builder.x + ph * 0.42, builder.y - ph * 0.75 + Math.sin(t * 10) * 2, ph * 0.45);
        ctx.kit.emoji(g, '👷', builder.x, builder.y - ph * 0.45, ph * 0.85);
        // the storm
        if (phase === 'build' && !ctx.paused) { stormT += dt; const left = Math.max(0, Math.ceil(STORM_T - stormT)); if (Math.floor(stormT * 4) !== Math.floor((stormT - dt) * 4)) ctx.hud.extra(left ? '🌀 ' + left : '🌀 ☂️'); if (!stormHit && stormT >= STORM_T) { stormHit = true; ctx.toast('🌀 The storm is here! Keep building 暴風圈來了，繼續蓋！'); EP.sfx.whoosh(); } }
        if (slots.length) {
          const cx = (slots[0].x + slots[slots.length - 1].x + slots[slots.length - 1].w) / 2, cy = (slots[0].y + gy) / 2;
          const rmin = Math.max((slots[slots.length - 1].x + slots[slots.length - 1].w - slots[0].x) / 2 + 30, ph * 2), rmax = Math.max(rmin + 60, Math.hypot(W, H) * 0.5);
          const p = u.clamp(stormT / STORM_T, 0, 1), r = rmin + (rmax - rmin) * (1 - p);
          g.save(); g.beginPath(); g.rect(0, 0, W, H); g.arc(cx, cy, r, 0, Math.PI * 2, true); g.fillStyle = `rgba(150,40,230,${0.34 + p * 0.16})`; g.fill('evenodd');
          g.strokeStyle = '#d0bfff'; g.lineWidth = 5; g.setLineDash([18, 10]); g.lineDashOffset = -t * 40; g.beginPath(); g.arc(cx, cy, r, 0, 6.3); g.stroke(); g.setLineDash([]); g.restore();
        }
        parts.draw(g);
      });

      ready = true; setup();
      return {
        destroy() { c.destroy(); },
        test: {
          correct() { let guard = 30; while (phase === 'build' && pos < words.length && guard--) tap(btns.find((b) => !b._used && b._i !== -1 && u.norm(b._w) === u.norm(words[pos]))); },
          wrong() { for (let k = 0; k < 2 && phase === 'build'; k++) { const b = btns.find((x) => !x._used && u.norm(x._w) !== u.norm(words[pos])); if (b) tap(b); } },
        },
      };
    },
  });
})();
