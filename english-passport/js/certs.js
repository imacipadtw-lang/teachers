/* Calendar pictures for months/weekdays (menus only) + picture certificates (PNG) */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, el = u.el, ui = EP.ui;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DAYS_ZH = ['一', '二', '三', '四', '五', '六', '日'];
  /** calendar-page picture for months and weekdays that have no emoji */
  EP.calendarPic = function (w) {
    const m = MONTHS.indexOf(w.word); if (m >= 0) return { top: 'MONTH 月', big: String(m + 1), color: '#e03131' };
    const d = DAYS.indexOf(w.word); if (d >= 0) return { top: 'DAY 星期', big: DAYS_ZH[d], color: d >= 5 ? '#2f9e44' : '#1971c2' };
    return null;
  };
  ui.calendarEl = function (w, size) {
    const c = EP.calendarPic(w); if (!c) return null; const s = size || 110;
    return el('div', { 'aria-hidden': 'true', style: { width: s + 'px', height: s * 1.05 + 'px', borderRadius: '14px', background: '#fff', boxShadow: '0 4px 0 rgba(0,0,0,.15)', overflow: 'hidden', display: 'inline-flex', flexDirection: 'column', border: '2px solid #dee2e6', margin: '0 auto' } },
      s >= 60 ? el('div', { style: { background: c.color, color: '#fff', fontWeight: 900, fontSize: s * 0.13 + 'px', padding: '4px 0', textAlign: 'center' } }, c.top) : el('div', { style: { background: c.color, height: Math.round(s * 0.18) + 'px' } }),
      el('div', { class: 'zh', style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: s * 0.5 + 'px', color: '#1d2340' } }, c.big));
  };

  /** save a Blob: hosted viewer download capability, normal download offline */
  ui.downloadBlob = async function (name, blob) {
    if (window.claude && typeof window.claude.use === 'function') {
      try { const d = await window.claude.use('downloads'); if (d) { try { await d.save({ filename: name, data: blob }); return true; } catch (e) { if (e && e.code === 'declined') return false; } } } catch (e) {}
    }
    try { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 200); return true; } catch (e) { return false; }
  };

  /** draw a certificate. kind: 'level' (n) or 'tour' */
  ui.certificate = function (kind, n) {
    const p = EP.me; const W = 1600, H = 1130; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const stamps = EP.levels.filter((l) => (p.levels[l.level] || {}).stamp);
    const lv = kind === 'level' ? EP.levels[n - 1] : null;
    const font = (w, s, f) => `${w} ${s}px ${f || "'Baloo 2','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif"}`;
    // paper + guilloché-like border
    const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#fffaf0'); grd.addColorStop(1, '#f6ead0'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#17246b'; g.lineWidth = 26; g.strokeRect(13, 13, W - 26, H - 26);
    g.strokeStyle = '#f5c542'; g.lineWidth = 6; g.strokeRect(46, 46, W - 92, H - 92);
    g.globalAlpha = 0.06; g.strokeStyle = '#17246b'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(W / 2, H / 2, 120 + i * 16, 0, Math.PI * 2); g.stroke(); } g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#17246b'; g.font = font(800, 34); g.fillText('TUCHENG ELEMENTARY SCHOOL · 南投縣草屯鎮土城國民小學', W / 2, 120);
    g.fillStyle = '#b8860b'; g.font = font(900, 78); g.fillText(kind === 'tour' ? 'World Tour Certificate' : 'English Passport Certificate', W / 2, 215);
    g.fillStyle = '#17246b'; g.font = font(900, 50); g.fillText(kind === 'tour' ? '英語護照環遊世界 完成證書' : '英語護照 關卡蓋章證書', W / 2, 295);
    g.font = '120px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillStyle = '#000'; g.fillText(p.avatar, W / 2, 440);
    g.fillStyle = '#1d2340'; g.font = font(900, 92); g.fillText(p.name, W / 2, 575);
    g.strokeStyle = '#b8860b'; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2 - 380, 630); g.lineTo(W / 2 + 380, 630); g.stroke();
    g.fillStyle = '#1d2340'; g.font = font(700, 40);
    if (kind === 'tour') {
      g.fillText(`has collected ${stamps.length} of 25 passport stamps and mastered ${Object.values(p.words).filter((x) => x.b >= 4).length} of 700 words.`, W / 2, 690);
      g.font = font(700, 38); g.fillText(`已蓋 ${stamps.length} / 25 個護照章，精熟 ${Object.values(p.words).filter((x) => x.b >= 4).length} / 700 個英文單字。`, W / 2, 745);
    } else {
      g.fillText(`passed the Level ${n} passport check: ${lv.titleEn}`, W / 2, 690);
      g.font = font(700, 38); g.fillText(`通過第 ${n} 關護照蓋章考：${lv.cityZh}（${lv.countryZh}）· ${lv.titleZh}`, W / 2, 745);
    }
    // stamps row
    const icons = kind === 'tour' ? EP.levels.map((l) => ({ ic: l.icon, on: !!(p.levels[l.level] || {}).stamp, c: l.color })) : [{ ic: lv.icon, on: true, c: lv.color, city: lv.city }];
    const per = kind === 'tour' ? 25 : 1; const sz = kind === 'tour' ? 52 : 150; const gap = kind === 'tour' ? 58 : 0; const x0 = W / 2 - ((per - 1) * gap) / 2;
    icons.forEach((s, i) => {
      const x = x0 + i * gap, y = kind === 'tour' ? 850 : 880;
      g.save(); g.translate(x, y); g.rotate(-0.2); g.globalAlpha = s.on ? 1 : 0.18;
      g.strokeStyle = s.c; g.lineWidth = kind === 'tour' ? 3 : 8; g.beginPath(); g.arc(0, 0, sz * 0.55, 0, Math.PI * 2); g.stroke();
      g.font = `${sz * 0.62}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.fillStyle = '#000'; g.fillText(s.ic, 0, 2);
      if (s.city) { g.fillStyle = s.c; g.font = font(900, 28); g.fillText(s.city.toUpperCase(), 0, sz * 0.75); }
      g.restore();
    });
    const date = new Date(); const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    g.fillStyle = '#1d2340'; g.font = font(700, 32); g.textAlign = 'left'; g.fillText(`Date 日期：${ds}`, 130, 1010);
    g.textAlign = 'right'; g.fillText('Teacher 老師：________________', W - 130, 1010);
    cv.toBlob((blob) => {
      const url = URL.createObjectURL(blob); const file = `passport-certificate-${kind === 'tour' ? 'world-tour' : 'level-' + n}-${p.name.replace(/[^\w一-鿿-]+/g, '')}.png`;
      const m = ui.modal(el('div', { style: { textAlign: 'center' } }, el('h3', {}, '🏆 Certificate 證書'), el('img', { src: url, alt: 'Certificate 證書', style: { width: '100%', borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,.25)' } }),
        el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } }, el('button', { class: 'btn go', onclick: async () => { const ok = await ui.downloadBlob(file, blob); ui.toast(ok ? 'Saved 已下載' : '可在圖片上長按或按右鍵另存', '🏆'); } }, '⬇️ Save 下載證書')),
        el('p', { class: 'muted zh' }, '手機或平板也可以長按圖片儲存。')), { wide: true });
      EP.sfx.win(); ui.confetti(120);
    }, 'image/png');
  };

  // hook: learn cards and word-dex show the calendar picture when there is no emoji
  const learn = ui.screens.learn;
  ui.screens.learn = function (arg) {
    const s = learn(arg);
    const patch = () => { const card = s.querySelector('.flash-inner'); if (!card || card.querySelector('.e') || card.dataset.cal) return; const idx = (card.querySelector('.muted') || {}).textContent || ''; const m = idx.match(/No\. (\d+)/); const w = m && EP.byId[m[1]]; const c = w && ui.calendarEl(w, 120); if (c) { card.dataset.cal = '1'; card.insertBefore(c, card.children[1]); } };
    new MutationObserver(patch).observe(s, { childList: true, subtree: true }); patch();
    return s;
  };
  const dex = ui.screens.wordex;
  ui.screens.wordex = function () {
    const s = dex();
    const patch = () => s.querySelectorAll('.dex-card').forEach((c) => { if (c.dataset.cal) return; const e = c.querySelector('.e'); const m = (c.querySelector('.muted') || {}).textContent.match(/#(\d+)/); const w = m && EP.byId[m[1]]; if (e && w && e.textContent === '🔤' && EP.calendarPic(w)) { c.dataset.cal = '1'; e.textContent = ''; e.appendChild(ui.calendarEl(w, 40)); } });
    new MutationObserver(patch).observe(s, { childList: true, subtree: true }); patch();
    return s;
  };
  // hook: passport page gets a World Tour certificate button; stamp test pass gets a level certificate button
  const pass = ui.screens.passport;
  ui.screens.passport = function () {
    const s = pass();
    const n = Object.values(EP.me.levels).filter((x) => x.stamp).length;
    s.insertBefore(el('div', { class: 'row', style: { justifyContent: 'center', margin: '0 0 12px' } },
      el('button', { class: 'btn primary big', disabled: n === 0, onclick: () => ui.certificate('tour') }, '🏆 World Tour certificate 環遊世界證書'),
      n === 0 ? el('span', { class: 'chip' }, '先通過任一關的護照蓋章考 Pass a stamp test first') : null), s.children[2] || null);
    return s;
  };
  const stampTest = ui.stampTest;
  ui.stampTest = function (n) {
    stampTest(n);
    const box = document.querySelector('#app .screen .panel');
    if (!box) return;
    new MutationObserver((muts, obs) => {
      const stamped = box.querySelector('.pp-stamp'); if (!stamped || box.querySelector('.cert-btn')) return;
      const row = box.querySelector('.row'); if (row) row.prepend(el('button', { class: 'btn primary cert-btn', onclick: () => ui.certificate('level', n) }, '🏆 Certificate 領取證書'));
      obs.disconnect();
    }).observe(box, { childList: true, subtree: true });
  };
})();
