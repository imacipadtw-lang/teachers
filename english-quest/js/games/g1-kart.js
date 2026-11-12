/* Gate 1 · Turbo Talk Kart — say the vehicle to get a turbo boost (passport L1 transport, L7 ordinals) */
(function () {
  "use strict";
  TC.games = TC.games || {};
  const OLLIE = TC.artImg("ollie"), TOWER = TC.artImg("tower");
  const IM = {}; ["bus", "train", "taxi", "plane", "bike", "boat", "truck", "scooter", "tree", "star", "trophy"].forEach((n) => (IM[n] = TC.artImg(n)));

  let cv, ctx, W, H, raf = 0;
  const S = { lane: 0, laneX: 0, stars: [], got: 0, hint: 0, pos: 0, speed: 0, target: 0, boost: 0, curveX: 0, signs: [], finishAt: 0, rival: 0, rivalSpeed: 0, bubble: null, shake: 0, kidColor: "#ffc83d", kidName: "", place: 2, running: false, finished: false };
  const SEG = 220; // world units per stripe pair

  function curve(d) { return Math.sin(d / 1300) * 0.9 + Math.sin(d / 520 + 1) * 0.45; }

  function resize() {
    const r = Math.min(1, 1600 / innerWidth);
    W = cv.width = Math.round(innerWidth * r); H = cv.height = Math.round(innerHeight * r);
  }

  function draw(t) {
    raf = requestAnimationFrame(draw);
    const dt = 1 / 60;
    // physics
    S.speed += (S.target * (S.boost > 0 ? 2.4 : 1) - S.speed) * 0.05;
    if (S.boost > 0) S.boost -= dt;
    S.pos += S.speed * dt;
    S.rival += S.rivalSpeed * dt;
    if (S.shake > 0) S.shake -= dt;
    const y0 = H * 0.42, K = H * 0.9;
    const sx = S.shake > 0 ? (Math.random() - 0.5) * 10 : 0;
    ctx.save(); ctx.translate(sx, 0);
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, y0);
    g.addColorStop(0, "#2a1b6e"); g.addColorStop(0.55, "#ff6fa8"); g.addColorStop(1, "#ffcf6b");
    ctx.fillStyle = g; ctx.fillRect(-20, 0, W + 40, y0 + 2);
    // sun
    ctx.fillStyle = "rgba(255,240,180,.9)"; ctx.beginPath(); ctx.arc(W * 0.72, y0 * 0.62, H * 0.09, 0, 7); ctx.fill();
    // parallax mountains: one continuous ridge + a Fuji-like peak (Tokyo)
    const par = S.curveX * 0.25;
    ctx.fillStyle = "#5b3f9c"; ctx.beginPath(); ctx.moveTo(-20, y0);
    for (let x = -20; x <= W + 20; x += 8) { const wx = (x + par) * 0.004; ctx.lineTo(x, y0 - H * (0.045 + 0.03 * Math.sin(wx * 2.1) + 0.02 * Math.sin(wx * 5.3 + 1))); }
    ctx.lineTo(W + 20, y0); ctx.fill();
    const span = W * 1.8, fx = ((W * 0.28 - par) % span + span) % span - W * 0.4;
    ctx.fillStyle = "#43307e"; ctx.beginPath(); ctx.moveTo(fx - H * 0.32, y0); ctx.lineTo(fx - H * 0.045, y0 - H * 0.21); ctx.lineTo(fx + H * 0.045, y0 - H * 0.21); ctx.lineTo(fx + H * 0.32, y0); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(fx - H * 0.085, y0 - H * 0.155); ctx.lineTo(fx - H * 0.045, y0 - H * 0.21); ctx.lineTo(fx + H * 0.045, y0 - H * 0.21); ctx.lineTo(fx + H * 0.085, y0 - H * 0.155); ctx.lineTo(fx + H * 0.03, y0 - H * 0.172); ctx.lineTo(fx, y0 - H * 0.152); ctx.lineTo(fx - H * 0.03, y0 - H * 0.172); ctx.fill();
    { const tx = ((W * 0.82 - par * 0.6) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.2, th = H * 0.3; if (TOWER.complete) ctx.drawImage(TOWER, tx - th * 0.5, y0 - th, th, th); }
    // road, scanline by scanline
    const rows = []; let x = W / 2, dx = 0; const step = 2;
    S.curveX += curve(S.pos) * S.speed * dt * 1.2;
    for (let y = H; y > y0; y -= step) {
      const dy = y - y0, z = K / dy, d = S.pos + z * 60;
      dx += curve(d) * step * 0.0011; x += dx * step * 0.9;
      const half = (W * 0.62) * (dy / (H - y0));
      const stripe = Math.floor(d / SEG) % 2;
      ctx.fillStyle = stripe ? "#3cc46a" : "#33b35f"; ctx.fillRect(0, y - step, W, step + 1);
      ctx.fillStyle = stripe ? "#ff4b6b" : "#ffffff"; ctx.fillRect(x - half * 1.12, y - step, half * 2.24, step + 1);
      ctx.fillStyle = stripe ? "#5d6274" : "#575b6c"; ctx.fillRect(x - half, y - step, half * 2, step + 1);
      if (stripe) { ctx.fillStyle = "#ffe066"; ctx.fillRect(x - half * 0.02, y - step, half * 0.04, step + 1); }
      if (S.finishAt && Math.abs(d - S.finishAt) < 70) { const n = 12; for (let q = 0; q < n; q++) { ctx.fillStyle = (q + Math.floor(d / 35)) % 2 ? "#fff" : "#111"; ctx.fillRect(x - half + (2 * half / n) * q, y - step, 2 * half / n + 1, step + 1); } }
      rows.push({ y, x, half, d, dy });
    }
    // sprites (far → near)
    const spr = [];
    for (let i = 0; i < 30; i++) { // trees
      const d = Math.floor(S.pos / 600) * 600 + i * 600;
      spr.push({ d, side: i % 2 ? 1.5 : -1.5, img: IM.tree, s: 1.1 });
    }
    S.signs.forEach((sg) => !sg.done && spr.push({ d: sg.d, side: 0, sign: sg }));
    S.laneX += (S.lane - S.laneX) * 0.18;
    S.stars.forEach((st) => {
      if (st.done) return;
      const dz = st.d - S.pos;
      if (dz < 140 && dz > -40) { if (Math.abs(st.lane - S.laneX) < 0.5) { st.done = true; S.got++; TC.sfx("coin"); TC.floatText("+1 ★", 50 + st.lane * 18, 62, "#ffc83d"); } }
      if (!st.done && dz > -60) spr.push({ d: st.d, side: st.lane * 0.62, img: IM.star, s: 0.42, spin: true });
    });
    if (S.finishAt) spr.push({ d: S.finishAt, side: 0, banner: true });
    spr.push({ d: S.rival, side: -0.35, rival: true });
    spr.sort((a, b) => b.d - a.d);
    for (const s of spr) {
      const z = (s.d - S.pos) / 60; if (z <= 0.6 || z > 200) continue;
      const dy = K / z, y = y0 + dy; if (y > H + 200) continue;
      const row = rows.reduce((a, r) => (Math.abs(r.y - y) < Math.abs(a.y - y) ? r : a), rows[0]);
      const sc = dy / (H - y0);
      const px = row.x + s.side * row.half;
      if (s.img) { const sz = H * 0.5 * sc * s.s; if (s.img.complete) { if (s.spin) { const k = Math.abs(Math.cos(performance.now() / 260)); ctx.drawImage(s.img, px - (sz * k) / 2, y - sz * 1.3, sz * k, sz); } else ctx.drawImage(s.img, px - sz / 2, y - sz, sz, sz); } }
      else if (s.sign) drawSign(px, y, sc, s.sign);
      else if (s.banner) drawBanner(row.x, y, row.half);
      else if (s.rival) drawKart(px, y, sc * 0.9, "#9b6bff", "O", 0, true);
    }
    // player kart
    const tilt = Math.max(-0.12, Math.min(0.12, curve(S.pos) * 0.12));
    const roadHalfBottom = W * 0.62 * ((H * 0.8 - y0) / (H - y0));
    drawKart(W / 2 + S.laneX * roadHalfBottom * 0.62, H * 0.8, 1, S.kidColor, S.kidName[0] || "?", tilt + (S.lane - S.laneX) * 0.25, false);
    // star counter + lane hint
    if (S.running) {
      ctx.font = `700 ${H * 0.055}px Fredoka, sans-serif`; ctx.textAlign = "right"; ctx.lineWidth = H * 0.01; ctx.strokeStyle = "#0a1633"; ctx.fillStyle = "#ffc83d";
      ctx.strokeText(`★ ${S.got}`, W * 0.97, H * 0.2); ctx.fillText(`★ ${S.got}`, W * 0.97, H * 0.2);
      if (S.hint > 0 && !S.bubble) { S.hint -= dt; ctx.globalAlpha = Math.min(1, S.hint); ctx.textAlign = "center"; ctx.font = `700 ${H * 0.045}px Fredoka, "Microsoft JhengHei", sans-serif`; ctx.fillStyle = "#fff";
        ctx.strokeText("👈 點左右換車道，收集星星！ 👉", W / 2, H * 0.62); ctx.fillText("👈 點左右換車道，收集星星！ 👉", W / 2, H * 0.62); ctx.globalAlpha = 1; }
    }
    if (S.boost > 0 || S.speed > 900) speedLines();
    // bubble with the vehicle picture
    if (S.bubble) {
      const b = S.bubble; b.t = Math.min(1, b.t + 0.06);
      const r = H * 0.17 * easeOut(b.t), cx = W / 2, cy = H * 0.3;
      ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.lineWidth = H * 0.012; ctx.strokeStyle = "#4cc9ff"; ctx.stroke();
      const im = IM[b.img]; if (im && im.complete) ctx.drawImage(im, cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4);
      if (b.label) { ctx.font = `700 ${H * 0.06}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0a1633"; ctx.lineWidth = H * 0.012; ctx.strokeText(b.label, cx, cy + r + H * 0.07); ctx.fillText(b.label, cx, cy + r + H * 0.07); }
    }
    // place badge + speed
    ctx.font = `700 ${H * 0.07}px Fredoka, sans-serif`; ctx.textAlign = "left";
    const place = S.pos > S.rival ? 1 : 2; S.place = place;
    if (S.running) { ctx.fillStyle = place === 1 ? "#ffc83d" : "#fff"; ctx.strokeStyle = "#0a1633"; ctx.lineWidth = H * 0.01; const txt = place === 1 ? "1st" : "2nd"; ctx.strokeText(txt, W * 0.03, H * 0.2); ctx.fillText(txt, W * 0.03, H * 0.2); }
    ctx.restore();
  }
  const easeOut = (t) => 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.15;

  function speedLines() {
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = H * 0.004;
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, r1 = H * (0.35 + Math.random() * 0.3), r2 = r1 + H * 0.2;
      ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, H * 0.42 + Math.sin(a) * r1 * 0.6); ctx.lineTo(W / 2 + Math.cos(a) * r2, H * 0.42 + Math.sin(a) * r2 * 0.6); ctx.stroke();
    }
  }

  function drawSign(x, y, sc, sg) {
    const w = H * 0.55 * sc, hgt = w * 0.95;
    ctx.fillStyle = "#222"; ctx.fillRect(x - w * 0.55, y - hgt * 1.25, w * 0.06, hgt * 1.25); ctx.fillRect(x + w * 0.49, y - hgt * 1.25, w * 0.06, hgt * 1.25);
    ctx.fillStyle = "#ffc83d"; roundRect(x - w * 0.55, y - hgt * 1.6, w * 1.1, hgt * 0.6, w * 0.08); ctx.fill();
    ctx.fillStyle = "#0a1633"; ctx.font = `700 ${hgt * 0.42}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.fillText("?", x, y - hgt * 1.15);
  }
  function drawBanner(x, y, half) {
    const top = y - half * 0.9;
    ctx.fillStyle = "#222"; ctx.fillRect(x - half * 1.15, top, half * 0.05, half * 0.9); ctx.fillRect(x + half * 1.1, top, half * 0.05, half * 0.9);
    const bw = half * 2.3, bh = half * 0.22, n = 16;
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? "#111" : "#fff"; ctx.fillRect(x - half * 1.15 + (bw / n) * i, top + (bh / 2) * j, bw / n + 1, bh / 2 + 1); }
    ctx.fillStyle = "#ffc83d"; ctx.font = `700 ${bh * 0.9}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.fillText("FINISH", x, top - bh * 0.25);
  }
  function roundRect(x, y, w, hh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawKart(x, y, sc, color, letter, tilt, rival) {
    const u = H * 0.0028 * sc * (rival ? 1 : 0.62);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(0, 0, 70 * u, 14 * u, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; roundRect(-66 * u, -38 * u, 30 * u, 36 * u, 6 * u); ctx.fill(); roundRect(36 * u, -38 * u, 30 * u, 36 * u, 6 * u); ctx.fill();
    const gb = ctx.createLinearGradient(0, -62 * u, 0, -12 * u); gb.addColorStop(0, "#ffffff"); gb.addColorStop(0.12, color); gb.addColorStop(1, "rgba(0,0,0,.45)");
    ctx.fillStyle = color; roundRect(-48 * u, -62 * u, 96 * u, 50 * u, 16 * u); ctx.fill(); ctx.fillStyle = gb; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,.45)"; roundRect(-40 * u, -58 * u, 80 * u, 10 * u, 5 * u); ctx.fill();
    ctx.fillStyle = "#26293a"; roundRect(-60 * u, -78 * u, 120 * u, 10 * u, 4 * u); ctx.fill(); ctx.fillRect(-46 * u, -70 * u, 8 * u, 12 * u); ctx.fillRect(38 * u, -70 * u, 8 * u, 12 * u);
    ctx.fillStyle = "#8a94b8"; ctx.beginPath(); ctx.arc(-22 * u, -18 * u, 6 * u, 0, 7); ctx.arc(22 * u, -18 * u, 6 * u, 0, 7); ctx.fill();
    ctx.fillStyle = "#0a1633"; roundRect(-56 * u, -30 * u, 112 * u, 12 * u, 5 * u); ctx.fill();
    // driver helmet
    const gh = ctx.createRadialGradient(-9 * u, -92 * u, 2 * u, 0, -82 * u, 28 * u); gh.addColorStop(0, "#ffffff"); gh.addColorStop(0.5, rival ? "#8fa2ff" : "#eef2ff"); gh.addColorStop(1, rival ? "#4a5bc0" : "#9aa6cf");
    ctx.fillStyle = gh; ctx.beginPath(); ctx.arc(0, -82 * u, 26 * u, 0, 7); ctx.fill();
    if (rival && OLLIE.complete) ctx.drawImage(OLLIE, -30 * u, -122 * u, 60 * u, 70 * u);
    else { ctx.fillStyle = color; ctx.font = `700 ${30 * u}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(letter, 0, -80 * u); ctx.textBaseline = "alphabetic"; }
    if (!rival && S.boost > 0) { for (let i = 0; i < 2; i++) { const fx = (i ? 30 : -30) * u; ctx.fillStyle = Math.random() > 0.5 ? "#ffc83d" : "#ff5a5a"; ctx.beginPath(); ctx.moveTo(fx - 10 * u, -20 * u); ctx.lineTo(fx + 10 * u, -20 * u); ctx.lineTo(fx, (10 + Math.random() * 30) * u); ctx.fill(); } }
    ctx.restore();
  }

  async function driveTo(d, api) {
    // drive until the sign is just ahead, then brake
    S.target = 700;
    while (S.pos < d - 1400) { if (api.aborted) return; await TC.sleep(50); }
    S.target = 160;
    while (S.pos < d - 520) { if (api.aborted) return; await TC.sleep(40); }
    S.target = 0;
    await TC.sleep(500);
  }

  TC.games.kart = {
    mount(api) {
      cv = TC.h("canvas", { class: "game" }); api.stage.append(cv); ctx = cv.getContext("2d");
      cv.addEventListener("pointerdown", (e) => { if (!S.running || S.bubble) return; const r = cv.getBoundingClientRect(); S.lane = Math.max(-1, Math.min(1, S.lane + (e.clientX - r.left < r.width / 2 ? -1 : 1))); TC.sfx("whoosh"); });
      resize(); addEventListener("resize", resize);
      raf = requestAnimationFrame(draw);
    },
    idle() { S.running = false; S.bubble = null; S.target = 300; S.rivalSpeed = 0; S.signs = []; S.finishAt = 0; S.kidName = ""; S.kidColor = "#ffc83d"; },
    async play(api) {
      const G = api.G, kid = api.kid;
      Object.assign(S, { pos: 0, speed: 0, target: 0, boost: 0, rival: 1500, rivalSpeed: 0, signs: [], finishAt: 0, bubble: null, kidColor: kid.color, kidName: kid.name, running: true, lane: 0, laneX: 0, stars: [], got: 0, hint: 6 });
      const items = G.items.slice().sort(() => Math.random() - 0.5).slice(0, TC.rounds(5));
      items.forEach((it, i) => S.signs.push({ d: 3500 + i * 5200, it }));
      // star trails between the signs, weaving across the three lanes
      for (let d = 1200; d < 3500 + items.length * 5200 + 4000; d += 420) { const near = S.signs.some((sg) => Math.abs(sg.d - d) < 900); if (!near) S.stars.push({ d, lane: Math.round(Math.sin(d / 1700) * 1.4), done: false }); }
      const N = items.length + 1;
      // start lights: three reds, then green
      const lights = TC.h("div", { style: "position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:30;display:flex;gap:2vh;padding:2vh 3vh;border-radius:3vh;background:#14182b;box-shadow:0 2vh 4vh rgba(0,0,0,.5)" });
      const bulbs = [0, 1, 2].map(() => { const b = TC.h("div", { style: "width:10vh;height:10vh;border-radius:50%;background:#3a2030;box-shadow:inset 0 -1vh 2vh rgba(0,0,0,.5)" }); lights.append(b); return b; });
      document.body.append(lights);
      for (let i = 0; i < 3; i++) { await TC.sleep(650); bulbs[i].style.background = "radial-gradient(circle at 35% 30%,#ffb3b3,#ff2a2a 60%,#a00)"; bulbs[i].style.boxShadow = "0 0 4vh #ff3b3b"; TC.sfx("tick"); TC.sfx("pop"); }
      await TC.sleep(700); bulbs.forEach((b) => { b.style.background = "radial-gradient(circle at 35% 30%,#d6ffe0,#2ee66b 60%,#0a8a3a)"; b.style.boxShadow = "0 0 4vh #2ee66b"; });
      TC.floatText("GO!", 50, 40, "#2ee66b"); TC.sfx("boost"); TC.speak("Go!");
      setTimeout(() => lights.remove(), 900);
      S.rivalSpeed = 420;
      for (let i = 0; i < items.length; i++) {
        api.progress(i, N);
        const sg = S.signs[i], it = sg.it;
        await driveTo(sg.d, api); if (api.aborted) return null;
        S.rivalSpeed = 80;
        S.bubble = { img: it.img, t: 0, label: "" }; TC.sfx("pop");
        const L = api.level;
        const say = L === 1 ? cap(it.w) + "!" : L === 2 ? `It's ${art(it.w)} ${it.w}.` : it.s3;
        const keys = [[it.w]];
        const r = await api.ask({ teacher: G.teacher, tzh: "這是什麼？", say, zh: it.zh, keys, word: it.w, hideKey: true });
        if (api.aborted) return null;
        S.bubble.label = cap(it.w) + "!";
        TC.hideTalk();
        if (r.ok) { TC.sfx("boost"); S.boost = 2.6; S.shake = 0.4; TC.floatText(r.by === "ai" ? "TURBO!" : "GO!", 50, 40, "#ffc83d"); }
        sg.done = true;
        await TC.sleep(900); S.bubble = null;
        S.target = 700; S.rivalSpeed = i < 2 ? 640 : 380;
        if (i === 2) { S.rival = Math.min(S.rival, S.pos - 400); }
      }
      // finish
      api.progress(items.length, N);
      S.lane = 0; S.finishAt = S.pos + 5200; S.rival = Math.min(S.rival, S.pos - 900); S.rivalSpeed = 500;
      await driveTo(S.finishAt + 700, api); if (api.aborted) return null;
      const F = G.finale, L = api.level;
      const r = await api.ask({ teacher: F.teacher, tzh: F.zh, say: F.say[L], keys: F.keys[L], word: "first" });
      if (api.aborted) return null;
      S.target = 900; S.boost = 2; TC.sfx("fanfare"); TC.confetti(220);
      TC.floatText("1st PLACE!", 50, 35, "#ffc83d");
      const tro = TC.artImg("trophy"); tro.style.cssText = "position:fixed;left:50%;top:44%;width:34vh;height:34vh;margin:-17vh;z-index:44;filter:drop-shadow(0 0 4vh #ffc83d)";
      document.body.append(tro); tro.animate([{ transform: "scale(.2) rotate(-30deg)", opacity: 0 }, { transform: "scale(1.15) rotate(6deg)", opacity: 1 }, { transform: "scale(1) rotate(0)" }], { duration: 800, easing: "cubic-bezier(.2,1.5,.4,1)" });
      await TC.sleep(2600); tro.remove(); S.target = 0; S.running = false;
      api.progress(N, N);
      return { ok: true };
    }
  };
  function art(w) { return /^[aeiou]/.test(w) ? "an" : "a"; }
  function cap(w) { return w[0].toUpperCase() + w.slice(1); }
})();
