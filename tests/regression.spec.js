const { test, expect } = require('@playwright/test');
const { gotoPresentation, waitIdle } = require('./helpers');

test('clicking through all 31 slides produces no console/page errors', async ({ page }) => {
  test.setTimeout(90_000); // ~60 animated transitions at up to 700ms each
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await gotoPresentation(page);
  const slideCount = await page.evaluate(() => SLIDES.length);
  expect(slideCount).toBeGreaterThan(0);

  for (let i = 0; i < slideCount - 1; i++) {
    await page.click('#btn-next');
    await waitIdle(page);
  }
  const finalIndex = await page.evaluate(() => state.currentIndex);
  expect(finalIndex).toBe(slideCount - 1);

  for (let i = 0; i < slideCount - 1; i++) {
    await page.click('#btn-prev');
    await waitIdle(page);
  }
  const backAtStart = await page.evaluate(() => state.currentIndex);
  expect(backAtStart).toBe(0);

  expect(errors).toEqual([]);
});

test('opening and closing both overlays produces no errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await gotoPresentation(page);

  await page.click('#btn-template');
  await expect(page.locator('#template-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#template-overlay')).toBeHidden();

  await page.click('#btn-timer-finish');
  await expect(page.locator('#finish-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#finish-overlay')).toBeHidden();

  expect(errors).toEqual([]);
});
