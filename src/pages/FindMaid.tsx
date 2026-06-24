import { ShieldCheck } from 'lucide-react'
import { COMPANY_NAME } from '../lib/constants'
import FindMaidForm from '../components/forms/FindMaidForm'

export default function FindMaid() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
              <ShieldCheck className="h-4 w-4" />
              Document Verified &bull; Background Screened
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Hire a Domestic Worker
            </h1>
            <p className="mt-3 text-slate-500">
              Tell us what you need and we&apos;ll match you with a document-verified,
              background-screened domestic worker from {COMPANY_NAME}.
            </p>
          </div>

          <FindMaidForm />
        </div>
      </div>
    </section>
  )
}
