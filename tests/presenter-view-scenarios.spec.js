// One test per scenario in
// docs/superpowers/specs/2026-08-22-presenter-view-design.md §3, in the
// same order, so a failing scenario number here points straight at the
// spec section describing the required behavior. Each test below is a
// thin re-assertion using cases already implemented (and unit-tested in
// detail) in presenter-view.spec.js/presenter-view-timing.spec.js —
// this file exists for traceability against the spec, not new coverage.
const { test, expect } = require('@playwright/test');
const { gotoPresentation, openPresenterView } = require('./helpers');

test('scenario 1: Presenter View opened normally from the Presentation View works immediately', async ({ page }) => {
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
});

test('scenario 2: Presenter View reload re-syncs via window.opener + REQUEST_STATE', async ({ page }) => {
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await presenter.reload();
  await expect(presenter.locator('[data-connection-status]')).toHaveText('Verbonden');
});

test('scenario 3: closing the Presenter View causes no errors in the Presentation View', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await presenter.close();
  await page.click('#btn-next');
  expect(errors).toEqual([]);
});

test('scenario 4: reopening the Presenter View starts a fresh handshake', async ({ page }) => {
  await gotoPresentation(page);
  const first = await openPresenterView(page);
  await first.close();
  const second = await openPresenterView(page);
  await expect(second.locator('[data-connection-status]')).toHaveText('Verbonden');
});

test('scenario 5: Presentation View reload lets it re-learn presenterRef', async ({ page }) => {
  await gotoPresentation(page);
  const presenter = await openPresenterView(page);
  await page.reload();
  await presenter.evaluate(() => requestState());
  await presenter.click('#btn-presenter-next');
  // eslint-disable-next-line no-undef
  expect(await page.evaluate(() => state.currentIndex)).toBe(1);
});

test('scenario 6: Presenter View opened directly (no opener) shows disconnected, no crash', async ({ page }) => {
  const path = require('path');
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto('file://' + path.resolve(__dirname, '..', 'presenter.html'));
  await expect(page.locator('[data-connection-status]')).toHaveText('Niet verbonden');
  expect(errors).toEqual([]);
});
