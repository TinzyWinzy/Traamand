import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../firebase/firestore', () => ({
  createApplicant: vi.fn().mockResolvedValue('mock-applicant-id'),
  updateApplicant: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/upload', () => ({
  uploadApplicantFile: vi.fn().mockResolvedValue('https://storage.example/applicant-file.pdf'),
}))

describe('JoinTeamForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    const combos = screen.getAllByRole('combobox')
    fireEvent.change(combos[0], { target: { value: 'Maid' } })
    fireEvent.change(combos[1], { target: { value: 'Primary' } })
    fireEvent.change(combos[2], { target: { value: 'Shona' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Chido Dube/i), { target: { value: 'Test Person' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 0772/i), { target: { value: '0772123456' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 28/i), { target: { value: '30' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 5/i), { target: { value: '5' } })
    fireEvent.change(screen.getByPlaceholderText(/name and phone number/i), { target: { value: 'Mother - 0773123456' } })

    const fileInputs = document.querySelectorAll('input[type="file"]')
    const file = new File(['dummy'], 'id.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInputs[0], { target: { files: [file] } })
    fireEvent.change(fileInputs[1], { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))

    await waitFor(() => {
      expect(screen.getByText('Application Received!')).toBeInTheDocument()
    })
    expect(screen.queryByText('Personal Information')).not.toBeInTheDocument()
  })
})
