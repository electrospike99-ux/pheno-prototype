'use strict';
/* draft cards: rough visuals for the fact cards, privacy, toggle placeholder, reveal variants and timeline.
   Copy lives in content.js (COPY, LEAN). Everything here is flagged for review. */
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (t, at, txt) => { const e = document.createElementNS(SVGNS, t); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; return e; };

/* ---------- your age: "So you're / 22 / years old.", on its own for about two seconds ---------- */
function renderAgeSay(w) {
  const d = A.dob || { d: 15, m: 5, y: 1995 }, n = new Date();
  let a = n.getFullYear() - d.y; if (n.getMonth() < d.m || (n.getMonth() === d.m && n.getDate() < d.d)) a--;
  w.classList.add('agecard'); w.setAttribute('aria-live', 'polite');
  w.append(el('p', 'ag-l', COPY.ageSay[0]), el('p', 'ag-n', String(a)), el('p', 'ag-l', COPY.ageSay[1]));
}

/* ---------- age fact: the average drifting earlier with age; schematic, no numbers on the axes ---------- */
function renderAgeFact(w) {
  w.classList.add('fact');
  const svg = svgEl('svg', { viewBox: '0 0 280 168', class: 'agegraph', role: 'img', 'aria-label': 'Schematic: the average body clock gets later through the teens, is latest around the early twenties, then drifts earlier with age' });
  svg.append(
    svgEl('line', { x1: 30, y1: 14, x2: 30, y2: 140, class: 'ag-axis' }), svgEl('line', { x1: 30, y1: 140, x2: 270, y2: 140, class: 'ag-axis' }),
    svgEl('text', { x: 24, y: 22, 'text-anchor': 'end', class: 'ag-lab' }, 'Later'), svgEl('text', { x: 24, y: 138, 'text-anchor': 'end', class: 'ag-lab' }, 'Earlier'),
    svgEl('text', { x: 270, y: 158, 'text-anchor': 'end', class: 'ag-lab' }, 'Age →'),
    svgEl('line', { x1: 92, y1: 40, x2: 92, y2: 140, class: 'ag-peak' }),
    svgEl('text', { x: 98, y: 30, class: 'ag-note' }, 'early twenties'));
  const curve = svgEl('path', { d: 'M34 118 C 56 112, 70 44, 92 40 C 120 36, 190 92, 266 124', class: 'ag-curve', pathLength: 1 });
  svg.append(curve, svgEl('circle', { cx: 92, cy: 40, r: 4.5, class: 'ag-dot' }));
  const body = el('p', 'main'); body.innerHTML = rich(COPY.ageFact);
  w.append(el('h3', 'btitle', COPY.ageTitle), svg, body);
}

/* ---------- two sleep windows on one line: used by the jet lag fact and the gap reveal ---------- */
// windows are the dial answers ({bed, dur}); missing ones fall back to a schematic example
function windowsVisual(a, b, labels, example) {
  const box = el('div', 'wins' + (example ? ' example' : ''));
  const H0 = 18, SPAN = 20;                                        // 6 PM to 2 PM the next day
  const at = h => { let x = ((h - H0) % 24 + 24) % 24; return Math.min(100, x / SPAN * 100); };
  [[a, labels[0], 'w1'], [b, labels[1], 'w2']].forEach(([win, label, cls]) => {
    const row = el('div', 'wrow'); row.appendChild(el('span', 'wl', label));
    const lane = el('div', 'wlane'), bar = el('i', 'wbar ' + cls);
    const x0 = at(win.bed), x1 = Math.min(100, x0 + win.dur / SPAN * 100);
    bar.style.left = x0 + '%'; bar.style.width = (x1 - x0) + '%';
    if (!example) bar.title = fmt12(win.bed) + ' – ' + fmt12(win.bed + win.dur);
    lane.appendChild(bar); row.appendChild(lane); box.appendChild(row);
  });
  // the gap between the two bedtimes
  const g = el('i', 'wgap'), ga = at(a.bed), gb = at(b.bed);
  g.style.left = Math.min(ga, gb) + '%'; g.style.width = Math.abs(gb - ga) + '%'; const ov = el('div', 'wov'); ov.appendChild(g); box.appendChild(ov);
  const ax = el('div', 'wax'); ['6 PM', '12 AM', '6 AM', '12 PM'].forEach(t => ax.appendChild(el('span', null, t))); box.appendChild(ax);
  if (example) box.appendChild(el('em', 'wex', '[example]'));
  return box;
}
const savedWin = v => v && typeof v === 'object' && v.abs ? v : null;
function myWindows() {
  const s = savedWin(A.sched), i = savedWin(A.ideal);
  return s && i ? { s, i, example: false } : { s: { bed: 23, dur: 7.5 }, i: { bed: 0.75, dur: 8.5 }, example: true };
}

/* ---------- jet lag fact: the two windows as arcs on one half clock, and how far apart they sit ---------- */
function renderJetlagFact(w) {
  w.classList.add('fact', 'jetlag');
  const m = myWindows(), mid = x => x.bed + x.dur / 2;
  const gap = Math.abs(((mid(m.i) - mid(m.s)) % 24 + 36) % 24 - 12), [hh, mm] = hm(Math.round(gap * 4) / 4);
  const num = (hh ? hh + ' hr' : '') + (mm ? (hh ? ' ' : '') + mm + ' min' : '') || '0 min';
  const legend = el('div', 'jl-key'); legend.append(el('i', 'k1'), 'Work days', el('i', 'k2'), 'Your body');
  const big = el('p', 'jl-n'); big.append(m.example ? '[' + num + ']' : num, el('span', null, ' apart'));
  w.append(halfClockPair(m.s, m.i), legend, big, el('p', 'main', COPY.jetlagFact));
  if (m.example) w.appendChild(el('em', 'jl-ex', '[example: answer both sleep window questions to see your own]'));
}
function halfClockPair(a, b) {
  const mk = svgEl, W = 260, cx = 130, cy = 120, R1 = 102, R2 = 76, HALF = 6;
  const mid = x => x.bed + x.dur / 2, wr = d => ((d % 24) + 36) % 24 - 12;
  const vm = mid(a) + wr(mid(b) - mid(a)) / 2;                                   // the half clock centres on the middle of both windows
  const pt = (r, rad) => { const t = r / HALF * Math.PI / 2; return [cx + rad * Math.sin(t), cy - rad * Math.cos(t)]; };
  const arc = (r0, r1, rad) => { r0 = Math.max(-HALF, r0); r1 = Math.min(HALF, r1); if (r1 <= r0) return '';
    const [x0, y0] = pt(r0, rad), [x1, y1] = pt(r1, rad); return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + rad + ' ' + rad + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1); };
  const svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + (cy + 8), class: 'jlclock', role: 'img', 'aria-label': 'Your work-day sleep window and the window your body wants, on one clock' });
  [R1, R2].forEach(R => svg.appendChild(mk('path', { d: arc(-HALF, HALF, R), class: 'jl-track' })));
  const ra = wr(a.bed - vm), rb = wr(b.bed - vm);
  svg.appendChild(mk('path', { d: arc(ra, ra + a.dur, R1), class: 'jl-a' }));
  svg.appendChild(mk('path', { d: arc(rb, rb + b.dur, R2), class: 'jl-b' }));
  for (let h = 0; h < 24; h += 3) {                                                   // hour labels inside the inner ring
    const r = wr(h - vm); if (Math.abs(r) > HALF - 0.4) continue;
    const [x, y] = pt(r, R2 - 30), major = h % 6 === 0;
    svg.appendChild(mk('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'jl-h' + (major ? ' major' : '') }, major ? ({ 0: '12AM', 6: '6AM', 12: '12PM', 18: '6PM' })[h] : String(h % 12)));
  }
  return svg;
}
// before (17.11.26): two bars on a 6 PM–2 PM line with the gap hatched
function renderJetlagFactV1(w) {
  w.classList.add('fact');
  const m = myWindows();
  w.append(windowsVisual(m.s, m.i, ['When you go to bed', 'When your body wants to'], m.example), el('p', 'main', COPY.jetlagFact));
}

/* ---------- mild intoxication fact: the original Pheno orb (the home orb's shader), turned fuzzier and grainier, swaying ---------- */
const DRUNK = { blur: 1.35, grain: 0.4 };           // the home orb uses blur 1 and grain 0.1; much past 1.6 the colours break
let drunkGL = null;
function renderIntoxFact(w) {
  if (!drunkGL) { const cv = document.createElement('canvas'); let r = null; try { r = makeOrbLab(cv); } catch (e) { r = null; } drunkGL = r ? { cv, r } : 'none'; }
  if (drunkGL === 'none') { renderIntoxFactV1(w); return; }                      // no WebGL: the soft CSS version
  w.classList.add('fact');
  const wrap = el('div', 'drunkorb'); wrap.setAttribute('aria-hidden', 'true'); wrap.appendChild(drunkGL.cv);
  const p = el('p', 'main'); p.innerHTML = rich(COPY.intoxFact);
  w.append(wrap, p);
  const { cv, r } = drunkGL;
  const loop = now => {
    if (!cv.isConnected) return;
    r.size(); const keep = [ORBLAB.blur, ORBLAB.grain]; ORBLAB.blur = DRUNK.blur; ORBLAB.grain = DRUNK.grain;
    r.draw(now / 1000, cv.width / 2, cv.height / 2, cv.width * 0.33, 0);
    [ORBLAB.blur, ORBLAB.grain] = keep;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
// before (12.11.26): five soft CSS blobs blurred together
function renderIntoxFactV1(w) {
  w.classList.add('fact');
  const orb = el('div', 'fuzzorb'); orb.setAttribute('aria-hidden', 'true');
  ['fp', 'fy', 'fo', 'fm', 'fb'].forEach(c => orb.appendChild(el('i', c)));     // purple body, then yellow, orange, magenta, and the blue core on top
  const p = el('p', 'main'); p.innerHTML = rich(COPY.intoxFact);
  w.append(orb, p);
}

/* ---------- reply to "Why are you here?" (design alternative): their answer, what Pheno does about it, what comes next ---------- */
function renderIntentReply(w) {
  const pick = typeof A.intent === 'string' && INTENT_REPLY[A.intent] ? A.intent : 'I’m just curious about myself';
  const [head, body] = INTENT_REPLY[pick];
  w.classList.add('ireply');
  const echo = el('p', 'ir-echo'); echo.append(el('span', 'k', A.intent === pick ? 'You said' : 'You said [example]'), el('q', null, pick));
  const h = el('h3', 'ir-head'); h.innerHTML = rich(head);
  const p = el('p', 'ir-body'); p.innerHTML = rich(body);
  w.append(echo, h, p, el('p', 'ir-next', INTENT_NEXT));
}

/* ---------- toggle card: placeholder only ---------- */
function renderToggleCard(w) {
  w.classList.add('placeholder');
  w.append(el('p', 'main', '[Toggle card]'), el('p', 'side', 'Placeholder, waiting on Brainstorming and Sleep Science.'));
}

/* ---------- privacy, just before the permissions ---------- */
function renderPrivacy(w) {
  w.classList.add('fact');
  const ico = el('div', 'privico'); ico.setAttribute('aria-hidden', 'true');
  ico.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/><path d="M12 14.4v2.4"/></svg>';
  w.append(ico, el('p', 'main', COPY.privacy));
}

/* ---------- reveal: rough sketch of each variant, with the person's own answer shown again ---------- */
function chronoRecap() {
  const c = typeof A.chrono === 'number' ? A.chrono : null;
  const d = el('div', 'myans');
  d.appendChild(el('span', 'k', c == null ? 'Your answer [example]' : 'Your answer'));
  const bar = el('div', 'mybar'), mk = el('i'); mk.style.left = ((c == null ? 0.5 : c) * 100) + '%'; mk.style.setProperty('--kc', spectrumAt(c == null ? 0.5 : c)); bar.appendChild(mk);
  const an = el('div', 'anchors'); an.append(el('span', null, '“Early bird”'), el('span', null, '“Night owl”'));
  d.append(bar, an); return d;
}
function fallbackRecap() {
  const why = [];
  if (typeof A.chrono !== 'number') why.push('You skipped the spectrum question.');
  if (A.tz === 'Yes') why.push('You changed timezone in the last two weeks.');
  if (A.event === 'Yes') why.push('Something significant happened recently.');
  const d = el('div', 'myans');
  d.appendChild(el('span', 'k', why.length ? 'Your answers' : 'Your answers [example]'));
  (why.length ? why : ['You changed timezone in the last two weeks.']).forEach(t => d.appendChild(el('p', 'why', '[' + t + ']')));
  return d;
}
function renderReveal(w) {
  const k = leanOf(); A.revealCase = k; logAnswers();
  w.classList.add('reveal', 'rv-' + k);
  w.appendChild(el('span', 'rvkind', ({ late: 'Extreme · night owl', early: 'Extreme · early bird', middle: 'Middle', gap: 'Gap', fallback: 'Fallback' })[k]));
  if (k === 'gap') { const m = myWindows(); const d = el('div', 'myans'); d.append(el('span', 'k', 'Your answers'), windowsVisual(m.s, m.i, ['Work sleep window', 'Ideal sleep window'], m.example)); w.appendChild(d); }
  else if (k === 'fallback') w.appendChild(fallbackRecap());
  else w.appendChild(chronoRecap());
  w.appendChild(el('p', 'main', LEAN[k]));
}

/* ---------- timeline: "Your journey" ruler, oldest milestone at the bottom; static, or drawn in from day 7 upwards (design alternative) ---------- */
function renderTimeline(w) {
  w.classList.add('journey');
  // a long ruler (about 34px a day) in its own scroll area, opened at the bottom on day 7; scroll up for what comes later
  const TOP = 38, BOT = 2, H = (TOP - BOT) * 34, yOf = d => (TOP - d) / (TOP - BOT) * H;
  const sc = el('div', 'rscroll'), ruler = el('div', 'ruler'); ruler.style.height = H + 'px'; ruler.setAttribute('role', 'list'); ruler.setAttribute('aria-label', 'Your journey');
  const widths = [24, 40, 24, 64]; let k = 0;                                   // minor ticks between the milestones, short and long in turn
  for (let d = BOT + 0.5; d < TOP; d += 1) {
    if (COPY.timeline.some(([m]) => Math.abs(m - d) < 0.9)) continue;
    const t = el('i', 'tick'); t.style.top = yOf(d) + 'px'; t.style.width = widths[k++ % 4] + 'px'; t.style.setProperty('--d', (TOP - d) / (TOP - BOT)); ruler.appendChild(t);
  }
  COPY.timeline.forEach(([day, label, strong]) => {
    const r = el('div', 'ms' + (strong ? ' strong' : '')); r.setAttribute('role', 'listitem'); r.style.top = yOf(day) + 'px'; r.style.setProperty('--d', (TOP - day) / (TOP - BOT));
    r.append(el('span', 'day', 'Day [' + day + ']'), el('i', 'line'), el('span', 'lab', label)); ruler.appendChild(r);
  });
  sc.appendChild(ruler); w.append(el('p', 'jk', 'Your journey'), sc);
  requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; });
  const mode = typeof ALT === 'object' ? ALT.journey : 'auto';
  if (mode === 'draw') { ruler.classList.add('anim'); requestAnimationFrame(() => requestAnimationFrame(() => ruler.classList.add('go'))); }
  else if (mode !== 'static') autoJourney(sc, ruler);
}
// the ruler scrolls up slowly by itself and each milestone pops in as it comes into view; any touch, wheel or key stops it
function autoJourney(sc, ruler) {
  ruler.classList.add('auto');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: sc, rootMargin: '-8% 0px -14% 0px' });
  ruler.querySelectorAll('.ms').forEach(m => io.observe(m));
  const SPEED = 60;                                                     // px a second: nearly two days a second
  let pos = null, last = 0, raf = 0, stopped = false, t0 = 0;
  const stop = () => { if (stopped) return; stopped = true; cancelAnimationFrame(raf); sc.classList.remove('rolling'); };
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(ev => sc.addEventListener(ev, stop, { passive: true }));
  const step = now => {
    if (stopped || !sc.isConnected) return;
    if (pos == null) { pos = sc.scrollTop; last = now; t0 = now; }
    const ease = Math.min(1, (now - t0) / 800);                        // eases in over the first moment
    pos -= SPEED * ease * (now - last) / 1000; last = now;
    if (pos <= 0) { sc.scrollTop = 0; stop(); return; }
    sc.scrollTop = pos; raf = requestAnimationFrame(step);
  };
  setTimeout(() => { if (!stopped && sc.isConnected) { sc.classList.add('rolling'); raf = requestAnimationFrame(step); } }, 600);
}
