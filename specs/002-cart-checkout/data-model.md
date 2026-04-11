# Data Model: Phase 2 Cart & Checkout

**Feature**: 002-cart-checkout
**Date**: 2026-02-20
**Database**: Neon PostgreSQL

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   session   │────▶│      carts      │────▶│   cart_items     │
│  (external) │     │                 │     │                  │
└─────────────┘     │ id: UUID        │     │ id: SERIAL       │
                    │ session_id: TXT │     │ cart_id: UUID FK │
                    │ expires_at: TS  │     │ variant_id: INT  │
                    │ created_at: TS  │     │ quantity: INT    │
                    │ updated_at: TS  │     │ price_at_add: $  │
                    └─────────────────┘     │ added_at: TS     │
                                            └────────┬─────────┘
                                                     │
                                                     ▼
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   orders    │────▶│   order_items   │     │ product_variants │
│             │     │                 │     │    (existing)    │
│ id: UUID    │     │ id: SERIAL      │     └──────────────────┘
│ order_no    │     │ order_id: UUID  │
│ session_id  │     │ variant_id: INT │
│ customer_*  │     │ product_name    │
│ status      │     │ variant_name    │
│ total_amt   │     │ quantity        │
│ *timestamps │     │ unit_price      │
└─────────────┘     │ total_price     │
                    └─────────────────┘
```

## Collections

### carts (Feature-owned: `features/cart/db/schema.ts`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Secure unguessable ID |
| session_id | text | UNIQUE, NOT NULL, INDEX | Links to gate session |
| expires_at | timestamp | NOT NULL, INDEX | 24h from last activity |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Last modification |

**Indexes**:
- `idx_carts_session` ON (session_id)
- `idx_carts_expires` ON (expires_at)

**Business Rules**:
- One cart per session (enforced by unique session_id)
- Cart expires 24h from last cart action (extends on each update)
- Deleted cart cascades to cart_items

### cart_items (Feature-owned: `features/cart/db/schema.ts`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-increment ID |
| cart_id | uuid | FK → carts.id, NOT NULL, ON DELETE CASCADE | Parent cart |
| variant_id | integer | FK → product_variants.id, NOT NULL | Product variant |
| quantity | integer | NOT NULL, CHECK (quantity >= 1 AND quantity <= 10) | Item quantity |
| price_at_add | decimal(10,2) | NOT NULL, CHECK (price_at_add >= 0) | Price when added |
| added_at | timestamp | NOT NULL, DEFAULT NOW() | Add timestamp |

**Indexes**:
- `idx_cart_items_cart` ON (cart_id)
- `idx_cart_items_variant` ON (variant_id)
- `idx_cart_items_unique` UNIQUE ON (cart_id, variant_id)

**Business Rules**:
- One variant per cart (upsert on duplicate)
- Quantity capped at 10
- Max 50 distinct items per cart (application-level check)

### orders (Feature-owned: `features/checkout/db/schema.ts`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Secure unguessable ID |
| order_number | varchar(10) | UNIQUE, NOT NULL, INDEX | Human-readable (VX-XXXXXX) |
| session_id | text | NOT NULL, INDEX | Session at order time |
| customer_name | varchar(255) | NOT NULL, CHECK (length >= 2) | Customer name |
| customer_phone | varchar(50) | NOT NULL, INDEX | +1 US format |
| delivery_address | text | NOT NULL, CHECK (length >= 10) | Delivery address |
| notes | text | NULL | Optional order notes |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | Order status |
| cancellation_reason | text | NULL | Why cancelled |
| cancelled_by | varchar(20) | NULL, CHECK IN ('customer', 'admin') | Who cancelled |
| cancelled_at | timestamp | NULL | When cancelled |
| honeypot_field | text | NULL | Bot detection (must be empty) |
| total_amount | decimal(10,2) | NOT NULL, CHECK (total_amount >= 0) | Order total |
| created_at | timestamp | NOT NULL, DEFAULT NOW(), INDEX | Order timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT NOW() | Last modification |

**Indexes**:
- `idx_orders_session` ON (session_id)
- `idx_orders_status` ON (status)
- `idx_orders_created` ON (created_at DESC)
- `idx_orders_phone` ON (customer_phone)
- `idx_orders_number` ON (order_number)

**Status Values** (const object, NOT enum):
```typescript
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const
```

**Status Transition Constraints**:
```
pending → processing ✅
pending → cancelled ✅
processing → completed ✅
processing → cancelled ✅
completed → (any) ❌
cancelled → (any) ❌
```

**CHECK Constraints**:
```sql
CHECK (
  (status = 'cancelled' AND cancelled_at IS NOT NULL)
  OR
  (status != 'cancelled' AND cancelled_at IS NULL 
   AND cancellation_reason IS NULL AND cancelled_by IS NULL)
)
```

### order_items (Feature-owned: `features/checkout/db/schema.ts`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-increment ID |
| order_id | uuid | FK → orders.id, NOT NULL, ON DELETE CASCADE | Parent order |
| variant_id | integer | FK → product_variants.id, NULLABLE | Variant (may be deleted) |
| product_name | text | NOT NULL | Snapshot at order time |
| variant_name | text | NOT NULL | Snapshot at order time |
| quantity | integer | NOT NULL, CHECK (quantity > 0) | Item quantity |
| unit_price | decimal(10,2) | NOT NULL, CHECK (unit_price >= 0) | Price at order time |
| total_price | decimal(10,2) | NOT NULL, CHECK (total_price >= 0) | unit_price × quantity |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | Creation timestamp |

**CHECK Constraints**:
```sql
CHECK (total_price = unit_price * quantity)
```

**Indexes**:
- `idx_order_items_order` ON (order_id)
- `idx_order_items_variant` ON (variant_id)

**Business Rules**:
- Prices are snapshots - never change after creation
- variant_id may be NULL if variant deleted after order

## Validation Schemas

### Checkout Input (Zod)

```typescript
const checkoutSchema = z.object({
  customerName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  customerPhone: z.string()
    .regex(/^\+1\d{10}$/, 'Phone must be +1 US format (e.g., +15551234567)'),
  deliveryAddress: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  honeypotField: z.string()
    .max(0, 'Invalid submission')
    .optional(),
})
```

### Cart Item Input (Zod)

```typescript
const addToCartSchema = z.object({
  variantId: z.number().int().positive('Invalid product variant'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 per item'),
})

const updateQuantitySchema = z.object({
  cartItemId: z.number().int().positive('Invalid cart item'),
  quantity: z.number().int().min(1).max(10),
})
```

## State Machines

### Order Status State Machine

```
                    ┌──────────────┐
                    │   PENDING    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 │                 ▼
  ┌──────────────┐         │         ┌──────────────┐
  │ PROCESSING   │         │         │  CANCELLED   │
  └──────┬───────┘         │         └──────────────┘
         │                 │           (final state)
    ┌────┴────┐            │
    ▼         ▼            │
┌──────────┐ ┌──────────┐  │
│COMPLETED │ │CANCELLED │  │
└──────────┘ └──────────┘  │
 (final)      (final)      │
         ▼                  ▼
    ┌─────────────────────────┐
    │      CANCELLED          │
    │      (final)            │
    └─────────────────────────┘
```

### Cart Lifecycle

```
┌──────────────┐     Add Item      ┌──────────────┐
│   NO CART    │──────────────────▶│  CART WITH   │
│              │                   │    ITEMS     │
└──────────────┘                   └──────┬───────┘
       ▲                                  │
       │                                  │
       │    ┌─────────────────────────────┤
       │    │                             │
       │    │  Remove last item          │  Checkout
       │    │                             │
       │    ▼                             ▼
       │    ┌──────────────┐       ┌──────────────┐
       └────│  EMPTY CART  │       │    ORDER     │
            └──────┬───────┘       │   CREATED    │
                   │               └──────────────┘
                   │ 24h inactivity      │
                   │                     │
                   ▼                     ▼
            ┌──────────────┐      Cart deleted
            │   EXPIRED    │      (cascade)
            │  (deleted by │
            │    cron)     │
            └──────────────┘
```

## Payload Collection Configs

### carts Collection

```typescript
// features/cart/db/schema.ts
import type { CollectionConfig } from 'payload'

export const Carts: CollectionConfig = {
  slug: 'carts',
  admin: {
    group: 'Orders',
    description: 'Shopping carts linked to sessions',
  },
  access: {
    read: () => true, // Public read via session_id filter
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'session_id',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'expires_at',
      type: 'date',
      required: true,
      index: true,
    },
  ],
  timestamps: true,
}
```

### cart_items Collection

```typescript
// features/cart/db/schema.ts
export const CartItems: CollectionConfig = {
  slug: 'cart_items',
  admin: {
    group: 'Orders',
    description: 'Items in shopping carts',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'cart',
      type: 'relationship',
      relationTo: 'carts',
      required: true,
      index: true,
      hasMany: false,
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'product_variants',
      required: true,
      index: true,
      hasMany: false,
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 1,
      max: 10,
    },
    {
      name: 'price_at_add',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'added_at',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
  ],
}
```

### orders Collection

```typescript
// features/checkout/db/schema.ts
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Orders',
    description: 'Customer orders',
  },
  access: {
    read: () => true, // Public for tracking
    create: () => true, // Server actions only
    update: () => true, // Admin via panel
    delete: ({ req }) => req.user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'order_number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'session_id',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'customer_name',
      type: 'text',
      required: true,
    },
    {
      name: 'customer_phone',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'delivery_address',
      type: 'textarea',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      index: true,
    },
    {
      name: 'cancellation_reason',
      type: 'textarea',
    },
    {
      name: 'cancelled_by',
      type: 'select',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      name: 'cancelled_at',
      type: 'date',
    },
    {
      name: 'honeypot_field',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'total_amount',
      type: 'number',
      required: true,
      min: 0,
    },
  ],
  timestamps: true,
}
```

### order_items Collection

```typescript
// features/checkout/db/schema.ts
export const OrderItems: CollectionConfig = {
  slug: 'order_items',
  admin: {
    group: 'Orders',
    description: 'Line items in orders',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false, // Immutable after creation
    delete: () => false, // Immutable after creation
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      index: true,
      hasMany: false,
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'product_variants',
      hasMany: false,
    },
    {
      name: 'product_name',
      type: 'text',
      required: true,
    },
    {
      name: 'variant_name',
      type: 'text',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'unit_price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'total_price',
      type: 'number',
      required: true,
      min: 0,
    },
  ],
  timestamps: false,
}
```
