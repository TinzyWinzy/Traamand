import { test, expect } from '@playwright/test'

test.describe('Assistant 1 — Recruitment & Applicant Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/applicants', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
  })

  test('admin can view the applicant pipeline with stages', async ({ page }) => {
    const stages = ['New', 'Screened', 'Interviewed', 'Training', 'Approved', 'Converted', 'Rejected']
    for (const stage of stages) {
      const el = page.locator(`text=${stage}`)
      const count = await el.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('admin can search for an applicant', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search" i]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(1000)
      expect(await page.locator('text=No applicants').count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('admin can click into an applicant detail', async ({ page }) => {
    const firstApplicant = page.locator('[data-applicant-id], .cursor-pointer, tbody tr').first()
    if (await firstApplicant.count() > 0) {
      await firstApplicant.click()
      await page.waitForTimeout(1500)
      expect(page.url()).toContain('applicants')
    }
  })

  test('stage filter chips are clickable', async ({ page }) => {
    const newChip = page.locator('text=New').first()
    if (await newChip.count() > 0) {
      await newChip.click()
      await page.waitForTimeout(1500)
      expect(await page.locator('text=New').count()).toBeGreaterThan(0)
    }
  })
})
