import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../firebase/firestore', () => ({
  createApplicant: vi.fn().mockResolvedValue('mock-applicant-id'),
  updateApplicant: vi.fn().mockResolvedValue(undefined),
  getApplicantsByPhone: vi.fn().mockResolvedValue([]),
}))

vi.mock('../lib/upload', () => ({
  MAX_FILE_SIZE: 20 * 1024 * 1024,
  uploadApplicantFile: vi.fn().mockResolvedValue('https://storage.example/applicant-file.pdf'),
  uploadApplicantPhoto: vi.fn().mockResolvedValue('https://storage.example/photo.jpg'),
  uploadApplicantVideo: vi.fn().mockResolvedValue('https://storage.example/intro.mp4'),
}))

vi.mock('../lib/matching', () => ({
  getMatchingInquiries: vi.fn().mockResolvedValue([]),
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
    expect(screen.getByText('Highest Education')).toBeInTheDocument()
    expect(screen.getByText('Primary Language')).toBeInTheDocument()
    expect(screen.getByText('Next of Kin Contact')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Work Preferences')).toBeInTheDocument()
    expect(screen.getByText('Service Areas')).toBeInTheDocument()
    expect(screen.getByText('Preferred Work Type')).toBeInTheDocument()
    expect(screen.getByText('Availability')).toBeInTheDocument()
  })

  it('renders profile photo and intro video sections', async () => {
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    expect(screen.getByText('Profile Photo')).toBeInTheDocument()
    expect(screen.getByText('Upload Photo')).toBeInTheDocument()
    expect(screen.getByText('Intro Video (Optional)')).toBeInTheDocument()
    expect(screen.getByText('Upload Video')).toBeInTheDocument()
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

  it('shows success screen after form submission with all file types', async () => {
    const { default: JoinTeamForm } = await import('../components/forms/JoinTeamForm')
    render(<JoinTeamForm />)

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Chido Dube/i), { target: { value: 'Test Person' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 0772/i), { target: { value: '0772123456' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. chido@email/i), { target: { value: 'test@email.com' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 28/i), { target: { value: '30' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 5/i), { target: { value: '5' } })
    fireEvent.change(screen.getByPlaceholderText(/name and phone number/i), { target: { value: 'Mother - 0773123456' } })

    const selectElements = screen.getAllByRole('combobox')
    fireEvent.change(selectElements[0], { target: { value: 'Maid' } })
    fireEvent.change(selectElements[1], { target: { value: 'Primary' } })
    fireEvent.change(selectElements[2], { target: { value: 'Shona' } })

    const areaBtn = screen.getByRole('button', { name: /Borrowdale/i })
    fireEvent.click(areaBtn)

    const workTypeBtn = screen.getByRole('button', { name: /Live-In/i })
    fireEvent.click(workTypeBtn)

    const availBtn = screen.getByRole('button', { name: /Immediately/i })
    fireEvent.click(availBtn)

    const fileInputs = document.querySelectorAll('input[type="file"]')
    const pdfFile = new File(['dummy'], 'id.pdf', { type: 'application/pdf' })
    const imgFile = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' })
    const vidFile = new File(['dummy'], 'intro.mp4', { type: 'video/mp4' })
    fireEvent.change(fileInputs[0], { target: { files: [imgFile] } })
    fireEvent.change(fileInputs[1], { target: { files: [vidFile] } })
    fireEvent.change(fileInputs[2], { target: { files: [pdfFile] } })
    fireEvent.change(fileInputs[3], { target: { files: [pdfFile] } })

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))

    await waitFor(() => {
      expect(screen.getByText('Application Received!')).toBeInTheDocument()
    })
    expect(screen.queryByText('Personal Information')).not.toBeInTheDocument()
  })
})
