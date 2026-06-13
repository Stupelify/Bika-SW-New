import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/** Staging visual QA — key pages, desktop + mobile overflow checks. */
export default defineConfig({
  testDir: './e2e',
  testMatch: /visual-qa\/.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: require.resolve('./e2e/booking-form/_globalSetup.ts'),
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3030',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /booking-form\/auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'e2e/.auth/admin.json'),
      },
      dependencies: ['setup'],
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
        CLIENT_URL: 'http://localhost:3030',
        ALLOWED_ORIGINS: 'http://localhost:3030',
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
        PORT: '3030',
        NEXT_PUBLIC_API_URL: 'http://localhost:5050/api',
        INTERNAL_SERVER_URL: 'http://localhost:5050',
      },
    },
  ],
});
