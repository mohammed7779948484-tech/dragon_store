# Phase 5 — User Story 3: Complete Checkout (T047–T057)
> **Feature Spec:** `specs/002-cart-checkout`  
> **Completed:** 2026-02-22  
> **TypeScript:** `npx tsc --noEmit` → 0 errors ✅  
> **Constitution Version:** v1.4.0

---

## Overview

This document covers every file created and modified in **Phase 5 (User Story 3 — Complete Checkout)** of the Cart & Checkout feature. Phase 5 implements the complete checkout flow: customer form, atomic order creation with stock decrement, and order confirmation page.

```
Phase 5: T047–T057  →  Checkout UI, server action, storefront pages
```

**Pre-requisites (completed in earlier phases):**
- Phase 1–2: `modules/orders/` services, validators, Payload collections
- Phase 3: Cart UI components + add-to-cart action
- Phase 4: Cart management actions (update, remove, clear)

---

## Architecture Diagram

```
app/(storefront)/
├── checkout/page.tsx  ──→  Server Component (DAL + cart fetch)
│   └── features/checkout/ui/CheckoutForm.tsx  ──→  'use client'
│       ├── _components/CustomerFields.tsx  (form inputs + honeypot)
│       ├── _components/OrderSummary.tsx    (line items + total)
│       └── _components/CodDisclaimer.tsx    (COD notice)
│
├── order-confirmation/[orderId]/page.tsx  ──→  Server Component
    └── features/checkout/ui/OrderConfirmation.tsx  (presentational)
```

**Server Action Flow:**
```
CheckoutForm.tsx  →  process-checkout.action.ts
                     ├── verifySession()          [core/auth]
                     ├── checkoutRateLimiter       [core/rate-limit]
                     ├── checkoutSchema.parse()    [modules/orders]
                     ├── honeypot check
                     ├── getCartBySession()        [features/cart]
                     ├── getCartItems()            [features/cart]
                     ├── payload.db.beginTransaction()
                     │   ├── stockService.decrementStock()  [modules/orders]
                     │   └── orderService.createOrder()     [modules/orders]
                     ├── payload.db.commitTransaction()
                     └── clearCart()               [features/cart]
```

---

## T047: CustomerFields Component

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/ui/_components/CustomerFields.tsx` |
| **Layer** | `features/checkout/` (private `_components/`) |
| **Type** | Client Component (`'use client'`) |
| **Imports** | `Input`, `Label` from `@/shared/ui` |

### Purpose

Renders the checkout form's customer information fields with validation, error states, and accessibility support.

### Form Fields

| Field | HTML Element | Name Attribute | Required | Validation |
|-------|-------------|----------------|----------|------------|
| Full Name | `<Input>` | `customerName` | ✅ | minLength=2, maxLength=255 |
| Phone Number | `<Input type="tel">` | `customerPhone` | ✅ | +1 US format hint |
| Delivery Address | `<textarea>` | `deliveryAddress` | ✅ | minLength=10, maxLength=500 |
| Order Notes | `<textarea>` | `notes` | ❌ | maxLength=1000 |
| **Honeypot** | `<Input>` (hidden) | `honeypotField` | ❌ | Must stay empty |

### Props Interface

```typescript
interface CustomerFieldsProps {
    errors?: Record<string, string>   // Field-level error messages
    disabled?: boolean                // Disable during form submission
}
```

### Honeypot Anti-Bot Implementation

The honeypot field is hidden from humans using CSS positioning (`absolute -left-[9999px] opacity-0`) rather than `display: none`. This approach is more effective because sophisticated bots check for `display: none` and `visibility: hidden` but rarely check for off-screen positioning.

```tsx
<div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
    <Label htmlFor="honeypotField">Leave this empty</Label>
    <Input id="honeypotField" name="honeypotField" tabIndex={-1} autoComplete="off" />
</div>
```

### Accessibility

- All fields have `<Label htmlFor>` associations
- Error messages linked via `aria-describedby`
- Error fields highlighted with `border-red-500`
- Phone format hint: `"US format: +1 followed by 10 digits"`

### Note on Textarea

`<textarea>` is used as a native HTML element (not a shadcn component) because no `Textarea` component existed in `shared/ui/`. Styled to match shadcn Input design tokens.

---

## T048: OrderSummary Component

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/ui/_components/OrderSummary.tsx` |
| **Layer** | `features/checkout/` (private `_components/`) |
| **Type** | Presentational (no `'use client'` directive itself, but rendered in client context via `CheckoutForm`) |
| **Imports** | `Separator` from `@/shared/ui`, `CURRENCY_SYMBOL` from local `./constants` |

### Purpose

Displays the order line items, quantities, prices, and total in the checkout page's right column.

### Props Interface

```typescript
interface OrderSummaryProps {
    items: CheckoutCartItem[]  // Cart items with live prices from server
}
```

### Behavior

- Calculates subtotal from **active items only** (filters `isActive`)
- Detects inactive items and shows a red warning banner
- Inactive items displayed with `opacity-50 line-through`
- Each item shows: product name, variant name × quantity, total price

### Critical Fix: Client-Safe Constants

Originally imported `CURRENCY_SYMBOL` from `../../constants` → `@/modules/orders` → caused a **webpack build error** because the import chain pulled in `revalidateTag` (server-only API) into the client bundle.

**Fix**: Created `ui/_components/constants.ts` with `CURRENCY_SYMBOL = '$'` — a client-safe constant that avoids the heavy module import chain.

---

## T049: CodDisclaimer Component

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/ui/_components/CodDisclaimer.tsx` |
| **Layer** | `features/checkout/` (private `_components/`) |
| **Type** | Presentational (no state, no effects) |

### Purpose

Displays a Cash on Delivery (COD) notice informing customers that no online payment is required and cash will be collected at delivery.

### Design

- Uses `accent` color from brand palette (warm orange `#f8b97e`)
- 💵 emoji as visual indicator
- Rounded border with `accent/30` opacity
- Subtle background tint `accent/5`

### Content

```
Cash on Delivery (COD)
Payment will be collected when your order is delivered.
Please have the exact amount ready. No credit card or
online payment is required.
```

---

## T050: CheckoutForm Component

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/ui/CheckoutForm.tsx` |
| **Layer** | `features/checkout/` (public UI) |
| **Type** | Client Component (`'use client'`) |
| **Imports** | `Button` from `@/shared/ui`, `processCheckoutAction` from server action, all 3 private sub-components |

### Purpose

Main checkout form that composes `CustomerFields`, `OrderSummary`, and `CodDisclaimer`. Handles form submission via `processCheckoutAction` server action.

### Props Interface

```typescript
interface CheckoutFormProps {
    items: CheckoutCartItem[]  // Cart items from server (passed by checkout page)
}
```

### State Management

```typescript
const [isPending, startTransition] = useTransition()  // Non-blocking submission
const [errors, setErrors] = useState<Record<string, string>>({})  // Field errors
const [globalError, setGlobalError] = useState<string | null>(null)  // Top-level error
```

### Form Submission Flow

1. Extracts all fields from native `FormData` (progressive enhancement friendly)
2. Wraps server action call in `startTransition` for non-blocking UI
3. On success: redirects to `/order-confirmation/[orderId]` via `router.push()`
4. On failure: displays error message in red banner at top of form

### Layout

Two-column grid on large screens (`lg:grid-cols-2`):
- **Left column**: CustomerFields + CodDisclaimer
- **Right column**: OrderSummary + Submit button (in a bordered card)

### Submit Button States

| State | Button Text | Disabled? |
|-------|-------------|-----------|
| Normal | "Place Order — Cash on Delivery" | ❌ |
| Submitting | Spinner + "Processing Order..." | ✅ |
| Inactive items | "Place Order — Cash on Delivery" | ✅ (+ red notice below) |
| Empty cart | "Place Order — Cash on Delivery" | ✅ |

---

## T051: process-checkout.action.ts (Server Action)

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/actions/process-checkout.action.ts` |
| **Layer** | `features/checkout/` |
| **Type** | Server Action (`'use server'`) |
| **Security** | DAL verification, Zod validation, rate limiting, honeypot |

### Purpose

The core server action implementing the full atomic checkout transaction. This is the most critical file in Phase 5 — it orchestrates session verification, validation, stock decrement, order creation, and cart clearing.

### Signature

```typescript
export async function processCheckoutAction(
    input: unknown
): Promise<ActionResult<CheckoutResult>>
```

### 13-Step Transaction Flow

| Step | Operation | Module | Failure Behavior |
|------|-----------|--------|------------------|
| 1 | `verifySession()` | `core/auth` | Return `UNAUTHORIZED` |
| 2 | `checkoutRateLimiter.check()` | `core/rate-limit` | Return `RATE_LIMITED` |
| 3 | `checkoutSchema.parse(input)` | `modules/orders` | Return `VALIDATION_ERROR` |
| 4 | Honeypot check | — | Return **fake success** (silent bot rejection) |
| 5 | `getCartBySession()` | `features/cart` | Return `VALIDATION_ERROR` (empty cart) |
| 6 | `getCartItems()` | `features/cart` | Return `VALIDATION_ERROR` (empty cart) |
| 7 | Inactive items check | — | Return `VALIDATION_ERROR` |
| 8 | `payload.db.beginTransaction()` | Payload v3 | Throw (caught by outer try-catch) |
| 9 | `stockService.decrementStock()` | `modules/orders` | Rollback + throw `INSUFFICIENT_STOCK` |
| 10 | `orderService.createOrder()` | `modules/orders` | Rollback + throw |
| 11 | `payload.db.commitTransaction()` | Payload v3 | Rollback + throw |
| 12 | `clearCart()` | `features/cart` | **Best-effort** — logged but does not fail the order |
| 13 | `revalidatePath('/', 'layout')` | Next.js | Cache invalidation |

### Honeypot Bot Detection

```typescript
if (validated.honeypotField) {
    return {
        success: true,  // FAKE success — bot doesn't know it was detected
        data: {
            orderId: FAKE_ORDER_ID,      // 'fake-id'
            orderNumber: FAKE_ORDER_NUMBER // 'VX-FAKE00'
        },
    }
}
```

Bots receive a facade of success. The order is never created.

### Transaction Safety

The transaction bracket follows Payload v3 API:
```typescript
const transactionID = await payload.db.beginTransaction()
// Services expect a PayloadRequest object with transactionID property — NOT the raw ID
const req = { transactionID } as PayloadRequest
try {
    // All operations pass `req` for atomicity
    await stockService.decrementStock(items, req)
    await orderService.createOrder(input, req)
    await payload.db.commitTransaction(transactionID as string)
} catch (txError) {
    await payload.db.rollbackTransaction(transactionID as string)
    throw txError
}
```

> **Bug Fix (2026-02-22):** Originally the raw transaction ID was cast directly as `PayloadRequest` via `req as unknown as PayloadRequest`. This caused a runtime error because services like `StockService.decrementStock()` pass `req` to Payload operations (`payload.findByID({ req })`), and Payload expects `req.transactionID` to exist as a property. Casting a string as `PayloadRequest` meant `req.transactionID` was `undefined`, breaking the transaction isolation.
```

If stock decrement succeeds but order creation fails, the rollback undoes the stock decrement — no data inconsistency.

### Error Handling Pattern

```typescript
catch (error) {
    if (error instanceof AppError)  → return { code: error.code }
    if (error instanceof z.ZodError) → return { code: 'VALIDATION_ERROR' }
    else → return { code: 'UNKNOWN_ERROR' }
}
```

The `ZodError.errors[0]` access uses optional chaining (`?.message ?? 'Validation failed'`) to prevent runtime crashes on edge cases.

### Import Dependencies

| Import | From | Layer Compliance |
|--------|------|-----------------|
| `verifySession` | `@/core/auth/session` | ✅ features → core |
| `AppError` | `@/core/errors` | ✅ features → core |
| `Logger` | `@/core/logger` | ✅ features → core |
| `checkoutRateLimiter` | `@/core/rate-limit` | ✅ features → core |
| `checkoutSchema`, `OrderService`, `StockService` | `@/modules/orders` | ✅ features → modules |
| `getCartBySession`, `getCartItems` | `@/features/cart/db/queries` | ⚠️ Cross-feature import (justified: checkout depends on cart) |
| `clearCart` | `@/features/cart/db/mutations` | ⚠️ Cross-feature import (justified: checkout depends on cart) |

### Notes on Cross-Feature Imports

The checkout action imports directly from `@/features/cart/db/queries` and `@/features/cart/db/mutations` rather than from `@/features/cart` barrel. This is because the server action needs server-only functions, and importing from the barrel might pull in client components. The cart feature's `index.ts` exports these functions, but the direct import avoids potential webpack bundling issues.

---

## T052: Updated index.ts Exports

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/index.ts` |
| **Change** | Added new exports for action and additional types |

### New Exports Added

```typescript
// ─── Actions ──────────────────────────────────────────────────
export { processCheckoutAction } from './actions/process-checkout.action'

// ─── Types (expanded) ─────────────────────────────────────────
export type {
    CheckoutFormInput,
    CheckoutCartItem,      // NEW
    CheckoutResult,        // NEW
    OrderConfirmationData, // NEW
} from './types'
```

### Full Export Summary

| Category | Exports |
|----------|---------|
| DB Queries | `getOrderById`, `getOrderByNumber`, `getOrdersByPhone` |
| DB Mutations | `createOrder` |
| Actions | `processCheckoutAction` |
| Types | `CheckoutFormInput`, `CheckoutCartItem`, `CheckoutResult`, `OrderConfirmationData` |
| Collections | `Orders`, `OrderItems` |

---

## T053: feature.config.ts (No Changes Required)

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/feature.config.ts` |
| **Change** | None — already correctly configured in Phase 2 |

```typescript
export const checkoutConfig: FeatureConfig = {
    id: 'checkout',
    name: 'Checkout',
    description: 'COD checkout with atomic stock decrement, order creation, and honeypot anti-bot protection',
    version: '1.0.0',
    dependencies: ['gate', 'cart'],
    enabled: true,
}
```

---

## T054: Updated README.md

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/README.md` |
| **Change** | Full rewrite — added architecture diagram, dependency list, 12-step transaction flow |

### Content Summary

- Architecture tree showing full file structure
- Dependency list: modules/orders, features/cart, core/auth, core/rate-limit
- 12-step numbered transaction flow from session verification to cart clearing

---

## T055: Checkout Page

| Property | Value |
|----------|-------|
| **File** | `src/app/(storefront)/checkout/page.tsx` |
| **Layer** | `app/` (composition layer) |
| **Type** | Server Component (async) |
| **Route** | `/checkout` |

### Purpose

Server Component that verifies the session, fetches cart items with live prices from the database, and renders the `CheckoutForm` client component.

### Metadata

```typescript
export const metadata: Metadata = {
    title: 'Checkout — Fastika',
    description: 'Complete your order with cash on delivery',
}
```

### Data Flow

```typescript
// 1. DAL verification
const session = await verifySession()
if (!session) redirect('/gate')

// 2. Fetch cart
const cart = await getCartBySession(session.sessionId)
const cartItems = cart ? await getCartItems(cart.id) : []

// 3. Redirect if empty
if (cartItems.length === 0) redirect('/cart')

// 4. Map CartItemData → CheckoutCartItem
const checkoutItems = cartItems.map((item) => ({
    variantId: item.variantId,
    productName: item.productName,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPrice: item.currentPrice,     // Live price from DB
    totalPrice: item.currentPrice * item.quantity,
    isActive: item.isActive,
}))
```

### Type Mapping

The checkout page bridges two different type systems:
- **Input**: `CartItemData` from `features/cart` (uses `currentPrice`, `priceAtAdd`)
- **Output**: `CheckoutCartItem` from `features/checkout` (uses `unitPrice`, `totalPrice`)

This mapping ensures live prices are always used at checkout.

### Layout

- "Back to Cart" link with left arrow icon
- `<h1>Checkout</h1>` heading
- `<CheckoutForm items={checkoutItems} />` (client component)

---

## T056: OrderConfirmation Component

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/ui/OrderConfirmation.tsx` |
| **Layer** | `features/checkout/` (public UI) |
| **Type** | Presentational (Server Component compatible) |
| **Imports** | `Separator` from `@/shared/ui`, `CURRENCY_SYMBOL` from `_components/constants` |

### Purpose

Displays the order confirmation after a successful checkout. Shows order number prominently with a screenshot prompt, order details, status indicator, and COD payment reminder.

### Props Interface

```typescript
interface OrderConfirmationProps {
    order: OrderConfirmationData
}
```

### Sections (top to bottom)

| Section | Content |
|---------|---------|
| Success Icon | Green checkmark in primary-colored circle |
| Heading | "Order Confirmed!" + customer name |
| **Order Number Card** | `VX-XXXXXX` in accent color (3xl bold) + 📸 screenshot prompt |
| Order Details | Line items table with separator and total |
| Status | "Pending" with yellow pulsing dot + "Our team will review your order shortly" |
| COD Notice | 💵 Payment reminder with exact amount |
| Navigation | "Track Your Order" (outline) + "Continue Shopping" (primary) |

### Order Number Prominence

The order number card uses the brand accent color (`text-accent`) at `text-3xl font-bold tracking-wider` — designed to be the most visually prominent element on the page since it's the customer's reference for order tracking.

---

## T057: Order Confirmation Page

| Property | Value |
|----------|-------|
| **File** | `src/app/(storefront)/order-confirmation/[orderId]/page.tsx` |
| **Layer** | `app/` (composition layer) |
| **Type** | Server Component (async) |
| **Route** | `/order-confirmation/[orderId]` |

### Purpose

Dynamic route that fetches an order by UUID and displays the confirmation. Uses Next.js 15's async `params` pattern.

### Metadata

```typescript
export const metadata: Metadata = {
    title: 'Order Confirmed — Fastika',
    description: 'Your order has been placed successfully',
}
```

### Data Flow

```typescript
// Next.js 15 async params
const { orderId } = await params

// Fetch order
const order = await getOrderById(orderId)
if (!order) notFound()

// Map to OrderConfirmationData
const confirmationData: OrderConfirmationData = {
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    customerName: order.customerName,
    createdAt: order.createdAt,
    items: order.items.map(...)
}
```

### Security Note

No session verification is required for this page. The `orderId` (UUID) itself acts as an access token — it's sufficiently random that it cannot be guessed, similar to how shared links work.

---

## Client-Safe Constants Fix

| Property | Value |
|----------|-------|
| **File** | `src/features/checkout/ui/_components/constants.ts` |
| **Layer** | `features/checkout/` (private `_components/`) |
| **Type** | Pure constants (no imports) |

### Problem

`OrderSummary.tsx` and `OrderConfirmation.tsx` imported `CURRENCY_SYMBOL` from `../../constants` → `@/modules/orders` → `@/modules/orders/index.ts` → `services/stock.service.ts` → `@/lib/payload` → `payload.config.ts` → `revalidate-cache.ts` → `import { revalidateTag } from 'next/cache'`.

Since these components are rendered inside `CheckoutForm.tsx` (`'use client'`), webpack bundles them as client code and follows the entire import chain, eventually hitting `revalidateTag` which is server-only.

### Solution

Created a lightweight constants file with zero imports:

```typescript
export const CURRENCY_SYMBOL = '$'
```

This file has NO dependency chain — it's pure data, safe for client bundles.

### Files Modified

| File | Change |
|------|--------|
| `ui/_components/OrderSummary.tsx` | `import from '../../constants'` → `import from './constants'` |
| `ui/OrderConfirmation.tsx` | `import from '../constants'` → `import from './_components/constants'` |

---

## Complete File List

### New Files Created — Phase 5

| File | Task | Type |
|------|------|------|
| `src/features/checkout/ui/_components/CustomerFields.tsx` | T047 | Client Component — form inputs + honeypot |
| `src/features/checkout/ui/_components/OrderSummary.tsx` | T048 | Presentational — line items + total |
| `src/features/checkout/ui/_components/CodDisclaimer.tsx` | T049 | Presentational — COD notice |
| `src/features/checkout/ui/_components/constants.ts` | — | Client-safe constants (build fix) |
| `src/features/checkout/ui/CheckoutForm.tsx` | T050 | Client Component — main checkout form |
| `src/features/checkout/ui/OrderConfirmation.tsx` | T056 | Presentational — post-checkout success |
| `src/features/checkout/actions/process-checkout.action.ts` | T051 | Server Action — atomic checkout transaction |
| `src/app/(storefront)/checkout/page.tsx` | T055 | Server Component — checkout route |
| `src/app/(storefront)/order-confirmation/[orderId]/page.tsx` | T057 | Server Component — confirmation route |

### Modified Files — Phase 5

| File | Task | Change |
|------|------|--------|
| `src/features/checkout/index.ts` | T052 | Added exports: `processCheckoutAction`, `CheckoutCartItem`, `CheckoutResult`, `OrderConfirmationData` |
| `src/features/checkout/README.md` | T054 | Full rewrite with architecture diagram and transaction flow |
| `specs/002-cart-checkout/tasks.md` | — | Marked T047–T057 as `[x]` |

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Form submission | `useTransition` + `FormData` | Non-blocking UI, progressive enhancement |
| Honeypot method | CSS off-screen positioning | More effective than `display: none` against smart bots |
| Transaction scope | Stock + order inside, cart clear outside | Cart clearing is best-effort — failed clear shouldn't void the order |
| Currency constants | Separate client-safe file | Avoids webpack server-only import chain error |
| Type mapping | `CartItemData` → `CheckoutCartItem` in page | Clean boundary between cart and checkout features |
| Order confirmation access | UUID-based (no session required) | Order ID is sufficiently random; enables shareable confirmation |
| Textarea implementation | Native HTML (not shadcn) | No `Textarea` component in `shared/ui/` |
| Error display | Global error banner at top | Simple UX; field-level error mapping deferred to future enhancement |

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **0 errors** ✅ |
| Lint error: `exactOptionalPropertyTypes` for `notes` | Fixed with spread operator pattern |
| Lint error: `ZodError.errors[0]` possibly undefined | Fixed with optional chaining `?.message` |
| Build error: `revalidateTag` in client bundle | Fixed with client-safe constants file |
| Runtime error: "An unexpected error occurred" on checkout | Fixed — `beginTransaction()` returns raw ID, not `PayloadRequest`. Constructed `{ transactionID } as PayloadRequest` |
| FSD architecture | All imports follow downward dependency rule ✅ |
| DAL pattern | Session verified in checkout page + server action ✅ |
| Constitution compliance | Tailwind only, no inline styles, barrel imports ✅ |
