import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Phone, MessageCircle, CheckCircle, XCircle, Clock,
  ChevronRight, FileText, Calendar, Search, UserCheck,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { getApplicantsByPhone, getApplicantsByUserId, updateApplicant } from '../../firebase/firestore'
import { generateWhatsAppUrl } from '../../lib/whatsapp'
import { WHATSAPP_NUMBERS } from '../../lib/whatsapp'
import type { Applicant, ApplicantStatus } from '../../types'

const PIPELINE: { status: ApplicantStatus; label: string; desc: string }[] = [
  { status: 'new', label: 'Application Received', desc: 'We have your application' },
  { status: 'screened', label: 'Screening', desc: 'Reviewing your details' },
  { status: 'interviewed', label: 'Interview', desc: 'Interview completed' },
  { status: 'training', label: 'Training', desc: 'Training in progress' },
  { status: 'approved', label: 'Approved', desc: 'Ready for placement' },
  { status: 'converted', label: 'Placed', desc: 'Successfully placed' },
  { status: 'rejected', label: 'Not Accepted', desc: 'Application not successful' },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  screened: 'bg-indigo-100 text-indigo-700',
  interviewed: 'bg-purple-100 text-purple-700',
  training: 'bg-amber-100 text-amber-700',
  approved: 'bg-teal-100 text-teal-700',
  converted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

function formatDate(ts: unknown) {
  if (!ts) return '—'
  const d = (ts as { toDate?: () => Date }).toDate?.()
  if (!d) return '—'
  return d.toLocaleDateString('en-ZW', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MyApplication() {
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    getApplicantsByUserId(user.id).then((results) => {
      setApplicants(results)
      setLoading(false)
    }).catch(() => {
      addToast('Failed to load applications', 'error')
      setLoading(false)
    })
  }, [user?.id])

  const handleLinkApplication = async () => {
    const raw = phoneInput.replace(/\s+/g, '')
    if (!raw) return
    setLinking(true)
    setSearchedPhone(raw)
    try {
      const results = await getApplicantsByPhone(raw)
      const unlinked = results.filter((a) => !a.userId || a.userId === user?.id)
      if (unlinked.length === 0) {
        addToast('No applications found for that phone number', 'error')
        setApplicants([])
      } else {
        await Promise.all(
          unlinked.map((a) => updateApplicant(a.id, { userId: user!.id }))
        )
        const linked = unlinked.map((a) => ({ ...a, userId: user!.id }))
        setApplicants(linked)
        addToast('Application linked to your account', 'success')
      }
    } catch {
      addToast('Failed to find application', 'error')
    }
    setLinking(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (applicants.length === 0) {
    return (
      <section className="min-h-[60vh] bg-zinc-50 py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
            <FileText className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-slate-900">No Applications Found</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter the phone number you used when applying to link your application.
          </p>

          <div className="mt-6 text-left">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone number used on application</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLinkApplication() }}
                placeholder="e.g. 0772 123 456"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                onClick={handleLinkApplication}
                disabled={linking || !phoneInput.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Find
              </button>
            </div>
          </div>

          {searchedPhone && applicants.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">
              No application found for <strong>{searchedPhone}</strong>. Double-check the number or{' '}
              <Link to="/join-our-team" className="text-teal-600 underline">apply now</Link>.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/join-our-team" className="rounded-2xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-teal-700">
              Apply Now
            </Link>
            <Link to="/" className="text-sm text-teal-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-xs font-bold text-teal-700 mb-3">
            <UserCheck className="h-3.5 w-3.5" /> Linked to your account
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Application</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track the status of your applications to join Traamand
          </p>
        </div>

        <div className="space-y-6">
          {applicants.map((applicant) => {
            const currentIdx = PIPELINE.findIndex((p) => p.status === applicant.status)
            const isRejected = applicant.status === 'rejected'
            const isConverted = applicant.status === 'converted'

            return (
              <div
                key={applicant.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{applicant.position}</h2>
                      <p className="text-sm text-white/80">{applicant.fullName}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[applicant.status]}`}>
                      {applicant.status}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-6">
                  {/* Pipeline Progress */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Progress</p>
                    <div className="space-y-0">
                      {PIPELINE.map((step, i) => {
                        const isPast = i <= currentIdx && !isRejected
                        const isCurrent = i === currentIdx

                        let icon
                        if (isRejected && i === currentIdx) {
                          icon = <XCircle className="h-5 w-5 text-red-500" />
                        } else if (isPast && isConverted && i === PIPELINE.length - 1) {
                          icon = <CheckCircle className="h-5 w-5 text-emerald-500" />
                        } else if (isPast) {
                          icon = <CheckCircle className="h-5 w-5 text-teal-500" />
                        } else if (isCurrent) {
                          icon = <Clock className="h-5 w-5 text-amber-500" />
                        } else {
                          icon = <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                        }

                        return (
                          <div key={step.status} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center">{icon}</div>
                              {i < PIPELINE.length - 1 && (
                                <div className={`h-8 w-0.5 ${isPast && !isRejected ? 'bg-teal-300' : 'bg-slate-200'}`} />
                              )}
                            </div>
                            <div className={`pb-6 ${isCurrent ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-40'}`}>
                              <p className={`text-sm font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>
                                {step.label}
                              </p>
                              <p className="text-xs text-slate-400">{step.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Applied</p>
                      <p className="font-medium text-slate-700 mt-1">
                        {formatDate(applicant.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Experience</p>
                      <p className="font-medium text-slate-700 mt-1">{applicant.yearsOfExperience} years</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Education</p>
                      <p className="font-medium text-slate-700 mt-1">{applicant.education || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Language</p>
                      <p className="font-medium text-slate-700 mt-1">{applicant.primaryLanguage || '—'}</p>
                    </div>
                  </div>

                  {/* Interview date */}
                  {applicant.interviewDate && (
                    <div className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-sm">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">
                        Interview scheduled: {formatDate(applicant.interviewDate)}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {applicant.notes && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes from reviewer</p>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3">{applicant.notes}</p>
                    </div>
                  )}

                  {/* Documents uploaded */}
                  <div className="flex flex-wrap gap-2">
                    {applicant.nationalIdUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        <FileText className="h-3.5 w-3.5" /> ID Uploaded
                      </span>
                    )}
                    {applicant.policeClearanceUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        <FileText className="h-3.5 w-3.5" /> Police Clearance Uploaded
                      </span>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                    <a
                      href={`tel:${applicant.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <Phone className="h-4 w-4" /> Call Us
                    </a>
                    <a
                      href={generateWhatsAppUrl(WHATSAPP_NUMBERS.bookings, `Hi Traamand, I'm following up on my application for ${applicant.position}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700">
            Back to Home <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
