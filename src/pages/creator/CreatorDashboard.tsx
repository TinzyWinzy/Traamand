import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Video, Camera, FileText, DollarSign, CheckCircle,
  XCircle, Clock, Upload, Loader2, ArrowLeft, ExternalLink,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { createCreatorSubmission, getCreatorSubmissions, getTransactions } from '../../firebase/firestore'
import { generateReferralCode } from '../../lib/referral'
import type { CreatorSubmission, Transaction } from '../../types'

const PAYOUT_TABLE = [
  { type: 'Facebook post', requirement: '100+ engagements', payout: 5 },
  { type: 'TikTok/Instagram Reel', requirement: '1,000+ views', payout: 10 },
  { type: 'YouTube review', requirement: '5,000+ views', payout: 50 },
  { type: 'Blog post', requirement: 'Published + shared', payout: 20 },
  { type: 'Testimonial video', requirement: 'Approved + used', payout: 25 },
  { type: 'Day-in-the-life video', requirement: '10,000+ views', payout: 100 },
]

export default function CreatorDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [contentType, setContentType] = useState<CreatorSubmission['contentType']>('tiktok')
  const [url, setUrl] = useState('')
  const [views, setViews] = useState(0)
  const [engagements, setEngagements] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.id)) {
      navigate('/sign-in')
      return
    }
    if (!authLoading && user?.id) {
      Promise.all([
        getCreatorSubmissions(user.id),
        getTransactions(user.id),
      ]).then(([subs, txns]) => {
        setSubmissions(subs)
        setTransactions(txns)
        setLoading(false)
      }).catch(() => {
        addToast('Failed to load creator data', 'error')
        setLoading(false)
      })
    }
  }, [addToast, authLoading, isAuthenticated, navigate, user?.id])

  const handleSubmit = async () => {
    if (!url.trim() || !user?.id) return
    setSubmitting(true)
    try {
      await createCreatorSubmission({
        userId: user.id,
        creatorCode: user.referralCode || generateReferralCode(),
        contentType,
        url: url.trim(),
        screenshotUrl: '',
        views,
        engagements,
      })
      addToast('Content submitted for review!', 'success')
      setShowForm(false)
      setUrl('')
      setViews(0)
      setEngagements(0)
      const updated = await getCreatorSubmissions(user.id)
      setSubmissions(updated)
    } catch {
      addToast('Failed to submit content', 'error')
    }
    setSubmitting(false)
  }

  const creatorEarnings = transactions
    .filter((t) => t.type === 'creator_payout' && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

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
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-xs font-bold text-purple-700 mb-3">
                <Video className="h-3.5 w-3.5" /> Creator Fund
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Create. Share. Earn.</h1>
              <p className="text-sm text-slate-500">Get paid for content featuring Traamand.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Lifetime earnings</p>
              <p className="text-2xl font-extrabold text-teal-700">${creatorEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Payout table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">How to earn</h2>
            <div className="divide-y divide-slate-100">
              {PAYOUT_TABLE.map((row) => (
                <div key={row.type} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{row.type}</p>
                    <p className="text-xs text-slate-400">{row.requirement}</p>
                  </div>
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">${row.payout}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit content */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!showForm ? (
              <div className="text-center py-6">
                <Upload className="mx-auto h-10 w-10 text-slate-300" />
                <h2 className="mt-3 text-lg font-bold text-slate-900">Submit your content</h2>
                <p className="mt-1 text-sm text-slate-500">Share your Traamand content and get paid.</p>
                <button onClick={() => setShowForm(true)} className="mt-4 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700 transition">
                  Submit Content
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">New Submission</h2>
                  <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['tiktok', 'instagram', 'facebook', 'youtube', 'blog', 'testimonial'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setContentType(t)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          contentType === t
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {t === 'tiktok' ? 'TikTok' : t === 'instagram' ? 'Instagram' : t === 'facebook' ? 'Facebook' : t === 'youtube' ? 'YouTube' : t === 'blog' ? 'Blog' : 'Testimonial'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Content URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Views</label>
                    <input
                      type="number"
                      value={views}
                      onChange={(e) => setViews(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Engagements</label>
                    <input
                      type="number"
                      value={engagements}
                      onChange={(e) => setEngagements(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !url.trim()}
                  className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Submit for Review'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submission history */}
        {submissions.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Your Submissions ({submissions.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                      {s.contentType === 'youtube' ? <Video className="h-4 w-4 text-purple-700" /> :
                       s.contentType === 'blog' ? <FileText className="h-4 w-4 text-purple-700" /> :
                       <Camera className="h-4 w-4 text-purple-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 capitalize">{s.contentType}</p>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline">
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'paid' ? 'bg-teal-100 text-teal-700' :
                      s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status === 'pending' ? <Clock className="h-3 w-3" /> :
                       s.status === 'approved' ? <CheckCircle className="h-3 w-3" /> :
                       s.status === 'paid' ? <DollarSign className="h-3 w-3" /> :
                       <XCircle className="h-3 w-3" />}
                      {s.status}
                    </span>
                    {s.payoutAmount > 0 && (
                      <span className="text-sm font-bold text-teal-700">${s.payoutAmount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
