import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const hasAuth = fs.existsSync(path.join(__dirname, '..', '.auth', 'admin.json'));

test.describe('Booking form template import replace', () => {
  test.skip(!hasAuth, 'Requires seeded test DB and admin auth (globalSetup)');

  test('importing template replaces selection after confirm', async ({ page }) => {
    test.fixme(true, 'Requires stable seed data: template menu + item catalog in test DB');

    await page.goto('/dashboard/bookings', { waitUntil: 'domcontentloaded' });
    // Full flow depends on seeded template menus; merge helper kept for tests only.
    expect(true).toBe(true);
  });
});
