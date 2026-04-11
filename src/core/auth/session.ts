/**
 * Session Management - DAL (Data Access Layer) Pattern
 * 
 * CRITICAL: Due to CVE-2025-29927, middleware bypass is possible.
 * ALL security verification MUST happen here, NOT in middleware.
 * Middleware is for UX redirects only.
 * 
 * Features:
 * - Server-side session verification
 * - JWT in HTTP-only cookies
 * - Cache for performance
 * - "Remember Me" support
 */

import { cookies } from 'next/headers'
import { cache } from 'react'
import { decrypt, encrypt, type SessionPayload } from './encryption'
import { appConfig } from '@/core/config/app.config'

/**
 * Session data structure
 */
export interface Session {
  sessionId: string
  isAuthenticated: boolean
  expiresAt: Date
}

/**
 * Verify session from cookie
 * This function is cached for performance within a request
 * 
 * ⚠️ CRITICAL SECURITY FUNCTION - Always use this for authentication checks
 * Never rely on middleware for security (CVE-2025-29927)
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(appConfig.session.cookieName)?.value

  if (!token) {
    return null
  }

  const payload = await decrypt(token)

  if (!payload?.isAuthenticated) {
    return null
  }

  const expiresAt = new Date(payload.expiresAt)

  // Check if session is expired
  if (expiresAt < new Date()) {
    return null
  }

  return {
    sessionId: payload.sessionId,
    isAuthenticated: true,
    expiresAt,
  }
})

/**
 * Create a new session
 * Sets HTTP-only cookie with JWT token
 */
export async function createSession(
  sessionId: string,
  rememberMe: boolean = false
): Promise<void> {
  const duration = rememberMe
    ? appConfig.session.rememberMeDuration
    : appConfig.session.defaultDuration

  const expiresAt = new Date(Date.now() + duration)

  const payload: SessionPayload = {
    sessionId,
    isAuthenticated: true,
    expiresAt: expiresAt.toISOString(),
  }

  const token = await encrypt(payload)
  const cookieStore = await cookies()

  cookieStore.set(appConfig.session.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

/**
 * Destroy the current session
 * Removes the session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(appConfig.session.cookieName)
}

/**
 * Extend session expiration
 * Updates the cookie with new expiration time
 */
export async function extendSession(session: Session): Promise<void> {
  await createSession(session.sessionId, false)
}
