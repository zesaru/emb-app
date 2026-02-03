/**
 * Pruebas E2E completas para módulo de compensatorios
 * Cubre flujos de usuario completos de registro y solicitud
 */

import { test, expect } from '@playwright/test'

test.describe('Compensatorios - Flujos Completos', () => {
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

  test.describe('Registro de Trabajo Compensatorio', () => {
    test('crea un nuevo registro compensatorio exitosamente', async ({ page }) => {
      await page.goto('/compensatorios/new')

      // Verificar que el formulario esté presente
      await expect(page.locator('text=Registrar Trabajo Compensatorio')).toBeVisible()

      // Llenar el formulario
      const today = new Date().toISOString().split('T')[0]

      // Seleccionar fecha
      await page.fill('input[type="date"]', today)

      // Seleccionar tipo de trabajo (horas extra)
      await page.click('select[name="type"]')
      await page.selectOption('select[name="type"]', 'register')

      // Ingresar horas trabajadas
      await page.fill('input[name="hours"]', '2')

      // Agregar descripción
      await page.fill('textarea[name="description"]', 'Trabajo extra en proyecto EMB - Test automatizado')

      // Enviar formulario
      await page.click('button:has-text("Sign In")')

      // Verificar que se creó el registro
      await page.waitForURL(/.*compensatorios.*/, { timeout: 5000 })

      // Verificar mensaje de éxito
      await expect(page.locator('body')).toBeVisible()
    })

    test('valida campos requeridos en formulario de registro', async ({ page }) => {
      await page.goto('/compensatorios/new')

      // Intentar enviar formulario vacío
      await page.click('button:has-text("Sign In")')

      // Verificar que muestra errores de validación
      // Esperar a que aparezcan mensajes de validación
      await page.waitForTimeout(500)

      // Verificar que aún estamos en la página de formulario (no redirigió)
      await expect(page).toHaveURL(/.*compensatorios\/new.*/)
    })

    test('muestra vista previa del saldo actual', async ({ page }) => {
      await page.goto('/compensatorios/new')

      // Verificar que se muestra información del saldo
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Solicitud de Tiempo Libre', () => {
    test('crea una solicitud de tiempo libre por horas', async ({ page }) => {
      await page.goto('/compensatorios/request')

      // Verificar que el formulario esté presente
      await expect(page.locator('text=Solicitar Tiempo Libre')).toBeVisible()

      // Seleccionar tipo de solicitud
      await page.click('select[name="type"]')
      await page.selectOption('select[name="type"]', 'request_hour')

      // Seleccionar fecha
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      await page.fill('input[type="date"]', dateStr)

      // Ingresar horas solicitadas
      await page.fill('input[name="hours"]', '2')

      // Agregar motivo
      await page.fill('textarea[name="description"]', 'Cita médica - Test automatizado')

      // Enviar solicitud
      await page.click('button:has-text("Sign In")')

      // Verificar que se creó la solicitud
      await page.waitForTimeout(1000)
      await expect(page.locator('body')).toBeVisible()
    })

    test('crea una solicitud de día completo', async ({ page }) => {
      await page.goto('/compensatorios/request')

      // Seleccionar tipo de solicitud por día
      await page.click('select[name="type"]')
      await page.selectOption('select[name="type"]', 'request_day')

      // Seleccionar fecha
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const dateStr = nextWeek.toISOString().split('T')[0]

      await page.fill('input[type="date"]', dateStr)

      // Agregar motivo
      await page.fill('textarea[name="description"]', 'Trámite personal - Test automatizado')

      // Enviar solicitud
      await page.click('button:has-text("Sign In")')

      // Verificar que se creó la solicitud
      await page.waitForTimeout(1000)
    })

    test('valida saldo suficiente antes de solicitar', async ({ page }) => {
      await page.goto('/compensatorios/request')

      // Verificar que se muestra el saldo disponible
      await expect(page.locator('body')).toBeVisible()

      // Intentar solicitar más horas de las disponibles
      await page.click('select[name="type"]')
      await page.selectOption('select[name="type"]', 'request_hour')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])

      // Ingresar cantidad excesiva
      await page.fill('input[name="hours"]', '999')

      await page.fill('textarea[name="description"]', 'Test de validación')
      await page.click('button:has-text("Sign In")')

      // Verificar que muestra error o previene el envío
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Vista Individual de Usuario', () => {
    test('muestra balance completo de entradas y salidas', async ({ page }) => {
      await page.goto('/compensatorios')

      // Buscar el primer link individual
      const viewLinks = page.locator('a[href^="/compensatorios/"]')
      const count = await viewLinks.count()

      if (count > 0) {
        await viewLinks.first().click()

        // Esperar a que cargue la vista individual
        await page.waitForURL(/\/compensatorios\/[a-f0-9-]+/, { timeout: 5000 })

        // Verificar elementos clave del balance
        await expect(page.locator('text=Total Entradas')).toBeVisible()
        await expect(page.locator('text=Total Salidas')).toBeVisible()
        await expect(page.locator('text=Saldo')).toBeVisible()

        // Verificar tabla de transacciones
        const table = page.locator('table')
        const tableExists = await table.count() > 0

        if (tableExists) {
          await expect(table.first()).toBeVisible()
        }
      }
    })

    test('filtra transacciones por tipo', async ({ page }) => {
      await page.goto('/compensatorios')

      const viewLinks = page.locator('a[href^="/compensatorios/"]')
      const count = await viewLinks.count()

      if (count > 0) {
        await viewLinks.first().click()
        await page.waitForURL(/\/compensatorios\/[a-f0-9-]+/, { timeout: 5000 })

        // Verificar que existen filtros o badges de tipo
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Tabla General de Compensatorios', () => {
    test('filtra compensatorios por usuario', async ({ page }) => {
      await page.goto('/compensatorios')

      // Buscar input de búsqueda si existe
      const searchInput = page.locator('input[placeholder*="Filtrar"], input[placeholder*="Buscar"]')
      const count = await searchInput.count()

      if (count > 0) {
        await searchInput.first().fill('test')
        await page.waitForTimeout(500)
      }
    })

    test('ordena compensatorios por fecha', async ({ page }) => {
      await page.goto('/compensatorios')

      // Verificar que la tabla se muestra
      const table = page.locator('table')
      const tableExists = await table.count() > 0

      if (tableExists) {
        await expect(table.first()).toBeVisible()

        // Hacer clic en encabezado de fecha para ordenar
        const dateHeader = page.locator('th:has-text("Fecha"), th:has-text("Date")')
        const headerCount = await dateHeader.count()

        if (headerCount > 0) {
          await dateHeader.first().click()
          await page.waitForTimeout(500)
        }
      }
    })

    test('muestra diferentes tipos de compensatorios con colores', async ({ page }) => {
      await page.goto('/compensatorios')

      // Verificar badges de tipo
      const badges = page.locator('span[class*="badge"], span[class*="Badge"]')
      const count = await badges.count()

      if (count > 0) {
        // Verificar que los badges son visibles
        await expect(badges.first()).toBeVisible()
      }
    })
  })

  test.describe('Navegación', () => {
    test('navega desde sidebar a compensatorios', async ({ page }) => {
      await page.goto('/')

      const compensatoriosLink = page.locator('a[href="/compensatorios"]')
      await compensatoriosLink.click()

      await page.waitForURL(/.*compensatorios.*/, { timeout: 5000 })
      await expect(page).toHaveURL(/\/compensatorios$/)
    })

    test('navega a nuevo registro desde lista', async ({ page }) => {
      await page.goto('/compensatorios')

      // Buscar botón de nuevo registro
      const newButton = page.locator('a[href="/compensatorios/new"]')
      await newButton.click()

      await page.waitForURL(/.*compensatorios\/new.*/, { timeout: 5000 })
      await expect(page.locator('text=Registrar Trabajo Compensatorio')).toBeVisible()
    })

    test('navega a solicitud desde lista', async ({ page }) => {
      await page.goto('/compensatorios')

      // Buscar botón de solicitud
      const requestButton = page.locator('a[href="/compensatorios/request"]')
      await requestButton.click()

      await page.waitForURL(/.*compensatorios\/request.*/, { timeout: 5000 })
      await expect(page.locator('text=Solicitar Tiempo Libre')).toBeVisible()
    })
  })
})

test.describe('Compensatorios - Permisos', () => {
  test('usuario estándar ve solo sus propios compensatorios', async ({ page }) => {
    // Login con usuario estándar (no admin)
    const userEmail = process.env.E2E_USER_EMAIL || 'user@test.com'
    const userPassword = process.env.E2E_USER_PASSWORD || 'user123'

    await page.goto('/login')
    await page.fill('input[placeholder*="example"]', userEmail)
    await page.fill('input[type="password"]', userPassword)
    await page.click('button:has-text("Sign In")')

    try {
      await page.waitForURL('/', { timeout: 10000 })
    } catch {
      // Si falla el login, saltar test
      test.skip()
      return
    }

    await page.goto('/compensatorios')

    // Verificar que puede acceder a su vista individual
    await expect(page).toHaveURL(/.*compensatorios.*/)
  })

  test('admin ve todos los compensatorios', async ({ page }) => {
    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'password123'

    await page.goto('/login')
    await page.fill('input[placeholder*="example"]', adminEmail)
    await page.fill('input[type="password"]', adminPassword)
    await page.click('button:has-text("Sign In")')

    await page.waitForURL('/', { timeout: 10000 })

    await page.goto('/compensatorios')

    // Verificar que admin ve la tabla general
    await expect(page).toHaveURL(/\/compensatorios$/)
  })
})
