// No view may leak template placeholders, undefined, NaN or [object ...] into visible text (desktop + iPad portrait)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const errs = [];
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  const views = ['home', 'spin', 'catch', 'pack', 'speed', 'impostor', 'build', 'check', 'card', 'teacher', 'evidence', 'words', 'guide'];
  for (const [w, h] of [[1280, 800], [820, 1180], [1024, 768], [744, 1133]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    for (const v of views) {
      await p.goto(f + '#home'); await p.goto(f + '#' + v); await p.waitForTimeout(350);
      // press the main start button when one exists so the game screen is checked as well
      for (const id of ['#pk-start', '#sr-start', '#i-start', '#b-start', '#c-start', '#ch-start', '#sp-go']) {
        if (await p.$(id)) { await p.click(id, { force: true }).catch(() => {}); await p.waitForTimeout(700); break; }
      }
      const txt = await p.evaluate(() => document.body.innerText + ' ' + Array.from(document.querySelectorAll('[aria-label],[placeholder],[title]')).map(e => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('placeholder') || '') + ' ' + (e.getAttribute('title') || '')).join(' '));
      // no content card may need sideways scrolling at iPad widths (the nav bar is meant to scroll)
      const sc = await p.evaluate(() => Array.from(document.querySelectorAll('*')).filter(e => !e.closest('nav,header') && e.scrollWidth > e.clientWidth + 1 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowX)).map(e => e.className || e.tagName));
      if (sc.length) { bad++; console.log('FAIL sideways scroll', w, v, JSON.stringify(sc)); }
      if (v === 'words') { // typed words must be fully visible in the editing table
        const cut = await p.evaluate(() => Array.from(document.querySelectorAll('td input[type=text]')).filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.value));
        if (cut.length) { bad++; console.log('FAIL truncated word inputs', w, JSON.stringify(cut.slice(0, 5))); }
      }
      let pw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (v === 'spin') for (let i = 0; i < 8; i++) { await p.waitForTimeout(200); pw = Math.max(pw, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)); } // the wheel is rotating here
      if (pw > 1) { bad++; console.log('FAIL page wider than screen', w, v, pw); }
      const m = txt.match(/\$\{|\bundefined\b|\bNaN\b|\[object |\bnull\b/);
      if (m) { bad++; const i = txt.indexOf(m[0]); console.log('FAIL leak', w, v, JSON.stringify(txt.slice(Math.max(0, i - 40), i + 40))); }
    }
    await ctx.close();
  }
  console.log(bad ? 'LEAKS FAILED' : 'leaks ok', 'ERR', errs);
  await b.close();
})();
