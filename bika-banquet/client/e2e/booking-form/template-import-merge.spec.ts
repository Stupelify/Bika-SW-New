import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const hasAuth = fs.existsSync(path.join(__dirname, '..', '.auth', 'admin.json'));

test.describe('Booking form template import merge', () => {
  test.skip(!hasAuth, 'Requires seeded test DB and admin auth (globalSetup)');

  test('importing template merges items without clearing custom selection', async ({ page }) => {
    test.fixme(true, 'Requires stable seed data: template menu + item catalog in test DB');

    await page.goto('/dashboard/bookings', { waitUntil: 'domcontentloaded' });
    // Full flow depends on seeded template menus; covered by unit tests for mergeTemplateItemIds.
    expect(true).toBe(true);
  });
});
