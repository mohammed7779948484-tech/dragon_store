/**
 * Request Utilities
 *
 * Server-side request helpers for extracting client information.
 * Used by rate-limited server actions.
 *
 * @see Constitution: core/ can import from shared/types, shared/config only
 */

import { headers } from 'next/headers'

/**
 * Get client IP address from request headers.
 *
 * Checks x-forwarded-for (multi-proxy), x-real-ip (single proxy),
 * and falls back to 'unknown'.
 *
 * @returns Client IP address string
 */
export async function getClientIP(): Promise<string> {
    const headersList = await headers()
    return (
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        headersList.get('x-real-ip') ??
        'unknown'
    )
}
