/* 🎤 Voice box — 唸給老師聽
   Students read a level's words to the teacher. Every word is captured as raw audio, trimmed and levelled,
   and all words are merged into ONE complete WAV file (with the time of each word inside it).
   The file stays on this device (IndexedDB 'epwt-voicebox'); nothing is uploaded.
   The teacher listens as often as needed (loop, slower, jump to a word, download the file) and gives
   feedback: stars, quick comments, words to practise again, a written note and an optional voice message.
   The student sees the feedback on the home screen next time. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, el = u.el, ui = EP.ui;
  const VB = (EP.vbox = {});
  /** append children, skipping null/false (native Element.append would print the text "null") */
  const add = (node, ...kids) => { node.append(...kids.flat().filter((k) => k != null && k !== false)); return node; };
  const RATE = 22050;      // WAV sample rate: clear speech, small files (~44 kB per second)
  const GAP = 0.8;         // seconds of silence between words in the merged file
  const MAX_SEC = 8;       // one word / phrase: auto-stop
  const MSG_SEC = 30;      // teacher voice message: auto-stop

  /* ---------------- storage (one record per take) ---------------- */
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res) => {
      try {
        const r = indexedDB.open('epwt-voicebox', 1);
        r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('takes')) d.createObjectStore('takes', { keyPath: 'id' }); };
        r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
    return dbp;
  }
  VB.cache = [];
  VB.list = () => db().then((d) => new Promise((res) => {
    if (!d) return res([]);
    const out = [];
    try {
      const req = d.transaction('takes', 'readonly').objectStore('takes').openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { out.push(c.value); c.continue(); } else { out.sort((a, b) => (a.ts < b.ts ? 1 : -1)); VB.cache = out; res(out); } };
      req.onerror = () => res(out);
    } catch (e) { res(out); }
  }));
  function write(fn) {
    return db().then((d) => new Promise((res) => {
      if (!d) return res(false);
      try { const t = d.transaction('takes', 'readwrite'); fn(t.objectStore('takes')); t.oncomplete = () => res(true); t.onerror = () => res(false); t.onabort = () => res(false); } catch (e) { res(false); }
    })).then((ok) => VB.list().then(() => ok));
  }
  VB.put = (take) => write((st) => st.put(take));
  VB.del = (id) => write((st) => st.delete(id));
  VB.unseen = (pid) => VB.cache.filter((t) => t.profileId === pid && t.feedback && !t.feedback.seen);
  VB.list();

  /* ---------------- microphone: raw PCM capture (works the same in every browser) ---------------- */
  let mic = null;
  VB.micOpen = async function () {
    if (mic) return mic;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { const e = new Error('unsupported'); e.name = 'NotSupportedError'; throw e; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) {} }
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const sink = ctx.createGain(); sink.gain.value = 0;   // keeps the processor running, plays nothing
    mic = { stream, ctx, src, proc, sink, rec: null, level: 0 };
    proc.onaudioprocess = (e) => {
      if (!mic) return;
      const d = e.inputBuffer.getChannelData(0); let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i] * d[i];
      mic.level = Math.sqrt(s / (d.length / 4));
      if (mic.rec) mic.rec.push(new Float32Array(d));
    };
    src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
    return mic;
  };
  VB.micClose = function () {
    if (!mic) return; const m = mic; mic = null;
    try { m.proc.disconnect(); m.src.disconnect(); m.sink.disconnect(); } catch (e) {}
    try { m.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { m.ctx.close(); } catch (e) {}
  };
  VB.level = () => (mic ? mic.level : 0);
  VB.recStart = () => { if (mic) mic.rec = []; };
  /** stop and return the clip trimmed, levelled and at RATE — or null if nothing was heard */
  VB.recStop = function () {
    if (!mic || !mic.rec) return null;
    const parts = mic.rec; mic.rec = null;
    let n = 0; parts.forEach((p) => (n += p.length));
    const raw = new Float32Array(n); let o = 0; parts.forEach((p) => { raw.set(p, o); o += p.length; });
    const t = trim(resample(raw, mic.ctx.sampleRate));
    return t ? level(fade(t)) : null;
  };

  /* ---------------- audio processing ---------------- */
  function resample(pcm, from) {
    if (from === RATE) return pcm;
    const ratio = from / RATE, n = Math.floor(pcm.length / ratio), out = new Float32Array(n);
    if (ratio >= 1) { // average the samples that fall in each output slot (simple anti-alias filter)
      for (let i = 0; i < n; i++) { const a = Math.floor(i * ratio), b = Math.max(a + 1, Math.min(pcm.length, Math.floor((i + 1) * ratio))); let s = 0; for (let k = a; k < b; k++) s += pcm[k]; out[i] = s / (b - a); }
    } else {
      for (let i = 0; i < n; i++) { const x = i * ratio, a = Math.floor(x), f = x - a; const p = pcm[a] || 0, q = pcm[a + 1] === undefined ? p : pcm[a + 1]; out[i] = p + (q - p) * f; }
    }
    return out;
  }
  /** cut the silence before and after the voice; null when no voice was heard */
  function trim(pcm) {
    const F = Math.round(RATE * 0.01), nF = Math.floor(pcm.length / F);
    if (nF < 5) return null;
    const rms = new Float32Array(nF);
    for (let f = 0; f < nF; f++) { let s = 0; for (let i = f * F; i < (f + 1) * F; i++) s += pcm[i] * pcm[i]; rms[f] = Math.sqrt(s / F); }
    const sorted = Array.from(rms).sort((a, b) => a - b), floor = sorted[Math.floor(nF * 0.2)], peak = sorted[nF - 1];
    if (peak < 0.008) return null;
    const th = Math.max(0.006, floor * 2.5, peak * 0.06);
    let a = 0; while (a < nF && rms[a] < th) a++;
    let b = nF - 1; while (b > a && rms[b] < th) b--;
    if (b - a < 8) return null; // under ~0.08 s of sound: not a word
    return pcm.slice(Math.max(0, (a - 15) * F), Math.min(pcm.length, (b + 25) * F));
  }
  function fade(pcm) { const n = Math.min(Math.round(RATE * 0.01), pcm.length >> 1); for (let i = 0; i < n; i++) { const g = i / n; pcm[i] *= g; pcm[pcm.length - 1 - i] *= g; } return pcm; }
  function level(pcm) {
    let pk = 0; for (let i = 0; i < pcm.length; i++) pk = Math.max(pk, Math.abs(pcm[i]));
    const g = pk ? Math.min(6, 0.89 / pk) : 1; if (Math.abs(g - 1) < 0.05) return pcm;
    const out = new Float32Array(pcm.length); for (let i = 0; i < pcm.length; i++) out[i] = pcm[i] * g; return out;
  }
  /** 16-bit mono PCM WAV — opens in every browser and media player */
  VB.wav = function (pcm) {
    const buf = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, RATE, true);
    v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
    for (let i = 0, o = 44; i < pcm.length; i++, o += 2) { const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    return new Blob([buf], { type: 'audio/wav' });
  };
  /** merge the clips into ONE file; returns the WAV, its length and where each word starts and ends */
  VB.merge = function (items) { // items: [{pcm|null, meta}]
    const lead = Math.round(RATE * 0.4), gap = Math.round(RATE * GAP);
    let n = lead; items.forEach((c) => { if (c.pcm) n += c.pcm.length + gap; });
    const out = new Float32Array(n), marks = []; let o = lead;
    items.forEach((c) => {
      if (!c.pcm) { marks.push(Object.assign({}, c.meta, { skipped: true })); return; }
      out.set(c.pcm, o);
      marks.push(Object.assign({}, c.meta, { start: +(o / RATE).toFixed(2), end: +((o + c.pcm.length) / RATE).toFixed(2) }));
      o += c.pcm.length + gap;
    });
    return { blob: VB.wav(out), dur: +(n / RATE).toFixed(1), marks };
  };

  function micError(e) {
    const name = (e && e.name) || '';
    if (EP.hosted) return '這個網址（claude.ai 線上版）不能使用麥克風。請用「下載版」或學校網站版開啟遊戲再錄音。';
    if (name === 'NotAllowedError' || name === 'SecurityError') return '麥克風沒有開放：請按網址列左邊的鎖頭 🔒 → 麥克風「允許」，再按一次開始。';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return '找不到麥克風：請接上耳麥或麥克風後再試一次。';
    if (name === 'NotSupportedError') return '這個瀏覽器不能錄音：請用新版 Chrome、Edge 或 Safari。';
    return '麥克風無法使用（' + (e && e.message ? e.message : name || 'unknown') + '）。';
  }
  const fmtTime = (s) => { s = Math.max(0, s || 0); return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };
  const fmtDate = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const stars = (n) => '⭐'.repeat(n || 0) + '☆'.repeat(3 - (n || 0));
  function playPcm(pcm) { const a = new Audio(URL.createObjectURL(VB.wav(pcm))); a.play().catch(() => {}); return a; }

  // leaving a screen always releases the microphone
  const show0 = ui.show;
  ui.show = function (name, arg) { VB.micClose(); return show0.call(this, name, arg); };

  /* =====================================================================
     STUDENT: read the level's words, one by one, then send ONE file
     ===================================================================== */
  /** the words to read: the ones this student knows least first, then in book order */
  function pickWords(n, count) {
    const all = EP.levelWords(n); if (!count || count >= all.length) return all;
    const box = (w) => ((EP.me.words || {})[w.id] || { b: 0 }).b || 0;
    const chosen = all.slice().sort((a, b) => box(a) - box(b) || a.id - b.id).slice(0, count);
    return chosen.sort((a, b) => a.id - b.id);
  }
  ui.screens.speak = function (arg) {
    const n = arg.level, L = EP.levels[n - 1], total = EP.levelWords(n).length;
    const s = el('div', { class: 'screen vb' });
    s.appendChild(ui.topbar(`🎤 Read to my teacher 唸給老師聽 · Level ${n}`, el('button', { class: 'btn small ghost', onclick: () => ui.show('myvoice') }, '📬 我的錄音')));
    const box = el('div', { class: 'panel vb-panel' }); s.appendChild(box);
    let words = [], clips = [], i = 0, recording = false, stopTimer = 0, raf = 0, player = null;
    intro();
    return s;

    function intro() {
      box.innerHTML = '';
      add(box, 
        el('div', { class: 'vb-head' }, el('span', { class: 'vb-big' }, L.icon), el('div', {}, el('div', { class: 'muted' }, `Level ${n} · ${L.city}`), el('h2', {}, L.titleEn), el('div', { class: 'zh' }, `${L.cityZh} · ${L.titleZh}`))),
        el('p', { class: 'zh vb-lead' }, '把這一關的單字一個一個唸給老師聽。全部唸完，會合成「一個完整的錄音檔」交給老師；老師聽完會給你星星和建議。'),
        el('ol', { class: 'zh vb-steps' }, el('li', {}, '先按 🔊 聽一次正確發音'), el('li', {}, '按 🎤 開始，大聲唸，唸完按 ⏹'), el('li', {}, '不滿意可以重錄，滿意就按 ➜ 下一個')),
        el('div', { class: 'row', style: { justifyContent: 'center', gap: '14px', flexWrap: 'wrap' } },
          el('button', { class: 'btn go big', onclick: (e) => begin(10, e.currentTarget) }, `🎤 ${Math.min(10, total)} words`, el('small', { class: 'zh' }, '10 個單字（建議）')),
          el('button', { class: 'btn blue big', onclick: (e) => begin(total, e.currentTarget) }, `🎤 All ${total}`, el('small', { class: 'zh' }, `全部 ${total} 個`))),
        el('p', { class: 'muted zh', style: { textAlign: 'center', marginTop: '10px' } }, '第一次會問能不能使用麥克風，請按「允許」。錄音只存在這台裝置，不會上傳。'));
    }
    async function begin(count, btn) {
      btn.disabled = true;
      try { await VB.micOpen(); } catch (e) {
        btn.disabled = false;
        box.querySelectorAll('.vb-err').forEach((x) => x.remove());
        box.appendChild(el('div', { class: 'vb-err zh', role: 'alert' }, '⚠️ ', micError(e)));
        return;
      }
      EP.sfx.unlock && EP.sfx.unlock();
      words = pickWords(n, count); clips = words.map(() => undefined); i = 0; step();
    }
    function step() {
      cancelAnimationFrame(raf); if (player) { player.pause(); player = null; }
      const w = words[i], pic = EP.pic(w), c = clips[i];
      box.innerHTML = '';
      const dots = el('div', { class: 'vb-dots', role: 'img', 'aria-label': `第 ${i + 1} 個，共 ${words.length} 個` }, words.map((_, k) => el('i', { class: (clips[k] === null ? 'skip' : clips[k] ? 'done' : '') + (k === i ? ' now' : '') })));
      const meter = el('div', { class: 'vb-meter' }, el('i'));
      const secs = el('span', { class: 'vb-secs' });
      const recBtn = el('button', { class: 'vb-rec' + (recording ? ' on' : ''), 'aria-label': 'Record 錄音', onclick: () => (recording ? stop() : start()) }, el('span', { class: 'vb-rec-ic' }, '🎤'), el('span', { class: 'zh' }, c ? '再錄一次' : '按我開始唸'));
      const after = c ? el('div', { class: 'row vb-after' },
        el('span', { class: 'vb-ok zh' }, '✅ 錄好了！'),
        el('button', { class: 'btn', onclick: () => { if (player) player.pause(); player = playPcm(c); } }, '▶ Play 聽聽看'),
        el('button', { class: 'btn go', onclick: next }, i < words.length - 1 ? 'Next ➜ 下一個' : 'Finish ✓ 唸完了')) : null;
      add(box, 
        el('div', { class: 'row', style: { justifyContent: 'space-between' } }, el('b', {}, `${i + 1} / ${words.length}`), dots),
        el('div', { class: 'vb-card' }, pic ? el('div', { class: 'pic' }, pic) : null, el('div', { class: 'vb-word' }, w.word), el('div', { class: 'zh vb-zh' }, w.zh),
          el('button', { class: 'btn blue', onclick: () => { EP.audio.play(w); } }, '🔊 Listen 聽示範 ', ui.srcTag(EP.audio.source(w)))),
        el('div', { class: 'vb-recrow' }, recBtn, el('div', { class: 'vb-live' }, meter, secs)),
        after,
        el('div', { class: 'row vb-nav' },
          el('button', { class: 'btn small', disabled: i === 0, onclick: () => { i--; step(); } }, '← 上一個'),
          el('button', { class: 'btn small', onclick: () => { clips[i] = null; next(); } }, '⏭ 這個不會，跳過'),
          el('button', { class: 'btn small', onclick: finish }, '📮 先送出已錄好的')),
        el('p', { class: 'muted zh vb-hint' }, '① 按 🔊 聽　② 按 🎤 大聲唸，唸完按 ⏹　③ 按 ➜ 下一個'));
      if (!c && clips[i] !== null) setTimeout(() => EP.audio.play(w), 250); // hear the model first
      function start() {
        EP.audio.stop(); if (player) player.pause();
        VB.recStart(); recording = true; recBtn.classList.add('on'); recBtn.lastChild.textContent = '唸完按這裡 ⏹';
        const t0 = performance.now();
        const tick = () => { meter.firstChild.style.width = Math.min(100, VB.level() * 420) + '%'; secs.textContent = `${Math.max(0, MAX_SEC - Math.floor((performance.now() - t0) / 1000))} 秒`; raf = requestAnimationFrame(tick); };
        tick(); stopTimer = setTimeout(stop, MAX_SEC * 1000);
      }
      function stop() {
        if (!recording) return; recording = false; clearTimeout(stopTimer); cancelAnimationFrame(raf);
        const pcm = VB.recStop();
        if (!pcm) { EP.sfx.wrong(); ui.toast('沒有聽到聲音，靠近麥克風再大聲唸一次', '🎤'); step(); return; }
        clips[i] = pcm; EP.sfx.pop(); step(); player = playPcm(pcm);
      }
    }
    function next() { if (i < words.length - 1) { i++; step(); } else finish(); }
    function finish() {
      cancelAnimationFrame(raf); if (recording) { recording = false; clearTimeout(stopTimer); VB.recStop(); }
      if (player) player.pause();
      const got = clips.filter(Boolean).length;
      box.innerHTML = '';
      add(box, el('h2', {}, '📮 Send to my teacher 送給老師'),
        el('p', { class: 'zh' }, `已錄好 ${got} 個，跳過 ${clips.filter((c) => c === null).length} 個，還沒唸 ${clips.filter((c) => c === undefined).length} 個。點單字可以回去重錄。`),
        el('div', { class: 'vb-chips' }, words.map((w, k) => el('button', { class: 'vb-chip ' + (clips[k] ? 'done' : clips[k] === null ? 'skip' : ''), onclick: () => { i = k; step(); } }, clips[k] ? '✅ ' : clips[k] === null ? '⏭ ' : '○ ', w.word))),
        el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } },
          el('button', { class: 'btn go big', disabled: !got, onclick: (e) => send(e.currentTarget) }, '📮 Send 送出', el('small', { class: 'zh' }, '合成一個完整錄音檔')),
          el('button', { class: 'btn big', onclick: () => { i = Math.max(0, clips.findIndex((c) => c === undefined)); step(); } }, '🎤 繼續唸')),
        got ? null : el('p', { class: 'zh muted', style: { textAlign: 'center' } }, '至少要錄好一個單字才能送出。'));
    }
    async function send(btn) {
      btn.disabled = true;
      const m = VB.merge(words.map((w, k) => ({ pcm: clips[k] || null, meta: { id: w.id, w: w.word, zh: w.zh } })));
      const take = { id: Date.now().toString(36) + u.uid(), profileId: EP.me.id, name: EP.me.name, avatar: EP.me.avatar, level: n, ts: new Date().toISOString(),
        words: m.marks, dur: m.dur, wav: m.blob, feedback: null };
      const ok = await VB.put(take);
      VB.micClose();
      if (!ok) { btn.disabled = false; ui.toast('儲存失敗：這台裝置的空間可能不夠', '⚠️'); return; }
      EP.addCoins(15); EP.addXP(20); EP.save(); EP.sfx.win(); ui.confetti && ui.confetti();
      box.innerHTML = '';
      add(box, el('h2', {}, '✅ Sent! 已送給老師'),
        el('p', { class: 'zh' }, `你唸的 ${m.marks.filter((x) => !x.skipped).length} 個單字已經合成一個完整的錄音檔（${fmtTime(m.dur)}）。老師聽完會給你回饋，回饋會出現在首頁。 +15 🪙 +20 XP`),
        el('audio', { controls: true, src: URL.createObjectURL(m.blob), style: { width: '100%' } }),
        el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } },
          el('button', { class: 'btn go', onclick: () => ui.show('home') }, '🏠 Home 首頁'),
          el('button', { class: 'btn', onclick: () => ui.show('myvoice') }, '📬 My recordings 我的錄音')));
    }
  };

  /* =====================================================================
     STUDENT: my recordings + the teacher's feedback
     ===================================================================== */
  ui.screens.myvoice = function () {
    const s = el('div', { class: 'screen vb' }); s.appendChild(ui.topbar('📬 My recordings 我的錄音'));
    const holder = el('div', { class: 'panel' }, el('p', { class: 'muted' }, 'Loading…'));
    s.appendChild(holder);
    VB.list().then((all) => {
      const mine = all.filter((t) => t.profileId === EP.me.id);
      holder.innerHTML = '';
      holder.appendChild(el('p', { class: 'zh' }, '這裡是你唸給老師聽的錄音。老師給回饋後會顯示星星，點開可以看老師的話、聽老師的語音，練習老師標出來的字。'));
      if (!mine.length) { holder.appendChild(el('p', { class: 'zh muted' }, '還沒有錄音。到「World Tour 環遊世界」選一關，按「🎤 唸給老師聽」。')); return; }
      mine.forEach((t) => {
        const L = EP.levels[t.level - 1], fb = t.feedback;
        holder.appendChild(el('button', { class: 'vb-row', onclick: () => ui.openFeedback(t) },
          el('span', { class: 'vb-big' }, L.icon),
          el('span', { class: 'grow' }, el('b', {}, `Level ${t.level} · ${L.city}`), el('br'), el('small', { class: 'muted' }, `${fmtDate(t.ts)} · ${t.words.filter((x) => !x.skipped).length} 個單字 · ${fmtTime(t.dur)}`)),
          fb ? el('span', { class: 'vb-stars' }, stars(fb.stars), fb.seen ? null : el('span', { class: 'vb-new' }, 'NEW')) : el('span', { class: 'muted zh' }, '⏳ 等老師聽')));
      });
    });
    return s;
  };
  /** the student opens one take: own recording + teacher feedback; marks it as read */
  ui.openFeedback = function (t) {
    const fb = t.feedback, L = EP.levels[t.level - 1];
    const redo = fb && fb.redo ? fb.redo.map((id) => EP.byId[id]).filter(Boolean) : [];
    const c = el('div', {},
      el('h2', {}, `${L.icon} Level ${t.level} · ${L.city}`), el('div', { class: 'muted' }, fmtDate(t.ts)),
      el('h3', { class: 'zh' }, '🎧 我的錄音'), el('audio', { controls: true, src: URL.createObjectURL(t.wav), style: { width: '100%' } }),
      fb ? el('div', { class: 'vb-fb' },
        el('h3', { class: 'zh' }, '👩‍🏫 老師的回饋 ', el('span', { class: 'vb-stars' }, stars(fb.stars))),
        fb.chips && fb.chips.length ? el('div', { class: 'vb-chips' }, fb.chips.map((x) => el('span', { class: 'vb-chip done' }, x))) : null,
        fb.text ? el('p', { class: 'vb-note zh' }, fb.text) : null,
        fb.voice ? el('div', {}, el('b', { class: 'zh' }, '🎙️ 老師的語音：'), el('audio', { controls: true, src: URL.createObjectURL(fb.voice), style: { width: '100%' } })) : null,
        redo.length ? el('div', {}, el('b', { class: 'zh' }, '🔁 老師說這些字要再練習：'),
          el('div', { class: 'vb-chips' }, redo.map((w) => el('button', { class: 'vb-chip skip', onclick: () => EP.audio.play(w) }, '🔊 ', w.word, ' ', el('small', { class: 'zh' }, w.zh)))),
          el('button', { class: 'btn go', onclick: () => { m.close(); ui.show('learn', { level: t.level, words: redo }); } }, '📖 Practise these 練習這些字')) : null)
        : el('p', { class: 'zh muted' }, '⏳ 老師還沒聽，聽完會給你回饋。'),
      el('div', { class: 'row', style: { marginTop: '12px' } }, el('button', { class: 'btn', onclick: () => { m.close(); ui.show('speak', { level: t.level }); } }, '🎤 再錄一次這一關')));
    const m = ui.modal(c, { wide: true, onClose: () => { if (ui.current === 'myvoice') ui.show('myvoice'); } });
    if (fb && !fb.seen) { fb.seen = true; fb.seenAt = new Date().toISOString(); VB.put(t); }
  };
  /** home screen: a button to my recordings and a banner when the teacher has replied */
  ui.voiceHome = function () {
    const btn = el('button', { class: 'btn big', onclick: () => ui.show('myvoice') }, '📬 My recordings 我的錄音');
    const banner = el('div', { class: 'hidden' });
    VB.list().then(() => {
      const n = VB.unseen(EP.me.id).length; if (!n) return;
      btn.appendChild(el('span', { class: 'vb-new' }, String(n)));
      banner.className = 'vb-banner';
      add(banner, el('span', { class: 'vb-big' }, '📬'), el('div', { class: 'grow' }, el('b', {}, 'Your teacher replied! '), el('span', { class: 'zh' }, `老師給你回饋了（${n}）`)),
        el('button', { class: 'btn go', onclick: () => ui.show('myvoice') }, '看回饋 ➜'));
    });
    return { btn, banner };
  };

  /* =====================================================================
     TEACHER: listen as often as needed + give feedback
     ===================================================================== */
  const QUICK = ['🌟 Great job! 唸得很好', '🗣️ Clear voice 發音很清楚', '💪 Big progress 進步很多', '📢 Louder please 再大聲一點',
    '🐢 Slow down 慢慢唸', '🔚 Ending sounds 注意字尾的音', '🎵 Listen & repeat 多聽示範再練'];
  ui.teacherTabs.voices = function () {
    let filter = 'todo', who = 'all';
    const list = el('div', { class: 'panel scroll' }, el('p', { class: 'muted' }, 'Loading…'));
    const whoSel = el('select', { 'aria-label': '選擇學生', onchange: (e) => { who = e.target.value; render(); } }, el('option', { value: 'all' }, '全部學生'), EP.profiles.map((p) => el('option', { value: p.id }, p.name)));
    const fSel = el('select', { 'aria-label': '篩選', onchange: (e) => { filter = e.target.value; render(); } }, [['todo', '待回饋'], ['all', '全部錄音'], ['done', '已回饋']].map(([v, t]) => el('option', { value: v }, t)));
    function render() {
      VB.list().then((all) => {
        const rows = all.filter((t) => (who === 'all' || t.profileId === who) && (filter === 'all' || (filter === 'todo' ? !t.feedback : !!t.feedback)));
        list.innerHTML = '';
        const todo = all.filter((t) => !t.feedback).length;
        list.appendChild(el('p', { class: 'zh' }, `共 ${all.length} 份錄音，待回饋 ${todo} 份。`));
        if (!rows.length) { list.appendChild(el('p', { class: 'zh muted' }, all.length ? '這個篩選沒有錄音。' : '還沒有學生錄音。學生在關卡卡片按「🎤 唸給老師聽」，唸完送出後就會出現在這裡（錄音存在錄音的那台裝置）。')); return; }
        const tb = el('tbody');
        rows.forEach((t) => {
          const L = EP.levels[t.level - 1], fb = t.feedback;
          tb.appendChild(el('tr', {},
            el('td', {}, t.avatar || '', ' ', el('b', {}, t.name)),
            el('td', {}, `${L.icon} L${t.level}`),
            el('td', {}, fmtDate(t.ts)),
            el('td', {}, `${t.words.filter((x) => !x.skipped).length} 字 · ${fmtTime(t.dur)}`),
            el('td', {}, fb ? el('span', {}, stars(fb.stars), fb.seen ? el('small', { class: 'muted zh' }, ' 學生已讀') : el('small', { class: 'muted zh' }, ' 學生未讀')) : el('span', { class: 'chip light zh' }, '待回饋')),
            el('td', {}, el('button', { class: 'btn small ' + (fb ? '' : 'go'), onclick: () => ui.reviewTake(t, render) }, fb ? '🎧 聽／改回饋' : '🎧 聽／回饋'))));
        });
        list.appendChild(el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['學生', '關卡', '時間', '內容', '回饋', ''].map((h) => el('th', {}, h)))), tb));
      });
    }
    render();
    return el('div', {},
      el('div', { class: 'panel', style: { marginBottom: '12px' } }, el('h3', {}, '🎧 Student voices 學生錄音與回饋'),
        el('p', { class: 'zh' }, '學生在關卡卡片按「🎤 唸給老師聽」，每個人唸的單字會合成「一個完整的錄音檔」存在這台裝置。按「聽／回饋」可以反覆聽：循環播放、放慢、點單字直接跳過去聽，也可以下載整個檔案（WAV）。聽完給星星、勾選評語、標出要再練習的字、寫幾句話或錄一段語音，學生下次打開首頁就會看到。'),
        el('div', { class: 'row' }, fSel, whoSel, el('button', { class: 'btn', onclick: exportCSV }, '📄 匯出回饋清單 CSV'))),
      list);
  };
  async function exportCSV() {
    const all = await VB.list();
    const q = (v) => { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const head = ['學生', '關卡', '錄音時間', '長度(秒)', '唸了幾個字', '跳過', '星等', '評語', '老師的話', '要再練習的字', '老師語音', '回饋時間', '學生已讀'];
    const lines = all.map((t) => { const fb = t.feedback || {}; return [t.name, `Level ${t.level}`, t.ts, t.dur, t.words.filter((x) => !x.skipped).length, t.words.filter((x) => x.skipped).map((x) => x.w).join(' '),
      fb.stars || '', (fb.chips || []).join('；'), fb.text || '', (fb.redo || []).map((id) => (EP.byId[id] || {}).word).join(' '), fb.voice ? '有' : '', fb.ts || '', t.feedback ? (fb.seen ? '是' : '否') : ''].map(q).join(','); });
    ui.download(`英語護照_學生錄音回饋_${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [head.map(q).join(','), ...lines].join('\r\n'), 'text/csv');
  }
  /** teacher review: one complete file, played as often as needed, then feedback */
  ui.reviewTake = function (t, onSaved) {
    const L = EP.levels[t.level - 1], fb0 = t.feedback || {};
    const url = URL.createObjectURL(t.wav);
    const audio = el('audio', { controls: true, src: url, preload: 'auto', class: 'vb-audio' });
    let seg = null, loopOn = false;
    const loopBtn = el('button', { class: 'btn small', 'aria-pressed': 'false', onclick: () => { loopOn = !loopOn; loopBtn.setAttribute('aria-pressed', String(loopOn)); loopBtn.classList.toggle('primary', loopOn); audio.loop = loopOn && !seg; } }, '🔁 循環播放');
    const speed = el('select', { 'aria-label': '播放速度', onchange: (e) => { audio.playbackRate = +e.target.value; } }, [['0.75', '0.75× 放慢'], ['1', '1× 正常'], ['1.25', '1.25×']].map(([v, t2]) => el('option', { value: v, selected: v === '1' }, t2)));
    const whole = el('button', { class: 'btn small', onclick: () => { seg = null; marks(); audio.loop = loopOn; audio.currentTime = 0; audio.play(); } }, '▶ 從頭聽完整檔案');
    const back5 = el('button', { class: 'btn small', onclick: () => { audio.currentTime = Math.max(0, audio.currentTime - 5); } }, '⏪ 5 秒');
    const fileName = `英語護照_${t.name}_Level${t.level}_${t.ts.slice(0, 10)}.wav`.replace(/[\\/:*?"<>|]/g, '');
    const dl = el('button', { class: 'btn small', onclick: async () => { const ok = await ui.downloadBlob(fileName, t.wav); if (!ok) ui.toast('這個網址不能下載 WAV，請用下載版', '⚠️'); } }, '⬇ 下載完整音檔');
    const redo = new Set(fb0.redo || []);
    const chipRow = el('div', { class: 'vb-chips vb-words' });
    function marks() {
      chipRow.innerHTML = '';
      t.words.forEach((m, k) => {
        if (m.skipped) { chipRow.appendChild(el('span', { class: 'vb-chip skip' }, `${k + 1}. ${m.w} ⏭ 跳過`)); return; }
        const on = redo.has(m.id);
        chipRow.appendChild(el('span', { class: 'vb-wordchip' + (seg === m ? ' sel' : '') + (on ? ' redo' : ''), 'data-k': k },
          el('button', { class: 'vb-play', title: '只聽這個字', onclick: () => { seg = m; audio.loop = false; marks(); audio.currentTime = m.start; audio.play(); } }, `▶ ${k + 1}. ${m.w}`, el('small', {}, ' ' + fmtTime(m.start))),
          el('button', { class: 'vb-mark', 'aria-pressed': String(on), title: '標成要再練習', onclick: () => { on ? redo.delete(m.id) : redo.add(m.id); marks(); } }, on ? '🔁 要再練' : '✓')));
      });
    }
    marks();
    audio.addEventListener('timeupdate', () => {
      const ct = audio.currentTime;
      if (seg && ct >= seg.end + 0.15) { if (loopOn) { audio.currentTime = seg.start; } else { audio.pause(); } }
      chipRow.querySelectorAll('.vb-wordchip').forEach((c) => { const m = t.words[+c.dataset.k]; c.classList.toggle('now', !audio.paused && ct >= m.start - 0.05 && ct <= m.end + 0.2); });
    });
    // feedback form
    let st = fb0.stars || 0;
    const starBox = el('div', { class: 'vb-starpick', role: 'radiogroup', 'aria-label': '星等' });
    const drawStars = () => { starBox.innerHTML = ''; [1, 2, 3].forEach((k) => starBox.appendChild(el('button', { role: 'radio', 'aria-checked': String(st === k), 'aria-label': k + ' 顆星', class: k <= st ? 'on' : '', onclick: () => { st = k; drawStars(); } }, k <= st ? '⭐' : '☆'))); };
    drawStars();
    const chips = new Set(fb0.chips || []);
    const quick = el('div', { class: 'vb-chips' }, QUICK.map((q) => { const b = el('button', { class: 'vb-chip' + (chips.has(q) ? ' done' : ''), 'aria-pressed': String(chips.has(q)), onclick: () => { chips.has(q) ? chips.delete(q) : chips.add(q); b.classList.toggle('done', chips.has(q)); b.setAttribute('aria-pressed', String(chips.has(q))); } }, q); return b; }));
    const note = el('textarea', { rows: 3, class: 'vb-text', 'aria-label': '給學生的話', placeholder: '給學生的話（例：dog 的 g 要唸出來，下次再大聲一點！）' }); note.value = fb0.text || '';
    // optional teacher voice message
    let voice = fb0.voice || null, vRec = false, vTimer = 0;
    const vBox = el('div', { class: 'row' });
    const drawVoice = () => {
      vBox.innerHTML = '';
      const recB = el('button', { class: 'btn small red', onclick: async () => {
        if (vRec) return stopV();
        try { await VB.micOpen(); } catch (e) { ui.toast(micError(e), '⚠️'); return; }
        audio.pause(); VB.recStart(); vRec = true; recB.textContent = '⏹ 錄好了'; vTimer = setTimeout(stopV, MSG_SEC * 1000);
      } }, voice ? '🎙️ 重錄語音' : '🎙️ 錄一段話給學生');
      function stopV() { if (!vRec) return; vRec = false; clearTimeout(vTimer); const pcm = VB.recStop(); VB.micClose(); if (pcm) voice = VB.wav(pcm); else ui.toast('沒有錄到聲音', '🎙️'); drawVoice(); }
      add(vBox, recB, voice ? el('audio', { controls: true, src: URL.createObjectURL(voice), style: { height: '36px' } }) : null,
        voice ? el('button', { class: 'btn small', onclick: () => { voice = null; drawVoice(); } }, '🗑 刪除語音') : null,
        el('small', { class: 'muted zh' }, `最長 ${MSG_SEC} 秒`));
    };
    drawVoice();
    const save = el('button', { class: 'btn go big', onclick: async () => {
      if (vRec) return ui.toast('請先按「⏹ 錄好了」', '🎙️');
      if (!st && !chips.size && !note.value.trim() && !voice && !redo.size) return ui.toast('請至少給星星或寫一句話', '⭐');
      t.feedback = { stars: st, chips: [...chips], text: note.value.trim(), redo: [...redo], voice, ts: new Date().toISOString(), seen: false };
      const ok = await VB.put(t);
      if (!ok) return ui.toast('儲存失敗', '⚠️');
      EP.sfx.coin(); ui.toast(`已送出回饋給 ${t.name}`, '✅'); m.close(); onSaved && onSaved();
    } }, '💾 Send feedback 送出回饋');
    const del = el('button', { class: 'btn small', onclick: () => ui.confirm(`刪除 ${t.name} 的這份錄音？刪除後不能復原。`, '🗑 刪除', async () => { await VB.del(t.id); m.close(); onSaved && onSaved(); }) }, '🗑 刪除這份錄音');
    const c = el('div', { class: 'vb-review' },
      el('h2', {}, `${t.avatar || ''} ${t.name} · ${L.icon} Level ${t.level} ${L.city}`),
      el('div', { class: 'muted' }, `${fmtDate(t.ts)} · 完整錄音 ${fmtTime(t.dur)} · ${t.words.filter((x) => !x.skipped).length} 個單字`),
      audio,
      el('div', { class: 'row' }, whole, loopBtn, back5, speed, dl),
      el('h3', { class: 'zh' }, '單字（點 ▶ 只聽這個字；點 ✓ 標成「要再練」）'), chipRow,
      el('h3', { class: 'zh' }, '給回饋'), starBox, quick, note, vBox,
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '12px' } }, save, del));
    const m = ui.modal(c, { wide: true, onClose: () => { audio.pause(); VB.micClose(); } });
  };
})();
