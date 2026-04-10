# Cart Feature

Server-side relational cart with session linking, quantity management, and live price change detection.

## Purpose

Provides shopping cart functionality backed by PostgreSQL (via Payload CMS). Cart data is server-side only — Zustand is used exclusively for UI state (drawer open/close, loading).

## Dependencies

- `modules/orders` — Cart constants, validation schemas
- `core/errors` — AppError class
- `core/logger` — Structured logging

## Public API

```typescript
// UI state
export { useCart } from './logic/cart.store'

// DB operations (server-side only)
export { getCartBySession, getCartItems, getCartItemCount, detectPriceChanges } from './db/queries'
export { getOrCreateCart, addItemToCart, updateCartItem, removeCartItem, clearCart, extendExpiration, deleteCart } from './db/mutations'

// Types
export type { CartItemData, PriceChange, CartUIState } from './types'
```

## Architecture

- **`db/schema.ts`** — Payload collections: `carts` + `cart_items` (relational, NOT embedded)
- **`db/queries.ts`** — Read operations (`getCartBySession`, `getCartItems`, `detectPriceChanges`)
- **`db/mutations.ts`** — Write operations (`addItemToCart`, `updateCartItem`, `removeCartItem`, `clearCart`)
- **`logic/cart.store.ts`** — Zustand UI-only state (NO cart items in store)
- **`constants.ts`** — Re-exports from `modules/orders`
- **`types.ts`** — Feature-specific type definitions

## Add To Cart Integration

To add the "Add to Cart" functionality to external features (like Product Details), use the `AddToCartButton` component. It is designed to be injected via Props to preserve FSD isolation.

**Example Usage (Component Injection):**
```tsx
import { AddToCartButton } from '@/features/cart'
import { ProductDetail } from '@/features/products'

<ProductDetail 
  product={productData}
  ActionComponent={AddToCartButton}
/>
```
