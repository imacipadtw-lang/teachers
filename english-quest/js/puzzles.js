/* =====================================================================
   Passport puzzles (touch + speaking), shared by every gate
   1. TC.passportCode(letter)    → "Open your passport! Find No. 26" → child
      says the word → its first letter is the secret-code letter
   2. TC.sentencePuzzle(s, zh)   → tap word tiles into order, then read it aloud
   ===================================================================== */
(function () {
  "use strict";
  const { h, sleep } = TC;
  const css = `
  .pz{position:fixed;left:50%;top:8.4rem;transform:translateX(-50%);z-index:30;width:min(110rem,94vw);background:rgba(10,22,51,.9);backdrop-filter:blur(10px);
      border:3px solid var(--gate);border-radius:2.2rem;padding:1.6rem 2rem 2rem;text-align:center;box-shadow:0 1.6rem 4rem rgba(0,0,0,.5);animation:pzIn .5s cubic-bezier(.2,1.4,.4,1)}
  @keyframes pzIn{from{transform:translate(-50%,-30%) scale(.8);opacity:0}}
  .pz h3{margin:0;font-size:3rem;display:flex;align-items:center;justify-content:center;gap:1rem}
  .pz .sub{font-size:1.7rem;color:var(--ink2);margin:.3rem 0 1rem}
  .pz .num{display:inline-flex;align-items:center;gap:1.4rem;font-size:3rem;font-weight:700;background:#fff;color:#0a1633;border-radius:1.6rem;padding:.6rem 2.2rem;box-shadow:0 .5rem 0 #c9d6ff}
  .pz .num b{font-size:7rem;line-height:1;color:#d6337a}
  .pz .book{width:9rem;height:7rem;position:relative;perspective:40rem}
  .pz .book i{position:absolute;inset:0;border-radius:.8rem;background:linear-gradient(135deg,#3d8bff,#152a63);box-shadow:inset 0 0 0 .4rem #ffc83d}
  .pz .book i:nth-child(2){background:#fff;transform-origin:0 50%;animation:flip 1.2s ease-in-out infinite;box-shadow:none;inset:.5rem .5rem .5rem 50%}
  @keyframes flip{50%{transform:rotateY(-160deg)}}
  .pz .ans{margin-top:1.2rem;font-size:3.4rem;font-weight:700;min-height:4rem}
  .pz .ans .first{display:inline-grid;place-items:center;width:6rem;height:7rem;background:var(--sun);color:#0a1633;border-radius:1rem;font-size:5.4rem;margin-right:.4rem;animation:pop .5s}
  .pz .slots{display:flex;flex-wrap:wrap;justify-content:center;gap:1rem;min-height:7rem;padding:1rem;border-radius:1.4rem;background:rgba(255,255,255,.06);border:2px dashed rgba(255,255,255,.25)}
  .pz .bank{display:flex;flex-wrap:wrap;justify-content:center;gap:1.1rem;margin-top:1.4rem;min-height:7rem}
  .pz .tile{font-size:3.2rem;font-weight:700;padding:.7rem 1.6rem;border-radius:1.2rem;color:#0a1633;cursor:pointer;touch-action:manipulation;
      background:linear-gradient(180deg,#fff,#dfe7ff);box-shadow:0 .55rem 0 #8fa2ff,0 .9rem 1.4rem rgba(0,0,0,.35);transition:transform .12s}
  .pz .tile:active{transform:translateY(.4rem);box-shadow:0 .15rem 0 #8fa2ff}
  .pz .slots .tile{background:linear-gradient(180deg,#fff7d6,#ffd96b);box-shadow:0 .55rem 0 #e0a21a,0 .9rem 1.4rem rgba(0,0,0,.35)}
  .pz.ok .slots .tile{background:linear-gradient(180deg,#d6fff0,#2ee6b6);box-shadow:0 .55rem 0 #17a884}
  .pz .slots.bad{animation:shake .45s}
  .pz .zh2{font-size:1.8rem;color:var(--ink2);margin-top:.8rem}`;
  document.head.append(h("style", {}, css));

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const cap = (w) => w[0].toUpperCase() + w.slice(1);

  /** Passport Code: find a numbered word in the paper passport; its first letter is the code letter. */
  TC.passportCode = async function (letter, api) {
    const list = (window.TC_PASSCODE || {})[letter];
    if (!list || !list.length) return letter;
    // younger travellers get numbers from the first pages of the passport
    const lvl = (TC.kid && TC.kid.level) || 2;
    const easy = list.filter((x) => x.level <= (lvl === 1 ? 3 : lvl === 2 ? 13 : 25));
    const pool = easy.length ? easy : list;
    const e = pool[(Math.random() * pool.length) | 0];
    const ans = h("div", { class: "ans" }, "");
    const box = h("div", { class: "pz" },
      h("h3", {}, h("div", { class: "book" }, h("i"), h("i")), "Passport Code!", h("span", { class: "zh" }, "護照密碼")),
      h("div", { class: "sub zh" }, `打開你的護照，找到第 ${e.no} 號單字（第${e.level}關 · 第${e.page}頁）。它的第一個字母就是密碼！`),
      h("div", { class: "num" }, "No.", h("b", {}, e.no)),
      ans);
    document.body.append(box); TC.sfx("levelup");
    await TC.speak(`Open your passport. Find number ${e.no}.`);
    const r = await TC.ask({ teacher: `What is word number ${e.no}?`, tzh: `護照第 ${e.no} 號是什麼？`, say: cap(e.w) + "!", zh: "", keys: [[e.w]], word: e.w, hideKey: true, guideKid: `📖 翻開紙本護照第 <em>${e.page}</em> 頁，找第 <em>${e.no}</em> 號單字，大聲說出來`, guideTeacher: "可幫低年級翻頁；說對 → <kbd>✓ 說得好</kbd>（Enter）・找不到 → <kbd>🔊 聽示範</kbd>" });
    if (api && api.aborted) { box.remove(); return letter; }
    TC.hideTalk();
    ans.innerHTML = ""; ans.append(h("span", { class: "first" }, e.w[0].toUpperCase()), e.w.slice(1), h("span", { class: "zh", style: "font-size:2rem;margin-left:1rem" }, e.zh));
    TC.sfx("coin"); await TC.speak(`${e.w}! ${e.w[0].toUpperCase()}!`);
    await sleep(700); box.remove();
    TC.log({ type: "code", say: e.w, heard: r.heard || "", by: r.by || "" });
    return e.w[0].toUpperCase();
  };

  /** Sentence Builder: tap tiles in order, then read the sentence aloud. */
  TC.sentencePuzzle = async function (sentence, zh, keys, api) {
    const words = sentence.split(/\s+/);
    let order = shuffle(words.map((w, i) => ({ w, i })));
    if (order.every((t, k) => t.i === k)) order.reverse();
    const slots = h("div", { class: "slots" }), bank = h("div", { class: "bank" });
    const box = h("div", { class: "pz" },
      h("h3", {}, "🧩 Sentence Builder", h("span", { class: "zh" }, "句子拼拼看")),
      h("div", { class: "sub zh" }, "依順序點單字，排出護照裡的句子！"), slots, bank, h("div", { class: "zh2 zh" }, zh || ""));
    document.body.append(box);
    let done;
    const finished = new Promise((r) => (done = r));
    const placed = [];
    function render() {
      slots.innerHTML = ""; bank.innerHTML = "";
      placed.forEach((t, k) => slots.append(h("div", { class: "tile", onclick: () => { placed.splice(k, 1); TC.sfx("click"); render(); } }, t.w)));
      order.filter((t) => !placed.includes(t)).forEach((t) => bank.append(h("div", { class: "tile", onclick: () => { placed.push(t); TC.sfx("pop"); render(); check(); } }, t.w)));
    }
    function check() {
      if (placed.length !== words.length) return;
      if (placed.every((t, k) => t.w === words[k])) { box.classList.add("ok"); TC.sfx("levelup"); TC.confetti(80); setTimeout(done, 700); }
      else {
        slots.classList.remove("bad"); void slots.offsetWidth; slots.classList.add("bad"); TC.sfx("wrong");
        setTimeout(() => { let k = 0; while (k < placed.length && placed[k].w === words[k]) k++; placed.splice(k); render(); }, 600);
      }
    }
    render();
    TC.pending = () => { placed.length = 0; words.forEach((w) => placed.push(order.find((t) => t.w === w && !placed.includes(t)))); render(); check(); }; // teacher Enter = solve
    TC.guide("👆 依順序點下面的單字卡，排出正確的句子", "排錯會自動退回；排不出來 → 按 <kbd>✓ 說得好</kbd>（或 Enter）自動排好");
    await TC.speak("Make the sentence!");
    await Promise.race([finished, new Promise((r) => { const t = setInterval(() => { if (api && api.aborted) { clearInterval(t); r(); } }, 300); finished.then(() => clearInterval(t)); })]);
    TC.pending = null;
    if (api && api.aborted) { box.remove(); return; }
    const r = await TC.ask({ teacher: "Read it to me!", tzh: "把句子唸出來！", say: sentence, zh: zh || "", keys, word: (keys && keys[0] && keys[0][0]) || "" });
    box.remove(); TC.hideTalk();
    return r;
  };
})();
