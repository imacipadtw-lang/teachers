const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1100, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await c.newPage(); const errs = []; p.on('pageerror', x => errs.push(x.message));
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  await p.goto(f + '#words'); await p.click('#w-bulk summary');
  // 1, 5, 6
  await p.fill('#w-text', 'sweet potato, 地瓜，番薯, 🍠, y\nnoodle, 麵, 🍜, noodles\napple, y\nice cream, 冰淇淋, 🍦, n\negg, 蛋, 🥚, y\ncherry tomato, 小番茄, 🍅, y\nrice, 米飯, 🍚, n');
  await p.click('#w-replace'); await p.click('#w-replace');
  console.log('msg', await p.textContent('#w-msg'));
  console.log(await p.evaluate(() => JSON.parse(localStorage.getItem('lunchboxlab.v1')).words.map(w => `${w.en}|${w.zh}|${w.pic}|${w.count}|${w.pl}`)));
  console.log(await p.$$eval('.pv', e => e.map(x => x.textContent)));
  await p.click('#w-export'); console.log('export:', (await p.inputValue('#w-text')).split('\n'));
  await p.click('#w-replace'); await p.click('#w-replace');
  console.log('after re-paste:', await p.evaluate(() => JSON.parse(localStorage.getItem('lunchboxlab.v1')).words.map(w => `${w.en}|${w.zh}|${w.pic}|${w.count}|${w.pl}`)));
  // 8 append with duplicate row already in table
  await p.click('#w-add'); await p.fill('#w-en-7', 'apple'); await p.click('#w-bulk summary');
  await p.fill('#w-text', 'pear, 梨子, 🍐, y'); await p.click('#w-append');
  console.log('8 append msg:', await p.textContent('#w-msg'), 'rows', await p.$$eval('#w-body tr', r => r.length));
  // articles in wrong options
  const opts = await p.evaluate(() => { return null; });
  // check view distractors for vowel words: run several times
  let seen = new Set();
  for (let k = 0; k < 6; k++) { await p.goto(f + '#check'); for (let i = 0; i < 6; i++) { const os = await p.$$eval('[data-o]', e => e.map(x => x.textContent)); os.forEach(o => seen.add(o)); await p.click('[data-a="1"], [data-o="0"]'); await p.click('#k-next'); } }
  console.log('check options with a/an:', [...seen].filter(x => / an? /.test(x)));
  let imp = new Set();
  for (let k = 0; k < 4; k++) { await p.goto(f + '#home'); await p.goto(f + '#impostor'); for (let i = 0; i < 8; i++) { imp.add(await p.$$eval('.tok', e => e.map(x => x.textContent).join(' '))); await p.click('#i-none'); await p.click('#i-next'); } }
  console.log('impostor with a/an:', [...imp].filter(x => / an? /.test(x)));
  // 7 mute session only
  await p.click('#mute'); await p.goto(f + '#catch'); console.log('7 mute note visible:', await p.isVisible('#mute-note'));
  await p.click('#c-unmute'); console.log('7 unmuted, note hidden:', !(await p.isVisible('#mute-note')), await p.textContent('#mute'));
  await p.click('#mute');
  const p2 = await c.newPage(); await p2.goto(f + '#catch'); console.log('7 new tab muted?', await p2.textContent('#mute'));
  // 4 multi-tab
  await p.goto(f + '#spin'); await p2.goto(f + '#teacher');
  await p.click('#sp-mute').catch(() => { });
  await p.click('#sp-go'); await p.waitForTimeout(3600); await p.keyboard.press('1');
  await p.click('#sp-go'); await p.waitForTimeout(3600); await p.keyboard.press('2');
  await p2.click('[data-g="1"][data-d="1"]'); await p.waitForTimeout(300);
  console.log('4 boxes kept after other tab +1:', await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('lunchboxlab.v1')).boxes)), 'groups', await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('lunchboxlab.v1')).groups)));
  // 3 running phase edit
  await p2.click('#t-go'); await p2.waitForTimeout(1200); const before = await p2.textContent('#t-clock');
  await p2.fill('#ph-0', '2'); await p2.dispatchEvent('#ph-0', 'change'); await p2.waitForTimeout(700);
  console.log('3 running edit 5->2:', before, '->', await p2.textContent('#t-clock'));
  await p2.fill('#ph-0', '0'); await p2.dispatchEvent('#ph-0', 'change'); await p2.waitForTimeout(700);
  console.log('3 running edit ->0 moves on:', await p2.textContent('#t-name'), await p2.textContent('#t-clock'));
  // mini timer appears in the spin tab via storage sync
  await p.waitForTimeout(800); console.log('4 other tab mini timer:', await p.textContent('#mini'), 'hidden', await p.isHidden('#mini'));
  // 2 evidence labels
  await p.goto(f + '#evidence'); console.log('2 labels:', await p.$$eval('.ev-table td:last-child', e => [...new Set(e.map(x => x.textContent))]));
  // 10a setMode resets stage
  await p.goto(f + '#spin'); await p.click('#sp-go'); await p.waitForTimeout(3600); await p.click('#sp-post');
  console.log('10a stage after mode switch:', await p.textContent('#sp-word'), await p.isDisabled('#sp-say'));
  console.log('ERRORS', errs);
  await b.close();
})();
