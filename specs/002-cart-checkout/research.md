# Research: Phase 2 Cart & Checkout

**Feature**: 002-cart-checkout
**Date**: 2026-02-20
**Status**: Complete

## Research Tasks

### 1. Payload v3 Transaction API for Atomic Stock Decrement

**Decision**: Use Payload v3's `db.beginTransaction()`, `db.commitTransaction()`, `db.rollbackTransaction()` with `req: { transactionID }` passed to all operations.

**Rationale**: Native Payload API ensures consistency with Payload's internal operations and access control. Serializable isolation in PostgreSQL prevents race conditions without explicit row locks.

**Alternatives Considered**:
- Raw SQL transactions - Rejected: Bypasses Payload's access control and hooks
- Reserved stock model - Rejected: Constitution specifies Direct Decrement model
- Pessimistic locking - Rejected: Serializable isolation sufficient for COD scale

**Implementation Pattern**:
```typescript
const transactionID = await payload.db.beginTransaction()
try {
  // All operations with req: { transactionID }
  await payload.db.commitTransaction(transactionID)
} catch (e) {
  await payload.db.rollbackTransaction(transactionID)
  throw e
}
```

### 2. Order Number Generation Algorithm

**Decision**: Generate format `VX-XXXXXX` using charset `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (30 chars, no ambiguous 0/O/1/I/L).

**Rationale**: 
- 30^6 ≈ 729 million combinations
- Collision probability <0.007% at 10K orders
- Retry up to 3 times guarantees uniqueness
- Human-friendly, memorable for screenshots

**Alternatives Considered**:
- UUID - Rejected: Not user-friendly for tracking
- Sequential numbers - Rejected: Reveals business volume
- Timestamp-based - Rejected: Guessable, potential collisions

**Implementation**:
```typescript
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const MAX_RETRIES = 3

function generateOrderNumber(): string {
  const randomPart = Array.from({ length: 6 }, () => 
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('')
  return `VX-${randomPart}`
}
```

### 3. Zustand Store for Cart UI State

**Decision**: UI-only store containing `isDrawerOpen` and `isLoading`. NO cart items, NO total, NO persistence.

**Rationale**:
- Server is single source of truth (constitution requirement)
- Prevents client-server state mismatch
- Enables price change detection on every cart view
- No hydration issues

**Alternatives Considered**:
- Persisted Zustand store - Rejected: Constitution forbids localStorage for cart
- React Context - Rejected: Zustand cleaner for simple UI state
- Server-only state - Rejected: Need drawer toggle from client components

**Implementation**:
```typescript
interface CartUIState {
  isDrawerOpen: boolean
  isLoading: boolean
  openDrawer: () => void
  closeDrawer: () => void
  setLoading: (loading: boolean) => void
}
```

### 4. Live Price Change Detection Pattern

**Decision**: Store `price_at_add` in cart_items. On cart view, compare with current variant price. Display notification banner if prices differ.

**Rationale**:
- Transparent pricing - customer sees exact changes
- Live price used at checkout (not stored price)
- Enables customer to make informed decision

**Implementation**:
```typescript
interface PriceChange {
  variantId: number
  variantName: string
  oldPrice: number
  newPrice: number
}

function detectPriceChanges(items: CartItem[]): PriceChange[] {
  return items
    .filter(item => item.price_at_add !== item.variant.price)
    .map(item => ({
      variantId: item.variant.id,
      variantName: item.variant.variant_name,
      oldPrice: item.price_at_add,
      newPrice: item.variant.price,
    }))
}
```

### 5. Vercel Cron for Cart Cleanup

**Decision**: Configure cron in `vercel.json` to hit `/api/cron/cleanup-carts` every 6 hours. Authenticate with `CRON_SECRET` Bearer token.

**Rationale**:
- Native Vercel cron support
- Bearer token prevents unauthorized access
- 6-hour interval balances DB load vs. storage

**Implementation**:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-carts",
    "schedule": "0 */6 * * *"
  }]
}
```

### 6. Phone Validation Pattern (+1 US Format)

**Decision**: Zod regex `/^\+1\d{10}$/` for strict +1 US format.

**Rationale**:
- Project scope: US-only customers
- Consistent format for order lookup
- Prevents invalid entries

**Implementation**:
```typescript
const phoneSchema = z.string()
  .regex(/^\+1\d{10}$/, 'Phone must be +1 US format (e.g., +15551234567)')
```

### 7. Honeypot Anti-Bot Implementation

**Decision**: Hidden field `honeypot_field` in checkout form. Zod validation `z.string().max(0)`. Silent fake success for filled honeypot.

**Rationale**:
- CSS-hidden field invisible to humans
- Bots auto-fill all fields
- Fake success doesn't reveal detection to bots

**Implementation**:
```typescript
const checkoutSchema = z.object({
  // ... other fields
  honeypot_field: z.string().max(0).optional(), // Must be empty
})

// In action:
if (validated.honeypot_field) {
  // Bot detected - return fake success
  return { success: true, orderNumber: 'VX-FAKE00' }
}
```

### 8. Rate Limiting Strategy

**Decision**: Reuse existing LRU-cache rate limiter from `core/rate-limit/`. Different limits per operation type.

**Limits**:
| Operation | Limit | Key |
|-----------|-------|-----|
| Cart actions | 20/min | session_id |
| Checkout | 3/min | session_id |
| Order tracking | 10/min | IP address |

**Rationale**: Session-based for cart/checkout (authenticated context), IP-based for tracking (public page).

### 9. Session Verification in Server Actions

**Decision**: Every server action calls `verifySession()` from `core/auth/session.ts` before any data operation.

**Rationale**:
- CVE-2025-29927: Middleware bypass possible
- DAL pattern required by constitution
- Consistent error handling for unauthorized access

**Implementation**:
```typescript
export async function addToCart(input: unknown) {
  const session = await verifySession()
  if (!session) {
    return { success: false, error: 'Session expired', code: 'UNAUTHORIZED' }
  }
  // ... rest of action
}
```

### 10. Order Status Transition Validation

**Decision**: State machine pattern with allowed transitions map. Reject invalid transitions with specific error.

**Allowed Transitions**:
```
pending → processing
pending → cancelled
processing → completed
processing → cancelled
```

**Blocked Transitions**:
- `completed` → any (final state)
- `cancelled` → any (final state)
- `pending` → `completed` (must go through processing)

**Implementation**:
```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function validateTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}
```

## Dependencies Verified

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | App Router, Server Actions |
| Payload CMS | v3 | Collections, Transactions |
| Zod | latest | Input validation |
| Zustand | latest | UI state management |
| LRU-cache | latest | Rate limiting |
| bcrypt | latest | Password hashing (existing) |

## Technical Decisions Summary

1. **Cart Model**: Relational (carts + cart_items tables) - Enables analytics and price tracking
2. **State Management**: Zustand UI-only - Server is source of truth
3. **Transactions**: Payload v3 native API - Consistency with access control
4. **Order Numbers**: VX-XXXXXX format - Human-friendly, ~729M combinations
5. **Anti-Bot**: Honeypot + rate limiting - Multi-layer protection
6. **Session Security**: DAL verification everywhere - CVE-2025-29927 mitigation
