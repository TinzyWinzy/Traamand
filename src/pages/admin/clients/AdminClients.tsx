import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  ArrowLeft,
  MessageCircle,
  Shield,
  Trash2,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import type { User as UserType, Booking, UserRole } from '../../../types'
import { generateWhatsAppUrl } from '../../../lib/whatsapp'

export default function AdminClients() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const [clients, setClients] = useState<UserType[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleEdit, setRoleEdit] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/sign-in')
      return
    }
    if (!authLoading && isAuthenticated) {
      fetchData()
    }
  }, [authLoading, isAuthenticated])

  const fetchData = async () => {
    setLoading(true)
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)))
      setClients(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserType))

      const bookingsSnap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50)))
      setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
    } catch {
      addToast('Failed to load clients', 'error')
    }
    setLoading(false)
  }

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const addToast = useToastStore((s) => s.addToast)

  const updateRole = async (clientId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', clientId), { role })
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, role } : c)))
      setRoleEdit(null)
      addToast('Role updated', 'success')
    } catch {
      addToast('Failed to update role', 'error')
    }
  }

  const deleteClient = async (clientId: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'users', clientId))
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      addToast('Client deleted', 'success')
    } catch {
      addToast('Failed to delete client', 'error')
    }
  }

  const clientBookings = (clientId: string) =>
    bookings.filter((b) => b.clientId === clientId)

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" /> Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Client CRM</h1>
              <p className="text-sm text-slate-500">{clients.length} registered clients · {bookings.length} bookings</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-slate-400">No clients registered yet.</p>
            <p className="mt-1 text-sm text-slate-400">Clients appear here after they sign in for the first time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((client) => {
              const clientBookingsList = clientBookings(client.id)
              const activeBookings = clientBookingsList.filter((b) => !['completed', 'cancelled'].includes(b.status))
              return (
                <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-lg font-bold text-teal-700">
                          {client.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{client.name || 'Unnamed Client'}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {client.phone || '—'}
                            </span>
                            {client.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" /> {client.email}
                              </span>
                            )}
                            {client.addresses?.[0] && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {client.addresses[0].suburb || client.addresses[0].city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {roleEdit === client.id ? (
                        <div className="flex items-center gap-1">
                          {(['client', 'admin', 'verifier'] as UserRole[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => updateRole(client.id, r)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                client.role === r
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                          <button onClick={() => setRoleEdit(null)} className="ml-1 text-xs text-slate-400 hover:text-slate-600">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRoleEdit(client.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          <Shield className="h-4 w-4" /> {client.role || 'client'}
                        </button>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      )}
                      {client.whatsappNumber && (
                        <a
                          href={generateWhatsAppUrl(client.whatsappNumber, `Hi ${client.name?.split(' ')[0] || 'there'}, this is Traamand.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => deleteClient(client.id, client.name)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {clientBookingsList.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Bookings ({clientBookingsList.length})
                      </p>
                      <div className="space-y-2">
                        {clientBookingsList.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-slate-700">
                                {booking.serviceType || 'N/A'}
                              </span>
                              <span className="text-slate-400">{booking.workType}</span>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                booking.status === 'started'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : booking.status === 'completed'
                                    ? 'bg-slate-100 text-slate-600'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-teal-100 text-teal-700'
                              }`}
                            >
                              {booking.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                        {clientBookingsList.length > 3 && (
                          <p className="text-xs text-slate-400 pl-2">
                            +{clientBookingsList.length - 3} more bookings
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
