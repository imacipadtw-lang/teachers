/* Level 5 — Quiz Podium (inspired by Kahoot!: timed questions, speed points, streaks, podium)
 * Question types rotate: listen→word, picture→word, word→Chinese, sentence gap-fill.
 * Three friendly bot classmates race you to the podium. */
(function () {
  const EP = window.EP, u = EP.u;
  EP.registerGame({
    id: 'quiz', level: 5, icon: '🎤', title: 'Quiz Podium', titleZh: '搶答頒獎台',
    model: 'Kahoot!（2025 年美國 K-12 教室即時答題工具使用率第 1 名）',
    howZh: '看題目或聽發音，在時間內選出正確答案。越快答對分數越高，連續答對有連勝！',
    howEn: 'Answer fast for more points. Keep your streak and reach the podium!',
    skills: ['listening', 'meaning', 'reading', 'sentence'],
    noCountdown: false,
    start(ctx) {
      const root = ctx.root;
      root.style.background = 'linear-gradient(160deg,#46178f,#7b2ff7 60%,#a259ff)';
      const wrap = u.el('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '14px 10px 18px', gap: '10px', color: '#fff' } });
      root.appendChild(wrap);
      const T = ctx.difficulty === 'easy' ? 25 : ctx.difficulty === 'hard' ? 12 : 18;
      const bots = [{ name: 'Mia', av: '🦊', skill: 0.72 }, { name: 'Leo', av: '🐯', skill: 0.6 }, { name: 'Ken', av: '🐨', skill: 0.5 }].map((b) => Object.assign(b, { score: 0 }));
      if (ctx.difficulty === 'hard') bots.forEach((b) => (b.skill += 0.15));
      const items = ctx.items; let i = 0; let streak = 0; let my = 0; let current = null;

      const types = ['listen', 'pic', 'zh', 'cloze'];
      function qtype(item, n) {
        const order = types.slice(n % 4).concat(types.slice(0, n % 4));
        for (const t of order) {
          if (t === 'pic' && !EP.pic(item)) continue;
          if (t === 'cloze' && !EP.cloze(item)) continue;
          return t;
        }
        return 'listen';
      }
      function ask() {
        if (i >= items.length) return podium();
        ctx.hud.progress(i / items.length);
        const item = items[i]; const type = qtype(item, i);
        const ds = ctx.distractors(item, 3, {});
        const opts = u.shuffle([item].concat(ds));
        wrap.innerHTML = '';
        const head = u.el('div', { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' } });
        const qn = u.el('div', { class: 'chip' }, `Question ${i + 1} / ${items.length}`);
        let qtext, prompt;
        if (type === 'listen') { qtext = '🔊 Listen! Which word do you hear? 你聽到哪個字？'; prompt = u.el('button', { class: 'btn blue big', onclick: () => ctx.say(item) }, '🔊 Play again 再聽一次'); }
        else if (type === 'pic') { qtext = 'What is this? 這是什麼？'; prompt = u.el('div', { style: { fontSize: '6rem', lineHeight: 1 } }, EP.pic(item)); }
        else if (type === 'zh') { qtext = 'What does it mean? 這是什麼意思？'; prompt = u.el('div', { style: { fontSize: 'clamp(2.4rem,8vw,4rem)', fontWeight: 900 } }, item.word); }
        else {
          qtext = 'Fill in the blank. 填入正確的字'; const cz = EP.cloze(item);
          const s = item.sentence; const before = s.slice(0, cz.start), after = s.slice(cz.start + cz.text.length);
          prompt = u.el('div', { class: 'panel', style: { fontSize: 'clamp(1.4rem,4.5vw,2.2rem)', fontWeight: 800, maxWidth: '760px' } }, before, u.el('span', { style: { borderBottom: '4px solid #7b2ff7', padding: '0 30px', margin: '0 4px' } }, ' '), after,
            u.el('div', { class: 'zh muted', style: { fontSize: '1.05rem', marginTop: '6px' } }, item.sentenceZh));
        }
        head.append(qn, u.el('div', { style: { fontSize: '1.3rem', fontWeight: 800 } }, qtext), prompt);
        const timerBar = u.el('div', { style: { width: 'min(760px,96vw)', height: '14px', borderRadius: '999px', background: 'rgba(255,255,255,.25)', overflow: 'hidden' } });
        const fill = u.el('i', { style: { display: 'block', height: '100%', width: '100%', background: 'linear-gradient(90deg,#ffe066,#ff922b)' } }); timerBar.appendChild(fill);
        const timeTxt = u.el('div', { style: { fontSize: '2.4rem', fontWeight: 900, width: '84px', height: '84px', borderRadius: '50%', background: '#fff', color: '#46178f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 0 rgba(0,0,0,.25)' } }, T);
        const labelFor = (w) => type === 'zh' ? { label: w.zh, zh: true } : { label: w.word };
        const grid = ctx.kit.choiceGrid(opts.map(labelFor), (k) => choose(k));
        wrap.append(head, u.el('div', { class: 'row', style: { justifyContent: 'center' } }, timeTxt), timerBar, grid.el);
        const t0 = performance.now(); let answered = false; let left = T;
        current = { item, opts, grid, choose };
        if (type === 'listen') ctx.timeout(() => ctx.say(item), 250);
        else if (type !== 'cloze') ctx.timeout(() => ctx.say(item), 250);
        const tick = ctx.interval(() => {
          left = Math.max(0, T - (performance.now() - t0) / 1000);
          fill.style.width = (left / T) * 100 + '%'; timeTxt.textContent = Math.ceil(left);
          if (left <= 5 && left > 0 && Math.abs(left - Math.round(left)) < 0.06) EP.sfx.tick();
          if (left <= 0 && !answered) choose(-1);
        }, 100);
        function choose(k) {
          if (answered) return; answered = true; clearInterval(tick); grid.lock();
          const right = opts.indexOf(item); const ok = k === right;
          const frac = Math.max(0, 1 - (performance.now() - t0) / 1000 / T);
          const pts = ok ? Math.round(500 + 500 * frac) : 0;
          grid.mark(right, k);
          const res = ctx.answer(item, ok, { points: pts, silent: false });
          if (ok) { streak++; my += res.points; } else streak = 0;
          // bots answer
          bots.forEach((b) => { if (Math.random() < b.skill) b.score += Math.round(500 + 500 * Math.random() * 0.8); });
          const ranked = [{ name: EP.me.name, av: EP.me.avatar, score: ctx.score, me: true }].concat(bots).sort((a, b) => b.score - a.score);
          const pos = ranked.findIndex((r) => r.me) + 1;
          const banner = u.el('div', { class: 'panel', style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 20, minWidth: '280px', background: ok ? '#2b8a3e' : '#c92a2a', color: '#fff', animation: 'fadeIn .2s' } },
            u.el('div', { style: { fontSize: '2.4rem', fontWeight: 900 } }, ok ? '✔ Correct! 答對了' : k === -1 ? '⏰ Time\'s up! 時間到' : '✘ Incorrect 答錯了'),
            ok ? u.el('div', { style: { fontSize: '1.6rem' } }, `+${res.points}` + (streak >= 2 ? `  🔥 Answer streak ${streak}` : '')) : u.el('div', { style: { fontSize: '1.4rem' } }, `${item.word} = ${item.zh}`),
            u.el('div', { style: { marginTop: '6px', fontSize: '1.1rem' } }, `You are #${pos} 你現在第 ${pos} 名`));
          wrap.appendChild(banner);
          (ok ? Promise.resolve() : ctx.say(item)).then(() => ctx.timeout(() => { i++; ask(); }, ok ? 1300 : 900));
        }
      }
      function podium() {
        ctx.hud.progress(1);
        const ranked = [{ name: EP.me.name, av: EP.me.avatar, score: ctx.score, me: true }].concat(bots).sort((a, b) => b.score - a.score).slice(0, 3);
        wrap.innerHTML = '';
        const order = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
        const heights = { 0: '62%', 1: '84%', 2: '46%' };
        const pod = u.el('div', { class: 'podium', style: { height: '56vh', width: 'min(700px,96vw)' } }, order.map((r) => {
          const place = ranked.indexOf(r);
          return u.el('div', { class: 'col', style: { height: heights[place === 0 ? 1 : place === 1 ? 0 : 2], background: ['#ffd43b', '#ced4da', '#e8a87c'][place], color: '#3b2b00', animationDelay: (2 - place) * 0.5 + 's', outline: r.me ? '5px solid #fff' : '' } },
            u.el('div', { style: { fontSize: '3rem' } }, r.av), u.el('div', {}, r.name), u.el('div', { style: { fontSize: '1.5rem' } }, ['🥇', '🥈', '🥉'][place]), u.el('div', {}, r.score));
        }));
        wrap.append(u.el('h2', { style: { fontSize: '2.2rem', margin: '10px 0 0' } }, '🏆 Podium 頒獎台'), pod);
        EP.sfx.win();
        if (ranked.some((r) => r.me)) ctx.confetti();
        ctx.timeout(() => ctx.end(), 3800);
      }
      ask();
      return {
        test: {
          correct() { if (current) current.choose(current.opts.indexOf(current.item)); },
          wrong() { if (current) current.choose((current.opts.indexOf(current.item) + 1) % current.opts.length); },
        },
      };
    },
  });
})();
