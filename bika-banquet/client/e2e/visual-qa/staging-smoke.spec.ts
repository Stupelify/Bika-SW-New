import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const hasAuth = fs.existsSync(path.join(__dirname, '..', '.auth', 'admin.json'));

const KEY_PAGES = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/dashboard/bookings', name: 'bookings' },
  { path: '/dashboard/customers', name: 'customers' },
  { path: '/dashboard/calendar', name: 'calendar' },
] as const;

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(1);
}

test.describe('Staging visual QA — desktop', () => {
  test.beforeEach(() => {
    test.skip(!hasAuth, 'Requires seeded test DB and admin auth (globalSetup)');
  });

  test.use({ viewport: { width: 1280, height: 800 } });

  for (const { path: pagePath, name } of KEY_PAGES) {
    test(`${name} renders without horizontal overflow`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 60_000 });
      await assertNoHorizontalOverflow(page);
      await expect(page.locator('body')).toBeVisible();
      await page.screenshot({
        path: path.join('test-results', 'visual-qa', `desktop-${name}.png`),
        fullPage: true,
      });
    });
  }
});

test.describe('Staging visual QA — mobile', () => {
  test.beforeEach(() => {
    test.skip(!hasAuth, 'Requires seeded test DB and admin auth (globalSetup)');
  });

  test.use({ viewport: { width: 390, height: 844 } });

  for (const { path: pagePath, name } of KEY_PAGES) {
    test(`${name} renders without horizontal overflow`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 60_000 });
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: path.join('test-results', 'visual-qa', `mobile-${name}.png`),
        fullPage: true,
      });
    });
  }
});
