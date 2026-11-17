/* Sentence Listening — Level 19 (Colors · Food · Sports 顏色、食物、運動): COLORING, PENALTY, FIRST_LAST
 * L19a Color Studio · L19b Penalty Kick · L19c Start & Finish.
 * Audio rule: only the official sentences are played; distractors are text / colours / pictures only. */
(function () {
  'use strict';
  const EP = window.EP, u = EP.u, L = EP.listen;

  /* ---------- helpers (local to this level) ---------- */
  const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const inSent = (item, w) => [w.word, L.keyText(w)].some((x) => {
    x = String(x).replace('...', '').trim(); if (!x) return false;
    return new RegExp('(^|[^A-Za-z0-9\'-])' + esc(x) + '(s|es)?(?![A-Za-z0-9-])', 'i').test(item.sentence);
  });
  const lab = (w) => { const k = L.keyText(w); return /^[A-Z][a-z'-]+$/.test(k) && w.word[0] !== w.word[0].toUpperCase() ? k[0].toLowerCase() + k.slice(1) : k; };
  const others = (ctx, item, n, o) => {
    o = o || {}; const f = o.filter;
    return L.others(ctx, item, n, Object.assign({}, o, { filter: (w) => !inSent(item, w) && lab(w).toLowerCase() !== lab(item).toLowerCase() && (!f || f(w)) }));
  };
  const rel = (ctx, el) => { const r = el.getBoundingClientRect(), s = ctx.root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 3 }; };
  const disp = (t) => (t === 'I' || /[A-Z].*[A-Z]|^[A-Z]-|\d/.test(t) ? t : t.toLowerCase());
  const tweener = (ctx) => {
    const list = new Set();
    ctx.loop((dt) => { for (const tw of Array.from(list)) { tw.t += dt * 1000; const k = Math.min(1, tw.t / tw.ms); tw.fn(k); if (k >= 1) { list.delete(tw); tw.res(); } } });
    return (ms, fn) => new Promise((res) => list.add({ t: 0, ms: RM() ? 1 : Math.max(1, ms), fn, res }));
  };
  const COLOR_ZH = { red: '紅色', green: '綠色', blue: '藍色', yellow: '黃色', white: '白色', pink: '粉紅色', black: '黑色', purple: '紫色', brown: '棕色' };

  L.css('L19', `
.l19a-studio{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,30px);width:100%;flex-wrap:wrap}
.l19a-easel{display:flex;flex-direction:column;align-items:center;gap:6px}
.l19a-canvas{--s:clamp(170px,min(36vh,46vw),300px);width:var(--s);height:var(--s);border:0;border-radius:18px;background:#fffaf0;box-shadow:0 0 0 6px #8d5524,0 10px 0 6px rgba(0,0,0,.25);cursor:pointer;padding:8px;position:relative;font:inherit;color:#1d2340}
.l19a-canvas.ls-over,.l19a-canvas:focus-visible{outline:5px dashed #ffd43b;outline-offset:6px}
.l19a-svg{width:100%;height:100%;display:block}
.l19a-splash{animation:l19a-splash .45s}
@keyframes l19a-splash{40%{transform:scale(1.06) rotate(-2deg)}}
.l19a-brush{position:absolute;right:-10px;top:-14px;font-size:2rem;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l19a-label{background:#fff;color:#1d2340;border-radius:12px;padding:4px 12px;font-weight:900;font-size:clamp(1rem,3.4vw,1.3rem);box-shadow:0 3px 0 rgba(0,0,0,.2);text-align:center;max-width:min(92vw,520px)}
.l19a-label:empty{display:none}
.l19a-pots{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,2vw,14px);max-width:min(100%,520px)}
.l19a-pot{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:transparent;padding:4px;cursor:grab;font:inherit;touch-action:none;border-radius:16px}
.l19a-jar{display:block;width:clamp(58px,15vw,80px);height:clamp(58px,15vw,80px);border-radius:14px 14px 22px 22px;border:4px solid #1d2340;box-shadow:inset 0 10px 0 rgba(255,255,255,.35),0 5px 0 rgba(0,0,0,.3);position:relative}
.l19a-jar::before{content:'';position:absolute;left:-6px;right:-6px;top:-10px;height:10px;border-radius:6px;background:#adb5bd;border:3px solid #1d2340}
.l19a-name{background:#fff;color:#1d2340;border-radius:10px;padding:2px 10px;font-weight:900;font-size:clamp(.95rem,3vw,1.15rem);box-shadow:0 3px 0 rgba(0,0,0,.25);white-space:nowrap}
.l19a-pot:focus-visible{outline:4px solid #ffd43b}
.l19a-pot.ls-selected .l19a-jar{transform:translateY(-6px)}
.l19a-ok .l19a-name{background:#2b8a3e;color:#fff}
.l19a-no .l19a-name{background:#c92a2a;color:#fff}
.l19a-status{background:#1d2340;color:#fff;font-weight:800;text-align:center;border-radius:12px;padding:4px 12px;min-height:1.4em;max-width:min(92vw,480px)}
.l19a-status:empty{visibility:hidden}

.l19b-pitch{position:relative;flex:1 1 auto;width:100%;min-height:clamp(300px,56vh,560px);border-radius:22px;overflow:hidden;background:repeating-linear-gradient(90deg,#2b8a3e 0 64px,#2f9e44 64px 128px);box-shadow:inset 0 0 0 4px rgba(255,255,255,.2)}
.l19b-box{position:absolute;left:50%;top:61%;transform:translateX(-50%);width:min(80%,520px);height:24%;border:4px solid rgba(255,255,255,.75);border-top:0;pointer-events:none}
.l19b-goal{position:absolute;left:50%;top:5%;transform:translateX(-50%);width:min(94%,640px);height:56%;border:10px solid #fff;border-bottom:0;border-radius:6px 6px 0 0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.3) 0 2px,transparent 2px 14px),repeating-linear-gradient(-45deg,rgba(255,255,255,.3) 0 2px,transparent 2px 14px),rgba(8,40,18,.45);display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;padding:6px;gap:6px;box-shadow:0 6px 0 rgba(0,0,0,.2)}
.l19b-corner{border:0;background:transparent;display:flex;padding:4px;cursor:pointer;font:inherit;border-radius:12px;min-width:0;min-height:0;z-index:3}
.l19b-c0{align-items:flex-start;justify-content:flex-start}
.l19b-c1{align-items:flex-start;justify-content:flex-end}
.l19b-c2{align-items:flex-end;justify-content:flex-start}
.l19b-c3{align-items:flex-end;justify-content:flex-end}
.l19b-corner:focus-visible{outline:none}
.l19b-corner:hover .l19b-chip,.l19b-corner:focus-visible .l19b-chip{box-shadow:0 0 0 5px #ffd43b,0 4px 0 rgba(0,0,0,.3)}
.l19b-chip{display:inline-flex;flex-direction:column;align-items:center;gap:2px;background:#fff;color:#1d2340;border-radius:14px;padding:6px 12px;font-weight:900;font-size:clamp(1rem,3.6vw,1.45rem);box-shadow:0 4px 0 rgba(0,0,0,.3);min-width:clamp(72px,18vw,120px);max-width:100%;text-align:center;overflow-wrap:anywhere;line-height:1.15}
.l19b-chip .ls-emoji{font-size:1.6rem}
.l19b-good .l19b-chip{background:#d3f9d8;box-shadow:0 0 0 5px #2b8a3e}
.l19b-bad .l19b-chip{background:#ffe3e3;box-shadow:0 0 0 5px #c92a2a}
.l19b-keeper{position:absolute;left:50%;bottom:0;transform:translateX(-50%);font-size:clamp(3.2rem,10vh,5rem);line-height:1;transition:transform .42s cubic-bezier(.3,.7,.4,1);pointer-events:none;z-index:2;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l19b-sway{animation:l19b-sway 1.8s ease-in-out infinite}
@keyframes l19b-sway{0%,100%{margin-left:-16px}50%{margin-left:16px}}
.l19b-spot{position:absolute;left:50%;bottom:9%;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#fff;pointer-events:none}
.l19b-ball{position:absolute;left:0;top:0;width:3.2rem;height:3.2rem;display:flex;align-items:center;justify-content:center;font-size:clamp(2.3rem,6.5vh,3rem);line-height:1;z-index:4;pointer-events:none;will-change:transform;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.l19b-clock{position:absolute;right:10px;bottom:10px;background:#fff;color:#1d2340;border-radius:12px;padding:4px 10px;font-weight:900;z-index:5;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.l19b-clock.l19b-low{background:#c92a2a;color:#fff}
.l19b-shake{animation:l19b-shake .4s}
@keyframes l19b-shake{30%{transform:translateX(-50%) scale(1.02,1.04)}}
.l19b-call{position:absolute;left:50%;top:70%;transform:translate(-50%,-50%);font-weight:900;font-size:clamp(1.6rem,6vw,2.6rem);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.5);z-index:5;pointer-events:none;white-space:nowrap}

.l19c-pad{background:#fffdf3;color:#1d2340;border-radius:18px;padding:10px 16px 14px;box-shadow:0 6px 0 rgba(0,0,0,.22);width:100%;max-width:640px;border-top:14px solid #fab005;display:flex;flex-direction:column;gap:8px}
.l19c-padtitle{font-weight:900;color:#5c3d00;text-align:center}
.l19c-line{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:3px dashed #ced4da;font-weight:900;font-size:clamp(1.05rem,3.6vw,1.35rem);color:#495057}
.l19c-ask{border:3px solid #f08c00;background:#fff3bf;color:#1d2340}
.l19c-ans{margin-left:auto;min-width:4.5em;text-align:center;border-bottom:3px solid #1d2340;padding:0 6px;color:#1d2340}
.l19c-boxes{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;align-items:center}
.l19c-box{width:30px;height:24px;border-radius:6px;border:3px solid #868e96;background:#fff}
.l19c-boxon{border-color:#e8590c;background:#ffe8cc}
.l19c-q{display:inline-block;margin-top:4px;background:#1d2340;color:#fff;border-radius:999px;padding:4px 14px;font-weight:900}
.l19c-choices{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
.l19c-choices .ls-choice{font-size:clamp(1.2rem,4vw,1.6rem)}
`);

  /* ======================= L19a Color Studio (COLORING) ======================= */
  const sunRays = Array.from({ length: 8 }, (_, k) => {
    const a = (k * Math.PI) / 4; const p = (r, da) => `${(100 + r * Math.cos(a + da)).toFixed(1)},${(100 + r * Math.sin(a + da)).toFixed(1)}`;
    return `<polygon class="l19a-p" points="${p(90, 0)} ${p(56, 0.24)} ${p(56, -0.24)}"/>`;
  }).join('');
  const petals = Array.from({ length: 5 }, (_, k) => { const a = (k * 2 * Math.PI) / 5 - Math.PI / 2; return `<circle class="l19a-p" cx="${(100 + 34 * Math.cos(a)).toFixed(1)}" cy="${(80 + 34 * Math.sin(a)).toFixed(1)}" r="27"/>`; }).join('');
  const DOT = 'fill="#1d2340" stroke="none"';
  const ART = {
    apple: ['蘋果', '<path d="M100 60 C99 46 102 34 110 24" fill="none"/><path d="M104 42 C114 24 138 22 146 28 C138 44 118 50 104 42 Z" fill="#fff"/><path class="l19a-p" d="M100 62 C82 44 40 46 36 92 C32 138 62 178 88 172 C95 170 105 170 112 172 C138 178 168 138 164 92 C160 46 118 44 100 62 Z"/><path d="M60 96 C60 82 68 74 78 70" fill="none" stroke-width="4"/>'],
    pants: ['長褲', '<path class="l19a-p" d="M52 26 H148 L162 178 H114 L100 88 L86 178 H38 Z"/><path d="M54 48 H146 M100 48 V86" fill="none"/>'],
    sky: ['天空', '<rect class="l19a-p" x="16" y="22" width="168" height="156" rx="22"/><path d="M42 122 C38 104 58 96 70 104 C74 86 102 86 106 104 C118 98 134 108 126 122 Z" fill="#fff"/><path d="M116 58 l10 8 l10 -8 M142 76 l8 6 l8 -6" fill="none"/>'],
    sun: ['太陽', sunRays + '<circle class="l19a-p" cx="100" cy="100" r="44"/><circle cx="86" cy="94" r="5" ' + DOT + '/><circle cx="114" cy="94" r="5" ' + DOT + '/><path d="M84 112 C94 122 106 122 116 112" fill="none" stroke-width="4"/>'],
    snow: ['雪', '<path d="M58 118 L26 96 M142 118 L174 96" fill="none"/><circle class="l19a-p" cx="100" cy="136" r="46"/><circle class="l19a-p" cx="100" cy="66" r="32"/><circle cx="89" cy="60" r="4.5" ' + DOT + '/><circle cx="111" cy="60" r="4.5" ' + DOT + '/><path d="M100 70 L124 76 L100 82 Z" fill="#fff"/><circle cx="100" cy="122" r="4.5" ' + DOT + '/><circle cx="100" cy="142" r="4.5" ' + DOT + '/>'],
    flower: ['花', '<path d="M100 108 V186" fill="none"/><path d="M100 156 C82 134 60 138 54 146 C68 160 88 164 100 156 Z" fill="#fff"/>' + petals + '<circle cx="100" cy="80" r="18" fill="#fff"/>'],
    cat: ['貓', '<path class="l19a-p" d="M138 170 C170 172 178 140 162 124 C158 120 152 124 155 130 C164 146 158 158 136 158 Z"/><path class="l19a-p" d="M58 182 C48 142 60 112 100 108 C140 112 152 142 142 182 Z"/><path class="l19a-p" d="M58 62 L62 18 L88 40 C96 38 104 38 112 40 L138 18 L142 62 C150 94 128 112 100 112 C72 112 50 94 58 62 Z"/><ellipse cx="84" cy="70" rx="9" ry="11" fill="#fff"/><ellipse cx="116" cy="70" rx="9" ry="11" fill="#fff"/><circle cx="85" cy="72" r="4.5" ' + DOT + '/><circle cx="117" cy="72" r="4.5" ' + DOT + '/><path d="M94 88 L106 88 L100 95 Z" fill="#fff"/><path d="M72 92 H46 M74 99 L50 106 M128 92 H154 M126 99 L150 106" fill="none" stroke-width="3"/>'],
    grape: ['葡萄', '<path d="M100 56 C100 42 106 32 114 24" fill="none"/><path d="M106 40 C120 22 148 24 154 34 C142 50 120 52 106 40 Z" fill="#fff"/><circle class="l19a-p" cx="62" cy="76" r="21"/><circle class="l19a-p" cx="100" cy="76" r="21"/><circle class="l19a-p" cx="138" cy="76" r="21"/><circle class="l19a-p" cx="81" cy="110" r="21"/><circle class="l19a-p" cx="119" cy="110" r="21"/><circle class="l19a-p" cx="100" cy="144" r="21"/>'],
    bear: ['熊', '<circle class="l19a-p" cx="54" cy="56" r="25"/><circle class="l19a-p" cx="146" cy="56" r="25"/><circle cx="54" cy="56" r="11" fill="#fff"/><circle cx="146" cy="56" r="11" fill="#fff"/><circle class="l19a-p" cx="100" cy="110" r="68"/><ellipse cx="100" cy="134" rx="30" ry="23" fill="#fff"/><ellipse cx="100" cy="124" rx="10" ry="7" ' + DOT + '/><path d="M100 131 V140 M89 146 C95 151 105 151 111 146" fill="none" stroke-width="3"/><circle cx="76" cy="96" r="9" fill="#fff"/><circle cx="124" cy="96" r="9" fill="#fff"/><circle cx="77" cy="97" r="5" ' + DOT + '/><circle cx="123" cy="97" r="5" ' + DOT + '/>'],
    blob: ['圖案', '<path class="l19a-p" d="M100 24 C140 20 176 52 172 96 C168 140 150 178 104 176 C58 174 28 146 30 102 C32 58 60 28 100 24 Z"/>'],
  };
  const objOf = (item) => { for (const t of L.tokens(item.sentence)) { const w = t.w; if (ART[w]) return w; if (ART[w.replace(/s$/, '')]) return w.replace(/s$/, ''); } return 'blob'; };
  const svgOf = (obj) => `<svg class="l19a-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs><pattern id="l19a-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#ffffff"/><rect width="4" height="12" fill="#dee2e6"/></pattern></defs><g fill="url(#l19a-hatch)" stroke="#1d2340" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${ART[obj][1]}</g></svg>`;

  L.register({
    id: 'L19a',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#e64980,#f783ac 50%,#ffa8a8)' });
      const nPots = d === 'easy' ? 3 : d === 'hard' ? 5 : 4;
      const brush = u.el('span', { class: 'l19a-brush', 'aria-hidden': 'true' }, '');
      const canvas = u.el('button', { class: 'l19a-canvas' });
      const label = u.el('div', { class: 'l19a-label', lang: 'en' });
      const status = u.el('div', { class: 'l19a-status zh', role: 'status' }, '');
      const pots = Array.from({ length: nPots }, () => u.el('button', { class: 'l19a-pot' }, u.el('span', { class: 'l19a-jar', 'aria-hidden': 'true' }), u.el('span', { class: 'l19a-name' })));
      const potBox = u.el('div', { class: 'l19a-pots', role: 'group', 'aria-label': 'Paint pots 顏料' }, pots);
      st.body.append(u.el('div', { class: 'l19a-studio' }, u.el('div', { class: 'l19a-easel' }, canvas, label), u.el('div', { class: 'l19a-easel' }, potBox, status)));
      let cur = null;
      const potColor = (p) => p.getAttribute('data-c');
      const dnd = L.dnd(ctx, pots, [canvas], (pEl) => paint(potColor(pEl)));
      const idle = () => { status.textContent = '👉 先點顏料，再點圖案上色'; brush.textContent = ''; };
      pots.forEach((p) => ctx.on(p, 'click', (e) => {
        if (!cur || cur.answered) return;
        if (p.classList.contains('ls-selected')) { const c = potColor(p); if (e.detail === 0) canvas.focus(); brush.textContent = '🖌️'; status.textContent = `🖌️ ${c} ${COLOR_ZH[c] || ''} — 點圖案上色 Tap the picture`; EP.sfx.tick(); } else idle();
      }));
      ctx.on(canvas, 'click', () => { if (cur && !cur.answered && Date.now() - cur.t0 > 0 && !pots.some((p) => p.classList.contains('ls-selected'))) { status.textContent = '🎨 先選一個顏料 Pick a paint first'; } });
      const fill = (c) => canvas.querySelectorAll('.l19a-p').forEach((el) => { el.style.fill = L.COLORS[c] || c; });
      function paint(c) {
        if (!cur || cur.answered || !c) return; const k = cur; k.answered = true; dnd.clear();
        const ok = c === k.color; fill(c); brush.textContent = '';
        canvas.classList.remove('l19a-splash'); void canvas.offsetWidth; canvas.classList.add('l19a-splash'); EP.sfx.pop();
        pots.forEach((p) => { const pc = potColor(p); if (pc === c) p.classList.add(ok ? 'l19a-ok' : 'l19a-no'); else if (pc === k.color) p.classList.add('l19a-ok'); });
        status.textContent = ok ? `✔ ${c}! 顏色正確` : `✘ ${c}… 不是這個顏色`;
        const p = rel(ctx, canvas);
        L.feedback(ctx, k.item, ok, { x: p.x, y: p.y, wrongText: 'Wrong colour 顏色不對' })
          .then(() => { if (ok) return null; fill(k.color); status.textContent = `🎨 ${k.color} ${COLOR_ZH[k.color] || ''}`; return ctx.wait(700); })
          .then(k.done);
      }
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🎨 美術課！聽句子，選對的顏料，把圖案塗上顏色（先點顏料再點圖，或把顏料拖到圖上）。', 'Choose the right paint and colour the shape.'), L.listenBar(ctx, item));
        dnd.clear();
        const color = item.word.toLowerCase(); const obj = objOf(item);
        canvas.innerHTML = svgOf(obj); canvas.appendChild(brush); canvas.classList.remove('l19a-splash');
        canvas.setAttribute('aria-label', `Picture to paint 要上色的圖：${ART[obj][0]}（選好顏料後點這裡 tap after choosing a paint）`);
        label.textContent = d === 'easy' ? (L.swapKey(item, '____') || '') : d === 'hard' ? '' : `${obj === 'blob' ? '' : obj + ' '}${ART[obj][0]}`;
        const choices = u.shuffle([color].concat(u.shuffle(Object.keys(L.COLORS).filter((c) => c !== color)).slice(0, nPots - 1)));
        pots.forEach((p, i) => {
          const c = choices[i]; p.className = 'l19a-pot'; p.setAttribute('data-c', c); p.setAttribute('aria-label', `${c} ${COLOR_ZH[c] || ''}`);
          p.querySelector('.l19a-jar').style.background = L.COLORS[c];
          const nm = p.querySelector('.l19a-name'); nm.textContent = c; if (d === 'easy') nm.append(' ' + (COLOR_ZH[c] || ''));
        });
        cur = { item, color, answered: false, done, t0: Date.now() };
        idle();
        T.set(() => paint(color), () => paint(choices.find((c) => c !== color)));
      }));
      return { test: T.api };
    },
  });

  /* ======================= L19b Penalty Kick (PENALTY) ======================= */
  const CONJ = ['and', 'or', 'but', 'with', 'so'];
  const FOOD = new Set(['rice', 'cream', 'egg', 'hamburger', 'cake', 'apple', 'noodles', 'fish', 'dumplings', 'chicken']);
  const SPORT = new Set(['basketball', 'baseball', 'tennis']);
  const cat19 = (w) => { const x = w.word.toLowerCase(); return L.COLORS[x] ? 'color' : SPORT.has(x) ? 'sport' : FOOD.has(x) ? 'food' : CONJ.includes(x) ? 'conj' : 'other'; };
  /** 3 distractor labels for the corners: same kind of word first (colour / food / sport / joining word) */
  const kickOpts = (ctx, item, n) => {
    const c = cat19(item);
    if (c === 'conj') return u.shuffle(CONJ.filter((x) => x !== lab(item).toLowerCase() && !new RegExp('(^|[^A-Za-z])' + x + '([^A-Za-z]|$)', 'i').test(item.sentence))).slice(0, n).map((x) => ({ label: x }));
    const same = others(ctx, item, n, { filter: (w) => cat19(w) === c });
    let res = same.map((w) => ({ label: lab(w), w }));
    if (res.length < n) res = res.concat(others(ctx, item, n - res.length, { filter: (w) => !same.includes(w) && cat19(w) !== 'conj' }).map((w) => ({ label: lab(w), w })));
    return res;
  };

  L.register({
    id: 'L19b',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty;
      const st = L.stage(ctx, { bg: 'linear-gradient(180deg,#0b3d2e,#1b5e3b)' });
      const tween = tweener(ctx);
      const pitch = u.el('div', { class: 'l19b-pitch', role: 'group', 'aria-label': 'Football pitch 足球場' });
      const corners = [0, 1, 2, 3].map((k) => u.el('button', { class: 'l19b-corner l19b-c' + k }));
      const keeper = u.el('div', { class: 'l19b-keeper', 'aria-hidden': 'true' }, '🧍');
      const goal = u.el('div', { class: 'l19b-goal', role: 'group', 'aria-label': 'Goal 球門：四個角落 four corners' }, corners, keeper);
      const ball = u.el('div', { class: 'l19b-ball', 'aria-hidden': 'true' }, '⚽');
      pitch.append(u.el('div', { class: 'l19b-box', 'aria-hidden': 'true' }), goal, u.el('div', { class: 'l19b-spot', 'aria-hidden': 'true' }), ball);
      st.body.append(pitch);
      const POS = ['左上 top left', '右上 top right', '左下 bottom left', '右下 bottom right'];
      let cur = null; let flying = false;
      // hard: a shot clock (pause-aware: ctx.interval does not tick while paused)
      const SHOT = 12; const clock = u.el('div', { class: 'l19b-clock', 'aria-hidden': 'true' }, '');
      if (d === 'hard') { pitch.appendChild(clock); ctx.interval(() => { if (!cur || cur.answered) return; cur.left--; clock.textContent = '⏱ ' + Math.max(0, cur.left); clock.classList.toggle('l19b-low', cur.left <= 3); if (cur.left <= 0 && cur.late) cur.late(); }, 1000); }
      const BW = () => ball.offsetWidth || 50;
      const spot = () => ({ x: pitch.clientWidth / 2, y: pitch.clientHeight * 0.91 - 7 - BW() * 0.45 });
      const setBall = (x, y, s) => { const b = BW(); ball.style.transform = `translate(${x - b / 2}px, ${y - b / 2}px) scale(${s || 1})`; };
      const centerOf = (el) => { const r = el.getBoundingClientRect(), p = pitch.getBoundingClientRect(); return { x: r.left - p.left + r.width / 2, y: r.top - p.top + r.height / 2 }; };
      ctx.loop(() => { if (!flying) { const s = spot(); setBall(s.x, s.y, 1); } });
      const dive = (k) => {
        keeper.classList.remove('l19b-sway');
        const kc = centerOf(keeper), cc = centerOf(corners[k].querySelector('.l19b-chip') || corners[k]);
        const dx = (cc.x - kc.x) * 0.78, dy = (cc.y - kc.y) * 0.7; const rot = (dx < 0 ? -1 : 1) * (dy < -30 ? 55 : 85);
        keeper.style.transform = `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${rot}deg)`;
      };
      let kick = () => {};
      L.rounds(ctx, ctx.items, (item) => new Promise((done) => {
        st.head.innerHTML = '';
        st.head.append(L.say('🥅 聽句子，把球踢向寫著句子裡那個字的角落！', 'Kick the ball to the corner with the right word.'), L.listenBar(ctx, item));
        const opts = u.shuffle([{ label: lab(item), w: item, right: true }].concat(kickOpts(ctx, item, 3)));
        keeper.style.transform = ''; keeper.className = 'l19b-keeper l19b-sway'; goal.classList.remove('l19b-shake');
        corners.forEach((b, k) => {
          const o = opts[k]; b.className = 'l19b-corner l19b-c' + k; b.innerHTML = ''; b.hidden = !o; if (!o) return;
          b.setAttribute('aria-label', `${o.label} — kick ${POS[k]} 射${POS[k].split(' ')[0]}角`);
          b.append(u.el('span', { class: 'l19b-chip', lang: 'en' }, d === 'easy' && o.w && EP.pic(o.w) ? u.el('span', { class: 'ls-emoji', 'aria-hidden': 'true' }, EP.pic(o.w)) : null, u.el('span', {}, o.label)));
        });
        const c = (cur = { item, answered: false, left: SHOT });
        clock.textContent = '⏱ ' + SHOT; clock.classList.remove('l19b-low');
        c.late = () => {
          if (c.answered || cur !== c) return; c.answered = true;
          const right = opts.findIndex((o) => o.right); if (right >= 0) corners[right].classList.add('l19b-good');
          L.feedback(ctx, item, false, { wrongText: 'Too slow! 太慢了' }).then(done);
        };
        kick = (k) => {
          if (c.answered || cur !== c || !opts[k]) return; c.answered = true; flying = true;
          const ok = !!opts[k].right; const right = opts.findIndex((o) => o.right);
          const from = spot(); const chip = corners[k].querySelector('.l19b-chip') || corners[k]; const to = centerOf(chip);
          EP.sfx.whoosh();
          const others4 = [0, 1, 2, 3].filter((x) => x !== k && opts[x]);
          ctx.timeout(() => dive(ok ? u.pick(others4) : k), RM() ? 0 : 120);
          const reach = ok ? 1 : 0.82; const end = { x: from.x + (to.x - from.x) * reach, y: from.y + (to.y - from.y) * reach };
          tween(560, (t) => setBall(from.x + (end.x - from.x) * t, from.y + (end.y - from.y) * t - 40 * Math.sin(Math.PI * t), 1 - (ok ? 0.45 : 0.35) * t))
            .then(() => {
              corners[k].classList.add(ok ? 'l19b-good' : 'l19b-bad'); if (!ok && right >= 0) corners[right].classList.add('l19b-good');
              if (ok) { goal.classList.add('l19b-shake'); return ctx.wait(RM() ? 1 : 250); }
              return tween(420, (t) => setBall(end.x + (from.x - end.x) * 0.4 * t, end.y + (from.y - end.y) * 0.55 * t - 50 * Math.sin(Math.PI * t), 0.65 + 0.2 * t));
            })
            .then(() => {
              const call = u.el('div', { class: 'l19b-call', 'aria-hidden': 'true' }, ok ? 'GOAL! 進球！' : 'SAVED! 被撲出去了'); pitch.appendChild(call);
              const p = rel(ctx, chip);
              return L.feedback(ctx, item, ok, { x: p.x, y: p.y, wrongText: 'Wrong corner 踢錯角落' }).then(() => call.remove());
            })
            .then(() => { flying = false; done(); });
        };
        T.set(() => kick(opts.findIndex((o) => o.right)), () => kick(opts.findIndex((o) => !o.right)));
      }));
      corners.forEach((b, k) => ctx.on(b, 'click', () => kick(k)));
      return { test: T.api };
    },
  });

  /* ======================= L19c Start & Finish (FIRST_LAST) ======================= */
  L.register({
    id: 'L19c',
    start(ctx) {
      const T = L.tester(); const d = ctx.difficulty; const hard = d === 'hard';
      const st = L.stage(ctx, { bg: 'linear-gradient(160deg,#1d2340,#364fc7 60%,#4c6ef5)' });
      const nOpts = hard ? 5 : 4;
      const lines = [0, 1].map((k) => u.el('div', { class: 'l19c-line' }, u.el('span', { 'aria-hidden': 'true' }, k ? '🏁' : '🟢'), u.el('span', { class: 'zh' }, k ? 'Last word 最後一個字' : 'First word 第一個字'), u.el('span', { class: 'l19c-ans', lang: 'en' }, '?')));
      const boxes = u.el('div', { class: 'l19c-boxes', 'aria-hidden': 'true' });
      const pad = u.el('div', { class: 'l19c-pad' }, u.el('div', { class: 'l19c-padtitle' }, '🗒️ Reporter\'s notes 記者筆記'), lines[0], lines[1], boxes);
      const box = u.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });
      st.body.append(pad, box);
      const kinds = u.shuffle(ctx.items.map((_, i) => (i % 2 ? 'last' : 'first')));
      L.rounds(ctx, ctx.items, (item, ri) => new Promise((done) => {
        const kind = kinds[ri]; const k = kind === 'first' ? 0 : 1;
        const toks = L.tokens(item.sentence).map((t) => disp(t.t));
        const ans = k === 0 ? toks[0] : toks[toks.length - 1];
        const words = [ans]; const add = (w) => { if (w && words.length < nOpts && !words.some((x) => x.toLowerCase() === w.toLowerCase())) words.push(w); };
        add(k === 0 ? toks[toks.length - 1] : toks[0]);
        u.shuffle(toks.slice(1, -1)).forEach(add);
        u.shuffle(ctx.pool.filter((w) => w !== item)).forEach((w) => { const t = L.tokens(w.sentence).map((x) => disp(x.t)); add(k === 0 ? t[0] : t[t.length - 1]); });
        const opts = u.shuffle(words);
        const qText = k === 0 ? '🟢 FIRST word 第一個字' : '🏁 LAST word 最後一個字';
        const instr = L.say(hard ? '🚦 記者要記下句子的第一個字或最後一個字。聽完整句才會告訴你要哪一個！' : '🚦 記者要記下句子的頭或尾：聽句子，選出題目要的那個字。', 'Pick the first or the last word of the sentence.');
        const qEl = u.el('span', { class: 'l19c-q', role: 'status' }, hard ? '👂 Listen to the whole sentence… 先聽完整句' : qText);
        instr.appendChild(u.el('div', {}, qEl));
        const bar = L.listenBar(ctx, item, { auto: !hard });
        st.head.innerHTML = ''; st.head.append(instr, bar);
        lines.forEach((ln, j) => { ln.className = 'l19c-line'; ln.querySelector('.l19c-ans').textContent = '?'; });
        boxes.innerHTML = ''; boxes.hidden = d !== 'easy';
        if (d === 'easy') toks.forEach((_, i) => boxes.appendChild(u.el('span', { class: 'l19c-box' + (i === (k === 0 ? 0 : toks.length - 1) ? ' l19c-boxon' : '') })));
        const ch = L.choices(opts.map((w) => ({ label: w, aria: w })), (i, b) => pick(i, b), 'l19c-choices');
        ch.btns.forEach((b) => b.setAttribute('lang', 'en'));
        box.innerHTML = '';
        let answered = false; let shown = false;
        const reveal = () => {
          if (shown) return; shown = true;
          qEl.textContent = qText; lines[k].classList.add('l19c-ask');
          box.innerHTML = ''; box.append(ch.el);
        };
        if (hard) ctx.timeout(() => bar.play(false).then(() => { if (!answered) reveal(); }), 350);
        else reveal();
        const pick = (i, b) => {
          if (answered) return; answered = true; ch.lock(); reveal();
          const ok = opts[i] === ans; ch.mark(opts.indexOf(ans), i);
          lines[k].querySelector('.l19c-ans').textContent = ans;
          const p = rel(ctx, b || pad);
          L.feedback(ctx, item, ok, { x: p.x, y: p.y, showOnRight: true, wrongText: k === 0 ? 'The first word is… 第一個字是 ' + ans : 'The last word is… 最後一個字是 ' + ans }).then(done);
        };
        T.set(() => pick(opts.indexOf(ans), ch.btns[opts.indexOf(ans)]), () => { const j = opts.findIndex((w) => w !== ans); pick(j, ch.btns[j]); });
      }));
      return { test: T.api };
    },
  });
})();
