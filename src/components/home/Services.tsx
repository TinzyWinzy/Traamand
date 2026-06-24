import { Sparkles, Baby, ChefHat, Trees, Heart, Car, ShoppingBag, Wine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { COMPANY_NAME } from '../../lib/constants'

const CATEGORIES = [
  { icon: Sparkles, label: 'Maids', desc: 'Housekeeping, cleaning & laundry' },
  { icon: Baby, label: 'Nannies', desc: 'Childcare, newborn care & tutoring' },
  { icon: ChefHat, label: 'Chefs', desc: 'Cooking, baking & meal planning' },
  { icon: Trees, label: 'Gardeners', desc: 'Lawn care, landscaping & pruning' },
  { icon: Heart, label: 'Nurse Aides', desc: 'Elderly care, medication & mobility support' },
  { icon: Car, label: 'Drivers', desc: 'Chauffeur, school runs & fleet management' },
  { icon: ShoppingBag, label: 'Sales Ladies', desc: 'Retail, customer service & merchandising' },
  { icon: Wine, label: 'Bar Ladies', desc: 'Bartending, mixology & event service' },
]

export default function Services() {
  return (
    <section className="bg-zinc-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Staff We Provide
          </h2>
          <p className="mt-4 text-slate-500">
            {COMPANY_NAME} recruits, vets, and places candidates across a wide range of domestic
            and professional roles.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <cat.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{cat.label}</h3>
              <p className="mt-1 text-xs text-slate-500">{cat.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/available-staff"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Browse Available Staff
          </Link>
        </div>
      </div>
    </section>
  )
}
