/**
 * Unit tests for verify-password server action
 * @see T093 — src/features/gate/actions/verify-password.action.test.ts
 * @see Constitution: Server Actions MUST validate with Zod, try-catch, return ActionResult
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('127.0.0.1'),
    }),
}))

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
    },
}))

vi.mock('@/core/rate-limit', () => ({
    gateRateLimiter: {
        check: vi.fn(),
    },
}))

vi.mock('@/core/auth/session', () => ({
    createSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/core/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/lib/payload', () => ({
    getPayloadClient: vi.fn().mockResolvedValue({
        findGlobal: vi.fn().mockResolvedValue({ gate_password: '$2b$10$hashedpassword' }),
        create: vi.fn().mockResolvedValue({ id: 'cart-1' }),
    }),
}))

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-123' })

import bcrypt from 'bcrypt'
import { gateRateLimiter } from '@/core/rate-limit'
import { verifyPassword } from './verify-password.action'

describe('verifyPassword Action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return error when input is invalid', async () => {
        const result = await verifyPassword({})
        expect(result.success).toBe(false)
        expect(result.code).toBe('VALIDATION_ERROR')
    })

    it('should return error when password is empty string', async () => {
        const result = await verifyPassword({ password: '' })
        expect(result.success).toBe(false)
        expect(result.code).toBe('VALIDATION_ERROR')
    })

    it('should return error when rate limit is exceeded', async () => {
        vi.mocked(gateRateLimiter.check).mockImplementation(() => {
            throw new Error('Rate limit exceeded')
        })

        const result = await verifyPassword({ password: 'test123' })
        expect(result.success).toBe(false)
        expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should return error when password is incorrect', async () => {
        vi.mocked(gateRateLimiter.check).mockImplementation(() => undefined)
        vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

        const result = await verifyPassword({ password: 'wrong-password' })
        expect(result.success).toBe(false)
        expect(result.code).toBe('INVALID_PASSWORD')
    })

    it('should return success when password is correct', async () => {
        vi.mocked(gateRateLimiter.check).mockImplementation(() => undefined)
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

        const result = await verifyPassword({ password: 'correct-password', rememberMe: false })
        expect(result.success).toBe(true)
    })
})
