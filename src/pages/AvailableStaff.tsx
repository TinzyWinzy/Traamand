import { ShieldCheck, BadgeCheck, ScrollText } from 'lucide-react'
import { CANDIDATES, COMPANY_NAME } from '../lib/constants'
import CandidateCard from '../components/staff/CandidateCard'

export default function AvailableStaff() {
  return (
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CANDIDATES.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      </div>
    </section>
  )
}
