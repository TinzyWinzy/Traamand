import { BadgeCheck, ShieldCheck, ScrollText, Phone, User } from 'lucide-react'
import type { Candidate } from '../../lib/constants'

interface Props {
  candidate: Candidate
}

export default function CandidateCard({ candidate }: Props) {
  const primaryPhone = "+263715325922"

  const whatsappUrl = `https://wa.me/${primaryPhone}?text=${encodeURIComponent(
    `Hi Traamand, I am interested in interviewing Profile #${candidate.id} for a ${candidate.category} role.`
  )}`

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <User className="h-3.5 w-3.5" />
          {candidate.category}
        </span>
        <span className="text-xs font-mono text-slate-400">#{candidate.id}</span>
      </div>

      <div className="mb-1 text-sm text-slate-500">
        <span className="font-medium text-slate-700">{candidate.experienceYears} yrs</span> experience
      </div>

      <p className="mb-3 text-xs text-slate-400">{candidate.preferredLocation}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {candidate.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mb-5 space-y-1.5 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs">
          {candidate.vetting.nationalIdVerified ? (
            <BadgeCheck className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
          )}
          <span className={candidate.vetting.nationalIdVerified ? 'text-slate-700' : 'text-slate-400'}>
            National ID Verified
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {candidate.vetting.policeClearanceSighted ? (
            <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
          )}
          <span className={candidate.vetting.policeClearanceSighted ? 'text-slate-700' : 'text-slate-400'}>
            Police Clearance Sighted
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {candidate.vetting.referenceChecksCompleted ? (
            <ScrollText className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
          )}
          <span className={candidate.vetting.referenceChecksCompleted ? 'text-slate-700' : 'text-slate-400'}>
            Reference Checks Completed
          </span>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98]"
      >
        <Phone className="h-4 w-4" />
        Request to Hire This Profile
      </a>
    </div>
  )
}
