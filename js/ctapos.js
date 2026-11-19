'use strict';
/* The main button sits in the same spot on every card: where it is on the question cards.
   The secondary link (Skip for now, Not now, Start again) sits just under it; with no main button, it takes that same lower slot.
   Done by measuring after each build and giving the footer the bottom padding that lands the button there. */
const CTA_FROM_BOTTOM = 203;                 // the question cards' button top: 641 on an 844-high screen
const SKIP_BELOW = 64;                       // a 54px button, then the footer's 10px gap
function topIn(n) { let y = 0; while (n && n !== screen) { y += n.offsetTop; n = n.offsetParent; } return y; }
function alignCta() {
  if (!foot) return;
  foot.style.removeProperty('padding-bottom');
  if (typeof ALT === 'object' && ALT.ctaPos === 'card') { if (typeof fitZone === 'function') fitZone(); return; }
  const vis = s => [...foot.querySelectorAll(s)].find(x => !x.hidden && x.offsetParent);
  const cta = vis('.cta'), alt = cta ? null : vis('.skip');
  const target = cta || alt; if (!target) return;
  const want = screen.offsetHeight - CTA_FROM_BOTTOM + (cta ? 0 : SKIP_BELOW);
  const pb = parseFloat(getComputedStyle(foot).paddingBottom) || 0;
  let next = Math.max(0, pb + (topIn(target) - want));
  const note = document.getElementById('rvNote');                                   // the artifact's review note still needs its room
  if (card.classList.contains('has-rvnote') && note && note.offsetParent) next = Math.max(next, note.offsetHeight + 22);
  foot.style.setProperty('padding-bottom', next.toFixed(1) + 'px', 'important');
  if (typeof fitZone === 'function') fitZone();
}
(function () {
  const wrap = (name, after) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function () { const r = f.apply(this, arguments); after(); return r; }; };
  const later = () => { alignCta(); requestAnimationFrame(alignCta); [350, 900].forEach(t => setTimeout(alignCta, t)); };   // again once card size changes have finished
  wrap('build', later); wrap('buildEnd', later); wrap('paintReview', () => requestAnimationFrame(alignCta)); wrap('fit', later);
  // the chapter opening swaps its own Continue for the question's footer when it unfolds
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#foot')) setTimeout(alignCta, 30), setTimeout(alignCta, 800); }, true);
  addEventListener('resize', later);
})();
