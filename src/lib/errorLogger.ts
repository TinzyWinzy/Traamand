import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export interface ErrorLogEntry {
  message: string
  stack: string
  url: string
  userAgent: string
  userId: string | null
  severity: 'error' | 'warning' | 'info'
  context?: Record<string, unknown>
}

export async function logError(
  error: Error | unknown,
  severity: ErrorLogEntry['severity'] = 'error',
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const entry: Omit<ErrorLogEntry, 'url' | 'userAgent' | 'userId'> & { url?: string; userAgent?: string } = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? (error.stack ?? '') : '',
      severity,
      context,
    }

    await addDoc(collection(db, 'errorLogs'), {
      ...entry,
      url: window.location.href,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
    })
  } catch {
    // Silently fail — logging should never crash the app
  }
}

export function initGlobalErrorHandlers(): void {
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'error', { type: 'unhandledrejection' })
  })

  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'error', { type: 'onerror' })
  })
}
