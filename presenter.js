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
  presenterMainEl.hidden = false;
  document.querySelector('[data-current-slide]').textContent = String(newState.currentSlide + 1);
  document.querySelector('[data-total-slides]').textContent = String(newState.totalSlides);
  document.querySelector('[data-context-overlay]').textContent = newState.contextOverlayVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-left-aside]').textContent = newState.leftAsideVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-right-aside]').textContent = newState.rightAsideVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-pause-overlay]').textContent = newState.pauseOverlayVisible ? 'Aan' : 'Uit';
  if (isFirstState || pendingNextSlide <= newState.currentSlide) {
    pendingNextSlide = newState.currentSlide + 1;
  }
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);
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
});

document.getElementById('btn-presenter-herstel').addEventListener('click', () => {
  if (!latestState) return;
  pendingNextSlide = latestState.currentSlide + 1;
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);
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
