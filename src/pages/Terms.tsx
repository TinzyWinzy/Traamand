import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { COMPANY_NAME } from '../lib/constants'
import SEOHead from '../components/seo/SEOHead'

export default function Terms() {
  return (
    <>
      <SEOHead
        title="Terms of Service | Traamand Employment Services"
        description="Read the Terms of Service for using Traamand's domestic worker placement platform in Harare, Zimbabwe."
        canonical="https://traamand.co.zw/terms"
      />
    <section className="bg-zinc-50 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
          <p className="mt-1 text-sm text-slate-500">Last updated: July 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
            <h2 className="text-lg font-bold text-slate-900">1. Introduction</h2>
            <p>
              Welcome to {COMPANY_NAME}. By using our platform, you agree to these Terms of Service.
              If you do not agree, please do not use our services.
            </p>

            <h2 className="text-lg font-bold text-slate-900">2. Definitions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>"Platform"</strong> means the {COMPANY_NAME} website and related services.</li>
              <li><strong>"Client"</strong> means a user seeking to hire domestic workers.</li>
              <li><strong>"Applicant"</strong> means a user applying to be listed as a worker.</li>
              <li><strong>"Verifier"</strong> means a user who verifies applicant credentials.</li>
              <li><strong>"Creator"</strong> means a user who creates content for the platform.</li>
              <li><strong>"Sponsor"</strong> means a user who sponsors advertising on the platform.</li>
              <li><strong>"Advertiser"</strong> means a user who places advertisements.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities under your account. You must provide accurate information
              and keep it updated.
            </p>

            <h2 className="text-lg font-bold text-slate-900">4. Bookings & Payments</h2>
            <p>
              All bookings are subject to availability. Payments are processed through our
              third-party payment provider (Paynow). Refund and cancellation policies are
              displayed at the time of booking.
            </p>

            <h2 className="text-lg font-bold text-slate-900">5. Worker Listings</h2>
            <p>
              Worker profiles are created based on information provided by applicants and
              verified by our verifiers. While we take reasonable steps to verify credentials,
              we do not guarantee the accuracy of all information.
            </p>

            <h2 className="text-lg font-bold text-slate-900">6. Prohibited Conduct</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Misrepresenting your identity or role</li>
              <li>Attempting to bypass our booking or payment systems</li>
              <li>Harassing workers, clients, or other users</li>
              <li>Using the platform for any illegal purpose</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900">7. Limitation of Liability</h2>
            <p>
              {COMPANY_NAME} acts as a marketplace connecting clients with domestic workers.
              We are not directly liable for the conduct of workers or clients. Our liability
              is limited to the maximum extent permitted by Zimbabwean law.
            </p>

            <h2 className="text-lg font-bold text-slate-900">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified
              of material changes via email or platform notice.
            </p>

            <h2 className="text-lg font-bold text-slate-900">9. Contact</h2>
            <p>
              For questions about these terms, contact us through the details provided on
              our website.
            </p>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
