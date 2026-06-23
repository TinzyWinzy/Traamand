import { useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Sparkles, Phone, MapPin } from 'lucide-react'
import { NAV_LINKS, PRIMARY_PHONE, ADDRESS } from '../../lib/constants'
import MobileDrawer from './MobileDrawer'

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <>
      <div className="hidden sm:flex bg-brand-navy text-white/80 text-xs">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {PRIMARY_PHONE}
            </span>
            <span className="hidden md:flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {ADDRESS}
            </span>
          </div>
          <span className="text-white/60">Registered Employment Company</span>
        </div>
      </div>

      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-teal" />
            <div>
              <span className="text-xl font-bold tracking-tight block leading-tight">
                Traamand
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest hidden sm:block">
                Employment Services
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-teal border-b-2 border-brand-teal pb-1'
                      : 'text-gray-600 hover:text-brand-navy'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              to="/find-a-maid"
              className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
            >
              Hire Now
            </Link>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden rounded-lg p-3 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}
