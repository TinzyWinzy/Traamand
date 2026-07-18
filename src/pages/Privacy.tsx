import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { COMPANY_NAME } from '../lib/constants'

export default function Privacy() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
          <p className="mt-1 text-sm text-slate-500">Last updated: July 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Profile information (photo, bio, skills, experience)</li>
              <li>Identity documents (submitted by applicants for verification)</li>
              <li>Booking and payment history</li>
              <li>Communications with other users</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve our platform services</li>
              <li>To process bookings and payments</li>
              <li>To verify worker credentials</li>
              <li>To send service-related notifications</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900">3. Information Sharing</h2>
            <p>
              We share information only as necessary to provide our services:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Between clients and workers to facilitate bookings</li>
              <li>With our payment processor (Paynow) to process transactions</li>
              <li>With verifiers for credential verification purposes</li>
              <li>When required by law or to protect our rights</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>

            <h2 className="text-lg font-bold text-slate-900">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect
              your personal data. However, no method of electronic storage is 100% secure.
            </p>

            <h2 className="text-lg font-bold text-slate-900">5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed
              to provide services. You may request deletion of your account and associated
              data by contacting us.
            </p>

            <h2 className="text-lg font-bold text-slate-900">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and platform functionality.
              We do not use tracking cookies for advertising purposes.
            </p>

            <h2 className="text-lg font-bold text-slate-900">8. Contact</h2>
            <p>
              For privacy-related inquiries, contact us through the details on our website
              or email us at the address listed in the footer.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
