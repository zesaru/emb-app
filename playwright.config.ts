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
    // Setup project - authenticates once and saves session state
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // Tests running with authenticated admin session (no repeated logins!)
    {
      name: 'authenticated-admin',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
    },

    // Tests running with authenticated user session
    {
      name: 'authenticated-user',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },

    // Tests without authentication (redirects, error handling, smoke tests)
    {
      name: 'unauthenticated',
      testMatch: [
        '**/smoke-test.spec.ts',
        '**/auth.spec.ts',  // Tests that don't require pre-auth
      ],
      use: { ...devices['Desktop Chrome'] },
    },

    // Critical path tests run sequentially with auth
    {
      name: 'critical-path',
      dependencies: ['setup'],
      testMatch: '**/critical-path.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
