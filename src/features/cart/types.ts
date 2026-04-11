/**
 * Cart Feature Types
 *
 * Type definitions for cart UI, actions, and data. Zustand store types live here
 * but cart items are NEVER stored in Zustand (server is source of truth).
 *
 * @see spec.md: FR-011/FR-013 (Zustand UI-only), FR-014 (price change detection)
 * @see api-spec.md: AddToCartResult, UpdateQuantityResult, RemoveItemResult
 * @see research.md: Decision #3 (Zustand UI-only store)
 */

import type { ActionResult } from '@/modules/orders'

/** Re-export for convenience */
export type { ActionResult }

/** Cart item data passed to UI components (server-fetched) */
export interface CartItemData {
    id: number
    variantId: number
    productName: string
    variantName: string
    imageUrl: string | null
    cloudinaryPublicId: string | null
    quantity: number
    priceAtAdd: number
    currentPrice: number
    isActive: boolean
    stockQuantity: number
}

/** Price change detected between add time and current time */
export interface PriceChange {
    variantId: number
    variantName: string
    oldPrice: number
    newPrice: number
}

/** Zustand UI-only store state (NO cart items — server is source of truth) */
export interface CartUIState {
    isDrawerOpen: boolean
    isLoading: boolean
    openDrawer: () => void
    closeDrawer: () => void
    setLoading: (loading: boolean) => void
}

/** Result from add-to-cart server action */
export interface AddToCartResult {
    cartItemCount: number
    itemName: string
}

/** Result from update-quantity server action */
export interface UpdateQuantityResult {
    cartItemCount: number
    itemTotal: number
}

/** Result from remove-item server action */
export interface RemoveItemResult {
    cartItemCount: number
}

/** Result from clear-cart server action */
export interface ClearCartResult {
    clearedCount: number
}

/** Cart summary for display */
export interface CartSummaryData {
    itemCount: number
    subtotal: number
    hasInactiveItems: boolean
    hasPriceChanges: boolean
    priceChanges: PriceChange[]
}
