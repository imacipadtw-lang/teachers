/* Sentence Listening 句型聽力 — shared kit for the 75 games (25 levels × 3, every core mechanic used once).
 * A game: EP.listen.register({ id: 'L01a', start(ctx) { ... return { test: T.api, destroy } } })
 * Titles, situation (素養情境), skill and how-to come from tools/listen/spec.json (js/listen/spec.js).
 * AUDIO RULE: only the official example sentences (and words) are ever played. Distractors are text/pictures,
 * so a different voice can never give the answer away. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u;
  const SPEC = window.EP_LISTEN_SPEC || [];
  const L = (EP.listen = EP.listen || {});
  L.spec = {}; SPEC.forEach((s) => (L.spec[s.id] = s));
  L.games = {};
  L.levelSpecs = (lv) => SPEC.filter((s) => s.level === lv);

  /* ---------- data helpers for the data-dependent games ---------- */
  const W = (list) => new Set(list.map((x) => x.toLowerCase()));
  const COUNTABLE = W(['one', 'two', 'three', 'four', 'five', 'six', 'eight', 'ten', 'thirteen', 'fourteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']);
  L.NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, seventy: 70, eighty: 80, hundred: 100, thousand: 1000, first: 1, second: 2, third: 3 };
  /** opposite adjective (shown as text + Chinese, never played) */
  L.OPP = { new: ['old', '舊的'], old: ['new', '新的'], good: ['bad', '不好的'], bad: ['good', '好的'], short: ['tall', '高的'], tall: ['short', '矮的'], heavy: ['light', '輕的'], cool: ['warm', '溫暖的'], big: ['small', '小的'], small: ['big', '大的'], thin: ['thick', '厚的'], sweet: ['sour', '酸的'], sour: ['sweet', '甜的'], hard: ['soft', '軟的'], soft: ['hard', '硬的'], young: ['old', '老的'], strong: ['weak', '虛弱的'], rich: ['poor', '貧窮的'], long: ['short', '短的'], safe: ['dangerous', '危險的'] };
  L.MOOD = { happy: '😀', angry: '😠', sad: '😢', excited: '🤩', tired: '😴', scared: '😱', fine: '🙂', terrible: '😖', peaceful: '😌', busy: '😵‍💫' };
  L.TOOL = { doctor: ['🩺', '聽診器'], police: ['🚓', '警車'], nurse: ['💉', '針筒'], teacher: ['📖', '課本'], student: ['🎒', '書包'], art: ['🎨', '調色盤'], math: ['🧮', '算盤'], music: ['🎹', '鋼琴'], science: ['🔬', '顯微鏡'], English: ['🔤', '英文字母'], PE: ['⚽', '足球'], homework: ['✏️', '鉛筆'], bathroom: ['🛁', '浴缸'], 'living room': ['🛋️', '沙發'], bedroom: ['🛏️', '床'], kitchen: ['🍳', '平底鍋'], 'dining room': ['🍽️', '餐具'], money: ['👛', '錢包'], dollar: ['💵', '鈔票'] };
  L.PLANNER = W(['art', 'math', 'music', 'science', 'English', 'PE', 'Chinese', 'bathroom', 'living room', 'bedroom', 'kitchen', 'dining room']);
  L.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  L.CLOTHES = W(['jacket', 'vest', 'dress', 'scarf', 'hat', 'cap', 'stockings', 'shirt', 'sweater', 'sock', 'sneakers', 'skirt', 'raincoat', 'shoes']);
  L.TIME = W(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'weekend', 'morning', 'today', 'tomorrow', 'yesterday', 'night', 'afternoon', 'week', 'noon', 'year']);
  L.COLORS = { red: '#e03131', green: '#2f9e44', blue: '#1971c2', yellow: '#fcc419', white: '#f8f9fa', pink: '#f783ac', black: '#212529', purple: '#7048e8', brown: '#8d5524' };
  /** verb form heard in the sentence and the other form shown as the distractor */
  L.VERBFORM = { have: ['has', 'have'], do: ['does', 'do'], take: ['takes', 'take'], paint: ['paints', 'paint'], works: ['works', 'work'], sleep: ['sleeps', 'sleep'], say: ['says', 'say'], raise: ['raises', 'raise'], nap: ['naps', 'nap'], mix: ['mixes', 'mix'], know: ['knows', 'know'], jump: ['jumps', 'jump'], feel: ['feels', 'feel'], call: ['call', 'calls'], want: ['want', 'wants'], make: ['make', 'makes'], give: ['give', 'gives'], decorate: ['decorate', 'decorates'], study: ['study', 'studies'], start: ['start', 'starts'], sit: ['sit', 'sits'], send: ['send', 'sends'], plan: ['plan', 'plans'], look: ['look', 'looks'], like: ['like', 'likes'], keep: ['keep', 'keeps'], hunt: ['hunt', 'hunts'], are: ['are', 'is'], going: ['going', 'go'] };
  /** classroom commands → action picture */
  L.CMD = { 'Stand up.': '🧍', 'Sit down.': '🪑', 'Raise your hand.': '🙋', 'Listen carefully.': '👂', 'Line up.': '🚶', 'Look at the board.': '👀', 'Open your book.': '📖', 'Close your book.': '📕', 'Be quiet.': '🤫', 'Come here.': '👋', 'Clap your hands.': '👏', 'Color the picture.': '🖍️', 'Write your name.': '✍️', 'Open the door.': '🚪', 'Close the door.': '🔒', 'Draw a picture.': '🖼️', 'Put it away.': '📦', 'Wash your hands.': '🧼', 'Read a book.': '📚', 'Turn on the light.': '💡', 'Turn off the light.': '🌑', 'Wear your glasses.': '👓', 'Look at the rainbow.': '🌈', 'Draw a sun.': '☀️', 'Say cheese!': '📸' };
  L.CMD_ZH = { 'Stand up.': '站起來', 'Sit down.': '坐下', 'Raise your hand.': '舉手', 'Listen carefully.': '仔細聽', 'Line up.': '排隊', 'Look at the board.': '看黑板', 'Open your book.': '打開書', 'Close your book.': '闔上書', 'Be quiet.': '安靜', 'Come here.': '過來', 'Clap your hands.': '拍手', 'Color the picture.': '幫圖著色', 'Write your name.': '寫名字', 'Open the door.': '開門', 'Close the door.': '關門', 'Draw a picture.': '畫一張圖', 'Put it away.': '收起來', 'Wash your hands.': '洗手', 'Read a book.': '讀書', 'Turn on the light.': '開燈', 'Turn off the light.': '關燈', 'Wear your glasses.': '戴眼鏡', 'Look at the rainbow.': '看彩虹', 'Draw a sun.': '畫太陽', 'Say cheese!': '說「起司」拍照' };
  /** questions / greetings → a fitting reply (shown as text, never played) */
  L.QA = { what: 'My name is Amy.', who: 'She is my sister.', where: 'It is on the desk.', how: 'I practice every day.', why: 'Because of the sunlight.', which: 'I like the red one.', when: 'It is in May.', 'What time is it?': 'At three o\'clock.', 'Good morning!': 'Good morning, teacher!', 'Good night!': 'Good night! Sweet dreams.', 'Good job!': 'Thank you!', 'Say cheese!': 'Cheese!', 'Who wants...?': 'Me, please!' };
  L.QA_ZH = { what: '我的名字是 Amy。', who: '她是我的姐妹。', where: '它在書桌上。', how: '我每天練習。', why: '因為陽光的關係。', which: '我喜歡紅色那個。', when: '在五月。', 'What time is it?': '在三點。', 'Good morning!': '老師早安！', 'Good night!': '晚安！祝好夢。', 'Good job!': '謝謝！', 'Say cheese!': '起司！', 'Who wants...?': '我要，謝謝！' };
  L.SORT5 = { // Town Post Office (L05): topic of each word
    weather: W(['hot', 'sunny', 'cold', 'rainy', 'weather', 'cloudy', 'windy', 'warm', 'snow', 'raining', 'cloud', 'snowy']),
    season: W(['spring', 'summer', 'fall', 'winter']),
    people: W(['Santa Claus', 'lady', 'girl', 'children', 'boy', 'friend', 'Miss', 'Mr.', 'Mrs.']),
    place: W(['airport', 'classroom', 'street']),
  };
  L.sort5 = (w) => Object.keys(L.SORT5).find((k) => L.SORT5[k].has(w.word.toLowerCase()));

  L.FILTERS = {
    countable: (w) => COUNTABLE.has(w.word.toLowerCase()),
    numeric: (w) => L.NUM[w.word.toLowerCase()] != null,
    opposite: (w) => !!L.OPP[w.word.toLowerCase()],
    mood: (w) => !!L.MOOD[w.word.toLowerCase()],
    tool: (w) => !!L.TOOL[w.word],
    planner: (w) => L.PLANNER.has(w.word.toLowerCase()),
    month: (w) => L.MONTHS.includes(w.word),
    clothes: (w) => L.CLOTHES.has(w.word.toLowerCase()),
    time: (w) => L.TIME.has(w.word.toLowerCase()),
    color: (w) => !!L.COLORS[w.word.toLowerCase()],
    verbform: (w) => !!L.VERBFORM[w.word.toLowerCase()],
    command: (w) => !!L.CMD[w.word],
    qa: (w) => !!L.QA[w.word],
  };

  /* ---------- registration ---------- */
  L.register = function (def) {
    const s = L.spec[def.id] || {};
    const full = Object.assign({ mode: 'listen', roundSize: 8, introLabel: '情境 Situation：', skills: ['listening', 'sentence'] }, s, def);
    full.model = s.context || def.model || '';
    if (!full.pool && s.filter && L.FILTERS[s.filter]) { const f = L.FILTERS[s.filter]; full.pool = (ws) => ws.filter(f); }
    L.games[full.id] = full;
    EP.registerGame(full);
    return full;
  };

  /* ---------- sentence text helpers ---------- */
  /** tokens of a sentence: [{t: as written (no edge punctuation), w: lower case}] */
  L.tokens = function (s) {
    return String(s).split(/\s+/).filter(Boolean).map((raw) => { const t = raw.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, ''); return { raw, t, w: t.toLowerCase() }; }).filter((x) => x.t);
  };
  /** the key word as it appears in the sentence: {text, index (token index), start (char)} or null */
  L.key = function (item) {
    if (item._lkey !== undefined) return item._lkey;
    let k = null; const cz = EP.cloze(item);
    if (cz) {
      const before = item.sentence.slice(0, cz.start); const index = L.tokens(before).length;
      k = { text: cz.text, start: cz.start, index, words: cz.text.split(/\s+/).length };
    }
    item._lkey = k; return k;
  };
  /** sentence with the key word replaced by `text` (a text-only distractor) */
  L.swapKey = function (item, text) {
    const k = L.key(item); if (!k) return null;
    return item.sentence.slice(0, k.start) + text + item.sentence.slice(k.start + k.text.length);
  };
  /** the key word of another item, matched to this sentence (same capitalisation at sentence start) */
  L.keyText = function (item) { const k = L.key(item); return k ? k.text : item.word.replace('...', '').replace(/[.!?]$/, ''); };

  /** picture (emoji / digits) or '' */
  L.pic = (w) => EP.pic(w) || (EP.calendarPic && EP.calendarPic(w) ? (EP.calendarPic(w).big) : '');
  /** a visual face for an item: emoji when there is one, otherwise the Chinese meaning */
  L.face = (w, size) => {
    const p = EP.pic(w);
    return p ? u.el('span', { class: 'ls-emoji', style: size ? { fontSize: size } : null, 'aria-label': w.zh, role: 'img' }, p) : u.el('span', { class: 'ls-zhcard zh' }, w.zh);
  };

  /** n other items for distractors: same pool first, never the same word/meaning/sentence */
  L.others = function (ctx, item, n, opts) {
    opts = opts || {};
    const seen = new Set([u.norm(item.word), item.zh, item.sentence]);
    const ok = (w) => w.id !== item.id && !seen.has(u.norm(w.word)) && !seen.has(w.zh) && !seen.has(w.sentence) && (!opts.needPic || EP.pic(w)) && (!opts.filter || opts.filter(w)) && (!opts.needKey || L.key(w));
    const from = (list) => u.shuffle(list.filter(ok));
    let res = from(ctx.pool);
    if (res.length < n && !opts.poolOnly) res = res.concat(from(EP.levelWords(item.level)).filter((w) => !res.includes(w)));
    if (res.length < n && !opts.poolOnly && !opts.levelOnly) res = res.concat(from(EP.words).filter((w) => !res.includes(w)));
    const out = []; const texts = new Set();
    for (const w of res) { const k = u.norm(w.word); if (texts.has(k)) continue; texts.add(k); out.push(w); if (out.length >= n) break; }
    return out;
  };

  /* ---------- layout ---------- */
  /** themed stage: returns {wrap, head, body, foot} */
  L.stage = function (ctx, theme) {
    theme = theme || {};
    ctx.root.style.background = theme.bg || 'linear-gradient(160deg,#1b2a6b,#3b5bdb)';
    const head = u.el('div', { class: 'ls-head' }); const body = u.el('div', { class: 'ls-body' }); const foot = u.el('div', { class: 'ls-foot' });
    const wrap = u.el('div', { class: 'ls-wrap' + (theme.dark === false ? ' ls-light' : '') }, head, body, foot);
    ctx.root.appendChild(wrap);
    return { wrap, head, body, foot };
  };
  /** the listen bar: 🔊 play + 🐢 slow + voice-source tag. Auto-plays unless opts.auto === false. */
  L.listenBar = function (ctx, item, opts) {
    opts = opts || {};
    let plays = 0; const max = ctx.difficulty === 'hard' ? 3 : 99;
    const tag = EP.ui && EP.ui.srcTag ? EP.ui.srcTag(EP.audio.source(item, 'sentence')) : null;
    const play = (slow) => { if (plays >= max) { ctx.toast('Hard 模式最多聽 3 次'); return Promise.resolve(); } plays++; return ctx.say(item, { sentence: true, slow }); };
    const bar = u.el('div', { class: 'ls-listen' },
      u.el('button', { class: 'btn blue big ls-play', 'aria-label': 'Play the sentence 播放句子', onclick: () => play(false) }, '🔊 ', opts.label || 'Listen 聽句子'),
      u.el('button', { class: 'btn small ls-slow', 'aria-label': 'Play slowly 慢速播放', onclick: () => play(true) }, '🐢 Slow 慢速'),
      tag);
    bar.play = play; bar.plays = () => plays;
    if (opts.auto !== false) ctx.timeout(() => play(false), opts.delay || 350);
    return bar;
  };
  /** a short instruction line (bilingual) */
  L.say = (zh, en) => u.el('div', { class: 'ls-instr' }, u.el('span', { class: 'zh' }, zh), en ? u.el('span', { class: 'ls-en' }, en) : null);
  /** big choice buttons: options [{el|label|pic, ...}] → onPick(i, btn) */
  L.choices = function (opts, onPick, cls) {
    const box = u.el('div', { class: 'ls-choices ' + (cls || '') }); let locked = false;
    const btns = opts.map((o, i) => { const b = u.el('button', { class: 'ls-choice', 'data-i': i, 'aria-label': o.aria || null }, o.el || null, o.pic ? u.el('span', { class: 'ls-emoji' }, o.pic) : null, o.label != null ? u.el('span', { class: o.zh ? 'zh' : '' }, o.label) : null); b.addEventListener('click', () => { if (!locked) onPick(i, b); }); box.appendChild(b); return b; });
    return { el: box, btns, lock() { locked = true; }, unlock() { locked = false; }, mark(right, picked) { btns.forEach((b, i) => b.classList.add(i === right ? 'right' : i === picked ? 'wrongpick' : 'dim')); } };
  };

  /** record the answer + standard feedback (wrong: show and replay the sentence). Resolves when ready for the next round. */
  L.feedback = async function (ctx, item, ok, opts) {
    opts = opts || {};
    const r = ctx.answer(item, ok, { x: opts.x, y: opts.y, points: opts.points, label: opts.label });
    const card = u.el('div', { class: 'ls-feedback ' + (ok ? 'ok' : 'bad'), role: 'status' },
      u.el('div', { class: 'ls-fb-head' }, ok ? '✔ Correct! 答對了' : '✘ ' + (opts.wrongText || 'Not quite 再聽一次')),
      ok && !opts.showOnRight ? null : u.el('div', { class: 'ls-fb-sent' }, item.sentence),
      ok && !opts.showOnRight ? null : u.el('div', { class: 'ls-fb-zh zh' }, item.sentenceZh));
    ctx.root.appendChild(card);
    if (ok) await ctx.wait(opts.okMs || 750);
    else await Promise.all([ctx.say(item, { sentence: true }), ctx.wait(opts.badMs || 1600)]);
    card.remove();
    return r;
  };

  /** per-level styles: L.css('L01', '.l01a-scene{...}') — injected once */
  L.css = function (id, text) {
    if (document.getElementById('ls-css-' + id)) return;
    const st = document.createElement('style'); st.id = 'ls-css-' + id; st.textContent = text; document.head.appendChild(st);
  };

  /** test hooks used by the automatic play tests: T.set(correctFn, wrongFn); return { test: T.api } */
  L.tester = function () {
    let c = null, w = null;
    return { set(cf, wf) { c = cf; w = wf; }, clear() { c = w = null; }, api: { correct() { if (c) c(); }, wrong() { if (w) w(); } } };
  };

  /** simple round loop: for each item run `round(item, i)` (returns a promise); ends the game afterwards */
  L.rounds = async function (ctx, items, round) {
    for (let i = 0; i < items.length; i++) {
      if (ctx.ended) return;
      ctx.hud.progress(i / items.length);
      await round(items[i], i);
    }
    ctx.hud.progress(1);
    if (!ctx.ended) ctx.end();
  };

  /** drag & drop with a tap-tap fallback (tap a draggable, then tap a target). onDrop(dragEl, targetEl) */
  L.dnd = function (ctx, drags, targets, onDrop) {
    let sel = null; let ghost = null; let start = null; let moved = false;
    const clearSel = () => { if (sel) { sel.classList.remove('ls-selected'); sel.setAttribute('aria-pressed', 'false'); } sel = null; };
    const targetAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && targets.find((t) => t === el || t.contains(el)); };
    drags.forEach((d) => {
      d.setAttribute('aria-pressed', 'false');
      ctx.on(d, 'click', () => { if (moved) return; if (sel === d) return clearSel(); clearSel(); sel = d; d.classList.add('ls-selected'); d.setAttribute('aria-pressed', 'true'); });
      ctx.on(d, 'pointerdown', (e) => { start = { x: e.clientX, y: e.clientY, d }; moved = false; });
    });
    ctx.on(window, 'pointermove', (e) => {
      if (!start) return;
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        moved = true; ghost = start.d.cloneNode(true); ghost.classList.add('ls-ghost'); ghost.removeAttribute('id'); document.body.appendChild(ghost);
      }
      if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; targets.forEach((t) => t.classList.toggle('ls-over', t === targetAt(e.clientX, e.clientY))); }
    });
    ctx.on(window, 'pointerup', (e) => {
      if (!start) return; const d = start.d; start = null;
      if (ghost) { ghost.remove(); ghost = null; targets.forEach((t) => t.classList.remove('ls-over')); const t = targetAt(e.clientX, e.clientY); if (t) { clearSel(); onDrop(d, t); } setTimeout(() => (moved = false), 0); }
    });
    targets.forEach((t) => ctx.on(t, 'click', () => { if (sel) { const d = sel; clearSel(); onDrop(d, t); } }));
    ctx.onCleanup(() => { if (ghost) ghost.remove(); });
    return { clear: clearSel };
  };
})();
