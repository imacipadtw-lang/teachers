/* Gate 2 · Pixel Craft — say a colour, the blocks of that colour drop in and build the picture (passport L19 colours) */
(function () {
  "use strict";
  TC.games = TC.games || {};
  const KEY = { r: "red", o: "orange", y: "yellow", g: "green", b: "blue", p: "purple", w: "white", k: "black", n: "brown", i: "pink" };
  const ART = [
    { name: "rainbow", reveal: "Look at the rainbow!", grid: [
      "....rrrrrrrr....",
      "..rroooooooorr..",
      ".rooyyyyyyyyoor.",
      "rooyyggggggyyoor",
      "royggbbbbbbggyor",
      "roygbbppppbbgyor",
      "roygbp....pbgyor",
      "roygbp....pbgyor",
      "roygbp....pbgyor"] },
    { name: "medal", reveal: "It's a gold medal! You are number one!", grid: [
      "bb........rr",
      ".bb......rr.",
      "..bb....rr..",
      "...bb..rr...",
      "....brrb....",
      "....yyyy....",
      "..yyyyyyyy..",
      ".yyyyooyyyy.",
      ".yyyooooyyy.",
      ".yyyyooyyyy.",
      "..yyyyyyyy..",
      "....yyyy...."] },
    { name: "sun", reveal: "It's the sun! The sun is yellow.", grid: [
      "......o......",
      "..o...o...o..",
      "...o.yyy.o...",
      "....yyyyy....",
      "...yykykyy...",
      "ooyyyyyyyyyoo",
      "...yyrrryy...",
      "....yyyyy....",
      "...o.yyy.o...",
      "..o...o...o..",
      "......o......"] },
    { name: "icecream", reveal: "It's ice cream! I love ice cream.", grid: [
      "....rr....",
      "...iiii...",
      "..iiiiii..",
      ".iwiiiiii.",
      ".iiiiiiii.",
      ".nnnnnnnn.",
      "..oyoyoy..",
      "..yoyoyo..",
      "...oyoy...",
      "...yoyo...",
      "....oo....",
      "....oo...."] },
    { name: "ollie", reveal: "It's Ollie-Bot! Hello, Ollie!", grid: [
      ".....y......",
      "....yyy.....",
      ".....k......",
      ".p........p.",
      ".pppppppppp.",
      "ppwwwppwwwpp",
      "pwwkwppwkwwp",
      "pwwwwppwwwwp",
      "ppwwpoopwwpp",
      "pppppooppppp",
      "pppwwwwwwppp",
      "pppwwwwwwppp",
      ".pppppppppp.",
      "..oo....oo.."] }
  ];

  const OPERA = TC.artImg("opera");
  let spinStart = 0, cv, ctx, W, H, raf, art = null, blocks = [], palette = [], glow = null, t0 = 0, sparks = [], swRects = [], pickCb = null, picked = null, toyMode = false;
  function resize() { const r = Math.min(1, 1600 / innerWidth); W = cv.width = Math.round(innerWidth * r); H = cv.height = Math.round(innerHeight * r); layout(); }
  let L = { s: 30, ox: 0, oy: 0, d: 10 };
  function layout() {
    if (!art) return;
    const rows = art.grid.length, cols = Math.max(...art.grid.map((r) => r.length));
    const s = Math.floor(Math.min((W * 0.62) / (cols + 0.4), (H * 0.5) / (rows + 0.4)));
    L = { s, d: s * 0.38, ox: W * 0.56 - (cols * s) / 2, oy: H * 0.17 + s * 0.5 };
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, Math.max(0, r * f)); g = Math.min(255, Math.max(0, g * f)); b = Math.min(255, Math.max(0, b * f));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function cube(x, y, s, d, hex, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = shade(hex, 1.18); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d, y - d); ctx.lineTo(x + s + d, y - d); ctx.lineTo(x + s, y); ctx.fill();
    ctx.fillStyle = shade(hex, 0.72); ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + s + d, y - d); ctx.lineTo(x + s + d, y + s - d); ctx.lineTo(x + s, y + s); ctx.fill();
    ctx.fillStyle = hex; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x + s * 0.12, y + s * 0.12, s * 0.22, s * 0.22);
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    ctx.globalAlpha = 1;
  }
  function draw() {
    raf = requestAnimationFrame(draw);
    const t = (performance.now() - t0) / 1000;
    // sky + ground
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#7fd3ff"); g.addColorStop(0.7, "#c9f0ff"); g.addColorStop(0.71, "#7bd36b"); g.addColorStop(1, "#4fae4a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // voxel clouds
    for (let i = 0; i < 4; i++) { const cx = ((t * 18 * (i + 1) + i * 420) % (W + 300)) - 150, cy = H * (0.1 + i * 0.07), s = H * 0.03; for (let k = 0; k < 4; k++) cube(cx + k * s, cy + (k % 2 ? 0 : -s * 0.5), s, s * 0.35, "#ffffff", 0.85); }
    if (OPERA.complete) { const ow = H * 0.26; ctx.globalAlpha = 0.9; ctx.drawImage(OPERA, W * 0.8, H * 0.71 - ow * 0.9, ow * 1.05, ow); ctx.globalAlpha = 1; }
    // ground grid
    ctx.strokeStyle = "rgba(0,0,0,.08)"; for (let x = 0; x < W; x += H * 0.05) { ctx.beginPath(); ctx.moveTo(x, H * 0.71); ctx.lineTo(x - H * 0.1, H); ctx.stroke(); }
    if (!art) return;
    const { s, d, ox, oy } = L;
    const rows = art.grid.length;
    // ghost outline of the hidden picture
    for (const b of blocks) if (!b.placed) { ctx.strokeStyle = "rgba(10,22,51,.25)"; ctx.setLineDash([s * 0.15, s * 0.12]); ctx.strokeRect(ox + b.c * s + 2, oy + b.r * s + 2, s - 4, s - 4); ctx.setLineDash([]); }
    // blocks: bottom rows first, left → right (the finished sculpture spins once at the finale)
    const order = blocks.slice().sort((a, b) => b.r - a.r || a.c - b.c);
    const cols = Math.max(...art.grid.map((r) => r.length)), cx = ox + (cols * s) / 2;
    let sx = 1; if (spinStart) { const k = Math.min(1, (performance.now() - spinStart) / 2400); sx = Math.cos(k * Math.PI * 2); if (k >= 1) spinStart = 0; }
    ctx.save(); ctx.translate(cx, 0); ctx.scale(Math.abs(sx) < 0.04 ? 0.04 : sx, 1); ctx.translate(-cx, 0);
    for (const b of order) {
      if (!b.placed) continue;
      if (b.y < 0) { b.vy += 2.2; b.y += b.vy; if (b.y >= 0) { b.y = 0; if (b.vy > 8) { b.vy = -b.vy * 0.28; if (!b.popped) { b.popped = 1; TC.sfx("click"); } } else b.vy = 0; } }
      else if (b.vy) { b.vy += 2.2; b.y += b.vy; if (b.y >= 0) { b.y = 0; b.vy = 0; } }
      const wob = glow ? Math.sin(t * 6 + b.c * 0.5 + b.r * 0.3) * s * 0.06 : 0;
      cube(ox + b.c * s, oy + b.r * s + b.y + wob, s, d, b.hex);
    }
    ctx.restore();
    // shadow line
    ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fillRect(ox - d, oy + rows * s, art.grid[0].length * s + d * 2, s * 0.25);
    // glow fireworks
    if (glow) { if (Math.random() < 0.25) burst(W * (0.2 + Math.random() * 0.6), H * (0.1 + Math.random() * 0.3), glow); }
    for (const p of sparks) { p.vy += 0.15; p.x += p.vx; p.y += p.vy; p.l -= 0.015; ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, H * 0.008, H * 0.008); }
    ctx.globalAlpha = 1; sparks = sparks.filter((p) => p.l > 0);
    // palette swatches (left)
    swRects = [];
    palette.forEach((p, i) => {
      const x = W * 0.05, y = H * 0.16 + i * H * 0.088, sz = H * (picked === p.name ? 0.075 : 0.062), pulse = p.done ? 0 : Math.sin(t * 5 + i) * 0.06;
      swRects.push({ p, x: x - 10, y: y - sz * 0.6, w: W * 0.2, h: sz * 1.5 });
      if (picked === p.name) { ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 14, y - sz * 0.55, W * 0.2, sz * 1.5, 18) : ctx.rect(x - 14, y - sz * 0.55, W * 0.2, sz * 1.5); ctx.fill(); }
      cube(x, y - sz * pulse, sz, sz * 0.35, p.hex, p.done ? 0.35 : 1);
      ctx.font = `600 ${H * 0.032}px Fredoka, sans-serif`; ctx.textAlign = "left"; ctx.fillStyle = p.done ? "rgba(10,22,51,.35)" : "#0a1633";
      ctx.fillText(p.done ? "✓ " + p.name : p.name, x + sz * 1.55, y + sz * 0.68);
    });
  }
  function burst(x, y, c) { for (let i = 0; i < 40; i++) { const a = Math.random() * 7, v = 2 + Math.random() * 5; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c, l: 1 }); } TC.sfx("pop"); }

  function setArt(a) {
    art = a; layout(); blocks = []; glow = null;
    a.grid.forEach((row, r) => row.split("").forEach((ch, c) => { if (KEY[ch]) blocks.push({ r, c, color: KEY[ch], hex: TC_CONTENT.gates[2].colors[KEY[ch]].hex, placed: false, y: 0, vy: 0 }); }));
    const used = [...new Set(blocks.map((b) => b.color))];
    palette = used.map((name) => ({ name, hex: TC_CONTENT.gates[2].colors[name].hex, done: false }));
  }
  async function drop(color) {
    const list = blocks.filter((b) => b.color === color && !b.placed).sort((a, b) => b.r - a.r || a.c - b.c);
    for (let i = 0; i < list.length; i++) { const b = list[i]; b.placed = true; b.y = -H * (0.5 + Math.random() * 0.2); b.vy = 0; if (i % 3 === 0) await TC.sleep(35); }
    await TC.sleep(900);
  }
  const heardColor = (text, allowed) => TC.pickHeard(text, allowed);

  TC.games.craft = {
    mount(api) { cv = TC.h("canvas", { class: "game" }); api.stage.append(cv); ctx = cv.getContext("2d");
      cv.addEventListener("pointerdown", (e) => {
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
        const hit = swRects.find((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h && !q.p.done);
        if (hit && pickCb) { picked = hit.p.name; TC.sfx("pop"); TC.model(hit.p.name, hit.p.name); const f = pickCb; pickCb = null; f(hit.p.name); return; }
        if (toyMode || !pickCb) { // toy: tap a block to make it hop
          const { s, ox, oy } = L; const c = Math.floor((x - ox) / s), rr = Math.floor((y - oy) / s);
          const b = blocks.find((q) => q.placed && q.c === c && q.r === rr && q.y === 0);
          if (b) { b.vy = -H * 0.03; b.y = -1; TC.sfx("pop"); burst(x, y, b.hex); }
        }
      }); t0 = performance.now(); resize(); addEventListener("resize", resize); raf = requestAnimationFrame(draw); this.idle(api); },
    idle() { setArt(ART[(Math.random() * ART.length) | 0]); blocks.forEach((b) => { b.placed = true; }); glow = null; },
    preview(i) { setArt(ART[i]); blocks.forEach((b) => { b.placed = true; }); },
    async play(api) {
      const G = api.G, C = G.colors;
      const pool = TC.cfg.rounds ? ART.filter((x) => new Set(x.grid.join("").replace(/\./g, "")).size <= TC.cfg.rounds + 1) : ART;
      const a = pool[(Math.random() * pool.length) | 0]; setArt(a);
      const N = palette.length + 1;
      await TC.speak("Let's build! What color do you want?");
      for (let i = 0; i < palette.length; i++) {
        api.progress(i, N);
        const left = palette.filter((p) => !p.done).map((p) => p.name);
        // 👆 the child taps the colour block they want (or the teacher presses Enter)
        picked = null; TC.floatText("👆 Tap a color!", 30, 22, "#0a1633");
        TC.hideTalk(); TC.guide("👆 點左邊一個<em>還沒打勾</em>的顏色方塊", "等孩子點；9 秒沒點會自動選一個，也可以直接按 <kbd>✓ 說得好</kbd>（或 Enter）");
        // each wait owns its own callback and timer, so an old 9 s timer can't cancel the next colour's wait
        const tapped = await new Promise((res) => {
          let tm = 0;
          const done = (v) => { clearTimeout(tm); if (pickCb === done) pickCb = null; if (TC.pending === skip) TC.pending = null; res(v); };
          const skip = () => done(null);
          pickCb = done; TC.pending = skip; tm = setTimeout(skip, 9000);
        });
        TC.pending = null;
        if (api.aborted) return null;
        const first = tapped || left[0], L = api.level; picked = first;
        const say = L === 1 ? cap(first) + "!" : L === 2 ? `I want ${first}.` : `I want ${first}, please.`;
        const r = await api.ask({ teacher: "What color do you want?", tzh: "你想要什麼顏色？（選左邊任何一個）", say, zh: C[first].zh + "（或其他顏色）", keys: [left], word: first });
        if (api.aborted) return null;
        const got = (r.ok && heardColor(r.heard, left)) || first;
        const p = palette.find((x) => x.name === got); p.done = true; picked = null;
        TC.floatText(cap(got) + "!", 55, 40, C[got].hex);
        await drop(got);
      }
      api.progress(palette.length, N);
      TC.sfx("fanfare"); TC.confetti(120); toyMode = true; spinStart = performance.now();
      await TC.speak(a.reveal);
      const F = G.finale, L = api.level, names = Object.keys(C);
      const fav = palette[0].name;
      const fill = (s, c) => s.replace("[color]", c).replace("[Color]", cap(c));
      const r = await api.ask({ teacher: F.teacher, tzh: F.zh, say: fill(F.say[L], fav), zh: "說你最喜歡的顏色", keys: [names], word: "color" });
      if (api.aborted) return null;
      const liked = (r.ok && heardColor(r.heard, names)) || fav;
      glow = C[liked].hex; TC.sfx("levelup");
      TC.floatText(`${cap(liked)}! ✨`, 55, 30, glow);
      await TC.speak(`${cap(liked)}! I like ${liked}, too!`);
      TC.floatText("👆 Tap the blocks!", 55, 22, "#0a1633");
      TC.hideTalk(); TC.guide("👆 點一點作品上的方塊，讓它們跳起來！", "不用按，約 4 秒後自動進到下一步");
      await TC.sleep(4000); toyMode = false;
      api.progress(N, N);
      return { ok: true };
    }
  };
  function cap(w) { return w[0].toUpperCase() + w.slice(1); }
})();
