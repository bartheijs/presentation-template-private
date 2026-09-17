const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView } = require('./helpers');

// Covers: config.js-driven strings/toggles applied at startup by
// applyConfigStrings() in app.js, and the templateOverlay.enabled toggle.

test.describe('config-driven UI strings', () => {
  test('applies CONFIG values to the DOM at startup', async ({ page }) => {
    await gotoPresentation(page);

    // Reads CONFIG back from the page rather than hardcoding its values
    // here: this test's job is "whatever CONFIG says ends up in the DOM",
    // not "CONFIG contains these exact strings" — this deck's own
    // config.js content (title, disco text, ui labels, ...) is free to
    // change without this test needing to change alongside it.
    const cfg = await page.evaluate(() => CONFIG);

    await expect(page).toHaveTitle(cfg.title);
    await expect(page.locator('html')).toHaveAttribute('lang', cfg.lang);
    await expect(page.locator('#toc-heading')).toHaveText(cfg.toc.heading);
    for (const line of cfg.disco.titleLines) {
      await expect(page.locator('#disco-title')).toContainText(line);
    }
    await expect(page.locator('#btn-template-label')).toHaveText(cfg.ui.templateButton);
    await expect(page.locator('#timer-display')).toHaveText(
      `${String(cfg.timer.defaultMinutes).padStart(2, '0')}:00`
    );
    await expect(page.locator('#timer-toggle-label')).toHaveText(cfg.ui.timerStart);
    await expect(page.locator('#timer-add5-label')).toHaveText(`+${cfg.timer.addMinutes} min`);
    await expect(page.locator('#btn-timer-finish-label')).toHaveText(cfg.ui.timerFinish);
    await expect(page.locator('#btn-next-label')).toHaveText(cfg.ui.navNext);
    await expect(page.locator('#btn-prev-label')).toHaveText(cfg.ui.navPrev);
    await expect(page.locator('#overlay-title-text')).toHaveText(cfg.ui.overlayTitle);
    await expect(page.locator('#btn-overlay-close')).toHaveAttribute('aria-label', cfg.ui.overlayCloseLabel);
    await expect(page.locator('#btn-finish-close')).toHaveAttribute('aria-label', cfg.ui.backToDeckLabel);
    await expect(page.locator('#finish-title')).toHaveText(cfg.ui.finishTitle);
    await expect(page.locator('#finish-back-label')).toHaveText(cfg.ui.backToDeckLabel);
    // Derived from SLIDES rather than hardcoded, so this test doesn't need
    // updating every time a slide is added/removed from this deck.
    const total = await page.evaluate(() => SLIDES.length);
    await expect(page.locator('#slide-progress')).toHaveText(`1 / ${total}`);
  });

  test('templateOverlay.enabled true shows the button and ArrowDown opens it', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      CONFIG.templateOverlay.enabled = true;
      applyConfigStrings();
    });
    await expect(page.locator('#btn-template')).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#template-overlay')).toBeVisible();
  });

  test('CONFIG.lang switches all shared Presentation View controls', async ({ page }) => {
    await gotoPresentation(page);

    await page.evaluate(() => {
      CONFIG.lang = 'en';
      applyConfigStrings();
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#toc-heading')).toHaveText('Contents');
    await expect(page.locator('#btn-prev-label')).toHaveText('Previous');
    await expect(page.locator('#btn-next-label')).toHaveText('Next');

    await page.evaluate(() => {
      CONFIG.lang = 'nl';
      applyConfigStrings();
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
    await expect(page.locator('#toc-heading')).toHaveText('Inhoud');
    await expect(page.locator('#btn-prev-label')).toHaveText('Vorige');
    await expect(page.locator('#btn-next-label')).toHaveText('Volgende');
  });

  test('templateOverlay.enabled false hides the button and disables ArrowDown', async ({ page }) => {
    await gotoPresentation(page);
    // Toggle config and re-run the real startup function that applies it —
    // faithful to production behavior, not a DOM simulation.
    await page.evaluate(() => {
      CONFIG.templateOverlay.enabled = false;
      applyConfigStrings();
    });

    await expect(page.locator('#btn-template')).toBeHidden();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#template-overlay')).toBeHidden();
  });

  test('an incomplete CONFIG still renders instead of crashing', async ({ page }) => {
    // Simulates a presentation branch shipping a stripped-down config.js
    // (e.g. missing the whole `ui` or `disco` section) — normalizeConfig()
    // should backfill defaults so applyConfigStrings() and friends don't
    // throw and blank the page.
    await gotoPresentation(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const transitionsAfterNormalize = await page.evaluate(() => {
      delete CONFIG.ui;
      delete CONFIG.disco;
      delete CONFIG.layout;
      delete CONFIG.transitions;
      normalizeConfig(CONFIG, CONFIG_DEFAULTS);
      applyConfigStrings();
      renderSlide();
      return CONFIG.transitions;
    });

    expect(errors).toEqual([]);
    await expect(page.locator('#btn-template-label')).toHaveText(
      await page.evaluate(() => CONFIG.ui.templateButton)
    );
    await expect(page.locator('.slide-heading')).toBeVisible();
    // Regression guard: CONFIG.transitions.* is read at module-evaluation
    // time in app.js (ANIM_OUT_MS and friends), before anything renders —
    // if CONFIG_DEFAULTS ever loses its `transitions` fallback again,
    // normalizeConfig() would leave this undefined and a presentation
    // missing that section would blank on load with no visible error.
    expect(transitionsAfterNormalize).toEqual({
      outMs: expect.any(Number),
      inMs: expect.any(Number),
      discoRevealDelayMs: expect.any(Number),
      discoHideLeadMs: expect.any(Number),
    });
  });
});

// Covers: CONFIG.theme -> the <html data-theme> attribute set by the inline
// script in <head> (before styles.css/themes/conclusion/theme.css load, so
// there's no flash of the wrong theme), the [data-theme="conclusion"] CSS
// override winning over both the default :root block and the
// prefers-color-scheme: dark block, the brand-chrome visibility/strings, and
// Presenter View inheriting the same computed colors.
test.describe('theme system', () => {
  test('data-theme on <html> matches this deck\'s CONFIG.theme at load', async ({ page }) => {
    await gotoPresentation(page);
    const theme = await page.evaluate(() => CONFIG.theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  });

  test('data-theme="conclusion" overrides --bg/--accent regardless of OS color scheme', async ({ page }) => {
    await gotoPresentation(page);
    // Forced explicitly rather than assumed from this deck's own config.js —
    // that value is content, not an engine default, and is free to already
    // be 'conclusion' here.
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'default'));
    const defaultBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));
    const conclusion = await page.evaluate(() => ({
      bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    }));

    expect(conclusion.bg).not.toBe(defaultBg);
    expect(conclusion.bg.toLowerCase()).toBe('#000000');
    expect(conclusion.accent.toLowerCase()).toBe('#1369af');
  });

  test('conclusion theme wins over prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoPresentation(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    expect(bg.toLowerCase()).toBe('#000000');
  });

  test('brand chrome is hidden by default and shown under the conclusion theme', async ({ page }) => {
    await gotoPresentation(page);
    // Forced explicitly — see the note in the previous test.
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'default'));
    await expect(page.locator('#brand-chrome')).toBeHidden();

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));
    await expect(page.locator('#brand-chrome')).toBeVisible();
  });

  test('CONFIG.brand strings populate the chrome, blank by default', async ({ page }) => {
    await gotoPresentation(page);
    // Forced explicitly rather than assumed from this deck's own config.js —
    // those strings are content, not an engine default, and are free to
    // already be filled in here.
    await page.evaluate(() => {
      CONFIG.brand.businessUnit = '';
      CONFIG.brand.tagline = '';
      applyConfigStrings();
    });
    await expect(page.locator('#brand-chrome-business-unit')).toBeEmpty();
    await expect(page.locator('#brand-chrome-tagline')).toBeEmpty();

    await page.evaluate(() => {
      CONFIG.brand.businessUnit = 'Low Code Company';
      CONFIG.brand.tagline = 'Business done differently';
      applyConfigStrings();
    });
    await expect(page.locator('#brand-chrome-business-unit')).toHaveText('Low Code Company');
    await expect(page.locator('#brand-chrome-tagline')).toHaveText('Business done differently');
  });

  test('Presenter View resolves the same computed colors as the main window', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));
    const popup = await openPresenterView(page);
    await popup.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));

    const mainBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    const presenterBg = await popup.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    expect(presenterBg).toBe(mainBg);
  });
});
