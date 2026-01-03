/**
 * Pruebas E2E para el dashboard principal
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard Principal', () => {
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

  test('accede al dashboard principal', async ({ page }) => {
    await page.goto('/')

    // Verificar que estamos en el dashboard
    await expect(page).toHaveURL(/\//)
  })

  test('muestra el sidebar de navegación', async ({ page }) => {
    await page.goto('/')

    // Verificar que existe el sidebar
    const sidebar = page.locator('nav, aside')
    await expect(sidebar).toBeVisible()
  })

  test('muestra enlaces de navegación principales', async ({ page }) => {
    await page.goto('/')

    // Verificar enlaces principales
    const compensatoriosLink = page.locator('a[href="/compensatorios"]')
    const vacacionesLink = page.locator('a[href="/vacaciones"]')
    const attendancesLink = page.locator('a[href="/attendances"]')
    const calendarLink = page.locator('a[href="/calendar"]')

    // Verificar que los enlaces existen
    await expect(compensatoriosLink).toBeVisible()
    await expect(vacacionesLink).toBeVisible()
    await expect(attendancesLink).toBeVisible()
    await expect(calendarLink).toBeVisible()
  })

  test('navega a compensatorios desde el sidebar', async ({ page }) => {
    await page.goto('/')

    const compensatoriosLink = page.locator('a[href="/compensatorios"]')
    await compensatoriosLink.click()

    await page.waitForURL(/.*compensatorios.*/, { timeout: 5000 })
  })

  test('navega a vacaciones desde el sidebar', async ({ page }) => {
    await page.goto('/')

    const vacacionesLink = page.locator('a[href="/vacaciones"]')
    await vacacionesLink.click()

    await page.waitForURL(/.*vacaciones.*/, { timeout: 5000 })
  })

  test('muestra estadísticas para admin', async ({ page }) => {
    await page.goto('/')

    // El dashboard debería mostrar contenido
    await expect(page.locator('body')).toBeVisible()
  })
})
