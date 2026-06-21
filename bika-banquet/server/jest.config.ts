import type { Config } from 'jest';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testTimeout: 15000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: runIntegration
    ? []
    : ['\\.integration\\.test\\.ts$'],
  // Load .env.local before module evaluation so Prisma picks up the dev DB URL
  setupFiles: ['<rootDir>/src/__tests__/jest.env.ts'],
};

export default config;
