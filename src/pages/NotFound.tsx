import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import SEOHead from '../components/seo/SEOHead'

export default function NotFound() {
  return (
    <>
      <SEOHead
        title="Page Not Found | Traamand"
        description="The page you are looking for does not exist or has been moved. Browse Traamand's verified domestic workers in Harare."
        noIndex
      />
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-teal-600">404</h1>
      <p className="mt-4 text-lg text-slate-500">Page not found</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
    </>
  )
}
