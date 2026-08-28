/*
 * Presenter View logic. Classic script (not a module), same file:// pattern
 * as app.js. See docs/superpowers/specs/2026-08-22-presenter-view-design.md.
 */

const PRESENTER_I18N = {
  nl: {
    presenterMode: 'Presentatieweergave', localTime: 'Lokale tijd', connected: 'Verbonden',
    disconnected: 'Niet verbonden',
    connectionHint: 'Open deze pagina via de Presentatieweergave (de Presenter View-knop of Shift+P), niet rechtstreeks.',
    slidePreviews: 'Slidevoorbeelden', nowVisible: 'Nu zichtbaar', currentSlide: 'Huidige slide',
    currentPreviewTitle: 'Voorbeeld van de huidige slide', upNext: 'Hierna', nextSlide: 'Volgende slide',
    nextPreviewTitle: 'Voorbeeld van de volgende slide', prepareOtherSlide: 'Andere slide klaarzetten?',
    restore: 'Herstel', skipOneSlide: 'Sla één slide over', onlyForYou: 'Alleen voor jou',
    speakerNotes: 'Sprekersnotities', timerLabel: 'Resterende tijd', start: 'Start', pause: 'Pauze', reset: 'Reset',
    display: 'Weergave',
    displayOptions: 'Weergaveopties', leftSidebar: 'Linker zijbalk', rightSidebar: 'Rechter zijbalk',
    pauseScreen: 'Pauzescherm', contextOverlay: 'Context-overlay', presentationControls: 'Presentatiebediening',
    presentationTiming: 'Presentatietijd', timerControls: 'Timerbediening',
    setTimerDuration: 'Tijdsduur instellen (MM:SS of minuten), alleen als de timer niet loopt',
    previous: 'Vorige', next: 'Volgende', noNotes: 'Geen notities voor deze slide.',
    on: 'Aan', off: 'Uit', discoStillLabel: 'Dit ziet je publiek nu — een still, niet live',
  },
  en: {
    presenterMode: 'Presenter mode', localTime: 'Local time', connected: 'Connected',
    disconnected: 'Not connected',
    connectionHint: 'Open this page from Presentation View (the Presenter View button or Shift+P), not directly.',
    slidePreviews: 'Slide previews', nowVisible: 'Now showing', currentSlide: 'Current slide',
    currentPreviewTitle: 'Preview of the current slide', upNext: 'Up next', nextSlide: 'Next slide',
    nextPreviewTitle: 'Preview of the next slide', prepareOtherSlide: 'Prepare a different slide?',
    restore: 'Restore', skipOneSlide: 'Skip one slide', onlyForYou: 'Only for you',
    speakerNotes: 'Speaker notes', timerLabel: 'Time remaining', start: 'Start', pause: 'Pause', reset: 'Reset',
    display: 'Display',
    displayOptions: 'Display options', leftSidebar: 'Left sidebar', rightSidebar: 'Right sidebar',
    pauseScreen: 'Pause screen', contextOverlay: 'Context overlay', presentationControls: 'Presentation controls',
    presentationTiming: 'Presentation timing', timerControls: 'Timer controls',
    setTimerDuration: 'Set the duration (MM:SS or minutes) — only while the timer is not running',
    previous: 'Previous', next: 'Next', noNotes: 'No notes for this slide.',
    on: 'On', off: 'Off', discoStillLabel: 'This is what your audience sees now — a still, not live',
  },
};

let presenterLang;
let presenterText;

function applyPresenterLanguage() {
  presenterLang = String(CONFIG.lang || 'nl').toLowerCase().startsWith('en') ? 'en' : 'nl';
  presenterText = PRESENTER_I18N[presenterLang];
  document.documentElement.lang = presenterLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = presenterText[el.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', presenterText[el.dataset.i18nAriaLabel]);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = presenterText[el.dataset.i18nTitle];
  });
  document.getElementById('presenter-notes').dataset.emptyMessage = presenterText.noNotes;
}

applyPresenterLanguage();

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

// A reload of index.html can invalidate the previously cached WindowProxy in
// some browsers even though `window.opener` already points at the replacement
// document. Reacquire it before every outbound message so reconnecting is not
// limited to REQUEST_STATE while later commands still target the stale page.
function refreshPresentationRef() {
  if (window.opener && !window.opener.closed) presentationRef = window.opener;
  return presentationRef && !presentationRef.closed ? presentationRef : null;
}

const connectionBannerEl = document.getElementById('connection-banner');
const connectionStatusEl = document.querySelector('[data-connection-status]');

function setConnected(connected) {
  connectionBannerEl.setAttribute('data-connected', String(connected));
  connectionStatusEl.textContent = connected ? presenterText.connected : presenterText.disconnected;
}

function requestState() {
  const target = refreshPresentationRef();
  if (!target) {
    setConnected(false);
    return;
  }
  // targetOrigin '*' is deliberate: file:// pages have opaque origins, so
  // event.origin can't be checked meaningfully. Sender identity is verified
  // instead via e.source === presentationRef in the message listener below.
  target.postMessage({ type: 'command', command: 'REQUEST_STATE' }, '*');
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
  const target = refreshPresentationRef();
  if (!target) {
    setConnected(false);
    return;
  }
  // targetOrigin '*' is deliberate: see requestState() above for rationale.
  target.postMessage(Object.assign({ type: 'command', command }, extra), '*');
}

let pendingNextSlide = 1; // 0-based index; defaults to currentSlide + 1
let lastJumpOriginIndex = null;

function renderToggleState(buttonId, statusSelector, active) {
  const button = document.getElementById(buttonId);
  button.setAttribute('aria-pressed', String(active));
  document.querySelector(statusSelector).textContent = active ? presenterText.on : presenterText.off;
}

const discoStillEl = document.querySelector('[data-disco-still]');
const discoStillTitleEl = document.querySelector('[data-disco-still-title]');

// `lines` is app.js's discoTitleLines array (or null/undefined when no
// disco is currently up) — one <span> per line, same shape as app.js's own
// renderDiscoTitle(), but this is a still: it renders once per state
// broadcast, never animates.
function renderDiscoStill(lines) {
  discoStillEl.hidden = !lines;
  if (!lines) return;
  discoStillTitleEl.replaceChildren(
    ...lines.map((line) => {
      const span = document.createElement('span');
      span.textContent = line;
      return span;
    })
  );
}

function renderState(newState) {
  latestState = newState;
  // pendingNextSlide only ever diverges from currentSlide + 1 locally, via
  // the Sla over/Herstel buttons — neither of which triggers renderState().
  // So any real navigation arriving here (this call firing at all) means
  // whatever was staged has just been consumed or is now stale, and must
  // resync unconditionally. Resetting only when pendingNextSlide had fallen
  // behind (<= newState.currentSlide) missed the reverse case: going back
  // leaves it 2 slides ahead of the new position instead of 1, and the next
  // Volgende click then misreads that gap as a deliberate skip-jump and
  // jumps an extra slide instead of just advancing one.
  pendingNextSlide = newState.currentSlide + 1;
  presenterMainEl.hidden = false;
  document.querySelector('[data-current-slide]').textContent = String(newState.currentSlide + 1);
  document.querySelector('[data-total-slides]').textContent = String(newState.totalSlides);
  renderToggleState('btn-toggle-left-aside', '[data-left-aside]', newState.leftAsideVisible);
  renderToggleState('btn-toggle-right-aside', '[data-right-aside]', newState.rightAsideVisible);
  renderToggleState('btn-toggle-pause-overlay', '[data-pause-overlay]', newState.pauseOverlayVisible);
  renderToggleState('btn-toggle-context-overlay', '[data-context-overlay]', newState.contextOverlayVisible);
  renderDiscoStill(newState.discoTitleLines);
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);

  syncPreview(currentPreviewEl, newState.currentSlide, currentFlags());
  syncPreview(nextPreviewEl, pendingNextSlide, nextPreviewFlags());

  document.getElementById('presenter-notes').textContent = SLIDES[newState.currentSlide].notes || '';
}

/* ---------- Presentation timer (presenter-only; separate from the
 * existing countdown timer widget in app.js's right column) ----------
 * A countdown you set yourself — click the time to type a new duration —
 * instead of an up-counting elapsed clock. Timestamp-based (endAt), not a
 * per-second -1 counter, so background-tab throttling can't drift it;
 * matches app.js's own timer.remainingMs/endAt pattern. Persisted to
 * sessionStorage so a refresh of THIS tab keeps counting down correctly;
 * sessionStorage itself clears on a real close, so close+reopen correctly
 * starts fresh. */

const TIMER_STORAGE_KEY = 'presenterView.timer';
const DEFAULT_PRESENTER_TIMER_MS = CONFIG.timer.defaultMinutes * 60 * 1000;

function loadTimerState() {
  const fresh = { durationMs: DEFAULT_PRESENTER_TIMER_MS, remainingMs: DEFAULT_PRESENTER_TIMER_MS, running: false, endAt: null };
  try {
    const raw = sessionStorage.getItem(TIMER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed.durationMs !== 'number' || typeof parsed.remainingMs !== 'number') return fresh;
    if (!parsed.running || !parsed.endAt) return parsed;
    // Was still counting down when the tab last saved state — recompute
    // from endAt rather than trusting the stale remainingMs.
    const remainingMs = Math.max(0, parsed.endAt - Date.now());
    return { durationMs: parsed.durationMs, remainingMs, running: remainingMs > 0, endAt: remainingMs > 0 ? parsed.endAt : null };
  } catch {
    return fresh;
  }
}

function saveTimerState(state) {
  try {
    sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage write failed (storage disabled, quota exceeded, etc.) —
    // silently ignore, matching loadTimerState's error-handling style.
  }
}

let timerState = loadTimerState();
let presenterTimerIntervalId = null;
const elapsedInputEl = document.querySelector('[data-elapsed]');
const timerToggleBtn = document.getElementById('btn-presenter-timer-toggle');

function getRemainingSeconds() {
  return Math.ceil(timerState.remainingMs / 1000);
}

function renderTimerDisplay() {
  const totalSec = getRemainingSeconds();
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  elapsedInputEl.value = `${m}:${s}`;
}

// The duration can only be typed in while the countdown isn't running, so a
// stray click mid-talk can't derail it — pause or let it finish first. One
// button does both start and pause (like app.js's own timer toggle) — its
// label just reflects whichever action is next.
function updateTimerControlsUI() {
  elapsedInputEl.disabled = timerState.running;
  timerToggleBtn.textContent = timerState.running ? presenterText.pause : presenterText.start;
}

function toggleTimerRunning() {
  if (timerState.running) {
    pausePresenterTimer();
  } else {
    startPresenterTimer();
  }
}

function startPresenterTimer() {
  if (timerState.running || timerState.remainingMs <= 0) return;
  timerState = { ...timerState, running: true, endAt: Date.now() + timerState.remainingMs };
  saveTimerState(timerState);
  presenterTimerIntervalId = setInterval(presenterTimerTick, 250);
  updateTimerControlsUI();
}

function pausePresenterTimer() {
  if (!timerState.running) return;
  const remainingMs = Math.max(0, timerState.endAt - Date.now());
  timerState = { ...timerState, running: false, remainingMs, endAt: null };
  saveTimerState(timerState);
  clearInterval(presenterTimerIntervalId);
  presenterTimerIntervalId = null;
  updateTimerControlsUI();
  renderTimerDisplay();
}

// Restores the originally-typed duration rather than zeroing it — after a
// break, the presenter almost always wants to run the same countdown again,
// not retype it.
function resetPresenterTimer() {
  if (presenterTimerIntervalId) {
    clearInterval(presenterTimerIntervalId);
    presenterTimerIntervalId = null;
  }
  timerState = { durationMs: timerState.durationMs, remainingMs: timerState.durationMs, running: false, endAt: null };
  saveTimerState(timerState);
  updateTimerControlsUI();
  renderTimerDisplay();
}

function presenterTimerTick() {
  timerState.remainingMs = Math.max(0, timerState.endAt - Date.now());
  renderTimerDisplay();
  if (timerState.remainingMs <= 0) {
    clearInterval(presenterTimerIntervalId);
    presenterTimerIntervalId = null;
    timerState = { ...timerState, running: false, endAt: null };
    saveTimerState(timerState);
    updateTimerControlsUI();
  }
}

// Accepts "MM:SS" (matching the display) or a bare number of minutes (e.g.
// "20"), for typing convenience. Anything else is rejected rather than
// guessed at.
function parseDurationInput(raw) {
  const trimmed = raw.trim();
  if (/^\d+:\d{1,2}$/.test(trimmed)) {
    const [m, s] = trimmed.split(':').map(Number);
    if (s > 59) return null;
    return (m * 60 + s) * 1000;
  }
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 60 * 1000;
  return null;
}

function commitDurationEdit() {
  const parsedMs = parseDurationInput(elapsedInputEl.value);
  if (parsedMs === null || parsedMs <= 0) {
    renderTimerDisplay(); // invalid — revert to the current value
    return;
  }
  timerState = { durationMs: parsedMs, remainingMs: parsedMs, running: false, endAt: null };
  saveTimerState(timerState);
  renderTimerDisplay();
}

elapsedInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); elapsedInputEl.blur(); }
  if (e.key === 'Escape') { e.preventDefault(); renderTimerDisplay(); elapsedInputEl.blur(); }
});
elapsedInputEl.addEventListener('blur', commitDurationEdit);

timerToggleBtn.addEventListener('click', toggleTimerRunning);
document.getElementById('btn-presenter-timer-reset').addEventListener('click', resetPresenterTimer);

updateTimerControlsUI();
renderTimerDisplay();

function renderClock() {
  const now = new Date();
  document.querySelector('[data-clock]').textContent =
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
setInterval(renderClock, 250);
renderClock();

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
