'use strict';
/* copy and questions: chapters, questions, closing-beat copy, "why we ask" cards */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/* ================= chapters (colours are placeholders, free to change) ================= */
const CH = [
  { name: 'Why are you here?', c: '#FF7A6B', desc: 'What brought you to us, so we know where to begin.' },
  { name: 'You',           c: '#12B5E6', desc: 'Let’s start with your fundamentals.' },
  { name: 'Your nights',   c: '#7B5CE6', note: 'Try to think about the last two weeks specifically', desc: ['This is a short questionnaire sleep clinicians use.', 'We didn’t invent it, we borrowed it.'], fine: true },   // fine: the lines sit small and italic just above Continue
  { name: 'Your rhythm',   c: '#18B39B', desc: 'Let’s see how you actually sleep at the moment.' },
  { name: 'Your days',     c: '#E35A9F', desc: 'Let’s see how your sleep and your personal life interact.' },
  { name: 'Your take',     c: '#E0A21A', desc: 'A little something we can come back to once we know more about your sleep.' },
  { name: 'Your data',     c: '#2F5DDB', desc: 'Let’s connect all your health apps and devices.' },
];

/* ================= questions: Notion, "Onboarding — Full Question List (Updated) 07.10.26" ================= */
const SEV = ['None', 'Mild', 'Moderate', 'Severe', 'Very Severe'];
const MUCH = ['None', 'A little', 'Somewhat', 'Much', 'Very Much'];
const Q = [
  { id: 'theme', ch: 0, type: 'theme', text: 'Light or dark?' },
  { id: 'intro', ch: 0, type: 'intro', text: 'Pheno' },
  { id: 'intent', ch: 0, type: 'single', opening: true, text: '**Why** are you here?',
    opts: ['My sleep isn’t working for me', 'I sleep fine, but I want to understand it better', 'I’m just curious about myself', 'I already track my sleep, I want a better read on it'] },
  // suggestion (design alternative, off by default): a card that answers whatever they chose, ties it to what Pheno is, and points to what comes next
  { id: 'intentReply', ch: 0, type: 'beat', text: 'Reply to “Why are you here?”', show: A => typeof ALT === 'object' && ALT.intentReply === 'on' && typeof A.intent === 'string' && A.intent !== 'skipped', render: w => renderIntentReply(w) },
  { id: 'dob', ch: 1, type: 'date', text: 'What’s your **date of birth**?', required: true },
  { id: 'ageSay', ch: 1, type: 'beat', auto: 1900, text: 'Your age', render: w => renderAgeSay(w) },   // no buttons: shows for about 2 seconds, then the age fact
  { id: 'ageFact', ch: 1, type: 'beat', text: 'Age fact', render: w => renderAgeFact(w) },   // draft
  { id: 'nights', ch: 1, type: 'beat', text: 'Nights slept', render: renderNights },
  { id: 'sex', ch: 1, type: 'single', text: 'What **sex** were you **assigned at birth**?', opts: ['Male', 'Female'], required: true },
  { id: 'hormone', ch: 1, type: 'multi', text: 'Do any of these **apply to you**?', sub: 'Select all that apply.', show: A => A.sex === 'Female' || A.sex === 'Male',
    disableFor: { Male: ['Pregnant', 'Breastfeeding', 'Perimenopause or menopause', 'Hormonal birth control'] },
    opts: ['Pregnant', 'Breastfeeding', 'Perimenopause or menopause', 'Hormonal birth control', 'Hormonal therapy'] },
  { id: 'hormoneType', ch: 1, type: 'multi', text: 'What **type** of hormone therapy?', show: A => (A.hormone || []).includes('Hormonal therapy'),
    opts: ['Testosterone', 'Estrogen', 'Anti-androgens', 'Progesterone', 'Other / not listed'] },
  // the ISI-3 (items 4, 5 and 7 of the full ISI): answer all three or the section is invalid; completing them unlocks the optional four
  { id: 'isiSatisfied', ch: 2, type: 'scale', isi: 1, isi3: true, pre: 'Think about the last two weeks', text: 'How **satisfied** or **dissatisfied** are you with your current **sleep pattern**?', opts: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
  { id: 'isiInterferes', ch: 2, type: 'scale', isi: 2, isi3: true, pre: 'Think about the last two weeks', text: 'How much does your sleep problem **interfere** with your **daily functioning** — energy, mood, concentration, work?', opts: MUCH },
  { id: 'isiWorried', ch: 2, type: 'scale', isi: 3, isi3: true, pre: 'Think about the last two weeks', text: 'How **worried** or **distressed** are you about your current sleep problem?', opts: MUCH },
  // the remaining four: optional; skipping any ends the section and they are discarded
  { id: 'isiFalling', ch: 2, type: 'scale', isi: 4, pre: 'Think about the last two weeks', text: 'How much difficulty do you currently have **falling asleep**?', opts: SEV },
  { id: 'isiStaying', ch: 2, type: 'scale', isi: 5, pre: 'Think about the last two weeks', text: 'How much difficulty do you currently have **staying asleep**?', opts: SEV },
  { id: 'isiEarly', ch: 2, type: 'scale', isi: 6, pre: 'Think about the last two weeks', text: 'How much of a problem is **waking up too early** and not being able to get back to sleep?', opts: SEV },
  { id: 'isiNoticeable', ch: 2, type: 'scale', isi: 7, pre: 'Think about the last two weeks', text: 'How **noticeable to others** do you think your sleeping problem is, in terms of impairing the **quality of your life**?', opts: ['Not at all noticeable', 'A little', 'Somewhat', 'Much', 'Very Much noticeable'] },
  // asked after the ISI so a diagnosis can't prime the severity answers
  { id: 'diag', ch: 2, type: 'single', text: 'Has a doctor ever **diagnosed** you with a **sleep-related condition**?', opts: ['Yes', 'No'] },
  { id: 'diagList', ch: 2, type: 'multi', text: '**Which** of these have you been **diagnosed** with?', show: A => A.diag === 'Yes',
    opts: ['Sleep apnea', 'Insomnia', 'Restless leg syndrome'],          // the three most common, under the search
    // the longer list behind "Search all conditions" (draft, for Sleep Science to confirm)
    more: ['Delayed sleep phase or circadian rhythm disorder', 'Advanced sleep phase disorder', 'Non-24-hour sleep–wake disorder', 'Irregular sleep–wake rhythm', 'Shift work sleep disorder', 'Narcolepsy',
      'Idiopathic hypersomnia', 'Kleine–Levin syndrome', 'Periodic limb movement disorder', 'Sleepwalking', 'Night terrors', 'Confusional arousals',
      'REM sleep behavior disorder', 'Nightmare disorder', 'Recurrent sleep paralysis', 'Sleep-related eating disorder', 'Teeth grinding (bruxism)',
      'Exploding head syndrome', 'Sleep-related groaning (catathrenia)', 'Obesity hypoventilation syndrome', 'Sleep-related leg cramps'] },
  { id: 'chrono', ch: 3, type: 'continuous', spectrum: true, text: 'Where do you think you **fall** on this **spectrum**?', sub: 'How early or late you think your body wants to fall asleep and wake up.', top: ['Early', 'Late'], anchors: ['“Early bird”', '“Night owl”'] },   // 0 = early bird, 1 = night owl
  { id: 'sched', ch: 3, type: 'dial', text: 'What is your **work sleep window**?', sub: 'When you typically go to bed and wake up on work or school days.', subShort: 'On work or school days.', days: true, toggle: 'My schedule varies week to week' },
  { id: 'ideal', ch: 3, type: 'dial', ghost: 'sched', text: 'If you could choose your **ideal sleep window**, what would it be?',
    extra: ['I don’t know, doesn’t matter to me', 'Whatever’s best for my body biologically'] },
  { id: 'jetlagFact', ch: 3, type: 'beat', text: 'Jet lag fact', render: w => renderJetlagFact(w) },   // draft
  { id: 'alarm', ch: 3, type: 'single', text: 'Currently, are you using an **alarm**?', opts: ['Work days only', 'Weekends only', 'Both on weekends and work days', 'Not at the moment'] },
  { id: 'intoxFact', ch: 3, type: 'beat', text: 'Mild intoxication fact', render: w => renderIntoxFact(w) },   // draft
  { id: 'toggleCard', ch: 3, type: 'beat', text: 'Toggle card', render: w => renderToggleCard(w) },          // placeholder
  { id: 'tz', ch: 4, type: 'single', text: 'In the last two weeks, have you **changed timezone**?', opts: ['Yes', 'No'] },
  { id: 'tzHours', ch: 4, type: 'wheel', text: 'How many **hours difference**?', show: A => A.tz === 'Yes' },
  { id: 'event', ch: 4, type: 'single', text: 'In the last week or so, has anything **significant happened** that could be **throwing off your sleep**, like a big change at work or something personal?',
    opts: ['Yes', 'No'] },
  { id: 'doze', ch: 4, type: 'scale', graded: true, text: 'Do you ever catch yourself **dozing off** when you didn’t mean to?', opts: ['Never', 'Rarely', 'Sometimes', 'Fairly often', 'Often'] },
  { id: 'sleepy', ch: 4, type: 'scale', graded: true, text: 'On an average day, how **sleepy** do you feel?', opts: ['Alert', 'Mostly alert', 'A little sleepy', 'Quite sleepy', 'Fighting sleep'] },
  { id: 'words', ch: 5, type: 'text', text: 'How would you **describe your own sleep**, in your own words?' },
  { id: 'privacy', ch: 6, type: 'beat', text: 'Privacy', render: w => renderPrivacy(w) },   // draft
  { id: 'perm1', ch: 6, type: 'permission', icon: 'health', tag: 'APPLE HEALTH', text: 'Connect Apple Health',
    body: 'We read your sleep, heart rate, and activity data from Apple Health — nothing leaves your phone without your say.', allow: 'Allow access' },
  // with Apple Health history: a short standalone card straight after the Apple Health step
  { id: 'watchBeat', ch: 6, type: 'beat', text: 'Watch beat', show: () => hasHistory(), render: renderWatchBeat },
  { id: 'perm2', ch: 6, type: 'permission', icon: 'watch', tag: 'YOUR WATCH', text: 'Keep your watch syncing',
    body: 'Make sure your watch is set to sync sleep data automatically — we’ll be checking this constantly.', allow: 'It’s set up' },
  { id: 'perm3', ch: 6, type: 'permission', icon: 'alarm', tag: 'OPTIONAL', text: 'Alarm access',
    body: 'This is an optional bonus feature — it helps us tell the difference between an alarm morning and a natural one, so you don’t have to tell us all the time.', allow: 'Allow' },
  // closing beats: not a chapter, so no chapter name
  { id: 'found', ch: 7, type: 'beat', text: 'Found something', show: () => hasHistory(), render: renderFound },
  { id: 'standout', ch: 7, type: 'beat', text: 'Transition', render: renderStandout },
  { id: 'reveal', ch: 7, type: 'beat', text: 'Reveal', render: w => renderReveal(w) },
  // only after the gap reveal
  { id: 'gapReason', ch: 7, type: 'single', text: 'Is there a **reason** for the **gap**?', show: A => A.revealCase === 'gap',
    opts: ['Work or study', 'Other people', 'A choice I make', 'Not sure'] },   // no “Prefer not to say”: the question can be skipped
  { id: 'timeline', ch: 7, type: 'beat', brand: true, tall: true, text: 'Your journey', render: w => renderTimeline(w) },   // static by default; draw-in is a design alternative
  { id: 'allset', ch: 7, type: 'beat', end: true, text: 'All set', render: w => w.appendChild(el('p', 'main', COPY.closing)) },   // footer: Enter Pheno / Edit answers
];
// chapter 0 has no separate card: it opens on the first question's card
for (let n = CH.length - 1; n >= 1; n--) { const i = Q.findIndex(q => q.ch === n && q.type !== 'intro' && q.type !== 'theme'); Q.splice(i, 0, { id: 'chapter' + n, ch: n, type: 'chapter', text: CH[n].name }); }
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const rich = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const plain = t => String(t).replace(/\*\*/g, '');
// short names for the answers strip in edit mode
const SHORT = { theme: 'Appearance', intent: 'Why you’re here', dob: 'Date of birth', sex: 'Sex', hormone: 'Hormones', hormoneType: 'Therapy type',
  isiSatisfied: 'Satisfaction', isiInterferes: 'Daily impact', isiWorried: 'Worry', isiFalling: 'Falling asleep', isiStaying: 'Staying asleep', isiEarly: 'Waking early',
  isiNoticeable: 'Noticeable', diag: 'Diagnosis', diagList: 'Conditions', chrono: 'Spectrum', sched: 'Work window', ideal: 'Ideal window', alarm: 'Alarm',
  tz: 'Timezone', tzHours: 'Hours difference', event: 'Recent event', doze: 'Dozing off', sleepy: 'Sleepiness', words: 'In your words', perm1: 'Apple Health',
  perm2: 'Watch sync', perm3: 'Alarm access', gapReason: 'Gap reason' };
const firstOfChapter = n => Q.findIndex(q => q.ch === n);

/* ================= closing beats: copy as given; anything unconfirmed is in [square brackets] ================= */
const BRAND = { amber: '#FFC93C', purple: '#99369C', blue: '#1E2B9A' };   // from the original home screen
const CLOSING = { name: 'Closing beats', c: '#8A8D98' };
const PV = { history: 'auto', tier: 'high', lean: 'auto' };          // prototype preview switches (outside the phone)
// prototype rule: history if forced on, or (auto) if Apple Health access was allowed
const hasHistory = () => PV.history === 'with' || (PV.history === 'auto' && A.perm1 === 'allowed');
const TIER_LINE = {
  low: '[You’ve only just started tracking your sleep, that’s giving us a first look, but we’re going to use it for extra context to your current sleep instead of replacing it.]',
  medium: '[You’ve been tracking your sleep for a while, that’s giving us something to work with, but we’re going to use it for extra context to your current sleep instead of replacing it.]',
  high: 'You’ve been tracking your sleep for a long time, that’s giving us a lot to work with, but we’re going to use it for extra context to your current sleep instead of replacing it.',
};
// reveal: four variants (middle, extreme, gap, fallback); extreme has a night owl and an early bird side. Rough draft, flagged.
const LEAN = {
  late: 'From your answers, we’re leaning towards you being a night owl.',
  early: 'From your answers, we’re leaning towards you being [an early bird].',
  middle: 'From your answers, we’re leaning towards you sitting somewhere in the middle, between a night owl and a morning person.',
  gap: '[From your answers, there’s a gap between when you go to bed and when you’d choose to.]',
  fallback: 'We don’t have a first guess about you yet. Your nights will start to show us.',
};
// prototype rule, not the real algorithm: a skipped slider, a timezone change or a recent event -> fallback;
// work bedtime and ideal bedtime 1.5 hours or more apart -> gap; otherwise the chronotype slider picks the side
const bedGap = () => { const s = A.sched, i = A.ideal; if (!(s && s.abs && i && i.abs)) return null; return ((i.bed - s.bed) % 24 + 36) % 24 - 12; };
function leanOf() {
  if (PV.lean !== 'auto') return PV.lean;
  const c = A.chrono;
  if (typeof c !== 'number' || A.tz === 'Yes' || A.event === 'Yes') return 'fallback';
  const g = bedGap(); if (g != null && Math.abs(g) >= 1.5) return 'gap';
  return c > 0.6 ? 'late' : c < 0.4 ? 'early' : 'middle';
}
// copy for the draft cards (wording from the brief, 09.11.26)
const COPY = {
  ageSay: ['So you’re', 'years old.'],   // the age card: the number sits large between the two lines
  ageTitle: 'Your body clock moves with age',   // draft title (17.11.26)
  ageFact: 'Your body clock runs **latest in your early twenties**. After that, it **drifts earlier** a little every year.',   // draft rewrite (19.11.26)
  jetlagFact: 'When you go to bed and when your body wants to go to bed don’t match, the effect is very similar to jet lag.',
  intoxFact: 'Right after waking from deep sleep, your thinking can be **as foggy as being slightly drunk**. It clears within minutes, so **hold off on big decisions** until it does.',   // draft reword (17.11.26)
  privacy: 'Everything you tell us stays yours. You can see your answers, change them, or delete them whenever you like.',
  // the journey ruler (from Auri's reference): [day, milestone, strong line]; day numbers are placeholders until Sleep Science confirms them
  timeline: [[33, 'First colour appears', true], [26, 'More sleep patterns identified', false], [21, 'First adjective appears', true], [11, 'First trend detected', false], [7, 'Sleep regularity established', true]],
  closing: 'All set up. Tomorrow morning, we’ll show you around the app, and you’ll do your first morning check-in.',
};
// review status per card, used until a saved status exists: approved unless listed. [status, admin check note]
// reply to "Why are you here?": [headline, body]; the headline echoes their reason, the body says what Pheno does about it (draft copy, 19.11.26)
const INTENT_REPLY = {
  'My sleep isn’t working for me': ['Then let’s **start with what’s actually going on**.',
    'Pheno won’t hand you a score or a quick fix. It learns how **you** sleep, night by night, so anything it suggests fits you.'],
  'I sleep fine, but I want to understand it better': ['Good sleepers **have patterns too**.',
    'Often the most interesting ones. Pheno is built to understand, not to judge: **no scores**, just a clearer picture of how you sleep.'],
  'I’m just curious about myself': ['Curiosity is **the right place to start**.',
    'Pheno gives you a sleep identity that **grows as it learns you**: a description that’s yours, not a number.'],
  'I already track my sleep, I want a better read on it': ['You’ve got the data. **We’ll help it mean something.**',
    'Pheno reads your nights alongside what you tell it, so the patterns say something about **you**, not the average sleeper.'],
};
const INTENT_NEXT = 'Next, a few questions about you. [About five minutes,] and you can skip anything you’d rather not share.';

const CARD_SEED = {
  intentReply: ['review', 'Suggestion, behind the “Reply to why you’re here” design alternative. Answers their choice, ties it to what Pheno is, and says what comes next. All copy is a freestyle draft.'],
  found: ['review', 'Still full of brackets and mock data: needs real copy and the real data behind the charts.'],
  reveal: ['review', 'Rough sketch of the four variants; a separate design task. The case rules are a prototype stand-in.'],
  allset: ['review', 'Now ends with Enter Pheno or Edit answers; Edit answers opens the overview of every answer.'],
  ageFact: ['review', 'Draft title added; now straight after the date of birth. Body text still to rework.'],
  nights: ['review', 'Laid out like the age card: the number large, splitting the two lines.'],
  ageSay: ['review', 'New card between the date of birth and the age fact. No buttons; moves on after about 2 seconds.'],
  chapter2: ['review', 'The questionnaire lines now sit small and italic just above Continue.'],
  chapter3: ['review', 'New description: “Let’s see how you actually sleep at the moment.”'],
  chapter4: ['review', 'New description: “Let’s see how your sleep and your personal life interact.”'],
  chrono: ['review', 'New helper line under the question.'],
  sched: ['review', 'Tap bedtime or wake-up to set it with the scroll wheel.'],
  ideal: ['approved', 'Tap bedtime or wake-up to set it with the scroll wheel, same as the work window.'],
  diagList: ['review', 'Search at the top, then the three most common. The longer list is a draft for Sleep Science to confirm.'],
  jetlagFact: ['review', 'Visual uses the person’s own work and ideal windows when both were answered.'],
  intoxFact: ['review', 'Draft reword with bold emphasis.'],
  toggleCard: ['waiting', 'Placeholder, waiting on Brainstorming and Sleep Science.'],
  privacy: ['review', 'Guillermo must confirm deletion and storage are true.'],
  gapReason: ['review', 'Waiting on Brainstorming and Sleep Science. Shown only after the gap reveal.'],
  timeline: ['review', 'Scrolls up by itself, each milestone pops in; a touch stops it. Restyled to Auri’s “Your journey” reference. Day numbers are placeholders, waiting on Sleep Science.'],
  perm1: ['approved', 'The Health sheet’s App Explanation text is still in brackets.'],
};
const SYNCED = { low: 24, medium: 180, high: 1140 };    // mock counts, follow the tier switch
function renderWatchBeat(w) {
  const N = SYNCED[PV.tier], num = el('strong', 'count', '0');
  const p1 = el('p', 'main'); p1.append('We pulled ', num, ' nights from your HealthKit history.');
  const p2 = el('p', 'main later', 'We’ll take a look at them while you finish up.');
  w.append(p1, p2);
  // bigger counts take longer to climb (about 1.1 s for 24, 1.8 s for 1,140); the second line arrives once it settles
  const dur = REDUCED ? 0 : 500 + 420 * Math.log10(Math.max(1, N)), t0 = performance.now() + 250;
  const tick = now => {
    if (!num.isConnected) return;
    const k = dur ? Math.min(1, Math.max(0, (now - t0) / dur)) : 1, e = 1 - Math.pow(1 - k, 3);
    num.textContent = Math.round(N * e).toLocaleString('en-GB');
    if (k < 1) requestAnimationFrame(tick); else { num.classList.add('done'); setTimeout(() => p2.classList.add('in'), REDUCED ? 0 : 280); }
  };
  requestAnimationFrame(tick);
}
// after date of birth: nights since birth, exact to today's date; "sleeper", "you" and "nights" in bold
function renderNights(w) {
  const d = A.dob || { d: 15, m: 5, y: 1995 }, now = new Date();
  const n = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.y, d.m, d.d)) / 864e5);   // whole days, safe across clock changes
  w.classList.add('agecard', 'nightscard', 'v2');
  const end = el('p', 'ag-l ag-end'); end.innerHTML = rich('Let’s find out what kind of **sleeper** they’ve made **you**.');
  w.append(el('p', 'ag-l', 'You’ve slept'), el('p', 'ag-n' + (n >= 10000 ? ' long' : ''), n.toLocaleString('en-GB')), el('p', 'ag-u', 'nights'), end);
}
// before (17.11.26): rounded to the nearest hundred, “about”, no bold
function renderNightsV1(w) {
  const d = A.dob || { d: 15, m: 5, y: 1995 };
  const n = Math.round((Date.now() - new Date(d.y, d.m, d.d).getTime()) / 864e5 / 100) * 100;
  // laid out like the age card: the number large in the chapter colour, splitting the two lines
  w.classList.add('agecard', 'nightscard');
  w.append(el('p', 'ag-l', 'You’ve slept about'), el('p', 'ag-n' + (n >= 10000 ? ' long' : ''), n.toLocaleString('en-GB')), el('p', 'ag-u', 'nights'),
    el('p', 'ag-l ag-end', 'Let’s find out what kind of sleeper they’ve made you.'));
}
// found card: two small charts of the (mock) pattern, weekdays in blue, weekend in amber
const MOCK_WEEK = { bed: [0.25, 0.4, 0.15, 0.5, 0.9, 1.8, 1.5], sleep: [6.6, 6.4, 6.8, 6.3, 6.5, 7.6, 7.4] };   // bedtime as hours after midnight; sleep in hours
const DAY_L = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], DAY_N = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function miniChart(kind) {
  const NS = 'http://www.w3.org/2000/svg', mk = (t, at, txt) => { const e = document.createElementNS(NS, t); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; return e; };
  const W = 140, H = 84, X0 = 22, base = 66, top = 8, colX = i => X0 + 6 + i * 16.5;
  const svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fchart', role: 'img' });
  const grid = (y, label) => { svg.appendChild(mk('line', { x1: X0, x2: W, y1: y, y2: y, class: 'fc-grid' })); svg.appendChild(mk('text', { x: 0, y: y + 3, class: 'fc-ax' }, label)); };
  if (kind === 'bed') {
    svg.setAttribute('aria-label', 'Bedtime by day of the week, mock data: later at the weekend');
    const y = h => base - (h + 0.5) / 2.5 * (base - top);                 // -0.5h (11:30 PM) at the bottom, 2h at the top: later is higher
    grid(y(0), '12a'); grid(y(2), '2a');
    MOCK_WEEK.bed.forEach((h, i) => { const c = mk('circle', { cx: colX(i), cy: y(h), r: 4.2, class: i > 4 ? 'fc-we' : 'fc-wk' }); c.appendChild(mk('title', {}, DAY_N[i] + ' · ' + fmt12(h))); svg.appendChild(c); });
  } else {
    svg.setAttribute('aria-label', 'Sleep length by day of the week, mock data: longer at the weekend');
    const y = h => base - h / 9 * (base - top);
    grid(y(7), '7h'); svg.appendChild(mk('line', { x1: X0, x2: W, y1: base, y2: base, class: 'fc-base' }));
    MOCK_WEEK.sleep.forEach((h, i) => { const x = colX(i) - 6, yt = y(h), r = 3;
      const b = mk('path', { d: 'M' + x + ' ' + base + 'V' + (yt + r) + 'q0 -' + r + ' ' + r + ' -' + r + 'h' + (12 - 2 * r) + 'q' + r + ' 0 ' + r + ' ' + r + 'V' + base + 'Z', class: i > 4 ? 'fc-we' : 'fc-wk' });
      const [hh, mm] = hm(h); b.appendChild(mk('title', {}, DAY_N[i] + ' · ' + hh + ' hr ' + mm + ' min')); svg.appendChild(b); });
  }
  DAY_L.forEach((d, i) => svg.appendChild(mk('text', { x: colX(i), y: H - 3, 'text-anchor': 'middle', class: 'fc-ax' }, d)));
  return svg;
}
function renderFound(w) {
  w.classList.add('found', 'found2');
  const box = el('div', 'fbox'), head = el('div', 'fhead');
  head.append(el('span', null, '[Average bedtime]'), el('em', null, '[mock data]'), el('b', null, '[12:40 AM]'));
  box.append(head, bedChart());
  w.append(box, el('p', 'main', '[One thing jumped out: your bedtime drifts later at the weekend.]'), el('p', 'side', TIER_LINE[PV.tier]));
}
// one week of bedtimes: dots on a soft line, the weekend picked out with an amber band (mock data)
function bedChart() {
  const NS = 'http://www.w3.org/2000/svg', mk = (t, at, txt) => { const e = document.createElementNS(NS, t); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; return e; };
  const W = 280, H = 132, base = 104, top = 22, colX = i => 22 + i * 39;
  const y = h => base - (h + 0.25) / 2.25 * (base - top);                 // 11:45 PM at the bottom, 2 AM at the top: later is higher
  const svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'bchart', role: 'img', 'aria-label': 'Bedtime each day of a week, mock data: later on Saturday and Sunday' });
  svg.appendChild(mk('rect', { x: colX(5) - 18, y: 4, width: 75, height: base - 4 + 16, rx: 14, class: 'bc-we' }));
  svg.appendChild(mk('text', { x: colX(5) + 19.5, y: 16, 'text-anchor': 'middle', class: 'bc-wel' }, 'Weekend'));
  [[0, '12 AM'], [1.5, '1:30 AM']].forEach(([h, l]) => { svg.appendChild(mk('line', { x1: 8, x2: W - 8, y1: y(h), y2: y(h), class: 'bc-grid' })); svg.appendChild(mk('text', { x: 8, y: y(h) - 4, class: 'bc-ax' }, l)); });
  svg.appendChild(mk('polyline', { points: MOCK_WEEK.bed.map((h, i) => colX(i) + ',' + y(h)).join(' '), class: 'bc-line' }));
  MOCK_WEEK.bed.forEach((h, i) => { const c = mk('circle', { cx: colX(i), cy: y(h), r: 6.5, class: i > 4 ? 'bc-dot we' : 'bc-dot' }); c.appendChild(mk('title', {}, DAY_N[i] + ' · ' + fmt12(h))); svg.appendChild(c); });
  DAY_L.forEach((d, i) => svg.appendChild(mk('text', { x: colX(i), y: H - 4, 'text-anchor': 'middle', class: 'bc-day' + (i > 4 ? ' we' : '') }, d)));
  return svg;
}
// before (12.11.26): two small charts, a legend, the long placeholder line
function renderFoundV1(w) {
  w.classList.add('found');
  const rc = el('div', 'recap');
  [['[Average bedtime]', '[12:40 AM]', 'bed'], ['[Average sleep]', '[6 hr 50 min]', 'sleep']].forEach(([k, v, kind]) => { const d = el('div'); d.append(el('span', null, k), el('b', null, v), miniChart(kind)); rc.appendChild(d); });
  const lg = el('div', 'fc-legend'); lg.append(el('i', 'wk'), 'Weekdays', el('i', 'we'), 'Weekend', el('em', null, '[mock data]'));
  w.append(rc, lg,
    el('p', 'main', '[We looked through your nights. One thing jumped out — [your bedtime drifts later on weekends]. It’s a real pattern. What it actually means is still an open question.]'),
    el('p', 'side', TIER_LINE[PV.tier]));
}
function renderStandout(w) { w.appendChild(el('p', 'main', hasHistory() ? 'One thing stood out during your setup too.' : 'One thing stood out during your setup.')); }
// renderReveal lives in drafts.js (it re-shows the person's own answer)

/* ================= "why we ask" cards (final card set, 01.10.26); follow-ups share their parent's card ================= */
const WHY = {
  intent: 'Without knowing this, we’d default to one generic tone for everyone — which usually means it’s wrong for the people actually dealing with something.',
  dob: 'Sleep composition changes a lot with age — so we need to know where you sit, to read your nights against research for your actual age group, not just the average person.',
  sex: 'Male and female differ slightly in things like deep sleep and insomnia rates — this helps calibrate your baseline correctly.',
  hormone: 'Each status changes sleep in real, documented ways — without this, a genuine shift in your sleep would just look unexplained in your data, rather than something we understand. For some, this also means telling us more precisely what’s going on.',
  diag: 'Some sleep conditions can look identical to ordinary disrupted sleep in the data alone — knowing this helps us tell a one-off from your actual baseline.',
  chrono: 'This one’s partly curiosity, partly useful — it tells us how well you already know your own rhythm. Long term, we want you to better understand your sleep, not just see it measured.',
  sched: 'This helps us tell the difference between ‘I slept badly’ and ‘this was as much as I was able to sleep, given my schedule.’',
  ideal: 'Not everyone has a clear sleep goal — but if yours matches what your body actually needs, that’s one of the most useful things you can tell us.',
  alarm: 'Alarms force your body out of sleep. Since we’re trying to understand how your body actually wants to sleep, we need to know if today was constrained by one, or not.',
  doze: 'This helps us understand how bad sleep actually affects you personally, not just what tends to happen to most people.',
  sleepy: 'Same idea as before, but a different way bad sleep can show up — some people notice one, some the other, some both.',
  tz: 'Jet lag is a silent disruptor — if we don’t know about it, your first few nights here could get read as meaningful, when they’re really just noise settling down.',
  event: 'Big changes — a new job, a loss, a move — can disrupt sleep for reasons that have nothing to do with your sleep itself. Without this, we might mistake a rough patch for your normal pattern.',
  words: 'We don’t analyze or score this now — we just hold onto it, to come back to once we actually know more about how you sleep.',
};
WHY.hormoneType = WHY.hormone; WHY.diagList = WHY.diag; WHY.tzHours = WHY.tz;

