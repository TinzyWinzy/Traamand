import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calendar,
  MapPin,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Star,
  Clock,
  BadgeCheck,
} from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { getWorker, createBooking } from '../../firebase/firestore'
import { bookingSchema, type BookingFormSchema } from '../../lib/validation'
import { useAuthStore } from '../../stores/authStore'
import type { Worker } from '../../types'

type Step = 1 | 2 | 3

export default function BookingFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    trigger,
  } = useForm<BookingFormSchema>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      workerId: '',
      startDate: '',
      workType: undefined,
      street: '',
      suburb: '',
      city: 'Harare',
      requirements: {
        cooking: false,
        childcare: false,
        elderlyCare: false,
        pets: false,
        driving: false,
        languages: [],
      },
      placementFee: 0,
    },
  })

  useEffect(() => {
    if (!slug) return
    getWorker(slug).then((w) => {
      setWorker(w)
      setLoading(false)
    })
  }, [slug])

  const stepFields: Record<Step, (keyof BookingFormSchema)[]> = {
    1: ['workType', 'startDate'],
    2: ['street', 'suburb'],
    3: [],
  }

  const handleNext = async () => {
    const fields = stepFields[step]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, 3) as Step)
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step)

  const watchStartDate = watch('startDate')
  const watchWorkType = watch('workType')
  const watchStreet = watch('street')
  const watchSuburb = watch('suburb')

  const onSubmit = async (data: BookingFormSchema) => {
    if (!worker) return
    if (!isAuthenticated || !user) {
      navigate('/sign-in')
      return
    }
    setSubmitting(true)

    try {
      const bookingId = await createBooking({
        clientId: user.id,
        workerId: worker.id,
        serviceType: worker.category,
        workType: data.workType,
        startDate: new Date(data.startDate) as unknown as Timestamp,
        duration: 'ongoing',
        clientAddress: {
          street: data.street,
          suburb: data.suburb,
          city: data.city || 'Harare',
          lat: 0,
          lng: 0,
        },
        requirements: data.requirements,
        placementFee: worker.placementFee,
        placementFeePaid: false,
        paynowPollUrl: '',
        paynowStatus: 'pending',
        status: 'inquiry',
        workerArrivedAt: null,
        clientCheckIn: {},
        replacementRequested: false,
        replacementReason: '',
      })

      navigate(`/book/${slug}/confirmation`, {
        state: {
          bookingId,
          workerName: worker.displayName,
          workerSlug: worker.slug,
          startDate: data.startDate,
          workType: data.workType,
          street: data.street,
          suburb: data.suburb,
          city: data.city,
          placementFee: worker.placementFee,
        },
      })
    } catch (err) {
      console.error('Failed to create booking:', err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Worker not found.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-teal-600 hover:underline">
            Back to categories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-8 sm:py-12">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Link to={`/worker/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition hover:text-teal-700">
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>

        {/* Worker Summary Card */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 text-xl font-bold text-teal-700 shadow-sm">
            {worker.displayName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900">{worker.displayName}</h3>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {worker.rating}
              </span>
              <span>${worker.placementFee} placement fee</span>
            </div>
          </div>
          {worker.verificationStatus === 'premium' && (
            <BadgeCheck className="h-5 w-5 shrink-0 text-amber-500" />
          )}
        </div>

        {/* Step Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Schedule' },
              { num: 2, label: 'Location' },
              { num: 3, label: 'Confirm' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      step > s.num
                        ? 'bg-teal-600 text-white'
                        : step === s.num
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                  </div>
                  <span className={`mt-1.5 text-[11px] font-semibold ${step >= s.num ? 'text-teal-700' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`mx-2 h-0.5 w-12 rounded-full transition-colors sm:w-20 ${step > s.num ? 'bg-teal-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Step 1: Schedule */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">When do you need {worker.displayName.split(' ')[0]}?</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose the work arrangement that fits your needs.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Work Type</label>
                  <Controller
                    name="workType"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { value: 'live-in', label: 'Live-in', desc: 'Full time, stays with you' },
                          { value: 'daily', label: 'Daily', desc: '8am-5pm, Mon-Fri' },
                          { value: 'part-time', label: 'Part-time', desc: 'Flexible hours' },
                          { value: 'temporary', label: 'Temporary', desc: 'Short-term fill-in' },
                        ] as const).map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => field.onChange(type.value)}
                            className={`rounded-xl border-2 p-4 text-left transition-all ${
                              field.value === type.value
                                ? 'border-teal-500 bg-teal-50 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block text-sm font-bold text-slate-900">{type.label}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{type.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  {errors.workType && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.workType.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {errors.startDate && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                {watchStartDate && watchWorkType && (
                  <div className="flex items-center gap-3 rounded-xl bg-teal-50 p-4">
                    <Clock className="h-5 w-5 text-teal-600" />
                    <p className="text-sm text-teal-800">
                      <strong>{worker.displayName.split(' ')[0]}</strong> would start{' '}
                      <strong>{new Date(watchStartDate).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> as a{' '}
                      <strong>{watchWorkType.replace('-', ' ')}</strong> worker.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Where should they go?</h2>
                  <p className="mt-1 text-sm text-slate-500">Your address helps us match you with nearby workers.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      {...register('street')}
                      placeholder="e.g. 12 Avondale Road"
                      className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  {errors.street && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Suburb</label>
                    <input
                      type="text"
                      {...register('suburb')}
                      placeholder="e.g. Avondale"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                    {errors.suburb && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{errors.suburb.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                    <input
                      type="text"
                      value="Harare"
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Special Requirements</label>
                  <div className="space-y-2">
                    {[
                      { key: 'cooking' as const, label: 'Cooking', emoji: '🍳' },
                      { key: 'childcare' as const, label: 'Childcare', emoji: '👶' },
                      { key: 'elderlyCare' as const, label: 'Elderly Care', emoji: '❤️' },
                      { key: 'pets' as const, label: 'Pet Friendly', emoji: '🐕' },
                      { key: 'driving' as const, label: 'Driving', emoji: '🚗' },
                    ].map(({ key, label, emoji }) => (
                      <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-slate-300 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          {...register(`requirements.${key}`)}
                          className="h-5 w-5 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          <span className="mr-2">{emoji}</span>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                    <CheckCircle className="h-8 w-8 text-teal-600" />
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-900">Confirm Your Booking</h2>
                  <p className="mt-1 text-sm text-slate-500">Review your details below.</p>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  {[
                    { label: 'Worker', value: worker.displayName },
                    { label: 'Work Type', value: watchWorkType?.replace('-', ' ') || '-' },
                    { label: 'Start Date', value: watchStartDate ? new Date(watchStartDate).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' }) : '-' },
                    { label: 'Address', value: [watchStreet, watchSuburb, 'Harare'].filter(Boolean).join(', ') },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Placement Fee</span>
                      <span className="text-2xl font-extrabold text-teal-700">${worker.placementFee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 border border-amber-200">
                  <Shield className="h-5 w-5 shrink-0 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">
                    30-day free replacement guarantee. If you're not satisfied, we'll match you with another worker at no extra cost.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <div className="flex-1" />
              )}

              <div className="flex-1" />

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 hover:shadow-xl active:scale-[0.97]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 hover:shadow-xl active:scale-[0.97] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" /> Confirm Booking — ${worker.placementFee}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
