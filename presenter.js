/*
 * Presenter View logic. Classic script (not a module), same file:// pattern
 * as app.js. See docs/superpowers/specs/2026-08-22-presenter-view-design.md.
 */

// Same notes-formatting logic as app.js's renderNotesHTML/inlineMarkdown —
// duplicated rather than shared because presenter.js and app.js are loaded
// as separate classic scripts with no shared module. Speaker notes use
// `- **Topic:** ...` bullets so the topic of each bullet stands out at a
// glance; see the .presenter-notes li > strong:first-child rule in
// presenter.css for the highlighted topic-label styling.
function presenterEscapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function presenterInlineMarkdown(str) {
  return presenterEscapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function renderPresenterNotesHTML(notesText) {
  return notesText
    .split(/```/)
    .map((chunk, i) => {
      if (i % 2 === 1) {
        return `<pre class="notes-code"><code>${presenterEscapeHtml(chunk.trim())}</code></pre>`;
      }
      return chunk
        .trim()
        .split(/\n\n+/)
        .filter(Boolean)
        .map((block) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length && lines.every((l) => /^[-*]\s/.test(l))) {
            return `<ul>${lines.map((l) => `<li>${presenterInlineMarkdown(l.replace(/^[-*]\s/, ''))}</li>`).join('')}</ul>`;
          }
          if (lines.length && lines.every((l) => /^\d+\.\s/.test(l))) {
            return `<ol>${lines.map((l) => `<li>${presenterInlineMarkdown(l.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>`;
          }
          return `<p>${presenterInlineMarkdown(block)}</p>`;
        })
        .join('');
    })
    .join('');
}

const PRESENTER_I18N = {
  nl: {
    presenterMode: 'Presentatieweergave', localTime: 'Lokale tijd', connected: 'Verbonden',
    disconnected: 'Niet verbonden',
    connectionHint: 'Open deze pagina via de Presentatieweergave (de Presenter View-knop of Shift+P), niet rechtstreeks.',
    slidePreviews: 'Slidevoorbeelden', nowVisible: 'Nu zichtbaar', currentSlide: 'Huidige slide',
    currentPreviewTitle: 'Voorbeeld van de huidige slide', upNext: 'Hierna', nextSlide: 'Volgende slide',
    nextPreviewTitle: 'Voorbeeld van de volgende slide', prepareOtherSlide: 'Andere slide klaarzetten?',
    restore: 'Herstel', skipOneSlide: 'Sla één slide over', onlyForYou: 'Alleen voor jou',
    speakerNotes: 'Sprekersnotities', elapsed: 'Resterend', start: 'Start', pause: 'Pauze', reset: 'Reset',
    displayOptions: 'Weergaveopties', leftSidebar: 'Linker zijbalk', rightSidebar: 'Rechter zijbalk',
    pauseScreen: 'Pauzescherm', contextOverlay: 'Context-overlay', presentationControls: 'Presentatiebediening',
    presentationTiming: 'Presentatietijd', timerControls: 'Timerbediening',
    previous: 'Vorige', next: 'Volgende', noNotes: 'Geen notities voor deze slide.',
    elapsedSuffix: 'resterend', setCountdownHint: 'Dubbelklik om het totaal aantal minuten opnieuw in te stellen',
    setCountdownPrompt: 'Nieuw totaal aantal minuten',
  },
  en: {
    presenterMode: 'Presenter mode', localTime: 'Local time', connected: 'Connected',
    disconnected: 'Not connected',
    connectionHint: 'Open this page from Presentation View (the Presenter View button or Shift+P), not directly.',
    slidePreviews: 'Slide previews', nowVisible: 'Now showing', currentSlide: 'Current slide',
    currentPreviewTitle: 'Preview of the current slide', upNext: 'Up next', nextSlide: 'Next slide',
    nextPreviewTitle: 'Preview of the next slide', prepareOtherSlide: 'Prepare a different slide?',
    restore: 'Restore', skipOneSlide: 'Skip one slide', onlyForYou: 'Only for you',
    speakerNotes: 'Speaker notes', elapsed: 'Remaining', start: 'Start', pause: 'Pause', reset: 'Reset',
    displayOptions: 'Display options', leftSidebar: 'Left sidebar', rightSidebar: 'Right sidebar',
    pauseScreen: 'Pause screen', contextOverlay: 'Context overlay', presentationControls: 'Presentation controls',
    presentationTiming: 'Presentation timing', timerControls: 'Timer controls',
    previous: 'Previous', next: 'Next', noNotes: 'No notes for this slide.',
    elapsedSuffix: 'remaining', setCountdownHint: 'Double-click to set a new total number of minutes',
    setCountdownPrompt: 'New total number of minutes',
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

// The pressed/unpressed state is communicated by the button's own color
// (see .btn--display-toggle[aria-pressed="true"] in presenter.css), not by
// a separate "Aan"/"Uit" text label.
function renderToggleState(buttonId, active) {
  document.getElementById(buttonId).setAttribute('aria-pressed', String(active));
}

function renderState(newState) {
  const isFirstState = latestState === null;
  const previousCurrentSlide = isFirstState ? null : latestState.currentSlide;
  latestState = newState;
  // Normalize pendingNextSlide before anything below reads it (the text
  // display and syncPreview() both need the up-to-date value, not the
  // previous render's stale one). Any actual navigation — forward, backward,
  // or a direct jump — invalidates a previously staged skip: pendingNextSlide
  // must track currentSlide + 1 again. Only compare against `pendingNextSlide
  // <= currentSlide` here would miss the backward case (going back leaves
  // pendingNextSlide stranded ahead of currentSlide + 1, so the next
  // "Volgende" click misreads it as a fresh skip and jumps too far).
  if (isFirstState || newState.currentSlide !== previousCurrentSlide) {
    pendingNextSlide = newState.currentSlide + 1;
  }
  presenterMainEl.hidden = false;
  document.querySelector('[data-current-slide]').textContent = String(newState.currentSlide + 1);
  document.querySelector('[data-total-slides]').textContent = String(newState.totalSlides);
  renderToggleState('btn-toggle-left-aside', newState.leftAsideVisible);
  renderToggleState('btn-toggle-right-aside', newState.rightAsideVisible);
  renderToggleState('btn-toggle-pause-overlay', newState.pauseOverlayVisible);
  renderToggleState('btn-toggle-context-overlay', newState.contextOverlayVisible);
  document.querySelector('[data-pending-next-slide]').textContent = String(pendingNextSlide + 1);

  syncPreview(currentPreviewEl, newState.currentSlide, currentFlags());
  syncPreview(nextPreviewEl, pendingNextSlide, nextPreviewFlags());

  const currentNotes = SLIDES[newState.currentSlide].notes || '';
  document.getElementById('presenter-notes').innerHTML = currentNotes ? renderPresenterNotesHTML(currentNotes) : '';
}

/* ---------- Presentation timer (presenter-only; separate from the
 * existing countdown timer widget in app.js's right column) ----------
 * Timestamp-based, not a per-second +1 counter, so browser throttling of
 * a backgrounded tab can't drift it — matches app.js's own timer pattern.
 * Persisted to sessionStorage so a refresh of THIS tab doesn't lose
 * elapsed time; sessionStorage itself clears on a real close, so
 * close+reopen correctly starts fresh (see spec §10).
 *
 * The header displays this as a countdown (time remaining), not a stopwatch
 * (time elapsed): elapsed keeps counting up internally exactly as before —
 * that's what start/pause/reset/persistence all operate on — and the
 * countdown total (in minutes) is a separate, independently persisted value
 * subtracted from it only at render time. Double-clicking the countdown
 * lets the presenter set a fresh total and restarts the count from it. */

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

const COUNTDOWN_STORAGE_KEY = 'presenterView.countdownMinutes';

function loadCountdownMinutes() {
  try {
    const raw = sessionStorage.getItem(COUNTDOWN_STORAGE_KEY);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : CONFIG.timer.defaultMinutes;
  } catch {
    return CONFIG.timer.defaultMinutes;
  }
}

function saveCountdownMinutes(minutes) {
  try {
    sessionStorage.setItem(COUNTDOWN_STORAGE_KEY, String(minutes));
  } catch {
    // sessionStorage write failed — silently ignore, matching the timer's own
    // error-handling style above.
  }
}

let countdownMinutes = loadCountdownMinutes();

function getRemainingSeconds() {
  return Math.round(countdownMinutes * 60) - getElapsedSeconds();
}

// Setting a new countdown total is "a fresh start": the total changes AND
// the elapsed count resets to 0, so the countdown immediately reads the new
// total, paused — rather than leaving the current elapsed position in place
// and letting the remaining time jump (possibly negative) under the new total.
function setCountdownMinutes(minutes) {
  countdownMinutes = minutes;
  saveCountdownMinutes(minutes);
  resetPresenterTimer();
  renderClockAndElapsed();
}

function promptForCountdownMinutes() {
  const input = window.prompt(presenterText.setCountdownPrompt, String(countdownMinutes));
  if (input === null) return; // cancelled
  const minutes = parseFloat(input.trim().replace(',', '.'));
  if (!Number.isFinite(minutes) || minutes <= 0) return; // unparsable — leave it untouched
  setCountdownMinutes(minutes);
}

document.getElementById('btn-presenter-timer-start').addEventListener('click', startPresenterTimer);
document.getElementById('btn-presenter-timer-pause').addEventListener('click', pausePresenterTimer);
document.getElementById('btn-presenter-timer-reset').addEventListener('click', resetPresenterTimer);
document.querySelector('[data-elapsed]').addEventListener('dblclick', promptForCountdownMinutes);

function renderClockAndElapsed() {
  const now = new Date();
  document.querySelector('[data-clock]').textContent =
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const remaining = getRemainingSeconds();
  const sign = remaining < 0 ? '-' : '';
  const absRemaining = Math.abs(remaining);
  document.querySelector('[data-elapsed]').textContent =
    `${sign}${String(Math.floor(absRemaining / 60)).padStart(2, '0')}:${String(absRemaining % 60).padStart(2, '0')} ${presenterText.elapsedSuffix}`;
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
