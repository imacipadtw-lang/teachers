// Anime layer: decorative only, never blocks a tap, student screens only, cleans up after itself, respects reduced motion and the teacher switch.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html'); let bad = 0; const errs = [];
  const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  const open = async (opts) => { const c = await b.newContext(opts); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };

  // 1) normal motion, tablet
  let p = await open({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  await p.goto(f + '#home'); await p.goto(f + '#catch'); await p.waitForTimeout(500);
  const st = await p.evaluate(() => { const m = document.querySelector('.mx'); const cs = m && getComputedStyle(m); return m ? { aria: m.getAttribute('aria-hidden'), pe: cs.pointerEvents, shown: cs.display !== 'none', focusable: m.querySelectorAll('a,button,input,[tabindex]').length } : null; });
  check(st && st.aria === 'true' && st.pe === 'none' && st.shown && st.focusable === 0, 'mascot must be decorative, visible on #catch and not focusable: ' + JSON.stringify(st));
  // a tap right under the mascot must reach the page, not the mascot
  const under = await p.evaluate(() => { const r = document.querySelector('.mx').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && !e.closest('.mx'); });
  check(under, 'mascot blocks taps');
  for (const v of ['teacher', 'words', 'guide', 'evidence']) { await p.goto(f + '#home'); await p.goto(f + '#' + v); await p.waitForTimeout(250); check(await p.evaluate(() => getComputedStyle(document.querySelector('.mx')).display === 'none'), 'mascot should be hidden on #' + v); }
  await p.goto(f + '#home'); await p.goto(f + '#catch'); await p.waitForTimeout(300);
  await p.click('#c-start'); await p.waitForTimeout(1500); await p.click('.opt >> nth=0', { force: true }); await p.waitForTimeout(100);
  await p.evaluate(() => { ANIME.good(); ANIME.good(); ANIME.good(); ANIME.bad(); ANIME.win(); ANIME.stamp({ name: 'Catch', html: '<span class="emo">🎧</span>', n: 1, total: 6 }); });
  await p.waitForTimeout(250);
  check(await p.evaluate(() => document.querySelectorAll('.fx-seal').length) === 1, 'stamp seal was not shown');
  check(await p.evaluate(() => document.querySelectorAll('.fx-pop,.fx-star,.fx-burst,.fx-combo').length) > 5, 'effects were not created');
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); check(ov <= 0, 'effects widen the page by ' + ov);
  await p.waitForTimeout(2400);
  check(await p.evaluate(() => document.querySelectorAll('.fx-pop,.fx-star,.fx-burst,.fx-combo,.fx-seal').length) === 0, 'effect elements were not cleaned up');
  // idle nudge: Boxy offers the screen's own instruction as a bubble (no audio)
  const hint = await p.evaluate(() => ANIME.hint()); await p.waitForTimeout(150);
  check(hint === 'Listen and catch!' && await p.evaluate(() => document.querySelector('.mx-bubble.on') && document.querySelector('.mx-bubble').textContent === 'Listen and catch!'), 'idle nudge text wrong: ' + hint);
  // the food choices bob (decorative animation on the picture, never on the button itself)
  const bob = await p.evaluate(() => { const i = document.querySelector('.opt .ico img,.opt .ico svg'); const o = document.querySelector('.opt'); return i && getComputedStyle(i).animationName === 'bob' && getComputedStyle(o).animationName !== 'bob'; });
  check(bob, 'option pictures should bob while the option button stays still');
  // teacher switch
  await p.goto(f + '#home'); await p.goto(f + '#teacher'); await p.waitForTimeout(300);
  check((await p.getAttribute('#fx-toggle', 'aria-pressed')) === 'true', 'toggle should start on');
  await p.click('#fx-toggle'); check((await p.getAttribute('#fx-toggle', 'aria-pressed')) === 'false', 'toggle did not switch off');
  await p.goto(f + '#home'); await p.goto(f + '#catch'); await p.waitForTimeout(300);
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.mx')).display === 'none'), 'mascot still visible after switching off');
  await p.evaluate(() => { ANIME.good(); }); await p.waitForTimeout(150);
  check(await p.evaluate(() => document.querySelectorAll('.fx-pop,.fx-star').length) === 0, 'effects ran while switched off');
  await p.evaluate(() => ANIME.set(true));

  // 2) the phone is too small for a corner character
  p = await open({ viewport: { width: 390, height: 844 } });
  await p.goto(f + '#home'); await p.goto(f + '#catch'); await p.waitForTimeout(300);
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.mx')).display === 'none'), 'mascot should be hidden on a phone');

  // 3) reduced motion: no effects at all, mascot stays still
  p = await open({ viewport: { width: 1180, height: 820 }, reducedMotion: 'reduce' });
  await p.goto(f + '#home'); await p.goto(f + '#catch'); await p.waitForTimeout(300);
  await p.evaluate(() => { ANIME.good(); ANIME.bad(); ANIME.win(); ANIME.stamp({ name: 'x', html: '', n: 1, total: 6 }); }); await p.waitForTimeout(150);
  check(await p.evaluate(() => document.querySelectorAll('.fx-pop,.fx-star,.fx-burst,.fx-combo,.fx-seal').length) === 0, 'effects must not run with reduced motion');
  console.log(bad ? 'ANIME FAILED' : 'anime ok', 'ERR', errs.slice(0, 4)); await b.close();
})();
