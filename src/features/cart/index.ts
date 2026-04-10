/**
 * Cart Feature — Public API
 *
 * All exports from this feature must go through this barrel file.
 * External code imports from '@/features/cart', NOT deep paths.
 *
 * @see Constitution Line 126: Import from index.ts only
 * @see Constitution Line 216-234: Private _components/ are NOT exportable
 * @see Constitution Line 452: index.ts — REQUIRED — Public API exports only
 */

// ─── UI Components (Public) ───────────────────────────────────
export { CartDrawer } from './ui/CartDrawer'
export { CartButton } from './ui/CartButton'
export { AddToCartButton } from './ui/AddToCartButton'
export { CartPageContent } from './ui/CartPageContent'

// ─── UI State ─────────────────────────────────────────────────
export { useCart } from './logic/cart.store'

// ─── Server Actions ───────────────────────────────────────────
export { addToCartAction } from './actions/add-to-cart.action'
export { updateQuantityAction } from './actions/update-quantity.action'
export { removeItemAction } from './actions/remove-item.action'
export { clearCartAction } from './actions/clear-cart.action'

// ─── DB (server-side only) ────────────────────────────────────
export {
    getCartBySession,
    getCartItems,
    getCartItemCount,
    detectPriceChanges,
} from './db/queries'

export {
    getOrCreateCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    extendExpiration,
    deleteCart,
} from './db/mutations'

// ─── Types ────────────────────────────────────────────────────
export type { CartItemData, PriceChange, CartUIState } from './types'

// ─── Collections (for payload.config.ts) ──────────────────────
export { Carts, CartItems } from './db/schema'
