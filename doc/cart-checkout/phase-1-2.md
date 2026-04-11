# Phase 1 & 2 — Cart & Checkout Documentation
> **Feature Spec:** `specs/002-cart-checkout`  
> **Completed:** 2026-02-20  
> **TypeScript:** `npx tsc --noEmit` → 0 errors ✅  
> **Constitution Version:** v1.4.0

---

## Overview

This document covers every file created in **Phase 1 (Setup)** and **Phase 2 (Foundation)** of the Cart & Checkout feature. The implementation follows the project's **FSD (Feature-Sliced Design)** architecture, **constitution.md v1.4.0**, and **Payload CMS v3** patterns.

```
Phase 1: T001–T011  →  Module scaffolding + Vercel cron config
Phase 2: T012–T028  →  Business logic, DB schemas, queries, mutations, registry
```

---

## Architecture Diagram

```
app/ (composition)
  └── calls features/cart, features/checkout, features/order-tracking
         └── all business logic delegated to →
                modules/orders
                  ├── constants.ts      ← ALL shared constants (FSD rule)
                  ├── types.ts          ← Shared interfaces
                  ├── validators/       ← Zod schemas
                  └── services/         ← OrderService, StockService (class-based)
```

**Dependency Flow (downward only):**
```
features/ → modules/ → core/ → shared/
             ↑
    (features import from modules, NEVER reverse)
```

---

## Phase 1: Setup (T001–T011)

### `vercel.json` (modified)

| Property | Value |
|----------|-------|
| **Path** | `/vercel.json` |
| **Change** | Added cron job configuration |

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-carts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Purpose:** Schedules cart cleanup every 6 hours to delete expired carts (24h from last activity). Required by spec FR-009.

---

## Phase 2: Orders Module (T012–T014)

### `src/modules/orders/constants.ts`

| Property | Value |
|----------|-------|
| **Layer** | `modules/` (shared business logic) |
| **Purpose** | Single source of truth for ALL shared constants — validation, rate limits, cart constraints, order config |

The **critical FSD rule**: all validation constants live HERE, not in `features/`. This allows validators inside `modules/orders/validators/` to import them without crossing layer boundaries.

**Exported Constants:**

| Group | Constant | Value | Description |
|-------|----------|-------|-------------|
| Order Status | `ORDER_STATUS` | `{ PENDING, PROCESSING, COMPLETED, CANCELLED }` | Const object (no enums per constitution) |
| Status Type | `OrderStatus` | `'pending' \| 'processing' \| 'completed' \| 'cancelled'` | Derived union type |
| Transitions | `ALLOWED_TRANSITIONS` | Record mapping status → allowed next statuses | Powers the state machine validator |
| Cancellation | `CANCELLED_BY` | `{ CUSTOMER, ADMIN }` | Who can cancel an order |
| Order Number | `ORDER_PREFIX` | `'VX'` | Format: `VX-XXXXXX` |
| Order Number | `ORDER_NUMBER_LENGTH` | `6` | 6 random characters |
| Order Number | `ORDER_CHARSET` | 30-char string | No ambiguous chars (0, O, 1, I, L excluded) |
| Order Number | `ORDER_MAX_RETRIES` | `3` | Collision retry attempts |
| Order Number | `ORDER_NUMBER_REGEX` | `/^VX-[charset]{6}$/` | Validation regex |
| Phone | `US_PHONE_REGEX` | `/^\+1\d{10}$/` | US +1 format only |
| Phone | `PHONE_FORMAT_MESSAGE` | Error string | Used in Zod schema |
| Name | `CUSTOMER_NAME_MIN` | `2` | Min length |
| Name | `CUSTOMER_NAME_MAX` | `255` | Max length |
| Address | `ADDRESS_MIN` | `10` | Min length |
| Address | `ADDRESS_MAX` | `500` | Max length |
| Notes | `NOTES_MAX` | `1000` | Max length |
| Bot Detection | `FAKE_ORDER_NUMBER` | `'VX-FAKE00'` | Returned to bots instead of real data |
| Bot Detection | `FAKE_ORDER_ID` | `'fake-id'` | Returned to bots |
| Currency | `CURRENCY` | `'USD'` | Currency code |
| Currency | `CURRENCY_SYMBOL` | `'$'` | Display symbol |
| Currency | `CURRENCY_DECIMALS` | `2` | Decimal places |
| Rate Limits | `CART_RATE_LIMIT` | `20` | Cart ops per minute/session |
| Rate Limits | `CHECKOUT_RATE_LIMIT` | `3` | Checkout attempts per minute/session |
| Rate Limits | `TRACKING_RATE_LIMIT` | `10` | Tracking lookups per minute/IP |
| Cart | `MAX_QUANTITY` | `10` | Max quantity per variant |
| Cart | `MAX_CART_ITEMS` | `50` | Max distinct items per cart |
| Cart | `CART_EXPIRY_HOURS` | `24` | Hours until cart expires |
| Cart | `CART_EXPIRY_MS` | `86_400_000` | Same in milliseconds |
| Cart | `MIN_QUANTITY` | `1` | Minimum item quantity |
| Cart | `CART_FULL_MESSAGE` | Error string | Shown when cart is full |

---

### `src/modules/orders/types.ts`

| Property | Value |
|----------|-------|
| **Layer** | `modules/` |
| **Purpose** | Shared TypeScript interfaces for order data structures |

**Exported Types:**

| Interface | Purpose |
|-----------|---------|
| `ActionResult<T>` | Standard server action return shape `{ success, data?, error?, code? }` |
| `OrderRecord` | Full order from database (id, orderNumber, status, customer info, totals) |
| `OrderItemRecord` | Immutable order item snapshot (productName, variantName, unitPrice, totalPrice) |
| `CreateOrderInput` | Input to `OrderService.createOrder()` — session + customer info + items array |
| `StockDecrementResult` | Result of a stock check: available, requested, sufficient |
| `CheckoutResult` | Returned after successful checkout: `{ orderId, orderNumber }` |
| `TrackOrderResult` | Order tracking response with status + items |
| `LookupOrdersResult` | List of orders found by phone number |

---

### `src/modules/orders/index.ts`

| Property | Value |
|----------|-------|
| **Layer** | `modules/` |
| **Purpose** | Public API barrel — the ONLY import point for this module |

Exports everything: constants, types, `OrderService` class, `StockService` class, all Zod schemas. Features import from `@/modules/orders` (not deep paths).

---

### `src/modules/orders/validators/validate-checkout.ts`

| Property | Value |
|----------|-------|
| **Layer** | `modules/` |
| **Purpose** | All Zod validation schemas for cart and checkout operations |
| **Imports** | Only from `../constants` (same module — no FSD violations) |

**Exported Schemas:**

| Schema | Used For | Key Rules |
|--------|----------|-----------|
| `checkoutSchema` | Process checkout form | name, phone (+1 US), address, notes, honeypot |
| `addToCartSchema` | Add item to cart | variantId (positive int), quantity (1–10) |
| `updateQuantitySchema` | Change item quantity | cartItemId, quantity (1–10) |
| `removeItemSchema` | Remove cart item | cartItemId (positive int) |
| `trackOrderSchema` | Track by order number | VX-XXXXXX regex validated |
| `lookupOrdersSchema` | Lookup by phone | +1 US format regex |

Each schema exports a corresponding `Input` type via `z.infer`.

**Honeypot Anti-Bot:** `checkoutSchema` includes `honeypotField: z.string().max(0)` — an invisible form field that must remain empty. Bots that auto-fill forms will fail this check.

---

### `src/modules/orders/services/stock.service.ts`

| Property | Value |
|----------|-------|
| **Layer** | `modules/` |
| **Pattern** | Class-based (`StockService`) per constitution |
| **Purpose** | Atomic stock decrement and best-effort stock return |

**Methods:**

#### `StockService.decrementStock(items, req)`

```typescript
async decrementStock(
  items: Array<{ variantId: number; quantity: number }>,
  req: PayloadRequest
): Promise<StockCheckResult[]>
```

- Accepts a Payload `req` object (with active transaction) — NOT a raw `transactionID`
- Fetches each variant's current `stock_quantity` WITHIN the transaction
- Throws `AppError(400, 'INSUFFICIENT_STOCK')` if any variant doesn't have enough stock
- Atomically decrements stock if all checks pass
- All Payload calls use `overrideAccess: true` (system-level operation)

**Race condition protection:** PostgreSQL serializable isolation (via Payload + Neon) prevents two simultaneous checkouts from both seeing sufficient stock and both decrementing past zero.

#### `StockService.returnStock(items)`

```typescript
async returnStock(
  items: Array<{ variantId: number; quantity: number }>
): Promise<void>
```

- Best-effort: logs errors but **does not throw** (order cancellation should not fail over stock return)
- Used when an order is cancelled
- Fetches current stock and adds back the cancelled quantity

---

### `src/modules/orders/services/order.service.ts`

| Property | Value |
|----------|-------|
| **Layer** | `modules/` |
| **Pattern** | Class-based (`OrderService`) per constitution |
| **Purpose** | Order creation, status management, order number generation |

**Methods:**

#### `OrderService.generateOrderNumber()`

```typescript
async generateOrderNumber(): Promise<string>
```

- Generates `VX-XXXXXX` where X is from a 30-character charset (excludes 0, O, 1, I, L for readability)
- Checks for collisions against the database
- Retries up to 3 times (`ORDER_MAX_RETRIES`)
- 30^6 ≈ 729M combinations → <0.007% collision probability at 10K orders

#### `OrderService.validateStatusTransition(from, to)`

```typescript
validateStatusTransition(from: OrderStatus, to: OrderStatus): boolean
```

- Validates against `ALLOWED_TRANSITIONS` state machine
- Throws `AppError(400, 'VALIDATION_ERROR')` if transition is forbidden
- Enforces: `pending → processing/cancelled`, `processing → completed/cancelled`, `completed/cancelled → ∅` (final states)

#### `OrderService.createOrder(input, req)`

```typescript
async createOrder(input: CreateOrderInput, req: PayloadRequest): Promise<{ orderId, orderNumber }>
```

- Creates the `orders` record + all `order_items` records within the caller's transaction
- `req` is passed to ALL Payload calls (maintains transaction atomicity per Payload Skill)
- Order items are **immutable snapshots** — product name, variant name, and unit price captured at checkout time
- Returns `{ orderId, orderNumber }` for redirect to confirmation page

#### `OrderService.updateOrderStatus(orderId, newStatus, cancelInfo?)`

- Validates transition first, then updates
- Adds `cancellation_reason`, `cancelled_by`, `cancelled_at` if cancelling

#### `OrderService.cancelOrder(orderId, reason, cancelledBy)`

- Calls `updateOrderStatus` → then `StockService.returnStock` for all order items
- Uses dynamic import of `StockService` to avoid circular dependency

---

## Phase 2: Cart Feature (T015–T019, T025)

### `src/features/cart/db/schema.ts`

| Property | Value |
|----------|-------|
| **Layer** | `features/cart/` |
| **Purpose** | Payload CMS collection definitions for `carts` and `cart_items` |

#### `Carts` Collection

| Slug | `carts` |
|------|---------|
| Admin Group | Commerce |

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| `session_id` | `text` | ✅ | ✅ (unique) | Links to gate session UUID |
| `expires_at` | `date` | ✅ | ✅ | 24h from last activity |
| `createdAt` | auto | — | — | Payload timestamp |
| `updatedAt` | auto | — | — | Payload timestamp |

Access control: Read = admin users only. Create/Update = server actions (open). Delete = super-admin only.

#### `CartItems` Collection

| Slug | `cart_items` |
|------|------------|
| Admin Group | Commerce |

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| `cart` | `relationship → carts` | ✅ | ✅ | Parent cart |
| `variant` | `relationship → product_variants` | ✅ | ✅ | Product variant |
| `quantity` | `number` (min:1, max:10) | ✅ | — | Quantity in cart |
| `price_at_add` | `number` (min:0) | ✅ | — | Snapshot price for price-change detection |
| `createdAt` | auto | — | — | When item was added |

**UNIQUE constraint** on `(cart_id, variant_id)` is enforced via upsert logic in mutations (not DB-level via Payload, but in application code).

---

### `src/features/cart/db/queries.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Server-side read operations for cart data |
| **Access** | `overrideAccess: false` (enforces Payload access control) |

**Functions:**

| Function | Purpose |
|----------|---------|
| `getCartBySession(sessionId)` | Finds non-expired cart by session ID. Filters `expires_at > now` |
| `getCartItems(cartId)` | Returns all items with `depth: 2` (populates variant → product) |
| `getCartItemCount(cartId)` | Returns count of distinct items in cart |
| `detectPriceChanges(items)` | Pure function — compares `priceAtAdd` vs `currentPrice` from variant |

`getCartItems()` maps raw Payload documents to `CartItemData[]` with: `productName`, `variantName`, `imageUrl`, `quantity`, `priceAtAdd`, `currentPrice`, `isActive`, `stockQuantity`.

---

### `src/features/cart/db/mutations.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Server-side write operations for cart data |
| **Access** | `overrideAccess: false` (enforces Payload access control) |
| **Imports** | Constants from `@/modules/orders` (not local — FSD rule) |

**Functions:**

| Function | Purpose |
|----------|---------|
| `getOrCreateCart(sessionId)` | Find existing non-expired cart or create new one with 24h expiry |
| `addItemToCart(cartId, variantId, qty, price)` | Upsert: merge qty if variant exists, create new if not. Checks `MAX_CART_ITEMS` limit |
| `updateCartItem(cartItemId, quantity)` | Clamps quantity to 1–10 |
| `removeCartItem(cartItemId)` | Deletes the item from `cart_items` |
| `clearCart(cartId)` | Deletes all items for a cart, returns count |
| `extendExpiration(cartId)` | Resets `expires_at` to 24h from now |
| `deleteCart(cartId)` | Clears items first, then deletes cart |

---

### `src/features/cart/logic/cart.store.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Zustand store for UI-only cart state |
| **Pattern** | `'use client'` directive — client component only |

```typescript
interface CartUIState {
  isDrawerOpen: boolean   // Is the cart drawer/sheet visible?
  isLoading: boolean      // Is a cart operation in progress?
  openDrawer: () => void
  closeDrawer: () => void
  setLoading: (loading: boolean) => void
}
```

**Critical rule (constitution):** Cart items, totals, and counts are **NEVER** stored here. The server is the single source of truth. These values are passed as props from Server Components or fetched via server action.

---

### `src/features/cart/constants.ts`

Re-exports cart-related constants from `@/modules/orders`. Features CAN import from modules (downward FSD dependency). No new values defined here.

---

### `src/features/cart/types.ts`

| Exported Type | Purpose |
|--------------|---------|
| `CartItemData` | Cart item for UI: id, variantId, names, imageUrl, qty, priceAtAdd, currentPrice, isActive, stockQty |
| `PriceChange` | Price change notification: variantId, variantName, oldPrice, newPrice |
| `CartUIState` | Zustand store shape (matches store exactly) |
| `AddToCartResult` | cartItemCount + itemName |
| `UpdateQuantityResult` | cartItemCount + itemTotal |
| `RemoveItemResult` | cartItemCount |
| `ClearCartResult` | clearedCount |
| `CartSummaryData` | Full cart summary for display: count, subtotal, flags, price changes |

---

### `src/features/cart/feature.config.ts`

```typescript
export const cartConfig: FeatureConfig = {
  id: 'cart',
  name: 'Shopping Cart',
  version: '1.0.0',
  dependencies: ['gate'],
  enabled: true,
}
```

---

### `src/features/cart/index.ts`

Public API barrel. Exports: `useCart`, all query/mutation functions, types, and Payload collection schemas (`Carts`, `CartItems`).

---

### `src/features/cart/README.md`

Feature documentation: purpose, dependencies, public API summary, architecture notes.

---

## Phase 2: Checkout Feature (T020–T024)

### `src/features/checkout/db/schema.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Payload CMS collection definitions for `orders` and `order_items` |

#### `Orders` Collection

| Slug | `orders` |
|------|---------|
| Admin Group | Commerce |

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `order_number` | `text` | ✅ | Unique, indexed. VX-XXXXXX format |
| `session_id` | `text` | ✅ | Indexed. Links to gate session |
| `customer_name` | `text` | ✅ | Customer display name |
| `customer_phone` | `text` | ✅ | +1 US format |
| `delivery_address` | `textarea` | ✅ | Full delivery address |
| `notes` | `textarea` | ❌ | Optional customer notes |
| `status` | `select` | ✅ | Default: `pending`. Options: pending/processing/completed/cancelled |
| `total_amount` | `number` | ✅ | Total in USD |
| `cancellation_reason` | `textarea` | ❌ | Shown when cancelled |
| `cancelled_by` | `select` | ❌ | `customer` or `admin` |
| `cancelled_at` | `date` | ❌ | Cancellation timestamp |

Access control: Read = admin users only. Create = server actions (open). Update/Delete = admin only.

#### `OrderItems` Collection

| Slug | `order_items` |
|------|-------------|

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `order` | `relationship → orders` | ✅ | Indexed |
| `variant` | `relationship → product_variants` | ❌ | Indexed. Nullable (variant may be deleted) |
| `product_name` | `text` | ✅ | **Snapshot** at time of purchase |
| `variant_name` | `text` | ✅ | **Snapshot** at time of purchase |
| `quantity` | `number` | ✅ | Quantity ordered |
| `unit_price` | `number` | ✅ | **Snapshot** price per item |
| `total_price` | `number` | ✅ | Computed: unit_price × quantity |

**Immutability:** Order items capture a snapshot of the product state at purchase time. Even if the product is later modified or deleted, the order history remains accurate.

---

### `src/features/checkout/db/queries.ts`

| Function | Purpose |
|----------|---------|
| `getOrderById(orderId)` | Returns full order with items or null |
| `getOrderByNumber(orderNumber)` | Finds by VX-XXXXXX, delegates to `getOrderById` |
| `getOrdersByPhone(phone)` | Returns array of order summaries sorted newest-first |

All queries use `overrideAccess: false`.

---

### `src/features/checkout/db/mutations.ts`

Thin wrapper that instantiates `OrderService` and delegates to `orderService.createOrder(input, req)`. Accepts `req: PayloadRequest` for transaction threading.

---

### `src/features/checkout/constants.ts`

Re-exports checkout validation constants from `@/modules/orders`.

---

### `src/features/checkout/types.ts`

| Exported Type | Purpose |
|--------------|---------|
| `CheckoutFormInput` | Raw form values from checkout form |
| `CheckoutResult` | `{ orderId, orderNumber }` |
| `CheckoutCartItem` | Cart item prepared for checkout summary |
| `OrderConfirmationData` | Data for the confirmation page |

---

### `src/features/checkout/feature.config.ts`

```typescript
export const checkoutConfig: FeatureConfig = {
  id: 'checkout',
  dependencies: ['gate', 'cart'],
  enabled: true,
}
```

---

### `src/features/checkout/index.ts` + `README.md`

Public API barrel and feature documentation.

---

## Phase 2: Order Tracking Feature (T009, T010, T028)

### `src/features/order-tracking/constants.ts`

Re-exports `TRACKING_RATE_LIMIT`, `TRACKING_RATE_INTERVAL`, `ORDER_NUMBER_REGEX` from module. Additionally defines UI-specific constants:

| Constant | Purpose |
|----------|---------|
| `STATUS_LABELS` | Human-readable status labels (e.g. `pending → 'Pending'`) |
| `STATUS_DESCRIPTIONS` | Customer-facing status descriptions |

These UI labels live in the feature (not the module) because they are presentation-layer concerns, not business logic.

---

### `src/features/order-tracking/types.ts`

| Exported Type | Purpose |
|--------------|---------|
| `TrackedOrder` | Full order for tracking display |
| `OrderListItem` | Summary for phone-lookup list |
| `TrackOrderInput` | `{ orderNumber: string }` |
| `LookupOrdersInput` | `{ phone: string }` |
| `TimelineStep` | Status timeline step: status, label, isActive, isCompleted, timestamp? |

---

### `src/features/order-tracking/feature.config.ts`

```typescript
export const orderTrackingConfig: FeatureConfig = {
  id: 'order-tracking',
  dependencies: ['checkout'],
  enabled: true,
}
```

---

### `src/features/order-tracking/index.ts` + `README.md`

Public API barrel and feature documentation.

---

## Feature Registry Update (T026–T028)

### `src/features/_registry/index.ts` (modified)

Added three new feature registrations:

```typescript
import { cartConfig } from '../cart/feature.config'
import { checkoutConfig } from '../checkout/feature.config'
import { orderTrackingConfig } from '../order-tracking/feature.config'

export const FEATURES: FeatureRegistry = {
  gate: gateConfig,
  products: productsConfig,
  cart: cartConfig,
  checkout: checkoutConfig,
  'order-tracking': orderTrackingConfig,
} as const
```

---

## Payload Config Update (T017, T022)

### `src/payload/payload.config.ts` (modified)

Added 4 new collections:

```typescript
import { Carts, CartItems } from '@/features/cart/db/schema'
import { Orders, OrderItems } from '@/features/checkout/db/schema'

buildConfig({
  collections: [
    // ... existing
    Carts,
    CartItems,
    Orders,
    OrderItems,
  ],
})
```

---

## Constitution Fixes Applied

After initial creation, an audit against `constitution.md v1.4.0` found **9 violations** — all were fixed:

| # | Fix | Files Changed |
|---|-----|--------------|
| 1 | Moved validation constants to `modules/orders/constants.ts` (FSD) | constants.ts, validate-checkout.ts |
| 2 | Refactored services to class-based pattern | stock.service.ts, order.service.ts |
| 3 | Fixed transaction: `req: PayloadRequest` (not `transactionID` hack) | both services, checkout mutations |
| 4 | `overrideAccess: false` for all user-facing operations | cart queries/mutations, checkout queries |
| 5 | Added `expires_at > now` filter to cart queries | cart/db/queries.ts |
| 6 | Renamed `use-cart.ts` → `cart.store.ts` | cart/logic/ |
| 7 | Removed extra Zustand state (`loadingItemId`) | cart/logic/cart.store.ts, cart/types.ts |
| 8 | Created `README.md` for cart, checkout, order-tracking | 3 new files |
| 9 | Created `index.ts` public API barrel for all 3 features | 3 new files |

---

## Complete File List

### New Files Created — Phase 1

| File | Type |
|------|------|
| `vercel.json` | Modified — added cron config |
| `src/modules/orders/constants.ts` | New — all shared constants |
| `src/modules/orders/types.ts` | New — shared interfaces |
| `src/modules/orders/index.ts` | New — module barrel |
| `src/modules/orders/README.md` | New — module docs |
| `src/features/cart/constants.ts` | New — re-exports from module |
| `src/features/cart/types.ts` | New — feature types |
| `src/features/checkout/constants.ts` | New — re-exports from module |
| `src/features/checkout/types.ts` | New — feature types |
| `src/features/order-tracking/constants.ts` | New — re-exports + UI labels |
| `src/features/order-tracking/types.ts` | New — feature types |

### New Files Created — Phase 2

| File | Type |
|------|------|
| `src/modules/orders/validators/validate-checkout.ts` | New — all Zod schemas |
| `src/modules/orders/services/stock.service.ts` | New — StockService class |
| `src/modules/orders/services/order.service.ts` | New — OrderService class |
| `src/features/cart/db/schema.ts` | New — Carts + CartItems collections |
| `src/features/cart/db/queries.ts` | New — cart read operations |
| `src/features/cart/db/mutations.ts` | New — cart write operations |
| `src/features/cart/logic/cart.store.ts` | New — Zustand UI store |
| `src/features/cart/feature.config.ts` | New — feature registry config |
| `src/features/cart/index.ts` | New — public API barrel |
| `src/features/cart/README.md` | New — feature docs |
| `src/features/checkout/db/schema.ts` | New — Orders + OrderItems collections |
| `src/features/checkout/db/queries.ts` | New — order read operations |
| `src/features/checkout/db/mutations.ts` | New — delegates to OrderService |
| `src/features/checkout/feature.config.ts` | New — feature registry config |
| `src/features/checkout/index.ts` | New — public API barrel |
| `src/features/checkout/README.md` | New — feature docs |
| `src/features/order-tracking/feature.config.ts` | New — feature registry config |
| `src/features/order-tracking/index.ts` | New — public API barrel |
| `src/features/order-tracking/README.md` | New — feature docs |
| `src/features/_registry/index.ts` | Modified — cart + checkout + order-tracking added |
| `src/payload/payload.config.ts` | Modified — 4 new collections registered |
| `src/core/errors/index.ts` | New — barrel for AppError |

### Deleted

| File | Reason |
|------|--------|
| `src/features/cart/logic/use-cart.ts` | Renamed to `cart.store.ts` per convention |

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Cart storage | Server-side DB (Payload `carts` + `cart_items`) | Constitution: "NEVER use localStorage for cart data" |
| Zustand scope | UI-only (drawer, loading) | Constitution lines 1163-1187 |
| Stock model | Direct Decrement (no reserved_quantity) | Research decision #5 — simpler, no cleanup jobs |
| Transaction API | Payload v3 `req` threading | Payload Skill: pass `req` for atomicity |
| Order number | VX-XXXXXX, 30-char charset | 729M combinations, ambiguous chars excluded |
| Services pattern | Class-based (`OrderService`, `StockService`) | Constitution lines 708, 1537, 1731 |
| Constants location | All in `modules/orders/constants.ts` | FSD rule: modules cannot import from features |
| Payment | None — COD only | Constitution: "NO payment integrations" |
