import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart, DollarSign, Calendar, CheckCircle, XCircle, Loader2,
  ArrowLeft, User, Shield, Phone, Users, Clock,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { getSponsorships, createSponsorship } from '../../firebase/firestore'
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Sponsorship, Worker } from '../../types'

export default function SponsorDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [clientName, setClientName] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState(200)
  const [creating, setCreating] = useState(false)
  const [searchWorker, setSearchWorker] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.id)) {
      navigate('/sign-in')
      return
    }
    if (!authLoading && user?.id) {
      Promise.all([
        getSponsorships(user.id),
        getDocs(query(collection(db, 'workers'), where('isActive', '==', true), orderBy('rating', 'desc'), limit(50))),
      ]).then(([s, wSnap]) => {
        setSponsorships(s)
        setWorkers(wSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Worker[])
        setLoading(false)
      }).catch(() => {
        addToast('Failed to load sponsor data', 'error')
        setLoading(false)
      })
    }
  }, [authLoading, user?.id])

  const handleCreate = async () => {
    if (!selectedWorkerId || !clientName.trim() || !user?.id) return
    const worker = workers.find((w) => w.id === selectedWorkerId)
    if (!worker) return
    setCreating(true)
    try {
      await createSponsorship({
        sponsorId: user.id,
        workerId: selectedWorkerId,
        workerName: worker.displayName,
        clientName: clientName.trim(),
        monthlyBudget,
        startDate: null as any,
      })
      addToast('Sponsorship created!', 'success')
      setShowCreate(false)
      setSelectedWorkerId('')
      setClientName('')
      const updated = await getSponsorships(user.id)
      setSponsorships(updated)
    } catch {
      addToast('Failed to create sponsorship', 'error')
    }
    setCreating(false)
  }

  const totalMonthly = sponsorships
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.monthlyBudget + s.traamandFee, 0)

  const filteredWorkers = workers.filter(
    (w) =>
      w.displayName?.toLowerCase().includes(searchWorker.toLowerCase()) ||
      w.category?.toLowerCase().includes(searchWorker.toLowerCase())
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6">
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-1.5 text-xs font-bold text-pink-700 mb-3">
                <Heart className="h-3.5 w-3.5" /> Diaspora Sponsor
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Sponsor a Worker</h1>
              <p className="text-sm text-slate-500">Pay for your family's maid from abroad. You control everything.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Monthly commitment</p>
              <p className="text-2xl font-extrabold text-teal-700">${totalMonthly.toFixed(2)}</p>
              <p className="text-xs text-slate-400">{sponsorships.filter((s) => s.status === 'active').length} active sponsorships</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 mb-3">
              <User className="h-5 w-5 text-pink-700" />
            </div>
            <p className="text-sm font-bold text-slate-900">Pick a Worker</p>
            <p className="text-xs text-slate-500 mt-1">Choose from verified workers for your family.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 mb-3">
              <DollarSign className="h-5 w-5 text-pink-700" />
            </div>
            <p className="text-sm font-bold text-slate-900">Set Your Budget</p>
            <p className="text-xs text-slate-500 mt-1">You pay monthly. We handle the rest.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 mb-3">
              <Shield className="h-5 w-5 text-pink-700" />
            </div>
            <p className="text-sm font-bold text-slate-900">Stay in Control</p>
            <p className="text-xs text-slate-500 mt-1">View check-ins, approve days off, manage payments.</p>
          </div>
        </div>

        {/* Create sponsorship */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="mb-6 w-full rounded-2xl border-2 border-dashed border-slate-300 py-6 text-sm font-bold text-slate-500 transition hover:border-teal-400 hover:text-teal-600"
          >
            + Start Sponsoring a Worker
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">New Sponsorship</h2>
              <button onClick={() => setShowCreate(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Who is the worker for? (family member name)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. My mother Grace"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Select a Worker</label>
                <input
                  type="text"
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  placeholder="Search workers..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 mb-2"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredWorkers.slice(0, 10).map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWorkerId(w.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                        selectedWorkerId === w.id
                          ? 'bg-teal-50 border border-teal-200'
                          : 'border border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
                        {w.displayName?.charAt(0) || '?'}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">{w.displayName}</p>
                        <p className="text-xs text-slate-400">{w.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Monthly budget ($)</label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  min={50}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-xs text-slate-400 mt-1">8% management fee applies: ${(monthlyBudget * 0.08).toFixed(2)}/month</p>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedWorkerId || !clientName.trim()}
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
              >
                {creating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Start Sponsorship'}
              </button>
            </div>
          </div>
        )}

        {/* Active sponsorships */}
        {sponsorships.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Your Sponsorships</h2>
            {sponsorships.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                      <Heart className="h-5 w-5 text-pink-700" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{s.workerName}</p>
                      <p className="text-xs text-slate-500">Sponsored for: {s.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-teal-700">${s.monthlyBudget}/mo</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>Fee: ${s.traamandFee}/mo</span>
                  <span>Total: ${(s.monthlyBudget + s.traamandFee).toFixed(2)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
