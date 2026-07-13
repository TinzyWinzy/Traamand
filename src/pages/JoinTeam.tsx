import { COMPANY_NAME } from '../lib/constants'
import JoinTeamForm from '../components/forms/JoinTeamForm'
import SEOHead from '../components/seo/SEOHead'
import { generateJobsPageStructuredData } from '../lib/structuredData'

const JOB_KEYWORDS = [
  'maid jobs in Harare',
  'domestic worker jobs in Zimbabwe',
  'nanny jobs in Harare',
  'housekeeper jobs in Harare',
  'chef jobs in Harare',
  'gardener jobs in Harare',
  'nurse aide jobs in Harare',
  'driver jobs in Harare',
  'sales lady jobs in Harare',
  'bar lady jobs in Harare',
]

const OPEN_ROLES = [
  'Maids and housekeepers',
  'Nannies and childminders',
  'Chefs and cooks',
  'Gardeners',
  'Nurse aides and caregivers',
  'Drivers',
  'Sales ladies',
  'Bar ladies',
]

export default function JoinTeam() {
  return (
    <>
      <SEOHead
        title="Domestic Worker Jobs in Harare | Apply to Traamand"
        description="Apply for maid, nanny, housekeeper, chef, gardener, nurse aide, driver, sales lady, and bar lady jobs in Harare and Zimbabwe through Traamand Employment Services."
        canonical="https://traamand.co.zw/join-our-team"
        keywords={JOB_KEYWORDS}
        structuredData={generateJobsPageStructuredData()}
      />
      <section className="bg-zinc-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Domestic Worker Jobs in Harare
            </h1>
            <p className="mt-3 text-slate-500">
              {COMPANY_NAME} is looking for reliable, experienced domestic workers in Harare and
              across Zimbabwe. Apply for maid jobs, nanny jobs, housekeeper jobs, chef jobs,
              gardener jobs, nurse aide jobs, driver jobs, sales lady jobs, and bar lady jobs.
            </p>
          </div>

          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Roles Traamand is hiring for</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {OPEN_ROLES.map((role) => (
                <div key={role} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {role}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Applicants can use this page when searching for jobs as a maid near me, domestic
              worker vacancies, nanny work, housekeeping work, private chef work, gardening work,
              caregiving work, driving work, retail sales work, and bar service work in Harare.
              Traamand verifies applicants and connects successful candidates with trusted clients.
            </p>
          </div>

          <JoinTeamForm />
          </div>
        </div>
      </section>
    </>
  )
}
