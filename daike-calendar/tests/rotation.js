// 代導師輪值提醒測試（示範模式）。先 python3 -m http.server 8765，再 node daike-calendar/tests/rotation.js
const {chromium} = require('playwright');
const BASE = (process.env.BASE || 'http://localhost:8765') + '/index.html?demo=1';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if(!c) fails++; };
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto(BASE); await p.waitForSelector('#name option:not([value=""])', {state:'attached'});
  await p.selectOption('#name', '王教務'); await p.fill('#pw', 'demo'); await p.click('#loginForm button[type=submit]');
  await p.waitForFunction(() => typeof state !== 'undefined' && state.cred && document.querySelectorAll('#pageTabs [data-pg]').length > 0);
  // 1 沒有設定：顯示設定入口
  await p.evaluate(() => { localStorage.removeItem(K + 'rotList'); localStorage.removeItem(K + 'rotAnchor'); });
  const r1 = await p.evaluate(() => rotHint('t', '', ''));
  ok(/設定輪值順序/.test(r1), '沒設定時有「設定輪值順序」入口');
  // 2 起算點＝甲（11/17），之後沒有紀錄 → 下一位乙
  const t = await p.evaluate(() => {
    ROT.save(['甲','乙','丙','丁','戊'], {name:'甲', date:'2026-11-17'}); state.school = []; state.events = [];
    const a = ROT.next().name;
    // 乙之後輪到丙；丙那天有事，改由丁代 → 下次仍是丙
    state.events = [{type:'tutor', who:'乙', date:'2026-11-20'}, {type:'tutor', who:'乙', date:'2026-11-23'}, {type:'tutor', who:'丁', date:'2026-12-01'}];
    const b2 = ROT.next().name;
    state.events.push({type:'tutor', who:'丙', date:'2026-12-02'});
    const c = ROT.next().name;
    state.events.push({type:'tutor', who:'丁', date:'2026-12-03'}, {type:'tutor', who:'戊', date:'2026-12-04'}, {type:'tutor', who:'甲', date:'2026-12-05'});
    const d = ROT.next().name;
    state.events = [{type:'tutor', who:'乙', date:'2026-11-10'}];   // 起算日之前的不算
    const e2 = ROT.next().name;
    return [a, b2, c, d, e2];
  });
  ok(t[0] === '乙', '11/17 甲之後輪到乙（' + t[0] + '）');
  ok(t[1] === '丙', '乙連代兩天算一次，丁代班不影響，仍輪到丙（' + t[1] + '）');
  ok(t[2] === '丁', '丙代了以後輪到丁（' + t[2] + '）');
  ok(t[3] === '乙', '丁、戊、甲都照順序，下一位回到乙（' + t[3] + '）');
  ok(t[4] === '乙', '起算日以前的紀錄不算（' + t[4] + '）');
  // 3 畫面：代導師分頁有提醒、一鍵選人
  await p.evaluate(() => { state.events = []; state.school = []; openPlan && 0; });
  await p.evaluate(() => { const b = document.querySelector('[data-open-plan],#planBtn,#openPlan'); if(b) b.click(); else if(typeof openPlan === 'function') openPlan(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { plan.kind = 'tutor'; renderPlan(); });
  const hint = await p.textContent('.rot-hint');
  ok(/依順序輪到 乙/.test(hint), '代導師分頁顯示「依順序輪到 乙」');
  ok(await p.isVisible('.rot-set'), '有輪值順序設定');
  await p.click('[data-rotpick="t"]');
  ok(await p.evaluate(() => plan.tutor.sub) === '乙', '按「選 乙」會填進代導師');
  ok(/目前選的就是他/.test(await p.textContent('.rot-hint')), '選了輪到的人顯示 ✓');
  await p.evaluate(() => { plan.tutor.sub = '丙'; renderPlan(); });
  ok(/下一次仍然輪到 乙/.test(await p.textContent('.rot-hint')), '改選別人會說明下次仍輪到乙');
  // 4 儲存設定
  await p.evaluate(() => { document.querySelector('.rot-set').open = true; });
  await p.fill('#rotList', '子\n丑\n寅'); await p.fill('#rotLast', '丑'); await p.fill('#rotDate', '2026-11-18'); await p.click('#rotSave');
  ok(await p.evaluate(() => ROT.next().name) === '寅', '重新儲存順序後輪到寅');
  // 5 假日：週六、週日預設不列，勾選後列出；只選一天（週六）直接列
  const wk = await p.evaluate(() => { plan.tutor.from = '2026-11-20'; plan.tutor.to = '2026-11-23'; plan.tutor.weekend = false; const a = tutDays().length;
    plan.tutor.weekend = true; const b = tutDays().length; plan.tutor.weekend = false; plan.tutor.from = '2026-11-21'; plan.tutor.to = ''; const c = tutDays().length; return [a, b, c]; });
  ok(wk[0] === 2 && wk[1] === 4 && wk[2] === 1, '代導師：預設跳過週末(' + wk[0] + ')、勾選後列出(' + wk[1] + ')、只選週六一天直接列(' + wk[2] + ')');
  // 6 年曆週六、週日格子也有「＋」，請假也能列單日週末
  await p.evaluate(() => { const m = document.getElementById('planModal'); if(!m.hidden && typeof closePlan === 'function') closePlan(); showPage('cal'); });
  await p.waitForTimeout(300);
  const plus = await p.evaluate(() => [...document.querySelectorAll('#year .d.we:not(.out):not(.empty)')].filter(c => c.querySelector('.addp')).length);
  ok(plus > 0, '年曆週六、週日格子有「＋」可補登（' + plus + ' 格）');
  const ab = await p.evaluate(() => { plan.absent.from = '2026-11-21'; plan.absent.to = ''; const a = absDays().length; plan.absent.from = '2026-11-20'; plan.absent.to = '2026-11-23'; plan.absent.weekend = false; const b = absDays().length; plan.absent.weekend = true; const c = absDays().length; return [a, b, c]; });
  ok(ab[0] === 1 && ab[1] === 2 && ab[2] === 4, '請假：只選週六一天直接列(' + ab[0] + ')、預設跳週末(' + ab[1] + ')、勾選列出(' + ab[2] + ')');
  ok(errs.length === 0, '沒有 JS 錯誤 ' + errs.join(';'));
  await b.close(); console.log(fails ? `\n✗ ${fails} 項失敗` : '\n✓ 全部通過'); process.exit(fails ? 1 : 0);
})();
