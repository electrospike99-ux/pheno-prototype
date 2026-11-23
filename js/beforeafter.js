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

// 20.11.26: each entry is the version just before the latest change
const BEFORE = {
  reveal:     { apply: () => { const keep = Object.assign({}, LEAN); Object.assign(LEAN, LEAN_V1); return () => Object.assign(LEAN, keep); } },
  schedDays:  { apply: () => setFor(qOf('schedDays'), 'noBlur', true) },
  ageFact:    { apply: () => setFor(COPY, 'ageFact', 'Your body clock runs **latest in your early twenties**. After that, it **drifts earlier** a little every year.') },
  allset:     { apply: () => setFor(COPY, 'closing', 'All set up. Tomorrow morning, we’ll show you around the app, and you’ll do your first morning check-in.') },
  chrono:     { apply: () => setFor(qOf('chrono'), 'sub', 'How early or late your body wants to fall asleep and wake up.') },
  found:      { apply: () => setFor(qOf('found'), 'render', renderFoundV1) },
  intoxFact:  { apply: () => both(setFor(qOf('intoxFact'), 'render', renderIntoxFactV2), setFor(DRUNK, 'blur', 1.35)) },
  jetlagFact: { apply: () => setFor(qOf('jetlagFact'), 'render', renderJetlagFactV3) },
  gapReason:  { apply: () => setFor(qOf('gapReason'), 'text', 'Is there a **reason** for the **gap**?') },
  sched:      { apply: () => both(setFor(qOf('sched'), 'text', 'What is your **work sleep window**?'), setFor(qOf('sched'), 'sub', 'When you typically go to bed and wake up on those days.')) },
  nights:     { apply: () => setFor(countUp, 'off', true) },
  timeline:   { apply: () => both(setFor(COPY, 'timeline', [[33, 'First colour appears', true], [26, 'More sleep patterns identified', false], [21, 'First adjective appears', true], [11, 'First trend detected', false], [7, 'Sleep regularity established', true]]), setFor(COPY, 'timelineNote', null)) },
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
