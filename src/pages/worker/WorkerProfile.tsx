import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star,
  MapPin,
  Clock,
  Shield,
  BadgeCheck,
  MessageCircle,
  Calendar,
  ArrowLeft,
  Loader2,
  Play,
  Quote,
} from 'lucide-react'
import { getWorker } from '../../firebase/firestore'
import { generateWhatsAppUrl, generateHireInquiryMessage } from '../../lib/whatsapp'
import SEOHead from '../../components/seo/SEOHead'
import { generateWorkerStructuredData } from '../../lib/structuredData'
import { WHATSAPP_NUMBERS } from '../../lib/whatsapp'
import type { Worker } from '../../types'

export default function WorkerProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getWorker(slug).then((w) => {
      setWorker(w)
      setLoading(false)

      if (w) {
        document.title = w.metaTitle
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.setAttribute('content', w.metaDescription)

        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(generateWorkerStructuredData(w))
        script.id = 'structured-data'
        const existing = document.getElementById('structured-data')
        if (existing) existing.remove()
        document.head.appendChild(script)
      }
    })
  }, [slug])

  useEffect(() => () => {
    const existing = document.getElementById('structured-data')
    if (existing) existing.remove()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Worker not found.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-teal-600 hover:underline">
            Back to categories
          </Link>
        </div>
      </div>
    )
  }

  const whatsappUrl = generateWhatsAppUrl(
    WHATSAPP_NUMBERS.bookings,
    generateHireInquiryMessage(worker.id, worker.displayName, worker.skills[0] || 'Worker')
  )

  const sealComplete =
    worker.divineSeal.idVerified &&
    worker.divineSeal.policeClearance &&
    worker.divineSeal.medicalClearance &&
    worker.divineSeal.trainingCompleted

  const verificationItems = [
    { label: 'National ID Verified', done: worker.divineSeal.idVerified },
    { label: 'Police Clearance', done: worker.divineSeal.policeClearance },
    { label: 'Medical Clearance', done: worker.divineSeal.medicalClearance },
    { label: 'Professional Training', done: worker.divineSeal.trainingCompleted },
    { label: 'Reference Checks', done: worker.verificationStatus !== 'pending' },
  ]

  return (
    <>
      <SEOHead
        title={worker.metaTitle}
        description={worker.metaDescription}
        canonical={`https://traamand.co.zw/worker/${worker.slug}`}
        ogType="profile"
        structuredData={generateWorkerStructuredData(worker)}
      />
    <section className="min-h-screen bg-zinc-50 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" /> Back to workers
        </Link>

        {/* Hero Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="relative bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy p-8 text-white sm:p-10">
            <div className="absolute right-6 top-6">
              {worker.verificationStatus === 'premium' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-4 py-1.5 text-sm font-bold text-amber-300 border border-amber-400/30">
                  <Shield className="h-4 w-4" /> Divine Seal Premium
                </span>
              )}
              {worker.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 px-4 py-1.5 text-sm font-bold text-teal-300 border border-teal-400/30">
                  <BadgeCheck className="h-4 w-4" /> Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-5">
              {worker.photos?.[0] ? (
                <img src={worker.photos[0]} alt={worker.displayName} className="h-24 w-24 shrink-0 rounded-3xl object-cover shadow-2xl border-2 border-white/20" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-4xl font-extrabold text-white shadow-2xl border-2 border-white/20">
                  {worker.displayName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">{worker.displayName}</h1>
                <p className="mt-1 text-lg text-white/80">{worker.skills[0]?.replace(/-/g, ' ')}</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-white">{worker.rating}</span>
                    <span className="text-white/50">({worker.reviewCount} reviews)</span>
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="text-white/70">{worker.hireCount} hires</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm italic text-white/80">
                &ldquo;{worker.bio.slice(0, 120)}...&rdquo;
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Experience', value: `${worker.experienceYears} yrs` },
                { icon: Star, label: 'Rating', value: `${worker.rating}/5` },
                { icon: MapPin, label: 'Areas', value: `${worker.availability.preferredLocations.length}` },
                { icon: Quote, label: 'References', value: `${worker.previousEmployers} employers` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-50 p-4 text-center">
                  <stat.icon className="mx-auto h-5 w-5 text-teal-600" />
                  <p className="mt-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-extrabold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">About {worker.displayName.split(' ')[0]}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{worker.bio}</p>
            </div>

            {/* Skills */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Skills & Expertise</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <span key={skill} className="rounded-xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 border border-teal-100">
                    {skill.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Languages</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.languages.map((lang) => (
                  <span key={lang} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Work Preferences */}
            <div className="mt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Work Preferences</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.availability.workType.map((type) => (
                  <span key={type} className="rounded-xl bg-brand-cream px-4 py-2 text-sm font-medium capitalize text-slate-700 border border-slate-200">
                    {type.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Service Areas */}
            <div className="mt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Service Areas</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.availability.preferredLocations.map((loc) => (
                  <span key={loc} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200">
                    <MapPin className="h-3.5 w-3.5 text-teal-500" />
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            {/* Intro Video */}
            {worker.divineSeal.referenceVideoUrl ? (
              <div className="mt-8 overflow-hidden rounded-2xl bg-black">
                <video
                  data-testid="worker-video"
                  src={worker.divineSeal.referenceVideoUrl}
                  controls
                  className="w-full aspect-video"
                  playsInline
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="mt-8 overflow-hidden rounded-2xl bg-slate-900">
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                      <Play className="h-8 w-8" />
                    </div>
                    <p className="mt-3 text-sm text-white/60">Introduction video coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Divine Seal Verification */}
            <div className="mt-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-amber-900">
                <Shield className="h-5 w-5" />
                Divine Seal Verification
              </h3>
              <div className="mt-4 space-y-3">
                {verificationItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/60 p-3">
                    <span className={`text-sm font-medium ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                    <BadgeCheck className={`h-5 w-5 ${item.done ? 'text-amber-500' : 'text-slate-300'}`} />
                  </div>
                ))}
              </div>
              {sealComplete && (
                <div className="mt-4 rounded-xl bg-amber-100/80 px-4 py-3 text-sm font-semibold text-amber-800 border border-amber-200">
                  Full Divine Seal — this worker has completed all verification steps including ID, police clearance, medical, and training.
                </div>
              )}
            </div>

            {/* Booking CTA */}
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white shadow-xl shadow-teal-600/25">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <p className="text-teal-100 text-sm">Placement Fee</p>
                  <p className="text-3xl font-extrabold">${worker.placementFee}</p>
                  <p className="mt-1 text-sm text-teal-200">
                    Monthly salary: ${worker.monthlySalaryRange.min}–${worker.monthlySalaryRange.max}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                  <Link
                    to={`/book/${worker.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-teal-700 shadow transition-all hover:bg-teal-50 hover:shadow-lg active:scale-95"
                  >
                    <Calendar className="h-5 w-5" />
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
