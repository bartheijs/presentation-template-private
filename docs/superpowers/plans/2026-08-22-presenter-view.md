# Presenter View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a companion Presenter View window (`presenter.html`) to the presentation engine, synchronized with the existing Presentation View (`index.html`) via `window.open()` + `postMessage`, without changing the Presentation View's existing visual appearance or navigation behavior beyond one new launch button.

**Architecture:** The Presentation View (`app.js`) stays the sole source of truth for all real presentation state (current slide, context-overlay/aside/pause-overlay visibility) and exposes it through a small command/state `postMessage` protocol. The Presenter View (`presenter.js`, new) sends commands and renders whatever state comes back — it never assumes an action succeeded on its own. Two preview `<iframe>`s inside `presenter.html`, each a real `index.html?embed=preview` instance, are driven by the same protocol to render the current/next-slide previews without duplicating any rendering logic.

**Tech Stack:** Vanilla JS (classic scripts, no bundler), `postMessage`/`window.open()`, Playwright for tests — matches the existing repo exactly.

**Spec:** `docs/superpowers/specs/2026-08-22-presenter-view-design.md`

## Global Constraints

- The Presentation View stays visually and functionally unchanged except for one new "Open Presenter View" button (spec §1). No clock, progress bars, notes panel, or other presenter UI in `index.html` beyond that button.
- The Presenter View is only ever opened from the Presentation View (button or `Shift+P`) — it is not a supported standalone entry point. Opened directly (no `window.opener`), it must show a "Niet verbonden" state, never a broken/blank UI (spec §1, §3 scenario 6).
- No local web server, no build step. Everything runs directly via `file://`, exactly like today.
- `postMessage(..., '*')` is deliberately used as `targetOrigin` — a code comment must explain why (opaque `file://` origins make origin-string checks meaningless; sender-identity checking is the real boundary). Never add an `event.origin` check in place of the sender-identity check.
- Every message handler validates sender identity (against the relationship-specific reference from spec §2) and message schema (`type` + whitelisted `command`) before acting on it.
- The existing Vorige button and `PREVIOUS_SLIDE` command must keep their exact current behavior (`currentIndex - 1`). Do not add a shared navigation-history array to `app.js`.
- Previews (the two iframes) are only ever driven by `GO_TO_SLIDE` + absolute `preview-state` snapshots — never by `TOGGLE_*` commands.
- Reuse existing engine functions/state (`goNext`, `goTo`, `openTemplateOverlay`/`closeTemplateOverlay`, `toggleTocCollapse`, `toggleNextCollapse`, `tocCollapsed`, `nextCollapsed`) rather than re-implementing their logic.
- All new/modified files stay classic scripts (no ES modules, no `fetch()`), matching the existing `file://` requirement.

---

## File Structure

| File | Role |
|---|---|
| `app.js` (modify) | Pause-overlay engine feature; message listener with bootstrap+validation; command dispatch; state broadcaster; launch button/shortcut handler; `?embed=preview` listener suppression. |
| `index.html` (modify) | New hidden pause-overlay markup; new "Open Presenter View" button in the right controls column. |
| `styles.css` (modify) | New pause-overlay styles only. |
| `config.js` (modify) | New `ui.presenterViewButton` and `ui.pauseOverlayText` strings. |
| `slides-data.js` (modify) | Document the new optional `duration` field; add example values to the demo deck. |
| `presenter.html` (new) | Presenter View document: connection status, previews, notes, progress/timing, controls. |
| `presenter.js` (new) | All Presenter-View-only logic: window refs, command sending, `preview-state` sync, `pendingNextSlide`/`lastJumpOriginIndex`, timer, clock, timing math. |
| `presenter.css` (new) | Presenter-View-only layout (grid, preview scaling, progress bars, connection banner). Reuses `styles.css` tokens via a shared `<link>`, not duplication. |
| `tests/helpers.js` (modify) | Add a `openPresenterView(page)` helper returning the popup `Page`. |
| `tests/presenter-view.spec.js` (new) | Protocol, reconnect, pause overlay, skip-ahead, previews. |
| `tests/presenter-view-timing.spec.js` (new) | Duration metadata, schedule-delta math, timer persistence. |

---

### Task 1: Pause overlay (engine feature, no messaging yet)

**Files:**
- Modify: `index.html` (after `</div>` closing `.app-shell`, before `<div class="overlay-backdrop"...>`, around line 134)
- Modify: `styles.css` (new rule block, after the finish-overlay block ending ~line 1014, before the confetti-canvas block)
- Modify: `config.js` (in the `ui:` block, around line 82, after `finishBodyHtml`)
- Modify: `app.js` (`CONFIG_DEFAULTS.ui`, around line 42; new DOM ref near line 118; new functions after `closeFinishOverlay` around line 1018; Escape handler around lines 1030-1034)
- Test: `tests/presenter-view.spec.js` (new file)

**Interfaces:**
- Produces: `pauseOverlayEl` (module-scope `const`, mirrors `finishOverlayEl`'s pattern), `showPauseOverlay()`, `hidePauseOverlay()`, `isPauseOverlayVisible()` (returns `!pauseOverlayEl.hidden`) — all global (classic-script) functions/bindings later tasks call directly.

- [ ] **Step 1: Write the failing test**

Create `tests/presenter-view.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { gotoPresentation } = require('./helpers');

test.describe('pause overlay engine feature', () => {
  test('showPauseOverlay/hidePauseOverlay toggle the overlay and do not change the current slide', async ({ page }) => {
    await gotoPresentation(page);
    // eslint-disable-next-line no-undef
    const before = await page.evaluate(() => state.currentIndex);

    await page.evaluate(() => showPauseOverlay());
    await expect(page.locator('#pause-overlay')).toBeVisible();

    // eslint-disable-next-line no-undef
    const during = await page.evaluate(() => state.currentIndex);
    expect(during).toBe(before);

    await page.evaluate(() => hidePauseOverlay());
    await expect(page.locator('#pause-overlay')).toBeHidden();
  });

  test('Escape closes the pause overlay when no other overlay is open', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => showPauseOverlay());
    await expect(page.locator('#pause-overlay')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-overlay')).toBeHidden();
  });

  test('Escape closes the template overlay first when both are open', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      showPauseOverlay();
      openTemplateOverlay();
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('#template-overlay')).toBeHidden();
    // Pause overlay is untouched by this first Escape — matches the
    // existing precedence (finish > template) the new branch is appended to.
    await expect(page.locator('#pause-overlay')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: FAIL — `#pause-overlay` has no matching element yet (`showPauseOverlay is not defined`).

- [ ] **Step 3: Add the markup**

In `index.html`, immediately after the closing `</div>` of `.app-shell` (the line right before `<div class="overlay-backdrop" id="template-overlay" hidden>`):

```html
<div class="pause-overlay" id="pause-overlay" hidden>
  <p class="pause-overlay-text" id="pause-overlay-text"></p>
</div>
```

- [ ] **Step 4: Add the styles**

In `styles.css`, after the `#confetti-canvas` rule block (the last rule in the file, ending around what is currently line 1020+ after Task-1's own additions — insert this new block right after that closing `}`):

```css
/* ---------- Pause overlay (presenter-triggered cutaway) ---------- */
.pause-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500; /* above #confetti-canvas (2000); finish-overlay is 1500 */
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pause-overlay-text {
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: 600;
}
```

- [ ] **Step 5: Add the config string**

In `config.js`, inside the `ui:` block, right after `finishBodyHtml: '...'`:

```js
    pauseOverlayText: 'Even een zijstap',
```

In `app.js`'s `CONFIG_DEFAULTS.ui` (mirrors every key `config.js` has — same fallback pattern already used for `finishBodyHtml`), add:

```js
    pauseOverlayText: '',
```

- [ ] **Step 6: Add the DOM ref, functions, and Escape branch**

In `app.js`, next to the existing overlay element refs (near `const finishOverlayEl = document.getElementById('finish-overlay');`):

```js
const pauseOverlayEl = document.getElementById('pause-overlay');
```

After `closeFinishOverlay()`'s definition, add:

```js
/* ---------- Pause overlay (presenter-triggered cutaway) ---------- */

// Presenter-only cutaway: covers the whole viewport without touching
// currentIndex, any overlay, or either aside's own state — see
// docs/superpowers/specs/2026-08-22-presenter-view-design.md §6.
function showPauseOverlay() {
  document.getElementById('pause-overlay-text').textContent = CONFIG.ui.pauseOverlayText;
  pauseOverlayEl.hidden = false;
}

function hidePauseOverlay() {
  pauseOverlayEl.hidden = true;
}

function isPauseOverlayVisible() {
  return !pauseOverlayEl.hidden;
}
```

Extend the existing Escape handler (currently):
```js
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!finishOverlayEl.hidden) closeFinishOverlay();
  else if (!overlayEl.hidden) closeTemplateOverlay();
});
```
to:
```js
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!finishOverlayEl.hidden) closeFinishOverlay();
  else if (!overlayEl.hidden) closeTemplateOverlay();
  else if (isPauseOverlayVisible()) hidePauseOverlay();
});
```

Also call `applyConfigStrings()`'s existing pattern — no new call needed here since `pauseOverlayText` is read lazily inside `showPauseOverlay()`, not applied at startup.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add index.html styles.css config.js app.js tests/presenter-view.spec.js
git commit -m "Add pause overlay engine feature with Escape recovery"
```

---

### Task 2: Launch button/shortcut + presenter.html/presenter.js skeleton with connection status

**Files:**
- Modify: `index.html` (new button inside `.toc-widgets`, around line 96, between `btn-toggle-notes` and `timer-widget`)
- Modify: `config.js` (new `ui.presenterViewButton` string)
- Modify: `app.js` (`CONFIG_DEFAULTS.ui`; new launch handler + `?embed=preview` guard near the bottom of the file, before `applyConfigStrings()`; one new line inside `applyConfigStrings()`)
- Create: `presenter.html`
- Create: `presenter.js`
- Create: `presenter.css`
- Modify: `tests/helpers.js` (add `openPresenterView`)
- Test: `tests/presenter-view.spec.js` (append)

**Interfaces:**
- Produces (in `app.js`, global): `presenterRef` (module-scope `let`, initially `null`), `openPresenterView()` (the shared function both the button and the shortcut call), `isEmbedPreview` (`const`, `true` when `new URLSearchParams(location.search).get('embed') === 'preview'`).
- Produces (in `presenter.js`, global): `presentationRef` (module-scope `let`), a `postMessage` listener attached to `window`.
- Consumes: nothing from Task 1 directly (independent concern), but shares the same `app.js` file.

- [ ] **Step 1: Write the failing tests**

Add to `tests/helpers.js` (after `waitIdle`, before `module.exports`):

```js
// Opens the Presenter View the same way a real presenter would: clicking
// the button in the Presentation View, which is what actually establishes
// the window.open()/postMessage relationship the spec's §2 relies on.
async function openPresenterView(page) {
  const popupPromise = page.waitForEvent('popup');
  await page.click('#btn-presenter-view');
  const popup = await popupPromise;
  await popup.waitForLoadState();
  return popup;
}

module.exports = { FILE_URL, gotoPresentation, waitIdle, openPresenterView };
```

Append to `tests/presenter-view.spec.js`:

```js
const { openPresenterView } = require('./helpers');

test.describe('launch mechanism and connection status', () => {
  test('clicking the button opens presenter.html and shows connected', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    expect(presenter.url()).toMatch(/presenter\.html$/);
    await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
  });

  test('Shift+P also opens presenter.html', async ({ page }) => {
    await gotoPresentation(page);
    const popupPromise = page.waitForEvent('popup');
    await page.keyboard.press('Shift+P');
    const presenter = await popupPromise;
    await presenter.waitForLoadState();
    expect(presenter.url()).toMatch(/presenter\.html$/);
  });

  test('presenter.html opened directly, with no opener, shows disconnected', async ({ page }) => {
    const path = require('path');
    await page.goto('file://' + path.resolve(__dirname, '..', 'presenter.html'));
    await expect(page.locator('[data-connection-status]')).toHaveText('Niet verbonden');
    await expect(page.locator('[data-connection-hint]')).toContainText('open deze pagina via de Presentatieweergave');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: FAIL — `#btn-presenter-view` doesn't exist / `presenter.html` doesn't exist (404 on `file://`).

- [ ] **Step 3: Add the button markup**

In `index.html`, inside `.toc-widgets`, between the `btn-toggle-notes` button and the `timer-widget` div:

```html
      <button id="btn-presenter-view" class="btn-floating btn-presenter-view btn-compact-collapsible" type="button">
        <svg class="icon"><use href="#icon-layers"></use></svg>
        <span id="btn-presenter-view-label" class="btn-label-text"></span>
      </button>
```

(`.btn-floating`/`.btn-compact-collapsible` already provide full styling — confirmed no button-specific CSS exists for `.btn-template`/`.btn-toggle-notes` beyond those two shared classes, so no new CSS is needed here. `#icon-layers` already exists in the SVG sprite.)

- [ ] **Step 4: Add the config string**

In `config.js`, in the `ui:` block, after `backToDeckLabel`:
```js
    presenterViewButton: 'Presenter View',
```
In `app.js`'s `CONFIG_DEFAULTS.ui`:
```js
    presenterViewButton: 'Presenter View',
```

- [ ] **Step 5: Add the launch handler and embed-preview guard to `app.js`**

Add near the top of `app.js`, right after `normalizeConfig(CONFIG, CONFIG_DEFAULTS);`:

```js
// ?embed=preview marks this document as a passive preview iframe inside
// presenter.html (see docs/superpowers/specs/2026-08-22-presenter-view-design.md
// §7): it must not navigate/launch on its own, only render commands it
// receives.
const isEmbedPreview = new URLSearchParams(location.search).get('embed') === 'preview';
```

Add near the bottom, just before `applyConfigStrings();` in the Init block:

```js
/* ---------- Presenter View launch (skipped entirely in preview iframes) ---------- */

let presenterRef = null;

function openPresenterView() {
  presenterRef = window.open('presenter.html', 'presenterView');
}

if (!isEmbedPreview) {
  document.getElementById('btn-presenter-view').addEventListener('click', openPresenterView);
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'P') openPresenterView();
  });
}
```

In `applyConfigStrings()`, next to the other button label assignments (near `btn-template-label`):
```js
  document.getElementById('btn-presenter-view-label').textContent = CONFIG.ui.presenterViewButton;
  document.getElementById('btn-presenter-view').setAttribute('aria-label', CONFIG.ui.presenterViewButton);
```

- [ ] **Step 6: Create `presenter.css`**

```css
:root {
  color-scheme: light dark;
}
body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
}
.connection-banner {
  padding: 0.75rem 1rem;
  font-weight: 600;
  text-align: center;
}
.connection-banner[data-connected="false"] {
  background: var(--surface-alt);
  color: var(--text-muted);
}
.connection-banner[data-connected="true"] {
  display: none;
}
```

- [ ] **Step 7: Create `presenter.html`**

```html
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presenter View</title>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="presenter.css">
</head>
<body>

<div class="connection-banner" id="connection-banner" data-connected="false">
  <span data-connection-status>Niet verbonden</span>
  <p data-connection-hint>Open deze pagina via de Presentatieweergave (de Presenter View-knop of Shift+P), niet rechtstreeks.</p>
</div>

<script src="config.js"></script>
<script src="slides-data.js"></script>
<script src="presenter.js"></script>
</body>
</html>
```

- [ ] **Step 8: Create `presenter.js`**

```js
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
  presentationRef.postMessage({ type: 'command', command: 'REQUEST_STATE' }, '*');
}

window.addEventListener('message', (e) => {
  if (!presentationRef) return; // no opener at all — see §3 scenario 6
  if (e.source !== presentationRef) return;
  if (!e.data || e.data.type !== 'state') return;
  setConnected(true);
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
```

- [ ] **Step 9: Wire the Presentation View's reply to `REQUEST_STATE`**

In `app.js`, add the other half of the handshake — the message listener that answers from the Presentation View side. Add this near the bottom, inside the `if (!isEmbedPreview) { ... }` block from Step 5, after the existing shortcut listener:

```js
  window.addEventListener('message', (e) => {
    if (presenterRef && !presenterRef.closed) {
      if (e.source !== presenterRef) return;
    } else if (!e.data || e.data.type !== 'command' || e.data.command !== 'REQUEST_STATE') {
      return; // bootstrap gate: only a REQUEST_STATE may establish presenterRef
    } else {
      presenterRef = e.source;
    }
    if (!e.data || e.data.type !== 'command') return;
    if (e.data.command === 'REQUEST_STATE') sendStateToPresenter();
  });

  function sendStateToPresenter() {
    if (!presenterRef || presenterRef.closed) return;
    presenterRef.postMessage(
      {
        type: 'state',
        currentSlide: state.currentIndex,
        totalSlides: SLIDES.length,
        contextOverlayVisible: !overlayEl.hidden,
        leftAsideVisible: !tocCollapsed,
        rightAsideVisible: !nextCollapsed,
        pauseOverlayVisible: isPauseOverlayVisible(),
      },
      '*'
    );
  }
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (6 tests: 3 from Task 1, 3 new).

- [ ] **Step 11: Commit**

```bash
git add index.html config.js app.js presenter.html presenter.js presenter.css tests/helpers.js tests/presenter-view.spec.js
git commit -m "Add Presenter View launch button/shortcut and connection handshake"
```

---

### Task 3: Full command whitelist + state broadcast after every state-changing action

**Files:**
- Modify: `app.js` (extend the message listener from Task 2; wrap existing action functions with a broadcast call)
- Modify: `presenter.js` (render the received `state`, add control buttons)
- Modify: `presenter.html` (add control buttons/labels)
- Test: `tests/presenter-view.spec.js` (append)

**Interfaces:**
- Consumes: `sendStateToPresenter()`, `presenterRef`, `pauseOverlayEl`/`showPauseOverlay`/`hidePauseOverlay`/`isPauseOverlayVisible` (Tasks 1-2).
- Produces: `COMMAND_HANDLERS` (an object literal in `app.js` mapping each whitelisted command string to a zero/one-arg function), `dispatchCommand(data)`, and in `presenter.js`: `sendCommand(command, extra)`, `renderState(state)`, `latestState` (module-scope, the last received `state` message).

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view.spec.js`:

```js
test.describe('command whitelist and state broadcast', () => {
  test('NEXT_SLIDE/PREVIOUS_SLIDE/GO_TO_SLIDE move the real presentation and update the presenter', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');

    await presenter.click('#btn-presenter-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(1);

    await presenter.click('#btn-presenter-prev');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');

    await presenter.fill('#presenter-goto-input', '3');
    await presenter.click('#btn-presenter-goto');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('3');
  });

  test('overlay/aside/pause toggles from the presenter reflect back as confirmed state', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    await presenter.click('#btn-toggle-context-overlay');
    await expect(page.locator('#template-overlay')).toBeVisible();
    await expect(presenter.locator('[data-context-overlay]')).toHaveText('Aan');

    await presenter.click('#btn-toggle-left-aside');
    await expect(presenter.locator('[data-left-aside]')).toHaveText('Uit');

    await presenter.click('#btn-toggle-pause-overlay');
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await expect(presenter.locator('[data-pause-overlay]')).toHaveText('Aan');
  });

  test('a real button click in the Presentation View also updates the presenter', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await page.click('#btn-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
  });

  test('an unknown command is ignored without throwing', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.evaluate(() => {
      window.postMessage({ type: 'command', command: 'DELETE_EVERYTHING' }, '*');
    });
    await page.waitForTimeout(50);
    expect(errors).toEqual([]);
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: FAIL — presenter.html has no control buttons/state rendering yet.

- [ ] **Step 3: Implement the command whitelist and broadcast wrapping in `app.js`**

Replace the Step-9 listener body from Task 2 with a dispatch table. Full replacement of that `window.addEventListener('message', ...)` block and `sendStateToPresenter`:

```js
  const COMMAND_HANDLERS = {
    NEXT_SLIDE: () => goNext(),
    PREVIOUS_SLIDE: () => goTo(state.currentIndex - 1, { animate: true, direction: 'prev' }),
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
    TOGGLE_RIGHT_ASIDE: () => toggleNextCollapse(),
    SHOW_RIGHT_ASIDE: () => { if (nextCollapsed) toggleNextCollapse(); },
    HIDE_RIGHT_ASIDE: () => { if (!nextCollapsed) toggleNextCollapse(); },
    TOGGLE_PAUSE_OVERLAY: () => (isPauseOverlayVisible() ? hidePauseOverlay() : showPauseOverlay()),
    SHOW_PAUSE_OVERLAY: () => showPauseOverlay(),
    HIDE_PAUSE_OVERLAY: () => hidePauseOverlay(),
    REQUEST_STATE: () => {}, // handled below before dispatch, no-op here
  };

  window.addEventListener('message', (e) => {
    if (presenterRef && !presenterRef.closed) {
      if (e.source !== presenterRef) return;
    } else if (!e.data || e.data.type !== 'command' || e.data.command !== 'REQUEST_STATE') {
      return; // bootstrap gate: only a REQUEST_STATE may establish presenterRef
    } else {
      presenterRef = e.source;
    }
    if (!e.data || e.data.type !== 'command') return;
    const handler = COMMAND_HANDLERS[e.data.command];
    if (!handler) return; // unknown command: ignored, never executed
    handler(e.data);
    sendStateToPresenter();
  });

  function sendStateToPresenter() {
    if (!presenterRef || presenterRef.closed) return;
    presenterRef.postMessage(
      {
        type: 'state',
        currentSlide: state.currentIndex,
        totalSlides: SLIDES.length,
        contextOverlayVisible: !overlayEl.hidden,
        leftAsideVisible: !tocCollapsed,
        rightAsideVisible: !nextCollapsed,
        pauseOverlayVisible: isPauseOverlayVisible(),
      },
      '*'
    );
  }
```

Then hook the broadcast into every existing action that can change state *without* coming from a command — the real buttons/keyboard. Change these four existing listener registrations (leave their handler bodies untouched, just also call `sendStateToPresenter()` after):

```js
document.getElementById('btn-next').addEventListener('click', () => { goNext(); sendStateToPresenter(); });
document.getElementById('btn-prev').addEventListener('click', () => {
  goTo(state.currentIndex - 1, { animate: true, direction: 'prev' });
  sendStateToPresenter();
});
```
and in the TOC click handler, and in `openTemplateOverlay`/`closeTemplateOverlay`/`toggleTocCollapse`/`toggleNextCollapse`/`showPauseOverlay`/`hidePauseOverlay` themselves — add one `sendStateToPresenter();` call as the last line of each of those six functions' bodies. This guarantees every path (real click or command) ends in a broadcast, matching spec §4 ("na elke state-wijzigende actie... ongeacht of die door een echte klik of een command werd veroorzaakt").

Note: `sendStateToPresenter` and `presenterRef` must be declared (via `let`/`function`, not block-scoped inside an `if`) before any of these six functions run — move the `let presenterRef = null;` declaration and the `sendStateToPresenter` function to top-level scope (outside the `if (!isEmbedPreview)` block from Task 2 Step 5), since `isEmbedPreview` documents no longer own a Presenter View but must still safely no-op (`presenterRef` stays `null` forever in that mode, so every `sendStateToPresenter()` call there is an inert no-op — correct, since previews are driven by `presenter.js`, not the other way around).

- [ ] **Step 4: Add control buttons and state rendering in `presenter.html`/`presenter.js`**

Add to `presenter.html`, after the connection banner:

```html
<div id="presenter-main" hidden>
  <p>Slide <span data-current-slide></span> / <span data-total-slides></span></p>
  <button id="btn-presenter-prev" type="button">Vorige</button>
  <button id="btn-presenter-next" type="button">Volgende</button>
  <input id="presenter-goto-input" type="number" min="1">
  <button id="btn-presenter-goto" type="button">Ga naar</button>
  <p>Context overlay: <span data-context-overlay></span> <button id="btn-toggle-context-overlay" type="button">Wissel</button></p>
  <p>Linker aside: <span data-left-aside></span> <button id="btn-toggle-left-aside" type="button">Wissel</button></p>
  <p>Rechter aside: <span data-right-aside></span> <button id="btn-toggle-right-aside" type="button">Wissel</button></p>
  <p>Pauze-overlay: <span data-pause-overlay></span> <button id="btn-toggle-pause-overlay" type="button">Wissel</button></p>
</div>
```

Add to `presenter.js`, replacing the `setConnected`/message-listener section:

```js
let latestState = null;
const presenterMainEl = document.getElementById('presenter-main');

function sendCommand(command, extra) {
  if (!presentationRef || presentationRef.closed) {
    setConnected(false);
    return;
  }
  presentationRef.postMessage(Object.assign({ type: 'command', command }, extra), '*');
}

function renderState(newState) {
  latestState = newState;
  presenterMainEl.hidden = false;
  document.querySelector('[data-current-slide]').textContent = String(newState.currentSlide + 1);
  document.querySelector('[data-total-slides]').textContent = String(newState.totalSlides);
  document.querySelector('[data-context-overlay]').textContent = newState.contextOverlayVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-left-aside]').textContent = newState.leftAsideVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-right-aside]').textContent = newState.rightAsideVisible ? 'Aan' : 'Uit';
  document.querySelector('[data-pause-overlay]').textContent = newState.pauseOverlayVisible ? 'Aan' : 'Uit';
}

window.addEventListener('message', (e) => {
  if (!presentationRef) return;
  if (e.source !== presentationRef) return;
  if (!e.data || e.data.type !== 'state') return;
  setConnected(true);
  renderState(e.data);
});

document.getElementById('btn-presenter-next').addEventListener('click', () => sendCommand('NEXT_SLIDE'));
document.getElementById('btn-presenter-prev').addEventListener('click', () => sendCommand('PREVIOUS_SLIDE'));
document.getElementById('btn-presenter-goto').addEventListener('click', () => {
  const slide = Number(document.getElementById('presenter-goto-input').value) - 1;
  if (Number.isInteger(slide)) sendCommand('GO_TO_SLIDE', { slide });
});
document.getElementById('btn-toggle-context-overlay').addEventListener('click', () => sendCommand('TOGGLE_CONTEXT_OVERLAY'));
document.getElementById('btn-toggle-left-aside').addEventListener('click', () => sendCommand('TOGGLE_LEFT_ASIDE'));
document.getElementById('btn-toggle-right-aside').addEventListener('click', () => sendCommand('TOGGLE_RIGHT_ASIDE'));
document.getElementById('btn-toggle-pause-overlay').addEventListener('click', () => sendCommand('TOGGLE_PAUSE_OVERLAY'));
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
git add app.js presenter.html presenter.js tests/presenter-view.spec.js
git commit -m "Wire full command whitelist with state broadcast after every action"
```

---

### Task 4: Reconnect resilience (reload/close/reopen scenarios)

**Files:**
- Modify: `presenter.js` (surface disconnection when `presentationRef` closes)
- Test: `tests/presenter-view.spec.js` (append; covers spec §3 scenarios 2-5 explicitly)

**Interfaces:**
- Consumes: `requestState`, `setConnected`, `presentationRef` (Task 2); the bootstrap gate in `app.js`'s message listener (Task 3).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view.spec.js`:

```js
test.describe('reconnect resilience', () => {
  test('reloading the Presenter View re-syncs via window.opener + REQUEST_STATE', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await page.click('#btn-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');

    await presenter.reload();
    await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
  });

  test('reloading the Presentation View lets it re-learn presenterRef from the next REQUEST_STATE', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    await page.reload();
    await presenter.evaluate(() => requestState());
    await presenter.click('#btn-presenter-next');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(1);
  });

  test('closing the Presenter View stops the Presentation View from erroring, and reopening starts a fresh handshake', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.close();
    await page.click('#btn-next'); // must not throw despite the stale presenterRef
    expect(errors).toEqual([]);

    const presenter2 = await openPresenterView(page);
    await expect(presenter2.locator('[data-connection-status]')).toHaveText('Verbonden');
    await expect(presenter2.locator('[data-current-slide]')).toHaveText('2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails (or passes by luck — verify the reasons)**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: the reload-Presenter-View case likely already passes (Task 2/3 already re-request on `load`). The reload-Presentation-View case needs `presenter.js`'s `requestState` exposed/re-triggerable — confirm by running; if it fails, proceed to Step 3.

- [ ] **Step 3: Ensure `requestState` re-fires correctly and `presenterRef.closed` is checked before every send**

In `app.js`, `sendStateToPresenter` already checks `presenterRef.closed` (Task 3) — verify no change needed by re-reading that function. In `presenter.js`, confirm `requestState` (Task 2) is reachable from `page.evaluate` in tests (it's a top-level function declaration in a classic script, so it is).

If the "Presentation View reloaded" test still fails, the likely cause is that `page.click('#btn-next')` inside that reload doesn't fire because the click happened before rerender — re-run with an explicit `await page.waitForLoadState()` after `page.reload()` and re-test before making further code changes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/presenter-view.spec.js
git commit -m "Add reconnect-resilience tests for presenter view reload/close/reopen"
```

(If Step 3 required an actual code change, include the modified file(s) in this commit too.)

---

### Task 5: Skip-ahead (`pendingNextSlide`) and presenter-local "back to jump origin"

**Files:**
- Modify: `presenter.html` (add pending-next display, Skip/Herstel buttons)
- Modify: `presenter.js` (add `pendingNextSlide`, `lastJumpOriginIndex`, rewire Volgende/Vorige/Skip/Herstel)
- Test: `tests/presenter-view.spec.js` (append)

**Interfaces:**
- Consumes: `sendCommand`, `latestState`, `renderState` (Tasks 2-3).
- Produces: `pendingNextSlide` (module-scope `let`, in `presenter.js`), `lastJumpOriginIndex` (module-scope `let`, `null` when no unconsumed jump exists).

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view.spec.js`:

```js
test.describe('skip-ahead and presenter-local back-to-jump-origin', () => {
  test('skipping twice then Volgende jumps directly, and Vorige returns to the jump origin', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0); // slide 1

    await presenter.click('#btn-presenter-skip'); // pending: 3
    await presenter.click('#btn-presenter-skip'); // pending: 4
    await expect(presenter.locator('[data-pending-next-slide]')).toHaveText('4');

    await presenter.click('#btn-presenter-next');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(3); // slide 4, direct jump
    await expect(presenter.locator('[data-pending-next-slide]')).toHaveText('5');

    await presenter.click('#btn-presenter-prev'); // presenter's own Vorige
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0); // back to slide 1, not slide 3
  });

  test('Herstel resets the pending selection without touching the real presentation', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-skip');
    await presenter.click('#btn-presenter-herstel');
    await expect(presenter.locator('[data-pending-next-slide]')).toHaveText('2');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });

  test('Vorige with no pending jump uses ordinary PREVIOUS_SLIDE, unchanged', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-next'); // slide 2, no skip involved
    await presenter.click('#btn-presenter-prev');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: FAIL — no `#btn-presenter-skip`/`#btn-presenter-herstel` yet.

- [ ] **Step 3: Add markup**

In `presenter.html`, inside `#presenter-main`, replace the `Volgende`/`Vorige`/goto block with:

```html
  <p>Volgende slide: <span data-pending-next-slide></span></p>
  <button id="btn-presenter-skip" type="button">Skip deze slide</button>
  <button id="btn-presenter-herstel" type="button">Herstel</button>
  <button id="btn-presenter-prev" type="button">Vorige</button>
  <button id="btn-presenter-next" type="button">Volgende</button>
  <input id="presenter-goto-input" type="number" min="1">
  <button id="btn-presenter-goto" type="button">Ga naar</button>
```

- [ ] **Step 4: Implement in `presenter.js`**

Replace the `renderState`/next/prev button-wiring section:

```js
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (16 tests).

- [ ] **Step 6: Commit**

```bash
git add presenter.html presenter.js tests/presenter-view.spec.js
git commit -m "Add skip-ahead (pendingNextSlide) and presenter-local jump-origin back navigation"
```

---

### Task 6: Preview iframes (`?embed=preview`, absolute `preview-state` sync)

**Files:**
- Modify: `app.js` (suppress own navigation/click listeners under `?embed=preview`; add a `preview-state` listener branch)
- Modify: `presenter.html` (add the two iframes)
- Modify: `presenter.css` (scale/layout the iframes)
- Modify: `presenter.js` (drive both iframes)
- Test: `tests/presenter-view.spec.js` (append)

**Interfaces:**
- Consumes: `isEmbedPreview` (Task 2); `pendingNextSlide`, `latestState` (Task 5).
- Produces (in `presenter.js`): `currentPreviewRef`, `nextPreviewRef`, `syncPreview(iframeWindow, slideIndex, flagsFromState)`.

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view.spec.js`:

```js
test.describe('preview iframes', () => {
  test('current-preview mirrors the real slide/overlay state; next-preview shows pendingNextSlide', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    const currentPreviewFrame = presenter.frameLocator('#current-preview');
    const nextPreviewFrame = presenter.frameLocator('#next-preview');

    await expect(currentPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('01');
    await expect(nextPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('02');

    await presenter.click('#btn-toggle-context-overlay');
    await expect(currentPreviewFrame.locator('#template-overlay')).toBeVisible();
    await expect(nextPreviewFrame.locator('#template-overlay')).toBeHidden();

    await presenter.click('#btn-presenter-skip');
    await expect(nextPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('03');
  });

  test('preview iframes do not navigate on their own keyboard/click input', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const currentPreviewFrame = presenter.frameLocator('#current-preview');
    await currentPreviewFrame.locator('body').click();
    await currentPreviewFrame.locator('body').press('ArrowRight');
    await expect(currentPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('01');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: FAIL — no `#current-preview`/`#next-preview` iframes yet.

- [ ] **Step 3: Suppress own listeners under `?embed=preview` in `app.js`**

The existing top-level keyboard-navigation listener (currently starting `document.addEventListener('keydown', (e) => { if (!finishOverlayEl.hidden) return; ...`) and the TOC-click listener (`tocListEl.addEventListener('click', ...)`) must not run in preview mode. Wrap both registrations:

```js
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
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goNext();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(state.currentIndex - 1, { animate: true, direction: 'prev' });
      return;
    }
    if (e.key === ' ' && document.activeElement.tagName !== 'BUTTON') {
      e.preventDefault();
      goNext();
    }
  });

  tocListEl.addEventListener('click', (e) => {
    const item = e.target.closest('.toc-item');
    if (!item) return;
    goTo(Number(item.dataset.index), { animate: false });
  });
}
```

(This moves the existing bodies unchanged into the guard — no behavioral change for `index.html` itself, since `isEmbedPreview` is always `false` there.)

Also add a `preview-state` branch to the message listener (inside the top-level listener that now runs unconditionally, since preview iframes must still respond to commands and to `preview-state`) — add this as a new `if` before the existing bootstrap/command handling in that listener:

```js
window.addEventListener('message', (e) => {
  if (isEmbedPreview) {
    if (e.source !== window.parent) return;
    if (!e.data) return;
    if (e.data.type === 'preview-state') {
      if (!overlayEl.hidden !== e.data.contextOverlayVisible) {
        e.data.contextOverlayVisible ? openTemplateOverlay() : closeTemplateOverlay();
      }
      if (!tocCollapsed === e.data.leftAsideVisible ? false : tocCollapsed !== !e.data.leftAsideVisible) {
        toggleTocCollapse();
      }
      if (nextCollapsed !== !e.data.rightAsideVisible) toggleNextCollapse();
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
  // ...existing top-level (non-preview) listener body from Task 3 continues here...
});
```

Note: the `!tocCollapsed === e.data.leftAsideVisible ? false : ...` line above is convoluted — simplify it directly to match `rightAsideVisible`'s pattern:
```js
      if (tocCollapsed !== !e.data.leftAsideVisible) toggleTocCollapse();
```
Use that instead.

- [ ] **Step 4: Add the iframes to `presenter.html`**

Inside `#presenter-main`, before the notes/progress section (which Task 7 will add):

```html
  <iframe id="current-preview" src="index.html?embed=preview" class="preview-frame"></iframe>
  <iframe id="next-preview" src="index.html?embed=preview" class="preview-frame"></iframe>
```

- [ ] **Step 5: Style the previews in `presenter.css`**

```css
.preview-frame {
  width: 1280px;
  height: 800px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transform: scale(0.28);
  transform-origin: top left;
}
```

- [ ] **Step 6: Drive both iframes from `presenter.js`**

Add after the iframes exist in the DOM (top of the file, near the other DOM refs):

```js
const currentPreviewEl = document.getElementById('current-preview');
const nextPreviewEl = document.getElementById('next-preview');

function syncPreview(iframeEl, slideIndex, flags) {
  const win = iframeEl.contentWindow;
  win.postMessage({ type: 'command', command: 'GO_TO_SLIDE', slide: slideIndex }, '*');
  win.postMessage(
    Object.assign({ type: 'preview-state', currentSlide: slideIndex }, flags),
    '*'
  );
}
```

Call it inside `renderState`, after the existing text-rendering lines, right before the `pendingNextSlide` normalization block:

```js
  const flags = {
    contextOverlayVisible: newState.contextOverlayVisible,
    leftAsideVisible: newState.leftAsideVisible,
    rightAsideVisible: newState.rightAsideVisible,
    pauseOverlayVisible: newState.pauseOverlayVisible,
  };
  syncPreview(currentPreviewEl, newState.currentSlide, flags);
  syncPreview(nextPreviewEl, pendingNextSlide, flags);
```

(`pendingNextSlide` at this point still holds the *previous* render's value on the very first line of `renderState`, since it's normalized further down — reorder so the normalization block runs first: move the `if (isFirstState || pendingNextSlide <= newState.currentSlide) { pendingNextSlide = ...}` block to right after `latestState = newState;`, before computing `flags`/calling `syncPreview`.)

Also call `syncPreview(nextPreviewEl, pendingNextSlide, flags)` again inside the Skip/Herstel click handlers (Task 5), right after each updates `pendingNextSlide`, using `latestState`'s flags — e.g. in `btn-presenter-skip`'s handler:
```js
  syncPreview(nextPreviewEl, pendingNextSlide, {
    contextOverlayVisible: latestState.contextOverlayVisible,
    leftAsideVisible: latestState.leftAsideVisible,
    rightAsideVisible: latestState.rightAsideVisible,
    pauseOverlayVisible: latestState.pauseOverlayVisible,
  });
```
(same addition in the Herstel handler).

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (18 tests).

- [ ] **Step 8: Commit**

```bash
git add app.js presenter.html presenter.css presenter.js tests/presenter-view.spec.js
git commit -m "Add iframe-reused current/next-slide previews driven by preview-state snapshots"
```

---

### Task 7: Speaker notes, duration metadata, and schedule-delta timing

**Files:**
- Modify: `slides-data.js` (document + add example `duration` values)
- Modify: `presenter.html` (notes panel, progress bars, schedule text)
- Modify: `presenter.js` (notes lookup, planned-time math)
- Test: `tests/presenter-view-timing.spec.js` (new)

**Interfaces:**
- Consumes: `latestState`, `renderState` (Tasks 3, 5); `SLIDES` (global, already loaded via `<script src="slides-data.js">` in `presenter.html` from Task 2).
- Produces: `plannedStartOfSlide(index)`, `totalPlannedMs()` (both pure functions of `SLIDES`/`CONFIG.timer.defaultMinutes`, callable directly by tests via `page.evaluate`).

- [ ] **Step 1: Write the failing test**

Create `tests/presenter-view-timing.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const path = require('path');

const PRESENTER_URL = 'file://' + path.resolve(__dirname, '..', 'presenter.html');

test.describe('timing math (plannedStartOfSlide / totalPlannedMs)', () => {
  test('uses per-slide duration when present, falling back to an even split otherwise', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      SLIDES.length = 0;
      // eslint-disable-next-line no-undef
      SLIDES.push(
        { id: 1, title: 'A', bullets: [], notes: '', duration: 60 },
        { id: 2, title: 'B', bullets: [], notes: '', duration: 90 },
        { id: 3, title: 'C', bullets: [], notes: '' } // no duration: falls back
      );
      // eslint-disable-next-line no-undef
      CONFIG.timer.defaultMinutes = 5; // 300s total planned
    });

    const plannedStarts = await page.evaluate(() => [
      // eslint-disable-next-line no-undef
      plannedStartOfSlide(0),
      // eslint-disable-next-line no-undef
      plannedStartOfSlide(1),
      // eslint-disable-next-line no-undef
      plannedStartOfSlide(2),
    ]);
    expect(plannedStarts[0]).toBe(0);
    expect(plannedStarts[1]).toBe(60);
    expect(plannedStarts[2]).toBe(150); // 60 + 90
  });

  test('scheduleDelta is negative when ahead of schedule, positive when behind', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      SLIDES.length = 0;
      // eslint-disable-next-line no-undef
      SLIDES.push(
        { id: 1, title: 'A', bullets: [], notes: '', duration: 100 },
        { id: 2, title: 'B', bullets: [], notes: '', duration: 100 }
      );
    });

    const ahead = await page.evaluate(() => scheduleDelta(50, 1)); // 50s elapsed, on slide 2 (planned start 100)
    expect(ahead).toBe(-50);

    const behind = await page.evaluate(() => scheduleDelta(150, 1));
    expect(behind).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view-timing.spec.js`
Expected: FAIL — `plannedStartOfSlide`/`scheduleDelta` not defined.

- [ ] **Step 3: Implement the timing math in `presenter.js`**

Add near the top (after the `SLIDES`/`CONFIG` scripts have loaded, so anywhere at top level is fine):

```js
/* ---------- Timing math ----------
 * See docs/superpowers/specs/2026-08-22-presenter-view-design.md §9:
 * plannedStartOfCurrentSlide = sum of duration of all slides BEFORE it;
 * scheduleDelta = elapsedMs/1000 - plannedStartOfCurrentSlide.
 * Negative = ahead of schedule, positive = behind. */

function totalPlannedMs() {
  return CONFIG.timer.defaultMinutes * 60 * 1000;
}

function averageSlideDurationSeconds() {
  return totalPlannedMs() / 1000 / SLIDES.length;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view-timing.spec.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Add notes and rendered schedule/progress display**

Add to `presenter.html`, inside `#presenter-main`:

```html
  <section id="presenter-notes"></section>
  <p>Slides: <span data-slides-progress></span></p>
  <p>Tijd: <span data-time-progress></span></p>
  <p><span data-schedule-delta></span></p>
```

Add to `presenter.js`'s `renderState`, after the existing text assignments:

```js
  document.getElementById('presenter-notes').textContent = SLIDES[newState.currentSlide].notes || '';

  const slidesProgressPct = Math.round(((newState.currentSlide + 1) / newState.totalSlides) * 100);
  document.querySelector('[data-slides-progress]').textContent =
    `${newState.currentSlide + 1} / ${newState.totalSlides} (${slidesProgressPct}%)`;

  const elapsedSeconds = getElapsedSeconds(); // implemented in Task 8; stub returning 0 until then
  const delta = scheduleDelta(elapsedSeconds, newState.currentSlide);
  const deltaAbsMin = Math.floor(Math.abs(delta) / 60);
  const deltaAbsSec = String(Math.abs(delta) % 60).padStart(2, '0');
  document.querySelector('[data-schedule-delta]').textContent =
    delta < 0
      ? `${deltaAbsMin}:${deltaAbsSec} voor op schema`
      : `${deltaAbsMin}:${deltaAbsSec} achter op schema`;

  const totalPlannedSeconds = totalPlannedMs() / 1000;
  const timeProgressPct = Math.min(100, Math.round((elapsedSeconds / totalPlannedSeconds) * 100));
  document.querySelector('[data-time-progress]').textContent = `${timeProgressPct}%`;
```

Add a temporary stub (Task 8 replaces this with the real timestamp-based implementation):
```js
function getElapsedSeconds() {
  return 0;
}
```

- [ ] **Step 6: Add example durations to the demo deck**

In `slides-data.js`, add `duration: <seconds>` to a handful of the existing demo slide objects (pick reasonable values, e.g. 60-120 each) so the feature has real example data — and add one line to the file's top comment block documenting the new optional field, next to the existing `discoHoldMs` documentation line:
```js
 * - duration: presenter-only planned time for this slide, in seconds (used
 *   for the Presenter View's schedule-adherence indicator; falls back to an
 *   even split of CONFIG.timer.defaultMinutes when omitted)
```

- [ ] **Step 7: Run all presenter-view tests to verify nothing regressed**

Run: `npx playwright test tests/presenter-view.spec.js tests/presenter-view-timing.spec.js`
Expected: PASS (all).

- [ ] **Step 8: Commit**

```bash
git add slides-data.js presenter.html presenter.js tests/presenter-view-timing.spec.js
git commit -m "Add speaker notes display and schedule-adherence timing math"
```

---

### Task 8: Presentation timer (start/pause/reset) with `sessionStorage` persistence, and the clock

**Files:**
- Modify: `presenter.html` (clock, timer display, start/pause/reset controls)
- Modify: `presenter.js` (replace the `getElapsedSeconds` stub with the real timestamp-based timer)
- Test: `tests/presenter-view-timing.spec.js` (append)

**Interfaces:**
- Consumes: `scheduleDelta`, `totalPlannedMs` (Task 7).
- Produces: `getElapsedSeconds()` (real implementation, replacing the Task 7 stub), `startPresenterTimer()`, `pausePresenterTimer()`, `resetPresenterTimer()`.

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view-timing.spec.js`:

```js
test.describe('presentation timer persistence', () => {
  test('elapsed time survives a Presenter View refresh while running', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await page.click('#btn-presenter-timer-start');
    await page.waitForTimeout(1100);

    await page.reload();
    const elapsedAfterReload = await page.evaluate(() => getElapsedSeconds());
    expect(elapsedAfterReload).toBeGreaterThanOrEqual(1);
  });

  test('reset zeroes the timer and clears sessionStorage', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await page.click('#btn-presenter-timer-start');
    await page.waitForTimeout(300);
    await page.click('#btn-presenter-timer-reset');
    const elapsed = await page.evaluate(() => getElapsedSeconds());
    expect(elapsed).toBe(0);
  });

  test('the clock renders and updates', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await expect(page.locator('[data-clock]')).not.toHaveText('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view-timing.spec.js`
Expected: FAIL — no timer controls/clock yet.

- [ ] **Step 3: Add markup**

Add to `presenter.html`, at the top of `#presenter-main` (before the connection-status content that already exists above it):

```html
  <p data-clock></p>
  <p data-elapsed></p>
  <button id="btn-presenter-timer-start" type="button">Start</button>
  <button id="btn-presenter-timer-pause" type="button">Pauze</button>
  <button id="btn-presenter-timer-reset" type="button">Reset</button>
```

- [ ] **Step 4: Implement the timestamp-based timer with `sessionStorage` persistence**

Replace the Task 7 stub in `presenter.js` with:

```js
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
  sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
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
}
setInterval(renderClockAndElapsed, 250);
renderClockAndElapsed();
```

Remove the Task 7 stub (`function getElapsedSeconds() { return 0; }`) entirely — this is its real replacement.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view-timing.spec.js`
Expected: PASS (5 tests).

- [ ] **Step 6: Run the full test suite to check for regressions**

Run: `npx playwright test`
Expected: PASS (all files, including the pre-existing suite).

- [ ] **Step 7: Commit**

```bash
git add presenter.html presenter.js tests/presenter-view-timing.spec.js
git commit -m "Add timestamp-based presentation timer with sessionStorage persistence, and the clock"
```

---

### Task 9: Consolidated scenario-matrix test + manual cross-browser verification

**Files:**
- Test: `tests/presenter-view-scenarios.spec.js` (new — one file matching the spec's §3 scenario list 1:1, for a reviewer to see pass/fail against the acceptance criteria directly)
- Modify: `tests/README.md` (document the two new spec files, and the manual cross-browser step)

**Interfaces:**
- Consumes: everything from Tasks 1-8. No new production code.

- [ ] **Step 1: Write the scenario-matrix test file**

Create `tests/presenter-view-scenarios.spec.js`:

```js
// One test per scenario in
// docs/superpowers/specs/2026-08-22-presenter-view-design.md §3, in the
// same order, so a failing scenario number here points straight at the
// spec section describing the required behavior. Each test below is a
// thin re-assertion using cases already implemented (and unit-tested in
// detail) in presenter-view.spec.js/presenter-view-timing.spec.js —
// this file exists for traceability against the spec, not new coverage.
const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView } = require('./helpers');

test('scenario 1: Presenter View opened normally from the Presentation View works immediately', async ({ page }) => {
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
});

test('scenario 2: Presenter View reload re-syncs via window.opener + REQUEST_STATE', async ({ page }) => {
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await presenter.reload();
  await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
});

test('scenario 3: closing the Presenter View causes no errors in the Presentation View', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await presenter.close();
  await page.click('#btn-next');
  expect(errors).toEqual([]);
});

test('scenario 4: reopening the Presenter View starts a fresh handshake', async ({ page }) => {
  await gotoPresentation(page);
  const first = await openPresenterView(page);
  await first.close();
  const second = await openPresenterView(page);
  await expect(second.locator('[data-connection-status]')).toHaveText('Verbonden');
});

test('scenario 5: Presentation View reload lets it re-learn presenterRef', async ({ page }) => {
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await page.reload();
  await presenter.evaluate(() => requestState());
  await presenter.click('#btn-presenter-next');
  // eslint-disable-next-line no-undef
  expect(await page.evaluate(() => state.currentIndex)).toBe(1);
});

test('scenario 6: Presenter View opened directly (no opener) shows disconnected, no crash', async ({ page }) => {
  const path = require('path');
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto('file://' + path.resolve(__dirname, '..', 'presenter.html'));
  await expect(page.locator('[data-connection-status]')).toHaveText('Niet verbonden');
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx playwright test tests/presenter-view-scenarios.spec.js`
Expected: PASS (6 tests) — this should pass immediately since Tasks 1-4 already implement everything it exercises; if anything fails here, it means an earlier task's implementation doesn't actually satisfy that spec scenario — stop and fix the earlier task before continuing.

- [ ] **Step 3: Update `tests/README.md`**

Add to the "What each file covers" list (alphabetically placed, matching the existing style):

```markdown
- `presenter-view.spec.js` — the Presenter View launch mechanism, connection
  handshake, full command whitelist with state broadcast, reconnect
  resilience, skip-ahead/back-to-jump-origin, and the two preview iframes.
- `presenter-view-scenarios.spec.js` — the six reconnect/lifecycle scenarios
  from `docs/superpowers/specs/2026-08-22-presenter-view-design.md` §3,
  one test per scenario, for direct traceability against the spec.
- `presenter-view-timing.spec.js` — schedule-adherence math
  (`plannedStartOfSlide`/`scheduleDelta`) and the presentation timer's
  `sessionStorage` persistence across a Presenter View refresh.
```

Add a new final section:

```markdown
## Manual verification (not automated)

`file://` cross-window messaging behavior is not guaranteed identical
across browsers. Before considering the Presenter View feature done,
manually verify scenarios 1-6 above by hand in:

- macOS: Chrome, Edge, Safari
- Windows: Edge (if available)

Open `index.html` directly (double-click), click the Presenter View
button, and step through each scenario from
`docs/superpowers/specs/2026-08-22-presenter-view-design.md` §3.
```

- [ ] **Step 4: Commit**

```bash
git add tests/presenter-view-scenarios.spec.js tests/README.md
git commit -m "Add spec-traceable scenario matrix test and manual cross-browser verification step"
```

---

## Self-Review Notes

- **Spec coverage:** §1 → Task 2. §2/§3 → Tasks 2-4. §4 → Task 3. §5 → Task 5. §6 → Task 1. §7 → Task 6. §8 → Task 5. §9 → Task 7. §10 → Tasks 7-8. File-changes table → covered across all tasks; every row has a corresponding task. Out-of-scope items are not implemented anywhere in this plan, as intended.
- **Placeholder scan:** no TBD/TODO; every step has literal code, not a description of code.
- **Type/name consistency check performed:** `presenterRef`/`presentationRef`/`currentPreviewRef`/`nextPreviewRef` (§2 naming) used consistently from Task 2 onward; `pauseOverlayEl`/`showPauseOverlay`/`hidePauseOverlay`/`isPauseOverlayVisible` (Task 1) referenced with matching names in Tasks 3, 6; `pendingNextSlide`/`lastJumpOriginIndex` (Task 5) referenced with matching names in Task 6; `plannedStartOfSlide`/`scheduleDelta`/`totalPlannedMs` (Task 7) referenced with matching names in Task 8's `getElapsedSeconds` integration point.
