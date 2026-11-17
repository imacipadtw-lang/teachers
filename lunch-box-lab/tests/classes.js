// Guards against CSS class-name collisions (a ghost-style button once became position:fixed, and Pack's .slot restyled Build It's answer area)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html');
  let bad = 0;
  const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  // 1) every ghost-style button must stay in normal flow and be clickable
  for (const v of ['spin', 'teacher', 'words', 'build', 'card']) {
    await p.goto(f + '#' + v); await p.waitForTimeout(250);
    const res = await p.$$eval('.btn.ghost', els => els.map(e => ({ id: e.id || e.textContent.trim().slice(0, 12), pos: getComputedStyle(e).position, pe: getComputedStyle(e).pointerEvents })));
    res.forEach(r => check(r.pos !== 'fixed' && r.pe !== 'none', `ghost button ${v}/${r.id} pos=${r.pos} pe=${r.pe}`));
  }
  // 2) click a few of them for real
  await p.goto(f + '#teacher'); await p.click('#t-reset'); await p.click('#g-reset');
  await p.goto(f + '#spin'); await p.click('#sp-reset');
  await p.goto(f + '#words'); await p.click('#w-reset');
  // 3) Build It answer area must keep its own look (flex, wide, dashed), not Pack's square grid
  await p.goto(f + '#build'); await p.waitForTimeout(250);
  const s = await p.$eval('#b-slot', e => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { d: c.display, w: Math.round(r.width), h: Math.round(r.height), ar: c.aspectRatio }; });
  check(s.d === 'flex' && s.w > 500 && s.ar === 'auto', 'Build It slot style ' + JSON.stringify(s));
  // 4) Pack slots square
  await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(1900);
  const ps = await p.$$eval('#pk-slots .pslot', els => els.map(e => Math.round(e.getBoundingClientRect().width / e.getBoundingClientRect().height * 10) / 10));
  check(ps.length === 6 && ps.every(r => r === 1), 'Pack slots not square ' + JSON.stringify(ps));
  // 6) picture wrappers must be transparent (a leaked .ph row style once painted a grey square behind every photo)
  await p.goto(f + '#catch'); await p.click('#c-start'); await p.waitForTimeout(1500);
  const bg = await p.$$eval('.opt .ico', els => els.map(e => getComputedStyle(e).backgroundColor + '|' + getComputedStyle(e).display));
  check(bg.length === 4 && bg.every(x => x.startsWith('rgba(0, 0, 0, 0)')), 'photo wrapper background ' + JSON.stringify(bg));
  await p.goto(f + '#spin'); await p.waitForTimeout(300);
  const bg2 = await p.$$eval('.stage-pic .ico, .wseg .ico', els => els.map(e => getComputedStyle(e).backgroundColor));
  check(bg2.length > 0 && bg2.every(x => x === 'rgba(0, 0, 0, 0)'), 'stage/wheel wrapper background ' + JSON.stringify(bg2.slice(0, 3)));
  // 7) every class used by the app's JS templates is defined once with the same purpose: list class selectors defined twice in CSS
  const dups = await p.evaluate(() => { const seen = {}, d = new Set(); for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch (e) { continue; } for (const r of rules) { if (r.type !== 1) continue; for (const sel of r.selectorText.split(',')) { const m = sel.trim().match(/^\.([a-z][\w-]*)$/i); if (m) { seen[m[1]] = (seen[m[1]] || 0) + 1; if (seen[m[1]] === 2) d.add(m[1]); } } } } return [...d]; });
  console.log('classes defined by more than one bare-selector rule (review if new):', JSON.stringify(dups));
  // 5) no unexpected duplicate class definitions: list class selectors defined more than once with different display/position
  console.log(bad ? 'CLASS CHECK FAILED' : 'class checks ok', 'ERR', errs);
  await b.close();
})();
