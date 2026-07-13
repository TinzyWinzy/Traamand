import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Gift, Search, Loader2, Calendar, UserCheck } from 'lucide-react'
import { getClientBookings } from '../../firebase/firestore'
import { useAuthStore } from '../../stores/authStore'
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

export default function ClientDashboard() {
  const { user, isLoading: authLoading } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      getClientBookings(user.id)
        .then((b) => {
          setBookings(b)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  const activeBookings = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status))
  const recentBookings = bookings.slice(0, 5)

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Client'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your hires and account from one place.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Link
            to="/my-hires"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 mb-3">
              <Briefcase className="h-5 w-5 text-teal-700" />
            </div>
            <p className="text-sm font-bold text-slate-900">My Hires</p>
            <p className="text-xs text-slate-500 mt-1">
              {activeBookings.length > 0
                ? `${activeBookings.length} active hire${activeBookings.length > 1 ? 's' : ''}`
                : 'View your booking history'}
            </p>
          </Link>

          <Link
            to="/available-staff"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 mb-3">
              <Search className="h-5 w-5 text-blue-700" />
            </div>
            <p className="text-sm font-bold text-slate-900">Find Staff</p>
            <p className="text-xs text-slate-500 mt-1">Browse available workers</p>
          </Link>

          <Link
            to="/my-referrals"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 mb-3">
              <Gift className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="text-sm font-bold text-slate-900">Refer & Earn</p>
            <p className="text-xs text-slate-500 mt-1">
              ${user?.earningsBalance?.toFixed(0) || '0'} earned
            </p>
          </Link>
        </div>

        {recentBookings.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-slate-900">Recent Hires</h2>
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <Link
                  key={b.id}
                  to="/my-hires"
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                        <UserCheck className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {b.serviceType || 'Booking'}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {b.startDate?.toDate?.()?.toLocaleDateString() || 'Date not set'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No hires yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Start by finding the right worker for your needs.</p>
            <Link
              to="/available-staff"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
            >
              <Search className="h-4 w-4" />
              Browse Available Staff
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
