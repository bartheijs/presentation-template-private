const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView } = require('./helpers');

// Slide with an image and slide without one, derived from SLIDES so the spec
// survives content changes.
async function findSlides(page) {
  return page.evaluate(() => ({
    withImage: SLIDES.findIndex((s) => s.image && (Array.isArray(s.image) ? s.image.length : s.image.src)),
    withoutImage: SLIDES.findIndex((s) => !s.image),
  }));
}

test.describe('fullscreen image modal (Presenter View)', () => {
  test('the button only shows on slides with an image and toggles the modal on the audience screen', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const { withImage, withoutImage } = await findSlides(page);
    const button = presenter.locator('#btn-toggle-image-modal');

    await presenter.evaluate((slide) => sendCommand('GO_TO_SLIDE', { slide }), withoutImage);
    await expect(presenter.locator('[data-current-slide]')).toHaveText(String(withoutImage + 1));
    await expect(button).toBeHidden();

    await presenter.evaluate((slide) => sendCommand('GO_TO_SLIDE', { slide }), withImage);
    await expect(presenter.locator('[data-current-slide]')).toHaveText(String(withImage + 1));
    await expect(button).toBeVisible();
    await expect(page.locator('#image-modal')).toBeHidden();

    await button.click();
    await expect(page.locator('#image-modal')).toBeVisible();
    await expect(page.locator('#image-modal-img')).toHaveAttribute('src', /.+/);
    await expect(button).toHaveText(/Verberg|Hide/);

    await button.click();
    await expect(page.locator('#image-modal')).toBeHidden();
    await expect(button).toHaveText(/Toon|Show/);
  });

  test('closes on Escape, on click, and when the slide changes', async ({ page }) => {
    await gotoPresentation(page);
    const presenter = await openPresenterView(page);
    const { withImage } = await findSlides(page);
    await presenter.evaluate((slide) => sendCommand('GO_TO_SLIDE', { slide }), withImage);
    const button = presenter.locator('#btn-toggle-image-modal');
    const modal = page.locator('#image-modal');

    await button.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(button).toHaveText(/Toon|Show/);

    await button.click();
    await expect(modal).toBeVisible();
    await modal.click();
    await expect(modal).toBeHidden();

    await button.click();
    await expect(modal).toBeVisible();
    await presenter.evaluate(() => sendCommand('NEXT_SLIDE'));
    await expect(modal).toBeHidden();
  });
});
