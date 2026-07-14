import { lazy } from 'react'
import type { ComponentType } from 'react'
import { isChunkLoadError, recoverFromChunkError } from './chunkRecovery'

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importer()
    } catch (error) {
      if (isChunkLoadError(error)) {
        await recoverFromChunkError()
      }
      throw error
    }
  })
}
