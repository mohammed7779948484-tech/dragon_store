/**
 * Cart Mutations
 *
 * Write operations for cart data. All mutations use Payload Local API.
 *
 * @see Constitution Line 257: overrideAccess: false when user context exists
 * @see data-model.md: carts and cart_items collections
 * @see spec.md: FR-005 through FR-009
 */

import { getPayloadClient } from '@/lib/payload'
import { AppError } from '@/core/errors'
import {
    CART_EXPIRY_MS,
    MAX_CART_ITEMS,
    MAX_QUANTITY,
    CART_FULL_MESSAGE,
} from '@/modules/orders'
import { getCartItemCount } from './queries'

/**
 * Get or create a cart for the given session.
 *
 * @param sessionId - Gate session ID
 * @returns Cart document (existing or newly created)
 */
export async function getOrCreateCart(sessionId: string) {
    const payload = await getPayloadClient()

    // Try to find existing non-expired cart
    const existing = await payload.find({
        collection: 'carts',
        where: {
            session_id: { equals: sessionId },
            expires_at: { greater_than: new Date().toISOString() },
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
    })

    if (existing.docs[0]) {
        return existing.docs[0]
    }

    // Create new cart with 24h expiry
    const expiresAt = new Date(Date.now() + CART_EXPIRY_MS)

    const cart = await payload.create({
        collection: 'carts',
        data: {
            session_id: sessionId,
            expires_at: expiresAt.toISOString(),
        },
        depth: 0,
        overrideAccess: true,
    })

    return cart
}

/**
 * Add item to cart with upsert logic.
 *
 * If the variant already exists in cart, merges quantity (capped at MAX_QUANTITY).
 * If cart has MAX_CART_ITEMS distinct items, throws CART_FULL error.
 *
 * @param cartId - Cart UUID
 * @param variantId - Product variant ID
 * @param quantity - Quantity to add
 * @param priceAtAdd - Current variant price at time of addition
 * @returns Cart item document
 */
export async function addItemToCart(
    cartId: string | number,
    variantId: number,
    quantity: number,
    priceAtAdd: number
) {
    const payload = await getPayloadClient()

    // Check if variant already in cart (upsert)
    const existing = await payload.find({
        collection: 'cart_items',
        where: {
            and: [
                { cart: { equals: cartId } },
                { variant: { equals: variantId } },
            ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
    })

    if (existing.docs[0]) {
        // Merge quantity (cap at MAX_QUANTITY)
        const existingItem = existing.docs[0]
        const newQuantity = Math.min(
            (existingItem.quantity as number) + quantity,
            MAX_QUANTITY
        )

        const updated = await payload.update({
            collection: 'cart_items',
            id: existingItem.id,
            data: {
                quantity: newQuantity,
                price_at_add: priceAtAdd, // Update price snapshot
            },
            depth: 0,
            overrideAccess: true,
        })

        return updated
    }

    // Check cart item count limit
    const itemCount = await getCartItemCount(cartId)
    if (itemCount >= MAX_CART_ITEMS) {
        throw new AppError(CART_FULL_MESSAGE, 400, 'CART_FULL')
    }

    // Create new cart item
    const cartItem = await payload.create({
        collection: 'cart_items',
        data: {
            cart: cartId,
            variant: variantId,
            quantity: Math.min(quantity, MAX_QUANTITY),
            price_at_add: priceAtAdd,
        },
        depth: 0,
        overrideAccess: true,
    })

    return cartItem
}

/**
 * Update cart item quantity.
 *
 * @param cartItemId - Cart item ID
 * @param quantity - New quantity (1-10)
 * @returns Updated cart item
 */
export async function updateCartItem(cartItemId: number, quantity: number) {
    const payload = await getPayloadClient()

    const updated = await payload.update({
        collection: 'cart_items',
        id: cartItemId,
        data: {
            quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY),
        },
        depth: 0,
        overrideAccess: true,
    })

    return updated
}

/**
 * Remove a cart item.
 *
 * @param cartItemId - Cart item ID
 */
export async function removeCartItem(cartItemId: number): Promise<void> {
    const payload = await getPayloadClient()

    await payload.delete({
        collection: 'cart_items',
        id: cartItemId,
        overrideAccess: true,
    })
}

/**
 * Clear all items from a cart.
 *
 * @param cartId - Cart UUID
 * @returns Number of items deleted
 */
export async function clearCart(cartId: string | number): Promise<number> {
    const payload = await getPayloadClient()

    const result = await payload.delete({
        collection: 'cart_items',
        where: {
            cart: { equals: cartId },
        },
        overrideAccess: true,
    })

    return result.docs?.length ?? 0
}

/**
 * Extend cart expiration to 24h from now.
 *
 * Called on every cart action per FR-009.
 *
 * @param cartId - Cart UUID
 */
export async function extendExpiration(cartId: string | number): Promise<void> {
    const payload = await getPayloadClient()
    const expiresAt = new Date(Date.now() + CART_EXPIRY_MS)

    await payload.update({
        collection: 'carts',
        id: cartId,
        data: {
            expires_at: expiresAt.toISOString(),
        },
        depth: 0,
        overrideAccess: true,
    })
}

/**
 * Delete a cart and all its items.
 *
 * @param cartId - Cart UUID
 */
export async function deleteCart(cartId: string | number): Promise<void> {
    const payload = await getPayloadClient()

    // Delete items first (Payload may not cascade automatically)
    await clearCart(cartId)

    // Delete the cart
    await payload.delete({
        collection: 'carts',
        id: cartId,
        overrideAccess: true,
    })
}
