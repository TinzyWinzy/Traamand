import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, Sparkles } from 'lucide-react'
import { NAV_LINKS } from '../../lib/constants'

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: Props) {
  const location = useLocation()

  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Sparkles className="h-5 w-5 text-brand-teal" />
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-teal-light text-brand-teal'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              to="/find-a-maid"
              className="block rounded-lg bg-brand-red px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-brand-red-dark"
            >
              Hire a Maid
            </Link>
            <Link
              to="/join-our-team"
              className="mt-2 block rounded-lg border-2 border-brand-teal px-4 py-3 text-center text-base font-semibold text-brand-teal transition hover:bg-brand-teal-light"
            >
              Apply for a Job
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
