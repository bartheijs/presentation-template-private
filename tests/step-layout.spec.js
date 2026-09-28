const { test, expect } = require('@playwright/test');
const { gotoPresentation } = require('./helpers');

// layout: 'step' — a compact stepper bar (one dot per entry in `steps`,
// the current one highlighted) plus an auto-composed heading ("2 ·
// Ontwerp") and the slide's own bullets. Each slide is self-contained: it
// carries the whole `steps` list plus `currentStep`, the same way a quiz
// slide carries its own `items` rather than reading a global list.

test.describe('step layout', () => {
  test('the heading and bullets are left-aligned regardless of CONFIG.layout.align', async ({ page }) => {
    await gotoPresentation(page);
    const isCenteredByDefault = await page.evaluate(() => CONFIG.layout.align !== 'left');
    expect(isCenteredByDefault).toBe(true); // sanity: this deck's default really is centered, so the layout override is what's doing the work

    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);

    const alignItems = await page.locator('.slide-content--layout-step .slide-inner').evaluate((el) => getComputedStyle(el).alignItems);
    const textAlign = await page.locator('.slide-heading h1').evaluate((el) => getComputedStyle(el).textAlign);
    expect(alignItems).toBe('flex-start');
    expect(textAlign).toBe('left');
  });

  test('renders one dot per step and highlights only the current one', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    expect(stepIndex).toBeGreaterThan(-1);

    const { stepsLength, currentStep } = await page.evaluate((index) => ({
      stepsLength: SLIDES[index].steps.length,
      currentStep: SLIDES[index].currentStep,
    }), stepIndex);

    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);

    const dots = page.locator('.step-bar-item');
    await expect(dots).toHaveCount(stepsLength);
    await expect(page.locator('.step-bar-item.is-active')).toHaveCount(1);
    await expect(dots.nth(currentStep)).toHaveClass(/is-active/);
  });

  test('the active step shows no label, and its dot is larger than an inactive one', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);

    await expect(page.locator('.step-bar-item.is-active .step-bar-label')).toBeHidden();

    const [activeWidth, inactiveWidth] = await Promise.all([
      page.locator('.step-bar-item.is-active .step-bar-dot').evaluate((el) => el.getBoundingClientRect().width),
      page.locator('.step-bar-item:not(.is-active) .step-bar-dot').first().evaluate((el) => el.getBoundingClientRect().width),
    ]);
    expect(activeWidth).toBeGreaterThan(inactiveWidth * 1.3);
  });

  test('the active dot stays vertically centered on the connecting line, despite being larger', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);

    const centerY = (box) => box.y + box.height / 2;
    const [activeBox, inactiveBox] = await Promise.all([
      page.locator('.step-bar-item.is-active .step-bar-dot').boundingBox(),
      page.locator('.step-bar-item:not(.is-active) .step-bar-dot').first().boundingBox(),
    ]);
    expect(Math.abs(centerY(activeBox) - centerY(inactiveBox))).toBeLessThan(1);
  });

  test('the 3 dots use 3 different colors, active or not', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);

    const colors = await page.locator('.step-bar-dot').evaluateAll(
      (dots) => dots.map((d) => getComputedStyle(d).backgroundColor)
    );
    expect(colors.length).toBe(3);
    expect(new Set(colors).size).toBe(3);
  });

  test('with `accent` set, the heading text is colored to match that dot\'s own color, in every theme', async ({ page }) => {
    await gotoPresentation(page);
    const themes = await page.evaluate(() => THEMES);
    // accent: 0 maps to the same color a theme's own blanket heading-color
    // rule often already uses (var(--accent)) — a slide whose accent is
    // non-zero is the only one that actually distinguishes "the accent
    // system is wired up" from "it's coincidentally the theme default",
    // e.g. conclusion's own `.slide-heading h1 { color: var(--accent) }`
    // rule has higher specificity than a naive step-layout override and
    // would silently win for accent: 0 without this catching it.
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step' && s.accent > 0));
    expect(stepIndex).toBeGreaterThan(-1); // sanity: a demo slide actually sets a non-zero accent

    for (const theme of themes) {
      // eslint-disable-next-line no-loop-func
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      // eslint-disable-next-line no-loop-func
      await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);
      // eslint-disable-next-line no-loop-func
      const headingColor = await page.locator('.slide-heading h1').evaluate((el) => getComputedStyle(el).color);
      // eslint-disable-next-line no-loop-func
      const activeDotColor = await page.locator('.step-bar-item.is-active .step-bar-dot').evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(headingColor, `theme "${theme}"`).toBe(activeDotColor);
    }
  });

  test('with `accent` set, every bullet marker matches that same accent color, in every theme', async ({ page }) => {
    await gotoPresentation(page);
    const themes = await page.evaluate(() => THEMES);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step' && s.accent > 0));
    expect(stepIndex).toBeGreaterThan(-1);

    for (const theme of themes) {
      // eslint-disable-next-line no-loop-func
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      // eslint-disable-next-line no-loop-func
      await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);
      // eslint-disable-next-line no-loop-func
      const activeDotColor = await page.locator('.step-bar-item.is-active .step-bar-dot').evaluate((el) => getComputedStyle(el).backgroundColor);
      // A theme marks bullets either via a colored SVG .icon or a colored
      // li::before square — whichever is actually visible in this theme.
      // eslint-disable-next-line no-loop-func
      const markerColors = await page.locator('.slide-bullets li').evaluateAll((items) => items.map((li) => {
        const icon = li.querySelector('.icon');
        if (icon && getComputedStyle(icon).display !== 'none') return getComputedStyle(icon).color;
        return getComputedStyle(li, '::before').backgroundColor;
      }));
      expect(markerColors.length).toBeGreaterThan(0);
      for (const color of markerColors) {
        expect(color, `theme "${theme}"`).toBe(activeDotColor);
      }
    }
  });

  test('under bouwstenen, a slide with no `accent` field keeps its ordinary per-position bullet cycle (not forced uniform)', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'bouwstenen'));
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));

    const colors = await page.evaluate((index) => {
      const original = SLIDES[index];
      SLIDES[index] = { ...original, accent: undefined };
      state.currentIndex = index;
      renderSlide();
      const result = [...document.querySelectorAll('.slide-bullets li')].map(
        (li) => getComputedStyle(li, '::before').backgroundColor
      );
      SLIDES[index] = original;
      return result;
    }, stepIndex);

    expect(colors.length).toBe(2); // both demo bullets on this slide
    // bouwstenen's own per-position cycle gives bullet 1 and bullet 2
    // different colors (accent vs accent-2) — a regression that forces
    // them uniform even without `accent` set would collapse this to 1.
    expect(new Set(colors).size).toBe(2);
  });

  test('a slide with no `accent` field keeps its ordinary heading color', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    const bulletsIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'bullets'));

    const defaultBulletsColor = await page.evaluate((index) => {
      state.currentIndex = index;
      renderSlide();
      return getComputedStyle(document.querySelector('.slide-heading h1')).color;
    }, bulletsIndex);

    const headingColor = await page.evaluate((index) => {
      const original = SLIDES[index];
      SLIDES[index] = { ...original, accent: undefined };
      state.currentIndex = index;
      renderSlide();
      const color = getComputedStyle(document.querySelector('.slide-heading h1')).color;
      SLIDES[index] = original;
      return color;
    }, stepIndex);

    expect(headingColor).toBe(defaultBulletsColor);
  });

  test('with `accent` set under the conclusion theme, the left rail matches the same accent color', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));

    // accent: 0 maps to the same color as the plain default rail (--accent) —
    // pick a non-zero accent so the "differs from the plain rail" sanity
    // check below is actually meaningful.
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step' && s.accent > 0));
    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);
    const railColor = await page.evaluate(() => getComputedStyle(document.querySelector('.slide-content'), '::before').backgroundColor);
    const dotColor = await page.locator('.step-bar-item.is-active .step-bar-dot').evaluate((el) => getComputedStyle(el).backgroundColor);
    const plainRailColor = await page.evaluate(() => {
      const idx = SLIDES.findIndex((s) => s.layout === 'bullets');
      state.currentIndex = idx;
      renderSlide();
      return getComputedStyle(document.querySelector('.slide-content'), '::before').backgroundColor;
    });
    expect(railColor).toBe(dotColor);
    expect(railColor).not.toBe(plainRailColor); // sanity: an ordinary slide keeps the theme's plain rail color
  });

  test('`accent` also recolors the left rail on an ordinary (non-step) layout', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'conclusion'));

    const bulletsIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'bullets'));
    const [plainRailColor, accentedRailColor, expectedAccent2] = await page.evaluate((index) => {
      state.currentIndex = index;
      renderSlide();
      const plain = getComputedStyle(document.querySelector('.slide-content'), '::before').backgroundColor;

      const original = SLIDES[index];
      SLIDES[index] = { ...original, accent: 1 }; // an ordinary bullets slide, not a step slide
      renderSlide();
      const accented = getComputedStyle(document.querySelector('.slide-content'), '::before').backgroundColor;
      SLIDES[index] = original;

      const probe = document.createElement('div');
      probe.style.color = 'var(--accent-2)';
      document.body.appendChild(probe);
      const accent2 = getComputedStyle(probe).color;
      probe.remove();

      return [plain, accented, accent2];
    }, bulletsIndex);

    expect(accentedRailColor).not.toBe(plainRailColor);
    expect(accentedRailColor).toBe(expectedAccent2);
  });

  test('each step slide still has a non-empty TOC entry, since the auto-composed heading never reaches the TOC', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndices = await page.evaluate(() => SLIDES.reduce((acc, s, i) => {
      if (s.layout === 'step') acc.push(i);
      return acc;
    }, []));
    for (const index of stepIndices) {
      // eslint-disable-next-line no-loop-func
      const title = await page.evaluate((i) => document
        .querySelectorAll('.toc-item')[i]
        .querySelector('.toc-title').textContent, index);
      expect(title.trim()).not.toBe('');
    }
  });

  test('composes the heading from the 1-based step number and its label', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    const expectedHeading = await page.evaluate((index) => {
      const slide = SLIDES[index];
      return `${slide.currentStep + 1} · ${slide.steps[slide.currentStep].label}`;
    }, stepIndex);

    await page.evaluate((index) => { state.currentIndex = index; renderSlide(); }, stepIndex);

    await expect(page.locator('.slide-heading h1')).toHaveText(expectedHeading);
  });

  test('three step slides show the same step list with a different step highlighted each time', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndices = await page.evaluate(() => SLIDES.reduce((acc, s, i) => {
      if (s.layout === 'step') acc.push(i);
      return acc;
    }, []));
    expect(stepIndices.length).toBe(3);

    const currentSteps = [];
    for (const index of stepIndices) {
      // eslint-disable-next-line no-loop-func
      await page.evaluate((i) => { state.currentIndex = i; renderSlide(); }, index);
      const activeIndex = await page.locator('.step-bar-item').evaluateAll(
        (items) => items.findIndex((el) => el.classList.contains('is-active'))
      );
      currentSteps.push(activeIndex);
    }
    expect(new Set(currentSteps).size).toBe(3);
  });

  test('a step slide missing `steps`/`currentStep` degrades to no stepper bar instead of crashing', async ({ page }) => {
    await gotoPresentation(page);
    const stepIndex = await page.evaluate(() => SLIDES.findIndex((s) => s.layout === 'step'));
    const result = await page.evaluate((index) => {
      SLIDES[index] = { ...SLIDES[index], steps: undefined, currentStep: undefined };
      try {
        state.currentIndex = index;
        renderSlide();
        return { crashed: false };
      } catch (e) {
        return { crashed: true, message: e.message };
      }
    }, stepIndex);
    expect(result.crashed).toBe(false);
    await expect(page.locator('.step-bar-item')).toHaveCount(0);
  });

  test('every step slide renders under all three themes with no console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await gotoPresentation(page);
    const themes = await page.evaluate(() => THEMES);
    const stepIndices = await page.evaluate(() => SLIDES.reduce((acc, s, i) => {
      if (s.layout === 'step') acc.push(i);
      return acc;
    }, []));

    for (const theme of themes) {
      // eslint-disable-next-line no-loop-func
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      for (const index of stepIndices) {
        // eslint-disable-next-line no-loop-func
        await page.evaluate((i) => { state.currentIndex = i; renderSlide(); }, index);
      }
    }
    expect(errors).toEqual([]);
  });
});
