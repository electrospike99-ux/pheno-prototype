'use strict';
/* screens: state, navigation and every card type */
/* ================= state ================= */
let A = {}, idx = 0, hist = [], editMode = false, furthest = 0;   // editMode: came back from the end to change answers; furthest: the furthest card reached
const screen = $('#screen'), card = $('#card'), fade = $('#fade'), zone = $('#zone'), foot = $('#foot');
const visible = i => !Q[i].show || Q[i].show(A);
function nextIndex(from) { for (let i = from + 1; i < Q.length; i++) if (visible(i)) return i; return Q.length; }
// in edit mode only questions count: facts, chapter cards and the closing beats are skipped
const EDITABLE = new Set(['theme', 'single', 'multi', 'scale', 'continuous', 'date', 'wheel', 'dial', 'days', 'text', 'permission']);
const editable = i => EDITABLE.has(Q[i].type) && visible(i);
function nextEditable(from) { for (let i = from + 1; i < Q.length; i++) if (editable(i)) return i; return Q.length; }

function glow() {
  screen.classList.remove('glow'); card.classList.remove('glow'); void card.offsetWidth;
  screen.classList.add('glow'); card.classList.add('glow');
  clearTimeout(glow.t); glow.t = setTimeout(() => screen.classList.remove('glow'), 900);
}
function advance(to) {
  if (editMode && to == null) { const n = nextEditable(idx); if (n >= Q.length) { openOverview(); return; } to = n; }   // the last answer leads back to the overview
  if (!(idx < Q.length && Q[idx].auto)) hist.push(idx);
  idx = to != null ? to : nextIndex(idx);
  show();
}
function answered(val, key) { A[key || Q[idx].id] = val; logAnswers(); }

/* ================= render ================= */
let shownIdx = 0;                                       // the card on screen now, so a move knows whether it goes forwards or back
function show() {
  if (!screen.classList.contains('polish')) { fade.classList.add('out'); setTimeout(() => { build(); fade.classList.remove('out'); }, 150); return; }
  // polish pass: the old content leaves towards one side, the new arrives from the other (reversed when going back)
  fade.style.setProperty('--dir', idx < shownIdx ? -1 : 1);
  fade.classList.remove('pre'); fade.classList.add('out');
  clearTimeout(show.t);
  show.t = setTimeout(() => { build(); fade.classList.add('pre'); fade.classList.remove('out'); void fade.offsetWidth; fade.classList.remove('pre'); }, 170);
}
// closing cards: the home screen's brand colours, or grey (design alternative)
const closingBrand = () => !(typeof ALT === 'object' && ALT.closingCol === 'grey');
function build() {
  card.classList.remove('before-view'); if (typeof viewBefore !== 'undefined') viewBefore = null;
  zone.innerHTML = ''; foot.innerHTML = ''; zone.className = 'zone'; zone.style.display = ''; screen.querySelectorAll('.hk').forEach(x => x.remove()); card.querySelectorAll('.ll, .tpick').forEach(x => x.remove());
  screen.scrollTop = 0; card.scrollTop = 0; fade.scrollTop = 0;
  if (helpOpen) { helpOpen = false; card.classList.remove('helping'); screen.classList.remove('helping'); }
  $('#backBtn').hidden = hist.length === 0;
  renderJumps(); shownIdx = idx;
  if (idx >= Q.length) { buildEnd(); return; }
  const q = Q[idx], ch = CH[q.ch] || CLOSING;
  const brand = q.type === 'theme' || q.type === 'intro' || !!q.brand || (!CH[q.ch] && closingBrand());
  screen.style.setProperty('--c', brand ? BRAND.purple : ch.c);
  screen.classList.toggle('brand', brand);
  // design alternative: the chronotype card alone in the company's orange and purple, with a spectrum outline
  const chronoBrand = q.id === 'chrono' && typeof ALT === 'object' && ALT.chronoCol !== 'chapter';
  screen.classList.toggle('chrono-brand', chronoBrand); if (chronoBrand) screen.style.setProperty('--c', BRAND.purple);
  card.classList.toggle('wide', q.type === 'permission'); card.classList.toggle('tall', !!q.tall); card.classList.toggle('intro', q.type === 'intro' || q.type === 'theme'); card.classList.toggle('chap', q.type === 'chapter'); card.classList.toggle('beat', q.type === 'beat');
  $('#helpBtn').hidden = !WHY[q.id];
  $('#eyebrow').textContent = CH[q.ch] ? 'Chapter ' + q.ch + ' — ' + ch.name : '';   // closing beats are not a chapter
  $('#qtext').innerHTML = rich(q.text);
  const sub = $('#qsub'); sub.hidden = !subOf(q); sub.textContent = subOf(q) || '';
  const pre = $('#qpre'); pre.hidden = !q.pre; pre.textContent = q.pre || '';
  ({ beat: buildBeat, theme: buildTheme, intro: buildIntro, chapter: buildChapter,  single: buildSingle, multi: buildMulti, scale: buildScale, continuous: buildContinuous, date: buildDate, wheel: buildWheel, dial: buildDial, days: buildDays, text: buildText, permission: buildPermission })[q.type](q);
  fitQuestion();
  if (q.ch === 0 && q.type !== 'intro' && q.type !== 'theme') $('#eyebrow').textContent = 'Chapter 0';   // the chapter name is the question itself
  card.classList.remove('opening', 'unfolding');
  if (q.opening && !cameBack) openChapter(q);
  cameBack = false;
  requestAnimationFrame(() => requestAnimationFrame(fitZone));
  if (typeof paintReview === 'function') paintReview();
  if (typeof paintEdit === 'function') paintEdit();
}
let cameBack = false;
function openChapter(q) {
  const sub = $('#qsub'); card.classList.add('opening'); sub.hidden = false; sub.textContent = CH[q.ch].desc; $('#helpBtn').hidden = true;
  const kept = [...foot.children]; kept.forEach(k => k.hidden = true);          // the question's own footer (skip) waits until it unfolds
  const b = el('button', 'cta', 'Continue'); b.type = 'button'; foot.appendChild(b);
  b.addEventListener('click', () => {
    card.classList.add('unfolding'); card.classList.remove('opening'); b.remove(); kept.forEach(k => k.hidden = false); glow();
    sub.style.opacity = '0'; setTimeout(() => { sub.hidden = !subOf(q); sub.style.opacity = ''; sub.textContent = subOf(q) || ''; }, 260);
    setTimeout(() => { card.classList.remove('unfolding'); $('#helpBtn').hidden = !WHY[q.id]; fitZone(); }, 760);
  });
}
function buildEnd() {
  screen.style.setProperty('--c', closingBrand() ? BRAND.purple : '#8A8D98'); screen.classList.toggle('brand', closingBrand()); card.classList.remove('wide', 'tall', 'intro', 'chap', 'beat'); $('#helpBtn').hidden = true; $('#qpre').hidden = true;
  $('#eyebrow').textContent = 'Prototype'; $('#qtext').textContent = 'That’s the end of the questions.';
  const sub = $('#qsub'); sub.hidden = false; sub.textContent = 'End of the onboarding prototype.';
  const b = el('button', 'cta', 'Enter Pheno'); b.type = 'button'; b.addEventListener('click', () => enterApp()); foot.appendChild(b);
  const r = el('button', 'skip', 'Start again'); r.type = 'button'; r.addEventListener('click', restart); foot.appendChild(r);
  fitQuestion();
  if (typeof paintReview === 'function') paintReview();
}
// long questions shrink to fit the fixed question zone instead of moving
function fitQuestion() {
  const t = $('#qtext'), z = t.closest('.qzone'); let px = 31;
  t.style.setProperty('--qpx', px + 'px');
  const hang = Math.max($('#qsub').hidden ? 0 : $('#qsub').offsetHeight + 10, $('#qpre').hidden ? 0 : $('#qpre').offsetHeight + 14);
  const room = z.clientHeight - 2 * hang;   // the subtitle hangs below, so leave room for it without moving the question
  while (t.offsetHeight > room && px > 19) { px -= 1; t.style.setProperty('--qpx', px + 'px'); }
}
// options that fit are centred; options that don't scroll, sized so the last visible one is cut through the middle
function fitZone() {
  const list = zone.querySelector('.opts'); if (!list) return;
  list.style.maxHeight = '';
  const avail = zone.clientHeight - 14;
  // measured from layout positions, so entrance animations and the phone's scale on small windows can't throw it off
  const kids = [...list.children], top = list.offsetTop, last = kids[kids.length - 1];
  if (!last || last.offsetTop + last.offsetHeight - top <= avail + 1) { zone.classList.remove('scrolls'); return; }
  zone.classList.add('scrolls');
  const top2 = list.offsetTop;                          // read again: the list now starts at the top instead of being centred
  let h = avail;
  for (const k of kids) {
    const t = k.offsetTop - top2;
    if (t + k.offsetHeight > avail) { h = Math.max(80, t + k.offsetHeight * 0.5); break; }
  }
  list.style.maxHeight = h + 'px';
}
function footer({ cont, skip, onCont, onSkip, contLabel = 'Continue', enabled = true }) {
  let btn = null;
  if (cont) { btn = el('button', 'cta', contLabel); btn.type = 'button'; btn.disabled = !enabled; btn.addEventListener('click', onCont); foot.appendChild(btn); }
  if (skip) { const s = el('button', 'skip', typeof skip === 'string' ? skip : 'Skip for now'); s.type = 'button'; s.addEventListener('click', onSkip || (() => { A[Q[idx].id] = 'skipped'; logAnswers(); advance(); })); foot.appendChild(s); }
  return btn;
}

/* ---------- intro: the name, then begin ---------- */
/* ---------- theme: light, dark or follow the phone; applies the moment you tap ---------- */
let theme = null;   // nothing chosen yet: the theme screen starts white
const sysDark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => theme === 'dark' || (theme === 'system' && sysDark.matches);
function applyTheme() { screen.classList.toggle('dark', isDark()); }
sysDark.addEventListener('change', applyTheme);
function buildTheme(q) {
  const w = el('div', 'theme-wrap');
  w.append(el('h2', null, 'Light or dark?'), el('p', 'sub', 'Pick how Pheno looks.'));
  const row = el('div', 'themes'); row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', 'Appearance');
  [['light', 'Light', ''], ['dark', 'Dark', ' dark'], ['system', 'System', ' sys']].forEach(([k, label, cls]) => {
    const b = el('button', 'th-opt'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(theme === k));
    const pv = el('span', 'th-prev' + cls); pv.append(el('i'), el('i'), el('i'), el('b')); b.append(pv, el('span', null, label));
    b.addEventListener('click', () => { theme = k; A.theme = k; logAnswers(); applyTheme(); row.querySelectorAll('.th-opt').forEach(x => x.setAttribute('aria-checked', String(x === b))); });
    row.appendChild(b);
  });
  w.append(row, el('p', 'theme-note', 'You can change this anytime in Settings.'));
  zone.appendChild(w); zone.style.display = 'flex';
  footer({ cont: true, onCont: () => { if (!theme) { theme = 'system'; applyTheme(); }   // no choice made: follow the phone
    A.theme = theme; logAnswers(); glow(); advance(); } });
}
// prototype only: try the theme screen before or after the Pheno intro
function placeTheme(after) {
  const i = Q.findIndex(q => q.id === 'theme'), t = Q.splice(i, 1)[0];
  Q.splice(after ? Q.findIndex(q => q.id === 'intro') + 1 : 0, 0, t);
}

function buildIntro() {
  const m = el('div', 'intro-mark'); const h = el('h1', null, 'Pheno'); const p = el('p'); p.append('sleep powered by ', el('strong', null, 'You'));
  m.append(h, p); zone.appendChild(m); zone.style.display = 'flex';
  footer({ cont: true, contLabel: 'Begin', onCont: () => { glow(); advance(); } });
}

/* ---------- beats: text only on the card shell, easy to restyle ---------- */
function buildBeat(q) {
  const w = el('div', 'beatwrap'); q.render(w); zone.appendChild(w); zone.style.display = 'flex';
  if (q.auto) {                                                         // no buttons: it moves on by itself
    $('#backBtn').hidden = true; const here = idx;
    clearTimeout(buildBeat.t); buildBeat.t = setTimeout(() => { if (idx === here && !(typeof appOn !== 'undefined' && appOn)) advance(); }, q.auto);
    return;
  }
  if (q.end) { footer({ cont: true, contLabel: 'Enter Pheno', onCont: () => { editMode = false; enterApp(); }, skip: 'Edit answers', onSkip: () => startEdit() }); return; }
  footer({ cont: true, onCont: () => advance() });
}

/* ---------- chapter card: the title and its description, between chapters ---------- */
function buildChapter(q) {
  const c = CH[q.ch], m = el('div', 'chap-mark');
  m.append(el('span', 'k', 'Chapter ' + q.ch), el('h2', null, c.name));
  if (c.note) m.appendChild(el('em', 'note', c.note));
  const d = el('p', c.fine ? 'chap-fine' : null); [].concat(c.desc).forEach((line, i) => { if (i) d.appendChild(el('br')); d.append(line); });   // one sentence per line
  if (c.fine) { zone.append(m, d); } else { m.appendChild(d); zone.appendChild(m); }   // fine print sits at the bottom, just above Continue
  zone.style.display = 'flex';
  footer({ cont: true, onCont: () => advance() });
}

/* ---------- single choice: tap, glow, move on ---------- */
function optButton(label, pressed) {
  const b = el('button', 'opt'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(!!pressed)); return b;
}
function buildSingle(q) {
  const list = el('div', 'opts'); zone.appendChild(list);
  // 20.11.26 (peer review: don't rush, leave time to reread): a tap picks the answer and Continue moves on.
  // Only an 'instant' question (sex) still moves on by itself when tapped.
  let btn = null;
  q.opts.forEach(o => {
    const b = optButton(o, A[q.id] === o); list.appendChild(b);
    b.addEventListener('click', () => {
      list.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      answered(o); glow();
      if (q.instant) setTimeout(() => advance(), 480);
      else { btn.hidden = false; btn.disabled = false; }
    });
  });
  if (!q.instant) { btn = footer({ cont: true, skip: !q.required, onCont: () => advance() }); btn.disabled = !q.opts.includes(A[q.id]); }   // there from the start, greyed until something is picked
  else if (!q.required) footer({ skip: true });
}

/* ---------- multi select ---------- */
function buildMulti(q) {
  const list = el('div', 'opts'); zone.appendChild(list);
  const off = new Set((q.disableFor && q.disableFor[A.sex]) || []);
  const cur = new Set((A[q.id] || []).filter(o => !off.has(o)));
  const addOpt = (o, before) => {
    const b = el('button', 'opt'); b.type = 'button'; b.setAttribute('role', 'checkbox'); b.setAttribute('aria-checked', String(cur.has(o))); b.dataset.o = o;
    if (off.has(o)) b.setAttribute('aria-disabled', 'true');
    b.append(el('span', 'lab', o), el('span', 'tick')); list.insertBefore(b, before || null);
    b.addEventListener('click', () => { if (off.has(o)) return; cur.has(o) ? cur.delete(o) : cur.add(o); b.setAttribute('aria-checked', String(cur.has(o))); if (cur.has(o)) glow(); });
  };
  let s = null;
  if (q.more) { s = el('button', 'opt more'); s.type = 'button'; list.appendChild(s); }   // the search sits at the top
  q.opts.forEach(o => addOpt(o));
  if (q.more) {
    [...cur].filter(o => !q.opts.includes(o)).forEach(o => addOpt(o));     // anything already picked from the long list shows as an option too
    s.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg><span class="lab">Search all conditions</span>';
    s.addEventListener('click', () => openLongList(q, cur, () => {
      const shown = new Set([...list.querySelectorAll('.opt[data-o]')].map(b => b.dataset.o));
      [...cur].filter(o => !shown.has(o)).forEach(o => addOpt(o));
      list.querySelectorAll('.opt[data-o]').forEach(b => b.setAttribute('aria-checked', String(cur.has(b.dataset.o))));
      requestAnimationFrame(fitZone);
    }));
  }
  footer({ cont: true, skip: true, onCont: () => { answered([...cur]); glow(); advance(); } });
}

/* ---------- scale: five equal dots; touch shows the circle, which drags and locks to the nearest point ---------- */
const SPECTRUM = ['#F6A623', '#E8607A', '#7B4FC8', '#1D2B7A'], SPEC_AT = [0, 0.38, 0.70, 1];
function spectrumAt(f) {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  let i = 0; while (i < SPEC_AT.length - 2 && f > SPEC_AT[i + 1]) i++;
  const t = (f - SPEC_AT[i]) / (SPEC_AT[i + 1] - SPEC_AT[i]), a = hex(SPECTRUM[i]), b = hex(SPECTRUM[i + 1]);
  return 'rgb(' + a.map((v, k) => Math.round(v + (b[k] - v) * Math.min(1, Math.max(0, t)))).join(',') + ')';
}
// limit (optional, 0 to 1): a wall the knob can't pass; dragging into it gives a little, then it holds
function makeTrack({ points, value, continuous, inverted, spectrum, precise, onChange, onSettle, label, limit }) {
  const track = el('div', 'track' + (continuous ? ' continuous' : '') + (inverted ? ' inverted' : '') + (spectrum ? ' spectrum' : '') + (precise ? ' precise' : ''));
  track.tabIndex = 0; track.setAttribute('role', 'slider'); track.setAttribute('aria-label', label || 'Scale');
  const goo = el('div', 'goo'), pill = el('div', 'pill'), bulge = el('div', 'bulge'); goo.append(pill, bulge); track.appendChild(goo);
  const PAD = 30, pos = f => PAD + f * (track.clientWidth - 2 * PAD);
  const dots = [];
  if (!continuous) for (let i = 0; i < points; i++) { const d = el('i', 'dot'); track.appendChild(d); dots.push(d); }
  const needle = precise ? el('span', 'needle') : null; if (needle) track.appendChild(needle);
  const wallEl = limit != null && limit < 1 ? el('i', 'wall') : null; if (wallEl) track.appendChild(wallEl);
  const knob = el('span', 'knob'); track.appendChild(knob);
  let f = value;
  const place = () => {
    dots.forEach((d, i) => { d.style.left = pos(i / (points - 1)) + 'px'; });
    if (wallEl) wallEl.style.left = pos(Math.min(1, limit + 0.5 / (points - 1))) + 'px';   // halfway to the next point
    if (f != null) {
      knob.style.left = bulge.style.left = pos(f) + 'px'; if (needle) needle.style.left = pos(f) + 'px';
      if (spectrum) {
        knob.style.setProperty('--kc', spectrumAt(f)); if (needle) needle.style.setProperty('--kc', spectrumAt(f));
        // the bulge carries the same gradient, lined up with the track, so the swelling is seamless
        bulge.style.background = 'linear-gradient(90deg, ' + SPECTRUM.map((c, i) => c + ' ' + (SPEC_AT[i] * 100) + '%').join(', ') + ')';
        bulge.style.backgroundSize = track.clientWidth + 'px 100%'; bulge.style.backgroundRepeat = 'no-repeat';
        bulge.style.backgroundPosition = (-(pos(f) - bulge.offsetWidth / 2)) + 'px 0';
      }
    }
  };
  const idxOf = x => Math.round(x * (points - 1));
  const setF = (x, settle) => {
    f = Math.min(1, Math.max(0, x));
    let rep = f;                                         // the value reported out: never past the wall
    if (limit != null && f > limit) {
      rep = limit;
      if (settle) f = limit;
      else { const give = 5 / Math.max(1, track.clientWidth - 2 * PAD); f = limit + give * (1 - Math.exp(-(f - limit) * 12)); }   // rubber band: a few px, then it holds
      track.classList.toggle('atwall', !settle);
    } else track.classList.remove('atwall');
    if (!continuous && settle) f = idxOf(f) / (points - 1);
    track.classList.add('set'); place();
    track.setAttribute('aria-valuenow', continuous ? Math.round(rep * 100) : idxOf(rep) + 1);
    onChange && onChange(continuous ? rep : idxOf(rep));
    if (settle) onSettle && onSettle(continuous ? rep : idxOf(rep));
  };
  const fromEvent = e => { const r = track.getBoundingClientRect(); return ((e.clientX - r.left) * (track.clientWidth / r.width) - PAD) / (track.clientWidth - 2 * PAD); };
  let dragging = false;
  track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); track.classList.remove('snap'); track.classList.add('dragging'); setF(fromEvent(e), false); });
  track.addEventListener('pointermove', e => { if (dragging) setF(fromEvent(e), false); });
  const end = () => { if (!dragging) return; dragging = false; track.classList.remove('dragging'); track.classList.add('snap'); setF(f, true); };
  track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
  track.addEventListener('keydown', e => {
    const step = continuous ? 0.05 : 1 / (points - 1);
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); track.classList.add('snap'); setF((f == null ? 0.5 : f) + step, true); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); track.classList.add('snap'); setF((f == null ? 0.5 : f) - step, true); }
  });
  new ResizeObserver(place).observe(track);
  if (f != null) track.classList.add('set');
  requestAnimationFrame(place);
  return track;
}
function buildScale(q) {
  const w = el('div', 'scale'); zone.appendChild(w);
  const now = el('div', 'now'); if (q.opts) w.appendChild(now);
  // Every graded scale (the seven insomnia items, dozing off, sleepiness) lists its options from no problem to most problem,
  // and the stored answer is that index: the ISI score for the insomnia items (0 = no problem), 0 = Never / Alert for the other two.
  // Which end the good answer sits on is only how it's drawn (the "Scale direction" switch beside the phone):
  //   A: the problem grows to the right everywhere (the questionnaire's own order).   B: the good answer is on the right everywhere.
  const flip = (!!q.isi || !!q.graded) && typeof ALT === 'object' && ALT.scaleDir === 'B';
  const opts = q.opts ? (flip ? [...q.opts].reverse() : q.opts) : null;
  const score = pos => flip ? 4 - pos : pos;            // position on the track <-> stored score (the mapping is its own inverse)
  const prev = A[q.id];
  const cur = typeof prev === 'number' ? score(prev) : null;   // position
  let btn;
  const setNow = i => { if (opts) now.textContent = i == null ? '' : opts[i]; };
  const track = makeTrack({ points: 5, value: cur == null ? null : cur / 4, inverted: q.inverted, label: plain(q.text),
    onChange: i => setNow(i), onSettle: i => { answered(score(i)); glow(); if (btn) btn.disabled = false; } });
  w.appendChild(track); setNow(cur);
  const an = el('div', 'anchors'); const [a0, a1] = q.anchors || [opts[0], opts[4]];
  an.append(el('span', null, a0), el('span', null, a1)); w.appendChild(an);
  // ISI: skipping any item ends the section at the diagnosis question.
  // One of the ISI-3 skipped: the section is invalid. One of the optional four skipped: those are discarded, the ISI-3 stands.
  const onSkip = q.isi ? () => { A[q.id] = 'skipped';
    A.isiNote = q.isi3 ? 'ISI-3 incomplete: section invalid' : 'optional ISI items incomplete: discarded, ISI-3 stands';
    logAnswers(); advance(Q.findIndex(x => x.id === 'diag')); } : null;
  btn = footer({ cont: true, skip: !q.required, enabled: cur != null, onCont: () => advance(), onSkip });
}
function buildContinuous(q) {
  const w = el('div', 'scale'); zone.appendChild(w);
  let btn;
  // same circle-in-the-pill as the other scales, but free placement anywhere along it
  if (q.top) { const tp = el('div', 'anchors top'); tp.append(el('span', null, q.top[0]), el('span', null, q.top[1])); w.appendChild(tp); }
  const track = makeTrack({ points: 2, value: typeof A[q.id] === 'number' ? A[q.id] : null, continuous: true, spectrum: q.spectrum, label: plain(q.text),
    onSettle: f => { answered(+f.toFixed(3)); glow(); if (btn) btn.disabled = false; } });
  w.appendChild(track);
  const an = el('div', 'anchors'); an.append(el('span', null, q.anchors[0]), el('span', null, q.anchors[1])); w.appendChild(an);
  btn = footer({ cont: true, skip: true, enabled: typeof A[q.id] === 'number', onCont: () => advance() });
}

/* ---------- wheel pickers ---------- */
function makeWheel(cols) {
  const w = el('div', 'wheel'); w.appendChild(el('div', 'band'));
  const RH = 42;
  const api = cols.map(c => {
    const col = el('div', 'wcol'); col.tabIndex = 0; col.setAttribute('role', 'listbox'); col.setAttribute('aria-label', c.label);
    if (c.flex) col.style.flex = c.flex;
    w.appendChild(col);
    const o = { col, items: [], value: c.value };
    o.set = (items, value) => {
      o.items = items; col.innerHTML = ''; col.appendChild(el('div', 'pad'));
      items.forEach(t => col.appendChild(el('div', 'witem', t))); col.appendChild(el('div', 'pad'));
      o.value = Math.min(value, items.length - 1); col.scrollTop = o.value * RH; o.shade();
      requestAnimationFrame(() => { col.scrollTop = o.value * RH; o.shade(); });
    };
    o.shade = () => { const st = col.scrollTop; [...col.querySelectorAll('.witem')].forEach((it, i) => { const d = Math.abs(i * RH - st) / RH; it.style.opacity = String(Math.max(0.16, 1 - d * 0.3)); it.style.fontWeight = d < 0.5 ? '600' : '400'; }); };
    let tm = null;
    col.addEventListener('scroll', () => { o.shade(); clearTimeout(tm); tm = setTimeout(() => { const v = Math.round(col.scrollTop / RH); if (v !== o.value) { o.value = v; c.onChange && c.onChange(v); } }, 110); });
    col.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); col.scrollTo({ top: (o.value + (e.key === 'ArrowDown' ? 1 : -1)) * RH, behavior: 'smooth' }); } });
    col.addEventListener('click', e => { const it = e.target.closest('.witem'); if (!it) return; const i = [...col.querySelectorAll('.witem')].indexOf(it); col.scrollTo({ top: i * RH, behavior: 'smooth' }); });
    return o;
  });
  cols.forEach((c, i) => api[i].set(c.items, c.value));
  return { w, api };
}
function buildDate(q) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const Y0 = 1930, Y1 = new Date().getFullYear() - 13;
  const years = []; for (let y = Y0; y <= Y1; y++) years.push(String(y));
  const cur = A.dob || { d: 15, m: 5, y: 1995 };
  const dim = (m, y) => new Date(y, m + 1, 0).getDate();
  const days = n => Array.from({ length: n }, (_, i) => String(i + 1));
  let state = { ...cur };
  const save = () => { A.dob = { ...state }; logAnswers(); };
  const { w, api } = makeWheel([
    { label: 'Day', items: days(dim(state.m, state.y)), value: state.d - 1, flex: '0.8', onChange: v => { state.d = v + 1; save(); } },
    { label: 'Month', items: MONTHS, value: state.m, flex: '1.4', onChange: v => { state.m = v; fixDays(); save(); } },
    { label: 'Year', items: years, value: state.y - Y0, flex: '1', onChange: v => { state.y = Y0 + v; fixDays(); save(); } },
  ]);
  function fixDays() { const n = dim(state.m, state.y); if (api[0].items.length !== n) { state.d = Math.min(state.d, n); api[0].set(days(n), state.d - 1); } }
  zone.appendChild(w);
  footer({ cont: true, onCont: () => { save(); glow(); advance(); } });
}
function buildWheel(q) {
  const items = []; for (let h = -12; h <= 12; h++) items.push(h === 0 ? '0 hours' : (h > 0 ? '+' : '−') + Math.abs(h) + (Math.abs(h) === 1 ? ' hour' : ' hours'));
  let v = typeof A.tzHours === 'number' ? A.tzHours + 12 : 13;
  const { w } = makeWheel([{ label: 'Hours difference', items, value: v, onChange: x => { v = x; } }]);
  w.style.maxWidth = '220px'; w.style.margin = '0 auto'; w.style.width = '100%';
  zone.appendChild(w);
  footer({ cont: true, skip: true, onCont: () => { answered(v - 12); glow(); advance(); } });
}

/* ---------- sleep window dial (modelled on the iOS sleep schedule): a 24-hour clock with the window as an arc on the ring.
   Drag either end circle to change bedtime or wake-up; drag the arc itself to move the whole window. 5-minute steps. ---------- */
const pad2 = n => String(n).padStart(2, '0');
const norm24 = h => ((h % 24) + 24) % 24;
const hm = h => { const t = norm24(h); let hh = Math.floor(t + 1e-6), mm = Math.round((t - hh) * 60); if (mm === 60) { hh = (hh + 1) % 24; mm = 0; } return [hh, mm]; };
const fmtAbs = h => { const [hh, mm] = hm(h); return pad2(hh) + ':' + pad2(mm); };
const fmt12 = h => { const [hh, mm] = hm(h); return (hh % 12 === 0 ? 12 : hh % 12) + ':' + pad2(mm) + ' ' + (hh < 12 ? 'AM' : 'PM'); };
const snap = (x, st) => Math.round(x / st) * st;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
/* Half clock: the semicircle shows 12 hours at a time (the longest window allowed), and the face spins so the
   window always sits centred at the top. Drag an end circle to change bedtime or wake-up (the face re-centres when
   you let go), drag the arc to move the whole window, or drag the face to spin it. 15-minute steps. */
function buildDial(q) {
  if (typeof ALT === 'object' && ALT.dialv === 'times') return buildDialTimes(q);   // simpler versions ("Sleep window" switch), js/dial2.js
  if (typeof ALT === 'object' && ALT.dialv === 'bar') return buildDialBar(q);
  const saved = v => v && typeof v === 'object' && v.abs ? v : null;
  const prev = saved(A[q.id]), ghost = q.ghost ? saved(A[q.ghost]) : null;
  const s = prev ? { bed: prev.bed, dur: Math.min(12, prev.dur) } : ghost ? { bed: ghost.bed, dur: Math.min(12, ghost.dur) } : { bed: 22.5, dur: 8 };
  let chosenExtra = typeof A[q.id] === 'string' ? A[q.id] : null;
  const MIN = 1, MAX = 12, STEP = 0.25, HALF = 6;
  const wrapH = d => ((d % 24) + 36) % 24 - 12;                     // signed difference in hours, -12..12
  const centre = () => s.bed + s.dur / 2;
  const view = { mid: centre(), target: centre() };                  // the hour at the top of the half clock
  const wrap = el('div', 'sdial');
  let days = null;
  if (q.days) {
    days = new Set(prev && prev.days ? prev.days : [0, 1, 2, 3, 4]);
    const row = el('div', 'sddays'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Days active');
    DAYS.forEach((d, i) => { const b = el('button', 'sdday', d); b.type = 'button'; b.setAttribute('aria-label', DAY_NAMES[i]); b.setAttribute('aria-pressed', String(days.has(i)));
      b.addEventListener('click', () => { days.has(i) ? days.delete(i) : days.add(i); b.setAttribute('aria-pressed', String(days.has(i))); }); row.appendChild(b); });
    wrap.appendChild(row);
  }
  const box = el('div', 'sdbox half');
  const W = 260, cx = 130, cy = 128, R = 104, RW = 24, FACE = 82;
  const NS = 'http://www.w3.org/2000/svg', mk = (t, at) => { const e = document.createElementNS(NS, t); for (const k in at) e.setAttribute(k, at[k]); return e; };
  // relative hour r (-6..6 from the top) -> point on a circle of radius rad
  const pt = (r, rad) => { const a = r / HALF * Math.PI / 2; return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)]; };
  const arcRel = (r0, r1, rad) => { const [x0, y0] = pt(r0, rad), [x1, y1] = pt(r1, rad); return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + rad + ' ' + rad + ' 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2); };
  const svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + (cy + 6), class: 'sdsvg', role: 'group', 'aria-label': 'Sleep window' });
  svg.appendChild(mk('path', { d: arcRel(-HALF, HALF, R), fill: 'none', 'stroke-width': RW + 8, 'stroke-linecap': 'round', class: 'sd-ring' }));
  const ghostPath = mk('path', { fill: 'none', stroke: 'var(--c)', 'stroke-opacity': .22, 'stroke-width': RW, 'stroke-linecap': 'round' }); if (ghost) svg.appendChild(ghostPath);
  const band = mk('path', { fill: 'none', stroke: 'var(--c)', 'stroke-width': RW, 'stroke-linecap': 'round', class: 'sd-band' }); svg.appendChild(band);
  const face = mk('path', { d: 'M' + (cx - FACE) + ' ' + cy + ' A' + FACE + ' ' + FACE + ' 0 0 1 ' + (cx + FACE) + ' ' + cy + ' Z', class: 'sd-face' }); svg.appendChild(face);
  const marks = el('div');                                            // hour ticks and numbers are re-placed every frame as the face spins
  const ticks = [], nums = [];
  for (let h = 0; h < 24; h++) {
    for (let qtr = 0; qtr < 4; qtr++) { const t = mk('line', { class: 'sd-tick', 'stroke-linecap': 'round', 'stroke-width': qtr ? .8 : (h % 6 ? 1.1 : 1.7) }); t._h = h + qtr / 4; t._major = !qtr; svg.appendChild(t); ticks.push(t); }
    if (h % 2) continue;                                              // numbers every two hours; ticks every hour and quarter
    const major = h % 6 === 0, n = mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', class: major ? 'sd-num major' : 'sd-num' });
    n.textContent = major ? ({ 0: '12AM', 6: '6AM', 12: '12PM', 18: '6PM' })[h] : String(h % 12 === 0 ? 12 : h % 12); n._h = h; svg.appendChild(n); nums.push(n);
  }
  const handle = label => { const g = mk('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': label }); g.appendChild(mk('circle', { r: 11, class: 'sd-knob' })); svg.appendChild(g); return g; };
  const hB = handle('Bedtime'), hW = handle('Wake up');
  box.appendChild(svg);
  // under the half clock: bedtime on the left, length in the middle, wake-up on the right
  const row = el('div', 'sdrow'), tB = el('div', 'sdt'), tW = el('div', 'sdt r'), vB = el('b'), vW = el('b'), dur = el('div', 'sddur');
  tB.append(el('span', null, 'BEDTIME'), vB); tW.append(el('span', null, 'WAKE UP'), vW); row.append(tB, dur, tW); box.appendChild(row);
  // tap either time to set it with the iOS scroll wheel; the other end stays put if it can, otherwise the window keeps its length
  [[tB, 'bed'], [tW, 'wake']].forEach(([t, which]) => {
    t.classList.add('tap'); t.tabIndex = 0; t.setAttribute('role', 'button'); t.setAttribute('aria-label', which === 'bed' ? 'Set bedtime' : 'Set wake-up time');
    const open = () => openTimePicker(which === 'bed' ? 'Bedtime' : 'Wake up', which === 'bed' ? s.bed : s.bed + s.dur, h => {
      chosenExtra = null;
      if (which === 'bed') { const d = norm24(s.bed + s.dur - h); if (d >= MIN && d <= MAX) s.dur = d; s.bed = h; }
      else { const d = norm24(h - s.bed); if (d >= MIN && d <= MAX) s.dur = d; else s.bed = norm24(h - s.dur); }
      paint(); settle(); glow();
    });
    t.addEventListener('click', open); t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  wrap.appendChild(box);
  let chipEls = [];
  if (q.extra) {
    const chips = el('div', 'chips');
    q.extra.forEach(t => { const c = el('button', 'chipo', t); c.type = 'button'; chips.appendChild(c); chipEls.push(c);
      c.addEventListener('click', () => { chosenExtra = chosenExtra === t ? null : t; paint(); if (chosenExtra) glow(); }); });
    wrap.appendChild(chips);
  }
  zone.appendChild(wrap);
  const clip = (r0, r1) => [Math.max(-HALF, r0), Math.min(HALF, r1)];
  function paint() {
    s.bed = norm24(s.bed); s.dur = Math.min(MAX, Math.max(MIN, s.dur));
    const rB = wrapH(s.bed - view.mid), rW = rB + s.dur;
    const [a0, a1] = clip(rB, rW); band.setAttribute('d', a1 > a0 ? arcRel(a0, a1, R) : '');
    if (ghost) { const g0 = wrapH(ghost.bed - view.mid), [b0, b1] = clip(g0, g0 + ghost.dur); ghostPath.setAttribute('d', b1 > b0 ? arcRel(b0, b1, R) : ''); }
    const place = (g, r) => { const vis = r >= -HALF - .01 && r <= HALF + .01, [x, y] = pt(Math.max(-HALF, Math.min(HALF, r)), R); g.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')'); g.style.opacity = vis ? '' : '0'; };
    place(hB, rB); place(hW, rW);
    ticks.forEach(t => { const r = wrapH(t._h - view.mid), on = Math.abs(r) <= HALF;
      t.style.display = on ? '' : 'none'; if (!on) return;
      const [x0, y0] = pt(r, FACE - 4), [x1, y1] = pt(r, FACE - (t._major ? (t._h % 6 ? 9 : 11) : 6.5));
      t.setAttribute('x1', x0.toFixed(2)); t.setAttribute('y1', y0.toFixed(2)); t.setAttribute('x2', x1.toFixed(2)); t.setAttribute('y2', y1.toFixed(2)); });
    nums.forEach(n => { const r = wrapH(n._h - view.mid), on = Math.abs(r) <= HALF - .35;
      n.style.display = on ? '' : 'none'; if (!on) return;
      const [x, y] = pt(r, FACE - 24); n.setAttribute('x', x.toFixed(2)); n.setAttribute('y', y.toFixed(2)); n.style.opacity = Math.abs(r) > 5 ? .45 : ''; });
    vB.textContent = fmt12(s.bed); vW.textContent = fmt12(s.bed + s.dur);
    const [dh, dm] = hm(s.dur); dur.textContent = dh + ' hr' + (dm ? ' ' + dm + ' min' : '');
    hB.setAttribute('aria-valuetext', fmt12(s.bed)); hW.setAttribute('aria-valuetext', fmt12(s.bed + s.dur));
    box.classList.toggle('off', !!chosenExtra); chipEls.forEach(c => c.setAttribute('aria-pressed', String(c.textContent === chosenExtra)));
  }
  // the spin back to centre after a handle is released
  let raf = 0;
  function settle() {
    view.target = centre(); cancelAnimationFrame(raf);
    const step = () => { if (!svg.isConnected) return; const d = wrapH(view.target - view.mid);
      if (Math.abs(d) < 0.01) { view.mid = view.target; paint(); return; }
      view.mid += d * 0.18; paint(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }
  const relAt = e => { const r = svg.getBoundingClientRect(), sc = W / r.width, x = (e.clientX - r.left) * sc - cx, y = (e.clientY - r.top) * sc - cy;
    return Math.max(-HALF, Math.min(HALF, Math.atan2(x, -y) / (Math.PI / 2) * HALF)); };
  function drag(target, onMove, recentre) {
    target.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault(); target.setPointerCapture(e.pointerId); chosenExtra = null; cancelAnimationFrame(raf);
      const s0 = { ...s }, r0 = relAt(e), m0 = view.mid;
      const mv = ev => { onMove(relAt(ev), s0, r0, m0); paint(); };
      const up = () => { target.removeEventListener('pointermove', mv); target.removeEventListener('pointerup', up); target.removeEventListener('pointercancel', up); if (recentre) settle(); else paint(); glow(); };
      target.addEventListener('pointermove', mv); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
    });
  }
  // ends: the face holds still while you drag, the other end stays put
  drag(hB, r => { const wake = s.bed + s.dur, b = snap(view.mid + r, STEP), d = norm24(wake - b); if (d >= MIN && d <= MAX) { s.bed = b; s.dur = d; } }, true);
  drag(hW, r => { const d = norm24(snap(view.mid + r, STEP) - s.bed); if (d >= MIN && d <= MAX) s.dur = d; }, true);
  // the arc: the whole window moves with your finger and the face turns with it, so the window stays centred
  drag(band, (r, s0, r0) => { s.bed = snap(s0.bed + (r - r0), STEP); view.mid = centre(); }, false);
  // the face: spin the clock under the window
  drag(face, (r, s0, r0, m0) => { s.bed = snap(s0.bed - (r - r0), STEP); view.mid = centre(); }, false);
  [[hB, 'bed'], [hW, 'wake']].forEach(([g, which]) => g.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if (!d) return; e.preventDefault(); chosenExtra = null;
    if (which === 'bed') { const nd = s.dur - d * STEP; if (nd >= MIN && nd <= MAX) { s.bed += d * STEP; s.dur = nd; } } else { const nd = s.dur + d * STEP; if (nd >= MIN && nd <= MAX) s.dur = nd; }
    paint(); settle(); }));
  if (q.toggle) {
    const r = el('div', 'togrow'); const lab = el('span', null, q.toggle); const t = el('button', 'ios'); t.type = 'button'; t.setAttribute('role', 'switch'); t.setAttribute('aria-label', q.toggle);
    t.setAttribute('aria-checked', String(!!A[q.id + 'Varies']));
    t.addEventListener('click', () => { const v = t.getAttribute('aria-checked') !== 'true'; t.setAttribute('aria-checked', String(v)); A[q.id + 'Varies'] = v; logAnswers(); });
    r.append(lab, t); foot.appendChild(r);
  }
  footer({ cont: true, skip: true, onCont: () => {
    const v = { abs: true, bed: s.bed, dur: s.dur, from: fmt12(s.bed), to: fmt12(s.bed + s.dur) }; if (days) v.days = [...days].sort();
    answered(chosenExtra || v); glow(); advance(); } });
  paint();
  if (window.__dial) window.__dial.current = { s, view, paint };
}

/* ---------- work days (20.11.26): its own card before the work sleep window; the days, and "My schedule varies week to week" ---------- */
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function daysSummary(set) {
  const d = [...set].sort();
  if (!d.length) return 'No days picked';
  if (d.length === 7) return 'Every day';
  const run = d.every((x, i) => !i || x === d[i - 1] + 1);
  return run && d.length > 2 ? DAY_LONG[d[0]] + ' to ' + DAY_LONG[d[d.length - 1]] : d.map(x => DAY_LONG[x].slice(0, 3)).join(', ');
}
function buildDays(q) {
  const prev = Array.isArray(A[q.id]) ? A[q.id] : null;
  const days = new Set(prev || [0, 1, 2, 3, 4]);
  const wrap = el('div', 'wdays'), row = el('div', 'wd-row'), sum = el('p', 'wd-sum');
  row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Work or study days');
  const key = q.toggleKey || q.id + 'Varies';
  // 21.11.26: with "varies" on, the days blur and can't be tapped
  const blurs = !q.noBlur;                                                        // read now: a Before view turns it off only while it builds
  const paint = () => { const off = blurs && !!A[key]; wrap.classList.toggle('off', off); row.querySelectorAll('.wd').forEach(b => { b.disabled = off; });
    sum.textContent = off ? 'Your days change from week to week' : daysSummary(days); if (btn) btn.disabled = !off && !days.size; };
  DAYS.forEach((d, i) => { const b = el('button', 'wd', d); b.type = 'button'; b.setAttribute('aria-label', DAY_NAMES[i]); b.setAttribute('aria-pressed', String(days.has(i)));
    b.addEventListener('click', () => { days.has(i) ? days.delete(i) : days.add(i); b.setAttribute('aria-pressed', String(days.has(i))); if (days.has(i)) glow(); paint(); }); row.appendChild(b); });
  wrap.append(row, sum); zone.appendChild(wrap);
  if (q.toggle) {
    const r = el('div', 'togrow'); const t = el('button', 'ios'); t.type = 'button'; t.setAttribute('role', 'switch'); t.setAttribute('aria-label', q.toggle);
    t.setAttribute('aria-checked', String(!!A[key]));
    t.addEventListener('click', () => { const v = t.getAttribute('aria-checked') !== 'true'; t.setAttribute('aria-checked', String(v)); A[key] = v; logAnswers(); paint(); });
    r.append(el('span', null, q.toggle), t); foot.appendChild(r);
  }
  const btn = footer({ cont: true, skip: true, onCont: () => { answered(A[key] ? 'Varies week to week' : [...days].sort((a, b) => a - b).map(i => DAY_LONG[i].slice(0, 3))); glow(); advance(); } });
  // stored as day names (Mon, Tue…); read back into the set when coming back
  if (prev) { days.clear(); prev.forEach(x => { const i = typeof x === 'number' ? x : DAY_LONG.findIndex(n => n.startsWith(x)); if (i >= 0) days.add(i); }); row.querySelectorAll('.wd').forEach((b, i) => b.setAttribute('aria-pressed', String(days.has(i)))); }
  paint();
}

/* ---------- overlays on the card: the time wheel and the long list. Both close back to the question. ---------- */
function cardSheet(cls, title, onDone, doneLabel = 'Done') {
  const o = el('div', cls); o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', title);
  const scrim = el('div', 'sh-scrim'), sh = el('div', 'sh'), bar = el('div', 'sh-bar');
  const cancel = el('button', 'sh-btn', 'Cancel'), done = el('button', 'sh-btn b', doneLabel); cancel.type = done.type = 'button';
  bar.append(cancel, el('span', 'sh-t', title), done); sh.appendChild(bar); o.append(scrim, sh); card.appendChild(o);
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on')));
  const close = ok => { if (ok && onDone() === false) return; o.classList.remove('on'); setTimeout(() => o.remove(), 380); };
  cancel.addEventListener('click', () => close(false)); scrim.addEventListener('click', () => close(false)); done.addEventListener('click', () => close(true));
  o.addEventListener('keydown', e => { if (e.key === 'Escape') close(false); });
  return { o, sh, close };
}
function openTimePicker(title, hour, onPick) {
  let [hh, mm] = hm(hour); mm = Math.round(mm / 5) * 5; if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
  const H = Array.from({ length: 12 }, (_, i) => String(i + 1)), M = Array.from({ length: 12 }, (_, i) => pad2(i * 5));
  const { w, api } = makeWheel([
    { label: 'Hour', items: H, value: (hh % 12 || 12) - 1, flex: '1' },
    { label: 'Minutes', items: M, value: mm / 5, flex: '1' },
    { label: 'AM or PM', items: ['AM', 'PM'], value: hh < 12 ? 0 : 1, flex: '1' },
  ]);
  w.classList.add('twheel');
  // read the wheels as they stand when Done is tapped (their own change events wait for the scroll to settle)
  const at = i => Math.max(0, Math.min(api[i].items.length - 1, Math.round(api[i].col.scrollTop / 42)));
  const { sh } = cardSheet('tpick', title, () => { onPick((at(0) + 1) % 12 + (at(2) ? 12 : 0) + at(1) * 5 / 60); });
  sh.appendChild(w); setTimeout(() => api[0].col.focus({ preventScroll: true }), 60);
}
function openLongList(q, cur, onClose) {
  const picked = new Set(cur), all = [...q.opts, ...q.more, ...[...cur].filter(o => !q.opts.includes(o) && !q.more.includes(o))];
  const { sh } = cardSheet('ll', 'All conditions', () => { cur.clear(); picked.forEach(o => cur.add(o)); if (picked.size) glow(); onClose(); });
  const field = el('label', 'll-search'); field.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>';
  const inp = el('input'); inp.type = 'search'; inp.placeholder = 'Search'; inp.setAttribute('aria-label', 'Search conditions'); field.appendChild(inp);
  const list = el('div', 'll-list'); sh.append(field, list);
  const row = o => { const b = el('button', 'll-row'); b.type = 'button'; b.setAttribute('role', 'checkbox'); b.setAttribute('aria-checked', String(picked.has(o)));
    b.append(el('span', null, o), el('span', 'tick')); b.addEventListener('click', () => { picked.has(o) ? picked.delete(o) : picked.add(o); b.setAttribute('aria-checked', String(picked.has(o))); }); return b; };
  const paintList = () => {
    const f = inp.value.trim().toLowerCase(); list.innerHTML = '';
    if (!f) {
      list.appendChild(el('p', 'll-h', 'Most common')); q.opts.forEach(o => list.appendChild(row(o)));
      list.appendChild(el('p', 'll-h', 'All conditions')); all.filter(o => !q.opts.includes(o)).sort((a, b) => a.localeCompare(b)).forEach(o => list.appendChild(row(o)));
      return;
    }
    const hits = all.filter(o => o.toLowerCase().includes(f)); hits.forEach(o => list.appendChild(row(o)));
    if (!hits.some(o => o.toLowerCase() === f)) {                      // not listed: add it in their own words
      const add = el('button', 'll-row add'); add.type = 'button'; add.append(el('span', null, 'Add “' + inp.value.trim() + '”'));
      add.addEventListener('click', () => { const t = inp.value.trim(); all.push(t); picked.add(t); inp.value = ''; paintList(); }); list.appendChild(add);
    }
  };
  inp.addEventListener('input', paintList); paintList();
}

/* ---------- free text: starts modest, grows as you write ---------- */
function buildText(q) {
  const t = el('textarea', 'words'); t.rows = 2; t.placeholder = 'Write as much or as little as you like'; t.setAttribute('aria-label', plain(q.text));
  t.value = typeof A.words === 'string' && A.words !== 'skipped' ? A.words : '';
  const grow = () => { t.style.height = 'auto'; t.style.height = Math.min(230, t.scrollHeight + 3) + 'px'; };
  t.addEventListener('input', grow);
  const wrap = el('div'); wrap.append(t, el('p', 'wordsnote', 'We’ll hang onto this and bring it back once we know how you actually sleep.'));
  zone.appendChild(wrap); requestAnimationFrame(grow);
  footer({ cont: true, skip: true, onCont: () => { answered(t.value.trim() || 'skipped'); glow(); advance(); } });
}

/* ---------- permissions: larger card, a statement rather than a question ---------- */
const ICONS = {
  health: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8.5 11h2l1-2 1.6 4 .9-2h1.5" stroke-linecap="round"/></svg>',
  watch: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="6.5" y="6" width="11" height="12" rx="3.2"/><path d="M9 6l.6-3h4.8L15 6M9 18l.6 3h4.8L15 18"/><path d="M12 9.5V12l1.7 1.2" stroke-linecap="round"/></svg>',
  alarm: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.3 1.6M4.5 5.5 7 3.5M19.5 5.5 17 3.5"/></svg>',
};
// perm2: wearables slowly taking turns (generic silhouettes: a square smartwatch, a round sports watch, a screenless strap, a slim band, a ring)
const DEVICES = [
  '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="24" y="3" width="16" height="14" rx="3" opacity=".35"/><rect x="24" y="47" width="16" height="14" rx="3" opacity=".35"/><rect x="17" y="13" width="30" height="38" rx="10"/><rect x="47" y="24" width="3.5" height="8" rx="1.6"/><rect x="20.5" y="16.5" width="23" height="31" rx="7" fill="#fff" opacity=".22"/></svg>',
  '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="25" y="2" width="14" height="16" rx="3" opacity=".35"/><rect x="25" y="46" width="14" height="16" rx="3" opacity=".35"/><circle cx="32" cy="32" r="17"/><circle cx="32" cy="32" r="12" fill="#fff" opacity=".22"/><rect x="12" y="24" width="4" height="5" rx="1.5"/><rect x="12" y="35" width="4" height="5" rx="1.5"/><rect x="48" y="24" width="4" height="5" rx="1.5"/><rect x="48" y="35" width="4" height="5" rx="1.5"/></svg>',
  '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="4" y="25" width="56" height="14" rx="7" opacity=".35"/><rect x="19" y="20" width="26" height="24" rx="8"/><rect x="23" y="24" width="18" height="16" rx="5" fill="#fff" opacity=".12"/></svg>',
  '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="26" y="2" width="12" height="16" rx="3" opacity=".35"/><rect x="26" y="46" width="12" height="16" rx="3" opacity=".35"/><rect x="23" y="14" width="18" height="36" rx="8"/><rect x="26" y="18" width="12" height="28" rx="5" fill="#fff" opacity=".22"/></svg>',
  '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor"><ellipse cx="32" cy="34" rx="18" ry="17" stroke-width="8"/><path d="M22 20.5a18 17 0 0 1 20 0" stroke-width="8" opacity=".35"/></svg>',
];
function buildPermission(q) {
  const p = el('div', 'perm');
  let ico;
  if (q.icon === 'watch') {
    ico = el('div', 'devs'); ico.setAttribute('aria-hidden', 'true');
    DEVICES.forEach((svg, i) => { const d = el('span', 'dev' + (i ? '' : ' on')); d.innerHTML = svg; ico.appendChild(d); });
    let k = 0; const timer = setInterval(() => { if (!ico.isConnected) { clearInterval(timer); return; } const ds = ico.children; ds[k].classList.remove('on'); k = (k + 1) % ds.length; ds[k].classList.add('on'); }, 1900);
  } else { ico = el('div', 'ico'); ico.innerHTML = ICONS[q.icon]; }
  p.append(ico, el('span', 'tag', q.tag), el('p', null, q.body)); zone.appendChild(p);
  const done = () => { answered('allowed'); glow(); setTimeout(() => advance(), 350); };
  footer({ cont: true, contLabel: q.allow, skip: 'Not now', onCont: q.icon === 'health' ? () => openHealthSheet(done) : done,
    onSkip: () => { answered('not now'); advance(); } });
}
// perm1: after our own card, the system's Health access sheet, as iOS shows it (all off until switched on)
const HK_TYPES = [['Sleep', '#5E5CE6'], ['Heart Rate', '#FF375F'], ['Heart Rate Variability', '#FF375F'], ['Resting Heart Rate', '#FF375F'], ['Respiratory Rate', '#64D2FF'],
  ['Blood Oxygen', '#64D2FF'], ['Wrist Temperature', '#FF9F0A'], ['Active Energy', '#FF9F0A'], ['Steps', '#FF9F0A'], ['Time in Daylight', '#30B0C7']];
function openHealthSheet(onAllow) {
  screen.querySelectorAll('.hk').forEach(x => x.remove());
  const ov = el('div', 'hk'), sh = el('div', 'hk-sheet'); sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'Health Access');
  const bar = el('div', 'hk-bar'), no = el('button', null, 'Don’t Allow'), yes = el('button', null, 'Allow'); no.type = yes.type = 'button'; yes.className = 'strong';
  bar.append(no, el('b', null, 'Health Access'), yes);
  const sc = el('div', 'hk-scroll');
  const icon = el('div', 'hk-ico'); icon.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24"><defs><linearGradient id="hkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6482"/><stop offset="1" stop-color="#FF2D55"/></linearGradient></defs><path fill="url(#hkg)" d="M12 21s-8-5.1-8-11.2A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8 3.1C20 15.9 12 21 12 21z"/></svg>';
  const all = el('button', 'hk-all', 'Turn On All'); all.type = 'button';
  const g1 = el('div', 'hk-group'); g1.appendChild(all);
  const g2 = el('div', 'hk-group'), tgs = [];
  HK_TYPES.forEach(([name, c]) => {
    const row = el('div', 'hk-row'); const dot = el('span', 'hk-dot'); dot.style.setProperty('--hc', c);
    const inn = el('span', 'hk-in'); const t = el('button', 'ios'); t.type = 'button'; t.setAttribute('role', 'switch'); t.setAttribute('aria-label', name); t.setAttribute('aria-checked', 'false');
    t.addEventListener('click', () => { t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true')); sync(); });
    inn.append(el('span', null, name), t); row.append(dot, inn); g2.appendChild(row); tgs.push([name, t]);
  });
  const sync = () => { all.textContent = tgs.every(([, t]) => t.getAttribute('aria-checked') === 'true') ? 'Turn Off All' : 'Turn On All'; };
  all.addEventListener('click', () => { const on = all.textContent === 'Turn On All'; tgs.forEach(([, t]) => t.setAttribute('aria-checked', String(on))); sync(); });
  sc.append(icon, el('h3', null, 'Health'), el('p', 'lead', '“Pheno” would like to access your Health data.'), g1, el('p', 'hk-sec', 'Allow “Pheno” to read'), g2,
    el('p', 'hk-foot', 'App Explanation: [Pheno reads your sleep, heart and activity data to understand how you sleep. Nothing leaves your phone without your say.]'));
  sh.append(bar, sc); ov.appendChild(sh); screen.appendChild(ov);
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('on')));
  const close = then => { ov.classList.remove('on'); setTimeout(() => { ov.remove(); then(); }, 380); };
  yes.addEventListener('click', () => { A.perm1Read = tgs.filter(([, t]) => t.getAttribute('aria-checked') === 'true').map(([n]) => n); close(onAllow); });
  no.addEventListener('click', () => close(() => { answered('denied'); advance(); }));
}

