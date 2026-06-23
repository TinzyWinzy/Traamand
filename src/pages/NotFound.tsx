import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-brand-teal">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-teal-dark"
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  )
}
