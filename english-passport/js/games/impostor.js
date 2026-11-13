/* Level 10 — Louvre Impostor (inspired by Among Us: crewmates, one impostor, emergency meeting, vote)
 * 4–5 original bean detectives (big eyes, cap / bow tie / magnifying glass) stand in a museum hall. Each holds an English word card and "says" its meaning in a bubble.
 * Exactly one is the impostor: a wrong meaning, a misspelled word ("hapy"), or (listening rounds) the one holding the word you hear.
 * Tap a crewmate → emergency meeting → Vote. The voted one is sent home in a rocket 🚀 and we learn if they were the impostor. */
(function () {
  const EP = window.EP, u = EP.u;
  const CREW = [
    { name: 'Coco', c: '#e8443a', d: '#a51d1d', acc: 'cap' }, { name: 'Remy', c: '#2f7fe0', d: '#1b4f9a', acc: 'glass' },
    { name: 'Lulu', c: '#39b54a', d: '#21762c', acc: 'bow' }, { name: 'Pip', c: '#f5b818', d: '#b07d00', acc: 'cap' },
    { name: 'Zaza', c: '#9b5de5', d: '#5f2fa8', acc: 'glass' }, { name: 'Momo', c: '#ff7eb6', d: '#c2457f', acc: 'bow' },
    { name: 'Kiki', c: '#14b8a6', d: '#0b7d70', acc: 'cap' }, { name: 'Bobo', c: '#ff8c32', d: '#b85a10', acc: 'glass' },
  ];
  // look-alike meanings that must never be the "wrong" bubble for each other
  const SIM = [['happy', 'excited', 'great!', 'ok', 'fine', 'super', 'good', 'nice'], ['sad', 'terrible', 'scared', 'tired', 'angry', 'bad'], ['pretty', 'beautiful', 'cute']];
  const similar = (a, b) => SIM.some((g) => g.includes(u.norm(a.word)) && g.includes(u.norm(b.word)));
  // original "bean detective": round jelly-bean body, big cartoon eyes, smile, and a detective accessory
  const ACC = {
    cap: '<path d="M22,22 C22,0 78,0 78,22 Z" fill="#b07d4a" stroke="#1d2340" stroke-width="3.5"/><path d="M34,6 L34,21 M50,2 L50,21 M66,6 L66,21 M24,13 L76,13" stroke="#6b4423" stroke-width="2" opacity=".7"/><ellipse cx="50" cy="22" rx="34" ry="6" fill="#8a5a2b" stroke="#1d2340" stroke-width="3.5"/><circle cx="50" cy="1.5" r="3.5" fill="#6b4423"/>',
    bow: '<path d="M50,86 L32,77 L32,95 Z M50,86 L68,77 L68,95 Z" fill="#fff" stroke="#1d2340" stroke-width="3.5" stroke-linejoin="round"/><circle cx="50" cy="86" r="5" fill="#1d2340"/>',
    glass: '<path d="M88,94 L99,110" stroke="#6b4423" stroke-width="7" stroke-linecap="round"/><circle cx="80" cy="82" r="13" fill="rgba(200,240,255,.65)" stroke="#495057" stroke-width="4.5"/><path d="M74,77 Q78,73 83,75" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  };
  const bean = (cr) => `<svg viewBox="0 -6 104 130" class="ipb" aria-hidden="true">
    <ellipse cx="36" cy="116" rx="12" ry="7" fill="${cr.d}" stroke="#1d2340" stroke-width="3.5"/><ellipse cx="64" cy="116" rx="12" ry="7" fill="${cr.d}" stroke="#1d2340" stroke-width="3.5"/>
    <path d="M50,12 C77,12 90,34 90,63 C90,96 74,113 50,113 C26,113 10,96 10,63 C10,34 23,12 50,12 Z" fill="${cr.c}" stroke="#1d2340" stroke-width="4"/>
    <ellipse cx="30" cy="42" rx="7" ry="13" fill="#fff" opacity=".28" transform="rotate(20 30 42)"/>
    <circle cx="36" cy="52" r="13" fill="#fff" stroke="#1d2340" stroke-width="3"/><circle cx="64" cy="52" r="13" fill="#fff" stroke="#1d2340" stroke-width="3"/>
    <circle cx="40" cy="54" r="6.5" fill="#1d2340"/><circle cx="68" cy="54" r="6.5" fill="#1d2340"/><circle cx="42" cy="51" r="2" fill="#fff"/><circle cx="70" cy="51" r="2" fill="#fff"/>
    <ellipse cx="24" cy="71" rx="6" ry="3.5" fill="#ff8fab" opacity=".55"/><ellipse cx="78" cy="71" rx="6" ry="3.5" fill="#ff8fab" opacity=".55"/>
    <path d="M42,72 Q51,80 60,72" stroke="#1d2340" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${ACC[cr.acc] || ''}</svg>`;
  const CSS = `
  .ip-bg{position:absolute;inset:0;pointer-events:none;background:linear-gradient(#f4e6c8 0,#ead3a6 44%,#b98d55 44%,#b98d55 46%,transparent 46%),repeating-conic-gradient(#d8cfbf 0 25%,#f7f2e8 0 50%) 0 0/64px 64px;}
  .ip-frame{position:absolute;top:9%;width:clamp(54px,9vw,96px);aspect-ratio:4/5;border:clamp(5px,.9vw,9px) solid #c9971c;box-shadow:inset 0 0 0 3px #f6d873,0 6px 10px rgba(0,0,0,.25);background:#fff7e0;display:flex;align-items:center;justify-content:center;font-size:clamp(1.6rem,4vw,2.8rem);border-radius:4px}
  .ip-pyr{position:absolute;left:50%;top:14%;width:clamp(90px,16vw,170px);aspect-ratio:2/1.1;transform:translateX(-50%);clip-path:polygon(50% 0,100% 100%,0 100%);background:repeating-linear-gradient(60deg,rgba(255,255,255,.55) 0 2px,transparent 2px 22px),repeating-linear-gradient(-60deg,rgba(255,255,255,.55) 0 2px,transparent 2px 22px),linear-gradient(#bfe6ff,#7cc2ea);opacity:.85}
  .ip-wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:8px 8px 10px;gap:6px}
  .ip-top{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.95);color:#1d2340;border-radius:20px;padding:6px 14px 6px 6px;box-shadow:0 5px 0 rgba(0,0,0,.18);max-width:min(860px,98%);z-index:2}
  .ip-top .say{width:56px;height:56px;border-radius:50%;background:#47b8ff;color:#fff;font-size:1.6rem;flex:none;box-shadow:0 4px 0 rgba(0,0,0,.2)}
  .ip-top b{display:block;font-size:clamp(1.02rem,3.4vw,1.35rem);line-height:1.15}.ip-top small{font-size:clamp(.9rem,2.8vw,1.05rem);color:#4a5275}
  .ip-floor{flex:1;width:100%;display:grid;align-content:center;justify-content:center;gap:4px 6px;z-index:1}
  .ip-slot{display:flex;justify-content:center;align-items:flex-end}
  .ip-crew{position:relative;display:flex;flex-direction:column;align-items:center;padding:4px 2px;border-radius:22px;min-width:64px;transition:filter .2s}
  .ip-crew:active{filter:brightness(1.1)}
  .ip-crew .ipb{width:var(--bw);height:auto;display:block;filter:drop-shadow(0 6px 0 rgba(0,0,0,.2));transition:transform .2s}
  .ip-crew.left .ipb{transform:scaleX(-1)}
  .ip-body{position:relative;animation:ipBob .9s ease-in-out infinite}
  .ip-bub{background:#fff;color:#1d2340;border-radius:16px;padding:2px 10px;min-height:calc(var(--zf)*2.3);min-width:70px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:var(--zf);position:relative;box-shadow:0 4px 0 rgba(0,0,0,.15);margin-bottom:12px;white-space:nowrap}
  .ip-bub.pic{font-size:calc(var(--zf)*1.7)}
  .ip-bub:after{content:'';position:absolute;bottom:-11px;left:50%;margin-left:-9px;border:9px solid transparent;border-top-color:#fff;border-bottom:0}
  .ip-card{margin-top:calc(var(--bw)*-.2);background:#fffdf3;color:#1d2340;border:3px solid #1d2340;border-radius:10px;padding:0 10px;font-weight:900;font-size:var(--wf);box-shadow:0 4px 0 rgba(0,0,0,.25);transform:rotate(-4deg);position:relative;z-index:3;white-space:nowrap}
  .ip-name{font-size:.85rem;color:#fff;font-weight:900;background:rgba(29,35,64,.75);border-radius:999px;padding:0 10px;margin-top:4px}
  .ip-crew.sel{background:rgba(255,230,80,.55);box-shadow:0 0 0 4px #ffd43b}
  .ip-crew.out{opacity:.25}
  .ip-sos{z-index:2;min-height:60px;font-size:clamp(1.05rem,3.4vw,1.35rem);background:linear-gradient(180deg,#ff6b5b,#d42a1c);color:#fff;border-radius:999px;padding:8px 24px;box-shadow:0 6px 0 #8f1408;font-weight:900;text-shadow:0 2px 0 rgba(0,0,0,.25)}
  .ip-sos:active{transform:translateY(4px);box-shadow:0 2px 0 #8f1408}
  .ip-splash{position:absolute;inset:0;z-index:25;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,#ff4d3d 0,#9e1006 70%);color:#fff;font-weight:900;font-size:clamp(2rem,8vw,4.4rem);text-align:center;text-shadow:0 5px 0 rgba(0,0,0,.35);animation:ipZoom .7s ease-out both;line-height:1.1}
  .ip-meet{position:absolute;inset:0;z-index:20;background:rgba(10,14,40,.6);display:flex;align-items:center;justify-content:center;padding:8px}
  .ip-tab{width:min(900px,100%);max-height:100%;overflow:auto;background:linear-gradient(#cfdcef,#9fb3d1);border:6px solid #3c4a63;border-radius:26px;padding:12px;box-shadow:0 18px 40px rgba(0,0,0,.45);color:#1d2340;animation:ipZoom .3s ease-out both}
  .ip-tab h3{margin:0 0 8px;display:flex;gap:10px;align-items:center;justify-content:center;font-size:clamp(1.15rem,3.8vw,1.6rem);text-align:center;line-height:1.15}
  .ip-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:8px}
  .ip-tile{display:flex;align-items:center;gap:10px;background:#f4f7fb;border-radius:16px;padding:6px 10px;min-height:70px;text-align:left;box-shadow:0 4px 0 rgba(0,0,0,.18);position:relative;border:4px solid transparent}
  .ip-tile .ipb{width:46px;height:auto;flex:none}
  .ip-tile .tw{flex:1;min-width:0}.ip-tile .tn{font-size:.85rem;color:#4a5275;font-weight:800}
  .ip-tile .tc{font-size:clamp(1.25rem,4vw,1.6rem);font-weight:900;line-height:1.1;overflow-wrap:anywhere}
  .ip-tile .tb{background:#fff;border-radius:12px;padding:2px 10px;font-weight:800;font-size:1.15rem;min-width:56px;text-align:center;box-shadow:0 2px 0 rgba(0,0,0,.12)}
  .ip-tile .tb.pic{font-size:1.9rem}
  .ip-tile.sel{border-color:#ffb700;background:#fff6cf}
  .ip-tile .votes{position:absolute;right:8px;bottom:-6px;display:flex;gap:2px}
  .ip-tile .votes i{width:18px;height:18px;border-radius:50%;border:2px solid #1d2340;display:block;animation:ipZoom .25s both}
  .ip-foot{display:flex;gap:10px;justify-content:center;margin-top:10px;flex-wrap:wrap}
  .ip-ej{position:absolute;inset:0;z-index:30;overflow:hidden;background:radial-gradient(1.5px 1.5px at 12% 22%,#fff,transparent),radial-gradient(2px 2px at 72% 14%,#fff,transparent),radial-gradient(1.5px 1.5px at 40% 68%,#fff,transparent),radial-gradient(2px 2px at 88% 76%,#fff,transparent),radial-gradient(1.5px 1.5px at 22% 86%,#fff,transparent),radial-gradient(1.5px 1.5px at 58% 40%,#fff,transparent),radial-gradient(circle at 50% 40%,#1b2a6b,#05081c 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:16px}
  .ip-fly{position:absolute;top:18%;left:0;display:flex;flex-direction:column;align-items:center;animation:ipFly 2.6s ease-in-out forwards}
  .ip-fly .ipb{width:64px;margin-bottom:-26px;position:relative;z-index:1}.ip-fly .rk{font-size:4.4rem;transform:rotate(45deg);line-height:1}
  .ip-ejt{font-size:clamp(1.5rem,5.5vw,2.6rem);font-weight:900;min-height:1.3em;margin-top:18vh}
  .ip-ejs{font-size:clamp(1.2rem,4.4vw,2rem);font-weight:800;margin-top:10px;background:rgba(255,255,255,.12);border-radius:16px;padding:6px 16px;animation:ipZoom .3s both}
  @keyframes ipBob{50%{transform:translateY(-5px)}}
  @keyframes ipZoom{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes ipFly{from{transform:translateX(-160px) rotate(-10deg)}to{transform:translateX(calc(100vw + 40px)) rotate(10deg)}}`;

  function misspell(word) {
    const m = word.match(/^([A-Za-z]+)(.*)$/); if (!m || m[1].length < 3) return null;
    const w = m[1], tail = m[2]; const real = new Set(EP.words.map((x) => u.norm(x.word).replace(/[^a-z]/g, '')));
    const dbl = [], other = [];
    for (let i = 1; i < w.length; i++) if (w[i] === w[i - 1]) dbl.push(w.slice(0, i) + w.slice(i + 1));
    for (let i = 1; i < w.length - 1; i++) if (w[i] !== w[i + 1]) other.push(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
    for (let i = 1; i < w.length; i++) if ('aeiou'.includes(w[i])) for (const v of 'aeiou') if (v !== w[i]) other.push(w.slice(0, i) + v + w.slice(i + 1));
    if (w.length >= 4) for (let i = 1; i < w.length; i++) if (w[i] !== w[i - 1]) other.push(w.slice(0, i) + w.slice(i + 1));
    const good = (x) => x.toLowerCase() !== w.toLowerCase() && !real.has(x.toLowerCase());
    const d = dbl.filter(good), o = other.filter(good);
    const pick = d.length && Math.random() < 0.7 ? u.pick(d) : o.length ? u.pick(o) : d.length ? u.pick(d) : null;
    return pick ? pick + tail : null;
  }

  EP.registerGame({
    id: 'impostor', level: 10, icon: '🕵️', title: 'Louvre Impostor', titleZh: '羅浮宮冒牌貨',
    model: 'Among Us 太空狼人殺（找出冒牌貨、緊急會議、投票；角色為原創豆豆偵探）',
    howZh: '每位船員拿著英文字卡、說出意思。有一位是冒牌貨：意思不對、字拼錯，或拿著你聽到的字。點他，開緊急會議投票！',
    howEn: 'One crewmate is the impostor: wrong meaning, wrong spelling, or holding the word you hear. Tap, meet, vote!',
    skills: ['meaning', 'spelling', 'listening', 'reading'],
    start(ctx) {
      const root = ctx.root, diff = ctx.difficulty, items = ctx.items;
      root.style.background = '#ead3a6';
      root.appendChild(u.el('style', {}, CSS));
      const bg = u.el('div', { class: 'ip-bg' }, u.el('div', { class: 'ip-pyr' }),
        ['🌻', '⛵', '🍐', '🌙'].map((e, i) => u.el('div', { class: 'ip-frame', style: { left: [4, 22, 68, 86][i] + '%' } }, e)));
      const topBar = u.el('div', { class: 'ip-top' });
      const floor = u.el('div', { class: 'ip-floor' });
      const sos = u.el('button', { class: 'ip-sos', onclick: () => phase === 'hall' && openMeeting(-1) }, '🚨 Emergency Meeting 緊急會議');
      const wrap = u.el('div', { class: 'ip-wrap' }, topBar, floor, sos);
      root.append(bg, wrap);
      const N = diff === 'easy' ? 4 : 5;
      let k = 0, R = null, phase = 'wait', sel = -1, t = 0, meet = null, roll = 0;
      const els = [];

      function sizeVars() {
        const W = root.clientWidth || 390, H = root.clientHeight || 700;
        const n = R ? R.crew.length : N;
        const cols = W >= 860 ? n : n === 4 ? 2 : 3; const rows = Math.ceil(n / cols);
        const cellW = Math.min((W - 24) / cols, 240); const floorH = H - 160;
        const bw = u.clamp(Math.min(cellW * 0.6, (floorH / rows - 132) / 1.24), 46, 140);
        floor.style.gridTemplateColumns = `repeat(${cols}, ${Math.floor(cellW)}px)`;
        wrap.style.setProperty('--bw', bw + 'px');
        wrap.style.setProperty('--wf', u.clamp(bw * 0.3, 20, 30) + 'px');
        wrap.style.setProperty('--zf', u.clamp(bw * 0.24, 17, 24) + 'px');
      }
      ctx.on(window, 'resize', sizeVars);

      function buildRound(T, n) {
        let type = ['listen', 'meaning', 'spell'][n % 3];
        let typo = null, fake = null;
        if (type === 'spell') { typo = misspell(T.word); if (!typo) type = 'meaning'; }
        const others = ctx.distractors(T, N - 1).filter((w) => type !== 'meaning' || !similar(w, T));
        if (type === 'meaning') {
          const used = new Set([T].concat(others).map((w) => w.id));
          fake = u.shuffle(ctx.pool).find((w) => !used.has(w.id) && w.zh !== T.zh && !similar(w, T) && !others.some((o) => o.zh === w.zh));
          if (!fake) type = 'listen';
        }
        const words = u.shuffle([T].concat(others.slice(0, N - 1)));
        const people = u.shuffle(CREW);
        const bubble = (w) => { const p = EP.pic(w); return diff !== 'hard' && p ? { pic: p } : { zh: w.zh }; };
        const crew = words.map((w, i) => Object.assign({}, people[i], { w, card: w.word, bub: bubble(w), x: 0, dir: Math.random() < 0.5 ? -1 : 1, sp: u.rand(14, 26), ph: Math.random() * 6 }));
        const imp = words.indexOf(T);
        if (type === 'spell') crew[imp].card = typo;
        if (type === 'meaning') crew[imp].bub = bubble(fake);
        return { T, type, crew, imp, typo, fake };
      }
      const INSTR = {
        listen: ['👂 The impostor holds the word you hear!', '冒牌貨拿著你聽到的那個字！'],
        meaning: ['🔍 One bubble has the WRONG meaning!', '有一位說的中文意思不對，找出冒牌貨！'],
        spell: ['✏️ One word card is spelled WRONG!', '有一張字卡拼錯了，找出冒牌貨！'],
      };
      function newRound() {
        if (k >= items.length) return finish();
        ctx.hud.progress(k / items.length);
        R = buildRound(items[k], k); sel = -1; roll++;
        const [en, zh] = INSTR[R.type];
        topBar.innerHTML = '';
        topBar.append(u.el('button', { class: 'say', title: 'Listen 再聽一次', onclick: () => sayPrompt() }, '🔊'), u.el('div', {}, u.el('b', {}, en), u.el('small', { class: 'zh' }, zh)));
        floor.innerHTML = ''; els.length = 0;
        const hideBub = R.type === 'listen' && diff === 'hard';
        R.crew.forEach((cr, i) => {
          const el = u.el('button', { class: 'ip-crew', title: cr.name, onclick: () => tapCrew(i) },
            u.el('div', { class: 'ip-bub ' + (hideBub ? '' : cr.bub.pic ? 'pic' : 'zh') }, hideBub ? '…' : cr.bub.pic || cr.bub.zh),
            u.el('div', { class: 'ip-body', style: { animationDelay: (-i * 0.23) + 's' } }, u.el('div', { html: bean(cr) })),
            u.el('div', { class: 'ip-card' }, cr.card), u.el('div', { class: 'ip-name' }, cr.name));
          els.push(el); floor.appendChild(u.el('div', { class: 'ip-slot' }, el));
        });
        sizeVars(); phase = 'hall';
        if (R.type === 'listen') ctx.timeout(() => ctx.say(R.T), 500);
      }
      async function sayPrompt() {
        if (!R) return;
        if (R.type === 'listen') return ctx.say(R.T);
        const my = ++roll; // roll call: every crewmate reads their card
        for (let i = 0; i < R.crew.length; i++) {
          if (my !== roll || phase !== 'hall') return;
          els.forEach((e, j) => e.classList.toggle('sel', j === i));
          await ctx.say(R.crew[i].w);
        }
        if (my === roll) els.forEach((e) => e.classList.remove('sel'));
      }
      function tapCrew(i) {
        if (phase !== 'hall') return;
        roll++; EP.sfx.click(); ctx.say(R.crew[i].w);
        els.forEach((e, j) => e.classList.toggle('sel', j === i));
        openMeeting(i);
      }
      function openMeeting(i) {
        phase = 'splash'; sel = i; EP.sfx.boom();
        const sp = u.el('div', { class: 'ip-splash' }, u.el('div', {}, '🚨 EMERGENCY', u.el('br'), 'MEETING!', u.el('div', { class: 'zh', style: { fontSize: '.45em', marginTop: '8px' } }, '緊急會議')));
        root.appendChild(sp);
        ctx.timeout(() => { sp.remove(); if (phase === 'splash') showMeeting(); }, 850);
      }
      function showMeeting() {
        phase = 'meet';
        const voteBtn = u.el('button', { class: 'btn go big', onclick: () => sel >= 0 && vote(sel) }, '🗳️ Vote 投票');
        const tiles = R.crew.map((cr, i) => {
          const hide = R.type === 'listen' && diff === 'hard';
          const tile = u.el('button', { class: 'ip-tile' + (i === sel ? ' sel' : ''), onclick: () => { if (phase !== 'meet') return; sel = i; tiles.forEach((x, j) => x.classList.toggle('sel', j === i)); voteBtn.disabled = false; EP.sfx.click(); ctx.say(cr.w); } },
            u.el('div', { html: bean(cr) }), u.el('div', { class: 'tw' }, u.el('div', { class: 'tn' }, '🕵️ ' + cr.name), u.el('div', { class: 'tc' }, cr.card)),
            u.el('div', { class: 'tb ' + (hide ? '' : cr.bub.pic ? 'pic' : 'zh') }, hide ? '…' : cr.bub.pic || cr.bub.zh), u.el('div', { class: 'votes' }));
          return tile;
        });
        if (sel < 0) voteBtn.disabled = true;
        const tab = u.el('div', { class: 'ip-tab' },
          u.el('h3', {}, u.el('button', { class: 'btn blue small', style: { minWidth: '56px', minHeight: '56px', fontSize: '1.5rem' }, onclick: () => sayPrompt() }, '🔊'), u.el('span', {}, 'Who is the Impostor? ', u.el('span', { class: 'zh' }, '誰是冒牌貨？'))),
          u.el('div', { class: 'ip-tiles' }, tiles),
          u.el('div', { class: 'ip-foot' }, u.el('button', { class: 'btn big', onclick: () => { if (phase === 'meet') { closeMeeting(); phase = 'hall'; els.forEach((e) => e.classList.remove('sel')); } } }, '↩ Back 返回'), voteBtn));
        meet = { el: u.el('div', { class: 'ip-meet' }, tab), tiles };
        root.appendChild(meet.el);
      }
      function closeMeeting() { if (meet) { meet.el.remove(); meet = null; } }

      function vote(i) {
        if (!['hall', 'meet', 'splash'].includes(phase) || !R) return;
        phase = 'vote'; roll++; EP.audio.stop();
        const ok = i === R.imp; const cr = R.crew[i];
        EP.sfx.stamp();
        if (meet) { // everyone puts in their vote chip
          const chips = [EP.me && EP.me.avatar ? null : '#fff'].concat(R.crew.map((x) => x.c));
          chips.forEach((col, j) => ctx.timeout(() => {
            if (!meet) return;
            const on = j === 0 || Math.random() < 0.7 ? i : u.randInt(0, R.crew.length - 1);
            const dot = j === 0 ? u.el('i', { style: { background: '#fff', fontSize: '12px', fontStyle: 'normal', lineHeight: '14px', textAlign: 'center' } }, '★') : u.el('i', { style: { background: col } });
            meet.tiles[on].querySelector('.votes').appendChild(dot); EP.sfx.click();
          }, 120 + j * 110));
        }
        ctx.timeout(() => eject(i, ok, cr), meet ? 1000 : 200);
      }
      function lesson() {
        const T = R.T, pic = EP.pic(T) ? ' ' + EP.pic(T) : '';
        if (R.type === 'spell') return `${R.typo} ✗ → ${T.word} ✔`;
        if (R.type === 'meaning') return `${T.word} = ${T.zh}${pic}`;
        return `🔊 ${T.word} = ${T.zh}${pic}`;
      }
      function eject(i, ok, cr) {
        closeMeeting(); phase = 'eject'; EP.sfx.whoosh();
        const txt = u.el('div', { class: 'ip-ejt' });
        const ej = u.el('div', { class: 'ip-ej' }, u.el('div', { class: 'ip-fly' }, u.el('div', { html: bean(cr) }), u.el('div', { class: 'rk' }, '🚀')), txt);
        root.appendChild(ej);
        const line = `${cr.name} was ${ok ? '' : 'not '}The Impostor.`;
        let n = 0; const id = ctx.interval(() => { n++; txt.textContent = line.slice(0, n); if (n % 2) EP.sfx.tick(); if (n >= line.length) clearInterval(id); }, 45);
        ctx.timeout(async () => {
          const W = root.clientWidth, H = root.clientHeight;
          const res = ctx.answer(R.T, ok, { x: W / 2, y: H * 0.3, label: '✗' });
          txt.textContent = line + (ok ? ' 🎉' : ' 😮');
          ej.appendChild(u.el('div', { class: 'zh', style: { fontSize: '1.2rem', marginTop: '6px', opacity: 0.9 } }, ok ? `${cr.name} 被送回家了 🚀 抓到冒牌貨！` : `${cr.name} 不是冒牌貨…真正的冒牌貨是 ${R.crew[R.imp].name}！`));
          ej.appendChild(u.el('div', { class: 'ip-ejs' }, lesson()));
          if (ok) { if (res.combo >= 3) ctx.confetti(); EP.sfx.chest(); await ctx.say(R.T); await ctx.wait(700); }
          else { await ctx.wait(900); ej.remove(); await ctx.reveal(R.T); }
          ej.remove(); k++; newRound();
        }, line.length * 45 + 450);
      }
      function finish() { phase = 'done'; ctx.hud.progress(1); ctx.end(); }

      // gentle wandering in the hall
      ctx.loop((dt) => {
        t += dt;
        if (!R || phase === 'done') return;
        R.crew.forEach((cr, i) => {
          const el = els[i]; if (!el) return;
          const lim = Math.max(6, (parseFloat(floor.style.gridTemplateColumns.split(' ')[1]) || 120) * 0.09);
          const pause = Math.sin(t * 0.7 + cr.ph) > 0.55;
          if (!pause && phase === 'hall') { cr.x += cr.dir * cr.sp * dt; if (Math.abs(cr.x) > lim) { cr.x = Math.sign(cr.x) * lim; cr.dir *= -1; } }
          el.style.transform = `translateX(${cr.x.toFixed(1)}px)`; el.classList.toggle('left', cr.dir < 0);
        });
      });

      newRound();
      return {
        destroy() {},
        test: {
          correct() { if (R && ['hall', 'meet', 'splash'].includes(phase)) vote(R.imp); },
          wrong() { if (R && ['hall', 'meet', 'splash'].includes(phase)) vote((R.imp + 1) % R.crew.length); },
        },
      };
    },
  });
})();
