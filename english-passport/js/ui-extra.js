/* Menus part 2: Word-dex, shop, review, class battle, teacher area (settings, real-voice tracker, recording studio, progress), credits */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, el = u.el, ui = EP.ui;
  const app = () => document.getElementById('app');

  /* ---------------- WORD-DEX ---------------- */
  ui.screens.wordex = function () {
    const s = el('div', { class: 'screen' }); s.appendChild(ui.topbar('📚 Word-dex 單字圖鑑'));
    let lv = 0, q = '';
    const total = EP.words.length; const seen = Object.keys(EP.me.words).length; const mastered = Object.values(EP.me.words).filter((x) => x.b >= 4).length;
    const head = el('div', { class: 'panel', style: { marginBottom: '12px' } },
      el('div', { class: 'row', style: { justifyContent: 'space-between' } }, el('b', {}, `Collected 收集 ${seen}/${total} · Mastered 精熟 ${mastered}/${total}`),
        el('span', { class: 'muted zh' }, '⬜ 未見過  🟥 要加油  🟨 快學會  🟩 精熟')),
      el('div', { class: 'meter', style: { marginTop: '6px' } }, el('i', { style: { width: (mastered / total) * 100 + '%' } })));
    const search = el('input', { type: 'text', placeholder: '🔍 Search 搜尋 (English / 中文)', oninput: (e) => { q = e.target.value.trim().toLowerCase(); render(); } });
    const chips = el('div', { class: 'row', style: { margin: '8px 0' } }, [0].concat(EP.levels.map((l) => l.level)).map((n) => el('button', { class: 'btn small' + (n === lv ? ' primary' : ''), onclick: () => { lv = n; chips.querySelectorAll('button').forEach((b, i) => b.classList.toggle('primary', i === n)); render(); } }, n ? `${n}` : 'All')));
    const grid = el('div', { class: 'dex-grid' });
    const color = (b) => (b < 0 ? '#ced4da' : b <= 1 ? '#ff6b6b' : b <= 3 ? '#fcc419' : '#51cf66');
    function render() {
      grid.innerHTML = '';
      EP.words.filter((w) => (!lv || w.level === lv) && (!q || w.word.toLowerCase().includes(q) || w.zh.includes(q))).forEach((w) => {
        const b = EP.srs.mastery(w.id);
        grid.appendChild(el('button', { class: 'dex-card' + (b < 0 ? ' unseen' : ''), style: { '--m': color(b) }, onclick: () => { EP.audio.play(w); detail(w); } },
          el('div', { class: 'e' }, EP.pic(w) || '🔤'), el('div', { class: 'w' }, w.word), el('div', { class: 'z zh' }, w.zh), el('div', { class: 'muted', style: { fontSize: '.75rem' } }, `#${w.id} · L${w.level}`)));
      });
    }
    function detail(w) {
      const st = EP.me.words[w.id];
      ui.modal(el('div', { style: { textAlign: 'center' } }, el('div', { style: { fontSize: '4rem' } }, EP.pic(w) || '🔤'), el('h2', { style: { margin: 0 } }, w.word), el('div', { class: 'zh', style: { fontSize: '1.3rem' } }, w.zh, ' · ', w.pos),
        el('p', {}, w.sentence, el('br'), el('span', { class: 'zh muted' }, w.sentenceZh)),
        el('div', { class: 'row', style: { justifyContent: 'center' } }, el('button', { class: 'btn blue', onclick: () => EP.audio.play(w) }, '🔊 ', ui.srcTag(EP.audio.source(w))), el('button', { class: 'btn', onclick: () => EP.audio.play(w, { sentence: true }) }, '🔊 Sentence ', ui.srcTag(EP.audio.source(w, 'sentence')))),
        el('p', { class: 'muted' }, st ? `✔ ${st.r}  ✘ ${st.w}  · box ${st.b}/5` : 'Not practised yet 尚未練習'), ui.creditLine(w)));
    }
    s.append(head, search, chips, grid); render();
    return s;
  };
  ui.creditLine = function (w) {
    const m = EP.audio.manifest[w.id];
    if (!m) return el('div', { class: 'muted', style: { fontSize: '.8rem' } }, 'No real human recording exists yet on Wikimedia Commons → computer voice. 老師可在教師專區錄音。');
    return el('div', { class: 'muted', style: { fontSize: '.8rem' } }, '🎙️ ', m.by || 'Wikimedia Commons contributor', ' · ', m.lic, ' · ', el('a', { href: m.p, target: '_blank', rel: 'noopener' }, 'Commons'), m.a && m.a !== 'unknown' ? ` · accent ${m.a}` : '');
  };

  /* ---------------- HALL OF FAME (players on this device; Kahoot-style podium) ---------------- */
  ui.screens.fame = function () {
    const s = el('div', { class: 'screen' }); s.appendChild(ui.topbar('🏅 Hall of Fame 名人堂'));
    const score = (p) => ({ p, stamps: Object.values(p.levels).filter((x) => x.stamp).length, words: Object.values(p.words).filter((x) => x.b >= 4).length, lv: EP.levelOf(p.xp).lv });
    const rows = EP.profiles.map(score).sort((a, b) => b.p.xp - a.p.xp || b.stamps - a.stamps);
    const top = rows.slice(0, 3); const order = [top[1], top[0], top[2]].filter(Boolean); const hs = { 0: '100%', 1: '78%', 2: '60%' };
    s.append(el('div', { class: 'podium', style: { height: '42vh', minHeight: '240px' } }, order.map((r) => { const place = rows.indexOf(r);
      return el('div', { class: 'col', style: { height: hs[place], background: ['#f5c542', '#adb5bd', '#e8a87c'][place], color: '#3b2b00', animationDelay: (2 - place) * 0.4 + 's' } },
        ui.avatar(r.p, 54), el('div', { style: { marginTop: '4px' } }, r.p.name), el('div', { style: { fontSize: '1.8rem' } }, ['🥇', '🥈', '🥉'][place]), el('div', {}, `Lv ${r.lv} · ${r.p.xp} XP`)); })),
      el('div', { class: 'panel', style: { marginTop: '16px' } }, el('div', { class: 'scroll' }, el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, ['#', 'Player 玩家', 'Level', 'XP', '🛂 Stamps', '📗 Mastered 精熟', '🔥 Best streak'].map((h) => el('th', {}, h)))),
        el('tbody', {}, rows.map((r, i) => el('tr', { style: r.p === EP.me ? { background: 'var(--paper)' } : null }, el('td', {}, i + 1), el('td', {}, r.p.avatar, ' ', el('b', {}, r.p.name)), el('td', {}, r.lv), el('td', {}, r.p.xp), el('td', {}, `${r.stamps}/25`), el('td', {}, `${r.words}/700`), el('td', {}, r.p.streak.best || 0)))))),
        el('p', { class: 'muted zh' }, '只列出這台裝置上的玩家。每位同學點首頁左上角的頭像，就能建立自己的玩家。')));
    if (rows.length > 1) setTimeout(() => ui.confetti(80), 900);
    return s;
  };

  /* ---------------- SHOP (cosmetics only, no randomness, no real money) ---------------- */
  const SHOP = [
    { cat: 'avatar', label: 'Characters 角色', items: [['🦄', 120], ['🐲', 200], ['🦖', 160], ['🐙', 100], ['🦉', 90], ['🐳', 140], ['🦩', 110], ['🐝', 80], ['🦋', 80], ['🐢', 60], ['🤖', 250], ['👽', 220], ['🧙', 300], ['🦸', 300], ['🧚', 260], ['🥷', 280]] },
    { cat: 'hat', label: 'Hats 帽子', items: [['🎩', 80], ['👑', 300], ['🧢', 50], ['🎓', 150], ['⛑️', 90], ['🎀', 60], ['🪖', 70], ['👒', 70], ['🎅', 120]] },
    { cat: 'vehicle', label: 'Map rides 地圖交通工具', items: [['✈️', 0], ['🚀', 200], ['🛸', 260], ['🎈', 90], ['🚁', 140], ['⛵', 120], ['🚂', 100], ['🛶', 80], ['🐉', 400]] },
  ];
  ui.screens.shop = function () {
    const s = el('div', { class: 'screen' }); s.appendChild(ui.topbar('🛍️ Shop 商店'));
    const p = EP.me; p.owned = p.owned || [];
    s.appendChild(el('div', { class: 'panel', style: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' } }, ui.avatar(p, 80), el('div', {}, el('b', { style: { fontSize: '1.3rem' } }, p.name), el('div', { class: 'zh muted' }, '用遊戲賺到的金幣買造型（沒有抽獎、沒有真錢）'))));
    SHOP.forEach((c) => {
      const row = el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))' } });
      c.items.forEach(([ic, price]) => {
        const key = c.cat + ':' + ic; const owned = price === 0 || p.owned.includes(key) || (c.cat === 'avatar' && EP.AVATARS_FREE.includes(ic));
        const equipped = c.cat === 'avatar' ? p.avatar === ic : p.equip[c.cat] === ic;
        row.appendChild(el('button', { class: 'panel', style: { textAlign: 'center', padding: '10px', outline: equipped ? '4px solid var(--grass)' : '' }, onclick: () => {
          if (!owned) { if (p.coins < price) { EP.sfx.wrong(); return ui.toast('Not enough coins 金幣不夠，去玩遊戲賺金幣！', '🪙'); } p.coins -= price; p.owned.push(key); EP.sfx.coin(); ui.toast('Bought! 買到了！', ic); }
          if (c.cat === 'avatar') p.avatar = ic; else p.equip[c.cat] = equipped ? '' : ic;
          EP.save(); ui.show('shop');
        } }, el('div', { style: { fontSize: '2.6rem' } }, ic), el('div', { style: { fontWeight: 800 } }, equipped ? '✅ On' : owned ? 'Use 使用' : `🪙 ${price}`)));
      });
      s.append(el('h3', { style: { color: '#fff', margin: '16px 0 8px' } }, c.label), row);
    });
    return s;
  };

  /* ---------------- REVIEW RUSH (Gimkit-style: missed words come back) ---------------- */
  ui.startReview = async function () {
    let items = EP.srs.due(12);
    if (items.length < 4) {
      const seen = Object.keys(EP.me.words).map((id) => EP.byId[id]).filter(Boolean);
      items = items.concat(u.shuffle(seen.filter((w) => !items.includes(w))).slice(0, 12 - items.length));
    }
    if (items.length < 4) return ui.toast('Play some levels first! 先去玩幾關，答錯的字會在這裡複習', '🔁');
    const res = await EP.runGame('quiz', { items, pool: EP.words, level: items[0].level, mode: 'review' });
    if (res.quit) return ui.show('home');
    ui.results(res);
  };

  /* ---------------- CLASS BATTLE (single screen, teams take turns; Kahoot/Blooket/Baamboozle style) ---------------- */
  const TEAMS = [['Red 紅隊', '#e03131', '🦊'], ['Blue 藍隊', '#1971c2', '🐳'], ['Yellow 黃隊', '#f08c00', '🐥'], ['Green 綠隊', '#2f9e44', '🐸'], ['Purple 紫隊', '#7048e8', '🦄'], ['Pink 粉紅隊', '#d6336c', '🐷']];
  ui.screens.battleSetup = function () {
    const s = el('div', { class: 'screen' }); s.appendChild(ui.topbar('🏆 Class Battle 班級對戰'));
    const cfg = EP.store.get('battleCfg', { levels: [1], teams: 4, rounds: 3, time: 20, lucky: true });
    const lvBox = el('div', { class: 'row' }, EP.levels.map((l) => el('button', { class: 'btn small' + (cfg.levels.includes(l.level) ? ' primary' : ''), onclick: (e) => { const i = cfg.levels.indexOf(l.level); i >= 0 ? cfg.levels.splice(i, 1) : cfg.levels.push(l.level); e.currentTarget.classList.toggle('primary'); } }, `${l.level} ${l.icon}`)));
    const sel = (key, vals, lab) => el('label', { class: 'tog' }, lab, el('select', { onchange: (e) => (cfg[key] = +e.target.value) }, vals.map((v) => el('option', { value: v, selected: cfg[key] === v }, v))));
    s.append(el('div', { class: 'panel' },
      el('h3', {}, '1. Choose levels 選擇關卡'), lvBox,
      el('h3', { style: { marginTop: '14px' } }, '2. Rules 規則'),
      el('div', { class: 'row' }, sel('teams', [2, 3, 4, 5, 6], 'Teams 隊數'), sel('rounds', [2, 3, 4, 5, 6, 8], 'Questions per team 每隊題數'), sel('time', [10, 15, 20, 30, 45], 'Seconds 秒數'),
        el('label', { class: 'tog' }, el('input', { type: 'checkbox', checked: cfg.lucky, onchange: (e) => (cfg.lucky = e.target.checked) }), 'Lucky gift boxes 幸運禮物盒')),
      el('p', { class: 'zh muted' }, '玩法：投影在大螢幕，各隊輪流作答。老師或學生點選答案。答對得分（越快越高），幸運禮物盒可能加倍或交換分數。'),
      el('button', { class: 'btn go big', onclick: () => { if (!cfg.levels.length) return ui.toast('Choose at least one level 至少選一關'); EP.store.set('battleCfg', cfg); ui.battle(cfg); } }, '▶ Start Battle 開始對戰')));
    return s;
  };
  ui.battle = function (cfg) {
    const pool = cfg.wordIds && cfg.wordIds.length ? cfg.wordIds.map((id) => EP.byId[id]).filter(Boolean) : EP.words.filter((w) => cfg.levels.includes(w.level));
    const teams = TEAMS.slice(0, cfg.teams).map(([n, c, a]) => ({ name: n, color: c, av: a, score: 0 }));
    const total = cfg.teams * cfg.rounds; const qs = []; while (qs.length < total) qs.push(...u.shuffle(pool)); qs.length = total;
    let qi = 0;
    const s = el('div', { class: 'screen', style: { maxWidth: '1400px' } }); ui.show('blank'); app().appendChild(s);
    const board = el('div', { class: 'team-cards' }); const box = el('div', { style: { textAlign: 'center', color: '#fff', marginTop: '12px' } });
    s.append(el('div', { class: 'topbar' }, el('button', { class: 'icon-btn', onclick: () => ui.show('battleSetup') }, '✖'), el('h2', {}, '🏆 Class Battle'), el('div', { class: 'grow' }), el('span', { class: 'chip', id: 'bq' }, '')), board, box);
    const drawBoard = (turn) => { board.innerHTML = ''; teams.forEach((t, i) => board.appendChild(el('div', { class: 'team-card' + (i === turn ? ' turn' : ''), style: { background: t.color } }, el('div', { style: { fontSize: '2rem' } }, t.av), t.name, el('div', { class: 'sc' }, t.score)))); };
    EP.music.start(3);
    const ask = () => {
      if (qi >= qs.length) return podium();
      const turn = qi % teams.length; const team = teams[turn]; const w = qs[qi];
      document.getElementById('bq').textContent = `Q ${qi + 1}/${qs.length}`; drawBoard(turn);
      const types = ['listen', 'pic', 'zh', 'cloze']; let t = types[qi % 4]; if (t === 'pic' && !EP.pic(w)) t = 'listen'; if (t === 'cloze' && !EP.cloze(w)) t = 'zh';
      const opts = u.shuffle([w].concat(EP.distractors(w, 3, { pool: pool.length >= 8 ? pool : EP.words })));
      box.innerHTML = '';
      const title = el('h2', { style: { fontSize: '2rem', margin: '6px 0' } }, `${team.av} ${team.name}'s turn! 輪到${team.name}`);
      let prompt;
      if (t === 'listen') prompt = el('button', { class: 'btn blue big', onclick: () => EP.audio.play(w) }, '🔊 Listen 聽');
      else if (t === 'pic') prompt = el('div', { style: { fontSize: '7rem', lineHeight: 1.1 } }, EP.pic(w));
      else if (t === 'zh') prompt = el('div', { style: { fontSize: '4rem', fontWeight: 900 } }, w.word);
      else { const cz = EP.cloze(w); prompt = el('div', { class: 'panel', style: { fontSize: '2.2rem', fontWeight: 800, display: 'inline-block' } }, w.sentence.slice(0, cz.start), ' ____ ', w.sentence.slice(cz.start + cz.text.length)); }
      const timer = el('div', { style: { fontSize: '3rem', fontWeight: 900 } }, cfg.time);
      const grid = EP.kit.choiceGrid(opts.map((o) => (t === 'zh' ? { label: o.zh, zh: true } : { label: o.word })), (k) => answer(k));
      grid.el.style.margin = '14px auto'; grid.el.style.width = 'min(1100px,96vw)';
      box.append(title, prompt, timer, grid.el);
      if (t !== 'cloze') setTimeout(() => EP.audio.play(w), 300);
      const t0 = Date.now(); let done = false;
      const iv = setInterval(() => { const left = Math.max(0, cfg.time - (Date.now() - t0) / 1000); timer.textContent = Math.ceil(left); if (left <= 0) answer(-1); }, 200);
      function answer(k) {
        if (done) return; done = true; clearInterval(iv); grid.lock();
        const right = opts.indexOf(w); grid.mark(right, k); const ok = k === right;
        const frac = Math.max(0, 1 - (Date.now() - t0) / 1000 / cfg.time);
        if (ok) { const pts = Math.round(500 + 500 * frac); team.score += pts; EP.sfx.correct(); drawBoard(turn); box.append(el('h2', {}, `✔ +${pts}`)); }
        else { EP.sfx.wrong(); box.append(el('h2', {}, `✘ ${w.word} = ${w.zh}`)); EP.audio.play(w); }
        setTimeout(() => (ok && cfg.lucky ? lucky(team, turn) : next()), ok ? 900 : 2200);
      }
    };
    const next = () => { qi++; ask(); };
    const lucky = (team, turn) => {
      box.innerHTML = '';
      box.append(el('h2', {}, `🎁 ${team.name}: pick a gift! 選一個禮物盒`));
      const row = el('div', { class: 'row', style: { justifyContent: 'center', gap: '20px' } });
      const rewards = u.shuffle([['+200', (t) => (t.score += 200)], ['×2 (max +1000)', (t) => (t.score += Math.min(1000, t.score))], ['+100', (t) => (t.score += 100)], ['Swap with the leader 和第一名交換', (t) => { const lead = teams.slice().sort((a, b) => b.score - a.score)[0]; if (lead !== t) { const x = lead.score; lead.score = t.score; t.score = x; } }], ['+50', (t) => (t.score += 50)], ['Give +100 to every team 大家都 +100', () => teams.forEach((x) => (x.score += 100))]]).slice(0, 3);
      rewards.forEach(([label, fn]) => row.appendChild(el('button', { class: 'btn primary big', style: { fontSize: '3rem', width: '140px', height: '140px' }, onclick: () => { EP.sfx.chest(); fn(team); drawBoard(turn); row.innerHTML = ''; row.append(el('div', { class: 'panel', style: { fontSize: '1.6rem', fontWeight: 900 } }, '🎁 ', label)); setTimeout(next, 1700); } }, '🎁')));
      box.append(row);
    };
    const podium = () => {
      EP.music.stop(); drawBoard(-1);
      const r = teams.slice().sort((a, b) => b.score - a.score);
      const order = [r[1], r[0], r[2]].filter(Boolean); const hs = ['70%', '95%', '50%'];
      box.innerHTML = '';
      box.append(el('h2', { style: { fontSize: '2.6rem' } }, '🏆 Champions 冠軍'), el('div', { class: 'podium', style: { height: '50vh' } }, order.map((t) => { const place = r.indexOf(t); return el('div', { class: 'col', style: { height: hs[place === 0 ? 1 : place === 1 ? 0 : 2], background: t.color, animationDelay: (2 - place) * 0.5 + 's' } }, el('div', { style: { fontSize: '3rem' } }, t.av), t.name, el('div', { style: { fontSize: '2rem' } }, ['🥇', '🥈', '🥉'][place]), t.score); })),
        el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } }, el('button', { class: 'btn go big', onclick: () => ui.battle(cfg) }, '🔁 Rematch 再一場'), el('button', { class: 'btn big', onclick: () => ui.show('battleSetup') }, '⚙️ Setup')));
      EP.sfx.win(); setTimeout(() => ui.confetti(220), 1400);
    };
    ask();
  };

  /* ---------------- TEACHER AREA ---------------- */
  ui.teacherGate = function () {
    const pin = el('input', { type: 'password', inputmode: 'numeric', placeholder: 'PIN (default 0000)', maxlength: 8 });
    const m = ui.modal(el('div', {}, el('h2', {}, '👩‍🏫 Teacher 教師專區'), el('p', { class: 'zh muted' }, '請輸入教師密碼（預設 0000，可在設定中修改）'), el('div', { class: 'row' }, pin, el('button', { class: 'btn go', onclick: go }, 'Enter 進入'))));
    pin.addEventListener('keydown', (e) => e.key === 'Enter' && go()); setTimeout(() => pin.focus(), 50);
    function go() { if (pin.value === String(EP.settings.teacherPin || '0000')) { m.close(); ui.show('teacher'); } else { EP.sfx.wrong(); pin.value = ''; } }
  };
  ui.screens.teacher = function (tab) {
    tab = tab || 'settings';
    const s = el('div', { class: 'screen' }); s.appendChild(ui.topbar('👩‍🏫 Teacher 教師專區'));
    const tabs = [['settings', '⚙️ Settings 設定'], ['audio', '🔊 Real voices 真人發音追蹤'], ['voices', '🎧 Student voices 學生錄音'], ['record', '🎙️ Record 錄音室'], ['progress', '📊 Progress 學生進度'], ['data', '💾 Data 資料']];
    s.appendChild(el('div', { class: 'row', style: { marginBottom: '12px' } }, tabs.map(([k, l]) => el('button', { class: 'btn small' + (k === tab ? ' primary' : ''), onclick: () => ui.show('teacher', k) }, l))));
    s.appendChild(ui.teacherTabs[tab]());
    return s;
  };
  ui.teacherTabs = {};
  ui.teacherTabs.settings = function () {
    const S = EP.settings; const save = () => EP.saveSettings();
    const tog = (k, l) => el('label', { class: 'tog' }, el('input', { type: 'checkbox', checked: !!S[k], onchange: (e) => { S[k] = e.target.checked; save(); } }), l);
    const sel = (k, vals, l) => el('label', { class: 'tog' }, l, el('select', { onchange: (e) => { S[k] = isNaN(+e.target.value) ? e.target.value : +e.target.value; save(); } }, vals.map(([v, t]) => el('option', { value: v, selected: String(S[k]) === String(v) }, t))));
    EP.tts.load();
    return el('div', { class: 'panel' },
      sel('difficulty', [['easy', 'Easy 簡單（1–2 年級）'], ['normal', 'Normal 一般（3–4 年級）'], ['hard', 'Hard 挑戰（5–6 年級）']], 'Difficulty 難度'),
      sel('roundSize', [[8, '8'], [12, '12'], [16, '16'], [40, 'All words 全部']], 'Words per game 每局單字數'),
      sel('speed', [[0.8, 'Slow 慢'], [1, 'Normal 一般'], [1.2, 'Fast 快']], 'Game speed 遊戲速度'),
      tog('unlockAll', 'Unlock all 25 levels 解鎖全部關卡'), tog('music', 'Music 背景音樂'), tog('sfx', 'Sound effects 音效'), tog('showChinese', 'Show Chinese hints 顯示中文提示'), tog('speakChecks', 'Speaking bonus (microphone) 口說加分（麥克風）'),
      sel('voiceRate', [[0.75, '0.75×'], [0.9, '0.9×'], [1, '1×']], 'Computer voice speed 電腦語音速度（僅用於沒有真人發音的句子）'),
      sel('ttsVoice', [['', 'Auto (best en-US) 自動']].concat(EP.tts.voices.map((v) => [v.name, `${v.name} (${v.lang})`])), 'Computer voice 電腦語音'),
      el('label', { class: 'tog' }, 'Teacher PIN 教師密碼', el('input', { type: 'text', value: S.teacherPin, maxlength: 8, onchange: (e) => { S.teacherPin = e.target.value || '0000'; save(); } })),
      el('p', { class: 'muted zh' }, '單字一律優先播放真人發音；只有完全找不到真人錄音的項目與例句才用電腦語音，並會清楚標示「電腦語音」。'),
      el('h3', { style: { marginTop: '16px' } }, '🧑‍🏫 一節課 40 分鐘建議流程'),
      el('div', { class: 'scroll' }, el('table', { class: 'data zh' }, el('thead', {}, el('tr', {}, ['時間', '活動', '在哪裡'].map((h) => el('th', {}, h)))),
        el('tbody', {}, [['5 分', '暖身：全班跟讀真人發音', '該關 📖 學習卡（投影）'], ['15 分', '個人或兩人闖關', '🎮 開始遊戲'], ['10 分', '全班分組對戰', '首頁 🏆 Class Battle'], ['5 分', '護照蓋章考（80% 蓋章）', '🛂 護照蓋章考'], ['5 分', '錯題回顧', '🔁 Review Rush／📚 Word-dex']].map((r) => el('tr', {}, r.map((c) => el('td', {}, c))))))),
      el('p', { class: 'muted zh' }, '低年級建議 Easy（有圖片與中文提示、速度慢）；高年級建議 Hard（只聽聲音）。'));
  };
  ui.teacherTabs.audio = function () {
    const man = EP.audio.manifest; const rows = EP.words.map((w) => ({ w, m: man[w.id], src: EP.audio.source(w) }));
    const human = rows.filter((r) => r.m).length; const bundled = rows.filter((r) => EP.audio.clips[r.w.id]).length; const offline = rows.filter((r) => EP.audio.offline[r.w.id]).length; const teacher = rows.filter((r) => EP.audio.teacher['w' + r.w.id]).length;
    let only = 'all';
    const prog = el('div', { class: 'muted' }, EP.store.get('offlineAudioAt') ? `Last offline download 上次下載：${new Date(EP.store.get('offlineAudioAt')).toLocaleString()}` : '');
    const tbody = el('tbody');
    const render = () => {
      tbody.innerHTML = '';
      rows.filter((r) => only === 'all' || (only === 'missing' && !r.m && !EP.audio.teacher['w' + r.w.id]) || (only === 'human' && r.m)).forEach(({ w, m }) => {
        const st = EP.audio.teacher['w' + w.id] ? ui.srcTag('teacher') : m ? ui.srcTag('human') : ui.srcTag('tts');
        tbody.appendChild(el('tr', {}, el('td', {}, w.id), el('td', {}, el('b', {}, w.word), el('br'), el('span', { class: 'zh muted' }, w.zh)), el('td', {}, st, EP.audio.clips[w.id] ? ' 📦' : EP.audio.offline[w.id] ? ' 💾' : m ? ' ☁️' : ''),
          el('td', {}, m ? m.a : ''), el('td', {}, m ? el('span', {}, m.by, el('br'), el('span', { class: 'muted' }, m.lic)) : '—'),
          el('td', {}, m ? (m.t || '').replace('T', ' ').replace('Z', ' UTC') : '—'), el('td', {}, m && m.n ? el('span', { class: 'muted' }, m.n) : ''),
          el('td', {}, el('button', { class: 'btn small', onclick: () => EP.audio.play(w) }, '🔊'), m ? el('a', { class: 'btn small', href: m.p, target: '_blank', rel: 'noopener' }, '↗') : el('button', { class: 'btn small purple', onclick: () => ui.show('teacher', 'record') }, '🎙️'))));
      });
    };
    const filter = el('select', { 'aria-label': 'Filter words 篩選單字', onchange: (e) => { only = e.target.value; render(); } }, [['all', 'All 全部'], ['human', 'Real human 有真人發音'], ['missing', 'Missing 缺少真人發音']].map(([v, t]) => el('option', { value: v }, t)));
    render();
    return el('div', {},
      el('div', { class: 'panel', style: { marginBottom: '12px' } },
        el('h3', {}, '🔊 Real human pronunciation tracker 真人發音追蹤'),
        el('div', { class: 'stat-row' }, el('div', { class: 'stat' }, el('b', {}, `${human}/700`), 'Found 找到真人錄音'), el('div', { class: 'stat' }, el('b', {}, `${EP.words.filter((w) => EP.audio.source(w) !== 'tts').length}/700`), 'Plays here 這台可播放'), el('div', { class: 'stat' }, el('b', {}, bundled), '📦 Built-in 內建'), el('div', { class: 'stat' }, el('b', {}, offline), '💾 Saved on this device 已存本機'), el('div', { class: 'stat' }, el('b', {}, teacher), '🎙️ Teacher 老師錄音'), el('div', { class: 'stat' }, el('b', {}, 700 - human - teacher), 'Computer voice 電腦語音')),
        el('p', { class: 'zh' }, '規則（自動執行、不再詢問）：每個單字自動搜尋維基詞典／維基共享資源上的真人錄音（優先美式發音、必須與單字完全相符），有就自動下載使用並記錄來源、錄音者、授權與時間；找不到才用電腦語音，並列入「缺少」清單供老師錄音補齊。'),
        EP.hosted ? el('p', { class: 'zh', style: { background: 'var(--paper)', padding: '10px', borderRadius: '12px' } }, 'ℹ️ 線上版只能播放內建的錄音，無法直接連到維基共享資源。讓所有學生都聽到真人發音：在下載版的教師專區按「下載全部真人發音並匯出發音包」，把 passport-real-voices.json 放進 Google 雲端硬碟「土城國小 英語護照」資料夾，Claude 每 3 小時檢查一次並自動內建到這個連結。只想先讓這台裝置有真人發音，也可以按下面的「匯入發音包」。') : null,
        EP.hosted ? null : el('div', { class: 'panel', style: { background: 'var(--paper)', margin: '8px 0' } },
          el('b', { class: 'zh' }, '⭐ 讓線上版的所有學生都聽到真人發音（一次就好）'),
          el('ol', { class: 'zh', style: { margin: '6px 0 8px', paddingLeft: '22px' } },
            el('li', {}, '按下面的綠色大按鈕：自動下載全部真人發音並匯出「passport-real-voices.json」。'),
            el('li', {}, '把這個檔案放進 Google 雲端硬碟「土城國小 英語護照」資料夾（或直接傳給 Claude）。'),
            el('li', {}, 'Claude 會自動檢查並把錄音內建到線上版連結，所有學生打開就有真人發音。')),
          el('button', { class: 'btn go big', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; const r = await EP.audio.cacheAll((d, t, ok, f) => { prog.textContent = `⬇️ ${d}/${t} · ✔ ${ok} · ✘ ${f}`; }); prog.textContent = `✅ ${r.ok}/${r.total}` + (r.fail ? ` · ${r.fail} failed 失敗（網路），可再按一次補齊` : ''); await ui.exportVoices(); b.disabled = false; } }, '⬇️📤 下載全部真人發音並匯出發音包')),
        el('div', { class: 'row' }, EP.hosted ? null : el('button', { class: 'btn go', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; const r = await EP.audio.cacheAll((d, t, ok, f) => { prog.textContent = `⬇️ ${d}/${t} · ✔ ${ok} · ✘ ${f}`; }); b.disabled = false; prog.textContent = `✅ Saved ${r.ok}/${r.total} recordings on this device 已下載到本機（離線可用）` + (r.fail ? ` · ${r.fail} failed (network) 失敗，可再按一次` : ''); } }, '⬇️ Download all real voices for offline 下載全部真人發音（離線用）'),
          el('button', { class: 'btn', onclick: () => ui.trackingCSV() }, '📄 Tracking sheet CSV 追蹤表'),
          el('button', { class: 'btn', onclick: () => ui.exportVoices() }, '📤 Export voice pack 匯出發音包'),
          el('label', { class: 'btn' }, '📥 Import voice pack 匯入發音包', el('input', { type: 'file', accept: '.json', class: 'hidden', onchange: (e) => ui.importVoices(e.target.files[0]) })), filter), prog,
        el('p', { class: 'muted' }, '📦 built into the game · 💾 saved on this device · ☁️ streamed from Wikimedia Commons when online')),
      el('div', { class: 'panel scroll' }, el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['#', 'Word', 'Voice', 'Accent', 'Recorded by · License', 'Found / downloaded (UTC)', 'Note', ''].map((h) => el('th', {}, h)))), tbody)));
  };
  ui.trackingCSV = function () {
    const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['id', 'level', 'word', 'zh', 'voice', 'accent', 'recorded_by', 'license', 'commons_file', 'commons_page', 'found_or_downloaded_utc', 'note'];
    const lines = [head.join(',')].concat(EP.words.map((w) => { const m = EP.audio.manifest[w.id]; const src = EP.audio.teacher['w' + w.id] ? 'teacher' : m ? (EP.audio.clips[w.id] ? 'human-built-in' : EP.audio.offline[w.id] ? 'human-saved-on-device' : 'human-stream') : 'computer-voice';
      return [w.id, w.level, w.word, w.zh, src, m ? m.a : '', m ? m.by : '', m ? m.lic : '', m ? m.f : '', m ? m.p : '', m ? m.t : '', m ? m.n : ''].map(q).join(','); }));
    ui.download('真人發音追蹤表.csv', '\ufeff' + lines.join('\n'), 'text/csv');
  };
  /** Real-voice pack: move saved Commons recordings between devices or into the hosted version */
  ui.exportVoices = async function () {
    const db = await EP.rec.open(); const items = {};
    const toData = (blob) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    if (db) await new Promise((res) => { const req = db.transaction('human', 'readonly').objectStore('human').openCursor(); req.onsuccess = async () => { const c = req.result; if (c) { items[c.key] = c.value.blob; c.continue(); } else res(); }; req.onerror = res; });
    const out = {}; for (const id in items) out[id] = await toData(items[id]);
    for (const id in EP.audio.clips) if (!out[id]) out[id] = EP.audio.clips[id];
    const n = Object.keys(out).length; if (!n) return ui.toast('Download the real voices first 請先按「下載全部真人發音」', '⬇️');
    const files = {}; for (const id in out) files[id] = (EP.audio.manifest[id] || {}).f || '';
    ui.download('passport-real-voices.json', JSON.stringify({ app: 'epwt', kind: 'voices', version: 2, at: new Date().toISOString(), source: 'Wikimedia Commons MP3 transcodes, saved by this browser (see Credits)', files, items: out }));
  };
  ui.importVoices = async function (file) {
    if (!file) return;
    try {
      const d = JSON.parse(await file.text()); if (d.kind !== 'voices') throw 0;
      const db = await EP.rec.open(); let n = 0;
      for (const id in d.items) {
        if (!EP.audio.manifest[id]) continue; // only recordings that are in the tracked manifest
        const blob = await (await fetch(d.items[id])).blob();
        if (db) await new Promise((res) => { const tx = db.transaction('human', 'readwrite'); tx.objectStore('human').put({ blob, at: new Date().toISOString(), f: EP.audio.manifest[id].f }, id); tx.oncomplete = res; tx.onerror = res; });
        EP.audio.offline[id] = URL.createObjectURL(blob); n++;
      }
      ui.toast(`Imported ${n} real voices 已匯入 ${n} 個真人發音`, '📥'); ui.show('teacher', 'audio');
    } catch (e) { ui.toast('Not a voice pack 不是發音包檔案', '⚠️'); }
  };
  ui.teacherTabs.record = function () {
    const missing = EP.words.filter((w) => !EP.audio.manifest[w.id]);
    let list = missing; let kind = 'w';
    const tbody = el('tbody');
    const supported = !!(navigator.mediaDevices && window.MediaRecorder);
    const render = () => {
      tbody.innerHTML = '';
      list.forEach((w) => {
        const key = kind + w.id; const has = !!EP.audio.teacher[key];
        const recBtn = el('button', { class: 'btn small red', disabled: !supported, onclick: () => record(w, key, recBtn) }, has ? '🔁 Re-record 重錄' : '⏺ Record 錄音');
        tbody.appendChild(el('tr', {}, el('td', {}, w.id), el('td', {}, el('b', {}, kind === 's' ? w.sentence : w.word), el('br'), el('span', { class: 'zh muted' }, kind === 's' ? w.sentenceZh : w.zh)),
          el('td', {}, has ? ui.srcTag('teacher') : ui.srcTag(kind === 'w' && EP.audio.manifest[w.id] ? 'human' : 'tts')),
          el('td', {}, recBtn, has ? el('button', { class: 'btn small', onclick: () => EP.audio.play(w, { sentence: kind === 's' }) }, '▶') : null, has ? el('button', { class: 'btn small', onclick: async () => { await EP.rec.del(key); render(); } }, '🗑') : null)));
      });
    };
    async function record(w, key, btn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream); const chunks = [];
        mr.ondataavailable = (e) => chunks.push(e.data);
        mr.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); await EP.rec.put(key, blob, { word: w.word }); EP.sfx.coin(); ui.toast(`Saved 已儲存：${w.word}`, '🎙️'); render(); };
        mr.start(); btn.textContent = '⏹ Stop 停止'; btn.onclick = () => mr.stop();
        setTimeout(() => mr.state === 'recording' && mr.stop(), kind === 's' ? 8000 : 4000);
      } catch (e) { ui.toast('Microphone not available 無法使用麥克風：' + e.message, '⚠️'); }
    }
    const pick = el('select', { 'aria-label': 'Choose what to record 選擇錄音項目', onchange: (e) => { const v = e.target.value; kind = v === 'sent' ? 's' : 'w'; list = v === 'missing' ? missing : v === 'sent' ? EP.words : EP.words; render(); } }, [['missing', `Words without a real recording 缺真人發音的字 (${missing.length})`], ['all', 'All words 全部單字（覆蓋）'], ['sent', 'Example sentences 例句（700）']].map(([v, t]) => el('option', { value: v }, t)));
    render();
    return el('div', {},
      el('div', { class: 'panel', style: { marginBottom: '12px' } }, el('h3', {}, '🎙️ Recording studio 錄音室'),
        el('p', { class: 'zh' }, '請外師或英語老師錄下缺少真人發音的單字與例句。錄音存在這台裝置，遊戲會自動優先播放老師錄音。可「匯出」錄音包給其他裝置匯入。'),
        supported ? null : el('p', { class: 'zh', style: { color: 'var(--coral)' } }, '此瀏覽器不支援錄音（請用 Chrome / Edge / Safari 新版）。'),
        el('div', { class: 'row' }, pick, el('button', { class: 'btn', onclick: () => ui.exportRecordings() }, '📤 Export pack 匯出錄音包'), el('label', { class: 'btn' }, '📥 Import 匯入', el('input', { type: 'file', accept: '.json', class: 'hidden', onchange: (e) => ui.importRecordings(e.target.files[0]) })))),
      el('div', { class: 'panel scroll' }, el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['#', 'Text', 'Voice now', ''].map((h) => el('th', {}, h)))), tbody)));
  };
  ui.exportRecordings = async function () {
    const all = await EP.rec.all(); const out = [];
    for (const r of all) { const b64 = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(r.blob); }); out.push({ key: r.key, word: r.word, at: r.at, data: b64 }); }
    ui.download('passport-teacher-recordings.json', JSON.stringify({ app: 'epwt', kind: 'recordings', at: new Date().toISOString(), items: out }));
  };
  ui.importRecordings = async function (file) {
    if (!file) return; try {
      const d = JSON.parse(await file.text()); let n = 0;
      for (const it of d.items || []) { const blob = await (await fetch(it.data)).blob(); await EP.rec.put(it.key, blob, { word: it.word }); n++; }
      ui.toast(`Imported ${n} recordings 已匯入`, '📥'); ui.show('teacher', 'record');
    } catch (e) { ui.toast('Import failed 匯入失敗', '⚠️'); }
  };
  /** Save a text file: hosted pages use the viewer's download capability; standalone pages use a normal download;
   *  if neither can run (sandboxed frame), the text is offered to copy. */
  ui.download = async function (name, text, type) {
    if (window.claude && typeof window.claude.use === 'function') {
      try {
        const d = await window.claude.use('downloads');
        if (d) { try { await d.save({ filename: name, data: text }); return; } catch (e) { if (e && e.code === 'declined') return; } }
      } catch (e) { /* fall through */ }
    }
    let anchorOk = false;
    try { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: type || 'application/json' })), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 100); anchorOk = window.top === window; } catch (e) {}
    if (anchorOk) return;
    const ta = el('textarea', { readonly: true, style: { width: '100%', height: '40vh', fontFamily: 'monospace', fontSize: '12px' } }); ta.value = text;
    ui.modal(el('div', {}, el('h3', {}, '📄 ', name), el('p', { class: 'zh muted' }, '若檔案沒有自動下載，請按「複製」後貼到記事本或試算表存檔。 If no file was saved, copy the text below.'), ta,
      el('button', { class: 'btn go', onclick: (e) => { const b = e.currentTarget; const ok = () => (b.textContent = '✅ Copied 已複製'); try { navigator.clipboard.writeText(text).then(ok, () => { ta.select(); document.execCommand('copy'); ok(); }); } catch (err) { ta.select(); } } }, '📋 Copy 複製')));
  };
  /** In-page confirmation (window.confirm is not available everywhere) */
  ui.confirm = function (msg, yesLabel, onYes) {
    const m = ui.modal(el('div', { style: { textAlign: 'center' } }, el('h3', { class: 'zh' }, msg), el('div', { class: 'row', style: { justifyContent: 'center' } },
      el('button', { class: 'btn red', onclick: () => { m.close(); onYes(); } }, yesLabel), el('button', { class: 'btn', onclick: () => m.close() }, 'Cancel 取消'))));
  };
  ui.teacherTabs.progress = function () {
    const rows = EP.profiles.map((p) => {
      const stars = EP.levels.map((l) => (p.levels[l.level] || {}).stars || 0);
      return { p, stars, stamps: Object.values(p.levels).filter((x) => x.stamp).length, mastered: Object.values(p.words).filter((x) => x.b >= 4).length, seen: Object.keys(p.words).length, last: p.history.length ? new Date(p.history[p.history.length - 1].t).toLocaleString() : '—' };
    });
    const csv = () => { const head = ['name', 'xp', 'coins', 'stamps', 'mastered', 'seen'].concat(EP.levels.map((l) => 'L' + l.level)); const lines = [head.join(',')].concat(rows.map((r) => [JSON.stringify(r.p.name), r.p.xp, r.p.coins, r.stamps, r.mastered, r.seen].concat(r.stars).join(','))); ui.download('passport-progress.csv', '﻿' + lines.join('\n'), 'text/csv'); };
    // hardest words across every player on this device (at least 2 attempts, ranked by error rate then misses)
    const agg = {};
    EP.profiles.forEach((p) => Object.entries(p.words).forEach(([id, st]) => { const a = agg[id] || (agg[id] = { r: 0, w: 0, players: 0 }); a.r += st.r; a.w += st.w; if (st.w) a.players++; }));
    const hard = Object.entries(agg).filter(([, a]) => a.w > 0 && a.r + a.w >= 2).map(([id, a]) => ({ w: EP.byId[id], a, rate: a.w / (a.r + a.w) })).filter((x) => x.w)
      .sort((x, y) => y.rate - x.rate || y.a.w - x.a.w).slice(0, 20);
    const hardPanel = el('div', { class: 'panel', style: { marginBottom: '12px' } },
      el('h3', {}, '🎯 Most-missed words 最常答錯的字'),
      hard.length ? el('div', {},
        el('div', { class: 'row', style: { marginBottom: '8px' } },
          el('button', { class: 'btn go', onclick: async () => { const res = await EP.runGame('quiz', { items: u.shuffle(hard.map((x) => x.w)).slice(0, 12), pool: EP.words, level: hard[0].w.level, mode: 'review' }); if (res.quit) return ui.show('teacher', 'progress'); ui.results(res); } }, '🔁 Practise these 練習這些字'),
          el('button', { class: 'btn purple', onclick: () => ui.battle({ levels: [], wordIds: hard.map((x) => x.w.id), teams: 4, rounds: 3, time: 20, lucky: true }) }, '🏆 Class Battle with these 用這些字全班對戰')),
        el('div', { class: 'scroll' }, el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['Word 單字', 'Level', 'Wrong 錯', 'Right 對', 'Error rate 錯誤率', 'Players 答錯人數', ''].map((h) => el('th', {}, h)))),
          el('tbody', {}, hard.map((x) => el('tr', {}, el('td', {}, el('b', {}, x.w.word), ' ', el('span', { class: 'zh muted' }, x.w.zh)), el('td', {}, x.w.level), el('td', {}, x.a.w), el('td', {}, x.a.r), el('td', {}, Math.round(x.rate * 100) + '%'), el('td', {}, x.a.players),
            el('td', {}, el('button', { class: 'btn small', 'aria-label': 'Play ' + x.w.word, onclick: () => EP.audio.play(x.w) }, '🔊'))))))))
        : el('p', { class: 'muted zh' }, '學生玩過幾關之後，這裡會列出全班最常答錯的字，可一鍵練習或拿來分組對戰。'));
    return el('div', {}, hardPanel, el('div', { class: 'panel' }, el('div', { class: 'row', style: { justifyContent: 'space-between' } }, el('h3', {}, '📊 Students on this device 本機學生'), el('button', { class: 'btn', onclick: csv }, '📄 Export CSV 匯出')),
      el('div', { class: 'scroll' }, el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['Student', 'XP', 'Stamps', 'Mastered', 'Seen', 'Stars 星星', 'Last played'].map((h) => el('th', {}, h)))),
        el('tbody', {}, rows.map((r) => el('tr', {}, el('td', {}, r.p.avatar, ' ', el('b', {}, r.p.name)), el('td', {}, r.p.xp), el('td', {}, `${r.stamps}/25`), el('td', {}, `${r.mastered}/700`), el('td', {}, r.seen), el('td', { title: r.stars.map((n, i) => `L${i + 1}:${n}`).join(' ') }, `⭐ ${r.stars.reduce((a, b) => a + b, 0)}/75 · ${r.stars.filter((n) => n > 0).length}/25 關`), el('td', {}, r.last))))))));
  };
  ui.teacherTabs.data = function () {
    return el('div', { class: 'panel' }, el('h3', {}, '💾 Backup & reset 備份與重設'),
      el('div', { class: 'row' },
        el('button', { class: 'btn', onclick: () => ui.download('passport-backup.json', JSON.stringify({ app: 'epwt', at: new Date().toISOString(), profiles: EP.profiles, settings: EP.settings })) }, '📤 Backup all players 備份'),
        el('label', { class: 'btn' }, '📥 Restore 還原', el('input', { type: 'file', accept: '.json', class: 'hidden', onchange: async (e) => { try { const d = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(d.profiles)) throw 0; EP.profiles = d.profiles; EP.save(); EP.useProfile(EP.profiles[0].id); ui.toast('Restored 已還原', '✅'); ui.show('home'); } catch (err) { ui.toast('Not a backup file 檔案格式不對', '⚠️'); } } })),
        el('button', { class: 'btn red', onclick: () => ui.confirm(`Reset ${EP.me.name}'s progress? 確定重設目前玩家進度？`, '♻️ Reset 重設', () => { const p = EP.me; p.xp = 0; p.coins = 0; p.levels = {}; p.words = {}; p.history = []; p.streak = { count: 0, last: null, best: 0 }; EP.save(); ui.toast('Reset 已重設'); }) }, '♻️ Reset current player 重設目前玩家'),
        el('button', { class: 'btn red', onclick: () => { if (EP.profiles.length < 2) return ui.toast('Keep at least one player 至少保留一位玩家'); ui.confirm(`Delete ${EP.me.name}? 刪除目前玩家？`, '🗑 Delete 刪除', () => { EP.removeProfile(EP.me.id); EP.useProfile(EP.profiles[0].id); ui.show('home'); }); } }, '🗑 Delete current player 刪除目前玩家')),
      el('p', { class: 'muted zh' }, '進度只存在這台裝置的瀏覽器裡（不會上傳）。換裝置請用「備份／還原」。'));
  };

  /* ---------------- CREDITS: audio licences + why these games (sources) ---------------- */
  const EVIDENCE = [
    [1, 'Pokémon GO', '>20 million weekly active users (Mar 2025, Scopely)', 'https://www.pocketgamer.biz/pokmon-go-has-20m-weekly-active-players-nearly-nine-years-after-its-global-launch'],
    [2, 'Roblox obby', '138 million daily active users (Q3 2026)', 'https://www.securities.io/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion/'],
    [3, 'Fruit Ninja', '>1 billion downloads (2015)', 'https://www.inkl.com/news/fruit-ninja-how-the-slice-and-dice-game-reached-1bn-downloads'],
    [4, 'Subway Surfers', '4 billion downloads (Mar 2023, SYBO)', 'https://sybogames.com/press/4-billion-downloads'],
    [5, 'Kahoot!', '#1 classroom response tool, EdTech Top 40 2025 (Instructure)', 'https://www.instructure.com/edtech-top40'],
    [6, 'osu! / Geometry Dash', 'osu! 19,382 GitHub stars (2026-11-09); Geometry Dash Steam record ~104k players (Jan 2026)', 'https://github.com/ppy/osu'],
    [7, '2048', '13,468 GitHub stars (2026-11-09)', 'https://github.com/gabrielecirulli/2048'],
    [8, 'Blooket Gold Quest', 'Reported #2 classroom response tool, EdTech Top 40 2025', 'https://districtadministration.com/article/edtech-top-40-ranking-highlights-tools-you-could-be-using/'],
    [9, 'Angry Birds', 'Rovio games >5 billion downloads (Apr 2022)', 'https://www.rovio.com/articles/rovio-games-have-surpassed-5-billion-total-downloads/'],
    [10, 'Among Us', '~500 million monthly users at its Nov 2020 peak', 'https://innersloth.com/press-kit-among-us'],
    [11, 'Monopoly GO!', '>$6 billion player spending, fastest ever (Sensor Tower, 2025)', 'https://sensortower.com/blog/monopoly-go-app-revenue-milestone'],
    [12, 'Pac-Man', 'Guinness: most successful coin-operated arcade game', 'https://www.gamespot.com/articles/pac-man-chomps-into-record-books/1100-6126778/'],
    [13, 'Gimkit', 'Popular classroom quiz economy game (≈3M users by 2019)', 'https://www.kiro7.com/news/local/issaquah-student-launches-online-education-business-from-high-school/955941411/'],
    [14, 'Flexbox Froggy', 'One of GitHub\'s most-starred educational games', 'https://github.com/thomaspark/flexboxfroggy'],
    [15, 'Fall Guys / Stumble Guys', 'Fall Guys 50M players in 2 weeks (2022); Stumble Guys >700M downloads (2025)', 'https://www.shacknews.com/article/131233/fall-guys-50-million-free-to-play-xbox-switch'],
    [16, 'Tetris', '>520 million units sold (The Tetris Company); react-tetris 8,731 GitHub stars', 'https://tetris.com/by-the-numbers'],
    [17, 'Candy Crush Saga', '>$20 billion lifetime revenue (King, 2023)', 'https://www.businessofapps.com/data/candy-crush-statistics'],
    [18, 'Plants vs. Zombies / Mindustry', 'Mindustry: 29,727 GitHub stars (2026-11-09), the most of any game in our GitHub search', 'https://github.com/Anuken/Mindustry'],
    [19, 'Mario Kart', 'Mario Kart 8 Deluxe 71.53 million sold (Nintendo IR, 2026-06-30)', 'https://www.nintendo.co.jp/ir/en/finance/software/switch.html'],
    [20, 'Snake / slither.io', 'slither.io ~80M downloads in Q2 2016 (most-downloaded game)', 'https://www.pocketgamer.biz/slitherio-achieved-80-million-downloads'],
    [21, 'Minecraft', '350 million copies sold, best-selling single game (Apr 2025)', 'https://www.vgchartz.com/article/466157/minecraft-sales-top-350-million-units/'],
    [22, 'Wordle', 'Played 4.2 billion times in 2025 (NYT via AP)', 'https://rock102.com/news/030030-this-just-in-from-the-new-york-times-its-first-2-player-game-and-an-evolving-business-model'],
    [23, 'qwerty-learner / Monkeytype', '23,733 and 21,016 GitHub stars (2026-11-09)', 'https://github.com/RealKai42/qwerty-learner'],
    [24, 'Fortnite', '44.7 million players in one day (Nov 2023, Epic)', 'https://www.esports.net/news/fortnite-player-count'],
    [25, 'Clash Royale (Supercell)', 'Supercell games ~290 million monthly players (FY2025)', 'https://gamesbeat.com/supercell-generates-3b-in-2025-revenue-down-4-while-profits-grew/'],
    [0, 'Duolingo (streaks, XP, quests)', '64.9M daily active users, Q3 2026 SEC filing', 'https://www.sec.gov/Archives/edgar/data/0001562088/000162828026069474/q3fy26duolingo9-30x26share.htm'],
  ];
  ui.screens.credits = function () {
    const s = el('div', { class: 'screen' }); s.appendChild(ui.topbar('📜 Credits 授權與來源'));
    const audioRows = EP.words.filter((w) => EP.audio.manifest[w.id]).map((w) => { const m = EP.audio.manifest[w.id]; return el('tr', {}, el('td', {}, w.word), el('td', {}, el('a', { href: m.p, target: '_blank', rel: 'noopener' }, m.f)), el('td', {}, m.by), el('td', {}, m.lic)); });
    s.append(
      el('div', { class: 'panel', style: { marginBottom: '12px' } }, el('h3', {}, '🎮 Why these 25 games? 為什麼選這些遊戲'),
        el('p', { class: 'zh muted' }, '每一關的玩法都改編自全球排行榜上的熱門遊戲或 GitHub 高星遊戲（數字均附來源與日期；不同統計方式不可直接比較）。本遊戲為原創教育作品，與下列公司無關。'),
        el('div', { class: 'scroll' }, el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['Level', 'Model game', 'Evidence', 'Source'].map((h) => el('th', {}, h)))), el('tbody', {}, EVIDENCE.map(([l, g, e, url]) => el('tr', {}, el('td', {}, l || 'All'), el('td', {}, g), el('td', {}, e), el('td', {}, el('a', { href: url, target: '_blank', rel: 'noopener' }, '↗')))))))),
      el('div', { class: 'panel', style: { marginBottom: '12px' } }, el('h3', {}, '📚 Word list 單字表'), el('p', {}, '土城國小英語護照 700 單字（' + (window.EP_DATA.source || '') + '）。Pictures: Unicode emoji.')),
      el('div', { class: 'panel' }, el('h3', {}, `🔊 Real human recordings 真人錄音 (${audioRows.length})`),
        el('p', { class: 'muted' }, 'Recordings by Wikimedia Commons contributors (including Lingua Libre), used under the licence shown for each file (CC BY-SA / CC BY / public domain). Audio was trimmed and volume-normalised. Click a file name for the original and full licence.'),
        el('div', { class: 'scroll' }, el('table', { class: 'data' }, el('thead', {}, el('tr', {}, ['Word', 'File', 'Recorded by', 'Licence'].map((h) => el('th', {}, h)))), el('tbody', {}, audioRows)))));
    return s;
  };
})();
