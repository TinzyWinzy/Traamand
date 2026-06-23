import { useState, type FormEvent } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { HARARE_SUBURBS, SERVICE_TYPES, HOUSE_SIZES } from '../../lib/constants'

interface FormData {
  fullName: string
  phone: string
  email: string
  suburb: string
  houseSize: string
  serviceType: string
  requirements: string
}

const INITIAL: FormData = {
  fullName: '',
  phone: '',
  email: '',
  suburb: '',
  houseSize: '',
  serviceType: '',
  requirements: '',
}

export default function FindMaidForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const update = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateStep = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {}

    if (step === 0) {
      if (!data.fullName.trim()) errs.fullName = 'Name is required'
      if (!data.phone.trim()) errs.phone = 'Phone number is required'
      else if (!/^0[0-9]{9}$/.test(data.phone.replace(/[\s-]/g, '')))
        errs.phone = 'Enter a valid Zimbabwe phone number'
    }

    if (step === 1) {
      if (!data.suburb) errs.suburb = 'Select your suburb'
      if (!data.houseSize) errs.houseSize = 'Select house size'
    }

    if (step === 2) {
      if (!data.serviceType) errs.serviceType = 'Select a service type'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 2))
  }

  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-brand-navy">Request Sent!</h3>
        <p className="mt-3 text-gray-600">
          Thank you, {data.fullName}. We&apos;ll contact you at{' '}
          <strong>{data.phone}</strong> within 24 hours to discuss your needs.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[0, 1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                s <= step
                  ? 'bg-brand-teal text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s + 1}
            </div>
            {s < 2 && <div className={`h-1 w-8 rounded transition ${s < step ? 'bg-brand-teal' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0 - Personal Info */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-brand-navy">Your Details</h2>
          <Field label="Full Name" error={errors.fullName}>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Tendai Mukanya"
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
          <Field label="Email (optional)">
            <input
              type="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="e.g. tendai@example.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            />
          </Field>
        </div>
      )}

      {/* Step 1 - Location & House */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-brand-navy">Location & Home</h2>
          <Field label="Your Suburb" error={errors.suburb}>
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
          <Field label="House Size" error={errors.houseSize}>
            <div className="grid grid-cols-2 gap-3">
              {HOUSE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => update('houseSize', size)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                    data.houseSize === size
                      ? 'border-brand-teal bg-brand-teal-light text-brand-teal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* Step 2 - Services */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-brand-navy">Service Needed</h2>
          <Field label="Type of Service" error={errors.serviceType}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICE_TYPES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => update('serviceType', svc)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                    data.serviceType === svc
                      ? 'border-brand-teal bg-brand-teal-light text-brand-teal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Specific Requirements (optional)">
            <textarea
              value={data.requirements}
              onChange={(e) => update('requirements', e.target.value)}
              rows={4}
              placeholder="e.g. Must be comfortable with dogs, light cooking required..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
            />
          </Field>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        {step > 0 ? (
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-brand-navy"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-teal-dark"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-lg bg-brand-red px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
          >
            Submit Request
          </button>
        )}
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
