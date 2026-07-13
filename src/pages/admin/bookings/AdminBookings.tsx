import { useCallback, useEffect, useState } from 'react'
import {
  Search, Loader2, Calendar, ChevronDown, ChevronUp,
  CheckCircle, Clock, Filter, MessageCircle, Send,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useToastStore } from '../../../stores/toastStore'
import { useAuthStore } from '../../../stores/authStore'
import {
  WHATSAPP_NUMBERS,
  generateBookingAdminMessage,
  generateBookingPipelineMessage,
  generateWhatsAppUrl,
  getUserWhatsAppNumber,
} from '../../../lib/whatsapp'
import type { Booking, Worker, User } from '../../../types'

const BOOKING_STATUSES = [
  'inquiry', 'matched', 'booked', 'placement_fee_paid',
  'worker_assigned', 'started', 'completed', 'cancelled',
] as const

const STATUS_COLORS: Record<string, string> = {
  inquiry: 'bg-slate-100 text-slate-600',
  matched: 'bg-blue-100 text-blue-700',
  booked: 'bg-teal-100 text-teal-700',
  placement_fee_paid: 'bg-amber-100 text-amber-700',
  worker_assigned: 'bg-indigo-100 text-indigo-700',
  started: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminBookings() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const addToast = useToastStore((s) => s.addToast)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingsSnap, workersSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'users')),
      ])
      setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
      setWorkers(workersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Worker))
      const userMap = new Map<string, User>()
      usersSnap.docs.forEach((d) => userMap.set(d.id, { id: d.id, ...d.data() } as User))
      setUsers(userMap)
    } catch {
      addToast('Failed to load bookings', 'error')
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedBy: user?.id || 'admin',
        updatedByName: user?.name || 'Admin',
        updatedAt: serverTimestamp(),
      })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: status as Booking['status'] } : b))
      )
    } catch {
      addToast('Failed to update booking status', 'error')
    }
  }

  const getWorkerName = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId)
    return worker?.displayName || 'Unknown'
  }

  const getClient = (clientId: string) => users.get(clientId)

  const formatDate = (ts: unknown) => {
    if (!ts) return '—'
    const d = (ts as { toDate?: () => Date }).toDate?.()
    if (!d) return '—'
    return d.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
      b.workType?.toLowerCase().includes(search.toLowerCase()) ||
      getWorkerName(b.workerId).toLowerCase().includes(search.toLowerCase()) ||
      b.id?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || b.status === statusFilter
    return matchesSearch && matchesStatus
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
        <h1 className="text-2xl font-extrabold text-slate-900">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">{bookings.length} total bookings</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service, type, worker..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white pl-10 pr-8 text-sm outline-none appearance-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-slate-400">No bookings found.</p>
          </div>
        ) : (
          filtered.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-4"
                onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 shrink-0">
                    <Calendar className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{booking.serviceType || 'General'}</p>
                      <span className="text-xs text-slate-400">#{booking.id?.slice(0, 8)}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {getWorkerName(booking.workerId)} &middot; {booking.workType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                  {expandedId === booking.id ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                </div>
              </div>

              {expandedId === booking.id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Client</p>
                      <p className="font-medium text-slate-700 mt-1">{getClient(booking.clientId)?.name || 'Unknown client'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Worker</p>
                      <p className="font-medium text-slate-700 mt-1">{getWorkerName(booking.workerId)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Start Date</p>
                      <p className="font-medium text-slate-700 mt-1">{formatDate(booking.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Duration</p>
                      <p className="font-medium text-slate-700 mt-1">{booking.duration || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Placement Fee</p>
                      <p className="font-medium text-slate-700 mt-1">${booking.placementFee || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          booking.placementFeePaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.placementFeePaid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {booking.placementFeePaid ? 'Paid' : 'Pending'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'bookings', booking.id), {
                                placementFeePaid: !booking.placementFeePaid,
                                paynowStatus: !booking.placementFeePaid ? 'manual_paid' : 'pending',
                                paynowPaidAt: !booking.placementFeePaid ? serverTimestamp() : null,
                                status: !booking.placementFeePaid ? 'placement_fee_paid' : booking.status,
                                updatedBy: user?.id || 'admin',
                                updatedByName: user?.name || 'Admin',
                                updatedAt: serverTimestamp(),
                              })
                              setBookings((prev) =>
                                prev.map((b) => (b.id === booking.id ? {
                                  ...b,
                                  placementFeePaid: !b.placementFeePaid,
                                  paynowStatus: !b.placementFeePaid ? 'manual_paid' : 'pending',
                                  status: !b.placementFeePaid ? 'placement_fee_paid' : b.status,
                                } : b))
                              )
                              addToast(`Payment marked as ${booking.placementFeePaid ? 'pending' : 'paid'}`, 'success')
                            } catch {
                              addToast('Failed to toggle payment', 'error')
                            }
                          }}
                          className="text-[10px] font-semibold text-slate-400 underline hover:text-slate-600"
                        >
                          {booking.placementFeePaid ? 'Mark unpaid' : 'Mark paid'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</p>
                      <p className="font-medium text-slate-700 mt-1">
                        {booking.clientAddress?.suburb || '—'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">WhatsApp Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const client = getClient(booking.clientId)
                        const clientPhone = getUserWhatsAppNumber(client)
                        const workerName = getWorkerName(booking.workerId)
                        const clientName = client?.name || 'there'

                        return (
                          <>
                            {clientPhone && (
                              <a
                                href={generateWhatsAppUrl(
                                  clientPhone,
                                  generateBookingPipelineMessage(booking, workerName, clientName)
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-700"
                              >
                                <MessageCircle className="h-4 w-4" />
                                DM Client Update
                              </a>
                            )}
                            <a
                              href={generateWhatsAppUrl(
                                WHATSAPP_NUMBERS.bookings,
                                generateBookingAdminMessage(booking, workerName, client?.name || 'Unknown client')
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
                            >
                              <Send className="h-4 w-4" />
                              Send to Admin WhatsApp
                            </a>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {booking.replacementRequested && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
                      <p className="font-semibold text-amber-800">Replacement Requested</p>
                      <p className="text-amber-700 mt-0.5">{booking.replacementReason || 'No reason provided'}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {BOOKING_STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(booking.id, status)}
                          disabled={booking.status === status}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            booking.status === status
                              ? 'bg-teal-600 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
