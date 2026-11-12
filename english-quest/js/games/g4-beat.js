/* Gate 4 · Beat Party — the child is the boss: shout the command, everyone in the room does it!
   (passport L25 classroom English + L6/L22 verbs; finale "Say cheese!" group photo) */
(function () {
  "use strict";
  TC.games = TC.games || {};
  const css = `
  .g4{position:absolute;inset:0;overflow:hidden;background:radial-gradient(70% 60% at 50% 40%,#3b1c7a,#120827)}
  .g4 .spot{position:absolute;top:-20%;width:40%;height:140%;background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,0));clip-path:polygon(45% 0,55% 0,100% 100%,0 100%);transform-origin:50% 0;mix-blend-mode:screen;animation:spotA 4s ease-in-out infinite}
  @keyframes spotA{0%,100%{transform:rotate(-25deg)}50%{transform:rotate(25deg)}}
  .g4 .floor{position:absolute;left:-30%;right:-30%;bottom:22%;height:46%;display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(5,1fr);transform:perspective(70vh) rotateX(58deg);transform-origin:50% 100%;gap:.6vh}
  .g4 .floor i{border-radius:.8vh;box-shadow:inset 0 0 2vh rgba(255,255,255,.08)}
  .g4 .ball{position:absolute;left:50%;top:-3vh;width:14vh;height:14vh;margin-left:-7vh;border-radius:50%;animation:spin 6s linear infinite;
     background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.9),transparent 30%),repeating-conic-gradient(#c9d6ff 0 10deg,#6f7fd8 10deg 20deg),#8fa2ff;box-shadow:0 0 4vh rgba(201,214,255,.7)}
  .g4 .ball:before{content:"";position:absolute;left:50%;top:-20vh;width:.4vh;height:20vh;background:#c9d6ff}
  .g4 .floor i{border:1px solid rgba(255,255,255,.08);animation:tile 1.2s infinite}
  @keyframes tile{0%,100%{background:rgba(255,95,162,.15)}50%{background:rgba(76,201,255,.25)}}
  .g4 .bot{position:absolute;left:50%;top:16%;width:26vh;height:30vh;margin-left:-13vh;transition:transform .2s}
  .g4 .bot.jump{animation:pJump .45s ease-in-out infinite}
  .g4 .bot.clap{animation:pClap .3s ease-in-out infinite}
  @keyframes pClap{50%{transform:scale(1.12,.9)}}
  .g4 .bot.raise{animation:pRaise .6s ease-in-out infinite}
  @keyframes pRaise{50%{transform:translateY(-14%) scale(.94,1.12) rotate(6deg)}}
  .g4 .bot.dance{animation:pDance .6s ease-in-out infinite}
  .g4 .bot.sing{animation:talk .25s ease-in-out infinite}
  .g4 .bot.run{animation:pRun .2s linear infinite}
  .g4 .bot.stand{transform:scale(1.18) translateY(-6%)}
  .g4 .bot.sit{transform:scaleY(.72) translateY(22%)}
  .g4 .pads{position:absolute;left:4%;right:4%;top:56%;height:13%;display:grid;grid-template-columns:repeat(4,1fr);gap:1.4rem;opacity:0;pointer-events:none;transition:opacity .25s}
  .g4 .pads.on{opacity:1;pointer-events:auto}
  .g4 .pad{border-radius:1.6rem;display:grid;place-items:center;font-size:3rem;font-weight:700;color:#fff;touch-action:manipulation;cursor:pointer;
     background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--pc) 55%,#fff),var(--pc) 55%,color-mix(in srgb,var(--pc) 60%,#000));box-shadow:0 .7rem 0 color-mix(in srgb,var(--pc) 55%,#000),0 0 2rem var(--pc);text-shadow:0 .2rem 0 rgba(0,0,0,.3)}
  .g4 .pad:active,.g4 .pad.hit{transform:translateY(.5rem);box-shadow:0 .2rem 0 color-mix(in srgb,var(--pc) 55%,#000),0 0 4rem var(--pc)}
  .g4 .djhint{position:absolute;left:50%;top:50.5%;transform:translateX(-50%);font-size:2.4rem;font-weight:700;color:#ffc83d;opacity:0;transition:opacity .25s;white-space:nowrap}
  .g4 .djhint.on{opacity:1}
  .g4 .ring{position:absolute;left:50%;top:32%;width:20vh;height:20vh;margin:-10vh;border-radius:50%;border:.6rem solid #ffc83d;pointer-events:none;animation:ring .6s ease-out forwards}
  @keyframes ring{from{transform:scale(.4);opacity:1}to{transform:scale(2.6);opacity:0}}
  @keyframes pJump{50%{transform:translateY(-28%)}}
  @keyframes pDance{0%,100%{transform:rotate(-12deg) translateX(-10%)}50%{transform:rotate(12deg) translateX(10%)}}
  @keyframes pRun{50%{transform:translateY(-6%) rotate(3deg)}}
  .g4 .lane{position:absolute;left:4%;right:4%;top:56%;height:13%;border-radius:2rem;background:rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.2)}
  .g4 .hit{position:absolute;left:3%;top:50%;width:11vh;height:11vh;margin-top:-5.5vh;border-radius:50%;border:.5rem solid #fff;box-shadow:0 0 2rem #ff5fa2}
  .g4 .hit.pulse{animation:hitp .6s infinite}
  @keyframes hitp{50%{transform:scale(1.15);box-shadow:0 0 4rem #ff5fa2}}
  .g4 .cmd{position:absolute;top:50%;transform:translateY(-50%);left:100%;white-space:nowrap;background:linear-gradient(90deg,#ff5fa2,#9b6bff);padding:.4rem 2rem .4rem .6rem;border-radius:2rem;font-size:3.6rem;font-weight:700;box-shadow:0 0 2rem rgba(255,95,162,.6);display:flex;align-items:center;gap:1rem}
  .g4 .cmd img{width:9vh;height:9vh;margin:-2vh 0;filter:drop-shadow(0 .6vh .6vh rgba(0,0,0,.3))}
  .g4 .posecard{position:absolute;right:10%;top:14%;width:26vh;height:26vh;border-radius:3vh;background:radial-gradient(circle at 40% 30%,#fff,#e6ecff);box-shadow:0 1.6vh 0 #9b6bff,0 2.4vh 4vh rgba(0,0,0,.4);display:grid;place-items:center;opacity:0;transform:scale(.6) rotate(-8deg);transition:all .4s cubic-bezier(.2,1.5,.4,1)}
  .g4 .posecard.on{opacity:1;transform:scale(1) rotate(-4deg)}
  .g4 .posecard img{width:90%;height:90%}
  .g4 .power{position:absolute;right:2.5%;top:14%;width:4.5vh;height:32%;border-radius:2vh;background:rgba(255,255,255,.12);overflow:hidden;border:2px solid rgba(255,255,255,.3)}
  .g4 .power i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#2ee6b6,#ffc83d,#ff5fa2)}
  .g4 .power-l{position:absolute;right:1%;top:47%;width:9vh;text-align:center;font-size:1.3rem;font-weight:700}
  .g4 .combo{position:absolute;left:3%;top:16%;font-size:2.4rem;font-weight:700}
  .g4 .note{position:absolute;width:6vh;height:6vh;animation:noteUp 1.6s ease-out forwards}
  @keyframes noteUp{to{transform:translateY(-25vh) rotate(30deg);opacity:0}}
  .g4 .photo{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) rotate(-3deg);background:#fff;padding:1.2vh 1.2vh 7vh;box-shadow:0 2vh 5vh rgba(0,0,0,.5);z-index:9;animation:pop .6s}
  .g4 .photo canvas{display:block;width:60vh;height:45vh;object-fit:cover}
  .g4 .photo div{position:absolute;left:0;right:0;bottom:1.5vh;text-align:center;color:#0a1633;font-size:2.6vh;font-weight:700}
  .g4 .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:8}
  `;
  let duck = false, root, bot, lane, hit, powerBar, combo, flash, beatOn = false, nextBeat = 0, step = 0, peak = 0;
  function build(api) {
    api.stage.append(TC.h("style", {}, css));
    root = TC.h("div", { class: "g4" });
    { const py = TC.artImg("pyramids"); py.style.cssText = "position:absolute;left:3%;top:24%;width:34vh;height:32vh;opacity:.35;filter:hue-rotate(-20deg) saturate(.8)"; root.append(py); const py2 = TC.artImg("pyramids"); py2.style.cssText = "position:absolute;right:16%;top:28%;width:26vh;height:24vh;opacity:.25;transform:scaleX(-1)"; root.append(py2); }
    root.append(TC.h("div", { class: "spot", style: "left:5%" }), TC.h("div", { class: "spot", style: "right:5%;animation-delay:-2s" }));
    const floor = TC.h("div", { class: "floor" }); for (let i = 0; i < 60; i++) floor.append(TC.h("i", { style: `animation-delay:${-((i * 7) % 11) * 0.13}s` })); root.append(floor, TC.h("div", { class: "ball" }));
    bot = TC.h("div", { class: "bot", html: TC.ollieSVG() });
    lane = TC.h("div", { class: "lane" }); hit = TC.h("div", { class: "hit" }); lane.append(hit);
    const power = TC.h("div", { class: "power" }); powerBar = TC.h("i"); power.append(powerBar);
    combo = TC.h("div", { class: "combo" });
    flash = TC.h("div", { class: "flash" });
    root.append(bot, lane, power, TC.h("div", { class: "power-l zh" }, "聲音能量 VOICE"), combo, flash);
    buildPads();
    api.stage.append(root);
    (function meter() { const l = TC.Mic.level || 0; peak = Math.max(peak, l); powerBar.style.height = Math.min(100, l * 130) + "%"; requestAnimationFrame(meter); })();
  }
  // simple drum machine on the WebAudio clock
  function beatLoop() {
    if (!beatOn) return;
    const c = TC.ac(); if (!c) return;
    const spb = 60 / 100 / 2; // eighth notes at 100 BPM
    while (nextBeat < c.currentTime + 0.12) {
      const s = step % 8, delay = Math.max(0, (nextBeat - c.currentTime) * 1000);
      setTimeout(() => { if (!beatOn) return; if (duck) { if (s % 2 === 0) TC.sfx("hat"); return; } if (s === 0 || s === 4) TC.sfx("kick"); if (s === 2 || s === 6) TC.sfx("snare"); TC.sfx("hat"); if (s === 0) hit.animate([{ transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 250 }); }, delay);
      nextBeat += spb; step++;
    }
    setTimeout(beatLoop, 40);
  }
  function startBeat() { const c = TC.ac(); if (!c || beatOn) return; beatOn = true; nextBeat = c.currentTime + 0.05; step = 0; beatLoop(); }
  function stopBeat() { beatOn = false; }
  function pose(p) { bot.className = "bot " + (p || ""); }
  function notes(n = 6) { for (let i = 0; i < n; i++) { const d = TC.artImg("star", "note"); d.style.cssText = `left:${25 + Math.random() * 50}%;top:${28 + Math.random() * 22}%;animation-delay:${i * 0.1}s`; root.append(d); setTimeout(() => d.remove(), 2000); } }
  /** DJ time: the child taps the pads while everyone does the move */
  const PADS = [["#ff5fa2", "kick", "BOOM"], ["#4cc9ff", "snare", "CLAP"], ["#ffc83d", "hat", "TSS"], ["#2ee6b6", "levelup", "YEAH"]];
  let pads, djhint;
  function buildPads() {
    pads = TC.h("div", { class: "pads" }); djhint = TC.h("div", { class: "djhint zh" }, "👆 DJ TIME! 打節奏！");
    PADS.forEach(([c, s, t]) => { const p = TC.h("div", { class: "pad", style: `--pc:${c}` }, t);
      p.addEventListener("pointerdown", () => { TC.sfx(s); p.classList.add("hit"); setTimeout(() => p.classList.remove("hit"), 120); notes(2); root.append(Object.assign(TC.h("div", { class: "ring" }), { style: `border-color:${c}` })); setTimeout(() => root.querySelector(".ring") && root.querySelector(".ring").remove(), 700); bot.animate([{ transform: "scale(1)" }, { transform: "scale(1.1,.9)" }, { transform: "scale(1)" }], { duration: 200 }); });
      pads.append(p); });
    root.append(pads, djhint);
  }
  function djTime(on) { pads.classList.toggle("on", on); djhint.classList.toggle("on", on); lane.style.opacity = on ? 0 : 1; }
  let poseCard;
  async function slideIn(text, pose) {
    lane.querySelectorAll(".cmd").forEach((c) => c.remove());
    const c = TC.h("div", { class: "cmd" }, TC.artImg("pose-" + pose), text); lane.append(c);
    if (!poseCard) { poseCard = TC.h("div", { class: "posecard" }); root.append(poseCard); }
    poseCard.innerHTML = ""; poseCard.append(TC.artImg("pose-" + pose)); poseCard.classList.add("on");
    const lw = lane.clientWidth;
    await c.animate([{ left: "100%" }, { left: (hit.offsetLeft + hit.offsetWidth + 20) / lw * 100 + "%" }], { duration: 1500, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }).finished;
    hit.classList.add("pulse"); return c;
  }
  async function snapshot() {
    flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600 }); TC.sfx("click");
    const cvs = document.createElement("canvas"); cvs.width = 960; cvs.height = 720; const ctx = cvs.getContext("2d");
    let ok = false;
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } } });
      const v = TC.h("video", { playsinline: "", muted: "" }); v.srcObject = st; await v.play(); await TC.sleep(400);
      const r = Math.max(960 / v.videoWidth, 720 / v.videoHeight), w = v.videoWidth * r, hh = v.videoHeight * r;
      ctx.translate(960, 0); ctx.scale(-1, 1); ctx.drawImage(v, (960 - w) / 2, (720 - hh) / 2, w, hh); ctx.setTransform(1, 0, 0, 1, 0, 0);
      st.getTracks().forEach((t) => t.stop()); ok = true;
    } catch (e) {}
    if (!ok) { // no camera: a party card with Ollie instead of a photo
      const g = ctx.createLinearGradient(0, 0, 960, 720); g.addColorStop(0, "#ff5fa2"); g.addColorStop(1, "#9b6bff"); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 720);
      const o = new Image(); o.src = TC.art("ollie"); await new Promise((r) => { o.onload = r; o.onerror = r; setTimeout(r, 800); });
      try { ctx.drawImage(o, 330, 90, 300, 348); } catch (e) {}
      ctx.font = "700 110px Fredoka"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("SAY CHEESE!", 480, 560); }
    ctx.fillStyle = "rgba(10,22,51,.55)"; ctx.fillRect(0, 640, 960, 80); ctx.fillStyle = "#ffc83d"; ctx.font = "700 40px Fredoka"; ctx.textAlign = "center";
    ctx.fillText("TUCHENG ENGLISH DAY · GATE 4 BEAT PARTY", 480, 695);
    return cvs;
  }

  TC.games.beat = {
    mount(api) { build(api); },
    idle() { stopBeat(); pose("dance"); combo.textContent = ""; lane.querySelectorAll(".cmd").forEach((c) => c.remove()); root.querySelectorAll(".photo").forEach((p) => p.remove()); },
    async play(api) {
      const G = api.G; let streak = 0;
      root.querySelectorAll(".photo").forEach((p) => p.remove());
      pose(""); startBeat();
      await TC.speak("You are the boss! Tell everyone what to do!");
      const L0 = api.level, moves = G.moves[L0].slice(0, TC.rounds(5));
      const N = moves.length + 1;
      for (let i = 0; i < moves.length; i++) {
        api.progress(i, N);
        const m = moves[i];
        await slideIn(m.say, m.pose);
        peak = 0; duck = true; // keep the music soft while the AI listens
        const t0 = Date.now();
        const r = await api.ask({ teacher: G.teacher, tzh: "你是老大！大聲叫大家做動作！", say: m.say, zh: "老師和家長要跟著做喔！", keys: m.keys, word: m.keys[0][0] });
        duck = false;
        if (api.aborted) { stopBeat(); return null; }
        hit.classList.remove("pulse");
        const fast = Date.now() - t0 < 5000, loud = peak > 0.45;
        streak = r.ok ? streak + 1 : 0;
        combo.textContent = streak > 1 ? `COMBO ×${streak}` : "";
        TC.floatText(loud ? "LOUD & PROUD!" : fast ? "PERFECT!" : "GREAT!", 50, 30, loud ? "#ff5fa2" : "#2ee6b6");
        TC.confetti(loud ? 160 : 70);
        pose(m.pose); notes(loud ? 10 : 5); TC.hideTalk(); djTime(true);
        await TC.sleep(4200); djTime(false); pose(""); poseCard && poseCard.classList.remove("on");
      }
      api.progress(moves.length, N);
      const F = G.finale, L = api.level;
      pose("stand");
      await TC.speak("Photo time! Everybody, smile!");
      duck = true;
      const r = await api.ask({ teacher: F.teacher, tzh: F.zh, say: F.say[L], zh: "說完就拍照！", keys: F.keys[L], word: "cheese" });
      duck = false;
      if (api.aborted) { stopBeat(); return null; }
      TC.hideTalk(); lane.querySelectorAll(".cmd").forEach((c) => c.remove()); hit.classList.remove("pulse"); poseCard && poseCard.classList.remove("on");
      const cvs = await snapshot();
      const ph = TC.h("div", { class: "photo" }, cvs, TC.h("div", {}, `${api.kid.name} & friends · Say cheese!`));
      root.append(ph); TC.sfx("fanfare"); TC.confetti(200); pose("dance");
      await TC.sleep(5500);
      ph.remove(); stopBeat(); pose("");
      api.progress(N, N);
      return { ok: true };
    }
  };
})();
