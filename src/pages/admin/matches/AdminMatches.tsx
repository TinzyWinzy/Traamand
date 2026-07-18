import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Loader2, MessageCircle, ExternalLink, User, BookOpen, Check, X } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import type { Applicant, Booking } from '../../../types'
import { calculateMatchScore, type MatchResult } from '../../../lib/matching'
import { generateWhatsAppUrl } from '../../../lib/whatsapp'
import { SERVICE_CATEGORIES } from '../../../lib/constants'

const SCORE_THRESHOLDS = [0, 20, 40, 60, 80] as const

export default function AdminMatches() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minScore, setMinScore] = useState(40)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [applicantsSnap, bookingsSnap] = await Promise.all([
          getDocs(query(collection(db, 'applicants'), where('status', 'in', ['new', 'screened']), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'bookings'), where('status', '==', 'inquiry'), orderBy('createdAt', 'desc'), limit(50))),
        ])
        setApplicants(applicantsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Applicant))
        setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
      } catch (err) {
        console.error('Failed to load matches data:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const allMatches = useMemo(() => {
    const results: (MatchResult & { applicant: Applicant })[] = []
    for (const a of applicants) {
      for (const b of bookings) {
        const result = calculateMatchScore(b, {
          position: a.position,
          serviceAreas: a.serviceAreas ?? [],
          workType: a.workType ?? '',
          yearsOfExperience: a.yearsOfExperience ?? 0,
          availabilityTimeline: a.availabilityTimeline ?? '',
        })
        results.push({ ...result, applicant: a })
      }
    }
    return results
  }, [applicants, bookings])

  const filtered = useMemo(() => {
    return allMatches.filter((m) => {
      if (categoryFilter && m.booking.serviceType !== categoryFilter) return false
      if (m.score < minScore) return false
      if (searchTerm) {
        const s = searchTerm.toLowerCase()
        const nameMatch = m.applicant.fullName.toLowerCase().includes(s)
        const suburbMatch = m.booking.clientAddress.suburb.toLowerCase().includes(s)
        const clientMatch = m.booking.clientName?.toLowerCase().includes(s)
        if (!nameMatch && !suburbMatch && !clientMatch) return false
      }
      return true
    }).sort((a, b) => b.score - a.score)
  }, [allMatches, categoryFilter, minScore, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Intelligent Matching</h1>
        <p className="text-sm text-slate-500">
          {filtered.length} matches · {applicants.length} applicants · {bookings.length} open inquiries
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applicant, suburb, client..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          >
            <option value="">All Categories</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Min score:</span>
          <div className="flex gap-1">
            {SCORE_THRESHOLDS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMinScore(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  minScore === t
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 0 ? 'All' : `${t}+`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-sm text-slate-400">No matches found matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Score</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Applicant</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Position</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Job</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Location</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Match Details</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m, i) => (
                <tr key={`${m.applicant.id}-${m.booking.id}-${i}`} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        m.score >= 70
                          ? 'bg-green-100 text-green-700'
                          : m.score >= 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {m.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-900">{m.applicant.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.applicant.position}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{m.booking.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {m.booking.clientAddress.suburb}, {m.booking.clientAddress.city}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <MatchBadge matched={m.categoryMatch} label="Category" />
                      <MatchBadge matched={m.locationMatch} label="Location" />
                      <MatchBadge matched={m.workTypeMatch} label="Work Type" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/applicants?focus=${m.applicant.id}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-teal-200 hover:text-teal-600"
                        title="View Applicant"
                      >
                        <User className="h-4 w-4" />
                      </a>
                      <a
                        href={`/admin/bookings?focus=${m.booking.id}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-teal-200 hover:text-teal-600"
                        title="View Booking"
                      >
                        <BookOpen className="h-4 w-4" />
                      </a>
                      <a
                        href={generateWhatsAppUrl(
                          '+263783562678',
                          `Match Alert: ${m.applicant.fullName} (${m.applicant.position}) is a ${m.score}% match for ${m.booking.serviceType} job in ${m.booking.clientAddress.suburb}. Can we proceed?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 p-1.5 text-green-600 transition hover:border-green-300 hover:bg-green-50"
                        title="Notify Admin on WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MatchBadge({ matched, label }: { matched: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        matched ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
      }`}
    >
      {matched ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  )
}
