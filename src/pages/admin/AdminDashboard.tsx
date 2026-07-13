import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Users, DollarSign, BookOpen,
  UserCircle, UserPlus, TrendingUp, Loader2, ArrowUpRight,
  Clock, CheckCircle, Smartphone,
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
    pendingPayouts: 0,
    pendingPayoutAmount: 0,
    pendingSubmissions: 0,
    openVerifierTasks: 0,
    totalUsers: 0,
    referralEarnings: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const addToast = useToastStore((s) => s.addToast)

  const fetchStats = useCallback(async () => {
    try {
      const [
        workersSnap, bookingsSnap, usersSnap, applicantsSnap,
        payoutsSnap, subSnap, verifierSnap, txSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'bookings')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'client'))),
        getDocs(collection(db, 'applicants')),
        getDocs(query(collection(db, 'payouts'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'creatorSubmissions'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'verifierTasks'), where('status', '==', 'open'))),
        getDocs(query(collection(db, 'transactions'), where('type', 'in', ['referral_bonus', 'referral_grandparent', 'verifier_payout', 'creator_payout']))),
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
        totalUsers: (await getDocs(collection(db, 'users'))).size,
        revenueMTD: bookings
          .filter((b) => b.placementFeePaid)
          .reduce((sum, b) => sum + (b.placementFee || 0), 0),
        pendingPayouts: payoutsSnap.size,
        pendingPayoutAmount: payoutsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0),
        pendingSubmissions: subSnap.size,
        openVerifierTasks: verifierSnap.size,
        referralEarnings: Math.round(txSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0) * 100) / 100,
      })

      const recentQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5))
      const recentSnap = await getDocs(recentQuery)
      setRecentBookings(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
    } catch {
      addToast('Failed to load dashboard stats', 'error')
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const statCards = [
    { label: 'Active Bookings', value: String(stats.activeBookings), icon: BookOpen, color: 'text-blue-600 bg-blue-50', link: '/admin/bookings' },
    { label: 'Total Workers', value: String(stats.totalWorkers), icon: Users, color: 'text-purple-600 bg-purple-50', link: '/admin/workers' },
    { label: 'Verified Workers', value: String(stats.verifiedWorkers), icon: Shield, color: 'text-amber-600 bg-amber-50', link: '/admin/workers' },
    { label: 'Revenue (MTD)', value: `$${stats.revenueMTD}`, icon: DollarSign, color: 'text-teal-600 bg-teal-50', link: '/admin/payments' },
    { label: 'Clients', value: String(stats.totalClients), icon: UserCircle, color: 'text-rose-600 bg-rose-50', link: '/admin/clients' },
    { label: 'Applicants', value: String(stats.totalApplicants), icon: UserPlus, color: 'text-indigo-600 bg-indigo-50', link: '/admin/applicants' },
  ]

  const alertCards = [
    {
      label: 'Pending Payouts', value: `$${stats.pendingPayoutAmount.toFixed(2)} (${stats.pendingPayouts})`,
      icon: Smartphone, color: 'text-amber-600 bg-amber-50', link: '/admin/payouts',
      urgent: stats.pendingPayouts > 0,
    },
    {
      label: 'Creator Submissions', value: String(stats.pendingSubmissions),
      icon: Clock, color: 'text-purple-600 bg-purple-50', link: '/admin/content',
      urgent: stats.pendingSubmissions > 0,
    },
    {
      label: 'Open Verifier Tasks', value: String(stats.openVerifierTasks),
      icon: CheckCircle, color: 'text-blue-600 bg-blue-50', link: '/admin/tasks',
      urgent: stats.openVerifierTasks > 0,
    },
    {
      label: 'Referral Earnings', value: `$${stats.referralEarnings}`,
      icon: TrendingUp, color: 'text-teal-600 bg-teal-50', link: '/admin/users',
      urgent: false,
    },
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Operational overview &amp; CRM hub.</p>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6 mb-6">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.link} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {alertCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
              card.urgent ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300' : 'border-slate-200 bg-white hover:border-teal-200'
            }`}
          >
            <div className={`mb-2 inline-flex rounded-lg p-2 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Applicant Pipeline', to: '/admin/applicants', icon: UserPlus, desc: 'Review & process new applicants' },
              { label: 'Worker Management', to: '/admin/workers', icon: Users, desc: 'Add, edit, verify workers' },
              { label: 'Bookings Pipeline', to: '/admin/bookings', icon: BookOpen, desc: 'Manage booking lifecycle' },
              { label: 'Client CRM', to: '/admin/clients', icon: UserCircle, desc: 'View client profiles' },
              { label: 'Payments', to: '/admin/payments', icon: DollarSign, desc: 'Reconcile payments' },
              { label: 'Payouts', to: '/admin/payouts', icon: Smartphone, desc: 'Process withdrawal requests' },
              { label: 'Creator Content', to: '/admin/content', icon: Clock, desc: 'Review submissions' },
              { label: 'Verifier Tasks', to: '/admin/tasks', icon: CheckCircle, desc: 'Manage verification tasks' },
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

        {/* Recent Bookings */}
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
