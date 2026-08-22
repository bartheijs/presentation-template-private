const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView, waitIdle } = require('./helpers');

test.describe('pause overlay engine feature', () => {
  test('showPauseOverlay/hidePauseOverlay toggle the overlay and do not change the current slide', async ({ page }) => {
    await gotoPresentation(page);
    // eslint-disable-next-line no-undef
    const before = await page.evaluate(() => state.currentIndex);

    await page.evaluate(() => showPauseOverlay());
    await expect(page.locator('#pause-overlay')).toBeVisible();

    // eslint-disable-next-line no-undef
    const during = await page.evaluate(() => state.currentIndex);
    expect(during).toBe(before);

    await page.evaluate(() => hidePauseOverlay());
    await expect(page.locator('#pause-overlay')).toBeHidden();
  });

  test('Escape closes the pause overlay when no other overlay is open', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => showPauseOverlay());
    await expect(page.locator('#pause-overlay')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-overlay')).toBeHidden();
  });

  test('Escape closes the template overlay first when both are open', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      showPauseOverlay();
      openTemplateOverlay();
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('#template-overlay')).toBeHidden();
    // Pause overlay is untouched by this first Escape — matches the
    // existing precedence (finish > template) the new branch is appended to.
    await expect(page.locator('#pause-overlay')).toBeVisible();
  });
});

test.describe('launch mechanism and connection status', () => {
  test('clicking the button opens presenter.html and shows connected', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    expect(presenter.url()).toMatch(/presenter\.html$/);
    await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
  });

  test('Shift+P also opens presenter.html', async ({ page }) => {
    await gotoPresentation(page);
    const popupPromise = page.waitForEvent('popup');
    await page.keyboard.press('Shift+P');
    const presenter = await popupPromise;
    await presenter.waitForLoadState();
    expect(presenter.url()).toMatch(/presenter\.html$/);
  });

  test('presenter.html opened directly, with no opener, shows disconnected', async ({ page }) => {
    const path = require('path');
    await page.goto('file://' + path.resolve(__dirname, '..', 'presenter.html'));
    await expect(page.locator('[data-connection-status]')).toHaveText('Niet verbonden');
    await expect(page.locator('[data-connection-hint]')).toContainText('Open deze pagina via de Presentatieweergave');
  });
});

test.describe('command whitelist and state broadcast', () => {
  test('NEXT_SLIDE/PREVIOUS_SLIDE/GO_TO_SLIDE move the real presentation and update the presenter', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');

    await presenter.click('#btn-presenter-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(1);
    // PREVIOUS_SLIDE below is itself an animated nav, so let the NEXT_SLIDE
    // animation above finish first — otherwise goTo()'s
    // `if (animate && isAnimatingSlide) return;` guard silently drops it
    // (see helpers.js's waitIdle for why this is needed between animated
    // navigations in tests).
    await waitIdle(page);

    await presenter.click('#btn-presenter-prev');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');

    await presenter.fill('#presenter-goto-input', '3');
    await presenter.click('#btn-presenter-goto');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('3');
  });

  test('overlay/aside/pause toggles from the presenter reflect back as confirmed state', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    await presenter.click('#btn-toggle-context-overlay');
    await expect(page.locator('#template-overlay')).toBeVisible();
    await expect(presenter.locator('[data-context-overlay]')).toHaveText('Aan');

    await presenter.click('#btn-toggle-left-aside');
    await expect(presenter.locator('[data-left-aside]')).toHaveText('Uit');

    await presenter.click('#btn-toggle-pause-overlay');
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await expect(presenter.locator('[data-pause-overlay]')).toHaveText('Aan');
  });

  test('a real button click in the Presentation View also updates the presenter', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await page.click('#btn-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
  });

  test('an unknown command is ignored without throwing', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.evaluate(() => {
      window.postMessage({ type: 'command', command: 'DELETE_EVERYTHING' }, '*');
    });
    await page.waitForTimeout(50);
    expect(errors).toEqual([]);
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });
});

test.describe('reconnect resilience', () => {
  test('reloading the Presenter View re-syncs via window.opener + REQUEST_STATE', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await page.click('#btn-next');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');

    await presenter.reload();
    await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
  });

  test('reloading the Presentation View lets it re-learn presenterRef from the next REQUEST_STATE', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    await page.reload();
    await presenter.evaluate(() => requestState());
    await presenter.click('#btn-presenter-next');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(1);
  });

  test('closing the Presenter View stops the Presentation View from erroring, and reopening starts a fresh handshake', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.close();
    await page.click('#btn-next'); // must not throw despite the stale presenterRef
    expect(errors).toEqual([]);

    const presenter2 = await openPresenterView(page);
    await expect(presenter2.locator('[data-connection-status]')).toHaveText('Verbonden');
    await expect(presenter2.locator('[data-current-slide]')).toHaveText('2');
  });
});

test.describe('skip-ahead and presenter-local back-to-jump-origin', () => {
  test('skipping twice then Volgende jumps directly, and Vorige returns to the jump origin', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0); // slide 1

    await presenter.click('#btn-presenter-skip'); // pending: 3
    await presenter.click('#btn-presenter-skip'); // pending: 4
    await expect(presenter.locator('[data-pending-next-slide]')).toHaveText('4');

    await presenter.click('#btn-presenter-next');
    // Wait for the presenter's own confirmed-state display before reading
    // the opener's state directly — the command travels via postMessage,
    // so a bare page.evaluate() right after click() can race the delivery.
    await expect(presenter.locator('[data-current-slide]')).toHaveText('4');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(3); // slide 4, direct jump
    await expect(presenter.locator('[data-pending-next-slide]')).toHaveText('5');

    await presenter.click('#btn-presenter-prev'); // presenter's own Vorige
    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0); // back to slide 1, not slide 3
  });

  test('Herstel resets the pending selection without touching the real presentation', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-skip');
    await presenter.click('#btn-presenter-herstel');
    await expect(presenter.locator('[data-pending-next-slide]')).toHaveText('2');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });

  test('Vorige with no pending jump uses ordinary PREVIOUS_SLIDE, unchanged', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    await presenter.click('#btn-presenter-next'); // slide 2, no skip involved — now an animated NEXT_SLIDE
    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
    // Volgende above now plays a real animated transition (finding 1's fix),
    // so wait for it to finish before the next animated nav — otherwise
    // goTo()'s `if (animate && isAnimatingSlide) return;` guard silently
    // drops PREVIOUS_SLIDE below (see helpers.js's waitIdle).
    await waitIdle(page);
    await presenter.click('#btn-presenter-prev');
    await expect(presenter.locator('[data-current-slide]')).toHaveText('1');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });

  test('Volgende with no skip pending sends NEXT_SLIDE and plays the real transition', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    // eslint-disable-next-line no-undef
    const wasAnimatingPromise = page.evaluate(
      () =>
        new Promise((resolve) => {
          // eslint-disable-next-line no-undef
          const check = setInterval(() => {
            // eslint-disable-next-line no-undef
            if (isAnimatingSlide) {
              clearInterval(check);
              resolve(true);
            }
          }, 5);
          setTimeout(() => {
            clearInterval(check);
            resolve(false);
          }, 2000);
        })
    );

    await presenter.click('#btn-presenter-next'); // ordinary one-step advance, no skip pending
    expect(await wasAnimatingPromise).toBe(true);

    await expect(presenter.locator('[data-current-slide]')).toHaveText('2');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(1);
  });
});

test.describe('preview iframes', () => {
  test('current-preview mirrors the real slide/overlay state; next-preview shows pendingNextSlide', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);

    const currentPreviewFrame = presenter.frameLocator('#current-preview');
    const nextPreviewFrame = presenter.frameLocator('#next-preview');

    await expect(currentPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('01');
    await expect(nextPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('02');

    await presenter.click('#btn-toggle-context-overlay');
    await expect(currentPreviewFrame.locator('#template-overlay')).toBeVisible();
    await expect(nextPreviewFrame.locator('#template-overlay')).toBeHidden();

    await presenter.click('#btn-presenter-skip');
    await expect(nextPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('03');
  });

  test('preview iframes do not navigate on their own keyboard/click input', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const currentPreviewFrame = presenter.frameLocator('#current-preview');
    await currentPreviewFrame.locator('body').click();
    await currentPreviewFrame.locator('body').press('ArrowRight');
    await expect(currentPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('01');
  });

  test('clicking a real button inside the current-preview iframe does not navigate the preview or the real presentation', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const currentPreviewFrame = presenter.frameLocator('#current-preview');

    // pointer-events: none on .preview-frame (presenter.css) means this click
    // never actually reaches the iframe's own #btn-next — { force: true }
    // bypasses Playwright's actionability check that would otherwise fail on
    // an unclickable element, so the assertions below are testing the real
    // browser behavior, not merely a Playwright click failure.
    await currentPreviewFrame.locator('#btn-next').click({ force: true });

    await expect(currentPreviewFrame.locator('.toc-item.is-active .toc-num')).toHaveText('01');
    // eslint-disable-next-line no-undef
    expect(await page.evaluate(() => state.currentIndex)).toBe(0);
  });
});
