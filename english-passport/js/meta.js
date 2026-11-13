/* Meta layer: achievements (Xbox/Steam/Minecraft advancements) + Passport Pass (Fortnite-style free season pass) */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, el = u.el;
  const P = () => EP.me;
  const cnt = (k) => (P().counters = P().counters || {}, P().counters[k] || 0);
  const inc = (k, n) => { P().counters = P().counters || {}; P().counters[k] = (P().counters[k] || 0) + (n || 1); };
  const stamps = () => Object.values(P().levels).filter((x) => x.stamp).length;
  const mastered = () => Object.values(P().words).filter((x) => x.b >= 4).length;
  const gamesPlayed = () => new Set(P().history.filter((h) => h.l).map((h) => h.g)).size;
  EP.ACH = [
    { id: 'first', ic: '🐣', zh: '完成第一場遊戲', en: 'Finish your first game', t: () => P().history.length >= 1 },
    { id: 'star3', ic: '🌟', zh: '第一次拿到三顆星', en: 'Get 3 stars', t: () => Object.values(P().levels).some((x) => x.stars >= 3) },
    { id: 'combo10', ic: '🔥', zh: '連續答對 10 題', en: '10 in a row', t: () => cnt('maxCombo') >= 10 },
    { id: 'combo25', ic: '☄️', zh: '連續答對 25 題', en: '25 in a row', t: () => cnt('maxCombo') >= 25 },
    { id: 'stamp1', ic: '🛂', zh: '蓋第一個護照章', en: 'First passport stamp', t: () => stamps() >= 1 },
    { id: 'stamp5', ic: '🧳', zh: '蓋 5 個護照章', en: '5 stamps', t: () => stamps() >= 5 },
    { id: 'stamp12', ic: '🌍', zh: '蓋 12 個護照章', en: '12 stamps', t: () => stamps() >= 12 },
    { id: 'stamp25', ic: '🏆', zh: '集滿 25 個章，環遊世界成功', en: 'World Tour complete', t: () => stamps() >= 25 },
    { id: 'gold1', ic: '🏅', zh: '第一個金色印章（整關精熟）', en: 'First gold stamp', t: () => Object.values(P().levels).some((x) => x.gold) },
    { id: 'words50', ic: '📗', zh: '精熟 50 個單字', en: 'Master 50 words', t: () => mastered() >= 50 },
    { id: 'words200', ic: '📘', zh: '精熟 200 個單字', en: 'Master 200 words', t: () => mastered() >= 200 },
    { id: 'words700', ic: '📚', zh: '精熟全部 700 字', en: 'Master all 700 words', t: () => mastered() >= 700 },
    { id: 'speak10', ic: '🎤', zh: '開口說對 10 個字', en: 'Say 10 words correctly', t: () => cnt('speak') >= 10 },
    { id: 'review30', ic: '🔁', zh: '複習答對 30 個錯過的字', en: 'Fix 30 missed words', t: () => cnt('review') >= 30 },
    { id: 'streak3', ic: '📅', zh: '連續 3 天練習', en: '3-day streak', t: () => (P().streak.best || 0) >= 3 },
    { id: 'streak7', ic: '🗓️', zh: '連續 7 天練習', en: '7-day streak', t: () => (P().streak.best || 0) >= 7 },
    { id: 'games10', ic: '🎮', zh: '玩過 10 款不同遊戲', en: 'Play 10 different games', t: () => gamesPlayed() >= 10 },
    { id: 'games25', ic: '👾', zh: '25 款遊戲全部玩過', en: 'Play all 25 games', t: () => gamesPlayed() >= 25 },
    { id: 'shop', ic: '🛍️', zh: '在商店買第一個造型', en: 'Buy your first item', t: () => (P().owned || []).length >= 1 },
    { id: 'learn', ic: '📖', zh: '在學習卡聽 50 次發音', en: 'Listen 50 times on cards', t: () => cnt('listen') >= 50 },
  ];
  EP.checkAchievements = function () {
    const p = P(); p.ach = p.ach || {}; let got = [];
    for (const a of EP.ACH) if (!p.ach[a.id]) { let ok = false; try { ok = a.t(); } catch (e) {} if (ok) { p.ach[a.id] = Date.now(); got.push(a); } }
    if (got.length) { EP.save(); got.forEach((a, i) => setTimeout(() => { EP.sfx.levelUp(); EP.ui.toast(`Achievement 成就解鎖：${a.zh}`, a.ic); }, 600 + i * 900)); EP.addCoins(20 * got.length); }
    return got;
  };
  // listen to game events
  const origQuest = EP.questEvent;
  EP.questEvent = function (key, amount, isMax) {
    if (EP.me) { if (key === 'combo') { if (amount > cnt('maxCombo')) { P().counters = P().counters || {}; P().counters.maxCombo = amount; } } else if (key === 'speak' || key === 'review' || key === 'listen') inc(key, amount); }
    return origQuest(key, amount, isMax);
  };

  /* Passport Pass: free tiers every 250 XP, rewards claimed on the home screen */
  const REWARDS = [['🪙', 40], ['🎀', 'hat'], ['🪙', 60], ['🚁', 'vehicle'], ['🪙', 80], ['🦉', 'avatar'], ['🪙', 100], ['🎓', 'hat'], ['🪙', 120], ['🛸', 'vehicle'], ['🪙', 150], ['🦄', 'avatar'], ['🪙', 200], ['👑', 'hat'], ['🪙', 250], ['🐲', 'avatar'], ['🪙', 300], ['🚀', 'vehicle'], ['🪙', 400], ['🧙', 'avatar']];
  EP.pass = {
    per: 250,
    tier() { return Math.min(REWARDS.length, Math.floor(P().xp / this.per)); },
    claimable() { const c = P().passClaimed || 0; return Math.max(0, this.tier() - c); },
    claim() {
      const p = P(); p.passClaimed = p.passClaimed || 0; const out = [];
      while (p.passClaimed < this.tier()) {
        const [ic, what] = REWARDS[p.passClaimed]; p.passClaimed++;
        if (typeof what === 'number') EP.addCoins(what); else { p.owned = p.owned || []; const key = what + ':' + ic; if (!p.owned.includes(key)) p.owned.push(key); }
        out.push(ic + (typeof what === 'number' ? '+' + what : ''));
      }
      EP.save(); return out;
    },
    widget() {
      const t = this.tier(), c = this.claimable(); const into = P().xp % this.per;
      const next = REWARDS[Math.min(t, REWARDS.length - 1)];
      return el('div', { class: 'panel', style: { marginTop: '16px' } },
        el('div', { class: 'row', style: { justifyContent: 'space-between' } }, el('h3', { style: { margin: 0 } }, `🎫 Passport Pass · Tier ${t}/${REWARDS.length}`),
          c ? el('button', { class: 'btn primary', onclick: () => { const got = EP.pass.claim(); EP.sfx.chest(); EP.ui.toast('Rewards 獎勵：' + got.join(' '), '🎫'); EP.ui.show('home'); } }, `🎁 Claim ${c} 領取`) : el('span', { class: 'muted zh' }, `下一個獎勵：${next[0]}`)),
        el('div', { class: 'row', tabindex: '0', role: 'group', 'aria-label': 'Passport Pass rewards 通行證獎勵', style: { gap: '6px', marginTop: '8px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' } }, REWARDS.map(([ic, w], i) => el('div', { style: { minWidth: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', background: i < (P().passClaimed || 0) ? 'var(--grass)' : i < t ? 'var(--gold)' : 'var(--line)', opacity: i < t ? 1 : 0.6 } }, ic))),
        el('div', { class: 'meter', style: { marginTop: '6px' } }, el('i', { style: { width: (t >= REWARDS.length ? 100 : (into / this.per) * 100) + '%' } })),
        el('div', { class: 'muted zh', style: { fontSize: '.85rem' } }, '每 250 XP 升一階，免費領取金幣與造型（不用花錢、沒有抽獎）'));
    },
  };

  // hook into screens: home shows pass, passport shows achievements, results and stamps check achievements
  const ui = EP.ui;
  const home = ui.screens.home;
  ui.screens.home = function () { const s = home(); const q = s.querySelector('.panel'); q ? q.before(EP.pass.widget()) : s.append(EP.pass.widget()); setTimeout(() => EP.checkAchievements(), 300); return s; };
  const pass = ui.screens.passport;
  ui.screens.passport = function () {
    const s = pass(); const p = P(); p.ach = p.ach || {};
    s.append(el('h3', { style: { color: '#fff', margin: '18px 0 8px' } }, `🏆 Achievements 成就 ${Object.keys(p.ach).length}/${EP.ACH.length}`),
      el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' } }, EP.ACH.map((a) => el('div', { class: 'panel', style: { textAlign: 'center', padding: '12px', opacity: p.ach[a.id] ? 1 : 0.45 } }, el('div', { style: { fontSize: '2.2rem', filter: p.ach[a.id] ? '' : 'grayscale(1)' } }, a.ic), el('div', { class: 'zh', style: { fontWeight: 800 } }, a.zh), el('div', { class: 'muted', style: { fontSize: '.8rem' } }, a.en)))));
    return s;
  };
  const results = ui.results;
  ui.results = function (res) { results(res); setTimeout(() => EP.checkAchievements(), 2600); };
})();
