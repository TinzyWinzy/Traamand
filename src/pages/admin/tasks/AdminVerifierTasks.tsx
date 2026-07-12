import { useEffect, useState } from 'react'
import {
  Search, Loader2, User, MapPin, DollarSign, Clock,
  CheckCircle, XCircle, ShieldCheck, Phone,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useToastStore } from '../../../stores/toastStore'
import type { VerifierTask, User as UserType } from '../../../types'

export default function AdminVerifierTasks() {
  const addToast = useToastStore((s) => s.addToast)
  const [tasks, setTasks] = useState<VerifierTask[]>([])
  const [users, setUsers] = useState<Map<string, UserType>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<VerifierTask | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [taskSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'verifierTasks'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(collection(db, 'users')),
      ])
      setTasks(taskSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as VerifierTask))
      const userMap = new Map<string, UserType>()
      usersSnap.docs.forEach((d) => userMap.set(d.id, { id: d.id, ...d.data() } as UserType))
      setUsers(userMap)
    } catch {
      addToast('Failed to load verifier tasks', 'error')
    }
    setLoading(false)
  }

  const cancelTask = async (taskId: string) => {
    setActionId(taskId)
    try {
      await updateDoc(doc(db, 'verifierTasks', taskId), { status: 'cancelled' })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'cancelled' as const } : t)))
      addToast('Task cancelled', 'success')
    } catch {
      addToast('Failed to cancel task', 'error')
    }
    setActionId(null)
  }

  const reopenTask = async (taskId: string) => {
    setActionId(taskId)
    try {
      await updateDoc(doc(db, 'verifierTasks', taskId), { status: 'open', assignedTo: '' })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'open' as const, assignedTo: '' } : t)))
      addToast('Task reopened for new verifier', 'success')
    } catch {
      addToast('Failed to reopen task', 'error')
    }
    setActionId(null)
  }

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.applicantName?.toLowerCase().includes(search.toLowerCase()) || t.location?.toLowerCase().includes(search)
    const matchStatus = !filterStatus || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const openCount = tasks.filter((t) => t.status === 'open').length
  const activeCount = tasks.filter((t) => t.status === 'assigned').length

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Verifier Tasks</h1>
          <p className="text-sm text-slate-500">{tasks.length} total · {openCount} open · {activeCount} active</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by applicant or location..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-slate-400">No verifier tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const verifier = t.assignedTo ? users.get(t.assignedTo) : null
            return (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      t.status === 'completed' ? 'bg-emerald-100' :
                      t.status === 'cancelled' ? 'bg-red-100' :
                      t.status === 'assigned' ? 'bg-amber-100' :
                      'bg-teal-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        t.status === 'completed' ? 'text-emerald-700' :
                        t.status === 'cancelled' ? 'text-red-700' :
                        t.status === 'assigned' ? 'text-amber-700' :
                        'text-teal-700'
                      }`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{t.applicantName}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.location}</span>
                        <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${t.fee}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.taskType}</span>
                        {t.applicantPhone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {t.applicantPhone}</span>}
                      </div>
                      {verifier && (
                        <p className="text-xs text-amber-600 mt-0.5">Assigned to: {verifier.name || t.assignedTo}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      t.status === 'assigned' ? 'bg-amber-100 text-amber-700' :
                      'bg-teal-100 text-teal-700'
                    }`}>{t.status}</span>
                    {t.status === 'assigned' && (
                      <button
                        onClick={() => reopenTask(t.id)}
                        disabled={actionId === t.id}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                    {(t.status === 'open' || t.status === 'assigned') && (
                      <button
                        onClick={() => cancelTask(t.id)}
                        disabled={actionId === t.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    {t.resultNotes && (
                      <button
                        onClick={() => setSelectedTask(selectedTask?.id === t.id ? null : t)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
                {selectedTask?.id === t.id && t.resultNotes && (
                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs font-bold text-slate-400 mb-1">Verifier Notes</p>
                    {t.resultNotes}
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
