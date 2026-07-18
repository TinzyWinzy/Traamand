import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Loader2, Mail, Lock, UserIcon } from 'lucide-react'
import { signInWithGoogle, signInWithEmail, createUserWithEmail, createOrUpdateUser } from '../../firebase/auth'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../types'

interface RoleSignInProps {
  expectedRole: UserRole
  successPath: string
  title: string
  description: string
  showBack?: boolean
}

export default function RoleSignIn({ expectedRole, successPath, title, description, showBack = true }: RoleSignInProps) {
  const navigate = useNavigate()
  const { setUser, setFirebaseUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'google' | 'email'>('google')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const fbUser = await signInWithGoogle()
      const user = await createOrUpdateUser(fbUser, {
        name: fbUser.displayName || 'User',
        email: fbUser.email || '',
        role: expectedRole,
      })
      setUser(user)
      setFirebaseUser(fbUser)
      if (user.role === expectedRole) {
        navigate(successPath)
      } else if (expectedRole === 'admin') {
        setError('This email is not authorized for admin access.')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    }
    setLoading(false)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password || (!isSignUp && !name)) return
    setLoading(true)
    try {
      const fbUser = isSignUp
        ? await createUserWithEmail(email, password)
        : await signInWithEmail(email, password)
      const user = await createOrUpdateUser(fbUser, {
        name: isSignUp ? name : fbUser.displayName || email.split('@')[0],
        email,
        role: expectedRole,
      })
      setUser(user)
      setFirebaseUser(fbUser)
      if (user.role === expectedRole) {
        navigate(successPath)
      } else {
        navigate('/')
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in.')
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError(err.message || 'Authentication failed. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <section className="bg-zinc-50 py-12 sm:py-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        {showBack && (
          <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
            ← Back to Home
          </Link>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <div className="mb-6 text-center">
            <Shield className="mx-auto h-10 w-10 text-slate-900" />
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mb-6 flex rounded-xl border border-slate-200 p-1">
            <button
              onClick={() => { setMode('google'); setError('') }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'google' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Google
            </button>
            <button
              onClick={() => { setMode('email'); setError('') }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'email' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Email
            </button>
          </div>

          {mode === 'google' ? (
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
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  {isSignUp ? 'Full Name' : 'Email Address'}
                </label>
                {isSignUp && (
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="w-full text-center text-sm text-teal-600 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
