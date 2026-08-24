const { test, expect } = require('@playwright/test');
const { gotoPresentation, waitIdle } = require('./helpers');

// A slide with `discoMode: 'pause'` freezes the transition landing on it
// until a second matching click (see disco-and-pause.spec.js) — one click
// doesn't always mean one slide advance. Mirror that here so this loop
// still lands exactly on the last/first slide regardless of which slides
// happen to use a pause.
async function clickAndSettle(page, selector) {
  await page.click(selector);
  await waitIdle(page);
  // eslint-disable-next-line no-undef
  if (await page.evaluate(() => pendingPause !== null)) {
    await page.click(selector);
    await waitIdle(page);
  }
}

test('PageDown/PageUp clicker signals navigate forward and backward', async ({ page }) => {
  await gotoPresentation(page);

  await page.keyboard.press('PageDown');
  await waitIdle(page);
  expect(await page.evaluate(() => state.currentIndex)).toBe(1);

  await page.keyboard.press('PageUp');
  await waitIdle(page);
  expect(await page.evaluate(() => state.currentIndex)).toBe(0);
});

test('clicking through all slides produces no console/page errors', async ({ page }) => {
  test.setTimeout(90_000); // ~60 animated transitions at up to 700ms each
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await gotoPresentation(page);
  const slideCount = await page.evaluate(() => SLIDES.length);
  expect(slideCount).toBeGreaterThan(0);

  for (let i = 0; i < slideCount - 1; i++) {
    await clickAndSettle(page, '#btn-next');
  }
  const finalIndex = await page.evaluate(() => state.currentIndex);
  expect(finalIndex).toBe(slideCount - 1);

  for (let i = 0; i < slideCount - 1; i++) {
    await clickAndSettle(page, '#btn-prev');
  }
  const backAtStart = await page.evaluate(() => state.currentIndex);
  expect(backAtStart).toBe(0);

  expect(errors).toEqual([]);
});

test.describe('malformed slide data degrades gracefully', () => {
  // A generation slip (scaffold-presentation/update-slides skills, or a
  // hand-edit) omitting `title`/`bullets` on any slide must not crash the
  // whole deck — renderTocOnce() renders every slide's title in one pass
  // at startup, so one bad slide previously broke the entire presentation.

  test('a slide missing `title` elsewhere in the deck does not break the TOC', async ({ page }) => {
    await gotoPresentation(page);
    const result = await page.evaluate(() => {
      delete SLIDES[10].title;
      try {
        renderTocOnce();
        return { crashed: false };
      } catch (e) {
        return { crashed: true, message: e.message };
      }
    });
    expect(result.crashed).toBe(false);
  });

  test('a slide missing `bullets` renders blank-ish instead of crashing', async ({ page }) => {
    await gotoPresentation(page);
    const result = await page.evaluate(() => {
      delete SLIDES[2].bullets;
      try {
        state.currentIndex = 2;
        renderSlide();
        return { crashed: false };
      } catch (e) {
        return { crashed: true, message: e.message };
      }
    });
    expect(result.crashed).toBe(false);
    await expect(page.locator('.slide-bullets')).toHaveCount(0);
  });

  test('a slide missing `title` renders an empty heading instead of crashing', async ({ page }) => {
    await gotoPresentation(page);
    const result = await page.evaluate(() => {
      delete SLIDES[2].title;
      try {
        state.currentIndex = 2;
        renderSlide();
        return { crashed: false };
      } catch (e) {
        return { crashed: true, message: e.message };
      }
    });
    expect(result.crashed).toBe(false);
    await expect(page.locator('.slide-heading h1')).toHaveText('');
  });
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
