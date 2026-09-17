const { test, expect } = require('@playwright/test');
const { gotoPresentation } = require('./helpers');

// Covers: CONFIG.layout.align / per-slide align override, the 8/12-column
// .slide-inner wrapper staying centered regardless of alignment mode, the
// 900px responsive breakpoint, bullet subtext rendering, and the
// 'template-reference' layout's compact slides.

test.describe('content alignment', () => {
  test('demo slides never combine an icon with a centered title', async ({ page }) => {
    await gotoPresentation(page);
    const violations = await page.evaluate(() => SLIDES
      .filter((slide) => slide.icon && (slide.align || CONFIG.layout.align) !== 'left')
      .map((slide) => slide.id));
    expect(violations).toEqual([]);
  });

  test('icons stay aligned with the top of multi-line titles', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoPresentation(page);
    const result = await page.evaluate(() => {
      const slideIndex = SLIDES.findIndex((slide) => slide.icon);
      SLIDES[slideIndex].title = 'Een bewust lange titel die over meerdere regels wordt verdeeld';
      state.currentIndex = slideIndex;
      renderSlide();

      const heading = document.querySelector('.slide-heading');
      const icon = heading.querySelector('.icon');
      const title = heading.querySelector('h1');
      title.style.width = '18rem';
      const iconRect = icon.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return {
        alignSelf: getComputedStyle(icon).alignSelf,
        topDifference: Math.abs(iconRect.top - titleRect.top),
        titleIsMultiLine: titleRect.height > parseFloat(getComputedStyle(title).lineHeight) * 1.5,
      };
    });

    expect(result.alignSelf).toBe('flex-start');
    expect(result.topDifference).toBeLessThanOrEqual(1);
    expect(result.titleIsMultiLine).toBe(true);
  });

  test('CONFIG.layout.align = "center" applies no align-left modifier', async ({ page }) => {
    await gotoPresentation(page);
    // Forced explicitly rather than assumed from this deck's own
    // config.js — that value is content, not an engine default, and is
    // free to be 'left' here.
    await page.evaluate(() => { CONFIG.layout.align = 'center'; renderSlide(); });
    await expect(page.locator('#slide-content')).not.toHaveClass(/slide-content--align-left/);
    await expect(page.locator('.slide-inner')).toBeVisible();
  });

  test('CONFIG.layout.align = "left" applies the modifier and keeps the column centered', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoPresentation(page);

    const before = await page.evaluate(() => {
      const inner = document.querySelector('.slide-inner');
      const stage = document.getElementById('slide-content').getBoundingClientRect();
      const rect = inner.getBoundingClientRect();
      return { left: rect.left - stage.left, right: stage.right - rect.right };
    });

    await page.evaluate(() => { CONFIG.layout.align = 'left'; renderSlide(); });
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--align-left/);

    const after = await page.evaluate(() => {
      const inner = document.querySelector('.slide-inner');
      const stage = document.getElementById('slide-content').getBoundingClientRect();
      const rect = inner.getBoundingClientRect();
      return {
        left: rect.left - stage.left,
        right: stage.right - rect.right,
        headingJustify: getComputedStyle(document.querySelector('.slide-heading')).justifyContent,
      };
    });

    // The 8/12 column region itself must stay centered as a block —
    // alignment only changes what happens *inside* it.
    expect(Math.round(after.left)).toBe(Math.round(before.left));
    expect(Math.round(after.right)).toBe(Math.round(before.right));
    expect(after.headingJustify).toBe('flex-start');
  });

  test('a per-slide align override only affects that slide', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      // Baseline forced to 'center' explicitly, independent of this deck's
      // own config.js default, so the "other slide" check below is
      // actually isolating the per-slide override rather than coinciding
      // with whatever the ambient global default happens to be.
      CONFIG.layout.align = 'center';
      SLIDES[2].align = 'left';
      // The demo is free to give the comparison slide its own alignment.
      // Remove that content choice so this test isolates inheritance.
      delete SLIDES[3].align;
      state.currentIndex = 2;
      renderSlide();
    });
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--align-left/);

    await page.evaluate(() => {
      state.currentIndex = 3;
      renderSlide();
    });
    await expect(page.locator('#slide-content')).not.toHaveClass(/slide-content--align-left/);

    await page.evaluate(() => { delete SLIDES[2].align; });
  });
});

test.describe('8/12 column width', () => {
  test('relaxes to full width below the 900px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoPresentation(page);
    const wide = await page.evaluate(() => document.querySelector('.slide-inner').getBoundingClientRect().width);
    const stageWide = await page.evaluate(() => document.getElementById('slide-content').getBoundingClientRect().width);
    expect(wide).toBeLessThan(stageWide); // columns narrower than the card on a wide screen

    await page.setViewportSize({ width: 800, height: 900 });
    await page.waitForTimeout(50);
    const { narrow, stageContentBoxWidth } = await page.evaluate(() => {
      const stage = document.getElementById('slide-content');
      const stageStyle = getComputedStyle(stage);
      const stageRect = stage.getBoundingClientRect();
      const contentBoxWidth = stageRect.width - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight);
      return {
        narrow: document.querySelector('.slide-inner').getBoundingClientRect().width,
        stageContentBoxWidth: contentBoxWidth,
      };
    });
    // .slide-inner is `width: 100%` at this breakpoint, so it fills
    // #slide-content's content box (its own border-box minus its 3rem
    // horizontal padding) — not #slide-content's full border-box width.
    expect(Math.round(narrow)).toBe(Math.round(stageContentBoxWidth));
  });
});

test.describe('bullet subtext', () => {
  test('plain string bullets render without a subtext element', async ({ page }) => {
    await gotoPresentation(page);
    // Replaces slide 4 wholesale (layout included) rather than only patching
    // its `bullets` — this deck's own slide 4 may use any layout (e.g. a
    // deck-specific 'timeline'/'disco' extension that ignores `bullets`
    // entirely), so this stays a pure engine test independent of content.
    await page.evaluate(() => {
      SLIDES[4] = { id: 'test-4', layout: 'bullets', title: 'Test', bullets: ['Plain bullet, **bold** and `code`'] };
      state.currentIndex = 4;
      renderSlide();
    });
    const li = page.locator('.slide-bullets li').first();
    await expect(li.locator('.slide-bullet-subtext')).toHaveCount(0);
    await expect(li.locator('strong')).toHaveText('bold');
    await expect(li.locator('code')).toHaveText('code');
  });

  test('{ text, subtext } bullets render a smaller, muted line with markdown', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      SLIDES[4] = {
        id: 'test-4',
        layout: 'bullets',
        title: 'Test',
        bullets: [{ text: 'Main **bold** text', subtext: 'Muted `code` subtext' }],
      };
      state.currentIndex = 4;
      renderSlide();
    });
    const li = page.locator('.slide-bullets li').first();
    const sub = li.locator('.slide-bullet-subtext');
    await expect(sub).toBeVisible();
    await expect(sub.locator('code')).toHaveText('code');
    await expect(li.locator('.slide-bullet-stack > span').first().locator('strong')).toHaveText('bold');

    const sizes = await page.evaluate(() => {
      const l = document.querySelector('.slide-bullets li');
      const s = l.querySelector('.slide-bullet-subtext');
      return {
        main: parseFloat(getComputedStyle(l).fontSize),
        sub: parseFloat(getComputedStyle(s).fontSize),
      };
    });
    expect(sizes.sub).toBeLessThan(sizes.main);
  });
});

test.describe('malformed bullet entries', () => {
  test('null/undefined entries and an object without text render without crashing', async ({ page }) => {
    await gotoPresentation(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.evaluate(() => {
      SLIDES[4] = {
        id: 'test-4',
        layout: 'bullets',
        title: 'Test',
        bullets: [null, undefined, { subtext: 'orphan subtext, no text' }, 'A real bullet'],
      };
      state.currentIndex = 4;
      renderSlide();
    });

    expect(errors).toEqual([]);
    const items = page.locator('.slide-bullets li');
    await expect(items).toHaveCount(4);
    await expect(items.last()).toHaveText('A real bullet');
  });
});

test.describe('template-reference layout', () => {
  test('a template-reference slide renders compact with the inline reference block', async ({ page }) => {
    await gotoPresentation(page);
    // Injects a synthetic slide with the layout under test rather than
    // looking one up in this deck's own content — a real deck is free to
    // use (or drop) any given layout, so this stays a pure engine test.
    await page.evaluate(() => {
      SLIDES[4] = { id: 'test-4', layout: 'template-reference', title: 'Test', bullets: [] };
      state.currentIndex = 4;
      renderSlide();
    });
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--compact/);
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--layout-template-reference/);
    await expect(page.locator('.slide-template-code')).toBeVisible();
  });
});

test.describe('new layout renderers', () => {
  test('list-image renders bullets beside an image', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      SLIDES[4] = {
        id: 'test-4',
        layout: 'list-image',
        title: 'Test',
        bullets: ['One'],
        image: { src: 'assets/demo-photo.svg', alt: 'Test' },
      };
      state.currentIndex = 4;
      renderSlide();
    });
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--layout-list-image/);
    await expect(page.locator('.slide-row-with-image')).toBeVisible();
    await expect(page.locator('.slide-image-stack .slide-image')).toBeVisible();
  });

  test('quote renders the quote box, with attribution when set', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      SLIDES[4] = { id: 'test-4', layout: 'quote', title: 'Test', bullets: [], quote: 'A test quote', attribution: 'Tester' };
      state.currentIndex = 4;
      renderSlide();
    });
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--layout-quote/);
    await expect(page.locator('.slide-quote-box')).toBeVisible();
    await expect(page.locator('.slide-quote-text')).not.toBeEmpty();
  });

  test('image-only renders the heading and a dominant image, no bullets', async ({ page }) => {
    await gotoPresentation(page);
    await page.evaluate(() => {
      SLIDES[4] = {
        id: 'test-4',
        layout: 'image-only',
        title: 'Test',
        bullets: [],
        image: { src: 'assets/demo-photo.svg', alt: 'Test' },
      };
      state.currentIndex = 4;
      renderSlide();
    });
    await expect(page.locator('#slide-content')).toHaveClass(/slide-content--layout-image-only/);
    await expect(page.locator('.slide-inner--image-only .slide-image')).toBeVisible();
    await expect(page.locator('.slide-inner--image-only .slide-bullets')).toHaveCount(0);
  });

  test('an unknown layout value falls back to bullets instead of crashing', async ({ page }) => {
    await gotoPresentation(page);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.evaluate(() => {
      SLIDES[4] = { id: 'test-4', layout: 'nonexistent-layout', title: 'Test', bullets: ['A real bullet'] };
      state.currentIndex = 4;
      renderSlide();
    });
    expect(errors).toEqual([]);
    await expect(page.locator('.slide-bullets')).toBeVisible();
  });
});
