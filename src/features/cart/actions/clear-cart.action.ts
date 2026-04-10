/**
 * Clear Cart Server Action
 *
 * Removes all items from the cart. Follows constitution patterns:
 * - MUST use try-catch — never throw, return ActionResult
 * - MUST verify session via DAL at start
 *
 * @see Constitution Line 170-213: Server Actions Rules
 * @see spec.md FR-010: clear-cart action
 */

'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/core/auth/session'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import type { ActionResult } from '@/modules/orders'
import { clearCart } from '@/features/cart/db/mutations'
import { getCartBySession } from '@/features/cart/db/queries'
import type { ClearCartResult } from '@/features/cart/types'

const logger = new Logger()

/**
 * Clear all items from the cart.
 *
 * Flow:
 * 1. Verify session (DAL)
 * 2. Get cart for session (ownership verification)
 * 3. Clear all cart items
 * 4. Return cleared count
 */
export async function clearCartAction(): Promise<ActionResult<ClearCartResult>> {
    try {
        // 1. Verify session (DAL pattern)
        const session = await verifySession()
        if (!session) {
            return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
        }

        // 2. Get cart for session (ownership verification)
        const cart = await getCartBySession(session.sessionId)
        if (!cart) {
            return { success: false, error: 'Cart not found', code: 'NOT_FOUND' }
        }

        // 3. Clear all cart items
        const clearedCount = await clearCart(cart.id)

        // Revalidate cart-related pages
        revalidatePath('/', 'layout')

        logger.info(`Cart cleared: ${clearedCount} items removed`)

        return {
            success: true,
            data: {
                clearedCount,
            },
        }
    } catch (error) {
        if (error instanceof AppError) {
            return { success: false, error: error.message, code: error.code }
        }

        logger.error(error as Error, { context: 'clearCartAction' })
        return {
            success: false,
            error: 'Failed to clear cart. Please try again.',
            code: 'INTERNAL_ERROR',
        }
    }
}
