/* Level 6 — Samba Rhythm (inspired by Geometry Dash / osu!mania lanes + jazz chants: everything moves on the beat)
 * A synthesized samba groove plays (WebAudio, notes scheduled on the audio clock). Word notes fall in 3 lanes to the
 * hit line ON the beat; tap the lane whose word you heard when it reaches the line (Perfect / Good timing).
 * After a hit the samba dancer does the action and the word is chanted back (call & response). */
(function () {
  const EP = window.EP, u = EP.u;
  const LC = ['#ff4fa3', '#ffc531', '#2fd6a3'];
  const KEYS = [['1', 'a', 'j', 'arrowleft'], ['2', 's', 'k', 'arrowdown'], ['3', 'd', 'l', 'arrowright']];
  const PAT = {
    caixa: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    tam: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    agogo: ['H', 0, 0, 'L', 0, 0, 'H', 0, 'L', 0, 'L', 0, 'H', 0, 'L', 0],
    cav: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  };
  const CHORDS = [[261.6, 329.6, 392], [246.9, 293.7, 349.2, 392], [261.6, 329.6, 392], [220, 261.6, 329.6]];

  EP.registerGame({
    id: 'rhythm', level: 6, icon: '💃', title: 'Samba Rhythm', titleZh: '森巴節奏',
    model: 'Geometry Dash / osu! 節奏遊戲 + Jazz Chants 英語節奏唸謠',
    howZh: '跟著森巴鼓聲！聽到動詞後，等寫著那個字的音符落到線上時，點那一條（或按 1 2 3 / A S D）。踩在拍子上有 Perfect！',
    howEn: 'Listen to the verb, then tap its lane (or 1 2 3 / A S D) when the word lands on the line, right on the beat!',
    skills: ['listening', 'reading', 'meaning'],
    music: false,
    start(ctx) {
      const root = ctx.root, K = ctx.kit;
      const easy = ctx.difficulty === 'easy', hard = ctx.difficulty === 'hard';
      root.style.background = '#2a0b4d';
      root.appendChild(u.el('style', {}, `
        .rh-top{position:absolute;top:10px;left:0;right:0;display:flex;justify-content:center;z-index:6;pointer-events:none;padding:0 10px}
        .rh-card{pointer-events:auto;gap:12px;padding:8px 16px}
        .rh-card .pic{font-size:clamp(2.2rem,8vw,3rem)}
        .rh-card .zhs{white-space:nowrap}
        .rh-card .txt{font-size:clamp(1rem,3.6vw,1.35rem)}
        .rh-end{position:absolute;left:0;right:0;top:30%;text-align:center;color:#fff;font-weight:900;font-size:clamp(2rem,7vw,3.4rem);text-shadow:0 4px 0 rgba(0,0,0,.4);z-index:8;pointer-events:none}`));
      const c = K.canvas(root); const g = c.g; const parts = K.particles();
      const top = u.el('div', { class: 'rh-top' }); root.appendChild(top);
      let card = null;

      const BPM = (easy ? 84 : hard ? 116 : 100) * u.clamp(ctx.speed || 1, 0.7, 1.4);
      const bl = 60 / BPM, STEP = bl / 4, LEAD = hard ? 3 : 4;
      const PW = easy ? 0.12 : hard ? 0.07 : 0.09, GW = easy ? 0.26 : hard ? 0.15 : 0.19;
      const EARLY = Math.max(0.45, bl * 0.9), LATE = 0.3;

      /* ---------- audio clock + samba synth ---------- */
      const ac = EP.sfx.unlock && EP.sfx.unlock();
      let master = null, nbuf = null;
      const vol = EP.settings.music ? 0.55 : EP.settings.sfx ? 0.22 : 0;
      if (ac && vol > 0) {
        try {
          master = ac.createGain(); master.gain.value = vol; master.connect(ac.destination);
          nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        } catch (e) { master = null; }
      }
      let songT = 0, audioOff = 0, wasRunning = false, nextStep = 0;
      ctx.onPause((p) => { if (!p) wasRunning = false; });
      function osc(t, type, f0, f1, dur, v, dest) {
        const o = ac.createOscillator(), gn = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(gn).connect(dest || master); o.start(t); o.stop(t + dur + 0.02);
      }
      function noiseHit(t, dur, v, type, f) {
        const s = ac.createBufferSource(); s.buffer = nbuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const gn = ac.createGain();
        gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl).connect(gn).connect(master); s.start(t, Math.random() * 0.8, dur + 0.02);
      }
      function playStep(i, t) {
        const s = i % 16, bar = Math.floor(i / 16);
        if (s % 4 === 0) { const open = s === 4 || s === 12; osc(t, 'sine', open ? 98 : 120, open ? 50 : 72, open ? 0.5 : 0.16, open ? 0.85 : 0.4); }
        noiseHit(t, 0.05, PAT.caixa[s] ? 0.07 : 0.015, 'bandpass', 2600);
        noiseHit(t, 0.035, s % 4 === 3 ? 0.05 : 0.022, 'highpass', 6500);
        if (PAT.tam[s]) osc(t, 'triangle', 880, 640, 0.06, 0.07);
        if (PAT.agogo[s]) { const f = PAT.agogo[s] === 'H' ? 940 : 700; osc(t, 'sine', f, 0, 0.22, 0.07); osc(t, 'sine', f * 2.76, 0, 0.12, 0.02); }
        if (PAT.cav[s] && EP.settings.music) for (const f of CHORDS[bar % 4]) osc(t, 'sawtooth', f, 0, 0.16, 0.012);
      }
      function duck() { if (!master || !ac) return; const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(vol * 0.35, t, 0.03); master.gain.setTargetAtTime(vol, t + 0.9, 0.2); }
      function clock(dt) {
        const running = !!(ac && ac.state === 'running');
        if (running) { if (!wasRunning) audioOff = ac.currentTime - songT; songT = ac.currentTime - audioOff; } else songT += dt;
        wasRunning = running;
        if (running && master) {
          while (nextStep * STEP < songT + 0.15) { const at = nextStep * STEP + audioOff; if (at >= ac.currentTime - 0.01) playStep(nextStep, Math.max(at, ac.currentTime)); nextStep++; }
        } else nextStep = Math.ceil(songT / STEP);
      }

      /* ---------- layout ---------- */
      let W = 1, H = 1, land = true, LX = 0, LW = 100, laneTop = 120, hitY = 500, DX = 0, DY = 0, DS = 100, NH = 54;
      function geo() {
        W = c.w; H = c.h; land = W > H * 1.05;
        let topPad = 110; if (card) { const cr = card.getBoundingClientRect(), rr = root.getBoundingClientRect(); topPad = cr.bottom - rr.top + 10; }
        hitY = H - (land ? 104 : 112); NH = u.clamp(H * 0.07, 46, 60);
        if (land) { const tw = Math.min(W * 0.56, 660); LX = W * 0.04; LW = tw / 3; laneTop = topPad; DX = LX + tw + (W - LX - tw) / 2; DY = H * 0.62; DS = u.clamp(Math.min(W - LX - tw, H) * 0.42, 70, 180); }
        else { LX = 10; LW = (W - 20) / 3; DS = u.clamp(H * 0.1, 56, 90); DX = W * 0.22; DY = topPad + DS * 0.62; laneTop = topPad + DS * 1.3; }
      }
      const laneCx = (l) => LX + LW * (l + 0.5);

      /* ---------- phrases ---------- */
      const queue = ctx.items.slice(), requeued = new Set();
      let qi = 0, misses = 0, cur = null, notes = [], nextAt = null, state = 'play', judge = null, flash = [0, 0, 0], ring = [0, 0, 0];
      const dancer = { act: null, sad: 0 };
      function showPrompt(item) {
        const pic = EP.pic(item); top.innerHTML = '';
        card = u.el('div', { class: 'prompt-card rh-card' },
          u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(item); } }, '🔊'),
          hard ? null : pic ? u.el('div', { class: 'pic' }, pic) : null,
          hard ? null : !pic || easy ? u.el('div', { class: 'zhs zh' }, item.zh) : null,
          u.el('div', { class: 'txt' }, hard ? '🎧 Listen & tap on the beat! 聽音點拍' : '🥁 Tap the word on the beat! 跟著節拍點字'));
        top.appendChild(card);
      }
      function startPhrase() {
        if (qi >= queue.length) return finish();
        ctx.hud.progress(qi / queue.length);
        const item = queue[qi], n = easy ? 2 : 3;
        const words = u.shuffle([item].concat(ctx.distractors(item, n - 1)));
        const lanes = [null, null, null]; const use = n === 3 ? [0, 1, 2] : u.shuffle([0, 1, 2]).slice(0, 2).sort();
        use.forEach((l, i) => (lanes[l] = words[i]));
        const S = Math.ceil((songT / bl + 0.5) / 4) * 4;
        cur = { item, lanes, right: lanes.indexOf(item), tHit: (S + 2 + LEAD) * bl, judged: false, auto: null };
        lanes.forEach((w, l) => { if (w) notes.push({ l, w, tHit: cur.tHit, st: 'live', t: 0, ph: cur }); });
        showPrompt(item);
        ctx.timeout(() => { if (!ctx.paused) { duck(); ctx.say(item); } }, Math.max(0, (S * bl - songT) * 1000 - 40));
      }
      function tap(l) {
        if (ctx.paused || state !== 'play') return;
        flash[l] = 1;
        if (!cur || cur.judged) return;
        const dt = songT - cur.tHit; if (dt < -EARLY || dt > LATE) return;
        const w = cur.lanes[l]; if (!w) return;
        cur.judged = true;
        const note = notes.find((n) => n.ph === cur && n.l === l), x = laneCx(l);
        notes.forEach((n) => { if (n.ph === cur && n !== note) n.st = 'missed'; });
        if (w === cur.item) {
          const a = Math.abs(dt), q = a <= PW ? ['PERFECT!', 150, '#ffd43b'] : a <= GW ? ['GOOD!', 110, '#69db7c'] : [dt < 0 ? 'EARLY' : 'LATE', 80, '#74c0fc'];
          ctx.answer(cur.item, true, { x, y: hitY - NH * 1.6, points: q[1] });
          judge = { text: q[0], col: q[2], t: 0, x };
          if (note) note.st = 'hit'; ring[l] = 1;
          parts.burst(x, hitY, LC[l], 26, 340); parts.burst(x, hitY, '#fff', 10, 220);
          const item = cur.item; dancer.act = { item, t: 0 }; misses = 0; qi++;
          ctx.timeout(() => { if (!ctx.paused) { duck(); ctx.say(item); } }, Math.max(0, ((Math.floor(songT / bl) + 1) * bl - songT) * 1000));
          nextAt = songT + bl * 1.5;
        } else {
          if (note) note.st = 'broken';
          judge = { text: 'OOPS!', col: '#ff8787', t: 0, x }; dancer.sad = 1.2;
          ctx.answer(cur.item, false, { x, y: hitY - NH * 1.6, label: '✗ ' + w.word });
          fail(cur.item);
        }
      }
      async function fail(item) {
        state = 'reveal'; ctx.shake();
        await ctx.wait(300);
        await ctx.reveal(item);
        if (!requeued.has(item.id)) { requeued.add(item.id); queue.push(item); }
        qi++; misses = 0; state = 'play'; startPhrase();
      }
      function finish() {
        state = 'done'; cur = null; ctx.hud.progress(1); top.innerHTML = '';
        dancer.act = { item: null, t: 0 }; EP.sfx.win(); ctx.confetti();
        root.appendChild(u.el('div', { class: 'rh-end' }, '🎉 Samba Star! 🎉', u.el('div', { class: 'zh', style: { fontSize: '.5em' } }, '森巴節奏之星！')));
        ctx.timeout(() => ctx.end(), 3000);
      }

      /* ---------- input ---------- */
      ctx.on(window, 'keydown', (e) => { const k = e.key.toLowerCase(); const l = KEYS.findIndex((ks) => ks.includes(k)); if (l >= 0 && !e.repeat) { tap(l); e.preventDefault(); } });
      ctx.on(c.cv, 'pointerdown', (e) => {
        const r = c.cv.getBoundingClientRect(), x = e.clientX - r.left;
        const l = Math.floor((x - LX) / LW); if (l >= 0 && l < 3) tap(l);
      });

      /* ---------- loop ---------- */
      const lights = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), p: Math.random() * 6, c: u.pick(LC) }));
      ctx.loop((dt) => {
        clock(dt); geo();
        const beat = songT / bl, ph = ((beat % 1) + 1) % 1;
        if (state === 'play' && nextAt != null && songT >= nextAt) { nextAt = null; startPhrase(); }
        if (state === 'play' && cur && !cur.judged) {
          if (cur.auto != null && songT >= cur.tHit - 0.02) tap(cur.auto);
          else if (songT > cur.tHit + LATE) {
            cur.judged = true; misses++; dancer.sad = 1; judge = { text: 'MISS', col: '#adb5bd', t: 0, x: W / 2 };
            notes.forEach((n) => { if (n.ph === cur) n.st = 'missed'; });
            if (misses < 2) { ctx.float(land ? LX + LW * 1.5 : W / 2, hitY - NH * 2.2, '🔁 Listen again! 再聽一次', 'bad'); nextAt = songT + bl; }
            else { ctx.answer(cur.item, false, { x: W / 2, y: hitY - NH * 1.6, label: 'Missed 沒點到' }); fail(cur.item); }
          }
        }
        for (const n of notes) n.t += n.st === 'live' ? 0 : dt;
        notes = notes.filter((n) => n.t < 0.6 && hitY - (n.tHit - songT) * pps() < H + NH);
        for (let l = 0; l < 3; l++) { flash[l] = Math.max(0, flash[l] - dt * 5); ring[l] = Math.max(0, ring[l] - dt * 3); }
        if (judge) judge.t += dt;
        if (dancer.act) dancer.act.t += dt / bl;
        dancer.sad = Math.max(0, dancer.sad - dt);
        parts.update(dt);
        draw(beat, ph);
      });
      const pps = () => (hitY - laneTop) / (LEAD * bl);

      function draw(beat, ph) {
        const pulse = Math.pow(1 - ph, 3);
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a0b4d'); gr.addColorStop(0.6, '#6a1b6e'); gr.addColorStop(1, '#b8326b');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = `rgba(255,220,120,${0.07 * pulse})`; g.fillRect(0, 0, W, H);
        for (const s of [0, 1]) { // sweeping spotlights
          const ox = s ? W : 0, a = (s ? Math.PI * 0.75 : Math.PI * 0.25) + Math.sin(songT * 0.8 + s * 2) * 0.35, L = Math.hypot(W, H);
          g.fillStyle = s ? 'rgba(255,79,163,.13)' : 'rgba(47,214,163,.12)'; g.beginPath(); g.moveTo(ox, 0);
          g.lineTo(ox + Math.cos(a - 0.12) * L, Math.sin(a - 0.12) * L); g.lineTo(ox + Math.cos(a + 0.12) * L, Math.sin(a + 0.12) * L); g.fill();
        }
        for (const lt of lights) { g.globalAlpha = 0.35 + 0.35 * Math.sin(songT * 3 + lt.p); g.fillStyle = lt.c; g.beginPath(); g.arc(lt.x * W, lt.y * H * 0.9, 2.5, 0, 7); g.fill(); }
        g.globalAlpha = 1;
        for (let i = 0; i < W / 34 + 1; i++) { g.fillStyle = LC[i % 3]; g.beginPath(); g.moveTo(i * 34, 0); g.lineTo(i * 34 + 34, 0); g.lineTo(i * 34 + 17, 18 + Math.sin(songT * 4 + i) * 2); g.fill(); }
        // lanes
        const tw = LW * 3;
        g.fillStyle = 'rgba(10,0,30,.45)'; K.roundRect(g, LX, laneTop - 10, tw, H - laneTop + 20, 18); g.fill();
        for (let l = 0; l < 3; l++) {
          if (flash[l]) { const lg = g.createLinearGradient(0, laneTop, 0, hitY); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, LC[l]); g.globalAlpha = flash[l] * 0.45; g.fillStyle = lg; g.fillRect(LX + l * LW, laneTop, LW, hitY - laneTop); g.globalAlpha = 1; }
          if (l) { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(LX + l * LW - 1, laneTop, 2, H - laneTop); }
        }
        // beat lines scrolling to the hit line
        const p = pps();
        for (let b = Math.floor(beat) - 1; b < beat + LEAD + 1; b++) {
          const y = hitY - (b * bl - songT) * p; if (y < laneTop || y > hitY) continue;
          g.fillStyle = b % 4 === 0 ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.1)'; g.fillRect(LX + 6, y - (b % 4 === 0 ? 2 : 1), tw - 12, b % 4 === 0 ? 4 : 2);
        }
        // hit line + targets
        g.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * pulse})`; g.fillRect(LX + 4, hitY - 3, tw - 8, 6);
        const near = cur && !cur.judged && Math.abs(songT - cur.tHit) < EARLY;
        for (let l = 0; l < 3; l++) {
          const x = laneCx(l), r = NH * 0.62 * (1 + 0.1 * pulse + ring[l] * 0.5);
          g.strokeStyle = LC[l]; g.lineWidth = 5; g.beginPath(); g.arc(x, hitY, r, 0, 7); g.stroke();
          if (near && cur.lanes[l]) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x, hitY, r + 6 + 4 * Math.sin(songT * 20), 0, 7); g.stroke(); }
          const label = ['1 · A', '2 · S', '3 · D'][l];
          K.text(g, label, x, Math.min(H - 22, hitY + NH * 0.62 + 30), 18, 'rgba(255,255,255,.75)', { weight: 800 });
        }
        // notes (clipped to the lane area)
        g.save(); g.beginPath(); g.rect(LX, laneTop - 6, tw, H); g.clip();
        for (const n of notes) {
          const y = hitY - (n.tHit - songT) * p; if (y < laneTop - NH) continue;
          const x = laneCx(n.l), w = LW - 14;
          g.save(); g.translate(x, n.st === 'hit' ? hitY : y);
          if (n.st === 'hit') { const k = n.t / 0.6; g.scale(1 + k * 0.6, 1 + k * 0.6); g.globalAlpha = 1 - k; }
          else if (n.st === 'broken') { g.rotate(n.t * 2); g.globalAlpha = 1 - n.t / 0.6; }
          else if (n.st === 'missed') g.globalAlpha = 0.4;
          else if (y < laneTop) g.globalAlpha = Math.max(0, 1 - (laneTop - y) / NH);
          const col = n.st === 'broken' ? '#868e96' : LC[n.l];
          g.shadowColor = col; g.shadowBlur = near && n.ph === cur ? 18 : 6;
          g.fillStyle = col; K.roundRect(g, -w / 2, -NH / 2, w, NH, NH / 2); g.fill(); g.shadowBlur = 0;
          g.fillStyle = 'rgba(255,255,255,.35)'; K.roundRect(g, -w / 2 + 6, -NH / 2 + 4, w - 12, NH * 0.3, NH * 0.15); g.fill();
          const fs = K.fitSize(g, n.w.word, w - 18, Math.min(30, NH * 0.56), 16);
          K.text(g, n.w.word, 0, 2, fs, '#fff', { stroke: 'rgba(40,0,40,.55)', strokeW: 5 });
          g.restore();
        }
        g.restore();
        if (judge && judge.t < 0.7) {
          const k = judge.t / 0.7, s = 1 + (1 - k) * 0.5;
          g.globalAlpha = 1 - k * k; K.text(g, judge.text, land ? LX + tw / 2 : W / 2, hitY - NH * 2.4 - k * 30, Math.min(48, W * 0.1) * s, judge.col, { stroke: 'rgba(0,0,0,.5)' }); g.globalAlpha = 1;
        }
        parts.draw(g);
        drawDancer(beat, ph);
      }
      function drawDancer(beat, ph) {
        const bounce = Math.abs(Math.sin(ph * Math.PI)) * DS * 0.1, side = Math.floor(beat) % 2 ? 1 : -1;
        if (land) { // little stage with lights
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(DX, DY + DS * 0.62, DS * 0.95, DS * 0.2, 0, 0, 7); g.fill();
          for (let i = 0; i < 5; i++) { g.fillStyle = LC[(i + Math.floor(beat)) % 3]; g.beginPath(); g.arc(DX - DS * 0.8 + i * DS * 0.4, DY + DS * 0.62, 6, 0, 7); g.fill(); }
        }
        const act = dancer.act, spin = act && act.t < 1 ? act.t * Math.PI * 2 : 0;
        g.save(); g.translate(DX, DY - bounce); g.rotate(side * 0.12 + (dancer.sad ? 0 : spin));
        K.emoji(g, dancer.sad ? '🤷' : '💃', 0, 0, DS);
        g.restore();
        const AV = (EP.me && EP.me.avatar) || '🐼';
        g.save(); g.translate(DX + DS * 0.75, DY + DS * 0.25 - Math.abs(Math.sin((ph + 0.5) * Math.PI)) * DS * 0.08); g.rotate(-side * 0.15);
        K.emoji(g, AV, 0, 0, DS * 0.5); g.restore();
        if (act && act.item && act.t < 3) {
          const pic = EP.pic(act.item), a = act.t > 2.4 ? (3 - act.t) / 0.6 : 1, by = (land ? DY - DS * 0.95 : DY) - Math.abs(Math.sin(ph * Math.PI)) * 8;
          g.globalAlpha = a; g.font = `900 26px 'Baloo 2',sans-serif`;
          const txt = '♪ ' + act.item.word + '! ♪', tw = g.measureText(txt).width + (pic ? 44 : 0) + 24, bx = u.clamp(land ? DX - tw / 2 : DX + DS * 1.15, 6, W - tw - 6);
          g.fillStyle = '#fff'; K.roundRect(g, bx, by - 24, tw, 48, 24); g.fill();
          if (pic) K.emoji(g, pic, bx + 30, by, 32);
          K.text(g, txt, bx + (pic ? 44 : 0) + (tw - (pic ? 44 : 0)) / 2, by + 1, 26, '#6a1b6e');
          g.globalAlpha = 1;
        }
      }

      geo(); startPhrase();
      return {
        destroy() { c.destroy(); try { if (master) { master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.05); const m = master; setTimeout(() => { try { m.disconnect(); } catch (e) {} }, 400); } } catch (e) {} },
        test: {
          correct() { if (state === 'play' && cur && !cur.judged && cur.auto == null) cur.auto = cur.right; },
          wrong() { if (state === 'play' && cur && !cur.judged && cur.auto == null) { const l = [0, 1, 2].find((k) => k !== cur.right && cur.lanes[k]); if (l != null) cur.auto = l; } },
        },
      };
    },
  });
})();
