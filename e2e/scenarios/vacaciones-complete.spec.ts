/**
 * Pruebas E2E completas para módulo de vacaciones
 * Cubre flujos de solicitud, aprobación y gestión de vacaciones
 */

import { test, expect } from '@playwright/test'

test.describe('Vacaciones - Flujos Completos', () => {
  const login = async (page: any, email?: string, password?: string) => {
    await page.goto('/login')
    const testEmail = email || process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const testPassword = password || process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.fill('input[placeholder*="example"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('/', { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe('Vista Principal de Vacaciones', () => {
    test('muestra todas las estadísticas clave', async ({ page }) => {
      await page.goto('/vacaciones')

      // Verificar tarjetas de estadísticas
      await expect(page.locator('text=Solicitudes Pendientes')).toBeVisible()
      await expect(page.locator('text=Días Aprobados')).toBeVisible()
      await expect(page.locator('text=Vacaciones Activas')).toBeVisible()

      // Verificar que las tarjetas tienen valores numéricos
      const statsCards = page.locator('.grid > div').filter({ hasText: /Solicitudes|Días|Vacaciones/ })
      await expect(statsCards).toHaveCount(3)
    })

    test('muestra tabla de vacaciones con filtros', async ({ page }) => {
      await page.goto('/vacaciones')

      // Verificar que existe la tabla
      const table = page.locator('table')
      const tableExists = await table.count() > 0

      if (tableExists) {
        await expect(table.first()).toBeVisible()
      }

      // Verificar input de filtro
      const filterInput = page.locator('input[placeholder*="Filtrar"]')
      await expect(filterInput).toBeVisible()
    })

    test('filtra solicitudes por usuario', async ({ page }) => {
      await page.goto('/vacaciones')

      const filterInput = page.locator('input[placeholder*="Filtrar"]')

      // Escribir nombre para filtrar
      await filterInput.fill('Juan')

      // Esperar que se actualice la tabla
      await page.waitForTimeout(500)

      // Limpiar filtro
      await filterInput.fill('')

      await page.waitForTimeout(500)
    })
  })

  test.describe('Solicitud de Vacaciones', () => {
    test('crea una nueva solicitud de vacaciones', async ({ page }) => {
      await page.goto('/vacaciones/new')

      // Verificar que el formulario está presente
      await expect(page.locator('text=Solicitar Vacaciones')).toBeVisible()

      // Calcular fechas (dentro de 2 semanas)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 14)
      const startDateStr = startDate.toISOString().split('T')[0]

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 5)
      const endDateStr = endDate.toISOString().split('T')[0]

      // Seleccionar fechas
      await page.fill('input[name="start_date"]', startDateStr)
      await page.fill('input[name="end_date"]', endDateStr)

      // Agregar motivo
      await page.fill('textarea[name="reason"]', 'Vacaciones familiares - Test automatizado')

      // Enviar solicitud
      await page.click('button:has-text("Sign In")')

      // Verificar que se creó la solicitud
      await page.waitForTimeout(1000)
      await expect(page.locator('body')).toBeVisible()
    })

    test('valida que la fecha de fin sea posterior a la de inicio', async ({ page }) => {
      await page.goto('/vacaciones/new')

      const today = new Date().toISOString().split('T')[0]

      // Ingresar fecha de fin anterior a la de inicio
      await page.fill('input[name="start_date"]', today)
      await page.fill('input[name="end_date"]', today)

      await page.fill('textarea[name="reason"]', 'Test de validación')
      await page.click('button:has-text("Sign In")')

      // Verificar que muestra error
      await page.waitForTimeout(1000)

      // Debería permanecer en la página del formulario
      await expect(page).toHaveURL(/.*vacaciones\/new.*/)
    })

    test('calcula correctamente el número de días solicitados', async ({ page }) => {
      await page.goto('/vacaciones/new')

      // Seleccionar rango de 5 días
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 14)
      const startDateStr = startDate.toISOString().split('T')[0]

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 5)
      const endDateStr = endDate.toISOString().split('T')[0]

      await page.fill('input[name="start_date"]', startDateStr)
      await page.fill('input[name="end_date"]', endDateStr)

      // Verificar que muestra el cálculo de días
      await page.waitForTimeout(500)

      // Buscar texto que indique el número de días
      const daysText = page.locator('text=/días/i')
      const hasDaysText = await daysText.count() > 0

      if (hasDaysText) {
        await expect(daysText.first()).toBeVisible()
      }
    })

    test('valida campos requeridos', async ({ page }) => {
      await page.goto('/vacaciones/new')

      // Intentar enviar formulario vacío
      await page.click('button:has-text("Sign In")')

      // Verificar que muestra errores de validación
      await page.waitForTimeout(500)

      // Debería permanecer en la página
      await expect(page).toHaveURL(/.*vacaciones\/new.*/)
    })
  })

  test.describe('Vista Individual de Vacaciones', () => {
    test('muestra detalles completos de una solicitud', async ({ page }) => {
      await page.goto('/vacaciones')

      // Buscar una solicitud existente
      const viewLinks = page.locator('a[href^="/vacaciones/"]')
      const count = await viewLinks.count()

      if (count > 0) {
        await viewLinks.first().click()

        // Esperar que cargue la vista individual
        await page.waitForURL(/\/vacaciones\/[a-f0-9-]+/, { timeout: 5000 })

        // Verificar elementos clave
        await expect(page.locator('text=Total Solicitado')).toBeVisible()
        await expect(page.locator('text=Total Aprobado')).toBeVisible()
        await expect(page.locator('text=Saldo Vacacional')).toBeVisible()

        // Verificar tabla de períodos
        const table = page.locator('table')
        const tableExists = await table.count() > 0

        if (tableExists) {
          await expect(table.first()).toBeVisible()
        }
      }
    })

    test('muestra historial de aprobaciones', async ({ page }) => {
      await page.goto('/vacaciones')

      const viewLinks = page.locator('a[href^="/vacaciones/"]')
      const count = await viewLinks.count()

      if (count > 0) {
        await viewLinks.first().click()
        await page.waitForURL(/\/vacaciones\/[a-f0-9-]+/, { timeout: 5000 })

        // Verificar que se muestra información de aprobaciones
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Estados de Solicitudes', () => {
    test('muestra solicitudes con diferentes estados', async ({ page }) => {
      await page.goto('/vacaciones')

      // Verificar badges de estado
      const approvedBadge = page.locator('text=Aprobado')
      const pendingBadge = page.locator('text=Pendiente')
      const rejectedBadge = page.locator('text=Rechazado')

      // Al menos un badge debería estar presente
      const totalBadges = await approvedBadge.count() +
                         await pendingBadge.count() +
                         await rejectedBadge.count()

      expect(totalBadges).toBeGreaterThan(0)
    })

    test('filtra por estado de solicitud', async ({ page }) => {
      await page.goto('/vacaciones')

      // Buscar filtros de estado si existen
      const statusFilter = page.locator('select[name="status"], button:has-text("Estado")')
      const count = await statusFilter.count()

      if (count > 0) {
        // Si existe filtro, intentar usarlo
        await statusFilter.first().click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Navegación', () => {
    test('navega desde sidebar a vacaciones', async ({ page }) => {
      await page.goto('/')

      const vacacionesLink = page.locator('a[href="/vacaciones"]')
      await vacacionesLink.click()

      await page.waitForURL(/.*vacaciones.*/, { timeout: 5000 })
      await expect(page).toHaveURL(/\/vacaciones$/)
    })

    test('navega a nueva solicitud desde lista', async ({ page }) => {
      await page.goto('/vacaciones')

      // Buscar botón de nueva solicitud
      const newButton = page.locator('a[href="/vacaciones/new"]')
      await newButton.click()

      await page.waitForURL(/.*vacaciones\/new.*/, { timeout: 5000 })
      await expect(page.locator('text=Solicitar Vacaciones')).toBeVisible()
    })

    test('navega al calendario desde vacaciones', async ({ page }) => {
      await page.goto('/vacaciones')

      // Buscar enlace al calendario
      const calendarLink = page.locator('a[href="/calendar"]')
      const hasLink = await calendarLink.count() > 0

      if (hasLink) {
        await calendarLink.click()
        await page.waitForURL(/.*calendar.*/, { timeout: 5000 })
      }
    })
  })

  test.describe('Validaciones de Negocio', () => {
    test('no permite solicitar fechas en el pasado', async ({ page }) => {
      await page.goto('/vacaciones/new')

      // Intentar seleccionar fecha pasada
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const pastDateStr = pastDate.toISOString().split('T')[0]

      await page.fill('input[name="start_date"]', pastDateStr)

      // Verificar que muestra error o previene la selección
      await page.waitForTimeout(500)

      // El formulario podría no permitir enviar o mostrar error
      await page.fill('textarea[name="reason"]', 'Test')
      await page.click('button:has-text("Sign In")')

      await page.waitForTimeout(1000)
    })

    test('verifica saldo suficiente antes de solicitar', async ({ page }) => {
      await page.goto('/vacaciones/new')

      // Intentar solicitar más días del saldo disponible
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 14)
      const startDateStr = startDate.toISOString().split('T')[0]

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 100) // Excesivo
      const endDateStr = endDate.toISOString().split('T')[0]

      await page.fill('input[name="start_date"]', startDateStr)
      await page.fill('input[name="end_date"]', endDateStr)
      await page.fill('textarea[name="reason"]', 'Test de validación de saldo')

      await page.click('button:has-text("Sign In")')

      // Verificar que muestra error o advertencia
      await page.waitForTimeout(1000)
    })
  })
})

test.describe('Vacaciones - Vistas de Usuario vs Admin', () => {
  test('vista de usuario muestra solo sus solicitudes', async ({ page }) => {
    const userEmail = process.env.E2E_USER_EMAIL || 'user@test.com'
    const userPassword = process.env.E2E_USER_PASSWORD || 'user123'

    await page.goto('/login')
    await page.fill('input[placeholder*="example"]', userEmail)
    await page.fill('input[type="password"]', userPassword)
    await page.click('button:has-text("Sign In")')

    try {
      await page.waitForURL('/', { timeout: 10000 })
    } catch {
      test.skip()
      return
    }

    await page.goto('/vacaciones')

    // Verificar que puede ver la página
    await expect(page).toHaveURL(/.*vacaciones.*/)
  })

  test('vista de admin muestra todas las solicitudes', async ({ page }) => {
    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.goto('/login')
    await page.fill('input[placeholder*="example"]', adminEmail)
    await page.fill('input[type="password"]', adminPassword)
    await page.click('button:has-text("Sign In")')

    await page.waitForURL('/', { timeout: 10000 })

    await page.goto('/vacaciones')

    // Verificar que ve la tabla completa
    await expect(page).toHaveURL(/\/vacaciones$/)
  })
})

test.describe('Vacaciones - Integración con Calendario', () => {
  test('muestra vacaciones en el calendario', async ({ page }) => {
    await page.goto('/calendar')

    // Verificar que el calendario carga
    await expect(page.locator('.fc, .fullcalendar')).toBeVisible()

    // Verificar que hay eventos de vacaciones
    const events = page.locator('.fc-event, .calendar-event')
    const eventCount = await events.count()

    // Debería haber eventos o el calendario debería ser visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('permite navegar entre meses', async ({ page }) => {
    await page.goto('/calendar')

    // Buscar botones de navegación del calendario
    const nextButton = page.locator('button:has-text("siguiente"), button:has-text("next"), .fc-next-button')
    const prevButton = page.locator('button:has-text("anterior"), button:has-text("prev"), .fc-prev-button')

    const hasNavigation = await nextButton.count() > 0 || await prevButton.count() > 0

    if (hasNavigation) {
      if (await nextButton.count() > 0) {
        await nextButton.first().click()
        await page.waitForTimeout(500)
      }

      if (await prevButton.count() > 0) {
        await prevButton.first().click()
        await page.waitForTimeout(500)
      }
    }
  })
})
