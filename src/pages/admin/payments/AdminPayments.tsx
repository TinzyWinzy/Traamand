import { useEffect, useState } from 'react'
import {
  Search, Loader2, DollarSign, CheckCircle, Clock,
  XCircle, ChevronDown,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useToastStore } from '../../../stores/toastStore'
import type { Booking } from '../../../types'

export default function AdminPayments() {
  const addToast = useToastStore((s) => s.addToast)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPaid, setFilterPaid] = useState<string>('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50)))
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
    } catch (err) {
      addToast('Failed to load payments', 'error')
    }
    setLoading(false)
  }

  const formatDate = (ts: unknown) => {
    if (!ts) return '—'
    const d = (ts as { toDate?: () => Date }).toDate?.()
    if (!d) return '—'
    return d.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const paidBookings = bookings.filter((b) => b.placementFee > 0)
  const totalRevenue = paidBookings.filter((b) => b.placementFeePaid).reduce((sum, b) => sum + (b.placementFee || 0), 0)
  const pendingRevenue = paidBookings.filter((b) => !b.placementFeePaid).reduce((sum, b) => sum + (b.placementFee || 0), 0)

  const filtered = paidBookings.filter((b) => {
    const matchesSearch =
      b.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
      b.id?.toLowerCase().includes(search.toLowerCase())
    const matchesPaid =
      !filterPaid ||
      (filterPaid === 'paid' && b.placementFeePaid) ||
      (filterPaid === 'pending' && !b.placementFeePaid)
    return matchesSearch && matchesPaid
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Placement fee reconciliation</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-lg bg-teal-50 p-2 text-teal-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">${totalRevenue}</p>
          <p className="text-xs text-slate-500">Collected Revenue</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-lg bg-amber-50 p-2 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">${pendingRevenue}</p>
          <p className="text-xs text-slate-500">Pending Collection</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex rounded-lg bg-blue-50 p-2 text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{paidBookings.length}</p>
          <p className="text-xs text-slate-500">Total Invoices</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service or booking ID..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={filterPaid}
            onChange={(e) => setFilterPaid(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white pl-4 pr-8 text-sm outline-none appearance-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3.5 font-bold text-slate-600">Booking</th>
                <th className="px-5 py-3.5 font-bold text-slate-600 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3.5 font-bold text-slate-600">Fee</th>
                <th className="px-5 py-3.5 font-bold text-slate-600">Status</th>
                <th className="px-5 py-3.5 font-bold text-slate-600 hidden md:table-cell">Paynow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((booking) => (
                <tr key={booking.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{booking.serviceType || 'N/A'}</p>
                      <p className="text-xs text-slate-400">#{booking.id?.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-slate-500">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    ${booking.placementFee || 0}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      booking.placementFeePaid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.placementFeePaid
                        ? <CheckCircle className="h-3 w-3" />
                        : <Clock className="h-3 w-3" />
                      }
                      {booking.placementFeePaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {booking.paynowStatus ? (
                      <span className="text-xs text-slate-500">{booking.paynowStatus}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-400">No payments found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
