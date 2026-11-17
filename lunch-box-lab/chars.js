// Original 3D-clay style food characters as SVG strings. All shapes are drawn here; no external assets.
(function(){
let uid=0; let curFace={};
function face(cx,cy,s,opt={}){ // kawaii face
  opt=Object.assign({},opt,curFace);
  const e=opt.eye||1, m=opt.mouth||'smile', bl=opt.blush!==false;
  const ex=22*s*e, ey=-6*s, er=13*s*e;
  let mouth='';
  if(m==='smile') mouth=`<path d="M ${cx-16*s} ${cy+16*s} Q ${cx} ${cy+34*s} ${cx+16*s} ${cy+16*s}" stroke="#3b1e2b" stroke-width="${5*s}" fill="none" stroke-linecap="round"/>`;
  if(m==='open') mouth=`<ellipse cx="${cx}" cy="${cy+22*s}" rx="${14*s}" ry="${11*s}" fill="#3b1e2b"/><ellipse cx="${cx}" cy="${cy+27*s}" rx="${8*s}" ry="${5*s}" fill="#ff7b9c"/>`;
  if(m==='wow') mouth=`<ellipse cx="${cx}" cy="${cy+22*s}" rx="${9*s}" ry="${12*s}" fill="#3b1e2b"/>`;
  if(m==='flat') mouth=`<path d="M ${cx-14*s} ${cy+20*s} L ${cx+14*s} ${cy+20*s}" stroke="#3b1e2b" stroke-width="${5*s}" stroke-linecap="round"/>`;
  return `<g>
   ${bl?`<ellipse cx="${cx-38*s}" cy="${cy+12*s}" rx="${14*s}" ry="${9*s}" fill="#ff8aa8" opacity=".55"/><ellipse cx="${cx+38*s}" cy="${cy+12*s}" rx="${14*s}" ry="${9*s}" fill="#ff8aa8" opacity=".55"/>`:''}
   <circle cx="${cx-ex}" cy="${cy+ey}" r="${er}" fill="#2a1a2e"/><circle cx="${cx+ex}" cy="${cy+ey}" r="${er}" fill="#2a1a2e"/>
   <circle cx="${cx-ex+5*s}" cy="${cy+ey-5*s}" r="${5*s}" fill="#fff"/><circle cx="${cx+ex+5*s}" cy="${cy+ey-5*s}" r="${5*s}" fill="#fff"/>
   <circle cx="${cx-ex-4*s}" cy="${cy+ey+5*s}" r="${2.5*s}" fill="#fff" opacity=".8"/><circle cx="${cx+ex-4*s}" cy="${cy+ey+5*s}" r="${2.5*s}" fill="#fff" opacity=".8"/>
   ${mouth}</g>`;
}
function defs(id,c1,c2,c3){ // radial 3D shading gradient
  return `<radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>`;
}
function gloss(cx,cy,rx,ry,rot=-20,o=.55){return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#gl)" opacity="${o}" transform="rotate(${rot} ${cx} ${cy})"/>`}
const common=`<radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="ds" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#000" flood-opacity=".28"/></filter>`;
const shadow=`<ellipse cx="200" cy="372" rx="120" ry="18" fill="#000" opacity=".22" filter="url(#soft)"/>`;
const C={};
C.rice=o=>`${defs('g'+o,'#ffffff','#f4f1ea','#cfc7b8')}${shadow}<g filter="url(#ds)"><path d="M200 48 C 150 48 60 210 70 270 C 80 330 320 330 330 270 C 340 210 250 48 200 48 Z" fill="url(#g${o})"/><path d="M135 270 L265 270 L265 330 C 265 340 135 340 135 330 Z" fill="#2f4a3a"/><path d="M135 270 L265 270 L255 300 L145 300 Z" fill="#3d6a4d"/>${gloss(185,150,28,55,-20,.5)}</g>${face(200,200,1)}`;
C.noodles=o=>`${defs('g'+o,'#ffb36b','#ff8a3c','#c9521a')}${defs('n'+o,'#fff3b0','#ffd86b','#e0a22a')}${shadow}<g filter="url(#ds)"><path d="M60 190 C 60 310 110 350 200 350 C 290 350 340 310 340 190 Z" fill="url(#g${o})"/><ellipse cx="200" cy="190" rx="140" ry="40" fill="#ffe9c9"/><ellipse cx="200" cy="186" rx="128" ry="30" fill="url(#n${o})"/>
<path d="M90 180 q 20 -40 40 0 t 40 0 t 40 0 t 40 0 t 40 0" stroke="#ffd86b" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M100 196 q 20 -30 40 0 t 40 0 t 40 0 t 40 0" stroke="#f5c04a" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M250 60 L 300 176" stroke="#8a5a2b" stroke-width="10" stroke-linecap="round"/><path d="M275 50 L 318 170" stroke="#a66d35" stroke-width="10" stroke-linecap="round"/>
<path d="M120 60 q 10 -30 0 -50" stroke="#fff" stroke-width="10" fill="none" opacity=".5" stroke-linecap="round"/><path d="M165 50 q 10 -30 0 -50" stroke="#fff" stroke-width="10" fill="none" opacity=".4" stroke-linecap="round"/>
${gloss(110,250,30,50,-20,.45)}</g>${face(200,268,.9)}`;
C.dumplings=o=>`${defs('g'+o,'#fffbf0','#f7e9c8','#d9c08e')}${shadow}<g filter="url(#ds)"><path d="M50 250 C 50 160 120 90 200 90 C 280 90 350 160 350 250 C 350 300 300 330 200 330 C 100 330 50 300 50 250 Z" fill="url(#g${o})"/>
<path d="M70 215 q 130 -80 260 0" stroke="#c9a96a" stroke-width="7" fill="none" stroke-linecap="round"/>${[0,1,2,3,4,5].map(i=>`<path d="M ${95+i*42} ${200-Math.sin(i/5*Math.PI)*22} q 10 -28 20 0" stroke="#c9a96a" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('')}
${gloss(145,165,35,45,-25,.5)}</g>${face(200,265,.9)}`;
C.chicken=o=>`${defs('g'+o,'#f2b06b','#c97a33','#8a4a16')}${shadow}<g filter="url(#ds)"><path d="M120 300 C 60 260 70 140 170 110 C 260 80 330 130 320 210 C 310 290 200 340 120 300 Z" fill="url(#g${o})"/>
<path d="M300 200 L 350 90" stroke="#f5f0e8" stroke-width="26" stroke-linecap="round"/><circle cx="352" cy="78" r="20" fill="#fff"/><circle cx="335" cy="98" r="18" fill="#fff"/>
<circle cx="140" cy="170" r="6" fill="#7a3a0c" opacity=".6"/><circle cx="250" cy="150" r="7" fill="#7a3a0c" opacity=".6"/><circle cx="210" cy="270" r="5" fill="#7a3a0c" opacity=".6"/>
${gloss(165,165,35,45,-20,.5)}</g>${face(200,215,.9)}`;
C.fish=o=>`${defs('g'+o,'#9fe9ff','#3cc3ea','#1673a6')}${shadow}<g filter="url(#ds)"><path d="M300 200 L 370 130 L 360 200 L 370 270 Z" fill="#2aa4d4"/><ellipse cx="190" cy="200" rx="150" ry="95" fill="url(#g${o})"/>
<path d="M150 110 q 40 -50 90 0" fill="#2aa4d4" opacity=".8"/>${[0,1,2,3].map(i=>`<path d="M ${230+i*18} ${150+i*10} q 25 50 0 100" stroke="#1673a6" stroke-width="5" fill="none" opacity=".5"/>`).join('')}
${gloss(120,150,50,40,-15)}</g>${face(150,205,.95,{eye:1.05})}`;
C.egg=o=>`${defs('g'+o,'#ffffff','#fff2c4','#e3c07a')}${shadow}<g filter="url(#ds)"><path d="M200 50 C 120 50 70 170 70 240 C 70 310 130 350 200 350 C 270 350 330 310 330 240 C 330 170 280 50 200 50 Z" fill="url(#g${o})"/>${gloss(150,130,40,70,-20)}</g>${face(200,215,1)}`;
C.apple=o=>`${defs('g'+o,'#ff8f8f','#e63946','#8f0f1f')}${shadow}<g filter="url(#ds)"><path d="M200 110 C 150 60 60 90 60 190 C 60 280 130 350 200 340 C 270 350 340 280 340 190 C 340 90 250 60 200 110 Z" fill="url(#g${o})"/>
<path d="M200 110 L 205 60" stroke="#5a3a1a" stroke-width="12" stroke-linecap="round"/><path d="M208 80 q 60 -40 70 10 q -50 20 -70 -10 Z" fill="#5fbf4a"/><path d="M210 80 q 40 -20 60 5" stroke="#3f8f30" stroke-width="3" fill="none"/>
${gloss(140,150,45,65,-20)}</g>${face(200,215,1)}`;
C.hamburger=o=>`${defs('g'+o,'#ffd59a','#e6963c','#a8601a')}${defs('b'+o,'#ffd59a','#e2902f','#a8601a')}${shadow}<g filter="url(#ds)">
<path d="M60 170 C 60 90 120 50 200 50 C 280 50 340 90 340 170 Z" fill="url(#g${o})"/>${[[110,95],[160,70],[215,66],[270,80],[310,120],[135,130],[250,118]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#fff6dc" transform="rotate(-20 ${x} ${y})"/>`).join('')}
<path d="M55 172 q 15 30 35 0 t 35 0 t 35 0 t 35 0 t 35 0 t 35 0 t 35 0 t 35 0 v 24 H 55 Z" fill="#5fbf4a"/>
<rect x="60" y="192" width="280" height="30" rx="6" fill="#ffcc33"/><path d="M300 222 l 30 -4 l -4 30 Z" fill="#ffcc33"/>
<rect x="58" y="220" width="284" height="46" rx="20" fill="#6b3a1e"/><rect x="62" y="226" width="276" height="14" rx="7" fill="#8a4f2a" opacity=".7"/>
<path d="M60 266 h 280 c 0 50 -40 70 -140 70 c -100 0 -140 -20 -140 -70 Z" fill="url(#b${o})"/>${gloss(130,100,40,30,-20,.5)}</g>${face(200,300,.7,{blush:false})}`;
C.cake=o=>`${defs('g'+o,'#c9a4ff','#8e5bff','#4b22a6')}${shadow}<g filter="url(#ds)"><path d="M70 330 L 200 90 L 330 330 Z" fill="url(#g${o})"/><path d="M70 330 L 330 330 L 330 350 Q 200 380 70 350 Z" fill="#3a1a80"/>
<path d="M135 210 L 265 210" stroke="#ffd1f0" stroke-width="12"/><path d="M103 270 L 297 270" stroke="#ffd1f0" stroke-width="12"/>
<path d="M165 150 q 35 -30 70 0 q -35 15 -70 0 Z" fill="#fff"/><circle cx="200" cy="120" r="18" fill="#ff3b6b"/><path d="M200 102 q 10 -25 25 -30" stroke="#3f8f30" stroke-width="5" fill="none"/>
${[[150,240],[250,240],[200,300],[120,300],[280,300]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#ffd23f"/>`).join('')}${gloss(160,230,25,60,-10,.4)}</g>${face(200,250,.75)}`;
C.cream=o=>`${defs('g'+o,'#ffffff','#fff7ea','#d9c6a8')}${defs('c'+o,'#f3c98b','#d9a056','#9a6428')}${shadow}<g filter="url(#ds)"><path d="M120 230 L 200 370 L 280 230 Z" fill="url(#c${o})"/>${[0,1,2,3].map(i=>`<path d="M ${130+i*12} ${240+i*30} L ${270-i*12} ${240+i*30}" stroke="#a8702e" stroke-width="3" opacity=".6"/>`).join('')}${[0,1,2].map(i=>`<path d="M ${150+i*30} 240 L ${200} ${340}" stroke="#a8702e" stroke-width="3" opacity=".5"/>`).join('')}
<ellipse cx="200" cy="225" rx="95" ry="30" fill="url(#g${o})"/><ellipse cx="200" cy="170" rx="80" ry="40" fill="url(#g${o})"/><ellipse cx="200" cy="120" rx="62" ry="34" fill="url(#g${o})"/><ellipse cx="200" cy="80" rx="40" ry="26" fill="url(#g${o})"/><path d="M200 55 q 20 -20 10 -40" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round"/>
<circle cx="150" cy="150" r="6" fill="#ff5fa0"/><circle cx="250" cy="120" r="6" fill="#3ce0ff"/><circle cx="230" cy="190" r="6" fill="#ffd23f"/><circle cx="175" cy="95" r="5" fill="#7b4dff"/>
${gloss(160,110,25,40,-20,.6)}</g>${face(200,170,.75)}`;
C.naan=o=>`${defs('g'+o,'#ffe3b0','#e9b56a','#b4762e')}${shadow}<g filter="url(#ds)"><path d="M200 50 C 120 50 60 150 60 240 C 60 320 130 350 200 345 C 290 340 340 280 340 200 C 340 120 280 50 200 50 Z" fill="url(#g${o})"/>
${[[120,130],[250,110],[290,220],[140,280],[230,300],[110,220],[200,175]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="14" ry="10" fill="#a8601a" opacity=".55"/>`).join('')}${gloss(140,130,45,60,-20,.5)}</g>${face(200,225,.9)}`;
C.curry=o=>`${defs('g'+o,'#ffe7c2','#f3dcb8','#c9b48c')}${defs('k'+o,'#f0a84a','#c9731e','#7d4212')}${shadow}<g filter="url(#ds)"><path d="M50 200 C 50 310 110 350 200 350 C 290 350 350 310 350 200 Z" fill="url(#g${o})"/><ellipse cx="200" cy="200" rx="150" ry="42" fill="#fff6e8"/><ellipse cx="200" cy="198" rx="135" ry="32" fill="url(#k${o})"/>
<ellipse cx="120" cy="190" rx="40" ry="16" fill="#fff" opacity=".9"/><ellipse cx="280" cy="195" rx="22" ry="10" fill="#f2c94c"/><ellipse cx="240" cy="205" rx="18" ry="8" fill="#5fbf4a"/>
<path d="M150 150 q 10 -30 0 -55" stroke="#fff" stroke-width="10" fill="none" opacity=".5" stroke-linecap="round"/><path d="M200 140 q 10 -30 0 -55" stroke="#fff" stroke-width="10" fill="none" opacity=".45" stroke-linecap="round"/><path d="M250 150 q 10 -30 0 -55" stroke="#fff" stroke-width="10" fill="none" opacity=".4" stroke-linecap="round"/>
${gloss(110,260,30,45,-20,.45)}</g>${face(200,272,.9)}`;
C.samosa=o=>`${defs('g'+o,'#ffe29a','#e9b43f','#a8731a')}${shadow}<g filter="url(#ds)"><path d="M200 60 L 345 330 L 55 330 Z" fill="url(#g${o})"/><path d="M200 60 L 345 330" stroke="#c48c22" stroke-width="10" stroke-linecap="round"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${210+i*24}" cy="${80+i*45}" r="6" fill="#fff3c4" opacity=".9"/>`).join('')}
<circle cx="140" cy="250" r="7" fill="#7d4212" opacity=".5"/><circle cx="110" cy="300" r="5" fill="#7d4212" opacity=".5"/><circle cx="250" cy="300" r="6" fill="#7d4212" opacity=".5"/>${gloss(190,200,22,50,-15,.5)}</g>${face(200,255,.85)}`;
C.tangyuan=o=>`${defs('g'+o,'#ffffff','#f7f3ee','#cfc5bb')}${shadow}<g filter="url(#ds)"><circle cx="200" cy="200" r="140" fill="url(#g${o})"/>${gloss(140,130,45,60,-20)}</g>${face(200,210,1)}`;
C.diya=o=>`${defs('g'+o,'#f2b27a','#c8702f','#7a3d12')}${shadow}<g filter="url(#ds)"><path d="M60 240 C 60 320 120 350 200 350 C 280 350 340 320 340 240 Z" fill="url(#g${o})"/><ellipse cx="200" cy="240" rx="140" ry="36" fill="#f7d9a8"/><ellipse cx="200" cy="236" rx="120" ry="24" fill="#f5c46b"/>
<ellipse cx="200" cy="160" rx="70" ry="70" fill="#ffd23f" opacity=".35" filter="url(#soft)"/><path d="M200 60 C 170 120 160 150 170 190 C 180 220 220 220 230 190 C 240 150 230 120 200 60 Z" fill="#ff9a2e"/><path d="M200 110 C 185 140 182 160 188 185 C 192 200 208 200 212 185 C 218 160 215 140 200 110 Z" fill="#ffe36b"/>
${gloss(120,290,30,35,-20,.45)}</g>${face(200,295,.75)}`;
C.box=o=>`${defs('g'+o,'#ff7bb0','#ff4fa3','#b3186c')}<g filter="url(#ds)"><rect x="40" y="120" width="320" height="230" rx="34" fill="url(#g${o})"/><rect x="60" y="150" width="280" height="180" rx="22" fill="#fff6e9"/><rect x="60" y="150" width="140" height="90" rx="16" fill="#ffe4ee"/><rect x="200" y="150" width="140" height="90" rx="16" fill="#e4fbff"/><rect x="60" y="240" width="280" height="90" rx="16" fill="#fff5d6"/>${gloss(110,170,40,25,-10,.5)}</g>`;
window.CHAR=(type,opt={})=>{const o=++uid;const w=opt.size||400;curFace=opt.face||{};return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${w}" height="${w}" style="overflow:visible;display:block"><defs>${common}</defs>${C[type](o)}</svg>`};
window.CHARS=Object.keys(C);
})();
