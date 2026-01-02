/**
 * Fixtures para autenticación en pruebas E2E
 *
 * Uso:
 *   import { test, expect } from '../fixtures/auth'
 *
 *   test('mi test', async ({ adminPage }) => {
 *     // adminPage ya está autenticado como admin
 *   })
 */

import { test as base, type Page } from '@playwright/test'

type AuthRoles = 'admin' | 'user'

async function loginAs(page: Page, role: AuthRoles) {
  const email = role === 'admin'
    ? process.env.E2E_ADMIN_EMAIL || 'admin@test.com'
    : process.env.E2E_USER_EMAIL || 'user@test.com'

  const password = role === 'admin'
    ? process.env.E2E_ADMIN_PASSWORD || 'admin123'
    : process.env.E2E_USER_PASSWORD || 'user123'

  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Esperar redirección al dashboard después del login
  await page.waitForURL('/', { timeout: 10000 })
}

export const test = base.extend<{
  adminPage: Page
  userPage: Page
}>({
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'admin')
    await use(page)
  },

  userPage: async ({ page }, use) => {
    await loginAs(page, 'user')
    await use(page)
  },
})

export const expect = test.expect
