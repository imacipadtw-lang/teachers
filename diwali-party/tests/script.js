/* 上課腳本 script.html 的自動測試
 *   在倉庫根目錄：python3 -m http.server 8791 &
 *   node diwali-party/tests/script.js
 * 檢查：每一句都對得上 lines.json 與 voice/*.mp3；14 個分頁在筆電與 iPad 尺寸
 * 整頁看得完（不用捲動）；任何尺寸都不左右捲動；單句與整段播放、分頁切換正常。
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8791/diwali-party';
const DIR = path.join(__dirname, '..');
const SIZES = [[1512, 860], [1280, 800], [1180, 820], [820, 1180], [1024, 768], [390, 844]];
const FITMIN = 768;            // 這個寬度以上，每一個分頁都要整頁看得完
const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); };

(async () => {
  // 1. 資料與音檔
  const L = JSON.parse(fs.readFileSync(path.join(DIR, 'lines.json'), 'utf8'));
  const ids = [].concat(...L.groups.map(g => g.lines.map(x => x.id)));
  const html = fs.readFileSync(path.join(DIR, 'script.html'), 'utf8');
  const used = new Set([...html.matchAll(/data-a="([a-z0-9]+)"/g)].map(m => m[1]));
  ok(ids.length === used.size, `lines.json ${ids.length} 句，頁面只用了 ${used.size} 句`);
  ids.forEach(i => {
    ok(used.has(i), `${i} 沒有出現在 script.html（改了 lines.json 要重跑 make_script.py）`);
    ok(fs.existsSync(path.join(DIR, 'voice', i + '.mp3')), `缺少音檔 voice/${i}.mp3`);
  });
  [...used].forEach(i => ok(ids.includes(i), `script.html 用了 lines.json 沒有的 ${i}`));

  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errs = [];
    p.on('pageerror', e => errs.push('' + e));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto(BASE + '/script.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(250);
    const tabs = await p.$$('.tab');
    ok(tabs.length >= 10, `${w}×${h} 只找到 ${tabs.length} 個分頁`);
    for (let i = 0; i < tabs.length; i++) {
      await tabs[i].click();
      await p.waitForTimeout(90);
      const r = await p.evaluate(() => {
        const pn = [...document.querySelectorAll('.panel')].find(x => !x.hidden);
        return { id: pn.id, over: pn.scrollHeight - pn.clientHeight,
                 px: document.documentElement.scrollWidth - window.innerWidth,
                 py: document.documentElement.scrollHeight - window.innerHeight };
      });
      ok(r.px <= 1, `${w}×${h} ${r.id} 會左右捲動 ${r.px}px`);
      ok(r.py <= 1, `${w}×${h} ${r.id} 整頁會上下捲動 ${r.py}px`);
      if (w >= FITMIN) ok(r.over <= 1, `${w}×${h} ${r.id} 看不完，還差 ${r.over}px`);
    }
    ok(!errs.length, `${w}×${h} 有錯誤：${errs.join(' | ')}`);
    await p.close();
  }

  // 2. 播放
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const got = [];
  p.on('request', r => { const u = r.url(); if (u.includes('/voice/')) got.push(u.split('/').pop().replace('.mp3', '')); });
  await p.goto(BASE + '/script.html#s1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  await p.click('#p-s1 .play');
  await p.waitForTimeout(700);
  ok(got.length === 1, `單句播放應該只送出一個音檔，實際 ${got.join(',') || '無'}`);
  await p.close();

  // 整段播放另開一個乾淨的分頁：同一頁播過的音檔會被瀏覽器快取，就看不到第二次的請求
  const q = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const seq = [];
  q.on('request', r => { const u = r.url(); if (u.includes('/voice/')) seq.push(u.split('/').pop().replace('.mp3', '')); });
  await q.goto(BASE + '/script.html#s1', { waitUntil: 'networkidle' });
  await q.waitForTimeout(300);
  const want = (await q.getAttribute('#p-s1 .seq', 'data-seq')).split(',');
  await q.click('#p-s1 .seq');
  ok((await q.textContent('#p-s1 .seq')).includes('停止'), '整段播放時按鈕沒變成「停止播放」');
  await q.waitForTimeout(23000);
  ok(seq.join(',') === want.join(','), `整段播放順序不對：要 ${want.join(',')}，實際 ${seq.join(',')}`);
  ok(!(await q.textContent('#p-s1 .seq')).includes('停止'), '整段播完按鈕沒變回來');
  // 分頁切換會停下播放
  await q.click('#p-s1 .seq'); await q.waitForTimeout(400);
  await q.click('.tab[data-p="core"]'); await q.waitForTimeout(400);
  ok(await q.evaluate(() => !document.getElementById('p-core').hidden), '切換分頁沒有換頁');
  ok(await q.evaluate(() => { const a = document.querySelector('#p-s1 .seq'); return !a.dataset.on; }),
     '換分頁沒有停下整段播放');
  await q.close();
  await b.close();

  if (fail.length) { console.log('FAIL\n' + fail.join('\n')); process.exit(1); }
  console.log('ALL OK  script.html');
})();
