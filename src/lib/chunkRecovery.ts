const CHUNK_RECOVERY_KEY = 'traamand_chunk_recovery_attempted'

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError')
  )
}

export async function clearAppShellCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
  }
}

export async function recoverFromChunkError() {
  if (sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1') return false
  sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
  await clearAppShellCaches()
  window.location.reload()
  return true
}

export function markAppLoaded() {
  sessionStorage.removeItem(CHUNK_RECOVERY_KEY)
}
