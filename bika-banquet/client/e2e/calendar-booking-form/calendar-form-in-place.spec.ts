import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SEED_PATH = path.join(__dirname, '..', '.auth', 'seed.json');
const API_BASE = process.env.PW_API_URL || 'http://localhost:5050/api';

function bookingDialog(page: import('@playwright/test').Page) {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /booking form|edit booking/i }),
  });
}

test.describe('Calendar in-place booking form', () => {
  test('opens edit form on calendar without navigating to bookings', async ({ page, request }) => {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')) as {
      email: string;
      password: string;
      customerId: string;
    };

    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: seed.email, password: seed.password },
    });
    expect(loginRes.ok()).toBeTruthy();
    const token = (await loginRes.json())?.data?.token as string;

    const createRes = await request.post(`${API_BASE}/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        customerId: seed.customerId,
        functionName: 'Calendar In-Place Test',
        functionType: 'Marriage',
        functionDate: '2030-09-10',
        functionTime: '12:00',
        expectedGuests: 50,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const bookingId = (await createRes.json())?.data?.booking?.id as string;
    expect(bookingId).toBeTruthy();

    await page.goto(`/dashboard/calendar?section=edit&id=${bookingId}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(/\/dashboard\/calendar/);
    await expect(bookingDialog(page)).toBeVisible({ timeout: 30_000 });
    await expect(bookingDialog(page).getByRole('heading', { name: /edit booking/i })).toBeVisible();
  });

  test('new booking toolbar stays on calendar route', async ({ page }) => {
    await page.goto('/dashboard/calendar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /new booking/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/calendar/);
    await expect(bookingDialog(page)).toBeVisible({ timeout: 15_000 });
    await expect(bookingDialog(page).getByRole('heading', { name: /booking form/i })).toBeVisible();
  });
});
