const path = require('path');

// The presentation is opened directly via file:// in real use (no server) —
// tests do the same so they exercise the actual thing people run.
const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function gotoPresentation(page) {
  await page.goto(FILE_URL);
}

// Waits for any in-flight animateTransition()/beginPausedTransition()/
// resumePausedTransition() to finish, so a subsequent action doesn't get
// silently ignored by goTo()'s `if (animate && isAnimatingSlide) return;`
// guard. app.js is a classic script, so top-level `let isAnimatingSlide`
// is a global-scope binding, not a `window` property — reference it as a
// bare identifier here, not `window.isAnimatingSlide` (which is always
// undefined and would make this resolve immediately, uselessly).
async function waitIdle(page) {
  // eslint-disable-next-line no-undef
  await page.waitForFunction(() => typeof isAnimatingSlide !== 'undefined' && !isAnimatingSlide);
}

// Opens the Presenter View the same way a real presenter would: clicking
// the button in the Presentation View, which is what actually establishes
// the window.open()/postMessage relationship the spec's §2 relies on.
async function openPresenterView(page) {
  const popupPromise = page.waitForEvent('popup');
  await page.click('#btn-presenter-view');
  const popup = await popupPromise;
  await popup.waitForLoadState();
  return popup;
}

module.exports = { FILE_URL, gotoPresentation, waitIdle, openPresenterView };
