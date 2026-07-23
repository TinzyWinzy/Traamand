import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOHead from '../../components/seo/SEOHead'
import {
  Star,
  MapPin,
  Clock,
  Shield,
  BadgeCheck,
  Filter,
  ChevronDown,
  X,
  Loader2,
  MessageCircle,
  Calendar,
  ArrowLeft,
} from 'lucide-react'
import { CATEGORIES } from '../../lib/constants'
import { getAvailableWorkers } from '../../firebase/firestore'
import type { Worker, WorkType } from '../../types'

export default function WorkerList() {
  const { category: categorySlug } = useParams<{ category: string }>()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    location: '',
    workType: '',
    minRating: 0,
    language: '',
  })

  const category = useMemo(
    () => CATEGORIES.find((c) => c.slug === categorySlug),
    [categorySlug]
  )

  useEffect(() => {
    setLoading(true)
    getAvailableWorkers()
      .then((all) => {
        if (category) {
          const skillMap: Record<string, string[]> = {
            Maid: ['cleaning', 'maid', 'housekeeping', 'laundry'],
            Nanny: ['newborn', 'infant', 'childcare', 'nanny', 'toddler'],
            Chef: ['cooking', 'baking', 'chef', 'meal'],
            Gardener: ['gardening', 'lawn', 'landscaping', 'garden'],
            'Nurse Aide': ['elderly', 'nurse', 'patient', 'medication'],
            Driver: ['driving', 'driver', 'chauffeur', 'route'],
            'Sales Lady': ['sales', 'retail', 'customer-service'],
            'Bar Lady': ['bartending', 'mixology', 'bar'],
          }
          const keywords = skillMap[category.name] || [category.name.toLowerCase()]
          const filtered = all
            .filter((w) =>
              w.skills.some((s) => keywords.some((k) => s.includes(k)))
            )
            .sort((a, b) => b.rating - a.rating)
          setWorkers(filtered)
        } else {
          setWorkers(all)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [category])

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (filters.location && !w.availability.preferredLocations.some((l: string) => l.toLowerCase().includes(filters.location.toLowerCase()))) return false
      if (filters.workType && !w.availability.workType.includes(filters.workType as WorkType)) return false
      if (filters.minRating && w.rating < filters.minRating) return false
      if (filters.language && !w.languages.some((l: string) => l.toLowerCase() === filters.language.toLowerCase())) return false
      return true
    })
  }, [workers, filters])

  const allLocations = useMemo(
    () => [...new Set(workers.flatMap((w) => w.availability.preferredLocations))].sort(),
    [workers]
  )

  const allLanguages = useMemo(
    () => [...new Set(workers.flatMap((w) => w.languages))].sort(),
    [workers]
  )

  if (!category) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-500">Category not found.</p>
      </div>
    )
  }

  return (
    <>
      <SEOHead
        title={`${category.name}s in Harare`}
        description={`Browse Divine Seal verified ${category.name.toLowerCase()}s available in Harare. ${workers.length} workers with background checks. Book in 3 taps.`}
        canonical={`https://traamand.co.zw/hire/${category.slug}`}
      />
    <section className="min-h-screen bg-zinc-50 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" /> Back to all categories
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {category.name}s in Harare
          </h1>
          <p className="mt-2 text-slate-500">
            {loading ? 'Loading workers...' : `${workers.length} Divine Seal verified ${category.name.toLowerCase()}s available now`}
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
              showFilters
                ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.location || filters.workType || filters.minRating || filters.language) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                {[filters.location, filters.workType, filters.minRating, filters.language].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {(filters.location || filters.workType || filters.minRating || filters.language) && (
            <button
              onClick={() => setFilters({ location: '', workType: '', minRating: 0, language: '' })}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Suburb</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Any suburb</option>
                  {allLocations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Work Type</label>
                <select
                  value={filters.workType}
                  onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Any type</option>
                  <option value="live-in">Live-in</option>
                  <option value="daily">Daily</option>
                  <option value="part-time">Part-time</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value={0}>Any rating</option>
                  <option value={4}>4.0+</option>
                  <option value={4.5}>4.5+</option>
                  <option value={4.8}>4.8+</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Language</label>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Any language</option>
                  {allLanguages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Filter className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-semibold text-slate-700">No workers match your filters</p>
            <p className="mt-1 text-sm text-slate-500">Try removing some filters or expanding your search.</p>
            <button
              onClick={() => setFilters({ location: '', workType: '', minRating: 0, language: '' })}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((worker) => (
              <div
                key={worker.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-teal-200"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    {worker.photos?.[0] ? (
                      <img src={worker.photos[0]} alt={worker.displayName} loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover object-top shadow-sm" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 text-2xl font-bold text-teal-700 shadow-sm">
                        {worker.displayName.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900">{worker.displayName}</h3>
                        {worker.verificationStatus === 'premium' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                            <Shield className="h-3 w-3" /> Divine Seal Premium
                          </span>
                        )}
                        {worker.verificationStatus === 'verified' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {worker.rating}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {worker.reviewCount} reviews
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {worker.availability.preferredLocations.slice(0, 2).join(', ')}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {worker.experienceYears} yrs exp
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {worker.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {skill.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>

                      <p className="mt-2.5 text-sm leading-relaxed text-slate-600 line-clamp-2">
                        {worker.bio}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Placement Fee</p>
                      <p className="text-2xl font-extrabold text-slate-900">${worker.placementFee}</p>
                      <p className="text-xs text-slate-400">
                        ${worker.monthlySalaryRange.min}–${worker.monthlySalaryRange.max}/mo salary
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to={`/worker/${worker.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/book/${worker.slug}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-700/30 active:scale-[0.97]"
                      >
                        <Calendar className="h-4 w-4" />
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    </>
  )
}
