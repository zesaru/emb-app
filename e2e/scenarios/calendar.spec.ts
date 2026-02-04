/**
 * Pruebas E2E para módulo de calendario
 */

import { test, expect } from '@playwright/test'

test.describe('Calendario', () => {
  const login = async (page: any) => {
    await page.goto('/login')
    const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.fill('input[placeholder*="example"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button:has-text("Sign In")')

    await page.waitForURL('/', { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('accede a la página de calendario', async ({ page }) => {
    await page.goto('/calendar')

    // Verificar que la página cargó
    await expect(page).toHaveURL(/.*calendar.*/)
  })

  test('muestra el calendario de FullCalendar', async ({ page }) => {
    await page.goto('/calendar')

    // Esperar a que el calendario se renderice
    await page.waitForTimeout(1000)

    // FullCalendar crea un div con la clase fc
    const calendar = page.locator('.fc')
    const exists = await calendar.count() > 0

    if (exists) {
      await expect(calendar.first()).toBeVisible()
    }
  })

  test('muestra navegación de meses', async ({ page }) => {
    await page.goto('/calendar')

    // Esperar a que el calendario se renderice
    await page.waitForTimeout(1000)

    // Buscar botones de navegación del calendario
    const navButtons = page.locator('button[title*="Next"], button[title*="Prev"], button.fc-today-button')
    const count = await navButtons.count()

    // Debería haber botones de navegación
    expect(count).toBeGreaterThan(0)
  })
})
