# Implementation Plan: Phase 2 Cart & Checkout

**Branch**: `002-cart-checkout` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cart-checkout/spec.md`

## Summary

Server-side relational cart system with `carts` and `cart_items` collections, checkout flow with atomic stock decrement, and order tracking by order number or phone. Uses Zustand for UI state only (drawer open/close), with all cart data fetched from server. COD-only payment with honeypot anti-bot protection.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 15, Payload CMS v3, Zod, Zustand
**Storage**: Neon PostgreSQL (serverless, serializable isolation)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Vercel serverless (edge + serverless functions)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: <500ms cart operations, <2s checkout, 100% concurrent order safety
**Constraints**: No localStorage for cart, no optimistic updates, DAL verification required
**Scale/Scope**: 50 concurrent users, 500 products, 20 daily orders

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Rule | Status | Notes |
|------|--------|-------|
| NO localStorage for cart data | ✅ PASS | Server-side carts collection |
| NO user accounts | ✅ PASS | Session-linked cart via session_id |
| NO enums | ✅ PASS | Using const objects for status |
| NO any type | ✅ PASS | Zod validation + explicit types |
| NO cross-feature imports | ✅ PASS | Features isolated, modules for shared logic |
| NO payment integrations | ✅ PASS | COD only |
| DAL pattern required | ✅ PASS | verifySession() in all actions/components |
| Middleware NOT for security | ✅ PASS | Middleware only for UX redirects |
| FSD dependency flow | ✅ PASS | app → widgets → features → modules → core → shared |

**Gate Status**: ✅ ALL PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-cart-checkout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-spec.md      # Server action contracts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (storefront)/
│   │   ├── cart/
│   │   │   └── page.tsx              # Full cart page
│   │   ├── checkout/
│   │   │   └── page.tsx              # Checkout form page
│   │   ├── order-confirmation/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx          # Order success page
│   │   └── track-order/
│   │       └── page.tsx              # Order tracking page
│   └── api/
│       └── cron/
│           └── cleanup-carts/
│               └── route.ts          # Cart cleanup cron endpoint
│
├── features/
│   ├── cart/
│   │   ├── README.md
│   │   ├── feature.config.ts
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartButton.tsx
│   │   │   └── _components/
│   │   │       ├── CartItem.tsx
│   │   │       ├── CartSummary.tsx
│   │   │       ├── EmptyCart.tsx
│   │   │       └── PriceChangeNotice.tsx
│   │   ├── actions/
│   │   │   ├── add-to-cart.action.ts
│   │   │   ├── update-quantity.action.ts
│   │   │   ├── remove-item.action.ts
│   │   │   └── clear-cart.action.ts
│   │   ├── db/
│   │   │   ├── schema.ts             # Carts + CartItems collections
│   │   │   ├── queries.ts
│   │   │   └── mutations.ts
│   │   ├── logic/
│   │   │   └── use-cart.ts           # Zustand UI-only store
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   ├── checkout/
│   │   ├── README.md
│   │   ├── feature.config.ts
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── OrderConfirmation.tsx
│   │   │   └── _components/
│   │   │       ├── CustomerFields.tsx
│   │   │       ├── OrderSummary.tsx
│   │   │       └── CodDisclaimer.tsx
│   │   ├── actions/
│   │   │   └── process-checkout.action.ts
│   │   ├── db/
│   │   │   ├── schema.ts             # Orders + OrderItems collections
│   │   │   ├── queries.ts
│   │   │   └── mutations.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   └── order-tracking/
│       ├── README.md
│       ├── feature.config.ts
│       ├── index.ts
│       ├── ui/
│       │   ├── TrackOrderForm.tsx
│       │   ├── OrderStatus.tsx
│       │   └── _components/
│       │       └── StatusTimeline.tsx
│       ├── actions/
│       │   ├── track-order.action.ts
│       │   └── lookup-orders.action.ts
│       ├── types.ts
│       └── constants.ts
│
├── modules/
│   └── orders/
│       ├── README.md
│       ├── index.ts
│       ├── services/
│       │   ├── order.service.ts
│       │   └── stock.service.ts
│       ├── validators/
│       │   └── validate-checkout.ts
│       ├── types.ts
│       └── constants.ts
│
├── widgets/
│   └── header/
│       └── Header.tsx                # Imports CartButton from features/cart
│
└── vercel.json                       # Cron configuration
```

**Structure Decision**: FSD architecture with three new features (cart, checkout, order-tracking) and one new module (orders). Cart and Order collections are feature-owned (in `features/*/db/schema.ts`), not in `payload/collections/`.

## Complexity Tracking

> No constitution violations - all rules satisfied.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| Relational cart model | carts + cart_items tables | Enables abandoned cart analytics, price change detection |
| Zustand UI-only | No cart items in store | Server is source of truth, prevents state mismatch |
| DAL verification | Every action/component | CVE-2025-29927 mitigation |
