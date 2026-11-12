/* =====================================================================
   Original 3D "glossy toy" illustrations — drawn in code for this project
   (no third-party artwork). Every picture is a self-contained SVG, used as
   an <img> data-URL so gradients never clash.   TC.art(name) → data URL
   ===================================================================== */
(function () {
  "use strict";
  const TC = (window.TC = window.TC || {});

  /* ---------- colour helpers ---------- */
  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r, g, b) { return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
  const light = (h, f = 0.45) => { const [r, g, b] = hex2rgb(h); return rgb2hex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f); };
  const dark = (h, f = 0.35) => { const [r, g, b] = hex2rgb(h); return rgb2hex(r * (1 - f), g * (1 - f), b * (1 - f)); };

  /* ---------- drawing context ---------- */
  function Ctx() {
    let n = 0; const defs = [];
    const c = {
      /** glossy radial fill: light top-left → base → dark bottom-right */
      g(col, cx = 35, cy = 28) {
        const id = "g" + n++;
        defs.push(`<radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="80%"><stop offset="0" stop-color="${light(col, 0.55)}"/><stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="${dark(col, 0.42)}"/></radialGradient>`);
        return `url(#${id})`;
      },
      /** vertical gradient */
      v(top, bottom) {
        const id = "v" + n++;
        defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`);
        return `url(#${id})`;
      },
      /** soft white specular highlight */
      hl(cx, cy, rx, ry, rot = -25, op = 0.75) {
        const id = "h" + n++;
        defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="#fff" stop-opacity="${op}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`);
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})" transform="rotate(${rot} ${cx} ${cy})"/>`;
      },
      shadow(cx = 100, cy = 186, rx = 62, ry = 10) {
        const id = "s" + n++;
        defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`);
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`;
      },
      sphere(cx, cy, r, col, hlop = 0.75) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.g(col)}"/>` + c.hl(cx - r * 0.32, cy - r * 0.38, r * 0.42, r * 0.24, -30, hlop); },
      ell(cx, cy, rx, ry, col, rot = 0, hlop = 0.6) { return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.g(col)}" transform="rotate(${rot} ${cx} ${cy})"/>` + (hlop ? c.hl(cx - rx * 0.3, cy - ry * 0.4, rx * 0.4, ry * 0.22, rot - 20, hlop) : ""); },
      path(d, col, extra = "") { return `<path d="${d}" fill="${c.g(col)}" ${extra}/>`; },
      flat(d, col, extra = "") { return `<path d="${d}" fill="${col}" ${extra}/>`; },
      /** big shiny kawaii eyes */
      eyes(cx, cy, gap, s = 9, col = "#1b1d33") {
        const e = (x) => `<ellipse cx="${x}" cy="${cy}" rx="${s * 0.82}" ry="${s}" fill="${col}"/><circle cx="${x - s * 0.28}" cy="${cy - s * 0.38}" r="${s * 0.34}" fill="#fff"/><circle cx="${x + s * 0.3}" cy="${cy + s * 0.32}" r="${s * 0.15}" fill="#fff" opacity=".8"/>`;
        return e(cx - gap) + e(cx + gap);
      },
      blush(cx, cy, gap, col = "#ff7aa8") { return `<ellipse cx="${cx - gap}" cy="${cy}" rx="9" ry="5" fill="${col}" opacity=".55"/><ellipse cx="${cx + gap}" cy="${cy}" rx="9" ry="5" fill="${col}" opacity=".55"/>`; },
      smile(cx, cy, w = 8, col = "#1b1d33") { return `<path d="M${cx - w} ${cy} Q${cx} ${cy + w * 0.9} ${cx + w} ${cy}" stroke="${col}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; },
      wheel(cx, cy, r) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.g("#2b2f45")}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="${c.g("#d9dfef")}"/>` + c.hl(cx - r * 0.3, cy - r * 0.35, r * 0.3, r * 0.16, -30, 0.5); },
      out(body, vb = "0 0 200 200") { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${defs.join("")}</defs>${body}</svg>`; }
    };
    return c;
  }

  /* ---------- a chibi animal head + body factory ---------- */
  function critter(o) {
    const c = Ctx(); let s = c.shadow(100, 188, 58, 9);
    const B = o.body, H = o.head;
    if (o.tail) s += o.tail(c);
    s += c.ell(100, 150, 50, 36, B);                                        // body
    s += c.ell(70, 178, 15, 10, o.feet || dark(B, 0.15), 0, 0.3) + c.ell(130, 178, 15, 10, o.feet || dark(B, 0.15), 0, 0.3); // feet
    if (o.belly) s += c.ell(100, 156, 30, 22, o.belly, 0, 0.3);
    if (o.backEars) s += o.backEars(c);
    s += c.sphere(100, 86, 62, H);                                          // head
    if (o.frontEars) s += o.frontEars(c);
    if (o.face) s += o.face(c);
    if (o.muzzle) s += c.ell(100, 108, 28, 19, o.muzzle, 0, 0.4);
    s += c.eyes(100, o.eyeY || 86, o.eyeGap || 22, o.eyeS || 9.5);
    if (o.nose !== false) s += `<ellipse cx="100" cy="${o.noseY || 102}" rx="7" ry="5" fill="${o.nose || "#3a2530"}"/>`;
    s += c.smile(100, (o.noseY || 102) + 6, 6);
    s += c.blush(100, (o.eyeY || 86) + 18, 36);
    if (o.top) s += o.top(c);
    return c.out(s);
  }

  /* ---------- the catalogue ---------- */
  const A = {};
  // animals
  A.cat = () => critter({ body: "#ffb15c", head: "#ffb15c", belly: "#fff2df", muzzle: "#fff2df",
    backEars: (c) => c.path("M50 60 L56 14 L88 40Z", "#ff9a3c") + c.flat("M58 50 L61 26 L78 42Z", "#ffc9d6") + c.path("M150 60 L144 14 L112 40Z", "#ff9a3c") + c.flat("M142 50 L139 26 L122 42Z", "#ffc9d6"),
    top: (c) => `<path d="M90 44 Q100 40 110 44 M86 54 Q100 49 114 54" stroke="#e8782a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M62 104 L40 100 M62 110 L40 112 M138 104 L160 100 M138 110 L160 112" stroke="#8a5a3a" stroke-width="2.5" stroke-linecap="round"/>`,
    tail: (c) => `<path d="M142 156 Q182 150 172 112" stroke="${"#ff9a3c"}" stroke-width="14" fill="none" stroke-linecap="round"/>` });
  A.dog = () => critter({ body: "#d9a066", head: "#e8b57a", belly: "#fff1dc", muzzle: "#fff1dc",
    backEars: () => "", frontEars: (c) => c.ell(46, 92, 16, 34, "#9a6233", 15, 0.3) + c.ell(154, 92, 16, 34, "#9a6233", -15, 0.3),
    top: (c) => `<ellipse cx="128" cy="70" rx="14" ry="11" fill="#c98a4f" opacity=".7"/><path d="M100 116 q0 10 6 12" stroke="#ff6b8a" stroke-width="8" stroke-linecap="round" fill="none"/>`,
    tail: () => `<path d="M144 150 Q178 140 170 118" stroke="#c98a4f" stroke-width="13" fill="none" stroke-linecap="round"/>` });
  A.bear = () => critter({ body: "#9a6236", head: "#a8703f", belly: "#e8c9a2", muzzle: "#e8c9a2",
    backEars: (c) => c.sphere(52, 40, 20, "#9a6236") + c.sphere(148, 40, 20, "#9a6236") + `<circle cx="52" cy="40" r="10" fill="#e8c9a2"/><circle cx="148" cy="40" r="10" fill="#e8c9a2"/>` });
  A.pig = () => critter({ body: "#ffa3c2", head: "#ffb3cc", belly: "#ffd3e2", nose: false, noseY: 110,
    backEars: (c) => c.path("M54 52 L50 18 L84 38Z", "#ff8db3") + c.path("M146 52 L150 18 L116 38Z", "#ff8db3"),
    face: (c) => c.ell(100, 108, 20, 14, "#ff8db3", 0, 0.4) + `<ellipse cx="93" cy="108" rx="4" ry="6" fill="#c2507a"/><ellipse cx="107" cy="108" rx="4" ry="6" fill="#c2507a"/>`,
    tail: () => `<path d="M148 146 q16 -4 12 -14 q-4 -8 -10 0" stroke="#ff8db3" stroke-width="6" fill="none" stroke-linecap="round"/>` });
  A.rabbit = () => critter({ body: "#f4f1ff", head: "#fbf8ff", belly: "#ffe6f0", muzzle: "#fff4f8",
    backEars: (c) => c.ell(76, 22, 15, 40, "#f4f1ff", -8, 0.4) + `<ellipse cx="76" cy="24" rx="7" ry="28" fill="#ffc2d6" transform="rotate(-8 76 24)"/>` + c.ell(124, 22, 15, 40, "#f4f1ff", 8, 0.4) + `<ellipse cx="124" cy="24" rx="7" ry="28" fill="#ffc2d6" transform="rotate(8 124 24)"/>`,
    nose: "#ff7aa8" });
  A.tiger = () => critter({ body: "#ff9b2f", head: "#ffa53d", belly: "#fff3e0", muzzle: "#fff3e0",
    backEars: (c) => c.sphere(50, 42, 18, "#ff9b2f") + c.sphere(150, 42, 18, "#ff9b2f") + `<circle cx="50" cy="42" r="8" fill="#3a2530"/><circle cx="150" cy="42" r="8" fill="#3a2530"/>`,
    top: () => `<g stroke="#3a2530" stroke-width="6" stroke-linecap="round" fill="none"><path d="M100 28 v16 M84 32 l4 12 M116 32 l-4 12"/><path d="M42 82 h16 M40 98 h14 M158 82 h-16 M160 98 h-14"/><path d="M62 140 l10 8 M138 140 l-10 8"/></g>` });
  A.lion = () => critter({ body: "#ffc54d", head: "#ffcf5c", belly: "#fff1c9", muzzle: "#fff1c9",
    backEars: (c) => { let m = ""; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, x = 100 + Math.cos(a) * 64, y = 86 + Math.sin(a) * 64; m += c.sphere(x, y, 24, i % 2 ? "#d9772b" : "#c4621f", 0.4); } return m + c.sphere(56, 38, 15, "#ffcf5c") + c.sphere(144, 38, 15, "#ffcf5c"); },
    tail: () => `<path d="M146 152 Q186 150 176 120" stroke="#e0a43a" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="176" cy="116" r="11" fill="#c4621f"/>` });
  A.monkey = () => critter({ body: "#8a5634", head: "#94603a", belly: "#f2d0a8",
    frontEars: (c) => c.sphere(36, 92, 20, "#8a5634") + `<circle cx="36" cy="92" r="11" fill="#f2c6a0"/>` + c.sphere(164, 92, 20, "#8a5634") + `<circle cx="164" cy="92" r="11" fill="#f2c6a0"/>`,
    face: (c) => c.path("M100 64 C70 50 52 82 64 104 C74 124 126 124 136 104 C148 82 130 50 100 64Z", "#f6d3ad"),
    tail: () => `<path d="M146 160 Q190 160 180 120 Q174 100 160 112" stroke="#7a4a2c" stroke-width="9" fill="none" stroke-linecap="round"/>` });
  A.elephant = () => critter({ body: "#9fb3d6", head: "#a9bde0", belly: "#c9d6ee", nose: false, noseY: 118,
    backEars: (c) => c.ell(42, 92, 34, 44, "#93a8cf", -10, 0.4) + `<ellipse cx="44" cy="94" rx="20" ry="28" fill="#ffc2d6" opacity=".6"/>` + c.ell(158, 92, 34, 44, "#93a8cf", 10, 0.4) + `<ellipse cx="156" cy="94" rx="20" ry="28" fill="#ffc2d6" opacity=".6"/>`,
    face: (c) => c.path("M88 100 C86 130 90 150 76 160 C70 166 78 172 86 166 C104 152 114 130 112 100Z", "#a9bde0", "") });
  function equine(base, mane, muzzle, stripes) {
    const c = Ctx(); let s = c.shadow(100, 188, 54, 9);
    s += c.ell(100, 158, 46, 30, base) + c.ell(74, 180, 13, 9, dark(base, 0.25), 0, 0.3) + c.ell(126, 180, 13, 9, dark(base, 0.25), 0, 0.3);
    s += c.ell(70, 40, 11, 24, base, -18, 0.3) + c.ell(130, 40, 11, 24, base, 18, 0.3) + `<ellipse cx="70" cy="42" rx="5" ry="14" fill="#ffc2d6" transform="rotate(-18 70 42)"/><ellipse cx="130" cy="42" rx="5" ry="14" fill="#ffc2d6" transform="rotate(18 130 42)"/>`;
    s += c.ell(100, 92, 48, 62, base, 0, 0.7);
    if (stripes) s += `<g fill="#26293a"><path d="M58 70 q16 2 22 12 q-14 4 -23 -2z M142 70 q-16 2 -22 12 q14 4 23 -2z M54 98 q14 0 20 8 q-12 4 -21 0z M146 98 q-14 0 -20 8 q12 4 21 0z M92 52 q8 8 8 22 q-6 -4 -12 -2 q2 -12 4 -20z M108 52 q-8 8 -8 22 q6 -4 12 -2 q-2 -12 -4 -20z"/><path d="M68 150 q8 6 6 18 l-8 -3z M132 150 q-8 6 -6 18 l8 -3z"/></g>`;
    s += c.ell(100, 128, 34, 26, muzzle, 0, 0.5) + `<ellipse cx="88" cy="128" rx="5" ry="7" fill="#2a1a20"/><ellipse cx="112" cy="128" rx="5" ry="7" fill="#2a1a20"/>` + c.smile(100, 142, 9);
    s += c.eyes(100, 84, 22, 9.5) + c.blush(100, 104, 36);
    s += c.path("M74 40 Q100 4 128 40 Q118 34 112 46 Q100 30 88 46 Q82 34 74 40Z", mane);
    s += `<path d="M100 28 q-30 6 -26 40" stroke="${mane}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M144 150 Q178 154 172 120" stroke="${mane}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    return c.out(s);
  }
  A.zebra = () => equine("#f7f7fc", "#26293a", "#5a5d73", true);
  A.horse = () => equine("#c4814a", "#4a2d1c", "#e9c39b", false);
  A.duck = () => { const c = Ctx(); let s = c.shadow(100, 186, 56, 9);
    s += c.ell(100, 140, 62, 42, "#ffd43b") + c.path("M146 120 q30 -8 30 14 q-14 2 -30 -2z", "#ffc61a");
    s += c.sphere(96, 76, 50, "#ffde59") + c.ell(70, 140, 26, 16, "#ffc61a", -20, 0.3);
    s += c.path("M118 88 q40 -4 42 12 q-2 14 -40 8z", "#ff8a1f") + c.eyes(92, 70, 16, 8.5) + c.blush(92, 90, 30);
    s += `<path d="M90 30 q6 -18 16 -8" stroke="#ffc61a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    return c.out(s); };
  A.bird = () => { const c = Ctx(); let s = c.shadow(100, 186, 50, 8);
    s += c.path("M50 132 L18 120 L34 146Z", "#3d8bff") + c.sphere(100, 108, 66, "#5ab0ff") + c.ell(100, 130, 38, 30, "#dff1ff", 0, 0.3);
    s += c.ell(54, 118, 22, 34, "#3d8bff", 25, 0.3) + c.path("M156 100 l30 10 l-30 10z", "#ffb020") + c.eyes(104, 92, 20, 9) + c.blush(104, 114, 34);
    s += `<path d="M96 42 q4 -20 18 -14 M104 44 q14 -16 22 -4" stroke="#3d8bff" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M86 176 v-10 M114 176 v-10" stroke="#ff9a2e" stroke-width="5" stroke-linecap="round"/>`;
    return c.out(s); };
  A.turtle = () => { const c = Ctx(); let s = c.shadow(100, 186, 76, 10);
    s += c.ell(54, 172, 16, 10, "#7ad66a", 0, 0.3) + c.ell(146, 172, 16, 10, "#7ad66a", 0, 0.3);
    s += c.sphere(160, 116, 30, "#8be07a") + c.eyes(164, 110, 10, 6) + c.smile(166, 126, 5) + c.blush(166, 124, 18);
    s += c.path("M28 160 C28 70 152 70 152 160Z", "#3fb45a");
    s += `<g fill="#2e9a49" opacity=".85"><path d="M90 92 l18 10 v20 l-18 10 l-18 -10 v-20z"/><path d="M52 124 l14 8 v16 l-14 8 l-12 -8 v-16z"/><path d="M128 124 l12 8 v16 l-12 8 l-14 -8 v-16z"/></g>`;
    s += c.hl(70, 100, 34, 14, -25, 0.7) + `<rect x="24" y="152" width="132" height="14" rx="7" fill="${c.g("#c9a24a")}"/>`;
    return c.out(s); };

  // vehicles (side view toys)
  A.bus = () => { const c = Ctx(); let s = c.shadow(100, 184, 86, 9);
    s += `<rect x="14" y="58" width="172" height="104" rx="26" fill="${c.g("#ffcf33")}"/>` + c.hl(70, 72, 60, 10, 0, 0.7);
    for (let i = 0; i < 4; i++) s += `<rect x="${30 + i * 36}" y="76" width="28" height="34" rx="7" fill="${c.v("#cdeeff", "#6ab8f0")}"/>`;
    s += `<rect x="14" y="122" width="172" height="10" fill="#ff8a1f"/>` + `<rect x="168" y="80" width="14" height="44" rx="5" fill="${c.v("#cdeeff", "#6ab8f0")}"/>`;
    s += c.wheel(52, 162, 20) + c.wheel(148, 162, 20) + `<circle cx="180" cy="142" r="6" fill="#fff6a8"/>`;
    return c.out(s); };
  A.taxi = () => { const c = Ctx(); let s = c.shadow(100, 182, 84, 9);
    s += c.path("M16 140 Q16 106 46 102 L64 70 Q72 58 90 58 L126 58 Q142 58 150 72 L164 102 Q186 106 186 138 Q186 156 168 156 L32 156 Q16 156 16 140Z", "#ffd21f");
    s += `<path d="M72 98 L84 72 Q88 66 96 66 L104 66 L104 98Z M112 98 L112 66 L124 66 Q132 66 136 74 L146 98Z" fill="${c.v("#d6f1ff", "#6ab8f0")}"/>`;
    s += `<rect x="82" y="38" width="38" height="18" rx="5" fill="${c.g("#26293a")}"/><text x="101" y="52" font-family="Arial Black,Arial" font-weight="900" font-size="12" fill="#ffd21f" text-anchor="middle">TAXI</text>`;
    s += `<g fill="#26293a">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${24 + i * 20}" y="${i % 2 ? 126 : 118}" width="10" height="8"/>`).join("")}</g>`;
    s += c.hl(70, 82, 50, 9, -10, 0.6) + c.wheel(52, 156, 21) + c.wheel(150, 156, 21) + `<circle cx="178" cy="128" r="6" fill="#fff6a8"/>`;
    return c.out(s); };
  A.train = () => { const c = Ctx(); let s = c.shadow(100, 186, 86, 8);
    s += c.path("M10 150 L10 92 Q10 70 34 70 L120 70 Q176 74 190 140 Q192 152 178 152 L20 152 Q10 152 10 150Z", "#f2f6ff");
    s += c.path("M132 82 Q168 92 180 132 L140 132 Q132 106 132 82Z", "#2b3f7a") + `<rect x="24" y="86" width="90" height="26" rx="10" fill="${c.v("#d6f1ff", "#5aa6e8")}"/>`;
    s += `<rect x="10" y="118" width="178" height="10" fill="#3d8bff"/><rect x="10" y="132" width="178" height="5" fill="#ff5a5a"/>` + c.hl(60, 78, 50, 6, 0, 0.8);
    s += `<rect x="0" y="160" width="200" height="8" rx="4" fill="#8a94b8"/>` + c.wheel(44, 156, 11) + c.wheel(80, 156, 11) + c.wheel(140, 156, 11);
    return c.out(s); };
  A.plane = () => { const c = Ctx(); let s = c.shadow(100, 186, 70, 8);
    s += c.path("M58 96 L28 40 L50 40 L92 92Z", "#3d8bff") + c.path("M86 106 L52 164 L76 166 L122 110Z", "#2f6fe0");
    s += c.path("M14 96 Q14 80 40 80 L156 80 Q190 82 196 100 Q190 116 156 118 L40 118 Q14 118 14 104Z", "#ffffff");
    s += `<g fill="${c.v("#bfe6ff", "#3d8bff")}">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${60 + i * 20}" cy="96" r="6"/>`).join("")}</g>` + `<path d="M170 88 Q186 92 190 100 L170 100Z" fill="#26293a"/>`;
    s += c.path("M86 104 L120 104 L96 132 L74 132Z", "#5ab0ff") + c.hl(80, 86, 54, 6, 0, 0.9) + `<path d="M14 96 L6 70 L28 74 L40 92Z" fill="#ff5a5a"/>`;
    return c.out(s); };
  A.bike = () => { const c = Ctx(); let s = c.shadow(100, 182, 84, 7);
    const wheel = (x) => `<circle cx="${x}" cy="138" r="34" fill="none" stroke="${"#26293a"}" stroke-width="9"/><circle cx="${x}" cy="138" r="27" fill="none" stroke="#c9d6ff" stroke-width="2"/><circle cx="${x}" cy="138" r="7" fill="#8a94b8"/>`;
    s += wheel(48) + wheel(152);
    s += `<path d="M48 138 L84 86 L136 86 L100 138 Z M100 138 L84 86 M136 86 L152 138 M80 74 L96 74 M136 86 L132 62 L148 58" stroke="${"#ff4f7b"}" stroke-width="9" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<ellipse cx="88" cy="72" rx="16" ry="7" fill="${c.g("#26293a")}"/><circle cx="100" cy="138" r="10" fill="${c.g("#ffc83d")}"/>`;
    return c.out(s); };
  A.boat = () => { const c = Ctx(); let s = "";
    s += `<path d="M0 166 Q25 156 50 166 T100 166 T150 166 T200 166 V200 H0Z" fill="${c.v("#7fd3ff", "#3d8bff")}"/>`;
    s += `<rect x="96" y="22" width="7" height="118" rx="3" fill="#8a5a32"/>` + c.path("M104 28 Q160 80 160 128 L104 128Z", "#ffffff") + c.path("M94 40 Q56 90 50 128 L94 128Z", "#ff5a5a");
    s += c.path("M22 132 L178 132 Q166 168 138 170 L60 170 Q34 168 22 132Z", "#ff9a2e") + `<rect x="22" y="132" width="156" height="8" fill="#fff" opacity=".6"/>` + c.hl(70, 146, 40, 6, 0, 0.6);
    s += `<path d="M104 18 l22 7 l-22 7z" fill="#ffc83d"/>`;
    return c.out(s); };
  A.truck = () => { const c = Ctx(); let s = c.shadow(100, 184, 88, 8);
    s += `<rect x="8" y="62" width="120" height="94" rx="12" fill="${c.g("#3d8bff")}"/>` + c.hl(50, 74, 40, 8, 0, 0.6);
    s += c.path("M128 92 L164 92 Q176 92 182 106 L192 128 L192 156 L128 156Z", "#ff5a5a") + `<path d="M138 100 L162 100 Q170 100 174 110 L180 124 L138 124Z" fill="${c.v("#d6f1ff", "#6ab8f0")}"/>`;
    s += `<rect x="20" y="78" width="96" height="10" rx="5" fill="#fff" opacity=".35"/>` + c.wheel(44, 158, 19) + c.wheel(96, 158, 19) + c.wheel(162, 158, 19);
    return c.out(s); };
  A.scooter = () => { const c = Ctx(); let s = c.shadow(100, 182, 80, 7);
    s += c.path("M40 150 Q40 108 78 104 L120 104 Q130 104 132 116 L140 150Z", "#2ee6b6") + c.path("M120 106 L146 46 L158 46 L136 108Z", "#26a88a");
    s += `<path d="M138 46 h34" stroke="#26293a" stroke-width="8" stroke-linecap="round"/><ellipse cx="80" cy="100" rx="30" ry="9" fill="${c.g("#26293a")}"/>`;
    s += c.hl(64, 118, 26, 7, -10, 0.7) + c.wheel(52, 156, 22) + c.wheel(152, 156, 22) + `<circle cx="150" cy="58" r="7" fill="#fff6a8"/>`;
    return c.out(s); };

  // food
  A.apple = () => { const c = Ctx(); let s = c.shadow(100, 186, 60, 9);
    s += c.path("M100 58 C64 34 18 64 30 120 C40 168 76 184 100 168 C124 184 160 168 170 120 C182 64 136 34 100 58Z", "#ff4b55");
    s += c.hl(66, 82, 22, 12, -40, 0.9) + `<path d="M100 60 Q98 38 106 22" stroke="#7a4a2c" stroke-width="7" fill="none" stroke-linecap="round"/>` + c.path("M108 40 Q132 16 156 30 Q134 52 108 40Z", "#4cd36a");
    return c.out(s); };
  A.banana = () => { const c = Ctx(); let s = c.shadow(100, 182, 70, 8);
    s += c.path("M30 60 C40 140 120 176 176 136 C186 128 180 118 170 124 C120 150 70 120 56 56 C54 46 30 46 30 60Z", "#ffd93b");
    s += c.path("M44 70 C62 130 120 156 170 128 C120 168 46 140 36 64Z", "#f2b705") + `<path d="M30 58 l-6 -14 l12 -4 l6 12z" fill="#6b4a1c"/>` + c.hl(70, 104, 26, 7, 50, 0.8);
    return c.out(s); };
  A.lemon = () => { const c = Ctx(); let s = c.shadow(100, 182, 64, 9);
    s += c.ell(100, 108, 76, 56, "#ffe53b", -12, 0.8) + c.path("M168 92 q16 -4 18 8 q-10 6 -20 2z", "#ffd21f") + c.path("M28 124 q-16 6 -14 -6 q8 -8 18 -2z", "#ffd21f");
    s += c.path("M84 52 Q100 26 128 34 Q110 54 84 52Z", "#4cd36a");
    return c.out(s); };
  A.watermelon = () => { const c = Ctx(); let s = c.shadow(100, 182, 76, 9);
    s += c.path("M14 70 Q100 230 186 70Z", "#2fa84f") + c.path("M24 70 Q100 206 176 70Z", "#e9ffe0") + c.path("M32 70 Q100 192 168 70Z", "#ff4b67");
    s += `<g fill="#26293a">${[[70, 96], [100, 104], [130, 96], [86, 126], [116, 126], [100, 148]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="7"/>`).join("")}</g>` + c.hl(70, 84, 26, 7, 10, 0.7);
    return c.out(s); };
  A.strawberry = () => { const c = Ctx(); let s = c.shadow(100, 184, 54, 8);
    s += c.path("M100 182 C40 150 26 90 50 66 C70 50 130 50 150 66 C174 90 160 150 100 182Z", "#ff3d5a");
    s += `<g fill="#ffe08a">${[[70, 90], [100, 86], [130, 90], [84, 116], [116, 116], [100, 142], [70, 130], [130, 130]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="5"/>`).join("")}</g>`;
    s += c.path("M56 64 Q78 40 100 58 Q122 40 144 64 Q122 76 100 66 Q78 76 56 64Z", "#3fbf5a") + c.hl(72, 84, 18, 9, -40, 0.8);
    return c.out(s); };
  A.cookie = () => { const c = Ctx(); let s = c.shadow(100, 184, 66, 9);
    s += c.sphere(100, 104, 76, "#d9964a", 0.5) + `<circle cx="100" cy="104" r="64" fill="#e3a65a" opacity=".5"/>`;
    s += `<g>${[[70, 78], [118, 70], [138, 112], [82, 124], [108, 146], [60, 112], [112, 104]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="7" fill="${c.g("#4a2a17")}"/>`).join("")}</g>`;
    return c.out(s); };
  A.cake = () => { const c = Ctx(); let s = c.shadow(100, 186, 76, 9);
    s += `<rect x="30" y="94" width="140" height="80" rx="18" fill="${c.g("#ffb3cc")}"/>` + `<rect x="30" y="128" width="140" height="10" fill="#fff" opacity=".8"/>`;
    s += c.path("M30 106 Q30 80 60 80 L140 80 Q170 80 170 106 Q160 114 150 106 Q140 120 128 106 Q116 118 104 106 Q92 120 80 106 Q68 118 56 106 Q44 116 30 106Z", "#fff6fb");
    s += c.sphere(100, 66, 15, "#ff3d5a") + `<path d="M100 52 q4 -12 12 -12" stroke="#3fbf5a" stroke-width="4" fill="none"/>`;
    s += `<rect x="64" y="46" width="7" height="30" rx="3" fill="${c.v("#7fd3ff", "#3d8bff")}"/><rect x="130" y="46" width="7" height="30" rx="3" fill="${c.v("#ffd96b", "#ff9a2e")}"/><ellipse cx="67" cy="40" rx="5" ry="8" fill="#ffb020"/><ellipse cx="133" cy="40" rx="5" ry="8" fill="#ffb020"/>`;
    s += c.hl(66, 100, 30, 6, 0, 0.7);
    return c.out(s); };
  A.hamburger = () => { const c = Ctx(); let s = c.shadow(100, 186, 72, 9);
    s += c.path("M26 150 Q26 176 58 176 L142 176 Q174 176 174 150Z", "#e8a24a");
    s += c.path("M22 136 Q100 160 178 136 L178 148 Q100 168 22 148Z", "#7a3e1d") + c.path("M18 122 Q40 142 60 126 Q80 144 100 126 Q120 144 140 126 Q160 144 182 122 L182 132 L18 132Z", "#ffd21f");
    s += c.path("M20 118 Q40 132 60 118 Q80 134 100 118 Q120 134 140 118 Q160 132 180 118 L180 126 L20 126Z", "#4cd36a");
    s += c.path("M24 116 C24 52 176 52 176 116Z", "#f2b05a") + `<g fill="#fff6dc">${[[70, 78], [100, 70], [130, 80], [86, 96], [118, 94]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3"/>`).join("")}</g>` + c.hl(70, 76, 30, 10, -15, 0.7);
    return c.out(s); };
  A.pizza = () => { const c = Ctx(); let s = c.shadow(100, 184, 50, 8);
    s += c.path("M30 40 Q100 14 170 40 L100 184Z", "#ffd36b") + c.path("M22 34 Q100 2 178 34 L170 52 Q100 26 30 52Z", "#d9893a");
    s += `<g>${[[76, 68], [122, 66], [100, 104], [84, 138], [116, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${c.g("#e83a3a")}"/>`).join("")}</g>` + `<path d="M58 90 q8 10 2 22 M134 96 q-6 14 2 22" stroke="#ffe9a8" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    s += c.hl(80, 50, 30, 6, -8, 0.6);
    return c.out(s); };
  A.egg = () => { const c = Ctx(); let s = c.shadow(100, 186, 50, 8);
    s += c.path("M100 18 C52 18 34 104 40 136 C46 170 72 184 100 184 C128 184 154 170 160 136 C166 104 148 18 100 18Z", "#fff8ec");
    s += c.hl(76, 66, 18, 30, 10, 0.9);
    return c.out(s); };
  A["ice-cream"] = () => { const c = Ctx(); let s = c.shadow(100, 188, 30, 6);
    s += c.path("M62 100 L100 188 L138 100Z", "#e8a24a") + `<path d="M70 112 L126 112 M76 128 L122 128 M84 146 L114 146 M80 104 L110 170 M120 104 L92 170" stroke="#c97f2e" stroke-width="3"/>`;
    s += c.sphere(100, 90, 40, "#ff9ac2") + c.sphere(78, 64, 30, "#fff3dc") + c.sphere(124, 62, 30, "#8a5634") + c.sphere(102, 34, 14, "#ff3d5a");
    s += `<g>${[[84, 98, "#3d8bff"], [112, 92, "#ffd21f"], [98, 110, "#2ee6b6"], [120, 106, "#fff"]].map(([x, y, col]) => `<rect x="${x}" y="${y}" width="8" height="3" rx="1.5" fill="${col}" transform="rotate(30 ${x} ${y})"/>`).join("")}</g>`;
    return c.out(s); };

  // sports + objects
  A.basketball = () => { const c = Ctx(); let s = c.shadow(100, 188, 60, 8);
    s += c.sphere(100, 100, 80, "#ff8a2e") + `<g stroke="#5a2a10" stroke-width="5" fill="none"><path d="M20 100 H180 M100 20 V180"/><path d="M44 42 Q78 100 44 158 M156 42 Q122 100 156 158"/></g>`;
    return c.out(s); };
  A.baseball = () => { const c = Ctx(); let s = c.shadow(100, 188, 58, 8);
    s += c.sphere(100, 100, 78, "#fbf8f0") + `<g stroke="#e83a3a" stroke-width="4" fill="none"><path d="M46 40 Q82 100 46 160"/><path d="M154 40 Q118 100 154 160"/></g>`;
    s += `<g stroke="#e83a3a" stroke-width="3">${[52, 64, 76, 88, 100, 112, 124, 136, 148].map((y) => { const dx = 58 + Math.cos(((y - 100) / 60) * 1.3) * 10; return `<path d="M${dx - 6} ${y - 4} l10 6 M${200 - dx + 6} ${y - 4} l-10 6"/>`; }).join("")}</g>`;
    return c.out(s); };
  A.tennis = () => { const c = Ctx(); let s = c.shadow(100, 188, 58, 8);
    s += c.sphere(100, 100, 78, "#d6f53b") + `<g stroke="#fff" stroke-width="7" fill="none" opacity=".95"><path d="M30 60 Q100 100 30 140"/><path d="M170 60 Q100 100 170 140"/></g>`;
    return c.out(s); };
  A.trophy = () => { const c = Ctx(); let s = c.shadow(100, 188, 54, 8);
    s += `<path d="M52 52 Q14 52 22 86 Q30 112 66 110" stroke="${"#ffb020"}" stroke-width="10" fill="none"/><path d="M148 52 Q186 52 178 86 Q170 112 134 110" stroke="#ffb020" stroke-width="10" fill="none"/>`;
    s += c.path("M46 30 L154 30 Q154 120 100 128 Q46 120 46 30Z", "#ffc83d") + `<rect x="88" y="124" width="24" height="26" fill="${c.g("#ffb020")}"/>`;
    s += `<rect x="58" y="148" width="84" height="30" rx="8" fill="${c.g("#9b6bff")}"/><rect x="74" y="156" width="52" height="12" rx="3" fill="#ffd96b"/>`;
    s += `<path d="M100 52 l8 16 l18 2 l-13 12 l4 18 l-17 -9 l-17 9 l4 -18 l-13 -12 l18 -2z" fill="#fff6c2"/>` + c.hl(70, 50, 14, 30, 0, 0.8);
    return c.out(s); };
  A.gift = () => { const c = Ctx(); let s = c.shadow(100, 188, 70, 9);
    s += `<rect x="30" y="84" width="140" height="96" rx="12" fill="${c.g("#9b6bff")}"/><rect x="90" y="84" width="20" height="96" fill="${c.g("#ffd21f")}"/>`;
    s += `<rect x="22" y="62" width="156" height="32" rx="10" fill="${c.g("#b48aff")}"/><rect x="90" y="62" width="20" height="32" fill="${c.g("#ffe066")}"/>`;
    s += c.path("M100 64 C70 20 40 40 60 60 C70 70 90 66 100 64Z", "#ffd21f") + c.path("M100 64 C130 20 160 40 140 60 C130 70 110 66 100 64Z", "#ffd21f") + c.hl(60, 74, 26, 5, 0, 0.7);
    return c.out(s); };
  A.star = () => { const c = Ctx(); return c.out(c.shadow(100, 186, 50, 7) + c.path("M100 14 L124 70 L184 74 L138 112 L152 172 L100 140 L48 172 L62 112 L16 74 L76 70Z", "#ffc83d") + c.hl(80, 70, 18, 10, -30, 0.9) + c.eyes(100, 98, 16, 7) + c.smile(100, 116, 6)); };
  A.mystegg = (col = "#9b6bff") => { const c = Ctx(); let s = c.shadow(100, 188, 54, 8);
    s += c.path("M100 14 C50 14 30 104 36 138 C42 172 70 188 100 188 C130 188 158 172 164 138 C170 104 150 14 100 14Z", col);
    s += `<g fill="#fff" opacity=".85">${[[72, 70, 12], [126, 92, 16], [86, 134, 10], [130, 150, 8], [62, 112, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>` + c.hl(74, 56, 16, 26, 15, 0.9);
    return c.out(s); };
  A.tree = () => { const c = Ctx(); let s = c.shadow(100, 188, 46, 7);
    s += `<rect x="88" y="120" width="24" height="64" rx="8" fill="${c.g("#9a6236")}"/>` + c.sphere(100, 88, 62, "#3fbf5a") + c.sphere(66, 112, 30, "#36ad50", 0.4) + c.sphere(136, 110, 32, "#36ad50", 0.4);
    return c.out(s); };
  A.cloud = () => { const c = Ctx(); return c.out(c.sphere(70, 120, 40, "#ffffff", 0.3) + c.sphere(110, 98, 52, "#ffffff", 0.4) + c.sphere(150, 124, 36, "#ffffff", 0.3) + `<rect x="40" y="120" width="140" height="40" rx="20" fill="${c.g("#ffffff")}"/>`); };
  A.medal = () => { const c = Ctx(); let s = c.path("M60 10 L90 90 L110 90 L80 10Z", "#3d8bff") + c.path("M140 10 L110 90 L90 90 L120 10Z", "#ff5a5a");
    s += c.sphere(100, 128, 56, "#ffc83d") + `<circle cx="100" cy="128" r="40" fill="none" stroke="#e8a21a" stroke-width="5"/><text x="100" y="146" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="48" fill="#b8740a">1</text>`;
    return c.out(s); };
  A.mic = () => { const c = Ctx(); return c.out(c.shadow(100, 188, 34, 6) + `<rect x="88" y="100" width="24" height="80" rx="10" fill="${c.g("#26293a")}"/>` + c.sphere(100, 66, 48, "#c9d6ff") + `<g stroke="#8a94b8" stroke-width="3" opacity=".7"><path d="M64 56 H136 M58 72 H142 M66 88 H134"/></g>`); };

  A.kart = () => { const c = Ctx(); let s = c.shadow(100, 182, 86, 8);
    s += c.path("M14 140 Q14 118 40 114 L70 108 Q84 86 110 86 L132 86 Q150 88 156 108 L180 114 Q192 118 192 136 Q192 150 176 150 L28 150 Q14 150 14 140Z", "#ff4b55");
    s += c.sphere(108, 74, 24, "#ffc83d") + `<rect x="100" y="66" width="26" height="10" rx="5" fill="${c.v("#bfe6ff", "#3d8bff")}"/>`;
    s += `<circle cx="60" cy="128" r="14" fill="#fff"/><text x="60" y="135" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="18" fill="#ff4b55">1</text>`;
    s += `<path d="M150 104 l26 -10 l6 12 l-24 8z" fill="${c.g("#26293a")}"/>` + c.hl(60, 118, 40, 6, -6, 0.7) + c.wheel(48, 152, 22) + c.wheel(156, 152, 22);
    return c.out(s); };
  A.rainbow = () => { const c = Ctx(); let s = "";
    ["#ff4b55", "#ff9a2e", "#ffd21f", "#35d35a", "#3d8bff", "#9b5cff"].forEach((col, i) => { const r = 86 - i * 10; s += `<path d="M${100 - r} 150 A${r} ${r} 0 0 1 ${100 + r} 150" stroke="${col}" stroke-width="11" fill="none"/>`; });
    s += c.hl(70, 76, 40, 8, -30, 0.6) + c.sphere(28, 150, 22, "#ffffff", 0.3) + c.sphere(50, 156, 18, "#ffffff", 0.3) + c.sphere(172, 150, 22, "#ffffff", 0.3) + c.sphere(150, 156, 18, "#ffffff", 0.3);
    return c.out(s); };

  /* ---------- action poses: a chibi kid doing each classroom command ---------- */
  function poseKid(p) {
    const c = Ctx(); const skin = "#ffd3a8", shirt = "#4cc9ff", pants = "#3d4a8a";
    const limb = (x1, y1, x2, y2, col, w = 13) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
    const P = {
      stand: { arms: [[78, 104, 66, 146], [122, 104, 134, 146]], legs: [[90, 150, 88, 186], [110, 150, 112, 186]], dy: 0, extra: `<path d="M160 120 v-60 m-12 12 l12 -12 l12 12" stroke="#2ee6b6" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
      sit: { arms: [[78, 124, 70, 160], [122, 124, 130, 160]], legs: [[90, 170, 60, 172], [110, 170, 140, 172]], dy: 22, extra: `<rect x="56" y="176" width="88" height="10" rx="5" fill="${c.g("#c98a4f")}"/><path d="M160 60 v60 m-12 -12 l12 12 l12 -12" stroke="#ff9a2e" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
      clap: { arms: [[78, 104, 94, 122], [122, 104, 106, 122]], legs: [[90, 150, 86, 186], [110, 150, 114, 186]], dy: 0, extra: "", front: `<g stroke="#ffc83d" stroke-width="6" stroke-linecap="round"><path d="M100 108 v-10 M84 112 l-10 -6 M116 112 l10 -6 M82 132 l-10 6 M118 132 l10 6"/></g>` },
      raise: { arms: [[78, 104, 66, 146], [122, 104, 136, 44]], legs: [[90, 150, 88, 186], [110, 150, 112, 186]], dy: 0, extra: "" },
      jump: { arms: [[78, 100, 52, 70], [122, 100, 148, 70]], legs: [[90, 146, 76, 168], [110, 146, 124, 168]], dy: -18, extra: `<ellipse cx="100" cy="190" rx="40" ry="6" fill="#000" opacity=".15"/><g stroke="#2ee6b6" stroke-width="5" stroke-linecap="round"><path d="M60 182 h-14 M154 182 h-14"/></g>` },
      dance: { arms: [[78, 104, 50, 84], [122, 104, 146, 128]], legs: [[90, 150, 74, 184], [110, 150, 120, 186]], dy: 0, extra: `<g fill="#ff5fa2"><path d="M154 54 v28 a8 6 0 1 1 -4 -5 v-18 l16 -4 v20 a8 6 0 1 1 -4 -5 v-12z"/></g>` },
      sing: { arms: [[78, 104, 96, 112], [122, 104, 134, 140]], legs: [[90, 150, 88, 186], [110, 150, 112, 186]], dy: 0, extra: `<g fill="#9b6bff"><path d="M140 40 v24 a7 5 0 1 1 -4 -4 v-20z"/><path d="M160 58 v20 a7 5 0 1 1 -4 -4 v-16z"/></g>`,
        front: `<rect x="92" y="94" width="8" height="22" rx="3" fill="#26293a" transform="rotate(-15 96 104)"/><circle cx="99" cy="92" r="8" fill="${c.g("#c9d6ff")}"/><circle cx="96" cy="112" r="8" fill="${c.g(skin)}"/>` },
      run: { arms: [[78, 104, 58, 120], [122, 104, 142, 88]], legs: [[90, 150, 70, 174], [110, 150, 132, 168]], dy: 0, extra: `<g stroke="#8a94b8" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M40 110 h-20 M44 130 h-26 M40 150 h-18"/></g>` }
    }[p];
    let s = c.shadow(100, 192, 44, 6) + P.extra;
    s += `<g transform="translate(0 ${P.dy})">`;
    P.legs.forEach(([a, b, x, y]) => (s += limb(a, b, x, y, pants, 15)));
    s += `<rect x="74" y="96" width="52" height="58" rx="18" fill="${c.g(shirt)}"/>`;
    P.arms.forEach(([a, b, x, y]) => (s += limb(a, b, x, y, shirt, 13) + `<circle cx="${x}" cy="${y}" r="8" fill="${c.g(skin)}"/>`));
    s += c.sphere(100, 66, 32, skin, 0.6) + c.path("M68 62 Q70 30 100 30 Q132 30 132 62 Q120 46 100 50 Q80 46 68 62Z", "#5a3518");
    s += c.eyes(100, 68, 11, 5) + c.smile(100, 80, 6) + c.blush(100, 78, 20);
    s += (P.front || "") + `</g>`;
    return c.out(s);
  }
  ["stand", "sit", "clap", "raise", "jump", "dance", "sing", "run"].forEach((p) => (A["pose-" + p] = () => poseKid(p)));

  /* ---------- city landmarks (simple original silhouettes for the gate backdrops) ---------- */
  A.tower = () => { const c = Ctx(); let s = ""; // a red-and-white lattice tower (Tokyo)
    s += `<path d="M100 6 L106 60 L118 120 L136 196 L64 196 L82 120 L94 60Z" fill="${c.v("#ff6b4a", "#c8321e")}"/>`;
    [40, 80, 120, 160].forEach((y, i) => (s += `<rect x="${86 - i * 9}" y="${y}" width="${28 + i * 18}" height="${i === 2 ? 10 : 6}" fill="#fff" opacity=".9"/>`));
    s += `<path d="M84 196 Q100 150 116 196" fill="#1b2b5e" opacity=".35"/>`; return c.out(s); };
  A.eiffel = () => { const c = Ctx(); let s = ""; // iron lattice tower (Paris)
    s += `<path d="M100 4 L104 50 L114 110 L150 196 L126 196 Q100 150 74 196 L50 196 L86 110 L96 50Z" fill="${c.v("#9a7a5a", "#5a4030")}"/>`;
    s += `<rect x="80" y="104" width="40" height="8" fill="#5a4030"/><rect x="90" y="56" width="20" height="6" fill="#5a4030"/>`; return c.out(s); };
  A.pyramids = () => { const c = Ctx(); return c.out(`<path d="M10 190 L80 80 L150 190Z" fill="${c.v("#ffd27a", "#c98a3a")}"/><path d="M80 80 L150 190 L110 190Z" fill="#000" opacity=".15"/><path d="M110 190 L160 110 L200 190Z" fill="${c.v("#ffdf9a", "#d29a4a")}"/><path d="M160 110 L200 190 L182 190Z" fill="#000" opacity=".15"/>`, "0 0 210 200"); };
  A.palm = () => { const c = Ctx(); let s = `<path d="M100 196 Q92 120 106 60" stroke="#8a5a32" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    [[-60, 40], [-20, 10], [20, 6], [60, 34], [80, 70], [-80, 72]].forEach(([dx, dy]) => (s += `<path d="M106 60 Q${106 + dx / 2} ${40 + dy / 3} ${106 + dx} ${60 + dy}" stroke="#2fa84f" stroke-width="14" fill="none" stroke-linecap="round"/>`));
    s += c.sphere(100, 70, 8, "#8a5a32", 0.3) + c.sphere(114, 72, 8, "#8a5a32", 0.3); return c.out(s); };
  A.opera = () => { const c = Ctx(); let s = `<rect x="10" y="160" width="190" height="24" fill="#d9c9a8"/>`; // white shells on a harbour (Sydney)
    [[30, 160, 70, 60], [70, 160, 110, 40], [110, 160, 150, 70], [150, 160, 190, 90]].forEach(([x0, y0, x1, top]) => (s += `<path d="M${x0} ${y0} Q${x0 + 6} ${top} ${x1} ${top + 6} Q${(x0 + x1) / 2 + 6} ${(y0 + top) / 2 + 20} ${x1 - 4} ${y0}Z" fill="${c.v("#ffffff", "#c9d6ef")}"/>`));
    return c.out(s, "0 0 210 200"); };
  A.mountains = () => { const c = Ctx(); let s = `<path d="M0 190 L60 60 L100 120 L140 40 L210 190Z" fill="${c.v("#7a8ac8", "#3a4a8a")}"/><path d="M60 60 L76 92 L64 88 L52 96 Z M140 40 L158 78 L144 72 L128 82Z" fill="#fff"/>`;
    [20, 50, 160, 190].forEach((x) => (s += `<path d="M${x} 196 L${x - 12} 196 L${x} 150 L${x + 12} 196Z" fill="#1f6a3a"/>`)); return c.out(s, "0 0 210 200"); };

  /* ---------- Ollie-Bot in 3D ---------- */
  A.ollie = () => { const c = Ctx(); let s = c.shadow(100, 222, 58, 8);
    s += `<line x1="100" y1="40" x2="100" y2="16" stroke="#c9d6ff" stroke-width="5" stroke-linecap="round"/>` + c.path("M100 0l5 10 11 1-8 7 3 11-11-6-11 6 3-11-8-7 11-1z", "#ffc83d");
    s += c.path("M36 110 Q4 140 22 190 Q42 162 50 132Z", "#6f7fd8") + c.path("M164 110 Q196 140 178 190 Q158 162 150 132Z", "#6f7fd8");
    s += c.path("M100 34 C30 34 30 90 34 140 C38 196 66 214 100 214 C134 214 162 196 166 140 C170 90 170 34 100 34Z", "#8fa2ff");
    s += c.path("M42 56 L58 26 L80 50Z", "#8fa2ff") + c.path("M158 56 L142 26 L120 50Z", "#8fa2ff");
    s += c.sphere(72, 92, 28, "#ffffff", 0.3) + c.sphere(128, 92, 28, "#ffffff", 0.3) + c.eyes(100, 92, 28, 13);
    s += c.path("M90 110 L110 110 L100 126Z", "#ffb020") + c.blush(100, 118, 50);
    s += `<rect x="62" y="136" width="76" height="52" rx="14" fill="${c.v("#1b2b5e", "#0a1633")}" stroke="#c9d6ff" stroke-width="4"/><text x="100" y="171" text-anchor="middle" font-family="Fredoka,Arial Rounded MT Bold,Arial" font-weight="700" font-size="26" fill="#2ee6b6">ABC</text>`;
    s += c.hl(70, 60, 30, 12, -20, 0.7) + c.ell(80, 212, 14, 8, "#ffc83d", 0, 0.4) + c.ell(120, 212, 14, 8, "#ffc83d", 0, 0.4);
    return c.out(s, "0 0 200 232"); };

  /* ---------- public API ---------- */
  const cache = {};
  TC.ART = A;
  TC.art = function (name, ...args) {
    const key = name + "|" + args.join(",");
    if (!cache[key]) {
      const f = A[name]; if (!f) return "";
      cache[key] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(f(...args));
    }
    return cache[key];
  };
  /** an <img> element for an art piece */
  TC.artImg = function (name, cls = "", alt = "") { const i = new Image(); i.src = TC.art(name); i.className = cls; i.alt = alt || name; i.draggable = false; return i; };
  TC.artNames = () => Object.keys(A);
})();
