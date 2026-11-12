/* Gate 3 · Pet Hatch — tap the egg to crack it, name the shadow inside, hatch a pet with a rarity glow
   (egg-hatching / pet-collecting loop, as in today's most-played kids' games; passport L1 animals + L9/L10 adjectives) */
(function () {
  "use strict";
  TC.games = TC.games || {};
  const css = `
  .g3{position:absolute;inset:0;overflow:hidden;background:radial-gradient(120% 70% at 50% 0%,#bfeaff,#8fd3ff 40%,#77c96a 62%,#4fae4a)}
  .g3 .hill{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 30%,#9be27a,#5fbf4f)}
  .g3 .deco{position:absolute;pointer-events:none}
  .g3 .nest{position:absolute;left:50%;top:70%;width:46vh;height:13vh;margin-left:-23vh;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#ffe08a,#c98a3a 55%,#7a4a1c);box-shadow:0 2vh 3vh rgba(0,0,0,.25),inset 0 -1vh 2vh rgba(0,0,0,.3)}
  .g3 .stage{position:absolute;left:50%;top:22%;width:44vh;height:50vh;margin-left:-22vh;touch-action:manipulation;cursor:pointer}
  .g3 .aura{position:absolute;left:50%;top:50%;width:90vh;height:90vh;margin:-45vh 0 0 -45vh;border-radius:50%;opacity:0;transition:opacity .5s;pointer-events:none;
     background:repeating-conic-gradient(var(--aura) 0 10deg,transparent 10deg 24deg);animation:spin 7s linear infinite;-webkit-mask:radial-gradient(circle,#000 8%,transparent 62%);mask:radial-gradient(circle,#000 8%,transparent 62%)}
  .g3 .aura.on{opacity:.85}
  .g3 .egg{position:absolute;inset:0;transform-origin:50% 90%;transition:transform .15s}
  .g3 .egg img{width:100%;height:100%;filter:drop-shadow(0 0 3vh var(--glow))}
  .g3 .egg.wob{animation:eggwob .35s}
  @keyframes eggwob{25%{transform:rotate(-9deg) scale(1.04,.96)}75%{transform:rotate(9deg) scale(.97,1.03)}}
  .g3 .egg.idle{animation:eggidle 1.6s ease-in-out infinite}
  @keyframes eggidle{0%,100%{transform:rotate(0)}10%{transform:rotate(-5deg)}20%{transform:rotate(5deg)}30%{transform:rotate(0)}}
  .g3 .cracks{position:absolute;inset:0;pointer-events:none}
  .g3 .cracks path{stroke:#3a2a5a;stroke-width:3.5;fill:none;stroke-linecap:round;stroke-linejoin:round;opacity:0;transition:opacity .2s}
  .g3 .cracks path.on{opacity:.85}
  .g3 .top,.g3 .bot{position:absolute;inset:0}
  .g3 .top{clip-path:polygon(0 0,100% 0,100% 47%,88% 53%,76% 45%,64% 54%,52% 45%,40% 54%,28% 45%,16% 53%,0 46%);transition:transform .7s cubic-bezier(.3,1.4,.5,1)}
  .g3 .bot{clip-path:polygon(0 46%,16% 53%,28% 45%,40% 54%,52% 45%,64% 54%,76% 45%,88% 53%,100% 47%,100% 100%,0 100%)}
  .g3 .top img,.g3 .bot img{position:absolute;inset:0;width:100%;height:100%}
  .g3 .peek .cracks,.g3 .pop .cracks{opacity:0}
  .g3 .peek .top{transform:translateY(-30%) rotate(-12deg)}
  .g3 .pop .top{transform:translate(-60vh,-80vh) rotate(-140deg)}
  .g3 .pop .bot{transition:transform .7s ease-in;transform:translate(40vh,60vh) rotate(120deg)}
  .g3 .pet{position:absolute;left:8%;right:8%;top:6%;bottom:8%;opacity:0;transform:scale(.6) translateY(20%);transition:transform .7s cubic-bezier(.2,1.6,.4,1),opacity .3s,filter .6s}
  .g3 .pet img{width:100%;height:100%}
  .g3 .peek .pet{opacity:1;filter:brightness(.12) saturate(0) drop-shadow(0 0 2vh #fff);transform:scale(.62) translateY(4%)}
  .g3 .pop .pet{opacity:1;filter:none drop-shadow(0 2vh 2vh rgba(0,0,0,.3));transform:scale(1.05) translateY(-6%)}
  .g3 .pop .pet img{animation:petjoy .8s ease-in-out infinite}
  @keyframes petjoy{50%{transform:translateY(-6%) scale(1.04,.96)}}
  .g3 .tapme{position:absolute;left:50%;top:84%;transform:translateX(-50%);font-size:3.4rem;font-weight:700;color:#fff;text-shadow:0 .3rem 0 #0a1633,0 0 1.5rem #0a1633;white-space:nowrap;animation:float 1s ease-in-out infinite}
  .g3 .rar{position:absolute;left:50%;top:13%;transform:translateX(-50%);font-size:3.6rem;font-weight:700;letter-spacing:.15em;color:#fff;text-shadow:0 0 1.5rem var(--glow),0 .3rem 0 #0a1633;white-space:nowrap}
  .g3 .name{position:absolute;left:50%;top:66%;transform:translateX(-50%);font-size:6rem;font-weight:700;color:#fff;text-shadow:0 .4rem 0 #0a1633,0 0 2rem #0a1633;opacity:0;transition:opacity .3s;white-space:nowrap}
  .g3 .name.on{opacity:1}
  .g3 .pets{position:absolute;right:1.4rem;top:8.6rem;display:flex;flex-direction:column;gap:.8rem;z-index:6}
  .g3 .pcard{width:13rem;border-radius:1.4rem;padding:.5rem;text-align:center;background:linear-gradient(180deg,#fff,#eef2ff);color:#0a1633;box-shadow:0 .5rem 0 var(--rc),0 1rem 1.6rem rgba(0,0,0,.3);border:.35rem solid var(--rc);animation:pop .5s;cursor:pointer;touch-action:manipulation}
  .g3 .pcard img{width:8rem;height:8rem}
  .g3 .pcard b{display:block;font-size:1.8rem}
  .g3 .pcard small{font-size:1.1rem;font-weight:700;color:var(--rc)}
  .g3 .pcard .trait{font-size:1.2rem;font-weight:600;color:#5a6aa8}
  .g3 .lineup .pcard .trait{font-size:2rem}
  .g3 .lineup{position:absolute;inset:9rem 2rem 24vh;display:flex;align-items:center;justify-content:center;gap:2.4rem;z-index:7}
  .g3 .lineup .pcard{width:22rem;transform:scale(1);transition:transform .2s}
  .g3 .lineup .pcard img{width:15rem;height:15rem}
  .g3 .lineup .pcard b{font-size:3rem}
  .g3 .lineup .pcard.sel{transform:scale(1.15) rotate(-3deg);box-shadow:0 0 0 .6rem #fff,0 0 4rem var(--rc)}
  `;
  const RAR = [{ n: "COMMON", egg: "#5ab0ff", glow: "#7fd3ff", aura: "rgba(127,211,255,.55)", rc: "#3d8bff" },
               { n: "RARE", egg: "#9b6bff", glow: "#c9a8ff", aura: "rgba(180,140,255,.6)", rc: "#9b6bff" },
               { n: "EPIC", egg: "#ff5fa2", glow: "#ff9ac2", aura: "rgba(255,120,180,.6)", rc: "#ff3d8a" },
               { n: "LEGENDARY", egg: "#ffc83d", glow: "#ffe58a", aura: "rgba(255,210,80,.75)", rc: "#e8a21a" }];
  const CRACKS = ["M100 70 l-14 18 l12 10 l-10 16", "M100 70 l14 14 l-8 14 l14 12", "M60 100 l16 6 l6 -14 l18 8", "M140 104 l-18 4 l-4 -14 l-16 10", "M52 96 Q100 84 148 96"];
  let root, stage, egg, eggTop, eggBot, cracks, pet, aura, rar, nameEl, tapme, pets;

  function build(api) {
    api.stage.append(TC.h("style", {}, css));
    root = TC.h("div", { class: "g3" });
    root.append(TC.h("div", { class: "hill", style: "left:-12%;top:52%;width:62%;height:44%" }), TC.h("div", { class: "hill", style: "right:-16%;top:56%;width:70%;height:44%" }));
    { const e = TC.artImg("eiffel", "deco"); e.style.cssText = "left:76%;top:16%;width:22vh;height:30vh;opacity:.85"; root.append(e); }
    [[4, 34, 15], [17, 40, 11], [72, 36, 14], [86, 42, 12]].forEach(([x, y, w]) => { const t = TC.artImg("tree", "deco"); t.style.cssText = `left:${x}%;top:${y}%;width:${w}vh`; root.append(t); });
    [[8, 12, 16], [62, 6, 20]].forEach(([x, y, w]) => { const c = TC.artImg("cloud", "deco"); c.style.cssText = `left:${x}%;top:${y}%;width:${w}vh;opacity:.9;animation:float ${4 + x / 20}s ease-in-out infinite`; root.append(c); });
    aura = TC.h("div", { class: "aura" });
    stage = TC.h("div", { class: "stage" });
    pet = TC.h("div", { class: "pet" }, TC.h("img", { alt: "" }));
    eggTop = TC.h("div", { class: "top" }, TC.h("img", { alt: "" }));
    eggBot = TC.h("div", { class: "bot" }, TC.h("img", { alt: "" }));
    cracks = TC.h("div", { class: "cracks", html: `<svg viewBox="0 0 200 200" width="100%" height="100%">${CRACKS.map((d) => `<path d="${d}"/>`).join("")}</svg>` });
    egg = TC.h("div", { class: "egg" }, eggBot, pet, eggTop, cracks);
    stage.append(egg);
    rar = TC.h("div", { class: "rar" }); nameEl = TC.h("div", { class: "name" }); tapme = TC.h("div", { class: "tapme hidden zh" }, "👆 TAP TAP TAP! 點蛋三下！");
    pets = TC.h("div", { class: "pets" });
    root.append(aura, TC.h("div", { class: "nest" }), stage, rar, nameEl, tapme, pets);
    api.stage.append(root);
    stage.addEventListener("pointerdown", () => tapHandler && tapHandler());
  }
  let tapHandler = null;
  function setEgg(r) {
    root.style.setProperty("--glow", r.glow); root.style.setProperty("--aura", r.aura);
    const src = TC.art("mystegg", r.egg);
    eggTop.firstChild.src = src; eggBot.firstChild.src = src;
    cracks.querySelectorAll("path").forEach((p) => p.classList.remove("on"));
    stage.className = "stage"; egg.className = "egg idle"; aura.classList.remove("on"); nameEl.classList.remove("on");
  }
  function burst(n = 18) {
    const r = stage.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const d = TC.h("div", { style: `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height * 0.4}px;width:2vh;height:2.6vh;border-radius:50% 50% 45% 45%;background:#fff8ec;z-index:9;box-shadow:inset -.3vh -.3vh 0 rgba(0,0,0,.12)` });
      document.body.append(d);
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 30;
      d.animate([{ transform: "translate(0,0) rotate(0)" }, { transform: `translate(${Math.cos(a) * v}vh,${Math.sin(a) * v - 10}vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 400, easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => d.remove();
    }
  }
  /** child taps the egg 3 times (or teacher presses Enter / waits) */
  function tapToCrack() {
    return new Promise((res) => {
      let taps = 0; tapme.classList.remove("hidden");
      const paths = cracks.querySelectorAll("path");
      const hit = () => {
        taps++; egg.classList.remove("idle", "wob"); void egg.offsetWidth; egg.classList.add("wob");
        TC.sfx(taps < 3 ? "pop" : "catch"); burst(5);
        paths[Math.min(paths.length - 1, taps * 2 - 2)].classList.add("on"); if (paths[taps * 2 - 1]) paths[taps * 2 - 1].classList.add("on");
        if (taps >= 3) { tapHandler = null; TC.pending = null; clearTimeout(t); tapme.classList.add("hidden"); res(); }
      };
      tapHandler = hit; TC.pending = () => { while (taps < 3) hit(); };
      const t = setTimeout(() => { if (taps < 3) TC.pending && TC.pending(); }, 15000);
    });
  }
  function addCard(it, r, parent = pets) {
    const trait = it.fin3.replace(/^(It is |It |Birds )/, "");
    const c = TC.h("div", { class: "pcard", style: `--rc:${r.rc}` }, TC.artImg(it.img), TC.h("b", {}, cap(it.w)), TC.h("small", {}, "★ " + r.n), TC.h("div", { class: "trait" }, trait));
    parent.append(c); return c;
  }

  TC.games.hatch = {
    mount(api) { build(api); this.idle(api); },
    idle() { pets.innerHTML = ""; setEgg(RAR[3]); pet.firstChild.src = TC.art("ollie"); tapHandler = null; root.querySelectorAll(".lineup").forEach((l) => l.remove()); rar.textContent = "PET HATCH"; },
    async play(api) {
      const G = api.G; pets.innerHTML = "";
      const items = G.items.slice().sort(() => Math.random() - 0.5).slice(0, TC.rounds(4)), got = [];
      const N = items.length + 1;
      await TC.speak("Tap the egg! What's inside?");
      for (let i = 0; i < items.length; i++) {
        api.progress(i, N);
        const it = items[i], L = api.level;
        const r = i === items.length - 1 ? RAR[3] : RAR[[0, 0, 1, 2][(Math.random() * 4) | 0]];
        setEgg(r); pet.firstChild.src = TC.art(it.img);
        rar.textContent = `${r.n} EGG!`; TC.sfx("whoosh");
        stage.animate([{ transform: "translateY(-60vh)" }, { transform: "translateY(0)" }], { duration: 650, easing: "cubic-bezier(.3,1.5,.5,1)" });
        await TC.sleep(700);
        await tapToCrack(); if (api.aborted) return null;
        stage.classList.add("peek"); TC.sfx("drum");
        const say = L === 1 ? cap(it.w) + "!" : L === 2 ? `It's ${it.art || "a"} ${it.w}.` : it.s3;
        const keys = L === 3 ? [[it.w], it.k3] : [[it.w]];
        const distractors = G.items.filter((x) => x.w !== it.w).map((x) => ({ w: x.w }));
        const res = await api.ask({ teacher: G.teacher, tzh: "蛋裡是什麼動物？", say, zh: "", keys, word: it.w, distractors, hideKey: true,
          onWrong: (w) => { egg.classList.remove("wob"); void egg.offsetWidth; egg.classList.add("wob"); TC.sfx("wrong"); TC.toast(`Not a ${w}! Look again! 再看看！`, 1800); } });
        if (api.aborted) return null;
        TC.hideTalk();
        stage.classList.remove("peek"); stage.classList.add("pop"); aura.classList.add("on"); burst(22);
        TC.sfx(r.n === "LEGENDARY" ? "fanfare" : "levelup"); TC.confetti(r.n === "LEGENDARY" ? 220 : 90, [r.egg, r.glow, "#fff"]);
        nameEl.textContent = cap(it.w) + "!"; nameEl.classList.add("on"); rar.textContent = `★ ${r.n} ★`;
        await TC.speak(`${it.art === "an" ? "An" : "A"} ${it.w}! ${it.fin3}`);
        // advanced travellers describe their new pet
        if (L === 3 && it.color && !TC.cfg.rounds) {
          const COLS = Object.keys(TC_CONTENT.gates[2].colors);
          const fr = await api.ask({ teacher: "What color is it?", tzh: "牠是什麼顏色？", say: `It is ${it.color}.`, zh: "說出牠的顏色", keys: [COLS], word: it.color });
          if (api.aborted) return null;
          TC.hideTalk();
          const said = TC.pickHeard(fr.heard, COLS) || it.color;
          await TC.speak(it.color.split(" and ").includes(said) ? `Yes! The ${it.w} is ${it.color}.` : `${cap(said)}? Cool! I think it is ${it.color}.`);
        }
        await TC.sleep(600);
        got.push({ it, r }); addCard(it, r);
      }
      api.progress(items.length, N);
      // finale: tap your favourite pet, then say it
      setEgg(RAR[3]); stage.className = "stage hidden"; rar.textContent = "MY PETS"; aura.classList.add("on");
      const line = TC.h("div", { class: "lineup" }); root.append(line);
      let chosen = got[0];
      const cards = got.map((g) => { const c = addCard(g.it, g.r, line); c.onclick = () => { chosen = g; cards.forEach((x) => x.classList.remove("sel")); c.classList.add("sel"); TC.sfx("pop"); TC.model(g.it.w, g.it.w); if (TC.pending) TC.pending(); }; return c; });
      pets.innerHTML = "";
      await TC.speak("Which one do you like? Tap it!");
      await TC.waitAction(9000);
      cards[got.indexOf(chosen)].classList.add("sel");
      const F = G.finale, L = api.level, it = chosen.it;
      const fill = (s) => s.replace("[Animal]", cap(it.w)).replace("[animal]", it.w).replace("[fin3]", it.fin3);
      const r = await api.ask({ teacher: F.teacher, tzh: F.zh, say: fill(F.say[L]), zh: "說出你最喜歡的寵物", keys: [got.map((g) => g.it.w)], word: it.w });
      if (api.aborted) { line.remove(); return null; }
      const pw = TC.pickHeard(r.heard, got.map((g) => g.it.w));
      const fav = got.find((g) => g.it.w === pw) || chosen;
      cards.forEach((x) => x.classList.remove("sel")); const fc = cards[got.indexOf(fav)]; fc.classList.add("sel");
      fc.animate([{ transform: "scale(1.15)" }, { transform: "scale(1.35) rotate(4deg)" }, { transform: "scale(1.15)" }], { duration: 500, iterations: 3 });
      TC.sfx("fanfare"); TC.confetti(180);
      await TC.speak(`The ${fav.it.w}! ${fav.it.fin3}`);
      await TC.sleep(1200); line.remove(); stage.className = "stage"; aura.classList.remove("on");
      api.progress(N, N);
      return { ok: true };
    }
  };
  function cap(w) { return w[0].toUpperCase() + w.slice(1); }
})();
