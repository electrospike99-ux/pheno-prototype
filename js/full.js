'use strict';
/* full screen: hides the bench and the phone frame and scales the bare screen to fill the window, to try the prototype on a
   real phone. Also opens straight away from a link ending in #phone. The × in the corner (or Esc) brings the bench back. */
(function () {
  const open = el('button', 'fs-open'); open.type = 'button';
  open.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>Full screen';
  const close = el('button', 'fs-close'); close.type = 'button'; close.setAttribute('aria-label', 'Leave full screen');
  close.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8"/></svg>';
  document.body.append(open, close);
  const set = on => {
    document.body.classList.toggle('fullphone', on); fit(); requestAnimationFrame(() => { fitZone(); if (typeof fitQuestion === 'function') fitQuestion(); });
    if (on && location.hash !== '#phone') history.replaceState(null, '', '#phone');
    if (!on && location.hash === '#phone') history.replaceState(null, '', location.pathname + location.search);
  };
  open.addEventListener('click', () => {
    set(true);
    const d = document.documentElement;                                 // true full screen where the browser allows it (not on iPhone)
    try { const r = d.requestFullscreen && d.requestFullscreen({ navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  });
  close.addEventListener('click', () => { set(false); try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {} });
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('fullphone') && !document.querySelector('.tpick, .ll')) close.click(); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('fullphone')) set(false); });
  addEventListener('hashchange', () => set(location.hash === '#phone'));
  if (location.hash === '#phone') set(true);
})();
