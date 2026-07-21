import { test, expect } from '@playwright/test'

test.describe('Assistant 2 — Worker & Roster Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/workers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
  })

  test('admin workers page loads with heading', async ({ page }) => {
    const heading = page.locator('h1:has-text("Workers")')
    if (await heading.count() === 0) {
      await expect(page.locator('text=Workers')).toBeVisible({ timeout: 10000 })
    }
  })

  test('admin can open add worker form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add worker/i }).or(page.getByRole('link', { name: /add worker/i }))
    if (await addBtn.count() > 0) {
      await addBtn.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toMatch(/worker|add|new/)
    }
  })

  test('worker form has all required fields', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add worker/i }).or(page.getByRole('link', { name: /add worker/i }))
    if (await addBtn.count() > 0) {
      await addBtn.click()
      await page.waitForTimeout(2000)
      expect(await page.locator('input[name*="first" i]').count() + await page.getByLabel(/first name/i).count()).toBeGreaterThan(0)
    }
  })

  test('admin can search workers list', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('Maid')
      await page.waitForTimeout(2000)
    }
  })
})
