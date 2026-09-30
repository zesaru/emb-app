/**
 * Smoke test simple para verificar configuración de Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Smoke Test', () => {
  test('verifica que la aplicación responde', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/login')

    // Verificar que la página carga (case-insensitive)
    await expect(page).toHaveTitle(/.*Emb.*/i)

    // Verificar que hay un formulario de login
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  test('redirige al visitante sin sesión al login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })
})
