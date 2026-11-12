/* Gate 6 · Sports Day Obby — say "I can jump / swim / climb…" and your runner clears each obstacle;
   finish in the stadium with your favourite sport (passport L4/L6/L22 verbs, L19 sports, can) */
(function () {
  "use strict";
  TC.games = TC.games || {};
  const PALM = TC.artImg("palm");
  const IM = { basketball: TC.artImg("basketball"), baseball: TC.artImg("baseball"), tennis: TC.artImg("tennis"), trophy: TC.artImg("trophy"), bike: TC.artImg("bike"), cloud: TC.artImg("cloud") };
  let cv, ctx, W, H, k = 1, raf;
  const GY = 470; // ground line in base units (720 high)
  const A = { x: 200, y: GY, pose: "idle", t: 0, color: "#ffc83d", name: "", glider: false, bike: false, rot: 0 };
  let course = [], cam = 0, parts = [], flags = [], finishX = 0, ball = null, trophy = false;

  function resize() { const r = Math.min(1, 1600 / innerWidth); W = cv.width = Math.round(innerWidth * r); H = cv.height = Math.round(innerHeight * r); k = H / 720; }
  function tween(ms, fn) { return new Promise((res) => { const t0 = performance.now(); (function f() { const t = Math.min(1, (performance.now() - t0) / ms); fn(t); if (t < 1) requestAnimationFrame(f); else res(); })(); }); }
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function buildCourse(moves) {
    course = []; flags = []; let x = 700;
    moves.forEach((m) => {
      const w = { hurdle: 140, river: 420, wall: 120, track: 700, bikeLane: 640, cliff: 560 }[m.obstacle];
      course.push({ m, x, w, type: m.obstacle, done: false });
      flags.push({ x: x + w + 140, up: 0 });
      x += w + 520;
    });
    finishX = x + 200;
  }
  function groundAt(x) { for (const o of course) if ((o.type === "river" || o.type === "cliff") && x > o.x && x < o.x + o.w) return null; return GY; }

  function draw() {
    raf = requestAnimationFrame(draw);
    A.t += 1 / 60;
    cam += (A.x - 360 - cam) * 0.08;
    ctx.save(); ctx.scale(k, k);
    const VW = W / k;
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, "#5ec8ff"); g.addColorStop(1, "#dff6ff"); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, 720);
    for (let i = 0; i < 6; i++) { const cx = ((i * 420 - cam * 0.2) % (VW + 400) + VW + 400) % (VW + 400) - 200; if (IM.cloud.complete) ctx.drawImage(IM.cloud, cx, 60 + (i % 3) * 50, 160, 160); }
    // stadium silhouette far away
    ctx.fillStyle = "rgba(60,90,160,.25)";
    for (let i = 0; i < 8; i++) { const sx = ((i * 380 - cam * 0.35) % (VW + 380) + VW + 380) % (VW + 380) - 190; ctx.fillRect(sx, GY - 230, 300, 230); ctx.fillRect(sx + 20, GY - 260, 20, 40); ctx.fillRect(sx + 260, GY - 260, 20, 40); }
    for (let i = 0; i < 7; i++) { const px = ((i * 330 + 120 - cam * 0.5) % (VW + 330) + VW + 330) % (VW + 330) - 160; if (PALM.complete) ctx.drawImage(PALM, px, GY - 260, 200, 260); }
    ctx.translate(-cam, 0);
    // ground blocks (obby studs)
    const x0 = Math.floor(cam / 80) * 80;
    for (let x = x0; x < cam + VW + 80; x += 80) {
      if (groundAt(x + 40) === null) continue;
      const c = ["#35d35a", "#2fbf50"][(x / 80) & 1];
      const gg = ctx.createLinearGradient(0, GY, 0, GY + 40); gg.addColorStop(0, "#8ff27a"); gg.addColorStop(0.25, c); gg.addColorStop(1, "#1f8a3a");
      ctx.fillStyle = gg; ctx.fillRect(x, GY, 80, 40);
      const gd = ctx.createLinearGradient(0, GY + 40, 0, 720); gd.addColorStop(0, "#a8703f"); gd.addColorStop(1, "#5a3518"); ctx.fillStyle = gd; ctx.fillRect(x, GY + 40, 80, 720 - GY);
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(x + 23, GY + 10, 10, 5, 0, 0, 7); ctx.ellipse(x + 57, GY + 10, 10, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(x + 78, GY, 2, 40);
    }
    // obstacles
    for (const o of course) drawObstacle(o);
    flags.forEach((f) => { ctx.fillStyle = "#fff"; ctx.fillRect(f.x, GY - 160, 8, 160); ctx.fillStyle = f.up ? "#ffc83d" : "#aaa"; const fy = GY - 40 - 110 * f.up; ctx.beginPath(); ctx.moveTo(f.x + 8, fy - 40); ctx.lineTo(f.x + 80, fy - 20); ctx.lineTo(f.x + 8, fy); ctx.fill(); });
    drawFinish();
    drawAvatar();
    // particles
    parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.l -= 0.02; ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); });
    ctx.globalAlpha = 1; parts = parts.filter((p) => p.l > 0);
    if (ball) { const b = ball; if (b.img.complete) ctx.drawImage(b.img, b.x - 30, b.y - 30, 60, 60); }
    ctx.restore();
  }
  function puff(x, y, c, n = 14, g = 0.2) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6, g, l: 1, c, s: 8 + Math.random() * 8 }); }

  function drawObstacle(o) {
    const { x, w } = o;
    if (o.type === "hurdle") { block3d(x + 50, GY - 110, 40, 110, "#ff5a5a"); ctx.fillStyle = "rgba(255,255,255,.9)"; for (let i = 0; i < 3; i++) ctx.fillRect(x + 50, GY - 100 + i * 36, 40, 12); }
    if (o.type === "river") { const t = A.t; const wg = ctx.createLinearGradient(0, GY + 20, 0, 720); wg.addColorStop(0, "#7fd3ff"); wg.addColorStop(0.3, "#3d8bff"); wg.addColorStop(1, "#1b4fb8"); ctx.fillStyle = wg; ctx.fillRect(x, GY + 20, w, 720 - GY); ctx.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < w; i += 60) ctx.fillRect(x + i + Math.sin(t * 3 + i) * 10, GY + 30, 30, 6); }
    if (o.type === "wall") { for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) block3d(x + c * 60, GY - 60 - r * 60, 60, 60, (r + c) % 2 ? "#9b6bff" : "#7d55d9"); }
    if (o.type === "track") { ctx.fillStyle = "#e0523f"; ctx.fillRect(x, GY - 6, w, 14); ctx.fillStyle = "#fff"; for (let i = 20; i < w; i += 90) { ctx.beginPath(); ctx.moveTo(x + i, GY - 30); ctx.lineTo(x + i + 30, GY - 18); ctx.lineTo(x + i, GY - 6); ctx.fill(); } }
    if (o.type === "bikeLane") { ctx.fillStyle = "#4cc9ff"; ctx.fillRect(x, GY - 6, w, 14); if (!o.done && !A.bike && IM.bike.complete) ctx.drawImage(IM.bike, x - 30, GY - 90, 90, 90); }
    if (o.type === "cliff") {
      const ab = ctx.createLinearGradient(0, GY, 0, 720); ab.addColorStop(0, "#5a6aa8"); ab.addColorStop(0.5, "#26293a"); ab.addColorStop(1, "#0a0c18"); ctx.fillStyle = ab; ctx.fillRect(x, GY, w, 720 - GY);
      ctx.fillStyle = "#8a5a32"; ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x + 26, GY + 60); ctx.lineTo(x + 8, GY + 130); ctx.lineTo(x + 30, GY + 250); ctx.lineTo(x, 720); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w, GY); ctx.lineTo(x + w - 24, GY + 70); ctx.lineTo(x + w - 6, GY + 150); ctx.lineTo(x + w - 28, GY + 260); ctx.lineTo(x + w, 720); ctx.fill();
      const sx = x + w / 2, sy = GY - 150 + Math.sin(A.t * 3) * 8; // floating warning sign over the gap
      ctx.fillStyle = "#ffc83d"; ctx.beginPath(); ctx.moveTo(sx, sy - 50); ctx.lineTo(sx + 48, sy + 34); ctx.lineTo(sx - 48, sy + 34); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#26293a"; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = "#26293a"; ctx.font = "700 54px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("!", sx, sy + 26);
      ctx.fillStyle = "#26293a"; ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 4; for (let i = 0; i < 5; i++) { const yy = GY - 200 + i * 40; ctx.beginPath(); ctx.moveTo(x + 40 + ((A.t * 200 + i * 80) % (w - 80)), yy); ctx.lineTo(x + 100 + ((A.t * 200 + i * 80) % (w - 80)), yy); ctx.stroke(); } }
  }
  /** a glossy obby block with a top face and side shading */
  function block3d(x, y, w, h, col) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, shadeHex(col, 1.35)); g.addColorStop(0.5, col); g.addColorStop(1, shadeHex(col, 0.65));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shadeHex(col, 1.5); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 10); ctx.lineTo(x + w + 10, y - 10); ctx.lineTo(x + w, y); ctx.fill();
    ctx.fillStyle = shadeHex(col, 0.55); ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + 10, y - 10); ctx.lineTo(x + w + 10, y + h - 10); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect(x + w * 0.12, y + h * 0.1, w * 0.18, Math.min(10, h * 0.2));
  }
  function shadeHex(hex, f) { const n = parseInt(hex.slice(1), 16); const c = (v) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; }
  function drawFinish() {
    const x = finishX; if (!x) return;
    ctx.fillStyle = "#26293a"; ctx.fillRect(x, GY - 300, 12, 300); ctx.fillRect(x + 600, GY - 300, 12, 300);
    for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? "#111" : "#fff"; ctx.fillRect(x + i * 30.6, GY - 300 + j * 26, 31, 26); }
    ctx.font = "700 44px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffc83d"; ctx.fillText("STADIUM", x + 306, GY - 320);
    // three sport corners
    ctx.fillStyle = "#ff9a2e"; ctx.fillRect(x + 900, GY - 330, 12, 330); ctx.fillStyle = "#fff"; ctx.fillRect(x + 860, GY - 400, 120, 80); ctx.strokeStyle = "#ff5a5a"; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(x + 870, GY - 310, 40, 10, 0, 0, 7); ctx.stroke();
    if (trophy && IM.trophy.complete) ctx.drawImage(IM.trophy, A.x - 70, A.y - 330, 140, 140);
  }
  function drawAvatar() {
    const { x, y, pose, t, color } = A;
    ctx.save(); ctx.translate(x, y); ctx.rotate(A.rot);
    const sw = pose === "run" ? Math.sin(t * 18) : pose === "swim" ? Math.sin(t * 8) : pose === "climb" ? Math.sin(t * 10) : 0;
    if (A.bike && IM.bike.complete) ctx.drawImage(IM.bike, -55, -80, 110, 110);
    // legs
    ctx.fillStyle = "#3d4a8a";
    ctx.save(); ctx.translate(-10, -50); ctx.rotate(sw * 0.7); ctx.fillRect(-9, 0, 18, 50); ctx.restore();
    ctx.save(); ctx.translate(10, -50); ctx.rotate(-sw * 0.7); ctx.fillRect(-9, 0, 18, 50); ctx.restore();
    // torso
    const tg = ctx.createLinearGradient(-26, -110, 26, -48); tg.addColorStop(0, shadeHex(color, 1.35)); tg.addColorStop(1, shadeHex(color, 0.7)); ctx.fillStyle = tg; ctx.fillRect(-26, -110, 52, 62);
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.font = "700 26px Fredoka"; ctx.textAlign = "center"; ctx.fillText(A.name ? A.name[0] : "", 0, -70);
    // arms
    ctx.fillStyle = "#ffd3a8";
    const armA = pose === "fly" ? -2.6 : pose === "climb" ? -2.8 + sw * 0.4 : pose === "swim" ? -1.5 + sw * 1.4 : pose === "cheer" ? -2.7 : sw * 0.8;
    ctx.save(); ctx.translate(-30, -104); ctx.rotate(armA); ctx.fillRect(-8, 0, 16, 50); ctx.restore();
    ctx.save(); ctx.translate(30, -104); ctx.rotate(pose === "fly" || pose === "cheer" ? 2.6 : pose === "climb" ? 2.8 - sw * 0.4 : -armA); ctx.fillRect(-8, 0, 16, 50); ctx.restore();
    // head
    const hg = ctx.createLinearGradient(-24, -158, 24, -110); hg.addColorStop(0, "#ffe6cc"); hg.addColorStop(1, "#e8a878"); ctx.fillStyle = hg; ctx.fillRect(-24, -158, 48, 48);
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(-18, -152, 12, 6);
    ctx.fillStyle = "#0a1633"; ctx.fillRect(-12, -140, 7, 9); ctx.fillRect(6, -140, 7, 9); ctx.fillRect(-8, -124, 16, 4);
    ctx.fillStyle = color; ctx.fillRect(-26, -164, 52, 14);
    if (A.glider) { ctx.fillStyle = "#ff5fa2"; ctx.beginPath(); ctx.moveTo(-110, -150); ctx.quadraticCurveTo(0, -230, 110, -150); ctx.lineTo(0, -170); ctx.fill(); }
    ctx.restore();
    // name tag
    ctx.font = "600 24px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(10,22,51,.7)"; const tw = ctx.measureText(A.name).width + 20; ctx.fillRect(x - tw / 2, y - 205, tw, 32); ctx.fillStyle = "#fff"; ctx.fillText(A.name, x, y - 181);
  }

  async function runTo(x, speed = 340) {
    A.pose = "run"; const x0 = A.x, d = x - x0;
    await tween((Math.abs(d) / speed) * 1000, (t) => { A.x = x0 + d * t; if (Math.random() < 0.15) puff(A.x - 20, GY - 8, "rgba(255,255,255,.7)", 2, 0); });
    A.pose = "idle";
  }
  async function act(o) {
    const { x, w } = o;
    if (o.type === "hurdle") {
      TC.sfx("pop"); A.pose = "run"; const x0 = A.x, x1 = x + w + 60;
      await tween(900, (t) => { A.x = x0 + (x1 - x0) * t; A.y = GY - Math.sin(t * Math.PI) * 190; A.rot = Math.sin(t * Math.PI * 2) * 0.2; });
      A.y = GY; A.rot = 0; puff(A.x, GY, "#fff");
    } else if (o.type === "river") {
      A.pose = "swim"; const x0 = A.x;
      await tween(500, (t) => { A.x = x0 + 70 * t; A.y = GY + 60 * t; }); TC.sfx("whoosh"); puff(A.x, GY + 40, "#bfe3ff", 24, 0.25);
      await tween(2200, (t) => { A.x = x0 + 70 + (w - 70) * t; A.y = GY + 60 + Math.sin(t * 20) * 6; A.rot = 0.9; if (Math.random() < 0.3) puff(A.x - 30, GY + 30, "#bfe3ff", 2, 0.2); });
      A.rot = 0; await tween(400, (t) => { A.x = x0 + w + 40 * t; A.y = GY + 60 * (1 - t); });
    } else if (o.type === "wall") {
      A.pose = "climb"; const x0 = A.x;
      await tween(300, (t) => (A.x = x0 + (x - 30 - x0) * t));
      await tween(1500, (t) => (A.y = GY - 300 * t));
      await tween(500, (t) => { A.x = x - 30 + (w + 60) * t; A.y = GY - 300 - Math.sin(t * Math.PI) * 40; });
      A.pose = "run"; await tween(500, (t) => (A.y = GY - 300 + 300 * t * t)); puff(A.x, GY, "#fff");
    } else if (o.type === "track") {
      TC.sfx("boost"); A.pose = "run"; const x0 = A.x;
      await tween(900, (t) => { A.x = x0 + (x + w - x0 + 60) * ease(t); A.t += 0.08; if (Math.random() < 0.6) puff(A.x - 40, GY - 10, "#ffe58a", 2, 0); });
    } else if (o.type === "bikeLane") {
      A.bike = true; A.pose = "idle"; TC.sfx("coin"); const x0 = A.x;
      await tween(1500, (t) => { A.x = x0 + (x + w - x0 + 60) * ease(t); A.y = GY - 20 - Math.sin(t * Math.PI) * 30; });
      A.bike = false; A.y = GY;
    } else if (o.type === "cliff") {
      A.glider = true; A.pose = "fly"; TC.sfx("whoosh"); const x0 = A.x;
      await tween(2300, (t) => { A.x = x0 + (x + w + 80 - x0) * t; A.y = GY - Math.sin(t * Math.PI) * 200 - 40 * t * (1 - t); });
      A.glider = false; A.y = GY; puff(A.x, GY, "#fff");
    }
    A.pose = "idle"; A.rot = 0; A.y = GY;
  }

  const BTN_CSS = `.actbtn{position:fixed;left:50%;top:58%;transform:translate(-50%,-50%);z-index:26;width:30vh;height:30vh;border-radius:50%;display:grid;place-items:center;
    font:700 6vh Fredoka,sans-serif;color:#fff;text-shadow:0 .5vh 0 rgba(0,0,0,.3);cursor:pointer;touch-action:manipulation;
    background:radial-gradient(circle at 35% 28%,#ffe9a8,#ffb020 45%,#e06a00);box-shadow:0 2.2vh 0 #a84e00,0 3vh 5vh rgba(0,0,0,.4),0 0 0 1.4vh rgba(255,255,255,.35);animation:pulse .8s ease-in-out infinite}
    .actbtn:active{transform:translate(-50%,-44%);box-shadow:0 .6vh 0 #a84e00}
    .actbtn small{display:block;font-size:2.2vh;margin-top:-4vh}`;
  let actBtn = null;
  function actionButton(word) {
    return new Promise((res) => {
      if (!document.getElementById("g6css")) document.head.append(TC.h("style", { id: "g6css" }, BTN_CSS));
      actBtn = TC.h("div", { class: "actbtn" }, TC.h("div", {}, word.toUpperCase() + "!", TC.h("small", { class: "zh" }, "👆 用力按！")));
      const go = () => { if (!actBtn) return; actBtn.remove(); actBtn = null; TC.pending = null; clearTimeout(t); TC.sfx("boost"); res(); };
      actBtn.addEventListener("pointerdown", go); document.body.append(actBtn); TC.pending = go;
      const t = setTimeout(go, 7000);
    });
  }

  TC.games.obby = {
    mount(api) { cv = TC.h("canvas", { class: "game" }); api.stage.append(cv); ctx = cv.getContext("2d"); resize(); addEventListener("resize", resize); raf = requestAnimationFrame(draw); this.idle(api); },
    idle(api) { const G = (api && api.G) || TC_CONTENT.gates[6]; buildCourse(G.moves); Object.assign(A, { x: 200, y: GY, pose: "run", name: "", color: "#ffc83d", glider: false, bike: false }); trophy = false; ball = null; cam = 0;
      (async function demo() { while (!TC.kid && A.name === "") { await runTo(A.x + 400, 260); if (A.x > course[0].x - 200) { A.x = 200; cam = 0; } } })(); },
    async play(api) {
      const G = api.G, kid = api.kid;
      const must = G.moves.filter((m) => ["jump", "swim", "climb", "fly"].includes(m.w));
      const extra = G.moves.filter((m) => !must.includes(m)).sort(() => Math.random() - 0.5)[0];
      const moves = [must[0], must[1], extra, must[2], must[3]].slice(0, TC.rounds(5));
      buildCourse(moves); trophy = false; ball = null;
      Object.assign(A, { x: 200, y: GY, pose: "idle", color: kid.color, name: kid.name, glider: false, bike: false, rot: 0 }); cam = 0;
      const N = moves.length + 1;
      await TC.speak("Ready? Let's run!");
      for (let i = 0; i < course.length; i++) {
        api.progress(i, N);
        const o = course[i], m = o.m, L = api.level;
        await runTo(o.x - 70); if (api.aborted) return null;
        const say = L === 1 ? cap(m.w) + "!" : L === 2 ? m.s2 : m.s3;
        const keys = m.keys || [[m.w]];
        const r = await api.ask({ teacher: m.t, tzh: `看看前面的障礙，你會做什麼？（${m.zh}）`, say, zh: m.zh, keys, word: m.w });
        if (api.aborted) return null;
        TC.hideTalk();
        await actionButton(m.w);
        if (api.aborted) return null;
        TC.floatText(cap(m.w) + "!", 50, 30, "#ffc83d");
        await act(o); o.done = true;
        await runTo(flags[i].x + 30);
        TC.sfx("coin"); await tween(400, (t) => (flags[i].up = t));
      }
      api.progress(course.length, N);
      await runTo(finishX + 760);
      const F = G.finale, L = api.level, sports = Object.keys(G.sports);
      const r = await api.ask({ teacher: F.teacher, tzh: F.zh, say: F.say[L], zh: "籃球 basketball / 棒球 baseball / 網球 tennis", keys: [sports], word: "basketball" });
      if (api.aborted) return null;
      const sp = TC.pickHeard(r.heard, sports) || "basketball";
      TC.hideTalk();
      // shot!
      ball = { img: IM[sp], x: A.x + 40, y: A.y - 120 };
      const tx = sp === "basketball" ? finishX + 870 : A.x + 900, ty = sp === "basketball" ? GY - 320 : GY - 500;
      const bx = ball.x, by = ball.y; TC.sfx("whoosh");
      A.pose = "cheer";
      await tween(1100, (t) => { ball.x = bx + (tx - bx) * t; ball.y = by + (ty - by) * t - Math.sin(t * Math.PI) * 260; });
      TC.sfx("fanfare"); puff(ball.x, ball.y, "#ffc83d", 40, 0.15); TC.confetti(220);
      TC.floatText(sp === "basketball" ? "SLAM DUNK!" : sp === "baseball" ? "HOME RUN!" : "ACE!", 50, 28, "#ffc83d");
      ball = null; trophy = true;
      await TC.speak(`${cap(sp)}! You are a sports star, ${kid.name}!`);
      await TC.sleep(1200); A.pose = "idle";
      api.progress(N, N);
      return { ok: true };
    }
  };
  function cap(w) { return w[0].toUpperCase() + w.slice(1); }
})();
