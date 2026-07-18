import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockWorker = (overrides: Record<string, unknown> = {}) => ({
  id: 'worker-1',
  firstName: 'Maria',
  lastName: 'Dube',
  displayName: 'Maria D.',
  slug: 'maria-d-harare-maid',
  category: 'Maid',
  verificationStatus: 'verified',
  divineSeal: {
    idVerified: true,
    policeClearance: true,
    referenceVideoUrl: '',
    medicalClearance: true,
    trainingCompleted: true,
    verifiedAt: null,
    verifiedBy: 'admin',
  },
  photos: [],
  bio: 'Experienced maid with 5 years of experience.',
  skills: ['cleaning', 'maid'],
  languages: ['English', 'Shona'],
  experienceYears: 5,
  previousEmployers: 3,
  availability: {
    status: 'available' as const,
    nextAvailable: null,
    preferredLocations: ['Borrowdale'],
    workType: ['live-in' as const],
  },
  rating: 4.5,
  reviewCount: 2,
  recentReviews: [],
  hireCount: 3,
  lastHiredAt: null,
  placementFee: 50,
  monthlySalaryRange: { min: 100, max: 200 },
  metaTitle: 'Maria D. - Maid',
  metaDescription: 'Experienced maid',
  serviceAreas: ['Borrowdale'],
  isActive: true,
  createdAt: { toDate: () => new Date() },
  updatedAt: { toDate: () => new Date() },
  ...overrides,
})

vi.mock('../firebase/firestore', () => ({
  getWorker: vi.fn(),
}))

vi.mock('../lib/structuredData', () => ({
  generateWorkerStructuredData: vi.fn().mockReturnValue({}),
}))

describe('WorkerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders video player when referenceVideoUrl exists', async () => {
    const { getWorker } = await import('../firebase/firestore')
    ;(getWorker as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockWorker({ divineSeal: { ...mockWorker().divineSeal, referenceVideoUrl: 'https://storage.example/intro.mp4' } })
    )

    const { default: WorkerProfile } = await import('../pages/worker/WorkerProfile')
    render(
      <MemoryRouter initialEntries={['/worker/maria-d-harare-maid']}>
        <Routes>
          <Route path="/worker/:slug" element={<WorkerProfile />} />
        </Routes>
      </MemoryRouter>
    )

    const video = await screen.findByTestId('worker-video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://storage.example/intro.mp4')
    expect(video).toHaveAttribute('controls')
  })

  it('shows coming soon placeholder when no referenceVideoUrl', async () => {
    const { getWorker } = await import('../firebase/firestore')
    ;(getWorker as ReturnType<typeof vi.fn>).mockResolvedValue(mockWorker())

    const { default: WorkerProfile } = await import('../pages/worker/WorkerProfile')
    render(
      <MemoryRouter initialEntries={['/worker/maria-d-harare-maid']}>
        <Routes>
          <Route path="/worker/:slug" element={<WorkerProfile />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Introduction video coming soon')).toBeInTheDocument()
    expect(screen.queryByTestId('worker-video')).not.toBeInTheDocument()
  })
})
