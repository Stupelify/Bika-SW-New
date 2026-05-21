import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Capacitor mobile UI gate — simulates native DOM classes on mobile viewports.
 * Run: npm run test:e2e:capacitor
 */
export default defineConfig({
  testDir: './e2e/capacitor-mobile',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: require.resolve('./e2e/capacitor-mobile/_globalSetup.ts'),
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3030',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-safari-ios',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'mobile-chrome-android',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'npm --prefix ../server run dev',
      url: 'http://localhost:5050/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL_TEST ||
          'postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet_test?schema=public',
        JWT_SECRET:
          process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
            ? process.env.JWT_SECRET
            : 'qa-forms-test-secret-key-please-do-not-use-in-prod-1234567890',
        REDIS_URL: '',
        PORT: '5050',
        NODE_ENV: 'development',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3030',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        NEXT_PUBLIC_API_URL: 'http://localhost:5050/api',
        PORT: '3030',
      },
    },
  ],
});
