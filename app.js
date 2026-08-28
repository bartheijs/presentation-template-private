/*
 * Presentation logic: rendering, navigation, timer, confetti, template overlay.
 * Classic script (not a module) so this keeps working when opened via file://.
 * Depends on CONFIG from config.js and SLIDES / SKILL_TEMPLATE_SECTIONS from
 * slides-data.js, both loaded first.
 */

/* ---------- Config normalization ---------- */

// Fallback values for every CONFIG key this file reads. A presentation
// branch with an incomplete config.js (a missing section, or the whole file
// stripped down) must not crash — several reads below (the timer/confetti
// constants) run at module-evaluation time, before anything is rendered, so
// a thrown error here would blank the entire page with no visible cause.
const CONFIG_DEFAULTS = {
  lang: 'nl',
  title: 'Presentatie',
  toc: { heading: 'Inhoud' },
  layout: { align: 'center' },
  disco: { enabled: true, titleLines: ['DISCO'], mode: 'auto' },
  timer: { defaultMinutes: 30, addMinutes: 5, warningMinutes: 5, warningDurationMs: 5000 },
  transitions: { outMs: 280, inMs: 420, discoRevealDelayMs: 90, discoHideLeadMs: 260 },
  confettiColors: ['#FF3D6E', '#FFB703', '#06D6A0', '#3AB0FF', '#8657FF'],
  templateOverlay: { enabled: true },
  ui: {
    templateButton: 'Skill Template',
    notesToggleHide: 'Notities verbergen',
    notesToggleShow: 'Notities tonen',
    timerStart: 'Start',
    timerPause: 'Pause',
    timerFinish: 'Klaar!',
    navNext: 'Volgende',
    navPrev: 'Vorige',
    tocCollapseHide: 'Hide TOC',
    tocCollapseShow: 'Show TOC',
    controlsCollapseHide: 'Hide controls',
    controlsCollapseShow: 'Show controls',
    overlayCloseLabel: 'Sluiten',
    overlayTitle: 'Template',
    backToDeckLabel: 'Terug naar de presentatie',
    presenterViewButton: 'Presenter View',
    finishTitle: 'Klaar!',
    finishBodyHtml: '',
    pauseOverlayText: '...',
  },
};

// Shared Presentation View chrome. CONFIG.lang is the single language
// switch for both index.html and presenter.html; deck authors should not
// have to keep a second copy of these generic controls in sync.
const APP_I18N = {
  nl: {
    tocHeading: 'Inhoud',
    templateButton: 'Skill Template',
    notesToggleHide: 'Notities verbergen',
    notesToggleShow: 'Notities tonen',
    timerStart: 'Start',
    timerPause: 'Pauze',
    timerFinish: 'Klaar!',
    navNext: 'Volgende',
    navPrev: 'Vorige',
    tocCollapseHide: 'Inhoud verbergen',
    tocCollapseShow: 'Inhoud tonen',
    controlsCollapseHide: 'Bediening inklappen',
    controlsCollapseShow: 'Bediening uitklappen',
    overlayCloseLabel: 'Sluiten',
    overlayTitle: 'Skill Template',
    backToDeckLabel: 'Terug naar de presentatie',
    presenterViewButton: 'Presenter View',
    finishTitle: 'Demo tijd!',
    finishBodyHtml: 'Wat eten we vandaag?',
    pauseOverlayText: '...',
  },
  en: {
    tocHeading: 'Contents',
    templateButton: 'Skill Template',
    notesToggleHide: 'Hide notes',
    notesToggleShow: 'Show notes',
    timerStart: 'Start',
    timerPause: 'Pause',
    timerFinish: 'Done!',
    navNext: 'Next',
    navPrev: 'Previous',
    tocCollapseHide: 'Hide contents',
    tocCollapseShow: 'Show contents',
    controlsCollapseHide: 'Collapse controls',
    controlsCollapseShow: 'Expand controls',
    overlayCloseLabel: 'Close',
    overlayTitle: 'Skill Template',
    backToDeckLabel: 'Back to presentation',
    presenterViewButton: 'Presenter View',
    finishTitle: 'Ready to present!',
    finishBodyHtml: 'Use this demo as the starting point for your own story.',
    pauseOverlayText: '...',
  },
};

// Mutates `cfg` in place, filling in any key missing (or non-object, where a
// nested section is expected) with the matching fallback from `defaults`.
// CONFIG is declared `const` in config.js, so this fills gaps in the
// existing object rather than replacing it.
function normalizeConfig(cfg, defaults) {
  for (const key of Object.keys(defaults)) {
    const defaultVal = defaults[key];
    const isSection = defaultVal && typeof defaultVal === 'object' && !Array.isArray(defaultVal);
    if (isSection) {
      if (!cfg[key] || typeof cfg[key] !== 'object') cfg[key] = {};
      normalizeConfig(cfg[key], defaultVal);
    } else if (cfg[key] === undefined) {
      cfg[key] = defaultVal;
    }
  }
  return cfg;
}

normalizeConfig(CONFIG, CONFIG_DEFAULTS);

function applyAppLanguage() {
  const lang = String(CONFIG.lang || 'nl').toLowerCase().startsWith('en') ? 'en' : 'nl';
  const { tocHeading, ...ui } = APP_I18N[lang];
  CONFIG.lang = lang;
  CONFIG.toc.heading = tocHeading;
  CONFIG.ui = ui;
}

applyAppLanguage();

// ?embed=preview marks this document as a passive preview iframe inside
// presenter.html (see docs/superpowers/specs/2026-08-22-presenter-view-design.md
// §7): it must not navigate/launch on its own, only render commands it
// receives.
const isEmbedPreview = new URLSearchParams(location.search).get('embed') === 'preview';

/* ---------- Small helpers ---------- */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(str) {
  return escapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function renderNotesHTML(notesText) {
  return notesText
    .split(/```/)
    .map((chunk, i) => {
      if (i % 2 === 1) {
        return `<pre class="notes-code"><code>${escapeHtml(chunk.trim())}</code></pre>`;
      }
      return chunk
        .trim()
        .split(/\n\n+/)
        .filter(Boolean)
        .map((block) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length && lines.every((l) => /^[-*]\s/.test(l))) {
            return `<ul>${lines.map((l) => `<li>${inlineMarkdown(l.replace(/^[-*]\s/, ''))}</li>`).join('')}</ul>`;
          }
          if (lines.length && lines.every((l) => /^\d+\.\s/.test(l))) {
            return `<ol>${lines.map((l) => `<li>${inlineMarkdown(l.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>`;
          }
          return `<p>${inlineMarkdown(block)}</p>`;
        })
        .join('');
    })
    .join('');
}

/* ---------- State ---------- */

const state = { currentIndex: 0 };

const slideStageEl = document.getElementById('slide-stage');
const slideContentEl = document.getElementById('slide-content');
const slideNotesEl = document.getElementById('slide-notes');
const slideProgressEl = document.getElementById('slide-progress');
const tocListEl = document.getElementById('toc-list');
const overlayEl = document.getElementById('template-overlay');
const overlayBodyEl = document.getElementById('overlay-body');
const finishOverlayEl = document.getElementById('finish-overlay');
const pauseOverlayEl = document.getElementById('pause-overlay');

/* ---------- Rendering ---------- */

// A bullet is either a plain string, or { text, subtext } for a smaller,
// muted line shown below the main bullet text.
function renderBulletItem(b) {
  const isObj = typeof b === 'object' && b !== null;
  // A malformed entry (null/undefined element, or an object missing `text`)
  // must not crash inlineMarkdown()/escapeHtml(), which require a string —
  // fall back to an empty string rather than throwing and blanking the
  // whole slide.
  const text = (isObj ? b.text : b) || '';
  const subtext = isObj && typeof b.subtext === 'string' ? b.subtext : null;
  const body = subtext
    ? `<span class="slide-bullet-stack"><span>${inlineMarkdown(text)}</span><span class="slide-bullet-subtext">${inlineMarkdown(subtext)}</span></span>`
    : `<span>${inlineMarkdown(text)}</span>`;
  return `<li><svg class="icon icon--fill"><use href="#icon-spark"></use></svg>${body}</li>`;
}

function buildSlideContentHTML(slide) {
  // A malformed slide (e.g. a generation slip missing `bullets`/`title`)
  // degrades to blank-ish here instead of throwing — since renderTocOnce()
  // renders every slide's title in one pass at startup, one bad slide
  // anywhere in the deck would otherwise crash the entire presentation
  // before it ever shows anything.
  const bullets = slide.bullets || [];
  const bulletsBlock = bullets.length
    ? `<ul class="slide-bullets">${bullets.map(renderBulletItem).join('')}</ul>`
    : '';
  const templateBlock = slide.isTemplateAnchor
    ? `<pre class="slide-template-code"><code>${buildTemplateSectionsHtml(null)}</code></pre>`
    : '';
  // `icon` is optional — a title slide can omit it to show just the
  // heading text, with no icon glyph taking up space next to it. A slide
  // with no icon and a subtitle reads as the deck's title slide, so it
  // gets the gradient-accent treatment on its own instead of a separate
  // opt-in flag.
  const isTitleSlide = !slide.icon && Boolean(slide.subtitle);
  const iconBlock = slide.icon
    ? `<svg class="icon"><use href="#icon-${slide.icon}"></use></svg>`
    : '';
  // Optional `subtitle` renders a tagline under the title — for a title
  // slide's tagline, not a general-purpose per-slide field.
  const subtitleBlock = slide.subtitle
    ? `<p class="slide-subtitle${isTitleSlide ? ' slide-subtitle--accent' : ''}">${inlineMarkdown(slide.subtitle)}</p>`
    : '';
  const headingBlock = `
      <div class="slide-heading${slide.subtitle ? ' slide-heading--with-subtitle' : ''}">
        ${iconBlock}
        <h1${isTitleSlide ? ' class="slide-title-accent"' : ''}>${escapeHtml(slide.title || '')}</h1>
      </div>
      ${subtitleBlock}`;

  // Optional `meta: [line, ...]` — a small byline (speaker / event / date)
  // pinned to the bottom-left corner of the slide card, independent of the
  // centered heading/bullets column above it.
  const metaBlock = Array.isArray(slide.meta) && slide.meta.length
    ? `<div class="slide-meta">${slide.meta.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>`
    : '';

  // Optional slide-level `image: { src, alt }` (or an array of those) — the
  // full bullet list sits in one column, the image(s) stacked in a second
  // column beside it, so the bullets keep their normal uniform gap instead
  // of a lead bullet being pushed into its own row sized by the (taller)
  // image. Meant for a one-off mark like a photo/logo at a fixed 200x200
  // square, not a wide diagram (see `diagram` below for that).
  const images = Array.isArray(slide.image)
    ? slide.image.filter((img) => img && img.src)
    : (slide.image && slide.image.src ? [slide.image] : []);

  // Optional `diagram: { src, alt, logo }` — a wide diagram/screenshot
  // rendered full-width below the bullet list, sized to stay readable
  // (object-fit: contain) instead of being cropped like the fixed-square
  // `image` marks. Optional `logo: { src, alt }` renders a fixed 200x200
  // mark to its left, in the same row.
  const diagramLogoBlock = slide.diagram && slide.diagram.logo && slide.diagram.logo.src
    ? `<img class="slide-image" src="${escapeHtml(slide.diagram.logo.src)}" alt="${escapeHtml(slide.diagram.logo.alt || '')}">`
    : '';
  const diagramBlock = slide.diagram && slide.diagram.src
    ? (diagramLogoBlock
      ? `<div class="slide-diagram-row">${diagramLogoBlock}<img class="slide-diagram" src="${escapeHtml(slide.diagram.src)}" alt="${escapeHtml(slide.diagram.alt || '')}"></div>`
      : `<img class="slide-diagram" src="${escapeHtml(slide.diagram.src)}" alt="${escapeHtml(slide.diagram.alt || '')}">`)
    : '';

  if (images.length) {
    const imagesEl = images
      .map((img) => `<img class="slide-image" src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || '')}">`)
      .join('');
    return `
    <div class="slide-inner">
      ${headingBlock}
      <div class="slide-row-with-image">
        ${bulletsBlock}
        <div class="slide-image-stack">${imagesEl}</div>
      </div>
      ${templateBlock}
    </div>
    ${metaBlock}`;
  }

  // A diagram+logo row needs more horizontal room than the standard
  // reading-width column (66.6667%) to keep both legible at once, so it
  // widens `.slide-inner` just for that slide — the row's own left edge
  // still lines up with the heading/bullets above it since it stays inside
  // the same column.
  const innerClass = diagramLogoBlock
    ? ' slide-inner--wide'
    : (slide.isTemplateAnchor ? ' slide-inner--fill' : '');

  return `
    <div class="slide-inner${innerClass}">
      ${headingBlock}
      ${bulletsBlock}
      ${diagramBlock}
      ${templateBlock}
    </div>
    ${metaBlock}`;
}

// A slide's own `align` overrides CONFIG.layout.align. Unlike
// isDiscoEnabledFor()'s typeof-boolean check, a plain `||` is safe here:
// the only "unset" value for this string enum is undefined, and no valid
// value ('center'/'left') is falsy.
function resolveAlignFor(slide) {
  return slide.align || CONFIG.layout.align;
}

// Presenter-only, session-level override: hides the notes panel regardless
// of whether the current slide has notes (e.g. when screen-sharing this
// window to an audience). Persists across slide navigation on purpose —
// it's a mode for the whole session, not a per-slide property.
let notesHiddenByUser = true;

function shouldShowNotes(slide) {
  const hasNotesText = Boolean(slide.notes && slide.notes.trim());
  return hasNotesText && !notesHiddenByUser;
}

function renderSlide() {
  const slide = SLIDES[state.currentIndex];
  const align = resolveAlignFor(slide);
  slideContentEl.className =
    'slide-content' +
    (slide.isTemplateAnchor ? ' slide-content--compact' : '') +
    (align === 'left' ? ' slide-content--align-left' : '');
  slideContentEl.innerHTML = buildSlideContentHTML(slide);
  const hasNotesText = Boolean(slide.notes && slide.notes.trim());
  const showNotes = shouldShowNotes(slide);
  slideNotesEl.hidden = !showNotes;
  slideStageEl.classList.toggle('stage-no-notes', !showNotes);
  // Populated whenever the slide actually has notes, regardless of the
  // toggle — so switching the toggle back on doesn't need a re-render.
  slideNotesEl.innerHTML = hasNotesText ? renderNotesHTML(slide.notes) : '';
  slideProgressEl.textContent = `${state.currentIndex + 1} / ${SLIDES.length}`;
  slideContentEl.scrollTop = 0;
  slideNotesEl.scrollTop = 0;
}

// Toggling mid-animation/mid-pause would fight the same layout the slide
// transition or frozen-pause freeze is already animating — block it until
// things are settled, same guard pattern goTo() already uses.
function toggleNotesVisibility() {
  if (isAnimatingSlide || pendingPause) return;
  notesHiddenByUser = !notesHiddenByUser;
  const slide = SLIDES[state.currentIndex];
  const showNotes = shouldShowNotes(slide);
  slideNotesEl.hidden = !showNotes;
  slideStageEl.classList.toggle('stage-no-notes', !showNotes);
  updateNotesToggleLabel();
}

function updateNotesToggleLabel() {
  const label = notesHiddenByUser ? CONFIG.ui.notesToggleShow : CONFIG.ui.notesToggleHide;
  document.getElementById('notes-toggle-label').textContent = label;
  document.getElementById('btn-toggle-notes').setAttribute('aria-label', label);
}

// Collapsible side panes: TOC (left) and the template/timer/nav controls
// (right). Each just toggles a class on .app-shell — styles.css handles
// narrowing the grid track and hiding that pane's text/labels down to an
// icon-only rail. Independent of each other and of the notes toggle above.
//
// MOBILE_BREAKPOINT must match styles.css's `@media (max-width: 900px)` —
// pane collapse is a desktop-rail concept, and below this width the panes
// are already stacked full-width by that media query. Rather than
// maintaining a second, easy-to-forget list of CSS overrides that resets
// every collapsed-state style at that width, the resize listener below
// just guarantees the collapsed classes are never present on .app-shell
// in the first place once the viewport gets that narrow.
const MOBILE_BREAKPOINT = 900;
let tocCollapsed = false;
let nextCollapsed = false;
let presenterConnected = false;
let presenterHidesControls = false;
let nextCollapsedBeforePresenter = null;
const appShellEl = document.querySelector('.app-shell');

function toggleTocCollapse() {
  tocCollapsed = !tocCollapsed;
  appShellEl.classList.toggle('toc-collapsed', tocCollapsed);
  document.getElementById('toc-collapse-icon').setAttribute('href', tocCollapsed ? '#icon-arrow-right' : '#icon-arrow-left');
  document.getElementById('btn-toc-collapse').setAttribute(
    'aria-label',
    tocCollapsed ? CONFIG.ui.tocCollapseShow : CONFIG.ui.tocCollapseHide
  );
  sendStateToPresenter();
}

function renderNextPaneState() {
  appShellEl.classList.toggle('next-collapsed', nextCollapsed);
  appShellEl.classList.toggle('presenter-controls-hidden', presenterHidesControls);
  document.getElementById('next-collapse-icon').setAttribute('href', nextCollapsed ? '#icon-arrow-left' : '#icon-arrow-right');
  document.getElementById('btn-next-collapse').setAttribute(
    'aria-label',
    nextCollapsed ? CONFIG.ui.controlsCollapseShow : CONFIG.ui.controlsCollapseHide
  );
}

function setNextCollapsed(collapsed) {
  nextCollapsed = collapsed;
  renderNextPaneState();
  sendStateToPresenter();
}

function setPresenterControlsHidden(hidden) {
  presenterHidesControls = hidden;
  renderNextPaneState();
  sendStateToPresenter();
}

function toggleNextCollapse() {
  if (presenterConnected) {
    setPresenterControlsHidden(!presenterHidesControls);
  } else {
    setNextCollapsed(!nextCollapsed);
  }
}

function setRightAsideVisible(visible) {
  if (presenterConnected) {
    setPresenterControlsHidden(!visible);
  } else if (nextCollapsed === visible) {
    setNextCollapsed(!visible);
  }
}

window.addEventListener('resize', () => {
  if (window.innerWidth >= MOBILE_BREAKPOINT) return;
  if (tocCollapsed) toggleTocCollapse();
  if (nextCollapsed) setNextCollapsed(false);
});

function renderTocOnce() {
  // One malformed slide (missing title) must not crash rendering for the
  // whole deck — this runs once at startup for every slide at once.
  tocListEl.innerHTML = SLIDES.map(
    (s, i) => `
      <button class="toc-item" data-index="${i}" type="button">
        <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="toc-title">${escapeHtml(s.title || '')}</span>
      </button>`
  ).join('');
}

function updateTocActiveState() {
  document.querySelectorAll('.toc-item').forEach((el, i) => {
    el.classList.toggle('is-active', i === state.currentIndex);
  });
  // Clicking a TOC row focuses that <button>, and its native focus ring
  // only clears on its own if focus moves elsewhere — pressing Next/Prev
  // (which does move focus) clears it, but a keyboard shortcut (ArrowRight
  // etc., handled on `document`) never touches focus at all, leaving a
  // stale ring on a row that's no longer the current slide. Called on
  // every navigation path, so this always catches that regardless of
  // which control was used.
  const focused = document.activeElement;
  if (focused && focused.classList.contains('toc-item') && !focused.classList.contains('is-active')) {
    focused.blur();
  }
  const active = document.querySelector('.toc-item.is-active');
  if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ---------- Navigation ---------- */

// While a 'pause'-mode disco transition is frozen mid-flight (outgoing
// content off-screen, disco fully visible, state.currentIndex NOT yet
// advanced), this holds the pending destination so a matching second
// click/arrow can finish it. Any non-matching navigation cancels it.
let pendingPause = null; // { toIndex, dir } | null

// Handles for the "out"-phase timer/listener and optional auto-mode hold
// currently in flight, so
// resetAnimationState() can reach and tear them down if a TOC click
// interrupts a transition before they fire on their own. Both functions
// that start an "out" phase (animateTransition/beginPausedTransition) must
// keep these in sync: set on start, clear (to null) once the out phase
// completes normally.
let pendingRevealTimer = null;
let pendingOutListener = null;
let pendingHoldTimer = null;

function goTo(index, { animate = false, direction = null } = {}) {
  if (index < 0 || index >= SLIDES.length) return;
  if (index === state.currentIndex && !pendingPause) return;
  if (animate && isAnimatingSlide) return; // ignore rapid double-triggers mid out/in animation

  // The finish overlay opens on top of the last slide without changing
  // state.currentIndex (see goNext()). goPrev() special-cases the plain
  // "back" gesture itself (see below), but an explicit jump elsewhere
  // (GO_TO_SLIDE from Presenter View's TOC/skip-ahead — it has no on-screen
  // button to close the overlay, unlike the local keyboard handler's own
  // guard) should still close the celebration on its way there.
  if (!finishOverlayEl.hidden) closeFinishOverlay();

  const dir = direction || (index > state.currentIndex ? 'next' : 'prev');

  if (pendingPause) {
    if (animate && dir === pendingPause.dir && index === pendingPause.toIndex) {
      resumePausedTransition();
      return;
    }
    cancelPendingPause(); // falls through to handle the newly requested nav below
  }

  if (!animate) {
    // renderSlide() unconditionally overwrites slideContentEl's className,
    // which would silently cancel a still-in-flight "out"/"in" animation
    // (no animationend fires for a class removed out from under it) and
    // strand isAnimatingSlide as true forever, freezing all future animated
    // navigation. A non-animated jump (TOC click) can land mid-animation,
    // so settle any in-flight state cleanly first.
    resetAnimationState();
    state.currentIndex = index;
    renderSlide();
    updateTocActiveState();
    sendStateToPresenter();
    return;
  }

  const destSlide = SLIDES[index];
  // Disco is a forward-presenting device — revisiting a slide by going
  // back should be quick and unobtrusive, not replay its flash/title (or,
  // in 'pause' mode, freeze on it) a second time.
  const discoOn = dir === 'next' && isDiscoEnabledFor(destSlide);
  const pauseOn = discoOn && isDiscoPauseFor(destSlide);

  // Tracked separately from isAnimatingSlide/pendingPause so
  // sendStateToPresenter() can tell Presenter View exactly what disco text
  // (if any) the audience is currently looking at — including during a
  // paused hold, where isAnimatingSlide is already back to false but the
  // disco is still fully visible, frozen.
  activeDiscoTitleLines = discoOn ? (destSlide.discoTitleLines || CONFIG.disco.titleLines) : null;
  if (discoOn) renderDiscoTitle(activeDiscoTitleLines);

  if (pauseOn) {
    beginPausedTransition(dir, index); // does NOT advance state.currentIndex yet
  } else {
    state.currentIndex = index;
    animateTransition(dir, renderSlide, resolveDiscoHoldMsFor(destSlide), discoOn);
  }
  updateTocActiveState();
  sendStateToPresenter();
}

// Shared by the Next button, ArrowRight and Space: goTo() itself just
// no-ops past the last slide (see its bounds guard above), so "next" on
// the last slide instead opens the same finish/confetti celebration as
// clicking the dedicated "Klaar!" button.
function goNext() {
  if (state.currentIndex >= SLIDES.length - 1) {
    if (!finishOverlayEl.hidden) return;
    launchConfetti();
    openFinishOverlay();
    return;
  }
  goTo(state.currentIndex + 1, { animate: true, direction: 'next' });
}

// Shared by the Prev button and PREVIOUS_SLIDE: the finish overlay is
// conceptually one more step past the last slide (see goNext() above), so
// going back from it should just reveal that last slide again — the same
// thing its own "Terug naar de presentatie" button does — not ALSO step
// past it to the slide before. goTo() is never even called in that case,
// so state.currentIndex (already sitting on the last slide) is untouched;
// a second "back" press, with the overlay now closed, behaves normally.
function goPrev() {
  if (!finishOverlayEl.hidden) {
    closeFinishOverlay();
    sendStateToPresenter();
    return;
  }
  goTo(state.currentIndex - 1, { animate: true, direction: 'prev' });
}

/* Content up / notes down (out) -> swap content while off-screen ->
 * content down / notes up (in). Durations come from CONFIG.transitions.
 * The disco-bg layer behind them is
 * sequenced independently on its own explicit delays, deliberately timed
 * so it (a) appears a beat after the panels start leaving, not instantly,
 * and (b) is fully faded out well before the panels finish landing — with
 * a comfortable buffer, not a race against the panels' own transition. */
let isAnimatingSlide = false;
// Non-null exactly while the audience is looking at a disco transition —
// animating or frozen mid-'pause'-mode hold. See goTo() (where it's set)
// and sendStateToPresenter() (where Presenter View reads it).
let activeDiscoTitleLines = null;
const ANIM_OUT_MS = CONFIG.transitions.outMs;
const ANIM_IN_MS = CONFIG.transitions.inMs;
const DISCO_REVEAL_DELAY_MS = CONFIG.transitions.discoRevealDelayMs; // background starts fading in this long after "out" begins
const DISCO_HIDE_LEAD_MS = CONFIG.transitions.discoHideLeadMs; // start hiding the background this long before the panels land

// A slide's own `disco` boolean overrides CONFIG.disco.enabled. goTo()
// resolves this against the destination slide *before* touching
// state.currentIndex, since the 'pause' path (see below) doesn't advance it
// up front the way the plain 'auto' path still does.
function isDiscoEnabledFor(slide) {
  return typeof slide.disco === 'boolean' ? slide.disco : CONFIG.disco.enabled;
}

// A slide's own `discoMode` overrides CONFIG.disco.mode. Only meaningful
// together with isDiscoEnabledFor() — pausing with disco off has nothing to
// freeze on.
function isDiscoPauseFor(slide) {
  return (slide.discoMode || CONFIG.disco.mode || 'auto') === 'pause';
}

// Optional per-slide hold for an auto-mode disco transition. It begins
// after the outgoing panels have left and keeps the background fully
// visible before the destination panels enter. Invalid/negative values are
// ignored so malformed content cannot stall navigation.
function resolveDiscoHoldMsFor(slide) {
  const holdMs = Number(slide.discoHoldMs);
  return Number.isFinite(holdMs) && holdMs > 0 ? holdMs : 0;
}

// A slide's own `discoTitleLines` overrides CONFIG.disco.titleLines just
// for the transition landing on it. #disco-title is a single shared
// element (see index.html) re-rendered right before that one transition
// starts, rather than per-slide markup kept in sync ahead of time.
function renderDiscoTitle(lines) {
  document.getElementById('disco-title').innerHTML = lines
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join('');
}

// `discoOn` comes from goTo() (already gated on dir === 'next' there) rather
// than being recomputed here from the now-current SLIDES[state.currentIndex]
// — recomputing would silently ignore that gating and flash disco on a
// backward revisit of a disco-enabled slide.
function animateTransition(dir, applyFn, holdMs = 0, discoOn = false) {
  isAnimatingSlide = true;
  slideContentEl.classList.add('content-anim-out');
  if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-out');

  pendingRevealTimer = discoOn
    ? setTimeout(() => slideStageEl.classList.add('is-transitioning'), DISCO_REVEAL_DELAY_MS)
    : null;

  function onOut() {
    slideContentEl.removeEventListener('animationend', onOut);
    clearTimeout(pendingRevealTimer);
    pendingRevealTimer = null;
    pendingOutListener = null;
    const finishOut = () => {
      pendingHoldTimer = null;
      // Swap in the new slide's content WHILE still hidden by the "out"
      // classes (which hold the panel off-screen via animation-fill-mode:
      // forwards). renderSlide() forces a synchronous reflow (scrollTop),
      // so if we removed the "out" classes first, that reflow could catch
      // the panel mid-snap-back to its normal (visible, in-place) resting
      // style and paint a one-frame flash before the "in" class re-hides
      // it. Doing the swap first, then flipping classes back-to-back with
      // nothing forcing a reflow in between, avoids that flash entirely.
      applyFn();
      slideContentEl.classList.remove('content-anim-out');
      slideNotesEl.classList.remove('notes-anim-out');
      slideContentEl.classList.add('content-anim-in');
      if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-in');

      if (discoOn) {
        const hideDelay = Math.max(0, ANIM_IN_MS - DISCO_HIDE_LEAD_MS);
        setTimeout(() => slideStageEl.classList.remove('is-transitioning'), hideDelay);
      }

      slideContentEl.addEventListener(
        'animationend',
        () => {
          slideContentEl.classList.remove('content-anim-in');
          slideNotesEl.classList.remove('notes-anim-in');
          isAnimatingSlide = false;
          activeDiscoTitleLines = null;
          sendStateToPresenter();
        },
        { once: true }
      );
    };

    if (discoOn && holdMs > 0) {
      pendingHoldTimer = setTimeout(finishOut, holdMs);
    } else {
      finishOut();
    }
  }
  pendingOutListener = onOut;
  slideContentEl.addEventListener('animationend', onOut, { once: true });
}

// 'pause' mode: play only the "out" half, then freeze fully visible on the
// disco (no hide timer scheduled) instead of swapping content and playing
// the "in" half. Mirrors animateTransition()'s out-phase exactly; kept as a
// separate function (rather than merged into animateTransition) so the
// existing 'auto' path stays byte-for-byte unchanged.
function beginPausedTransition(dir, toIndex) {
  isAnimatingSlide = true;
  slideContentEl.classList.add('content-anim-out');
  if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-out');

  pendingRevealTimer = setTimeout(() => slideStageEl.classList.add('is-transitioning'), DISCO_REVEAL_DELAY_MS);

  function onOut() {
    slideContentEl.removeEventListener('animationend', onOut);
    clearTimeout(pendingRevealTimer);
    pendingRevealTimer = null;
    pendingOutListener = null;
    // Freeze here: outgoing content/notes stay held off-screen by the
    // still-applied "out" classes, disco stays fully opaque (no hide
    // timer scheduled), state.currentIndex and the rendered slide
    // deliberately do not advance until resumePausedTransition() runs.
    isAnimatingSlide = false;
    pendingPause = { toIndex, dir };
    renderPausedProgress();
  }
  pendingOutListener = onOut;
  slideContentEl.addEventListener('animationend', onOut, { once: true });
}

function renderPausedProgress() {
  const from = state.currentIndex + 1;
  const to = pendingPause.toIndex + 1;
  // Assumes |to - from| === 1 (always true today: pendingPause is only ever
  // set from goTo()'s next/prev ±1 calls), so this always lands on fromN.5.
  // A future caller that animates a jump of more than one slide would need
  // to revisit this formula first.
  const mid = (from + to) / 2;
  slideProgressEl.textContent = `${String(mid).replace('.', ',')} / ${SLIDES.length}`;
}

// Finishes a frozen pause: mirrors the tail half of animateTransition()'s
// onOut handler (swap content, play the "in" half, schedule disco's hide).
function resumePausedTransition() {
  const { toIndex } = pendingPause;
  pendingPause = null;
  isAnimatingSlide = true;

  state.currentIndex = toIndex;
  renderSlide();
  slideContentEl.classList.remove('content-anim-out');
  slideNotesEl.classList.remove('notes-anim-out');
  slideContentEl.classList.add('content-anim-in');
  if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-in');

  const hideDelay = Math.max(0, ANIM_IN_MS - DISCO_HIDE_LEAD_MS);
  setTimeout(() => slideStageEl.classList.remove('is-transitioning'), hideDelay);

  slideContentEl.addEventListener(
    'animationend',
    () => {
      slideContentEl.classList.remove('content-anim-in');
      slideNotesEl.classList.remove('notes-anim-in');
      isAnimatingSlide = false;
      activeDiscoTitleLines = null;
      sendStateToPresenter();
    },
    { once: true }
  );

  updateTocActiveState();
  sendStateToPresenter();
}

// Any non-matching navigation while frozen cancels the pause: snap the
// outgoing panels back to resting position and let disco fade out. The snap
// is masked because disco is still fully opaque at this exact instant —
// removing is-transitioning right after starts its existing fade, so the
// instant class removal above never paints a visible flash.
function cancelPendingPause() {
  pendingPause = null;
  slideContentEl.classList.remove('content-anim-out');
  slideNotesEl.classList.remove('notes-anim-out');
  // Force a reflow before returning. The caller immediately starts a fresh
  // transition, which re-adds this exact same class name to kick off the
  // "out" animation again — without a style flush in between, the browser
  // sees no net change to animation-name across the task and never restarts
  // the animation, so its animationend would never fire and callers waiting
  // on it (animateTransition/beginPausedTransition) would hang forever.
  void slideContentEl.offsetWidth;
  slideStageEl.classList.remove('is-transitioning');
  isAnimatingSlide = false;
}

// Hard reset for a non-animated jump (e.g. a TOC click) that may land while
// a full animateTransition()/beginPausedTransition() is still mid-flight:
// clears any frozen pause and strips every animation/disco class so no
// stale state (or a permanently stuck isAnimatingSlide) survives the jump.
// renderSlide() itself already overwrites slideContentEl's className right
// after this runs, so this mainly guards slideNotesEl/slideStageEl and the
// isAnimatingSlide flag. Also tears down the interrupted "out" phase's timer
// and animationend listener (see pendingRevealTimer/pendingOutListener) —
// left alone, the timer would later re-add 'is-transitioning' to an
// unrelated slide, and the {once:true} listener never fires on its own
// (removing its class mid-flight triggers animationcancel, not
// animationend), leaving it attached to fire unexpectedly on a later
// transition.
function resetAnimationState() {
  pendingPause = null;
  isAnimatingSlide = false;
  activeDiscoTitleLines = null;
  if (pendingRevealTimer) {
    clearTimeout(pendingRevealTimer);
    pendingRevealTimer = null;
  }
  if (pendingOutListener) {
    slideContentEl.removeEventListener('animationend', pendingOutListener);
    pendingOutListener = null;
  }
  if (pendingHoldTimer) {
    clearTimeout(pendingHoldTimer);
    pendingHoldTimer = null;
  }
  slideContentEl.classList.remove('content-anim-out', 'content-anim-in');
  slideNotesEl.classList.remove('notes-anim-out', 'notes-anim-in');
  slideStageEl.classList.remove('is-transitioning');
}

document.getElementById('btn-next').addEventListener('click', goNext);
document.getElementById('btn-prev').addEventListener('click', goPrev);

// Both listeners below drive the real presentation's own navigation from
// its own keyboard/click input. A preview iframe (?embed=preview) must stay
// passive — it only renders what the message listener below tells it to —
// so these are skipped entirely there (see isEmbedPreview, defined above).
if (!isEmbedPreview) {
  document.addEventListener('keydown', (e) => {
    if (!finishOverlayEl.hidden) return;
    if (e.key === 'ArrowDown') {
      if (!CONFIG.templateOverlay.enabled) return;
      e.preventDefault();
      if (overlayEl.hidden) openTemplateOverlay();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!overlayEl.hidden) closeTemplateOverlay();
      return;
    }
    if (!overlayEl.hidden) return;
    // Presentation clickers commonly emit PageDown/PageUp rather than arrow
    // keys, so support both pairs as equivalent navigation controls.
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goNext();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goPrev();
      return;
    }
    if (e.key === ' ' && document.activeElement.tagName !== 'BUTTON') {
      // Skipped when a <button> is focused (Next itself, a TOC row, ...) —
      // space already natively activates that button on its own, so also
      // advancing here would double-fire (or fire a jarring extra "next"
      // while e.g. the timer's Start button happens to have focus).
      e.preventDefault(); // space's native behavior scrolls the page otherwise
      goNext();
    }
  });

  tocListEl.addEventListener('click', (e) => {
    const item = e.target.closest('.toc-item');
    if (!item) return;
    goTo(Number(item.dataset.index), { animate: false });
  });
}

/* ---------- Timer ---------- */

const THIRTY_MIN_MS = CONFIG.timer.defaultMinutes * 60 * 1000;
const FIVE_MIN_MS = CONFIG.timer.addMinutes * 60 * 1000;
const TIMER_WARNING_MS = CONFIG.timer.warningMinutes * 60 * 1000;

const timer = {
  remainingMs: THIRTY_MIN_MS,
  running: false,
  endAt: null,
  intervalId: null,
  warningShown: false,
};

const timerDisplayEl = document.getElementById('timer-display');
const timerToggleBtn = document.getElementById('btn-timer-toggle');
const timerToggleIconEl = document.getElementById('timer-toggle-icon');
const timerToggleLabelEl = document.getElementById('timer-toggle-label');

function renderTimerDisplay() {
  const totalSec = Math.ceil(timer.remainingMs / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  timerDisplayEl.textContent = `${m}:${s}`;
}

// Icon + text both swap together — collapsed mode (see .next-column) only
// shows the icon, so it alone must communicate running vs. paused.
function setTimerToggleUI(running) {
  const label = running ? CONFIG.ui.timerPause : CONFIG.ui.timerStart;
  timerToggleIconEl.setAttribute('href', running ? '#icon-pause' : '#icon-play');
  timerToggleLabelEl.textContent = label;
  timerToggleBtn.setAttribute('aria-label', label);
}

function timerStart() {
  if (timer.running) return;
  timer.running = true;
  timer.endAt = Date.now() + timer.remainingMs;
  timer.intervalId = setInterval(timerTick, 250);
  setTimerToggleUI(true);
}

function timerPause() {
  if (!timer.running) return;
  timer.running = false;
  clearInterval(timer.intervalId);
  timer.remainingMs = Math.max(0, timer.endAt - Date.now());
  setTimerToggleUI(false);
}

function timerAddFive() {
  if (timer.running) {
    const remaining = Math.max(0, timer.endAt - Date.now());
    timer.remainingMs = Math.min(THIRTY_MIN_MS, remaining + FIVE_MIN_MS);
    timer.endAt = Date.now() + timer.remainingMs;
  } else {
    timer.remainingMs = Math.min(THIRTY_MIN_MS, timer.remainingMs + FIVE_MIN_MS);
  }
  if (timer.remainingMs > TIMER_WARNING_MS) timer.warningShown = false;
  renderTimerDisplay();
}

function timerTick() {
  const previousRemainingMs = timer.remainingMs;
  timer.remainingMs = Math.max(0, timer.endAt - Date.now());
  renderTimerDisplay();

  if (
    !timer.warningShown &&
    previousRemainingMs > TIMER_WARNING_MS &&
    timer.remainingMs <= TIMER_WARNING_MS &&
    timer.remainingMs > 0
  ) {
    timer.warningShown = true;
    launchTemporaryConfetti();
  }

  if (timer.remainingMs <= 0) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.running = false;
    setTimerToggleUI(false);
  }
}

timerToggleBtn.addEventListener('click', () => (timer.running ? timerPause() : timerStart()));
document.getElementById('btn-timer-add5').addEventListener('click', timerAddFive);

renderTimerDisplay();

/* ---------- Confetti ----------
 * Dependency-free canvas particle system. Confetti falls slowly and, instead
 * of disappearing off the bottom, settles into a pile that keeps growing —
 * spawning continues in the background until the pile fills the screen.
 * Settled particles are baked onto an offscreen canvas so the "in flight"
 * array stays small no matter how long it runs.
 */

const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
const CONFETTI_COLORS = CONFIG.confettiColors;
const PILE_COLUMN_WIDTH = 4;
const SPAWN_INTERVAL_MS = 200;
const SPAWN_BATCH_SIZE = 10;
const CONFETTI_GRAVITY = 0.025;
const CONFETTI_MAX_VY = 2.2;

let confettiActive = false;
let confettiPersistent = false;
let confettiSpawnIntervalId = null;
let confettiRafId = null;
let temporaryConfettiStopTimerId = null;
let fallingParticles = [];
let pileHeights = null;
let settledCanvas = null;
let settledCtx = null;

function ensureConfettiBuffers() {
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!settledCanvas) {
    settledCanvas = document.createElement('canvas');
    settledCtx = settledCanvas.getContext('2d');
  }
  settledCanvas.width = window.innerWidth * dpr;
  settledCanvas.height = window.innerHeight * dpr;
  settledCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  pileHeights = new Float32Array(Math.ceil(window.innerWidth / PILE_COLUMN_WIDTH));
}
window.addEventListener('resize', () => {
  if (settledCanvas) ensureConfettiBuffers();
});

function makeConfettiParticle() {
  return {
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 1.2,
    vy: 0.3 + Math.random() * 0.6,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 6,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
  };
}

function pileHeightAt(x) {
  const col = Math.min(pileHeights.length - 1, Math.max(0, Math.floor(x / PILE_COLUMN_WIDTH)));
  return pileHeights[col];
}

function raisePileAt(x, size) {
  const spanCols = Math.max(1, Math.round(size / PILE_COLUMN_WIDTH));
  const centerCol = Math.floor(x / PILE_COLUMN_WIDTH);
  const bump = size * 0.45;
  for (let c = centerCol - spanCols; c <= centerCol + spanCols; c++) {
    if (c >= 0 && c < pileHeights.length) {
      pileHeights[c] = Math.min(window.innerHeight, pileHeights[c] + bump / (spanCols * 2 + 1));
    }
  }
}

function drawParticle(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.fillStyle = p.color;
  if (p.shape === 'rect') {
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function isPileFull() {
  let minHeight = Infinity;
  for (let i = 0; i < pileHeights.length; i += 20) minHeight = Math.min(minHeight, pileHeights[i]);
  return minHeight >= window.innerHeight * 0.92;
}

function spawnConfettiBatch(count) {
  for (let i = 0; i < count; i++) fallingParticles.push(makeConfettiParticle());
}

function clearTemporaryConfettiStopTimer() {
  if (temporaryConfettiStopTimerId === null) return;
  clearTimeout(temporaryConfettiStopTimerId);
  temporaryConfettiStopTimerId = null;
}

function startConfetti(burstCount) {
  if (!settledCanvas) ensureConfettiBuffers();
  spawnConfettiBatch(burstCount);
  if (!confettiActive) {
    confettiActive = true;
    confettiSpawnIntervalId = setInterval(() => {
      if (isPileFull()) return;
      spawnConfettiBatch(SPAWN_BATCH_SIZE);
    }, SPAWN_INTERVAL_MS);
  }
  if (!confettiRafId) confettiRafId = requestAnimationFrame(confettiLoop);
}

function launchConfetti(burstCount = 60) {
  clearTemporaryConfettiStopTimer();
  confettiPersistent = true;
  startConfetti(burstCount);
}

function launchTemporaryConfetti(
  durationMs = CONFIG.timer.warningDurationMs,
  burstCount = 60
) {
  if (confettiPersistent) return;
  clearTemporaryConfettiStopTimer();
  startConfetti(burstCount);
  temporaryConfettiStopTimerId = setTimeout(() => {
    temporaryConfettiStopTimerId = null;
    stopConfetti();
  }, durationMs);
}

function confettiLoop() {
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiCtx.drawImage(settledCanvas, 0, 0, window.innerWidth, window.innerHeight);

  for (let i = fallingParticles.length - 1; i >= 0; i--) {
    const p = fallingParticles[i];
    p.vy = Math.min(CONFETTI_MAX_VY, p.vy + CONFETTI_GRAVITY);
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;

    if (p.x < -20) p.x = window.innerWidth + 20;
    if (p.x > window.innerWidth + 20) p.x = -20;

    const floor = window.innerHeight - pileHeightAt(p.x);
    if (p.y + p.size / 2 >= floor) {
      p.y = floor - p.size / 2;
      drawParticle(settledCtx, p);
      raisePileAt(p.x, p.size);
      fallingParticles.splice(i, 1);
    }
  }

  for (const p of fallingParticles) drawParticle(confettiCtx, p);

  confettiRafId = confettiActive ? requestAnimationFrame(confettiLoop) : null;
}

function stopConfetti() {
  clearTemporaryConfettiStopTimer();
  confettiActive = false;
  confettiPersistent = false;
  if (confettiSpawnIntervalId) {
    clearInterval(confettiSpawnIntervalId);
    confettiSpawnIntervalId = null;
  }
  if (confettiRafId) {
    cancelAnimationFrame(confettiRafId);
    confettiRafId = null;
  }
  fallingParticles = [];
  if (pileHeights) pileHeights.fill(0);
  if (settledCtx) settledCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

/* ---------- Skill template overlay ---------- */

// Shared by the overlay and the isTemplateAnchor slide (buildSlideContentHTML)
// so both render SKILL_TEMPLATE_SECTIONS with the same per-section heading
// colors (.tpl-block--<id> .tpl-heading in styles.css) instead of one of them
// drifting into a flat, uncolored copy.
function buildTemplateSectionsHtml(highlightId) {
  const blocks = SKILL_TEMPLATE_SECTIONS.map((s) => {
    const [headingLine, ...rest] = s.body.split('\n');
    const highlightClass = s.id === highlightId ? ' is-highlighted' : '';
    return `<span class="tpl-block tpl-block--${s.id}${highlightClass}"><span class="tpl-heading">${escapeHtml(headingLine)}</span>${
      rest.length ? '\n' + escapeHtml(rest.join('\n')) : ''
    }</span>`;
  });
  return blocks.join('\n\n');
}

function renderTemplateOverlay(highlightId) {
  overlayBodyEl.innerHTML = `<pre class="template-code"><code>${buildTemplateSectionsHtml(highlightId)}</code></pre>`;
}

function openTemplateOverlay() {
  const slide = SLIDES[state.currentIndex];
  renderTemplateOverlay(slide.templateSection || null);
  overlayEl.hidden = false;
  sendStateToPresenter();
}

function closeTemplateOverlay() {
  overlayEl.hidden = true;
  sendStateToPresenter();
}

document.getElementById('btn-template').addEventListener('click', openTemplateOverlay);
document.getElementById('btn-toggle-notes').addEventListener('click', toggleNotesVisibility);
document.getElementById('btn-toc-collapse').addEventListener('click', toggleTocCollapse);
document.getElementById('btn-next-collapse').addEventListener('click', toggleNextCollapse);
document.getElementById('btn-overlay-close').addEventListener('click', closeTemplateOverlay);
overlayEl.addEventListener('click', (e) => {
  if (e.target === overlayEl) closeTemplateOverlay();
});

/* ---------- Finish celebration overlay ---------- */

function openFinishOverlay() {
  finishOverlayEl.hidden = false;
}

function closeFinishOverlay() {
  finishOverlayEl.hidden = true;
  stopConfetti();
}

/* ---------- Pause overlay (presenter-triggered cutaway) ---------- */

// Presenter-only cutaway: covers the whole viewport without touching
// currentIndex, any overlay, or either aside's own state — see
// docs/superpowers/specs/2026-08-22-presenter-view-design.md §6.
function showPauseOverlay() {
  document.getElementById('pause-overlay-text').textContent = CONFIG.ui.pauseOverlayText;
  pauseOverlayEl.hidden = false;
  sendStateToPresenter();
}

function hidePauseOverlay() {
  pauseOverlayEl.hidden = true;
  sendStateToPresenter();
}

function isPauseOverlayVisible() {
  return !pauseOverlayEl.hidden;
}

document.getElementById('btn-timer-finish').addEventListener('click', () => {
  launchConfetti();
  openFinishOverlay();
});
document.getElementById('btn-finish-close').addEventListener('click', closeFinishOverlay);
document.getElementById('btn-finish-back').addEventListener('click', closeFinishOverlay);
finishOverlayEl.addEventListener('click', (e) => {
  if (e.target === finishOverlayEl) closeFinishOverlay();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!finishOverlayEl.hidden) closeFinishOverlay();
  else if (!overlayEl.hidden) closeTemplateOverlay();
  else if (isPauseOverlayVisible()) hidePauseOverlay();
});

/* ---------- Apply config-driven strings/toggles ---------- */

function applyConfigStrings() {
  applyAppLanguage();
  document.title = CONFIG.title;
  document.documentElement.lang = CONFIG.lang;
  document.documentElement.style.setProperty('--transition-out-ms', `${ANIM_OUT_MS}ms`);
  document.documentElement.style.setProperty('--transition-in-ms', `${ANIM_IN_MS}ms`);

  document.getElementById('toc-heading').textContent = CONFIG.toc.heading;
  renderDiscoTitle(CONFIG.disco.titleLines);

  document.getElementById('btn-template-label').textContent = CONFIG.ui.templateButton;
  document.getElementById('btn-template').setAttribute('aria-label', CONFIG.ui.templateButton);
  document.getElementById('btn-template').hidden = !CONFIG.templateOverlay.enabled;
  document.getElementById('btn-presenter-view-label').textContent = CONFIG.ui.presenterViewButton;
  document.getElementById('btn-presenter-view').setAttribute('aria-label', CONFIG.ui.presenterViewButton);
  updateNotesToggleLabel();
  document.getElementById('btn-toc-collapse').setAttribute('aria-label', CONFIG.ui.tocCollapseHide);
  document.getElementById('btn-next-collapse').setAttribute('aria-label', CONFIG.ui.controlsCollapseHide);
  setTimerToggleUI(false);
  const timerAdd5Label = `+${CONFIG.timer.addMinutes} min`;
  document.getElementById('timer-add5-label').textContent = timerAdd5Label;
  document.getElementById('btn-timer-add5').setAttribute('aria-label', timerAdd5Label);
  document.getElementById('btn-timer-finish-label').textContent = CONFIG.ui.timerFinish;
  document.getElementById('btn-timer-finish').setAttribute('aria-label', CONFIG.ui.timerFinish);
  document.getElementById('btn-next-label').textContent = CONFIG.ui.navNext;
  document.getElementById('btn-next').setAttribute('aria-label', CONFIG.ui.navNext);
  document.getElementById('btn-prev-label').textContent = CONFIG.ui.navPrev;
  document.getElementById('btn-prev').setAttribute('aria-label', CONFIG.ui.navPrev);

  document.getElementById('btn-overlay-close').setAttribute('aria-label', CONFIG.ui.overlayCloseLabel);
  document.getElementById('overlay-title-text').textContent = CONFIG.ui.overlayTitle;

  document.getElementById('btn-finish-close').setAttribute('aria-label', CONFIG.ui.backToDeckLabel);
  document.getElementById('finish-title').textContent = CONFIG.ui.finishTitle;
  document.getElementById('finish-body').innerHTML = CONFIG.ui.finishBodyHtml;
  document.getElementById('finish-back-label').textContent = CONFIG.ui.backToDeckLabel;
}

/* ---------- Presenter View launch (skipped entirely in preview iframes) ---------- */

let presenterRef = null;

function openPresenterView() {
  presenterRef = window.open('presenter.html', 'presenterView');
}

function setPresenterConnected(connected) {
  if (presenterConnected === connected) return;
  presenterConnected = connected;

  if (connected) {
    nextCollapsedBeforePresenter = nextCollapsed;
    nextCollapsed = false;
    presenterHidesControls = true;
  } else {
    presenterHidesControls = false;
    nextCollapsed = nextCollapsedBeforePresenter === null ? nextCollapsed : nextCollapsedBeforePresenter;
    nextCollapsedBeforePresenter = null;
  }
  renderNextPaneState();
}

// window.closed is the one dependable same-origin/file:// signal available
// when the separate Presenter View is closed. Restore the main-screen
// controls promptly without requiring another user action in index.html.
setInterval(() => {
  if (!presenterConnected || !presenterRef || !presenterRef.closed) return;
  presenterRef = null;
  setPresenterConnected(false);
}, 500);

if (!isEmbedPreview) {
  document.getElementById('btn-presenter-view').addEventListener('click', openPresenterView);
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'P') openPresenterView();
  });
}

// Whitelisted commands a connected Presenter View may send. Each handler
// takes the full message payload (only GO_TO_SLIDE uses it) and is trusted
// to leave state consistent — the listener below broadcasts once after
// every successful dispatch, so handlers never need to call
// sendStateToPresenter() themselves.
// Object.create(null) as the prototype means a command name that collides
// with an inherited Object.prototype member (e.g. "toString") looks up to
// undefined instead of resolving to a truthy inherited function, so the
// `if (!handler) return;` check below correctly rejects it.
const COMMAND_HANDLERS = Object.assign(Object.create(null), {
  NEXT_SLIDE: () => goNext(),
  PREVIOUS_SLIDE: () => goPrev(),
  GO_TO_SLIDE: (data) => {
    const slide = Number(data.slide);
    if (Number.isInteger(slide)) goTo(slide, { animate: false });
  },
  TOGGLE_CONTEXT_OVERLAY: () => (overlayEl.hidden ? openTemplateOverlay() : closeTemplateOverlay()),
  SHOW_CONTEXT_OVERLAY: () => openTemplateOverlay(),
  HIDE_CONTEXT_OVERLAY: () => closeTemplateOverlay(),
  TOGGLE_LEFT_ASIDE: () => toggleTocCollapse(),
  SHOW_LEFT_ASIDE: () => { if (tocCollapsed) toggleTocCollapse(); },
  HIDE_LEFT_ASIDE: () => { if (!tocCollapsed) toggleTocCollapse(); },
  TOGGLE_RIGHT_ASIDE: () => setRightAsideVisible(presenterHidesControls || nextCollapsed),
  SHOW_RIGHT_ASIDE: () => setRightAsideVisible(true),
  HIDE_RIGHT_ASIDE: () => setRightAsideVisible(false),
  TOGGLE_PAUSE_OVERLAY: () => (isPauseOverlayVisible() ? hidePauseOverlay() : showPauseOverlay()),
  SHOW_PAUSE_OVERLAY: () => showPauseOverlay(),
  HIDE_PAUSE_OVERLAY: () => hidePauseOverlay(),
  REQUEST_STATE: () => {}, // no-op handler: the broadcast below every dispatch is what answers it
});

// Message listener is registered unconditionally (not gated on
// isEmbedPreview): a Task 6 preview iframe (isEmbedPreview === true) still
// needs to receive and act on messages — it just never opens its own
// Presenter View or navigates on its own (that's what the guard above is
// for).
window.addEventListener('message', (e) => {
  // Preview iframes (?embed=preview) are driven exclusively by
  // presenter.js's syncPreview() via `window.parent`: a preview-state
  // snapshot (asides/overlays) plus a GO_TO_SLIDE command for the slide
  // index. They never establish a presenterRef of their own and never fall
  // through to the ordinary command dispatch below.
  if (isEmbedPreview) {
    if (e.source !== window.parent) return;
    if (!e.data) return;
    if (e.data.type === 'preview-state') {
      if (!overlayEl.hidden !== e.data.contextOverlayVisible) {
        e.data.contextOverlayVisible ? openTemplateOverlay() : closeTemplateOverlay();
      }
      if (tocCollapsed !== !e.data.leftAsideVisible) toggleTocCollapse();
      // Presenter previews should mirror the audience screen exactly. While
      // Presenter View is connected, a hidden right aside disappears there
      // completely; it is not the ordinary collapsed icon rail.
      nextCollapsed = false;
      presenterHidesControls = !e.data.rightAsideVisible;
      renderNextPaneState();
      if (isPauseOverlayVisible() !== e.data.pauseOverlayVisible) {
        e.data.pauseOverlayVisible ? showPauseOverlay() : hidePauseOverlay();
      }
      return;
    }
    if (e.data.type === 'command' && e.data.command === 'GO_TO_SLIDE') {
      const slide = Number(e.data.slide);
      if (Number.isInteger(slide)) goTo(slide, { animate: false });
    }
    return;
  }
  if (!e.data || e.data.type !== 'command') return; // schema check, done once
  if (presenterRef && !presenterRef.closed) {
    if (e.source !== presenterRef) return;
  } else if (e.data.command !== 'REQUEST_STATE') {
    return; // bootstrap gate: only a REQUEST_STATE may establish presenterRef
  } else {
    presenterRef = e.source;
  }
  setPresenterConnected(true);
  const handler = COMMAND_HANDLERS[e.data.command];
  if (!handler) return; // unknown command: ignored, never executed
  handler(e.data);
  sendStateToPresenter();
});

function sendStateToPresenter() {
  if (!presenterRef || presenterRef.closed) return;
  // targetOrigin '*' is deliberate: file:// pages have opaque origins, so
  // event.origin can't be checked meaningfully. Sender identity is verified
  // instead via e.source === presenterRef in the message listener above.
  presenterRef.postMessage(
    {
      type: 'state',
      currentSlide: state.currentIndex,
      totalSlides: SLIDES.length,
      contextOverlayVisible: !overlayEl.hidden,
      leftAsideVisible: !tocCollapsed,
      rightAsideVisible: !nextCollapsed && !presenterHidesControls,
      pauseOverlayVisible: isPauseOverlayVisible(),
      // Non-null for the whole time the audience sees a disco transition
      // (animating, or frozen mid-'pause'-mode hold) — never set for an
      // ordinary non-disco transition. Presenter View shows this as a still
      // (the title text on a disco-colored card), not a live mirror.
      discoTitleLines: activeDiscoTitleLines,
    },
    '*'
  );
}

/* ---------- Init ---------- */

applyConfigStrings();
renderTocOnce();
renderSlide();
updateTocActiveState();
