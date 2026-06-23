import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-teal-dark">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-green-400" />
            Police Vetted &bull; Background Checked &bull; Trained
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find Trusted Domestic Help in{' '}
            <span className="text-brand-teal">Harare</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-gray-200 sm:text-xl">
            Traamand Maids connects you with vetted, police-cleared, and
            professionally trained domestic workers. Whether you need a live-in
            maid, nanny, or housekeeper — we make hiring safe and simple.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/find-a-maid"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-brand-red-dark active:scale-95 sm:w-auto"
            >
              Hire a Maid
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/join-our-team"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 active:scale-95 sm:w-auto"
            >
              Apply for a Job
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
