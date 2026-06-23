import { GraduationCap } from 'lucide-react'
import JoinTeamForm from '../components/forms/JoinTeamForm'

export default function JoinTeam() {
  return (
    <section className="bg-gradient-to-b from-brand-cream to-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-teal-light px-4 py-1.5 text-sm font-medium text-brand-teal">
              <GraduationCap className="h-4 w-4" />
              Join a team that values you
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Join Our Team
            </h1>
            <p className="mt-3 text-gray-600">
              We&apos;re always looking for reliable, experienced domestic workers in Harare.
              Apply today and start earning.
            </p>
          </div>

          <JoinTeamForm />
        </div>
      </div>
    </section>
  )
}
