import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import type { Applicant } from '../types'

const mockNavigate = vi.fn()
const mockGetDocs = vi.fn()
const mockUpdateDoc = vi.fn()
const mockAddDoc = vi.fn()
const mockCollection = vi.fn()
const mockDoc = vi.fn()
const mockQuery = vi.fn()
const mockOrderBy = vi.fn()
const mockServerTimestamp = vi.fn().mockReturnValue({ seconds: 0, nanoseconds: 0 })

const mockDb = {}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLimit = vi.fn().mockImplementation((n: number) => `limit-${n}`)

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  setDoc: vi.fn(),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  serverTimestamp: (...args: unknown[]) => mockServerTimestamp(...args),
}))

vi.mock('../firebase/config', () => ({
  db: mockDb,
  auth: {},
  storage: {},
  functions: {},
  vertexAI: {} as any,
}))

vi.mock('../lib/whatsapp', () => ({
  WHATSAPP_NUMBERS: {
    applications: '+263782329308',
    bookings: '+263715325922',
    general: '+263777566584',
  },
  generateApplicantAdminMessage: () => 'admin applicant message',
  generateApplicantPipelineMessage: () => 'applicant status message',
  generateWhatsAppUrl: () => 'https://wa.me/263771234567',
}))

const createMockStore = (overrides: Record<string, unknown> = {}) => ({
  user: {
    id: 'admin-1',
    name: 'Admin User',
    role: 'admin',
    phone: '',
    email: '',
    whatsappNumber: '',
    addresses: [],
    bookings: [],
    favoriteWorkers: [],
    createdAt: null,
  },
  firebaseUser: null,
  isAuthenticated: true,
  isLoading: false,
  ...overrides,
})

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '../stores/authStore'

const makeApplicant = (overrides: Partial<Applicant> = {}): Applicant => ({
  id: 'app-1',
  position: 'Maid',
  fullName: 'Chido Dube',
  phone: '0772123456',
  age: 28,
  yearsOfExperience: 5,
  nextOfKinContact: 'Sister - 0773123456',
  education: 'Secondary (O-Level)',
  primaryLanguage: 'Shona',
  nationalIdUrl: 'id.pdf',
  policeClearanceUrl: 'clearance.pdf',
  status: 'new',
  notes: '',
  reviewedBy: '',
  reviewedAt: null,
  interviewDate: null,
  interviewNotes: '',
  convertedWorkerId: '',
  source: 'join_team_form',
  userId: '',
  createdAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
  updatedAt: { seconds: 0, nanoseconds: 0 } as Timestamp,
  ...overrides,
})

const fakeDocs = (items: Applicant[]) =>
  items.map((a) => ({ id: a.id, data: () => a }))

describe('AdminApplicants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(createMockStore())
    mockGetDocs.mockResolvedValue({ docs: [], size: 0 })
    mockQuery.mockReturnValue('fake-query')
    mockOrderBy.mockReturnValue('fake-order')
    mockCollection.mockReturnValue('fake-collection')
  })

  it('redirects to sign-in when user is not admin', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createMockStore({ user: { ...createMockStore().user, role: 'client' }, isAuthenticated: true })
    )
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    expect(mockNavigate).toHaveBeenCalledWith('/sign-in')
  })

  it('shows empty state when no applicants exist', async () => {
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    expect(await screen.findByText('No applicants found.')).toBeInTheDocument()
  })

  it('renders applicant names in table view', async () => {
    mockGetDocs.mockResolvedValue({
      docs: fakeDocs([
        makeApplicant({ id: '1', fullName: 'Alice Ndlovu', position: 'Nanny' }),
        makeApplicant({ id: '2', fullName: 'Bob Zulu', position: 'Chef', status: 'interviewed' }),
      ]),
      size: 2,
    })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    expect(await screen.findByText('Alice Ndlovu')).toBeInTheDocument()
    expect(screen.getByText('Bob Zulu')).toBeInTheDocument()
    expect(screen.getByText(/Nanny/)).toBeInTheDocument()
  })

  it('filters by search query', async () => {
    mockGetDocs.mockResolvedValue({
      docs: fakeDocs([
        makeApplicant({ id: '1', fullName: 'Alice Ndlovu', position: 'Nanny' }),
        makeApplicant({ id: '2', fullName: 'Bob Zulu', position: 'Chef' }),
      ]),
      size: 2,
    })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    expect(await screen.findByText('Alice Ndlovu')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search by name, position, or phone...'), {
      target: { value: 'Bob' },
    })
    expect(screen.getByText('Bob Zulu')).toBeInTheDocument()
    expect(screen.queryByText('Alice Ndlovu')).not.toBeInTheDocument()
  })

  it('expands to show applicant details', async () => {
    mockGetDocs.mockResolvedValue({
      docs: fakeDocs([makeApplicant({ id: '1', fullName: 'Alice Ndlovu', age: 30, phone: '0771123456', education: 'Form 4' })]),
      size: 1,
    })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Alice Ndlovu'))
    expect(await screen.findByText('0771123456')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Form 4')).toBeInTheDocument()
  })

  it('shows pipeline stage buttons in kanban view for a new applicant', async () => {
    mockGetDocs.mockResolvedValue({
      docs: fakeDocs([makeApplicant({ id: '1', fullName: 'Alice Ndlovu', status: 'new' })]),
      size: 1,
    })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)

    // Wait for loading to finish, then switch to kanban view
    const kanbanBtn = await screen.findByText('Kanban')
    fireEvent.click(kanbanBtn)

    const screenedBtn = await screen.findByText('Move to screened')
    expect(screenedBtn).toBeInTheDocument()
    expect(screen.getByText('Move to rejected')).toBeInTheDocument()
  })

  it('shows Convert to Worker button for approved applicants in expanded table view', async () => {
    mockGetDocs.mockResolvedValue({
      docs: fakeDocs([makeApplicant({ id: '1', fullName: 'Alice Ndlovu', status: 'approved' })]),
      size: 1,
    })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Alice Ndlovu'))
    expect(await screen.findByRole('button', { name: /Convert to Worker Profile/i })).toBeInTheDocument()
  })

  it('shows converted badge when expanded', async () => {
    mockGetDocs.mockResolvedValue({
      docs: fakeDocs([makeApplicant({ id: '1', fullName: 'Alice Ndlovu', status: 'converted', convertedWorkerId: 'worker-123' })]),
      size: 1,
    })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    fireEvent.click(await screen.findByText('Alice Ndlovu'))
    expect(await screen.findByText(/Converted to worker/i)).toBeInTheDocument()
  })

  it('switches between table and kanban view', async () => {
    mockGetDocs.mockResolvedValue({ docs: [], size: 0 })
    const { default: AdminApplicants } = await import('../pages/admin/applicants/AdminApplicants')
    render(<MemoryRouter><AdminApplicants /></MemoryRouter>)
    expect(await screen.findByText('Applicant Pipeline')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Kanban'))
    expect(screen.getByText('Table')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Table'))
    expect(screen.getByText('Kanban')).toBeInTheDocument()
  })
})
