import { test, expect } from '@playwright/test';

test.describe('Debug Login Flow', () => {
  test('should login and show dashboard', async ({ page }) => {
    // Ir a la página de login
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Esperar más tiempo por si hay scripts cargando
    await page.waitForTimeout(2000);

    // Screenshot inicial
    await page.screenshot({ path: 'e2e/screenshots/01-page-loaded.png' });

    // Intentar encontrar el input por nombre
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    // Llenar formulario
    await emailInput.fill('cdejesus@embperujapan.org');
    await page.fill('input[name="password"]', 'password123');

    // Screenshot antes de submit
    await page.screenshot({ path: 'e2e/screenshots/02-form-filled.png' });

    // Submit
    await page.click('button:has-text("Sign In")');

    // Esperar navegación
    await page.waitForTimeout(3000);

    // Screenshot final
    await page.screenshot({ path: 'e2e/screenshots/03-after-submit.png' });

    // Verificar URL
    console.log('Final URL:', page.url());
  });
});
