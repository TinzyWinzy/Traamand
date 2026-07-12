import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp, DollarSign, MousePointerClick, Eye, Target,
  Loader2, ArrowLeft, Plus, BarChart3,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { createAdCampaign, getAdCampaigns } from '../../firebase/firestore'
import type { AdCampaign } from '../../types'

export default function AdvertiseDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessContact, setBusinessContact] = useState('')
  const [description, setDescription] = useState('')
  const [targetCategory, setTargetCategory] = useState('Maid')
  const [budget, setBudget] = useState(50)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.id)) {
      navigate('/sign-in')
      return
    }
    if (!authLoading && user?.id) {
      getAdCampaigns(user.id).then((c) => {
        setCampaigns(c)
        setLoading(false)
      }).catch(() => {
        addToast('Failed to load campaigns', 'error')
        setLoading(false)
      })
    }
  }, [authLoading, user?.id])

  const handleCreate = async () => {
    if (!businessName.trim() || !description.trim() || !user?.id) return
    setCreating(true)
    try {
      await createAdCampaign({
        businessName: businessName.trim(),
        businessContact: businessContact.trim(),
        description: description.trim(),
        targetCategory,
        budget,
        userId: user.id,
      })
      addToast('Campaign created!', 'success')
      setShowCreate(false)
      setBusinessName('')
      setBusinessContact('')
      setDescription('')
      const updated = await getAdCampaigns(user.id)
      setCampaigns(updated)
    } catch {
      addToast('Failed to create campaign', 'error')
    }
    setCreating(false)
  }

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)

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
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700 mb-3">
                <BarChart3 className="h-3.5 w-3.5" /> Advertise
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Local Business Ads</h1>
              <p className="text-sm text-slate-500">Reach families who hire domestic workers.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total spent</p>
              <p className="text-2xl font-extrabold text-teal-700">${totalSpend.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Eye className="h-4 w-4" /> Impressions
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{totalImpressions.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <MousePointerClick className="h-4 w-4" /> Clicks
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{totalClicks.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Target className="h-4 w-4" /> Conversions
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{totalConversions}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <TrendingUp className="h-4 w-4" /> Campaigns
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{campaigns.length}</p>
          </div>
        </div>

        {/* Create campaign */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="mb-6 w-full rounded-2xl border-2 border-dashed border-slate-300 py-6 text-sm font-bold text-slate-500 transition hover:border-teal-400 hover:text-teal-600"
          >
            <Plus className="inline h-5 w-5 mr-1" /> Create Ad Campaign
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">New Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Business name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Contact</label>
                  <input
                    type="text"
                    value={businessContact}
                    onChange={(e) => setBusinessContact(e.target.value)}
                    placeholder="Phone or email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ad description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you offering?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Target category</label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  >
                    {['Maid', 'Nanny', 'Chef', 'Gardener', 'Nurse Aide', 'Driver', 'Sales Lady', 'Bar Lady', 'All'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min={10}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !businessName.trim() || !description.trim()}
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
              >
                {creating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : `Launch Campaign - $${budget}`}
              </button>
            </div>
          </div>
        )}

        {/* Campaign list */}
        {campaigns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Your Campaigns</h2>
            {campaigns.map((c) => {
              const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : '0.0'
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{c.businessName}</p>
                      <p className="text-xs text-slate-500">{c.description.slice(0, 80)}{c.description.length > 80 ? '...' : ''}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{c.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-4 text-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{c.impressions.toLocaleString()}</p>
                      <p className="text-slate-400">Impressions</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{c.clicks}</p>
                      <p className="text-slate-400">Clicks</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{ctr}%</p>
                      <p className="text-slate-400">CTR</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">${c.spend.toFixed(2)}</p>
                      <p className="text-slate-400">Spent</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
