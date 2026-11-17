const { chromium } = require('playwright');
require('fs').mkdirSync(require('os').tmpdir() + '/lbl-shots', { recursive: true });
const out = require('os').tmpdir() + '/lbl-shots/';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(() => {
    window.__log = [];
    const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) window.__log.push('buf:' + this.buffer.duration.toFixed(2)); return st.apply(this, a); };
    HTMLMediaElement.prototype.play = function () { window.__log.push('el:' + (this.playbackRate) + ':' + this.src.slice(0, 22)); return Promise.resolve(); };
    if (window.speechSynthesis) window.speechSynthesis.speak = () => window.__log.push('tts');
  });
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  const log = async (label) => { const l = await p.evaluate(() => { const x = window.__log; window.__log = []; return x; }); console.log(label, JSON.stringify(l)); };
  await p.goto(f + '#home');
  console.log('clips', await p.evaluate(() => Object.keys(window.LBL_CLIPS).length));
  // unlock + decode
  await p.mouse.click(5, 300); await p.waitForTimeout(1500);
  // spin with keyboard
  await p.goto(f + '#spin'); await p.mouse.click(5, 300); await p.waitForTimeout(1200);
  await p.keyboard.press('Space'); await p.waitForTimeout(3800);
  console.log('spin word:', await p.textContent('#sp-word'), '| models:', (await p.textContent('#sp-models')).trim());
  await log('spin audio');
  await p.keyboard.press('1'); console.log('box1 after key:', (await p.textContent('.box.b1')).replace(/\s+/g, ' '));
  await p.click('#sp-slow'); await log('slow');
  // catch
  await p.goto(f + '#catch'); await p.click('#c-start'); await p.waitForTimeout(1600);
  await log('catch intro+word');
  for (let i = 0; i < 10; i++) { await p.click('.opt >> nth=0'); await p.waitForTimeout(2100); }
  console.log('catch end:', (await p.textContent('.hud')).replace(/\s+/g, ' '));
  await log('catch run');
  // impostor
  await p.goto(f + '#impostor'); for (let i = 0; i < 8; i++) { await p.click('#i-none'); await p.waitForTimeout(500); await p.click('#i-next'); }
  console.log('imp:', (await p.textContent('.hud')).replace(/\s+/g, ' '));
  await log('imp audio');
  // build
  await p.goto(f + '#build'); for (let i = 0; i < 6; i++) { await p.click('[data-in] >> nth=0'); await p.click('#b-check'); await p.waitForTimeout(500); await p.click('#b-next'); }
  console.log('build:', (await p.textContent('.hud')).replace(/\s+/g, ' '));
  // check -> card
  await p.goto(f + '#check'); for (let i = 0; i < 6; i++) { await p.click('[data-a="1"], [data-o="0"]'); await p.click('#k-next'); }
  await p.waitForTimeout(300); console.log('hash:', await p.evaluate(() => location.hash));
  await p.selectOption('#cd-seat', '3'); await p.click('#cd-self [data-s="✔"]'); await p.click('#cd-next [data-n]');
  await p.click('#cd-copy'); await p.waitForTimeout(300);
  console.log('copy msg:', await p.textContent('#cd-msg'));
  console.log('clipboard:\n' + await p.evaluate(() => navigator.clipboard.readText()));
  // words bulk
  await p.goto(f + '#words'); await p.click('#w-bulk summary'); await p.click('#w-export');
  console.log('export first lines:', (await p.inputValue('#w-text')).split('\n').slice(0, 3));
  await p.fill('#w-text', 'apple, 蘋果, 🍎, y\nrice, 米飯, 🍚, n\nnoodle, 麵, 🍜, y, noodles\n123bad'); await p.click('#w-append');
  console.log('bad msg:', await p.textContent('#w-msg'));
  await p.fill('#w-text', 'apple, 蘋果, 🍎, y\nrice，米飯，🍚，n\nnoodle, 麵, 🍜, y, noodles\nsoup, 湯\npizza, 披薩, 🍕, y\ncake, 蛋糕, 🍰, n'); await p.click('#w-replace'); await p.click('#w-replace');
  console.log('replace msg:', await p.textContent('#w-msg'), '| rows:', await p.$$eval('#w-body tr', r => r.length));
  console.log('previews:', await p.$$eval('.pv', e => e.map(x => x.textContent)));
  // pizza has no clip -> tts fallback
  await p.goto(f + '#catch'); await p.click('#c-start'); await p.waitForTimeout(1500); await log('catch with new words');
  // teacher + guide + mute
  await p.goto(f + '#teacher'); await p.click('#t-go'); await p.waitForTimeout(1100); console.log('clock', await p.textContent('#t-clock'));
  await p.goto(f + '#guide'); console.log('guide rows', await p.$$eval('.guide tbody tr', r => r.length));
  await p.click('#mute'); await p.goto(f + '#spin'); await p.click('#sp-go'); await p.waitForTimeout(3500); await log('muted spin');
  await p.click('#mute');
  // layout overflow
  for (const [w, h] of [[390, 844], [1100, 900]]) {
    await p.setViewportSize({ width: w, height: h });
    for (const v of ['home', 'spin', 'catch', 'impostor', 'build', 'check', 'card', 'teacher', 'words', 'guide']) { await p.goto(f + '#' + v); await p.waitForTimeout(80); const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) console.log('overflow', w, v, o); }
  }
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(f + '#guide'); await p.screenshot({ path: out + 'guide-phone.png', fullPage: true });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.goto(f + '#catch'); await p.click('#c-start'); await p.waitForTimeout(1500); await p.click('.opt >> nth=0'); await p.waitForTimeout(200); await p.screenshot({ path: out + 'catch.png' });
  console.log('ERRORS', errs);
  await b.close();
})();
