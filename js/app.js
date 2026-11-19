'use strict';
/* the app: orb engine, home, layer 3, tabs, design alternatives, start-up */
/* ================= the app: orb engine from the orb generator ================= */
const TAU = Math.PI * 2;
const toLin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
function hex2lab(hex) {
  const n = parseInt(hex.slice(1), 16), r = toLin((n >> 16 & 255) / 255), g = toLin((n >> 8 & 255) / 255), b = toLin((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
// Curated families, each in light / mid / deep. Deep tones stay coloured (plum, navy...), light ones keep a hue.
const FAM = {
  yellow: ['#FFF4A6', '#FFE02E', '#D9A300'], orange: ['#FFD9AA', '#FF9A2E', '#B84E08'], coral: ['#FFCBBA', '#FF6F5A', '#A82A22'],
  pink: ['#FFC6DB', '#FF5C9E', '#9E1250'], magenta: ['#F7B5E4', '#E0209A', '#6A0A50'], purple: ['#DDB6EE', '#8E2FB0', '#360C4E'],
  violet: ['#C9B8F5', '#6A3FD0', '#26126B'], navy: ['#9FAEE8', '#2B3FA6', '#0E1450'], blue: ['#A6C8FF', '#1F5FE0', '#0A2A8A'],
  sky: ['#D2ECFB', '#6EC8F2', '#2A86C4'], cyan: ['#A8EEF9', '#12B5E6', '#08628F'], green: ['#BCEFCB', '#34C46A', '#0C633A'],
  lime: ['#E8F8A8', '#B6E03A', '#557F0E'],
};
const FAM_ORDER = Object.keys(FAM);
const TONES = ['Light', 'Mid', 'Deep'];
const LAB = {}; FAM_ORDER.forEach(f => { LAB[f] = FAM[f].map(hex2lab); });
const col = c => LAB[c.f][c.t];
// The outer colour must stand out from the background. If it is too close to it (too pale on white, too dark on black),
// it is pulled away and made more vivid, keeping its hue, until it clears a minimum contrast.
const BG_LIGHT = [0.967, 0.0, -0.003], BG_DARK = [0.13, 0.0, 0.0], OUTER_MIN_CONTRAST = 0.19;
let BG = BG_LIGHT;
function visibleOuter(lab) {
  let L = lab[0], C = Math.hypot(lab[1], lab[2]); const h = Math.atan2(lab[2], lab[1]);
  const dist = () => Math.hypot(L - BG[0], C * Math.cos(h) - BG[1], C * Math.sin(h) - BG[2]);
  const step = BG[0] > 0.5 ? -0.006 : 0.006;        // light background: darker; black background: lighter
  for (let i = 0; i < 60 && dist() < OUTER_MIN_CONTRAST; i++) { L += step; C += 0.006; }
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

// Routes: the path from an outer family to an inner family, through deliberate bridge colours.
const ROUTES = {};
const route = (outers, inners, bridges) => outers.forEach(o => inners.forEach(i => { ROUTES[o + '>' + i] = bridges; }));
route(['yellow'], ['navy', 'blue', 'violet', 'purple'], ['coral', 'magenta']);
route(['yellow'], ['magenta'], ['orange', 'coral']);
route(['yellow'], ['pink'], ['orange']);
route(['orange'], ['purple', 'violet'], ['pink', 'magenta']);
route(['orange', 'coral'], ['navy', 'blue'], ['coral', 'magenta']);
route(['coral'], ['violet', 'purple'], ['magenta']);
route(['pink'], ['navy', 'blue', 'violet'], ['magenta', 'purple']);
route(['cyan'], ['magenta', 'pink'], ['blue', 'violet']);
route(['cyan'], ['purple', 'violet', 'navy'], ['blue']);
route(['sky'], ['magenta', 'purple', 'pink'], ['violet']);
route(['green'], ['purple', 'violet'], ['cyan', 'blue']);
route(['green'], ['navy', 'blue'], ['cyan']);
route(['lime'], ['violet', 'purple'], ['green', 'cyan']);
route(['lime', 'green'], ['magenta', 'pink'], ['yellow', 'coral']);
route(['magenta'], ['navy'], ['purple']);
route(['blue'], ['pink', 'magenta'], ['violet']);
route(['orange'], ['cyan', 'sky'], ['coral', 'pink']);
route(['magenta', 'purple'], ['sky', 'cyan'], ['violet']);
// Pairs the generator draws from (outer, inner): all have pleasing routes.
const PAIRS = [['yellow', 'navy'], ['yellow', 'blue'], ['yellow', 'violet'], ['yellow', 'purple'], ['yellow', 'magenta'], ['orange', 'purple'], ['orange', 'violet'],
  ['orange', 'navy'], ['coral', 'navy'], ['coral', 'violet'], ['pink', 'navy'], ['cyan', 'purple'], ['cyan', 'magenta'], ['cyan', 'navy'], ['cyan', 'violet'],
  ['sky', 'navy'], ['sky', 'purple'], ['sky', 'magenta'], ['sky', 'pink'], ['blue', 'pink'], ['blue', 'magenta'], ['green', 'purple'], ['green', 'navy'],
  ['green', 'violet'], ['lime', 'violet'], ['lime', 'magenta'], ['green', 'magenta'], ['magenta', 'navy'], ['purple', 'navy'], ['magenta', 'sky'], ['orange', 'cyan']];
const LIGHTISH = ['yellow', 'orange', 'coral', 'pink', 'sky', 'cyan', 'lime', 'green'];
const DARKISH = ['navy', 'violet', 'purple', 'blue', 'magenta'];

/* =============== seeded randomness =============== */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* =============== the generator =============== */
const FAMILIES = [
  ['any', 'Any'], ['small', 'Small offset core'], ['big', 'Big dark core'], ['nested', 'Nested'], ['crescent', 'Ring / crescent'],
];
const FAM_NAME = Object.fromEntries(FAMILIES);

function generate(seed, family) {
  const R = rng(seed), rr = (a, b) => a + (b - a) * R(), pick = a => a[Math.floor(R() * a.length)], chance = p => R() < p;
  const fam = family === 'any' ? pick(['small', 'big', 'nested', 'crescent']) : family;
  const lightPairs = PAIRS.filter(([o]) => LIGHTISH.includes(o));
  const [oF, iF] = pick(chance(0.85) || fam === 'small' || fam === 'big' ? lightPairs : PAIRS);
  const P = {
    seed, fam, motion: 1,
    body: { aspect: rr(0.92, 1.08), len: 0, rot: rr(-0.5, 0.5) },
    mass: { ang: rr(0, TAU), off: rr(0.55, 0.9), size: 0.5, stretch: rr(0.88, 1.14), tilt: rr(-0.4, 0.4) },
    core: { on: false, size: 0.5, ang: 0, off: rr(0.2, 0.55) },
    soft: { rim: rr(0.32, 0.55), halo: rr(0.25, 0.65), trans: rr(0.45, 0.85), core: rr(0.35, 0.7) },
    dist: 0.5, bw: rr(0.1, 0.35),
    col: {
      outer: { f: oF, t: LIGHTISH.includes(oF) ? (chance(0.6) ? 0 : 1) : 1 },
      inner: { f: iF, t: DARKISH.includes(iF) ? (chance(0.5) ? 2 : 1) : 1 },
      core: { f: iF, t: 2 }, bridge: { auto: true, f: [null, null] },
    },
  };
  P.core.ang = P.mass.ang + rr(-0.7, 0.7);
  P.col.core.f = DARKISH.includes(iF) ? (chance(0.6) ? iF : pick(['navy', 'purple', 'violet'].filter(x => x !== iF))) : pick(['navy', 'purple', 'violet']);
  if (fam === 'small') {
    P.mass.size = rr(0.3, 0.44); P.mass.off = rr(0.55, 1); P.bw = rr(0.08, 0.3); P.soft.trans = rr(0.6, 0.95); P.soft.rim = rr(0.45, 0.7);
    P.core.on = chance(0.25); P.core.size = rr(0.35, 0.5);
  } else if (fam === 'big') {
    P.mass.size = rr(0.56, 0.64); P.mass.off = rr(0.2, 0.7); P.col.inner.t = DARKISH.includes(iF) ? 2 : 1; P.col.outer.t = LIGHTISH.includes(oF) ? 1 : 0;
    P.bw = rr(0.45, 0.8); P.soft.trans = rr(0.35, 0.6); P.soft.rim = rr(0.3, 0.5);
  } else if (fam === 'nested') {
    P.mass.size = rr(0.5, 0.62); P.mass.off = rr(0.35, 0.8); P.core.on = true; P.core.size = rr(0.42, 0.6); P.core.off = rr(0.25, 0.55);
    P.col.inner.t = 1; P.col.core.t = 2; P.bw = rr(0.08, 0.28);
  } else if (fam === 'crescent') {
    P.mass.size = rr(0.6, 0.64); P.mass.off = 1; P.dist = 0.5; P.soft.trans = rr(0.3, 0.5); P.soft.rim = rr(0.28, 0.45); P.bw = rr(0.05, 0.2); P.col.outer.t = LIGHTISH.includes(oF) ? 1 : 1;
    P.mass.stretch = rr(0.95, 1.05); P.core.on = chance(0.5); P.core.size = rr(0.4, 0.55); P.core.ang = P.mass.ang + rr(-0.4, 0.4); P.core.off = rr(0.5, 0.8);
  }
  return relate(P);
}
// The brief's balancing rules: when one thing becomes dominant, others get quieter.
function relate(P) {
  if (P.mass.size > 0.6) P.core.size = Math.min(P.core.size, 0.5);
  const bridges = bridgeFams(P).length;
  if (P.core.on && bridges > 0) P.bw = Math.min(P.bw, 0.32);
  return P;
}
function bridgeFams(P) {
  const b = P.col.bridge;
  // at most four colours: with a core present, an automatic route keeps only the bridge nearest the inner colour
  if (b.auto) { const r = (ROUTES[P.col.outer.f + '>' + P.col.inner.f] || []).slice(0, 2); return P.core.on ? r.slice(-1) : r; }
  return b.f.filter(Boolean);
}
function vary(base, i) {
  const P = JSON.parse(JSON.stringify(base)), R = rng((base.seed * 7919 + i * 104729 + 17) >>> 0), rr = (a, b) => a + (b - a) * R();
  P.mass.ang += rr(-0.5, 0.5); P.mass.off = clamp(P.mass.off + rr(-0.15, 0.15), 0, 1); P.mass.size = clamp(P.mass.size * rr(0.88, 1.12), 0.2, MASS_MAX);
  P.mass.stretch = clamp(P.mass.stretch * rr(0.92, 1.08), 0.8, 1.25); P.core.ang += rr(-0.6, 0.6); P.core.size = clamp(P.core.size * rr(0.88, 1.12), 0.2, 0.75);
  P.body.rot += rr(-0.35, 0.35); P.body.aspect = clamp(P.body.aspect + rr(-0.06, 0.06), 0.85, 1.15);
  ['rim', 'halo', 'trans', 'core', 'acc'].forEach(k => { P.soft[k] = clamp(P.soft[k] * rr(0.8, 1.2), 0.02, 1.2); });
  P.bw = clamp(P.bw + rr(-0.12, 0.12), 0, 1); P.dist = clamp(P.dist + rr(-0.14, 0.14), 0, 1);
  P.variant = (base.variant ? base.variant + '.' : '') + (i + 1);
  return relate(P);
}

/* =============== geometry: body -> mass -> core, each inside the last and always leaning to one side =============== */
// Shape: centre c, capsule half-length a, radius r, y-squash s, rotation rot. a = 0 is an ellipse.
function sdf(S, x, y) {
  const dx = x - S.cx, dy = y - S.cy, c = Math.cos(S.rot), s = Math.sin(S.rot);
  const lx = c * dx + s * dy, ly = -s * dx + c * dy;
  return Math.hypot(Math.max(Math.abs(lx) - S.a, 0), ly / S.s) - S.r;
}
function boundary(S) {
  const pts = [], c = Math.cos(S.rot), s = Math.sin(S.rot);
  for (let i = 0; i < 28; i++) {
    const th = i / 28 * TAU, ex = (Math.cos(th) >= 0 ? S.a : -S.a) + S.r * Math.cos(th), ey = S.r * S.s * Math.sin(th);
    pts.push([S.cx + c * ex - s * ey, S.cy + s * ex + c * ey]);
  }
  return pts;
}
const worst = (inn, out, m) => Math.max(...boundary(inn).map(([x, y]) => sdf(out, x, y) + m * out.r));
function keepInside(inn, out, margin) {
  if (worst(inn, out, margin) <= 0) return;
  const x0 = inn.cx, y0 = inn.cy; let lo = 0, hi = 1;
  for (let i = 0; i < 14; i++) { const k = (lo + hi) / 2; inn.cx = out.cx + (x0 - out.cx) * k; inn.cy = out.cy + (y0 - out.cy) * k; if (worst(inn, out, margin) > 0) hi = k; else lo = k; }
  inn.cx = out.cx + (x0 - out.cx) * lo; inn.cy = out.cy + (y0 - out.cy) * lo;
  if (worst(inn, out, margin) > 0) {
    const r0 = inn.r, a0 = inn.a; let l2 = 0, h2 = 1;
    for (let i = 0; i < 14; i++) { const k = (l2 + h2) / 2; inn.r = r0 * k; inn.a = a0 * k; if (worst(inn, out, margin) > 0) h2 = k; else l2 = k; }
    inn.r = r0 * l2; inn.a = a0 * l2;
  }
}
const MASS_MAX = 0.64;   // orb 8: its dark core is 0.64 of the orb's radius. The inner mass never grows past this.
// Put `inn` inside `out`, leaning in direction `ang` (radians, world space). lean 0 = just off centre, 1 = touching the side.
// It is never centred: if it is too big to lean, it shrinks instead of sliding to the middle.
function placeLeaning(inn, out, ang, lean, margin, minFrac = 0.35) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const fitsAt = d => { inn.cx = out.cx + dx * d; inn.cy = out.cy + dy * d; return worst(inn, out, margin) <= 0; };
  const reach = () => { if (!fitsAt(0)) return 0; let lo = 0, hi = 2; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (fitsAt(m)) lo = m; else hi = m; } return lo; };
  const minD = 0.14 * out.r;                         // the least it ever leans
  let dmax = reach();
  for (let i = 0; i < 24 && dmax < minD / minFrac; i++) { inn.r *= 0.93; inn.a *= 0.93; dmax = reach(); }
  fitsAt(dmax * (minFrac + (1 - minFrac) * clamp(lean, 0, 1)));
}
function resolve(P, t, motionOn) {
  const mo = motionOn ? P.motion : 0;
  const w = n => Math.sin(t * n);
  // body fits the unit circle whatever its proportions
  const len = 0, asp = P.body.pill ? clamp(P.body.aspect, 0.45, 0.7) : clamp(P.body.aspect, 0.85, 1.15);   // round, or a smooth pill in the pill variations
  const r0 = Math.min(1 - len, 1 / Math.max(asp, 1e-3)) * 0.94 * (1 + 0.012 * mo * w(0.98));
  const B = { cx: 0, cy: 0, a: len * 0.94, r: r0, s: asp, rot: P.body.rot };
  const dscale = 0.72 + 0.56 * P.dist;
  // mass direction is given in the body's own frame
  const mang = P.mass.ang + 0.09 * mo * w(0.21);
  const la = Math.atan2(Math.sin(mang) * B.r * B.s, Math.cos(mang) * (B.a + B.r)) + B.rot;
  const M = { cx: 0, cy: 0, a: B.a * P.mass.size * 0.55, r: B.r * Math.min(P.mass.size * dscale * (1 + 0.018 * mo * w(0.43)), MASS_MAX),
              s: clamp(P.mass.stretch, P.body.pill ? 0.5 : 0.8, 1.25), rot: B.rot + P.mass.tilt };
  placeLeaning(M, B, la, P.mass.off, 0.03);
  let C = null;
  if (P.core.on) {
    const ca = P.core.ang + 0.12 * mo * w(0.17);
    C = { cx: M.cx, cy: M.cy, a: M.a * P.core.size, r: M.r * P.core.size * (0.8 + 0.4 * P.dist), s: M.s, rot: M.rot + 0.2 };
    placeLeaning(C, M, ca, P.core.off, 0.05, 0.6);
  }
  let K = null;
  if (!C) {
    const dl = Math.hypot(M.cx - B.cx, M.cy - B.cy), ux = dl > 1e-4 ? (M.cx - B.cx) / dl : Math.cos(la), uy = dl > 1e-4 ? (M.cy - B.cy) / dl : Math.sin(la);
    const kr = 0.3;                                   // small, so a wide bridge still gets real territory
    K = { cx: 0, cy: 0, a: M.a * kr, r: M.r * kr, s: M.s, rot: M.rot };
    K.cx = M.cx + ux * (M.r - K.r) * 0.74; K.cy = M.cy + uy * (M.r - K.r) * 0.74;   // stops short of the edge: a sliver of colour always separates the dark from the rim
    keepInside(K, M, 0.04);
  }
  const bf = bridgeFams(P);
  return { B, M, C, K, bf,
    // on black, pastel outers glare white, so they use the mid tone
    s0: visibleOuter(BG === BG_DARK && P.col.outer.t === 0 ? LAB[P.col.outer.f][1] : col(P.col.outer)), s3: col(P.col.inner), s1: bf[0] ? LAB[bf[0]][1] : [0, 0, 0], s2: bf[1] ? LAB[bf[1]][1] : (bf[0] ? LAB[bf[0]][1] : [0, 0, 0]),
    core: col(P.col.core) };
}

/* =============== WebGL renderer (shared by the main view and the grid) =============== */
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform vec3 uView;                        // centre x, y (px) and px per orb unit
uniform vec4 uBa; uniform vec2 uBb;         // body: cx, cy, capsule half-length, radius | squash, rotation
uniform vec4 uMa; uniform vec2 uMb;         // inner mass
uniform vec4 uCa; uniform vec2 uCb;         // core (optional)
uniform vec3 uS0; uniform vec3 uS1; uniform vec3 uS2; uniform vec3 uS3;   // route stops: outer, bridge 1, bridge 2, inner (OKLab)
uniform vec3 uCoreC;
uniform vec4 uRoute;                       // bridge count, bridge share, bridge reach, has core
uniform vec4 uSoft;                        // outer edge, transition, core edge, hidden inner shape in use
uniform vec4 uMisc;                        // halo, mass lean x, mass lean y, unused
uniform vec3 uBg;
uniform float uPools;                      // 0 none, 1 pools around a square view, 2 pools across the phone screen
uniform vec3 uScreen;                      // screen width, height (px), shadow on
uniform float uOrbOn;                      // 0: draw the room only (the orb comes from the orb lab layer)
uniform float uPoolFade;                   // 1 = pools fully there, 0 = gone (layer 3)
const float PI = 3.14159265;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float wrapA(float a){ return a - 2.0 * PI * floor((a + PI) / (2.0 * PI)); }
// blend around the colour wheel (the route supplies the in-between colours, so the short way is right here)
vec3 lchMix(vec3 c1, vec3 c2, float t){
  float C1 = length(c1.yz), C2 = length(c2.yz), h1 = atan(c1.z, c1.y), h2 = atan(c2.z, c2.y);
  if (C1 < 0.02) h1 = h2; if (C2 < 0.02) h2 = h1;
  float h = h1 + wrapA(h2 - h1) * t, C = mix(C1, C2, t);
  return vec3(mix(c1.x, c2.x, t), C * cos(h), C * sin(h));
}
vec3 routeCol(float u){
  float nb = uRoute.x, m = uRoute.y;
  if (nb < 0.5) return lchMix(uS0, uS3, u);
  float e = 0.5 * (1.0 - m);
  if (u < e) return lchMix(uS0, uS1, u / max(e, 1e-3));
  if (u > 1.0 - e) return lchMix(nb > 1.5 ? uS2 : uS1, uS3, (u - (1.0 - e)) / max(e, 1e-3));
  return nb > 1.5 ? lchMix(uS1, uS2, (u - e) / max(1.0 - 2.0 * e, 1e-3)) : uS1;
}
vec3 lab2srgb(vec3 c){
  float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z, m = c.x - 0.1055613458*c.y - 0.0638541728*c.z, s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  vec3 rgb = clamp(vec3(4.0767416621*l - 3.3077115913*m + 0.2309699292*s, -1.2684380046*l + 2.6097574011*m - 0.3413193965*s, -0.0041960863*l - 0.7034186147*m + 1.7076147010*s), 0.0, 1.0);
  return mix(12.92*rgb, 1.055*pow(rgb, vec3(1.0/2.4)) - 0.055, step(0.0031308, rgb));
}
float sdf(vec2 p, vec4 A, vec2 B){
  vec2 d = p - A.xy; float c = cos(B.y), s = sin(B.y);
  vec2 l = vec2(c*d.x + s*d.y, -s*d.x + c*d.y);
  return length(vec2(max(abs(l.x) - A.z, 0.0), l.y / B.x)) - A.w;
}
// Which in-between shape (from A to B) passes through p. Where the shapes nearly touch this changes quickly
// (a defined edge); where they are far apart it changes slowly (a long soft transition). One material, no visible stacking.
float solveT(vec2 p, vec4 A, vec2 Ab, vec4 B, vec2 Bb){
  float flo = sdf(p, A, Ab), fhi = sdf(p, B, Bb);
  if (fhi <= 0.0) return 1.0;
  if (flo >= 0.0) return 0.0;
  float lo = 0.0, hi = 1.0;
  for (int i = 0; i < 12; i++){ float m = 0.5*(lo + hi), fm = sdf(p, mix(A, B, m), mix(Ab, Bb, m)); if (fm < 0.0){ lo = m; flo = fm; } else { hi = m; fhi = fm; } }
  return lo + (hi - lo) * (flo / (flo - fhi));
}
void blobE(inout vec3 c, vec2 p, vec2 at, vec2 r, float ang, vec3 bc, float s){
  vec2 d = p - at; float cs = cos(ang), sn = sin(ang);
  d = vec2(cs*d.x + sn*d.y, -sn*d.x + cs*d.y) / r;
  float q = dot(d, d); float w = exp(-q * sqrt(q) * 0.9) * s;
  if (w > 0.004) c = mix(c, bc, min(w, 1.0));
}
void pool(inout vec3 c, vec2 v, vec2 at, vec2 r, vec3 pc, float s){
  vec2 d = (v - at) / r; float w = exp(-dot(d, d)) * s;
  c = mix(c, pc, min(w, 1.0));                                 // plain soft blend: no seams
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - uView.xy) / uView.z;
  vec3 colr = uBg;
  vec3 roomBase = colr;
  if (uPools > 1.5){
    // across the phone screen, measured from the top-left in screen widths (the home screen reference layout),
    // every pool coloured from this orb: outer, its bridge colours, and its inner colour
    vec2 sv = vec2(frag.x / uScreen.x, (uScreen.y - frag.y) / uScreen.x);
    vec3 b1 = uRoute.x > 0.5 ? uS1 : lchMix(uS0, uS3, 0.5), b2 = uRoute.x > 1.5 ? uS2 : b1;
    vec3 pinkL = vec3(min(b1.x + 0.16, 0.95), b1.yz * 0.55), purp = lchMix(b2, uS3, 0.5), peri = vec3(min(uS3.x + 0.3, 0.9), uS3.yz * 0.55);
    vec3 peach = lchMix(uS0, b1, 0.3);
    blobE(colr, sv, vec2(-0.03, 0.03), vec2(0.27, 0.21),  0.35, peach, 0.95);
    blobE(colr, sv, vec2(-0.045,0.36), vec2(0.10, 0.16),  0.00, pinkL, 0.90);
    blobE(colr, sv, vec2( 1.02, 0.08), vec2(0.35, 0.32), -0.30, pinkL, 0.70);
    blobE(colr, sv, vec2( 1.02, 0.08), vec2(0.255,0.24), -0.30, b1,    0.95);
    blobE(colr, sv, vec2( 1.02, 0.08), vec2(0.185,0.17), -0.30, purp,  1.00);
    blobE(colr, sv, vec2( 1.03, 0.07), vec2(0.145,0.13), -0.30, uS3,   1.10);
    blobE(colr, sv, vec2(-0.05, 1.50), vec2(0.11, 0.08),  0.00, peri,  0.65);
    blobE(colr, sv, vec2( 0.05, 1.95), vec2(0.34, 0.28),  0.20, pinkL, 0.70);
    blobE(colr, sv, vec2( 0.08, 1.84), vec2(0.26, 0.20),  0.20, b2,    1.00);
    blobE(colr, sv, vec2(-0.01, 1.79), vec2(0.17, 0.19),  0.00, purp,  1.00);
    blobE(colr, sv, vec2(-0.03, 1.77), vec2(0.135,0.165), 0.00, uS3,   1.15);
    blobE(colr, sv, vec2( 1.04, 1.79), vec2(0.34, 0.29),  0.00, uS0,   0.90);
    blobE(colr, sv, vec2( 1.03, 1.80), vec2(0.13, 0.12),  0.00, b1,    0.60);
    colr = mix(roomBase, colr, uPoolFade);
  } else if (uPools > 0.5){
    vec2 v = p * 0.40;
    vec3 br = uRoute.x > 0.5 ? uS1 : lchMix(uS0, uS3, 0.5);
    pool(colr, v, vec2(-0.56,  0.56), vec2(0.24, 0.20), uS0, 0.80);
    pool(colr, v, vec2( 0.56,  0.58), vec2(0.26, 0.22), br,  0.60);
    pool(colr, v, vec2(-0.56, -0.44), vec2(0.24, 0.22), br,  0.60);
    pool(colr, v, vec2( 0.58, -0.46), vec2(0.28, 0.22), uS0, 0.80);
  }
  if (uScreen.z > 0.5 && uBg.x > 0.5){
    vec2 sp = (p - vec2(0.0, -1.03)) / vec2(0.50, 0.04);
    colr.x -= 0.075 * exp(-dot(sp, sp) * 0.9);            // soft floor shadow under the orb
  }
  vec3 room = colr;
  float bn = sdf(p, uBa, uBb) / uBa.w;                    // normalised distance to the body edge
  if (bn < 2.2 && uOrbOn > 0.5){
    // depth through the object: 0 at the body edge, 1 at the mass edge, 2 at the core edge (or mass centre)
    float D = solveT(p, uBa, uBb, uMa, uMb);
    if (D >= 1.0){
      if (uRoute.w > 0.5 || uSoft.w > 0.5){        // an explicit core, or the hidden leaning shape of the inner colour
        float t2 = solveT(p, uMa, uMb, uCa, uCb); D = 1.0 + t2;
        if (t2 >= 1.0) D = 2.0 + clamp(-sdf(p, uCa, uCb) / uCa.w, 0.0, 1.0);
      } else D = 1.0 + clamp(-sdf(p, uMa, uMb) / uMa.w, 0.0, 1.0);
    }
    // outer -> inner along the route; a wide bridge also reaches into the mass, so the bridge colour gets real territory
    float tr = uSoft.y;
    // the bridge spreads outward into the outer region; the inner colour's own size never depends on bridge width
    float w1 = smoothstep(1.0 - 0.55 * tr - uRoute.z, 1.0 + 0.06 * tr + (uRoute.x > 0.5 ? 0.30 : 0.0), D);
    vec3 c = routeCol(w1);
    if (uRoute.w > 0.5) c = lchMix(c, uCoreC, smoothstep(2.0 - uSoft.z, 2.0 + 0.05 + 0.3 * uSoft.z, D));   // the core's edge softens inward too
    // outer edge: more defined on the side the mass leans toward, more diffuse elsewhere
    vec2 dp = p - uBa.xy; float dl = length(dp);
    float lean = dl > 1e-4 ? clamp(dot(dp / dl, uMisc.yz), 0.0, 1.0) : 0.0;
    float rs = 0.012 + uSoft.x * mix(1.25, 0.22, lean);   // crisp where the mass meets the rim, so dark colours don't turn grey
    float aBody = 1.0 - smoothstep(-rs, rs * 0.35, bn);
    // halo: the object's colour leaking into the room, larger and much softer than the body
    float aHalo = uMisc.x * 0.42 * exp(-max(bn, 0.0) / 0.22);
    vec3 haloC = uBg.x > 0.5 ? vec3(min(uS0.x + 0.03, 0.97), uS0.yz * 0.85) : uS0;
    vec3 obj = mix(haloC, c, aBody);
    float aa = max(aBody, aHalo);
    // on white, fade by mixing; on black, fade like a glow: brightness drops but the colour stays rich instead of going grey
    colr = uBg.x > 0.5 ? mix(room, obj, aa) : vec3(mix(room.x, obj.x, aa), mix(room.yz, obj.yz, sqrt(aa)));
  }
  colr.x += (hash12(frag) - 0.5) * 0.012;
  gl_FragColor = vec4(lab2srgb(colr) + (hash12(frag + 17.0) - 0.5) / 255.0, 1.0);
}`;

function makeRenderer(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uView', 'uBa', 'uBb', 'uMa', 'uMb', 'uCa', 'uCb', 'uS0', 'uS1', 'uS2', 'uS3', 'uCoreC', 'uRoute', 'uSoft', 'uMisc', 'uBg', 'uPools', 'uScreen', 'uOrbOn', 'uPoolFade']
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
  gl.enable(gl.SCISSOR_TEST);
  const shape = (a, b, S) => { gl.uniform4f(U[a], S.cx, S.cy, S.a, S.r); gl.uniform2f(U[b], S.s, S.rot); };
  function size() {
    const RS = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.max(1, Math.round(canvas.clientWidth * RS)), h = Math.max(1, Math.round(canvas.clientHeight * RS));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function draw(P, t, motionOn, x, y, w, h, pools, view, mono, orbOff, poolFade) {
    const G = resolve(P, t, motionOn);
    if (mono) { const g = c => [c[0], 0, -0.004]; G.s0 = g(G.s0); G.s1 = g(G.s1); G.s2 = g(G.s2); G.s3 = g(G.s3); G.core = g(G.core); }   // colour drained, lightness kept
    gl.viewport(x, y, w, h); gl.scissor(x, y, w, h);
    gl.uniform3f(U.uView, view ? view[0] : x + w / 2, view ? view[1] : y + h / 2, view ? view[2] : Math.min(w, h) * 0.40);
    gl.uniform3f(U.uScreen, w, h, view ? 1 : 0);
    shape('uBa', 'uBb', G.B); shape('uMa', 'uMb', G.M);
    shape('uCa', 'uCb', G.C || G.K || G.M);
    gl.uniform3fv(U.uS0, G.s0); gl.uniform3fv(U.uS1, G.s1); gl.uniform3fv(U.uS2, G.s2); gl.uniform3fv(U.uS3, G.s3);
    gl.uniform3fv(U.uCoreC, G.core);
    gl.uniform4f(U.uRoute, G.bf.length, 0.15 + 0.7 * P.bw, 0.6 * P.bw * (G.bf.length ? 1 : 0), G.C ? 1 : 0);
    gl.uniform1f(U.uPools, pools || 0); gl.uniform1f(U.uOrbOn, orbOff ? 0 : 1); gl.uniform1f(U.uPoolFade, poolFade == null ? 1 : poolFade);
    gl.uniform4f(U.uSoft, P.soft.rim, P.soft.trans, P.soft.core, G.K ? 1 : 0);
    const ml = Math.hypot(G.M.cx, G.M.cy);
    gl.uniform4f(U.uMisc, P.soft.halo, ml > 1e-3 ? G.M.cx / ml * Math.min(1, ml * 2.2) : 0, ml > 1e-3 ? G.M.cy / ml * Math.min(1, ml * 2.2) : 0, 0);
    gl.uniform3f(U.uBg, BG[0], BG[1], BG[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { gl, canvas, size, draw };
}

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const META = ['id', 'parent', 'seed', 'variant', 'varSalt', 'vlabel'];
const clone = o => JSON.parse(JSON.stringify(o));
function canon(o) {
  const walk = v => Array.isArray(v) ? v.map(walk) : (v && typeof v === 'object') ? Object.keys(v).sort().filter(k => !META.includes(k)).reduce((a, k) => (a[k] = walk(v[k]), a), {})
    : typeof v === 'number' ? Math.round(v * 1000) / 1000 : v;
  return JSON.stringify(walk(o));
}
function idOf(o) {
  const str = canon(o); let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 2246822519) >>> 0; h2 = (h2 << 13 | h2 >>> 19) >>> 0; }
  let n = BigInt(h1) << 32n | BigInt(h2), out = '';
  for (let i = 0; i < 7; i++) { out = B32[Number(n & 31n)] + out; n >>= 5n; }
  return out;
}
const encode = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const decode = s => JSON.parse(decodeURIComponent(escape(atob(s.trim()))));
const codeOf = o => { const c = clone(o); delete c.varSalt; return encode(c); };

function flipColours(Q) {
  const o = Q.col.outer.f, i = Q.col.inner.f;
  Q.col.outer = { f: i, t: 1 };
  Q.col.inner = { f: o, t: DARKISH.includes(o) ? 2 : 1 };
  Q.col.core = { f: o, t: 2 };
  Q.col.bridge = { auto: true, f: [null, null] };
  return Q;
}
function makePill(Q, end, rr) {
  Q.body.pill = true; Q.body.aspect = rr(0.5, 0.58); Q.body.rot = rr(-0.12, 0.12);
  Q.mass.ang = end + rr(-0.22, 0.22); Q.mass.off = rr(0.8, 1); Q.mass.size = clamp(Q.mass.size, 0.42, 0.6); Q.mass.stretch = rr(0.62, 0.74);
  Q.core.ang = Q.mass.ang + rr(-0.3, 0.3);
  return Q;
}
function unPill(Q) {
  Q.body.pill = false; Q.body.aspect = 1; Q.body.rot = 0; Q.mass.stretch = 1; Q.mass.size = clamp(Q.mass.size, 0.3, 0.64);
  return Q;
}
function variationsOf(base, salt) {
  const R = rng((parseInt(idOf(base), 36) + salt * 7919) >>> 0), rr = (a, b) => a + (b - a) * R();
  const mk = (label, src, fn) => { const Q = fn(clone(src)); Q.vlabel = label; delete Q.id; delete Q.parent; return relate(Q); };
  const isPill = !!base.body.pill;
  const round = isPill ? unPill(clone(base)) : base;          // a pill's variations are built from its round version
  const bigger = round.mass.size < 0.48;
  const size = mk(bigger ? 'Bigger inner' : 'Smaller inner', round, Q => { Q.mass.size = bigger ? Math.min(0.64, Q.mass.size * rr(1.3, 1.5)) : Math.max(0.28, Q.mass.size * rr(0.6, 0.72)); if (Q.core.on) Q.core.size = clamp(Q.core.size * rr(0.9, 1.15), 0.3, 0.7); return Q; });
  const move = mk('New position', round, Q => { Q.mass.ang += (R() < 0.5 ? -1 : 1) * rr(1.6, 2.8); Q.core.ang = Q.mass.ang + rr(-0.6, 0.6); Q.mass.off = clamp(Q.mass.off + rr(-0.2, 0.2), 0, 1); return Q; });
  if (isPill) return [
    mk('Original', base, Q => Q),
    mk('Round', round, Q => Q),
    mk('Colour flip', round, Q => flipColours(Q)),
    mk('Flipped pill', base, Q => { flipColours(Q); Q.mass.ang += Math.PI; Q.core.ang = Q.mass.ang; return Q; }),
    size, move,
  ];
  return [
    mk('Original', base, Q => Q),
    mk('Colour flip', base, Q => flipColours(Q)),
    mk('Pill', base, Q => makePill(Q, 0, rr)),
    mk('Flipped pill', base, Q => makePill(flipColours(Q), Math.PI, rr)),
    size, move,
  ];
}


/* the original home orb: yellow outer, routed through coral and magenta into a deep navy inner, leaning lower right */
const ORIGINAL = { seed: 0, fam: 'small', motion: 1, body: { aspect: 1, len: 0, rot: 0 },
  mass: { ang: -0.62, off: 0.62, size: 0.58, stretch: 1, tilt: 0 }, core: { on: false, size: 0.5, ang: 0, off: 0.3 },
  soft: { rim: 0.42, halo: 0.45, trans: 0.62, core: 0.5 }, dist: 0.5, bw: 0.42,
  col: { outer: { f: 'yellow', t: 1 }, inner: { f: 'navy', t: 2 }, core: { f: 'navy', t: 2 }, bridge: { auto: true, f: [null, null] } } };
let appOn = false, page = 'home', l3 = false, renderer = null, orbR = null;
/* ---- the home orb: the orb lab's two-circle shader and its Reference preset ---- */
// orb lab Reference colours and blend; size, core and softness matched to the main homepage reference (measured)
const ORBLAB = { cols: ['#FFE62E', '#0034A7'], core: 0.38, off: 1.2, blend: 0.42, bridge: 1, soft: 0.64, grain: 0.1, blur: 1, motion: 1 };
const ORBLAB_FRAG = `
precision highp float;
uniform vec3 uOrb;      // centre (buffer px, y up) and radius
uniform vec3 uCore;     // core circle: x, y, r in orb units
uniform vec3 uCol[2];   // outer, core colours in OKLab
uniform vec2 uPres;     // how present each region is, 0..1 (removed -> present)
uniform vec4 uP;        // blend width, pink bridge, rim softness, grain
uniform float uBlur;    // 1 = the soft default, 0 = sharp (orb 3): crisp edges, transition inside the core, glow outside the rim

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// Blend two colours around the colour wheel (OKLCH), so the colours stay vivid all the way across instead
// of dipping through grey or olive. 'bridge' picks the route: 0 = the short way round the wheel,
// 1 = for far-apart pairs, the way that passes through pink (yellow -> orange -> pink -> purple -> blue).
const float PI = 3.14159265;
float wrapA(float a){ return a - 2.0 * PI * floor((a + PI) / (2.0 * PI)); }
vec3 mixLab(vec3 c1, vec3 c2, float t, float bridge){
  float C1 = length(c1.yz), C2 = length(c2.yz);
  float h1 = atan(c1.z, c1.y), h2 = atan(c2.z, c2.y);
  if (C1 < 0.02) h1 = h2;                       // a grey end borrows the other end's hue
  if (C2 < 0.02) h2 = h1;
  float dShort = wrapA(h2 - h1);
  float dLong  = dShort - sign(dShort) * 2.0 * PI;
  // does the long route pass through pink (hue about -0.25 rad) while the short one does not?
  float toPink = wrapA(-0.25 - h1);
  bool shortHits = dShort >= 0.0 ? (toPink >= 0.0 && toPink <= dShort) : (toPink <= 0.0 && toPink >= dShort);
  float dPink = shortHits ? dShort : dLong;
  // only far-apart pairs (which would otherwise go muddy) take the pink route; near pairs blend directly
  float d = (bridge > 0.5 && abs(dShort) > 2.6) ? dPink : dShort;
  float h = h1 + d * t;
  float bump = 4.0 * t * (1.0 - t);
  float C = mix(C1, C2, t) * (1.0 + 0.12 * bump);                   // the middle of the blend stays at least as vivid as the ends
  float L = mix(c1.x, c2.x, t);
  vec3 wheel = vec3(L, C * cos(h), C * sin(h));
  return wheel;
}
vec3 lab2srgb(vec3 c){
  float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z;
  float m = c.x - 0.1055613458*c.y - 0.0638541728*c.z;
  float s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  vec3 rgb = clamp(vec3( 4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
                        -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
                        -0.0041960863*l - 0.7034186147*m + 1.7076147010*s), 0.0, 1.0);
  return mix(12.92*rgb, 1.055*pow(rgb, vec3(1.0/2.4)) - 0.055, step(0.0031308, rgb));
}
// Which in-between circle (outer rim -> core) passes through p. Where the two circles nearly touch this
// changes quickly (a crisp edge); where they are far apart it changes slowly (a long soft blend).
float evalF(vec2 p, vec3 A, vec3 B, float t){ vec3 S = mix(A, B, t); return length(p - S.xy) - S.z; }
float solveT(vec2 p, vec3 A, vec3 B){
  float flo = evalF(p, A, B, 0.0), fhi = evalF(p, A, B, 1.0);
  if (fhi <= 0.0) return 1.0;
  if (flo >= 0.0) return 0.0;
  float lo = 0.0, hi = 1.0;
  for (int i = 0; i < 12; i++){ float m = 0.5*(lo + hi), fm = evalF(p, A, B, m); if (fm < 0.0){ lo = m; flo = fm; } else { hi = m; fhi = fm; } }
  return lo + (hi - lo) * (flo / (flo - fhi));
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec3 col = vec3(0.994, 0.0, 0.002);
  float aOut = 0.0;                                   // drawn over the room, so it outputs coverage instead of a background
  vec2 q = (frag - uOrb.xy) / uOrb.z;
  float grainAmt = 0.004;
  float d0 = length(q);
  if (d0 < 1.6){
    float tau = solveT(q, vec3(0.0, 0.0, 1.0), uCore);
    float inner = tau >= 1.0 ? clamp(-(length(q - uCore.xy) - uCore.z) / uCore.z, 0.0, 1.0) : 0.0;
    float bw = uP.x;
    // one edge that narrows as Blur goes down: soft = a long ramp that finishes at the core's edge,
    // sharp = a clean line at the core's edge
    float ramp = 0.90 * bw * uBlur, eAA = 0.006 / max(uCore.z, 0.05);
    float wEdge = smoothstep(1.0 - ramp - eAA, 1.0 + 0.06 * bw * uBlur + eAA, tau + inner);
    // sharp: inside the core, a narrow band of the in-between colour on the side facing the orb's centre,
    // the rest the full core colour (orb 3's purple band inside the dark plum)
    vec2 cd = length(uCore.xy) > 1e-3 ? normalize(uCore.xy) : vec2(0.0);
    vec2 vc = (q - uCore.xy) / max(uCore.z, 1e-3);
    float dcs = length(vc);
    float facing = length(cd) > 0.0 ? clamp(0.5 - 0.5 * dot(vc / max(dcs, 1e-3), cd), 0.0, 1.0) : 0.55;
    float band = pow(facing, 1.4) * (1.0 - smoothstep(0.0, 0.42, 1.0 - dcs));
    float w = wEdge;

    // a removed region is taken over by the other one
    vec3 outerC = mix(uCol[1], uCol[0], uPres.x);     // outer removed -> it wears the core colour
    vec3 coreC  = mix(uCol[0], uCol[1], uPres.y);     // core removed  -> it wears the outer colour
    vec3 oc = mixLab(outerC, coreC, w, uP.y * uPres.x * uPres.y);
    // sharp: that inner band is a brighter, more vivid version of the core's own colour (orb 3's purple in the plum)
    vec3 lifted = vec3(min(coreC.x + 0.15, 0.92), coreC.yz * 1.55);
    oc = mix(oc, lifted, (1.0 - uBlur) * 0.85 * band * wEdge * uPres.y);

    float sw = 0.0035 + (0.0165 + 0.40 * uP.z) * uBlur;     // rim blur shrinks toward a clean edge as Blur goes down
    float rim = 1.0 - smoothstep(1.0 - sw, 1.0 + sw * 0.35, d0);
    // with the outer removed only the core circle is drawn; with both removed nothing is
    float dc = length(q - uCore.xy) / max(uCore.z, 1e-3);
    float coreMask = 1.0 - smoothstep(1.0 - sw * 0.8, 1.0 + sw * 0.3, dc);
    // sharp: a soft halo spills outward past the crisp rim, strongest on the side the core leans toward
    float outside = max(d0 - 1.0, 0.0);
    float lean = clamp(1.0 + 0.9 * dot(q / max(d0, 1e-3), cd), 0.15, 1.9);
    float glow = (1.0 - uBlur) * 0.50 * exp(-outside / 0.14) * lean;
    float a = mix(coreMask * uPres.y, max(rim, glow), uPres.x);
    oc = mix(uCol[1], oc, uPres.x);                   // alone, the core is simply its own colour
    col = oc; aOut = a;
    grainAmt = mix(grainAmt, 0.004 + 0.040 * uP.w * (0.15 + 0.85 * uBlur), a);   // sharp is clean, almost no grain
  }
  col.x += (hash12(frag) - 0.5) * grainAmt * 2.0;
  vec3 rgbo = clamp(lab2srgb(col) + (hash12(frag + 17.0) - 0.5) / 255.0, 0.0, 1.0);
  gl_FragColor = vec4(rgbo * aOut, aOut);
}`;
function orbLabCore(t) {                       // the orb lab's core placement: off-centre to the lower right, breathing slightly
  const off = ORBLAB.off, mo = ORBLAB.motion;
  const S = { x: off * 0.34 + mo * 0.022 * Math.sin(t * 0.25 + 0.4), y: off * -0.26 + mo * 0.020 * Math.sin(t * 0.19 + 2.0), r: ORBLAB.core * (1 + mo * 0.02 * Math.sin(t * 0.43 + 2.2)) };
  const lim = 0.97, d = Math.hypot(S.x, S.y);
  if (S.r > lim) S.r = lim;
  if (d + S.r > lim) { const k = (lim - S.r) / Math.max(d, 1e-6); S.x *= k; S.y *= k; }
  return S;
}
function makeOrbLab(canvas) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, ORBLAB_FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uOrb', 'uCore', 'uCol', 'uPres', 'uP', 'uBlur'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
  const labOf = h => hex2lab(h), grey = c => [c[0], 0, -0.004];
  return {
    canvas,
    size() { const RS = Math.min(2, Math.max(1, window.devicePixelRatio || 1)); const w = Math.round(canvas.clientWidth * RS), h = Math.round(canvas.clientHeight * RS); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } },
    draw(t, cxPx, cyPx, rPx, mono) {
      gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const S = orbLabCore(t);
      // mono runs 0 (full colour) to 1 (grey of the same lightness), so the colour can drain smoothly
      const m = +mono || 0, drain = c => [c[0], c[1] * (1 - m), c[2] * (1 - m) - 0.004 * m];
      let c0 = drain(labOf(ORBLAB.cols[0])), c1 = drain(labOf(ORBLAB.cols[1]));
      gl.uniform3f(U.uOrb, cxPx, cyPx, rPx); gl.uniform3f(U.uCore, S.x, S.y, S.r);
      gl.uniform3fv(U.uCol, new Float32Array(c0.concat(c1))); gl.uniform2f(U.uPres, 1, 1);
      gl.uniform4f(U.uP, ORBLAB.blend, ORBLAB.bridge, ORBLAB.soft, ORBLAB.grain); gl.uniform1f(U.uBlur, ORBLAB.blur);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } };
}
const glc = document.getElementById('gl'), appEl = document.getElementById('app');
function ensureRenderer() {
  if (!renderer && glc) { try { renderer = makeRenderer(glc); } catch (e) { console.error(e); renderer = null; } }
  if (!orbR) { try { orbR = makeOrbLab(document.getElementById('glOrb')); } catch (e) { console.error(e); orbR = null; } }
}

/* the 11 dimensions (placeholder poles where vocabulary isn't locked; placeholder colours until the spectrum work is unblocked) */
let L3_Y = 152, L3_R = 50;                   // layer 3: orb centre and radius (the paged variant sets its own)
const DIMS = [
  ['A', 'Circadian profile', 'Early bird', 'Night owl', 0.82, '#3B4BC8', 'Your body clock runs about 90 minutes later than most people’s.'],
  ['B', 'Sleep architecture', 'Deep', 'Fractured', 0.74, '#7B4FC8', 'Your nights tend to break into shorter stretches, with a few brief wake-ups.'],
  ['C', 'Arousal vulnerability', 'Resilient', 'Reactive', 0.70, '#E35A9F', 'Noise, light and late thoughts reach you more easily than most.'],
  ['D', 'Sleep drive', 'Quick to wake', 'Slow to wake', 0.55, '#18B39B', 'You take a little while to feel fully awake once you’re up.'],
  ['E', 'Recovery efficiency', 'Slow recovery', 'Quick recovery', 0.45, '#12B5E6', 'After a short night you bounce back at about an average pace.'],
  ['F', 'Sleep regularity', 'Drifting', 'Anchored', 0.32, '#2F5DDB', 'Your timing shifts by over an hour between weekdays and weekends.'],
  ['G', 'Stress-sleep coupling', 'Buffered', 'Coupled', 0.66, '#FF7A6B', 'On stressful days, it tends to take you longer to fall asleep.'],
  ['H', 'Daytime functioning', 'Steady', 'Affected', 0.40, '#E0A21A', 'Rough nights show up in your afternoons more than your mornings.'],
  ['I', 'Sleep beliefs', 'Relaxed', 'Concerned', 0.38, '#8E2FB0', 'You notice your sleep, without it weighing on you much.'],
  ['J', 'Behavioural load', 'Light', 'Heavy', 0.52, '#F59E2B', 'Late caffeine is the habit that shows up most in your nights.'],
  ['K', 'Sleep need vs supply', 'Running short', 'Well matched', 0.35, '#34C46A', 'You’re getting a little less sleep than your body seems to want.'],
];
(function buildDims() {
  const box = document.getElementById('dims');
  DIMS.forEach(([L, name, lo, hi, v, c, line]) => {
    const d = el('article', 'dim'); d.style.setProperty('--dc', c);
    const top = el('div', 'top'); top.append(el('span', 'let', L), el('h3', null, name));
    const sp = el('div', 'spec'); const mk = el('i', 'mk'); mk.style.left = (v * 100) + '%'; sp.appendChild(mk);
    sp.setAttribute('role', 'img'); sp.setAttribute('aria-label', name + ': closer to ' + (v < 0.5 ? lo : hi));
    const po = el('div', 'poles'); po.append(el('span', null, lo), el('span', null, hi));
    d.style.setProperty('--i', Math.min(box.children.length, 5)); d.append(top, sp, po, el('p', null, line)); box.appendChild(d);
  });
})();

const TABS = [
  ['analysis', 'Analysis', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="4" height="11" rx="1.2"/><rect x="10" y="4" width="4" height="16" rx="1.2"/><rect x="16" y="12" width="4" height="8" rx="1.2"/></svg>'],
  ['home', 'Home', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 9.5V19a1 1 0 0 0 1 1h3.5v-5.5h3V20H17a1 1 0 0 0 1-1V9.5"/></svg>'],
  ['experiments', 'Experiments', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3.5h5M10.5 3.5v5.2L5.6 17.4A2 2 0 0 0 7.3 20.5h9.4a2 2 0 0 0 1.7-3.1l-4.9-8.7V3.5"/><path d="M7.6 14.5h8.8"/></svg>'],
  ['profile', 'Profile', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="10" r="3"/><path d="M6.6 18c1.2-2.2 3.1-3.3 5.4-3.3s4.2 1.1 5.4 3.3"/></svg>'],
];
(function buildTabs() {
  const nav = document.getElementById('tabs');
  TABS.forEach(([k, n, svg]) => { const b = el('button'); b.type = 'button'; b.dataset.page = k; b.setAttribute('aria-label', n); b.innerHTML = svg; b.addEventListener('click', () => setPage(k)); nav.appendChild(b); });
  ['analysis', 'experiments', 'profile'].forEach(k => { const t = TABS.find(x => x[0] === k); document.querySelector('#pg-' + k + ' .sym').innerHTML = t[2]; });
})();
function setPage(k) {
  page = k; if (k !== 'home') setL3(false);
  ['home', 'analysis', 'experiments', 'profile'].forEach(p => { document.getElementById('pg-' + p).hidden = p !== k; });
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.page === k ? 'page' : 'false'));
  document.getElementById('tabs').style.setProperty('--ti', TABS.findIndex(t => t[0] === k));   // where the capsule behind the current tab sits
  glc.hidden = k !== 'home'; document.getElementById('glOrb').hidden = k !== 'home';
}
/* ---------- alternative: layer 3 dimensions two at a time (A+B, then B+C, ...); a scroll or swipe moves one card ---------- */
let dimPage = 0;
const DIM_PAGES = DIMS.length - 1;                      // pairs: 0 = A+B ... 9 = J+K
function paintDims() {
  const paged = appEl.classList.contains('v-paged'), cards = [...document.getElementById('dims').children];
  cards.forEach((d, i) => {
    const slot = i - dimPage;                          // 0 = top, 1 = bottom, others just off either edge
    d.style.top = paged ? (slot * 170) + 'px' : '';
    d.classList.toggle('off', paged && (slot < 0 || slot > 1));
    d.inert = paged && (slot < 0 || slot > 1);
  });
  document.querySelector('#l3head .n').textContent = paged ? (DIMS[dimPage][0] + '–' + DIMS[dimPage + 1][0] + ' · ' + (dimPage + 1) + ' of ' + DIM_PAGES) : String(DIMS.length);
}
function stepDims(d) { const n = Math.max(0, Math.min(DIM_PAGES - 1, dimPage + d)); if (n !== dimPage) { dimPage = n; paintDims(); } }
(function pagedInput() {
  const box = document.getElementById('dims'); let acc = 0, cool = 0, y0 = null;
  box.addEventListener('wheel', e => { if (!appEl.classList.contains('v-paged')) return; e.preventDefault();
    const now = performance.now(); acc += e.deltaY; if (now < cool || Math.abs(acc) < 40) return; stepDims(Math.sign(acc)); acc = 0; cool = now + 380; }, { passive: false });
  box.addEventListener('pointerdown', e => { if (appEl.classList.contains('v-paged')) y0 = e.clientY; });
  box.addEventListener('pointerup', e => { if (y0 === null) return; const dy = e.clientY - y0; y0 = null; if (Math.abs(dy) > 30) stepDims(dy < 0 ? 1 : -1); });
  box.addEventListener('keydown', e => { if (!appEl.classList.contains('v-paged')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); stepDims(1); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); stepDims(-1); } });
  box.tabIndex = 0;
})();

/* ---------- design alternatives: every suggested alternate version gets a switch beside the phone ---------- */
const ALTS = [
  { id: 'ctaPos', name: 'Continue button position', note: 'Same spot: the main button sits where it is on the question cards on every card, with Skip or Not now just under it. Per card: as before, each card type put it at its own height.',
    options: [['same', 'Same spot'], ['card', 'Per card']],
    apply: () => { if (typeof alignCta === 'function') alignCta(); } },
  { id: 'chronoCol', name: 'Chronotype card colours', note: 'Brand: this card alone uses the company’s orange and purple in the background, blurred a little more, with an outline in the spectrum’s colours. Chapter colour: the usual teal.',
    options: [['brand', 'Brand'], ['chapter', 'Chapter colour']],
    apply: () => { if (typeof Q !== 'undefined' && Q[idx] && Q[idx].id === 'chrono') build(); } },
  { id: 'intentReply', name: 'Reply to “Why are you here?”', note: 'Suggestion: a card straight after the first question that answers their reason, ties it to what Pheno is about, and says what comes next.',
    options: [['off', 'Off'], ['on', 'Reply card']],
    apply: () => { if (typeof renderJumps === 'function' && typeof Q !== 'undefined') renderJumps(); } },
  { id: 'infocard', name: 'Cards without a question', note: 'Fact, chapter and closing cards: the same size as the questions, as big as the permission cards, a little smaller, or no card at all (full screen).',
    options: [['same', 'Same size'], ['big', 'Bigger'], ['small', 'Smaller'], ['none', 'No card']],
    apply: v => { ['big', 'small', 'none'].forEach(k => screen.classList.toggle('ic-' + k, v === k)); if (typeof fitZone === 'function') requestAnimationFrame(fitZone); } },
  { id: 'polish', name: 'Motion and polish', note: 'Refined: cards push sideways like iOS, content arrives in order, buttons give when pressed, glass card, Dynamic Island, sliding tab capsule. Original: as it was before 17.11.26.',
    options: [['on', 'Refined'], ['off', 'Original']],
    apply: v => { screen.classList.toggle('polish', v === 'on'); } },
  { id: 'closingCol', name: 'Closing cards colour', note: 'Brand: the closing cards use the home screen’s amber, purple and blue, like the journey card. Grey: as before.',
    options: [['brand', 'Brand colours'], ['grey', 'Grey']],
    apply: () => { if (typeof Q !== 'undefined' && !appOn && (idx >= Q.length || !CH[Q[idx].ch])) build(); } },
  { id: 'l3dims', name: 'Layer 3 dimensions', note: 'Two at a time: a fixed pair of cards under a slightly smaller orb; each scroll or swipe moves one card (A+B, then B+C…).',
    options: [['scroll', 'Scrolling list'], ['paged', 'Two at a time']],
    apply: v => { appEl.classList.toggle('v-paged', v === 'paged'); [L3_Y, L3_R] = v === 'paged' ? [258, 78] : [152, 50]; dimPage = 0; paintDims(); } },
  { id: 'navtrack', name: 'Question track', note: 'Edit answers only: the track under the card appears after Edit answers. Always: it shows all through the onboarding, so people can slide back to any question they’ve answered (questions ahead stay faded and locked).',
    options: [['edit', 'Edit answers only'], ['always', 'Always']],
    apply: () => { if (typeof paintEdit === 'function') { navPos = -1; paintEdit(); } } },
  { id: 'journey', name: 'Journey timeline', note: 'Scrolls by itself: the ruler rolls up slowly and each milestone pops in; a touch stops it. Draws in: the ruler builds from day 7 upwards. Static: no motion.',
    options: [['auto', 'Scrolls by itself'], ['draw', 'Draws in'], ['static', 'Static']],
    apply: () => { if (typeof Q !== 'undefined' && Q[idx] && Q[idx].id === 'timeline') build(); } },
];
// where each alternative first shows up: a card id, or a function giving one ('app:l3' opens layer 3)
const firstWhere = test => { const i = Q.findIndex((q, k) => test(q) && visible(k)); return i < 0 ? null : Q[i].id; };
const ALT_GO = {
  ctaPos: () => Q[0].id,                                                          // every card: from the first
  chronoCol: 'chrono',
  intentReply: () => ALT.intentReply === 'on' ? 'intentReply' : 'intent',          // off: the question it would follow
  infocard: () => firstWhere(q => q.type === 'beat' || q.type === 'chapter'),
  polish: () => Q[0].id,                                                          // everywhere: from the very first card
  closingCol: () => firstWhere(q => q.ch === 7),
  l3dims: 'app:l3',
  navtrack: () => ALT.navtrack === 'always' ? 'intent' : (Q.find(q => q.end) || {}).id,   // Edit answers starts from the closing card
  journey: 'timeline',
};
function goToAlt(id) {
  let to = ALT_GO[id]; if (typeof to === 'function') to = to(); if (!to) return;
  if (to === 'app:l3') { if (!appOn) enterApp(true); else setL3(true); return; }
  if (appOn) leaveApp();
  const qi = Q.findIndex(q => q.id === to); if (qi < 0) return;
  if (qi !== idx) { hist.push(idx); idx = qi; show(); } else build();
}
const ALT = {};
(function buildAlts() {
  const host = document.getElementById('alts');
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('pheno-alts') || '{}'); } catch (e) {}
  ALTS.forEach(a => {
    ALT[a.id] = a.options.some(([v]) => v === saved[a.id]) ? saved[a.id] : a.options[0][0];
    const row = el('div', 'altrow'), g = el('div', 'jumps');
    const nameRow = el('div', 'altname'); nameRow.appendChild(el('span', null, a.name));
    if (ALT_GO[a.id]) { const go = el('button', 'altgo', 'Go to ↗'); go.type = 'button'; go.title = 'Show the first place this is used'; go.addEventListener('click', () => goToAlt(a.id)); nameRow.appendChild(go); }
    row.append(nameRow, g, el('p', 'legend', a.note));
    a.options.forEach(([v, label]) => { const b = el('button', 'jump', label); b.type = 'button'; b.dataset.v = v;
      b.addEventListener('click', () => { ALT[a.id] = v; a.apply(v); paint(); try { localStorage.setItem('pheno-alts', JSON.stringify(ALT)); } catch (e) {} }); g.appendChild(b); });
    const paint = () => g.querySelectorAll('.jump').forEach(b => b.classList.toggle('here', b.dataset.v === ALT[a.id]));
    paint(); a.apply(ALT[a.id]); host.appendChild(row);
  });
})();

function setL3(on) {
  if (on !== l3) drainAnim = { from: drain, to: on ? 1 : 0, start: performance.now() + (on ? 0 : 260), dur: REDUCED ? 250 : 550 };   // back out: the cards blur away before the colour returns
  l3 = on; appEl.classList.toggle('l3', on);
  document.getElementById('hometext').inert = on;
  ['l3head', 'dims', 'l3back'].forEach(id => { document.getElementById(id).inert = !on; });
  document.getElementById('orbhit').setAttribute('aria-label', on ? 'Back to home' : 'Open your dimensions');
  if (on) { document.getElementById('dims').scrollTop = 0; dimPage = 0; paintDims(); }
}
function enterApp(openL3) {
  appOn = true; screen.classList.add('inapp'); appEl.hidden = false; ensureRenderer();
  setPage('home'); setL3(!!openL3);
}
function leaveApp() { appOn = false; screen.classList.remove('inapp'); appEl.hidden = true; glc.hidden = true; document.getElementById('glOrb').hidden = true; }
document.getElementById('orbhit').addEventListener('click', () => setL3(!l3));
document.getElementById('l3back').addEventListener('click', () => setL3(false));
document.getElementById('toApp').addEventListener('click', () => enterApp(false));
document.getElementById('toL3').addEventListener('click', () => enterApp(true));
document.getElementById('toOnb').addEventListener('click', () => { leaveApp(); build(); });

// draw: the orb in the original spot and size; grey in layer 3; pools behind it on home only
let t0 = performance.now(), holdT = null, drain = 0, drainAnim = null;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let ORB_Y = 292, ORB_R = 88;
function frame(now) {
  // the colour drain runs on clock time (about half a second), so it finishes on time whatever the frame rate;
  // on the way back it starts only once the cards have blurred away
  if (drainAnim) { const k = Math.min(1, Math.max(0, (now - drainAnim.start) / drainAnim.dur)); drain = drainAnim.from + (drainAnim.to - drainAnim.from) * k; if (k >= 1) drainAnim = null; }
  if (appOn && renderer && page === 'home') {
    renderer.size(); const c = renderer.canvas, RS = c.width / 390;
    const t = holdT !== null ? holdT : (now - t0) / 1000;
    const lift = Math.sin(t * TAU / 9);
    const e = drain * drain * (3 - 2 * drain);
    // layer 3: the orb shrinks and rises with the colour drain, so the dimensions get the space below it
    const rad = ORB_R + (L3_R - ORB_R) * e;
    const cx = 195, cy = ORB_Y + (L3_Y - ORB_Y) * e - 2.5 * lift * (1 - 0.6 * e), r = 92 * rad / ORB_R;
    const scale = r / 0.94 * 1.2 * RS;
    // the room (pools + floor shadow) from the engine; the orb itself from the orb lab layer. Layer 3: grey, smaller, higher, no pools
    BG = isDark() ? BG_DARK : BG_LIGHT;
    renderer.draw(ORIGINAL, t, true, 0, 0, c.width, c.height, 2, [cx * RS, c.height - cy * RS, scale], false, true, 1 - e);
    if (orbR) { orbR.size(); const o = orbR.canvas, RO = o.width / 390; orbR.draw(t, cx * RO, o.height - cy * RO, rad * RO, e); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

