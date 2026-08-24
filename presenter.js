/*
 * Presenter View logic. Classic script (not a module), same file:// pattern
 * as app.js. See docs/superpowers/specs/2026-08-22-presenter-view-design.md.
 */

/* ---------- Timing math ----------
 * See docs/superpowers/specs/2026-08-22-presenter-view-design.md §9:
 * plannedStartOfCurrentSlide = sum of duration of all slides BEFORE it;
 * scheduleDelta = elapsedMs/1000 - plannedStartOfCurrentSlide.
 * Negative = ahead of schedule, positive = behind. */

function configuredTotalMs() {
  return CONFIG.timer.defaultMinutes * 60 * 1000;
}

function averageSlideDurationSeconds() {
  return configuredTotalMs() / 1000 / SLIDES.length;
}

function plannedStartOfSlide(index) {
  let total = 0;
  for (let i = 0; i < index; i++) {
    const d = SLIDES[i].duration;
    total += typeof d === 'number' ? d : averageSlideDurationSeconds();
  }
  return total;
}

function scheduleDelta(elapsedSeconds, currentSlideIndex) {
  return elapsedSeconds - plannedStartOfSlide(currentSlideIndex);
}

// Actual sum of every slide's effective planned duration (explicit `duration`
// where set, averageSlideDurationSeconds() fallback share otherwise) —
// self-consistent with plannedStartOfSlide/scheduleDelta. Not the same as
// configuredTotalMs(), which is the raw config value used only as the basis
// for the fallback's even split (spec §9).
function totalPlannedMs() {
  return plannedStartOfSlide(SLIDES.length) * 1000;
}

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

// Keep the embedded presentation at its native 1280 x 800 canvas and scale
// that canvas to the responsive viewport around it. A transform on the
// iframe alone only changes its paint size, leaving an 800px layout box and
// creating the large gaps that the original Presenter View showed.
function resizePreview(iframeEl) {
  const viewport = iframeEl.parentElement;
  const scale = viewport.clientWidth / 1280;
  iframeEl.style.setProperty('--preview-scale', String(scale));
}

function resizePreviews() {
  resizePreview(currentPreviewEl);
  resizePreview(nextPreviewEl);
}

if (typeof ResizeObserver === 'function') {
  const previewResizeObserver = new ResizeObserver(resizePreviews);
  previewResizeObserver.observe(currentPreviewEl.parentElement);
  previewResizeObserver.observe(nextPreviewEl.parentElement);
} else {
  window.addEventListener('resize', resizePreviews);
}
requestAnimationFrame(resizePreviews);

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

function renderToggleState(buttonId, statusSelector, active) {
  const button = document.getElementById(buttonId);
  button.setAttribute('aria-pressed', String(active));
  document.querySelector(statusSelector).textContent = active ? 'Aan' : 'Uit';
}

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
  renderToggleState('btn-toggle-left-aside', '[data-left-aside]', newState.leftAsideVisible);
  renderToggleState('btn-toggle-right-aside', '[data-right-aside]', newState.rightAsideVisible);
  renderToggleState('btn-toggle-pause-overlay', '[data-pause-overlay]', newState.pauseOverlayVisible);
  renderToggleState('btn-toggle-context-overlay', '[data-context-overlay]', newState.contextOverlayVisible);
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);

  syncPreview(currentPreviewEl, newState.currentSlide, currentFlags());
  syncPreview(nextPreviewEl, pendingNextSlide, nextPreviewFlags());

  document.getElementById('presenter-notes').textContent = SLIDES[newState.currentSlide].notes || '';

  const slidesProgressPct = Math.round(((newState.currentSlide + 1) / newState.totalSlides) * 100);
  document.querySelector('[data-slides-progress]').textContent =
    `${newState.currentSlide + 1} / ${newState.totalSlides} (${slidesProgressPct}%)`;
  document.querySelector('[data-slides-progress-fill]').style.width = `${slidesProgressPct}%`;
  document.querySelector('[data-slides-progressbar]').setAttribute('aria-valuenow', String(slidesProgressPct));

  renderTiming();
}

// Schedule-delta and time-progress depend on the clock (elapsedSeconds), not
// just on the latest confirmed state, so this is called both from
// renderState() (on navigation) and from renderClockAndElapsed() (every
// 250ms) so the text keeps updating between navigations too.
function renderTiming() {
  if (!latestState) return;

  const elapsedSeconds = getElapsedSeconds();
  const delta = scheduleDelta(elapsedSeconds, latestState.currentSlide);
  const deltaAbsMin = Math.floor(Math.abs(delta) / 60);
  const deltaAbsSec = String(Math.abs(delta) % 60).padStart(2, '0');
  document.querySelector('[data-schedule-delta]').textContent =
    delta < 0
      ? `${deltaAbsMin}:${deltaAbsSec} voor op schema`
      : delta > 0
        ? `${deltaAbsMin}:${deltaAbsSec} achter op schema`
        : 'Op schema';

  const totalPlannedSeconds = totalPlannedMs() / 1000;
  const timeProgressPct = Math.min(100, Math.round((elapsedSeconds / totalPlannedSeconds) * 100));
  document.querySelector('[data-time-progress]').textContent = `${timeProgressPct}%`;
  document.querySelector('[data-time-progress-fill]').style.width = `${timeProgressPct}%`;
  document.querySelector('[data-time-progressbar]').setAttribute('aria-valuenow', String(timeProgressPct));
}

/* ---------- Presentation timer (presenter-only; separate from the
 * existing countdown timer widget in app.js's right column) ----------
 * Timestamp-based, not a per-second +1 counter, so browser throttling of
 * a backgrounded tab can't drift it — matches app.js's own timer pattern.
 * Persisted to sessionStorage so a refresh of THIS tab doesn't lose
 * elapsed time; sessionStorage itself clears on a real close, so
 * close+reopen correctly starts fresh (see spec §10). */

const TIMER_STORAGE_KEY = 'presenterView.timer';

function loadTimerState() {
  try {
    const raw = sessionStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return { accumulatedMs: 0, running: false, startEpoch: null };
    return JSON.parse(raw);
  } catch {
    return { accumulatedMs: 0, running: false, startEpoch: null };
  }
}

function saveTimerState(timerState) {
  try {
    sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
  } catch {
    // sessionStorage write failed (storage disabled, quota exceeded, etc.) —
    // silently ignore, matching loadTimerState's error-handling style.
  }
}

let timerState = loadTimerState();

function getElapsedSeconds() {
  const runningMs = timerState.running ? Date.now() - timerState.startEpoch : 0;
  return Math.floor((timerState.accumulatedMs + runningMs) / 1000);
}

function startPresenterTimer() {
  if (timerState.running) return;
  timerState = { accumulatedMs: timerState.accumulatedMs, running: true, startEpoch: Date.now() };
  saveTimerState(timerState);
}

function pausePresenterTimer() {
  if (!timerState.running) return;
  timerState = {
    accumulatedMs: timerState.accumulatedMs + (Date.now() - timerState.startEpoch),
    running: false,
    startEpoch: null,
  };
  saveTimerState(timerState);
}

function resetPresenterTimer() {
  timerState = { accumulatedMs: 0, running: false, startEpoch: null };
  saveTimerState(timerState);
}

document.getElementById('btn-presenter-timer-start').addEventListener('click', startPresenterTimer);
document.getElementById('btn-presenter-timer-pause').addEventListener('click', pausePresenterTimer);
document.getElementById('btn-presenter-timer-reset').addEventListener('click', resetPresenterTimer);

function renderClockAndElapsed() {
  const now = new Date();
  document.querySelector('[data-clock]').textContent =
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const elapsed = getElapsedSeconds();
  document.querySelector('[data-elapsed]').textContent =
    `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')} verstreken`;
  renderTiming();
}
setInterval(renderClockAndElapsed, 250);
renderClockAndElapsed();

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
  if (isSkipJump) {
    // Skip-jumps must land directly on pendingNextSlide with no intermediate
    // slides shown, so keep using GO_TO_SLIDE.
    sendCommand('GO_TO_SLIDE', { slide: pendingNextSlide });
  } else {
    // Ordinary one-step advance: use NEXT_SLIDE so the real goNext() plays
    // the normal transition/disco effect and can reach the finish overlay
    // on the last slide, exactly like the physical Next button.
    sendCommand('NEXT_SLIDE');
  }
});

document.getElementById('btn-presenter-prev').addEventListener('click', () => {
  if (lastJumpOriginIndex !== null) {
    sendCommand('GO_TO_SLIDE', { slide: lastJumpOriginIndex });
    lastJumpOriginIndex = null;
  } else {
    sendCommand('PREVIOUS_SLIDE');
  }
});

document.getElementById('btn-toggle-context-overlay').addEventListener('click', () => sendCommand('TOGGLE_CONTEXT_OVERLAY'));
document.getElementById('btn-toggle-left-aside').addEventListener('click', () => sendCommand('TOGGLE_LEFT_ASIDE'));
document.getElementById('btn-toggle-right-aside').addEventListener('click', () => sendCommand('TOGGLE_RIGHT_ASIDE'));
document.getElementById('btn-toggle-pause-overlay').addEventListener('click', () => sendCommand('TOGGLE_PAUSE_OVERLAY'));

// Mirror the Presentation View's arrow-key model in this window too:
// horizontal arrows navigate slides, ArrowDown opens the Presentatiebrief,
// and ArrowUp closes it. PageDown/PageUp keep common presentation clickers
// working while Presenter View has focus.
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    sendCommand('SHOW_CONTEXT_OVERLAY');
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    sendCommand('HIDE_CONTEXT_OVERLAY');
    return;
  }

  // Match the real Presentation View: while the Presentatiebrief is open,
  // left/right input belongs to that layer and must not change slides.
  if (latestState && latestState.contextOverlayVisible) return;

  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault();
    document.getElementById('btn-presenter-next').click();
    return;
  }

  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    document.getElementById('btn-presenter-prev').click();
  }
});

if (presentationRef) {
  requestState();
  window.addEventListener('focus', requestState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestState();
  });
} else {
  setConnected(false);
}
