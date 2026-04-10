# Orders Module

## Purpose

Business logic for order management, stock operations, order queries, and checkout validation. Used by `checkout`, `order-tracking`, and `order-confirmation` features. Contains no UI — pure TypeScript/Node.js logic only.

## Dependencies

- `@/core/errors` — `AppError` class for structured error handling
- `@/core/logger` — `Logger` for structured logging with Sentry integration
- `@/lib/payload` — `getPayloadClient()` for Payload Local API access

## Public API

### Services

| Export | Description |
|--------|-------------|
| `OrderService` | Order creation (with atomic stock decrement), status transitions, cancellation, order number generation |
| `StockService` | Atomic stock decrement and return operations within Payload v3 transactions |
| `OrderQueryService` | Read-only order queries: by ID, order number, or phone number |

### Types

| Export | Description |
|--------|-------------|
| `ActionResult<T>` | Standard server action response: `{ success, data?, error?, code? }` |
| `OrderRecord` | Full order database record |
| `OrderItemRecord` | Order item snapshot (immutable after creation) |
| `CreateOrderInput` | Validated input for order creation |
| `StockDecrementResult` | Result from stock decrement operation |
| `CheckoutResult` | Checkout response: `{ orderId, orderNumber }` |
| `TrackOrderResult` | Tracking response: `{ order: { orderNumber, status, totalAmount, items } }` |
| `LookupOrdersResult` | Phone lookup response: `{ orders: OrderListItem[] }` |
| `OrderWithItems` | Order with items for display (from `OrderQueryService`) |
| `OrderSummary` | Lightweight order for list display |
| `OrderStatus` | Literal union: `'pending' \| 'processing' \| 'completed' \| 'cancelled'` |
| `CancelledBy` | Literal union: `'customer' \| 'admin'` |

### Constants

| Export | Description |
|--------|-------------|
| `ORDER_STATUS` | Const object with status values |
| `ALLOWED_TRANSITIONS` | State machine transition map |
| `ORDER_PREFIX` / `ORDER_CHARSET` | Order number generation config |
| `CURRENCY_SYMBOL` | Display symbol (`$`) |
| `TRACKING_RATE_LIMIT` | Rate limit for tracking lookups (10/min/IP) |
| `CART_RATE_LIMIT` / `CHECKOUT_RATE_LIMIT` | Rate limits for cart/checkout operations |
| `MAX_QUANTITY` / `MAX_CART_ITEMS` | Cart constraints |

### Validators (Zod Schemas)

| Export | Description |
|--------|-------------|
| `checkoutSchema` | Checkout form validation |
| `addToCartSchema` / `updateQuantitySchema` / `removeItemSchema` | Cart operation schemas |
| `trackOrderSchema` | Order number lookup validation (VX-XXXXXX regex) |
| `lookupOrdersSchema` | Phone lookup validation (+1 US format) |

## Rules

- **No UI**: Module contains business logic only — no React components, hooks, or JSX
- **Layer**: Can import from `core/`, `shared/types`, `shared/config`
- **Transactions**: All stock operations use Payload v3 transaction API (`beginTransaction` / `commitTransaction` / `rollbackTransaction`)
- **Race conditions**: PostgreSQL serializable isolation prevents overselling
- **Class-based**: Services use class pattern per constitution

## Files

```
src/modules/orders/
├── README.md                         # This file
├── constants.ts                      # ORDER_STATUS, ALLOWED_TRANSITIONS, rate limits, currency
├── types.ts                          # ActionResult, OrderRecord, CheckoutResult, TrackOrderResult
├── index.ts                          # Barrel exports (all public API)
├── services/
│   ├── order.service.ts              # createOrder, cancelOrder, validateStatusTransition
│   ├── stock.service.ts              # decrementStock (atomic), returnStock
│   └── order-query.service.ts        # getOrderById, getOrderByNumber, getOrdersByPhone
└── validators/
    └── validate-checkout.ts          # Zod schemas for all input validation
```
