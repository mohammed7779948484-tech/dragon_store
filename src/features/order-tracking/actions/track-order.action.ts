/**
 * Track Order Server Action
 *
 * Looks up an order by order number (VX-XXXXXX format).
 * Public page — no session verification required.
 * Rate limited by IP (10 lookups/min/IP).
 *
 * @see spec.md: FR-033 (track by order number)
 * @see spec.md: FR-035 (rate limit 10/min/IP)
 * @see api-spec.md: track-order.action.ts contract
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
    trackOrderSchema,
    TRACKING_RATE_LIMIT,
    OrderQueryService,
} from '@/modules/orders'
import type { ActionResult } from '@/modules/orders'

import type { TrackedOrder, TrackOrderResult } from '../types'

const logger = new Logger()

/** Rate limiter: 10 lookups per minute per IP */
const trackingRateLimiter = createRateLimiter({
    interval: 60 * 1000,
    maxRequests: TRACKING_RATE_LIMIT,
})

const orderQueryService = new OrderQueryService()

/**
 * Track order by order number.
 *
 * @param input - Raw input (validated via Zod)
 * @returns ActionResult with order details on success
 */
export async function trackOrderAction(
    input: unknown
): Promise<ActionResult<TrackOrderResult>> {
    try {
        // 1. Rate limit by IP (no session required — public page)
        const ip = await getClientIP()
        try {
            trackingRateLimiter.check(ip)
        } catch {
            return { success: false, error: 'Too many requests, please wait', code: 'RATE_LIMITED' }
        }

        // 2. Validate input with Zod
        const validated = trackOrderSchema.parse(input)

        // 3. Fetch order via module service (no cross-feature import)
        const order = await orderQueryService.getOrderByNumber(validated.orderNumber)

        if (!order) {
            return { success: false, error: 'Order not found', code: 'NOT_FOUND' }
        }

        // 4. Map to TrackedOrder (lightweight projection)
        const trackedOrder: TrackedOrder = {
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                productName: item.productName,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
        }

        return {
            success: true,
            data: { order: trackedOrder },
        }
    } catch (error) {
        logger.error(error as Error, { context: 'trackOrderAction failed' })

        if (error instanceof AppError) {
            return { success: false, error: error.message, code: error.code }
        }

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0]?.message ?? 'Invalid order number format',
                code: 'VALIDATION_ERROR',
            }
        }

        return { success: false, error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }
    }
}
