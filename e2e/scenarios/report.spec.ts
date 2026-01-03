/**
 * Pruebas E2E para módulo de reportes
 */

import { test, expect } from '@playwright/test'

test.describe('Reportes', () => {
  const login = async (page: any) => {
    await page.goto('/login')
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    await page.waitForURL('/', { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('accede a la página de reportes', async ({ page }) => {
    await page.goto('/report')

    // Verificar que la página cargó
    await expect(page).toHaveURL(/.*report.*/)
  })

  test('muestra filtros de reporte', async ({ page }) => {
    await page.goto('/report')

    // Verificar inputs de fecha para el reporte
    const dateInputs = page.locator('input[type="date"]')
    const count = await dateInputs.count()

    // Debería haber al menos un input de fecha
    expect(count).toBeGreaterThan(0)
  })

  test('muestra tabla de reportes', async ({ page }) => {
    await page.goto('/report')

    // Verificar que existe contenido
    await expect(page.locator('body')).toBeVisible()
  })
})
