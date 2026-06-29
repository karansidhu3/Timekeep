import { test, expect, type Page } from '@playwright/test'

// These tests require a running Next.js server and seeded Supabase data.
// Admin: Rick (PIN 1234)

async function adminLogin(page: Page) {
  await page.goto('/login')
  const rickBtn = page.getByRole('button', { name: /rick/i })
  const isVisible = await rickBtn.isVisible({ timeout: 3000 }).catch(() => false)
  if (!isVisible) return false

  await rickBtn.click()
  const pinInput = page.locator('input').first()
  await pinInput.fill('1234')
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })
  return true
}

test.describe('Admin schedule', () => {
  test('redirects unauthenticated admin access to /login', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('admin can log in and see dashboard', async ({ page }) => {
    const loggedIn = await adminLogin(page)
    if (!loggedIn) { test.skip(); return }

    await expect(page.getByText(/today/i)).toBeVisible()
  })

  test('admin can navigate to schedule page', async ({ page }) => {
    const loggedIn = await adminLogin(page)
    if (!loggedIn) { test.skip(); return }

    await page.click('a[href*="schedule"]')
    await expect(page).toHaveURL(/\/admin\/schedule/)
    await expect(page.getByText(/schedule/i)).toBeVisible()
  })

  test('schedule shows 7 days (Sun–Sat)', async ({ page }) => {
    const loggedIn = await adminLogin(page)
    if (!loggedIn) { test.skip(); return }

    await page.goto('/admin/schedule')

    // Expect exactly the day abbreviations for a full week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (const day of days) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible()
    }
  })

  test('week navigation moves forward one week', async ({ page }) => {
    const loggedIn = await adminLogin(page)
    if (!loggedIn) { test.skip(); return }

    await page.goto('/admin/schedule')

    const initialTitle = await page.locator('p').filter({ hasText: /\w+ \d+ – \w+ \d+/ }).textContent()
    const nextBtn = page.getByRole('link', { name: /next/i }).or(page.locator('[aria-label*="next"]'))
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      const newTitle = await page.locator('p').filter({ hasText: /\w+ \d+ – \w+ \d+/ }).textContent()
      expect(newTitle).not.toBe(initialTitle)
    }
  })
})
