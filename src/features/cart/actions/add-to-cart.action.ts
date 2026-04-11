/**
 * Add to Cart Server Action
 *
 * Server Action following constitution patterns:
 * - MUST validate with Zod before processing (line 171)
 * - MUST use try-catch — never throw, return ActionResult (line 172)
 * - MUST call modules/ for business logic — no inline logic (line 173)
 * - MUST log all errors via Logger (line 174)
 * - MUST verify session via DAL at start (line 278-312)
 *
 * @see Constitution Line 170-213: Server Actions Rules
 * @see spec.md FR-005: add-to-cart action
 * @see spec.md FR-009: Extend expires_at on every cart action
 * @see spec.md FR-016: No optimistic updates
 */

'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/core/auth/session'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import { addToCartSchema } from '@/modules/orders'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult, AddToCartInput } from '@/modules/orders'
import {
    getOrCreateCart,
    addItemToCart,
    extendExpiration,
} from '@/features/cart/db/mutations'
import { getCartItemCount } from '@/features/cart/db/queries'
import { StockService } from '@/modules/orders'
import type { AddToCartResult } from '@/features/cart/types'

const logger = new Logger()
const stockService = new StockService()

/**
 * Add a product variant to the cart.
 *
 * Flow:
 * 1. Verify session (DAL)
 * 2. Validate input (Zod)
 * 3. Delegate stock/variant check to StockService (modules/)
 * 4. Get or create cart for session
 * 5. Add/upsert item to cart
 * 6. Extend cart expiration (FR-009)
 * 7. Return item count for badge update
 */
export async function addToCartAction(
    input: AddToCartInput
): Promise<ActionResult<AddToCartResult>> {
    try {
        // 1. Verify session (DAL pattern — CRITICAL per constitution)
        const session = await verifySession()
        if (!session) {
            return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
        }

        // 2. Validate input with Zod (constitution line 171)
        const parsed = addToCartSchema.safeParse(input)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.errors[0]?.message ?? 'Validation error',
                code: 'VALIDATION_ERROR',
            }
        }

        const { variantId, quantity } = parsed.data

        // 3. Delegate variant lookup & stock check to module (constitution line 173)
        const variantInfo = await stockService.getVariantInfo(variantId)
        if (!variantInfo) {
            return { success: false, error: 'Product variant not found', code: 'NOT_FOUND' }
        }

        if (!variantInfo.isActive) {
            return { success: false, error: 'This variant is no longer available', code: 'INACTIVE' }
        }

        // 4. Get or create cart for session
        const cart = await getOrCreateCart(session.sessionId)

        // 5. PREVENT EXCEEDING STOCK LIMIT: Check how many are ALREADY in the cart
        const payload = await getPayloadClient()
        const existingItem = await payload.find({
            collection: 'cart_items',
            where: {
                and: [
                    { cart: { equals: cart.id } },
                    { variant: { equals: variantId } },
                ],
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        })

        const currentQtyInCart = (existingItem.docs[0]?.quantity as number) ?? 0
        const requestedTotal = currentQtyInCart + quantity

        if (variantInfo.stockQuantity < requestedTotal) {
            return {
                success: false,
                error: `Cannot add ${quantity} more. You already have ${currentQtyInCart} in cart and only ${variantInfo.stockQuantity} exist in stock.`,
                code: 'INSUFFICIENT_STOCK',
            }
        }

        // 6. Add/upsert item to cart
        await addItemToCart(cart.id, variantId, quantity, variantInfo.price)

        // 6. Extend expiration in background (Fire-and-forget, Zero latency)
        Promise.allSettled([extendExpiration(cart.id)])

        const cartItemCount = await getCartItemCount(cart.id)

        // Revalidate cart-related pages
        revalidatePath('/', 'layout')

        logger.info(`Item added to cart: ${variantInfo.productName} - ${variantInfo.variantName} (qty: ${quantity})`)

        return {
            success: true,
            data: {
                cartItemCount,
                itemName: `${variantInfo.productName} - ${variantInfo.variantName}`,
            },
        }
    } catch (error) {
        if (error instanceof AppError) {
            return { success: false, error: error.message, code: error.code }
        }

        logger.error(error as Error, { context: 'addToCartAction' })
        return {
            success: false,
            error: 'Failed to add item to cart. Please try again.',
            code: 'INTERNAL_ERROR',
        }
    }
}
