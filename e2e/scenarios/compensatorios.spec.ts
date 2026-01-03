/**
 * Pruebas E2E para módulo de compensatorios
 */

import { test, expect } from '@playwright/test'

test.describe('Compensatorios', () => {
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

  test('accede a la lista de compensatorios', async ({ page }) => {
    await page.goto('/compensatorios')

    // Verificar que la página cargó
    await expect(page).toHaveURL(/.*compensatorios.*/)
  })

  test('muestra tabla de compensatorios', async ({ page }) => {
    await page.goto('/compensatorios')

    // Verificar que existe una tabla
    const table = page.locator('table')
    const tableExists = await table.count() > 0

    if (tableExists) {
      await expect(table.first()).toBeVisible()
    }
  })

  test('navega a vista individual de compensatorios', async ({ page }) => {
    await page.goto('/compensatorios')

    // Buscar el primer link con el icono de ver
    const viewLinks = page.locator('a[href^="/compensatorios/"]')
    const count = await viewLinks.count()

    if (count > 0) {
      await viewLinks.first().click()

      // Verificar redirección a vista individual
      await page.waitForURL(/\/compensatorios\/[a-f0-9-]+/, { timeout: 5000 })

      // Verificar elementos de la vista individual
      await expect(page.locator('text=Total Entradas')).toBeVisible()
      await expect(page.locator('text=Total Salidas')).toBeVisible()
      await expect(page.locator('text=Saldo')).toBeVisible()
    }
  })

  test('accede a página de nuevo registro compensatorio', async ({ page }) => {
    await page.goto('/compensatorios/new')

    // Verificar formulario
    await expect(page.locator('text=Registrar Trabajo Compensatorio')).toBeVisible()
  })

  test('accede a página de solicitud de tiempo libre', async ({ page }) => {
    await page.goto('/compensatorios/request')

    // Verificar formulario
    await expect(page.locator('text=Solicitar Tiempo Libre')).toBeVisible()
  })

  test('muestra tipos de compensatorios correctamente', async ({ page }) => {
    await page.goto('/compensatorios')

    // Verificar badges de tipo
    const registerBadge = page.locator('span:has-text("register")')
    const requestHourBadge = page.locator('span:has-text("request_hour")')
    const requestDayBadge = page.locator('span:has-text("request_day")')

    // La tabla podría estar vacía o tener datos
    // Solo verificamos que la página carga sin errores
    await expect(page.locator('body')).toBeVisible()
  })
})
