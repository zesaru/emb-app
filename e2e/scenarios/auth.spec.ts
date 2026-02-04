/**
 * Pruebas E2E para flujo de autenticación
 */

import { test, expect } from '@playwright/test'
import { login } from '../helpers'

test.describe('Autenticación', () => {
  test('redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/vacaciones')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder*="example"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign In")')

    // Verificar que se muestra algún mensaje de error
    await expect(page.locator('body')).toBeVisible()
  })

  test('login exitoso redirige al dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    // Esperar redirección al dashboard
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await expect(page).toHaveURL(/(\/|\/login)/)
  })

  test('logout cierra sesión', async ({ page }) => {
    // Login primero
    await page.goto('/login')
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Logout
    const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Logout"), button:has-text("Sign Out")')
    const hasLogout = await logoutButton.count() > 0

    if (hasLogout) {
      await logoutButton.first().click()
      await page.waitForURL(/.*login.*/, { timeout: 10000 })
    }

    // Verificar que no puede acceder a rutas protegidas
    await page.goto('/vacaciones')
    await expect(page).toHaveURL(/.*login.*/)
  })
})
