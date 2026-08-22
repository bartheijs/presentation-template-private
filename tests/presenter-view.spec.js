const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView } = require('./helpers');

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
    await expect(page.locator('[data-connection-hint]')).toContainText('Open deze pagina via de Presentatieweergave');
  });
});
