# E2E Scenario Architect - Instrucciones

## Fixtures de autenticación

```typescript
// e2e/fixtures/admin-auth.ts
import { test as base } from '@playwright/test'

export const test = base.extend<{
  adminPage: Page
}>({
  adminPage: async ({ page }, use) => {
    // Usar usuario de prueba de Supabase
    await page.goto('/login')
    await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL!)
    await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await use(page)
  },
})

export const expect = test.expect
```

```typescript
// e2e/fixtures/user-auth.ts
import { test as base } from '@playwright/test'

export const test = base.extend<{
  userPage: Page
}>({
  userPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', process.env.E2E_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.E2E_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await use(page)
  },
})
```

## Variables de entorno requeridas

```bash
# .env.test
E2E_ADMIN_EMAIL=admin@test.com
E2E_ADMIN_PASSWORD=test_admin_password
E2E_USER_EMAIL=user@test.com
E2E_USER_PASSWORD=test_user_password
```

## Setup de datos de prueba

```typescript
// scripts/setup-e2e.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.E2E_SUPABASE_URL!,
  process.env.E2E_SUPABASE_SERVICE_KEY!
)

async function setupTestData() {
  // Crear usuario admin de prueba
  const { error } = await supabase.auth.signUp({
    email: process.env.E2E_ADMIN_EMAIL!,
    password: process.env.E2E_ADMIN_PASSWORD!,
  })

  if (error) throw error
  console.log('Usuario de prueba creado')
}

setupTestData()
```

## Page Object Model

```typescript
// e2e/pages/dashboard.page.ts
import { type Page, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly vacationLink
  readonly compensatoryLink

  constructor(page: Page) {
    this.page = page
    this.vacationLink = page.getByRole('link', { name: /vacaciones/i })
    this.compensatoryLink = page.getByRole('link', { name: /compensatorios/i })
  }

  async goto() {
    await this.page.goto('/')
  }

  async navigateToVacations() {
    await this.vacationLink.click()
    await expect(this.page).toHaveURL(/.*vacaciones/)
  }
}
```
