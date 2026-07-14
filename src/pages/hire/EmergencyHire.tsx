import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Baby,
  ChefHat,
  Trees,
  Heart,
  Car,
  ShoppingBag,
  Wine,
  Zap,
  Star,
  Shield,
  BadgeCheck,
  ArrowRight,
  Building2,
  Phone,
  Users,
  ThumbsUp,
  Clock,
  MapPin,
  Quote,
  ChevronRight,
} from 'lucide-react'
import {
  CATEGORIES,
  COMPANY_NAME,
  EMPLOYMENT_AGENT_SERVICES,
  HOUSE_CLEANING_ACTIVITIES,
  PRIMARY_PHONE,
  type CategoryMeta,
} from '../../lib/constants'
import type { Worker } from '../../types'
import SEOHead from '../../components/seo/SEOHead'
import {
  generateHiringWebsiteStructuredData,
  generateOrganizationStructuredData,
} from '../../lib/structuredData'
import { getAvailableWorkers } from '../../firebase/firestore'

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Baby,
  ChefHat,
  Trees,
  Heart,
  Car,
  ShoppingBag,
  Wine,
}

function getCategoryWorkerCount(cat: CategoryMeta, workers: Worker[]): number {
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
  const keywords = skillMap[cat.name] || [cat.name.toLowerCase()]
  return workers.filter((w) =>
    w.skills.some((s) => keywords.some((k) => s.includes(k)))
  ).length
}

const TRUST_SIGNALS = [
  { icon: Building2, label: 'Registered Company', desc: 'Licensed in Zimbabwe' },
  { icon: BadgeCheck, label: 'Divine Seal Vetted', desc: 'ID, police, references' },
  { icon: Shield, label: '30-Day Guarantee', desc: 'Free replacement' },
  { icon: Clock, label: 'Hire in 3 Minutes', desc: 'Instant availability' },
]

const TESTIMONIALS = [
  {
    quote: 'I needed a nanny at 6 PM. By 6:15 PM, I had booked Linda. She started the next morning. Absolutely divine.',
    author: 'Tendai M.',
    location: 'Borrowdale',
    rating: 5,
  },
  {
    quote: 'The Divine Seal verification gave me peace of mind. Maria has been with us for 3 months and she is exceptional.',
    author: 'Sarah K.',
    location: 'Avondale',
    rating: 5,
  },
  {
    quote: 'No more WhatsApp groups begging for help. Traamand found us a chef in minutes. Michael is a gem.',
    author: 'David C.',
    location: 'Mt Pleasant',
    rating: 5,
  },
]

const STEPS = [
  {
    number: '01',
    icon: Sparkles,
    title: 'Pick Your Need',
    desc: 'Select the type of domestic worker you need. Maid, nanny, chef, gardener — we have all categories.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Choose Your Match',
    desc: 'Browse Divine Seal verified workers near you. Watch intro videos, read reviews, compare ratings.',
  },
  {
    number: '03',
    icon: BadgeCheck,
    title: 'Book & Relax',
    desc: 'Confirm your booking, pay the placement fee, and your worker arrives. 30-day replacement guarantee.',
  },
]

const SEO_AREAS = [
  'Borrowdale',
  'Avondale',
  'Mt Pleasant',
  'Greendale',
  'Highlands',
  'Mabelreign',
  'Hatfield',
  'Eastlea',
]

const SEARCH_INTENTS = [
  'maids in Harare',
  'maids near me',
  'domestic workers in Harare',
  'housekeepers in Harare',
  'nannies in Harare',
  'chefs in Harare',
  'gardeners in Harare',
  'nurse aides in Harare',
  'drivers in Harare',
  'house cleaning in Harare',
  'home cleaning services Harare',
  'deep cleaning services Harare',
  'gardeners in Harare',
  'elderly care Harare',
  'drivers near me Harare',
]

export default function HomePage() {
  const [workerCounts, setWorkerCounts] = useState<Record<string, number>>({})
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [recentlyHired, setRecentlyHired] = useState<Worker | null>(null)

  useEffect(() => {
    getAvailableWorkers()
      .then((workers) => {
        const counts: Record<string, number> = {}
        CATEGORIES.forEach((cat) => {
          counts[cat.name] = getCategoryWorkerCount(cat, workers)
        })
        setWorkerCounts(counts)
        setTotalAvailable(workers.length)

        const topWorker = workers
          .filter((w) => w.hireCount > 10)
          .sort((a, b) => b.rating - a.rating)[0]
        if (topWorker) setRecentlyHired(topWorker)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <SEOHead
        title="Maids in Harare Near Me | Traamand Employment Services"
        description="Find verified maids, nannies, chefs, gardeners, nurse aides, drivers, sales ladies, and bar ladies in Harare, Zimbabwe. Traamand vets domestic workers and helps families book quickly."
        canonical="https://traamand.co.zw"
        keywords={SEARCH_INTENTS}
        structuredData={[generateOrganizationStructuredData(), generateHiringWebsiteStructuredData()]}
      />
      {/*  HERO  */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-teal-dark">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8 lg:pb-36 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <Building2 className="h-4 w-4 text-brand-teal" />
                Registered Employment Company
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <Shield className="h-4 w-4 text-green-400" />
                Divine Seal Verified
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Find Trusted, Vetted Domestic Help in{' '}
              <span className="text-brand-teal">Harare</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-200 sm:text-xl">
              {COMPANY_NAME} connects you with document-verified, background-screened maids, nannies,
              chefs, gardeners, and more. Every worker is Divine Seal verified — ID checked, police
              cleared, and reference confirmed. Hire in 3 minutes or less.
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
              Searching for maids near me, domestic workers in Harare, nannies, housekeepers, chefs,
              gardeners, nurse aides, drivers, sales ladies, or bar ladies? Traamand serves families
              across Harare with verified staff ready for interviews and bookings.
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/80">
              Employment agent for carefully selected service providers: maids, gardeners,
              nurse aides, drivers, nannies, chefs, sales ladies, and bar ladies.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/hire/maids"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-red/25 transition-all hover:bg-brand-red-dark hover:shadow-xl hover:shadow-brand-red/30 active:scale-95 sm:w-auto"
              >
                Find a Worker Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href={`tel:${PRIMARY_PHONE.replace(/\s/g, '')}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-white/30 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/50 active:scale-95 sm:w-auto"
              >
                <Phone className="h-5 w-5" />
                Call {PRIMARY_PHONE}
              </a>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-brand-teal" /> {totalAvailable}+ workers
              </span>
              <span className="h-4 w-px bg-white/20" />
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.7 avg rating
              </span>
              <span className="h-4 w-px bg-white/20" />
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-400" /> Divine Seal Guarantee
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Maids and Domestic Workers Near You in Harare
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Traamand helps households find verified maids, housekeepers, nannies, chefs,
              gardeners, nurse aides, drivers, sales ladies, and bar ladies in Harare. We support
              clients searching for domestic help near me, maid services in Harare, nanny services,
              part-time housekeepers, live-in maids, and trusted household staff with checks before
              placement.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Service areas</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEO_AREAS.map((area) => (
                <span key={area} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              House Cleaning Services Traamand Maids Can Cover
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              For clients searching house cleaning in Harare, home cleaning services, cleaners
              near me, or maid services, Traamand maids can support everyday housekeeping and
              heavier cleaning jobs. The goal is simple: match households with reliable people who
              can handle the work that actually happens inside a home.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {HOUSE_CLEANING_ACTIVITIES.map((activity) => (
                <div key={activity} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {activity}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Employment Agent for Carefully Selected Service Providers
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Traamand is not only for maid services. The employment agency model covers multiple
              household and workplace roles, with screening, applicant review, admin follow-up,
              and WhatsApp support built into the placement process.
            </p>
            <div className="mt-5 space-y-2">
              {EMPLOYMENT_AGENT_SERVICES.map((service) => (
                <div key={service} className="flex items-center gap-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-teal-600" />
                  {service}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/*  TRUST BAR  */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TRUST_SIGNALS.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  CATEGORIES  */}
      <section className="bg-zinc-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
              <Zap className="h-4 w-4" />
              Find & hire in under 3 minutes
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What do you need today?
            </h2>
            <p className="mt-3 text-slate-500">
              All workers are Divine Seal verified — ID, police clearance, and references checked.
            </p>
          </div>

          {recentlyHired && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 text-center shadow-sm">
              <p className="text-sm font-medium text-amber-800">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/50 px-2 py-0.5 text-xs font-bold text-amber-700">
                  <Zap className="h-3 w-3" /> JUST HIRED
                </span>{' '}
                <strong>{recentlyHired.displayName}</strong> in{' '}
                {recentlyHired.availability.preferredLocations[0]} —{' '}
                {recentlyHired.rating}{' '}
                <Star className="inline h-3 w-3 fill-amber-500 text-amber-500" /> ({recentlyHired.reviewCount} reviews)
              </p>
            </div>
          )}

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon]
              const count = workerCounts[cat.name] ?? 0
              return (
                <Link
                  key={cat.id}
                  to={`/hire/${cat.slug}`}
                  className="group flex flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:border-teal-400 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 shadow-sm transition-colors group-hover:from-teal-100 group-hover:to-teal-200">
                    {Icon && <Icon className="h-8 w-8" />}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {cat.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 group-hover:bg-teal-100 transition-colors">
                    {count} available
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/*  HOW IT WORKS  */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-4 py-1.5 text-sm font-medium text-brand-red">
              <Clock className="h-4 w-4" />
              Three minutes or less
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-slate-500">
              From need to booked in three simple steps. No WhatsApp groups, no waiting.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
                  <step.icon className="h-10 w-10" />
                </div>
                <div className="absolute -top-3 right-1/2 translate-x-16 rounded-full bg-brand-navy px-2.5 py-0.5 text-xs font-bold text-white shadow">
                  {step.number}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 mx-auto max-w-xs text-sm leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center justify-center gap-3">
            <Link
              to="/hire/maids"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-teal-700 hover:shadow-lg active:scale-95"
            >
              Start Hiring Now
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/*  TESTIMONIALS  */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
              <ThumbsUp className="h-4 w-4" />
              Trusted by Harare families
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What Our Clients Say
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Quote className="mb-4 h-8 w-8 text-teal-200" />
                <p className="text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-sm font-bold text-slate-900">{t.author}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {t.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  BOTTOM CTA  */}
      <section className="bg-gradient-to-r from-brand-teal to-brand-teal-dark py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to Find Your Domestic Help?
            </h2>
            <p className="mt-4 text-lg text-teal-100">
              Skip the WhatsApp groups. Browse Divine Seal verified workers, book in 3 taps,
              and enjoy a 30-day replacement guarantee.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/hire/maids"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-lg shadow-black/10 transition-all hover:bg-teal-50 hover:shadow-xl active:scale-95 sm:w-auto"
              >
                Browse Available Workers
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/join-our-team"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 active:scale-95 sm:w-auto"
              >
                Apply as a Worker
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
