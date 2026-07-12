import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, Shield, Loader2, ArrowLeft } from 'lucide-react'
import { sendOTP, verifyOTP, initRecaptcha, createOrUpdateUser } from '../firebase/auth'
import { useAuthStore } from '../stores/authStore'
import { getApplicantsByPhone } from '../firebase/firestore'
import { COMPANY_NAME } from '../lib/constants'

export default function SignIn() {
  const navigate = useNavigate()
  const { setUser, setFirebaseUser } = useAuthStore()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recaptchaReady, setRecaptchaReady] = useState(false)

  const toE164 = (raw: string) =>
    raw.startsWith('+') ? raw.replace(/\D/g, '') : `+263${raw.replace(/^0/, '').replace(/\D/g, '')}`

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const digits = phone.replace(/\D/g, '')
    if (!digits.match(/^(?:\+263|0)?[17]\d{8}$/)) {
      setError('Enter a valid Zimbabwe phone number (e.g. 0772123456 or +263772123456)')
      return
    }

    setLoading(true)
    try {
      if (!recaptchaReady) {
        initRecaptcha('recaptcha-container')
        setRecaptchaReady(true)
        await new Promise((r) => setTimeout(r, 1000))
      }
      await sendOTP(toE164(phone))
      setStep('otp')
    } catch (err) {
      setError('Failed to send OTP. Ensure the phone number is correct.')
      console.error(err)
    }
    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const fbUser = await verifyOTP(otp)
      if (fbUser) {
        const normalized = toE164(phone)
        const user = await createOrUpdateUser(fbUser, { name: name || 'Client', phone: normalized })
        setUser(user)
        setFirebaseUser(fbUser)

        if (user.role === 'admin') {
          navigate('/admin')
        } else {
          const apps = await getApplicantsByPhone(normalized)
          if (apps.length > 0) {
            navigate('/my-application')
          } else {
            navigate('/')
          }
        }
      }
    } catch (err) {
      setError('Invalid OTP code. Please try again.')
      console.error(err)
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
              Sign in to track bookings, manage hires, and more.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tendai Mukanya"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  WhatsApp Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0772 123 456"
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">We'll send a one-time code via SMS.</p>
              </div>

              <div id="recaptcha-container" />

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-sm text-slate-500">
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-sm text-teal-600 hover:underline"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
