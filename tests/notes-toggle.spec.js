const { test, expect } = require('@playwright/test');
const { gotoPresentation, waitIdle } = require('./helpers');

// Covers the presenter-only notesHiddenByUser toggle (app.js:
// toggleNotesVisibility()/shouldShowNotes()) — a session-level override
// independent of any single slide's own notes content.

test.describe('notes visibility toggle', () => {
  test('starts hidden with the "show" label', async ({ page }) => {
    await gotoPresentation(page);
    await expect(page.locator('#notes-toggle-label')).toHaveText('Notities tonen');
    // Slide 1 (index 0) is a divider slide with no notes of its own, so
    // check on a slide that actually has notes to exercise the toggle's
    // real effect, not just whatever the first slide happens to contain.
    await page.evaluate(() => { SLIDES[1].notes = 'Has notes.'; state.currentIndex = 1; renderSlide(); });
    await expect(page.locator('#slide-notes')).toBeHidden();
  });

  test('hides the notes panel, flips the label, and resizes the content pane smoothly', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { SLIDES[2].notes = 'Has notes.'; state.currentIndex = 2; renderSlide(); });
    await page.click('#btn-toggle-notes'); // reveal first — the session starts with notes hidden
    const outMs = await page.evaluate(() => ANIM_OUT_MS);
    await page.waitForTimeout(outMs + 100); // settle the reveal transition itself

    const before = await page.evaluate(
      () => getComputedStyle(document.getElementById('slide-content')).flexGrow
    );
    expect(before).toBe('7');

    await page.click('#btn-toggle-notes');
    await expect(page.locator('#notes-toggle-label')).toHaveText('Notities tonen');
    await expect(page.locator('#slide-notes')).toBeHidden();

    await page.waitForTimeout(140);
    const mid = parseFloat(
      await page.evaluate(() => getComputedStyle(document.getElementById('slide-content')).flexGrow)
    );
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(7);

    await page.waitForTimeout(300);
    const after = await page.evaluate(
      () => getComputedStyle(document.getElementById('slide-content')).flexGrow
    );
    expect(after).toBe('1');
  });

  test('the heading does not shift position when notes are toggled', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { SLIDES[2].notes = 'Has notes.'; state.currentIndex = 2; renderSlide(); });
    await page.waitForTimeout(400);

    const before = await page.evaluate(() => document.querySelector('.slide-heading').getBoundingClientRect().top);
    await page.click('#btn-toggle-notes');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => document.querySelector('.slide-heading').getBoundingClientRect().top);

    expect(after).toBe(before);
  });

  test('persists across slide navigation', async ({ page }) => {
    await gotoPresentation(page);
    // Session starts with notes hidden — confirm the override survives a
    // slide change rather than resetting per-slide.
    await expect(page.locator('#slide-notes')).toBeHidden();

    await page.click('#btn-next');
    await waitIdle(page);

    await expect(page.locator('#slide-notes')).toBeHidden();
    await expect(page.locator('#notes-toggle-label')).toHaveText('Notities tonen');
  });

  test('toggling back on restores the notes panel', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { SLIDES[2].notes = 'Has notes.'; state.currentIndex = 2; renderSlide(); });
    await page.waitForTimeout(400);

    await page.click('#btn-toggle-notes'); // reveal — session starts hidden
    await expect(page.locator('#slide-notes')).toBeVisible();
    await expect(page.locator('#notes-toggle-label')).toHaveText('Notities verbergen');
    await page.click('#btn-toggle-notes');
    await expect(page.locator('#slide-notes')).toBeHidden();
    await expect(page.locator('#notes-toggle-label')).toHaveText('Notities tonen');
  });

  test('is ignored while a slide transition is in flight', async ({ page }) => {
    await gotoPresentation(page);
    await page.click('#btn-next'); // starts an animated transition
    const result = await page.evaluate(() => {
      const before = notesHiddenByUser;
      toggleNotesVisibility();
      return { before, after: notesHiddenByUser, wasAnimating: isAnimatingSlide };
    });
    expect(result.wasAnimating).toBe(true);
    expect(result.after).toBe(result.before); // toggle had no effect
    await waitIdle(page);
  });
});
