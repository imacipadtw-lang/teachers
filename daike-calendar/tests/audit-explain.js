// 資料檢查「說明後自動處理」測試（示範模式）。用法同 smoke.js：先 python3 -m http.server 8765，再 node daike-calendar/tests/audit-explain.js
const {chromium} = require('playwright');
const BASE = (process.env.BASE || 'http://localhost:8765') + '/index.html?demo=1';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if(!c) fails++; };
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto(BASE); await p.waitForSelector('#name option:not([value=""])', {state:'attached'});
  await p.selectOption('#name', '王教務'); await p.fill('#pw', 'demo'); await p.click('#loginForm button[type=submit]');
  await p.waitForFunction(() => typeof state !== 'undefined' && state.cred && document.querySelectorAll('#pageTabs [data-pg]').length > 0);
  await p.evaluate(() => {
    localStorage.removeItem(K + 'alAck');
    state.teachers = ['簡玉惠', '恆慈', '林繼于', '劉佳雯'];
    state.events = [{type:'swap', dir:'調出', id:'調-11511005', teacher:'林繼于', partner:'恒慈', cls:'一甲', fromDate:'2026-11-19', fromPeriod:1, fromSubject:'數學', toDate:'2026-11-20', toPeriod:2, toSubject:'數學', date:'2026-11-19', period:1}];
    state.audit = [
      {key:'a1', kind:'swapchk', date:'2026-11-19', msg:'調課（調-11511005）：對調的「恒慈」不在課表的老師名單裡，可能打錯名字', ids:['調-11511005']},
      {key:'a2', kind:'swapchk', date:'2026-11-19', msg:'調課（調-11511005）：課表上 11/19（四）第1節 一甲 是 簡玉惠 的數學，不是 恒慈 的課；對調老師應該是 簡玉惠', ids:['調-11511005']},
      {key:'a3', kind:'off', date:'2026-10-23', msg:'10/23（五） 颱風假（薔琵）停止上課，還有 1 筆紀錄，請取消假單／代課（調-11510004）', ids:['調-11510004']}];
    renderAlerts(); showPage('check');
  });
  const t = await p.textContent('#alerts');
  ok(!/請取消假單\s*[\/／]\s*代課/.test(t) && /請重新安排這筆調課/.test(t), '調課的假日提醒不再出現「假單／代課」');
  ok(await p.locator('[data-alexp]').count() === 3, '每個問題都有「說明」鈕');
  await p.click('[data-alexp="a1"]');
  ok(await p.locator('[data-alsg]').count() >= 1 && /恆慈/.test(await p.textContent('.al-chips')), '名字差一個字會建議「恆慈」');
  await p.click('[data-alsg="0"]');
  ok(/調\(代\)課教師由「恒慈」改成「恆慈」/.test(await p.textContent('.al-plan')), '按建議後顯示要做什麼');
  await p.click('[data-alclose]');
  await p.click('[data-alexp="a2"]'); await p.fill('#alText', '對調老師是簡玉惠'); await p.click('[data-alplan]');
  ok(/改成「簡玉惠」/.test(await p.textContent('.al-plan')), '寫「對調老師是簡玉惠」→ 看懂並預告修改');
  await p.fill('#alText', ''); await p.fill('#alText', '亂寫一通'); 
  await p.click('[data-alclose]'); await p.click('[data-alexp="a2"]'); await p.fill('#alText', '亂寫一通'); await p.click('[data-alplan]');
  ok(/還看不懂/.test(await p.textContent('.al-err')), '看不懂的說明會提示怎麼寫');
  await p.fill('#alText', '這筆沒問題，那天課表有調整'); await p.click('[data-alplan]'); await p.click('[data-alrun]');
  await p.waitForTimeout(200);
  ok(await p.locator('[data-alexp]').count() === 2 && /已說明、先不提醒（1）/.test(await p.textContent('#alerts')), '「沒問題」→ 不再列出，收進「已說明」');
  await p.click('.al-acked summary'); await p.click('[data-alrestore]');
  ok(await p.locator('[data-alexp]').count() === 3, '可以恢復提醒');
  ok(!errs.length, '沒有 JS 錯誤 ' + errs.join(';'));
  await b.close(); console.log(fails ? `\n✗ ${fails} 項失敗` : '\n✓ 全部通過'); process.exit(fails ? 1 : 0);
})();
