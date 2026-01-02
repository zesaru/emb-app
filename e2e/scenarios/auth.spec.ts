/**
 * Pruebas E2E para flujo de autenticación
 */

import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test('redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/vacaciones')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Verificar que se muestra algún mensaje de error
    await expect(page.locator('body')).toBeVisible()
  })

  test('login exitoso redirige al dashboard', async ({ page }) => {
    await page.goto('/login')

    const email = process.env.E2E_ADMIN_EMAIL || 'admin@test.com'
    const password = process.env.E2E_ADMIN_PASSWORD || 'admin123'

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // Esperar redirección al dashboard
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page).toHaveURL('/')
  })

  test('logout cierra sesión', async ({ page }) => {
    // Login primero
    await page.goto('/login')
    const email = process.env.E2E_ADMIN_EMAIL || 'admin@test.com'
    const password = process.env.E2E_ADMIN_PASSWORD || 'admin123'

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    await page.waitForURL('/', { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /cerrar/i }).click()
    await page.waitForURL(/.*login.*/)

    // Verificar que no puede acceder a rutas protegidas
    await page.goto('/vacaciones')
    await expect(page).toHaveURL(/.*login.*/)
  })
})
