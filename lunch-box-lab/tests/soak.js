// Whole-lesson soak test with a fake clock: 40-minute timer across all phases, timeouts everywhere, view switching while timers run.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  await p.clock.install();
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  const ff = async ms => { await p.clock.runFor(ms); await p.waitForTimeout(30); };
  // ---- teacher timer through the whole lesson
  await p.goto(f + '#teacher'); await p.waitForTimeout(100);
  await p.click('#t-go');
  const seen = [];
  for (let m = 0; m < 41; m++) { await ff(60 * 1000); const n = await p.textContent('#t-name'); if (!seen.length || seen[seen.length - 1] !== n) seen.push(n); }
  console.log('phases seen:', seen.join(' → '));
  check(seen.length === 7, 'timer visited ' + seen.length + ' phases'); // lesson plan v2 has seven phases
  check((await p.textContent('#t-clock')).trim() === '00:00', 'timer ended at ' + (await p.textContent('#t-clock')));
  check((await p.textContent('#t-go')).includes('開始') || (await p.textContent('#t-go')).includes('▶'), 'timer button after finish: ' + (await p.textContent('#t-go')));
  // ---- a Catch run where nobody answers: every round times out, then the end screen
  await p.goto(f + '#catch'); await p.click('#c-start'); await ff(1500);
  for (let i = 0; i < 10; i++) { await ff(6500); await ff(2200); }
  const endTitle = await p.textContent('h1'); console.log('catch ended with:', endTitle.trim());
  check(endTitle.includes('Catch 結果'), 'Catch did not reach its result screen: ' + endTitle);
  check((await p.textContent('.hud')).replace(/\s+/g, '').includes('0/10'), 'Catch all-timeout score');
  // ---- Pack: every answer wrong twice then hint, all 6 rounds
  await p.goto(f + '#pack'); await p.click('#pk-start'); await ff(2000);
  for (let r = 0; r < 6; r++) {
    for (let k = 0; k < 4; k++) { const dis = await p.$$eval('.shelf .opt', e => e.map(x => x.disabled)); if (dis.every(x => x)) break; await p.click(`.shelf .opt >> nth=${k}`, { force: true }); await ff(120); }
    await ff(2300);
  }
  check((await p.textContent('h1')).includes('便當完成'), 'Pack did not finish: ' + (await p.textContent('h1')));
  // ---- Speed round: let two draws time out, mark one wrong
  await p.goto(f + '#speed'); await p.keyboard.press('Space'); await ff(11000); await p.keyboard.press('2'); await ff(1500);
  await p.keyboard.press('Space'); await ff(11000); await p.keyboard.press('1'); await ff(1500);
  check(/✓ \d \/ \d/.test(await p.textContent('#sr-board')), 'speed board');
  // ---- switch views quickly while the lesson timer runs: mini timer shows, no errors
  await p.goto(f + '#teacher'); await p.click('#t-reset'); await p.click('#t-go'); await ff(5000);
  for (const v of ['spin', 'catch', 'pack', 'impostor', 'speed', 'build', 'check', 'card', 'evidence', 'words', 'guide', 'home']) { await p.goto(f + '#' + v); await ff(400); }
  check(await p.isVisible('#mini'), 'mini timer not visible while the lesson timer runs');
  console.log(bad ? 'SOAK FAILED' : 'soak ok', 'ERR', errs);
  await b.close();
})();
