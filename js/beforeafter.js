'use strict';
/* before / after: every card changed in reply to a review comment keeps its previous version here.
   The review queue shows a Before | After switch on those cards; Before rebuilds the card on the phone the old way
   (a "Before" tag sits on the card), After shows it as it is now. Add an entry here whenever a reviewed card changes. */
let viewBefore = null;
const setFor = (obj, key, val) => { const had = Object.prototype.hasOwnProperty.call(obj, key), old = obj[key]; obj[key] = val; return () => { if (had) obj[key] = old; else delete obj[key]; }; };
const qOf = id => Q.find(q => q.id === id);
const both = (...undos) => () => undos.reverse().forEach(u => u());

// the timeline before the "Your journey" ruler (09.11.26): five nodes on a line
const OLD_TIMELINE = ['Tonight, you finish setup.', 'Tomorrow morning, a short tour and your first morning check-in.', 'The first patterns start to show.',
  'We check our early guess about whether you’re a night owl or a morning person.', 'From then on it keeps sharpening.'];
function renderTimelineV1(w) {
  w.classList.add('tlwrap');
  const ol = el('ol', 'tl');
  OLD_TIMELINE.forEach((t, i) => { const li = el('li', i ? '' : 'now'); li.style.setProperty('--i', i); li.append(el('i', 'node'), el('span', null, t)); ol.appendChild(li); });
  w.appendChild(ol);
}

const BEFORE = {
  ageFact:    { apply: () => setFor(COPY, 'ageFact', 'On average, people drift towards earlier mornings as they get older. The shift starts around the early twenties.') },
  allset:     { apply: () => setFor(ALT, 'closingCol', 'grey') },
  chrono:     { apply: () => setFor(qOf('chrono'), 'sub', 'How early or late your body wants to fall asleep and wake up.') },
  found:      { apply: () => setFor(qOf('found'), 'render', renderFoundV1) },
  gapReason:  { apply: () => both(setFor(ALT, 'closingCol', 'grey'), setFor(qOf('gapReason'), 'opts', ['Work or study', 'Other people', 'A choice I make', 'Not sure', 'Prefer not to say'])) },
  intoxFact:  { apply: () => setFor(qOf('intoxFact'), 'render', renderIntoxFactV1) },
  jetlagFact: { apply: () => setFor(qOf('jetlagFact'), 'render', renderJetlagFactV1) },
  nights:     { apply: () => setFor(qOf('nights'), 'render', renderNightsV1) },
  timeline:   { apply: () => both(setFor(qOf('timeline'), 'render', renderTimelineV1), setFor(qOf('timeline'), 'tall', false)) },
};

function goToCard(q) {
  if (typeof appOn !== 'undefined' && appOn && typeof leaveApp === 'function') leaveApp();
  const qi = Q.indexOf(q); if (idx !== qi) { hist.push(idx); idx = qi; }
}
function showBefore(q) {
  goToCard(q);
  const undo = BEFORE[q.id].apply();
  try { build(); } finally { undo(); }                // the old version is drawn, then everything is put back straight away
  card.classList.add('before-view'); viewBefore = q.id; rvRender();
}
function showAfter(q) { goToCard(q); build(); rvRender(); }
function baSwitch(q) {
  const g = el('div', 'ba'); g.appendChild(el('span', 'ba-l', 'Compare'));
  [['before', 'Before'], ['after', 'After']].forEach(([k, label]) => {
    const on = (viewBefore === q.id) === (k === 'before') && (k === 'before' || idx === Q.indexOf(q));
    const b = el('button', 'ba-b', label); b.type = 'button'; b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', () => (k === 'before' ? showBefore(q) : showAfter(q))); g.appendChild(b);
  });
  return g;
}
