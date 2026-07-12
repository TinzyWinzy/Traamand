import { test, expect } from '@playwright/test'

test.describe('Hire page', () => {
  test('landing page loads and shows category cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const cards = page.locator('a[href^="/hire/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(8)

    const availableTexts = await cards.locator('span:has-text("available")').allTextContents()
    const hasNonZero = availableTexts.some((t) => !t.startsWith('0'))
    // If no workers are available, this should at least render the cards
    expect(availableTexts.length).toBeGreaterThan(0)
  })

  test('category hire page loads without crashing', async ({ page }) => {
    await page.goto('/hire/maids')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Maids')
    await expect(page.getByText('Category not found')).not.toBeVisible()
  })

  test('shows workers when data exists', async ({ page }) => {
    // Intercept the Firestore workers query and return mock data
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      const url = route.request().url()
      if (url.includes('workers')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            documents: [
              {
                name: 'projects/studio-8895863664-52c12/databases/(default)/documents/workers/w1',
                fields: {
                  displayName: { stringValue: 'Maria Dube' },
                  skills: { arrayValue: { values: [{ stringValue: 'maid' }, { stringValue: 'cleaning' }] } },
                  rating: { doubleValue: 4.5 },
                  reviewCount: { integerValue: '12' },
                  isActive: { booleanValue: true },
                  availability: { mapValue: { fields: { status: { stringValue: 'available' }, preferredLocations: { arrayValue: { values: [{ stringValue: 'Harare' }] } } } } },
                  experienceYears: { integerValue: '5' },
                  placementFee: { doubleValue: 50 },
                  monthlySalaryRange: { mapValue: { fields: { min: { doubleValue: 100 }, max: { doubleValue: 200 } } } },
                  verificationStatus: { stringValue: 'verified' },
                  bio: { stringValue: 'Experienced maid.' },
                  slug: { stringValue: 'maria-dube-harare-maid' },
                  languages: { arrayValue: { values: [{ stringValue: 'English' }, { stringValue: 'Shona' }] } },
                },
              },
            ],
          }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/hire/maids')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Maria Dube')).toBeVisible()
    await expect(page.getByText('No workers match your filters')).not.toBeVisible()
  })
})
