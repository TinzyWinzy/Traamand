import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Shield,
  BadgeCheck,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ArrowLeft,
  Trash2,
  Star,
  MapPin,
  Eye,
  Calendar,
  DollarSign,
  Database,
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import { generateWorkerSlug } from '../../../lib/worker'
import WorkerImportCSV from '../../../components/admin/WorkerImportCSV'
import type { Worker, Booking } from '../../../types'

function formatDate(ts: any) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminWorkers() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/sign-in')
      return
    }
    if (!authLoading && isAuthenticated) {
      fetchData()
    }
  }, [authLoading, isAuthenticated, user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [workersSnap, bookingsSnap] = await Promise.all([
        getDocs(query(collection(db, 'workers'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(200))),
      ])
      setWorkers(workersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Worker))
      setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking))
    } catch {
      addToast('Failed to load workers', 'error')
    }
    setLoading(false)
  }

  const seedWorkers = async () => {
    if (!confirm('Seed 11 sample workers across all categories? They will appear on the landing page immediately.')) return
    const seedData = [
      { firstName: 'Maria', lastName: 'Dube', category: 'Maid', skills: ['cleaning', 'maid', 'housekeeping'], placementFee: 50 },
      { firstName: 'Chipo', lastName: 'Moyo', category: 'Maid', skills: ['cleaning', 'laundry', 'maid'], placementFee: 45 },
      { firstName: 'Linda', lastName: 'Ndlovu', category: 'Nanny', skills: ['newborn', 'childcare', 'nanny'], placementFee: 55 },
      { firstName: 'Ruth', lastName: 'Sibanda', category: 'Nanny', skills: ['infant', 'toddler', 'nanny'], placementFee: 60 },
      { firstName: 'Tafadzwa', lastName: 'Chikwanha', category: 'Chef', skills: ['cooking', 'chef', 'meal', 'baking'], placementFee: 70 },
      { firstName: 'Nyasha', lastName: 'Mukandi', category: 'Chef', skills: ['cooking', 'chef', 'meal'], placementFee: 65 },
      { firstName: 'Farai', lastName: 'Gumbo', category: 'Gardener', skills: ['gardening', 'lawn', 'landscaping'], placementFee: 40 },
      { firstName: 'Tendai', lastName: 'Makoni', category: 'Nurse Aide', skills: ['elderly', 'nurse', 'patient'], placementFee: 60 },
      { firstName: 'Simba', lastName: 'Mvenge', category: 'Driver', skills: ['driving', 'driver', 'chauffeur'], placementFee: 50 },
      { firstName: 'Priscilla', lastName: 'Mashava', category: 'Sales Lady', skills: ['sales', 'retail', 'customer-service'], placementFee: 45 },
      { firstName: 'Nancy', lastName: 'Chigumba', category: 'Bar Lady', skills: ['bartending', 'mixology', 'bar'], placementFee: 45 },
    ]
    let count = 0
    for (const s of seedData) {
      try {
        await addDoc(collection(db, 'workers'), {
          firstName: s.firstName,
          lastName: s.lastName,
          displayName: `${s.firstName} ${s.lastName}`,
          slug: generateWorkerSlug(s.firstName, s.lastName, 'harare', s.category),
          category: s.category,
          verificationStatus: 'verified',
          divineSeal: {
            idVerified: true,
            policeClearance: true,
            referenceVideoUrl: '',
            medicalClearance: true,
            trainingCompleted: true,
            verifiedAt: serverTimestamp(),
            verifiedBy: 'system',
          },
          photos: [],
          bio: `${s.firstName} is a reliable and experienced ${s.category.toLowerCase()} with over 5 years of experience in Harare.`,
          languages: ['English', 'Shona'],
          skills: s.skills,
          experienceYears: 5,
          previousEmployers: 3,
          availability: {
            status: 'available',
            nextAvailable: null,
            preferredLocations: ['Harare', 'Borrowdale', 'Avondale'],
            workType: ['live-in', 'daily'],
          },
          rating: 4.5,
          reviewCount: 0,
          recentReviews: [],
          hireCount: 0,
          lastHiredAt: null,
          placementFee: s.placementFee,
          monthlySalaryRange: { min: 100, max: 200 },
          metaTitle: `${s.firstName} ${s.lastName} - Verified ${s.category} in Harare | Traamand`,
          metaDescription: `${s.firstName} ${s.lastName} is a verified ${s.category.toLowerCase()} with 5 years experience.`,
          serviceAreas: ['Harare'],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        count++
      } catch {
        addToast(`Failed to seed ${s.firstName} ${s.lastName}`, 'error')
      }
    }
    addToast(`Seeded ${count} workers successfully`, 'success')
    fetchData()
  }

  const toggleActive = async (worker: Worker) => {
    await updateDoc(doc(db, 'workers', worker.id), {
      isActive: !worker.isActive,
      updatedAt: serverTimestamp(),
    })
    setWorkers((prev) =>
      prev.map((w) => (w.id === worker.id ? { ...w, isActive: !w.isActive } : w))
    )
  }

  const deleteWorker = async (worker: Worker) => {
    if (!confirm(`Delete ${worker.displayName}? This cannot be undone.`)) return
    await deleteDoc(doc(db, 'workers', worker.id))
    setWorkers((prev) => prev.filter((w) => w.id !== worker.id))
  }

  const workerStats = (workerId: string) => {
    const workerBookings = bookings.filter((b) => b.workerId === workerId)
    const completed = workerBookings.filter((b) => b.status === 'completed')
    const earnings = completed.reduce((sum, b) => sum + (b.placementFee || 0), 0)
    return { total: workerBookings.length, completed: completed.length, earnings }
  }

  const filtered = workers.filter(
    (w) =>
      w.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      w.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
      w.availability?.preferredLocations?.some((l: string) =>
        l.toLowerCase().includes(search.toLowerCase())
      )
  )

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
              <ArrowLeft className="h-4 w-4" /> Admin Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Worker Management</h1>
            <p className="text-sm text-slate-500">{workers.length} workers · {bookings.length} bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={seedWorkers}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              <Database className="h-5 w-5" /> Seed
            </button>
            <Link
              to="/admin/workers/new"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 active:scale-95"
            >
              <Plus className="h-5 w-5" /> Add Worker
            </Link>
          </div>
        </div>

        {/* Bulk Import */}
        <div className="mb-4">
          <WorkerImportCSV onSuccess={fetchData} />
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, or location..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3.5 font-bold text-slate-600">Worker</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600">Status</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600 hidden sm:table-cell">Rating</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600 hidden md:table-cell">Hired</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600 hidden lg:table-cell">Fee</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600 hidden xl:table-cell">Bookings</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600">Active</th>
                  <th className="px-5 py-3.5 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((worker) => {
                  const stats = workerStats(worker.id)
                  return (
                    <tr key={worker.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-700 shrink-0">
                            {worker.displayName?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{worker.displayName}</p>
                            <p className="text-xs text-slate-400 truncate">
                              <MapPin className="inline h-3 w-3 mr-0.5" />
                              {worker.availability?.preferredLocations?.[0] || '—'}
                              <span className="mx-1.5">·</span>
                              {worker.skills?.slice(0, 2).join(', ')?.replace(/-/g, ' ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${
                            worker.verificationStatus === 'premium'
                              ? 'bg-amber-100 text-amber-700'
                              : worker.verificationStatus === 'verified'
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {worker.verificationStatus === 'premium' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <BadgeCheck className="h-3 w-3" />
                          )}
                          {worker.verificationStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {worker.rating}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="text-sm">
                          <p className="font-semibold text-slate-900">{worker.hireCount} hire{worker.hireCount !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-slate-400">
                            <Calendar className="inline h-3 w-3 mr-0.5" />
                            {formatDate(worker.lastHiredAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="font-semibold text-slate-900">${worker.placementFee}</span>
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        <div className="text-sm">
                          <p className="font-semibold text-slate-900">{stats.completed}/{stats.total} done</p>
                          <p className="text-xs text-slate-400">
                            <DollarSign className="inline h-3 w-3 mr-0.5" />${stats.earnings} earned
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleActive(worker)}
                          className={worker.isActive ? 'text-green-600' : 'text-slate-300'}
                        >
                          {worker.isActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/worker/${worker.slug}`}
                            target="_blank"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
                            title="View public profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/workers/${worker.id}/edit`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteWorker(worker)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                )}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-slate-400">No workers found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
