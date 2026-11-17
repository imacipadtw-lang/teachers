// Stamps, class-progress celebration and the sound-test button
const { chromium } = require('playwright');
require('fs').mkdirSync(require('os').tmpdir() + '/lbl-shots', { recursive: true });
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html'); let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  const O = require('os').tmpdir() + '/lbl-shots/';
  // Pack finish -> stamp + toast
  await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(1900);
  for (let r = 0; r < 6; r++) {
    for (let k = 0; k < 4; k++) { const d = await p.$$eval('.shelf .opt', x => x.map(y => y.disabled)); if (d.every(y => y)) break; await p.click('.shelf .opt >> nth=' + k, { force: true }); await p.waitForTimeout(130); }
    await p.waitForTimeout(2400);
  }
  check((await p.textContent('h1')).includes('便當完成'), 'pack not finished');
  check(await p.isVisible('.toast'), 'no stamp toast'); console.log('toast:', await p.textContent('.toast'));
  await p.goto(f + '#card'); console.log('stamps on card:', await p.$$eval('.stamp.on', x => x.length), 'of', await p.$$eval('.stamp', x => x.length));
  await p.screenshot({ path: O + 'f-card.png' });
  await p.click('#cd-copy'); await p.waitForTimeout(200);
  console.log((await p.evaluate(() => navigator.clipboard.readText())).split('\n').filter(l => l.startsWith('印章')));
  // evidence celebration
  await p.goto(f + '#spin');
  for (let i = 0; i < 4; i++) { await p.click('#sp-go'); await p.waitForTimeout(4800); await p.keyboard.press('1'); }
  await p.click('#sp-post');
  for (let i = 0; i < 4; i++) { await p.click('#sp-go'); await p.waitForTimeout(4800); await p.keyboard.press('3'); }
  await p.goto(f + '#evidence'); await p.waitForTimeout(500);
  check(await p.isVisible('.celebrate'), 'no celebration banner'); console.log('banner:', (await p.textContent('.celebrate')).replace(/\s+/g, ' '));
  await p.screenshot({ path: O + 'f-evidence.png' });
  await p.click('#ev-copy'); await p.waitForTimeout(200);
  console.log((await p.evaluate(() => navigator.clipboard.readText())).split('\n').filter(l => l.startsWith('?')));
  // sound test button
  await p.goto(f + '#teacher'); await p.click('#snd-test'); console.log('sound msg:', (await p.textContent('#url-msg')).slice(0, 30));
  // reset clears stamps
  await p.goto(f + '#card'); await p.click('#cd-reset'); await p.click('#cd-reset'); check((await p.$$eval('.stamp.on', x => x.length)) === 0, 'stamps not cleared');
  console.log(bad ? 'STAMPS FAILED' : 'stamps ok', 'ERR', errs);
  await b.close();
})();
