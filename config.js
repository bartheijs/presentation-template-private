/*
 * Presentation-wide configuration. Classic script (not a module), loaded
 * from <head> (before styles.css) in both index.html and presenter.html so
 * the active theme can be applied before first paint — see the inline
 * data-theme script right after this file's <script> tag in each HTML file.
 * It's still loaded before slides-data.js and app.js too, so CONFIG is
 * available as a bare global — same pattern app.js already uses to depend
 * on SLIDES.
 *
 * A new presentation branch should only need to edit THIS file plus
 * slides-data.js. `theme` picks which palette applies; the actual color
 * values (incl. --disco-* tokens) live in styles.css's :root block
 * (`default` theme) and themes/<name>/theme.css (every other theme) — see
 * README.md.
 */

const CONFIG = {
  lang: 'nl',
  title: 'Presentation Template Demo',

  // 'default' or 'conclusion' (see themes/conclusion/theme.css). Chosen once
  // when the presentation is set up and not meant to change at runtime — see
  // README.md for how to add a new theme.
  theme: 'conclusion',

  // Only rendered when a theme's chrome uses it (currently just
  // `conclusion`'s corner wordmark + footer tagline). Leave blank for a
  // generic Conclusion look, or fill in for a specific business unit.
  brand: {
    businessUnit: 'Low Code Company',
    tagline: 'Business done differently',
  },

  layout: {
    align: 'center', // 'center' (default) | 'left' — global default for the
    // slide-content block (heading + bullets); a slide's own `align`
    // overrides this just for that slide.
  },

  disco: {
    enabled: false, // global default; a slide's own `disco: true/false` overrides this
    titleLines: ['DEMO', 'MODE'], // one <span> per entry on the disco background
    mode: 'auto', // 'auto' (default, single click plays the whole flash) | 'pause'
    // (freezes fully visible after the outgoing slide leaves; a second
    // matching click/arrow finishes landing on the next slide). A slide's
    // own `discoMode` overrides this for the transition landing on it.
  },

  timer: {
    defaultMinutes: 20,
    addMinutes: 5,
    warningMinutes: 5,
    warningDurationMs: 5000,
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

  // Hides the generic reference-overlay button + its ArrowDown shortcut
  // entirely for presentations that do not need supporting reference text.
  templateOverlay: {
    enabled: true,
  },

};
