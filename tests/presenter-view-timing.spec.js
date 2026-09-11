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
  test('elapsed time survives a Presenter View refresh while running', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-timer-start');
    await presenter.waitForTimeout(1100);

    await presenter.reload();
    const elapsedAfterReload = await presenter.evaluate(() => getElapsedSeconds());
    expect(elapsedAfterReload).toBeGreaterThanOrEqual(1);
  });

  test('reset zeroes the timer and clears sessionStorage', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-timer-start');
    await presenter.waitForTimeout(300);
    await presenter.click('#btn-presenter-timer-reset');
    const elapsed = await presenter.evaluate(() => getElapsedSeconds());
    expect(elapsed).toBe(0);
  });

  test('the clock renders and updates', async ({ page }) => {
    await page.goto(PRESENTER_URL);
    await expect(page.locator('[data-clock]')).not.toHaveText('');
  });
});

test.describe('countdown total (manual entry via double-click)', () => {
  test('starts at the configured total and counts down while running', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const defaultMinutes = await page.evaluate(() => CONFIG.timer.defaultMinutes);
    const suffix = await presenter.evaluate(() => presenterText.elapsedSuffix);
    await expect(presenter.locator('[data-elapsed]')).toHaveText(
      `${String(defaultMinutes).padStart(2, '0')}:00 ${suffix}`
    );

    await presenter.click('#btn-presenter-timer-start');
    await presenter.waitForTimeout(1200);
    const remaining = await presenter.evaluate(() => getRemainingSeconds());
    expect(remaining).toBeLessThan(defaultMinutes * 60);
    expect(remaining).toBeGreaterThanOrEqual(defaultMinutes * 60 - 3);
  });

  test('double-clicking sets a new total and restarts the countdown from it, paused', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-timer-start');
    await presenter.waitForTimeout(300);

    await presenter.evaluate(() => {
      window.prompt = () => '5';
    });
    await presenter.dblclick('[data-elapsed]');

    const remaining = await presenter.evaluate(() => getRemainingSeconds());
    expect(remaining).toBe(300);
    const suffix = await presenter.evaluate(() => presenterText.elapsedSuffix);
    await expect(presenter.locator('[data-elapsed]')).toHaveText(`05:00 ${suffix}`);
    // Setting a new total is a fresh start, so the timer pauses again — the
    // presenter has to explicitly hit Start, rather than it silently
    // continuing to run against the new total.
    expect(await presenter.evaluate(() => timerState.running)).toBe(false);
  });

  test('cancelling the prompt (null) leaves the countdown unchanged', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const before = await presenter.evaluate(() => getRemainingSeconds());

    await presenter.evaluate(() => {
      window.prompt = () => null;
    });
    await presenter.dblclick('[data-elapsed]');

    expect(await presenter.evaluate(() => getRemainingSeconds())).toBe(before);
  });

  test('an unparsable or non-positive value is ignored', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const before = await presenter.evaluate(() => getRemainingSeconds());

    await presenter.evaluate(() => {
      window.prompt = () => 'not a number';
    });
    await presenter.dblclick('[data-elapsed]');
    expect(await presenter.evaluate(() => getRemainingSeconds())).toBe(before);

    await presenter.evaluate(() => {
      window.prompt = () => '-5';
    });
    await presenter.dblclick('[data-elapsed]');
    expect(await presenter.evaluate(() => getRemainingSeconds())).toBe(before);
  });

  test('a decimal number of minutes (comma or dot) is accepted', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    await presenter.evaluate(() => {
      window.prompt = () => '2,5';
    });
    await presenter.dblclick('[data-elapsed]');

    const remaining = await presenter.evaluate(() => getRemainingSeconds());
    expect(remaining).toBe(150);
  });
});
