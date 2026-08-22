/*
 * Presenter View logic. Classic script (not a module), same file:// pattern
 * as app.js. See docs/superpowers/specs/2026-08-22-presenter-view-design.md.
 */

let presentationRef = window.opener || null;

const connectionBannerEl = document.getElementById('connection-banner');
const connectionStatusEl = document.querySelector('[data-connection-status]');

function setConnected(connected) {
  connectionBannerEl.setAttribute('data-connected', String(connected));
  connectionStatusEl.textContent = connected ? 'Verbonden' : 'Niet verbonden';
}

function requestState() {
  if (!presentationRef || presentationRef.closed) {
    setConnected(false);
    return;
  }
  // targetOrigin '*' is deliberate: file:// pages have opaque origins, so
  // event.origin can't be checked meaningfully. Sender identity is verified
  // instead via e.source === presentationRef in the message listener below.
  presentationRef.postMessage({ type: 'command', command: 'REQUEST_STATE' }, '*');
}

let latestState = null;
const presenterMainEl = document.getElementById('presenter-main');
const currentPreviewEl = document.getElementById('current-preview');
const nextPreviewEl = document.getElementById('next-preview');

// Drives one preview iframe (?embed=preview) to mirror a given slide index
// plus overlay/aside flags: a GO_TO_SLIDE command for the slide, and a
// preview-state snapshot for everything else. targetOrigin '*' matches the
// rationale in requestState()/sendCommand() above — file:// pages have
// opaque origins.
function syncPreview(iframeEl, slideIndex, flags) {
  const win = iframeEl.contentWindow;
  win.postMessage({ type: 'command', command: 'GO_TO_SLIDE', slide: slideIndex }, '*');
  win.postMessage(
    Object.assign({ type: 'preview-state', currentSlide: slideIndex }, flags),
    '*'
  );
}

// Overlay/aside flags for the most recent confirmed state, mirrored exactly
// onto the current-preview iframe (design doc §7: "de actuele-weergave-
// iframe krijgt exact de echte state gespiegeld, inclusief template-overlay
// en pauze-overlay, want het is letterlijk dezelfde rendering").
function currentFlags() {
  return {
    contextOverlayVisible: latestState.contextOverlayVisible,
    leftAsideVisible: latestState.leftAsideVisible,
    rightAsideVisible: latestState.rightAsideVisible,
    pauseOverlayVisible: latestState.pauseOverlayVisible,
  };
}

// The next-preview iframe shows a slide the audience hasn't actually
// reached yet, so it never shows an overlay that's only meaningful "on
// screen right now" — the design doc's §7 wording only promises an exact
// mirror for the current-preview iframe; the next-preview "wordt naar
// pendingNextSlide gestuurd" (just navigated there). Aside visibility is
// persistent presenter chrome rather than something tied to this instant,
// so that part still mirrors real state.
function nextPreviewFlags() {
  return Object.assign(currentFlags(), {
    contextOverlayVisible: false,
    pauseOverlayVisible: false,
  });
}

// A preview iframe's own app.js only starts listening for postMessage once
// its `load` fires (config.js/slides-data.js/app.js are plain, synchronous
// <script> tags, so by `load` its message listener is guaranteed
// registered). renderState()'s first syncPreview() call can otherwise race
// this — the iframe's `src` fetch/parse is still in flight when the first
// confirmed state arrives from the Presentation View — silently dropping
// that initial sync. Re-sending once `load` fires (using whatever state is
// latest by then) closes that window without needing any change on the
// preview side.
function resyncPreviewOnLoad(iframeEl, getSlideIndex, getFlags) {
  iframeEl.addEventListener('load', () => {
    if (!latestState) return;
    syncPreview(iframeEl, getSlideIndex(), getFlags());
  });
}
resyncPreviewOnLoad(currentPreviewEl, () => latestState.currentSlide, currentFlags);
resyncPreviewOnLoad(nextPreviewEl, () => pendingNextSlide, nextPreviewFlags);

function sendCommand(command, extra) {
  if (!presentationRef || presentationRef.closed) {
    setConnected(false);
    return;
  }
  // targetOrigin '*' is deliberate: see requestState() above for rationale.
  presentationRef.postMessage(Object.assign({ type: 'command', command }, extra), '*');
}

let pendingNextSlide = 1; // 0-based index; defaults to currentSlide + 1
let lastJumpOriginIndex = null;

function renderState(newState) {
  const isFirstState = latestState === null;
  latestState = newState;
  // Normalize pendingNextSlide before anything below reads it (the text
  // display and syncPreview() both need the up-to-date value, not the
  // previous render's stale one).
  if (isFirstState || pendingNextSlide <= newState.currentSlide) {
    pendingNextSlide = newState.currentSlide + 1;
  }
  presenterMainEl.hidden = false;
  document.querySelector('[data-current-slide]').textContent = String(newState.currentSlide + 1);
  document.querySelector('[data-total-slides]').textContent = String(newState.totalSlides);
  document.querySelector('[data-context-overlay]').textContent = newState.contextOverlayVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-left-aside]').textContent = newState.leftAsideVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-right-aside]').textContent = newState.rightAsideVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-pause-overlay]').textContent = newState.pauseOverlayVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);

  syncPreview(currentPreviewEl, newState.currentSlide, currentFlags());
  syncPreview(nextPreviewEl, pendingNextSlide, nextPreviewFlags());
}

window.addEventListener('message', (e) => {
  if (!presentationRef) return; // no opener at all — see §3 scenario 6
  if (e.source !== presentationRef) return;
  if (!e.data || e.data.type !== 'state') return;
  setConnected(true);
  renderState(e.data);
});

document.getElementById('btn-presenter-skip').addEventListener('click', () => {
  pendingNextSlide += 1;
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);
  if (!latestState) return;
  syncPreview(nextPreviewEl, pendingNextSlide, nextPreviewFlags());
});

document.getElementById('btn-presenter-herstel').addEventListener('click', () => {
  if (!latestState) return;
  pendingNextSlide = latestState.currentSlide + 1;
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);
  syncPreview(nextPreviewEl, pendingNextSlide, nextPreviewFlags());
});

document.getElementById('btn-presenter-next').addEventListener('click', () => {
  if (!latestState) return;
  const isSkipJump = pendingNextSlide !== latestState.currentSlide + 1;
  lastJumpOriginIndex = isSkipJump ? latestState.currentSlide : null;
  sendCommand('GO_TO_SLIDE', { slide: pendingNextSlide });
});

document.getElementById('btn-presenter-prev').addEventListener('click', () => {
  if (lastJumpOriginIndex !== null) {
    sendCommand('GO_TO_SLIDE', { slide: lastJumpOriginIndex });
    lastJumpOriginIndex = null;
  } else {
    sendCommand('PREVIOUS_SLIDE');
  }
});

document.getElementById('btn-presenter-goto').addEventListener('click', () => {
  const slide = Number(document.getElementById('presenter-goto-input').value) - 1;
  if (Number.isInteger(slide)) sendCommand('GO_TO_SLIDE', { slide });
});
document.getElementById('btn-toggle-context-overlay').addEventListener('click', () => sendCommand('TOGGLE_CONTEXT_OVERLAY'));
document.getElementById('btn-toggle-left-aside').addEventListener('click', () => sendCommand('TOGGLE_LEFT_ASIDE'));
document.getElementById('btn-toggle-right-aside').addEventListener('click', () => sendCommand('TOGGLE_RIGHT_ASIDE'));
document.getElementById('btn-toggle-pause-overlay').addEventListener('click', () => sendCommand('TOGGLE_PAUSE_OVERLAY'));

if (presentationRef) {
  requestState();
  window.addEventListener('focus', requestState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestState();
  });
} else {
  setConnected(false);
}
