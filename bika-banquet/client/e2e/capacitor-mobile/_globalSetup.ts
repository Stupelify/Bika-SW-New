/**
 * Seeds test DB + saves admin storageState for dashboard capacitor tests.
 * Mirrors qa-forms globalSetup so capacitor config stays self-contained.
 */
import { chromium, type FullConfig } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const STORAGE_PATH = path.join(__dirname, '..', '.auth', 'admin.json');

interface Seed {
  email: string;
  password: string;
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const cliPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'server',
    'tests',
    'qa-forms',
    '_resetAndSeed.ts',
  );

  if (!fs.existsSync(cliPath)) {
    console.warn('[capacitor-mobile] Seed CLI missing — dashboard tests will skip.');
    return;
  }

  const stdout = execFileSync('npx', ['tsx', cliPath], {
    cwd: path.join(__dirname, '..', '..', '..', 'server'),
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ||
        process.env.DATABASE_URL ||
        'postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet_test?schema=public',
    },
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 10 * 1024 * 1024,
  })
    .toString('utf8')
    .trim();

  let seed: Seed | null = null;
  for (const line of stdout.split(/\r?\n/).reverse()) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.email && parsed?.password) {
        seed = parsed as Seed;
        break;
      }
    } catch {
      /* scan */
    }
  }
  if (!seed) {
    console.warn('[capacitor-mobile] Could not parse seed — dashboard tests will skip.');
    return;
  }

  fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });

  const baseURL = process.env.PW_BASE_URL || 'http://localhost:3030';
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.locator('#email').fill(seed.email);
    await page.locator('#password').fill(seed.password);
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
      page.locator('button[type="submit"]').click(),
    ]);
    await ctx.storageState({ path: STORAGE_PATH });
  } catch (err) {
    console.warn('[capacitor-mobile] Login failed — dashboard tests will skip:', err);
  } finally {
    await browser.close();
  }
}
