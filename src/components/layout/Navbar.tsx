import { useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Phone, MapPin, Shield, X, LogOut, DollarSign, Gift } from 'lucide-react'
import { NAV_LINKS, PRIMARY_PHONE, ADDRESS } from '../../lib/constants'
import { useAuthStore } from '../../stores/authStore'
import { logout } from '../../firebase/auth'

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const { user, isAuthenticated, isLoading } = useAuthStore()

  const handleSignOut = async () => {
    await logout()
    closeDrawer()
  }

  return (
    <>
      {/* Top Bar */}
      <div className="hidden border-b border-white/10 bg-brand-navy text-white/70 text-xs sm:block">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-brand-teal" /> {PRIMARY_PHONE}
            </span>
            <span className="hidden lg:flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-brand-teal" /> {ADDRESS}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-400" /> Registered & Licensed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Divine Seal Verified Workers
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.jpg"
              alt="Traamand"
              className="h-10 w-auto rounded-lg transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-brand-red">TRAA</span><span className="text-brand-teal">MAND</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                Employment Services
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isLoading && isAuthenticated && user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Dashboard
                  </Link>
                )}
                {user.role === 'verifier' && (
                  <Link
                    to="/verifier"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Verify
                  </Link>
                )}
                <Link
                  to="/my-hires"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  My Hires
                </Link>
                <Link
                  to="/my-application"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  My Application
                </Link>
                <Link
                  to="/my-referrals"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Gift className="h-4 w-4" />
                  <span>${user.earningsBalance?.toFixed(0) || '0'}</span>
                </Link>
                <Link
                  to="/creator"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Create
                </Link>
                <Link
                  to="/sponsor"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Sponsor
                </Link>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <span className="text-sm text-slate-400">{user.name?.split(' ')[0]}</span>
                  <button onClick={handleSignOut} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-600" title="Sign Out">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Sign In
                </Link>
              </>
            )}
            <Link
              to="/find-a-maid"
              className="rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-red/20 transition-all hover:bg-brand-red-dark hover:shadow-md hover:shadow-brand-red/30 active:scale-95"
            >
              Hire Now
            </Link>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-brand-red">TRAA</span><span className="text-brand-teal">MAND</span>
              </span>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeDrawer}
                    className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="border-t border-slate-100 my-3" />

              {!isLoading && isAuthenticated && user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={closeDrawer}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === 'verifier' && (
                    <Link
                      to="/verifier"
                      onClick={closeDrawer}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                    >
                      Verify Tasks
                    </Link>
                  )}
                  <Link
                    to="/my-hires"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    My Hires
                  </Link>
                  <Link
                    to="/my-application"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    My Application
                  </Link>
                  <Link
                    to="/my-referrals"
                    onClick={closeDrawer}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Gift className="h-4 w-4" />
                    Refer & Earn
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      ${user.earningsBalance?.toFixed(0) || '0'}
                    </span>
                  </Link>
                  <Link
                    to="/creator"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Creator Fund
                  </Link>
                  <Link
                    to="/sponsor"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sponsor
                  </Link>
                  <Link
                    to="/advertise"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Advertise
                  </Link>
                  <div className="border-t border-slate-100 my-3" />
                  <div className="px-4 py-2 text-sm text-slate-400">Signed in as {user.name}</div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                </>
              )}

              <Link
                to="/find-a-maid"
                onClick={closeDrawer}
                className="block rounded-xl bg-brand-red px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-brand-red-dark"
              >
                Hire Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
