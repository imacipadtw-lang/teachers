// 無障礙檢查：node axe.js [light|dark]
const { chromium } = require('playwright'); const fs = require('fs');
const AXE = fs.readFileSync(require('path').join(__dirname, 'node_modules/axe-core/axe.min.js'), 'utf8');
const B = 'http://localhost:8787/'; const scheme = process.argv[2] || 'light';
(async () => {
  await fetch(B + '__reset'); await fetch(B + '__seed');
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme }); const pg = await ctx.newPage();
  await pg.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const run = async (name) => { await pg.addScriptTag({ content: AXE }); const r = await pg.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, ex: v.nodes.slice(0, 3).map(x => x.target.join(' ') + ' :: ' + (x.any[0] || x.all[0] || x.none[0] || {}).message) }))); console.log('== ' + name + ' (' + r.length + ')'); r.forEach(v => { console.log(` [${v.impact}] ${v.id} ×${v.n}: ${v.help}`); v.ex.forEach(e => console.log('     ' + e.slice(0, 220))); }); };
  await fetch(B + 'exec?action=claim&classId=g1&label=t'); // 讓總覽出現「尚未登入」提醒
  await pg.goto(B); await pg.waitForSelector('#whoSel:not([disabled])'); await run('登入頁');
  await pg.click('text=教務組登入'); await pg.fill('input[type=password]', 'test1234'); await pg.keyboard.press('Enter'); await pg.waitForSelector('table.grid');
  await pg.locator('table.grid button.chk').nth(0).click(); await pg.waitForTimeout(1200);
  await run('班級檢核');
  for (const t of ['全校總覽', '報表', '設定']) { await pg.click('nav.tabs >> text=' + t); await pg.waitForTimeout(400); await run(t); }
  await pg.click('nav.tabs >> text=班級檢核'); await pg.click('button:has-text("掃描登記")'); await pg.waitForTimeout(300); await run('掃描對話框');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200); await pg.click('footer .helpbtn'); await pg.waitForTimeout(200); await run('使用說明');
  await br.close();
})();
