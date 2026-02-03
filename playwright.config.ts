import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/scenarios',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limit workers to avoid Supabase rate limiting during parallel tests
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Critical path tests run sequentially to avoid rate limiting
    {
      name: 'critical-path',
      testMatch: '**/critical-path.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    // Other tests can run in parallel with limited workers
    {
      name: 'parallel-tests',
      testIgnore: '**/critical-path.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
