import { useState } from 'react'
import { useForm } from '@formspree/react'
import { Check, Upload, Loader2, Briefcase, Clock, Building2, TrendingUp } from 'lucide-react'
import { HARARE_SUBURBS, EXPERIENCE_LEVELS } from '../../lib/constants'

const FORM_ID = 'mrewbdrv'

const SELLING_POINTS = [
  { icon: Briefcase, text: 'Immediate Job Placement — quick matching with families and businesses looking for help.' },
  { icon: Clock, text: 'Flexible Working Hours — full-time, part-time, or live-out arrangements to suit your schedule.' },
  { icon: Building2, text: 'Trusted Employers — we screen households to ensure a safe, reliable working environment.' },
  { icon: TrendingUp, text: 'Good Pay Structures — we advocate for fair, market-rate wages for all placed workers.' },
]

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
  const [state, handleSubmit] = useForm(FORM_ID)
  const [nationalIdName, setNationalIdName] = useState('')
  const [policeClearanceName, setPoliceClearanceName] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'nationalId' | 'policeClearance', string>>>({})
  const [didValidate, setDidValidate] = useState(false)

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
    if (!nationalIdName) errs.nationalId = 'National ID is required'
    if (!policeClearanceName) errs.policeClearance = 'Police clearance is required'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDidValidate(true)
    if (!validate()) return
    handleSubmit(e)
  }

  if (state.succeeded) {
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
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {SELLING_POINTS.map((pt) => (
          <div key={pt.text} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal-light text-brand-teal">
              <pt.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-gray-700">{pt.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
        <input type="hidden" name="fullName" value={data.fullName} />
        <input type="hidden" name="phone" value={data.phone} />
        <input type="hidden" name="email" value={data.email} />
        <input type="hidden" name="suburb" value={data.suburb} />
        <input type="hidden" name="experience" value={data.experience} />
        <input type="hidden" name="availability" value={data.availability} />
        <input type="hidden" name="refName" value={data.refName} />
        <input type="hidden" name="refPhone" value={data.refPhone} />
        <input type="hidden" name="notes" value={data.notes} />
        <input type="hidden" name="nationalId" value={nationalIdName} />
        <input type="hidden" name="policeClearance" value={policeClearanceName} />
        <input type="hidden" name="_subject" value="New Job Seeker Application - Join Our Team" />

        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-navy">Personal Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            All information is kept confidential and used only for recruitment.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" error={didValidate ? errors.fullName : undefined}>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="e.g. Chido Dube"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
              />
            </Field>
            <Field label="Phone Number" error={didValidate ? errors.phone : undefined}>
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
            <Field label="Suburb" error={didValidate ? errors.suburb : undefined}>
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
            <Field label="Experience Level" error={didValidate ? errors.experience : undefined}>
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
            <Field label="Availability" error={didValidate ? errors.availability : undefined}>
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
            <h3 className="mb-1 text-sm font-semibold text-brand-navy">Required Documents</h3>
            <p className="mb-4 text-xs text-gray-500">Upload clear scans or photos</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <FileUpload
                label="National ID"
                error={didValidate ? errors.nationalId : undefined}
                fileName={nationalIdName}
                onChange={(name) => setNationalIdName(name)}
              />
              <FileUpload
                label="Police Clearance"
                error={didValidate ? errors.policeClearance : undefined}
                fileName={policeClearanceName}
                onChange={(name) => setPoliceClearanceName(name)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="mb-4 text-sm font-semibold text-brand-navy">Verifiable Reference</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Reference Full Name" error={didValidate ? errors.refName : undefined}>
                <input
                  type="text"
                  value={data.refName}
                  onChange={(e) => update('refName', e.target.value)}
                  placeholder="Previous employer or supervisor"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                />
              </Field>
              <Field label="Reference Phone" error={didValidate ? errors.refPhone : undefined}>
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
            disabled={state.submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-red-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {state.submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </>
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
  fileName,
  onChange,
}: {
  label: string
  error?: string
  fileName: string
  onChange: (name: string) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition ${
          fileName
            ? 'border-green-400 bg-green-50'
            : error
              ? 'border-brand-red bg-brand-red-light'
              : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Upload className={`h-6 w-6 ${fileName ? 'text-green-500' : 'text-gray-400'}`} />
        {fileName ? (
          <span className="font-medium text-green-700">{fileName}</span>
        ) : (
          <span className="text-gray-500">Click to upload</span>
        )}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
        />
      </label>
      {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
    </div>
  )
}
