# iPhone home-screen app: screen size and touch notes

Written 20 Nov 2026 for whoever picks this up next. It covers what goes wrong when this prototype runs as a Home Screen web app on an iPhone, what was tried (with commits), what is confirmed and what is only inferred, and what is still worth trying.

**Short version:** with `apple-mobile-web-app-status-bar-style` set to `black-translucent`, iOS gives the page a window 59pt shorter than the display. Drawing full height then either leaves a 59pt band at the bottom or puts taps up to 59pt off, depending on whether the page is scrolled. With `default`, everything is correct but the status bar is a solid strip whose colour is fixed at launch. The build currently uses `default`. The launched Pheno app will be native Swift, where none of this applies.

## The device

All measurements are from Auri's iPhone (393 x 852 pt display, Dynamic Island), iOS 27.2.1, app opened from the Home Screen icon. They were read off the size readout built into the app (see "How to test" below).

| Reading | Value with `black-translucent` |
|---|---|
| `navigator.standalone` | true |
| `innerWidth x innerHeight` | 393 x **793** |
| `screen.width x screen.height` | 393 x **852** |
| `documentElement.clientHeight` | 793 |
| `visualViewport` | 393 x 793, offsetTop 0 |
| `100vh` / `100lvh` | **852** / **852** |
| `100svh` / `100dvh` | **793** / **793** |
| `env(safe-area-inset-top)` / `bottom` | 59 / 34 |
| Page scroll | 0 (pinned) |

793 = 852 - 59. The missing 59pt is exactly the status bar's safe area. The same thing was reported on iOS 26 (WebKit bugs [301108](https://bugs.webkit.org/show_bug.cgi?id=301108), [301994](https://bugs.webkit.org/show_bug.cgi?id=301994), [300523](https://bugs.webkit.org/show_bug.cgi?id=300523)) and is still present in 27.2.1.

## Where the code lives

- `index.html`: the iOS meta tags (`viewport` with `viewport-fit=cover`, `apple-mobile-web-app-status-bar-style`, `theme-color`), the manifest link, and a `?v=` version tag on every CSS and JS file for cache busting.
- `manifest.json`: `"display": "standalone"`, start URL `./#phone`.
- `js/pwa.js`: everything specific to the app build. That's sizing (`size()`, `fit()`, `underBar()`), page pinning, the status bar strip colour (`paintBar`), the size readout, the tap check, and touch behaviour (no zoom, no sticky hover, swipe-back).
- `css/pwa.css`: app-mode layout. The design is a fixed 390 x 844 phone screen (`.screen`), drawn with `position:fixed` and scaled with `transform: scale(var(--fit))` to the real width. `--app-h`, `--doc-h`, `--ox` and `--oy` come from `fit()`.

The rest (`js/screens.js`, `js/content.js` and so on) is the prototype itself, synced from the claude.ai artifact.

## What was tried, in order

### Stage 1: full screen, but taps drifted (before 19.11 22:25)

Commits `64b94e7`, `3228d04`, `d46b38a` and `56ac0cc`.

- `black-translucent` and `viewport-fit=cover`, so the app draws behind the status bar.
- `innerHeight` came back as 793, so `size()` replaced it with the display height whenever the app was standalone: `H = max(innerHeight, screen.height, clientHeight)` = 852.
- The page itself (`html`, `body`) was set to `position:fixed`, with height `--doc-h` = 852, because the tab bar was being clipped at 100%.
- **Result:** on some launches it looked fully edge to edge. Taps landed up to ~59pt off, so buttons felt unresponsive, and it got worse with use. On other launches the bottom 59pt was a white band.

### Stage 2: taps fixed, bottom cropped (`69c0f2f`, 19.11 22:25)

- The page could never scroll. `touchmove` called `preventDefault` unless the touch was inside a real scrolling element (option lists, scroll wheels, the journey ruler), checked by walking up the parents for `overflow: auto/scroll` with overflowing content. `scroll` and `visualViewport` `scroll` events reset the page to 0,0, and so did `touchend` and `focusout` (the keyboard closing).
- **Confirmed result:** with the tap check on, every dot landed exactly under the finger and buttons responded. But the app was cut off at 793pt, with a band below it.

### Why stages 1 and 2 conflict (inferred, not proven)

With `black-translucent`, iOS seems to treat the status bar area like collapsible browser chrome. The small and dynamic viewports (`svh`, `dvh`, `innerHeight`) are 793. The large viewport (`lvh`, `vh`) is 852. **The page is only painted in the 793pt window at its current scroll position.**

- Page document taller than the window and slightly scrolled (stage 1): the full height paints, but hit-testing uses the scrolled coordinates. That gives the tap offset.
- Page pinned at scroll 0 (stage 2): hit-testing is correct, but only 793pt paints. The band below is not the page: on a dark screen it is a flat colour with none of the page's background gradient.

### Stage 3: solid status bar strip (`f148026`, `4f0d628`, `e61fb97`, 19.11)

- `apple-mobile-web-app-status-bar-style` changed to `default`. The window is then the area below the status bar, and `innerHeight` matches what is painted.
- `fit()` hides the design's own 54px status-bar zone above the window (`--oy = -54 * fit`) and fills the rest.
- **This meta tag is read when the icon is added.** Changing it does nothing until the icon is deleted and added again. The first build after the change shifted the design up under the status bar on the old icon. `4f0d628` fixed that by measuring `env(safe-area-inset-top)` (`underBar()`) and only shifting when it is 0.
- Strip colour: `paintBar` sets `meta[name=theme-color]` and `body` background, and adds a 3px fixed bar at the very top (iOS 26.1 was reported to tint from fixed elements at the edges). All three follow the app's light/dark class immediately.
- **Result:** sizing is correct on every launch and taps are correct. **The strip colour does not change after launch:** it stays white even after switching to dark. The app always opens light, so the strip is white.

### Stage 4: re-test on iOS 27.2.1 (`fd6168d`, `969b6bd`, `71f786c`, 20.11)

- Switched back to `black-translucent` to see whether the iOS update fixed it. It didn't (numbers in the table above). Back to `default`.

## Current state (`71f786c`)

- `default` status bar, solid strip, white for the whole session.
- Sized from `innerHeight` / `visualViewport`; page pinned; taps correct.
- Size readout shows on the first launch of each new `BUILD` string in `pwa.js`. The tap check is switched off (`if (false)` in `pwa.js`).

## Still worth trying

None of these has been tested.

1. **`apple-mobile-web-app-status-bar-style: black`.** A black strip with white text. It's reliable but fixed: it would show above light screens too. This is the quickest fix if most testing is in dark mode.
2. **Size with CSS `lvh`, not `position:fixed`.** Under `black-translucent`, put the screen in normal flow (`position:absolute` or static) with `height: 100lvh`, keep the page pinned at scroll 0, and check whether the bottom 59pt now paints and taps stay correct. Stage 2 used fixed positioning; normal flow might be painted differently.
3. **Theme colour at launch.** If iOS reads `theme-color` once at launch, the app could remember the last theme and open in it, so the strip matches from the second launch. This only helps if the app itself also reopens in that theme (today it always starts light at the theme question).
4. **Without `viewport-fit=cover`.** Under `black-translucent`, check whether iOS then lays out 852 consistently.
5. **Report it to Apple** (Feedback Assistant), with the numbers in the table above.

**The real fix for the product is native.** A Swift/SwiftUI app controls the status bar area itself (`.ignoresSafeArea()`, or a `WKWebView` with `contentInsetAdjustmentBehavior = .never` if any screen is web content), and Apple Health access requires a native app anyway.

## How to test

- **Version tag:** after any change, bump the `?v=` tag on every file in `index.html` (search and replace). GitHub Pages caches HTML for about 10 minutes, and the Home Screen app also keeps old copies.
- **Status bar meta:** after changing `apple-mobile-web-app-status-bar-style`, delete the Home Screen icon and add it again from Safari. Opening the existing icon keeps the old setting.
- **Size readout:** change `BUILD` in `js/pwa.js`, and the readout opens by itself for 10 seconds on the first launch of that build. Three quick taps near the top also show it. It lists every number in the table above, plus whether the page starts under the status bar and the size the app was drawn at.
- **Tap check:** change `if (false)` back to the build condition in `js/pwa.js`. For a minute after launch, a pink dot shows where iOS registers each touch.
- **Locally:** Chrome's iPhone emulation does not reproduce the bug, because it has no standalone mode and no status bar safe area. Only a real iPhone, opened from the icon, shows it.
