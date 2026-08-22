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
