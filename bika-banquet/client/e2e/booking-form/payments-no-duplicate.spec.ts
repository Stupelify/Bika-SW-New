import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SEED_PATH = path.join(__dirname, '..', '.auth', 'seed.json');
const API_BASE = process.env.PW_API_URL || 'http://localhost:5050/api';

function bookingDialog(page: Page) {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /booking form|edit booking/i }),
  });
}

async function clickSubmit(page: Page) {
  const dialog = bookingDialog(page);
  await dialog.getByRole('button', { name: /^Submit$/i }).first().click();
}

async function expectSaveToast(page: Page, kind: 'created' | 'updated') {
  const pattern =
    kind === 'created' ? /Booking created successfully/i : /Booking updated successfully/i;
  await expect(
    page.locator('[data-sonner-toast], [role="status"]').filter({ hasText: pattern })
  ).toBeVisible({ timeout: 30_000 });
}

test.describe('Booking form payments integrity', () => {
  test('double save does not duplicate payments', async ({ page, request }) => {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')) as {
      email: string;
      password: string;
      customerId: string;
    };

    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: seed.email, password: seed.password },
    });
    expect(loginRes.ok(), `login failed: ${await loginRes.text()}`).toBeTruthy();
    const loginBody = await loginRes.json();
    const token = loginBody?.data?.token as string;
    expect(token).toBeTruthy();

    const authHeaders = { Authorization: `Bearer ${token}` };

    const createRes = await request.post(`${API_BASE}/bookings`, {
      headers: authHeaders,
      data: {
        customerId: seed.customerId,
        functionName: 'QA Payment Dup Test',
        functionType: 'Marriage',
        functionDate: '2030-06-15',
        functionTime: '12:00',
        expectedGuests: 100,
      },
    });
    expect(createRes.ok(), `create failed: ${await createRes.text()}`).toBeTruthy();
    const createBody = await createRes.json();
    const bookingId = createBody?.data?.booking?.id as string;
    expect(bookingId).toBeTruthy();

    await page.goto(`/dashboard/bookings?section=edit&id=${bookingId}`, {
      waitUntil: 'domcontentloaded',
    });

    const dialog = bookingDialog(page);
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await dialog.getByRole('button', { name: /payments & party over/i }).click();

    const addPayment = dialog.getByRole('button', { name: /add payment/i });
    await addPayment.click();
    await dialog.locator('input.text-right:visible').last().fill('1000');
    await dialog.getByRole('button', { name: /add to ledger/i }).click();

    await addPayment.click();
    await dialog.locator('input.text-right:visible').last().fill('500');
    await dialog.getByRole('button', { name: /add to ledger/i }).click();

    await clickSubmit(page);
    await expectSaveToast(page, 'updated');

    await clickSubmit(page);
    await expectSaveToast(page, 'updated');

    const paymentsTable = bookingDialog(page).locator('table').filter({ hasText: 'Method' });
    await expect(paymentsTable.locator('tbody tr')).toHaveCount(2, { timeout: 10_000 });
  });
});
