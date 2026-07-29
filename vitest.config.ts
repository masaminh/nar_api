import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'html', 'lcov'],
    }
  },
})
