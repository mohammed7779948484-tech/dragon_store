/**
 * Unit tests for session module
 * @see T091 — src/core/auth/session.test.ts
 * @see Constitution: DAL pattern — verifySession() is the security boundary
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}))

// Mock react cache — passthrough
vi.mock('react', async () => {
    const actual = await vi.importActual<typeof import('react')>('react')
    return {
        ...actual,
        cache: (fn: unknown) => fn,
    }
})

// Mock encryption module
vi.mock('./encryption', () => ({
    encrypt: vi.fn().mockResolvedValue('mock-jwt-token'),
    decrypt: vi.fn(),
}))

// Mock app.config
vi.mock('@/core/config/app.config', () => ({
    appConfig: {
        session: {
            cookieName: 'session',
            defaultDuration: 24 * 60 * 60 * 1000,
            rememberMeDuration: 30 * 24 * 60 * 60 * 1000,
        },
    },
}))

import { cookies } from 'next/headers'
import { decrypt } from './encryption'

describe('Session Module', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('verifySession', () => {
        it('should return null when no session cookie exists', async () => {
            const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn(), delete: vi.fn() }
            vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

            const { verifySession } = await import('./session')
            const result = await verifySession()
            expect(result).toBeNull()
        })

        it('should return null when session is not authenticated', async () => {
            const mockCookieStore = { get: vi.fn().mockReturnValue({ value: 'bad-token' }), set: vi.fn(), delete: vi.fn() }
            vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
            vi.mocked(decrypt).mockResolvedValue({ isAuthenticated: false, sessionId: '', expiresAt: '' })

            const { verifySession } = await import('./session')
            const result = await verifySession()
            expect(result).toBeNull()
        })

        it('should return null when session is expired', async () => {
            const mockCookieStore = { get: vi.fn().mockReturnValue({ value: 'expired-token' }), set: vi.fn(), delete: vi.fn() }
            vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
            vi.mocked(decrypt).mockResolvedValue({
                isAuthenticated: true,
                sessionId: 'test-session',
                expiresAt: new Date(Date.now() - 1000).toISOString(),
            })

            const { verifySession } = await import('./session')
            const result = await verifySession()
            expect(result).toBeNull()
        })

        it('should return session when valid and not expired', async () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000)
            const mockCookieStore = { get: vi.fn().mockReturnValue({ value: 'valid-token' }), set: vi.fn(), delete: vi.fn() }
            vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)
            vi.mocked(decrypt).mockResolvedValue({
                isAuthenticated: true,
                sessionId: 'test-session-123',
                expiresAt: futureDate.toISOString(),
            })

            const { verifySession } = await import('./session')
            const result = await verifySession()
            expect(result).not.toBeNull()
            expect(result?.sessionId).toBe('test-session-123')
            expect(result?.isAuthenticated).toBe(true)
        })
    })

    describe('createSession', () => {
        it('should set session cookie with correct options', async () => {
            const setMock = vi.fn()
            const mockCookieStore = { get: vi.fn(), set: setMock, delete: vi.fn() }
            vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

            const { createSession } = await import('./session')
            await createSession('new-session-id', false)

            expect(setMock).toHaveBeenCalledWith(
                'session',
                'mock-jwt-token',
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                })
            )
        })
    })

    describe('destroySession', () => {
        it('should delete session cookie', async () => {
            const deleteMock = vi.fn()
            const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: deleteMock }
            vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

            const { destroySession } = await import('./session')
            await destroySession()

            expect(deleteMock).toHaveBeenCalledWith('session')
        })
    })
})
