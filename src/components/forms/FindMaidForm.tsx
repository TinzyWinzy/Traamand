import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { SUBURBS_BY_REGION, SERVICE_TYPES } from '../../lib/constants'

interface FormData {
  fullName: string
  phone: string
  email: string
  suburb: string
  region: string
  serviceType: string
  requirements: string
}

const INITIAL: FormData = {
  fullName: '',
  phone: '',
  email: '',
  suburb: '',
  region: '',
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
      if (!data.serviceType) errs.serviceType = 'Select a service type'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 1))
  }

  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = () => {
    if (!validateStep()) return
    setSubmitted(true)
  }

  const allRegions = Object.entries(SUBURBS_BY_REGION)

  const whatsappNumber = '+263715325922'
  const whatsappMessage = [
    `Hi Traamand, I am interested in hiring domestic help.`,
    ``,
    `Full Name: ${data.fullName}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : null,
    `Suburb: ${data.suburb}${data.region ? ` (${data.region})` : ''}`,
    `Service Needed: ${data.serviceType}`,
    data.requirements ? `Special Requirements: ${data.requirements}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-slate-900">Details Confirmed</h3>
        <p className="mt-2 text-sm text-slate-500">
          Tap the button below to send your request instantly via WhatsApp.
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left text-sm text-slate-600">
          <p><strong>Name:</strong> {data.fullName}</p>
          <p><strong>Phone:</strong> {data.phone}</p>
          {data.email && <p><strong>Email:</strong> {data.email}</p>}
          <p><strong>Suburb:</strong> {data.suburb}{data.region ? ` (${data.region})` : ''}</p>
          <p><strong>Service:</strong> {data.serviceType}</p>
          {data.requirements && <p><strong>Requirements:</strong> {data.requirements}</p>}
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-4 text-base font-bold text-white transition hover:bg-green-700 active:scale-[0.98] sm:w-auto"
        >
          <MessageCircle className="h-5 w-5" />
          Send Request Instantly via WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
      className="rounded-2xl bg-white p-6 shadow-md sm:p-10"
    >
      <div className="mb-8 flex items-center justify-center gap-2">
        {[0, 1].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                s <= step
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s + 1}
            </div>
            {s < 1 && <div className={`h-1 w-8 rounded transition ${s < step ? 'bg-teal-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Your Details</h2>
          <Field label="Full Name" error={errors.fullName}>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Tendai Mukanya"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </Field>
          <Field label="WhatsApp Contact Number" error={errors.phone}>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="e.g. 0772 123 456"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="e.g. tendai@example.com"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Your Requirements</h2>

          <Field label="Your Suburb" error={errors.suburb}>
            <select
              value={data.region ? `${data.region}|${data.suburb}` : ''}
              onChange={(e) => {
                const val = e.target.value
                if (!val) {
                  update('suburb', '')
                  update('region', '')
                  return
                }
                const [region, suburb] = val.split('|')
                update('region', region)
                update('suburb', suburb)
              }}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="">Select your suburb</option>
              {allRegions.map(([region, suburbs]) => (
                <optgroup key={region} label={region}>
                  {suburbs.map((s) => (
                    <option key={s} value={`${region}|${s}`}>{s}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Service Type Needed" error={errors.serviceType}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICE_TYPES.map((svc) => (
                <button
                  key={svc.label}
                  type="button"
                  onClick={() => update('serviceType', svc.label)}
                  className={`rounded-lg border px-4 py-4 text-left transition ${
                    data.serviceType === svc.label
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">{svc.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{svc.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Special Household Requirements (optional)">
            <textarea
              value={data.requirements}
              onChange={(e) => update('requirements', e.target.value)}
              rows={4}
              placeholder="e.g. Must be comfortable with large dogs, Needs experience with infants"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </Field>
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 && (
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center justify-center gap-1 rounded-lg py-3 text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:border sm:border-slate-200 sm:px-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}

        <div className="flex-1" />

        {step < 1 ? (
          <button
            type="button"
            onClick={next}
            className="w-full rounded-lg bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98] sm:w-auto"
          >
            Next <ChevronRight className="h-4 w-4 inline" />
          </button>
        ) : (
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98] sm:w-auto"
          >
            Review & Send
          </button>
        )}
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
