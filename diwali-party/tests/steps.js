// Checks the class deck against the key presses written in script.html.
//   cd <repo root> && python3 -m http.server 8791 &   then   node diwali-party/tests/steps.js
// If a slide gains or loses a step, change the number here AND the matching "按鍵" line in script.html.
const { chromium } = require('playwright');
const BASE = process.env.DP_URL || 'http://localhost:8791/diwali-party/';
// [steps on the slide, station opened after the last step, timer seconds, step that starts the timer]
const EXPECT = [[1, null, 0, 0], [3, null, 0, 0], [2, 'spin', 0, 0], [2, null, 210, 2], [3, null, 210, 3], [3, null, 150, 1], [3, 'impostor', 0, 0], [3, 'speed', 0, 0], [3, null, 0, 0], [4, null, 0, 0]];
(async () => {
  const b = await chromium.launch(); let fail = 0; const errs = [];
  for (const reduced of [false, true]) {
    const p = await (await b.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'class.html#s1'); await p.waitForTimeout(1500);
    const got = await p.evaluate(() => [...document.querySelectorAll('.slide')].map(sl => [Math.max(0, +sl.dataset.go || 0, ...[...sl.querySelectorAll('[data-s]')].map(e => +e.dataset.s)), sl.dataset.lab || null, +sl.dataset.timer || 0, +sl.dataset.go || 0]));
    if (JSON.stringify(got) !== JSON.stringify(EXPECT)) { fail++; console.log('FAIL steps differ', JSON.stringify(got)); }
    // walk the whole lesson with the "next" key only, the way the script describes it
    let presses = 0, labs = 0;
    for (let guard = 0; guard < 80; guard++) {
      const s = await p.evaluate(() => ({ cur: window.__deck.cur, step: window.__deck.step, lab: window.__deck.lab }));
      if (s.lab) { labs++; await p.waitForTimeout(reduced ? 300 : 1200); await p.click('#lab-next'); await p.waitForTimeout(200); continue; }
      if (s.cur === 9 && s.step === 4) break;
      await p.keyboard.press('ArrowRight'); presses++; await p.waitForTimeout(60);
    }
    const end = await p.evaluate(() => [window.__deck.cur, window.__deck.step]);
    const hidden = await p.evaluate(() => [...document.querySelectorAll('.slide.on [data-s]')].filter(e => getComputedStyle(e).visibility !== 'visible').length);
    // presses = every step + one page turn for each slide not entered from a station
    const want = EXPECT.reduce((a, e) => a + e[0], 0) + (EXPECT.length - 1 - 3) + 3;
    if (end[0] !== 9 || end[1] !== 4 || labs !== 3 || presses !== want || hidden) { fail++; console.log('FAIL walk', { reduced, end, labs, presses, want, hidden }); }
    else console.log('ok walk', reduced ? '(reduced motion)' : '', 'presses', presses, 'stations', labs);
    await p.close();
  }
  if (errs.length) { fail++; console.log('FAIL page errors', errs.slice(0, 3)); }
  console.log(fail ? 'FAILED' : 'ALL OK'); await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
