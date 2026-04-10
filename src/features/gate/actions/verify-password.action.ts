'use server'

/**
 * Verify Password — Server Action
 *
 * Validates the site-wide gate password, creates a session,
 * and initializes a server-side cart on success.
 *
 * Security:
 * - Rate limited: 5 attempts per minute per IP
 * - Password compared against bcrypt hash in SiteSettings
 * - Session stored as JWT in HTTP-only cookie
 * - Cart created for each new session
 *
 * @see Constitution: Server Actions Rules
 */

import { z } from 'zod'
import { headers } from 'next/headers'
import bcrypt from 'bcrypt'

import { gateRateLimiter } from '@/core/rate-limit'
import { createSession } from '@/core/auth/session'
import { logger } from '@/core/logger'
import { getPayloadClient } from '@/lib/payload'

import type { GateActionResult } from '../types'

const gateSchema = z.object({
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().default(false),
})

export async function verifyPassword(input: unknown): Promise<GateActionResult> {
    try {
        // 1. Rate limit by IP
        const headerStore = await headers()
        const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'

        try {
            gateRateLimiter.check(ip)
        } catch {
            logger.warn('Gate rate limit exceeded', { ip })
            return {
                success: false,
                error: 'Too many attempts. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
            }
        }

        // 2. Validate input with Zod
        const parsed = gateSchema.safeParse(input)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.errors[0]?.message || 'Invalid input',
                code: 'VALIDATION_ERROR',
            }
        }

        const { password, rememberMe } = parsed.data

        // 3. Fetch gate password from SiteSettings
        const payload = await getPayloadClient()
        const settings = await payload.findGlobal({
            slug: 'site-settings',
        })

        const storedHash = settings?.gate_password as string | undefined

        if (!storedHash) {
            logger.error('No gate password configured in SiteSettings')
            return {
                success: false,
                error: 'System configuration error. Contact admin.',
                code: 'CONFIG_ERROR',
            }
        }

        // 4. Compare password against bcrypt hash
        const isValid = await bcrypt.compare(password, storedHash)

        if (!isValid) {
            logger.info('Gate password verification failed', { ip })
            return {
                success: false,
                error: 'Invalid password',
                code: 'INVALID_PASSWORD',
            }
        }

        // 5. Create session
        const sessionId = crypto.randomUUID()
        await createSession(sessionId, rememberMe)

        // 6. Create cart for this session
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        await payload.create({
            collection: 'carts',
            data: {
                session_id: sessionId,
                expires_at: expiresAt.toISOString(),
            },
        })

        logger.info('Gate access granted — session and cart created', {
            sessionId,
            rememberMe,
        })

        return { success: true }
    } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), {
            context: 'verifyPassword',
        })

        return {
            success: false,
            error: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
        }
    }
}
