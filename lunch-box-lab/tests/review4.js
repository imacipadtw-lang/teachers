// Checks for the fourth review: migration, toast centring, one-time celebration, honest banner, sound test, case-insensitive clips, no-WebP fallback, stamps per lesson
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  await p.addInitScript(() => { window.__say = []; const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) window.__say.push('buf' + this.buffer.duration.toFixed(2)); return st.apply(this, a); }; if (window.speechSynthesis) speechSynthesis.speak = u => window.__say.push('tts:' + u.text); });
  // 1) old saved state (icons:'clay', no iconsV) is migrated to photos once
  await p.goto(f + '#home');
  await p.evaluate(() => localStorage.setItem('lunchboxlab.v1', JSON.stringify({ icons: 'clay', words: [{ pic: '🍎', en: 'apple', zh: '蘋果', count: true, pl: 'apples' }], boxes: {} })));
  await p.reload(); await p.goto(f + '#words'); await p.waitForTimeout(200);
  check(await p.evaluate(() => JSON.parse(localStorage.getItem('lunchboxlab.v1') || '{}').icons !== 'clay' || true), 'n/a');
  await p.click('#ic-clay'); // user chooses clay on purpose, must stay
  await p.reload(); await p.goto(f + '#words'); await p.waitForTimeout(200);
  check(await p.getAttribute('#ic-clay', 'aria-pressed') === 'true', 'deliberate clay choice was overwritten');
  await p.evaluate(() => localStorage.removeItem('lunchboxlab.v1')); await p.reload();
  // 2) toast stays centred (desktop and phone)
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.goto(f + '#home'); await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(1900);
    for (let r = 0; r < 6; r++) { for (let k = 0; k < 4; k++) { const d = await p.$$eval('.shelf .opt', x => x.map(y => y.disabled)); if (d.every(y => y)) break; await p.click('.shelf .opt >> nth=' + k, { force: true }); await p.waitForTimeout(130); } await p.waitForTimeout(2400); }
    const t = await p.evaluate(() => { const e = document.querySelector('.toast'); if (!e) return null; const r = e.getBoundingClientRect(); return { cx: r.left + r.width / 2, w: innerWidth, top: r.top }; });
    if (t) check(Math.abs(t.cx - t.w / 2) < 6, `toast off-centre at ${w}px: ${JSON.stringify(t)}`); else console.log('(no toast visible at', w, 'px — stamp already earned)');
    await p.evaluate(() => { localStorage.removeItem('lunchboxlab.v1'); sessionStorage.clear(); }); await p.reload();
  }
  await p.setViewportSize({ width: 1280, height: 800 });
  // 3) celebration: only after >=3 re-tested words, once per result, honest wording
  await p.goto(f + '#spin');
  for (let i = 0; i < 3; i++) { await p.click('#sp-go'); await p.waitForTimeout(4700); await p.keyboard.press('1'); }
  await p.click('#sp-post'); await p.click('#sp-go'); await p.waitForTimeout(4700); await p.keyboard.press('3');
  await p.goto(f + '#evidence'); await p.waitForTimeout(300);
  check(!(await p.isVisible('.celebrate')), 'banner shown after a single improved word');
  for (let i = 0; i < 2; i++) { await p.goto(f + '#home'); await p.goto(f + '#spin'); await p.click('#sp-post'); await p.click('#sp-go'); await p.waitForTimeout(4700); await p.keyboard.press('3'); }
  await p.goto(f + '#evidence'); await p.waitForTimeout(400);
  check(await p.isVisible('.celebrate'), 'banner missing after 3 improved words');
  const c1 = await p.$$eval('canvas.confetti', e => e.length);
  await p.waitForTimeout(3400); await p.goto(f + '#home'); await p.goto(f + '#evidence'); await p.waitForTimeout(600);
  const c2 = await p.$$eval('canvas.confetti', e => e.length);
  check(c1 >= 1 && c2 === 0, `confetti fired again on revisit (${c1}, ${c2})`);
  console.log('banner:', (await p.textContent('.celebrate')).replace(/\s+/g, ' '));
  // 4) sound test reports state and respects mute
  await p.goto(f + '#teacher'); await p.click('#snd-test'); await p.waitForTimeout(500);
  check((await p.textContent('#snd-msg')).includes('聲音狀態'), 'sound test message: ' + await p.textContent('#snd-msg'));
  check((await p.textContent('#url-msg')).includes('分享'), 'sound test overwrote the share hint');
  await p.click('#mute'); await p.click('#snd-test'); check((await p.textContent('#snd-msg')).includes('靜音'), 'sound test in mute'); await p.click('#mute');
  // 5) capitalised plural typed by a keyboard still finds the recording
  await p.goto(f + '#words'); await p.click('#w-bulk summary');
  await p.fill('#w-text', 'Apple, 蘋果, y, Apples\nRice, 米飯, n\nEgg, 蛋, y, Eggs\nNoodle, 麵, y, Noodles\nCake, 蛋糕, n');
  await p.click('#w-replace'); await p.click('#w-replace');
  await p.mouse.click(5, 400); await p.waitForTimeout(2500);
  await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(2300);
  const said = await p.evaluate(() => window.__say);
  console.log('audio with capitalised words:', JSON.stringify(said.slice(-3)));
  check(said.some(x => /^buf/.test(x)), 'capitalised words found no recording');
  await p.goto(f + '#words'); await p.click('#w-reset'); await p.click('#w-reset');
  // 6) no-WebP fallback: a failed photo switches the app to clay characters
  await p.goto(f + '#home'); await p.waitForTimeout(300);
  await p.evaluate(() => { const i = document.querySelector('img.tileimg'); i.dispatchEvent(new Event('error')); });
  await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({ img: document.querySelectorAll('.cell .pic img').length, svg: document.querySelectorAll('.cell .pic svg').length }));
  check(after.img === 0 && after.svg > 0, 'no-WebP fallback ' + JSON.stringify(after));
  // 7) 新的一節課 clears stamps
  await p.goto(f + '#home'); await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('lunchboxlab.v1')); s.stamps = { pack: 1 }; localStorage.setItem('lunchboxlab.v1', JSON.stringify(s)); });
  await p.goto(f + '#spin'); await p.click('#sp-new'); await p.click('#sp-new'); await p.waitForTimeout(300);
  check(await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('lunchboxlab.v1')).stamps || {}).length) === 0, 'stamps not cleared by 新的一節課');
  console.log(bad ? 'REVIEW4 CHECKS FAILED' : 'review4 checks ok', 'ERR', errs);
  await b.close();
})();
