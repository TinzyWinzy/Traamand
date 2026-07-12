import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import ReferralDashboard from '../components/referral/ReferralDashboard'
import AmbassadorDashboard from '../components/referral/AmbassadorDashboard'
import PayoutModal from '../components/referral/PayoutModal'

export default function MyReferrals() {
  const { user } = useAuthStore()
  const [showPayout, setShowPayout] = useState(false)
  const [tab, setTab] = useState<'refer' | 'network'>('refer')

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setTab('refer')}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab === 'refer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Refer & Earn
          </button>
          <button
            onClick={() => setTab('network')}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab === 'network' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ambassador Network
          </button>
        </div>
      </div>

      {tab === 'refer' ? (
        <ReferralDashboard onWithdraw={() => setShowPayout(true)} />
      ) : (
        <AmbassadorDashboard />
      )}

      <PayoutModal
        isOpen={showPayout}
        onClose={() => setShowPayout(false)}
        maxAmount={user?.earningsBalance || 0}
      />
    </>
  )
}
