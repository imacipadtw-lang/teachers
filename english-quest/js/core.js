/* =====================================================================
   Tucheng English Day — shared engine for every gate
   - passport QR scan (USB/Bluetooth scanner, camera, or tap)
   - AI speech recognition (Web Speech API) + teacher override
   - human pronunciation clips (Wikimedia Commons) / labelled computer voice
   - voice recording replay, stamps, secret-code letters, optional Google Sheet sync
   ===================================================================== */
(function () {
  "use strict";
  const TC = (window.TC = window.TC || {});
  const $ = (s, r = document) => r.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  TC.$ = $; TC.sleep = sleep;
  TC.h = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === "style") e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  };
  const h = TC.h;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  TC.esc = esc;

  /* ---------------- settings (stored on this device only) ---------------- */
  const DEF = { syncUrl: "", asr: true, record: true, volume: 0.9, voice: "", roster: "", hintAfter: 9, rounds: 0, ollieAsks: false };
  TC.cfg = Object.assign({}, DEF, safeJSON(localStorage.getItem("tc_cfg")) || {});
  TC.saveCfg = () => { try { localStorage.setItem("tc_cfg", JSON.stringify(TC.cfg)); } catch (e) {} };
  function safeJSON(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  /** rounds per child: standard, or capped in quick mode */
  TC.rounds = (d) => (TC.cfg.rounds ? Math.min(d, TC.cfg.rounds) : d);

  /* ---------------- kids & passport QR ----------------
     QR text format:  TCES-07-3-Amy   (number - grade - English name)  */
  const AV_COLORS = ["#ffc83d", "#2ee6b6", "#4cc9ff", "#ff5fa2", "#9b6bff", "#ff9a2e", "#7ee36b", "#ff7a7a"];
  TC.levelFromGrade = (g) => (g <= 2 ? 1 : g <= 4 ? 2 : 3);
  TC.parseKid = function (raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    const m = s.match(/^TCES[-_ ]?(\d{1,3})[-_ ]?([1-6])[-_ ]?(.*)$/i);
    if (!m) return null;
    const id = m[1].padStart(2, "0"), grade = +m[2];
    let name = (m[3] || "").replace(/[._]+/g, " ").trim();
    const r = TC.roster()[id];
    if (!name && r) name = r.name;
    if (!name) name = "Traveler " + id;
    name = name.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w+/g, (w) => w);
    return mkKid(id, name, grade);
  };
  function mkKid(id, name, grade) {
    return { id, name, grade, level: TC.levelFromGrade(grade), color: AV_COLORS[(+id) % AV_COLORS.length] };
  }
  TC.mkKid = mkKid;
  TC.kidPayload = (k) => `TCES-${k.id}-${k.grade}-${k.name.replace(/\s+/g, ".")}`;
  TC.roster = function () {
    const out = {};
    String(TC.cfg.roster || "").split(/\n/).forEach((line) => {
      const p = line.split(/[,\t]| {1,}/).map((x) => x.trim()).filter(Boolean);
      if (p.length >= 2 && /^\d+$/.test(p[0])) {
        const id = p[0].padStart(2, "0");
        const g = p.find((x, i) => i > 0 && /^[1-6]$/.test(x));
        const name = p.slice(1).filter((x) => x !== g).join(" ");
        out[id] = { id, name, grade: g ? +g : 3 };
      }
    });
    return out;
  };

  /* ---------------- sound effects (synthesised, no files) ---------------- */
  let ac = null, bus = null;
  TC.ac = () => {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) {
        ac = new C();
        // master bus: compressor + a soft echo send so effects sound full on TV speakers
        const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(ac.destination);
        bus = ac.createGain(); bus.gain.value = 1; bus.connect(comp);
        const d = ac.createDelay(1); d.delayTime.value = 0.16; const fb = ac.createGain(); fb.gain.value = 0.22; const wet = ac.createGain(); wet.gain.value = 0.18;
        const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3500;
        bus.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(comp);
      }
    }
    if (ac && ac.state === "suspended") ac.resume();
    return ac;
  };
  const out = () => bus || (ac && ac.destination);
  function tone(f, t0, dur, type = "sine", vol = 0.25, f2 = null) {
    const c = TC.ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, c.currentTime + t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + t0 + dur);
    const v = vol * TC.cfg.volume;
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(v, c.currentTime + t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g).connect(out()); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  }
  function noise(t0, dur, vol = 0.3, hp = 800) {
    const c = TC.ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "highpass"; f.frequency.value = hp; g.gain.value = vol * TC.cfg.volume;
    s.buffer = b; s.connect(f).connect(g).connect(out()); s.start(c.currentTime + t0);
  }
  function sparkle(t0) { for (let i = 0; i < 6; i++) tone(2093 + Math.random() * 1500, t0 + i * 0.045, 0.12, "sine", 0.06); }
  TC.sfx = function (name) {
    switch (name) {
      case "ding": [880, 1320, 1760].forEach((f, i) => { tone(f, i * 0.06, 0.5, "sine", 0.22); tone(f * 2.01, i * 0.06, 0.25, "sine", 0.05); }); sparkle(0.12); break;
      case "sparkle": sparkle(0); break;
      case "coin": tone(988, 0, 0.08, "square", 0.15); tone(1319, 0.07, 0.25, "square", 0.15); break;
      case "pop": tone(500, 0, 0.12, "sine", 0.35, 1100); break;
      case "click": tone(1200, 0, 0.04, "square", 0.1); break;
      case "wrong": tone(300, 0, 0.18, "sawtooth", 0.15, 200); tone(220, 0.15, 0.3, "sawtooth", 0.15, 150); break;
      case "boost": noise(0, 0.9, 0.25, 400); tone(200, 0, 0.9, "sawtooth", 0.12, 900); break;
      case "whoosh": noise(0, 0.5, 0.25, 1500); break;
      case "stamp": tone(90, 0, 0.35, "sine", 0.7, 40); noise(0, 0.15, 0.4, 200); break;
      case "drum": for (let i = 0; i < 14; i++) noise(i * 0.07, 0.06, 0.18 + i * 0.01, 300); break;
      case "tick": tone(1800, 0, 0.03, "square", 0.08); break;
      case "kick": tone(150, 0, 0.18, "sine", 0.6, 45); break;
      case "snare": noise(0, 0.12, 0.25, 1200); break;
      case "hat": noise(0, 0.04, 0.12, 6000); break;
      case "fanfare": [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, "triangle", 0.25)); [1047, 1319, 1568].forEach((f) => tone(f, 0.5, 1.1, "triangle", 0.16)); tone(131, 0.5, 1.1, "sine", 0.35); tone(262, 0.5, 1.1, "sine", 0.18); sparkle(0.55); break;
      case "levelup": [392, 523, 659, 784, 1047].forEach((f, i) => { tone(f, i * 0.07, 0.22, "square", 0.09); tone(f, i * 0.07, 0.3, "sine", 0.12); }); sparkle(0.35); break;
      case "catch": tone(660, 0, 0.1, "square", 0.15); tone(440, 0.12, 0.1, "square", 0.15); tone(880, 0.24, 0.3, "square", 0.15); break;
    }
  };

  /* ---------------- voices: human clips first, labelled TTS otherwise ---------------- */
  TC.audioBase = "assets/audio/";
  TC.hasHuman = (w) => !!(window.TC_AUDIO && window.TC_AUDIO[String(w).toLowerCase()]);
  TC.playHuman = function (w) {
    const a = window.TC_AUDIO && window.TC_AUDIO[String(w).toLowerCase()];
    if (!a) return Promise.resolve(false);
    return new Promise((res) => {
      const au = new Audio(TC.audioBase + a.file);
      au.volume = TC.cfg.volume;
      TC.quiet(true);
      au.onended = () => { TC.quiet(false); res(true); }; au.onerror = () => { TC.quiet(false); res(false); };
      au.play().catch(() => { TC.quiet(false); res(false); });
    });
  };
  let voices = [];
  function loadVoices() { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; }
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  TC.voices = () => voices.filter((v) => /^en[-_]US/i.test(v.lang));
  TC.pickVoice = function () {
    const us = TC.voices();
    if (TC.cfg.voice) { const v = voices.find((x) => x.name === TC.cfg.voice); if (v) return v; }
    const pref = [/Aria.*Natural/i, /Jenny.*Natural/i, /Ana.*Natural/i, /Natural/i, /Google US English/i, /Samantha/i, /Zira/i];
    for (const p of pref) { const v = us.find((x) => p.test(x.name)); if (v) return v; }
    return us[0] || voices.find((v) => /^en/i.test(v.lang)) || null;
  };
  TC.speak = function (text, opt = {}) {
    if (!window.speechSynthesis || !text) return Promise.resolve();
    return new Promise((res) => {
      try { speechSynthesis.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text);
      const v = TC.pickVoice(); if (v) u.voice = v;
      u.lang = "en-US"; u.rate = opt.rate || 0.92; u.pitch = opt.pitch || 1.18; u.volume = TC.cfg.volume; // Ollie's voice: a little higher

      let done = false; const fin = () => { if (!done) { done = true; TC.quiet(false); TC.ollie && TC.ollie("idle"); res(); } };
      TC.quiet(true);
      u.onend = fin; u.onerror = fin; setTimeout(fin, 1500 + text.length * 120);
      TC.ollie && TC.ollie("talk");
      speechSynthesis.speak(u);
    });
  };
  /** Model a word/sentence: human clip for single passport words, labelled TTS for sentences. */
  TC.model = async function (sentence, word) {
    const words = String(sentence || "").replace(/[^a-zA-Z' ]/g, " ").trim().split(/\s+/).filter(Boolean);
    const single = words.length <= 2 && word && TC.hasHuman(word);
    if (single) { showSrc("human", word); await TC.playHuman(word); return "human"; }
    if (word && TC.hasHuman(word)) { showSrc("human", word); await TC.playHuman(word); await sleep(250); }
    showSrc("tts"); await TC.speak(sentence, { rate: 0.85, pitch: 1.0 }); // model sentences: natural pitch
    return "tts";
  };
  function showSrc(kind, word) {
    const t = $("#srcTag"); if (!t) return;
    if (kind === "human") {
      const a = window.TC_AUDIO[String(word).toLowerCase()];
      t.className = "src-tag human"; t.textContent = "真人發音"; t.title = `${a.file} · ${a.speaker} · ${a.licence}`;
    } else { t.className = "src-tag"; t.textContent = "電腦語音"; t.title = "Computer voice (text-to-speech)"; }
  }

  /* While the TV itself is talking, ignore what the recogniser hears (prevents the
     speakers' own model answer from counting as the child's answer). */
  let quietUntil = 0;
  TC.quiet = (on) => { quietUntil = on ? Infinity : performance.now() + 900; };
  TC.isQuiet = () => performance.now() < quietUntil;

  /* ---------------- microphone: level meter + recording ---------------- */
  const Mic = (TC.Mic = { stream: null, analyser: null, level: 0, rec: null, chunks: [], ok: false });
  Mic.init = async function () {
    if (Mic.ok || Mic.released) return Mic.ok;
    try {
      Mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const c = TC.ac(); const src = c.createMediaStreamSource(Mic.stream);
      Mic.analyser = c.createAnalyser(); Mic.analyser.fftSize = 1024; src.connect(Mic.analyser);
      const buf = new Float32Array(Mic.analyser.fftSize);
      (function loop() {
        Mic.analyser.getFloatTimeDomainData(buf);
        let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const rms = Math.sqrt(s / buf.length);
        Mic.level = Math.max(Mic.level * 0.82, Math.min(1, rms * 7));
        const m = $("#micMeter"); if (m) m.style.width = (Mic.level * 100).toFixed(0) + "%";
        const wv = $("#wave");
        if (wv && wv.offsetParent) { // live voice waveform: shows the AI is listening
          const g = wv.getContext("2d"), W = wv.width, H = wv.height; g.clearRect(0, 0, W, H);
          const grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, "#2ee6b6"); grad.addColorStop(0.5, "#ffc83d"); grad.addColorStop(1, "#ff5fa2");
          g.strokeStyle = grad; g.lineWidth = 3; g.beginPath();
          for (let i = 0; i < W; i++) { const v = buf[Math.floor((i / W) * buf.length)] || 0; const y = H / 2 + Math.max(-1, Math.min(1, v * 6)) * (H / 2 - 4); i ? g.lineTo(i, y) : g.moveTo(i, y); }
          g.stroke();
        }
        requestAnimationFrame(loop);
      })();
      Mic.ok = true; return true;
    } catch (e) { console.warn("mic", e); Mic.ok = false; return false; }
  };
  Mic.release = function () {
    try { Mic.stream && Mic.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    Mic.stream = null; Mic.rec = null; TC.cfg.record = false; Mic.released = true;
  };
  Mic.startRec = function () {
    if (!TC.cfg.record || !Mic.stream || !window.MediaRecorder) return;
    try {
      Mic.chunks = []; Mic.rec = new MediaRecorder(Mic.stream);
      Mic.rec.ondataavailable = (e) => e.data.size && Mic.chunks.push(e.data);
      Mic.rec.start();
    } catch (e) { Mic.rec = null; }
  };
  Mic.stopRec = function () {
    return new Promise((res) => {
      if (!Mic.rec || Mic.rec.state === "inactive") return res(null);
      Mic.rec.onstop = () => res(Mic.chunks.length ? new Blob(Mic.chunks, { type: Mic.rec.mimeType || "audio/webm" }) : null);
      try { Mic.rec.stop(); } catch (e) { res(null); }
    });
  };

  /* ---------------- AI speech recognition ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ASR = (TC.ASR = { supported: !!SR, state: SR ? "idle" : "unsupported", rec: null, want: false, handler: null });
  ASR.start = function (handler) {
    ASR.handler = handler;
    if (!SR || !TC.cfg.asr) { setAIPill(); return; }
    ASR.want = true;
    if (ASR.rec) return;
    const r = new SR();
    r.lang = "en-US"; r.continuous = true; r.interimResults = true; r.maxAlternatives = 5;
    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i], alts = [];
        for (let j = 0; j < res.length; j++) alts.push(res[j].transcript);
        ASR.handler && ASR.handler(alts, res.isFinal);
      }
    };
    r.onerror = (e) => {
      if (e.error === "audio-capture" && Mic.stream) { // some Android panels cannot share the mic: give it to the recogniser
        Mic.release(); TC.toast("已把麥克風交給 AI 語音辨識（此裝置不支援同時錄音）", 3000);
      }
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { ASR.state = "denied"; ASR.want = false; }
      else if (e.error === "network") ASR.state = "network";
      setAIPill();
    };
    r.onstart = () => { ASR.state = "on"; setAIPill(); };
    r.onend = () => { ASR.rec = null; if (ASR.state === "on") ASR.state = "idle"; setAIPill(); if (ASR.want) setTimeout(() => ASR.want && ASR.start(ASR.handler), ASR.state === "network" ? 2000 : 150); };
    try { r.start(); ASR.rec = r; } catch (e) { ASR.rec = null; }
  };
  ASR.stop = function () { ASR.want = false; ASR.handler = null; if (ASR.rec) try { ASR.rec.abort(); } catch (e) {} ASR.rec = null; };
  function setAIPill() {
    const p = $("#aiPill"); if (!p) return;
    const map = {
      on: ["on", "AI 正在聽 Listening"], idle: ["", "AI 待命"], unsupported: ["off", "老師判定模式（此瀏覽器無語音辨識）"],
      denied: ["off", "麥克風未授權 · 老師判定"], network: ["off", "AI 需網路 · 老師判定"]
    };
    const st = !TC.cfg.asr ? ["off", "AI 關閉 · 老師判定"] : map[ASR.state] || map.idle;
    p.className = "ai-pill " + st[0]; p.innerHTML = `<i></i>${st[1]}`;
  }
  TC.setAIPill = setAIPill;

  /* ---------------- answer matching (kid-friendly, lenient) ---------------- */
  const NUM = { 0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 20: "twenty" };
  const SOUND = { two: ["to", "too"], four: ["for", "fore"], eight: ["ate"], one: ["won"], red: ["read"], blue: ["blew"], bear: ["bare"],
    pink: ["ping"], plane: ["plain", "playing"], taxi: ["texas", "taxis"], bike: ["bite", "back"], bus: ["boss", "buzz"], cheese: ["chee", "cheers", "jeez"],
    hi: ["high"], fly: ["flies"], tiger: ["tigger"], zebra: ["zibra", "zeebra"], cake: ["kate"], cookie: ["cooky", "cookies"], sit: ["set"], clap: ["clip", "club"],
    friend: ["friends", "french"], swim: ["swimming"], climb: ["climbing", "time"], jump: ["jumping", "john"], run: ["running", "ron"], ride: ["right", "riding", "write"],
    // common near-misses for young Taiwanese learners (kept apart from other words in the same game)
    monkey: ["money", "monkeys"], rabbit: ["rabid", "robert"], turtle: ["total"], elephant: ["element"], duck: ["dock", "doc"],
    lion: ["line", "lying"], horse: ["house", "hose"], train: ["drain"], boat: ["both", "vote"], truck: ["track", "chuck"], egg: ["eggs", "ig"],
    green: ["grin"], purple: ["people"], white: ["wide", "why"], black: ["block"], stand: ["stan", "standing"], dance: ["dense", "dancing"],
    pizza: ["pisa"], lemon: ["lemons", "lemmon"], apple: ["apples", "app"], father: ["farther"], tennis: ["tenis"] };
  SOUND.tiger.push("taiga", "tigers");
  TC.norm = function (text) {
    let t = " " + String(text).toLowerCase() + " ";
    t = t.replace(/\b1st\b/g, "first").replace(/\b2nd\b/g, "second").replace(/\b3rd\b/g, "third");
    t = t.replace(/\b(\d+)\b/g, (m, d) => NUM[d] || m);
    t = t.replace(/[’`]/g, "'").replace(/\bit's\b/g, "it is").replace(/\bi'm\b/g, "i am").replace(/\blet's\b/g, "let us");
    t = t.replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ").trim();
    return t ? t.split(" ") : [];
  };
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function stem(w) { return w.replace(/'s$/, "").replace(/(ies)$/, "y").replace(/(es|s)$/, "").replace(/ing$/, ""); }
  TC.wordMatch = function (tok, target) {
    if (tok === target) return true;
    if (stem(tok) === stem(target) && stem(target).length >= 3) return true;
    if ((SOUND[target] || []).includes(tok)) return true;
    const L = target.length;
    if (L >= 5 && lev(tok, target) <= 1) return true;
    if (L >= 8 && Math.abs(tok.length - L) <= 1 && lev(tok, target) <= 2) return true;
    return false;
  };
  /** which candidate did the child say? exact/stem matches win over fuzzy ones */
  TC.pickHeard = function (text, list) {
    const toks = TC.norm(text || "");
    const exact = list.find((c) => toks.some((t) => t === c || stem(t) === stem(c)));
    return exact || list.find((c) => toks.some((t) => TC.wordMatch(t, c))) || null;
  };
  /** keys = [["bus"], ["fast","quick"]]  -> every group needs one alternative heard */
  TC.matchKeys = function (tokens, keys) {
    if (!keys || !keys.length) return tokens.length > 0;
    const joined = " " + tokens.join(" ") + " ";
    return keys.every((group) => group.some((alt) => {
      const parts = TC.norm(alt);
      if (parts.length > 1) return joined.includes(" " + parts.join(" ") + " ") || parts.every((p) => tokens.some((t) => TC.wordMatch(t, p)));
      return tokens.some((t) => TC.wordMatch(t, parts[0]));
    }));
  };
  TC.coverage = function (tokens, sentence) {
    const want = TC.norm(sentence); if (!want.length) return 0;
    let hit = 0; want.forEach((w) => { if (tokens.some((t) => TC.wordMatch(t, w))) hit++; });
    return hit / want.length;
  };

  /* ---------------- talk bar: one turn of teacher ↔ kid dialogue ---------------- */
  let turn = null, revealKey = () => {};
  TC.ask = function (spec) {
    // spec: {teacher, tzh, say, zh, keys, word, distractors:[{w, keys}], onWrong(w), onHeard(tokens)}
    if (turn) turn.finish({ ok: false, cancelled: true });
    return new Promise((resolve) => {
      const talk = $("#talk");
      $("#tLine").innerHTML = esc(spec.teacher || "") + (spec.tzh ? `<span class="t-zh">${esc(spec.tzh)}</span>` : "");
      const keyWords = new Set((spec.keys || []).flat().flatMap((k) => TC.norm(k)));
      const sayWords = String(spec.say || "").split(/\s+/).filter(Boolean);
      $("#kLine").innerHTML = sayWords.map((w, i) => {
        const n = TC.norm(w)[0] || ""; const isKey = [...keyWords].some((k) => TC.wordMatch(n, k));
        const hide = spec.hideKey && (spec.keys[0] || []).some((k) => TC.norm(k).some((kk) => TC.wordMatch(n, kk))); // hide only the mystery word
        return `<span class="w${isKey ? " key" : ""}${hide ? " blank" : ""}" data-n="${esc(n)}" data-t="${esc(w)}">${hide ? "?" + w.replace(/[a-z]/gi, "").slice(-1) : esc(w)}</span>`;
      }).join(" ") + (spec.zh ? `<span class="t-zh">${esc(spec.zh)}</span>` : "");
      $("#heard").innerHTML = "&nbsp;";
      $("#okBtn").classList.remove("glow");
      revealKey = () => $("#kLine").querySelectorAll(".w.blank").forEach((w) => { w.classList.remove("blank"); w.textContent = w.dataset.t; });
      talk.classList.add("show");
      if (TC.cfg.ollieAsks && spec.teacher && !spec.silentTeacher) TC.speak(spec.teacher.replace(/___/g, ""));
      const wrongSeen = new Set();
      let finished = false, hintT = null, best = 0;
      const t0 = Date.now();
      const finish = async (r) => {
        if (finished) return; finished = true; turn = null;
        clearTimeout(hintT); ASR.stop();
        const blob = await Mic.stopRec();
        r.blob = blob; r.ms = Date.now() - t0;
        if (r.ok) {
          r.stars = r.by === "ai" ? (best >= 0.8 ? 3 : 2) : 2;
          if (r.by === "ai") { const b = h("div", { class: "ai-badge" }, "🤖 AI 聽懂了！", h("q", {}, r.heard)); document.body.append(b); setTimeout(() => b.remove(), 1900); }
          revealKey();
          $("#kLine").querySelectorAll(".w").forEach((w) => w.classList.add("hit"));
          TC.sfx("ding");
          TC.stats.lines++; TC.stats.stars += r.stars; TC.stats.turns++; TC.lastSay = spec.say;
          if (r.blob) TC.stats.lastBlob = r.blob;
          TC.log({ type: "line", say: spec.say, heard: r.heard || "", by: r.by });
        }
        resolve(r);
      };
      turn = { finish, spec };
      Mic.startRec();
      ASR.start((alts, isFinal) => {
        if (finished || TC.isQuiet()) return;
        const tokensList = alts.map((a) => TC.norm(a));
        const shown = alts[0];
        $("#heard").innerHTML = `🤖 AI 聽到：<b>${esc(shown)}</b>`;
        // karaoke highlight
        const all = tokensList.flat();
        $("#kLine").querySelectorAll(".w").forEach((w) => { if (all.some((t) => TC.wordMatch(t, w.dataset.n))) w.classList.add("hit"); });
        spec.onHeard && spec.onHeard(all);
        for (let i = 0; i < tokensList.length; i++) {
          const toks = tokensList[i];
          best = Math.max(best, TC.coverage(toks, spec.say || ""));
          if (TC.matchKeys(toks, spec.keys)) return finish({ ok: true, by: "ai", heard: alts[i] });
        }
        if (isFinal && spec.distractors) {
          for (const d of spec.distractors) {
            if (!wrongSeen.has(d.w) && tokensList.some((toks) => TC.matchKeys(toks, d.keys || [[d.w]]))) {
              wrongSeen.add(d.w); spec.onWrong && spec.onWrong(d.w);
              if (wrongSeen.size >= 2) revealKey();
              break;
            }
          }
        }
      });
      hintT = setTimeout(() => { if (!finished) { $("#okBtn").classList.add("glow"); revealKey(); if (spec.autoModel !== false) TC.model(spec.say, spec.word); } }, (TC.cfg.hintAfter || 9) * 1000 * (spec.hideKey ? 1.4 : 1));
    });
  };
  TC.teacherOK = () => {
    if (turn) return turn.finish({ ok: true, by: "teacher", heard: "" });
    if (TC.pending) { const p = TC.pending; TC.pending = null; p(); }
  };
  /** wait for a tap/swipe (or teacher Enter, or timeout) between turns */
  TC.waitAction = (ms = 6000) => new Promise((res) => { let t; const done = () => { clearTimeout(t); if (TC.pending === done) TC.pending = null; res(); }; TC.pending = done; t = setTimeout(done, ms); });
  TC.skipTurn = () => turn && turn.finish({ ok: false, skipped: true });
  TC.hearModel = () => { if (!turn) return; revealKey(); TC.model(turn.spec.say, turn.spec.word); };
  TC.hideTalk = () => $("#talk").classList.remove("show");
  TC.stats = { lines: 0, stars: 0, turns: 0, lastBlob: null };

  /* ---------------- little visual helpers ---------------- */
  TC.floatText = function (text, xPct = 50, yPct = 45, color = "#ffc83d") {
    const d = h("div", { class: "float-txt", style: `left:${xPct}%;top:${yPct}%;color:${color}` }, text);
    document.body.append(d); setTimeout(() => d.remove(), 1500);
  };
  TC.toast = function (text, ms = 2500) {
    const d = h("div", { class: "toast" }, text); document.body.append(d); setTimeout(() => d.remove(), ms);
  };
  const confCanvas = h("canvas", { id: "confetti" });
  let parts = [], confRun = false;
  TC.confetti = function (n = 160, colors) {
    if (!confCanvas.isConnected) document.body.append(confCanvas);
    const W = (confCanvas.width = innerWidth), H = (confCanvas.height = innerHeight);
    const cols = colors || ["#ffc83d", "#ff5fa2", "#2ee6b6", "#4cc9ff", "#9b6bff", "#ffffff"];
    for (let i = 0; i < n; i++) parts.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.45, vx: (Math.random() - 0.5) * 26, vy: -Math.random() * 26 - 8, r: 6 + Math.random() * 9, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, life: 1 });
    if (confRun) return; confRun = true;
    const ctx = confCanvas.getContext("2d");
    (function loop() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => { p.vy += 0.7; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life -= 0.006;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.66); ctx.restore(); });
      parts = parts.filter((p) => p.y < H + 40 && p.life > 0);
      if (parts.length) requestAnimationFrame(loop); else { confRun = false; ctx.clearRect(0, 0, W, H); }
    })();
  };

  /* ---------------- Ollie-Bot (robot owl guide from the passport) ---------------- */
  TC.ollieSVG = function (cls = "") {
    if (TC.art) return `<div class="ollie3d ${cls}"><img src="${TC.art("ollie")}" alt="Ollie-Bot" draggable="false"></div>`;
    return `<svg class="ollie ${cls}" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-label="Ollie-Bot">
<g class="body">
 <line x1="100" y1="38" x2="100" y2="14" stroke="#c9d6ff" stroke-width="5" stroke-linecap="round"/>
 <path class="antenna-star" style="transform-origin:100px 12px" d="M100 0l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffc83d"/>
 <path class="wingL" d="M38 110 Q8 140 26 186 Q44 160 52 132z" fill="#6f7fd8"/>
 <path class="wingR" d="M162 110 Q192 140 174 186 Q156 160 148 132z" fill="#6f7fd8"/>
 <rect x="34" y="36" width="132" height="170" rx="62" fill="#8fa2ff"/>
 <path d="M44 52 L60 30 L76 50z M156 52 L140 30 L124 50z" fill="#8fa2ff"/>
 <circle cx="72" cy="88" r="27" fill="#fff"/><circle cx="128" cy="88" r="27" fill="#fff"/>
 <circle cx="72" cy="88" r="13" fill="#0a1633"/><circle cx="128" cy="88" r="13" fill="#0a1633"/>
 <circle cx="77" cy="83" r="5" fill="#fff"/><circle cx="133" cy="83" r="5" fill="#fff"/>
 <path class="beak" style="transform-origin:100px 108px" d="M90 106 L110 106 L100 122z" fill="#ffc83d"/>
 <rect x="62" y="132" width="76" height="52" rx="12" fill="#0a1633" stroke="#c9d6ff" stroke-width="4"/>
 <text x="100" y="167" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="26" fill="#2ee6b6">ABC</text>
 <rect x="70" y="204" width="18" height="14" rx="5" fill="#ffc83d"/><rect x="112" y="204" width="18" height="14" rx="5" fill="#ffc83d"/>
</g></svg>`;
  };
  TC.ollie = function (state) {
    document.querySelectorAll("svg.ollie,.ollie3d").forEach((o) => { o.classList.remove("talk", "cheer"); if (state === "talk" || state === "cheer") o.classList.add(state); });
  };

  /* ---------------- passport scanning ---------------- */
  const KEYMAP = { Minus: ["-", "_"], Period: [".", ">"], Space: [" ", " "], Slash: ["/", "?"], Equal: ["=", "+"] };
  let scanBuf = "", scanLast = 0, scanCb = null;
  TC.onScan = (cb) => (scanCb = cb);
  TC.handleScan = (kid) => scanCb && scanCb(kid);
  function handleScanText(text) {
    const kid = TC.parseKid(text);
    if (kid && scanCb) scanCb(kid); else if (text.length > 3) TC.toast("看不懂這個 QR：" + text);
  }
  TC.handleScanText = handleScanText;
  // A passport scan always starts with "TCES". While the typed text is still a prefix of that
  // (or starts with it), every key belongs to the scanner and never triggers a teacher shortcut —
  // this works for fast USB scanners and slower Bluetooth ones alike.
  const isScanPrefix = (b) => { b = b.toLowerCase(); return b.length <= 4 ? "tces".startsWith(b) : b.startsWith("tces"); };
  document.addEventListener("keydown", (e) => {
    const inField = /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || "");
    if (inField) return;
    const now = performance.now();
    if (now - scanLast > 1500) scanBuf = "";
    let ch = null;
    // e.code works even when a Chinese IME is active (scanner keystrokes then arrive as "Process")
    if (/^Key[A-Z]$/.test(e.code)) ch = e.shiftKey ? e.code[3] : e.code[3].toLowerCase();
    else if (/^Digit\d$/.test(e.code) && !e.shiftKey) ch = e.code[5];
    else if (/^Numpad\d$/.test(e.code)) ch = e.code[6];
    else if (KEYMAP[e.code]) ch = KEYMAP[e.code][e.shiftKey ? 1 : 0];
    if (/^(Shift|Control|Alt|Meta|CapsLock)/.test(e.code)) return;
    if (e.code === "Enter" || e.code === "NumpadEnter" || (e.code === "Tab" && scanBuf.length >= 6)) { // some scanners end with Tab
      const t = scanBuf; scanBuf = "";
      if (t.length >= 6 && /^tces/i.test(t)) { e.preventDefault(); e.stopPropagation(); handleScanText(t); return; }
      if (t) { e.preventDefault(); return; } // half a scan: swallow the Enter
    } else if (ch && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isScanPrefix(scanBuf + ch)) { scanBuf += ch; scanLast = now; e.preventDefault(); return; }
      scanBuf = "";
      if (isScanPrefix(ch)) { scanBuf = ch; scanLast = now; e.preventDefault(); return; }
    }
    TC.onKey && TC.onKey(e, false);
  }, true);

  TC.cameraScan = async function () {
    const wrap = h("div", { class: "cam" });
    const video = h("video", { playsinline: "", muted: "" });
    const close = h("button", { class: "icon-btn close", onclick: () => stop() }, "✕");
    wrap.append(video, h("div", { class: "frame" }), close, h("div", { class: "hint", style: "position:absolute;bottom:3rem;font-size:2rem" }, "把護照 QR Code 對準鏡頭 Show your passport QR code"));
    document.body.append(wrap);
    let stream, alive = true;
    const stop = () => { alive = false; stream && stream.getTracks().forEach((t) => t.stop()); wrap.remove(); };
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } } });
      video.srcObject = stream; await video.play();
    } catch (e) { stop(); TC.toast("找不到相機 No camera"); return; }
    const cv = document.createElement("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    const det = "BarcodeDetector" in window ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
    while (alive) {
      await sleep(180);
      if (!video.videoWidth) continue;
      let text = null;
      try {
        if (det) { const r = await det.detect(video); if (r[0]) text = r[0].rawValue; }
        if (!text && window.jsQR) {
          cv.width = video.videoWidth >> 1; cv.height = video.videoHeight >> 1;
          ctx.drawImage(video, 0, 0, cv.width, cv.height);
          const img = ctx.getImageData(0, 0, cv.width, cv.height);
          const q = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
          if (q) text = q.data;
        }
      } catch (e) {}
      if (text && TC.parseKid(text)) { TC.sfx("coin"); stop(); handleScanText(text); return; }
    }
  };

  TC.manualPick = function () {
    const roster = TC.roster(); let grade = 3;
    const ids = Object.keys(roster).length ? Object.keys(roster).sort() : Array.from({ length: 28 }, (_, i) => String(i + 1).padStart(2, "0"));
    const card = h("div", { class: "card" });
    const wrap = h("div", { class: "picker", onclick: (e) => { if (e.target === wrap) wrap.remove(); } }, card);
    card.append(h("h2", { class: "zh" }, "手動選擇旅客（沒有掃描機時使用）"));
    if (!Object.keys(roster).length) {
      const gr = h("div", { class: "grade-row" }, h("span", { class: "zh", style: "font-size:1.4rem;align-self:center" }, "年級："));
      for (let g = 1; g <= 6; g++) gr.append(h("button", { class: g === grade ? "on" : "", onclick: (e) => { grade = g; gr.querySelectorAll("button").forEach((b) => b.classList.remove("on")); e.target.classList.add("on"); } }, g + ""));
      card.append(gr);
    }
    const grid = h("div", { class: "grid-nums" });
    ids.forEach((id) => {
      const r = roster[id];
      grid.append(h("button", { onclick: () => { wrap.remove(); TC.sfx("coin"); scanCb && scanCb(mkKid(id, r ? r.name : "Traveler " + id, r ? r.grade : grade)); } }, id, r ? h("small", {}, r.name) : null));
    });
    card.append(grid, h("p", { class: "hint zh" }, "名單可在 ⚙ 設定貼上（只存在這台電腦）。"));
    document.body.append(wrap);
  };

  /* ---------------- event log + optional Google Sheet sync ---------------- */
  TC.gate = 0; TC.kid = null;
  TC.log = function (ev) {
    const row = Object.assign({ t: new Date().toISOString(), gate: TC.gate, kid: TC.kid ? TC.kid.id : "", name: TC.kid ? TC.kid.name : "", grade: TC.kid ? TC.kid.grade : "" }, ev);
    try {
      const log = safeJSON(localStorage.getItem("tc_log")) || []; log.push(row);
      localStorage.setItem("tc_log", JSON.stringify(log.slice(-5000)));
      if (TC.cfg.syncUrl) { const q = safeJSON(localStorage.getItem("tc_queue")) || []; q.push(row); localStorage.setItem("tc_queue", JSON.stringify(q)); flush(); }
    } catch (e) {}
  };
  let flushing = false;
  async function flush() {
    if (flushing || !TC.cfg.syncUrl) return; flushing = true;
    try {
      const q = safeJSON(localStorage.getItem("tc_queue")) || [];
      if (q.length) {
        await fetch(TC.cfg.syncUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ events: q }) });
        const now = safeJSON(localStorage.getItem("tc_queue")) || [];
        localStorage.setItem("tc_queue", JSON.stringify(now.slice(q.length)));
      }
    } catch (e) { /* offline: keep queue, retry later */ }
    flushing = false;
  }
  setInterval(flush, 15000);
  /** read the live state from the Google Sheet (null if sync is off or slow) */
  TC.fetchState = async function (ms = 2500) {
    if (!TC.cfg.syncUrl) return null;
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    try { const u = TC.cfg.syncUrl + (TC.cfg.syncUrl.includes("?") ? "&" : "?") + "action=state&t=" + Date.now(); const r = await fetch(u, { signal: ctl.signal }); return await r.json(); }
    catch (e) { return null; } finally { clearTimeout(t); }
  };
  TC.flush = flush;
  TC.exportCSV = function () {
    const log = safeJSON(localStorage.getItem("tc_log")) || [];
    const cols = ["t", "gate", "kid", "name", "grade", "type", "say", "heard", "by", "stars", "letter"];
    const csv = "﻿" + [cols.join(",")].concat(log.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
    const a = h("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `tces-gate${TC.gate}-log.csv` });
    document.body.append(a); a.click(); a.remove();
  };

  /* ---------------- settings panel ---------------- */
  TC.openSettings = function () {
    const vs = TC.voices();
    const card = h("div", { class: "card" });
    const wrap = h("div", { class: "settings" }, card);
    card.innerHTML = `<h2>⚙ 設定 Settings <small>（只存在這台電腦 · stored on this device）</small></h2>
      <label><span>關卡 Gate</span><select id="sGate">${[1, 2, 3, 4, 5, 6].map((g) => `<option value="${g}" ${g === TC.gate ? "selected" : ""}>Gate ${g} · ${TC_CONTENT.gates[g].title}</option>`).join("")}</select></label>
      <label><span>AI 語音辨識</span><select id="sAsr"><option value="1">開 ON（Chrome / Edge，需要網路）</option><option value="0">關 OFF（老師按 ✓ 判定）</option></select></label>
      <label><span>每位孩子回合數</span><select id="sRounds"><option value="0">標準（約 3 分鐘／人）</option><option value="3">快速 3 回合（約 2 分鐘／人）</option></select></label>
      <label><span>歐力先唸老師的問題</span><select id="sOllie"><option value="0">關（由老師親口問，建議）</option><option value="1">開（電腦語音先問一次）</option></select></label>
      <label><span>錄下孩子的聲音並播放</span><select id="sRec"><option value="1">開 ON（只留在這台電腦）</option><option value="0">關 OFF</option></select></label>
      <label><span>電腦語音 Voice</span><select id="sVoice"><option value="">自動（優先 Natural 自然語音）</option>${vs.map((v) => `<option ${v.name === TC.cfg.voice ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label>
      <label><span>音量 Volume</span><input id="sVol" type="range" min="0.2" max="1" step="0.05" value="${TC.cfg.volume}"></label>
      <label><span>幾秒後提示（秒）</span><input id="sHint" type="text" value="${TC.cfg.hintAfter}" style="max-width:6rem"></label>
      <label><span>同步網址 Google Apps Script（可空白）</span><input id="sSync" type="text" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(TC.cfg.syncUrl)}"></label>
      <label style="align-items:flex-start"><span>名單 Roster（手動選擇用）<br><small>每行：座號 英文名 年級<br>例：07 Amy 3</small></span><textarea id="sRoster">${esc(TC.cfg.roster)}</textarea></label>
      <p><small>快捷鍵：Enter/空白鍵＝老師判定通過 ✓ · H＝聽示範 · N＝跳過 · C＝相機掃描 · M＝手動選擇 · Esc＝回到掃描畫面</small></p>
      <div class="row"><button id="sTest">🎤 測試麥克風</button><button id="sCsv">⬇ 匯出紀錄 CSV</button><button id="sClose">取消</button><button class="save" id="sSave">儲存 Save</button></div>`;
    document.body.append(wrap);
    $("#sAsr").value = TC.cfg.asr ? "1" : "0"; $("#sRounds").value = String(TC.cfg.rounds || 0); $("#sOllie").value = TC.cfg.ollieAsks ? "1" : "0"; $("#sRec").value = TC.cfg.record ? "1" : "0";
    $("#sClose").onclick = () => wrap.remove();
    $("#sCsv").onclick = () => TC.exportCSV();
    $("#sTest").onclick = async () => { const ok = await Mic.init(); TC.toast(ok ? "🎤 麥克風 OK，請說話看下方音量條" : "❌ 麥克風無法開啟"); };
    $("#sSave").onclick = () => {
      Object.assign(TC.cfg, { asr: $("#sAsr").value === "1", record: $("#sRec").value === "1", voice: $("#sVoice").value, volume: +$("#sVol").value, hintAfter: Math.max(3, +$("#sHint").value || 9), rounds: +$("#sRounds").value || 0, ollieAsks: $("#sOllie").value === "1", syncUrl: $("#sSync").value.trim(), roster: $("#sRoster").value });
      TC.saveCfg(); setAIPill();
      const g = +$("#sGate").value; wrap.remove();
      if (TC.gate >= 1 && TC.gate <= 6 && g !== TC.gate) location.href = "station.html?gate=" + g + "#gate-" + g;
    };
  };
})();
