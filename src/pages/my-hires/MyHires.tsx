import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Shield, Loader2, User } from 'lucide-react'
import { getClientBookings } from '../../firebase/firestore'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import type { Booking } from '../../types'

const STATUS_LABELS: Record<string, string> = {
  inquiry: 'Pending',
  matched: 'Matched',
  booked: 'Booked',
  placement_fee_paid: 'Payment Confirmed',
  worker_assigned: 'Worker Assigned',
  started: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: 'bg-yellow-100 text-yellow-800',
  matched: 'bg-blue-100 text-blue-800',
  booked: 'bg-teal-100 text-teal-800',
  placement_fee_paid: 'bg-green-100 text-green-800',
  worker_assigned: 'bg-purple-100 text-purple-800',
  started: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function MyHires() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      getClientBookings(user.id).then((b) => {
        setBookings(b)
        setLoading(false)
      }).catch(() => {
        addToast('Failed to load bookings', 'error')
        setLoading(false)
      })
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="bg-zinc-50 py-12">
        <div className="mx-auto max-w-md px-4 text-center">
          <User className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">My Hires</h1>
          <p className="mt-2 text-slate-500">Sign in to view your bookings and track your hires.</p>
          <Link
            to="/sign-in"
            className="mt-6 inline-block rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Sign In
          </Link>
        </div>
      </section>
    )
  }

  const activeBookings = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status))
  const pastBookings = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status))

  return (
    <section className="bg-zinc-50 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">My Hires</h1>
        <p className="mt-1 text-sm text-slate-500">Track your active and past bookings.</p>

        {bookings.length === 0 ? (
          <div className="mt-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">No bookings yet.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
            >
              Hire a Worker
            </Link>
          </div>
        ) : (
          <>
            {activeBookings.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-bold text-slate-900">Active ({activeBookings.length})</h2>
                <div className="mt-3 space-y-3">
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            to={`/worker/${booking.workerId}`}
                            className="font-bold text-slate-900 hover:text-teal-600"
                          >
                            Worker #{booking.workerId.slice(0, 8)}
                          </Link>
                          <p className="text-sm text-slate-500">
                            {booking.clientAddress.suburb}, {booking.clientAddress.city}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {booking.startDate?.toDate?.().toLocaleDateString('en-ZA') || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          ${booking.placementFee}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-900">Past ({pastBookings.length})</h2>
                <div className="mt-3 space-y-3">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700">
                            Worker #{booking.workerId.slice(0, 8)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {booking.clientAddress.suburb}, {booking.clientAddress.city}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </section>
  )
}
