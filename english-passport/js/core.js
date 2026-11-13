/* English Passport World Tour — core engine
 * Storage, profiles, progression, spaced repetition (Leitner), audio (real human first),
 * text-to-speech fallback, synthesized sound effects, speech recognition, game registry.
 * Classic script (no modules) so the game also runs from a double-clicked file. */
(function () {
  'use strict';
  const EP = (window.EP = window.EP || {});
  EP.version = '1.0.0';
  /** true inside the claude.ai hosted viewer: its content policy only allows audio bundled with the page */
  EP.hosted = !!(window.claude && typeof window.claude.use === 'function');

  /* ---------------- utilities ---------------- */
  const u = (EP.u = {
    $: (s, r) => (r || document).querySelector(s),
    $$: (s, r) => Array.from((r || document).querySelectorAll(s)),
    el(tag, attrs, ...kids) {
      const n = document.createElement(tag);
      if (attrs) for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
        else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else if (k === 'html') n.innerHTML = v;
        else n.setAttribute(k, v === true ? '' : v);
      }
      for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
      return n;
    },
    esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; },
    pick: (a) => a[(Math.random() * a.length) | 0],
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => a + ((Math.random() * (b - a + 1)) | 0),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    dayDiff(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); },
    uid: () => Math.random().toString(36).slice(2, 10),
    norm: (s) => String(s).toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ').trim(),
  });

  /* ---------------- storage (never throws) ---------------- */
  const PREFIX = 'epwt1:';
  EP.store = {
    get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} },
  };

  /* ---------------- data ---------------- */
  const D = window.EP_DATA;
  EP.levels = D.levels;
  EP.words = D.words;
  EP.byId = {};
  for (const w of EP.words) EP.byId[w.id] = w;
  EP.levelWords = (lv) => EP.words.filter((w) => w.level === lv);
  EP.isPhrase = (w) => /\s/.test(w.word.trim()) || /[.!?]$/.test(w.word);
  /** Picture for an item: emoji, or digits for numbers, or '' */
  EP.pic = function (w) {
    if (w.emoji) return w.emoji;
    if (w.level === 7 && /^\d+$/.test(w.zh)) return w.zh;
    return '';
  };
  /** Clean display text of the word (keeps the passport spelling) */
  EP.text = (w) => w.word;
  /** The word as it is typed/spelled in spelling games: letters only, lower case for common nouns */
  EP.spellKey = (w) => w.word.replace(/[^A-Za-z' -]/g, '').trim();

  /** Distractors: same level first, prefer same part of speech, never same text/meaning */
  EP.distractors = function (item, n, opts) {
    opts = opts || {};
    const pool = opts.pool || EP.levelWords(item.level);
    const bad = new Set([u.norm(item.word), item.zh]);
    const ok = (w) => w.id !== item.id && !bad.has(u.norm(w.word)) && w.zh !== item.zh && (!opts.needPic || EP.pic(w));
    const posKey = (w) => (w.pos || '').split(' ').pop();
    let same = u.shuffle(pool.filter((w) => ok(w) && posKey(w) === posKey(item)));
    let other = u.shuffle(pool.filter((w) => ok(w) && posKey(w) !== posKey(item)));
    let res = same.concat(other);
    if (res.length < n) res = res.concat(u.shuffle(EP.words.filter((w) => ok(w) && !res.includes(w) && (!opts.needPic || EP.pic(w)))));
    // avoid duplicates of the same text among distractors
    const seen = new Set(); const out = [];
    for (const w of res) { const k = u.norm(w.word); if (!seen.has(k)) { seen.add(k); out.push(w); } if (out.length >= n) break; }
    return out;
  };

  /** Find the headword (or its inflected form) inside the example sentence, for cloze games */
  EP.cloze = function (w) {
    if (w._cloze !== undefined) return w._cloze;
    const s = w.sentence; const base = w.word.replace(/[.!?]+$/, '').replace('...', '').trim();
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const irregular = { have: ['has', 'have'], do: ['does', 'do'], are: ['are'], is: ['is'], am: ['am'], going: ['going'], thought: ['thought'], fly: ['fly', 'flies'], cry: ['cries', 'cry'], try: ['try', 'tries'], study: ['study', 'studies'] };
    const forms = irregular[base.toLowerCase()] || [base, base + 's', base + 'es', base + 'ed', base + 'd', base + 'ing', base.replace(/e$/, '') + 'ing', base.replace(/y$/, 'ies')];
    let found = null;
    for (const f of forms.sort((a, b) => b.length - a.length)) {
      const m = s.match(new RegExp('(^|[^A-Za-z\\-])(' + esc(f) + ')(?=[^A-Za-z\\-]|$)', 'i'));
      if (m) { found = { start: m.index + m[1].length, text: m[2] }; break; }
    }
    w._cloze = found;
    return found;
  };

  /* ---------------- profiles & progression ---------------- */
  const AVATARS_FREE = ['🐼', '🐯', '🐶', '🐱', '🐰', '🦊', '🐸', '🐵', '🐧', '🦁', '🐨', '🐹'];
  EP.AVATARS_FREE = AVATARS_FREE;
  function newProfile(name, avatar) {
    return { id: u.uid(), name: name || 'Player', avatar: avatar || u.pick(AVATARS_FREE), created: Date.now(),
      xp: 0, coins: 0, streak: { count: 0, last: null, best: 0 }, owned: [], equip: { hat: '', trail: '', frame: '' },
      levels: {}, words: {}, daily: { date: null, quests: [] }, history: [], stickers: [] };
  }
  EP.profiles = EP.store.get('profiles', []);
  EP.settings = Object.assign({ unlockAll: false, difficulty: 'normal', speed: 1, roundSize: 12, music: true, sfx: true,
    voiceRate: 0.9, ttsVoice: '', showChinese: true, teacherPin: '0000', speakChecks: true, lang: 'zh' }, EP.store.get('settings', {}));
  EP.saveSettings = () => EP.store.set('settings', EP.settings);
  EP.me = null;
  EP.useProfile = function (id) { EP.me = EP.profiles.find((p) => p.id === id) || null; EP.store.set('current', id); if (EP.me) EP.touchStreak(); return EP.me; };
  EP.addProfile = function (name, avatar) { const p = newProfile(name, avatar); EP.profiles.push(p); EP.save(); return p; };
  EP.removeProfile = function (id) { EP.profiles = EP.profiles.filter((p) => p.id !== id); EP.save(); };
  EP.save = () => EP.store.set('profiles', EP.profiles);

  EP.levelOf = (xp) => { let lv = 1, need = 100, x = xp; while (x >= need) { x -= need; lv++; need = Math.round(need * 1.18); } return { lv, into: x, need }; };
  EP.touchStreak = function () {
    const p = EP.me; const t = u.today();
    if (p.streak.last === t) return;
    // streak counts days with at least one finished game; shown as "alive" if yesterday played
  };
  EP.markPlayedToday = function () {
    const p = EP.me; const t = u.today(); const s = p.streak;
    if (s.last === t) return false;
    s.count = s.last && u.dayDiff(s.last, t) === 1 ? s.count + 1 : 1;
    s.best = Math.max(s.best || 0, s.count); s.last = t; return true;
  };
  if (!EP.profiles.length) EP.addProfile('Guest 訪客', '🐼');
  EP.useProfile(EP.store.get('current', EP.profiles[0].id)) || EP.useProfile(EP.profiles[0].id);
  EP.addXP = function (n) { const before = EP.levelOf(EP.me.xp).lv; EP.me.xp += n; const after = EP.levelOf(EP.me.xp).lv; return after > before ? after : 0; };
  EP.addCoins = (n) => { EP.me.coins = Math.max(0, EP.me.coins + n); };

  /* ---------------- spaced repetition (Leitner boxes 0..5) ---------------- */
  EP.srs = {
    get(id) { return EP.me.words[id] || (EP.me.words[id] = { b: 0, r: 0, w: 0, t: 0 }); },
    record(id, ok) {
      const s = this.get(id); s.t = Date.now();
      if (ok) { s.r++; s.b = Math.min(5, s.b + 1); } else { s.w++; s.b = Math.max(0, Math.min(s.b - 1, 1)); }
      return s.b;
    },
    mastery(id) { const s = EP.me.words[id]; return s ? s.b : -1; }, // -1 never seen
    /** weighted pick: unseen and weak words first, plus a little randomness */
    pick(pool, n) {
      const scored = pool.map((w) => { const s = EP.me.words[w.id]; const b = s ? s.b : -0.5; const age = s ? (Date.now() - s.t) / 864e5 : 9; return { w, k: b * 2 - Math.min(age, 7) * 0.3 + Math.random() * 2.2 }; });
      scored.sort((a, b) => a.k - b.k);
      return u.shuffle(scored.slice(0, Math.min(n, pool.length)).map((x) => x.w));
    },
    due(limit) { // review queue across all levels: wrong or low box words seen before
      const list = Object.entries(EP.me.words).filter(([, s]) => s.b <= 2 && (s.w > 0 || s.b < 2)).map(([id, s]) => ({ w: EP.byId[id], s }));
      list.sort((a, b) => a.s.b - b.s.b || b.s.w - a.s.w);
      return list.slice(0, limit || 30).map((x) => x.w).filter(Boolean);
    },
    levelMastery(lv) { const ws = EP.levelWords(lv); const m = ws.filter((w) => EP.srs.mastery(w.id) >= 4).length; return { mastered: m, total: ws.length }; },
  };

  /* ---------------- daily quests (Duolingo/Fortnite style, no pressure) ---------------- */
  const QUESTS = [
    { id: 'play2', zh: '完成 2 個關卡遊戲', en: 'Finish 2 games', goal: 2, key: 'games', coins: 30 },
    { id: 'right30', zh: '答對 30 題', en: 'Get 30 answers right', goal: 30, key: 'right', coins: 30 },
    { id: 'combo8', zh: '連續答對 8 題', en: 'Make an 8 combo', goal: 8, key: 'combo', coins: 25 },
    { id: 'learn10', zh: '在學習卡聽 10 個單字', en: 'Listen to 10 words on cards', goal: 10, key: 'listen', coins: 20 },
    { id: 'speak5', zh: '開口說對 5 個單字', en: 'Say 5 words correctly', goal: 5, key: 'speak', coins: 35 },
    { id: 'review10', zh: '複習 10 個錯過的單字', en: 'Review 10 missed words', goal: 10, key: 'review', coins: 30 },
    { id: 'star3', zh: '拿到一次三顆星', en: 'Earn 3 stars once', goal: 1, key: 'star3', coins: 40 },
  ];
  EP.QUESTS = QUESTS;
  EP.daily = function () {
    const p = EP.me; const t = u.today();
    if (p.daily.date !== t) {
      const picks = u.shuffle(QUESTS).slice(0, 3);
      p.daily = { date: t, quests: picks.map((q) => ({ id: q.id, n: 0, done: false, claimed: false })) };
      EP.save();
    }
    return p.daily.quests.map((q) => Object.assign({}, QUESTS.find((x) => x.id === q.id), q));
  };
  EP.questEvent = function (key, amount, isMax) {
    if (!EP.me) return;
    EP.daily();
    for (const q of EP.me.daily.quests) {
      const def = QUESTS.find((x) => x.id === q.id); if (!def || def.key !== key || q.done) continue;
      q.n = isMax ? Math.max(q.n, amount) : q.n + amount;
      if (q.n >= def.goal) { q.n = def.goal; q.done = true; EP.emit('quest', def); }
    }
  };

  /* ---------------- tiny event bus ---------------- */
  const handlers = {};
  EP.on = (e, f) => (handlers[e] = handlers[e] || []).push(f);
  EP.emit = (e, d) => (handlers[e] || []).forEach((f) => { try { f(d); } catch (err) { console.error(err); } });

  /* ---------------- audio: real human recordings first ---------------- */
  const audio = (EP.audio = {
    packs: {},         // level -> loaded
    clips: {},         // id -> data URL (human, Commons)
    teacher: {},       // key -> blob URL (teacher recordings from IndexedDB)
    current: null,
    manifest: D.audio || {},   // id -> {s:'human'|'tts', a: accent, by: author, lic}
  });
  window.EP_AUDIO_PACK = function (level, map) { Object.assign(audio.clips, map); audio.packs[level] = true; const cb = audio._wait[level]; if (cb) cb.forEach((f) => f()); delete audio._wait[level]; };
  audio._wait = {};
  audio.ensureLevel = function (lv) {
    if (audio.packs[lv]) return Promise.resolve();
    return new Promise((res) => {
      (audio._wait[lv] = audio._wait[lv] || []).push(res);
      if (audio._wait[lv].length > 1) return;
      const s = document.createElement('script');
      s.src = 'audio/pack_' + String(lv).padStart(2, '0') + '.js';
      s.onerror = () => { audio.packs[lv] = 'missing'; res(); };
      document.head.appendChild(s);
      setTimeout(res, 8000); // never block the game on a slow network
    });
  };
  audio.ensureAll = () => Promise.all(EP.levels.map((l) => audio.ensureLevel(l.level)));
  /** where the voice for this item comes from: 'teacher' | 'human' | 'tts' */
  audio.source = function (w, kind) {
    const key = (kind === 'sentence' ? 's' : 'w') + w.id;
    if (audio.teacher[key]) return 'teacher';
    // 'human' only when a real recording will actually play here: built in, saved on this device,
    // or streamable (not in the hosted viewer, whose content policy blocks Wikimedia)
    if (kind !== 'sentence' && (audio.clips[w.id] || audio.offline[w.id] || (audio.manifest[w.id] && !EP.hosted && !audio.failed[w.id]))) return 'human';
    return 'tts';
  };
  audio.stop = function () { try { if (audio.current) { audio.current.pause(); audio.current = null; } window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} };
  audio.failed = {};      // ids whose stream failed this session (offline / blocked) -> go straight to TTS
  audio.offline = {};     // id -> blob URL from the offline cache (IndexedDB)
  audio.preloaded = {};   // id -> HTMLAudioElement warmed up for the current round
  function urlFor(w) {
    if (audio.clips[w.id]) return audio.clips[w.id];
    if (audio.offline[w.id]) return audio.offline[w.id];
    const m = audio.manifest[w.id];
    if (m && m.u && !audio.failed[w.id] && !EP.hosted) return m.u;
    return null;
  }
  /** warm up the recordings of a round so the first play is instant */
  audio.preload = function (items) {
    for (const w of items || []) {
      if (audio.preloaded[w.id] || audio.clips[w.id] || audio.offline[w.id]) continue;
      const src = urlFor(w); if (!src) continue;
      try { const a = new Audio(); a.preload = 'auto'; a.src = src; a.onerror = () => { audio.failed[w.id] = true; delete audio.preloaded[w.id]; }; audio.preloaded[w.id] = a; } catch (e) {}
    }
  };
  function playSrc(src, w, opts) {
    return new Promise((res) => {
      let settled = false; const done = (ok) => { if (!settled) { settled = true; res(ok); } };
      try {
        const pre = w && audio.preloaded[w.id];
        const a = pre && pre.src === src ? pre : new Audio(src);
        if (pre) { try { a.currentTime = 0; } catch (e) {} }
        audio.current = a; a.playbackRate = opts.slow ? 0.75 : 1; a.preservesPitch = true;
        a.onended = () => done(true);
        a.onerror = () => done(false);
        const p = a.play(); if (p && p.catch) p.catch(() => done(false));
        // if nothing has started after 2.5 s (slow or blocked network), give up and fall back
        setTimeout(() => { if (a.paused && a.currentTime === 0) { try { a.pause(); } catch (e) {} done(false); } }, 2500);
        setTimeout(() => done(true), 7000);
      } catch (e) { done(false); }
    });
  }
  /** Play the word (or its sentence). Order: teacher recording > bundled/offline/streamed real human > speech synthesis. */
  audio.play = async function (w, opts) {
    opts = opts || {}; const kind = opts.sentence ? 'sentence' : 'word';
    audio.stop();
    if (kind === 'word' && !audio.packs[w.level]) await audio.ensureLevel(w.level);
    const key = (kind === 'sentence' ? 's' : 'w') + w.id;
    if (audio.teacher[key] && await playSrc(audio.teacher[key], null, opts)) return 'teacher';
    if (kind === 'word') {
      const src = urlFor(w);
      if (src) {
        const ok = await playSrc(src, w, opts);
        if (ok) return 'human';
        if (src === (audio.manifest[w.id] || {}).u) audio.failed[w.id] = true;
      }
    }
    await EP.tts.say(kind === 'sentence' ? w.sentence : w.word.replace('...', ''), { slow: opts.slow });
    return 'tts';
  };
  /** Download every real human recording into this device (IndexedDB) for offline classrooms. */
  audio.cacheAll = async function (onProgress) {
    const ids = Object.keys(audio.manifest).filter((id) => !audio.clips[id]);
    let done = 0, ok = 0, fail = 0; const db = await EP.rec.open();
    const queue = ids.slice();
    async function worker() {
      while (queue.length) {
        const id = queue.shift(); const m = audio.manifest[id];
        try {
          if (!audio.offline[id]) {
            const r = await fetch(m.u, { mode: 'cors' }); if (!r.ok) throw new Error(r.status);
            const blob = await r.blob();
            if (db) await new Promise((res) => { const tx = db.transaction('human', 'readwrite'); tx.objectStore('human').put({ blob, at: new Date().toISOString(), f: m.f }, id); tx.oncomplete = res; tx.onerror = res; });
            audio.offline[id] = URL.createObjectURL(blob);
          }
          ok++;
        } catch (e) { fail++; }
        done++; onProgress && onProgress(done, ids.length, ok, fail);
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    EP.store.set('offlineAudioAt', new Date().toISOString());
    return { ok, fail, total: ids.length };
  };
  audio.sayText = (t, o) => (audio.stop(), EP.tts.say(t, o));

  /* ---------------- text-to-speech fallback (clearly marked in the UI) ---------------- */
  EP.tts = {
    voices: [],
    load() { try { this.voices = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang)); } catch (e) { this.voices = []; } },
    best() {
      const want = EP.settings.ttsVoice; const vs = this.voices;
      if (want) { const v = vs.find((x) => x.name === want); if (v) return v; }
      const score = (v) => (/en[-_]US/i.test(v.lang) ? 10 : 0) + (/natural|neural|enhanced|premium|samantha|aria|jenny|google us/i.test(v.name) ? 5 : 0) + (v.localService ? 1 : 0);
      return vs.slice().sort((a, b) => score(b) - score(a))[0] || null;
    },
    say(text, o) {
      o = o || {};
      return new Promise((res) => {
        try {
          if (!window.speechSynthesis) return res();
          const ut = new SpeechSynthesisUtterance(text);
          const v = this.best(); if (v) ut.voice = v; ut.lang = v ? v.lang : 'en-US';
          ut.rate = (o.slow ? 0.7 : 1) * (EP.settings.voiceRate || 0.9); ut.pitch = 1;
          ut.onend = res; ut.onerror = res; speechSynthesis.speak(ut);
          setTimeout(res, 2500 + text.length * 120);
        } catch (e) { res(); }
      });
    },
  };
  try { EP.tts.load(); speechSynthesis.onvoiceschanged = () => EP.tts.load(); } catch (e) {}

  /* ---------------- teacher recordings (IndexedDB) ---------------- */
  EP.rec = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res) => {
        try {
          const r = indexedDB.open('epwt-recordings', 2);
          r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('rec')) db.createObjectStore('rec'); if (!db.objectStoreNames.contains('human')) db.createObjectStore('human'); };
          r.onsuccess = () => { this.db = r.result; res(this.db); };
          r.onerror = () => res(null);
        } catch (e) { res(null); }
      });
    },
    async loadAll() {
      const db = await this.open(); if (!db) return;
      await new Promise((res) => {
        try {
          const tx = db.transaction('rec', 'readonly'); const st = tx.objectStore('rec'); const req = st.openCursor();
          req.onsuccess = () => { const c = req.result; if (c) { audio.teacher[c.key] = URL.createObjectURL(c.value.blob); c.continue(); } else res(); };
          req.onerror = () => res();
        } catch (e) { res(); }
      });
      await new Promise((res) => {
        try {
          const req = db.transaction('human', 'readonly').objectStore('human').openCursor();
          req.onsuccess = () => { const c = req.result; if (c) { audio.offline[c.key] = URL.createObjectURL(c.value.blob); c.continue(); } else res(); };
          req.onerror = () => res();
        } catch (e) { res(); }
      });
    },
    async put(key, blob, meta) {
      const db = await this.open(); if (!db) return false;
      return new Promise((res) => {
        const tx = db.transaction('rec', 'readwrite'); tx.objectStore('rec').put(Object.assign({ blob, at: new Date().toISOString() }, meta || {}), key);
        tx.oncomplete = () => { audio.teacher[key] = URL.createObjectURL(blob); res(true); }; tx.onerror = () => res(false);
      });
    },
    async del(key) {
      const db = await this.open(); if (!db) return;
      return new Promise((res) => { const tx = db.transaction('rec', 'readwrite'); tx.objectStore('rec').delete(key); tx.oncomplete = () => { delete audio.teacher[key]; res(); }; tx.onerror = res; });
    },
    async all() {
      const db = await this.open(); if (!db) return [];
      return new Promise((res) => {
        const out = []; const req = db.transaction('rec', 'readonly').objectStore('rec').openCursor();
        req.onsuccess = () => { const c = req.result; if (c) { out.push({ key: c.key, ...c.value }); c.continue(); } else res(out); };
        req.onerror = () => res(out);
      });
    },
  };
  EP.rec.loadAll();

  /* ---------------- sound effects (synthesized, no files) ---------------- */
  let actx = null;
  function ac() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
  function tone(freq, dur, type, vol, when, slideTo) {
    const c = ac(); if (!c || !EP.settings.sfx) return;
    const t = c.currentTime + (when || 0); const o = c.createOscillator(); const g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, when, hp) {
    const c = ac(); if (!c || !EP.settings.sfx) return;
    const t = c.currentTime + (when || 0); const len = Math.floor(c.sampleRate * dur); const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = b; const g = c.createGain(); g.gain.value = vol || 0.15; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  EP.sfx = {
    unlock: ac,
    correct() { tone(660, 0.12, 'triangle', 0.22); tone(990, 0.18, 'triangle', 0.2, 0.09); },
    wrong() { tone(220, 0.25, 'sawtooth', 0.09, 0, 140); },
    pop() { tone(520, 0.08, 'sine', 0.2, 0, 900); },
    coin() { tone(988, 0.07, 'square', 0.08); tone(1319, 0.2, 'square', 0.08, 0.07); },
    click() { tone(800, 0.04, 'square', 0.05); },
    whoosh() { noise(0.25, 0.12, 0, 1200); },
    slice() { noise(0.12, 0.2, 0, 2500); tone(1400, 0.08, 'sine', 0.06, 0, 500); },
    boom() { tone(120, 0.4, 'sine', 0.3, 0, 40); noise(0.3, 0.15, 0, 200); },
    jump() { tone(300, 0.15, 'square', 0.07, 0, 700); },
    tick() { tone(1200, 0.03, 'square', 0.04); },
    combo(n) { const base = 520 + Math.min(n, 12) * 40; tone(base, 0.08, 'triangle', 0.18); tone(base * 1.5, 0.12, 'triangle', 0.16, 0.06); },
    levelUp() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.2, i * 0.1)); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.2, i * 0.12)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.15, i * 0.15)); },
    stamp() { tone(90, 0.25, 'sine', 0.4, 0, 50); noise(0.08, 0.25, 0, 300); },
    chest() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.06, i * 0.06)); },
  };
  document.addEventListener('pointerdown', () => ac(), { once: true });

  /* ---------------- background music (gentle generative loop) ---------------- */
  EP.music = {
    timer: null, step: 0, theme: 0,
    scales: [[0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 4, 5, 7, 9, 11]],
    start(theme) {
      this.stop(); if (!EP.settings.music) return; this.theme = theme || 0; this.step = 0;
      const root = [262, 294, 247, 330][this.theme % 4]; const sc = this.scales[this.theme % 3];
      const pat = [0, 2, 4, 2, 3, 1, 4, 2];
      this.timer = setInterval(() => {
        const c = ac(); if (!c || !EP.settings.music || document.hidden) return;
        const i = this.step++; const deg = pat[i % 8] + (i % 32 >= 16 ? 1 : 0);
        const f = root * Math.pow(2, sc[deg % sc.length] / 12) * (deg >= sc.length ? 2 : 1);
        tone(f, 0.22, 'triangle', 0.035);
        if (i % 4 === 0) tone(root / 2 * Math.pow(2, sc[(i / 4 | 0) % 3 * 2 % sc.length] / 12), 0.5, 'sine', 0.05);
      }, 260);
    },
    stop() { clearInterval(this.timer); this.timer = null; },
  };

  /* ---------------- speech recognition (speaking practice) ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  EP.speech = {
    available: !!SR,
    /** listen once; resolves {ok, heard, alternatives} */
    listen(expected, opts) {
      opts = opts || {};
      return new Promise((res) => {
        if (!SR) return res({ ok: false, heard: '', unsupported: true });
        let done = false; const finish = (r) => { if (!done) { done = true; try { rec.stop(); } catch (e) {} res(r); } };
        const rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 5;
        rec.onresult = (e) => {
          const alts = Array.from(e.results[0]).map((a) => a.transcript);
          const want = u.norm(expected).replace(/[^a-z0-9' ]/g, '');
          const clean = (s) => u.norm(s).replace(/[^a-z0-9' ]/g, '');
          const nums = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20', thirty: '30', forty: '40', fifty: '50', seventy: '70', eighty: '80', hundred: '100', thousand: '1000' };
          const match = alts.some((a) => { const c = clean(a); return c === want || c.split(' ').includes(want) || c.includes(want) || (nums[want] && c.split(' ').includes(nums[want])) || (want.length > 4 && EP.u.lev(c, want) <= 1); });
          finish({ ok: match, heard: alts[0] || '', alternatives: alts });
        };
        rec.onerror = (e) => {
          const blocked = ['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error);
          if (blocked) { EP.speech.available = false; EP.ui && EP.ui.toast && EP.ui.toast('Microphone is not available here. 這裡無法使用麥克風（請用下載版或允許麥克風）', '🎤'); }
          finish({ ok: false, heard: '', error: e.error, unsupported: blocked });
        };
        rec.onend = () => finish({ ok: false, heard: '' });
        try { rec.start(); } catch (e) { finish({ ok: false, heard: '', error: 'start' }); }
        setTimeout(() => finish({ ok: false, heard: '', timeout: true }), opts.timeout || 6000);
      });
    },
  };
  u.lev = function (a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; };

  /* ---------------- game registry ---------------- */
  EP.games = {};
  EP.registerGame = function (def) { EP.games[def.id] = def; };
  EP.gameForLevel = (lv) => Object.values(EP.games).find((g) => g.level === lv);
})();
