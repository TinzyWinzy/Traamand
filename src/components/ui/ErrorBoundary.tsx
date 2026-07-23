import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { isChunkLoadError, recoverFromChunkError } from '../../lib/chunkRecovery'
import { logError } from '../../lib/errorLogger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
    logError(error, 'error', { componentStack: info.componentStack ?? '' })
    if (isChunkLoadError(error)) {
      recoverFromChunkError().catch(() => {})
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      const isStaleAppShell = isChunkLoadError(this.state.error)
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md text-center">
            <p className="text-4xl">&#x26A0;&#xFE0F;</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {isStaleAppShell ? 'Updating Traamand' : 'Something went wrong'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isStaleAppShell
                ? 'A new version is available. Refresh once to load the latest app files.'
                : this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                if (isStaleAppShell) {
                  recoverFromChunkError().catch(() => window.location.reload())
                } else {
                  window.location.reload()
                }
              }}
              className="mt-6 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700"
            >
              Refresh app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
