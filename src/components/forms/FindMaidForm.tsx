import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, MessageCircle, Star, LoaderCircle, MapPin, UserX, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SUBURBS_BY_REGION } from '../../lib/constants'
import { getAvailableWorkers, createBooking } from '../../firebase/firestore'
import { WHATSAPP_NUMBERS } from '../../lib/whatsapp'
import type { Worker, ServiceCategory, WorkType, BookingStatus } from '../../types'

const SERVICE_OPTIONS = [
  { value: 'Maid' as ServiceCategory, label: 'Maid (House Cleaning)', desc: 'House cleaning, laundry & deep cleaning' },
  { value: 'Nanny' as ServiceCategory, label: 'Nanny (Childcare)', desc: 'Childcare, newborn care & early education' },
  { value: 'Chef' as ServiceCategory, label: 'Chef (Cooking)', desc: 'Cooking, baking & meal planning' },
  { value: 'Gardener' as ServiceCategory, label: 'Gardener', desc: 'Lawn care, landscaping & pruning' },
  { value: 'Nurse Aide' as ServiceCategory, label: 'Nurse Aide (Elderly Care)', desc: 'Elderly care & medication support' },
  { value: 'Driver' as ServiceCategory, label: 'Driver', desc: 'Chauffeur & school runs' },
  { value: 'Sales Lady' as ServiceCategory, label: 'Sales Lady', desc: 'Retail & customer service' },
  { value: 'Bar Lady' as ServiceCategory, label: 'Bar Lady', desc: 'Bartending & event service' },
]

const WORK_TYPE_OPTIONS: { value: WorkType; label: string; desc: string }[] = [
  { value: 'live-in', label: 'Full-Time Live-In', desc: 'Round-the-clock household care' },
  { value: 'daily', label: 'Daily', desc: 'Help during the day, returns home at night' },
  { value: 'part-time', label: 'Part-Time', desc: 'Flexible help by the hour or day' },
  { value: 'temporary', label: 'Temporary', desc: 'Short-term or one-off assistance' },
]

interface FormData {
  fullName: string
  phone: string
  email: string
  suburb: string
  region: string
  serviceType: ServiceCategory | ''
  workType: WorkType | ''
  requirements: string
}

const INITIAL: FormData = {
  fullName: '',
  phone: '',
  email: '',
  suburb: '',
  region: '',
  serviceType: '',
  workType: '',
  requirements: '',
}

export default function FindMaidForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ bookingId: string } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const allRegions = Object.entries(SUBURBS_BY_REGION)

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
        errs.phone = 'Enter a valid Zimbabwe phone number (e.g. 0772 123 456)'
    }

    if (step === 1) {
      if (!data.serviceType) errs.serviceType = 'Select the type of worker you need'
      if (!data.workType) errs.workType = 'Select how often you need help'
      if (!data.suburb) errs.suburb = 'Select your suburb'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = async () => {
    if (!validateStep()) return
    if (step === 1) {
      setLoadingWorkers(true)
      setStep(2)
      try {
        const all = await getAvailableWorkers()
        setWorkers(all)
      } catch {
        setWorkers([])
      } finally {
        setLoadingWorkers(false)
      }
    } else {
      setStep((s) => s + 1)
    }
  }

  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const matchingWorkers = useMemo(() => {
    if (!data.serviceType) return []
    return workers.filter((w) => {
      const categoryMatch = w.category === data.serviceType
      if (!categoryMatch) return false
      if (data.suburb) {
        const suburbLower = data.suburb.toLowerCase()
        const locMatch = w.availability?.preferredLocations?.some(
          (l) => l.toLowerCase().includes(suburbLower) || suburbLower.includes(l.toLowerCase())
        )
        const areaMatch = w.serviceAreas?.some(
          (a) => a.toLowerCase().includes(suburbLower) || suburbLower.includes(a.toLowerCase())
        )
        if (!locMatch && !areaMatch) return false
      }
      return true
    })
  }, [workers, data.serviceType, data.suburb])

  const handleSubmitBooking = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const phoneClean = data.phone.replace(/[\s-]/g, '')
      const bookingData = {
        clientId: '',
        clientName: data.fullName.trim(),
        clientPhone: phoneClean,
        clientWhatsapp: phoneClean,
        clientEmail: data.email || '',
        workerId: selectedWorkerId || '',
        serviceType: (data.serviceType || 'Maid') as ServiceCategory,
        workType: (data.workType || 'daily') as WorkType,
        startDate: null as any,
        duration: '',
        clientAddress: {
          street: '',
          suburb: data.suburb,
          city: 'Harare',
          lat: 0,
          lng: 0,
        },
        requirements: {
          cooking: false,
          childcare: false,
          elderlyCare: false,
          pets: false,
          driving: false,
          languages: [],
        },
        placementFee: 0,
        placementFeePaid: false,
        paynowPollUrl: '',
        paynowReference: '',
        paynowStatus: '',
        paynowPaidAt: null,
        status: (selectedWorkerId ? 'matched' : 'inquiry') as BookingStatus,
        workerArrivedAt: null,
        checkInSchedule: {},
        clientCheckIn: {},
        replacementRequested: false,
        replacementReason: '',
      }
      const bookingId = await createBooking(bookingData)
      setSubmitted({ bookingId })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const whatsappNumber = WHATSAPP_NUMBERS.bookings.replace(/\s/g, '')

  const whatsappMessage = submitted
    ? [
        `Hi Traamand, I submitted a booking inquiry (Ref: ${submitted.bookingId}).`,
        ``,
        `Name: ${data.fullName}`,
        `Service: ${data.serviceType}`,
        `Work Type: ${data.workType}`,
        `Suburb: ${data.suburb}`,
        data.requirements ? `Notes: ${data.requirements}` : null,
        selectedWorkerId ? `Worker Selected: Yes` : `Worker Selected: No (open inquiry)`,
      ].filter(Boolean).join('\n')
    : [
        `Hi Traamand, I am interested in hiring domestic help.`,
        ``,
        `Full Name: ${data.fullName}`,
        `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : null,
        `Service Needed: ${data.serviceType}`,
        `Work Type: ${data.workType}`,
        `Suburb: ${data.suburb}${data.region ? ` (${data.region})` : ''}`,
        data.requirements ? `Special Requirements: ${data.requirements}` : null,
      ].filter(Boolean).join('\n')

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-slate-900">Inquiry Submitted</h3>
        <p className="mt-2 text-sm text-slate-500">
          Your request has been received. Reference: <strong className="text-slate-700">{submitted.bookingId}</strong>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          We&apos;ll review your details and match you with the best available worker.
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left text-sm text-slate-600">
          <p><strong>Name:</strong> {data.fullName}</p>
          <p><strong>Phone:</strong> {data.phone}</p>
          {data.email && <p><strong>Email:</strong> {data.email}</p>}
          <p><strong>Service:</strong> {data.serviceType}</p>
          <p><strong>Work Type:</strong> {data.workType}</p>
          <p><strong>Suburb:</strong> {data.suburb}{data.region ? ` (${data.region})` : ''}</p>
          {selectedWorkerId && <p><strong>Worker Selected:</strong> Yes</p>}
          {data.requirements && <p><strong>Notes:</strong> {data.requirements}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-4 text-base font-bold text-white transition hover:bg-green-700 active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            Follow Up on WhatsApp
          </a>
          <Link
            to="/available-staff"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-4 text-base font-semibold text-slate-600 transition hover:border-teal-600 hover:text-teal-600"
          >
            Browse All Available Staff
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmitBooking() }}
      className="rounded-2xl bg-white p-6 shadow-md sm:p-10"
    >
      <div className="mb-8 flex items-center justify-center gap-2">
        {[0, 1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                s <= step && s !== 2
                  ? 'bg-teal-600 text-white'
                  : s === 2 && step >= 2
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s + 1}
            </div>
            {s < 2 && (
              <div
                className={`h-1 w-8 rounded transition ${s < step && step < 3 ? 'bg-teal-600' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Your Details</h2>
          <p className="text-sm text-slate-500">
            We&apos;ll use this to match you with the best domestic worker.
          </p>
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
          <h2 className="text-xl font-bold text-slate-900">Tell Us What You Need</h2>
          <p className="text-sm text-slate-500">
            We&apos;ll find available workers that match your requirements.
          </p>

          <Field label="What type of worker do you need?" error={errors.serviceType}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICE_OPTIONS.map((svc) => (
                <button
                  key={svc.value}
                  type="button"
                  onClick={() => update('serviceType', svc.value)}
                  className={`rounded-lg border px-4 py-4 text-left transition ${
                    data.serviceType === svc.value
                      ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">{svc.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{svc.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="How often do you need help?" error={errors.workType}>
            <div className="grid grid-cols-2 gap-3">
              {WORK_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('workType', opt.value)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    data.workType === opt.value
                      ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </Field>

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

          <Field label="Special Household Requirements (optional)">
            <textarea
              value={data.requirements}
              onChange={(e) => update('requirements', e.target.value)}
              rows={3}
              placeholder="e.g. Must be comfortable with large dogs, Needs experience with infants"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Available {data.serviceType}s Near You</h2>
          <p className="text-sm text-slate-500">
            {loadingWorkers
              ? 'Finding workers that match your needs...'
              : matchingWorkers.length > 0
              ? `We found ${matchingWorkers.length} available ${data.serviceType.toLowerCase()}${matchingWorkers.length !== 1 ? 's' : ''} in your area. Select one below, or submit an open inquiry.`
              : 'No workers currently match your exact criteria. You can still submit an inquiry and we\'ll find the right match for you.'}
          </p>

          {loadingWorkers ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {matchingWorkers.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <UserX className="h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-500">No workers match your current filters.</p>
                </div>
              )}

              {matchingWorkers.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWorkerId(selectedWorkerId === w.id ? null : w.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    selectedWorkerId === w.id
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {w.photos?.[0] ? (
                      <img src={w.photos[0]} alt={w.displayName} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 text-lg font-bold text-teal-700">
                        {w.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{w.displayName}</span>
                        {selectedWorkerId === w.id && (
                          <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {w.rating}
                        </span>
                        <span>{w.experienceYears} yrs exp</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {w.availability?.preferredLocations?.[0] || w.serviceAreas?.[0] || ''}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {w.skills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {submitError && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 && step < 2 && (
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center justify-center gap-1 rounded-lg py-3 text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:border sm:border-slate-200 sm:px-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center justify-center gap-1 rounded-lg py-3 text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:border sm:border-slate-200 sm:px-4"
          >
            <ChevronLeft className="h-4 w-4" /> Change Needs
          </button>
        )}

        <div className="flex-1" />

        {step < 2 ? (
          <button
            type="button"
            onClick={next}
            className="w-full rounded-lg bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98] sm:w-auto"
          >
            {step === 1 ? 'Find Available Workers' : 'Next'}
            <ChevronRight className="h-4 w-4 inline" />
          </button>
        ) : (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => { setSelectedWorkerId(null); handleSubmitBooking() }}
              disabled={submitting || loadingWorkers}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-600 px-5 py-3.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                'Submit Open Inquiry'
              )}
            </button>
            <button
              type="submit"
              disabled={submitting || loadingWorkers || !selectedWorkerId}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : selectedWorkerId ? (
                <>
                  <BadgeCheck className="h-4 w-4" />
                  Book {matchingWorkers.find((w) => w.id === selectedWorkerId)?.displayName}
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
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
