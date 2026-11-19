'use strict';
/* the app build: this page is only the app. No prototype controls, no full-screen toggle, no phone frame.
   On a phone the screen fills the real display edge to edge; on a computer it sits in the middle at phone size. */
(function () {
  document.body.classList.add('app-mode');
  const S = window.screen;                                                   // window.screen: "screen" here is the app's own element
  const isPhone = () => Math.min(innerWidth, S.width) < 600;
  const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  /* iOS home-screen apps report innerHeight without the status bar at first (852 -> 793 on an iPhone 15),
     which left a strip at the bottom; opened from the icon, the real display size is the truth */
  const size = () => {
    let W = innerWidth, H = innerHeight;
    // opened from the icon, or no browser bars showing (the gap to the real display is only the status bar's height or less)
    if (isPhone() && (standalone() || Math.max(S.width, S.height) - Math.max(innerWidth, innerHeight) <= 64)) {
      const portrait = innerHeight >= innerWidth;
      const sw = portrait ? Math.min(S.width, S.height) : Math.max(S.width, S.height);
      const sh = portrait ? Math.max(S.width, S.height) : Math.min(S.width, S.height);
      W = sw; H = Math.max(H, sh, document.documentElement.clientHeight);
    }
    return [W, H];
  };
  let lastSize = [0, 0];
  fit = function () {
    const [W, H] = size(), root = document.documentElement.style;
    let f, h, ox = 0, oy = 0; lastSize = [W, H];
    if (isPhone()) {
      f = W / 390; h = H / f;                                               // fill the width; the design grows to the screen's height
      if (h < 760) { f = H / 760; h = 760; ox = (W - 390 * f) / 2; }        // very short screens: scale down whole instead
    } else {
      f = Math.min(1, (H - 40) / 844); h = 844; ox = (W - 390 * f) / 2; oy = (H - 844 * f) / 2;
    }
    root.setProperty('--fit', f.toFixed(4)); root.setProperty('--app-h', h.toFixed(1) + 'px');
    root.setProperty('--doc-h', H.toFixed(1) + 'px');
    root.setProperty('--ox', ox.toFixed(1) + 'px'); root.setProperty('--oy', oy.toFixed(1) + 'px');
    document.body.classList.toggle('app-desk', !isPhone());
  };
  const refit = () => { fit(); requestAnimationFrame(() => { if (typeof fitZone === 'function') fitZone(); }); };
  refit();
  ['orientationchange', 'pageshow'].forEach(e => addEventListener(e, () => setTimeout(refit, 60)));
  if (window.visualViewport) visualViewport.addEventListener('resize', refit);
  setTimeout(refit, 300); setTimeout(refit, 1000);                          // iOS settles its real size a beat after launch

  /* behave like an app, not a web page: no pinch zoom, no double-tap zoom, no page bounce */
  const stop = e => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(e => document.addEventListener(e, stop, { passive: false }));
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });

  /* size check: shown by itself for ten seconds when this build first opens (and on three quick taps near the top),
     so the phone's own numbers can be screenshotted. Tap the box to hide it. */
  const BUILD = '19.11 22:30';
  const measure = u => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:1px;visibility:hidden;height:' + u;
    document.body.appendChild(d); const h = Math.round(d.getBoundingClientRect().height); d.remove(); return h; };
  const envPx = side => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;visibility:hidden;padding-' + side + ':env(safe-area-inset-' + side + ')';
    document.body.appendChild(d); const v = parseFloat(getComputedStyle(d)['padding' + side[0].toUpperCase() + side.slice(1)]) || 0; d.remove(); return Math.round(v); };
  function showReadout() {
    let box = document.getElementById('sizeReadout'); if (box) { box.remove(); return; }
    box = document.createElement('pre'); box.id = 'sizeReadout';
    box.style.cssText = 'position:fixed;left:12px;top:140px;z-index:99999;margin:0;padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.85);color:#fff;font:13px/1.55 ui-monospace,monospace';
    const sc = document.getElementById('screen').getBoundingClientRect(), vv = window.visualViewport, bd = document.body.getBoundingClientRect();
    box.textContent = ['build ' + BUILD, 'app mode ' + standalone(), 'window ' + innerWidth + ' x ' + innerHeight, 'display ' + S.width + ' x ' + S.height,
      'page ' + document.documentElement.clientHeight + '   body ' + Math.round(bd.height), 'visual ' + (vv ? Math.round(vv.width) + ' x ' + Math.round(vv.height) : '-'),
      '100vh ' + measure('100vh') + '  lvh ' + measure('100lvh') + '  svh ' + measure('100svh') + '  dvh ' + measure('100dvh'),
      'safe top ' + envPx('top') + '  bottom ' + envPx('bottom'), 'used ' + lastSize.map(Math.round).join(' x '),
      'drawn ' + Math.round(sc.width) + ' x ' + Math.round(sc.height) + ' at ' + Math.round(sc.top), '(tap to hide)'].join('\n');
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
    setTimeout(() => box.isConnected && box.remove(), 10000);
  }
  let shownFor = null; try { shownFor = localStorage.getItem('pheno-readout'); } catch (e) {}
  if (isPhone() && shownFor !== BUILD) { setTimeout(showReadout, 1400); try { localStorage.setItem('pheno-readout', BUILD); } catch (e) {} }
  let taps = [];
  document.addEventListener('touchstart', e => {
    if (e.touches[0].clientY > 140) return; const t = Date.now(); taps = taps.filter(x => t - x < 700).concat(t); if (taps.length < 3) return; taps = [];
    showReadout();
  }, { passive: true });

  if (matchMedia('(hover: none)').matches || 'ontouchstart' in window) {
    /* iOS only shows pressed states (:active) when the page listens for touches */
    document.addEventListener('touchstart', () => {}, { passive: true });
    /* a tap leaves :hover stuck on a finger device (an option stays grey on the next card): drop hover styles */
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      const strip = list => { for (let i = list.length - 1; i >= 0; i--) { const r = list[i];
        if (r.cssRules && !r.selectorText) { strip(r.cssRules); continue; }
        if (!r.selectorText || !r.selectorText.includes(':hover')) continue;
        const keep = r.selectorText.split(',').filter(x => !x.includes(':hover'));
        if (keep.length) r.selectorText = keep.join(','); else (r.parentRule || sh).deleteRule(i); } };
      strip(rules);
    }
    /* swipe in from the left edge to go back a card, like any iPhone app */
    let sx = null, sy = 0;
    document.addEventListener('touchstart', e => { const t = e.touches[0]; sx = (e.touches.length === 1 && t.clientX < 28) ? t.clientX : null; sy = t.clientY; }, { passive: true });
    document.addEventListener('touchend', e => {
      if (sx == null) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy); sx = null;
      const back = document.getElementById('backBtn');
      if (dx > 70 && dy < 60 && back && !back.hidden) back.click();
    }, { passive: true });
  }
})();
