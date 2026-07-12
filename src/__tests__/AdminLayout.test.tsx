import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}))

vi.mock('../firebase/config', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
}))

const createMockStore = (role: string = 'admin') => ({
  user: {
    id: 'admin-1',
    name: 'Admin User',
    role,
    phone: '0771111111',
    email: 'admin@traamand.co.zw',
    whatsappNumber: '0771111111',
    addresses: [],
    bookings: [],
    favoriteWorkers: [],
    createdAt: null,
  },
  firebaseUser: null,
  isAuthenticated: true,
  isLoading: false,
  setUser: vi.fn(),
  setFirebaseUser: vi.fn(),
  setLoading: vi.fn(),
  clearAuth: vi.fn(),
})

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '../stores/authStore'

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(createMockStore('admin'))
  })

  it('renders all navigation items in the sidebar', async () => {
    const { default: AdminLayout } = await import('../components/admin/AdminLayout')

    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Applicants')).toBeInTheDocument()
    expect(screen.getByText('Workers')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
    expect(screen.getByText('Payments')).toBeInTheDocument()
  })

  it('displays the admin user name and role', async () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockStore('admin'))

    const { default: AdminLayout } = await import('../components/admin/AdminLayout')

    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    )

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('renders the Traamand brand in the sidebar', async () => {
    const { default: AdminLayout } = await import('../components/admin/AdminLayout')

    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    )

    const brandElements = screen.getAllByText('Traamand')
    expect(brandElements.length).toBeGreaterThanOrEqual(1)
  })

  it('includes a Sign Out button', async () => {
    const { default: AdminLayout } = await import('../components/admin/AdminLayout')

    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    )

    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('navigates away on Sign Out click', async () => {
    const { default: AdminLayout } = await import('../components/admin/AdminLayout')

    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    )

    screen.getByText('Sign Out').click()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sign-in')
    })
  })
})
