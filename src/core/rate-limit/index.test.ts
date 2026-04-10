/**
 * Unit tests for rate limiter
 * @see T092 — src/core/rate-limit/index.test.ts
 * @see Constitution: Rate limits — 5/min gate, 20/min cart, 3/min checkout
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter, createRateLimiter } from './index'

describe('RateLimiter', () => {
    let limiter: RateLimiter

    beforeEach(() => {
        limiter = new RateLimiter({ interval: 60_000, maxRequests: 5 })
    })

    describe('check', () => {
        it('should allow requests under the limit', () => {
            expect(() => limiter.check('test-ip')).not.toThrow()
            expect(() => limiter.check('test-ip')).not.toThrow()
            expect(() => limiter.check('test-ip')).not.toThrow()
        })

        it('should throw when rate limit is exceeded', () => {
            const token = 'throttled-ip'

            // Fill up the limit
            for (let i = 0; i < 5; i++) {
                limiter.check(token)
            }

            // Next request should throw
            expect(() => limiter.check(token)).toThrow('Rate limit exceeded')
        })

        it('should track tokens independently', () => {
            const tokenA = 'ip-a'
            const tokenB = 'ip-b'

            // Fill up tokenA
            for (let i = 0; i < 5; i++) {
                limiter.check(tokenA)
            }

            // tokenB should still work
            expect(() => limiter.check(tokenB)).not.toThrow()
        })
    })

    describe('getStatus', () => {
        it('should show full remaining for new token', () => {
            const status = limiter.getStatus('new-token')
            expect(status).not.toBeNull()
            expect(status?.remaining).toBe(5)
        })

        it('should decrement remaining after checks', () => {
            limiter.check('tracked-token')
            limiter.check('tracked-token')

            const status = limiter.getStatus('tracked-token')
            expect(status?.remaining).toBe(3)
        })

        it('should show zero remaining when limit reached', () => {
            for (let i = 0; i < 5; i++) {
                limiter.check('full-token')
            }

            const status = limiter.getStatus('full-token')
            expect(status?.remaining).toBe(0)
        })
    })

    describe('reset', () => {
        it('should reset rate limit for a token', () => {
            // Fill up the limit
            for (let i = 0; i < 5; i++) {
                limiter.check('reset-token')
            }

            // Should throw
            expect(() => limiter.check('reset-token')).toThrow()

            // Reset
            limiter.reset('reset-token')

            // Should work again
            expect(() => limiter.check('reset-token')).not.toThrow()
        })
    })

    describe('createRateLimiter factory', () => {
        it('should create a limiter with custom config', () => {
            const custom = createRateLimiter({ interval: 30_000, maxRequests: 3 })

            custom.check('factory-token')
            custom.check('factory-token')
            custom.check('factory-token')

            expect(() => custom.check('factory-token')).toThrow('Rate limit exceeded')
        })
    })
})
