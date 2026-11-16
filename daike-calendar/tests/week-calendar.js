// 全校週曆公告圖測試（示範模式）。先 python3 -m http.server 8765，再 node daike-calendar/tests/week-calendar.js；圖存到 /tmp/week-calendar.png
const {chromium} = require('playwright');
const BASE = (process.env.BASE || 'http://localhost:8765') + '/index.html?demo=1';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if(!c) fails++; };
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto(BASE); await p.waitForSelector('#name option:not([value=""])', {state:'attached'});
  await p.selectOption('#name', '王教務'); await p.fill('#pw', 'demo'); await p.click('#loginForm button[type=submit]');
  await p.waitForFunction(() => typeof state !== 'undefined' && state.cred && document.querySelectorAll('#pageTabs [data-pg]').length > 0);
  const mon = await p.evaluate(() => {
    const m = nextMonday(), days = weekDays(m), mk = (i, o) => Object.assign({date: days[i]}, o);
    state.viewing = '__all__'; state.off = {[days[4]]: {name:'國定假日', kind:'假日', scope:'全天'}};
    state.events = [
      mk(0, {type:'sub', id:'代-11511001', who:'王小明', other:'林繼于', period:3, cls:'四甲', subject:'國語'}),
      mk(0, {type:'sub', id:'代-11511002', who:'陳大華', other:'林繼于', period:4, cls:'四甲', subject:'數學'}),
      mk(1, {type:'tutor', id:'導-11511001', who:'王小明', other:'林繼于', cls:'四甲'}),
      mk(1, {type:'swap', dir:'調出', id:'調-11511003', teacher:'劉佳雯', partner:'簡玉惠', cls:'三甲', period:5, fromDate:days[1], fromPeriod:5, fromSubject:'健康', toDate:days[3], toPeriod:2, toSubject:'國語'}),
      mk(2, {type:'sub', id:'代-11511004', who:'簡玉惠', other:'吳韻如', period:1, cls:'六甲', subject:'視覺藝術'})];
    state.events.forEach(e => { e.date = e.date || days[0]; });
    return m;
  });
  await p.evaluate(m => { showPage('all'); openCalCard(m); }, mon);
  await p.waitForSelector('#weekModal:not([hidden])');
  const txt = await p.inputValue('#weekText');
  ok(/下週調代課公告/.test(txt) && /歡迎私訊教務組/.test(txt), '文字有「下週」標題與私訊教務組提醒');
  ok(/週曆/.test(await p.textContent('#weekTitle')), '視窗標題是週曆公告');
  const url = await p.getAttribute('#weekImg', 'src'); ok(/^data:image\/png/.test(url), '產生 PNG 圖');
  require('fs').writeFileSync('/tmp/week-calendar.png', Buffer.from(url.split(',')[1], 'base64'));
  ok(/林繼于/.test(await p.textContent('#weekEach')), '也有分別傳給各老師');
  await p.click('#weekNext'); ok(/週曆/.test(await p.textContent('#weekTitle')), '下一週仍是週曆模式');
  ok(!errs.length, '沒有 JS 錯誤 ' + errs.join(';'));
  await b.close(); console.log(fails ? `\n✗ ${fails} 項失敗` : '\n✓ 全部通過'); process.exit(fails ? 1 : 0);
})();
