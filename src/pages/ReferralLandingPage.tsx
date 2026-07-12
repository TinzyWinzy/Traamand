import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Shield, Star, Users, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { getUserByReferralCode, incrementReferralClick } from '../firebase/firestore'

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>()
  const [referrer, setReferrer] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    getUserByReferralCode(code).then((user) => {
      if (user) {
        setReferrer({ name: user.name || 'A Traamand member' })
        incrementReferralClick(code)
        sessionStorage.setItem('traamand_ref', code.toUpperCase())
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [code])

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <section className="min-h-[90vh] bg-gradient-to-b from-teal-50 to-white py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100 shadow-lg shadow-teal-200/50">
          <Shield className="h-10 w-10 text-teal-600" />
        </div>

        <h1 className="mt-8 text-3xl font-extrabold text-slate-900 leading-tight">
          {referrer
            ? `${referrer.name} invited you to Traamand`
            : 'You\'ve been invited to Traamand'}
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-md mx-auto">
          Find reliable, verified domestic workers — maids, nannies, chefs, and more — all with the Divine Seal of trust.
        </p>

        <div className="mt-10 grid gap-4 text-left">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Verified Workers</p>
              <p className="text-sm text-slate-500">Every worker has passed ID, police, and reference checks.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Star className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Satisfaction Guaranteed</p>
              <p className="text-sm text-slate-500">30-day replacement guarantee on every placement.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Users className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Refer & Earn</p>
              <p className="text-sm text-slate-500">Share with friends. Get $5 cash when they hire a worker.</p>
            </div>
          </div>
        </div>

        <Link
          to="/sign-in"
          className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-teal-600/30 transition hover:bg-teal-700 active:scale-95"
        >
          Get Started <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-6 text-sm text-slate-400">
          No credit card required. Sign in with Google to start.
        </p>
      </div>
    </section>
  )
}
