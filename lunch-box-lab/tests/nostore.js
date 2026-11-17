// The app must still run when localStorage / sessionStorage throw (private mode, blocked site data)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { for (const k of ['localStorage', 'sessionStorage']) Object.defineProperty(window, k, { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html'); let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  for (const v of ['home', 'spin', 'catch', 'pack', 'speed', 'impostor', 'build', 'check', 'card', 'teacher', 'evidence', 'words', 'guide']) {
    await p.goto(f + '#home'); await p.goto(f + '#' + v); await p.waitForTimeout(350);
    const n = await p.evaluate(() => document.querySelector('#app').innerText.length);
    check(n > 40, v + ' rendered almost nothing (' + n + ' chars)');
  }
  // play one Pack round without storage
  await p.goto(f + '#home'); await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(1900);
  await p.click('.shelf .opt >> nth=0', { force: true }); await p.waitForTimeout(500);
  check(await p.isVisible('.shelf'), 'pack screen vanished after a tap');
  // edit a word without storage
  await p.goto(f + '#home'); await p.goto(f + '#words'); await p.fill('#w-en-0', 'bread'); await p.waitForTimeout(300);
  check((await p.inputValue('#w-en-0')) === 'bread', 'word edit lost');
  console.log(bad ? 'NOSTORE FAILED' : 'nostore ok', 'ERR', errs.slice(0, 5)); await b.close();
})();
