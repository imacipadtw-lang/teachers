// Spaced retrieval: words still marked "?" (Box 1) or "△" (Box 2) in Spin are picked more often in Catch and Pack. Tests the real source code.
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const a = src.indexOf('const wBox='), b = src.indexOf('const words=');
if (a < 0 || b < a) { console.log('FAIL could not find the weighting code in app.html'); process.exit(1); }
const S = { boxes: { rice: 1, egg: 2, apple: 3 } };
const { wBox, weightedPick, weightedOrder } = new Function('S', src.slice(a, b) + '; return {wBox,weightedPick,weightedOrder};')(S);
let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const W = ['rice', 'egg', 'apple', 'cake', 'fish', 'naan'].map(en => ({ en }));
check(wBox(W[0]) === 3 && wBox(W[1]) === 2 && wBox(W[2]) === 1 && wBox(W[3]) === 1, 'weights should be 3 / 2 / 1 / 1');
const N = 20000, cnt = {}; for (let i = 0; i < N; i++) { const w = weightedPick(W); cnt[w.en] = (cnt[w.en] || 0) + 1; }
// expected shares: rice 3/9, egg 2/9, others 1/9 each
const near = (k, p) => Math.abs(cnt[k] / N - p) < 0.02;
check(near('rice', 3 / 9) && near('egg', 2 / 9) && near('apple', 1 / 9) && near('naan', 1 / 9), 'weightedPick shares are off: ' + JSON.stringify(cnt));
let first = 0, riceIn6of13 = 0, base = 0; const W13 = Array.from({ length: 13 }, (_, i) => ({ en: i === 0 ? 'rice' : 'w' + i }));
for (let i = 0; i < 6000; i++) { const o = weightedOrder(W13, 6); if (new Set(o.map(x => x.en)).size !== 6) bad++ && console.log('FAIL duplicate words in one Pack game'); if (o.some(x => x.en === 'rice')) riceIn6of13++; if (o.length === 6) first++; }
check(first === 6000, 'weightedOrder must return exactly n words');
check(riceIn6of13 / 6000 > 6 / 13 + 0.08, 'a Box 1 word should appear in a 6-word Pack game clearly more often than 6/13: ' + (riceIn6of13 / 6000).toFixed(2));
// nothing rated yet: uniform
const S2 = { boxes: {} }; const f2 = new Function('S', src.slice(a, b) + '; return weightedPick;')(S2); const c2 = {}; for (let i = 0; i < 12000; i++) { const w = f2(W); c2[w.en] = (c2[w.en] || 0) + 1; }
check(Object.values(c2).every(v => Math.abs(v / 12000 - 1 / 6) < 0.02), 'with no ratings every word should be equally likely: ' + JSON.stringify(c2));
console.log(bad ? 'WEIGHTS FAILED' : 'weights ok');
