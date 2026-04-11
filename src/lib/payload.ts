/**
 * Payload Client - Singleton instance for database operations
 */

import { getPayload, Payload } from 'payload'
import config from '@payload-config'

// Global cache for development to prevent re-initializing Payload on every request
// Re-initializing triggers `drizzle-kit push` which takes 5-10 seconds of latency on Neon!
let cached = (global as any).payload

if (!cached) {
  cached = (global as any).payload = { client: null as Payload | null, promise: null as Promise<Payload> | null }
}

/**
 * Get Payload CMS client instance
 * This is a singleton that can be used throughout the application
 */
export async function getPayloadClient(): Promise<Payload> {
  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    cached.promise = getPayload({ config })
  }

  try {
    cached.client = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.client
}

/**
 * Type-safe payload client for use in server components and actions
 * Usage:
 * ```typescript
 * const payload = await getPayloadClient()
 * const user = await payload.findByID({ collection: 'users', id: 1 })
 * ```
 */
export type PayloadClient = Awaited<ReturnType<typeof getPayloadClient>>
