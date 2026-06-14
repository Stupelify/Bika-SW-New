import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SEED_PATH = path.join(__dirname, '..', '.auth', 'seed.json');
const STORAGE_PATH = path.join(__dirname, '..', '.auth', 'admin.json');
const API_BASE = process.env.PW_API_URL || 'http://localhost:5050/api';

setup('authenticate admin', async ({ page, request }) => {
  if (!fs.existsSync(SEED_PATH)) {
    setup.skip(true, 'Missing seed.json — DB globalSetup did not run');
  }

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')) as {
    email: string;
    password: string;
  };

  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: { email: seed.email, password: seed.password },
  });
  expect(loginRes.ok(), `login failed: ${await loginRes.text()}`).toBeTruthy();
  const body = await loginRes.json();
  const token = body?.data?.token as string;
  expect(token).toBeTruthy();

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
  }, token);
  await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 60_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
  await page.context().storageState({ path: STORAGE_PATH });
});
