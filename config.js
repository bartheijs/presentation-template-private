/*
 * Presentation-wide configuration. Classic script (not a module), loaded
 * before slides-data.js and app.js so CONFIG is available as a bare global
 * — same pattern app.js already uses to depend on SLIDES.
 *
 * A new presentation branch should only need to edit THIS file plus
 * slides-data.js. Theme colors (incl. --disco-* tokens) still live in the
 * :root block of styles.css — that's the one deliberate exception, see
 * README.md.
 */

const CONFIG = {
  lang: 'nl',
  title: 'Wat Skillen We Vandaag?',

  toc: {
    heading: 'Inhoud',
  },

  layout: {
    align: 'left', // 'center' (default) | 'left' — global default for the
    // slide-content block (heading + bullets); a slide's own `align`
    // overrides this just for that slide.
  },

  disco: {
    enabled: false, // global default; a slide's own `disco: true/false` overrides this
    titleLines: ['SKILL', 'THRILL'], // one <span> per entry on the disco background
    mode: 'auto', // 'auto' (default, single click plays the whole flash) | 'pause'
    // (freezes fully visible after the outgoing slide leaves; a second
    // matching click/arrow finishes landing on the next slide). A slide's
    // own `discoMode` overrides this for the transition landing on it.
  },

  timer: {
    defaultMinutes: 30, // presenter's live-build timer; started for the
    // whole 45-min slot, leaving >=15 min free for the live build itself
    addMinutes: 5,
  },

  // Slide transition timing (button/keyboard nav only). outMs/inMs must stay
  // in sync with the CSS animation durations in styles.css, which read them
  // via --transition-out-ms/--transition-in-ms (set from these values at
  // startup) — so changing speed only requires editing this block.
  transitions: {
    outMs: 360, // content/notes slide-out duration
    inMs: 550, // content/notes slide-in duration
    discoRevealDelayMs: 120, // disco bg starts fading in this long after "out" begins
    discoHideLeadMs: 340, // start hiding disco bg this long before panels land
  },

  // Independent from the CSS --accent-*/--disco-* tokens on purpose: canvas
  // fillStyle needs a plain JS string, and reading CSS custom properties
  // back into JS would add a getComputedStyle round trip for no benefit.
  confettiColors: ['#FF3D6E', '#FFB703', '#06D6A0', '#3AB0FF', '#8657FF'],

  // Hides the "Skill Template" button + its ArrowDown shortcut entirely for
  // presentations that don't use the skill.md-template concept.
  templateOverlay: {
    enabled: true,
  },

  ui: {
    templateButton: 'Skill Template',
    notesToggleHide: 'Notities verbergen', // shown while notes are visible (clicking hides them)
    notesToggleShow: 'Notities tonen', // shown while notes are hidden (clicking shows them)
    timerStart: 'Start',
    timerPause: 'Pause',
    timerFinish: 'Klaar!',
    navNext: 'Volgende',
    navPrev: 'Vorige',
    tocCollapseHide: 'Inhoud verbergen', // shown while the TOC pane is open (clicking collapses it)
    tocCollapseShow: 'Inhoud tonen', // shown while the TOC pane is collapsed (clicking expands it)
    controlsCollapseHide: 'Bediening inklappen', // shown while the controls pane is open
    controlsCollapseShow: 'Bediening uitklappen', // shown while the controls pane is collapsed
    overlayCloseLabel: 'Sluiten',
    overlayTitle: 'skill.md template',
    backToDeckLabel: 'Terug naar de presentatie',
    finishTitle: 'Eindelijk kunnen we aan de slag!',
    // Set via innerHTML at startup — trusted local config, not user input.
    finishBodyHtml: 'Laten we samen een skill bouwen!',
  },
};
