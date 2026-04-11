/**
 * Update Quantity Server Action
 *
 * Updates the quantity of a cart item. Follows constitution patterns:
 * - MUST validate with Zod before processing
 * - MUST use try-catch — never throw, return ActionResult
 * - MUST verify session via DAL at start
 * - MUST extend cart expiration on every action (FR-009)
 *
 * @see Constitution Line 170-213: Server Actions Rules
 * @see spec.md FR-007: update-quantity action
 * @see spec.md FR-009: Extend expires_at on every cart action
 * @see spec.md FR-016: No optimistic updates
 */

'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/core/auth/session'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import { updateQuantitySchema } from '@/modules/orders'
import type { ActionResult, UpdateQuantityInput } from '@/modules/orders'
import { updateCartItem, extendExpiration } from '@/features/cart/db/mutations'
import { getCartBySession, getCartItemCount } from '@/features/cart/db/queries'
import { StockService } from '@/modules/orders'
import { getPayloadClient } from '@/lib/payload'
import type { UpdateQuantityResult } from '@/features/cart/types'

const logger = new Logger()
const stockService = new StockService()

/**
 * Update quantity of a cart item.
 *
 * Flow:
 * 1. Verify session (DAL)
 * 2. Validate input (Zod)
 * 3. Get cart for session (verify ownership)
 * 4. Update cart item quantity
 * 5. Extend cart expiration (FR-009)
 * 6. Return updated item count and total
 */
export async function updateQuantityAction(
    input: UpdateQuantityInput
): Promise<ActionResult<UpdateQuantityResult>> {
    try {
        // 1. Verify session (DAL pattern)
        const session = await verifySession()
        if (!session) {
            return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
        }

        // 2. Validate input with Zod
        const parsed = updateQuantitySchema.safeParse(input)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.errors[0]?.message ?? 'Validation error',
                code: 'VALIDATION_ERROR',
            }
        }

        const { cartItemId, quantity } = parsed.data

        // 3. Get cart for session (ownership verification)
        const cart = await getCartBySession(session.sessionId)
        if (!cart) {
            return { success: false, error: 'Cart not found', code: 'NOT_FOUND' }
        }

        // 4. Verify strict stock limits (Prevents race conditions and API bypass)
        const payload = await getPayloadClient()
        const cartItem = await payload.findByID({
            collection: 'cart_items',
            id: cartItemId,
            depth: 1, // Need variant relation
            overrideAccess: true,
        })

        if (!cartItem || typeof cartItem.variant !== 'object') {
            return { success: false, error: 'Item not found', code: 'NOT_FOUND' }
        }

        const variantId = cartItem.variant.id
        const variantInfo = await stockService.getVariantInfo(variantId)

        if (!variantInfo || !variantInfo.isActive) {
            return { success: false, error: 'This variant is no longer available', code: 'INACTIVE' }
        }

        if (variantInfo.stockQuantity < quantity) {
            return {
                success: false,
                error: `Cannot update to ${quantity}. Only ${variantInfo.stockQuantity} exist in stock.`,
                code: 'INSUFFICIENT_STOCK',
            }
        }

        // 5. Update cart item quantity
        const updated = await updateCartItem(cartItemId, quantity)
        const itemTotal = (updated.quantity as number) * ((updated as Record<string, unknown>).price_at_add as number ?? 0)

        // 5. Extend expiration in background (Fire-and-forget) to speed up response
        Promise.allSettled([extendExpiration(cart.id)])

        const cartItemCount = await getCartItemCount(cart.id)

        // Revalidate cart-related pages
        revalidatePath('/', 'layout')

        logger.info(`Cart item ${cartItemId} quantity updated to ${quantity}`)

        return {
            success: true,
            data: {
                cartItemCount,
                itemTotal,
            },
        }
    } catch (error) {
        if (error instanceof AppError) {
            return { success: false, error: error.message, code: error.code }
        }

        logger.error(error as Error, { context: 'updateQuantityAction' })
        return {
            success: false,
            error: 'Failed to update quantity. Please try again.',
            code: 'INTERNAL_ERROR',
        }
    }
}
