/* Menus part 1: home, profiles, world map, level card, results, learn cards, stamp test, passport book */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, el = u.el;
  const ui = EP.ui;
  const app = () => document.getElementById('app');
  const LV = (n) => EP.levels[n - 1];

  ui.show = function (name, arg) {
    EP.audio.stop();
    const fn = ui.screens[name]; if (!fn) return;
    const a = app(); a.innerHTML = ''; window.scrollTo(0, 0);
    const scr = fn(arg); if (scr) a.appendChild(scr);
    ui.current = name;
  };
  ui.screens = {};
  ui.modal = function (content, opts) {
    opts = opts || {};
    const back = el('div', { class: 'modal-back', onclick: (e) => { if (e.target === back && !opts.sticky) close(); } });
    const m = el('div', { class: 'modal', style: opts.wide ? { width: 'min(980px,100%)' } : null }, el('button', { class: 'close', 'aria-label': 'Close', onclick: () => close() }, '✕'), content);
    back.appendChild(m); document.body.appendChild(back);
    function close() { back.remove(); EP.audio.stop(); opts.onClose && opts.onClose(); }
    return { close, el: m };
  };
  ui.srcTag = function (src) {
    const t = { human: ['human', '真人發音'], teacher: ['teacher', '老師錄音'], tts: ['tts', '電腦語音'] }[src] || ['tts', '電腦語音'];
    return el('span', { class: 'src-tag ' + t[0] }, t[1]);
  };
  ui.unlocked = function (n) { if (n <= 1 || EP.settings.unlockAll) return true; const p = EP.me.levels[n - 1]; return !!(p && (p.stars > 0 || p.stamp)); };
  ui.avatar = function (p, size) {
    p = p || EP.me; const s = size || 46;
    return el('span', { class: 'avatar', style: { width: s + 'px', height: s + 'px', fontSize: s * 0.62 + 'px' } }, p.avatar, p.equip && p.equip.hat ? el('span', { class: 'hat' }, p.equip.hat) : null);
  };
  function topbar(title, extra) {
    const lv = EP.levelOf(EP.me.xp);
    return el('div', { class: 'topbar' },
      el('button', { class: 'icon-btn', title: 'Home', onclick: () => ui.show('home') }, '🏠'),
      title ? el('h2', {}, title) : null, el('div', { class: 'grow' }), extra || null,
      el('span', { class: 'chip' }, '🔥 ', EP.me.streak.count || 0),
      el('span', { class: 'chip' }, '🪙 ', EP.me.coins),
      el('span', { class: 'chip' }, 'Lv ', lv.lv));
  }
  ui.topbar = topbar;

  /* ---------------- HOME ---------------- */
  ui.screens.home = function () {
    const p = EP.me; const lv = EP.levelOf(p.xp);
    const vh = ui.voiceHome ? ui.voiceHome() : { btn: null, banner: null };
    const due = EP.srs.due(99).length;
    const stamps = Object.values(p.levels).filter((x) => x.stamp).length;
    const mastered = Object.values(p.words).filter((s) => s.b >= 4).length;
    const s = el('div', { class: 'screen' });
    const head = el('div', { class: 'topbar' },
      el('button', { class: 'profile-pill', onclick: () => ui.profiles() }, ui.avatar(p), el('div', { style: { textAlign: 'left' } }, el('div', {}, p.name), el('div', { class: 'xpbar' }, el('i', { style: { width: (lv.into / lv.need) * 100 + '%' } })))),
      el('div', { class: 'grow' }),
      el('span', { class: 'chip' }, '🔥 ', p.streak.count || 0, ' 天'), el('span', { class: 'chip' }, '🪙 ', p.coins), el('span', { class: 'chip' }, '⭐ Lv ', lv.lv),
      el('button', { class: 'icon-btn', title: 'Sound', onclick: (e) => { EP.settings.music = !EP.settings.music; EP.saveSettings(); e.currentTarget.textContent = EP.settings.music ? '🎵' : '🔇'; } }, EP.settings.music ? '🎵' : '🔇'));
    const hero = el('div', { class: 'home-hero' },
      el('div', { class: 'passport-cover', onclick: () => ui.show('passport') }, el('div', { class: 't3' }, '土城國小 TUCHENG ELEMENTARY'), el('div', { class: 'emb' }, '🌏'), el('div', { class: 't1' }, 'PASSPORT'), el('div', { class: 't2 zh' }, '英語護照'), el('div', { class: 't3' }, `${stamps} / 25 stamps · ${mastered} / 700 words`)),
      el('div', { class: 'hero-text' }, el('h1', { class: 'home-title' }, 'English Passport World Tour'), el('p', { class: 'home-sub zh' }, '英語護照環遊世界 · 25 個國家 · 25 款冠軍遊戲 · 700 個單字'),
        el('div', { class: 'row', style: { marginTop: '12px' } }, el('button', { class: 'btn go big', onclick: () => { const nx = EP.levels.find((l) => ui.unlocked(l.level) && !(EP.me.levels[l.level] || {}).stars) || EP.levels.filter((l) => ui.unlocked(l.level)).pop(); ui.show('map'); setTimeout(() => ui.levelCard(nx.level), 350); } }, '▶ Continue 繼續旅程'), vh.btn)));
    const card = (ic, title, sub, bg, fn, badge) => el('button', { class: 'menu-card', style: { background: bg }, onclick: fn }, badge ? el('span', { class: 'badge' }, badge) : null, el('span', { class: 'ic' }, ic), el('div', {}, el('b', {}, title), el('br'), el('small', { class: 'zh' }, sub)));
    const menu = el('div', { class: 'home-menu' },
      card('🌍', 'World Tour', '環遊世界：25 關冒險', 'linear-gradient(135deg,#ff922b,#f76707)', () => ui.show('map')),
      card('🏆', 'Class Battle', '班級分組對戰（投影用）', 'linear-gradient(135deg,#7950f2,#5f3dc4)', () => ui.show('battleSetup')),
      card('🔁', 'Review Rush', '錯題複習：答錯的字回來了', 'linear-gradient(135deg,#f03e3e,#c92a2a)', () => ui.startReview(), due ? String(due) : null),
      card('📚', 'Word-dex', '單字圖鑑：收集 700 字', 'linear-gradient(135deg,#20c997,#0ca678)', () => ui.show('wordex')),
      card('🛂', 'My Passport', '我的護照：25 個印章', 'linear-gradient(135deg,#364fc7,#1b2a6b)', () => ui.show('passport')),
      card('🛍️', 'Shop', '商店：角色與帽子', 'linear-gradient(135deg,#f783ac,#d6336c)', () => ui.show('shop')),
      card('🏅', 'Hall of Fame', '名人堂：本機玩家排行', 'linear-gradient(135deg,#fab005,#e67700)', () => ui.show('fame')),
      card('👩‍🏫', 'Teacher', '教師專區：設定、真人發音、進度', 'linear-gradient(135deg,#495057,#212529)', () => ui.teacherGate()));
    const quests = el('div', { class: 'panel', style: { marginTop: '16px' } }, el('h3', {}, '🎯 Daily Quests 每日任務'), ...EP.daily().map((q) => el('div', { class: 'row', style: { justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' } },
      el('div', { style: { flex: 1, minWidth: '180px' } }, el('b', { class: 'zh' }, q.zh), ' ', el('span', { class: 'muted' }, q.en), el('div', { class: 'meter', style: { marginTop: '4px' } }, el('i', { style: { width: (q.n / q.goal) * 100 + '%' } }))),
      el('span', { class: 'chip light' }, `${q.n}/${q.goal}`),
      q.claimed ? el('span', { class: 'chip light' }, '✅') : el('button', { class: 'btn small ' + (q.done ? 'primary' : ''), disabled: !q.done, onclick: () => { const dq = EP.me.daily.quests.find((x) => x.id === q.id); dq.claimed = true; EP.addCoins(q.coins); EP.save(); EP.sfx.coin(); ui.toast(`+${q.coins} 🪙`, '🎯'); ui.show('home'); } }, `🪙 ${q.coins}`))));
    s.append(head, hero, vh.banner, menu, quests, el('p', { class: 'muted', style: { textAlign: 'center', color: 'rgba(255,255,255,.8)', marginTop: '16px' } }, '🔊 Real human voices from Wikimedia Commons · 真人發音來源：維基共享資源（CC 授權）· ', el('a', { href: '#', style: { color: '#fff' }, onclick: (e) => { e.preventDefault(); ui.show('credits'); } }, 'Credits 授權與來源')));
    return s;
  };

  /* ---------------- PROFILES ---------------- */
  ui.profiles = function () {
    const box = el('div');
    const render = () => {
      box.innerHTML = '';
      box.append(el('h2', {}, '👥 Who is playing? 誰要玩？'));
      const grid = el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } });
      EP.profiles.forEach((p) => {
        const lv = EP.levelOf(p.xp).lv;
        grid.appendChild(el('button', { class: 'panel', style: { textAlign: 'center', outline: p === EP.me ? '4px solid var(--gold)' : '' }, onclick: () => { EP.useProfile(p.id); m.close(); ui.show('home'); } }, ui.avatar(p, 60), el('div', { style: { fontWeight: 900, marginTop: '6px' } }, p.name), el('div', { class: 'muted' }, `Lv ${lv} · 🪙 ${p.coins}`)));
      });
      box.append(grid);
      const name = el('input', { type: 'text', placeholder: 'Name 名字 / 座號', maxlength: 16, style: { flex: 1 } });
      let av = u.pick(EP.AVATARS_FREE);
      const avs = el('div', { class: 'row' }, EP.AVATARS_FREE.map((a) => el('button', { class: 'avatar', style: { cursor: 'pointer', outline: a === av ? '3px solid var(--purple)' : '' }, onclick: (e) => { av = a; avs.querySelectorAll('.avatar').forEach((b) => (b.style.outline = '')); e.currentTarget.style.outline = '3px solid var(--purple)'; } }, a)));
      box.append(el('h3', { style: { marginTop: '18px' } }, '➕ New player 新增玩家'), avs, el('div', { class: 'row', style: { marginTop: '10px' } }, name, el('button', { class: 'btn go', onclick: () => { const n = name.value.trim(); if (!n) return name.focus(); const p = EP.addProfile(n, av); EP.useProfile(p.id); m.close(); ui.show('home'); ui.toast(`Welcome, ${n}! 歡迎`, av); } }, 'Create 建立')));
    };
    const m = ui.modal(box); render();
  };

  /* ---------------- WORLD MAP (saga path) ---------------- */
  ui.screens.map = function () {
    const s = el('div', { class: 'screen' });
    s.appendChild(topbar('🌍 World Tour 環遊世界'));
    const n = EP.levels.length; const stepY = 150; const H = n * stepY + 160;
    const wrap = el('div', { class: 'map-wrap', style: { height: H + 'px' } });
    const pts = EP.levels.map((l, i) => ({ x: 50 + Math.sin(i * 0.95) * 30, y: H - 110 - i * stepY }));
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'map-svg'); svg.setAttribute('viewBox', `0 0 100 ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
    let d = `M ${pts[0].x} ${pts[0].y}`; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; d += ` C ${a.x} ${a.y - stepY / 2}, ${b.x} ${b.y + stepY / 2}, ${b.x} ${b.y}`; }
    const mk = (stroke, w, dash) => { const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', w); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('vector-effect', 'non-scaling-stroke'); if (dash) p.setAttribute('stroke-dasharray', dash); return p; };
    svg.append(mk('rgba(120,80,20,.25)', 26), mk('#fff7e0', 18), mk('#e0b96a', 4, '2 14'));
    wrap.appendChild(svg);
    // scenery
    const deco = ['☁️', '🌴', '⛰️', '🌊', '🏝️', '🌲', '🎈', '🐦', '🗻', '🌵'];
    for (let i = 0; i < n * 1.6; i++) wrap.appendChild(el('div', { style: { position: 'absolute', left: (i % 2 ? u.rand(2, 18) : u.rand(80, 96)) + '%', top: u.rand(20, H - 40) + 'px', fontSize: u.rand(24, 44) + 'px', opacity: 0.85, pointerEvents: 'none' } }, u.pick(deco)));
    let current = 1;
    EP.levels.forEach((l, i) => {
      const prog = EP.me.levels[l.level] || {}; const open = ui.unlocked(l.level);
      if (open) current = l.level;
      const node = el('div', { class: 'map-node' + (open ? '' : ' locked'), style: { left: pts[i].x + '%', top: pts[i].y + 'px' } },
        el('button', { class: 'dot', style: { borderColor: open ? l.color : '' }, 'aria-label': `Level ${l.level} ${l.city}`, onclick: () => (open ? ui.levelCard(l.level) : ui.toast('Finish the level before to unlock! 先完成前一關才能解鎖', '🔒')) },
          open ? l.icon : '🔒', el('span', { class: 'num' }, l.level), prog.stamp ? el('span', { class: 'stampmark' }, prog.gold ? '🏅' : '🛂') : null),
        el('div', { class: 'city' }, l.city, el('br'), el('span', { class: 'zh', style: { fontSize: '.8rem' } }, l.cityZh)),
        el('div', { class: 'stars' }, prog.stars ? '⭐'.repeat(prog.stars) + '☆'.repeat(3 - prog.stars) : open ? '☆☆☆' : ''));
      wrap.appendChild(node);
    });
    // current marker = first unlocked level without stars
    const firstOpen = EP.levels.find((l) => ui.unlocked(l.level) && !(EP.me.levels[l.level] || {}).stars) || EP.levels[current - 1];
    const ci = firstOpen.level - 1; firstOpen && wrap.querySelectorAll('.map-node')[ci].classList.add('current');
    const vehicle = EP.me.equip.vehicle || '✈️';
    wrap.appendChild(el('div', { class: 'map-player', style: { left: pts[ci].x + '%', top: pts[ci].y - 30 + 'px' } }, vehicle, el('span', { style: { fontSize: '1.6rem' } }, EP.me.avatar)));
    s.appendChild(wrap);
    setTimeout(() => { const y = wrap.offsetTop + pts[ci].y - innerHeight / 2; window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); }, 60);
    return s;
  };

  /* ---------------- LEVEL CARD ---------------- */
  ui.levelCard = function (n) {
    const l = LV(n); const g = EP.games[l.game]; const prog = EP.me.levels[n] || {};
    const ms = EP.srs.levelMastery(n); const ws = EP.levelWords(n);
    const human = ws.filter((w) => EP.audio.source(w) !== 'tts').length;
    const c = el('div', {},
      el('div', { class: 'level-head' }, el('div', { class: 'big-ic', style: { background: `linear-gradient(135deg,#fff,${l.color}33)` } }, l.icon),
        el('div', {}, el('div', { class: 'muted' }, `Level ${n} 第${n}關 · ${l.city}, ${l.country}`), el('h2', {}, l.titleEn), el('div', { class: 'zh', style: { fontSize: '1.15rem' } }, `${l.cityZh}（${l.countryZh}）· ${l.titleZh}`))),
      el('div', { class: 'inspired' }, '🎮 ', el('b', {}, g ? `${g.icon} ${g.title} ${g.titleZh || ''}` : 'Coming soon'), g ? el('div', { class: 'zh' }, `靈感來自：${g.model}`) : null, g ? el('div', { class: 'muted zh' }, g.howZh) : null),
      el('p', { class: 'zh', style: { margin: '6px 0' } }, '🌏 ', l.factZh, el('br'), el('span', { class: 'muted' }, l.fact)),
      el('div', { class: 'row', style: { justifyContent: 'space-between' } }, el('span', {}, `📚 ${ws.length} words 個單字`), el('span', {}, `🔊 真人發音 ${human}/${ws.length}`, EP.hosted && human < ws.length ? el('span', { class: 'muted zh', style: { fontSize: '.8rem' } }, '（線上版；下載版可播放更多）') : null), el('span', {}, prog.stars ? '⭐'.repeat(prog.stars) : '☆☆☆'), prog.stamp ? el('span', {}, prog.gold ? '🏅 Gold stamp' : '🛂 Stamped') : null),
      el('div', { style: { marginTop: '8px' } }, el('div', { class: 'muted' }, `Mastered 精熟 ${ms.mastered}/${ms.total}`), el('div', { class: 'meter' }, el('i', { style: { width: (ms.mastered / ms.total) * 100 + '%' } }))),
      el('div', { class: 'level-actions' },
        el('button', { class: 'btn blue big', onclick: () => { m.close(); ui.show('learn', { level: n }); } }, '📖 Learn', el('small', {}, '學習卡')),
        el('button', { class: 'btn go big', disabled: !g, onclick: () => { m.close(); ui.play(n); } }, '🎮 Play', el('small', {}, '開始遊戲')),
        el('button', { class: 'btn purple big', onclick: () => { m.close(); ui.stampTest(n); } }, '🛂 Stamp Test', el('small', {}, '護照蓋章考')),
        ui.screens.speak ? el('button', { class: 'btn red big', onclick: () => { m.close(); ui.show('speak', { level: n }); } }, '🎤 Read', el('small', {}, '唸給老師聽')) : null));
    const m = ui.modal(c);
  };

  /* ---------------- PLAY + RESULTS ---------------- */
  ui.play = async function (n, opts) {
    const l = LV(n); const g = EP.games[l.game]; if (!g) return ui.toast('Game not found');
    const res = await EP.runGame(g.id, Object.assign({ level: n }, opts || {}));
    if (res.quit) return ui.show('map');
    ui.results(res);
  };
  ui.results = function (res) {
    const p = EP.me; const n = res.level; const l = LV(n) || LV(1);
    const xp = res.right * 10 + res.stars * 20 + Math.round(res.maxCombo * 2);
    const coins = res.stars * 10 + Math.floor(res.score / 250);
    const lvUp = EP.addXP(xp); EP.addCoins(coins);
    const first = EP.markPlayedToday();
    let newStamp = false;
    if (res.mode === 'level') {
      const pr = p.levels[n] || (p.levels[n] = { stars: 0, best: 0, plays: 0 });
      pr.plays++; pr.best = Math.max(pr.best, res.score); pr.stars = Math.max(pr.stars, res.stars); pr.last = Date.now();
      if (res.stars >= 3) EP.questEvent('star3', 1);
      const ms = EP.srs.levelMastery(n); if (pr.stamp && ms.mastered === ms.total && !pr.gold) { pr.gold = true; newStamp = 'gold'; }
    }
    if (res.mode === 'review') EP.questEvent('review', res.right);
    EP.questEvent('games', 1);
    p.history.push({ t: Date.now(), g: res.gameId, l: n, s: res.score, r: res.right, w: res.wrong, st: res.stars }); if (p.history.length > 300) p.history.shift();
    EP.save();
    const s = el('div', { class: 'screen' });
    const stars = el('div', { class: 'stars' }, [0, 1, 2].map(() => el('span', {}, '⭐')));
    const nextOpen = n < 25 && ui.unlocked(n + 1);
    const panel = el('div', { class: 'panel results', style: { maxWidth: '760px', margin: '0 auto', width: '100%' } },
      el('div', { class: 'muted' }, res.mode === 'review' ? 'Review Rush 錯題複習' : `Level ${n} · ${l.city}`),
      el('h2', { style: { fontSize: '2rem', margin: '4px 0' } }, res.completed ? (res.stars >= 3 ? 'Perfect! 太完美了！' : res.stars >= 2 ? 'Great job! 做得好！' : res.stars >= 1 ? 'Nice! 不錯喔！' : 'Keep trying! 再接再厲！') : 'Keep trying! 再接再厲！'),
      stars,
      el('div', { class: 'stat-row' },
        el('div', { class: 'stat' }, el('b', {}, res.score), 'Score 分數'),
        el('div', { class: 'stat' }, el('b', {}, Math.round(res.acc * 100) + '%'), 'Accuracy 正確率'),
        el('div', { class: 'stat' }, el('b', {}, '🔥 ' + res.maxCombo), 'Best combo 最高連擊'),
        el('div', { class: 'stat' }, el('b', {}, '+' + xp), 'XP 經驗'),
        el('div', { class: 'stat' }, el('b', {}, '🪙 +' + coins), 'Coins 金幣')),
      res.missed.length ? el('div', {}, el('div', { class: 'zh' }, '📝 Practise these 再練習這些字（點一下聽發音）'), el('div', { class: 'missed' }, res.missed.map((w) => el('button', { onclick: () => EP.audio.play(w) }, `🔊 ${w.word} ${w.zh}`)))) : el('p', { class: 'zh' }, '🎉 No mistakes! 全部答對！'),
      el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } },
        el('button', { class: 'btn go big', onclick: () => (res.mode === 'review' ? ui.startReview() : ui.play(n)) }, '🔁 Again 再玩'),
        res.mode === 'level' ? el('button', { class: 'btn blue', onclick: () => ui.show('learn', { level: n, words: res.missed.length ? res.missed : null }) }, '📖 Learn 學習') : null,
        res.mode === 'level' && res.stars >= 1 && !(p.levels[n] || {}).stamp ? el('button', { class: 'btn purple', onclick: () => ui.stampTest(n) }, '🛂 Stamp Test 蓋章考') : null,
        nextOpen && res.mode === 'level' ? el('button', { class: 'btn primary', onclick: () => ui.levelCard(n + 1) }, '➡️ Next 下一關') : null,
        el('button', { class: 'btn', onclick: () => ui.show('map') }, '🗺️ Map 地圖')));
    s.append(topbar(''), panel); ui.show('blank'); app().appendChild(s);
    [...stars.children].forEach((st, i) => setTimeout(() => { if (i < res.stars) { st.classList.add('on'); EP.sfx.pop(); } }, 400 + i * 350));
    if (res.stars >= 2) setTimeout(() => ui.confetti(), 1200);
    if (lvUp) setTimeout(() => { EP.sfx.levelUp(); ui.toast(`Level up! 升級到 Lv ${lvUp}`, '⬆️'); }, 1600);
    if (first) setTimeout(() => ui.toast(`Streak ${EP.me.streak.count} day(s)! 連續 ${EP.me.streak.count} 天`, '🔥'), 2200);
    if (newStamp === 'gold') setTimeout(() => ui.toast('Gold stamp! 金色印章：全部單字精熟！', '🏅'), 2800);
  };
  ui.screens.blank = () => null;

  /* ---------------- LEARN (flash cards) ---------------- */
  ui.screens.learn = function (arg) {
    const n = arg.level; const words = arg.words || EP.levelWords(n); let i = 0;
    const s = el('div', { class: 'screen' }); s.appendChild(topbar(`📖 Learn 學習 · Level ${n}`, el('button', { class: 'btn small ghost', onclick: () => ui.levelCard(n) }, '🎮 Play')));
    const holder = el('div'); s.appendChild(holder);
    EP.audio.ensureLevel(n); EP.audio.preload(words);
    const render = () => {
      const w = words[i]; const pic = EP.pic(w); const cz = EP.cloze(w);
      const sent = cz ? [w.sentence.slice(0, cz.start), el('mark', {}, cz.text), w.sentence.slice(cz.start + cz.text.length)] : [w.sentence];
      const fb = el('div', { style: { minHeight: '28px', fontWeight: 800 } });
      const card = el('div', { class: 'flash' }, el('div', { class: 'flash-inner' },
        el('div', { class: 'muted' }, `No. ${w.id} · ${i + 1} / ${words.length}`),
        pic ? el('div', { class: 'e' }, pic) : null,
        el('div', { class: 'w' }, w.word), el('div', { class: 'z zh' }, w.zh), el('div', { class: 'pos zh' }, w.pos),
        el('div', { class: 'row', style: { justifyContent: 'center' } },
          el('button', { class: 'btn blue', onclick: () => { EP.audio.play(w); EP.questEvent('listen', 1); } }, '🔊 Word 單字 ', ui.srcTag(EP.audio.source(w))),
          el('button', { class: 'btn', onclick: () => EP.audio.play(w, { slow: true }) }, '🐢 Slow 慢速'),
          EP.speech.available ? el('button', { class: 'btn purple', onclick: async (e) => { const b = e.currentTarget; b.textContent = '👂 Listening… 請說'; const r = await EP.speech.listen(w.word); b.textContent = '🎤 Say it 跟著說'; if (r.ok) { fb.textContent = '✅ Great! 說得很好！'; EP.sfx.correct(); EP.questEvent('speak', 1); EP.srs.get(w.id); } else fb.textContent = r.unsupported ? '' : `🤔 I heard “${r.heard || '…'}”. Try again! 再試一次`; } }, '🎤 Say it 跟著說') : null),
        fb,
        el('div', { class: 'sent' }, ...sent), el('div', { class: 'sentzh zh' }, w.sentenceZh),
        el('button', { class: 'btn small', onclick: () => EP.audio.play(w, { sentence: true }) }, '🔊 Sentence 句子 ', ui.srcTag(EP.audio.source(w, 'sentence')))));
      const nav = el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } },
        el('button', { class: 'btn big', disabled: i === 0, onclick: () => { i--; render(); } }, '◀'),
        el('button', { class: 'btn big go', onclick: () => { if (i < words.length - 1) { i++; render(); } else ui.levelCard(n); } }, i < words.length - 1 ? 'Next ▶' : '🎮 Play!'));
      holder.innerHTML = ''; holder.append(card, nav);
      setTimeout(() => { EP.audio.play(w); EP.questEvent('listen', 1); }, 250);
    };
    render();
    return s;
  };

  /* ---------------- STAMP TEST (passport check, 10 mixed questions) ---------------- */
  ui.stampTest = function (n) {
    const l = LV(n); const pool = EP.levelWords(n); const qs = u.shuffle(pool).slice(0, Math.min(10, pool.length));
    let qi = 0, right = 0; const missed = [];
    const s = el('div', { class: 'screen' }); s.appendChild(topbar(`🛂 Stamp Test 護照蓋章考 · ${l.city}`));
    const box = el('div', { class: 'panel', style: { maxWidth: '820px', margin: '0 auto', width: '100%', textAlign: 'center' } }); s.appendChild(box);
    ui.show('blank'); app().appendChild(s);
    const types = ['listen', 'zh', 'pic', 'cloze', 'spell'];
    const ask = () => {
      if (qi >= qs.length) return done();
      const w = qs[qi]; let t = types[qi % types.length];
      if (t === 'pic' && !EP.pic(w)) t = 'listen'; if (t === 'cloze' && !EP.cloze(w)) t = 'zh'; if (t === 'spell' && (EP.spellKey(w).length > 12 || EP.isPhrase(w))) t = 'listen';
      box.innerHTML = '';
      box.append(el('div', { class: 'muted' }, `Question ${qi + 1} / ${qs.length}`), el('div', { class: 'meter', style: { margin: '6px 0 14px' } }, el('i', { style: { width: (qi / qs.length) * 100 + '%' } })));
      const next = (ok) => { if (ok) right++; else missed.push(w); EP.srs.record(w.id, ok); setTimeout(() => { qi++; ask(); }, ok ? 700 : 1600); };
      if (t === 'spell') {
        box.append(el('h3', { class: 'zh' }, '🔤 Spell the word 拼出這個字'), ui.kitPrompt(w), EP.kit.speller({ difficulty: 'normal', say: (x) => EP.audio.play(x) }, w, (ok) => { ok ? EP.sfx.correct() : EP.sfx.wrong(); next(ok); }, { extra: 2 }));
        EP.audio.play(w); return;
      }
      const opts = u.shuffle([w].concat(EP.distractors(w, 3)));
      let prompt;
      if (t === 'listen') { prompt = el('button', { class: 'btn blue big', onclick: () => EP.audio.play(w) }, '🔊 Listen 聽'); EP.audio.play(w); }
      else if (t === 'pic') prompt = el('div', { style: { fontSize: '5rem' } }, EP.pic(w));
      else if (t === 'zh') prompt = el('div', { style: { fontSize: '2.6rem', fontWeight: 900 } }, w.word);
      else { const cz = EP.cloze(w); prompt = el('div', { style: { fontSize: '1.6rem', fontWeight: 800 } }, w.sentence.slice(0, cz.start), ' ____ ', w.sentence.slice(cz.start + cz.text.length), el('div', { class: 'zh muted', style: { fontSize: '1rem' } }, w.sentenceZh)); }
      const q = { listen: 'Which word do you hear? 你聽到哪個字？', pic: 'What is this? 這是什麼？', zh: 'What does it mean? 意思是？', cloze: 'Fill in the blank 填空' }[t];
      const grid = EP.kit.choiceGrid(opts.map((o) => (t === 'zh' ? { label: o.zh, zh: true } : { label: o.word })), (k) => {
        grid.lock(); const ok = opts[k] === w; grid.mark(opts.indexOf(w), k); ok ? EP.sfx.correct() : (EP.sfx.wrong(), EP.audio.play(w)); next(ok);
      });
      grid.el.style.margin = '14px auto 0';
      box.append(el('h3', { class: 'zh' }, q), prompt, grid.el);
    };
    const done = () => {
      const pct = right / qs.length; const pass = pct >= 0.8; const pr = EP.me.levels[n] || (EP.me.levels[n] = { stars: 0, best: 0, plays: 0 });
      let fresh = false; if (pass && !pr.stamp) { pr.stamp = true; pr.stampAt = Date.now(); fresh = true; EP.addCoins(50); EP.addXP(100); }
      const ms = EP.srs.levelMastery(n); if (pr.stamp && ms.mastered === ms.total) pr.gold = true;
      EP.save();
      box.innerHTML = '';
      box.append(el('h2', {}, pass ? 'Passport stamped! 蓋章成功！' : 'Almost! 差一點！'), el('div', { style: { fontSize: '1.4rem' } }, `${right} / ${qs.length}`),
        pass ? el('div', { class: 'pp-stamp', style: { '--sc': l.color, margin: '14px auto' } }, el('span', { class: 'e stamp-anim' }, l.icon), el('b', {}, l.city.toUpperCase()), el('small', {}, new Date().toLocaleDateString())) : el('p', { class: 'zh' }, '需要 80% 才能蓋章，再練習一下吧！ You need 80%.'),
        missed.length ? el('div', { class: 'missed' }, missed.map((w) => el('button', { onclick: () => EP.audio.play(w) }, `🔊 ${w.word} ${w.zh}`))) : null,
        el('div', { class: 'row', style: { justifyContent: 'center' } }, el('button', { class: 'btn go', onclick: () => ui.stampTest(n) }, '🔁 Again 再考'), el('button', { class: 'btn blue', onclick: () => ui.show('learn', { level: n, words: missed.length ? missed : null }) }, '📖 Learn'), el('button', { class: 'btn', onclick: () => ui.show('map') }, '🗺️ Map')));
      if (pass) { EP.sfx.stamp(); if (fresh) { ui.confetti(); ui.toast('+50 🪙 +100 XP', '🛂'); } } else EP.sfx.lose();
    };
    ask();
  };
  ui.kitPrompt = function (w) { const pic = EP.pic(w); return el('div', { class: 'prompt-card', style: { margin: '6px auto 16px' } }, el('button', { class: 'say', onclick: () => EP.audio.play(w) }, '🔊'), pic ? el('div', { class: 'pic' }, pic) : null, el('div', { class: 'zhs zh' }, w.zh)); };

  /* ---------------- PASSPORT BOOK ---------------- */
  ui.screens.passport = function () {
    const s = el('div', { class: 'screen' }); s.appendChild(topbar('🛂 My Passport 我的護照'));
    const p = EP.me; const lv = EP.levelOf(p.xp);
    const idPage = el('div', { class: 'panel', style: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px', background: 'linear-gradient(135deg,#fdf6e3,#f3e5c0)', color: '#4a3b17' } },
      ui.avatar(p, 90), el('div', {}, el('div', { style: { fontSize: '.8rem', letterSpacing: '2px' } }, 'PASSPORT · 護照 · TUCHENG ELEMENTARY SCHOOL 土城國小'), el('div', { style: { fontSize: '1.8rem', fontWeight: 900 } }, p.name), el('div', {}, `Traveller level ${lv.lv} · XP ${p.xp} · 🪙 ${p.coins} · 🔥 best streak ${p.streak.best || 0}`),
        el('div', {}, `Stamps ${Object.values(p.levels).filter((x) => x.stamp).length}/25 · Words mastered ${Object.values(p.words).filter((x) => x.b >= 4).length}/700`)));
    const book = el('div', { class: 'passport-book' }, EP.levels.map((l) => {
      const pr = p.levels[l.level] || {};
      return el('button', { class: 'pp-page' + (pr.stamp ? '' : ' empty') + (pr.gold ? ' gold' : ''), onclick: () => (ui.unlocked(l.level) ? ui.levelCard(l.level) : null) },
        el('div', { style: { fontWeight: 800 } }, `${l.level}. ${l.city}`), el('div', { class: 'pp-stamp', style: { '--sc': l.color } }, el('span', { class: 'e' }, l.icon), el('b', {}, l.country.toUpperCase().slice(0, 12)), el('small', {}, pr.stampAt ? new Date(pr.stampAt).toLocaleDateString() : 'NOT YET')),
        el('div', { class: 'zh', style: { fontSize: '.85rem' } }, l.titleZh));
    }));
    s.append(idPage, book);
    return s;
  };
})();
