import { useLocation, Link, useParams } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Shield,
  MessageCircle,
  Phone,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { WHATSAPP_NUMBERS } from '../../lib/whatsapp'
import { generateWhatsAppUrl } from '../../lib/whatsapp'
import { PRIMARY_PHONE, COMPANY_NAME } from '../../lib/constants'

export default function BookingConfirmation() {
  useParams<{ slug: string }>()
  const location = useLocation()
  const state = location.state as {
    workerName?: string
    workerSlug?: string
    startDate?: string
    workType?: string
    street?: string
    suburb?: string
    placementFee?: number
  } | null

  const workerName = state?.workerName || 'Your worker'
  const firstName = workerName.split(' ')[0]
  const startDate = state?.startDate
    ? new Date(state.startDate).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'soon'
  const address = state?.street && state?.suburb ? `${state.street}, ${state.suburb}` : 'your address'
  const fee = state?.placementFee ?? 0

  const supportMessage = `Hi Traamand, I just booked ${workerName} and have a question.`
  const supportUrl = generateWhatsAppUrl(WHATSAPP_NUMBERS.bookings, supportMessage)

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
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 hover:shadow-xl active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" />
            Chat with {firstName} on WhatsApp
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
