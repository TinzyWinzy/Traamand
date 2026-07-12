import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const stored = localStorage.getItem('pwa-prompt-dismissed')
    if (stored) setDismissed(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      ;(deferredPrompt as { prompt: () => void }).prompt()
      const result = await (deferredPrompt as { userChoice: Promise<{ outcome: string }> }).userChoice
      if (result.outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm">
      <div className="relative rounded-2xl bg-brand-navy p-5 text-white shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-white/50 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Add to Home Screen</h3>
            <p className="mt-0.5 text-xs text-white/70">
              Get instant access — even offline!
            </p>
          </div>
        </div>

        <ul className="mt-3 space-y-1 text-xs text-white/60">
          <li>Book in 3 taps</li>
          <li>Get notified when your worker is nearby</li>
          <li>Rehire favorites instantly</li>
        </ul>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-teal-dark active:scale-[0.98]"
          >
            Install Traamand
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:text-white"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
