import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.bench.ts',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 10000,
  },
});
