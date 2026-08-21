# Tests

Automated Playwright tests for this presentation. These are **entirely
optional** and only needed if you want to verify a change — viewing the
presentation itself (double-click `index.html`) needs zero dependencies,
exactly as before.

## Setup (opt-in, one-time)

1. Install the test runner package (small, a few MB):
   ```
   npm install
   ```
   If you'd rather not even trigger the one-time browser download yet at
   this step, run instead:
   ```
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
   ```
2. Install the browser binary (one-time, ~100-300MB, cached afterward):
   ```
   npx playwright install chromium
   ```

If you skip step 2 and just try to run the tests anyway, Playwright's own
error message will name exactly which browser binary is missing and the
exact command to fix it — nothing silent or confusing.

## Running

```
npm test
```
or equivalently:
```
npx playwright test
```

## What each file covers

- `config-and-ui.spec.js` — `config.js` values applied to the DOM at
  startup (`applyConfigStrings()`), and the `templateOverlay.enabled`
  toggle (button visibility + `ArrowDown` shortcut).
- `disco-and-pause.spec.js` — global/per-slide `disco` enable, per-slide
  auto-mode hold timing, `auto` vs
  `pause` transition mode, and the pause state machine: freeze, resume on a
  matching click, cancel on the opposite direction or any TOC click
  (distant or the current row), and the rapid-double-click guard.
- `layout.spec.js` — `CONFIG.layout.align`/per-slide `align`, the 8/12
  column `.slide-inner` wrapper staying centered regardless of alignment,
  the 900px responsive breakpoint, bullet subtext rendering (plain string
  vs `{ text, subtext }`), and the `isTemplateAnchor` compact slides.
- `notes-resize.spec.js` — the `flex-grow` transition on `#slide-content`
  that smooths the resize when speaker-notes presence differs between the
  outgoing and incoming slide, across all with/without combinations.
- `notes-toggle.spec.js` — the presenter-only notes visibility toggle: label
  flip, smooth resize (reusing the notes-resize fix), heading position
  staying fixed, persistence across slide navigation, and the guard that
  ignores the toggle during an in-flight transition.
- `regression.spec.js` — a full click-through of every slide (forward and
  back), PageDown/PageUp presentation-clicker navigation, and both overlays
  opening/closing, asserting zero console/page errors, plus malformed-slide-
  data resilience checks.

If a future change breaks one of these, the failing spec file name points
directly at which part of the engine to look at — no need to re-derive
context from scratch.

## Known limitation: some tests assume this deck's content

Most tests only assume "at least a handful of slides exist" and mutate
`SLIDES`/`CONFIG` in-page, so they work regardless of what the actual
content is. One exception: `layout.spec.js`'s `isTemplateAnchor` test
assumes slide index 8 (the 9th slide) is a `isTemplateAnchor: true` slide
with an inline `.slide-template-code` block — in the demo this is used for
the generic Presentation brief reference (see
`scaffold-presentation`/`update-slides`'s skill docs). A presentation forked
for a different topic that doesn't use that concept should remove or adapt
that one test; it isn't testing generic engine behavior.
