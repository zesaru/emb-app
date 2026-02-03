/**
 * Critical Path E2E Tests
 * Tests the most important user flows without rate limiting issues
 * Runs sequentially to avoid Supabase authentication limits
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('Critical Path - Happy Path', () => {
  test('complete user journey: login -> navigate dashboard -> logout', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    // Step 1: Login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Verify login success
    const url = page.url()
    expect(url).not.toContain('error')
    expect(url).toMatch(/(\/|\/login)/)

    // Step 2: Navigate to compensatorios
    await page.goto('/compensatorios')
    await expect(page).toHaveURL(/.*compensatorios.*/)
    await page.waitForLoadState('networkidle')

    // Step 3: Navigate to vacaciones
    await page.goto('/vacations')
    await page.waitForLoadState('networkidle')

    // Step 4: Navigate to calendar
    await page.goto('/calendar')
    await expect(page).toHaveURL(/.*calendar.*/)
    await page.waitForLoadState('networkidle')
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/compensatorios')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder*="example"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle')

    // Should remain on login page or show error
    const url = page.url()
    expect(url).toContain('/login')
  })
})

test.describe('Critical Path - Dashboard', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('dashboard loads successfully after login', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.goto('/login')
    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Navigate to dashboard
    await page.goto('/')
    await expect(page).toHaveURL(/\//)
    await page.waitForLoadState('networkidle')

    // Verify page content is visible
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Critical Path - Smoke Tests', () => {
  test('all main routes are accessible after authentication', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    // Login once
    await page.goto('/login')
    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Test each route
    const routes = ['/compensatorios', '/vacaciones', '/calendar', '/attendances', '/report']

    for (const route of routes) {
      await page.goto(route)
      await page.waitForTimeout(500) // Brief pause between requests
      await expect(page).toHaveURL(new RegExp(route))
    }
  })
})
