// Every phrase the app can speak must exist as a real recording, and playing the games must never fall back to the device voice.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => {
    window.__say = [];
    const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) window.__say.push('buf'); return st.apply(this, a); };
    if (window.speechSynthesis) speechSynthesis.speak = u => window.__say.push('tts:' + u.text);
  });
  const f = (process.env.LBL_URL || 'file:///home/user/lunch-box-lab.html'); let bad = 0; const check = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };

  // 1) static coverage: every word, both sentence frames and every fixed phrase has a recording
  await p.goto(f + '#home'); await p.goto(f + '#words'); await p.waitForTimeout(400);
  const words = await p.evaluate(() => Array.from(document.querySelectorAll('[id^="w-en-"]')).map((e, i) => ({ en: e.value.trim(), count: document.querySelector('#w-ct-' + i).checked, pl: document.querySelector('#w-pl-' + i).value.trim() })));
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const phrases = ["Let's go!", 'Listen and catch!', 'Find the impostor!', 'Build the sentence!', 'Can you count it?', 'Great job!', 'Try again!', 'Awesome!', 'You got it!', 'Good try!'];
  const keys = [...phrases];
  for (const w of words) { const form = w.count ? (w.pl || w.en + 's') : w.en; keys.push(cap(w.en) + '.', `I like ${form}.`, `I want some ${form}.`); }
  const have = await p.evaluate(() => Object.fromEntries(Object.entries(window.LBL_CLIPS || {}).map(([k, v]) => [k, typeof v === 'string' && v.startsWith('data:audio') && v.length > 2000])));
  const missing = keys.filter(k => !have[k]);
  check(words.length >= 13, 'expected the 13 default words, got ' + words.length);
  check(missing.length === 0, 'no recording for: ' + JSON.stringify(missing));

  // 2) playing: Catch (10 rounds), Pack the Box (6 rounds) and Party Menu must only use recordings
  await p.goto(f + '#home'); await p.goto(f + '#catch'); await p.click('#c-start'); await p.waitForTimeout(1600);
  for (let i = 0; i < 10; i++) { await p.click('.opt >> nth=0'); await p.waitForTimeout(2100); }
  await p.goto(f + '#home'); await p.goto(f + '#pack'); await p.click('#pk-start'); await p.waitForTimeout(1900);
  for (let r = 0; r < 6; r++) { for (let k = 0; k < 4; k++) { const d = await p.$$eval('.shelf .opt', x => x.map(y => y.disabled)); if (d.every(y => y)) break; await p.click('.shelf .opt >> nth=' + k, { force: true }); await p.waitForTimeout(130); } await p.waitForTimeout(2400); }
  // Party Menu: pick three foods (one from India), answer each form question, reach the finished menu, tap the menu lines
  await p.evaluate(() => { try { const s = JSON.parse(localStorage.getItem('lunchboxlab.v1') || '{}'); s.party = null; localStorage.setItem('lunchboxlab.v1', JSON.stringify(s)); } catch (e) {} });
  await p.goto(f + '#home'); await p.goto(f + '#party'); await p.waitForTimeout(500);
  const idx = await p.$$eval('.pm-food', x => x.map((e, i) => [i, !!e.querySelector('.tag')]));
  const picks = [idx.find(x => x[1])[0], ...idx.filter(x => !x[1]).slice(0, 2).map(x => x[0])];
  for (const i of picks) { await p.click('.pm-food >> nth=' + i); await p.waitForTimeout(500); }
  await p.click('#pm-next'); await p.waitForTimeout(700);
  for (let k = 0; k < 3; k++) {
    await p.click('[data-o] >> nth=0'); await p.waitForTimeout(500);
    if (!(await p.isVisible('#pm-go'))) { await p.click('[data-o]:not([disabled]) >> nth=0'); await p.waitForTimeout(500); }
    await p.click('#pm-go'); await p.waitForTimeout(900);
  }
  await p.waitForTimeout(600);
  for (let i = 0; i < 3; i++) { await p.click('.menu-item >> nth=' + i); await p.waitForTimeout(700); }
  const said = await p.evaluate(() => window.__say);
  const tts = said.filter(x => x.startsWith('tts:') && x.slice(4).trim()); // the blank one-space utterance only unlocks iPad speech
  check(said.some(x => x === 'buf'), 'no recorded audio was played at all');
  check(tts.length === 0, 'device voice was used for: ' + JSON.stringify(tts.slice(0, 6)));
  console.log(bad ? 'VOICE FAILED' : 'voice ok', `(${keys.length} phrases covered, ${said.length} plays, 0 device voice)`, 'ERR', errs);
  await b.close();
})();
