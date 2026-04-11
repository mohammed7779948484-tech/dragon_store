# API Contracts: Phase 2 Cart & Checkout

**Feature**: 002-cart-checkout
**Date**: 2026-02-20
**Protocol**: Server Actions (Next.js App Router)

## Overview

All API operations are implemented as Next.js Server Actions in `features/*/actions/`. Actions return a standardized `ActionResult<T>` type with Zod validation.

### Standard Response Type

```typescript
interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}
```

### Standard Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| UNAUTHORIZED | 401 | Session invalid or expired |
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| INSUFFICIENT_STOCK | 400 | Stock unavailable |
| CART_FULL | 400 | Cart at 50 item limit |
| RATE_LIMITED | 429 | Too many requests |
| UNKNOWN_ERROR | 500 | Unexpected error |

---

## Cart Actions

### add-to-cart.action.ts

**Purpose**: Add a product variant to the user's cart

**File**: `src/features/cart/actions/add-to-cart.action.ts`

**Input Schema**:
```typescript
const addToCartSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10).default(1),
})
```

**Output Type**:
```typescript
interface AddToCartResult {
  cartItemCount: number
  itemName: string
}
```

**Response Examples**:

```typescript
// Success
{
  success: true,
  data: {
    cartItemCount: 5,
    itemName: "Strawberry Ice - 50ml"
  }
}

// Validation Error
{
  success: false,
  error: "Invalid product variant",
  code: "VALIDATION_ERROR"
}

// Insufficient Stock
{
  success: false,
  error: "Only 3 available",
  code: "INSUFFICIENT_STOCK"
}

// Cart Full
{
  success: false,
  error: "Cart is full (50 items max). Remove items to add more.",
  code: "CART_FULL"
}

// Unauthorized
{
  success: false,
  error: "Session expired",
  code: "UNAUTHORIZED"
}
```

**Rate Limit**: 20 operations/minute/session

**Business Logic**:
1. Verify session via DAL
2. Validate variant exists and is active
3. Check stock availability
4. Check cart item count (max 50)
5. Get or create cart for session
6. Upsert cart item (merge if exists, cap at 10)
7. Extend cart expiration to 24h
8. Return updated cart item count

---

### update-quantity.action.ts

**Purpose**: Update quantity of a cart item

**File**: `src/features/cart/actions/update-quantity.action.ts`

**Input Schema**:
```typescript
const updateQuantitySchema = z.object({
  cartItemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
})
```

**Output Type**:
```typescript
interface UpdateQuantityResult {
  cartItemCount: number
  itemTotal: number
}
```

**Response Examples**:

```typescript
// Success
{
  success: true,
  data: {
    cartItemCount: 5,
    itemTotal: 45.00
  }
}

// Not Found
{
  success: false,
  error: "Cart item not found",
  code: "NOT_FOUND"
}
```

**Rate Limit**: 20 operations/minute/session

---

### remove-item.action.ts

**Purpose**: Remove an item from the cart

**File**: `src/features/cart/actions/remove-item.action.ts`

**Input Schema**:
```typescript
const removeItemSchema = z.object({
  cartItemId: z.number().int().positive(),
})
```

**Output Type**:
```typescript
interface RemoveItemResult {
  cartItemCount: number
}
```

**Response Examples**:

```typescript
// Success
{
  success: true,
  data: {
    cartItemCount: 4
  }
}
```

**Rate Limit**: 20 operations/minute/session

---

### clear-cart.action.ts

**Purpose**: Remove all items from the cart

**File**: `src/features/cart/actions/clear-cart.action.ts`

**Input Schema**: None (uses session)

**Output Type**:
```typescript
interface ClearCartResult {
  clearedCount: number
}
```

**Response Examples**:

```typescript
// Success
{
  success: true,
  data: {
    clearedCount: 5
  }
}
```

**Rate Limit**: 20 operations/minute/session

---

## Checkout Actions

### process-checkout.action.ts

**Purpose**: Process checkout with atomic stock decrement and order creation

**File**: `src/features/checkout/actions/process-checkout.action.ts`

**Input Schema**:
```typescript
const checkoutSchema = z.object({
  customerName: z.string().min(2).max(255),
  customerPhone: z.string().regex(/^\+1\d{10}$/),
  deliveryAddress: z.string().min(10).max(500),
  notes: z.string().max(1000).optional(),
  honeypotField: z.string().max(0).optional(),
})
```

**Output Type**:
```typescript
interface CheckoutResult {
  orderId: string
  orderNumber: string
}
```

**Response Examples**:

```typescript
// Success
{
  success: true,
  data: {
    orderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    orderNumber: "VX-7K3M2P"
  }
}

// Bot Detection (fake success, no order created)
{
  success: true,
  data: {
    orderId: "fake-id",
    orderNumber: "VX-FAKE00"
  }
}

// Insufficient Stock
{
  success: false,
  error: "Some items are no longer available. Strawberry Ice: only 2 left.",
  code: "INSUFFICIENT_STOCK"
}

// Validation Error
{
  success: false,
  error: "Phone must be +1 US format (e.g., +15551234567)",
  code: "VALIDATION_ERROR"
}

// Empty Cart
{
  success: false,
  error: "Cart is empty",
  code: "VALIDATION_ERROR"
}

// Inactive Items
{
  success: false,
  error: "Remove unavailable items before checkout",
  code: "VALIDATION_ERROR"
}
```

**Rate Limit**: 3 operations/minute/session

**Business Logic**:
1. Verify session via DAL
2. Validate input with Zod
3. Check honeypot field (return fake success if filled)
4. Fetch cart with live prices
5. Check for inactive items
6. Begin transaction
7. Verify stock for all items
8. Decrement stock atomically
9. Generate unique order number
10. Create order with status "pending"
11. Create order_items with snapshots
12. Commit transaction
13. Delete cart
14. Return order ID and number

---

## Order Tracking Actions

### track-order.action.ts

**Purpose**: Look up order by order number

**File**: `src/features/order-tracking/actions/track-order.action.ts`

**Input Schema**:
```typescript
const trackOrderSchema = z.object({
  orderNumber: z.string().regex(/^VX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/),
})
```

**Output Type**:
```typescript
interface TrackOrderResult {
  order: {
    orderNumber: string
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
    totalAmount: number
    createdAt: string
    items: Array<{
      productName: string
      variantName: string
      quantity: number
      unitPrice: number
    }>
  }
}
```

**Response Examples**:

```typescript
// Success
{
  success: true,
  data: {
    order: {
      orderNumber: "VX-7K3M2P",
      status: "processing",
      totalAmount: 89.97,
      createdAt: "2026-02-20T14:30:00Z",
      items: [
        {
          productName: "Premium Vape",
          variantName: "Strawberry Ice - 50ml",
          quantity: 3,
          unitPrice: 29.99
        }
      ]
    }
  }
}

// Not Found
{
  success: false,
  error: "Order not found",
  code: "NOT_FOUND"
}
```

**Rate Limit**: 10 lookups/minute/IP

**Notes**:
- No authentication required (public page)
- Rate limited by IP to prevent enumeration

---

### lookup-orders.action.ts

**Purpose**: Look up all orders by phone number

**File**: `src/features/order-tracking/actions/lookup-orders.action.ts`

**Input Schema**:
```typescript
const lookupOrdersSchema = z.object({
  phone: z.string().regex(/^\+1\d{10}$/),
})
```

**Output Type**:
```typescript
interface LookupOrdersResult {
  orders: Array<{
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: string
  }>
}
```

**Response Examples**:

```typescript
// Success (with orders)
{
  success: true,
  data: {
    orders: [
      {
        orderNumber: "VX-7K3M2P",
        status: "completed",
        totalAmount: 89.97,
        createdAt: "2026-02-18T14:30:00Z"
      },
      {
        orderNumber: "VX-9X4Y7Z",
        status: "processing",
        totalAmount: 45.00,
        createdAt: "2026-02-20T10:15:00Z"
      }
    ]
  }
}

// Success (no orders)
{
  success: true,
  data: {
    orders: []
  }
}
```

**Rate Limit**: 10 lookups/minute/IP

---

## Cron Endpoints

### GET /api/cron/cleanup-carts

**Purpose**: Delete expired carts (called by Vercel cron every 6 hours)

**File**: `src/app/api/cron/cleanup-carts/route.ts`

**Authentication**: Bearer token in `Authorization` header matching `CRON_SECRET` env var

**Request**:
```http
GET /api/cron/cleanup-carts HTTP/1.1
Authorization: Bearer <CRON_SECRET>
```

**Response Examples**:

```typescript
// Success
{
  "success": true,
  "deleted": 23
}

// Unauthorized
{
  "error": "Unauthorized"
}
// HTTP 401
```

**Business Logic**:
1. Verify `Authorization: Bearer ${CRON_SECRET}`
2. Find carts where `expires_at < NOW()`
3. Delete carts (cascades to cart_items)
4. Log deleted count
5. Return count

---

## Data Fetching Patterns

### Server Component: Cart Data

```typescript
// In a Server Component
import { verifySession } from '@/core/auth/session'
import { getCartBySession, getCartItems } from '@/features/cart/db/queries'

export async function CartProvider() {
  const session = await verifySession()
  
  if (!session) {
    return <CartButton count={0} />
  }
  
  const cart = await getCartBySession(session.sessionId)
  if (!cart) {
    return <CartButton count={0} />
  }
  
  const items = await getCartItems(cart.id)
  
  return (
    <>
      <CartButton count={items.length} />
      <CartDrawer items={items} />
    </>
  )
}
```

### Server Component: Order Confirmation

```typescript
// In a Server Component
import { getOrderById } from '@/features/checkout/db/queries'

export default async function OrderConfirmationPage({ 
  params 
}: { 
  params: { orderId: string } 
}) {
  const order = await getOrderById(params.orderId)
  
  if (!order) {
    return <OrderNotFound />
  }
  
  return <OrderConfirmation order={order} />
}
```

---

## Error Handling Pattern

All server actions follow this pattern:

```typescript
export async function someAction(input: unknown): Promise<ActionResult<SomeResult>> {
  const logger = new Logger()
  
  try {
    // 1. Verify session (if required)
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Session expired', code: 'UNAUTHORIZED' }
    }
    
    // 2. Validate input
    const data = inputSchema.parse(input)
    
    // 3. Business logic via modules
    const result = await someService.doSomething(data, session.sessionId)
    
    return { success: true, data: result }
    
  } catch (error) {
    logger.error(error as Error, 'Action failed')
    
    if (error instanceof AppError) {
      return { 
        success: false, 
        error: error.message, 
        code: error.code 
      }
    }
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message, 
        code: 'VALIDATION_ERROR' 
      }
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred', 
      code: 'UNKNOWN_ERROR' 
    }
  }
}
```
