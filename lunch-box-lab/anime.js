/* anime layer: original mascot "Boxy" (a lunch box with cat ears) and manga-style feedback effects.
   Everything is decorative: aria-hidden, never takes pointer events, never blocks a tap, and is skipped when the
   device asks for reduced motion. The app calls window.ANIME.good/bad/win/heard from its own sfx/say helpers. */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on = true; try { on = localStorage.getItem('lbl.anime') !== 'off'; } catch (e) {}
  const VIEWS = ['home', 'spin', 'catch', 'party', 'pack', 'impostor', 'build', 'check', 'card', 'speed'];
  const SAYING = ['Great job!', 'Awesome!', 'You got it!', 'Good try!', 'Try again!', "Let's go!", 'Listen and catch!', 'Find the impostor!', 'Build the sentence!', 'Can you count it?'];
  const POP_GOOD = ['POP!', 'YUM!', 'WOW!', 'YAY!', 'NICE!', 'SUPER!', 'BOOM!', 'GOT IT!'];
  const POP_WIN = ['HOORAY!', 'AMAZING!', 'YATTA!', 'CHAMPION!'];
  const star4 = c => `<svg viewBox="-12 -12 24 24"><path d="M0 -11 Q2 -2 11 0 Q2 2 0 11 Q-2 2 -11 0 Q-2 -2 0 -11 Z" fill="${c}" stroke="#24190A" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const SVG = `<svg viewBox="0 0 220 230" xmlns="http://www.w3.org/2000/svg" focusable="false">
<defs>
 <linearGradient id="mxB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8cc0"/><stop offset=".55" stop-color="#ff4fa3"/><stop offset="1" stop-color="#dc2f86"/></linearGradient>
 <linearGradient id="mxL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc2dd"/><stop offset="1" stop-color="#ff69ae"/></linearGradient>
 <radialGradient id="mxI" cx=".45" cy=".25" r=".9"><stop offset="0" stop-color="#a98bff"/><stop offset=".5" stop-color="#5b36d8"/><stop offset="1" stop-color="#26175f"/></radialGradient>
 <linearGradient id="mxF" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a18"/><stop offset="1" stop-color="#ffe45c"/></linearGradient>
</defs>
<g class="m-aura">
 <path class="fl" d="M30 200 C -10 172 6 126 14 92 C 40 118 60 156 48 200 Z" fill="url(#mxF)"/>
 <path class="fl" d="M190 200 C 230 172 214 126 206 92 C 180 118 160 156 172 200 Z" fill="url(#mxF)"/>
 <path class="fl" d="M84 62 C 70 28 98 20 110 -10 C 124 20 152 28 136 62 Z" fill="url(#mxF)"/>
</g>
<g class="m-all">
 <ellipse cx="110" cy="216" rx="70" ry="9" fill="#000" opacity=".16"/>
 <ellipse cx="78" cy="208" rx="22" ry="11" fill="#dc2f86"/><ellipse cx="142" cy="208" rx="22" ry="11" fill="#dc2f86"/>
 <g class="m-body-g">
  <g class="m-arm l"><rect x="8" y="124" width="34" height="17" rx="8.5" fill="#ff6fb2"/><circle cx="12" cy="132.5" r="11" fill="#fff6e9" stroke="#e8c9a8" stroke-width="2"/></g>
  <g class="m-arm r"><rect x="178" y="124" width="34" height="17" rx="8.5" fill="#ff6fb2"/><circle cx="208" cy="132.5" r="11" fill="#fff6e9" stroke="#e8c9a8" stroke-width="2"/></g>
  <g class="m-ear l"><path d="M46 70 L58 24 L96 58 Z" fill="#ff69ae" stroke="#ff69ae" stroke-width="12" stroke-linejoin="round"/><path d="M60 56 L63 38 L80 54 Z" fill="#ffd3e6" stroke="#ffd3e6" stroke-width="5" stroke-linejoin="round"/></g>
  <g class="m-ear r"><path d="M174 70 L162 24 L124 58 Z" fill="#ff69ae" stroke="#ff69ae" stroke-width="12" stroke-linejoin="round"/><path d="M160 56 L157 38 L140 54 Z" fill="#ffd3e6" stroke="#ffd3e6" stroke-width="5" stroke-linejoin="round"/></g>
  <rect x="30" y="88" width="160" height="112" rx="36" fill="url(#mxB)"/>
  <rect x="30" y="178" width="160" height="22" rx="16" fill="#a8105f" opacity=".28"/>
  <rect x="22" y="50" width="176" height="56" rx="28" fill="url(#mxL)"/>
  <ellipse cx="70" cy="66" rx="28" ry="8" fill="#fff" opacity=".5" transform="rotate(-8 70 66)"/>
  <path d="M150 62 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="1.5" stroke-linejoin="round"/>
  <rect x="94" y="94" width="32" height="18" rx="9" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/><circle cx="110" cy="103" r="3" fill="#e0a800"/>
  <rect x="46" y="116" width="128" height="76" rx="32" fill="#fff6e9"/>
  <ellipse cx="62" cy="174" rx="13" ry="7.5" fill="#ff7aa8" opacity=".55"/><ellipse cx="158" cy="174" rx="13" ry="7.5" fill="#ff7aa8" opacity=".55"/>
  <g class="m-eyes">
   <ellipse cx="80" cy="149" rx="14.5" ry="19.5" fill="url(#mxI)"/><ellipse cx="140" cy="149" rx="14.5" ry="19.5" fill="url(#mxI)"/>
   <path d="M63 137 Q80 126 97 137" fill="none" stroke="#26175f" stroke-width="4.5" stroke-linecap="round"/><path d="M123 137 Q140 126 157 137" fill="none" stroke="#26175f" stroke-width="4.5" stroke-linecap="round"/>
   <circle cx="74.5" cy="141" r="6" fill="#fff"/><circle cx="134.5" cy="141" r="6" fill="#fff"/><circle cx="86" cy="158" r="2.8" fill="#fff"/><circle cx="146" cy="158" r="2.8" fill="#fff"/>
  </g>
  <g class="m-eyes-blink" fill="none" stroke="#26175f" stroke-width="4.5" stroke-linecap="round"><path d="M65 150 Q80 159 95 150"/><path d="M125 150 Q140 159 155 150"/></g>
  <g class="m-eyes-star">
   <path d="M80 129 l5 13 14 1 -11 9 4 14 -12 -8 -12 8 4 -14 -11 -9 14 -1 Z" fill="#ffd23f" stroke="#26175f" stroke-width="3" stroke-linejoin="round"/>
   <path d="M140 129 l5 13 14 1 -11 9 4 14 -12 -8 -12 8 4 -14 -11 -9 14 -1 Z" fill="#ffd23f" stroke="#26175f" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g class="m-eyes-oops" fill="none" stroke="#26175f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M68 138 L92 149 L68 160"/><path d="M152 138 L128 149 L152 160"/></g>
  <path class="m-mouth smile" d="M99 170 Q104.5 178 110 170 Q115.5 178 121 170" fill="none" stroke="#26175f" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="m-mouth open"><ellipse cx="110" cy="174" rx="11" ry="10" fill="#5a1d3a" stroke="#26175f" stroke-width="2.5"/><ellipse cx="110" cy="179" rx="6.5" ry="4" fill="#ff7b9c"/></g>
  <path class="m-mouth wavy" d="M96 176 q4.5 -6 9 0 t9 0 t9 0" fill="none" stroke="#26175f" stroke-width="3.6" stroke-linecap="round"/>
  <path class="m-sweat" d="M176 108 q-10 17 0 24 q10 -7 0 -24 Z" fill="#8fdcff" stroke="#3aa8e0" stroke-width="2.5"/>
  <g class="m-sparkles" fill="#ffd23f" stroke="#24190A" stroke-width="1.5" stroke-linejoin="round">
   <path class="sp" d="M22 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"/><path class="sp" d="M196 34 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"/>
   <path class="sp" d="M8 108 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z"/><path class="sp" d="M208 100 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z"/><path class="sp" d="M110 18 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z"/>
  </g>
 </g>
</g></svg>`;

  let root, bubble, poseT, bubT, streak = 0, last = { x: innerWidth / 2, y: innerHeight / 2, t: 0 };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const curView = () => (location.hash || '#home').slice(1).split('?')[0] || 'home';
  const live = () => on && !reduce && root && !root.classList.contains('hide');

  function mount() {
    if (root || !document.body) return;
    root = document.createElement('div'); root.className = 'mx hide'; root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="mx-bubble"></div>' + SVG;
    document.body.appendChild(root); bubble = root.querySelector('.mx-bubble'); sync();
  }
  function sync() {
    if (!root) return;
    const v = curView();
    root.classList.toggle('hide', !on || !VIEWS.includes(v) || innerWidth < 480);
    if (v === 'home' && live()) { pose('wave', 1900); say("Let's go!"); }
  }
  function pose(name, ms) {
    if (!root) return;
    root.classList.remove('p-cheer', 'p-oops', 'p-win', 'p-wave'); void root.getBoundingClientRect();
    root.classList.add('p-' + name); clearTimeout(poseT);
    poseT = setTimeout(() => root.classList.remove('p-' + name), ms);
  }
  function say(t) {
    if (!bubble) return; bubble.textContent = t; bubble.classList.add('on'); clearTimeout(bubT);
    bubT = setTimeout(() => bubble.classList.remove('on'), 1700);
  }
  function at() { const fresh = Date.now() - last.t < 2500; return fresh ? last : { x: innerWidth / 2, y: innerHeight * .42 }; }
  function pop(text, cls, dx = 0, dy = -96) {
    const p = at(), el = document.createElement('div'); el.className = 'fx-pop' + (cls ? ' ' + cls : ''); el.textContent = text;
    document.body.appendChild(el); const r = el.getBoundingClientRect();
    const x = Math.max(8, Math.min(innerWidth - r.width - 8, p.x - r.width / 2 + dx)), y = Math.max(70, Math.min(innerHeight - r.height - 8, p.y + dy));
    el.style.left = x + 'px'; el.style.top = y + 'px'; const rot = (Math.random() * 14 - 7);
    const a = el.animate([{ transform: `translateY(14px) scale(.2) rotate(${rot - 14}deg)`, opacity: 0 }, { transform: `translateY(-6px) scale(1.25) rotate(${rot}deg)`, opacity: 1, offset: .3 }, { transform: `translateY(-14px) scale(1) rotate(${rot}deg)`, opacity: 1, offset: .75 }, { transform: `translateY(-46px) scale(.9) rotate(${rot}deg)`, opacity: 0 }], { duration: 950, easing: 'ease-out' });
    a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1500);
  }
  function stars(n, colors) {
    const p = at(); colors = colors || ['#ffd23f', '#ff7bb0', '#7fe0ff', '#fff'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'fx-star'; el.innerHTML = star4(colors[i % colors.length]);
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; document.body.appendChild(el);
      const ang = (Math.PI * 2 * i) / n + Math.random() * .5, d = 50 + Math.random() * 60, s = .7 + Math.random() * .9;
      const a = el.animate([{ transform: 'translate(0,0) scale(.2) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - 10}px) scale(${s}) rotate(${(Math.random() - .5) * 260}deg)`, opacity: 1, offset: .55 }, { transform: `translate(${Math.cos(ang) * d * 1.25}px,${Math.sin(ang) * d * 1.25 + 24}px) scale(.1) rotate(300deg)`, opacity: 0 }], { duration: 700 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' });
      a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1400);
    }
  }
  function burst(big) {
    const el = document.createElement('div'); el.className = 'fx-burst' + (big ? ' big' : ''); document.body.appendChild(el);
    const a = el.animate([{ opacity: 0, transform: 'scale(.6) rotate(0)' }, { opacity: big ? .75 : .55, transform: 'scale(1) rotate(' + (big ? 6 : 3) + 'deg)', offset: .25 }, { opacity: 0, transform: 'scale(1.5) rotate(' + (big ? 14 : 7) + 'deg)' }], { duration: big ? 800 : 520, easing: 'ease-out' });
    a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1400);
  }
  function combo(n) {
    const el = document.createElement('div'); el.className = 'fx-combo'; el.textContent = '🔥 COMBO ×' + n; document.body.appendChild(el);
    const a = el.animate([{ transform: 'translateX(-50%) scale(.3)', opacity: 0 }, { transform: 'translateX(-50%) scale(1.2)', opacity: 1, offset: .25 }, { transform: 'translateX(-50%) scale(1)', opacity: 1, offset: .8 }, { transform: 'translateX(-50%) translateY(-20px) scale(.9)', opacity: 0 }], { duration: 1300, easing: 'ease-out' });
    a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1900);
  }

  const API = {
    good() { if (!live()) return; streak++; pose('cheer', 1000); stars(9); pop(rnd(POP_GOOD)); if (streak >= 3) { root.classList.add('fire'); burst(false); } if (streak === 3 || streak === 5 || streak === 8) combo(streak); },
    bad() { streak = 0; if (!live()) return; root.classList.remove('fire'); pose('oops', 900); pop('hmm?', 'oops', 0, -80); },
    win() { if (!live()) return; pose('win', 2400); burst(true); stars(16); pop(rnd(POP_WIN), '', 0, -110); },
    stamp(o) {
      if (!live()) return; const c = document.createElement('div'); c.className = 'fx-seal'; c.innerHTML = '<div class="fx-seal-in">' + o.html + '</div><div class="fx-seal-cap">NEW STAMP! ' + o.n + '/' + o.total + '</div>';
      document.body.appendChild(c); last = { x: innerWidth / 2, y: innerHeight * .44, t: Date.now() };
      const a = c.animate([{ transform: 'translate(-50%,-50%) scale(2.6) rotate(-18deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(.9) rotate(-8deg)', opacity: 1, offset: .22 }, { transform: 'translate(-50%,-50%) scale(1.08) rotate(-6deg)', opacity: 1, offset: .34 }, { transform: 'translate(-50%,-50%) scale(1) rotate(-6deg)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-62%) scale(.9) rotate(-6deg)', opacity: 0 }], { duration: 2100, easing: 'ease-out' });
      a.onfinish = () => c.remove(); setTimeout(() => c.remove(), 2600); pose('cheer', 1000); stars(14); burst(false);
    },
    heard(t) { if (live() && SAYING.includes(String(t).trim())) say(String(t).trim()); },
    set(v) { on = !!v; try { localStorage.setItem('lbl.anime', on ? 'on' : 'off'); } catch (e) {} sync(); },
    isOn: () => on, mounted: () => !!root
  };
  window.ANIME = API;
  addEventListener('pointerdown', e => { last = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  addEventListener('hashchange', () => { streak = 0; if (root) root.classList.remove('fire'); sync(); });
  addEventListener('resize', () => { if (root) root.classList.toggle('hide', !on || !VIEWS.includes(curView()) || innerWidth < 480); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
