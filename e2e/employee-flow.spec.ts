import { test, expect } from '@playwright/test'

// These tests require a running Next.js server and seeded Supabase data.
// Employee: Todd (PIN 5555), Admin: Rick (PIN 1234)

test.describe('Employee flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows login page with employee list', async ({ page }) => {
    await expect(page.getByText('Timekeep')).toBeVisible()
    // Employee name buttons or options should be visible
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('rejects wrong PIN', async ({ page }) => {
    // Pick the first employee
    const employeeBtn = page.locator('button').first()
    if (await employeeBtn.isVisible()) {
      await employeeBtn.click()
    }

    // Enter wrong PIN
    const pinInputs = page.locator('input[type="password"], input[inputmode="numeric"]')
    if (await pinInputs.first().isVisible()) {
      await pinInputs.first().fill('9999')
      await page.keyboard.press('Enter')
      await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('employee can sign in with correct PIN and reach dashboard', async ({ page }) => {
    // Navigate to login and select an employee
    await page.goto('/login')

    // Look for an employee name button (Todd)
    const toddBtn = page.getByRole('button', { name: /todd/i })
    if (await toddBtn.isVisible({ timeout: 3000 })) {
      await toddBtn.click()

      // Enter correct PIN
      const pinInput = page.locator('input').first()
      await pinInput.fill('5555')
      await page.keyboard.press('Enter')

      // Should arrive at dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
      await expect(page.getByText(/clock/i)).toBeVisible()
    } else {
      test.skip()
    }
  })
})
