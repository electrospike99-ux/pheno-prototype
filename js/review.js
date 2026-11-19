'use strict';
/* review: a status per card (needs review: "?" when new, a magenta "!" once you've commented; approved; waiting), a one-line admin check, the review queue beside the phone,
   and a clean view. Saved in the artifact's database, collection "cards" (one document per card id). */
const RV_LABEL = { review: 'Needs review', approved: 'Approved', waiting: 'Waiting' };
const CLOCK = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.2 1.5"/></svg>';
const RV = {};                       // id -> { status, note, updated, comments: [{ text, kind, at }] }
let rvDb = null, rvState = 'loading', rvClean = false;
try { rvClean = localStorage.getItem('pheno-clean') === '1'; } catch (e) {}

const cardLabel = q => q.type === 'chapter' ? 'Chapter ' + q.ch + ' card' : q.id;
function rvOf(id) {
  if (!RV[id]) { const s = CARD_SEED[id] || ['approved', '']; RV[id] = { status: s[0], note: s[1], updated: null, comments: [], seeded: true }; }
  return RV[id];
}

/* ---------- marks: on the phone card and in the jump list ---------- */
// a card to review is "new" (yellow ?) until someone comments on it, then "commented" (magenta !)
// only your own comments count: once a card has been changed in reply (kind "fix"), it is new to review again
const TALK = ['comment', 'decline', 'fix'];                        // approvals and send-backs are logged too, but don't count here
const lastTalk = r => (r && r.comments || []).slice().reverse().find(c => TALK.includes(c.kind || 'comment'));
const hasNotes = r => { const last = lastTalk(r); return !!last && last.kind !== 'fix'; };
function markEl(status, commented) {
  if (status === 'review') { const m = el('span', 'rvm rv-review' + (commented ? ' rv-commented' : ''), commented ? '!' : '?'); m.title = commented ? 'Needs review · you left a comment' : 'Needs review · new'; return m; }
  if (status === 'waiting') { const m = el('span', 'rvm rv-waiting'); m.innerHTML = CLOCK; m.title = 'Waiting on someone else'; return m; }
  return null;
}
function markJump(b, q) { const r = rvOf(q.id), m = markEl(r.status, hasNotes(r)); if (m) { b.classList.add('flagged'); b.classList.toggle('commented', r.status === 'review' && hasNotes(r)); b.prepend(m); } }
function paintReview() {
  const mark = $('#rvMark'), note = $('#rvNote'), q = idx < Q.length ? Q[idx] : null;
  const r = q ? rvOf(q.id) : null;
  mark.innerHTML = ''; mark.className = 'rvmark';
  if (r && r.status !== 'approved') { mark.classList.add('rv-' + r.status);
    if (r.status === 'review') { const c = hasNotes(r); mark.classList.toggle('rv-commented', c); mark.textContent = c ? '!' : '?'; mark.title = c ? 'Needs review · you left a comment' : 'Needs review · new'; }
    else { mark.innerHTML = CLOCK; mark.title = RV_LABEL[r.status]; } }
  mark.hidden = rvClean || !r || r.status === 'approved';
  note.textContent = r && r.note ? 'Admin check: ' + r.note : '';
  note.hidden = rvClean || !r || !r.note;
  card.classList.toggle('has-rvnote', !note.hidden);
  // the whole note shows (no clamping); the buttons move up by however tall it is
  requestAnimationFrame(() => { card.style.setProperty('--rvnote-h', (note.hidden ? 0 : note.offsetHeight) + 'px'); if (typeof fitZone === 'function') fitZone(); });
}

/* ---------- saving ---------- */
const rvChain = {};
function rvSave(id) {
  const r = rvOf(id); r.updated = new Date().toISOString(); delete r.seeded;
  const q = Q.find(x => x.id === id);
  const body = { id, label: q ? cardLabel(q) + ' — ' + plain(q.text) : id, status: r.status, note: r.note, updated: r.updated, comments: r.comments };
  if (!rvDb) { rvMsg(rvState === 'off' ? 'Not saved: the database isn’t available in this view.' : 'Not saved yet: still connecting.'); return; }
  rvChain[id] = (rvChain[id] || Promise.resolve()).then(() => rvDb.doc('cards/' + id).set(body)).then(() => rvMsg(''), e => rvMsg('Couldn’t save (' + (e && e.code || 'error') + ').'));
}
function rvAct(id, kind, text) {
  const r = rvOf(id);
  if (text) r.comments = [...r.comments, { text, kind, at: new Date().toISOString() }];
  if (kind === 'approve') { r.status = 'approved'; r.comments = [...r.comments, { text: '', kind: 'approve', at: new Date().toISOString() }]; }   // logged, so it can be found and undone
  if (kind === 'reopen') { r.status = 'review'; r.comments = [...r.comments, { text: '', kind: 'reopen', at: new Date().toISOString() }]; }
  if (kind === 'decline') r.status = 'review';          // back in the queue, with the comment as what to change
  rvSave(id); rvRender();
}

/* ---------- the review queue panel ---------- */
function rvMsg(t) { const m = $('#rvMsg'); if (m) { m.textContent = t; m.hidden = !t; } }
/* ---------- a card's history: every comment and change, each tied to the version it was made on (or produced) ---------- */
const rvOpen = new Set();
let rvApprovedOpen = false;                                           // cards expanded in the queue (kept across redraws)
const rvWhen = at => { try { return new Date(at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
function rvVersions(r) {
  // version 1 is the card as first drafted; every change ("fix") makes the next one. A comment belongs to the version it was made on.
  let v = 1; const rows = (r.comments || []).map(c => { if (c.kind === 'fix') { v += 1; return { c, v, made: true }; } return { c, v, made: false }; });
  return { rows, latest: v };
}
function rvShowVersion(q, v, latest) {
  if (v === latest) { if (typeof showAfter === 'function') showAfter(q); else { hist.push(idx); idx = Q.indexOf(q); show(); } }
  else if (v === latest - 1 && typeof BEFORE === 'object' && BEFORE[q.id]) showBefore(q);
}
function rvHistory(q, r) {
  const wrap = el('div', 'rvhist'), inner = el('div', 'rvh-in'); wrap.appendChild(inner);
  const { rows, latest } = rvVersions(r);
  const canShow = v => v === latest || (v === latest - 1 && typeof BEFORE === 'object' && !!BEFORE[q.id]);
  const shown = () => (typeof viewBefore !== 'undefined' && viewBefore === q.id) ? latest - 1 : (idx === Q.indexOf(q) ? latest : 0);
  // the versions this card has had, newest first
  const vers = el('div', 'rvh-vers'); vers.appendChild(el('span', 'rvh-k', 'Versions'));
  for (let v = latest; v >= 1; v--) {
    const b = el('button', 'rvh-v' + (canShow(v) ? '' : ' gone'), 'v' + v + (v === latest ? ' · now' : v === 1 ? ' · first draft' : ''));
    b.type = 'button'; b.setAttribute('aria-pressed', String(shown() === v));
    if (canShow(v)) b.addEventListener('click', e => { e.stopPropagation(); rvShowVersion(q, v, latest); });
    else { b.disabled = true; b.title = 'This version wasn’t saved'; }
    vers.appendChild(b);
  }
  inner.appendChild(vers);
  if (!rows.length) inner.appendChild(el('p', 'rvh-none', 'No comments or changes yet.'));
  const ol = el('ol', 'rvh-list');
  rows.slice().reverse().forEach(({ c, v, made }) => {
    const li = el('li', 'rvh-item ' + (c.kind || 'comment'));
    const top = el('div', 'rvh-top');
    top.append(el('b', null, ({ fix: 'Changed', decline: 'You declined', approve: 'You approved', reopen: 'Sent back to review' })[c.kind] || 'You commented'), el('span', 'rvh-when', rvWhen(c.at)));
    const vb = el('button', 'rvh-tag' + (canShow(v) ? '' : ' gone'), (made ? 'made v' : 'on v') + v); vb.type = 'button';
    if (canShow(v)) { vb.title = 'Show v' + v + ' on the phone'; vb.addEventListener('click', e => { e.stopPropagation(); rvShowVersion(q, v, latest); }); }
    else { vb.disabled = true; vb.title = 'This version wasn’t saved'; }
    top.appendChild(vb);
    li.append(top); if (c.text) li.appendChild(el('p', null, c.text)); ol.appendChild(li);
  });
  if (rows.length) inner.appendChild(ol);
  return wrap;
}

function rvRender() {
  const list = $('#rvList'); if (!list) return;
  list.innerHTML = '';
  const flagged = Q.filter(q => rvOf(q.id).status === 'review');
  const waiting = Q.filter(q => rvOf(q.id).status === 'waiting');
  const noted = flagged.filter(q => hasNotes(rvOf(q.id))).length;
  $('#rvCount').textContent = flagged.length ? flagged.length + ' to review' + (noted ? ' · ' + noted + ' with comments' : '') : 'Nothing to review';
  flagged.forEach(q => {
    const r = rvOf(q.id), row = el('div', 'rvrow' + (hasNotes(r) ? ' commented' : '') + (rvOpen.has(q.id) ? ' open' : ''));
    const toggle = () => { rvOpen.has(q.id) ? rvOpen.delete(q.id) : rvOpen.add(q.id); row.classList.toggle('open', rvOpen.has(q.id)); };
    const head = el('button', 'rvname'); head.type = 'button'; head.title = 'Show this card on the phone';
    head.append(markEl('review', hasNotes(r)), el('b', null, cardLabel(q)), el('span', null, plain(q.text)));
    head.setAttribute('aria-expanded', String(rvOpen.has(q.id)));
    head.addEventListener('click', () => { toggle(); head.setAttribute('aria-expanded', String(rvOpen.has(q.id)));
      if (rvOpen.has(q.id)) { if (appOn) leaveApp(); if (idx !== Q.indexOf(q)) { hist.push(idx); idx = Q.indexOf(q); show(); } } });
    // a click anywhere else on the card that isn't a button or the comment box also opens and closes it
    row.addEventListener('click', e => { if (e.target.closest('button, textarea, input, a, .rvform')) return; head.click(); });
    row.appendChild(head);
    if (r.note) row.appendChild(el('p', 'rvnote-l', r.note));
    const last = lastTalk(r);
    if (last && last.kind === 'fix') { const prev = r.comments.slice(0, r.comments.lastIndexOf(last)).reverse().find(c => c.kind === 'comment' || c.kind === 'decline');
      if (prev) row.appendChild(el('p', 'rvlast was', 'You said: ' + prev.text)); }
    if (last) row.appendChild(el('p', 'rvlast ' + last.kind, (({ decline: 'Declined: ', fix: 'Changed: ' })[last.kind] || 'Comment: ') + last.text));
    if (typeof BEFORE === 'object' && BEFORE[q.id]) row.appendChild(baSwitch(q));
    const acts = el('div', 'rvacts'), form = el('div', 'rvform'); form.hidden = true;
    const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'What should change?';
    const ok = el('button', 'pbtn'), cancel = el('button', 'pbtn ghost', 'Cancel'); ok.type = cancel.type = 'button';
    form.append(ta, el('div', 'rvfbtns')); form.lastChild.append(ok, cancel);
    let mode = null;
    const open = m => { mode = m; form.hidden = false; ok.textContent = m === 'decline' ? 'Decline' : 'Save comment'; ta.placeholder = m === 'decline' ? 'What should change? (needed to decline)' : 'Your comment'; ta.focus(); };
    ok.addEventListener('click', () => { const t = ta.value.trim(); if (!t) { ta.focus(); return; } rvAct(q.id, mode, t); });
    cancel.addEventListener('click', () => { form.hidden = true; ta.value = ''; });
    [['Approve', () => rvAct(q.id, 'approve')], ['Comment', () => open('comment')], ['Decline', () => open('decline')]].forEach(([t, fn]) => {
      const b = el('button', 'pbtn' + (t === 'Approve' ? ' ok' : ''), t); b.type = 'button'; b.addEventListener('click', fn); acts.appendChild(b); });
    row.append(rvHistory(q, r), acts, form); list.appendChild(row);
  });
  // approved cards: kept here so an accidental Approve can be undone ("Back to review")
  const approved = Q.filter(q => rvOf(q.id).status === 'approved');
  const SEEDED = '2026-11-09T23:00';                                  // the first statuses, set when the queue was built
  const approvedAt = r => { const a = (r.comments || []).slice().reverse().find(c => c.kind === 'approve'); return a ? a.at : (r.updated && !String(r.updated).startsWith(SEEDED) ? r.updated : null); };
  const byYou = approved.filter(q => approvedAt(rvOf(q.id))).sort((a, b) => String(approvedAt(rvOf(b.id))).localeCompare(String(approvedAt(rvOf(a.id)))));
  const fromStart = approved.filter(q => !approvedAt(rvOf(q.id)));
  if (approved.length) {
    const det = el('details', 'rvapproved'); det.open = rvApprovedOpen; det.addEventListener('toggle', () => { rvApprovedOpen = det.open; });
    const sum = el('summary'); sum.append(el('span', 'rvok', '✓'), el('b', null, 'Approved'), el('span', 'rvacount', approved.length + (byYou.length ? ' · ' + byYou.length + ' by you' : '')));
    det.appendChild(sum);
    const line = (q, when) => {
      const row = el('div', 'rvarow'), name = el('button', 'rvaname'); name.type = 'button'; name.title = 'Show this card on the phone';
      name.append(el('b', null, cardLabel(q)), el('span', null, plain(q.text)));
      name.addEventListener('click', () => { if (appOn) leaveApp(); if (idx !== Q.indexOf(q)) { hist.push(idx); idx = Q.indexOf(q); show(); } });
      const back = el('button', 'pbtn small', 'Back to review'); back.type = 'button'; back.addEventListener('click', () => rvAct(q.id, 'reopen'));
      row.append(name, el('span', 'rvawhen', when ? rvWhen(when) : ''), back); return row;
    };
    if (byYou.length) { det.appendChild(el('p', 'rvagroup', 'Approved by you, newest first')); byYou.forEach(q => det.appendChild(line(q, approvedAt(rvOf(q.id))))); }
    if (fromStart.length) { det.appendChild(el('p', 'rvagroup', 'Approved from the start')); fromStart.forEach(q => det.appendChild(line(q, null))); }
    list.appendChild(det);
  }
  if (waiting.length) {
    const w = el('p', 'legend rvwait'); w.innerHTML = CLOCK; w.append(' Waiting on others: ' + waiting.map(cardLabel).join(', ') + '.'); list.appendChild(w);
  }
  renderJumps(); paintReview();
}
(function buildReviewPanel() {
  const block = el('div', 'block rvblock'); block.id = 'review';
  const h = el('div', 'rvhead'); h.append(el('h2', null, 'Review queue'), el('span', 'rvcount')); h.lastChild.id = 'rvCount';
  const clean = el('button', 'pbtn'); clean.type = 'button'; clean.id = 'cleanBtn';
  const paintClean = () => { clean.textContent = 'Clean view: ' + (rvClean ? 'on' : 'off'); clean.setAttribute('aria-pressed', String(rvClean)); document.body.classList.toggle('clean', rvClean); };
  clean.addEventListener('click', () => { rvClean = !rvClean; try { localStorage.setItem('pheno-clean', rvClean ? '1' : '0'); } catch (e) {} paintClean(); paintReview(); });
  h.appendChild(clean); paintClean();
  const msg = el('p', 'legend rvmsg'); msg.id = 'rvMsg'; msg.hidden = true;
  const list = el('div', 'rvlist'); list.id = 'rvList';
  block.append(h, list, msg, el('p', 'legend', 'A yellow “?” is new and needs your review. Once you comment on a card (or decline it with a comment) it turns magenta with a “!”. The clock means it’s waiting on someone else. Approve clears the mark. Clean view hides the marks on the phone.'));
  const bench = document.querySelector('.bench'); bench.insertBefore(block, bench.querySelector('.block'));
  // the marks on the phone card: a small badge at the top, the admin check at the bottom
  const mk = el('span', 'rvmark'); mk.id = 'rvMark'; mk.hidden = true;
  const nt = el('p', 'rvnote'); nt.id = 'rvNote'; nt.hidden = true;
  card.append(mk, nt);
})();

/* ---------- load saved statuses ---------- */
(async function loadReview() {
  const timer = setTimeout(() => { if (rvState === 'loading') rvMsg('Saved statuses can’t be reached yet; showing the defaults.'); }, 10000);
  try { rvDb = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { rvDb = null; }
  if (!rvDb) { clearTimeout(timer); rvState = 'off'; rvMsg('Statuses aren’t saved in this view (no database here); showing the defaults.'); return; }
  rvDb.collection('cards').onSnapshot(snap => {
    snap.docs.forEach(d => { const v = d.data(); if (!v) return; RV[d.id] = { status: RV_LABEL[v.status] ? v.status : 'review', note: typeof v.note === 'string' ? v.note : '', updated: v.updated || null, comments: Array.isArray(v.comments) ? v.comments.slice() : [] }; });
    if (!snap.metadata.fromCache) { clearTimeout(timer); rvState = 'live'; rvMsg(''); }
    rvRender();
  }, e => { clearTimeout(timer); rvState = 'off'; rvMsg('Saved statuses can’t be read (' + (e && e.code || 'error') + '); showing the defaults.'); });
})();
