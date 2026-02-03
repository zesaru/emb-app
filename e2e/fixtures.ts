/**
 * E2E Test Fixtures
 * Provides reusable authenticated sessions to avoid rate limiting
 */

import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
  adminPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Authenticate once per test file
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Add delay to avoid rate limiting
    await page.waitForTimeout(500)

    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    // Wait for navigation and check for rate limit errors
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    const url = page.url()
    if (url.includes('error')) {
      throw new Error(`Authentication failed: ${url}`)
    }

    await use(page)
  },

  adminPage: async ({ page }, use) => {
    // Admin-specific fixture
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(500)

    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle', { timeout: 15000 })

    const url = page.url()
    if (url.includes('error')) {
      throw new Error(`Admin authentication failed: ${url}`)
    }

    // Verify admin access
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await use(page)
  },
})

export { expect } from '@playwright/test'
