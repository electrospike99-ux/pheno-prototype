'use strict';
/* the app build: this page is only the app. No prototype controls, no full-screen toggle, no phone frame.
   On a phone the screen fills the real display edge to edge; on a computer it sits in the middle at phone size. */
(function () {
  document.body.classList.add('app-mode');
  const isPhone = () => Math.min(innerWidth, window.screen.width) < 600;      // window.screen: "screen" here is the app's own element
  fit = function () {
    const W = innerWidth, H = innerHeight, root = document.documentElement.style;
    let f, h, ox = 0, oy = 0;
    if (isPhone()) {
      f = W / 390; h = H / f;                                               // fill the width; the design grows to the screen's height
      if (h < 760) { f = H / 760; h = 760; ox = (W - 390 * f) / 2; }        // very short screens: scale down whole instead
    } else {
      f = Math.min(1, (H - 40) / 844); h = 844; ox = (W - 390 * f) / 2; oy = (H - 844 * f) / 2;
    }
    root.setProperty('--fit', f.toFixed(4)); root.setProperty('--app-h', h.toFixed(1) + 'px');
    root.setProperty('--ox', ox.toFixed(1) + 'px'); root.setProperty('--oy', oy.toFixed(1) + 'px');
    document.body.classList.toggle('app-desk', !isPhone());
  };
  fit(); requestAnimationFrame(() => { if (typeof fitZone === 'function') fitZone(); });
})();
