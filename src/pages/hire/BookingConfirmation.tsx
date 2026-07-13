import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link, useParams, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Shield,
  MessageCircle,
  Phone,
  ArrowLeft,
  Sparkles,
  Loader2,
  CreditCard,
} from 'lucide-react'
import { WHATSAPP_NUMBERS, generateSupportMessage, generateWhatsAppUrl } from '../../lib/whatsapp'
import { PRIMARY_PHONE, COMPANY_NAME } from '../../lib/constants'
import { getBooking, getWorkerById } from '../../firebase/firestore'
import { initiateBookingPayment, pollBookingPayment } from '../../lib/paynow'
import { useToastStore } from '../../stores/toastStore'
import type { Booking, Worker } from '../../types'

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : value
        ? new Date(value as string | Date)
        : null

  if (!date || Number.isNaN(date.getTime())) return 'soon'

  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BookingConfirmation() {
  useParams<{ slug: string }>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const addToast = useToastStore((s) => s.addToast)
  const state = location.state as {
    bookingId?: string
    workerName?: string
    workerSlug?: string
    startDate?: string
    workType?: string
    street?: string
    suburb?: string
    placementFee?: number
  } | null

  const bookingId = searchParams.get('bookingId') || state?.bookingId || ''

  useEffect(() => {
    if (!bookingId || state?.workerName) return

    setLoading(true)
    getBooking(bookingId)
      .then(async (b) => {
        setBooking(b)
        if (b?.workerId) {
          setWorker(await getWorkerById(b.workerId))
        }
      })
      .finally(() => setLoading(false))
  }, [bookingId, state?.workerName])

  const bookingAddress = booking?.clientAddress
  const workerName = state?.workerName || worker?.displayName || 'Your worker'
  const firstName = workerName.split(' ')[0]
  const startDate = formatDate(state?.startDate || booking?.startDate)
  const address = useMemo(() => {
    if (state?.street && state?.suburb) return `${state.street}, ${state.suburb}`
    if (bookingAddress?.street && bookingAddress?.suburb) {
      return `${bookingAddress.street}, ${bookingAddress.suburb}`
    }
    return 'your address'
  }, [bookingAddress?.street, bookingAddress?.suburb, state?.street, state?.suburb])
  const fee = state?.placementFee ?? booking?.placementFee ?? 0

  const supportMessage = bookingId
    ? generateSupportMessage(bookingId)
    : `Hi Traamand, I just booked ${workerName} and have a question.`
  const supportUrl = generateWhatsAppUrl(WHATSAPP_NUMBERS.bookings, supportMessage)
  const isPaid = booking?.placementFeePaid || booking?.paynowStatus?.toLowerCase() === 'paid'

  const refreshBooking = async () => {
    if (!bookingId) return
    const fresh = await getBooking(bookingId)
    setBooking(fresh)
  }

  const handlePayment = async () => {
    if (!bookingId || fee <= 0) return
    setPaymentLoading(true)
    try {
      const result = await initiateBookingPayment(
        bookingId,
        fee,
        state?.workerName ? '' : booking?.clientEmail || ''
      )
      if (result.success && result.redirectUrl) {
        await refreshBooking()
        window.location.href = result.redirectUrl
      } else {
        addToast(result.error || 'Payment could not be started', 'error')
      }
    } catch {
      addToast('Payment could not be started', 'error')
    }
    setPaymentLoading(false)
  }

  const handlePollPayment = async () => {
    if (!bookingId) return
    setPaymentLoading(true)
    try {
      const result = await pollBookingPayment(bookingId)
      await refreshBooking()
      addToast(result.paid ? 'Payment confirmed' : `Payment status: ${result.status}`, result.paid ? 'success' : 'info')
    } catch {
      addToast('Could not check payment status', 'error')
    }
    setPaymentLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-12">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {/* Success Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-brand-teal-dark p-8 text-white shadow-xl sm:p-10">
          <div className="absolute right-4 top-4 opacity-20">
            <Sparkles className="h-20 w-20" />
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20">
              <Sparkles className="h-10 w-10" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">You're All Set!</h1>
            <p className="mt-3 text-lg text-white/90">
              <strong>{firstName}</strong> will arrive on
            </p>
            <p className="mt-1 text-2xl font-bold">{startDate}</p>
            <p className="mt-1 text-sm text-white/70">at {address}</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start Date</p>
                <p className="font-bold text-slate-900">{startDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Location</p>
                <p className="font-bold text-slate-900">{address}</p>
              </div>
            </div>
            {fee > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Placement Fee</p>
                  <p className="font-bold text-slate-900">${fee} — 30-day replacement guarantee</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {fee > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Placement Fee</p>
                  <p className="text-xs text-slate-500">
                    {isPaid ? 'Payment received. Your receipt is attached to this booking.' : 'Pay now to confirm placement processing.'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {!isPaid && (
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
                  >
                    {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Pay ${fee}
                  </button>
                )}
                {booking?.paynowPollUrl && !isPaid && (
                  <button
                    onClick={handlePollPayment}
                    disabled={paymentLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Check Payment Status
                  </button>
                )}
              </div>
            </div>
          )}

          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 hover:shadow-xl active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            Chat with Traamand on WhatsApp
          </a>

          <a
            href={`tel:${PRIMARY_PHONE.replace(/\s/g, '')}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
          >
            <Phone className="h-5 w-5" />
            Call {COMPANY_NAME}: {PRIMARY_PHONE}
          </a>
        </div>

        {/* What Happens Next */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">What Happens Next</h3>
          <div className="mt-4 space-y-4">
            {[
              { day: 'Day 1', text: `${firstName} arrives at ${address}`, sub: 'Your worker starts their first day' },
              { day: 'Day 3', text: 'We check in with you', sub: 'Quick satisfaction check via WhatsApp' },
              { day: 'Day 7', text: 'First week review', sub: 'Share your experience and rate your worker' },
              { day: 'Day 30', text: 'Final review & certificate', sub: 'Complete evaluation and get placement certificate' },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                    {i + 1}
                  </div>
                  {i < 3 && <div className="mt-1 h-full w-0.5 bg-teal-100" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-bold text-slate-800">{step.day}: {step.text}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="flex-1 rounded-2xl bg-teal-600 px-6 py-4 text-center text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 hover:shadow-xl active:scale-[0.98]"
          >
            <ArrowLeft className="-ml-1 mr-2 inline h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  )
}
