import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Users, DollarSign, Calendar, BookOpen,
  UserCircle, UserPlus, TrendingUp, Loader2, ArrowUpRight,
} from 'lucide-react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useToastStore } from '../../stores/toastStore'
import type { Booking, Worker } from '../../types'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    verifiedWorkers: 0,
    activeBookings: 0,
    totalBookings: 0,
    totalClients: 0,
    totalApplicants: 0,
    revenueMTD: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [workersSnap, bookingsSnap, usersSnap, applicantsSnap] = await Promise.all([
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'bookings')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'client'))),
        getDocs(collection(db, 'applicants')),
      ])

      const workers = workersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Worker)
      const bookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)

      setStats({
        totalWorkers: workers.length,
        verifiedWorkers: workers.filter((w) => w.verificationStatus === 'verified' || w.verificationStatus === 'premium').length,
        activeBookings: bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length,
        totalBookings: bookings.length,
        totalClients: usersSnap.size,
        totalApplicants: applicantsSnap.size,
        revenueMTD: bookings
          .filter((b) => b.placementFeePaid)
          .reduce((sum, b) => sum + (b.placementFee || 0), 0),
      })

      const recentQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5))
      const recentSnap = await getDocs(recentQuery)
      setRecentBookings(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
    } catch (err) {
      addToast('Failed to load dashboard stats', 'error')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const statCards = [
    { label: 'Active Bookings', value: String(stats.activeBookings), icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Workers', value: String(stats.totalWorkers), icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Verified Workers', value: String(stats.verifiedWorkers), icon: Shield, color: 'text-amber-600 bg-amber-50' },
    { label: 'Revenue (MTD)', value: `$${stats.revenueMTD}`, icon: DollarSign, color: 'text-teal-600 bg-teal-50' },
    { label: 'Total Bookings', value: String(stats.totalBookings), icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Clients', value: String(stats.totalClients), icon: UserCircle, color: 'text-rose-600 bg-rose-50' },
    { label: 'Applicants', value: String(stats.totalApplicants), icon: UserPlus, color: 'text-indigo-600 bg-indigo-50' },
  ]

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      inquiry: 'bg-slate-100 text-slate-600',
      matched: 'bg-blue-100 text-blue-700',
      booked: 'bg-teal-100 text-teal-700',
      placement_fee_paid: 'bg-amber-100 text-amber-700',
      worker_assigned: 'bg-indigo-100 text-indigo-700',
      started: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-slate-100 text-slate-500',
      cancelled: 'bg-red-100 text-red-700',
    }
    return `rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-600'}`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your Traamand operations.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Applicant Pipeline', to: '/admin/applicants', icon: UserPlus, desc: 'Review & process new applicants' },
              { label: 'Worker Management', to: '/admin/workers', icon: Users, desc: 'Add, edit, verify workers' },
              { label: 'Bookings Pipeline', to: '/admin/bookings', icon: BookOpen, desc: 'Manage booking lifecycle' },
              { label: 'Client CRM', to: '/admin/clients', icon: UserCircle, desc: 'View client profiles' },
              { label: 'Payments', to: '/admin/payments', icon: DollarSign, desc: 'Reconcile payments' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-teal-200 hover:bg-teal-50/30"
              >
                <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.label}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-sm font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{b.serviceType || 'N/A'}</p>
                    <p className="text-xs text-slate-400">{b.workType}</p>
                  </div>
                  <span className={statusBadge(b.status)}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
