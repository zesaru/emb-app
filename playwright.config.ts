import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for E2E Tests
 * Optimized for Vercel CI/CD and local development
 */
export default defineConfig({
  testDir: './e2e/scenarios',

  // CI-specific optimizations
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],

  // Test timeout configuration
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds per assertion
  },

  use: {
    // Base URL from environment or default to localhost
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Trace configuration
    trace: 'on-first-retry',

    // Screenshot configuration
    screenshot: 'only-on-failure',

    // Video recording (only in CI)
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors in preview deployments
    ignoreHTTPSErrors: true,
  },

  // Projects configuration for different test scenarios
  projects: [
    // Setup project - authenticates once and saves session state
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      dependencies: [],
    },

    // Tests running with authenticated admin session
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
        '**/auth.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Critical path tests - run sequentially
    {
      name: 'critical-path',
      dependencies: ['setup'],
      testMatch: '**/critical-path.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
    },

    // Mobile viewport tests
    {
      name: 'mobile',
      dependencies: ['setup'],
      testMatch: '**/smoke-test.spec.ts',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/admin.json',
      },
    },
  ],

  // Web server configuration for local development
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
