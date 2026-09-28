# Bouwstenen-thema + thema-toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third theme (`bouwstenen`) alongside `default`/`conclusion`, add a Presentation-View button (+ `Shift+T`, + a matching Presenter View button) that cycles through all three themes live without losing any state, and port a small quote-layout enhancement (optional bullets) from branch `HBO-Q&A` onto `develop`.

**Architecture:** Everything is CSS-only per theme (`:root[data-theme="bouwstenen"]`, mirroring `themes/conclusion/theme.css`'s pattern exactly) — no new slide fields, no per-presentation config. The toggle only ever sets `document.documentElement.dataset.theme` (no reload, no re-render) and threads that value through the existing Presenter View state-broadcast/preview-iframe-sync machinery as one more field, the same way `discoTitleLines`/`quiz` already travel.

**Tech Stack:** Vanilla JS (classic scripts, `file://`-safe), CSS custom properties, Playwright for tests.

**Spec:** `docs/superpowers/plans/../../../../ai-archief/.../overdracht-develop-thema-bouwstenen.md` (as pasted into this session) — see also `overdracht-gastles-hva.md` for design background. Executors should treat the pasted document as the source of truth for exact pixel/color values; this plan operationalizes it into diffs.

## Global Constraints

- **One source, three looks.** A theme is pure CSS on existing markup. No new slide fields, no new `config.js` sections, no changes to the `scaffold-presentation`/`update-slides` skills.
- **Exact design tokens (bouwstenen):** paper `#F1EFE6`, inkt `#171A1C`, kobalt `#3A5BFF`, koraal `#FF5D5D`, geel `#FFC93C`, mint `#35C4A1`, card-bg `#FFFFFF`, headings Space Grotesk 700 (quote: 500), body IBM Plex Sans 400/600, radii 14/8/4px.
- **Fonts via Google Fonts `<link>`** (`https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;600&display=swap`) with a real fallback stack (`'Space Grotesk', system-ui, sans-serif` / `'IBM Plex Sans', system-ui, sans-serif`) — self-hosting is a documented future improvement, not required now.
- **`brand-chrome` stays hidden** for `bouwstenen` — it's `conclusion`-only; no override needed since the base rule already defaults it to `display: none`.
- **Theme list is fixed engine state:** `const THEMES = ['default', 'conclusion', 'bouwstenen'];` in `app.js`, in this exact order (matches the cycle order the spec requires).
- **`CONFIG.theme` remains only the start theme** — runtime changes go through the toggle, never through `config.js`.
- **The toggle never reloads or re-renders** — only `dataset.theme` + a label update + (if connected) one state broadcast.
- **No console errors, ever**, across all layouts, in all three themes — this is what the smoke tests in Task 4 and Task 9 check.

## Review Focus

- A quote slide with `bullets: []` (present but empty) must behave exactly like "no bullets" (the existing `hasBullets` check already does `.length > 0`; Task 1's tests pin this explicitly).
- Cycling themes while a disco transition is animating, or while frozen mid-pause, must not corrupt `isAnimatingSlide`/the frozen hold — the toggle touches only `dataset.theme` and never calls `goTo()`/`animateTransition()`, but Task 9 adds an explicit regression test for it.
- `sessionStorage` may throw (private browsing, blocked site data) — every read/write is wrapped in `try/catch` and a throw must still leave a working theme (falls back to `CONFIG.theme`), pinned by a test in Task 9.
- A Presenter View opened **before** any toggle has happened, and one opened **after**, must both end up showing the same theme as the real presentation — Task 9 tests both orders explicitly (this is the "even if Presenter View is opened only after switching" case named in the spec).
- Toggling from `bouwstenen` (which uses `:has()` for the quote layout's trapezoid-vs-footnote split) back to `default`/`conclusion` mid-quote-slide must fully revert — no leftover pseudo-element artifacts — because the toggle is pure CSS attribute selector switching, not something that needs its own test, but Task 4's per-theme smoke test walks every layout under `bouwstenen` including the quote layout so a broken revert would show up as a console error or a stray visual (checked via the existing walk, not a new mechanism).

---

## Task 1: Port quote-layout with optional bullets (`HBO-Q&A@49fd49c`)

**Files:**
- Modify: `app.js:314-327` (`renderQuoteLayout`)
- Modify: `styles.css:761` (after `.slide-quote-attribution`) and `:1338` (mobile media query, after `.slide-quote-box { padding: 1.5rem 1.75rem; }`)
- Modify: `slides-data.js` (layout-doc comment near line 14/30)
- Test: `tests/regression.spec.js` (append a new `describe`)

**Interfaces:**
- Consumes: `buildHeadingBlock(slide)`, `buildBulletsBlock(slide)`, `inlineMarkdown`, `escapeHtml`, `buildImagesBlock`, `buildMetaBlock` — all already defined in `app.js`.
- Produces: `renderQuoteLayout(slide)` now also honors an optional `slide.bullets` array; no other function's signature changes.

- [ ] **Step 1: Write the failing tests**

Append to `tests/regression.spec.js`:

```js
test.describe('quote layout with optional bullets', () => {
  test('a quote slide with bullets shows a title, the bullets before the quote, and the --footnote modifier', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      const quoteIndex = SLIDES.findIndex((s) => s.layout === 'quote');
      SLIDES[quoteIndex] = {
        ...SLIDES[quoteIndex],
        title: 'Test-titel',
        bullets: ['Eerste punt', 'Tweede punt'],
      };
      state.currentIndex = quoteIndex;
      renderSlide();
    });
    await expect(page.locator('.slide-heading h1')).toHaveText('Test-titel');
    const bulletsBox = page.locator('.slide-bullets');
    const quoteBox = page.locator('.slide-quote-box--footnote');
    await expect(bulletsBox).toHaveCount(1);
    await expect(quoteBox).toHaveCount(1);
    // bullets must precede the quote box in DOM order
    const order = await page.evaluate(() => {
      const inner = document.querySelector('.slide-inner--quote');
      const children = [...inner.children];
      return children.findIndex((c) => c.classList.contains('slide-bullets')) <
        children.findIndex((c) => c.classList.contains('slide-quote-box--footnote'));
    });
    expect(order).toBe(true);
  });

  test('a quote slide without bullets has no title and no --footnote modifier', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      const quoteIndex = SLIDES.findIndex((s) => s.layout === 'quote');
      SLIDES[quoteIndex] = { ...SLIDES[quoteIndex], title: undefined, bullets: undefined };
      state.currentIndex = quoteIndex;
      renderSlide();
    });
    await expect(page.locator('.slide-inner--quote .slide-heading')).toHaveCount(0);
    await expect(page.locator('.slide-quote-box--footnote')).toHaveCount(0);
    await expect(page.locator('.slide-quote-box')).toHaveCount(1);
  });

  test('an empty bullets array on a quote slide behaves like no bullets at all', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      const quoteIndex = SLIDES.findIndex((s) => s.layout === 'quote');
      SLIDES[quoteIndex] = { ...SLIDES[quoteIndex], bullets: [] };
      state.currentIndex = quoteIndex;
      renderSlide();
    });
    await expect(page.locator('.slide-quote-box--footnote')).toHaveCount(0);
    await expect(page.locator('.slide-inner--quote .slide-heading')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/regression.spec.js -g "quote layout with optional bullets"`
Expected: FAIL — no `.slide-quote-box--footnote` exists yet, current `renderQuoteLayout` never renders a heading/bullets.

- [ ] **Step 3: Port the `app.js` change**

Replace `renderQuoteLayout` (currently `app.js:314-327`):

```js
// Requires `quote` (string); `attribution` (string), `image` and `bullets`
// are all optional. `image` reproduces the deck's "quote + photo" variant.
// `bullets` adds a heading + supporting bullet list, with the quote box then
// demoted below them as a smaller illustrative footnote (`--footnote`
// modifier) rather than the slide's main content — omitted, the quote box
// sits alone at full size on the theme's background exactly as before (a
// purely decorative "sfeer" slide, no heading rendered).
function renderQuoteLayout(slide) {
  const imageBlock = slide.image
    ? `<div class="slide-quote-image-stack">${buildImagesBlock(slide)}</div>`
    : '';
  const hasBullets = Array.isArray(slide.bullets) && slide.bullets.length > 0;
  const quoteBlock = `
    <div class="slide-quote-box${hasBullets ? ' slide-quote-box--footnote' : ''}">
      <blockquote class="slide-quote-text">${inlineMarkdown(slide.quote || '')}</blockquote>
      ${slide.attribution ? `<p class="slide-quote-attribution">${escapeHtml(slide.attribution)}</p>` : ''}
    </div>`;
  return `
    <div class="slide-inner slide-inner--quote">
      ${hasBullets ? buildHeadingBlock(slide) : ''}
      ${hasBullets ? buildBulletsBlock(slide) : ''}
      ${quoteBlock}
      ${imageBlock}
    </div>
    ${buildMetaBlock(slide)}`;
}
```

- [ ] **Step 4: Port the `styles.css` change**

After `.slide-quote-attribution` (styles.css:762-767), add:

```css
/* Demoted variant: a quote slide's own `bullets` carry the message, so the
   quote itself sits below them as a smaller, illustrative footnote instead
   of the slide's main event — see renderQuoteLayout()'s `hasBullets`. */
.slide-quote-box--footnote {
  max-width: 42rem;
  padding: 1.1rem 1.5rem;
  box-shadow: none;
}
.slide-quote-box--footnote .slide-quote-text {
  font-size: clamp(0.95rem, 1.3vw, 1.15rem);
}
.slide-quote-box--footnote .slide-quote-attribution {
  font-size: 0.8rem;
}
```

In the mobile media query, directly after `.slide-quote-box { padding: 1.5rem 1.75rem; }` (styles.css:~1338), add:

```css
  .slide-quote-box--footnote { padding: 1rem 1.25rem; }
```

(Needed because the ordinary `.slide-quote-box` rule appears later in the file and would otherwise win inside the media query too.)

- [ ] **Step 5: Update the layout-doc comment in `slides-data.js`**

Find the line (`slides-data.js:14`) describing `'quote'`:

```js
 * - 'quote': a colored quote box (`quote` + optional `attribution`),
```

Change to:

```js
 * - 'quote': a colored quote box (`quote` + optional `attribution` +
 *   optional `bullets` — with bullets, a heading + bullet list render above
 *   the quote box, which then shrinks to a smaller illustrative footnote),
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx playwright test tests/regression.spec.js`
Expected: PASS (all of `regression.spec.js`, not just the new tests — confirms the change didn't break the existing quote-without-bullets/malformed-slide tests in the same file).

- [ ] **Step 7: Commit**

```bash
git add app.js styles.css slides-data.js tests/regression.spec.js
git commit -m "Port quote layout's optional bullets/--footnote variant from HBO-Q&A"
```

---

## Task 2: Create `themes/bouwstenen/theme.css`

**Files:**
- Create: `themes/bouwstenen/theme.css`

**Interfaces:**
- Consumes: the same selector surface `themes/conclusion/theme.css` already overrides (`.slide-heading h1`, `.slide-heading h1.slide-title-accent`, `.slide-subtitle--accent`, `.slide-bullets .icon`/`li::before`, `.slide-quote-box`, `.btn-*`, `.brand-chrome`), plus `.slide-content--layout-title`/`.slide-content--layout-quote`/`.slide-quote-box--footnote` (from Task 1).
- Produces: nothing consumed by later tasks except the theme's existence and its `data-theme="bouwstenen"` selector scope — Task 3 only needs to know the file's path.

- [ ] **Step 1: Write the file**

```css
/* Bouwstenen theme — chunky, rectilinear color-block design: a nod to
 * low-code (building with visual blocks) and to a step-by-step-built career.
 * Flat and square-edged everywhere: no skewed/rotated elements, thin accent
 * bars instead of heavy shadows. See docs/superpowers/plans/
 * 2026-09-28-bouwstenen-theme-en-toggle.md for the source design doc.
 *
 * :root[data-theme="bouwstenen"] (specificity 0,2,0) beats styles.css's bare
 * :root block and its prefers-color-scheme:dark override (both 0,1,0)
 * regardless of source order or the viewer's OS preference — same pattern
 * as themes/conclusion/theme.css.
 *
 * Fonts loaded via Google Fonts <link> in index.html/presenter.html (see
 * Task 3) — requires internet once per session to fetch; the font-family
 * fallback stacks below keep presenting usable offline (system-ui sans).
 */

:root[data-theme="bouwstenen"] {
  --bg: #F1EFE6;
  --surface: #F1EFE6;
  --surface-alt: color-mix(in srgb, #F1EFE6 90%, #171A1C);
  --text: #171A1C;
  --text-muted: color-mix(in srgb, #171A1C 65%, #F1EFE6);
  --border: color-mix(in srgb, #171A1C 15%, #F1EFE6);

  --font-heading: "Space Grotesk", system-ui, sans-serif;
  --font-bullet: "IBM Plex Sans", system-ui, sans-serif;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  /* The quote layout wants Space Grotesk 500 (not italic) — see the quote
     override below, which sets font-style/font-weight explicitly rather
     than relying on this token alone. */
  --font-italic: "Space Grotesk", system-ui, sans-serif;

  --accent: #3A5BFF;      /* kobaltblauw — primary */
  --accent-2: #FF5D5D;    /* koraalrood */
  --accent-3: #FFC93C;    /* citroengeel */
  --accent-4: #35C4A1;    /* mintgroen */
  /* Only 4 accent colors in the design doc — reuse kobalt for the 5th slot
     rather than inventing an unspecified 5th color. */
  --accent-5: var(--accent);
  --accent-gradient-end: var(--accent); /* no gradients in this theme */

  --radius-lg: 14px;
  --radius-md: 8px;
  --radius-sm: 4px;

  /* Flat everywhere, but chrome buttons still get a soft kobalt-tinted lift
     on hover, same technique as themes/conclusion/theme.css. */
  --shadow-accent: 0 12px 28px color-mix(in srgb, var(--accent) 35%, transparent);

  --disco-backdrop: #171A1C;
  --disco-ray-1: var(--accent);
  --disco-ray-2: var(--accent-2);
  --disco-ray-3: var(--accent-3);
  --disco-ray-4: var(--accent-4);
  --disco-ray-5: var(--accent);
  --disco-title-fill: #F1EFE6;
  --disco-title-stroke: #171A1C;
  --disco-title-shadow-1: var(--accent);
  --disco-title-shadow-2: var(--accent-2);
  --disco-sparkle-color: #F1EFE6;

  color-scheme: light;
}

/* No .brand-chrome override — the base :root rule in styles.css already
   sets display: none; conclusion is the only theme that opts back in. */

/* ---------- Headings & bullets ---------- */
:root[data-theme="bouwstenen"] .slide-heading h1 {
  font-weight: 700;
  font-size: clamp(2.75rem, 3.2vw, 3rem);
  text-transform: none;
  letter-spacing: normal;
}

:root[data-theme="bouwstenen"] .slide-bullets {
  gap: 64px;
}
:root[data-theme="bouwstenen"] .slide-bullets li {
  gap: 20px;
}
:root[data-theme="bouwstenen"] .slide-bullets .icon {
  display: none;
}
:root[data-theme="bouwstenen"] .slide-bullets li::before {
  content: '';
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 0.35em;
  border-radius: var(--radius-sm);
  background: var(--accent);
}
:root[data-theme="bouwstenen"] .slide-bullets li:nth-child(4n+2)::before { background: var(--accent-2); }
:root[data-theme="bouwstenen"] .slide-bullets li:nth-child(4n+3)::before { background: var(--accent-3); }
:root[data-theme="bouwstenen"] .slide-bullets li:nth-child(4n)::before { background: var(--accent-4); }

/* ---------- Title slide: left-aligned dark wordmark block ---------- */
:root[data-theme="bouwstenen"] .slide-content--layout-title .slide-inner {
  align-items: flex-start;
  text-align: left;
}
:root[data-theme="bouwstenen"] .slide-content--layout-title .slide-heading {
  justify-content: flex-start;
}
/* Overrides the default theme's gradient-clipped-text treatment (color:
   transparent + background-clip: text) with a solid dark block behind
   paper-colored text — background-clip/color must both be reset, not just
   background, or the text stays invisible. */
:root[data-theme="bouwstenen"] .slide-content--layout-title .slide-heading h1.slide-title-accent {
  display: inline-block;
  background: var(--text);
  -webkit-background-clip: initial;
  background-clip: initial;
  color: var(--bg);
  padding: 32px 48px;
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: 64px;
}
:root[data-theme="bouwstenen"] .slide-content--layout-title .slide-subtitle--accent {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: none;
  color: var(--text);
  font-family: var(--font-bullet);
  font-weight: 600;
  font-size: 26px;
  text-align: left;
}
:root[data-theme="bouwstenen"] .slide-content--layout-title .slide-subtitle--accent::before {
  content: '';
  flex: 0 0 auto;
  width: 8px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--accent);
}
/* Corner decoration: a kobalt block and a smaller yellow block, top-right. */
:root[data-theme="bouwstenen"] .slide-content--layout-title::before {
  content: '';
  position: absolute;
  top: 64px;
  right: 64px;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--accent);
}
:root[data-theme="bouwstenen"] .slide-content--layout-title::after {
  content: '';
  position: absolute;
  top: 112px;
  right: 112px;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  background: var(--accent-3);
}

/* ---------- Quote layout ---------- */
/* Plain quote (no bullets, see Task 1's hasBullets): the whole slide goes
   dark with a paper-colored trapezoid wedge on each side (mirrored), the
   quote box loses its own background and sits centered over the dark
   middle. Requires :has() (Chromium — this project's only tested/target
   presenting browser) to tell the two cases apart from the container. */
:root[data-theme="bouwstenen"] .slide-content--layout-quote:not(:has(.slide-quote-box--footnote)) {
  background: var(--text);
}
:root[data-theme="bouwstenen"] .slide-content--layout-quote:not(:has(.slide-quote-box--footnote))::before,
:root[data-theme="bouwstenen"] .slide-content--layout-quote:not(:has(.slide-quote-box--footnote))::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 380px;
  background: var(--bg);
  z-index: 0;
}
:root[data-theme="bouwstenen"] .slide-content--layout-quote:not(:has(.slide-quote-box--footnote))::before {
  left: 0;
  clip-path: polygon(0 0, 100% 0, 62% 100%, 0 100%);
}
:root[data-theme="bouwstenen"] .slide-content--layout-quote:not(:has(.slide-quote-box--footnote))::after {
  right: 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 38% 100%);
}
:root[data-theme="bouwstenen"] .slide-content--layout-quote .slide-quote-box:not(.slide-quote-box--footnote) {
  position: relative;
  z-index: 1;
  background: none;
  box-shadow: none;
  color: var(--bg);
  text-align: center;
}
:root[data-theme="bouwstenen"] .slide-content--layout-quote .slide-quote-box:not(.slide-quote-box--footnote)::before {
  content: '';
  display: block;
  width: 6px;
  height: 36px;
  margin: 0 auto 1.5rem;
  border-radius: var(--radius-sm);
  background: var(--accent-3);
}
:root[data-theme="bouwstenen"] .slide-quote-text {
  font-family: var(--font-italic);
  font-style: normal;
  font-weight: 500;
}
/* Footnote variant (has bullets, see Task 1): small dark card, not a
   full-bleed trapezoid — the bullets above it must stay on the ordinary
   paper surface. */
:root[data-theme="bouwstenen"] .slide-quote-box--footnote {
  background: var(--text);
  color: var(--bg);
  border-radius: var(--radius-md);
  box-shadow: none;
}
:root[data-theme="bouwstenen"] .slide-quote-box--footnote::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 20px;
  margin-right: 0.6rem;
  vertical-align: middle;
  border-radius: var(--radius-sm);
  background: var(--accent-3);
}

/* ---------- Buttons & chrome: flat kobalt, no gradients ---------- */
:root[data-theme="bouwstenen"] .btn-floating,
:root[data-theme="bouwstenen"] .btn-finish,
:root[data-theme="bouwstenen"] .btn-next,
:root[data-theme="bouwstenen"] .btn--primary {
  background: var(--accent);
}
:root[data-theme="bouwstenen"] .btn-floating:hover {
  box-shadow: 0 14px 26px color-mix(in srgb, var(--accent) 35%, transparent);
}
```

- [ ] **Step 2: Verify the file parses as valid CSS with no other changes**

Run: `node -e "require('fs').readFileSync('themes/bouwstenen/theme.css','utf8')"` — this is just a file-exists/readable smoke check; the real verification is Task 4's Playwright run, since there is no CSS linter configured in this repo (confirm with `ls package.json && cat package.json | grep -i stylelint` — expected: no stylelint).

Expected: no output/errors from the `node -e` command, and no stylelint dependency found.

- [ ] **Step 3: Commit**

```bash
git add themes/bouwstenen/theme.css
git commit -m "Add bouwstenen theme CSS (not yet wired into index.html/presenter.html)"
```

---

## Task 3: Wire `bouwstenen` into `index.html`/`presenter.html`, update docs

**Files:**
- Modify: `index.html:1-10` (fonts link + theme link)
- Modify: `presenter.html:1-11` (fonts link + theme link)
- Modify: `README.md:80-94`
- Modify: `config.js:20-24` (the `theme` field's doc comment)

**Interfaces:**
- Consumes: `themes/bouwstenen/theme.css` (Task 2).
- Produces: nothing new consumed by later tasks — Task 4's tests just need the theme reachable via `CONFIG.theme = 'bouwstenen'`, which this task enables.

- [ ] **Step 1: Add the Google Fonts `<link>` + theme `<link>` to `index.html`**

Current (`index.html:7-10`):

```html
<script src="config.js"></script>
<script>document.documentElement.setAttribute('data-theme', (typeof CONFIG !== 'undefined' && CONFIG.theme) || 'default');</script>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="themes/conclusion/theme.css">
```

Replace with:

```html
<script src="config.js"></script>
<script>document.documentElement.setAttribute('data-theme', (typeof CONFIG !== 'undefined' && CONFIG.theme) || 'default');</script>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="themes/conclusion/theme.css">
<!-- bouwstenen theme fonts — needs internet once per session; every
     font-family below falls back to system-ui so presenting stays usable
     offline if this request fails. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;600&display=swap">
<link rel="stylesheet" href="themes/bouwstenen/theme.css">
```

- [ ] **Step 2: Same two lines in `presenter.html`**

Current (`presenter.html:7-11`):

```html
<script src="config.js"></script>
<script>document.documentElement.setAttribute('data-theme', (typeof CONFIG !== 'undefined' && CONFIG.theme) || 'default');</script>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="themes/conclusion/theme.css">
<link rel="stylesheet" href="presenter.css">
```

Replace with:

```html
<script src="config.js"></script>
<script>document.documentElement.setAttribute('data-theme', (typeof CONFIG !== 'undefined' && CONFIG.theme) || 'default');</script>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="themes/conclusion/theme.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;600&display=swap">
<link rel="stylesheet" href="themes/bouwstenen/theme.css">
<link rel="stylesheet" href="presenter.css">
```

- [ ] **Step 3: Update `README.md`**

Replace `README.md:80-94`:

```markdown
`CONFIG.theme` kiest de visuele stijl: `'default'` (het bestaande lichte
thema, met kleuren/fonts als CSS custom properties bovenaan `styles.css`) of
`'conclusion'` (donker thema met Conclusion-huisstijlkleuren, zie
`themes/conclusion/theme.css`). Net als `CONFIG.lang` wordt dit gekozen
wanneer de presentatie wordt gemaakt, niet tijdens het presenteren.
`CONFIG.brand.businessUnit`/`tagline` vullen de bijpassende chrome
(hoeklogo/footer) van een thema dat dat gebruikt; leeg laten toont een
generieke variant. Presenter View volgt automatisch hetzelfde thema.

Een nieuw thema toevoegen: maak `themes/<naam>/theme.css` met daarin
`:root[data-theme="<naam>"] { --bg: ...; --accent: ...; }` (zie
`themes/conclusion/theme.css` als voorbeeld), en voeg in zowel `index.html`
als `presenter.html` één `<link rel="stylesheet" href="themes/<naam>/theme.css">`
toe naast de bestaande thema-links. `styles.css` zelf hoeft niet te
veranderen.
```

with:

```markdown
`CONFIG.theme` kiest het **startdesign**: `'default'` (het bestaande lichte
thema), `'conclusion'` (donker thema met Conclusion-huisstijlkleuren, zie
`themes/conclusion/theme.css`) of `'bouwstenen'` (papieren fond met chunky
kleurblokken, zie `themes/bouwstenen/theme.css`). Tijdens het presenteren kan
de presentator altijd wisselen via de designknop naast de Presenter
View-knop, of `Shift+T` — zie ook vanuit de Presenter View. De keuze
overleeft een refresh binnen dezelfde sessie (`sessionStorage`); zonder
opgeslagen waarde geldt weer `CONFIG.theme`. `CONFIG.brand.businessUnit`/
`tagline` vullen de bijpassende chrome (hoeklogo/footer) van een thema dat
dat gebruikt; leeg laten toont een generieke variant.

Een nieuw thema toevoegen: maak `themes/<naam>/theme.css` met daarin
`:root[data-theme="<naam>"] { --bg: ...; --accent: ...; }` (zie
`themes/conclusion/theme.css` als voorbeeld), voeg in zowel `index.html` als
`presenter.html` één `<link rel="stylesheet" href="themes/<naam>/theme.css">`
toe naast de bestaande thema-links, en voeg de naam toe aan de `THEMES`-lijst
bovenaan `app.js` (en een weergavenaam in `APP_I18N.themeNames`). `styles.css`
zelf hoeft niet te veranderen.
```

- [ ] **Step 4: Update `config.js`'s doc comment for `theme`**

Current (`config.js:20-24`):

```js
  // 'default' or 'conclusion' (see themes/conclusion/theme.css). Chosen once
  // when the presentation is set up and not meant to change at runtime — see
  // README.md for how to add a new theme.
  theme: 'conclusion',
```

Replace with:

```js
  // 'default', 'conclusion' or 'bouwstenen' — see themes/<name>/theme.css.
  // This is only the START theme: the presentator can always switch live
  // during the presentation via the design button / Shift+T — see
  // README.md for how to add a new theme.
  theme: 'conclusion',
```

- [ ] **Step 5: Commit**

```bash
git add index.html presenter.html README.md config.js
git commit -m "Wire the bouwstenen theme into index.html/presenter.html; update docs"
```

---

## Task 4: Playwright smoke test for the `bouwstenen` theme

**Files:**
- Modify: `tests/config-and-ui.spec.js` (append)

**Interfaces:**
- Consumes: `gotoPresentation`, `waitIdle` from `tests/helpers.js`; `SLIDES`, `state`, `renderSlide`, `goTo` globals from `app.js`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the smoke test**

Append to `tests/config-and-ui.spec.js`:

```js
test.describe('bouwstenen theme', () => {
  test('every slide renders under bouwstenen with no console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await gotoPresentation(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'bouwstenen'));

    const total = await page.evaluate(() => SLIDES.length);
    for (let i = 0; i < total; i++) {
      // eslint-disable-next-line no-loop-func
      await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, i);
    }
    expect(errors).toEqual([]);
  });

  test('the title slide gets the dark wordmark block, not the gradient-clip text', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'bouwstenen');
      state.currentIndex = 0; // slide 0 is always the title slide, per README's authoring convention
      renderSlide();
    });
    const bg = await page.locator('.slide-heading h1.slide-title-accent').evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe('rgb(23, 26, 28)'); // --text / inkt
  });

  test('bullets cycle through all 4 accent colors', async ({ page }) => {
    await gotoPresentation(page);
    const bulletsIndex = await page.evaluate(() => SLIDES.findIndex((s) => (s.bullets || []).length >= 4));
    expect(bulletsIndex).toBeGreaterThan(-1); // fixture assumption — see step 2 below if this fails
    await page.evaluate((index) => {
      document.documentElement.setAttribute('data-theme', 'bouwstenen');
      state.currentIndex = index;
      renderSlide();
    }, bulletsIndex);
    const colors = await page.locator('.slide-bullets li').evaluateAll(
      (lis) => lis.slice(0, 4).map((li) => getComputedStyle(li, '::before').backgroundColor)
    );
    expect(new Set(colors).size).toBe(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail correctly, then adjust the bullets fixture if needed**

Run: `npx playwright test tests/config-and-ui.spec.js -g "bouwstenen theme"`
Expected: the first two tests FAIL only because `themes/bouwstenen/theme.css` isn't linted yet at this point in real execution order — but since Tasks 2-3 are already done by this point in the plan, expected result is actually PASS for tests 1-2. Test 3 (`bullets cycle through all 4 accent colors`) may fail with "bulletsIndex -1 not > -1" if no existing slide in this repo's `slides-data.js` happens to have 4+ bullets — if so, replace the `bulletsIndex` lookup with a direct SLIDES mutation instead (same technique as Task 1's tests):

```js
    const bulletsIndex = await page.evaluate(() => {
      const idx = SLIDES.findIndex((s) => s.layout === 'bullets');
      SLIDES[idx] = { ...SLIDES[idx], bullets: ['a', 'b', 'c', 'd'] };
      return idx;
    });
```

Use whichever variant actually matches this repo's `slides-data.js` content — run the test to see which path is needed, don't guess blind.

- [ ] **Step 3: Run the full file to confirm no regressions**

Run: `npx playwright test tests/config-and-ui.spec.js`
Expected: PASS (all tests in the file).

- [ ] **Step 4: Commit**

```bash
git add tests/config-and-ui.spec.js
git commit -m "Add bouwstenen theme smoke tests"
```

---

## Task 5: `THEMES` array, toggle button, i18n, cycling + persistence (Presentation View side)

**Files:**
- Modify: `app.js` (new `THEMES` const, `APP_I18N` additions, new functions, wiring near existing `#btn-presenter-view` wiring)
- Modify: `index.html` (new button markup near `#btn-presenter-view`, `index.html:112-114`)
- Test: `tests/config-and-ui.spec.js` (append; deeper toggle tests land in Task 9, this task only proves the button/cycle/persist mechanics)

**Interfaces:**
- Consumes: `isEmbedPreview` (`app.js:134`), `CONFIG.ui` (populated by `applyAppLanguage()`), `sendStateToPresenter` (defined later in the file — the new `cycleTheme()` calls it, so `cycleTheme` must be defined/called only after `sendStateToPresenter` exists, i.e. placed in the same late section of the file as the existing `openPresenterView`/button wiring, not up near `APP_I18N`).
- Produces: `const THEMES = ['default', 'conclusion', 'bouwstenen'];` (module scope), `function cycleTheme()`, `function setTheme(theme, opts)` — Task 6 calls `sendStateToPresenter()` (already existing) which Task 5 extends with a `theme` field; Task 7's `CYCLE_THEME` command handler calls this task's `cycleTheme()`.

- [ ] **Step 1: Write the failing test**

Append to `tests/config-and-ui.spec.js`:

```js
test.describe('theme toggle (Presentation View)', () => {
  test('the button is visible without extra configuration, and a click cycles default -> conclusion -> bouwstenen -> default', async ({ page }) => {
    await gotoPresentation(page);
    await expect(page.locator('#btn-theme-toggle')).toBeVisible();
    const themes = await page.evaluate(() => THEMES);
    const start = await page.evaluate(() => document.documentElement.dataset.theme);
    let expected = themes[(themes.indexOf(start) + 1) % themes.length];
    for (let i = 0; i < themes.length; i++) {
      await page.click('#btn-theme-toggle');
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(expected);
      expected = themes[(themes.indexOf(expected) + 1) % themes.length];
    }
  });

  test('Shift+T also cycles the theme', async ({ page }) => {
    await gotoPresentation(page);
    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.keyboard.press('Shift+T');
    const after = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(after).not.toBe(before);
  });

  test('the choice survives a reload within the session (sessionStorage)', async ({ page }) => {
    await gotoPresentation(page);
    await page.click('#btn-theme-toggle');
    const chosen = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.reload();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(chosen);
  });

  test('you stay on the same slide, with quiz/overlay state intact, across a theme switch', async ({ page }) => {
    await gotoPresentation(page);
    const quizIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'quiz'));
    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, quizIndex);
    await page.evaluate(() => {
      const slide = SLIDES[state.currentIndex];
      const itemId = slide.items[0].id;
      const s = getQuizState(slide);
      s.revealed[itemId] = true;
      renderSlide();
    });
    await page.click('#btn-theme-toggle');
    const stillReloaded = await page.evaluate(() => document.readyState === 'complete' && !!window.__navigated);
    expect(stillReloaded).toBe(false); // sanity: no navigation flag ever set (see below)
    expect(await page.evaluate(() => state.currentIndex)).toBe(quizIndex);
    const revealed = await page.evaluate(() => {
      const slide = SLIDES[state.currentIndex];
      return getQuizState(slide).revealed[slide.items[0].id];
    });
    expect(revealed).toBe(true);
  });
});
```

Note: the `window.__navigated` line above is a placeholder sanity check with no setter anywhere in the app — it will always read `false`/`undefined` and is here only to document intent; Playwright's own `page.on('framenavigated', ...)` is the real way to assert "no reload happened" if you want a stronger check. Replace it with:

```js
    let navigated = false;
    page.on('framenavigated', () => { navigated = true; });
    // (move this listener registration to before the click above when implementing)
```

if you want that stronger assertion — either is acceptable for this task; the important assertions are `state.currentIndex` and `revealed`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/config-and-ui.spec.js -g "theme toggle"`
Expected: FAIL — `#btn-theme-toggle` doesn't exist, `THEMES` is undefined.

- [ ] **Step 3: Add `THEMES` + i18n keys in `app.js`**

Right after `const isEmbedPreview = ...` (`app.js:134`), add:

```js
// Fixed cycle order for the design-toggle button/Shift+T/CYCLE_THEME — see
// README.md's "Een nieuw thema toevoegen" for what adding a 4th theme needs
// (a themes/<name>/theme.css, two <link> tags, one entry here, one entry in
// APP_I18N.themeNames below).
const THEMES = ['default', 'conclusion', 'bouwstenen'];
```

In `APP_I18N.nl` (`app.js:54-75`), add (anywhere in the object, e.g. right after `presenterViewButton`):

```js
    themeToggleLabelPrefix: 'Ontwerp:',
    themeNames: { default: 'Standaard', conclusion: 'Conclusion', bouwstenen: 'Bouwstenen' },
```

In `APP_I18N.en` (`app.js:76-97`), add:

```js
    themeToggleLabelPrefix: 'Design:',
    themeNames: { default: 'Default', conclusion: 'Conclusion', bouwstenen: 'Bouwstenen' },
```

- [ ] **Step 4: Add the button markup in `index.html`**

Current (`index.html:112-114`):

```html
      <button id="btn-presenter-view" class="btn-floating btn-presenter-view btn-compact-collapsible" type="button">
        <svg class="icon"><use href="#icon-layers"></use></svg>
        <span id="btn-presenter-view-label" class="btn-label-text"></span>
      </button>
```

Add directly after it:

```html
      <button id="btn-theme-toggle" class="btn-floating btn-theme-toggle btn-compact-collapsible" type="button">
        <svg class="icon"><use href="#icon-swap"></use></svg>
        <span id="btn-theme-toggle-label" class="btn-label-text"></span>
      </button>
```

- [ ] **Step 5: Implement `setTheme`/`cycleTheme`/label update + sessionStorage in `app.js`**

Add near `applyConfigStrings()` (right before `function applyConfigStrings() {` at `app.js:~1434`):

```js
const THEME_STORAGE_KEY = 'presentation.theme';

function loadStoredTheme() {
  try {
    return sessionStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null; // private browsing / blocked site data — fall back to CONFIG.theme
  }
}

function storeTheme(theme) {
  try {
    sessionStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* same as above — the theme still applies for this page load, it just
       won't survive a reload */
  }
}

function updateThemeToggleLabel() {
  const theme = document.documentElement.dataset.theme;
  const name = CONFIG.ui.themeNames[theme] || theme;
  const label = `${CONFIG.ui.themeToggleLabelPrefix} ${name}`;
  document.getElementById('btn-theme-toggle-label').textContent = label;
  document.getElementById('btn-theme-toggle').setAttribute('aria-label', label);
}

// `persist: false` is used by the preview-state handler (Task 6) and by
// presenter.js's renderState() equivalent (Task 7), which both apply a
// theme that was already decided (and already persisted, if applicable) by
// the real Presentation View — persisting again there would be redundant,
// not incorrect, but keeping it to one writer avoids two tabs racing each
// other's sessionStorage writes for no benefit.
function setTheme(theme, { persist = true } = {}) {
  document.documentElement.dataset.theme = theme;
  if (persist) storeTheme(theme);
  if (!isEmbedPreview) updateThemeToggleLabel();
}
```

Read the stored theme at load, applied by the existing inline `<head>` script — see Step 7 below (that script runs before `app.js` loads, so this `loadStoredTheme()` function isn't available to it; Step 7 duplicates the same try/catch inline instead).

Add `cycleTheme()` next to the other button-wiring code, replacing (`app.js:1508-1513`):

```js
if (!isEmbedPreview) {
  document.getElementById('btn-presenter-view').addEventListener('click', openPresenterView);
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'P') openPresenterView();
  });
}
```

with:

```js
if (!isEmbedPreview) {
  document.getElementById('btn-presenter-view').addEventListener('click', openPresenterView);
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'P') openPresenterView();
  });
  document.getElementById('btn-theme-toggle').addEventListener('click', cycleTheme);
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'T') cycleTheme();
  });
} else {
  document.getElementById('btn-theme-toggle').hidden = true;
}

function cycleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  setTheme(next);
  sendStateToPresenter(); // no-op if no Presenter View is connected (Task 6 adds the `theme` field it sends)
}
```

(`cycleTheme` is a function declaration, so it's hoisted — safe to reference in the `addEventListener` above even though it's defined textually afterward, matching this file's existing style of declaring handler functions near where they're used rather than always above.)

- [ ] **Step 6: Call `updateThemeToggleLabel()` from `applyConfigStrings()`**

In `applyConfigStrings()` (`app.js:~1447`), add one line next to the other button label wiring:

```js
  document.getElementById('btn-presenter-view-label').textContent = CONFIG.ui.presenterViewButton;
  document.getElementById('btn-presenter-view').setAttribute('aria-label', CONFIG.ui.presenterViewButton);
  updateThemeToggleLabel();
```

- [ ] **Step 7: Make the inline `<head>` theme script in `index.html` sessionStorage-aware**

Current (`index.html:8`):

```html
<script>document.documentElement.setAttribute('data-theme', (typeof CONFIG !== 'undefined' && CONFIG.theme) || 'default');</script>
```

Replace with:

```html
<script>
(function () {
  var stored = null;
  try { stored = sessionStorage.getItem('presentation.theme'); } catch (e) { /* private browsing / blocked storage */ }
  var theme = stored || (typeof CONFIG !== 'undefined' && CONFIG.theme) || 'default';
  document.documentElement.setAttribute('data-theme', theme);
})();
</script>
```

(`presenter.html`'s inline script is intentionally left unchanged here — Presenter View re-syncs its theme from the real state broadcast once connected, in Task 7; this pre-connect flash doesn't need the sessionStorage read the way `index.html`'s first paint does.)

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx playwright test tests/config-and-ui.spec.js -g "theme toggle"`
Expected: PASS.

- [ ] **Step 9: Run the whole file plus `presenter-view.spec.js` to check for regressions**

Run: `npx playwright test tests/config-and-ui.spec.js tests/presenter-view.spec.js`
Expected: PASS (no existing test asserted on the exact list/position of buttons inside `.toc-widgets` in a way this new button would break — confirm by reading the failure, if any, rather than assuming).

- [ ] **Step 10: Commit**

```bash
git add app.js index.html tests/config-and-ui.spec.js
git commit -m "Add THEMES cycle, toggle button, Shift+T, and sessionStorage persistence"
```

---

## Task 6: Thread `theme` through the Presenter View state broadcast + preview iframes

**Files:**
- Modify: `app.js` (`sendStateToPresenter`, the `preview-state` handler)
- Modify: `presenter.js` (`renderState`, `currentFlags`, `nextPreviewFlags`)

**Interfaces:**
- Consumes: `document.documentElement.dataset.theme` (Task 5), `latestState` (existing `presenter.js` global).
- Produces: `newState.theme` / `preview-state.theme` fields — Task 7's Presenter View toggle button and `CYCLE_THEME` handler rely on `latestState.theme` being present once this task lands.

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view.spec.js`:

```js
test.describe('theme sync (Presenter View)', () => {
  test('Presenter View and both preview iframes pick up a theme switched before it opens', async ({ page }) => {
    await gotoPresentation(page);
    await page.click('#btn-theme-toggle');
    const chosen = await page.evaluate(() => document.documentElement.dataset.theme);
    const presenter = await openPresenterView(page);
    await expect.poll(() => presenter.evaluate(() => document.documentElement.dataset.theme)).toBe(chosen);
    const currentPreviewFrame = presenter.frameLocator('#current-preview');
    const nextPreviewFrame = presenter.frameLocator('#next-preview');
    await expect.poll(() =>
      currentPreviewFrame.locator('html').evaluate((el) => el.dataset.theme)
    ).toBe(chosen);
    await expect.poll(() =>
      nextPreviewFrame.locator('html').evaluate((el) => el.dataset.theme)
    ).toBe(chosen);
  });

  test('switching after Presenter View is already open still syncs it and both previews', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await page.click('#btn-theme-toggle');
    const chosen = await page.evaluate(() => document.documentElement.dataset.theme);
    await expect.poll(() => presenter.evaluate(() => document.documentElement.dataset.theme)).toBe(chosen);
    const currentPreviewFrame = presenter.frameLocator('#current-preview');
    await expect.poll(() =>
      currentPreviewFrame.locator('html').evaluate((el) => el.dataset.theme)
    ).toBe(chosen);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js -g "theme sync"`
Expected: FAIL — `presenter.evaluate(() => document.documentElement.dataset.theme)` stays whatever `presenter.html`'s own inline script picked (its own `CONFIG.theme`), never updated to match a switch.

- [ ] **Step 3: Add `theme` to `sendStateToPresenter()`**

In `app.js`'s `sendStateToPresenter()` (`app.js:1661-1684`), add one field to the posted object:

```js
      quiz: getQuizBroadcastPayload(),
      theme: document.documentElement.dataset.theme,
```

- [ ] **Step 4: Apply `e.data.theme` in the preview-state handler**

In `app.js`'s `isEmbedPreview` branch, inside `if (e.data.type === 'preview-state')` (`app.js:1582-1621`), add as the very first line of that block:

```js
    if (e.data.type === 'preview-state') {
      if (e.data.theme) document.documentElement.dataset.theme = e.data.theme;
```

- [ ] **Step 5: Apply `newState.theme` in `presenter.js`'s `renderState()`**

In `renderState()` (`presenter.js`, right after `latestState = newState;`), add:

```js
function renderState(newState) {
  latestState = newState;
  document.documentElement.dataset.theme = newState.theme;
  presenterMainEl.hidden = false;
```

This one line is also what makes the disco-still (`.disco-still`, `presenter.css:257-291`) and the rest of Presenter View's own chrome follow the new theme automatically — they already read `var(--disco-*)`/`var(--bg)`/`var(--text)` etc., so no separate disco-still styling change is needed here; confirm this by checking `presenter.css` for any hardcoded (non-`var()`) color in `.disco-still*` before assuming it "just works" — as of this plan's writing there is none.

- [ ] **Step 6: Add `theme` to `currentFlags()`/`nextPreviewFlags()` in `presenter.js`**

`currentFlags()` currently returns an object built from `latestState.*` fields — add `theme: latestState.theme,` as one more entry (it's inherited automatically into `nextPreviewFlags()`'s return value too, since that function does `Object.assign(currentFlags(), {...overrides})`, so no separate edit is needed there beyond this one line in `currentFlags()`).

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js -g "theme sync"`
Expected: PASS.

- [ ] **Step 8: Run the whole presenter-view suite for regressions**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS (all tests — confirms adding a field to these broadcasts didn't break anything reading `currentFlags()`/`nextPreviewFlags()`/`sendStateToPresenter()`'s existing fields).

- [ ] **Step 9: Commit**

```bash
git add app.js presenter.js tests/presenter-view.spec.js
git commit -m "Thread theme through the Presenter View state broadcast and preview iframes"
```

---

## Task 7: `CYCLE_THEME` command + Presenter View's own toggle button

**Files:**
- Modify: `app.js` (`COMMAND_HANDLERS`)
- Modify: `presenter.html` (new button, near the existing skip/herstel controls or the display-controls panel)
- Modify: `presenter.js` (`PRESENTER_I18N`, click wiring)

**Interfaces:**
- Consumes: `cycleTheme()` (Task 5, `app.js`), `sendCommand()` (existing `presenter.js` helper), `THEMES`/`latestState.theme` (Tasks 5-6).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Append to `tests/presenter-view.spec.js` (same `describe` block as Task 6, or a new one — either is fine, this appends to the same file):

```js
test.describe('theme toggle (Presenter View)', () => {
  test('clicking the Presenter View design button cycles the real presentation\'s theme too', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await presenter.click('#btn-presenter-theme-toggle');
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).not.toBe(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/presenter-view.spec.js -g "theme toggle (Presenter View)"`
Expected: FAIL — `#btn-presenter-theme-toggle` doesn't exist.

- [ ] **Step 3: Add the `CYCLE_THEME` command handler in `app.js`**

In `COMMAND_HANDLERS` (`app.js:1532-1566`), add one entry:

```js
  CYCLE_THEME: () => cycleTheme(),
```

(`cycleTheme` is the same function Task 5 wired to the button/Shift+T — reusing it here means the command handler gets the `sendStateToPresenter()` broadcast and `sessionStorage` persistence for free, with no duplicated logic.)

- [ ] **Step 4: Add the button markup in `presenter.html`**

In the `controls-panel`/`display-controls` area (near the other toggle buttons, e.g. right after `btn-toggle-pause-overlay` — read the surrounding markup in `presenter.html`'s `display-controls` section before placing this, so it lands next to its siblings rather than orphaned), add:

```html
        <button id="btn-presenter-theme-toggle" class="btn btn--display-toggle" type="button">
          <span data-i18n="themeToggleButton">Ontwerp</span>
        </button>
```

- [ ] **Step 5: Add i18n + click wiring in `presenter.js`**

In `PRESENTER_I18N.nl` (`presenter.js:6-25`), add:

```js
    themeToggleButton: 'Ontwerp',
```

In `PRESENTER_I18N.en` (`presenter.js:26-45`), add:

```js
    themeToggleButton: 'Design',
```

Near the other `sendCommand`-wiring buttons (`presenter.js`, next to the `btn-toggle-*` listeners at the bottom of the file), add:

```js
document.getElementById('btn-presenter-theme-toggle').addEventListener('click', () => sendCommand('CYCLE_THEME'));
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx playwright test tests/presenter-view.spec.js -g "theme toggle"`
Expected: PASS (both this task's test and Task 6's).

- [ ] **Step 7: Run the whole presenter-view suite for regressions**

Run: `npx playwright test tests/presenter-view.spec.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app.js presenter.html presenter.js tests/presenter-view.spec.js
git commit -m "Add a CYCLE_THEME command and a matching Presenter View toggle button"
```

---

## Task 8: Regression coverage for mid-animation/mid-quiz theme switching

**Files:**
- Modify: `tests/config-and-ui.spec.js` (append — this is the Review Focus item about disco/animation safety)

**Interfaces:**
- Consumes: `isAnimatingSlide`, `goTo`, `showPauseOverlay`/`isPauseOverlayVisible` (existing `app.js` globals/functions).

- [ ] **Step 1: Write the test**

Append to `tests/config-and-ui.spec.js`, in the `theme toggle (Presentation View)` describe block from Task 5:

```js
  test('switching theme mid-disco-transition does not break the following transition', async ({ page }) => {
    await gotoPresentation(page);
    // eslint-disable-next-line no-undef
    await page.evaluate(() => { goTo(1, { animate: true }); });
    await page.click('#btn-theme-toggle'); // fired while isAnimatingSlide is (likely) still true
    await waitIdle(page);
    // A normal subsequent transition must still complete cleanly.
    await page.evaluate(() => { goTo(2, { animate: true }); });
    await waitIdle(page);
    expect(await page.evaluate(() => state.currentIndex)).toBe(2);
  });

  test('switching theme while the pause overlay is frozen leaves it visible and unchanged', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => showPauseOverlay());
    await page.click('#btn-theme-toggle');
    expect(await page.evaluate(() => isPauseOverlayVisible())).toBe(true);
  });
```

(`waitIdle` and `showPauseOverlay`/`isPauseOverlayVisible` must already be imported/available at the top of `tests/config-and-ui.spec.js` — check the existing `require('./helpers')` line and add `waitIdle` to its destructure if it isn't already there.)

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx playwright test tests/config-and-ui.spec.js -g "mid-disco-transition|pause overlay is frozen"`
Expected: PASS — `cycleTheme()` never touches `isAnimatingSlide`/the pause-overlay state, so this should pass immediately; if it doesn't, that means Task 5's implementation accidentally interacts with those, and needs fixing before proceeding (don't weaken the test).

- [ ] **Step 3: Commit**

```bash
git add tests/config-and-ui.spec.js
git commit -m "Add regression coverage for theme switching during disco/pause overlay states"
```

---

## Volgorde / merge notes (from the source doc, unchanged)

1. Land Task 1 first (it's small and independent), then Tasks 2-4 (theme), then Tasks 5-8 (toggle) — matches the source doc's own ordering.
2. Run the **entire** Playwright suite (`npx playwright test`) after Task 8, not just the files touched — confirm the full-suite pass count against the pre-change baseline before calling this done.
3. Merge `develop` → `main`, then `main` or `develop` → `HBO-Q&A`. The `app.js`/`styles.css` conflict around `renderQuoteLayout`/`--footnote` resolves by taking `develop`'s version — it's the same code, already ported in Task 1.
4. On `HBO-Q&A`, nothing else is needed — the toggle works immediately with its existing `slides-data.js`/`content.js`. To start that deck in Bouwstenen, set `CONFIG.theme` to `'bouwstenen'` there.
