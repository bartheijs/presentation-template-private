const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView, waitIdle } = require('./helpers');

// The demo deck's quiz slide sits last (see slides-data.js) — derived from
// SLIDES.length rather than hardcoded, same convention as the other specs,
// so this file doesn't need updating if slides are added/removed elsewhere.
async function gotoQuizSlide(page, presenter) {
  const quizIndex = await page.evaluate(() => SLIDES.length - 1);
  await presenter.evaluate((slide) => sendCommand('GO_TO_SLIDE', { slide }), quizIndex);
  await expect(presenter.locator('[data-current-slide]')).toHaveText(String(quizIndex + 1));
  return quizIndex;
}

test.describe('quiz slide — audience roster', () => {
  test('items show their placeholder label until revealed, then the answer', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await gotoQuizSlide(page, presenter);

    const firstItem = page.locator('.quiz-roster-item').first();
    await expect(firstItem).toHaveText('1');
    await expect(firstItem).not.toHaveClass(/is-revealed/);

    await presenter.evaluate(() => sendCommand('QUIZ_REVEAL', { itemId: 'p1' }));
    await expect(firstItem).toHaveText('Hond');
    await expect(firstItem).toHaveClass(/is-revealed/);

    await presenter.evaluate(() => sendCommand('QUIZ_HIDE', { itemId: 'p1' }));
    await expect(firstItem).toHaveText('1');
    await expect(firstItem).not.toHaveClass(/is-revealed/);
  });

  test('more than 10 items is capped to 10 without throwing', async ({ page }) => {
    await gotoPresentation(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await page.evaluate(() => {
      const quiz = SLIDES[SLIDES.length - 1];
      quiz.items = Array.from({ length: 11 }, (_, i) => ({
        id: `x${i}`,
        label: String(i + 1),
        answer: `Antwoord ${i + 1}`,
        explanation: { layout: 'bullets', title: `Uitleg ${i + 1}`, bullets: ['...'] },
      }));
      goTo(SLIDES.length - 1, { animate: false });
    });

    await expect(page.locator('.quiz-roster-item')).toHaveCount(10);
    expect(errors).toEqual([]);
  });

  test('opening an item explanation shows an overlay without touching the roster underneath', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const quizIndex = await gotoQuizSlide(page, presenter);
    await presenter.evaluate(() => sendCommand('QUIZ_REVEAL', { itemId: 'p2' }));

    await presenter.evaluate(() => sendCommand('QUIZ_SHOW_EXPLANATION', { itemId: 'p1' }));
    await expect(page.locator('#quiz-explanation-overlay')).toBeVisible();
    await expect(page.locator('#quiz-explanation-body .slide-heading h1')).toHaveText('Hond');
    // The roster itself is never rebuilt while the overlay is open — same
    // DOM, same already-revealed item, the whole time.
    await expect(page.locator('.quiz-roster')).toBeVisible();
    await expect(page.locator('.quiz-roster-item').nth(1)).toHaveText('Kat');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(quizIndex);

    await presenter.evaluate(() => sendCommand('QUIZ_BACK_TO_LIST'));
    await expect(page.locator('#quiz-explanation-overlay')).toBeHidden();
    await expect(page.locator('.quiz-roster-item').nth(1)).toHaveText('Kat'); // still revealed
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(quizIndex);
  });

  test('Escape closes the quiz explanation overlay', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await gotoQuizSlide(page, presenter);
    await presenter.evaluate(() => sendCommand('QUIZ_SHOW_EXPLANATION', { itemId: 'p1' }));
    await expect(page.locator('#quiz-explanation-overlay')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#quiz-explanation-overlay')).toBeHidden();
  });

  test('navigating away auto-closes the explanation overlay instead of leaving it floating over the next slide', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const quizIndex = await gotoQuizSlide(page, presenter);
    await presenter.evaluate(() => sendCommand('QUIZ_SHOW_EXPLANATION', { itemId: 'p1' }));
    await expect(page.locator('#quiz-explanation-overlay')).toBeVisible();

    await presenter.click('#btn-presenter-prev');
    // Wait for the presenter's own confirmed-state display before polling
    // isAnimatingSlide below — otherwise waitIdle can observe it still
    // false from *before* the command was even delivered and return
    // immediately (same race the existing presenter-view specs avoid the
    // same way).
    await expect(presenter.locator('[data-current-slide]')).toHaveText(String(quizIndex));
    await waitIdle(page);
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(quizIndex - 1);
    await expect(page.locator('#quiz-explanation-overlay')).toBeHidden();
  });
});

test.describe('quiz slide — Presenter View cockpit', () => {
  test('the cockpit replaces the next-slide preview only while the quiz slide is current', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const quizIndex = await page.evaluate(() => SLIDES.length - 1);

    // One slide before the quiz slide: it's the *next* slide, not current —
    // the cockpit must stay hidden and the ordinary preview iframe visible.
    await presenter.evaluate((slide) => sendCommand('GO_TO_SLIDE', { slide }), quizIndex - 1);
    await expect(presenter.locator('#quiz-cockpit')).toBeHidden();
    await expect(presenter.locator('#next-preview-viewport')).toBeVisible();

    await presenter.click('#btn-presenter-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText(String(quizIndex + 1));
    await expect(presenter.locator('#quiz-cockpit')).toBeVisible();
    await expect(presenter.locator('#next-preview-viewport')).toBeHidden();
  });

  test('cockpit buttons drive reveal/hide through the real command channel', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await gotoQuizSlide(page, presenter);

    await presenter.click('[data-quiz-action="reveal"][data-quiz-item="p1"]');
    await expect(page.locator('.quiz-roster-item').first()).toHaveClass(/is-revealed/);
    await expect(presenter.locator('.quiz-cockpit-item[data-status="shown"]')).toHaveCount(1);

    await presenter.click('[data-quiz-action="hide"][data-quiz-item="p1"]');
    await expect(page.locator('.quiz-roster-item').first()).not.toHaveClass(/is-revealed/);
    await expect(presenter.locator('.quiz-cockpit-item[data-status="shown"]')).toHaveCount(0);
  });

  test('the Uitleg button is a per-item toggle: click again on the same button to close it', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await gotoQuizSlide(page, presenter);
    const explainBtn = presenter.locator('[data-quiz-item="p1"][data-quiz-action="explain"], [data-quiz-item="p1"][data-quiz-action="close-explain"]');

    await explainBtn.click(); // opens
    await expect(page.locator('#quiz-explanation-overlay')).toBeVisible();
    await expect(explainBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(explainBtn).toHaveAttribute('data-quiz-action', 'close-explain');
    // the item list itself never disappears, unlike the old "replace with
    // a single back button" design
    await expect(presenter.locator('.quiz-cockpit-item')).toHaveCount(5);

    await explainBtn.click(); // same button, now closes it
    await expect(page.locator('#quiz-explanation-overlay')).toBeHidden();
    await expect(explainBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(explainBtn).toHaveAttribute('data-quiz-action', 'explain');
  });

  test('opening a second item\'s explanation switches directly without an intermediate close', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await gotoQuizSlide(page, presenter);

    await presenter.click('[data-quiz-action="explain"][data-quiz-item="p1"]');
    await expect(page.locator('#quiz-explanation-body .slide-heading h1')).toHaveText('Hond');

    await presenter.click('[data-quiz-action="explain"][data-quiz-item="p2"]');
    await expect(page.locator('#quiz-explanation-overlay')).toBeVisible();
    await expect(page.locator('#quiz-explanation-body .slide-heading h1')).toHaveText('Kat');
    await expect(presenter.locator('[data-quiz-item="p1"][data-quiz-action="explain"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(presenter.locator('[data-quiz-item="p2"][data-quiz-action="close-explain"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('quiz commands sent while another slide is current are ignored without throwing', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');
    await presenter.evaluate(() => sendCommand('QUIZ_REVEAL', { itemId: 'p1' }));
    await page.waitForTimeout(50);
    expect(errors).toEqual([]);
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });
});

test.describe('quiz slide — preview iframe mirroring', () => {
  test('the current-preview iframe mirrors reveal/explanation state exactly', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await gotoQuizSlide(page, presenter);
    const currentPreviewFrame = presenter.frameLocator('#current-preview');

    await presenter.evaluate(() => sendCommand('QUIZ_REVEAL', { itemId: 'p3' }));
    await expect(currentPreviewFrame.locator('.quiz-roster-item').nth(2)).toHaveClass(/is-revealed/);
    await expect(currentPreviewFrame.locator('.quiz-roster-item').nth(2)).toHaveText('Vis');

    await presenter.evaluate(() => sendCommand('QUIZ_SHOW_EXPLANATION', { itemId: 'p3' }));
    await expect(currentPreviewFrame.locator('#quiz-explanation-overlay')).toBeVisible();
    await expect(currentPreviewFrame.locator('#quiz-explanation-body .slide-heading h1')).toHaveText('Vis');

    await presenter.evaluate(() => sendCommand('QUIZ_BACK_TO_LIST'));
    await expect(currentPreviewFrame.locator('#quiz-explanation-overlay')).toBeHidden();
  });
});
