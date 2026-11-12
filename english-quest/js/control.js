/* Final Gate + Mission Control: decode the secret word, say the final line, get a certificate; live board for parents */
(function () {
  "use strict";
  const { h, $, sleep } = TC;
  TC.gate = 7;
  const SECRET = TC_CONTENT.secret.toUpperCase();
  const GATES = [1, 2, 3, 4, 5, 6].map((g) => Object.assign({ n: g }, TC_CONTENT.gates[g]));
  TC.setAIPill();

  /* ---------- route map ---------- */
  function drawRoute() {
    const pts = [[60, 150]].concat(GATES.map((g, i) => [190 + i * 150, i % 2 ? 175 : 70])).concat([[1140, 120]]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
    $("#route").innerHTML = `<svg viewBox="0 0 1200 270" xmlns="http://www.w3.org/2000/svg">
      <path d="${d}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="5" stroke-dasharray="14 12"/>
      <g font-family="Fredoka,sans-serif" font-weight="700" text-anchor="middle">
        <circle cx="60" cy="150" r="34" fill="#2ee6b6"/><text x="60" y="158" font-size="22" fill="#0a1633">TPE</text><text x="60" y="210" font-size="20" fill="#fff">START</text>
        ${GATES.map((g, i) => { const [x, y] = pts[i + 1]; return `<circle cx="${x}" cy="${y}" r="40" fill="${g.color}"/><text x="${x}" y="${y + 9}" font-size="28" fill="#0a1633">${g.n}</text><text x="${x}" y="${y + 70}" font-size="21" fill="#fff">${g.city}</text>`; }).join("")}
        <circle cx="1140" cy="120" r="44" fill="#ffc83d"/><text x="1140" y="130" font-size="32">🏁</text><text x="1140" y="196" font-size="20" fill="#fff">GOAL</text>
      </g>
      <text id="plane" font-size="48" x="0" y="0">✈️<animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path="${d}"/></text>
    </svg>`;
  }
  drawRoute();
  $("#bbO").innerHTML = TC.ollieSVG();

  /* ---------- live stats (Google Sheet sync if set, otherwise this device's log) ---------- */
  function localState() {
    let log = []; try { log = JSON.parse(localStorage.getItem("tc_log")) || []; } catch (e) {}
    const kids = {}; let lines = 0;
    log.forEach((r) => {
      if (r.type === "line") lines++;
      if (!r.kid) return;
      const k = (kids[r.kid] = kids[r.kid] || { name: r.name, grade: r.grade, gates: [], final: false });
      if (r.type === "complete" && r.gate >= 1 && r.gate <= 6 && !k.gates.includes(+r.gate)) k.gates.push(+r.gate);
      if (r.type === "final") k.final = true;
    });
    return { kids, lines };
  }
  let state = localState(), srcText = "";
  async function refresh() {
    if (TC.cfg.syncUrl) {
      try {
        const u = TC.cfg.syncUrl + (TC.cfg.syncUrl.includes("?") ? "&" : "?") + "action=state&t=" + Date.now();
        state = await (await fetch(u)).json(); srcText = "資料來源：Google 試算表即時同步 · " + new Date().toLocaleTimeString();
      } catch (e) { state = localState(); srcText = "⚠ 同步讀取失敗，暫時顯示本機紀錄"; }
    } else { state = localState(); srcText = "資料來源：這台電腦的紀錄（在 ⚙ 設定同步網址即可匯整 6 間教室）"; }
    render();
  }
  function render() {
    const kids = Object.entries(state.kids || {});
    $("#sKids").textContent = kids.filter(([, k]) => k.final).length;
    $("#sLines").textContent = state.lines || 0;
    $("#sStamps").textContent = kids.reduce((a, [, k]) => a + (k.final ? 6 : (k.gates || []).length), 0);
    const stamps = +$("#sStamps").textContent, total = Math.max(1, Object.keys(TC.roster()).length || 28) * 6;
    $("#bbKids").textContent = $("#sKids").textContent; $("#bbLines").textContent = $("#sLines").textContent; $("#bbStamps").textContent = stamps;
    $("#bbBar").style.width = Math.min(100, (stamps / total) * 100) + "%";
    const b = $("#board"); b.innerHTML = "";
    kids.sort((a, z) => a[0].localeCompare(z[0])).forEach(([id, k]) => {
      const col = TC.mkKid(id, k.name || id, +k.grade || 3).color;
      const EMB = { 1: "kart", 2: "rainbow", 3: "mystegg", 4: "mic", 5: "gift", 6: "trophy" };
      const done = k.final ? [1, 2, 3, 4, 5, 6] : (k.gates || []);
      const dots = h("div", { class: "dots" }, ...GATES.map((g) => done.includes(g.n) ? Object.assign(TC.artImg(EMB[g.n]), { className: "emb", title: g.city }) : h("i", { title: g.city })));
      b.append(h("div", { class: "kc" + (k.final ? " fin" : "") }, h("div", { class: "av", style: `background:${col}` }, (k.name || "?")[0]), h("div", {}, h("b", {}, `${id} ${k.name || ""} ${k.final ? "🏆" : ""}`), dots)));
    });
    if (!kids.length) b.append(h("div", { class: "zh", style: "font-size:2rem;color:var(--ink2)" }, "還沒有資料。孩子完成關卡後會出現在這裡。"));
    $("#boardSrc").textContent = srcText;
  }
  refresh(); setInterval(refresh, 5000);
  document.querySelectorAll(".tabs button").forEach((bt) => bt.onclick = () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === bt));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("hidden", v.id !== bt.dataset.v));
  });

  /* ---------- decoder ---------- */
  let busy = false, typed = [], solvedCb = null;
  function renderSlots(bad = []) {
    const s = $("#slots"); s.innerHTML = "";
    for (let i = 0; i < SECRET.length; i++) s.append(h("div", { class: "slot" + (bad.includes(i) ? " bad" : typed[i] && typed[i] === SECRET[i] && solvedCb === null ? " good" : "") }, h("small", {}, `${i + 1} ${GATES[i].city}`), typed[i] || ""));
  }
  const keys = $("#keys");
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((c) => keys.append(h("button", { onclick: () => typeLetter(c) }, c)));
  keys.append(h("button", { class: "wide", onclick: () => { for (let i = SECRET.length - 1; i >= 0; i--) if (typed[i]) { typed[i] = null; break; } renderSlots(); } }, "⌫"));
  function typeLetter(c) {
    if (!busy || !solvedCb) return;
    const i = typed.findIndex((x) => !x); const at = i < 0 ? typed.length : i;
    if (at >= SECRET.length) return;
    typed[at] = c; TC.sfx("click"); renderSlots();
    if (typed.filter(Boolean).length === SECRET.length) check();
  }
  async function check() {
    if (typed.join("") === SECRET) { const cb = solvedCb; solvedCb = null; renderSlots(); cb && cb(); return; }
    const bad = typed.map((c, i) => (c !== SECRET[i] ? i : -1)).filter((i) => i >= 0);
    TC.sfx("wrong"); renderSlots(bad);
    await TC.speak("Almost! Check your letters.");
    bad.forEach((i) => (typed[i] = null)); renderSlots();
  }
  TC.onKey = (e) => {
    if (/^[a-zA-Z]$/.test(e.key) && solvedCb) typeLetter(e.key.toUpperCase());
    else if (e.key === "Backspace" && solvedCb) { for (let i = SECRET.length - 1; i >= 0; i--) if (typed[i]) { typed[i] = null; break; } renderSlots(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (solvedCb) assist(); else TC.teacherOK(); }
    else if (e.key === "Escape") reset();
  };

  function assist() { if (!solvedCb) return; typed = SECRET.split(""); const cb = solvedCb; solvedCb = null; renderSlots(); TC.sfx("coin"); cb(); }
  $("#assistBtn").onclick = assist;
  TC.onScan(async (kid) => {
    TC.ac();
    if (busy) { TC.toast(`${kid.name}：請等前一位完成`); return; }
    busy = true; TC.kid = kid; TC.stats = { lines: 0, stars: 0, turns: 0, lastBlob: null };
    $("#kidChip").classList.remove("hidden"); $("#kAv").textContent = kid.name[0]; $("#kAv").style.background = kid.color; $("#kName").textContent = kid.name;
    await TC.Mic.init();
    $("#attract").classList.add("hidden"); $("#dec").classList.remove("hidden"); document.body.classList.add("decoding");
    typed = new Array(SECRET.length).fill(null); renderSlots();
    $("#decTitle").textContent = `Hi, ${kid.name}! What's the secret word?`;
    TC.sfx("fanfare"); TC.speak(`Hi, ${kid.name}! What's the secret word?`);
    // the child may also just say the word
    TC.ASR.start((alts) => { if (TC.isQuiet()) return; if (solvedCb && alts.some((a) => TC.norm(a).some((t) => TC.wordMatch(t, SECRET.toLowerCase())))) { typed = SECRET.split(""); const cb = solvedCb; solvedCb = null; renderSlots(); cb(); } });
    await new Promise((r) => (solvedCb = r));
    TC.ASR.stop();
    if (!busy) return;
    document.querySelectorAll(".slot").forEach((s, i) => setTimeout(() => { s.classList.add("good"); TC.sfx("coin"); }, i * 120));
    TC.confetti(200); TC.sfx("levelup");
    await sleep(900);
    // twist: the secret word is itself a passport word
    $("#decTitle").innerHTML = `${SECRET}! <span class="zh" style="font-size:2.4rem;color:var(--sun)">它就是護照第 111 號單字 friend！翻開第 8 頁看看 → “She is my friend.”</span>`;
    await TC.speak(`${SECRET}! It is passport word number 111. She is my friend.`);
    await sleep(600);
    await TC.speak("Who are we?");
    const F = TC_CONTENT.finalLine;
    await TC.ask({ teacher: "Who are we? We are…", tzh: "我們是什麼？", say: F.say, keys: F.keys, word: "friend", zh: "我們是好朋友！" });
    TC.hideTalk();
    if (!busy) return;
    TC.log({ type: "final", letter: SECRET });
    await certificate(kid);
    reset();
  });

  /** 3-2-1 smile! — a webcam photo for the certificate (kept on this computer only) */
  async function takePhoto() {
    let st = null;
    try { st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } } }); } catch (e) { return null; }
    const v = h("video", { playsinline: "", muted: "", style: "width:62vh;height:62vh;object-fit:cover;border-radius:50%;border:1.2vh solid #ffc83d;transform:scaleX(-1);box-shadow:0 0 6vh rgba(255,200,61,.6)" });
    const num = h("div", { style: "font-size:16vh;font-weight:700;color:#ffc83d;text-shadow:0 1vh 0 rgba(0,0,0,.3)" }, "3");
    const ov = h("div", { class: "overlay" }, h("div", { class: "zh", style: "font-size:4rem;font-weight:700" }, "📸 Smile! 笑一個！"), v, num);
    document.body.append(ov); v.srcObject = st; try { await v.play(); } catch (e) {}
    for (const n of ["3", "2", "1"]) { num.textContent = n; TC.sfx("tick"); await sleep(800); }
    num.textContent = "😁"; TC.sfx("click");
    const c = document.createElement("canvas"); c.width = c.height = 600; const x = c.getContext("2d");
    const s = Math.min(v.videoWidth, v.videoHeight) || 600; x.translate(600, 0); x.scale(-1, 1);
    try { x.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 600, 600); } catch (e) {}
    st.getTracks().forEach((t) => t.stop());
    ov.animate([{ background: "rgba(255,255,255,1)" }, { background: "rgba(5,10,25,.72)" }], { duration: 400 });
    await sleep(500); ov.remove();
    return c.toDataURL("image/jpeg", 0.85);
  }
  async function certificate(kid) {
    const d = new Date(), date = `${d.getFullYear()} / ${d.getMonth() + 1} / ${d.getDate()}`;
    const photo = await takePhoto();
    const next = h("button", { class: "big-btn go" }, "NEXT ▶");
    const ov = h("div", { class: "overlay" },
      h("div", { class: "cert" },
        h("div", { class: "ow", html: TC.ollieSVG() }),
        photo ? h("img", { class: "ph", src: photo, alt: kid.name }) : h("div", { class: "ph ph-o", html: TC.ollieSVG() }),
        h("div", { class: "k1" }, "TUCHENG ELEMENTARY SCHOOL · ENGLISH DAY"),
        h("h1", {}, "World English Traveler"),
        h("div", { class: "zh" }, "環遊世界英語小達人"),
        h("div", { class: "nm" }, kid.name),
        h("p", {}, "spoke English at all six gates and cracked the secret code!"),
        h("p", { class: "zh" }, "勇敢開口說英文，完成六關挑戰並解開秘密密碼！"),
        h("div", { class: "st" }, ...GATES.map((g) => h("div", { style: `--c:${g.color}` }, g.city.toUpperCase(), h("br"), `GATE ${g.n}`))),
        h("p", { style: "font-size:2.6rem;font-weight:700;color:#d6337a" }, "“We are friends!”"),
        h("div", { class: "ft" }, h("span", {}, date), h("span", { class: "zh" }, "南投縣草屯鎮土城國民小學"), h("span", {}, "Ollie-Bot ✈"))),
      h("div", { class: "res-actions" }, h("button", { class: "big-btn", onclick: () => print() }, "🖨 ", h("span", { class: "zh" }, "列印獎狀")), next));
    document.body.append(ov); TC.sfx("fanfare"); TC.confetti(260); TC.ollie("cheer");
    await TC.speak(`Congratulations, ${kid.name}! We are friends! You are a World English Traveler!`);
    await new Promise((r) => { next.onclick = r; TC.pending = r; });
    ov.remove(); TC.ollie("idle");
  }
  function reset() {
    busy = false; solvedCb = null; TC.ASR.stop(); TC.hideTalk(); TC.kid = null;
    document.querySelectorAll(".overlay").forEach((o) => o.remove());
    $("#kidChip").classList.add("hidden"); $("#dec").classList.add("hidden"); $("#attract").classList.remove("hidden"); document.body.classList.remove("decoding");
    refresh();
  }

  $("#camBtn").onclick = () => { TC.ac(); TC.cameraScan(); };
  $("#manBtn").onclick = () => { TC.ac(); TC.manualPick(); };
  $("#vipBtn").onclick = () => { TC.ac(); const g = TC.mkKid("99", "Guest", 3); g.color = "#ffc83d"; TC.handleScan(g); };
  $("#setBtn").onclick = () => TC.openSettings();
  $("#okBtn").onclick = () => TC.teacherOK();
  $("#hearBtn").onclick = () => TC.hearModel();
  $("#skipBtn").onclick = () => TC.skipTurn();
})();
