import { COMPANY_NAME } from '../lib/constants'
import JoinTeamForm from '../components/forms/JoinTeamForm'

export default function JoinTeam() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Join Our Team
            </h1>
            <p className="mt-3 text-slate-500">
              {COMPANY_NAME} is looking for reliable, experienced domestic workers in Harare.
              We connect you with trusted employers, offer flexible hours, and advocate for fair pay.
            </p>
          </div>

          <JoinTeamForm />
        </div>
      </div>
    </section>
  )
}
