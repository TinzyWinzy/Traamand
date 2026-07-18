import { useState, useEffect, useMemo } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react'
import { getAllBookings, getAllTransactions } from '../../../firebase/firestore'
import type { Booking, Transaction } from '../../../types'

export default function AdminReconciliation() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [b, t] = await Promise.all([getAllBookings(), getAllTransactions()])
        setBookings(b)
        setTransactions(t)
      } catch (err) {
        console.error('Failed to load reconciliation data:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const metrics = useMemo(() => {
    const paidBookings = bookings.filter((b) => b.placementFeePaid)
    const grossRevenue = paidBookings.reduce((s, b) => s + (b.placementFee || 0), 0)
    const platformFees = paidBookings.reduce((s, b) => s + (b.platformCutAmount || 0), 0)
    const netRevenue = paidBookings.reduce((s, b) => s + (b.traamandNetRevenue || 0), 0)

    const referralBonuses = transactions
      .filter((t) => t.type === 'referral_bonus' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0)
    const grandparentBonuses = transactions
      .filter((t) => t.type === 'referral_grandparent' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0)
    const cashbacks = transactions
      .filter((t) => t.type === 'cashback' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0)
    const verifierPayouts = transactions
      .filter((t) => t.type === 'verifier_payout' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0)
    const creatorPayouts = transactions
      .filter((t) => t.type === 'creator_payout' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0)

    const commissionExpenses = referralBonuses + grandparentBonuses + cashbacks + verifierPayouts + creatorPayouts
    const netAfterCommissions = netRevenue - commissionExpenses
    const pendingPayouts = transactions
      .filter((t) => t.status === 'pending')
      .reduce((s, t) => s + t.amount, 0)

    return {
      grossRevenue,
      platformFees,
      netRevenue,
      commissionExpenses,
      netAfterCommissions,
      pendingPayouts,
      totalPaid: paidBookings.length,
      referralBonuses,
      grandparentBonuses,
      cashbacks,
      verifierPayouts,
      creatorPayouts,
    }
  }, [bookings, transactions])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Reconciliation</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Gross Revenue"
          value={`$${metrics.grossRevenue.toFixed(2)}`}
          sub={`${metrics.totalPaid} paid bookings`}
          color="text-slate-900"
        />
        <MetricCard
          icon={TrendingUp}
          label="Platform Fees (Radbit)"
          value={`$${metrics.platformFees.toFixed(2)}`}
          sub={`${(metrics.platformFees / (metrics.grossRevenue || 1) * 100).toFixed(0)}% of gross`}
          color="text-blue-600"
        />
        <MetricCard
          icon={Wallet}
          label="Net Revenue"
          value={`$${metrics.netRevenue.toFixed(2)}`}
          sub={`${(metrics.netRevenue / (metrics.grossRevenue || 1) * 100).toFixed(0)}% of gross`}
          color="text-teal-600"
        />
        <MetricCard
          icon={TrendingDown}
          label="Commission Expenses"
          value={`$${metrics.commissionExpenses.toFixed(2)}`}
          sub="Referrals + cashbacks + payouts"
          color="text-red-600"
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-5">
          <p className="text-xs font-medium uppercase text-teal-600">Net After Commissions</p>
          <p className="mt-1 text-3xl font-extrabold text-teal-900">
            ${metrics.netAfterCommissions.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-teal-600">
            Net revenue minus all commissions and payouts
          </p>
        </div>

        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium uppercase text-amber-600">Pending Payouts</p>
          <p className="mt-1 text-3xl font-extrabold text-amber-900">
            ${metrics.pendingPayouts.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Unsettled payout requests
          </p>
        </div>

        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-medium uppercase text-slate-600">Net Cash Position</p>
          <p className={`mt-1 text-3xl font-extrabold ${metrics.netAfterCommissions - metrics.pendingPayouts >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${(metrics.netAfterCommissions - metrics.pendingPayouts).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Net minus pending payouts
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Commission Breakdown</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-600">% of Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <Row label="Referral Bonuses" amount={metrics.referralBonuses} net={metrics.netRevenue} />
              <Row label="Grandparent Bonuses" amount={metrics.grandparentBonuses} net={metrics.netRevenue} />
              <Row label="Cashbacks" amount={metrics.cashbacks} net={metrics.netRevenue} />
              <Row label="Verifier Payouts" amount={metrics.verifierPayouts} net={metrics.netRevenue} />
              <Row label="Creator Payouts" amount={metrics.creatorPayouts} net={metrics.netRevenue} />
              <tr className="bg-slate-50 font-bold">
                <td className="px-4 py-3 text-slate-800">Total Commissions</td>
                <td className="px-4 py-3 text-red-700">${metrics.commissionExpenses.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-700">
                  {(metrics.commissionExpenses / (metrics.netRevenue || 1) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Recent Transactions</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 50).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium capitalize text-slate-800">{t.type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${
                    t.type === 'platform_fee' || t.type === 'traamand_revenue' || t.type === 'placement_fee'
                      ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${t.amount.toFixed(2)}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{t.description}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      t.status === 'completed' ? 'bg-green-50 text-green-700' :
                      t.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
    </div>
  )
}

function Row({ label, amount, net }: { label: string; amount: number; net: number }) {
  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-4 py-3 text-slate-700">{label}</td>
      <td className="px-4 py-3 font-medium text-red-600">${amount.toFixed(2)}</td>
      <td className="px-4 py-3 text-slate-500">{(amount / (net || 1) * 100).toFixed(1)}%</td>
    </tr>
  )
}
