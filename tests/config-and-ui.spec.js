const { test, expect } = require('@playwright/test');
const { gotoPresentation } = require('./helpers');

// Covers: config.js-driven strings/toggles applied at startup by
// applyConfigStrings() in app.js, and the templateOverlay.enabled toggle.

test.describe('config-driven UI strings', () => {
  test('applies CONFIG values to the DOM at startup', async ({ page }) => {
    await gotoPresentation(page);

    await expect(page).toHaveTitle('Skill Engineering Workshop');
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
    await expect(page.locator('#toc-heading')).toHaveText('Inhoud');
    await expect(page.locator('#disco-title')).toContainText('SKILLS');
    await expect(page.locator('#disco-title')).toContainText('THRILLS');
    await expect(page.locator('#btn-template-label')).toHaveText('Skill Template');
    await expect(page.locator('#timer-display')).toHaveText('30:00');
    await expect(page.locator('#btn-timer-toggle')).toHaveText('Start');
    await expect(page.locator('#timer-add5-label')).toHaveText('+5 min');
    await expect(page.locator('#btn-timer-finish-label')).toHaveText('Klaar!');
    await expect(page.locator('#btn-next-label')).toHaveText('Volgende');
    await expect(page.locator('#btn-prev-label')).toHaveText('Vorige');
    await expect(page.locator('#overlay-title-text')).toHaveText('skill.md template');
    await expect(page.locator('#btn-overlay-close')).toHaveAttribute('aria-label', 'Sluiten');
    await expect(page.locator('#btn-finish-close')).toHaveAttribute('aria-label', 'Terug naar de presentatie');
    await expect(page.locator('#finish-title')).toHaveText('Eindelijk kunnen we aan de slag!');
    await expect(page.locator('#finish-back-label')).toHaveText('Terug naar de presentatie');
    // Derived from SLIDES rather than hardcoded, so this test doesn't need
    // updating every time a slide is added/removed from this deck.
    const total = await page.evaluate(() => SLIDES.length);
    await expect(page.locator('#slide-progress')).toHaveText(`1 / ${total}`);
  });

  test('templateOverlay.enabled true shows the button and ArrowDown opens it', async ({ page }) => {
    await gotoPresentation(page);
    await expect(page.locator('#btn-template')).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#template-overlay')).toBeVisible();
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

    await page.evaluate(() => {
      delete CONFIG.ui;
      delete CONFIG.disco;
      delete CONFIG.layout;
      normalizeConfig(CONFIG, CONFIG_DEFAULTS);
      applyConfigStrings();
      renderSlide();
    });

    expect(errors).toEqual([]);
    await expect(page.locator('#btn-template-label')).toHaveText('Skill Template');
    await expect(page.locator('.slide-heading')).toBeVisible();
  });
});
