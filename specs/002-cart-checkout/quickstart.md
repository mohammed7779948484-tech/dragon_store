# Quickstart: Phase 2 Cart & Checkout

**Feature**: 002-cart-checkout
**Date**: 2026-02-20

## Prerequisites

- Phase 1 (001-foundation-setup) complete
- Gate session management working
- Product variants collection with `stock_quantity` field
- DAL pattern implemented in `core/auth/session.ts`

## Quick Implementation Order

### Phase 2A: Cart Feature (Priority: P1)

```
1. Create features/cart/db/schema.ts (Carts + CartItems collections)
2. Register collections in payload.config.ts
3. Run database migration
4. Create features/cart/db/queries.ts
5. Create features/cart/db/mutations.ts
6. Create features/cart/constants.ts (MAX_QUANTITY=10, MAX_ITEMS=50)
7. Create features/cart/types.ts
8. Create features/cart/logic/use-cart.ts (Zustand UI store)
9. Create features/cart/actions/add-to-cart.action.ts
10. Create features/cart/actions/update-quantity.action.ts
11. Create features/cart/actions/remove-item.action.ts
12. Create features/cart/actions/clear-cart.action.ts
13. Create features/cart/ui/_components/CartItem.tsx
14. Create features/cart/ui/_components/CartSummary.tsx
15. Create features/cart/ui/_components/EmptyCart.tsx
16. Create features/cart/ui/_components/PriceChangeNotice.tsx
17. Create features/cart/ui/CartDrawer.tsx
18. Create features/cart/ui/CartButton.tsx
19. Create features/cart/index.ts (exports)
20. Create features/cart/feature.config.ts
21. Create features/cart/README.md
22. Register in features/_registry/index.ts
23. Update widgets/header/Header.tsx to include CartButton
```

### Phase 2B: Orders Module (Priority: P1)

```
1. Create modules/orders/constants.ts (ORDER_STATUS, ALLOWED_TRANSITIONS)
2. Create modules/orders/types.ts
3. Create modules/orders/validators/validate-checkout.ts (Zod schema)
4. Create modules/orders/services/stock.service.ts (decrementStock, returnStock)
5. Create modules/orders/services/order.service.ts (createOrder, generateOrderNumber, etc.)
6. Create modules/orders/index.ts (exports)
7. Create modules/orders/README.md
```

### Phase 2C: Checkout Feature (Priority: P1)

```
1. Create features/checkout/db/schema.ts (Orders + OrderItems collections)
2. Register collections in payload.config.ts
3. Run database migration
4. Create features/checkout/db/queries.ts
5. Create features/checkout/db/mutations.ts
6. Create features/checkout/constants.ts
7. Create features/checkout/types.ts
8. Create features/checkout/actions/process-checkout.action.ts
9. Create features/checkout/ui/_components/CustomerFields.tsx
10. Create features/checkout/ui/_components/OrderSummary.tsx
11. Create features/checkout/ui/_components/CodDisclaimer.tsx
12. Create features/checkout/ui/CheckoutForm.tsx
13. Create features/checkout/ui/OrderConfirmation.tsx
14. Create features/checkout/index.ts (exports)
15. Create features/checkout/feature.config.ts
16. Create features/checkout/README.md
17. Register in features/_registry/index.ts
18. Create app/(storefront)/checkout/page.tsx
19. Create app/(storefront)/order-confirmation/[orderId]/page.tsx
```

### Phase 2D: Order Tracking Feature (Priority: P2)

```
1. Create features/order-tracking/constants.ts
2. Create features/order-tracking/types.ts
3. Create features/order-tracking/actions/track-order.action.ts
4. Create features/order-tracking/actions/lookup-orders.action.ts
5. Create features/order-tracking/ui/_components/StatusTimeline.tsx
6. Create features/order-tracking/ui/TrackOrderForm.tsx
7. Create features/order-tracking/ui/OrderStatus.tsx
8. Create features/order-tracking/index.ts (exports)
9. Create features/order-tracking/feature.config.ts
10. Create features/order-tracking/README.md
11. Register in features/_registry/index.ts
12. Create app/(storefront)/track-order/page.tsx
```

### Phase 2E: Cart Cleanup Cron (Priority: P3)

```
1. Create app/api/cron/cleanup-carts/route.ts
2. Update vercel.json with cron configuration
3. Test cron endpoint manually
```

## Key Integration Points

### 1. Header Widget

Update `src/widgets/header/Header.tsx`:

```tsx
import { CartButton } from '@/features/cart'

export function Header() {
  return (
    <header>
      {/* ... existing content */}
      <CartButton />
    </header>
  )
}
```

### 2. Payload Config

Add to `src/payload/payload.config.ts`:

```typescript
import { Carts, CartItems } from '@/features/cart/db/schema'
import { Orders, OrderItems } from '@/features/checkout/db/schema'

export default buildConfig({
  collections: [
    // ... existing collections
    Carts,
    CartItems,
    Orders,
    OrderItems,
  ],
})
```

### 3. Cart Page (Optional Full View)

Create `src/app/(storefront)/cart/page.tsx`:

```tsx
import { verifySession } from '@/core/auth/session'
import { getCartBySession, getCartItems } from '@/features/cart/db/queries'
import { CartDrawer } from '@/features/cart'

export default async function CartPage() {
  const session = await verifySession()
  
  if (!session) {
    // Redirect handled by middleware/layout
  }
  
  const cart = await getCartBySession(session.sessionId)
  const items = cart ? await getCartItems(cart.id) : []
  
  return (
    <main>
      <h1>Your Cart</h1>
      <CartDrawer items={items} isOpen />
    </main>
  )
}
```

## Testing Commands

```bash
# Run all tests
npm test

# Run specific feature tests
npm test -- features/cart
npm test -- features/checkout

# Run E2E tests
npx playwright test tests/e2e/cart-flow.spec.ts
npx playwright test tests/e2e/checkout-flow.spec.ts

# Test cron endpoint manually
curl -X GET http://localhost:3000/api/cron/cleanup-carts \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Common Patterns

### Server Action Pattern

```typescript
// features/cart/actions/add-to-cart.action.ts
'use server'

import { z } from 'zod'
import { verifySession } from '@/core/auth/session'
import { Logger } from '@/core/logger'
import { AppError } from '@/core/errors'
import { rateLimit } from '@/core/rate-limit'
import { addToCartSchema } from '../validators'
import { addItemToCart } from '../db/mutations'

const logger = new Logger()
const cartLimiter = rateLimit({ interval: 60000 })

export async function addToCart(input: unknown) {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Session expired', code: 'UNAUTHORIZED' }
    }
    
    cartLimiter.check(session.sessionId, 20)
    
    const data = addToCartSchema.parse(input)
    const result = await addItemToCart(session.sessionId, data.variantId, data.quantity)
    
    return { success: true, data: result }
    
  } catch (error) {
    logger.error(error as Error, 'addToCart failed')
    
    if (error instanceof AppError) {
      return { success: false, error: error.message, code: error.code }
    }
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message, code: 'VALIDATION_ERROR' }
    }
    
    return { success: false, error: 'An error occurred', code: 'UNKNOWN_ERROR' }
  }
}
```

### Zustand UI Store Pattern

```typescript
// features/cart/logic/use-cart.ts
import { create } from 'zustand'

interface CartUIState {
  isDrawerOpen: boolean
  isLoading: boolean
  openDrawer: () => void
  closeDrawer: () => void
  setLoading: (loading: boolean) => void
}

export const useCart = create<CartUIState>((set) => ({
  isDrawerOpen: false,
  isLoading: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
```

### Cart Drawer Pattern (Client Component)

```tsx
// features/cart/ui/CartDrawer.tsx
'use client'

import { Sheet } from '@/shared/ui/sheet'
import { useCart } from '../logic/use-cart'
import { CartItem } from './_components/CartItem'
import { CartSummary } from './_components/CartSummary'
import { EmptyCart } from './_components/EmptyCart'

interface CartDrawerProps {
  items: CartItemData[]
}

export function CartDrawer({ items }: CartDrawerProps) {
  const { isDrawerOpen, closeDrawer, isLoading } = useCart()
  
  if (items.length === 0) {
    return <EmptyCart />
  }
  
  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      {isLoading ? (
        <CartSkeleton />
      ) : (
        <>
          {items.map(item => <CartItem key={item.id} {...item} />)}
          <CartSummary items={items} />
        </>
      )}
    </Sheet>
  )
}
```

## Environment Variables Required

```bash
# Already defined from Phase 1:
DATABASE_URL=postgresql://...
SESSION_SECRET=...
GATE_PASSWORD=...

# New for Phase 2:
CRON_SECRET=<random-32-char-string>
```

## Verification Checklist

After implementation, verify:

- [ ] Cart persists across page refreshes (server-side)
- [ ] Cart expires after 24h inactivity
- [ ] Quantity capped at 10 per item
- [ ] Max 50 items in cart
- [ ] Price changes detected and displayed
- [ ] Inactive items greyed out, block checkout
- [ ] Checkout creates order with correct snapshots
- [ ] Stock decremented atomically
- [ ] Order number format VX-XXXXXX
- [ ] Order tracking works by number and phone
- [ ] Rate limiting active on all endpoints
- [ ] Honeypot rejects bots silently
- [ ] Cron endpoint authenticates with Bearer token
