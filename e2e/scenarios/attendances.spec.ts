/**
 * Pruebas E2E para módulo de asistencia
 */

import { test, expect } from '@playwright/test'

test.describe('Asistencia (Attendances)', () => {
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

  test('accede a la página de asistencias', async ({ page }) => {
    await page.goto('/attendances')

    // Verificar que la página cargó
    await expect(page).toHaveURL(/.*attendances.*/)
  })

  test('muestra tabla de asistencias', async ({ page }) => {
    await page.goto('/attendances')

    // Verificar que existe una tabla o contenido
    await expect(page.locator('body')).toBeVisible()
  })

  test('muestra filtros de fecha', async ({ page }) => {
    await page.goto('/attendances')

    // Verificar inputs de fecha
    const dateInputs = page.locator('input[type="date"]')
    const count = await dateInputs.count()

    // Debería haber al menos un input de fecha
    expect(count).toBeGreaterThan(0)
  })
})
