import { useCallback, useEffect, useState } from 'react'
import {
  Search, Loader2, DollarSign, CheckCircle, XCircle,
  Clock, Smartphone, Building2, Wifi,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useToastStore } from '../../../stores/toastStore'
import type { Payout, User as UserType } from '../../../types'

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  ecocash: Smartphone,
  onemoney: Smartphone,
  innbucks: Building2,
  bank: Building2,
  airtime: Wifi,
  data: Wifi,
  traamand_credit: CheckCircle,
}

export default function AdminPayouts() {
  const addToast = useToastStore((s) => s.addToast)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [users, setUsers] = useState<Map<string, UserType>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [payoutSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'payouts'), orderBy('requestedAt', 'desc'), limit(100))),
        getDocs(collection(db, 'users')),
      ])
      setPayouts(payoutSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payout))
      const userMap = new Map<string, UserType>()
      usersSnap.docs.forEach((d) => userMap.set(d.id, { id: d.id, ...d.data() } as UserType))
      setUsers(userMap)
    } catch {
      addToast('Failed to load payouts', 'error')
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateStatus = async (payoutId: string, status: Payout['status']) => {
    setProcessingId(payoutId)
    try {
      await updateDoc(doc(db, 'payouts', payoutId), {
        status,
        completedAt: status === 'completed' || status === 'failed' ? serverTimestamp() : null,
      })
      setPayouts((prev) =>
        prev.map((p) => (p.id === payoutId ? { ...p, status } : p))
      )
      addToast(`Payout ${status}`, 'success')
    } catch {
      addToast('Failed to update payout', 'error')
    }
    setProcessingId(null)
  }

  const filtered = payouts.filter((p) => {
    const user = users.get(p.userId)
    const matchSearch = !search || user?.name?.toLowerCase().includes(search.toLowerCase()) || p.recipient?.includes(search)
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendingTotal = payouts.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

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
        <h1 className="text-2xl font-extrabold text-slate-900">Payout Requests</h1>
        <p className="text-sm text-slate-500">{payouts.length} total requests · ${pendingTotal.toFixed(2)} pending</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or recipient..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <DollarSign className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-slate-400">No payout requests</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const user = users.get(p.userId)
                const Icon = METHOD_ICONS[p.method] || Smartphone
                return (
                  <tr key={p.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
                          {user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{p.userId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">${p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <Icon className="h-3 w-3" /> {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.recipient || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status === 'pending' ? <Clock className="h-3 w-3" /> :
                         p.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                         <XCircle className="h-3 w-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => updateStatus(p.id, 'processing')}
                            disabled={processingId === p.id}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200 disabled:opacity-50"
                          >
                            {processingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Process'}
                          </button>
                          <button
                            onClick={() => updateStatus(p.id, 'completed')}
                            disabled={processingId === p.id}
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => updateStatus(p.id, 'failed')}
                            disabled={processingId === p.id}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                          >
                            Fail
                          </button>
                        </div>
                      )}
                      {(p.status === 'processing' || p.status === 'completed') && (
                        <button
                          onClick={() => updateStatus(p.id, 'completed')}
                          disabled={processingId === p.id}
                          className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                        >
                          {p.status === 'processing' ? 'Mark Complete' : '—'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
