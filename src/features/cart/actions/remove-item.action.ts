/**
 * Remove Item Server Action
 *
 * Removes a cart item entirely from the cart. Follows constitution patterns:
 * - MUST validate with Zod before processing
 * - MUST use try-catch — never throw, return ActionResult
 * - MUST verify session via DAL at start
 * - MUST extend cart expiration on every action (FR-009)
 *
 * @see Constitution Line 170-213: Server Actions Rules
 * @see spec.md FR-008: remove-item action
 * @see spec.md FR-009: Extend expires_at on every cart action
 */

'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/core/auth/session'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import { removeItemSchema } from '@/modules/orders'
import type { ActionResult, RemoveItemInput } from '@/modules/orders'
import { removeCartItem, extendExpiration } from '@/features/cart/db/mutations'
import { getCartBySession, getCartItemCount } from '@/features/cart/db/queries'
import type { RemoveItemResult } from '@/features/cart/types'

const logger = new Logger()

/**
 * Remove an item from the cart.
 *
 * Flow:
 * 1. Verify session (DAL)
 * 2. Validate input (Zod)
 * 3. Get cart for session (ownership verification)
 * 4. Remove cart item
 * 5. Extend cart expiration (FR-009)
 * 6. Return updated item count
 */
export async function removeItemAction(
    input: RemoveItemInput
): Promise<ActionResult<RemoveItemResult>> {
    try {
        // 1. Verify session (DAL pattern)
        const session = await verifySession()
        if (!session) {
            return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
        }

        // 2. Validate input with Zod
        const parsed = removeItemSchema.safeParse(input)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.errors[0]?.message ?? 'Validation error',
                code: 'VALIDATION_ERROR',
            }
        }

        const { cartItemId } = parsed.data

        // 3. Get cart for session (ownership verification)
        const cart = await getCartBySession(session.sessionId)
        if (!cart) {
            return { success: false, error: 'Cart not found', code: 'NOT_FOUND' }
        }

        // 4. Remove cart item
        await removeCartItem(cartItemId)

        // 5. Extend expiration in background
        Promise.allSettled([extendExpiration(cart.id)])

        const cartItemCount = await getCartItemCount(cart.id)

        // Revalidate cart-related pages
        revalidatePath('/', 'layout')

        logger.info(`Cart item ${cartItemId} removed`)

        return {
            success: true,
            data: {
                cartItemCount,
            },
        }
    } catch (error) {
        if (error instanceof AppError) {
            return { success: false, error: error.message, code: error.code }
        }

        logger.error(error as Error, { context: 'removeItemAction' })
        return {
            success: false,
            error: 'Failed to remove item. Please try again.',
            code: 'INTERNAL_ERROR',
        }
    }
}
