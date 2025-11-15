import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'test/index.test.ts',
      'test/detect-port-enhanced.test.ts',
      'test/detect-port-advanced.test.ts',
      'test/wait-port-enhanced.test.ts',
      'test/cli-enhanced.test.ts',
      'test/integration.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/bin/**', // CLI is tested but coverage not tracked via vitest
      ],
      all: true,
      // 100% coverage thresholds
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
