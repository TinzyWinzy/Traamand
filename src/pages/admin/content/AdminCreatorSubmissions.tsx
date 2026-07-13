import { useCallback, useEffect, useState } from 'react'
import {
  Search, Loader2, Video, Camera, FileText, ExternalLink,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import { createTransaction } from '../../../firebase/firestore'
import type { CreatorSubmission, User as UserType } from '../../../types'

const CONTENT_ICONS: Record<string, typeof Video> = {
  youtube: Video, tiktok: Camera, instagram: Camera,
  facebook: Video, blog: FileText, testimonial: Video,
}

const PAYOUT_MAP: Record<string, number> = {
  facebook: 5, tiktok: 10, instagram: 10,
  youtube: 50, blog: 20, testimonial: 25,
}

export default function AdminCreatorSubmissions() {
  const { user: currentUser } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([])
  const [users, setUsers] = useState<Map<string, UserType>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [subSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'creatorSubmissions'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(collection(db, 'users')),
      ])
      setSubmissions(subSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreatorSubmission))
      const userMap = new Map<string, UserType>()
      usersSnap.docs.forEach((d) => userMap.set(d.id, { id: d.id, ...d.data() } as UserType))
      setUsers(userMap)
    } catch {
      addToast('Failed to load submissions', 'error')
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (subId: string, newStatus: 'approved' | 'rejected' | 'paid', payoutAmount = 0) => {
    setActionId(subId)
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      }
      if (payoutAmount > 0) updateData.payoutAmount = payoutAmount
      await updateDoc(doc(db, 'creatorSubmissions', subId), updateData)

      if (newStatus === 'paid' && payoutAmount > 0) {
        const sub = submissions.find((s) => s.id === subId)
        if (sub && currentUser) {
          const userData = users.get(sub.userId)
          const newBalance = (userData?.earningsBalance || 0) + payoutAmount
          await createTransaction({
            userId: sub.userId,
            type: 'creator_payout',
            amount: payoutAmount,
            balance: newBalance,
            reference: subId,
            description: `Content payout: ${sub.contentType} — ${sub.url}`,
            status: 'completed',
          })
          await updateDoc(doc(db, 'users', sub.userId), { earningsBalance: newBalance })
        }
      }

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === subId
            ? { ...s, status: newStatus, payoutAmount: payoutAmount > 0 ? payoutAmount : s.payoutAmount }
            : s
        )
      )
      addToast(`Submission ${newStatus}`, 'success')
    } catch {
      addToast('Failed to update submission', 'error')
    }
    setActionId(null)
  }

  const filtered = submissions.filter((s) => {
    const user = users.get(s.userId)
    const matchSearch = !search || user?.name?.toLowerCase().includes(search.toLowerCase()) || s.contentType?.includes(search)
    const matchStatus = !filterStatus || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendingCount = submissions.filter((s) => s.status === 'pending').length

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
        <h1 className="text-2xl font-extrabold text-slate-900">Creator Submissions</h1>
        <p className="text-sm text-slate-500">{submissions.length} total · {pendingCount} pending review</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or type..."
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
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Video className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-slate-400">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const user = users.get(s.userId)
            const Icon = CONTENT_ICONS[s.contentType] || Video
            const suggestedPayout = PAYOUT_MAP[s.contentType] || 0
            return (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 shrink-0">
                      <Icon className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 capitalize">{s.contentType}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          s.status === 'paid' ? 'bg-teal-100 text-teal-700' :
                          s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        by {user?.name || 'Unknown'} · {s.views.toLocaleString()} views · {s.engagements.toLocaleString()} engagements
                      </p>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-1">
                        View content <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-teal-700">${s.payoutAmount || suggestedPayout}</p>
                    <p className="text-[10px] text-slate-400">suggested payout</p>
                  </div>
                </div>

                {s.status === 'pending' && (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleAction(s.id, 'approved')}
                      disabled={actionId === s.id}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(s.id, 'paid', suggestedPayout)}
                      disabled={actionId === s.id}
                      className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      Approve & Pay ${suggestedPayout}
                    </button>
                    <button
                      onClick={() => handleAction(s.id, 'rejected')}
                      disabled={actionId === s.id}
                      className="rounded-xl border border-red-200 px-5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {s.status === 'approved' && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleAction(s.id, 'paid', s.payoutAmount || suggestedPayout)}
                      disabled={actionId === s.id}
                      className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      Mark Paid — ${s.payoutAmount || suggestedPayout}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
