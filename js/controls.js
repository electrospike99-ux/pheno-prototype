'use strict';
/* controls: back/help, restart, the bench beside the phone */
/* ================= back, help, restart, jumps, answers ================= */
$('#backBtn').addEventListener('click', () => { if (!hist.length) return; idx = hist.pop(); cameBack = true; show(); });
let helpOpen = false;
function openHelp() {
  const q = Q[idx]; if (!q || !WHY[q.id]) return;
  zone.querySelectorAll('.helpbox').forEach(x => x.remove());
  const box = el('div', 'helpbox'); box.setAttribute('role', 'note');
  box.append(el('span', 'k', 'Why we ask'), el('p', null, WHY[q.id]));
  zone.appendChild(box); void box.offsetWidth;
  helpOpen = true; zone.classList.add('helping'); card.classList.add('helping'); screen.classList.add('helping');
  $('#helpBtn').setAttribute('aria-expanded', 'true');
}
function closeHelp() {
  helpOpen = false; zone.classList.remove('helping'); card.classList.remove('helping'); screen.classList.remove('helping');
  $('#helpBtn').setAttribute('aria-expanded', 'false');
  const box = zone.querySelector('.helpbox'); if (box) setTimeout(() => { if (!helpOpen) box.remove(); }, 280);
}
$('#helpBtn').addEventListener('click', () => { if (!helpOpen) openHelp(); });
// while the card is open, any tap anywhere only closes it: nothing underneath (skip, back, options, sliders) reacts
['pointerdown', 'pointerup', 'mousedown', 'touchstart'].forEach(t => screen.addEventListener(t, e => { if (helpOpen) { e.stopPropagation(); if (e.cancelable && t !== 'touchstart') e.preventDefault(); } }, true));
screen.addEventListener('click', e => { if (!helpOpen) return; e.stopPropagation(); e.preventDefault(); closeHelp(); }, true);
document.addEventListener('keydown', e => { if (helpOpen && e.key === 'Escape') closeHelp(); });
function restart() { A = {}; hist = []; idx = 0; editMode = false; furthest = 0; if (typeof closeOverview === 'function' && !$('#overview').hidden) closeOverview(); theme = null; applyTheme(); logAnswers(); show(); }
$('#restartBtn').addEventListener('click', restart);
function paintPV() { document.querySelectorAll('[data-pv]').forEach(g => g.querySelectorAll('.jump').forEach(b => b.classList.toggle('here', b.dataset.v === PV[g.dataset.pv]))); }
document.querySelectorAll('[data-pv]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('.jump'); if (!b) return;
  PV[g.dataset.pv] = b.dataset.v; paintPV(); if (Q[idx] && (Q[idx].type === 'beat')) build(); else renderJumps(); }));
paintPV();
$('#toClosing').addEventListener('click', () => { hist.push(idx); idx = hasHistory() ? Q.findIndex(q => q.id === 'found') : Q.findIndex(q => q.id === 'standout'); show(); });
let themeAfter = false;
$('#themeOrder').addEventListener('click', e => { themeAfter = !themeAfter; placeTheme(themeAfter); e.currentTarget.textContent = 'Theme screen: ' + (themeAfter ? 'after the intro' : 'first'); restart(); });
function renderJumps() {
  const box = $('#chapters'); box.innerHTML = '';
  [...CH, CLOSING].forEach((c, n) => {
    const d = el('div', 'chap'); const t = el('div', 'ct'); const i = el('i'); i.style.setProperty('--cc', c.c); t.append(i, el('span', null, c === CLOSING ? c.name : 'Chapter ' + n + ' — ' + c.name)); d.appendChild(t);
    const j = el('div', 'jumps');
    Q.forEach((q, qi) => { if (q.ch !== n) return; const b = el('button', 'jump' + (qi === idx ? ' here' : '') + (visible(qi) ? '' : ' hidden-now'), q.type === 'chapter' ? 'chapter card' : q.id); b.type = 'button'; b.title = plain(q.text);
      b.addEventListener('click', () => { hist.push(idx); idx = qi; show(); }); if (typeof markJump === 'function') markJump(b, q); j.appendChild(b); });
    d.appendChild(j); box.appendChild(d);
  });
}
function logAnswers() {
  const keys = Object.keys(A);
  const lines = keys.map(k => k + ': ' + (typeof A[k] === 'object' ? JSON.stringify(A[k]) : A[k]));
  // the ISI-3 total from the stored scores (0 to 4 each, 0 = no problem), so the switch beside the phone can be checked against it
  const i3 = Q.filter(q => q.isi3).map(q => A[q.id]);
  if (i3.some(v => v !== undefined)) lines.push('ISI-3 total: ' + (i3.every(v => typeof v === 'number') ? i3.reduce((a, b) => a + b, 0) + ' of 12' : 'incomplete'));
  $('#answers').textContent = keys.length ? lines.join('\n') : 'Nothing answered yet.';
}

/* ================= fit the phone to the window ================= */
function fit() {
  if (document.body.classList.contains('fullphone')) {                  // full screen: the bare screen, as large as the window allows
    document.documentElement.style.setProperty('--fit', Math.min(innerWidth / 390, innerHeight / 844).toFixed(4)); return;
  }
  const narrow = innerWidth < 900;
  const f = narrow ? Math.min(1, (innerWidth - 32) / 410, innerHeight * 0.62 / 864) : Math.min(1, (innerHeight - 48) / 864);
  document.documentElement.style.setProperty('--fit', Math.max(0.35, f).toFixed(4));
}
addEventListener('resize', () => { fit(); fitZone(); }); fit();


