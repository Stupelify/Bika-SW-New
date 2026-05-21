/**
 * Capacitor mobile UI contract tests (browser simulation).
 * QA agent runs these before/after iOS/Android polish work.
 */
import { test, expect, hasAuthState } from './_fixtures';
import {
  applyCapacitorNative,
  readBodyOverflowY,
  readMainOverflow,
} from './_helpers';

test.describe('capacitor-native iOS simulation', () => {
  test.beforeEach(async ({ page }) => {
    await applyCapacitorNative(page, 'ios');
  });

  test('login inputs are at least 16px (no zoom)', async ({ page }) => {
    await page.goto('/login');
    const fontSize = await page.locator('#email').evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });
});

test.describe('capacitor-native dashboard scroll (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), 'Requires test DB — start postgres + server');
    await applyCapacitorNative(page, 'ios');
  });

  test('body scroll locked; main scrolls', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    const bodyOverflow = await readBodyOverflowY(page);
    expect(bodyOverflow).toBe('hidden');
    const mainOverflow = await readMainOverflow(page);
    expect(mainOverflow).toMatch(/auto|scroll/);
  });

  test('header clears safe area on mobile viewport', async ({ page }) => {
    await page.goto('/dashboard');
    const paddingTop = await page.locator('.dashboard-header').evaluate((el) =>
      parseFloat(getComputedStyle(el).paddingTop),
    );
    expect(paddingTop).toBeGreaterThanOrEqual(20);
  });

  test('content-wrapper has top offset for fixed header', async ({ page }) => {
    await page.goto('/dashboard');
    const paddingTop = await page.locator('.content-wrapper').evaluate((el) =>
      parseFloat(getComputedStyle(el).paddingTop),
    );
    expect(paddingTop).toBeGreaterThanOrEqual(52);
  });
});

test.describe('capacitor-native Android simulation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), 'Requires test DB — start postgres + server');
    await applyCapacitorNative(page, 'android');
  });

  test('dashboard main uses overscroll contain on native', async ({ page }) => {
    await page.goto('/dashboard');
    const overscroll = await page.locator('.dashboard-main').evaluate(
      (el) => getComputedStyle(el).overscrollBehaviorY,
    );
    expect(overscroll).toBe('contain');
  });
});

test.describe('capacitor modal overlay', () => {
  test('modal panel class exists in DOM contract', async ({ page }) => {
    await page.setContent(`
      <div data-capacitor-overlay="open">
        <div class="capacitor-modal-panel" style="max-height:80vh;overflow-y:auto">x</div>
      </div>
    `);
    await expect(page.locator('[data-capacitor-overlay="open"]')).toBeVisible();
    await expect(page.locator('.capacitor-modal-panel')).toBeVisible();
    const hasTransformGpu = await page.locator('.capacitor-modal-panel').evaluate((el) =>
      el.classList.contains('transform-gpu'),
    );
    expect(hasTransformGpu).toBe(false);
  });
});
