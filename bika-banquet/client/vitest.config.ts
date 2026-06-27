import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: [
      'src/components/__tests__/**/*.test.tsx',
      'src/lib/booking-form/__tests__/**/*.test.ts',
      'src/lib/__tests__/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bika/booking-core': path.resolve(__dirname, '../shared/booking-core/src/index.ts'),
    },
  },
});
