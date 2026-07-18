import { useState, useEffect } from 'react'
import { Check, Clock, AlertCircle, Download, ExternalLink, MessageCircle, Loader2 } from 'lucide-react'
import { getClientBookings } from '../../firebase/firestore'
import { useAuthStore } from '../../stores/authStore'
import type { Booking } from '../../types'
import { generateWhatsAppUrl } from '../../lib/whatsapp'

export default function MyPayments() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getClientBookings(user.id)
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const paid = bookings.filter((b) => b.placementFeePaid)
  const pending = bookings.filter((b) => !b.placementFeePaid && b.placementFee > 0)
  const noFee = bookings.filter((b) => !b.placementFee || b.placementFee <= 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">My Payments</h1>
        <p className="mt-4 text-slate-500">No bookings with payments yet.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">My Payments</h1>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Pending Payments</h2>
          <div className="space-y-3">
            {pending.map((b) => (
              <PaymentCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {paid.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Payment History</h2>
          <div className="space-y-3">
            {paid.map((b) => (
              <PaymentCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {noFee.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-800">Inquiries</h2>
          <div className="space-y-3">
            {noFee.map((b) => (
              <PaymentCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PaymentCard({ booking }: { booking: Booking }) {
  const ref = booking.paynowReference || booking.id.slice(0, 8).toUpperCase()
  const paid = booking.placementFeePaid
  const hasFee = (booking.placementFee || 0) > 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{booking.serviceType}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              paid ? 'bg-green-100 text-green-700' : hasFee ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {paid ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {paid ? 'Paid' : hasFee ? 'Pending' : 'No Fee'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Ref: {ref}</p>
        </div>
        {hasFee && (
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">${booking.placementFee}</p>
            {paid && booking.platformCutAmount !== undefined && booking.platformCutAmount > 0 && (
              <p className="text-[11px] text-slate-400">
                Platform fee: ${booking.platformCutAmount} · Net: ${booking.traamandNetRevenue}
              </p>
            )}
          </div>
        )}
      </div>

      {booking.paynowStatus && (
        <p className="mt-2 text-xs text-slate-400">
          Paynow: <span className="font-medium capitalize">{booking.paynowStatus}</span>
          {booking.paynowPaidAt && ` · ${new Date(booking.paynowPaidAt.seconds * 1000).toLocaleDateString()}`}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <a
          href={`/book/${booking.workerId || ''}/confirmation?bookingId=${booking.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-600"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Booking
        </a>
        {!paid && hasFee && (
          <a
            href={`/book/${booking.workerId || ''}/confirmation?bookingId=${booking.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-700"
          >
            Pay Now
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
        >
          <Download className="h-3.5 w-3.5" />
          Receipt
        </button>
      </div>
    </div>
  )
}
