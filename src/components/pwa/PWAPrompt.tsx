import { useEffect, useRef, useState } from 'react'
import { Download, Share2, RefreshCw, X } from 'lucide-react'

function useIsIOS() {
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  })
  return isIOS
}

function useIsStandalone() {
  const [standalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
  })
  return standalone
}

function useIsSWActive() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setActive(true))
    }
  }, [])
  return active
}

export default function PWAPrompt() {
  const isIOS = useIsIOS()
  const isStandalone = useIsStandalone()
  const isSWActive = useIsSWActive()

  const [mode, setMode] = useState<'beforeinstallprompt' | 'ios' | 'generic' | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null)
  const [dismissed, setDismissed] = useState(false)
  const dismissedRef = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem('pwa-prompt-dismissed')
    if (stored) {
      setDismissed(true)
      dismissedRef.current = true
      return
    }

    let fallbackTimer: ReturnType<typeof setTimeout>

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setMode('beforeinstallprompt')
      clearTimeout(fallbackTimer)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (isIOS) {
      fallbackTimer = setTimeout(() => {
        if (!dismissedRef.current) setMode('ios')
      }, 3000)
    } else {
      fallbackTimer = setTimeout(() => {
        if (!dismissedRef.current) setMode('generic')
      }, 10000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallbackTimer)
    }
  }, [isIOS])

  const handleInstall = async () => {
    if (deferredPrompt) {
      ;(deferredPrompt as { prompt: () => void }).prompt()
      const result = await (deferredPrompt as { userChoice: Promise<{ outcome: string }> }).userChoice
      if (result.outcome === 'accepted') {
        setMode(null)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setMode(null)
    setDismissed(true)
    dismissedRef.current = true
    localStorage.setItem('pwa-prompt-dismissed', '1')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!mode || isStandalone) return null

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
              {mode === 'ios' ? 'Safari on iPhone & iPad' : 'Install the app for offline access'}
            </p>
          </div>
        </div>

        {mode === 'beforeinstallprompt' && (
          <>
            <ul className="mt-3 space-y-1 text-xs text-white/60">
              <li>Open instantly — even offline</li>
              <li>Book in 3 taps</li>
              <li>Rehire favorites with one tap</li>
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
          </>
        )}

        {mode === 'ios' && (
          <>
            <ol className="mt-3 space-y-2 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">1</span>
                Tap <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 font-medium"><Share2 className="h-3 w-3" /> Share</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">2</span>
                Scroll down & tap <strong className="text-white">Add to Home Screen</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">3</span>
                Tap <strong className="text-white">Add</strong> in the top right
              </li>
            </ol>
            <div className="mt-4">
              <button
                onClick={handleDismiss}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:text-white"
              >
                Got it
              </button>
            </div>
          </>
        )}

        {mode === 'generic' && (
          <>
            {!isSWActive ? (
              <>
                <p className="mt-3 text-xs text-white/70">
                  The offline setup is still loading. This only needs to happen once.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:text-white"
                  >
                    Later
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-xs text-white/70">
                  Your browser supports offline access. Open your browser menu and look for <strong className="text-white">"Add to Home Screen"</strong> or <strong className="text-white">"Install"</strong>.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleDismiss}
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:text-white"
                  >
                    Got it
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
