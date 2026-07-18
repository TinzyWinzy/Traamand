import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ShieldCheck, BadgeCheck, ScrollText, LoaderCircle, AlertCircle, User } from 'lucide-react'
import { COMPANY_NAME } from '../lib/constants'
import { getAvailableWorkers } from '../firebase/firestore'
import CandidateCard from '../components/staff/CandidateCard'
import type { Worker } from '../types'

export default function AvailableStaff() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAvailableWorkers()
      .then((data) => {
        if (!cancelled) {
          setWorkers(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load available staff')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <Helmet>
        <title>Available Staff — {COMPANY_NAME}</title>
        <meta name="description" content={`Browse ${COMPANY_NAME}'s current roster of document-verified domestic workers available for hire in Harare, Zimbabwe.`} />
      </Helmet>

      <section className="bg-zinc-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Our Available Staff
            </h1>
            <p className="mt-3 text-slate-500">
              Browse {COMPANY_NAME}&apos;s current roster of document-verified domestic workers.
              Each profile shows vetting status — tap &ldquo;Request to Hire&rdquo; to inquire via WhatsApp.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-amber-500" /> National ID
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Police Clearance
              </span>
              <span className="inline-flex items-center gap-1">
                <ScrollText className="h-3.5 w-3.5 text-amber-500" /> Reference Check
              </span>
            </div>
          </div>

          <div className="mt-10">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>Loading available staff...</span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && workers.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <User className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No staff currently available.</p>
                <p className="text-xs text-slate-400">Check back soon or contact us to be notified when new staff are available.</p>
              </div>
            )}

            {!loading && !error && workers.length > 0 && (
              <>
                <p className="mb-6 text-center text-sm text-slate-400">
                  Showing {workers.length} available worker{workers.length !== 1 ? 's' : ''}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {workers.map((w) => (
                    <CandidateCard key={w.id} worker={w} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
