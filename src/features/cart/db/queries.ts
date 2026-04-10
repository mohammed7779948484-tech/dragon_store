/**
 * Cart Queries
 *
 * Read operations for cart data. All queries use Payload Local API.
 *
 * @see Constitution Line 257: overrideAccess: false when user context exists
 * @see Constitution Line 1394: Cart queries MUST filter expired carts
 * @see data-model.md: carts and cart_items collections
 */

import { getPayloadClient } from '@/lib/payload'
import type { CartItemData, PriceChange } from '../types'

/**
 * Get cart by session ID. Filters out expired carts.
 *
 * @param sessionId - Gate session ID
 * @returns Cart document or null if not found or expired
 */
export async function getCartBySession(sessionId: string) {
    if (!sessionId) return null

    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'carts',
        where: {
            session_id: { equals: sessionId },
            expires_at: { greater_than: new Date().toISOString() },
        },
        limit: 1,
        depth: 0,
        overrideAccess: true, // System-level execution for unauthenticated storefront sessions
    })

    return result.docs[0] ?? null
}

/**
 * Get cart items with populated variant and product data.
 *
 * Returns CartItemData[] with current prices for live price change detection.
 *
 * @param cartId - Cart UUID
 * @returns Array of cart items with live prices
 */
export async function getCartItems(cartId: string | number): Promise<CartItemData[]> {
    if (!cartId) return []

    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'cart_items',
        where: {
            cart: { equals: cartId },
        },
        depth: 2, // Populate variant → product
        limit: 50,
        overrideAccess: true, // System execution
    })

    return result.docs.map((item) => {
        const variant = item.variant as Record<string, unknown> | null
        const product = variant?.product as Record<string, unknown> | null
        const variantImages = variant?.images as Array<{ image: unknown }> | undefined
        const variantImage = variantImages?.[0]?.image

        return {
            id: item.id as number,
            variantId: variant?.id as number ?? 0,
            productName: (product?.name as string) ?? 'Unknown Product',
            variantName: (variant?.variant_name as string) ?? 'Unknown Variant',
            imageUrl: extractImageUrl(variantImage) || extractImageUrl(product?.image),
            cloudinaryPublicId: extractCloudinaryPublicId(variantImage) || extractCloudinaryPublicId(product?.image),
            quantity: item.quantity as number,
            priceAtAdd: item.price_at_add as number,
            currentPrice: (variant?.price as number) ?? 0,
            isActive: Boolean(variant?.is_active) && Boolean(product?.is_active),
            stockQuantity: (variant?.stock_quantity as number) ?? 0,
        }
    })
}

/**
 * Get the count of distinct items in a cart.
 *
 * @param cartId - Cart UUID
 * @returns Number of distinct items
 */
export async function getCartItemCount(cartId: string | number): Promise<number> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'cart_items',
        where: {
            cart: { equals: cartId },
        },
        limit: 1000,
        pagination: false,
        depth: 0,
        overrideAccess: true, // System execution
    })

    // Sum the quantity field from all items
    return result.docs.reduce((total, item) => {
        return total + (typeof item.quantity === 'number' ? item.quantity : 0)
    }, 0)
}

/**
 * Detect price changes between add time and current variant prices.
 *
 * @param items - Cart items with current prices
 * @returns Array of price changes found
 */
export function detectPriceChanges(items: CartItemData[]): PriceChange[] {
    return items
        .filter((item) => item.priceAtAdd !== item.currentPrice && item.isActive)
        .map((item) => ({
            variantId: item.variantId,
            variantName: item.variantName,
            oldPrice: item.priceAtAdd,
            newPrice: item.currentPrice,
        }))
}

/** Extract image URL from Payload upload field */
function extractImageUrl(image: unknown): string | null {
    if (!image) return null
    if (typeof image === 'object' && image !== null && 'url' in image) {
        return (image as Record<string, unknown>).url as string
    }
    return null
}

/** Extract Cloudinary public_id from Payload upload field */
function extractCloudinaryPublicId(image: unknown): string | null {
    if (!image) return null
    if (typeof image === 'object' && image !== null && 'cloudinary_public_id' in image) {
        return (image as Record<string, unknown>).cloudinary_public_id as string
    }
    return null
}
