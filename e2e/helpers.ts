/**
 * Helper functions for E2E tests
 */

import type { Page } from '@playwright/test'

/**
 * Login helper con selectores correctos y manejo de rate limiting
 */
export async function login(
  page: Page,
  email?: string,
  password?: string
) {
  const testEmail = email || process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
  const testPassword = password || process.env.E2E_ADMIN_PASSWORD || 'password123'

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Pequeña delay para evitar rate limiting cuando múltiples tests corren en paralelo
  await page.waitForTimeout(Math.random() * 500 + 250) // 250-750ms random delay

  // Usar selectores correctos según el formulario real
  await page.fill('input[placeholder*="example"]', testEmail)
  await page.fill('input[type="password"]', testPassword)
  await page.click('button:has-text("Sign In")')

  // Esperar navegación después del login
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // Verificar que no haya error de rate limiting
  const url = page.url()
  if (url.includes('error') && url.includes('Too many attempts')) {
    throw new Error('Rate limit exceeded: Too many login attempts')
  }
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Logout"), button:has-text("Sign Out")')
  const count = await logoutButton.count()

  if (count > 0) {
    await logoutButton.first().click()
    await page.waitForLoadState('networkidle', { timeout: 10000 })
  }
}

/**
 * Navega a una ruta y espera a que cargue
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle', { timeout: 10000 })
}

/**
 * Espera a que un elemento sea visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
) {
  await page.waitForSelector(selector, { state: 'visible', timeout })
}
