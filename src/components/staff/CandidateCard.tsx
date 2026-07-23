import { Link } from 'react-router-dom'
import { BadgeCheck, ShieldCheck, Video, Stethoscope, GraduationCap, Star, Phone, MapPin, Briefcase } from 'lucide-react'
import type { Worker } from '../../types'
import { WHATSAPP_NUMBERS, generateWhatsAppUrl } from '../../lib/whatsapp'

interface Props {
  worker: Worker
}

const divineSealItems = [
  { key: 'idVerified' as const, label: 'National ID Verified', icon: BadgeCheck },
  { key: 'policeClearance' as const, label: 'Police Clearance', icon: ShieldCheck },
  { key: 'referenceVideoUrl' as const, label: 'Reference Video', icon: Video },
  { key: 'medicalClearance' as const, label: 'Medical Clearance', icon: Stethoscope },
  { key: 'trainingCompleted' as const, label: 'Training Completed', icon: GraduationCap },
]

export default function CandidateCard({ worker }: Props) {
  const whatsappUrl = generateWhatsAppUrl(
    WHATSAPP_NUMBERS.bookings,
    `Hi Traamand, I am interested in interviewing ${worker.displayName} (#${worker.id}) for a ${worker.category} role.`
  )

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-slate-100">
        {worker.photos?.[0] ? (
          <img
            src={worker.photos[0]}
            alt={worker.displayName}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Briefcase className="h-12 w-12" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700 backdrop-blur">
          {worker.category}
        </span>
        {worker.rating > 0 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-amber-600 backdrop-blur">
            <Star className="h-3 w-3 fill-amber-400" />
            {worker.rating.toFixed(1)} ({worker.reviewCount})
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <Link
            to={`/worker/${worker.slug}`}
            className="text-base font-bold text-slate-900 hover:text-brand-teal transition"
          >
            {worker.displayName}
          </Link>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {worker.experienceYears} yrs exp
          </span>
          {worker.previousEmployers > 0 && (
            <span className="inline-flex items-center gap-1">
              {worker.previousEmployers} employers
            </span>
          )}
          {worker.serviceAreas?.[0] && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {worker.serviceAreas[0]}
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {worker.skills?.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {skill}
            </span>
          ))}
          {(worker.skills?.length ?? 0) > 4 && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
              +{worker.skills.length - 4}
            </span>
          )}
        </div>

        {worker.languages && worker.languages.length > 0 && (
          <p className="mb-3 text-xs text-slate-400">
            {worker.languages.join(', ')}
          </p>
        )}

        <div className="mb-4 space-y-1 border-t border-slate-100 pt-3">
          {divineSealItems.map(({ key, label, icon: Icon }) => {
            const value = worker.divineSeal?.[key]
            const verified = key === 'referenceVideoUrl' ? !!value : value === true
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                {verified ? (
                  <Icon className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
                )}
                <span className={verified ? 'text-slate-700' : 'text-slate-400'}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mb-4 flex items-center justify-between text-xs">
          {worker.monthlySalaryRange ? (
            <span className="text-slate-600">
              <span className="font-medium text-slate-800">${worker.monthlySalaryRange.min}</span>
              {worker.monthlySalaryRange.max > worker.monthlySalaryRange.min && (
                <> – ${worker.monthlySalaryRange.max}</>
              )}
              /mo
            </span>
          ) : (
            <span />
          )}
          {worker.placementFee > 0 && (
            <span className="text-slate-400">
              Fee: ${worker.placementFee}
            </span>
          )}
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98]"
        >
          <Phone className="h-4 w-4" />
          Request to Hire
        </a>
      </div>
    </div>
  )
}
