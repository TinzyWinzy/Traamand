import { useState, useEffect, useCallback } from 'react'
import { Gift, Copy, Share2, Users, MousePointerClick, DollarSign, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { getReferralStats, getTransactions, setReferralCode } from '../../firebase/firestore'
import { generateReferralCode } from '../../lib/referral'
import type { User as UserType, Transaction } from '../../types'

interface ReferralDashboardProps {
  onWithdraw?: () => void
  compact?: boolean
}

export default function ReferralDashboard({ onWithdraw, compact }: ReferralDashboardProps) {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<{ clicks: number; signups: number; referrals: UserType[] }>({ clicks: 0, signups: 0, referrals: [] })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [codeInitialized, setCodeInitialized] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getReferralStats(user.id),
      getTransactions(user.id),
    ]).then(([s, t]) => {
      setStats(s)
      setTransactions(t)
      setLoading(false)
    })
  }, [user?.id])

  const initCode = useCallback(async () => {
    if (!user?.id || codeInitialized) return
    if (!user.referralCode) {
      const code = generateReferralCode()
      await setReferralCode(user.id, code)
      setCodeInitialized(true)
    } else {
      setCodeInitialized(true)
    }
  }, [user?.id, user?.referralCode, codeInitialized])

  useEffect(() => { initCode() }, [initCode])

  if (!user || loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    )
  }

  const code = user.referralCode || '...'
  const shareUrl = `${window.location.origin}/r/${code}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Get your maid or nanny through Traamand! Use my referral link to get started:\n${shareUrl}\n\nFind reliable, verified domestic workers near you.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const totalEarned = transactions
    .filter((t) => t.amount > 0 && t.type !== 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0)

  const withdrawable = user.earningsBalance || 0

  if (compact) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-teal-600" />
            <span className="text-sm font-bold text-slate-900">Refer & Earn</span>
          </div>
          <span className="text-lg font-extrabold text-teal-700">${withdrawable.toFixed(2)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
            onClick={(e) => e.currentTarget.select()}
          />
          <button onClick={handleCopy} className="rounded-lg bg-white border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 transition">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={handleWhatsApp} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-700 transition">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        {onWithdraw && withdrawable >= 5 && (
          <button onClick={onWithdraw} className="mt-3 w-full rounded-xl bg-teal-600 py-2 text-sm font-bold text-white hover:bg-teal-700 transition">
            Withdraw ${withdrawable.toFixed(2)} to EcoCash
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="bg-zinc-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-xs font-bold text-teal-700 mb-3">
            <Gift className="h-3.5 w-3.5" /> Earn $5 per referral
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Refer & Earn</h1>
          <p className="text-sm text-slate-500">Share your link. Get paid when they hire.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
              <DollarSign className="h-4 w-4" /> Balance
            </div>
            <p className="text-3xl font-extrabold text-teal-700">${withdrawable.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">${totalEarned.toFixed(2)} earned total</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
              <MousePointerClick className="h-4 w-4" /> Clicks
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats.clicks}</p>
            <p className="text-xs text-slate-400 mt-1">Link clicks</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
              <Users className="h-4 w-4" /> Referrals
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats.signups}</p>
            <p className="text-xs text-slate-400 mt-1">Signed up via your link</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <p className="text-sm font-bold text-slate-900 mb-3">Your referral link</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              onClick={(e) => e.currentTarget.select()}
            />
            <button onClick={handleCopy} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleWhatsApp} className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 transition flex-1 justify-center">
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </button>
          </div>
        </div>

        {stats.referrals.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Your Referrals</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-700">
                      {ref.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{ref.name || 'New User'}</p>
                      <p className="text-xs text-slate-400">{ref.email || ref.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onWithdraw && withdrawable >= 5 && (
          <div className="mt-6 flex justify-center">
            <button onClick={onWithdraw} className="rounded-2xl bg-teal-600 px-8 py-4 text-base font-bold text-white transition hover:bg-teal-700 shadow-lg shadow-teal-600/20">
              Withdraw ${withdrawable.toFixed(2)} to EcoCash
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
