# Checkout Feature

## Purpose

COD checkout flow for the storefront. Provides the checkout form (customer info, order summary, COD disclaimer), atomic order creation with stock decrement, and post-checkout order confirmation page.

Delegates all business logic to `modules/orders` (OrderService, StockService, Zod validators) — this feature handles UI composition and server action orchestration only.

## Dependencies

- `@/modules/orders` — OrderService, StockService, Zod schemas, constants (rate limits, fake order IDs, currency)
- `@/features/cart` — Cart queries (`getCartBySession`, `getCartItems`) and mutations (`clearCart`)
- `@/core/auth` — `verifySession()` for DAL session verification
- `@/core/rate-limit` — `checkoutRateLimiter` (3 attempts/min/session)
- `@/core/errors` — `AppError` for typed error handling
- `@/core/logger` — `Logger` for structured logging + Sentry integration
- `@/shared/ui` — `Input`, `Label`, `Button`, `Separator` primitives

## Public API

### UI Components

| Export | Type | Description |
|--------|------|-------------|
| `CheckoutForm` | Client Component | Main checkout form composing CustomerFields + OrderSummary + CodDisclaimer with `useTransition` submission |
| `OrderConfirmation` | Server Component | Post-checkout success page with order number, items summary, status, and COD reminder |

### Private Components (`_components/`)

| Component | Type | Description |
|-----------|------|-------------|
| `CustomerFields` | Client Component | Form inputs: name, phone, address, notes + **honeypot hidden field** |
| `OrderSummary` | Presentational | Line items with live prices, inactive item warnings, subtotal |
| `CodDisclaimer` | Presentational | Cash on Delivery payment notice |

### Server Actions

| Export | Description |
|--------|-------------|
| `processCheckoutAction(input)` | Atomic checkout: session → rate limit → Zod → honeypot → stock decrement → order creation → cart clear |

### Re-exported DB Functions

| Export | Description |
|--------|-------------|
| `getOrderById(orderId)` | Full order with items (for confirmation page) |
| `getOrderByNumber(orderNumber)` | Find by VX-XXXXXX (for tracking) |
| `getOrdersByPhone(phone)` | Order list by phone (for tracking) |
| `createOrder(input, req)` | Wrapper delegating to OrderService |

### Types

| Export | Description |
|--------|-------------|
| `CheckoutFormInput` | Raw form values from checkout form |
| `CheckoutCartItem` | Cart item prepared for checkout summary (unitPrice, totalPrice, isActive) |
| `CheckoutResult` | `{ orderId, orderNumber }` returned after successful checkout |
| `OrderConfirmationData` | Full data for the confirmation page (order number, status, items, total) |

### Constants

| Export | Value | Description |
|--------|-------|-------------|
| `CURRENCY_SYMBOL` | `$` | Currency display symbol (client-safe, in `_components/constants.ts`) |

## Collections Owned

| Collection | Slug | Description |
|------------|------|-------------|
| `Orders` | `orders` | Customer orders with status, total, customer info |
| `OrderItems` | `order_items` | Immutable price snapshots per order line item |

## Notes

- **`CheckoutForm`** is Client Component to manage loading state via `useTransition` and form error display
- **`OrderConfirmation`** is a Server Component — receives all data as props from the page
- **Honeypot anti-bot** uses CSS off-screen positioning (`absolute -left-[9999px]`) — more effective than `display: none`
- **Transaction safety**: stock decrement + order creation are atomic; cart clearing is best-effort (outside transaction)
- **`_components/constants.ts`** exists as a client-safe `CURRENCY_SYMBOL` to avoid importing the heavy `modules/orders` chain that pulls in `revalidateTag` (server-only) into client bundles
- **No payment integration** — COD only per constitution

## Files

```
src/features/checkout/
├── README.md                              # This file
├── feature.config.ts                      # Feature metadata (depends on: gate, cart)
├── index.ts                               # Public API (components + actions + queries + types)
├── types.ts                               # CheckoutFormInput, CheckoutCartItem, OrderConfirmationData
├── constants.ts                           # Re-exports from modules/orders
├── actions/
│   └── process-checkout.action.ts         # Server Action — 13-step atomic checkout transaction
├── db/
│   ├── schema.ts                          # Orders + OrderItems Payload collections
│   ├── queries.ts                         # getOrderById, getOrderByNumber, getOrdersByPhone
│   └── mutations.ts                       # createOrder wrapper → OrderService
└── ui/
    ├── CheckoutForm.tsx                   # Main form — customer fields + order summary (Client)
    ├── OrderConfirmation.tsx              # Post-checkout success page (Server)
    └── _components/
        ├── CustomerFields.tsx             # Form inputs + honeypot (Client)
        ├── OrderSummary.tsx               # Line items with live prices (Presentational)
        ├── CodDisclaimer.tsx              # COD payment notice (Presentational)
        └── constants.ts                   # Client-safe CURRENCY_SYMBOL
```

## Transaction Flow (process-checkout.action.ts)

The server action executes 13 steps in sequence. Steps 8–11 run inside a Payload v3 transaction:

**Transaction Setup** (Payload v3 pattern):
```typescript
const transactionID = await payload.db.beginTransaction()
const req = { transactionID } as PayloadRequest  // Services expect req.transactionID
```

```
 1. verifySession()                    → UNAUTHORIZED if no session
 2. checkoutRateLimiter.check()        → RATE_LIMITED if exceeded
 3. checkoutSchema.parse(input)        → VALIDATION_ERROR if invalid
 4. Honeypot check                     → Fake success returned to bots
 5. getCartBySession()                 → VALIDATION_ERROR if no cart
 6. getCartItems()                     → VALIDATION_ERROR if empty
 7. Inactive items check               → VALIDATION_ERROR if unavailable items
 8. BEGIN TRANSACTION
 9.   stockService.decrementStock()    → Rollback if insufficient stock
10.   orderService.createOrder()       → Rollback on failure
11. COMMIT TRANSACTION
12. clearCart()                         → Best-effort (logged, not fatal)
13. revalidatePath('/')                → Cache invalidation
```
