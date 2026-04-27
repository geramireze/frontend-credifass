import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/main.ts', 'src/environments/**'],
      thresholds: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
        // Las facades de los módulos críticos requieren 95%
        perFile: false,
      },
    },
  },
});
