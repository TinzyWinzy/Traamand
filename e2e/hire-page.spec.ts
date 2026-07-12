import { test, expect } from '@playwright/test'

test.describe('Hire page', () => {
  test('landing page loads and shows category cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const cards = page.locator('a[href^="/hire/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(8)

    const availableTexts = await cards.locator('span:has-text("available")').allTextContents()
    expect(availableTexts.length).toBeGreaterThan(0)
  })

  test('category hire page loads without crashing', async ({ page }) => {
    await page.goto('/hire/maids', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await expect(page.locator('h1')).toContainText('Maid')
    await expect(page.getByText('Category not found')).not.toBeVisible()
  })
})
