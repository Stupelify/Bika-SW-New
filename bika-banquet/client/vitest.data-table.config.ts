import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'happy-dom',
    include: ['src/lib/data-table/__tests__/**/*.test.ts', 'src/components/data-table/__tests__/**/*.test.tsx', 'src/hooks/__tests__/**/*.test.tsx'],
    setupFiles: ['./test/setup-dom.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
