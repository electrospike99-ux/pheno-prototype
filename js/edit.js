'use strict';
/* edit answers: from the closing card, "Edit answers" zooms out to an overview of every answer, grouped by chapter.
   Tapping one zooms back into that question in edit mode, where a strip of answers along the bottom scrolls like a
   wheel (let go on one to jump there) and the grid button zooms out again. Done on the overview returns to the closing card. */
const MONTHS_L = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const GRID = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/></svg>';
const CHEV = '<svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5L1.5 11.5"/></svg>';

// an answer in a few words
function answerText(q) {
  const v = q.id === 'theme' ? (A.theme || theme) : A[q.id];
  if (v == null || v === '') return null;
  if (v === 'skipped') return 'Skipped';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'None';
  if (q.type === 'date') return v.d + ' ' + MONTHS_L[v.m] + ' ' + v.y;
  if (q.type === 'dial') return typeof v === 'string' ? v : fmt12(v.bed) + ' – ' + fmt12(v.bed + v.dur);
  if (q.type === 'scale' && typeof v === 'number') return q.opts ? q.opts[v] : String(v);
  if (q.type === 'continuous' && typeof v === 'number') return v < 0.4 ? 'Closer to ' + q.anchors[0] : v > 0.6 ? 'Closer to ' + q.anchors[1] : 'In the middle';
  if (q.type === 'wheel') return v === 0 ? '0 hours' : (v > 0 ? '+' : '−') + Math.abs(v) + (Math.abs(v) === 1 ? ' hour' : ' hours');
  if (q.type === 'permission') return ({ allowed: 'Allowed', denied: 'Not allowed', 'not now': 'Not now' })[v] || String(v);
  if (q.id === 'theme') return ({ light: 'Light', dark: 'Dark', system: 'System' })[v] || String(v);
  return String(v);
}
const shortName = q => SHORT[q.id] || plain(q.text).split(' ').slice(0, 3).join(' ');

/* ---------- the overview ---------- */
const ov = el('div', 'ov'); ov.id = 'overview'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Your answers');
screen.appendChild(ov);
let cardZoom = null;
const ZOOM = { duration: 460, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' };
function openOverview() {
  paintOverview(); ov.hidden = false; ov.classList.remove('on'); void ov.offsetWidth; ov.classList.add('on');
  cardZoom && cardZoom.cancel();
  cardZoom = card.animate([{ transform: 'none', opacity: 1, filter: 'blur(0)' }, { transform: 'scale(.84)', opacity: 0, filter: 'blur(6px)' }], ZOOM);
  $('#backBtn').hidden = true; editBar.hidden = true;
  const here = ov.querySelector('.ov-row.here'); if (here) here.scrollIntoView({ block: 'center' }); else ov.querySelector('.ov-list').scrollTop = 0;
}
function closeOverview() {
  ov.classList.remove('on'); setTimeout(() => { if (!ov.classList.contains('on')) ov.hidden = true; }, 420);
  if (cardZoom) { cardZoom.cancel(); cardZoom = card.animate([{ transform: 'scale(.84)', opacity: 0, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { ...ZOOM, fill: 'none' }); cardZoom = null; }
}
function editAt(qi) {
  if (!editMode) hist = [];                                         // a fresh trail for this round of edits
  editMode = true; if (idx !== qi) hist.push(idx); idx = qi; build(); closeOverview();
}
function paintOverview() {
  ov.innerHTML = '';
  const head = el('div', 'ov-head'); head.append(el('h2', null, 'Your answers'), el('p', null, 'Tap any answer to change it.'));
  const list = el('div', 'ov-list');
  let ch = -1, group = null;
  Q.forEach((q, i) => {
    if (!editable(i)) return;
    if (q.ch !== ch) { ch = q.ch; group = el('section', 'ov-ch'); group.style.setProperty('--cc', CH[ch] ? CH[ch].c : BRAND.purple);
      group.appendChild(el('h3', null, CH[ch] && ch ? 'Chapter ' + ch + ' — ' + CH[ch].name : CH[ch] ? 'Getting started' : 'After the reveal')); list.appendChild(group); }
    const a = answerText(q), r = el('button', 'ov-row' + (editMode && i === idx ? ' here' : '')); r.type = 'button';
    const txt = el('span', 'ov-txt'); txt.append(el('span', 'ov-q', plain(q.text)), el('span', 'ov-a' + (a ? '' : ' none'), a || 'Not answered'));
    r.innerHTML = CHEV; r.prepend(txt); r.addEventListener('click', () => editAt(i)); group.appendChild(r);
  });
  const foot = el('div', 'ov-foot'), done = el('button', 'cta', 'Done'); done.type = 'button';
  done.addEventListener('click', () => { editMode = false; hist = []; idx = Q.findIndex(q => q.end); build(); closeOverview(); });
  foot.appendChild(done); ov.append(head, list, foot);
}

/* ---------- Edit answers: straight to the first question, with the track and the grid button ---------- */
function startEdit() {
  hist = [idx]; editMode = true; idx = Q.findIndex((q, i) => editable(i)); show();
}

/* ---------- the track under the card: the same drag-and-snap track as the scale questions, one point per question.
   It looks different on purpose (thin frosted pill, dots in chapter colours, the question's name in a bubble while dragging)
   so it never reads as an answer. Shown in edit mode, or all through the onboarding with the "Always" design alternative,
   where it only reaches back to questions already answered. ---------- */
const editBar = el('div', 'editbar'); editBar.hidden = true;
const zoomBtn = el('button', 'eb-zoom'); zoomBtn.type = 'button'; zoomBtn.innerHTML = GRID; zoomBtn.setAttribute('aria-label', 'All answers');
const navWrap = el('div', 'eb-nav'), tip = el('span', 'eb-tip');
editBar.append(zoomBtn, navWrap, tip); screen.appendChild(editBar);
zoomBtn.addEventListener('click', openOverview);
let navKeys = '', navPos = -1, scrubFrom = null;   // scrubFrom: the question you were on when a drag started
// while dragging, the card shows the question under the knob straight away (no history, no slide); letting go keeps it
function scrubTo(qi) {
  if (scrubFrom == null) { scrubFrom = idx; screen.classList.add('scrubbing'); }
  const dir = qi > idx ? 1 : -1; idx = qi; build();
  fade.animate([{ opacity: 0.5, transform: 'translateX(' + dir * 10 + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 170, easing: 'cubic-bezier(.22,1,.36,1)' });
}
const chColour = q => CH[q.ch] ? CH[q.ch].c : BRAND.purple;
const navAlways = () => typeof ALT === 'object' && ALT.navtrack === 'always';
function paintEdit() {
  if (scrubFrom != null) return;                                        // mid-drag: leave the track alone
  if (idx < Q.length) furthest = Math.max(furthest, idx);
  const inApp = typeof appOn !== 'undefined' && appOn, q = idx < Q.length ? Q[idx] : null;
  const on = !inApp && !!q && (editMode ? editable(idx) : navAlways() && q.type !== 'intro' && q.type !== 'theme' && !q.end && Q.slice(0, idx + 1).some((x, i) => editable(i) && x.type !== 'theme'));
  const was = !editBar.hidden;
  editBar.hidden = !on; screen.classList.toggle('editing', on); if (!on) return;
  if (!was) { editBar.classList.remove('pop'); void editBar.offsetWidth; editBar.classList.add('pop'); }   // springs up each time it appears
  zoomBtn.hidden = !editMode;                                           // the overview belongs to Edit answers
  const list = Q.map((x, i) => i).filter(i => editable(i) && (editMode || Q[i].type !== 'theme'));   // Always mode starts after the light/dark card
  let pos = 0; list.forEach((qi, k) => { if (qi <= idx) pos = k; });  // on a fact or chapter card: the last question before it
  const keys = list.join(',') + '|' + editMode + '|' + furthest;
  if (keys === navKeys && pos === navPos) return;                       // the knob is already there (it was just dragged)
  navKeys = keys; navPos = pos; navWrap.innerHTML = '';
  const N = list.length, locked = i => !editMode && list[i] > furthest;
  let knob = null;
  const showTip = i => { const x = Q[list[i]]; tip.textContent = shortName(x) + (locked(i) ? ' · not yet' : ''); tip.style.setProperty('--cc', chColour(x));
    if (knob) { tip.style.left = (navWrap.offsetLeft + parseFloat(knob.style.left || 0)) + 'px'; knob.style.setProperty('--kc', chColour(x)); } };
  let last = N - 1; while (last > 0 && locked(last)) last--;          // the wall: the furthest question answered
  const track = makeTrack({ points: N, value: N > 1 ? pos / (N - 1) : 0, label: 'Go to question', limit: last < N - 1 && N > 1 ? last / (N - 1) : null,
    onChange: i => { showTip(i);
      if (track && track.classList.contains('dragging')) { tip.classList.add('on'); let j = i; while (j > 0 && locked(j)) j--;                          // past what's answered: show the furthest reached
        if (list[j] !== idx) scrubTo(list[j]); } },
    onSettle: i => { setTimeout(() => tip.classList.remove('on'), 500);
      const from = scrubFrom; scrubFrom = null; screen.classList.remove('scrubbing');
      if (locked(i)) { if (from != null && idx !== from) { idx = from; build(); } navPos = -1; paintEdit(); return; }   // not reached yet: back to where you were
      if (from != null) {                                               // a drag: the card already shows it; one step in the back trail
        if (list[i] !== idx) { idx = list[i]; build(); }
        if (idx !== from) hist.push(from);
        navPos = i; paintEdit(); return;
      }
      if (list[i] !== idx) { navPos = i; hist.push(idx); idx = list[i]; show(); } } });
  track.classList.add('navtrack', 'set');
  track.addEventListener('pointerdown', () => tip.classList.add('on'));
  navWrap.appendChild(track); knob = track.querySelector('.knob');
  track.querySelectorAll('.dot').forEach((d, i) => { d.style.setProperty('--dc', chColour(Q[list[i]])); d.classList.toggle('ahead', locked(i)); });
  knob.style.setProperty('--kc', chColour(Q[list[pos]]));
  requestAnimationFrame(() => showTip(pos));
}
