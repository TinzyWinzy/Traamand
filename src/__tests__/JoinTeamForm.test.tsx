import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockUseForm = vi.fn()

vi.mock('@formspree/react', () => ({
  useForm: (...args: unknown[]) => mockUseForm(...args),
}))

vi.mock('../firebase/firestore', () => ({
  createApplicant: vi.fn().mockResolvedValue('mock-applicant-id'),
}))

describe('JoinTeamForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseForm.mockReturnValue([
      { submitting: false, succeeded: false },
      vi.fn(),
    ])
  })

  it('renders all form fields', async () => {
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('Position Applying For')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Phone Number')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
    expect(screen.getByText('Years of Experience')).toBeInTheDocument()
    expect(screen.getByText('Highest Level of Education')).toBeInTheDocument()
    expect(screen.getByText('Primary Language')).toBeInTheDocument()
    expect(screen.getByText('Next of Kin Contact')).toBeInTheDocument()
    expect(screen.getByText('Required Documents')).toBeInTheDocument()
  })

  it('renders selling points section', async () => {
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    expect(screen.getByText(/Immediate Job Placement/)).toBeInTheDocument()
    expect(screen.getByText(/Flexible Working Hours/)).toBeInTheDocument()
    expect(screen.getByText(/Trusted Employers/)).toBeInTheDocument()
    expect(screen.getByText(/Good Pay Structures/)).toBeInTheDocument()
  })

  it('renders all service categories in a select', async () => {
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    const options = screen.getAllByRole('option')
    const labels = options.map((o) => o.textContent)
    expect(labels).toContain('Maid')
    expect(labels).toContain('Nanny')
    expect(labels).toContain('Chef')
    expect(labels).toContain('Gardener')
    expect(labels).toContain('Nurse Aide')
    expect(labels).toContain('Driver')
    expect(labels).toContain('Sales Lady')
    expect(labels).toContain('Bar Lady')
  })

  it('has a submit button', async () => {
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument()
  })

  it('shows success screen after form submission', async () => {
    mockUseForm.mockReturnValue([
      { submitting: false, succeeded: true },
      vi.fn(),
    ])

    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    expect(await screen.findByText('Application Received!')).toBeInTheDocument()
    expect(screen.queryByText('Personal Information')).not.toBeInTheDocument()
  })
})
