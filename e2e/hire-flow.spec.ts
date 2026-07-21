import { test, expect } from '@playwright/test'

test.describe('Public Client Flow — Hire Page', () => {
  test('landing page loads and shows 8 category cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const cards = page.locator('a[href^="/hire/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(8)

    const availableTexts = await cards.locator('span:has-text("available")').allTextContents()
    expect(availableTexts.length).toBeGreaterThan(0)
  })

  test('category hire page loads without error', async ({ page }) => {
    await page.goto('/hire/maids', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await expect(page.locator('h1')).toContainText('Maid')
    await expect(page.getByText('Category not found')).not.toBeVisible()
  })

  test('worker profile page has booking CTA', async ({ page }) => {
    await page.goto('/hire/maids', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const workerLink = page.locator('[href*="/worker/"]').first()
    if ((await workerLink.count()) > 0) {
      await workerLink.click()
      await page.waitForURL('**/worker/**', { timeout: 15000 })
      const bookBtn = page.getByRole('link', { name: /hire|book/i }).or(page.locator('[href*="/book"]'))
      expect(await bookBtn.count()).toBeGreaterThan(0)
    }
  })

  test('join team page loads', async ({ page }) => {
    await page.goto('/join-our-team', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    await expect(page.getByLabel(/full name/i).or(page.locator('h1:has-text("Domestic Worker Jobs")'))).toBeVisible({ timeout: 30000 })
  })
})
