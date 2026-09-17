const { test, expect } = require('@playwright/test');
const { gotoPresentation, waitIdle } = require('./helpers');

// Covers: global/per-slide disco enable, auto vs pause transition mode,
// and the pendingPause state machine's cancel/resume/guard behavior in
// app.js's goTo()/beginPausedTransition()/resumePausedTransition()/
// cancelPendingPause()/resetAnimationState().

test.describe('disco enable/disable', () => {
  test('auto mode: disco flashes during a normal transition', async ({ page }) => {
    await gotoPresentation(page);
    // Force disco on regardless of this deck's own CONFIG.disco.enabled
    // default — this test is about the 'auto mode' behavior when disco is
    // on, not about what this particular presentation ships with.
    await page.evaluate(() => { CONFIG.disco.enabled = true; });
    await page.click('#btn-next');
    await page.waitForTimeout(150); // past DISCO_REVEAL_DELAY_MS (90ms), mid-animation
    await expect(page.locator('#slide-stage')).toHaveClass(/is-transitioning/);
    await waitIdle(page);
    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);
  });

  test('disco is a forward-only device: no flash when navigating back to a disco-enabled slide', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { CONFIG.disco.enabled = true; });

    // Forward onto index1 flashes disco, as the test above already covers.
    await page.click('#btn-next');
    await waitIdle(page);

    // Move one further forward so there's somewhere to come back from.
    await page.click('#btn-next');
    await waitIdle(page);

    // Regression: animateTransition() used to recompute discoOn from the
    // now-current destination slide regardless of direction, so revisiting
    // a disco-enabled slide by going back replayed the flash — disco is
    // meant to be a forward-presenting device only.
    await page.click('#btn-prev'); // back onto index1, the same disco slide
    await page.waitForTimeout(150); // past DISCO_REVEAL_DELAY_MS, mid-animation
    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);
    await waitIdle(page);
  });

  test('global disco.enabled = false suppresses the flash', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => { CONFIG.disco.enabled = false; });
    await page.click('#btn-next');
    await page.waitForTimeout(150);
    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);
    await waitIdle(page);
  });

  test('per-slide disco:false overrides global enabled:true', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      SLIDES[1].disco = false;
      state.currentIndex = 0;
      renderSlide();
    });
    await page.click('#btn-next'); // lands on index1
    await page.waitForTimeout(150);
    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);
    await waitIdle(page);
    await page.evaluate(() => { delete SLIDES[1].disco; });
  });

  test('per-slide disco:true overrides global enabled:false', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      CONFIG.disco.enabled = false;
      SLIDES[1].disco = true;
      state.currentIndex = 0;
      renderSlide();
    });
    await page.click('#btn-next');
    await page.waitForTimeout(150);
    await expect(page.locator('#slide-stage')).toHaveClass(/is-transitioning/);
    await waitIdle(page);
    await page.evaluate(() => { delete SLIDES[1].disco; });
  });

  test('per-slide discoTitleLines overrides the global disco text for that transition only', async ({ page }) => {
    await gotoPresentation(page);
    const defaultHtml = await page.evaluate(() => document.getElementById('disco-title').innerHTML);

    await page.evaluate(() => {
      // Force disco on regardless of the ambient CONFIG.disco.enabled
      // default, so this test doesn't depend on that value.
      CONFIG.disco.enabled = true;
      SLIDES[1].discoTitleLines = ['CUSTOM', 'TEXT'];
      state.currentIndex = 0;
      renderSlide();
    });
    await page.click('#btn-next'); // lands on index1, its own discoTitleLines should apply
    await waitIdle(page);
    await expect(page.locator('#disco-title')).toHaveText('CUSTOMTEXT');

    await page.evaluate(() => { delete SLIDES[1].discoTitleLines; });
    await page.click('#btn-next'); // lands on index2, no override -> falls back to CONFIG default
    await waitIdle(page);
    const restoredHtml = await page.evaluate(() => document.getElementById('disco-title').innerHTML);
    expect(restoredHtml).toBe(defaultHtml);
  });

  test('per-slide discoHoldMs keeps an auto transition visible longer', async ({ page }) => {
    await gotoPresentation(page);
    const { outgoingTitle, targetTitle } = await page.evaluate(() => {
      CONFIG.disco.enabled = false;
      SLIDES[1].disco = true;
      SLIDES[1].discoMode = 'auto';
      SLIDES[1].discoHoldMs = 700;
      state.currentIndex = 0;
      renderSlide();
      return { outgoingTitle: SLIDES[0].title, targetTitle: SLIDES[1].title };
    });

    await page.click('#btn-next');
    await page.waitForTimeout(500); // out animation is done; hold is active

    await expect(page.locator('#slide-stage')).toHaveClass(/is-transitioning/);
    await expect(page.locator('.slide-heading h1')).toHaveText(outgoingTitle);

    await waitIdle(page);
    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);
    await expect(page.locator('.slide-heading h1')).toHaveText(targetTitle);
  });
});

test.describe('pause-mode transition', () => {
  async function setupPauseOnSlide3(page) {
    await gotoPresentation(page);
    await page.evaluate(() => {
      // disco:true set explicitly (not relying on CONFIG.disco.enabled)
      // so this pause mechanic is exercised regardless of this deck's own
      // global default — otherwise pauseOn silently evaluates to false
      // and every test below would "pass" without ever engaging pause.
      SLIDES[3].disco = true;
      SLIDES[3].discoMode = 'pause';
      state.currentIndex = 2;
      renderSlide();
      updateTocActiveState();
    });
  }

  test('freezes fully visible and resumes on a matching second click', async ({ page }) => {
    await setupPauseOnSlide3(page);
    // Derived from SLIDES rather than hardcoded, so this test doesn't need
    // updating every time a slide is added/removed from this deck.
    const total = await page.evaluate(() => SLIDES.length);

    await page.click('#btn-next'); // 2 -> 3, should freeze
    await page.waitForTimeout(500);

    await expect(page.locator('#slide-stage')).toHaveClass(/is-transitioning/);
    await expect(page.locator('#slide-content')).toHaveClass(/content-anim-out/);
    await expect(page.locator('#slide-progress')).toHaveText(`3,5 / ${total}`);
    await expect(page.locator('.toc-item.is-active')).toHaveAttribute('data-index', '2');
    const currentIndexWhileFrozen = await page.evaluate(() => state.currentIndex);
    expect(currentIndexWhileFrozen).toBe(2);

    await page.click('#btn-next'); // resume
    await waitIdle(page);

    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);
    await expect(page.locator('#slide-progress')).toHaveText(`4 / ${total}`);
    await expect(page.locator('.toc-item.is-active')).toHaveAttribute('data-index', '3');
    const finalIndex = await page.evaluate(() => state.currentIndex);
    expect(finalIndex).toBe(3);
  });

  test('going back skips pause mode and lands in one click', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      SLIDES[3].disco = true;
      SLIDES[3].discoMode = 'pause';
      state.currentIndex = 4;
      renderSlide();
      updateTocActiveState();
    });

    await page.click('#btn-prev'); // 4 -> 3: pause destination, but backwards
    await waitIdle(page);

    const result = await page.evaluate(() => ({
      currentIndex: state.currentIndex,
      pendingPause,
      isTransitioning: document.getElementById('slide-stage').classList.contains('is-transitioning'),
    }));
    expect(result.currentIndex).toBe(3);
    expect(result.pendingPause).toBeNull();
    expect(result.isTransitioning).toBe(false);
  });

  test('cancels cleanly when the opposite direction is pressed', async ({ page }) => {
    await setupPauseOnSlide3(page);
    await page.click('#btn-next');
    await page.waitForTimeout(500);

    await page.click('#btn-prev'); // cancels pause, then normal transition 2 -> 1
    await waitIdle(page);

    const state1 = await page.evaluate(() => ({
      currentIndex: state.currentIndex,
      pendingPause,
      stageClasses: document.getElementById('slide-stage').className,
    }));
    expect(state1.currentIndex).toBe(1);
    expect(state1.pendingPause).toBeNull();
    expect(state1.stageClasses).not.toMatch(/is-transitioning/);
  });

  test('cancels cleanly on a distant TOC click', async ({ page }) => {
    await setupPauseOnSlide3(page);
    await page.click('#btn-next');
    await page.waitForTimeout(500);

    await page.click('.toc-item[data-index="10"]');
    await page.waitForTimeout(100);

    const result = await page.evaluate(() => ({
      currentIndex: state.currentIndex,
      pendingPause,
    }));
    expect(result.currentIndex).toBe(10);
    expect(result.pendingPause).toBeNull();
  });

  test('cancels cleanly on a TOC click for the still-current outgoing row', async ({ page }) => {
    await setupPauseOnSlide3(page);
    await page.click('#btn-next');
    await page.waitForTimeout(500);

    await page.click('.toc-item[data-index="2"]');
    await page.waitForTimeout(100);

    const result = await page.evaluate(() => ({
      currentIndex: state.currentIndex,
      pendingPause,
      isTransitioning: document.getElementById('slide-stage').classList.contains('is-transitioning'),
    }));
    expect(result.currentIndex).toBe(2);
    expect(result.pendingPause).toBeNull();
    expect(result.isTransitioning).toBe(false);
  });

  test('rapid double-click on resume does not double-advance', async ({ page }) => {
    await setupPauseOnSlide3(page);
    await page.click('#btn-next');
    await page.waitForTimeout(500);

    await page.click('#btn-next'); // starts resume
    await page.click('#btn-next'); // should be ignored (isAnimatingSlide guard)
    await waitIdle(page);

    const finalIndex = await page.evaluate(() => state.currentIndex);
    expect(finalIndex).toBe(3);
  });
});

test.describe('interrupted transitions (resetAnimationState)', () => {
  test('a TOC click mid-animation does not leak the reveal timer or animationend listener', async ({ page }) => {
    await gotoPresentation(page);
    // Picked dynamically rather than hardcoded: this test is about
    // interrupted-transition cleanup, not disco/template-anchor behavior,
    // so it needs a target slide (and the one right after it) that are
    // both plain — otherwise a disco-pause landing would need a second
    // click to complete and the deck's content is free to move disco
    // slides around.
    const targetIndex = await page.evaluate(() => {
      for (let i = 0; i < SLIDES.length - 1; i++) {
        const plain = (s) => !isDiscoEnabledFor(s) && s.layout !== 'template-reference';
        if (plain(SLIDES[i]) && plain(SLIDES[i + 1])) return i;
      }
      return -1;
    });
    expect(targetIndex).toBeGreaterThanOrEqual(0);

    await page.click('#btn-next'); // starts an animated "out" phase (280ms out, disco reveal at 90ms)
    await page.click(`.toc-item[data-index="${targetIndex}"]`); // interrupts immediately, before onOut ever fires
    await waitIdle(page);

    const jumped = await page.evaluate(() => state.currentIndex);
    expect(jumped).toBe(targetIndex);

    // The interrupted transition's reveal timer would otherwise fire ~90ms
    // after the original click and re-add 'is-transitioning' to this
    // unrelated slide; resetAnimationState() must have cleared it.
    await page.waitForTimeout(200);
    await expect(page.locator('#slide-stage')).not.toHaveClass(/is-transitioning/);

    // A leaked {once:true} animationend listener from the interrupted
    // transition would stay attached to slideContentEl; confirm a fresh
    // transition still completes normally afterward instead of misbehaving.
    await page.click('#btn-next');
    await waitIdle(page);
    const afterIndex = await page.evaluate(() => state.currentIndex);
    expect(afterIndex).toBe(targetIndex + 1);
  });
});

test.describe('non-pause navigation is unaffected (regression)', () => {
  test('a plain auto-mode transition completes in a single click', async ({ page }) => {
    await gotoPresentation(page);
    await page.click('#btn-next');
    await waitIdle(page);
    const index = await page.evaluate(() => state.currentIndex);
    expect(index).toBe(1);
  });
});
