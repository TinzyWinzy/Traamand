import { useState, type FormEvent } from 'react'
import { Check, Upload } from 'lucide-react'
import { HARARE_SUBURBS, EXPERIENCE_LEVELS } from '../../lib/constants'

interface FormData {
  fullName: string
  phone: string
  email: string
  suburb: string
  experience: string
  availability: string
  refName: string
  refPhone: string
  notes: string
}

const INITIAL: FormData = {
  fullName: '',
  phone: '',
  email: '',
  suburb: '',
  experience: '',
  availability: '',
  refName: '',
  refPhone: '',
  notes: '',
}

export default function JoinTeamForm() {
  const [data, setData] = useState<FormData>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [nationalId, setNationalId] = useState<File | null>(null)
  const [policeClearance, setPoliceClearance] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'nationalId' | 'policeClearance', string>>>({})

  const update = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData | 'nationalId' | 'policeClearance', string>> = {}

    if (!data.fullName.trim()) errs.fullName = 'Full name is required'
    if (!data.phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^0[0-9]{9}$/.test(data.phone.replace(/[\s-]/g, '')))
      errs.phone = 'Enter a valid Zimbabwe phone number'
    if (!data.suburb) errs.suburb = 'Select your suburb'
    if (!data.experience) errs.experience = 'Select your experience level'
    if (!data.availability.trim()) errs.availability = 'Tell us your availability'
    if (!data.refName.trim()) errs.refName = 'Reference name is required'
    if (!data.refPhone.trim()) errs.refPhone = 'Reference phone is required'
    if (!nationalId) errs.nationalId = 'National ID is required'
    if (!policeClearance) errs.policeClearance = 'Police clearance is required'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-brand-navy">Application Received!</h3>
        <p className="mt-3 text-gray-600">
          Thank you, {data.fullName}. We&apos;ll review your application and get back to you
          within 48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-navy">Personal Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          All information is kept confidential and used only for recruitment.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name" error={errors.fullName}>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Chido Dube"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="e.g. 0772 123 456"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email (optional)">
            <input
              type="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="e.g. chido@example.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            />
          </Field>
          <Field label="Suburb" error={errors.suburb}>
            <select
              value={data.suburb}
              onChange={(e) => update('suburb', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value="">Select your suburb</option>
              {HARARE_SUBURBS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Experience Level" error={errors.experience}>
            <select
              value={data.experience}
              onChange={(e) => update('experience', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value="">Select experience</option>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </Field>
          <Field label="Availability" error={errors.availability}>
            <input
              type="text"
              value={data.availability}
              onChange={(e) => update('availability', e.target.value)}
              placeholder="e.g. Full-time, Weekdays only"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            />
          </Field>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="mb-1 text-sm font-semibold text-brand-navy">Documents</h3>
          <p className="mb-4 text-xs text-gray-500">Upload clear scans or photos</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <FileUpload
              label="National ID"
              error={errors.nationalId}
              file={nationalId}
              onChange={setNationalId}
            />
            <FileUpload
              label="Police Clearance"
              error={errors.policeClearance}
              file={policeClearance}
              onChange={setPoliceClearance}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-brand-navy">Reference</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Reference Full Name" error={errors.refName}>
              <input
                type="text"
                value={data.refName}
                onChange={(e) => update('refName', e.target.value)}
                placeholder="Previous employer or supervisor"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
              />
            </Field>
            <Field label="Reference Phone" error={errors.refPhone}>
              <input
                type="tel"
                value={data.refPhone}
                onChange={(e) => update('refPhone', e.target.value)}
                placeholder="e.g. 0772 987 654"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
              />
            </Field>
          </div>
        </div>

        <Field label="Additional Notes (optional)">
          <textarea
            value={data.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            placeholder="Any relevant experience or skills you'd like to highlight..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-red px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-red-dark active:scale-[0.98]"
        >
          Submit Application
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
    </div>
  )
}

function FileUpload({
  label,
  error,
  file,
  onChange,
}: {
  label: string
  error?: string
  file: File | null
  onChange: (f: File | null) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition ${
          file
            ? 'border-green-400 bg-green-50'
            : error
              ? 'border-brand-red bg-brand-red-light'
              : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Upload className={`h-6 w-6 ${file ? 'text-green-500' : 'text-gray-400'}`} />
        {file ? (
          <span className="font-medium text-green-700">{file.name}</span>
        ) : (
          <span className="text-gray-500">Click to upload</span>
        )}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
    </div>
  )
}
