import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const hasAuth = fs.existsSync(path.join(__dirname, '..', '.auth', 'admin.json'));

test.describe('Booking form payments integrity', () => {
  test.skip(!hasAuth, 'Requires seeded test DB and admin auth (globalSetup)');

  test('double save does not duplicate payments', async ({ page, request }) => {
    await page.goto('/dashboard/bookings', { waitUntil: 'domcontentloaded' });

    const addBtn = page.getByRole('button', { name: /add booking|new booking/i }).first();
    await addBtn.click({ timeout: 15_000 });

    await page.locator('input[type="date"]').first().fill('2030-06-15');

    const functionType = page.getByPlaceholder(/function type|wedding|birthday/i).first();
    if (await functionType.isVisible().catch(() => false)) {
      await functionType.fill('Integrity Test Event');
    }

    const customerInput = page.getByPlaceholder(/search customer|customer/i).first();
    await customerInput.click();
    await customerInput.fill('a');
    const suggestion = page.locator('[role="option"], li, button').filter({ hasText: /.+/ }).first();
    if (await suggestion.isVisible({ timeout: 5000 }).catch(() => false)) {
      await suggestion.click();
    }

    await page.getByRole('button', { name: /^payments$/i }).click();

    const addPayment = page.getByRole('button', { name: /add payment/i });
    await addPayment.click();
    await page.locator('input[type="number"]').last().fill('1000');
    await page.getByRole('button', { name: /add to ledger/i }).click();

    await addPayment.click();
    await page.locator('input[type="number"]').last().fill('500');
    await page.getByRole('button', { name: /add to ledger/i }).click();

    const submit = page.getByRole('button', { name: /^submit$/i }).first();
    await submit.click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 30_000 });

    await submit.click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 30_000 });

    const paymentRows = page.locator('table tbody tr').filter({ has: page.locator('td') });
    await expect(paymentRows).toHaveCount(2, { timeout: 10_000 });
  });
});
