# E2E Scenario Architect - Ejemplos

## Ejemplo 1: Flujo completo de login y aprobación de vacaciones

```typescript
// e2e/scenarios/vacations.spec.ts
import { test, expect } from '../fixtures/admin-auth'

test.describe('Aprobación de Vacaciones', () => {
  test('admin puede aprobar solicitud de vacaciones', async ({ adminPage }) => {
    // Navegar a vacaciones
    await adminPage.getByRole('link', { name: /vacaciones/i }).click()

    // Esperar que cargue la tabla
    await expect(adminPage.getByRole('table')).toBeVisible()

    // Click en botón aprobar de la primera fila
    await adminPage.locator('tr').first().getByRole('button', { name: /aprobar/i }).click()

    // Verificar mensaje de éxito
    await expect(adminPage.getByText(/vacación aprobada/i)).toBeVisible()
  })

  test('usuario ve sus solicitudes de vacaciones', async ({ page }) => {
    // Login como usuario regular
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navegar a vacaciones
    await page.getByRole('link', { name: /vacaciones/i }).click()

    // Verificar que se muestra la lista
    await expect(page.getByRole('table')).toBeVisible()
  })
})
```

## Ejemplo 2: Registro de compensatorio

```typescript
// e2e/scenarios/compensatory.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Registro de Compensatorio', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('registro exitoso de horas trabajadas', async ({ page }) => {
    // Navegar a nuevo compensatorio
    await page.getByRole('link', { name: /compensatorios/i }).click()
    await page.getByRole('link', { name: /nuevo/i }).click()

    // Llenar formulario
    await page.fill('input[name="eventName"]', 'Trabajo extra fin de semana')
    await page.fill('input[name="eventDate"]', '2025-01-15')
    await page.fill('input[name="hours"]', '8')
    await page.fill('input[name="tTimeStart"]', '09:00')
    await page.fill('input[name="tTimeFinish"]', '18:00')

    // Submit
    await page.click('button[type="submit"]')

    // Verificar redirección y mensaje
    await expect(page).toHaveURL(/.*compensatorios/)
    await expect(page.getByText(/registrado/i)).toBeVisible()
  })

  test('valida horas máximas por día', async ({ page }) => {
    await page.goto('/compensatorios/new')

    // Intentar registrar más de 12 horas
    await page.fill('input[name="hours"]', '13')
    await page.click('button[type="submit"]')

    // Verificar error
    await expect(page.getByText(/máximo 12 horas/i)).toBeVisible()
  })
})
```

## Ejemplo 3: Asistencia

```typescript
// e2e/scenarios/attendance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Registro de Asistencia', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('admin puede modificar asistencia', async ({ page }) => {
    await page.goto('/attendances')

    // Click en editar primera fila
    await page.locator('tr').first().getByRole('button', { name: /editar/i }).click()

    // Cambiar valor
    await page.getByRole('combobox').selectOption('1')

    // Guardar
    await page.click('button[type="submit"]')

    // Verificar éxito
    await expect(page.getByText(/actualizado/i)).toBeVisible()
  })
})
```

## Ejemplo 4: Protected Routes

```typescript
// e2e/scenarios/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test('redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/vacaciones')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('login exitoso redirige al dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('logout cierra sesión', async ({ page }) => {
    // Login primero
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Logout
    await page.getByRole('button', { name: /cerrar sesión/i }).click()

    // Verificar redirección
    await expect(page).toHaveURL(/.*login.*/)
  })
})
```
