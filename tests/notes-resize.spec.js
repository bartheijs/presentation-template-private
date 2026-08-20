const { test, expect } = require('@playwright/test');
const { gotoPresentation, waitIdle } = require('./helpers');

// Covers the fix for the flex-grow snap when speaker-notes presence differs
// between the outgoing and incoming slide (styles.css: .slide-content's
// `transition: flex-grow` + the stage-no-notes longhand override).

test('the transition property is declared on #slide-content', async ({ page }) => {
  await gotoPresentation(page);
  const transitionProperty = await page.evaluate(
    () => getComputedStyle(document.getElementById('slide-content')).transitionProperty
  );
  expect(transitionProperty).toContain('flex-grow');
});

test.describe('flex-grow interpolates instead of snapping', () => {
  async function setNotes(page, index, notes) {
    await page.evaluate(({ index, notes }) => { SLIDES[index].notes = notes; }, { index, notes });
  }

  test('with notes -> without notes', async ({ page }) => {
    await gotoPresentation(page);
    // This suite is about the notes-presence-driven flex-grow transition,
    // not the presenter-only hide/show override (see notes-toggle.spec.js)
    // — the session now starts with that override on, so switch it off here.
    await page.evaluate(() => { notesHiddenByUser = false; });
    await setNotes(page, 2, 'Has notes.');
    await setNotes(page, 3, ''); // no notes
    await page.evaluate(() => { state.currentIndex = 2; renderSlide(); });
    // Setup itself can trigger the new flex-grow transition (renderSlide()
    // is also used by non-animated jumps) — let it settle before sampling
    // the baseline, so we're only measuring the transition triggered by
    // the click below. The transition's own duration now tracks
    // --transition-out-ms (see styles.css), so this wait is config-driven
    // too rather than a fixed number.
    const outMs = await page.evaluate(() => ANIM_OUT_MS);
    await page.waitForTimeout(outMs + 100);

    const growBefore = await page.evaluate(
      () => getComputedStyle(document.getElementById('slide-content')).flexGrow
    );
    expect(growBefore).toBe('7');

    await page.click('#btn-next'); // 2 -> 3, notes disappear
    // Sample mid-way through the flex-grow transition: the swap happens
    // after ANIM_OUT_MS (config-driven, see CONFIG.transitions.outMs), the
    // flex-grow transition then runs on top of that for another ANIM_OUT_MS
    // (styles.css ties its duration to the same --transition-out-ms), so
    // ANIM_OUT_MS * 1.5 (half of its own duration) should land mid-flight
    // regardless of how the slide transition itself is configured.
    await page.waitForTimeout(outMs * 1.5);
    const growMid = parseFloat(
      await page.evaluate(() => getComputedStyle(document.getElementById('slide-content')).flexGrow)
    );
    await waitIdle(page);
    const growAfter = await page.evaluate(
      () => getComputedStyle(document.getElementById('slide-content')).flexGrow
    );

    expect(growAfter).toBe('1');
    // Mid-flight value should be strictly between the endpoints, not
    // already snapped to the final value (an instant jump would already
    // read 1 well before the transition's own duration has elapsed).
    expect(growMid).toBeGreaterThan(1);
    expect(growMid).toBeLessThan(7);
  });

  test('without notes -> with notes', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { notesHiddenByUser = false; });
    await setNotes(page, 2, ''); // no notes
    await setNotes(page, 3, 'Has notes.');
    await page.evaluate(() => { state.currentIndex = 2; renderSlide(); });
    // Setup itself can trigger the new flex-grow transition (renderSlide()
    // is also used by non-animated jumps) — let it settle before sampling
    // the baseline, so we're only measuring the transition triggered by
    // the click below.
    const outMs = await page.evaluate(() => ANIM_OUT_MS);
    await page.waitForTimeout(outMs + 100);

    const growBefore = await page.evaluate(
      () => getComputedStyle(document.getElementById('slide-content')).flexGrow
    );
    expect(growBefore).toBe('1');

    await page.click('#btn-next'); // 2 -> 3, notes appear
    // See the mirrored "with notes -> without notes" test above for why
    // this wait is ANIM_OUT_MS * 1.5 rather than a fixed number.
    await page.waitForTimeout(outMs * 1.5);
    const growMid = parseFloat(
      await page.evaluate(() => getComputedStyle(document.getElementById('slide-content')).flexGrow)
    );
    await waitIdle(page);
    const growAfter = await page.evaluate(
      () => getComputedStyle(document.getElementById('slide-content')).flexGrow
    );

    expect(growAfter).toBe('7');
    expect(growMid).toBeGreaterThan(1);
    expect(growMid).toBeLessThan(7);
  });

  test('with notes -> with notes: no resize at all (flex-grow constant)', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { notesHiddenByUser = false; });
    await setNotes(page, 2, 'Has notes.');
    await setNotes(page, 3, 'Also has notes.');
    await page.evaluate(() => { state.currentIndex = 2; renderSlide(); });
    // The setup itself just flipped notesHiddenByUser, which triggers its
    // own flex-grow reveal transition — let that settle before clicking,
    // so the sample below only reflects the (absent) resize from the click.
    const outMs = await page.evaluate(() => ANIM_OUT_MS);
    await page.waitForTimeout(outMs + 100);

    await page.click('#btn-next');
    await page.waitForTimeout(150);
    const growDuring = parseFloat(
      await page.evaluate(() => getComputedStyle(document.getElementById('slide-content')).flexGrow)
    );
    // toBeCloseTo, not toBe: sub-pixel float noise from the layout engine
    // can report e.g. 6.99256 instead of exactly 7 even with no real
    // resize happening — immaterial, not a behavior change.
    expect(growDuring).toBeCloseTo(7, 1);
    await waitIdle(page);
  });
});
