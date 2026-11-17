// Group observation rubric (Evidence screen): taps set/unset levels, persists, shows in the copied summary, cleared by a new lesson
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html'); let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  const pressed = (g, k, v) => p.getAttribute(`.rub-btn[data-g="${g}"][data-k="${k}"][data-v="${v}"]`, 'aria-pressed');
  await p.goto(f + '#home'); await p.goto(f + '#evidence'); await p.waitForTimeout(400);
  check(await p.$$eval('.rub-btn', x => x.length) === 30, 'expected 5 criteria x 2 groups x 3 levels = 30 buttons');
  check(await p.$$eval('.rub-btn', x => x.every(e => e.getBoundingClientRect().width >= 40 && e.getBoundingClientRect().height >= 40)), 'rubric buttons must be at least 40px for iPad fingers');
  await p.click('.rub-btn[data-g="A"][data-k="listen"][data-v="3"]'); await p.click('.rub-btn[data-g="B"][data-k="team"][data-v="1"]'); await p.click('.rub-btn[data-g="A"][data-k="say"][data-v="2"]');
  check(await pressed('A', 'listen', 3) === 'true' && await pressed('B', 'team', 1) === 'true' && await pressed('A', 'say', 2) === 'true', 'selected levels not shown');
  await p.click('.rub-btn[data-g="A"][data-k="say"][data-v="1"]'); check(await pressed('A', 'say', 1) === 'true' && await pressed('A', 'say', 2) === 'false', 'choosing another level must replace the first');
  await p.click('.rub-btn[data-g="A"][data-k="say"][data-v="1"]'); check(await pressed('A', 'say', 1) === 'false', 'pressing the same level again must clear it');
  // persists across a reload
  await p.reload(); await p.goto(f + '#home'); await p.goto(f + '#evidence'); await p.waitForTimeout(300);
  check(await pressed('A', 'listen', 3) === 'true' && await pressed('B', 'team', 1) === 'true', 'levels were lost after reload');
  // copied summary carries them
  await p.click('#ev-copy'); await p.waitForTimeout(300);
  const txt = await p.evaluate(() => navigator.clipboard.readText());
  check(/小組表現觀察（Party Menu）：A 組：聽與選✔；B 組：合作\?/.test(txt), 'copied summary lacks the rubric line: ' + JSON.stringify(txt.split('\n').filter(l => l.includes('小組')))); 
  // a new lesson clears them
  await p.goto(f + '#home'); await p.goto(f + '#spin'); await p.click('#sp-new'); await p.click('#sp-new'); await p.waitForTimeout(300);
  await p.goto(f + '#home'); await p.goto(f + '#evidence'); await p.waitForTimeout(300);
  check(await p.$$eval('.rub-btn[aria-pressed="true"]', x => x.length) === 0, 'rubric was not cleared by a new lesson');
  // a damaged saved value must not break the page
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('lunchboxlab.v1')); s.rubric = 'oops'; localStorage.setItem('lunchboxlab.v1', JSON.stringify(s)); });
  await p.reload(); await p.goto(f + '#home'); await p.goto(f + '#evidence'); await p.waitForTimeout(300);
  check(await p.$$eval('.rub-btn', x => x.length) === 30, 'page broke on a damaged rubric value');
  console.log(bad ? 'RUBRIC FAILED' : 'rubric ok', 'ERR', errs.slice(0, 4)); await b.close();
})();
