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
  UserPlus,
  Send,
  Trash2,
  Clock,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import { createInvite, getInvites, deleteInvite } from '../../../firebase/firestore'
import type { User as UserType, UserRole, Invite } from '../../../types'

export default function AdminUsers() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [users, setUsers] = useState<UserType[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('client')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) return
    if (!authLoading && isAuthenticated) fetchData()
  }, [authLoading, isAuthenticated])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersSnap, invitesData] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))),
        getInvites(),
      ])
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserType))
      setInvites(invitesData)
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await createInvite(inviteEmail.trim(), inviteRole, currentUser?.id || '')
      addToast(`Invite sent to ${inviteEmail.trim()}`, 'success')
      setInviteEmail('')
      setInviteRole('client')
      const invitesData = await getInvites()
      setInvites(invitesData)
    } catch {
      addToast('Failed to create invite', 'error')
    }
    setInviting(false)
  }

  const handleDeleteInvite = async (inviteId: string) => {
    await deleteInvite(inviteId)
    setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    addToast('Invite removed', 'success')
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
              <p className="text-sm text-slate-500">{users.length} users · {invites.length} pending invites</p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <UserPlus className="h-5 w-5 text-teal-600" /> Invite User
          </h2>
          <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="client">Client</option>
                <option value="verifier">Verifier</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            User will be assigned the selected role when they sign in with Google for the first time.
          </p>
        </div>

        {invites.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Invites
            </h3>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{inv.email}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inv.role === 'admin' ? 'bg-purple-100 text-purple-700'
                      : inv.role === 'verifier' ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inv.role}
                    </span>
                    {inv.accepted && (
                      <span className="text-xs text-emerald-600 font-semibold">Accepted</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(inv.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove invite"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
