/**
 * Pruebas E2E para módulo de vacaciones
 */

import { test, expect } from '@playwright/test'

test.describe('Vacaciones', () => {
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

  test('accede a la lista de vacaciones', async ({ page }) => {
    await page.goto('/vacaciones')

    // Verificar que la página cargó
    await expect(page.locator('text=Solicitudes Pendientes')).toBeVisible()
    await expect(page.locator('text=Días Aprobados')).toBeVisible()
    await expect(page.locator('text=Vacaciones Activas')).toBeVisible()
  })

  test('muestra estadísticas correctamente', async ({ page }) => {
    await page.goto('/vacaciones')

    // Verificar tarjetas de estadísticas
    const statsCards = page.locator('.grid > div').filter({ hasText: /Solicitudes|Días|Vacaciones/ })
    await expect(statsCards).toHaveCount(3)
  })

  test('navega a vista individual de vacaciones', async ({ page }) => {
    await page.goto('/vacaciones')

    // Buscar el primer link con el icono de ver
    const viewLinks = page.locator('a[href^="/vacaciones/"]')
    const count = await viewLinks.count()

    if (count > 0) {
      await viewLinks.first().click()

      // Verificar redirección a vista individual
      await page.waitForURL(/\/vacaciones\/[a-f0-9-]+/, { timeout: 5000 })

      // Verificar elementos de la vista individual
      await expect(page.locator('text=Total Solicitado')).toBeVisible()
      await expect(page.locator('text=Total Aprobado')).toBeVisible()
      await expect(page.locator('text=Saldo Vacacional')).toBeVisible()
    }
  })

  test('filtra usuarios en tabla de vacaciones', async ({ page }) => {
    await page.goto('/vacaciones')

    // Buscar input de filtro
    const filterInput = page.locator('input[placeholder*="Filtrar"]')
    await expect(filterInput).toBeVisible()

    // Escribir en el filtro
    await filterInput.fill('test')

    // Esperar que se actualice la tabla
    await page.waitForTimeout(500)
  })

  test('muestra estados de vacaciones correctamente', async ({ page }) => {
    await page.goto('/vacaciones')

    // Verificar badges de estado
    const approvedBadge = page.locator('span:has-text("Aprobado")')
    const pendingBadge = page.locator('span:has-text("Pendiente")')

    // Al menos uno debería estar presente
    const hasBadges = await approvedBadge.count() + await pendingBadge.count() > 0
    expect(hasBadges).toBeTruthy()
  })
})
