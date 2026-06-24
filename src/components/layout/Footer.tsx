import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { COMPANY_NAME, ADDRESS, PHONE_NUMBERS, EMAIL, SERVICE_CATEGORIES } from '../../lib/constants'

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <img src="/logo.jpg" alt="Traamand" className="h-12 w-auto" />
              <span className="text-lg font-bold"><span className="text-brand-red">TRAA</span><span className="text-white">MAND</span></span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
              Employment Services
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Connecting Harare families with trusted, vetted domestic workers.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Services</h3>
            <ul className="space-y-1.5 text-sm">
              {SERVICE_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link to="/available-staff" className="transition hover:text-brand-teal">{cat}s</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                <span>{ADDRESS}</span>
              </li>
              {PHONE_NUMBERS.map((num) => (
                <li key={num}>
                  <a href={`tel:${num.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 transition hover:text-white">
                    <Phone className="h-4 w-4 shrink-0 text-brand-teal" /> {num}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-teal" /> {EMAIL}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Trust Badges</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Document Verified
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Background Screened
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Professionally Trained
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
