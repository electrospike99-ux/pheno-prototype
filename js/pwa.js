'use strict';
/* the iPhone app build: opens straight into the bare phone screen, fills the real screen edge to edge, and hides the
   prototype-only extras (the bench, the review marks, the way back to the bench). Not used on claude.ai. */
(function () {
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const small = Math.min(innerWidth, window.screen.width) < 600;   // window.screen: "screen" here is the phone element
  if (!(standalone || small)) return;                                  // on a computer it stays the full prototype page
  document.body.classList.add('app-mode');
  if (location.hash !== '#phone') { history.replaceState(null, '', location.pathname + location.search + '#phone'); dispatchEvent(new HashChangeEvent('hashchange')); }
  // fill the width; if the screen is taller than the design, the design grows to meet it, otherwise it scales down whole
  fit = function () {
    const f = innerWidth / 390, h = innerHeight / f;
    if (h >= 844) { document.documentElement.style.setProperty('--fit', f.toFixed(4)); document.documentElement.style.setProperty('--app-h', h.toFixed(1) + 'px'); }
    else { document.documentElement.style.setProperty('--fit', Math.min(f, innerHeight / 844).toFixed(4)); document.documentElement.style.setProperty('--app-h', '844px'); }
  };
  fit(); requestAnimationFrame(() => { if (typeof fitZone === 'function') fitZone(); });
})();
