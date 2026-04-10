# Order Tracking Feature

## Purpose

Order status lookup for customers. Provides a dual-mode search form (by order number or phone number) with a visual status timeline showing order progression. Public feature — no authentication required.

Delegates order data queries to `modules/orders` (`OrderQueryService`) and uses Zod schemas from `modules/orders` for input validation.

## Dependencies

- `@/modules/orders` — `OrderQueryService`, `trackOrderSchema`, `lookupOrdersSchema`, `TRACKING_RATE_LIMIT`, `CURRENCY_SYMBOL`, `ActionResult`, `LookupOrdersResult`
- `@/core/errors` — `AppError` for typed error handling
- `@/core/logger` — `Logger` for structured logging
- `@/core/rate-limit` — `createRateLimiter` for IP-based rate limiting
- `@/core/request` — `getClientIP` for extracting client IP from headers
- `@/shared/ui` — `Input`, `Label`, `Button`, `Separator` primitives
- `@/shared/lib/utils` — `cn()` for conditional class merging

## Public API

### UI Components

| Export | Type | Description |
|--------|------|-------------|
| `OrderStatus` | Server Component | Full order display: header, status timeline, items list, total |
| `TrackOrderForm` | Client Component | Dual-mode search form (order number / phone) with results display |

### Private Components (`_components/`)

| Component | Type | Description |
|-----------|------|-------------|
| `StatusTimeline` | Presentational | Vertical timeline: pending → processing → completed (or cancelled) |

### Server Actions

| Export | Description |
|--------|-------------|
| `trackOrderAction(input)` | Lookup by order number (VX-XXXXXX), rate limited by IP (10/min) |
| `lookupOrdersAction(input)` | Lookup all orders by phone (+1 US), rate limited by IP (10/min) |

### Constants

| Export | Description |
|--------|-------------|
| `STATUS_LABELS` | Human-readable status labels (e.g., `pending → 'Pending'`) |
| `STATUS_DESCRIPTIONS` | Customer-facing status descriptions for timeline display |
| `CURRENCY_SYMBOL` | Re-exported from `@/modules/orders` (`$`) |
| `TRACKING_RATE_LIMIT` | Re-exported from `@/modules/orders` (10/min) |

### Types

| Export | Description |
|--------|-------------|
| `TrackedOrder` | Full order for tracking: number, status, total, items |
| `OrderListItem` | Summary for phone lookup list: number, status, total, date |
| `TimelineStep` | Timeline step: status, label, description, isActive, isCompleted |
| `TrackOrderResult` | `{ order: TrackedOrder }` |
| `LookupOrdersResult` | `{ orders: OrderListItem[] }` |

## Collections Owned

None — reads from `orders` and `order_items` collections owned by checkout feature.

## Notes

- **No DAL required** — tracking pages are public per spec clarification
- **No cross-feature imports** — queries go through `OrderQueryService` in `modules/orders` (FSD compliant)
- **Rate limited by IP** (not session) to prevent order number enumeration
- **Two rate limiters** — one for `trackOrderAction`, one for `lookupOrdersAction` (separate instances)
- **StatusTimeline** handles cancelled orders separately: shows `pending → cancelled` instead of the full progression
- **TrackOrderForm** uses `useTransition` for non-blocking UI during search
- **cn()** used for all conditional className merging (no template literals)
- Phone lookup returns empty array (not error) when no orders found

## Files

```
src/features/order-tracking/
├── README.md                              # This file
├── feature.config.ts                      # Feature metadata (depends on: checkout)
├── index.ts                               # Public API (components + actions + types)
├── types.ts                               # TrackedOrder, OrderListItem, TimelineStep
├── constants.ts                           # STATUS_LABELS, STATUS_DESCRIPTIONS, re-exports
├── actions/
│   ├── track-order.action.ts              # Server Action — lookup by order number
│   └── lookup-orders.action.ts            # Server Action — lookup by phone
└── ui/
    ├── OrderStatus.tsx                    # Full order display with timeline (Server)
    ├── TrackOrderForm.tsx                 # Dual-mode search form (Client)
    └── _components/
        └── StatusTimeline.tsx             # Visual status progression (Presentational)
```
