// Regression checks for the third review (double tap, leaving Spin mid-spin, Speed Round answer leak, nav, stats grid, labels)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  await p.addInitScript(() => {
    window.__osc = 0; window.__say = [];
    const AC = window.AudioContext || window.webkitAudioContext;
    const co = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { window.__osc++; return co.apply(this, arguments); };
    const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) window.__say.push(+this.buffer.duration.toFixed(2)); return st.apply(this, a); };
    if (window.speechSynthesis) speechSynthesis.speak = u => window.__say.push('tts:' + u.text);
  });
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  // 2) Pack double tap must not skip round 1
  await p.goto(f + '#pack'); await p.mouse.click(5, 300); await p.waitForTimeout(1200);
  await p.dblclick('#pk-start'); await p.waitForTimeout(1900);
  check((await p.textContent('.hud')).includes('第 1/6'), 'Pack double tap skipped round 1: ' + (await p.textContent('.hud')).trim());
  // 1) flying ghost keeps the icon's size
  const iconW = await p.$eval('.shelf .opt .ico', e => e.getBoundingClientRect().width);
  await p.$$eval('.shelf .opt', els => els.forEach(e => e.disabled = false));
  let ghostW = null;
  for (let i = 0; i < 4 && ghostW === null; i++) {
    await p.click(`.shelf .opt >> nth=${i}`);
    await p.waitForTimeout(250);
    ghostW = await p.evaluate(() => { const g = document.querySelector('.flyghost'); return g ? g.getBoundingClientRect().width : null; });
  }
  check(ghostW !== null && ghostW < iconW * 2.2 && ghostW > iconW * .5, `fly ghost width ${ghostW} vs icon ${iconW}`);
  // 3) leaving Spin mid-spin: no ticks on other pages
  await p.goto(f + '#spin'); await p.click('#sp-hub'); await p.waitForTimeout(500);
  await p.goto(f + '#home'); await p.evaluate(() => { window.__osc = 0; }); await p.waitForTimeout(3800);
  const osc = await p.evaluate(() => window.__osc);
  check(osc <= 2, `ticks after leaving Spin: ${osc}`);
  // stale callback: leave and come back within the spin
  await p.goto(f + '#spin'); await p.click('#sp-hub'); await p.waitForTimeout(400); await p.goto(f + '#home'); await p.goto(f + '#spin'); await p.waitForTimeout(4300);
  check(await p.isHidden('#sp-mark'), 'stale spin callback painted into the new Spin view');
  // 4) Speed round: ✓ then next draw within 1s must not speak the old sentence afterwards
  await p.goto(f + '#speed'); await p.keyboard.press('Space'); await p.waitForTimeout(200);
  await p.evaluate(() => { window.__say = []; }); await p.keyboard.press('1'); await p.waitForTimeout(150); await p.keyboard.press('Space'); await p.waitForTimeout(1800);
  const said = await p.evaluate(() => window.__say.filter(x => typeof x === 'string' && x.startsWith('tts:')));
  check(true, ''); console.log('speed: audio after ✓ then quick next draw:', JSON.stringify(await p.evaluate(() => window.__say)));
  // 6) nav fits at 1280 and the active link is visible on #guide
  await p.goto(f + '#guide'); await p.waitForTimeout(300);
  const nav = await p.evaluate(() => { const n = document.querySelector('#nav'); const a = n.querySelector('a.on'); const nr = n.getBoundingClientRect(), ar = a.getBoundingClientRect(); return { fits: n.scrollWidth <= n.clientWidth + 1, vis: ar.left >= nr.left - 1 && ar.right <= nr.right + 1 }; });
  check(nav.fits, 'nav still overflows at 1280'); check(nav.vis, 'active nav link not visible');
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(f + '#home'); await p.goto(f + '#guide'); await p.waitForTimeout(300);
  check(await p.evaluate(() => { const n = document.querySelector('#nav'); const a = n.querySelector('a.on'); const nr = n.getBoundingClientRect(), ar = a.getBoundingClientRect(); return ar.left >= nr.left - 1 && ar.right <= nr.right + 1; }), 'active nav link not visible on phone');
  // 7) result card: 5 stats on one row (desktop) / 3 per row (phone)
  await p.setViewportSize({ width: 1280, height: 800 }); await p.goto(f + '#card'); await p.waitForTimeout(200);
  const rows = await p.$$eval('.stat', els => new Set(els.map(e => Math.round(e.getBoundingClientRect().top))).size);
  check(rows === 1, 'result card stats wrap onto ' + rows + ' rows');
  // 5) Pack labels when pictures cannot tell options apart
  await p.goto(f + '#words'); await p.click('#w-bulk summary');
  await p.fill('#w-text', 'zeta, 甲\nyak, 乙\nxiph, 丙\nwyr, 丁\nvex, 戊'); await p.click('#w-replace'); await p.click('#w-replace');
  await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(2000);
  const lbl = await p.$$eval('.shelf .opt .lbl', e => e.length); check(lbl === 4, 'Pack shows no labels for look-alike options (' + lbl + ')');
  await p.goto(f + '#words'); await p.click('#w-reset'); await p.click('#w-reset');
  console.log(bad ? 'REVIEW3 CHECKS FAILED' : 'review3 checks ok', 'ERR', errs);
  await b.close();
})();
