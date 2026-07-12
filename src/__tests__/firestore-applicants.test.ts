import { describe, it, expect, vi, beforeEach } from 'vitest'

const fakeDocRef = { id: 'test-applicant-id' }
const mockAddDoc = vi.fn().mockResolvedValue(fakeDocRef)
const mockGetDocs = vi.fn()
const mockSetDoc = vi.fn()
const mockCollection = vi.fn()
const mockDoc = vi.fn()
const mockQuery = vi.fn()
const mockOrderBy = vi.fn()
const mockServerTimestamp = vi.fn().mockReturnValue({ seconds: 0, nanoseconds: 0 })

const mockDb = {}

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: vi.fn(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  serverTimestamp: (...args: unknown[]) => mockServerTimestamp(...args),
}))

vi.mock('../firebase/config', () => ({
  db: mockDb,
  auth: {},
  storage: {},
  functions: {},
  default: {},
}))

const { createApplicant, getApplicants, updateApplicant } = await import('../firebase/firestore')

describe('Applicant Firestore Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createApplicant', () => {
    it('adds a document to the applicants collection', async () => {
      const data = {
        position: 'Maid',
        fullName: 'Chido Dube',
        phone: '0772123456',
        age: 28,
        yearsOfExperience: 5,
        nextOfKinContact: 'Sister - 0773123456',
        education: 'Secondary (O-Level)',
        primaryLanguage: 'Shona',
        nationalIdUrl: 'id.jpg',
        policeClearanceUrl: 'police.jpg',
        status: 'new' as const,
        notes: '',
        reviewedBy: '',
        reviewedAt: null,
        interviewDate: null,
        interviewNotes: '',
        convertedWorkerId: '',
        source: 'join_team_form',
      }

      const id = await createApplicant(data)

      expect(id).toBe('test-applicant-id')
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'applicants')
      expect(mockAddDoc).toHaveBeenCalledTimes(1)
      const addedData = mockAddDoc.mock.calls[0][1]
      expect(addedData.fullName).toBe('Chido Dube')
      expect(addedData.position).toBe('Maid')
      expect(addedData.status).toBe('new')
      expect(addedData.source).toBe('join_team_form')
      expect(addedData.createdAt).toEqual({ seconds: 0, nanoseconds: 0 })
      expect(addedData.updatedAt).toEqual({ seconds: 0, nanoseconds: 0 })
    })
  })

  describe('getApplicants', () => {
    it('returns all applicants ordered by createdAt desc', async () => {
      const fakeDocs = [
        { id: '1', data: () => ({ fullName: 'Alice', position: 'Nanny', status: 'new', createdAt: null }) },
        { id: '2', data: () => ({ fullName: 'Bob', position: 'Chef', status: 'interviewed', createdAt: null }) },
      ]
      mockGetDocs.mockResolvedValue({ docs: fakeDocs, size: 2 })
      mockQuery.mockReturnValue('fake-query')
      mockOrderBy.mockReturnValue('fake-order')

      const results = await getApplicants()

      expect(results).toHaveLength(2)
      expect(results[0].fullName).toBe('Alice')
      expect(results[0].status).toBe('new')
      expect(results[1].fullName).toBe('Bob')
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'applicants')
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
    })

    it('returns empty array when no applicants exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 })
      mockQuery.mockReturnValue('fake-query')
      mockOrderBy.mockReturnValue('fake-order')

      const results = await getApplicants()
      expect(results).toEqual([])
    })
  })

  describe('updateApplicant', () => {
    it('merges data into the applicant document', async () => {
      mockCollection.mockReturnValue('fake-collection-ref')
      mockDoc.mockReturnValue('fake-doc-ref')

      await updateApplicant('applicant-1', {
        status: 'screened',
        notes: 'Good candidate, schedule interview',
      })

      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'applicants')
      expect(mockDoc).toHaveBeenCalledWith('fake-collection-ref', 'applicant-1')
      expect(mockSetDoc).toHaveBeenCalledTimes(1)
      const updateData = mockSetDoc.mock.calls[0][1]
      expect(updateData.status).toBe('screened')
      expect(updateData.notes).toBe('Good candidate, schedule interview')
      expect(updateData.updatedAt).toEqual({ seconds: 0, nanoseconds: 0 })
    })
  })
})
