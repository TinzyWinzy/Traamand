import { ShieldCheck } from 'lucide-react'
import FindMaidForm from '../components/forms/FindMaidForm'

export default function FindMaid() {
  return (
    <section className="bg-gradient-to-b from-brand-cream to-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-teal-light px-4 py-1.5 text-sm font-medium text-brand-teal">
              <ShieldCheck className="h-4 w-4" />
              Police Vetted &bull; Background Checked
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Find a Maid
            </h1>
            <p className="mt-3 text-gray-600">
              Tell us what you need and we&apos;ll match you with the perfect domestic worker.
            </p>
          </div>

          <FindMaidForm />
        </div>
      </div>
    </section>
  )
}
