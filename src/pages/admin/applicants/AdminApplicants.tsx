import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Loader2, ChevronDown, UserPlus,
  Phone, MessageCircle, FileText, BookOpen,
  CheckCircle, X, ExternalLink, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { generateWhatsAppUrl } from '../../../lib/whatsapp'
import { generateWorkerSlug } from '../../../lib/worker'
import { useToastStore } from '../../../stores/toastStore'
import { verifyNationalId, parseResume, verifyPoliceClearance, computeOverallVerification, makeVerification } from '../../../lib/verification'
import type { Applicant, ApplicantStatus, DocumentVerification, ApplicantVerification } from '../../../types'

const PIPELINE_STAGES: { status: ApplicantStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { status: 'screened', label: 'Screened', color: 'bg-indigo-100 text-indigo-700' },
  { status: 'interviewed', label: 'Interviewed', color: 'bg-purple-100 text-purple-700' },
  { status: 'training', label: 'Training', color: 'bg-amber-100 text-amber-700' },
  { status: 'approved', label: 'Approved', color: 'bg-teal-100 text-teal-700' },
  { status: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
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

const NEXT_STAGES: Record<ApplicantStatus, ApplicantStatus[]> = {
  new: ['screened', 'rejected'],
  screened: ['interviewed', 'rejected'],
  interviewed: ['training', 'approved', 'rejected'],
  training: ['approved', 'rejected'],
  approved: ['converted'],
  converted: [],
  rejected: [],
}

export default function AdminApplicants() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | ''>('')
  const [modalId, setModalId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [verification, setVerification] = useState<ApplicantVerification | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/sign-in')
      return
    }
    fetchApplicants()
  }, [user])

  const fetchApplicants = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'applicants'), orderBy('createdAt', 'desc'), limit(50))
      const snap = await getDocs(q)
      setApplicants(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Applicant))
    } catch (err) {
      addToast('Failed to load applicants', 'error')
    }
    setLoading(false)
  }

  const updateStatus = async (applicantId: string, status: ApplicantStatus) => {
    try {
      await updateDoc(doc(db, 'applicants', applicantId), {
        status,
        reviewedBy: user?.name || 'admin',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? { ...a, status, reviewedBy: user?.name || 'admin' } : a))
      )
    } catch (err) {
      addToast('Failed to update status', 'error')
    }
  }

  const convertToWorker = async (applicant: Applicant) => {
    const workerData = {
      firstName: applicant.fullName.split(' ')[0] || '',
      lastName: applicant.fullName.split(' ').slice(1).join(' ') || '',
      displayName: applicant.fullName,
      slug: generateWorkerSlug(
        applicant.fullName.split(' ')[0] || '',
        applicant.fullName.split(' ').slice(1).join(' ') || '',
        'harare',
        applicant.position
      ),
      verificationStatus: 'pending',
      divineSeal: {
        idVerified: false,
        policeClearance: false,
        referenceVideoUrl: '',
        medicalClearance: false,
        trainingCompleted: false,
        verifiedAt: null,
        verifiedBy: '',
      },
      photos: [],
      bio: '',
      languages: [applicant.primaryLanguage] || [],
      skills: [applicant.position.toLowerCase().replace(/\s+/g, '-')],
      experienceYears: applicant.yearsOfExperience,
      previousEmployers: 0,
      availability: {
        status: 'available',
        nextAvailable: null,
        preferredLocations: ['Harare'],
        workType: ['live-in', 'daily'] as ('live-in' | 'daily' | 'part-time' | 'temporary')[],
      },
      rating: 0,
      reviewCount: 0,
      recentReviews: [],
      hireCount: 0,
      lastHiredAt: null,
      placementFee: 50,
      monthlySalaryRange: { min: 100, max: 200 },
      metaTitle: `${applicant.fullName} - Verified ${applicant.position} in Harare | Traamand`,
      metaDescription: `${applicant.fullName} is a ${applicant.position.toLowerCase()} with ${applicant.yearsOfExperience} years experience.`,
      serviceAreas: ['Harare'],
      isActive: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      const workerRef = await addDoc(collection(db, 'workers'), workerData)
      await updateDoc(doc(db, 'applicants', applicant.id), {
        status: 'converted',
        convertedWorkerId: workerRef.id,
        updatedAt: serverTimestamp(),
      })
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicant.id
            ? { ...a, status: 'converted' as ApplicantStatus, convertedWorkerId: workerRef.id }
            : a
        )
      )
    } catch (err) {
      addToast('Failed to convert applicant', 'error')
    }
  }

  const runVerification = async (applicant: Applicant) => {
    setVerifying(true)
    setVerification(null)

    const id = applicant.nationalIdUrl?.startsWith('http')
      ? await verifyNationalId(applicant.nationalIdUrl)
      : makeVerification({ status: 'pending', issues: ['No ID document uploaded'] })

    const police = applicant.policeClearanceUrl?.startsWith('http')
      ? await verifyPoliceClearance(applicant.policeClearanceUrl)
      : makeVerification({ status: 'pending', issues: ['No police clearance uploaded – optional'] })

    const resume = makeVerification({ status: 'pass', issues: [], extractedData: { note: 'Resume parsing not available' } })

    const result = computeOverallVerification(id, resume, police)
    setVerification(result)
    setVerifying(false)
  }

  const setManualVerification = (idStatus: 'pass' | 'fail', policeStatus: 'pass' | 'fail') => {
    const id = makeVerification({
      status: idStatus,
      method: 'manual',
      confidence: idStatus === 'pass' ? 100 : 0,
      verifiedBy: 'admin',
    })
    const police = makeVerification({
      status: policeStatus,
      method: 'manual',
      confidence: policeStatus === 'pass' ? 100 : 0,
      verifiedBy: 'admin',
    })
    const resume = makeVerification({ status: 'pass', issues: [], extractedData: { note: 'Resume parsing not available' } })
    const result = computeOverallVerification(id, resume, police)
    setVerification(result)
  }

  const resetVerification = () => {
    setVerification(null)
    setVerifying(false)
  }

  const formatDate = (ts: unknown) => {
    if (!ts) return '—'
    const d = (ts as { toDate?: () => Date }).toDate?.()
    if (!d) return '—'
    return d.toLocaleDateString('en-ZW', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filtered = applicants.filter((a) => {
    const matchesSearch =
      a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      a.position?.toLowerCase().includes(search.toLowerCase()) ||
      a.phone?.includes(search)
    const matchesStatus = !statusFilter || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedByStatus = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.status] = filtered.filter((a) => a.status === stage.status)
      return acc
    },
    {} as Record<string, Applicant[]>
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Applicant Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">{applicants.length} total applicants</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'table' ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'kanban' ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, position, or phone..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicantStatus | '')}
            className="h-12 rounded-2xl border border-slate-200 bg-white pl-4 pr-8 text-sm outline-none appearance-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.status} value={s.status}>{s.label} ({groupedByStatus[s.status]?.length || 0})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Kanban view */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = groupedByStatus[stage.status] || []
            return (
              <div key={stage.status} className="min-w-[280px] flex-shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-sm text-slate-400">{items.length}</span>
                  </div>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {items.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
                      <p className="text-xs text-slate-300">Empty</p>
                    </div>
                  ) : (
                    items.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{applicant.fullName}</p>
                            <p className="text-xs text-slate-500">{applicant.position}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[applicant.status]}`}>
                            {applicant.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span>{applicant.yearsOfExperience}yrs</span>
                          <span>{applicant.education}</span>
                          <span>{formatDate(applicant.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {applicant.phone && (
                            <a
                              href={`tel:${applicant.phone.replace(/\s/g, '')}`}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 transition"
                              title="Call"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {applicant.phone && (
                            <a
                              href={generateWhatsAppUrl(applicant.phone, `Hi ${applicant.fullName.split(' ')[0]}, this is Traamand regarding your application.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-200 p-1.5 text-green-500 hover:bg-green-50 transition"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {NEXT_STAGES[applicant.status]?.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-3 flex flex-wrap gap-1.5">
                            {NEXT_STAGES[applicant.status].map((nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() => updateStatus(applicant.id, nextStatus)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  nextStatus === 'rejected'
                                    ? 'text-red-600 hover:bg-red-50 border border-red-200'
                                    : nextStatus === 'converted'
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-teal-600 text-white hover:bg-teal-700'
                                }`}
                              >
                                {nextStatus === 'converted' ? 'Convert to Worker' : `Move to ${nextStatus}`}
                              </button>
                            ))}
                          </div>
                        )}
                        {applicant.status === 'approved' && (
                          <div className="mt-2">
                            <button
                              onClick={() => convertToWorker(applicant)}
                              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                            >
                              <UserPlus className="inline h-3.5 w-3.5 mr-1" />
                              Create Worker Profile
                            </button>
                          </div>
                        )}
                        {applicant.status === 'converted' && applicant.convertedWorkerId && (
                          <div className="mt-2 text-center text-xs text-emerald-600 font-semibold">
                            <CheckCircle className="inline h-3.5 w-3.5 mr-1" />
                            Worker profile created
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table view */
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <p className="text-slate-400">No applicants found.</p>
            </div>
          ) : (
            filtered.map((applicant) => (
              <div
                key={applicant.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div
                  className="flex cursor-pointer items-center justify-between px-5 py-4"
                  onClick={() => setModalId(applicant.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-700 shrink-0">
                      {applicant.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{applicant.fullName}</p>
                      <p className="text-sm text-slate-500">{applicant.position} &middot; {applicant.yearsOfExperience}yrs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[applicant.status]}`}>
                      {applicant.status}
                    </span>
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modalId && (() => {
        const applicant = applicants.find((a) => a.id === modalId)
        if (!applicant) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-10 pb-10 overflow-y-auto"
            onClick={() => setModalId(null)}
          >
            <div
              className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
                <div>
                  <h2 className="text-lg font-bold">{applicant.fullName}</h2>
                  <p className="text-sm text-white/80">{applicant.position} &middot; {applicant.yearsOfExperience}yrs experience</p>
                </div>
                <button
                  onClick={() => setModalId(null)}
                  className="rounded-xl bg-white/20 p-2 transition hover:bg-white/30"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[applicant.status]}`}>
                    {applicant.status}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</p>
                    <p className="font-medium text-slate-700 mt-1">{applicant.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Age</p>
                    <p className="font-medium text-slate-700 mt-1">{applicant.age || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Education</p>
                    <p className="font-medium text-slate-700 mt-1">{applicant.education || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Language</p>
                    <p className="font-medium text-slate-700 mt-1">{applicant.primaryLanguage || '—'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next of Kin</p>
                    <p className="font-medium text-slate-700 mt-1">{applicant.nextOfKinContact || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Applied</p>
                    <p className="font-medium text-slate-700 mt-1">{formatDate(applicant.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Source</p>
                    <p className="font-medium text-slate-700 mt-1">{applicant.source || '—'}</p>
                  </div>
                </div>

                {/* Documents */}
                {(applicant.nationalIdUrl || applicant.policeClearanceUrl) && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Documents</p>
                    {applicant.nationalIdUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">National ID:</span>
                        {applicant.nationalIdUrl.startsWith('http') ? (
                          <a href={applicant.nationalIdUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline truncate max-w-[200px]">
                            {applicant.nationalIdUrl.split('/').pop()}
                          </a>
                        ) : (
                          <span className="font-medium text-slate-700">{applicant.nationalIdUrl}</span>
                        )}
                      </div>
                    )}
                    {applicant.policeClearanceUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Police Clearance:</span>
                        {applicant.policeClearanceUrl.startsWith('http') ? (
                          <a href={applicant.policeClearanceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline truncate max-w-[200px]">
                            {applicant.policeClearanceUrl.split('/').pop()}
                          </a>
                        ) : (
                          <span className="font-medium text-slate-700">{applicant.policeClearanceUrl}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Verification */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verification</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setManualVerification('pass', 'pass')}
                          className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-200"
                        >
                          Mark All Pass
                        </button>
                        <button
                          onClick={() => setManualVerification('fail', 'fail')}
                          className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-200"
                        >
                          Mark All Fail
                        </button>
                      </div>
                      <button
                        onClick={() => runVerification(applicant)}
                        disabled={verifying}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {verifying ? 'AI...' : 'AI Verify'}
                      </button>
                    </div>
                  </div>
                  {verification && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">ID:</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          verification.idVerification.status === 'pass' ? 'bg-emerald-100 text-emerald-700' :
                          verification.idVerification.status === 'fail' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{verification.idVerification.status}</span>
                        {verification.idVerification.status !== 'pending' && (
                          <span className="text-xs text-slate-400">{verification.idVerification.confidence}% confidence</span>
                        )}
                        {verification.idVerification.method === 'manual' && (
                          <span className="text-[10px] text-slate-400">(manual)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">Police:</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          verification.policeClearance.status === 'pass' ? 'bg-emerald-100 text-emerald-700' :
                          verification.policeClearance.status === 'fail' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{verification.policeClearance.status}</span>
                        {verification.policeClearance.status !== 'pending' && (
                          <span className="text-xs text-slate-400">{verification.policeClearance.confidence}% confidence</span>
                        )}
                        {verification.policeClearance.method === 'manual' && (
                          <span className="text-[10px] text-slate-400">(manual)</span>
                        )}
                      </div>
                      {(verification.idVerification.issues.length > 0 || verification.policeClearance.issues.length > 0) && (
                        <div className="space-y-1">
                          {[...verification.idVerification.issues, ...verification.policeClearance.issues].map((issue, i) => (
                            <p key={i} className="flex items-center gap-1.5 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" /> {issue}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="rounded-lg bg-slate-50 p-3 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">Overall Score</span>
                          <span className={`text-lg font-extrabold ${
                            verification.overallScore >= 70 ? 'text-emerald-600' :
                            verification.overallScore >= 40 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>{verification.overallScore}/100</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="font-semibold text-slate-700">Recommendation</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            verification.recommendation === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            verification.recommendation === 'review' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{verification.recommendation}</span>
                        </div>
                        {verification.summary && (
                          <p className="text-xs text-slate-500 mt-2">{verification.summary}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Converted badge */}
                {applicant.convertedWorkerId && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Converted to worker:</span>
                    <span className="text-emerald-700 font-mono text-xs">{applicant.convertedWorkerId}</span>
                  </div>
                )}

                {/* Contact */}
                {applicant.phone && (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${applicant.phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                    <a
                      href={generateWhatsAppUrl(applicant.phone, `Hi ${applicant.fullName.split(' ')[0]}, this is Traamand regarding your application.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </div>
                )}

                {/* Pipeline Actions */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pipeline Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {PIPELINE_STAGES.map((stage) => {
                      const isCurrent = applicant.status === stage.status
                      const isDisabled = isCurrent || (applicant.status === 'converted' && stage.status !== 'converted')
                      return (
                        <button
                          key={stage.status}
                          onClick={() => {
                            updateStatus(applicant.id, stage.status)
                            setModalId(null)
                          }}
                          disabled={isDisabled}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCurrent
                              ? 'bg-teal-600 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {stage.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Convert to Worker */}
                {applicant.status === 'approved' && (
                  <button
                    onClick={() => {
                      convertToWorker(applicant)
                      setModalId(null)
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
                  >
                    <UserPlus className="h-5 w-5" />
                    Convert to Worker Profile
                  </button>
                )}

                {/* Notes */}
                {applicant.notes && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3">{applicant.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
