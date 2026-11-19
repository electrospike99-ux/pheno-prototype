'use strict';
/* Two simpler versions of the sleep-window question (work window and ideal window), for the "Sleep window" switch
   beside the phone. Both collect exactly what the current dial collects: bedtime and wake time (stored the same way),
   the work days, "My schedule varies week to week", and on the ideal window its two extra answers.
     Simpler 1, "Two times": no clock. Two rows, a moon for bedtime and a sun for waking up; tap one to set it with the scroll wheel.
     Simpler 2, "Night bar": one bar from 6 PM to 2 PM the next day. Drag the moon (bedtime) or the sun (wake up); tap a time for the wheel.
   In both, the work days fold into one line ("Mon – Fri  Change"), and the work window shows on the ideal question as one plain line. */
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a8.5 8.5 0 1 0 10.9 10.9z"/></svg>';
const SUN = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
const DAY3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const subOf = q => (q.type === 'dial' && typeof ALT === 'object' && ALT.dialv && ALT.dialv !== 'now' && q.subShort) || q.sub;

function daysText(set) {
  const d = [...set].sort();
  if (!d.length) return 'No days picked';
  if (d.length === 7) return 'Every day';
  const run = d.every((x, i) => !i || x === d[i - 1] + 1);
  return run && d.length > 2 ? DAY3[d[0]] + ' – ' + DAY3[d[d.length - 1]] : d.map(x => DAY3[x]).join(', ');
}

// shared by both versions: starting values, the folded days line, the extra answers, the toggle, and saving
function dialParts(q) {
  const saved = v => v && typeof v === 'object' && v.abs ? v : null;
  const prev = saved(A[q.id]), ghost = q.ghost ? saved(A[q.ghost]) : null;
  const P = { q, prev, ghost, MIN: 1, MAX: 12, extra: typeof A[q.id] === 'string' ? A[q.id] : null, days: null, paints: [] };
  P.s = prev ? { bed: prev.bed, dur: Math.min(12, prev.dur) } : ghost ? { bed: ghost.bed, dur: Math.min(12, ghost.dur) } : { bed: 22.5, dur: 8 };
  P.paint = () => { P.s.bed = norm24(P.s.bed); P.s.dur = Math.min(P.MAX, Math.max(P.MIN, P.s.dur)); P.paints.forEach(f => f()); };
  // set one end; the other stays put if it can, otherwise the window keeps its length (same rule as the current dial's wheel)
  P.setEnd = (which, h) => {
    const s = P.s; P.extra = null;
    if (which === 'bed') { const d = norm24(s.bed + s.dur - h); if (d >= P.MIN && d <= P.MAX) s.dur = d; s.bed = h; }
    else { const d = norm24(h - s.bed); if (d >= P.MIN && d <= P.MAX) s.dur = d; else s.bed = norm24(h - s.dur); }
    P.paint();
  };
  P.durText = () => { const [dh, dm] = hm(P.s.dur); return dh + ' hr' + (dm ? ' ' + dm + ' min' : ''); };
  P.daysLine = () => {
    if (!q.days) return null;
    P.days = new Set(prev && prev.days ? prev.days : [0, 1, 2, 3, 4]);
    const box = el('div', 'dl-days'), line = el('div', 'dl-dline'), txt = el('span'), ch = el('button', 'dl-change', 'Change'); ch.type = 'button';
    line.append(el('span', 'k', 'Work days'), txt, ch);
    const row = el('div', 'sddays'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Work days'); row.hidden = true;
    DAYS.forEach((d, i) => { const b = el('button', 'sdday', d); b.type = 'button'; b.setAttribute('aria-label', DAY_NAMES[i]); b.setAttribute('aria-pressed', String(P.days.has(i)));
      b.addEventListener('click', () => { P.days.has(i) ? P.days.delete(i) : P.days.add(i); b.setAttribute('aria-pressed', String(P.days.has(i))); txt.textContent = daysText(P.days); }); row.appendChild(b); });
    ch.addEventListener('click', () => { row.hidden = !row.hidden; ch.textContent = row.hidden ? 'Change' : 'Done'; requestAnimationFrame(fitZone); });
    txt.textContent = daysText(P.days); box.append(line, row); return box;
  };
  P.ghostLine = () => P.ghost ? el('p', 'dl-ghost', 'Your work days: ' + fmt12(P.ghost.bed) + ' – ' + fmt12(P.ghost.bed + P.ghost.dur)) : null;
  P.extras = () => {
    if (!q.extra) return null;
    const chips = el('div', 'chips'), els = [];
    q.extra.forEach(t => { const c = el('button', 'chipo', t); c.type = 'button'; chips.appendChild(c); els.push(c);
      c.addEventListener('click', () => { P.extra = P.extra === t ? null : t; P.paint(); if (P.extra) glow(); }); });
    P.paints.push(() => els.forEach(c => c.setAttribute('aria-pressed', String(c.textContent === P.extra))));
    return chips;
  };
  P.finish = () => {
    if (q.toggle) {
      const r = el('div', 'togrow'); const t = el('button', 'ios'); t.type = 'button'; t.setAttribute('role', 'switch'); t.setAttribute('aria-label', q.toggle);
      t.setAttribute('aria-checked', String(!!A[q.id + 'Varies']));
      t.addEventListener('click', () => { const v = t.getAttribute('aria-checked') !== 'true'; t.setAttribute('aria-checked', String(v)); A[q.id + 'Varies'] = v; logAnswers(); });
      r.append(el('span', null, q.toggle), t); foot.appendChild(r);
    }
    footer({ cont: true, skip: true, onCont: () => {
      const s = P.s, v = { abs: true, bed: s.bed, dur: s.dur, from: fmt12(s.bed), to: fmt12(s.bed + s.dur) }; if (P.days) v.days = [...P.days].sort();
      answered(P.extra || v); glow(); advance(); } });
    P.paint();
  };
  return P;
}
const endIcon = which => { const i = el('span', 'dl-ico ' + which); i.innerHTML = which === 'bed' ? MOON : SUN; return i; };

/* ---------- Simpler 1: two times ---------- */
function buildDialTimes(q) {
  const P = dialParts(q), wrap = el('div', 'dl2');
  const days = P.daysLine(); if (days) wrap.appendChild(days);
  const list = el('div', 'dl2-list');
  const row = (which, label) => {
    const b = el('button', 'dl2-row'); b.type = 'button'; const v = el('b');
    b.append(endIcon(which), el('span', 'lab', label), v);
    b.addEventListener('click', () => openTimePicker(label, which === 'bed' ? P.s.bed : P.s.bed + P.s.dur, h => { P.setEnd(which, h); glow(); }));
    P.paints.push(() => { v.textContent = fmt12(which === 'bed' ? P.s.bed : P.s.bed + P.s.dur); b.setAttribute('aria-label', label + ', ' + v.textContent + '. Change'); });
    return b;
  };
  list.append(row('bed', 'Bedtime'), row('wake', 'Wake up')); wrap.appendChild(list);
  const dur = el('p', 'dl-dur'); wrap.appendChild(dur); P.paints.push(() => { dur.textContent = P.durText(); });
  const g = P.ghostLine(); if (g) wrap.appendChild(g);
  const ex = P.extras(); if (ex) wrap.appendChild(ex);
  P.paints.push(() => wrap.classList.toggle('off', !!P.extra));
  zone.appendChild(wrap); P.finish();
}

/* ---------- Simpler 2: night bar ---------- */
function buildDialBar(q) {
  const P = dialParts(q), wrap = el('div', 'dl3');
  const days = P.daysLine(); if (days) wrap.appendChild(days);
  const H0 = 18, SPAN = 20, STEP = 0.25;                                // 6 PM to 2 PM the next day
  const fx = h => Math.min(1, Math.max(0, norm24(h - H0) / SPAN));
  // the two times above the bar, each with its icon; tap for the scroll wheel
  const times = el('div', 'dl3-times');
  const timeBtn = (which, label) => { const b = el('button', 'dl3-t ' + which); b.type = 'button'; const v = el('b');
    const tx = el('span', 'tx'); tx.append(el('span', 'lab', label), v); b.append(endIcon(which), tx);   // label above the time
    b.addEventListener('click', () => openTimePicker(label, which === 'bed' ? P.s.bed : P.s.bed + P.s.dur, h => { P.setEnd(which, h); glow(); }));
    P.paints.push(() => { v.textContent = fmt12(which === 'bed' ? P.s.bed : P.s.bed + P.s.dur); }); return b; };
  times.append(timeBtn('bed', 'Bedtime'), timeBtn('wake', 'Wake up')); wrap.appendChild(times);
  const bar = el('div', 'dl3-bar'), fill = el('i', 'dl3-fill');
  const handle = (which, label) => { const h = el('span', 'dl3-h ' + which); h.innerHTML = which === 'bed' ? MOON : SUN; h.tabIndex = 0; h.setAttribute('role', 'slider'); h.setAttribute('aria-label', label); return h; };
  const hB = handle('bed', 'Bedtime'), hW = handle('wake', 'Wake up');
  bar.append(fill, hB, hW); wrap.appendChild(bar);
  const ax = el('div', 'dl3-ax'); [['6 PM', 0], ['12 AM', 6], ['6 AM', 12], ['12 PM', 18]].forEach(([t, h]) => { const s = el('span', null, t); s.style.left = (h / SPAN * 100) + '%'; ax.appendChild(s); }); wrap.appendChild(ax);
  const dur = el('p', 'dl-dur'); wrap.appendChild(dur);
  P.paints.push(() => {
    const a = fx(P.s.bed), b = fx(P.s.bed + P.s.dur), w = b >= a ? b - a : 1 - a;   // a window running past 2 PM is drawn to the edge
    fill.style.left = a * 100 + '%'; fill.style.width = w * 100 + '%';
    hB.style.left = a * 100 + '%'; hW.style.left = (b >= a ? b : 1) * 100 + '%';
    hB.setAttribute('aria-valuetext', fmt12(P.s.bed)); hW.setAttribute('aria-valuetext', fmt12(P.s.bed + P.s.dur));
    dur.textContent = P.durText(); wrap.classList.toggle('off', !!P.extra);
  });
  const hourAt = e => { const r = bar.getBoundingClientRect(); return snap(H0 + Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * SPAN, STEP); };
  const moveEnd = (which, h) => {                                       // dragging: the other end never moves; stop at 1 and 12 hours
    const s = P.s; P.extra = null;
    if (which === 'bed') { const d = norm24(s.bed + s.dur - h); if (d >= P.MIN && d <= P.MAX) { s.bed = h; s.dur = d; } }
    else { const d = norm24(h - s.bed); if (d >= P.MIN && d <= P.MAX) s.dur = d; }
    P.paint();
  };
  [[hB, 'bed'], [hW, 'wake']].forEach(([h, which]) => {
    h.addEventListener('pointerdown', e => { e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('drag');
      const mv = ev => moveEnd(which, hourAt(ev));
      const up = () => { h.classList.remove('drag'); h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); glow(); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up); });
    h.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if (!d) return;
      e.preventDefault(); moveEnd(which, (which === 'bed' ? P.s.bed : P.s.bed + P.s.dur) + d * STEP); });
  });
  const g = P.ghostLine(); if (g) wrap.appendChild(g);
  const ex = P.extras(); if (ex) wrap.appendChild(ex);
  zone.appendChild(wrap); P.finish();
}
