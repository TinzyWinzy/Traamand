import { useCallback, useEffect, useState } from 'react'
import {
  collection, getDocs, query, where, orderBy, limit,
  type DocumentData, type QuerySnapshot,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  Users, UserCheck, BookOpen, DollarSign, Smartphone,
  Activity, AlertTriangle, Shield, Database, RefreshCw,
  ChevronDown, ChevronUp, Clock, XCircle, Ban,
  Download, FileText,
} from 'lucide-react'
import type { Booking, User, Transaction } from '../../types'

interface SystemStats {
  totalUsers: number; usersByRole: Record<string, number>
  totalWorkers: number; activeWorkers: number
  totalBookings: number; bookingsCancelled: number
  platformFees: number; referralEarnings: number; netRevenue: number
  pendingPayoutCount: number; pendingPayoutAmount: number
}

interface DayBucket { date: string; bookings: number; signups: number }

function computeStats(
  users: User[], workersSnap: QuerySnapshot<DocumentData>,
  bookings: Booking[], transactions: Transaction[],
  payoutsSnap: QuerySnapshot<DocumentData>,
): SystemStats {
  const usersByRole: Record<string, number> = {}
  for (const u of users) { usersByRole[u.role] = (usersByRole[u.role] || 0) + 1 }
  return {
    totalUsers: users.length,
    usersByRole,
    totalWorkers: workersSnap.size,
    activeWorkers: workersSnap.docs.filter((d) => d.data().isActive).length,
    totalBookings: bookings.length,
    bookingsCancelled: bookings.filter((b) => b.status === 'cancelled').length,
    platformFees: transactions.filter((t) => t.type === 'platform_fee').reduce((s, t) => s + t.amount, 0),
    referralEarnings: transactions.filter((t) => t.type === 'referral_bonus' || t.type === 'referral_grandparent').reduce((s, t) => s + t.amount, 0),
    netRevenue: transactions.filter((t) => t.type === 'traamand_revenue').reduce((s, t) => s + t.amount, 0),
    pendingPayoutCount: payoutsSnap.size,
    pendingPayoutAmount: payoutsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0),
  }
}

function computeTrends(bookings: Booking[], users: User[]): DayBucket[] {
  const map = new Map<string, DayBucket>()
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, { date: key, bookings: 0, signups: 0 })
  }
  for (const b of bookings) {
    const ts = b.createdAt
    if (ts && typeof ts === 'object' && 'toDate' in ts) {
      const key = ts.toDate().toISOString().slice(0, 10)
      if (map.has(key)) map.get(key)!.bookings++
    }
  }
  for (const u of users) {
    const ts = u.createdAt
    if (ts && typeof ts === 'object' && 'toDate' in ts) {
      const key = ts.toDate().toISOString().slice(0, 10)
      if (map.has(key)) map.get(key)!.signups++
    }
  }
  return [...map.values()]
}

function maxBucket(buckets: DayBucket[], key: 'bookings' | 'signups'): number {
  let m = 0; for (const b of buckets) if (b[key] > m) m = b[key]; return m || 1
}

function BarChart({ buckets, color }: { buckets: DayBucket[]; color: string }) {
  const maxB = maxBucket(buckets, 'bookings')
  const maxS = maxBucket(buckets, 'signups')
  return (
    <div className="flex items-end gap-px h-28">
      {buckets.map((b, i) => {
        const bh = Math.round((b.bookings / maxB) * 100)
        const sh = Math.round((b.signups / maxS) * 100)
        return (
          <div key={b.date} className="flex-1 flex flex-col items-center justify-end gap-px" title={`${b.date} — ${b.bookings} bookings, ${b.signups} signups`}>
            {b.signups > 0 && <div className="w-full rounded-t" style={{ height: `${Math.max(sh, 2)}%`, backgroundColor: '#94a3b8' }} />}
            {b.bookings > 0 && <div className="w-full rounded-t" style={{ height: `${Math.max(bh, 2)}%`, backgroundColor: color }} />}
            {i % 7 === 0 && <span className="text-[8px] text-slate-400 mt-1">{b.date.slice(5)}</span>}
          </div>
        )
      })}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [trends, setTrends] = useState<DayBucket[]>([])
  const [failureBookings, setFailureBookings] = useState<Booking[]>([])
  const [failedPayments, setFailedPayments] = useState<Booking[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [collHealth, setCollHealth] = useState<{ name: string; count: number }[]>([])
  const [openSection, setOpenSection] = useState<string | null>('failures')
  const [roleEmail, setRoleEmail] = useState('')
  const [roleSelect, setRoleSelect] = useState('verifier')
  const [roleResult, setRoleResult] = useState<string | null>(null)
  const [initResult, setInitResult] = useState<string | null>(null)
  const [initLoading, setInitLoading] = useState(false)

  function safeGet(label: string) {
    return async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try { return await fn() } catch { console.error(`[SuperAdmin] Failed to load ${label}`); return fallback }
    }
  }

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    setError(null)

    const sg = safeGet
    const [usersSnap, workersSnap, bookingsSnap, txSnap, payoutsSnap, auditSnap, collSnap] = await Promise.all([
      sg('users')(() => getDocs(collection(db, 'users')), null as any),
      sg('workers')(() => getDocs(collection(db, 'workers')), null as any),
      sg('bookings')(() => getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(500))), null as any),
      sg('transactions')(() => getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(200))), null as any),
      sg('payouts')(() => getDocs(query(collection(db, 'payouts'), where('status', '==', 'pending'))), null as any),
      sg('auditLogs')(() => getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(50))), null as any),
      sg('collections')(async () => {
        const cols = ['workers', 'users', 'bookings', 'applicants', 'transactions', 'payouts', 'auditLogs', 'locationPages', 'categories', 'verifierTasks', 'creatorSubmissions', 'sponsorships', 'adCampaigns']
        const results: { name: string; count: number }[] = []
        for (const name of cols) {
          try {
            const s = await getDocs(limitCountQuery(name))
            results.push({ name, count: s.size })
          } catch { results.push({ name, count: -1 }) }
        }
        return results
      }, []),
    ])

    if (!usersSnap || !workersSnap || !bookingsSnap) {
      setError('Failed to load core data'); setLoading(false); setRefreshing(false); return
    }

    const users: User[] = (usersSnap as QuerySnapshot<DocumentData>).docs.map((d) => ({ id: d.id, ...d.data() }) as User)
    const bookings: Booking[] = (bookingsSnap as QuerySnapshot<DocumentData>).docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
    const transactions: Transaction[] = txSnap ? (txSnap as QuerySnapshot<DocumentData>).docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction) : []

    setStats(computeStats(users, workersSnap, bookings, transactions, payoutsSnap || (null as any)))
    setTrends(computeTrends(bookings, users))

    setFailedPayments(bookings.filter((b: Booking) => {
      const ps = b.paynowStatus; return ps && (ps.includes('fail') || ps.includes('error') || ps === 'hash_warning' || ps === 'initiation_failed')
    }))
    setFailureBookings(bookings.filter((b: Booking) => b.status === 'cancelled'))

    setAuditLogs(auditSnap ? (auditSnap as QuerySnapshot<DocumentData>).docs.map((d) => ({ id: d.id, ...d.data() })) : [])
    setCollHealth(collSnap || [])
    setLoading(false); setRefreshing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function limitCountQuery(colName: string) {
    if (colName === 'users') return query(collection(db, colName), limit(500))
    if (colName === 'locationPages') return query(collection(db, colName), limit(50))
    return query(collection(db, colName), limit(100))
  }

  const healthColor = stats ? (stats.bookingsCancelled / Math.max(stats.totalBookings, 1)) : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Super Admin</h1>
            <p className="text-sm text-slate-500">System analytics, health &amp; controls</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            stats && healthColor < 0.1 ? 'bg-emerald-100 text-emerald-700' : healthColor < 0.25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              stats && healthColor < 0.1 ? 'bg-emerald-500' : healthColor < 0.25 ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            {stats && healthColor < 0.1 ? 'Healthy' : healthColor < 0.25 ? 'Degraded' : 'Critical'}
          </span>
          <button onClick={() => fetchAll(true)} disabled={refreshing} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" /></div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6 mb-6">
            <KpiCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${stats.usersByRole['client'] || 0} clients`} color="bg-indigo-50 text-indigo-600" />
            <KpiCard icon={UserCheck} label="Active Workers" value={stats.activeWorkers} sub={`${stats.totalWorkers} total`} color="bg-teal-50 text-teal-600" />
            <KpiCard icon={BookOpen} label="Total Bookings" value={stats.totalBookings} sub={`${stats.bookingsCancelled} cancelled`} color="bg-blue-50 text-blue-600" />
            <KpiCard icon={DollarSign} label="Platform Fees" value={`$${stats.platformFees.toFixed(2)}`} sub={`$${stats.netRevenue.toFixed(2)} net`} color="bg-emerald-50 text-emerald-600" />
            <KpiCard icon={Smartphone} label="Pending Payouts" value={stats.pendingPayoutCount} sub={`$${stats.pendingPayoutAmount.toFixed(2)}`} color="bg-amber-50 text-amber-600" />
            <KpiCard icon={Activity} label="Referral Rewards" value={`$${stats.referralEarnings.toFixed(2)}`} sub="all time" color="bg-purple-50 text-purple-600" />
          </div>

          {/* Activity + Revenue */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">30-Day Activity</h2>
                <span className="text-[10px] text-slate-400">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-500 align-middle mr-1" /> Bookings
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400 align-middle mr-1 ml-2" /> Signups
                </span>
              </div>
              <BarChart buckets={trends} color="#0d9488" />
              <p className="text-xs text-slate-400 mt-2 text-center">
                Total: {trends.reduce((s, b) => s + b.bookings, 0)} bookings, {trends.reduce((s, b) => s + b.signups, 0)} signups
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Revenue Breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: 'Platform Fees', amount: stats.platformFees, pct: stats.platformFees + stats.referralEarnings + stats.netRevenue > 0 ? (stats.platformFees / (stats.platformFees + stats.referralEarnings + stats.netRevenue) * 100) : 0, color: 'bg-emerald-500' },
                  { label: 'Referral Rewards', amount: stats.referralEarnings, pct: stats.platformFees + stats.referralEarnings + stats.netRevenue > 0 ? (stats.referralEarnings / (stats.platformFees + stats.referralEarnings + stats.netRevenue) * 100) : 0, color: 'bg-purple-500' },
                  { label: 'Net Revenue', amount: stats.netRevenue, pct: stats.platformFees + stats.referralEarnings + stats.netRevenue > 0 ? (stats.netRevenue / (stats.platformFees + stats.referralEarnings + stats.netRevenue) * 100) : 0, color: 'bg-teal-500' },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{r.label}</span>
                      <span className="font-bold text-slate-900">${r.amount.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${r.color} transition-all`} style={{ width: `${Math.max(r.pct, 1)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Failure Nodes + Collection Health */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <button onClick={() => setOpenSection(openSection === 'failures' ? null : 'failures')} className="flex items-center justify-between w-full mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Failure Nodes
                </h2>
                {openSection === 'failures' ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {openSection === 'failures' && (
                <div className="space-y-4">
                  <FailureBlock icon={XCircle} color="text-red-600" label="Failed Payments" count={failedPayments.length}
                    items={failedPayments.slice(0, 5).map((b) => `${b.serviceType} — ${b.paynowStatus}`)} />
                  <FailureBlock icon={Ban} color="text-red-600" label="Cancelled Bookings" count={failureBookings.length}
                    items={failureBookings.slice(0, 5).map((b) => `${b.serviceType} — ${b.replacementReason?.slice(0, 60) || 'No reason'}`)} />
                  <FailureBlock icon={Clock} color="text-amber-600" label="Stuck Applicants (>7 days)" count={0} items={[]} />
                  <FailureBlock icon={Smartphone} color="text-amber-600" label="Pending Payouts" count={stats.pendingPayoutCount}
                    items={stats.pendingPayoutCount > 0 ? [`$${stats.pendingPayoutAmount.toFixed(2)} total to process`] : []} />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-500" /> Collection Health
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2 pr-4">Collection</th>
                    <th className="pb-2">Documents</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {collHealth.map((c) => (
                      <tr key={c.name} className="text-slate-700">
                        <td className="py-2 pr-4 font-medium">{c.name}</td>
                        <td className="py-2">{c.count >= 0 ? c.count.toLocaleString() : <span className="text-red-400">Error</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* System Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" /> System Controls
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Init Admin Users */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Sync Admin Users</h3>
                <p className="text-xs text-slate-500 mb-3">Apply admin emails from source code to Firestore auth claims.</p>
                <button onClick={async () => {
                  setInitLoading(true); setInitResult(null)
                  try {
                    const { getFunctions, httpsCallable } = await import('firebase/functions')
                    const res = await httpsCallable(getFunctions(), 'initializeAdminUsers')()
                    setInitResult('done')
                    console.log('[initAdmin]', res.data)
                  } catch { setInitResult('error') }
                  setInitLoading(false)
                }} disabled={initLoading}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {initLoading ? 'Syncing…' : 'Initialize Admins'}
                </button>
                {initResult === 'done' && <p className="mt-2 text-xs text-green-600">Done.</p>}
                {initResult === 'error' && <p className="mt-2 text-xs text-red-600">Failed.</p>}
              </div>

              {/* Role Manager */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Set User Role</h3>
                <input type="email" placeholder="user@email.com" value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
                <div className="flex gap-2">
                  <select value={roleSelect} onChange={(e) => setRoleSelect(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs">
                    {['client', 'verifier', 'admin', 'superadmin'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={async () => {
                    if (!roleEmail) return; setRoleResult(null)
                    try {
                      const { getFunctions, httpsCallable } = await import('firebase/functions')
                      const res = await httpsCallable(getFunctions(), 'setUserRole')({ uid: '', email: roleEmail, role: roleSelect })
                      console.log(res.data)
                      setRoleResult('done')
                    } catch { setRoleResult('error') }
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                    Set
                  </button>
                </div>
                {roleResult === 'done' && <p className="mt-2 text-xs text-green-600">Role updated.</p>}
                {roleResult === 'error' && <p className="mt-2 text-xs text-red-600">Failed. Check console.</p>}
              </div>

              {/* CSV Export */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Data Export</h3>
                <p className="text-xs text-slate-500 mb-3">Download collection data as CSV for offline analysis.</p>
                <div className="space-y-2">
                  {[
                    { label: 'Users', col: 'users' },
                    { label: 'Bookings', col: 'bookings' },
                    { label: 'Workers', col: 'workers' },
                  ].map((e) => (
                    <button key={e.col} onClick={async () => {
                      const snap = await getDocs(query(collection(db, e.col), limit(1000)))
                      const rows = snap.docs.map((d) => d.data())
                      const keys = [...new Set(rows.flatMap(Object.keys))]
                      const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a'); a.href = url; a.download = `${e.col}.csv`; a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 w-full">
                      <Download className="h-3.5 w-3.5" /> {e.label} CSV
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" /> Recent Audit Log
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No audit entries.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2 pr-3">Time</th>
                    <th className="pb-2 pr-3">Action</th>
                    <th className="pb-2 pr-3">Entity</th>
                    <th className="pb-2">Actor</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.slice(0, 20).map((log: any) => (
                      <tr key={log.id} className="text-slate-700">
                        <td className="py-2 pr-3 text-xs text-slate-400 whitespace-nowrap">
                          {log.createdAt?.toDate?.()?.toLocaleString() || '…'}
                        </td>
                        <td className="py-2 pr-3 font-medium capitalize">{log.action?.replace(/_/g, ' ')}</td>
                        <td className="py-2 pr-3 text-xs">{log.entityType} <span className="text-slate-400">#{log.entityId?.slice(0, 8)}</span></td>
                        <td className="py-2 text-xs text-slate-500">{log.actorName || log.actorId?.slice(0, 12) || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function FailureBlock({ icon: Icon, color, label, count, items }: { icon: any; color: string; label: string; count: number; items: string[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Icon className={`h-4 w-4 ${color}`} /> {label}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${count > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      </div>
      {items.length > 0 && (
        <ul className="ml-6 space-y-0.5">
          {items.map((t, i) => <li key={i} className="text-xs text-slate-500">• {t}</li>)}
        </ul>
      )}
    </div>
  )
}
