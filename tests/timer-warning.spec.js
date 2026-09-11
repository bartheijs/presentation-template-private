const { test, expect } = require('@playwright/test');
const { gotoPresentation, waitIdle } = require('./helpers');

async function crossWarningThreshold(page) {
  await page.evaluate(() => {
    timer.remainingMs = TIMER_WARNING_MS + 1000;
    timer.endAt = Date.now() + TIMER_WARNING_MS - 1;
    timer.running = true;
    timerTick();
  });
}

test('passing five minutes starts temporary confetti without the finish overlay', async ({ page }) => {
  await gotoPresentation(page);
  await crossWarningThreshold(page);

  const stateAfterWarning = await page.evaluate(() => ({
    confettiActive,
    confettiPersistent,
    warningShown: timer.warningShown,
    warningMinutes: CONFIG.timer.warningMinutes,
    warningDurationMs: CONFIG.timer.warningDurationMs,
  }));

  expect(stateAfterWarning).toEqual({
    confettiActive: true,
    confettiPersistent: false,
    warningShown: true,
    warningMinutes: 5,
    warningDurationMs: 5000,
  });
  await expect(page.locator('#finish-overlay')).toBeHidden();
  await expect(page.locator('#confetti-canvas')).toHaveCSS('pointer-events', 'none');

  await page.click('#btn-next');
  await waitIdle(page);
  expect(await page.evaluate(() => state.currentIndex)).toBe(1);
});

test('the five-minute warning stops after exactly five seconds', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await gotoPresentation(page);
  await page.clock.pauseAt(new Date('2026-01-01T12:00:00Z'));
  await crossWarningThreshold(page);

  await page.clock.runFor(4999);
  expect(await page.evaluate(() => confettiActive)).toBe(true);

  await page.clock.runFor(1);
  expect(await page.evaluate(() => confettiActive)).toBe(false);
  await expect(page.locator('#finish-overlay')).toBeHidden();
});

test('00:00 stops silently without confetti or the finish overlay', async ({ page }) => {
  await gotoPresentation(page);
  await page.evaluate(() => {
    timer.remainingMs = 100;
    timer.endAt = Date.now() - 1;
    timer.running = true;
    timer.intervalId = setInterval(() => {}, 1000);
    timerTick();
  });

  const finalState = await page.evaluate(() => ({
    display: timerDisplayEl.textContent,
    running: timer.running,
    intervalId: timer.intervalId,
    confettiActive,
    warningShown: timer.warningShown,
  }));
  expect(finalState).toEqual({
    display: '00:00',
    running: false,
    intervalId: null,
    confettiActive: false,
    warningShown: false,
  });
  await expect(page.locator('#finish-overlay')).toBeHidden();
});

test('+5 min above the threshold rearms the warning for the next passage', async ({ page }) => {
  await gotoPresentation(page);
  await crossWarningThreshold(page);
  await page.evaluate(() => {
    stopConfetti();
    timer.running = false;
    timer.remainingMs = TIMER_WARNING_MS - 60_000;
  });

  await page.click('#btn-timer-add5');
  expect(await page.evaluate(() => ({
    remainingMs: timer.remainingMs,
    warningShown: timer.warningShown,
  }))).toEqual({
    remainingMs: 9 * 60 * 1000,
    warningShown: false,
  });

  await crossWarningThreshold(page);
  expect(await page.evaluate(() => ({ confettiActive, warningShown: timer.warningShown }))).toEqual({
    confettiActive: true,
    warningShown: true,
  });
  await expect(page.locator('#finish-overlay')).toBeHidden();
});

test('manual finish via the toolbar button shows the finish overlay', async ({ page }) => {
  await gotoPresentation(page);
  await page.click('#btn-timer-finish');

  await expect(page.locator('#finish-overlay')).toBeVisible();
  expect(await page.evaluate(() => ({ confettiActive, confettiPersistent }))).toEqual({
    confettiActive: true,
    confettiPersistent: true,
  });
});

test('pressing Next on the last slide is a plain no-op, not a finish-overlay trigger', async ({ page }) => {
  await gotoPresentation(page);
  const lastIndex = await page.evaluate(() => SLIDES.length - 1);
  await page.evaluate((index) => {
    state.currentIndex = index;
    renderSlide();
  }, lastIndex);

  await page.evaluate(() => goNext());

  await expect(page.locator('#finish-overlay')).toBeHidden();
  expect(await page.evaluate(() => ({ confettiActive, confettiPersistent }))).toEqual({
    confettiActive: false,
    confettiPersistent: false,
  });
  expect(await page.evaluate(() => state.currentIndex)).toBe(lastIndex);
});

test('manual finish after a warning is not stopped by the old temporary timer', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await gotoPresentation(page);
  await page.clock.pauseAt(new Date('2026-01-01T12:00:00Z'));
  await crossWarningThreshold(page);

  await page.clock.runFor(1000);
  await page.click('#btn-timer-finish');
  await page.clock.runFor(5000);

  await expect(page.locator('#finish-overlay')).toBeVisible();
  expect(await page.evaluate(() => ({
    confettiActive,
    confettiPersistent,
    temporaryConfettiStopTimerId,
  }))).toEqual({
    confettiActive: true,
    confettiPersistent: true,
    temporaryConfettiStopTimerId: null,
  });
});
