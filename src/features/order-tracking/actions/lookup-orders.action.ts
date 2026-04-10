/**
 * Lookup Orders Server Action
 *
 * Looks up all orders by phone number (+1 US format).
 * Public page — no session verification required.
 * Rate limited by IP (10 lookups/min/IP).
 *
 * @see spec.md: FR-034 (lookup by phone)
 * @see spec.md: FR-035 (rate limit 10/min/IP)
 * @see api-spec.md: lookup-orders.action.ts contract
 * @see Constitution: Server Actions MUST validate with Zod, try-catch, return ActionResult
 * @see Constitution: Server Actions MUST call modules/ for business logic
 */

'use server'

import { z } from 'zod'

import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import { createRateLimiter } from '@/core/rate-limit'
import { getClientIP } from '@/core/request'

import {
    lookupOrdersSchema,
    TRACKING_RATE_LIMIT,
    OrderQueryService,
} from '@/modules/orders'
import type { ActionResult, LookupOrdersResult } from '@/modules/orders'

const logger = new Logger()

/** Rate limiter: 10 lookups per minute per IP */
const lookupRateLimiter = createRateLimiter({
    interval: 60 * 1000,
    maxRequests: TRACKING_RATE_LIMIT,
})

const orderQueryService = new OrderQueryService()

/**
 * Lookup all orders by phone number.
 *
 * @param input - Raw input (validated via Zod)
 * @returns ActionResult with array of orders (may be empty)
 */
export async function lookupOrdersAction(
    input: unknown
): Promise<ActionResult<LookupOrdersResult>> {
    try {
        // 1. Rate limit by IP
        const ip = await getClientIP()
        try {
            lookupRateLimiter.check(ip)
        } catch {
            return { success: false, error: 'Too many requests, please wait', code: 'RATE_LIMITED' }
        }

        // 2. Validate input with Zod
        const validated = lookupOrdersSchema.parse(input)

        // 3. Fetch orders via module service (no cross-feature import)
        const orders = await orderQueryService.getOrdersByPhone(validated.phone)

        return {
            success: true,
            data: {
                orders: orders.map((order) => ({
                    orderNumber: order.orderNumber,
                    status: order.status,
                    totalAmount: order.totalAmount,
                    createdAt: order.createdAt,
                })),
            },
        }
    } catch (error) {
        logger.error(error as Error, { context: 'lookupOrdersAction failed' })

        if (error instanceof AppError) {
            return { success: false, error: error.message, code: error.code }
        }

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0]?.message ?? 'Invalid phone number format',
                code: 'VALIDATION_ERROR',
            }
        }

        return { success: false, error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }
    }
}
