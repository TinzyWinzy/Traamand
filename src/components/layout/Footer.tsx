import { Link } from 'react-router-dom'
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-brand-teal" />
              <span className="text-lg font-bold">Traamand Maids</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Connecting Harare families with trusted, vetted domestic workers since 2020.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="transition hover:text-brand-teal">Home</Link></li>
              <li><Link to="/find-a-maid" className="transition hover:text-brand-teal">Find a Maid</Link></li>
              <li><Link to="/join-our-team" className="transition hover:text-brand-teal">Join Our Team</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-teal" /> +263 77 000 0000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-teal" /> info@traamandmaids.co.zw</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-teal" /> Harare, Zimbabwe</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Trust Badges</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Police Vetted
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Background Checked
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Trained Professionals
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Traamand Maids. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
