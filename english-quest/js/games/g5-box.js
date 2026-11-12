/* Gate 5 · Mystery Box — listen to the clues, guess the food, open the box (passport L19–21 food, L9 sweet/sour) */
(function () {
  "use strict";
  TC.games = TC.games || {};
  const css = `
  .g5{position:absolute;inset:0;overflow:hidden;background:radial-gradient(80% 70% at 50% 45%,#3a2a7a,#0d0a26)}
  .g5 .shelf{position:absolute;left:0;right:0;top:66%;height:4%;background:linear-gradient(#b07a4a,#6d4527);box-shadow:0 1vh 2vh rgba(0,0,0,.5)}
  .g5 .boxw{position:absolute;left:50%;top:26%;width:30vh;height:30vh;margin-left:-15vh;transform-origin:50% 100%}
  .g5 .boxw.drop{animation:dropIn .8s cubic-bezier(.3,1.4,.5,1)}
  .g5 .boxw.shake{animation:shake .45s infinite}
  @keyframes dropIn{from{transform:translateY(-80vh)}}
  .g5 .boxw{perspective:120vh}
  .g5 .cube{position:absolute;left:calc(50% - 11vh);width:22vh;bottom:4%;height:22vh;transform-style:preserve-3d;animation:cubeTurn 6s ease-in-out infinite}
  @keyframes cubeTurn{0%,100%{transform:rotateX(-14deg) rotateY(-28deg)}50%{transform:rotateX(-14deg) rotateY(28deg)}}
  .g5 .face{position:absolute;inset:0;border-radius:1vh;display:grid;place-items:center;backface-visibility:hidden;
     background:linear-gradient(90deg,transparent 42%,#ffe58a 42%,#ffd21f 58%,transparent 58%),linear-gradient(135deg,color-mix(in srgb,var(--c1) 70%,#fff),var(--c1) 45%,var(--c2));
     box-shadow:inset 0 0 0 .5vh rgba(255,255,255,.25),inset 0 -2vh 3vh rgba(0,0,0,.2)}
  .g5 .face b{font-size:12vh;color:#fff;text-shadow:0 .6vh 0 rgba(0,0,0,.25),0 0 2vh rgba(255,255,255,.6)}
  .g5 .f-front{transform:translateZ(11vh)}.g5 .f-back{transform:rotateY(180deg) translateZ(11vh)}
  .g5 .f-right{transform:rotateY(90deg) translateZ(11vh)}.g5 .f-left{transform:rotateY(-90deg) translateZ(11vh)}
  .g5 .f-bottom{transform:rotateX(-90deg) translateZ(11vh);filter:brightness(.6)}
  .g5 .lid3{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,1.4,.5,1),opacity .8s}
  .g5 .f-top{transform:rotateX(90deg) translateZ(11vh);background:linear-gradient(90deg,transparent 42%,#ffe58a 42%,#ffd21f 58%,transparent 58%),linear-gradient(0deg,transparent 42%,#ffe58a 42%,#ffd21f 58%,transparent 58%),linear-gradient(135deg,color-mix(in srgb,var(--c2) 60%,#fff),var(--c2))}
  .g5 .bow{position:absolute;left:50%;top:6.5vh;z-index:2;width:16vh;height:10vh;margin-left:-8vh;transform:translateZ(0) translateY(-50%);pointer-events:none;
     background:radial-gradient(circle at 50% 60%,#ffe58a 0 18%,transparent 19%),radial-gradient(ellipse 34% 48% at 26% 50%,#ffd21f 60%,transparent 62%),radial-gradient(ellipse 34% 48% at 74% 50%,#ffd21f 60%,transparent 62%);filter:drop-shadow(0 .5vh .5vh rgba(0,0,0,.3))}
  .g5 .open .lid3{transform:translateY(-55vh) rotateX(70deg) rotateZ(30deg);opacity:0}
  .g5 .open .cube{animation-play-state:paused}
  .g5 .open .f-front b{opacity:0}
  .g5 .beams{position:absolute;left:50%;top:50%;width:120vh;height:120vh;margin:-60vh 0 0 -60vh;border-radius:50%;opacity:0;background:repeating-conic-gradient(var(--beam) 0 8deg,transparent 8deg 22deg);transition:opacity .4s;animation:spin 6s linear infinite;mask:radial-gradient(circle,#000 10%,transparent 60%);-webkit-mask:radial-gradient(circle,#000 10%,transparent 60%)}
  .g5 .open .beams{opacity:.9}
  .g5 .open .bow{opacity:0;transition:opacity .3s}
  .g5 .item{position:absolute;left:50%;top:30%;width:26vh;height:26vh;margin-left:-13vh;opacity:0;transform:scale(.2) translateY(30vh)}
  .g5 .open .item{animation:itemUp 1s cubic-bezier(.2,1.5,.4,1) forwards}
  @keyframes itemUp{to{opacity:1;transform:scale(1) translateY(-14vh) rotate(360deg)}}
  .g5 .rar{position:absolute;left:50%;top:9%;transform:translateX(-50%);font-size:3.2rem;font-weight:700;letter-spacing:.2em;opacity:0;text-shadow:0 0 2rem currentColor}
  .g5 .open .rar{opacity:1;transition:opacity .4s .5s}
  .g5 .clues{position:absolute;left:3%;top:18%;width:27%;display:flex;flex-direction:column;gap:1.4vh}
  .g5 .clue{height:9vh;perspective:60vh}
  .g5 .clue .in{position:relative;width:100%;height:100%;transition:transform .6s;transform-style:preserve-3d}
  .g5 .clue.on .in{transform:rotateY(180deg)}
  .g5 .clue .f,.g5 .clue .b{position:absolute;inset:0;border-radius:1.4vh;display:flex;align-items:center;gap:1rem;padding:0 1.4rem;backface-visibility:hidden;font-weight:700}
  .g5 .clue .f{background:#2b3f7a;font-size:3rem;justify-content:center}
  .g5 .clue .b{background:#fff;color:#0a1633;font-size:2.4rem;transform:rotateY(180deg)}
  .g5 .clue .b em{font-style:normal;background:#9b6bff;color:#fff;border-radius:50%;width:3rem;height:3rem;display:grid;place-items:center;font-size:1.6rem;flex:0 0 auto}
  .g5 .shelfItems{position:absolute;right:3%;top:16%;display:flex;flex-direction:column;gap:1.5vh;padding:1.5vh;border-radius:2vh;background:rgba(255,255,255,.08);min-height:12vh}
  .g5 .shelfItems img{width:10vh;height:10vh;animation:pop .5s}
  .g5 .boxw,.g5 .clue{cursor:pointer;touch-action:manipulation}
  .g5 .tapopen{position:absolute;left:50%;top:76%;transform:translateX(-50%);font-size:3.2rem;font-weight:700;color:#ffc83d;text-shadow:0 .3rem 0 #000;animation:float 1s ease-in-out infinite;white-space:nowrap}
  .g5 .label{position:absolute;left:50%;top:70%;transform:translateX(-50%);font-size:5rem;font-weight:700;opacity:0;transition:opacity .3s;text-shadow:0 .3rem 0 #000}
  .g5 .open .label{opacity:1}
  `;
  const RAR = [{ n: "COMMON", c1: "#3d8bff", c2: "#2ee6b6", beam: "rgba(76,201,255,.55)", col: "#4cc9ff" },
               { n: "RARE", c1: "#9b6bff", c2: "#ff5fa2", beam: "rgba(155,107,255,.6)", col: "#c9a8ff" },
               { n: "EPIC", c1: "#ff5fa2", c2: "#ff9a2e", beam: "rgba(255,95,162,.6)", col: "#ff8cc0" },
               { n: "LEGENDARY", c1: "#ffc83d", c2: "#ff9a2e", beam: "rgba(255,210,80,.75)", col: "#ffc83d" }];
  let root, boxw, scene, clueBox, itemImg, rarEl, labelEl, shelf, tapOpen, openReady = false, flipNext = null;
  function build(api) {
    api.stage.append(TC.h("style", {}, css));
    root = TC.h("div", { class: "g5" });
    scene = TC.h("div", { class: "scene", style: "position:absolute;inset:0" });
    const beams = TC.h("div", { class: "beams" });
    const F = (cls, txt) => TC.h("div", { class: "face " + cls }, txt ? TC.h("b", {}, txt) : null);
    boxw = TC.h("div", { class: "boxw" }, TC.h("div", { class: "cube" }, F("f-back"), F("f-left"), F("f-right"), F("f-bottom"), F("f-front", "?"),
      TC.h("div", { class: "lid3" }, F("f-top"))), TC.h("div", { class: "bow" }));
    itemImg = TC.h("img", { class: "item", alt: "" });
    rarEl = TC.h("div", { class: "rar" }); labelEl = TC.h("div", { class: "label" });
    scene.append(beams, boxw, itemImg, rarEl, labelEl);
    clueBox = TC.h("div", { class: "clues" });
    shelf = TC.h("div", { class: "shelfItems" });
    tapOpen = TC.h("div", { class: "tapopen hidden zh" }, "👆 TAP TO OPEN! 點箱子打開！");
    const bg = TC.h("div", { style: "position:absolute;inset:0;pointer-events:none" });
    { const m = TC.artImg("mountains"); m.style.cssText = "position:absolute;left:50%;top:22%;width:120vh;height:46vh;margin-left:-60vh;opacity:.22"; bg.append(m); }
    ["apple", "pizza", "cake", "strawberry", "ice-cream", "banana", "cookie", "watermelon"].forEach((n, i) => { const im = TC.artImg(n); im.style.cssText = `position:absolute;left:${[34, 62, 44, 72, 30, 58, 78, 40][i]}%;top:${[8, 10, 60, 40, 34, 70, 64, 18][i]}%;width:${8 + (i % 3) * 3}vh;opacity:.18;filter:blur(2px);animation:drift ${7 + i}s ease-in-out ${-i}s infinite alternate`; bg.append(im); });
    root.append(bg, TC.h("div", { class: "shelf" }), shelf, scene, clueBox, tapOpen);
    api.stage.append(root);
    boxw.addEventListener("pointerdown", () => {
      if (TC.pending && openReady) { TC.pending(); return; }
      boxw.classList.remove("shake"); void boxw.offsetWidth; boxw.classList.add("shake"); TC.sfx("snare"); setTimeout(() => boxw.classList.remove("shake"), 450);
    });
    setRar(RAR[1]);
  }
  function setRar(r) { scene.style.setProperty("--c1", r.c1); scene.style.setProperty("--c2", r.c2); scene.style.setProperty("--beam", r.beam); rarEl.textContent = "★ " + r.n + " ★"; rarEl.style.color = r.col; }
  function makeClues(list) {
    clueBox.innerHTML = "";
    return list.map((t, i) => { const c = TC.h("div", { class: "clue", onpointerdown: () => flipNext && flipNext() }, TC.h("div", { class: "in" }, TC.h("div", { class: "f" }, `CLUE ${i + 1} ❓`), TC.h("div", { class: "b" }, TC.h("em", {}, i + 1 + ""), t))); clueBox.append(c); return c; });
  }

  TC.games.box = {
    mount(api) { build(api); },
    idle() { scene.classList.remove("open"); boxw.className = "boxw"; clueBox.innerHTML = ""; shelf.innerHTML = ""; setRar(RAR[1]); },
    async play(api) {
      const G = api.G; shelf.innerHTML = "";
      const items = G.items.slice().sort(() => Math.random() - 0.5).slice(0, TC.rounds(4));
      const got = [], N = items.length + 1;
      for (let i = 0; i < items.length; i++) {
        api.progress(i, N);
        const it = items[i], L = api.level;
        const rar = i === items.length - 1 ? RAR[3] : RAR[[0, 1, 2][(Math.random() * 3) | 0]];
        setRar(rar); scene.classList.remove("open"); boxw.className = "boxw"; void boxw.offsetWidth; boxw.classList.add("drop");
        TC.sfx("whoosh"); await TC.sleep(800);
        const cards = makeClues(it.clues);
        let shown = 0, done = false;
        const flip = async () => { if (shown >= cards.length || done) return; const c = cards[shown++]; c.classList.add("on"); TC.sfx("pop"); await TC.speak(it.clues[shown - 1]); };
        flipNext = () => { if (!TC.isQuiet()) flip(); };
        await flip();
        const timer = setInterval(() => { if (!done) flip(); }, 9000);
        const say = L === 1 ? cap(it.w) + "!" : L === 2 ? it.q2 : it.s3;
        const keys = it.keys || [[it.w]];
        const distractors = G.items.filter((x) => x.w !== it.w).map((x) => ({ w: x.w, keys: x.keys || [[x.w]] }));
        const r = await api.ask({ teacher: G.teacher, tzh: "聽線索，猜猜是什麼？", say, zh: "", keys, word: it.w, distractors, autoModel: false, hideKey: true,
          onWrong: (w) => { boxw.classList.add("shake"); TC.sfx("wrong"); TC.toast(`No, it isn't ${w}! 不是喔！`, 1600); setTimeout(() => boxw.classList.remove("shake"), 700); setTimeout(flip, 900); } });
        done = true; clearInterval(timer); flipNext = null;
        if (api.aborted) return null;
        TC.hideTalk();
        cards.forEach((c) => c.classList.add("on"));
        tapOpen.classList.remove("hidden"); openReady = true; TC.sfx("pop");
        await TC.waitAction(7000, "👆 點禮物盒，打開看看裡面是什麼！", "等孩子點；或按 <kbd>✓ 說得好</kbd>（或 Enter），7 秒後也會自動打開"); openReady = false; tapOpen.classList.add("hidden");
        boxw.classList.add("shake"); TC.sfx("drum"); await TC.sleep(1000); boxw.classList.remove("shake");
        itemImg.src = TC.art(it.img); labelEl.textContent = cap(it.w) + "!";
        scene.classList.add("open"); TC.sfx(i === items.length - 1 ? "fanfare" : "levelup"); TC.confetti(i === items.length - 1 ? 220 : 100, [rar.c1, rar.c2, "#fff"]);
        await TC.speak(`Yes, it is! ${cap(it.w)}!`);
        // follow-up conversation for intermediate/advanced travellers
        if (L >= 2 && !TC.cfg.rounds) {
          const q = `Do you like ${it.like}?`;
          const fr = await api.ask({ teacher: q, tzh: `你喜歡${it.zh}嗎？`, say: L === 3 ? `Yes, I do. I like ${it.like}!` : "Yes, I do!", zh: "也可以說 No, I don't.", keys: [["yes", "yeah", "no", "nope"]], word: "yes" });
          if (api.aborted) return null;
          TC.hideTalk();
          if (/\bno\b|don'?t/i.test(fr.heard || "")) await TC.speak("That's OK!"); else await TC.speak("Me too!");
        }
        await TC.sleep(800);
        got.push(it); shelf.append(TC.artImg(it.img));
        scene.classList.remove("open"); boxw.className = "boxw";
        await TC.sleep(300);
      }
      api.progress(items.length, N);
      clueBox.innerHTML = "";
      const F = G.finale, L = api.level;
      const r = await api.ask({ teacher: F.teacher, tzh: F.zh, say: F.say[L], zh: "我們來開派對吃東西！", keys: F.keys[L], word: "hungry" });
      if (api.aborted) return null;
      shelf.querySelectorAll("img").forEach((im, k) => im.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6vh) scale(1.3)" }, { transform: "translateY(0)" }], { duration: 600, delay: k * 120, iterations: 3 }));
      TC.sfx("fanfare"); TC.confetti(200);
      await TC.speak("Yummy! Let's eat!");
      await TC.sleep(1200);
      api.progress(N, N);
      return { ok: true };
    }
  };
  function cap(w) { return w[0].toUpperCase() + w.slice(1); }
})();
