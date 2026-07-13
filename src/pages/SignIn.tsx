import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Shield, Loader2, ArrowLeft } from 'lucide-react'
import { signInWithGoogle, createOrUpdateUser } from '../firebase/auth'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'
import { COMPANY_NAME } from '../lib/constants'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'applicant', label: 'Applicant' },
  { value: 'verifier', label: 'Verifier' },
  { value: 'creator', label: 'Creator' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'advertise', label: 'Advertiser' },
  { value: 'admin', label: 'Admin' },
]

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser, setFirebaseUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<UserRole>('client')

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      sessionStorage.setItem('traamand_ref', ref.toUpperCase())
    }
  }, [searchParams])

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const fbUser = await signInWithGoogle()
      const user = await createOrUpdateUser(fbUser, {
        name: fbUser.displayName || 'User',
        email: fbUser.email || '',
        role,
      })
      setUser(user)
      setFirebaseUser(fbUser)
      const redirect = searchParams.get('redirect')
      if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
        navigate(redirect)
      } else if (role === 'admin') navigate('/admin')
      else if (role === 'verifier') navigate('/verifier')
      else if (role === 'creator') navigate('/creator')
      else if (role === 'sponsor') navigate('/sponsor')
      else if (role === 'advertise') navigate('/advertise')
      else if (role === 'applicant') navigate('/applicant')
      else if (role === 'client') navigate('/client')
      else navigate('/')
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <section className="bg-zinc-50 py-12 sm:py-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <div className="mb-6 text-center">
            <Shield className="mx-auto h-10 w-10 text-teal-600" />
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Welcome to {COMPANY_NAME}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Select your account type and sign in with Google.
            </p>
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Sign in as</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </section>
  )
}
