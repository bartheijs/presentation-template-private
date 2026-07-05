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
  title: 'Skill Engineering Workshop',

  toc: {
    heading: 'Inhoud',
  },

  disco: {
    enabled: true, // global default; a slide's own `disco: true/false` overrides this
    titleLines: ['SKILLS', 'THRILLS'], // one <span> per entry on the disco background
    mode: 'auto', // 'auto' (default, single click plays the whole flash) | 'pause'
    // (freezes fully visible after the outgoing slide leaves; a second
    // matching click/arrow finishes landing on the next slide). A slide's
    // own `discoMode` overrides this for the transition landing on it.
  },

  timer: {
    defaultMinutes: 30, // also doubles as the ceiling when using "+N min"
    addMinutes: 5,
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
    timerStart: 'Start',
    timerPause: 'Pause',
    timerFinish: 'Klaar!',
    navNext: 'Volgende',
    navPrev: 'Vorige',
    overlayCloseLabel: 'Sluiten',
    overlayTitle: 'skill.md template',
    backToDeckLabel: 'Terug naar de presentatie',
    finishTitle: 'Eindelijk kunnen we aan de slag!',
    // Set via innerHTML at startup — trusted local config, not user input.
    finishBodyHtml:
      'Tijd om je eigen <code>skill.md</code> te bouwen — schrijf het proces één keer goed op, en je hoeft het nooit meer opnieuw uit te leggen.',
  },
};
