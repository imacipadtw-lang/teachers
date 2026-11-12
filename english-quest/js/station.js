/* Station flow: scan passports → welcome → play → stamp + secret letter → next traveler */
(function () {
  "use strict";
  const { h, $, sleep } = TC;
  const qs = new URLSearchParams(location.search);
  const hashGate = (location.hash.match(/gate-?(\d)/) || [])[1]; // e.g. station.html#gate-3 (hosts that drop ?query)
  let gate = +qs.get("gate") || +hashGate || +(() => { try { return localStorage.getItem("tc_gate"); } catch (e) { return 0; } })() || 1;
  if (!(gate >= 1 && gate <= 6)) gate = 1;
  try { localStorage.setItem("tc_gate", gate); } catch (e) {}
  TC.gate = gate;
  const G = TC_CONTENT.gates[gate];
  const game = TC.games[G.key];
  const SECRET = TC_CONTENT.secret.toUpperCase();
  const LETTER = SECRET[gate - 1];
  document.documentElement.style.setProperty("--gate", G.color);
  document.title = `Gate ${gate} · ${G.title}`;

  /* HUD + attract screen */
  $("#gNum").textContent = gate;
  $("#gTitle").textContent = G.title;
  $("#gSub").innerHTML = `<span class="zh">${G.zh}</span> · ${G.city}`;
  $("#scanTitle").textContent = G.title;
  $("#scanSub").innerHTML = `Gate ${gate} · ${G.city} ✈ ${G.zh}`;
  $("#scanGenre").textContent = G.genre;
  $("#passportRef").textContent = "護照對應：" + G.passport;
  $("#scanOllie").innerHTML = TC.ollieSVG();
  // floating 3D items from this gate's content drift behind the attract screen
  const GATE_ART = { 1: ["bus", "train", "plane", "taxi", "bike", "boat", "kart"], 2: ["rainbow", "star", "medal", "apple", "lemon", "watermelon"], 3: ["mystegg", "tiger", "rabbit", "pig", "elephant", "lion", "duck"],
    4: ["mic", "star", "ollie", "medal", "star", "mic"], 5: ["gift", "apple", "ice-cream", "pizza", "cake", "strawberry", "hamburger"], 6: ["basketball", "baseball", "tennis", "trophy", "medal", "bike"] };
  const floaty = h("div", { class: "floaty" });
  (GATE_ART[gate] || []).concat(GATE_ART[gate] || []).forEach((n, i) => { const im = TC.artImg(n === "mystegg" ? "mystegg" : n); const left = (i * 37) % 92, top = 8 + ((i * 53) % 78);
    if ((left > 8 && left < 84 && top > 24 && top < 66) || (left > 30 && left < 62 && top < 30) || (left > 20 && left < 72 && top > 80)) return; im.style.cssText = `left:${left}%;top:${top}%;--d:${6 + (i % 5)}s;animation-delay:${-i}s;width:${10 + (i % 3) * 3}vh;height:${10 + (i % 3) * 3}vh`; floaty.append(im); });
  $("#scan").prepend(floaty);
  TC.setAIPill();

  const queue = [];
  let running = false, resultOpen = null;
  const api = {
    G, gate, stage: $("#stage"), aborted: false,
    get kid() { return TC.kid; },
    get level() { return TC.kid ? TC.kid.level : 2; },
    ask: (spec) => TC.ask(spec),
    progress(i, n) {
      const p = $("#pips"); p.innerHTML = "";
      for (let k = 0; k < n; k++) p.append(h("div", { class: "pip" + (k < i ? " done" : k === i ? " now" : "") }));
    }
  };
  TC.api = api;
  game.mount && game.mount(api);

  function renderQueue() {
    const q = $("#queue"); q.innerHTML = "";
    queue.forEach((k, i) => q.append(h("div", { class: "q-kid" },
      h("div", { class: "av", style: `background:${k.color}` }, k.name[0]),
      h("span", {}, k.name), h("span", { class: "x zh", onclick: () => { queue.splice(i, 1); renderQueue(); } }, "移除 ✕"))));
    $("#goBtn").classList.toggle("hidden", !queue.length || running);
    if (!running) TC.guide(queue.length ? "拿著護照，準備闖關！" : "拿出護照，排隊準備闖關！",
      queue.length ? `按下面的 <kbd>START ▶</kbd>（或 Enter）開始；後面的孩子可以繼續掃 QR 排隊` : `掃孩子護照上的 QR（<kbd>📷 相機掃描</kbd> 或掃描機），或按 <kbd>👆 手動選擇</kbd> 點座號 → 再按 <kbd>START ▶</kbd>`, "corner");
  }
  TC.onScan((kid) => {
    TC.ac();
    if (queue.some((k) => k.id === kid.id) || (TC.kid && running && TC.kid.id === kid.id)) { TC.toast(`${kid.name} 已經在隊伍裡了`); return; }
    queue.push(kid); renderQueue(); TC.sfx("coin");
    if (running) TC.toast(`✈ ${kid.name} 已排隊，下一位！`);
    else TC.speak(`Hello, ${kid.name}!`);
  });

  function setKidChip(kid) {
    $("#kidChip").classList.remove("hidden");
    $("#kAv").textContent = kid.name[0]; $("#kAv").style.background = kid.color;
    $("#kName").textContent = kid.name;
    $("#lvlBtns").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.l === kid.level));
  }
  $("#lvlBtns").addEventListener("click", (e) => {
    const l = +e.target.dataset.l; if (!l || !TC.kid) return;
    TC.kid.level = l; setKidChip(TC.kid); TC.toast("難度：" + ["", "初級 Basic", "中級 Intermediate", "高級 Advanced"][l] + "（下一題生效）");
  });

  async function runQueue() {
    if (running || !queue.length) return;
    running = true; renderQueue();
    await TC.Mic.init();
    $("#scan").classList.add("hidden");
    while (queue.length) {
      const kid = queue.shift(); renderQueue();
      await playKid(kid);
      if (api.aborted) break;
    }
    api.aborted = false; running = false; TC.kid = null;
    $("#kidChip").classList.add("hidden"); $("#pips").innerHTML = "";
    $("#scan").classList.remove("hidden"); renderQueue();
    game.idle && game.idle(api);
  }

  let kidStart = 0;
  setInterval(() => { const c = $("#clock"); if (!c) return; if (!running || !kidStart) { c.textContent = `⏱ 排隊 ${queue.length}`; c.style.color = ""; return; }
    const s = ((Date.now() - kidStart) / 1000) | 0; c.textContent = `⏱ ${(s / 60) | 0}:${String(s % 60).padStart(2, "0")} · 排隊 ${queue.length}`; c.style.color = s > 300 ? "#ff8a8a" : ""; }, 1000);
  async function playKid(kid) {
    TC.kid = kid; api.aborted = false; kidStart = Date.now();
    TC.stats = { lines: 0, stars: 0, turns: 0, lastBlob: null }; TC.lastSay = "";
    setKidChip(kid);
    const ov = h("div", { class: "overlay welcome" },
      h("div", { class: "bpass" },
        h("div", { class: "av", style: `background:radial-gradient(circle at 35% 30%,#fff,${kid.color} 55%)` }, kid.name[0]),
        h("div", {}, h("div", { class: "k" }, kid.id === "99" ? "VIP BOARDING PASS · TUCHENG ENGLISH DAY" : "BOARDING PASS · TUCHENG ENGLISH DAY"), h("div", { class: "nm" }, kid.id === "99" ? "Welcome, VIP Guest!" : `Welcome, ${kid.name}!`),
          h("div", { class: "rt" }, `TPE ✈ ${G.city.toUpperCase()} · GATE ${gate}`), h("div", { class: "zh", style: "font-size:2rem;color:#5a6aa8" }, ["", "初級 Basic", "中級 Intermediate", "高級 Advanced"][kid.level] + " · " + G.zh)),
        h("div", { style: "width:13rem;height:15rem", html: TC.ollieSVG("cheer") })));
    document.body.append(ov); TC.sfx("fanfare"); TC.confetti(80);
    TC.guide(`歡迎 <em>${TC.esc(kid.name)}</em>！聽歐力說話`, "不用按，等一下會自動開始");
    // with sync on: show how many gates this traveller has already stamped
    TC.fetchState().then((st) => {
      const k = st && st.kids && (st.kids[kid.id] || st.kids[String(+kid.id)]);
      if (!k || !ov.isConnected) return;
      const n = (k.gates || []).filter((g) => g !== gate).length;
      ov.querySelector(".bpass > div:nth-child(2)").append(h("div", { style: "font-size:2.2rem;font-weight:700;color:#e8a21a;margin-top:.4rem" }, `★ ${n} / 6 stamps · 已收集 ${n} 個印章`));
    });
    await TC.speak(kid.id === "99" ? `Welcome to ${G.city}, our special guest!` : `Welcome to ${G.city}, ${kid.name}!`);
    await sleep(600); ov.remove();
    TC.log({ type: "start" });
    // 👋 warm-up chat with the teacher (standard mode)
    if (!TC.cfg.rounds) {
      const gr = TC_CONTENT.greetings[TC_CONTENT.greetingOrder[gate]], L = kid.level;
      const age = ["", "seven", "eight", "nine", "ten", "eleven", "twelve"][kid.grade] || "ten"; // typical age for the grade
      const fill = (t) => t.replace("[Name]", kid.name).replace("[name]", kid.name.toLowerCase()).replace("[Age]", age[0].toUpperCase() + age.slice(1)).replace("[age]", age);
      api.progress(-1, 0);
      await TC.ask({ teacher: gr.teacher, tzh: gr.tzh, say: fill(gr.say[L]), zh: "先跟老師打招呼！", keys: gr.keys.map((g) => g.map(fill)), word: gr === TC_CONTENT.greetings.feel ? "happy" : "" });
      TC.hideTalk();
      if (api.aborted) return;
    }
    let res = null;
    try { res = await game.play(api); } catch (e) { console.error(e); TC.toast("遊戲發生錯誤，老師可按 Esc 重來"); }
    TC.hideTalk();
    if (api.aborted) return;
    // 🎉 everybody (classmates + parents) says the child's final line together
    if (TC.lastSay && !TC.cfg.rounds) {
      const bar = h("i"), ch = h("div", { class: "chorus" }, h("div", { class: "c1 zh" }, "🎉 Everybody! 大家一起說！"), h("div", { class: "c2", style: `font-size:${TC.lastSay.length > 24 ? 6.4 : TC.lastSay.length > 14 ? 8 : 10}rem` }, TC.lastSay), h("div", { class: "bar" }, bar), h("div", { class: "zh", style: "font-size:1.8rem;color:var(--ink2)" }, "越大聲，煙火越多！"));
      document.body.append(ch); TC.sfx("levelup");
      TC.guide(`🎉 全場一起大聲說：<em>${TC.esc(TC.lastSay)}</em>`, "帶全場一起喊，越大聲煙火越多！不用按，約 5 秒後自動繼續");
      let peak = 0; const t0 = Date.now();
      await new Promise((res) => { (function loop() { const l = TC.Mic.level || 0; peak = Math.max(peak, l); bar.style.width = Math.min(100, peak * 140) + "%"; if (l > 0.35 && Math.random() < 0.15) TC.confetti(30); if (Date.now() - t0 < 4500 && !api.aborted) requestAnimationFrame(loop); else res(); })(); });
      TC.confetti(peak > 0.5 ? 260 : 120); TC.sfx(peak > 0.5 ? "fanfare" : "ding"); await sleep(700); ch.remove();
      if (api.aborted) return;
    }
    // 🧩 Sentence Builder with a passport sentence (skipped in quick mode)
    if (!TC.cfg.rounds) {
      const pool = (TC_CONTENT.sentences[gate] || []).filter((x) => { const n = x.s.split(/\s+/).length; return kid.level === 1 ? n <= 4 : kid.level === 2 ? n <= 5 : n >= 4; });
      const pz = pool[(Math.random() * pool.length) | 0];
      if (pz) await TC.sentencePuzzle(pz.s, pz.zh, kid.level === 3 ? pz.keys : pz.keys.slice(0, 1), api);
      if (api.aborted) return;
    }
    // 🛂 Passport Code: look the number up in the paper passport → secret letter
    await TC.passportCode(LETTER, api);
    if (api.aborted) return;
    await showResult(kid, res || {});
  }

  async function showResult(kid, res) {
    const turns = Math.max(1, TC.stats.turns);
    const stars = Math.max(1, Math.min(3, Math.round(TC.stats.stars / turns)));
    const today = new Date();
    const date = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
    const boxes = h("div", { class: "boxes" }, ...SECRET.split("").map((c, i) => h("span", { class: i === gate - 1 ? "me" : "" }, i === gate - 1 ? c : i + 1 + "")));
    const letter = h("div", { class: "code-letter roll" }, "?");
    const replay = h("button", { class: "big-btn", onclick: () => playBlob() }, "🔊 ", h("span", { class: "zh" }, `聽 ${kid.name} 說英文`));
    const next = h("button", { class: "big-btn go" }, queue.length ? `NEXT: ${queue[0].name} ▶` : "DONE ✓");
    const ov = h("div", { class: "overlay" },
      h("div", { class: "stamp-wrap" }, h("div", { class: "stamp" }, h("div", { class: "holo" }), h("div", { class: "s1" }, "TUCHENG"), TC.artImg({ 1: "kart", 2: "rainbow", 3: "mystegg", 4: "mic", 5: "gift", 6: "trophy" }[gate], "art"), h("div", { class: "s2" }, G.city.toUpperCase()), h("div", { class: "s3" }, `GATE ${gate} · ${date} · ${kid.name}`))),
      h("div", { class: "stars" }, ...[0, 1, 2].map((i) => TC.artImg("star", i < stars ? "" : "off"))),
      h("div", { class: "code-reveal" }, h("span", { class: "zh" }, "秘密代碼 Secret code"), letter, boxes),
      h("div", { class: "zh", style: "font-size:1.8rem" }, `把字母寫在護照卡的第 ${gate} 格！ Write it in box ${gate}!`),
      h("div", { class: "res-actions" }, replay, next));
    document.body.append(ov);
    TC.sfx("stamp"); TC.ollie("cheer");
    // rolling decoder
    const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 8; i++) { letter.textContent = AZ[(Math.random() * 26) | 0]; TC.sfx("tick"); await sleep(60 + i * 8); }
    letter.classList.remove("roll"); letter.textContent = LETTER; TC.sfx("levelup"); TC.confetti(200);
    TC.guide(`✏️ 把秘密字母 <em>${LETTER}</em> 寫在護照卡第 <em>${gate}</em> 格`,
      queue.length ? `寫好後按下面的 <kbd>NEXT: ${TC.esc(queue[0].name)} ▶</kbd>（或 Enter）換下一位` : "寫好後按下面的 <kbd>DONE ✓</kbd>（或 Enter）回到掃描畫面", "corner");
    TC.log({ type: "complete", stars, letter: LETTER, lines: TC.stats.lines });
    await sleep(500);
    await TC.speak(`Great job, ${kid.name}! Your secret letter is ${LETTER}.`);
    await sleep(300);
    function playBlob() {
      if (!TC.stats.lastBlob) { TC.toast("這台沒有錄音（可在設定開啟）"); return Promise.resolve(); }
      return new Promise((r) => { const a = new Audio(URL.createObjectURL(TC.stats.lastBlob)); a.volume = 1; a.onended = r; a.onerror = r; a.play().catch(r); });
    }
    if (TC.stats.lastBlob) { TC.floatText(`🎤 ${kid.name}!`, 50, 30, "#2ee6b6"); await playBlob(); }
    await new Promise((r) => { resultOpen = r; next.onclick = r; });
    resultOpen = null; ov.remove(); TC.ollie("idle");
  }

  /* buttons + keys */
  $("#goBtn").onclick = runQueue;
  $("#camBtn").onclick = () => { TC.ac(); TC.cameraScan(); };
  $("#manBtn").onclick = () => { TC.ac(); TC.manualPick(); };
  // one tap for visitors (e.g. the minister): a guest traveller at the intermediate level
  $("#vipBtn").onclick = () => { TC.ac(); const g = TC.mkKid("99", "Guest", 3); g.color = "#ffc83d"; TC.handleScan ? TC.handleScan(g) : null; };
  $("#setBtn").onclick = () => TC.openSettings();
  // 📋 teacher script for this gate, generated from the same content the game uses
  $("#helpBtn").onclick = () => {
    const cap = (w) => w[0].toUpperCase() + w.slice(1);
    let rows = [];
    if (G.key === "kart") rows = G.items.map((it) => [G.teacher, cap(it.w) + "!", `It's a${/^[aeiou]/.test(it.w) ? "n" : ""} ${it.w}.`, it.s3]);
    if (G.key === "craft") rows = Object.keys(G.colors).map((c) => [G.teacher, cap(c) + "!", `I want ${c}.`, `I want ${c}, please.`]);
    if (G.key === "hatch") rows = G.items.map((it) => [G.teacher, cap(it.w) + "!", `It's ${it.art || "a"} ${it.w}.`, it.s3]);
    if (G.key === "beat") rows = [0, 1, 2, 3, 4].map((i) => [G.teacher, G.moves[1][i].say, G.moves[2][i].say, G.moves[3][i].say]);
    if (G.key === "box") rows = G.items.map((it) => [it.clues.join(" "), cap(it.w) + "!", it.q2, it.s3]);
    if (G.key === "obby") rows = G.moves.map((m) => [m.t, cap(m.w) + "!", m.s2, m.s3]);
    rows.push(["★ " + G.finale.teacher, G.finale.say[1], G.finale.say[2], G.finale.say[3]]);
    const gr = TC_CONTENT.greetings[TC_CONTENT.greetingOrder[gate]];
    rows.unshift(["👋 " + gr.teacher, gr.say[1], gr.say[2], gr.say[3]]);
    const card = h("div", { class: "card" }, h("h2", {}, `📋 Gate ${gate} ${G.title} · 老師台詞`),
      h("p", { class: "zh" }, "老師說左欄，孩子說右邊三欄（依程度）。遊戲後會有「句子拼拼看」和「護照密碼」。Enter＝說得好 · H＝示範 · N＝跳過 · Esc＝回到掃描"),
      h("table", { style: "width:100%;border-collapse:collapse;font-size:1.3rem" },
        h("tr", {}, ...["老師 Teacher", "初級", "中級", "高級"].map((t) => h("th", { style: "text-align:left;border-bottom:2px solid var(--line);padding:.4rem" }, t))),
        ...rows.map((r) => h("tr", {}, ...r.map((t) => h("td", { style: "border-bottom:1px solid var(--line);padding:.4rem;vertical-align:top" }, t))))),
      h("div", { class: "row" }, h("button", { class: "save", onclick: () => wrap.remove() }, "關閉 Close")));
    const wrap = h("div", { class: "settings", onclick: (e) => { if (e.target === wrap) wrap.remove(); } }, card);
    document.body.append(wrap);
  };
  $("#okBtn").onclick = () => TC.teacherOK();
  $("#hearBtn").onclick = () => TC.hearModel();
  $("#skipBtn").onclick = () => TC.skipTurn();
  document.addEventListener("pointerdown", () => TC.ac(), { once: true });
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  TC.onKey = (e, burst) => {
    if (burst || e.repeat) return;
    const k = e.key;
    if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (resultOpen) resultOpen();
      else if (!running && queue.length) runQueue();
      else TC.teacherOK();
    } else if (k === "h" || k === "H") TC.hearModel();
    else if (k === "n" || k === "N" || k === "ArrowRight") TC.skipTurn();
    else if (k === "Escape") { if (running) { api.aborted = true; TC.skipTurn(); TC.ASR.stop(); document.querySelectorAll(".overlay,.pz,.actbtn,.lineup,.chorus").forEach((o) => o.remove()); if (TC.pending) { const p = TC.pending; TC.pending = null; p(); } if (resultOpen) resultOpen(); } }
    else if ((k === "s" || k === "S") && !running) TC.openSettings();
    else if ((k === "c" || k === "C") && !running) TC.cameraScan();
    else if ((k === "m" || k === "M") && !running) TC.manualPick();
    else if (k === "g" || k === "G") TC.guideToggle();
  };
  game.idle && game.idle(api);
  renderQueue();
})();
