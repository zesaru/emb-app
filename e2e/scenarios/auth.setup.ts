/**
 * Auth Setup Script for E2E Tests with Retry Logic
 * Creates authenticated session state to avoid rate limiting
 *
 * Run with: npx playwright test --project=setup
 */

import { test as setup } from '@playwright/test'

const authFile = 'e2e/.auth/admin.json'

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'cdejesus@embperujapan.org'
  const password = process.env.E2E_ADMIN_PASSWORD || 'password123'

  console.log('🔐 Authenticating as admin...')
  console.log('📧 Email:', email)

  let retries = 3
  let authenticated = false

  while (retries > 0 && !authenticated) {
    try {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Add delay to avoid rate limiting
      await page.waitForTimeout(2000)

      await page.fill('input[placeholder*="example"]', email)
      await page.fill('input[type="password"]', password)
      await page.click('button:has-text("Sign In")')

      // Wait for navigation
      await page.waitForTimeout(3000)

      // Check current URL
      const url = page.url()
      console.log('📍 Current URL:', url)

      if (url.includes('error')) {
        if (url.includes('Too many attempts') || url.includes('Could not authenticate')) {
          retries--
          console.log(`⚠️  Rate limited. Retries remaining: ${retries}`)
          console.log('⏳ Waiting 10 seconds before retry...')

          if (retries > 0) {
            await page.waitForTimeout(10000) // Wait 10 seconds
            continue
          } else {
            throw new Error(`Failed after ${retries} retries due to rate limiting: ${url}`)
          }
        } else {
          throw new Error(`Authentication failed with error: ${url}`)
        }
      }

      // Check if we're on dashboard or still on login
      if (url === '/' || url.includes('/dashboard')) {
        authenticated = true
        console.log('✅ Successfully authenticated!')

        // Save authenticated state
        await page.context().storageState({ path: authFile })
        console.log('💾 Saved session to:', authFile)
      } else if (url.includes('/login')) {
        // Still on login page - check if there's an error message
        const errorElement = await page.locator('text=error, text=Error, text=Invalid, text=incorrect').first()
        const hasError = await errorElement.count() > 0

        if (hasError) {
          retries--
          console.log(`⚠️  Login failed. Retries remaining: ${retries}`)

          if (retries > 0) {
            await page.waitForTimeout(10000)
            continue
          } else {
            throw new Error('Failed to authenticate after multiple retries')
          }
        } else {
          // No error but still on login - might just need more time
          await page.waitForTimeout(3000)
          const finalUrl = page.url()

          if (finalUrl === '/' || !finalUrl.includes('/login')) {
            authenticated = true
            console.log('✅ Successfully authenticated!')

            await page.context().storageState({ path: authFile })
            console.log('💾 Saved session to:', authFile)
          }
        }
      } else {
        // Some other URL - assume success
        authenticated = true
        console.log('✅ Authentication successful (redirected to:', url, ')')

        await page.context().storageState({ path: authFile })
        console.log('💾 Saved session to:', authFile)
      }
    } catch (error) {
      retries--
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Error during authentication:`, errorMessage)

      if (retries > 0) {
        console.log(`⏳ Retrying in 10 seconds... (${retries} attempts remaining)`)
        await page.waitForTimeout(10000)
      } else {
        throw error
      }
    }
  }

  if (!authenticated) {
    throw new Error('Failed to authenticate after all retries')
  }
})
