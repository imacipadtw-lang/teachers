/* Sentence Listening 句型聽力 — menus: home card, 25-level screen, level card with its 3 games */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, el = u.el, ui = EP.ui, L = EP.listen;
  const best = (id) => ((EP.me.listen || {})[id] || {});
  const starsOf = (id) => best(id).stars || 0;
  const starTxt = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

  L.play = async function (id) {
    const def = L.games[id]; if (!def) return ui.toast('Game not found 找不到遊戲');
    const res = await EP.runGame(id, { level: def.level, mode: 'listen' });
    if (res.quit) { ui.show('listen'); return ui.listenLevel(def.level); }
    ui.results(res);
  };

  ui.listenLevel = function (n) {
    const lv = EP.levels[n - 1]; const specs = L.levelSpecs(n);
    const rows = specs.map((s) => {
      const def = L.games[s.id]; const st = starsOf(s.id);
      return el('div', { class: 'ls-game-row' },
        el('div', { class: 'ic', 'aria-hidden': 'true' }, s.icon),
        el('div', {}, el('b', {}, `${s.title} `), el('span', { class: 'zh' }, s.titleZh),
          el('div', { class: 'zh', style: { fontSize: '.92rem', margin: '2px 0' } }, '📍 ', s.context),
          el('div', { class: 'muted zh', style: { fontSize: '.85rem' } }, `🎯 ${s.skill} · ${starTxt(st)}`)),
        def ? el('button', { class: 'btn go', onclick: () => { m.close(); L.play(s.id); } }, '▶ Play') : el('span', { class: 'chip' }, 'Coming soon 製作中'));
    });
    const m = ui.modal(el('div', {},
      el('div', { class: 'muted' }, `🎧 Sentence Listening 句型聽力 · Level ${n} 第${n}關`),
      el('h2', { style: { margin: '2px 0' } }, lv.titleEn, ' ', el('span', { class: 'zh', style: { fontSize: '1.1rem' } }, lv.titleZh)),
      el('p', { class: 'muted zh', style: { margin: '4px 0' } }, '三款遊戲玩法都不一樣，都只用這一關工作表上的例句。聽懂句子、完成任務！'),
      rows,
      el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '8px' } },
        el('button', { class: 'btn blue', onclick: () => { m.close(); ui.show('learn', { level: n }); } }, '📖 Learn 先看學習卡'))), { wide: true });
    return m;
  };

  ui.screens.listen = function () {
    const s = el('div', { class: 'screen' });
    s.appendChild(ui.topbar('🎧 Sentence Listening 句型聽力'));
    const total = EP.levels.reduce((a, l) => a + L.levelSpecs(l.level).reduce((b, sp) => b + starsOf(sp.id), 0), 0);
    s.appendChild(el('div', { class: 'panel', style: { marginBottom: '12px' } },
      el('h3', { style: { margin: '0 0 4px' } }, `⭐ ${total} / 225`),
      el('p', { class: 'zh', style: { margin: '4px 0' } }, '25 關 × 3 款，共 75 款不重複的句型聽力遊戲。每款都是生活情境任務（動物園、健康中心、郵局、餐車、口譯員……），聽懂工作表上的例句才能完成。'),
      el('p', { class: 'muted zh', style: { margin: '4px 0' } }, '例句聲音：有老師錄音先播老師錄音；有 AI 語音（標示「AI 語音」）就播 AI 語音；其餘用裝置的電腦語音（標示「電腦語音」）。每題都可按 🐢 慢速再聽。')));
    const grid = el('div', { class: 'ls-level-grid' });
    EP.levels.forEach((l) => {
      const specs = L.levelSpecs(l.level); const st = specs.reduce((a, sp) => a + starsOf(sp.id), 0);
      grid.appendChild(el('button', { class: 'ls-level', onclick: () => ui.listenLevel(l.level), 'aria-label': `Level ${l.level} ${l.titleEn} ${l.titleZh}, ${st} of 9 stars` },
        el('b', {}, `Level ${l.level} 第${l.level}關`),
        el('span', { class: 'zh', style: { fontWeight: 800 } }, l.titleZh),
        el('span', { class: 'ls-lv-icons', 'aria-hidden': 'true' }, specs.map((sp) => sp.icon).join('')),
        el('span', { class: 'ls-lv-stars' }, `⭐ ${st}/9`)));
    });
    s.appendChild(grid);
    return s;
  };

  // home: add the Sentence Listening card to the main menu
  const home = ui.screens.home;
  ui.screens.home = function () {
    const s = home(); const menu = s.querySelector('.home-menu');
    if (menu) {
      const card = el('button', { class: 'menu-card', style: { background: 'linear-gradient(135deg,#0ca678,#1098ad)' }, onclick: () => ui.show('listen') },
        el('span', { class: 'ic' }, '🎧'), el('div', {}, el('b', {}, 'Sentence Listening'), el('br'), el('small', { class: 'zh' }, '句型聽力 75 款')));
      menu.insertBefore(card, menu.children[1] || null);
    }
    return s;
  };
})();
