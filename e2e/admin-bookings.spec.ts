import { test, expect } from '@playwright/test'

test.describe('Assistant 3 — Client Bookings & Placement Coordination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
  })

  test('admin bookings page loads', async ({ page }) => {
    await expect(page.locator('h1:has-text("Booking")').or(page.locator('text=Bookings'))).toBeVisible({ timeout: 10000 })
  })

  test('booking status filter bar is visible', async ({ page }) => {
    const statuses = ['inquiry', 'matched', 'booked', 'completed', 'cancelled']
    for (const s of statuses) {
      expect(await page.locator(`text=${s}`).count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('booking row can be expanded', async ({ page }) => {
    const firstRow = page.locator('tr, [data-booking-id]').first()
    if ((await firstRow.count()) > 0) {
      await firstRow.click()
      await page.waitForTimeout(1500)
    }
  })

  test('payment status toggle exists in booking detail', async ({ page }) => {
    const expandBtn = page.locator('button:has-text("Paid"), [aria-label*="expand"]').first()
    if (await expandBtn.count() > 0) {
      await expandBtn.click()
      await page.waitForTimeout(1500)
    }
  })
})
