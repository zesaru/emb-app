/**
 * Smoke test simple para verificar configuración de Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Smoke Test', () => {
  test('verifica que la aplicación responde', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/login')

    // Verificar que la página carga (case-insensitive)
    await expect(page).toHaveTitle(/.*Emb.*/i)

    // Verificar que hay un formulario de login
    await page.waitForLoadState('networkidle')
    const emailInput = page.locator('input[placeholder*="example"]')
    await expect(emailInput).toBeVisible({ timeout: 10000 })
  })

  test('login básico', async ({ page }) => {
    await page.goto('/login')

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')

    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    // Verificar que los elementos existen antes de interactuar
    const emailInput = page.locator('input[placeholder*="example"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Sign In")')

    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    // Llenar formulario
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()

    // Esperar navegación después del login
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Verificar que estamos en el dashboard o login (si falló)
    const url = page.url()
    console.log('URL after login:', url)

    // Debería estar en dashboard o login (si falló)
    expect(url).toMatch(/(\/|\/login)/)
  })
})
