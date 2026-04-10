/**
 * JWT Encryption Utilities
 * 
 * Features:
 * - HS256 algorithm for JWT signing
 * - Secure token generation and verification
 * - Session payload with expiration
 */

import { SignJWT, jwtVerify } from 'jose'
import { env } from '@/core/config/env'

// Convert session secret to Uint8Array for jose
const secret = new TextEncoder().encode(env.SESSION_SECRET)

/**
 * Session payload structure
 */
export interface SessionPayload {
  sessionId: string
  isAuthenticated: boolean
  expiresAt: string
}

/**
 * Encrypt session data into JWT token
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(new Date(payload.expiresAt).getTime() / 1000))
    .sign(secret)
}

/**
 * Decrypt and verify JWT token
 * Returns null if token is invalid or expired
 */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })

    // Validate payload structure
    if (
      typeof payload.sessionId !== 'string' ||
      typeof payload.isAuthenticated !== 'boolean' ||
      typeof payload.expiresAt !== 'string'
    ) {
      return null
    }

    return {
      sessionId: payload.sessionId,
      isAuthenticated: payload.isAuthenticated,
      expiresAt: payload.expiresAt,
    }
  } catch {
    return null
  }
}
