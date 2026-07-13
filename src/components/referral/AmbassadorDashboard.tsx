import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, DollarSign, Award, ChevronRight,
  Loader2, Crown, Medal, Gift, Star, UserCheck,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { getReferralTree, getTopReferrers, getTransactions } from '../../firebase/firestore'
import type { User, AmbassadorTier, Transaction } from '../../types'

const TIERS: AmbassadorTier[] = [
  { name: 'Bronze', minReferrals: 1, minHires: 0, revenueSharePercent: 0, bonusAmount: 0, badgeColor: 'bg-amber-600' },
  { name: 'Silver', minReferrals: 5, minHires: 2, revenueSharePercent: 1, bonusAmount: 10, badgeColor: 'bg-slate-400' },
  { name: 'Gold', minReferrals: 15, minHires: 5, revenueSharePercent: 1.5, bonusAmount: 50, badgeColor: 'bg-yellow-500' },
  { name: 'Platinum', minReferrals: 30, minHires: 10, revenueSharePercent: 2, bonusAmount: 100, badgeColor: 'bg-purple-600' },
]

function getTier(referrals: number, hires: number): AmbassadorTier {
  let current = TIERS[0]
  for (const t of TIERS) {
    if (referrals >= t.minReferrals && hires >= t.minHires) current = t
  }
  return current
}

function getNextTier(referrals: number, hires: number): AmbassadorTier | null {
  for (const t of TIERS) {
    if (referrals < t.minReferrals || hires < t.minHires) return t
  }
  return null
}

export default function AmbassadorDashboard() {
  const { user } = useAuthStore()
  const [tree, setTree] = useState<{ level1: User[]; level2: User[]; level3: User[] }>({ level1: [], level2: [], level3: [] })
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; count: number }[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getReferralTree(user.id),
      getTopReferrers(),
      getTransactions(user.id),
    ]).then(([t, lb, txns]) => {
      setTree(t)
      setLeaderboard(lb)
      setTransactions(txns)
      setLoading(false)
    })
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const totalReferrals = tree.level1.length
  const totalNetwork = tree.level1.length + tree.level2.length + tree.level3.length
  const tier = getTier(totalReferrals, 0)
  const nextTier = getNextTier(totalReferrals, 0)

  const l1Earnings = transactions.filter((t) => t.type === 'referral_bonus').reduce((s, t) => s + t.amount, 0)
  const l2Earnings = transactions.filter((t) => t.type === 'referral_grandparent').reduce((s, t) => s + t.amount, 0)

  const totalEarned = transactions
    .filter((t) => t.amount > 0 && t.type !== 'withdrawal')
    .reduce((s, t) => s + t.amount, 0)

  const userRank = leaderboard.findIndex((l) => l.id === user?.id) + 1

  return (
    <section className="bg-zinc-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-xs font-bold text-purple-700 mb-3">
            <Crown className="h-3.5 w-3.5" /> Ambassador Network
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Network</h1>
          <p className="text-sm text-slate-500">Track your referrals, earnings, and climb the tiers.</p>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Users className="h-4 w-4" /> Network Size
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalNetwork}</p>
            <div className="flex gap-2 mt-1 text-xs text-slate-400">
              <span>L1: {tree.level1.length}</span>
              <span>L2: {tree.level2.length}</span>
              <span>L3: {tree.level3.length}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <DollarSign className="h-4 w-4" /> Total Earned
            </div>
            <p className="text-3xl font-extrabold text-teal-700">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">L1: ${l1Earnings.toFixed(2)} · L2: ${l2Earnings.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Award className="h-4 w-4" /> Your Tier
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${tier.badgeColor}`} />
              <span className="text-2xl font-extrabold text-slate-900">{tier.name}</span>
            </div>
            {nextTier && (
              <p className="text-xs text-slate-400 mt-1">
                {nextTier.minReferrals - totalReferrals} more referrals to {nextTier.name}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Medal className="h-4 w-4" /> Your Rank
            </div>
            {userRank > 0 ? (
              <>
                <p className="text-3xl font-extrabold text-slate-900">#{userRank}</p>
                <p className="text-xs text-slate-400 mt-1">on leaderboard</p>
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-2">Share your link to rank</p>
            )}
          </div>
        </div>

        {/* Network Tree */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Your Referral Network</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 mb-2">
                <UserCheck className="h-3.5 w-3.5" /> Level 1 — Direct Referrals ({tree.level1.length})
              </div>
              {tree.level1.length === 0 ? (
                <p className="text-xs text-slate-400 pl-5">No direct referrals yet. Share your link to grow.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tree.level1.map((u) => (
                    <div key={u.id} className="flex items-center gap-1.5 rounded-lg bg-teal-50 border border-teal-100 px-3 py-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-200 text-[10px] font-bold text-teal-700">
                        {u.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs font-medium text-slate-700">{u.name?.split(' ')[0] || 'User'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {tree.level2.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-2">
                  <Star className="h-3.5 w-3.5" /> Level 2 — Referred by your referrals ({tree.level2.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {tree.level2.slice(0, 20).map((u) => (
                    <div key={u.id} className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-700">
                        {u.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs font-medium text-slate-700">{u.name?.split(' ')[0] || 'User'}</span>
                    </div>
                  ))}
                  {tree.level2.length > 20 && (
                    <span className="text-xs text-slate-400 self-center">+{tree.level2.length - 20} more</span>
                  )}
                </div>
              </div>
            )}

            {tree.level3.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-2">
                  <Gift className="h-3.5 w-3.5" /> Level 3 — Deep network ({tree.level3.length})
                </div>
                <span className="text-xs text-slate-500">{tree.level3.length} people in your extended network</span>
              </div>
            )}
          </div>
        </div>

        {/* Tier Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Ambassador Tiers</h2>
          <div className="space-y-3">
            {TIERS.map((t) => {
              const unlocked = totalReferrals >= t.minReferrals
              return (
                <div key={t.name} className={`rounded-xl border p-4 transition ${unlocked ? 'border-teal-200 bg-teal-50' : 'border-slate-100 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${t.badgeColor} ${unlocked ? 'shadow-lg shadow-black/10' : 'opacity-40'}`} />
                      <div>
                        <p className={`text-sm font-bold ${unlocked ? 'text-teal-700' : 'text-slate-400'}`}>
                          {t.name} {unlocked && '✓'}
                        </p>
                        <p className="text-xs text-slate-400">{t.minReferrals} referrals · {t.revenueSharePercent}% revenue share · ${t.bonusAmount} bonus</p>
                      </div>
                    </div>
                    {t === tier && (
                      <span className="rounded-full bg-teal-600 px-3 py-1 text-[10px] font-bold text-white">Current</span>
                    )}
                    {nextTier === t && (
                      <div className="text-right">
                        <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, (totalReferrals / t.minReferrals) * 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{totalReferrals}/{t.minReferrals}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Top Referrers</h2>
            <span className="text-xs text-slate-400">{leaderboard.length} active</span>
          </div>
          {leaderboard.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">No referrals yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.slice(0, 20).map((entry, i) => {
                const isMe = entry.id === user?.id
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <div key={entry.id} className={`flex items-center justify-between px-6 py-3.5 ${isMe ? 'bg-teal-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center text-sm font-bold ${i < 3 ? 'text-lg' : 'text-slate-400'}`}>
                        {medal || `#${i + 1}`}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                        {entry.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.name || 'Anonymous'}
                          {isMe && <span className="ml-1.5 text-[10px] text-teal-600 font-bold">(you)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{entry.count} referrals</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/my-referrals" className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700">
            Back to Refer &amp; Earn <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
