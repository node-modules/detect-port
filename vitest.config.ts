import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'test/index.test.ts',
      'test/detect-port-enhanced.test.ts',
      'test/detect-port-advanced.test.ts',
      'test/detect-port-mocking.test.ts',
      'test/detect-port-spy.test.ts',
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
      // Coverage thresholds
      // Note: Some edge case error handling paths (6 lines) in detect-port.ts are
      // difficult to test without extensive mocking as they require specific
      // system conditions (DNS failures, port 0 failures, specific binding errors)
      thresholds: {
        lines: 93,
        functions: 100,
        branches: 90,
        statements: 93,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
