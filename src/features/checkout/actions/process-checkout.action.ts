/**
 * Process Checkout Server Action
 *
 * Atomic transaction: validate → decrement stock → create order → create order_items → clear cart.
 * Delegates business logic to modules/orders (OrderService, StockService).
 *
 * @see Constitution: Server Actions MUST validate with Zod, try-catch, return ActionResult
 * @see Constitution: DAL verification before any data access
 * @see Constitution: Pass req for transaction atomicity (Payload v3)
 * @see spec.md: FR-025 (atomic transaction for checkout)
 * @see spec.md: FR-026 (Zod validation)
 * @see spec.md: FR-027 (rate limit 3/min/session)
 * @see spec.md: FR-028 (honeypot silent rejection)
 * @see api-spec.md: process-checkout.action.ts contract
 */

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { verifySession } from '@/core/auth/session'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import { checkoutRateLimiter } from '@/core/rate-limit'

import {
    checkoutSchema,
    OrderService,
    StockService,
    FAKE_ORDER_ID,
    FAKE_ORDER_NUMBER,
} from '@/modules/orders'
import type { ActionResult, CreateOrderInput } from '@/modules/orders'

import { getCartBySession, getCartItems } from '@/features/cart/db/queries'
import { clearCart } from '@/features/cart/db/mutations'
import type { CheckoutResult } from '../types'

const logger = new Logger()
const orderService = new OrderService()
const stockService = new StockService()

/**
 * Process checkout with atomic stock decrement and order creation.
 *
 * @param input - Raw form data (validated via Zod)
 * @returns ActionResult with orderId and orderNumber on success
 */
export async function processCheckoutAction(
    input: unknown
): Promise<ActionResult<CheckoutResult>> {
    try {
        // 1. Verify session via DAL
        const session = await verifySession()
        if (!session) {
            return { success: false, error: 'Session expired', code: 'UNAUTHORIZED' }
        }

        // 2. Rate limit: 3 attempts per minute per session
        try {
            checkoutRateLimiter.check(session.sessionId)
        } catch {
            return { success: false, error: 'Too many requests, please wait', code: 'RATE_LIMITED' }
        }

        // 3. Validate input with Zod
        const validated = checkoutSchema.parse(input)

        // 4. Check honeypot field (bot detection — return fake success)
        if (validated.honeypotField) {
            logger.warn('Honeypot triggered — bot detected', { sessionId: session.sessionId })
            return {
                success: true,
                data: {
                    orderId: FAKE_ORDER_ID,
                    orderNumber: FAKE_ORDER_NUMBER,
                },
            }
        }

        // 5. Fetch cart with live prices
        const cart = await getCartBySession(session.sessionId)
        if (!cart) {
            return { success: false, error: 'Cart is empty', code: 'VALIDATION_ERROR' }
        }

        const cartItems = await getCartItems(cart.id)
        if (cartItems.length === 0) {
            return { success: false, error: 'Cart is empty', code: 'VALIDATION_ERROR' }
        }

        // 6. Check for inactive items
        const inactiveItems = cartItems.filter((item) => !item.isActive)
        if (inactiveItems.length > 0) {
            return {
                success: false,
                error: 'Remove unavailable items before checkout',
                code: 'VALIDATION_ERROR',
            }
        }

        // 7. Begin transaction
        const { getPayloadClient } = await import('@/lib/payload')
        const payload = await getPayloadClient()
        const transactionID = await payload.db.beginTransaction()

        // Construct a request-like object with the transactionID for Payload operations
        const req = { transactionID } as import('payload').PayloadRequest

        try {
            // 8. Verify and decrement stock for all items atomically
            const stockItems = cartItems.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
            }))

            await stockService.decrementStock(stockItems, req)

            // 9. Prepare order input
            const orderInput: CreateOrderInput = {
                sessionId: session.sessionId,
                customerName: validated.customerName,
                customerPhone: validated.customerPhone,
                ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
                items: cartItems.map((item) => ({
                    variantId: item.variantId,
                    productName: item.productName,
                    variantName: item.variantName,
                    quantity: item.quantity,
                    unitPrice: item.currentPrice,
                })),
            }

            // 10. Create order with order items within transaction
            const result = await orderService.createOrder(orderInput, req)

            // 11. Commit transaction (frees the database lock immediately)
            await payload.db.commitTransaction(transactionID as string)

            // This prevents Next.js's slow sweeping cache invalidation or cart-clearing from blocking
            // the response to the customer.
            Promise.allSettled([
                clearCart(cart.id).catch(err =>
                    logger.error(err as Error, { context: 'Failed to clear cart after checkout' })
                ),
                // Wrap revalidatePath since it's a Next.js primitive
                new Promise<void>((resolve) => {
                    try {
                        revalidatePath('/', 'layout')
                    } catch (err) {
                        logger.error(err as Error, { context: 'revalidatePath failed' })
                    }
                    resolve()
                })
            ])

            logger.info(`Checkout completed: ${result.orderNumber}`, {
                sessionId: session.sessionId,
                orderId: result.orderId,
            })

            return {
                success: true,
                data: {
                    orderId: result.orderId,
                    orderNumber: result.orderNumber,
                },
            }
        } catch (txError) {
            // Rollback transaction on any failure
            try {
                await payload.db.rollbackTransaction(transactionID as string)
            } catch (rollbackError) {
                logger.error(rollbackError as Error, { context: 'Transaction rollback failed' })
            }
            throw txError
        }
    } catch (error) {
        logger.error(error as Error, { context: 'processCheckoutAction failed' })

        if (error instanceof AppError) {
            return {
                success: false,
                error: error.message,
                code: error.code,
            }
        }

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0]?.message ?? 'Validation failed',
                code: 'VALIDATION_ERROR',
            }
        }

        return {
            success: false,
            error: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
        }
    }
}
