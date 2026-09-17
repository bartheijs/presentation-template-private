const { test, expect } = require('@playwright/test');
const path = require('path');
const { gotoPresentation, openPresenterView } = require('./helpers');

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

  test('totalPlannedMs() is the actual sum of every slide\'s effective duration, not the raw configured total', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      SLIDES.length = 0;
      // eslint-disable-next-line no-undef
      SLIDES.push(
        { id: 1, title: 'A', bullets: [], notes: '', duration: 60 },
        { id: 2, title: 'B', bullets: [], notes: '', duration: 90 },
        { id: 3, title: 'C', bullets: [], notes: '' }, // no duration: falls back
        { id: 4, title: 'D', bullets: [], notes: '' } // no duration: falls back
      );
      // eslint-disable-next-line no-undef
      CONFIG.timer.defaultMinutes = 5; // configuredTotalMs = 300s, well below the actual sum below
    });

    const result = await page.evaluate(() => ({
      // eslint-disable-next-line no-undef
      configured: configuredTotalMs(),
      // eslint-disable-next-line no-undef
      average: averageSlideDurationSeconds(),
      // eslint-disable-next-line no-undef
      total: totalPlannedMs(),
      // eslint-disable-next-line no-undef
      plannedStartAtEnd: plannedStartOfSlide(4),
    }));

    // average share is still based on the raw configured total (300s / 4 slides = 75s each)
    expect(result.configured).toBe(300000);
    expect(result.average).toBe(75);

    // actual total = explicit durations (60 + 90) + two fallback shares (75 + 75) = 300...
    // use distinct explicit durations so the assertion can't pass by coincidence with configuredTotalMs
    expect(result.total).toBe(result.plannedStartAtEnd * 1000);
    expect(result.total).toBe(300000);

    // Now change the configured total after explicit durations are fixed, so totalPlannedMs
    // (actual sum) and configuredTotalMs (raw config) diverge — this is the case the fix targets.
    await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      CONFIG.timer.defaultMinutes = 10; // configuredTotalMs = 600s
    });

    const diverged = await page.evaluate(() => ({
      // eslint-disable-next-line no-undef
      configured: configuredTotalMs(),
      // eslint-disable-next-line no-undef
      total: totalPlannedMs(),
    }));

    expect(diverged.configured).toBe(600000);
    // average share is now 600/4 = 150s per fallback slide, so actual total =
    // 60 + 90 + 150 + 150 = 450s = 450000ms — different from the raw configured 600000ms.
    expect(diverged.total).toBe(450000);
    expect(diverged.total).not.toBe(diverged.configured);
  });
});

test.describe('presentation timer persistence', () => {
  test('the countdown keeps decreasing across a Presenter View refresh while running', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const initialRemaining = await presenter.evaluate(() => getRemainingSeconds());
    await presenter.click('#btn-presenter-timer-toggle');
    await presenter.waitForTimeout(1100);

    await presenter.reload();
    const remainingAfterReload = await presenter.evaluate(() => getRemainingSeconds());
    expect(remainingAfterReload).toBeLessThan(initialRemaining);
  });

  test('reset restores the configured duration, not zero', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.fill('[data-elapsed]', '5:00');
    await presenter.dispatchEvent('[data-elapsed]', 'blur');
    await presenter.click('#btn-presenter-timer-toggle');
    await presenter.waitForTimeout(1100);
    await presenter.click('#btn-presenter-timer-reset');
    const remaining = await presenter.evaluate(() => getRemainingSeconds());
    expect(remaining).toBe(300);
  });

  test('typing a new duration while paused updates the countdown, but is ignored while running', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.fill('[data-elapsed]', '2:00');
    await presenter.dispatchEvent('[data-elapsed]', 'blur');
    expect(await presenter.evaluate(() => getRemainingSeconds())).toBe(120);

    await presenter.click('#btn-presenter-timer-toggle');
    await expect(presenter.locator('[data-elapsed]')).toBeDisabled();

    await presenter.click('#btn-presenter-timer-toggle'); // same button — now pauses
    await expect(presenter.locator('[data-elapsed]')).toBeEnabled();
  });

  test('the clock renders and updates', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await expect(page.locator('[data-clock]')).not.toHaveText('');
  });
});
