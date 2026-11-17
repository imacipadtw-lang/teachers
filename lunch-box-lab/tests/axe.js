// Accessibility audit (axe-core, WCAG 2.0/2.1 A+AA and best practice) on every screen,
// tablet landscape/portrait and phone, light and dark. The skip-link rule is off because the app routes with #hash links.
// Needs axe-core: cd tests && npm install axe-core --no-save   (the test is skipped when it is missing)
const { chromium } = require('playwright');
let axeSrc;
try { axeSrc = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); }
catch (e) { console.log('axe skipped: run "cd tests && npm install axe-core --no-save" to enable this check'); process.exit(0); }
(async () => {
  const b = await chromium.launch(); const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html'); let bad = 0; const errs = [];
  const views = ['home', 'spin', 'catch', 'pack', 'speed', 'impostor', 'build', 'check', 'card', 'teacher', 'evidence', 'words', 'guide'];
  for (const [w, h, cs] of [[1180, 820, 'light'], [820, 1180, 'light'], [1180, 820, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, colorScheme: cs })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    for (const v of views) {
      await p.goto(f + '#home'); await p.goto(f + '#' + v); await p.waitForTimeout(400);
      for (const id of ['#pk-start', '#sr-start', '#i-start', '#b-start', '#c-start', '#ch-start']) { if (await p.$(id)) { await p.click(id, { force: true }).catch(() => {}); await p.waitForTimeout(900); break; } }
      await p.evaluate(src => { if (!window.axe) { const s = document.createElement('script'); s.textContent = src; document.head.appendChild(s); } }, axeSrc);
      const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'], rules: { 'skip-link': { enabled: false } } })).violations.map(x => x.id + ' (' + x.nodes.length + '): ' + x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')));
      for (const x of r) { bad++; console.log('FAIL axe', w, cs, v, x); }
    }
    await p.context().close();
  }
  console.log(bad ? 'AXE FAILED' : 'axe ok', 'ERR', errs);
  await b.close();
})();
