import { describe, it, expect } from 'vitest'

type ApplicantStatus =
  | 'new'
  | 'screened'
  | 'interviewed'
  | 'training'
  | 'approved'
  | 'converted'
  | 'rejected'

const NEXT_STAGES: Record<ApplicantStatus, ApplicantStatus[]> = {
  new: ['screened', 'rejected'],
  screened: ['interviewed', 'rejected'],
  interviewed: ['training', 'approved', 'rejected'],
  training: ['approved', 'rejected'],
  approved: ['converted'],
  converted: [],
  rejected: [],
}

const ALL_STAGES: ApplicantStatus[] = [
  'new', 'screened', 'interviewed', 'training',
  'approved', 'converted', 'rejected',
]

describe('Applicant Pipeline Stages', () => {
  it('has valid transitions for every stage', () => {
    for (const stage of ALL_STAGES) {
      const next = NEXT_STAGES[stage]
      expect(Array.isArray(next)).toBe(true)
      for (const n of next) {
        expect(ALL_STAGES).toContain(n)
      }
    }
  })

  it('new can only move to screened or rejected', () => {
    expect(NEXT_STAGES['new']).toEqual(['screened', 'rejected'])
  })

  it('screened can move to interviewed or rejected', () => {
    expect(NEXT_STAGES['screened']).toEqual(['interviewed', 'rejected'])
  })

  it('interviewed can move to training, approved, or rejected', () => {
    expect(NEXT_STAGES['interviewed']).toEqual(['training', 'approved', 'rejected'])
  })

  it('training can move to approved or rejected', () => {
    expect(NEXT_STAGES['training']).toEqual(['approved', 'rejected'])
  })

  it('approved can only move to converted', () => {
    expect(NEXT_STAGES['approved']).toEqual(['converted'])
  })

  it('converted has no next stages (terminal)', () => {
    expect(NEXT_STAGES['converted']).toEqual([])
  })

  it('rejected has no next stages (terminal)', () => {
    expect(NEXT_STAGES['rejected']).toEqual([])
  })

  it('all valid statuses are forward-only (no reverse moves)', () => {
    for (const from of ALL_STAGES) {
      for (const to of NEXT_STAGES[from]) {
        const fromIdx = ALL_STAGES.indexOf(from)
        const toIdx = ALL_STAGES.indexOf(to)
        expect(toIdx).toBeGreaterThan(fromIdx)
      }
    }
  })
})
