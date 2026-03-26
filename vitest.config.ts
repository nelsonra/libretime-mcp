import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Set env vars before any module is evaluated (libretime.ts reads these at load time)
    env: {
      LIBRETIME_URL: 'http://libretime.test',
      LIBRETIME_USER: 'testuser',
      LIBRETIME_PASS: 'testpass',
    },
  },
})
