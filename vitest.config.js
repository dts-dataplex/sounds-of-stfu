import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for fast DOM environment
    environment: 'happy-dom',

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.js',
        'src/ai/workers/**', // Workers tested separately
        'src/main.js', // Entry point, tested via integration
        'poc/**', // Proof of concept files
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },

    // Test setup
    setupFiles: ['./test/setup.js'],

    // Test timeout (some tests need time for async operations)
    testTimeout: 10000,

    // Watch mode settings
    watch: false,
  },
});
