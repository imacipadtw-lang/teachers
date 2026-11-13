/* Game runner + shared game kit.
 * Every level game is a plugin: EP.registerGame({ id, level, title, titleZh, model, modelWhy, skills, howZh, howEn, start(ctx) })
 * start(ctx) builds the game inside ctx.root and must call ctx.end() when the round is over.
 * The runner owns scoring, combos, spaced repetition, quests, XP/coins and the results screen. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u;

  /* ---------- helpers usable by all games ---------- */
  const kit = (EP.kit = {});

  /** HiDPI canvas that fills its parent and tracks size */
  kit.canvas = function (parent, onResize) {
    const cv = u.el('canvas'); parent.appendChild(cv);
    const g = cv.getContext('2d'); const st = { cv, g, w: 0, h: 0, dpr: 1 };
    const fit = () => {
      const r = parent.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
      st.w = Math.max(1, r.width); st.h = Math.max(1, r.height); st.dpr = dpr;
      cv.width = Math.round(st.w * dpr); cv.height = Math.round(st.h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      onResize && onResize(st.w, st.h);
    };
    fit(); st.fit = fit;
    const ro = new ResizeObserver(fit); ro.observe(parent); st.destroy = () => ro.disconnect();
    return st;
  };
  /** draw an emoji/text centred at x,y */
  kit.emoji = function (g, ch, x, y, size) { g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(ch, x, y); }; // opaque fill: colour emoji take the fill alpha
  kit.text = function (g, t, x, y, size, color, opts) {
    opts = opts || {}; g.font = `${opts.weight || 900} ${size}px ${opts.font || "'Baloo 2','Nunito','Noto Sans TC',sans-serif"}`;
    g.textAlign = opts.align || 'center'; g.textBaseline = 'middle';
    if (opts.stroke) { g.lineWidth = opts.strokeW || Math.max(3, size / 7); g.strokeStyle = opts.stroke; g.lineJoin = 'round'; g.strokeText(t, x, y); }
    g.fillStyle = color || '#fff'; g.fillText(t, x, y);
  };
  kit.roundRect = function (g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** fit text to a width: returns font size */
  kit.fitSize = function (g, t, maxW, start, min) { let s = start; g.font = `900 ${s}px 'Baloo 2',sans-serif`; while (s > (min || 10) && g.measureText(t).width > maxW) { s -= 1; g.font = `900 ${s}px 'Baloo 2',sans-serif`; } return s; };

  /** particles for canvas games */
  kit.particles = function () {
    const ps = [];
    return {
      burst(x, y, color, n, speed) { for (let i = 0; i < (n || 18); i++) { const a = Math.random() * Math.PI * 2, s = (speed || 260) * (0.4 + Math.random()); ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.8 + Math.random() * 0.4, t: 0, c: color || u.pick(['#ffd43b', '#69db7c', '#4dabf7', '#f783ac', '#ff922b']), r: 3 + Math.random() * 4 }); } },
      update(dt) { for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; if (p.t > p.life) ps.splice(i, 1); } },
      draw(g) { for (const p of ps) { g.globalAlpha = Math.max(0, 1 - p.t / p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; },
    };
  };

  /** A prompt card element: picture/Chinese/word + replay button. show: {pic, zh, word, sentence} */
  kit.promptCard = function (ctx, item, show) {
    show = Object.assign({ pic: true, zh: true, word: false, audio: true }, show || {});
    const pic = show.pic ? EP.pic(item) : '';
    const card = u.el('div', { class: 'prompt-card' },
      show.audio ? u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: (e) => { e.stopPropagation(); ctx.say(item); } }, '🔊') : null,
      pic ? u.el('div', { class: 'pic' }, pic) : null,
      u.el('div', {},
        show.word ? u.el('div', { class: 'txt' }, item.word) : null,
        show.zh && (!pic || EP.settings.showChinese) ? u.el('div', { class: 'zhs zh' }, item.zh) : null,
        show.sentence ? u.el('div', { class: 'zhs' }, show.sentence) : null));
    return card;
  };

  /** Kahoot-style 4-colour answer grid. labels: array of {item, html?}. Returns {el, lock(), mark(rightIdx, pickedIdx)} */
  kit.choiceGrid = function (opts, onPick) {
    const shapes = ['▲', '◆', '●', '■'];
    const el = u.el('div', { class: 'choices' });
    let locked = false;
    const btns = opts.map((o, i) => {
      const b = u.el('button', { class: 'choice c' + (i % 4), 'data-i': i },
        u.el('span', { class: 'shape' }, shapes[i % 4]),
        o.pic ? u.el('span', { class: 'pic' }, o.pic) : null,
        o.label != null ? u.el('span', { class: o.zh ? 'zh' : '' }, o.label) : null);
      b.addEventListener('click', () => { if (!locked) onPick(i, b); });
      el.appendChild(b); return b;
    });
    return { el, btns, lock() { locked = true; }, unlock() { locked = false; },
      mark(right, picked) { btns.forEach((b, i) => { if (i === right) b.classList.add('right'); else if (i === picked) b.classList.add('wrongpick'); else b.classList.add('dim'); }); } };
  };

  /** Letter tiles speller: tap tiles in order to spell `word`. Calls onDone(ok, typed). */
  kit.speller = function (ctx, item, onDone, opts) {
    opts = opts || {};
    const target = EP.spellKey(item);
    const letters = target.replace(/[ ]/g, '').split('');
    const extra = opts.extra != null ? opts.extra : (ctx.difficulty === 'easy' ? 0 : ctx.difficulty === 'hard' ? 4 : 2);
    const pool = u.shuffle(letters.concat(Array.from({ length: extra }, () => u.pick('abcdefghijklmnoprstuwy'.split('')))));
    const wrap = u.el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' } });
    const slots = u.el('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center' } });
    const tiles = u.el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '680px' } });
    const slotEls = []; for (const ch of target) { const s = u.el('div', { class: 'slot' + (ch === ' ' ? ' space' : '') }, ''); slots.appendChild(s); if (ch !== ' ') slotEls.push(s); }
    let pos = 0; const typed = []; let mistakes = 0;
    pool.forEach((ch) => {
      const t = u.el('button', { class: 'letter-tile' }, ch);
      t.onclick = () => {
        if (pos >= letters.length) return;
        const want = letters[pos];
        if (ch.toLowerCase() === want.toLowerCase()) {
          slotEls[pos].textContent = want; t.classList.add('used'); typed.push(want); pos++; EP.sfx.pop();
          if (pos >= letters.length) onDone(mistakes === 0, mistakes);
        } else { mistakes++; EP.sfx.wrong(); t.classList.add('shake'); setTimeout(() => t.classList.remove('shake'), 400); if (opts.strict) onDone(false, mistakes); }
      };
      tiles.appendChild(t);
    });
    const hint = u.el('button', { class: 'btn small ghost', onclick: () => { if (pos < letters.length) { mistakes++; const want = letters[pos]; const t = Array.from(tiles.children).find((x) => !x.classList.contains('used') && x.textContent.toLowerCase() === want.toLowerCase()); t && t.click(); } } }, '💡 Hint 提示');
    wrap.append(slots, tiles, hint);
    return wrap;
  };

  /* pausable timers: map numeric handles to runner timers so window.clearTimeout keeps working */
  EP._timerSeq = 1e9; EP._timerReg = new Map();
  const nativeClear = window.clearTimeout.bind(window);
  window.clearTimeout = function (id) {
    const r = EP._timerReg.get(id);
    if (r) { nativeClear(r.t.id); r.timers.delete(r.t); EP._timerReg.delete(id); return; }
    return nativeClear(id);
  };

  /* ---------- the runner ---------- */
  EP.runGame = async function (gameId, opts) {
    opts = opts || {};
    const def = EP.games[gameId]; if (!def) throw new Error('No game ' + gameId);
    const level = opts.level || def.level;
    const pool = opts.pool || EP.levelWords(level);
    const size = opts.roundSize || EP.settings.roundSize || 12;
    const items = opts.items || EP.srs.pick(pool, Math.min(size, pool.length));
    await EP.audio.ensureLevel(level);
    EP.audio.preload(items.concat(pool.slice(0, 40)));
    EP.audio.ensureAll && setTimeout(() => EP.audio.ensureAll(), 2000);

    const screen = u.el('div', { class: 'game-screen' });
    const prog = u.el('i'); const scoreEl = u.el('span', {}, '0'); const comboEl = u.el('span', { class: 'chip combo hidden' }, ''); const extraEl = u.el('span', { class: 'chip hidden' }, '');
    const pauseBtn = u.el('button', { class: 'icon-btn', title: 'Pause' }, '⏸');
    const exitBtn = u.el('button', { class: 'icon-btn', title: 'Exit' }, '✖');
    const hud = u.el('div', { class: 'hud' }, exitBtn, u.el('div', { class: 'title' }, `${def.icon || '🎮'} ${def.title}`), u.el('div', { class: 'prog' }, prog), comboEl, extraEl, u.el('span', { class: 'chip' }, '⭐ ', scoreEl), pauseBtn);
    const stage = u.el('div', { class: 'stage' });
    screen.append(hud, stage); document.body.appendChild(screen);
    document.body.style.overflow = 'hidden';

    const cleanups = []; let raf = 0; let ended = false; let paused = false; const loops = [];
    const timers = new Set(); cleanups.push(() => { timers.forEach((t) => { nativeClear(t.id); EP._timerReg.delete(t.handle); }); timers.clear(); });
    const state = { score: 0, combo: 0, maxCombo: 0, right: 0, wrong: 0, answered: new Map(), missed: new Map(), startedAt: Date.now() };

    /* crash safety net: a game error never freezes the class */
    let errCount = 0, errBanner = null;
    function onGameError(err) {
      errCount++;
      console.error('[game error]', gameId, err);
      if (errBanner || ended) return;
      errBanner = u.el('div', { style: { position: 'absolute', left: '50%', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)', zIndex: 60, background: '#fff', color: '#1d2340', borderRadius: '16px', padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.35)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '92%' } },
        u.el('span', { class: 'zh', style: { fontWeight: 800 } }, '😵 小故障！可以繼續玩，或直接結算這一局。'),
        u.el('button', { class: 'btn small go', onclick: () => { errBanner.remove(); errBanner = null; } }, '▶ Continue 繼續'),
        u.el('button', { class: 'btn small', onclick: () => finish({ completed: state.right + state.wrong > 0 }) }, '🏁 Finish 結算'));
      stage.appendChild(errBanner);
    }
    const safe = (fn) => function () { try { return fn.apply(this, arguments); } catch (e) { onGameError(e); } };
    const onWinErr = (e) => onGameError(e.error || e.reason || e.message);
    window.addEventListener('error', onWinErr); window.addEventListener('unhandledrejection', onWinErr);
    cleanups.push(() => { window.removeEventListener('error', onWinErr); window.removeEventListener('unhandledrejection', onWinErr); });

    const ctx = {
      def, level, items, pool, all: EP.words, root: stage, screen,
      difficulty: opts.difficulty || EP.settings.difficulty, speed: EP.settings.speed || 1,
      get paused() { return paused; }, get ended() { return ended; },
      u, kit, sfx: EP.sfx, pic: EP.pic, text: EP.text, cloze: EP.cloze,
      distractors: (it, n, o) => EP.distractors(it, n, Object.assign({ pool: o && o.anyLevel ? EP.words : pool }, o)),
      say: (it, o) => EP.audio.play(it, o), sayText: (t, o) => EP.audio.sayText(t, o),
      source: (it, kind) => EP.audio.source(it, kind),
      hud: {
        progress(f) { prog.style.width = Math.round(u.clamp(f, 0, 1) * 100) + '%'; },
        extra(t) { extraEl.textContent = t; extraEl.classList.toggle('hidden', !t); },
        score() { scoreEl.textContent = state.score; },
      },
      /** register an animation loop: fn(dt, t). Paused automatically. */
      loop(fn) { loops.push(fn); if (!raf) { let last = performance.now(); const step = (now) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (!paused && !ended) for (const f of loops) { try { f(dt * (ctx.speedFactor || 1), now / 1000); } catch (e) { onGameError(e); } } raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); } },
      /** pause-aware timeout: time does not run while the game is paused */
      timeout(fn, ms) {
        const t = { fn, left: ms, start: performance.now(), id: 0, done: false };
        const arm = () => { t.start = performance.now(); t.id = setTimeout(() => { t.done = true; timers.delete(t); EP._timerReg.delete(t.handle); if (!ended) { try { fn(); } catch (e) { onGameError(e); } } }, Math.max(0, t.left)); };
        timers.add(t); if (paused) { t.id = 0; } else arm(); t.arm = arm;
        // numeric handle so plain clearTimeout(handle) still cancels it (games written against the old API)
        const h = ++EP._timerSeq; t.handle = h; EP._timerReg.set(h, { t, timers });
        return h;
      },
      interval(fn, ms) { const id = setInterval(() => { if (!ended && !paused) { try { fn(); } catch (e) { onGameError(e); } } }, ms); cleanups.push(() => clearInterval(id)); return id; },
      on(el, ev, fn, o) { const g = safe(fn); el.addEventListener(ev, g, o); cleanups.push(() => el.removeEventListener(ev, g, o)); },
      onCleanup(fn) { cleanups.push(fn); },
      wait: (ms) => new Promise((r) => ctx.timeout(r, ms)),
      /** record an answer. Returns {combo, points}. opts.x/y for floating text (stage coords), opts.silent */
      answer(item, ok, o) {
        o = o || {};
        if (ended) return { combo: 0, points: 0 };
        EP.srs.record(item.id, ok);
        const a = state.answered.get(item.id) || { r: 0, w: 0 }; ok ? a.r++ : a.w++; state.answered.set(item.id, a);
        let points = 0;
        if (ok) {
          state.right++; state.combo++; state.maxCombo = Math.max(state.maxCombo, state.combo);
          points = (o.points || 100) + Math.min(state.combo - 1, 10) * 10; state.score += points;
          if (!o.silent) EP.sfx.correct();
          if (state.combo >= 3 && state.combo % 1 === 0) { comboEl.textContent = `🔥 x${state.combo}`; comboEl.classList.remove('hidden'); }
          if ([5, 10, 15, 20, 30].includes(state.combo)) { ctx.burst(`${state.combo} COMBO! 🔥`); EP.sfx.combo(state.combo); }
          EP.questEvent('right', 1); EP.questEvent('combo', state.combo, true);
          if (o.x != null) ctx.float(o.x, o.y, '+' + points, 'good');
        } else {
          state.wrong++; state.combo = 0; comboEl.classList.add('hidden'); state.missed.set(item.id, item);
          if (!o.silent) EP.sfx.wrong();
          if (o.x != null) ctx.float(o.x, o.y, o.label || '✗', 'bad');
        }
        scoreEl.textContent = state.score;
        if (opts.onAnswer) opts.onAnswer(item, ok);
        return { combo: state.combo, points };
      },
      addScore(n) { state.score += n; scoreEl.textContent = state.score; },
      get score() { return state.score; }, get combo() { return state.combo; }, stats: state,
      float(x, y, text, cls) { const f = u.el('div', { class: 'float-txt ' + (cls || ''), style: { left: x + 'px', top: y + 'px' } }, text); stage.appendChild(f); setTimeout(() => f.remove(), 1000); },
      burst(text) { const b = u.el('div', { class: 'combo-burst' }, text); stage.appendChild(b); setTimeout(() => b.remove(), 900); },
      toast: (t) => EP.ui.toast(t),
      confetti: () => EP.ui.confetti(),
      shake(el) { el = el || stage; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); },
      /** show the right answer as a learning moment; resolves after audio */
      async reveal(item, o) {
        o = o || {};
        const pic = EP.pic(item);
        const card = u.el('div', { class: 'reveal' }, pic ? u.el('div', { class: 'pic' }, pic) : null, u.el('div', { class: 'w' }, item.word), u.el('div', { class: 'z zh' }, item.zh), o.sentence ? u.el('div', { class: 's' }, item.sentence) : null);
        stage.appendChild(card);
        await Promise.all([ctx.say(item), ctx.wait(o.ms || 1300)]);
        card.remove();
      },
      async countdown() { for (const n of ['3', '2', '1', 'GO!']) { const c = u.el('div', { class: 'countdown' }, u.el('span', {}, n)); stage.appendChild(c); EP.sfx.tick(); await ctx.wait(700); c.remove(); } },
      end(extra) { finish(Object.assign({ completed: true }, extra || {})); },
    };

    const doPause = (p) => {
      if (p && !paused) timers.forEach((t) => { nativeClear(t.id); t.left -= performance.now() - t.start; });
      if (!p && paused) timers.forEach((t) => t.arm());
      paused = p; pauseBtn.textContent = p ? '▶' : '⏸'; if (p) { EP.audio.stop(); showPause(); } else { const pm = stage.querySelector('.pause-menu'); pm && pm.remove(); } ctx._onPause && ctx._onPause(p); };
    ctx.onPause = (fn) => (ctx._onPause = fn);
    const showPause = () => {
      const m = u.el('div', { class: 'intro-card pause-menu' }, u.el('div', { class: 'panel' }, u.el('h2', {}, '⏸ Paused 暫停'),
        u.el('div', { class: 'row', style: { justifyContent: 'center' } },
          u.el('button', { class: 'btn go big', onclick: () => doPause(false) }, '▶ Continue 繼續'),
          u.el('button', { class: 'btn red', onclick: () => quit() }, '🚪 Exit 離開'))));
      stage.appendChild(m);
    };
    pauseBtn.onclick = () => doPause(!paused);
    exitBtn.onclick = () => { if (!ended) doPause(true); };
    const onVis = () => { if (document.hidden && !paused && !ended) doPause(true); };
    document.addEventListener('visibilitychange', onVis);

    let resolveRun; const done = new Promise((r) => (resolveRun = r));
    function teardown() {
      ended = true; cancelAnimationFrame(raf); cleanups.forEach((f) => { try { f(); } catch (e) {} });
      document.removeEventListener('visibilitychange', onVis);
      try { inst && inst.destroy && inst.destroy(); } catch (e) {}
      EP.audio.stop(); EP.music.stop(); screen.remove(); document.body.style.overflow = '';
    }
    function quit() { teardown(); resolveRun({ quit: true }); }
    function finish(extra) {
      if (ended) return; ended = true;
      const total = state.right + state.wrong;
      const acc = total ? state.right / total : 0;
      let stars = 0;
      if (extra.completed) stars = acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0;
      if (extra.stars != null) stars = extra.stars;
      const res = { gameId, level, score: state.score, right: state.right, wrong: state.wrong, acc, stars, maxCombo: state.maxCombo,
        missed: Array.from(state.missed.values()), seconds: Math.round((Date.now() - state.startedAt) / 1000), completed: !!extra.completed, mode: opts.mode || 'level' };
      setTimeout(() => { teardown(); resolveRun(res); }, extra.delay != null ? extra.delay : 600);
    }

    // intro card: model game + how to play, then countdown
    if (!opts.skipIntro) {
      await new Promise((res) => {
        const ic = u.el('div', { class: 'intro-card' }, u.el('div', { class: 'panel' },
          u.el('div', { style: { fontSize: '3.4rem' } }, def.icon || '🎮'),
          u.el('div', { class: 'model' }, `Inspired by 靈感來自：${def.model}`),
          u.el('h2', {}, def.title, ' ', u.el('span', { class: 'zh', style: { fontSize: '1.3rem' } }, def.titleZh || '')),
          u.el('p', { class: 'zh' }, def.howZh || ''), u.el('p', { class: 'muted' }, def.howEn || ''),
          u.el('button', { class: 'btn go big', onclick: () => { ic.remove(); res(); } }, '▶ Start 開始')));
        stage.appendChild(ic);
      });
      if (!opts.noCountdown && !def.noCountdown) await ctx.countdown();
    }
    if (def.music !== false) EP.music.start(level);
    let inst = null;
    try { inst = await def.start(ctx); EP._current = { ctx, inst, def }; } catch (err) { console.error(err); EP.ui.toast('⚠️ ' + err.message); finish({ completed: false }); }
    return done;
  };
})();
