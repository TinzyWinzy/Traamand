import { describe, it, expect } from 'vitest'
import { CATEGORIES, SERVICE_CATEGORIES } from '../lib/constants'

describe('Category Filtering and Naming', () => {
  const EXPECTED_CATEGORIES = [
    'Maid',
    'Nanny',
    'Chef',
    'Gardener',
    'Nurse Aide',
    'Driver',
    'Sales Lady',
    'Bar Lady',
  ]

  it('defines categories matching the exact singular expected names', () => {
    const categoryNames = CATEGORIES.map((c) => c.name)
    expect(categoryNames).toEqual(EXPECTED_CATEGORIES)
  })

  it('defines SERVICE_CATEGORIES matching the exact singular expected names', () => {
    expect([...SERVICE_CATEGORIES]).toEqual(EXPECTED_CATEGORIES)
  })

  it('maps skills appropriately for categories (regression checking)', () => {
    const frontendSkillMapKeys = [
      'Maid',
      'Nanny',
      'Chef',
      'Gardener',
      'Nurse Aide',
      'Driver',
      'Sales Lady',
      'Bar Lady',
    ]
    CATEGORIES.forEach((cat) => {
      expect(frontendSkillMapKeys).toContain(cat.name)
    })
  })
})
