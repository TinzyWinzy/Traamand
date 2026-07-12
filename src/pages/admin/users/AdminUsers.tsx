import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Mail,
  Shield,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import type { User as UserType, UserRole } from '../../../types'

export default function AdminUsers() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) return
    if (!authLoading && isAuthenticated) fetchUsers()
  }, [authLoading, isAuthenticated])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)))
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserType))
    } catch {
      addToast('Failed to load users', 'error')
    }
    setLoading(false)
  }

  const updateRole = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      addToast(`Role updated to ${role}`, 'success')
    } catch {
      addToast('Failed to update role', 'error')
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
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
        <div className="mb-6">
          <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" /> Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">User Management</h1>
              <p className="text-sm text-slate-500">{users.length} users total</p>
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
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-slate-400">No users found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-700">
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name || 'Unnamed'}</p>
                          {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {u.email || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'verifier'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {u.role || 'client'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {(['client', 'verifier', 'admin'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              if (u.id === currentUser?.id) {
                                if (!confirm(`Change your own role to "${r}"? This could lock you out.`)) return
                              }
                              updateRole(u.id, r)
                            }}
                            disabled={u.role === r}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              u.role === r
                                ? 'bg-teal-600 text-white cursor-default'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {r === 'client' ? <XCircle className="inline h-3 w-3 mr-0.5" /> : <CheckCircle className="inline h-3 w-3 mr-0.5" />}
                            {r}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
