import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Shield,
  BadgeCheck,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ArrowLeft,
  Trash2,
  Star,
  MapPin,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import type { Worker } from '../../../types'

export default function AdminWorkers() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/sign-in')
      return
    }
    if (!authLoading && isAuthenticated) {
      fetchWorkers()
    }
  }, [authLoading, isAuthenticated, user])

  const fetchWorkers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'workers'), orderBy('createdAt', 'desc'), limit(50))
      const snap = await getDocs(q)
      setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Worker))
    } catch (err) {
      addToast('Failed to load workers', 'error')
    }
    setLoading(false)
  }

  const toggleActive = async (worker: Worker) => {
    await updateDoc(doc(db, 'workers', worker.id), {
      isActive: !worker.isActive,
      updatedAt: serverTimestamp(),
    })
    setWorkers((prev) =>
      prev.map((w) => (w.id === worker.id ? { ...w, isActive: !w.isActive } : w))
    )
  }

  const deleteWorker = async (worker: Worker) => {
    if (!confirm(`Delete ${worker.displayName}? This cannot be undone.`)) return
    await deleteDoc(doc(db, 'workers', worker.id))
    setWorkers((prev) => prev.filter((w) => w.id !== worker.id))
  }

  const filtered = workers.filter(
    (w) =>
      w.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      w.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
      w.availability?.preferredLocations?.some((l: string) =>
        l.toLowerCase().includes(search.toLowerCase())
      )
  )

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
              <ArrowLeft className="h-4 w-4" /> Admin Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Worker Management</h1>
            <p className="text-sm text-slate-500">{workers.length} workers in database</p>
          </div>
          <Link
            to="/admin/workers/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Add Worker
          </Link>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, or location..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3.5 font-bold text-slate-600">Worker</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600">Status</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600 hidden sm:table-cell">Rating</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600 hidden md:table-cell">Location</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600">Active</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((worker) => (
                  <tr key={worker.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-700">
                          {worker.displayName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{worker.displayName}</p>
                          <p className="text-xs text-slate-400">
                            {worker.skills?.slice(0, 2).join(', ')?.replace(/-/g, ' ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          worker.verificationStatus === 'premium'
                            ? 'bg-amber-100 text-amber-700'
                            : worker.verificationStatus === 'verified'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {worker.verificationStatus === 'premium' ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <BadgeCheck className="h-3 w-3" />
                        )}
                        {worker.verificationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {worker.rating}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {worker.availability?.preferredLocations?.[0] || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(worker)}
                        className={worker.isActive ? 'text-green-600' : 'text-slate-300'}
                      >
                        {worker.isActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/workers/${worker.id}/edit`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteWorker(worker)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-slate-400">No workers found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
