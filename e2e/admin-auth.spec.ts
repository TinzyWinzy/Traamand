import { test, expect } from '@playwright/test'

test.describe('Admin Authentication', () => {
  test('admin can sign in via email and land on dashboard', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const heading = page.locator('h1')
    const hasStaffLogin = (await heading.count()) > 0 && (await heading.nth(0).textContent())?.includes('Staff')
    expect(hasStaffLogin || (await page.locator('text=Staff Login').count()) > 0).toBe(true)

    await page.getByLabel(/email/i).first().fill(process.env.ADMIN_EMAIL || '')
    await page.getByLabel(/password/i).first().fill(process.env.ADMIN_PASSWORD || '')
    await page.getByRole('button', { name: /sign in/i }).first().click()

    await page.waitForURL('**/admin', { timeout: 20000 })
    await expect(page.locator('text=Dashboard').or(page.locator('h1:has-text("Dashboard")'))).toBeVisible({ timeout: 15000 })
  })
})
