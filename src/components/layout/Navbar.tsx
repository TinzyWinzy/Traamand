import { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Phone, MapPin, Shield, X, LogOut, ChevronDown, LayoutDashboard, CheckCircle2, Briefcase, FileText, Gift, PenTool, HandshakeIcon, DollarSign } from 'lucide-react'
import { NAV_LINKS, PRIMARY_PHONE, ADDRESS } from '../../lib/constants'
import { useAuthStore } from '../../stores/authStore'
import { logout } from '../../firebase/auth'

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const { user, isAuthenticated, isLoading } = useAuthStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    closeDrawer()
    await logout()
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
                {/* User Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {user.name?.split(' ')[0]}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                      {/* User Info Header */}
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role || 'User'}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Earnings */}
                        <Link
                          to="/my-referrals"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          <Gift className="h-4 w-4" />
                          <div>
                            <div>Refer & Earn</div>
                            <div className="text-xs font-normal text-emerald-600">${user.earningsBalance?.toFixed(0) || '0'}</div>
                          </div>
                        </Link>

                        {/* Client Dashboard */}
                        {user.role === 'client' && (
                          <Link
                            to="/client"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                        )}

                        {/* My Hires */}
                        <Link
                          to="/my-hires"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Briefcase className="h-4 w-4" />
                          My Hires
                        </Link>

                        {/* My Payments */}
                        <Link
                          to="/my-payments"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <DollarSign className="h-4 w-4" />
                          My Payments
                        </Link>

                        {/* My Application */}
                        {user.role === 'applicant' && (
                          <Link
                            to="/applicant"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <FileText className="h-4 w-4" />
                            My Application
                          </Link>
                        )}

                        {/* Admin Dashboard */}
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                        )}

                        {/* Verifier */}
                        {user.role === 'verifier' && (
                          <Link
                            to="/verifier"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Verify Tasks
                          </Link>
                        )}

                        {/* Creator */}
                        {user.role === 'creator' && (
                          <Link
                            to="/creator"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <PenTool className="h-4 w-4" />
                            Create Content
                          </Link>
                        )}

                        {/* Sponsor */}
                        {user.role === 'sponsor' && (
                          <Link
                            to="/sponsor"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <HandshakeIcon className="h-4 w-4" />
                            Sponsor
                          </Link>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-100" />

                      {/* Sign Out */}
                      <button
                        onClick={async () => {
                          setDropdownOpen(false)
                          await logout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/admin/sign-in"
                  className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                >
                  Staff
                </Link>
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
                    to="/my-payments"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    My Payments
                  </Link>
                  {user.role === 'client' && (
                    <Link
                      to="/client"
                      onClick={closeDrawer}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === 'applicant' && (
                    <Link
                      to="/applicant"
                      onClick={closeDrawer}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      My Application
                    </Link>
                  )}
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
                  {user.role === 'advertise' && (
                    <Link
                      to="/advertise"
                      onClick={closeDrawer}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Advertise
                    </Link>
                  )}
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
                    to="/admin/sign-in"
                    onClick={closeDrawer}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-50"
                  >
                    Staff Login
                  </Link>
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
