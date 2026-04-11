<!-- 
SYNC IMPACT REPORT
- Version change: 1.3.0 → 1.4.0 (MINOR - second-pass audit fix alignment)
- Status: Aligned with finalized plan.md v2.2.0
- Changes:
  * Brands: Separated into dedicated collection (removed from categories type field)
  * Cart Schema: Changed from embedded array to relational (carts + cart_items tables)
  * Cart Items: Added price_at_add field for live price change detection
  * Zustand: Updated useCart store to UI-only state (no items/total/persist)
  * Stock: Renamed reserveStock → decrementStock (Direct Decrement model, no reserved_quantity)
  * Stock Validation: Fixed syntax error in atomic decrement code
  * Session: Added "Remember Me" support (30-day duration)
  * Order Statuses: Confirmed 4 states (no shipped/delivered)
  * No Tax, No Shipping, No Min Order, No SEO
- Previous changes (v1.1.0):
  * 20+ new rules, security updates, Neon PostgreSQL, DAL pattern
- Templates requiring updates: N/A
- Follow-up TODOs: None
-->

# 📜 Project Constitution

**Version:** 1.2.0  
**Ratified:** 2026-02-15  
**Last Amended:** 2026-02-17  

---

## Project Overview & Goals

Closed/private e-commerce store for vape products with site-wide password protection. The system operates on Cash on Delivery (COD) only, utilizing a server-side cart persisted in the database. Built on Payload CMS v3 with a customized admin panel, the architecture prioritizes security, performance, and maintainability through strict feature-based organization. The codebase serves a single-tenant private store requiring no user accounts—only session-based authentication via shared password.

---

## Tech Stack & Constraints

### Mandatory Technologies
- **Framework:** Next.js 15+ with App Router
- **CMS:** Payload v3 with customized admin panel
- **Database:** Neon PostgreSQL (serverless Postgres)
- **Language:** TypeScript in strict mode
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animation:** Framer Motion
- **Testing:** Vitest (unit/integration) + Playwright (E2E)

### Forbidden Practices
- **NEVER use local storage for cart data** - Server-side persistence only
- **NO payment integrations** - COD only, no Stripe/Moyasar/etc.
- **NO user accounts** - Session-based password protection only
- **NO enums** - Use const objects or literal unions
- **NO CSS modules, styled-components, or emotion**
- **NO inline styles** (`style={{}}`)
- **NO `any` type** - Use `unknown` with narrowing
- **NO cross-feature imports** - Features are strictly isolated
- **NO SQLite references** - Neon PostgreSQL only

---

## Code Quality & Best Practices

### TypeScript Strict
- All types must be explicit; no implicit returns
- Use `interface` for expandable object shapes
- Use `type` for unions, primitives, intersections
- Function return types MUST be explicit for public APIs

### Server Components Default
- Default to Server Components in Next.js App Router
- Use `'use client'` ONLY when required (state, effects, browser APIs)
- Keep client components small and focused

### Naming Conventions

#### Files (MANDATORY PATTERN)
**Unified Pattern ONLY**: `[purpose].[type].ts`
- ✅ `order.service.ts` (Service)
- ✅ `cart.store.ts` (Zustand store)
- ✅ `process-checkout.action.ts` (Server Action)
- ✅ `validate-order.ts` (Validator)
- ✅ `cart-drawer.tsx` (Component - kebab-case file, PascalCase export)
- ❌ `OrderService.ts` (PascalCase not allowed for files)
- ❌ `order_service.ts` (snake_case not allowed)

#### Folders
**Pattern**: `kebab-case`
- ✅ `product-reviews`, `age-gate`, `nicotine-calc`
- ❌ `productReviews`, `AgeGate`

#### Components
**Pattern**: `PascalCase` (EXCEPTION: `.tsx` files use PascalCase, not kebab-case)
- ✅ `CartDrawer.tsx`, `CheckoutForm.tsx`, `ProductCard.tsx`
- ❗ This is the ONLY exception to the kebab-case file naming rule

#### Functions & Variables
**Pattern**: `camelCase`
- ✅ `calculateTotal`, `isFeatureEnabled`, `useCart`

#### Constants
**Pattern**: `UPPER_SNAKE_CASE`
- ✅ `MAX_QUANTITY`, `VAT_RATE`, `DEFAULT_CURRENCY`

#### Server Actions
**Pattern**: `[verb-noun].action.ts`
- ✅ `process-checkout.action.ts`
- ✅ `verify-age.action.ts`
- ✅ `submit-review.action.ts`

### Import Rules

#### Path Aliases (MANDATORY)
ALWAYS use `@/`. Never use relative paths across layers.

```typescript
// ✅ CORRECT
import { Button } from '@/shared/ui/button'
import { useCart } from '@/features/cart'
import { TaxService } from '@/modules/orders'
import { Logger } from '@/core/logger'

// ❌ WRONG
import { Button } from '../../../shared/ui/button'
import { TaxService } from '../../modules/orders/services/TaxService'
```

#### Public API Only
Import from the `index.ts` of the layer, not deep imports.

```typescript
// ✅ CORRECT - Import from index.ts
import { useCart, CartDrawer } from '@/features/cart'
import { TaxService } from '@/modules/orders'

// ❌ WRONG - Deep imports
import { useCart } from '@/features/cart/logic/useCart'
import { TaxService } from '@/modules/orders/services/TaxService'
```

#### Type Imports
Use `import type` for interfaces/types only.

```typescript
// ✅ CORRECT
import type { CartItem } from '@/features/cart'
import type { Product } from '@/types/payload-types'

// ❌ WRONG - Regular import for type
import { CartItem } from '@/features/cart' // if only using as type
```

#### Import Order (with Examples)
```typescript
// 1. External packages
import { useState } from 'react'
import { z } from 'zod'

// 2. Internal by layer (app → widgets → features → modules → core → shared)
import { Header } from '@/widgets/header'
import { useCart } from '@/features/cart'
import { TaxService } from '@/modules/orders'
import { Logger } from '@/core/logger'
import { Button } from '@/shared/ui/button'

// 3. Types
import type { CartItem } from '@/features/cart'

// 4. Relative (same folder only)
import { InternalComponent } from './_components/InternalComponent'
```

### Server Actions Rules
- **MUST validate** with Zod before processing
- **MUST use try-catch** - Never throw errors, return `{ success, data?, error? }`
- **MUST call modules/** for business logic - No inline logic
- **MUST log** all errors via Logger

### Error Handling in Server Actions

```typescript
interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export async function processCheckout(input: unknown): Promise<ActionResult> {
  const logger = new Logger()
  
  try {
    const data = checkoutSchema.parse(input)
    const orderService = new OrderService()
    const order = await orderService.create(data)
    
    return { success: true, data: order }
    
  } catch (error) {
    logger.error(error as Error, 'Checkout failed')
    
    if (error instanceof AppError) {
      return { 
        success: false, 
        error: error.message, 
        code: error.code 
      }
    }
    
    return { 
      success: false, 
      error: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR'
    }
  }
}
```

### Private Components Pattern
- Place internal-only components in `ui/_components/` (underscore prefix)
- These components are NOT exported from index.ts
- Use for components that are only used within the feature

```typescript
// ✅ CORRECT structure
src/features/cart/
├── ui/
│   ├── _components/           # Private components
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── CartDrawer.tsx         # Public component
│   └── CartButton.tsx         # Public component
└── index.ts                   # Only exports CartDrawer, CartButton

// ❌ WRONG - Exporting private components
export { CartItem } from './ui/_components/CartItem'  // FORBIDDEN
```

---

## Security & Data Rules

### Password Protection
- Site-wide shared password with session-based authentication
- Rate limiting MUST be implemented for password attempts
- Session management via secure HTTP-only cookies

### Data Protection
- **NEVER expose secrets** in client code
- **NEVER store sensitive data in cookies without encryption**
- Validate ALL user inputs with Zod at API boundaries
- Sanitize before database insert (Payload handles this)
- Environment variables MUST be validated via Zod schema on startup

### Stock Validation
- Stock quantity MUST be validated at checkout time
- Race conditions MUST be handled (check stock before order creation)

### Database Access
- Use Payload Local API with `overrideAccess: false` when user context exists
- Pass `req` to nested Payload operations for transaction consistency
- NO direct database access - Always use `getPayloadClient`

**`getPayloadClient` Wrapper** (project convention):
```typescript
// lib/payload.ts — Wraps Payload's built-in getPayload()
import { getPayload } from 'payload'
import config from '@payload-config'

export const getPayloadClient = () => getPayload({ config })
```

---

## Authentication & Security (Next.js 15)

### CRITICAL: Middleware is NOT Secure
**CVE-2025-29927 Warning**: Middleware bypass is possible. Middleware MUST NOT be used for security-critical authentication.

### Data Access Layer (DAL) Pattern (MANDATORY)
Verify session at EVERY data access point:

```typescript
// core/auth/session.ts
import { cache } from 'react'
import { cookies } from 'next/headers'
import { decrypt } from '@/core/auth/encryption'

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)
  
  if (!session?.isAuthenticated) {
    return null
  }
  
  return { isAuthenticated: true, sessionId: session.sessionId }
})

// Usage in Server Components
export default async function Dashboard() {
  const session = await verifySession()
  if (!session) redirect('/login')
  
  // Now safe to fetch data
  const orders = await getOrders(session.sessionId)
}

// Usage in Server Actions
export async function updateCart(data: unknown) {
  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }
  
  // Process cart update...
}
```

### Session Verification Points
- ✅ Server Components: Verify at component start
- ✅ Server Actions: Verify before any data access
- ✅ API Routes: Verify before processing request
- ❌ Middleware: Use ONLY for UX redirects, NOT security

### Middleware Usage (UX Only)
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Only for redirects, NOT for security
  const session = request.cookies.get('session')
  
  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

---

## Folder Structure & Feature Organization Rules

### Top-Level Structure
```
project-root/
├── .ai/                    # AI Configuration & Documentation
│   ├── rules.md            # The Constitution
│   ├── feature-template.md
│   ├── module-template.md
│   └── prompts/
├── src/
│   ├── app/                # Next.js App Router (Composer Layer)
│   │   ├── (payload)/      # Payload CMS Admin
│   │   ├── (storefront)/   # Public E-commerce Storefront
│   │   ├── api/            # API Routes & Webhooks
│   │   └── providers.tsx   # Global State Wrappers
│   ├── widgets/            # Composite UI Components
│   ├── features/           # Feature Modules (Building Blocks)
│   ├── modules/            # Shared Business Logic (Brain)
│   ├── core/               # Infrastructure (Foundation)
│   ├── payload/            # CMS Configuration (Data Layer)
│   └── shared/             # Shared Utilities (Toolkit)
├── public/                 # Static Assets
├── scripts/                # Maintenance Scripts
└── middleware.ts           # Next.js Middleware
```

### Dependency Rules (Vertical Flow)
Dependencies flow STRICTLY downwards. A layer can only import from layers below it:

| Layer | Can Import From | FORBIDDEN Imports |
|-------|----------------|-------------------|
| `app/` | `widgets/`, `features/`, `shared/` | `modules/`, `core/`, `payload/` |
| `widgets/` | `features/`, `shared/` | `app/`, other `widgets/`, `modules/`, `core/` |
| `features/` | `modules/`, `core/`, `shared/`, `@/types/payload-types` | Other Features, `app/`, `widgets/`, `payload/` |
| `modules/` | `core/`, `shared/lib`, `shared/types` | `features/`, `app/`, `widgets/`, `payload/`, other `modules/` |
| `payload/hooks/` | `modules/`, `core/`, `shared/` | `features/`, `app/`, `widgets/` |
| `payload/collections/` | `shared/types` only | Everything else |
| `core/` | `shared/types`, `shared/config` | Everything else |
| `shared/` | External Libraries Only | Everything else |

### Widgets Layer Rules

**Purpose**: Composite components that combine multiple features into reusable UI blocks.

**When to use `widgets/` vs `shared/ui/`**:
- Use `widgets/` when component needs to import from multiple features
- Use `shared/ui/` for dumb, primitive UI components

**Examples**:
- **Header**: Uses `CartButton` from `features/cart`, `UserMenu` from `features/auth`
- **Footer**: Uses `SubscribeForm` from `features/newsletter`
- **ProductGrid**: Reusable grid that composes `ProductCard` from `features/products`

```typescript
// widgets/header/Header.tsx
import { CartButton } from '@/features/cart'
import { UserMenu } from '@/features/auth'
import { Logo } from '@/shared/ui/logo'

export function Header() {
  return (
    <header>
      <Logo />
      <CartButton />
      <UserMenu />
    </header>
  )
}
```

### Pages/Widgets Composition Rules (The Golden Rule)

**Hierarchy**:
1. **Pages** (`app/`) = Primary composition layer (connect features)
2. **Widgets** = Secondary composition layer (reusable cross-feature components)
3. **Features** = NEVER compose other features (strict isolation)

**Rule**: Features cannot import from other features. Composition happens at page or widget level.

```typescript
// ✅ CORRECT - Page composes multiple features
// app/(storefront)/page.tsx
import { Hero } from '@/features/hero'
import { ProductShowcase } from '@/features/products'
import { Newsletter } from '@/features/newsletter'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductShowcase />
      <Newsletter />
    </>
  )
}

// ✅ CORRECT - Widget composes features
// widgets/header/Header.tsx
import { CartButton } from '@/features/cart'
import { AuthStatus } from '@/features/auth'

// ❌ WRONG - Feature composing another feature
// features/cart/ui/CartDrawer.tsx
import { CheckoutButton } from '@/features/checkout'  // FORBIDDEN!
```

### Features/ Rules
Each feature is a self-contained business unit:

```
src/features/[feature-name]/
├── README.md              # REQUIRED - Purpose, dependencies, API
├── feature.config.ts      # REQUIRED - Feature metadata
├── index.ts               # REQUIRED - Public API exports only
├── ui/
│   ├── _components/       # Private components (not exported)
│   └── [MainComponent].tsx
├── logic/
│   ├── use[Feature].ts    # Zustand store if needed
│   └── [feature].service.ts
├── actions/
│   └── [verb-noun].action.ts
├── db/
│   ├── schema.ts          # Payload Collection Config
│   ├── queries.ts
│   └── mutations.ts
├── tests/
│   ├── unit/
│   └── integration/
├── types.ts               # REQUIRED
├── constants.ts           # REQUIRED
└── utils.ts
```

**Feature Rules**:
- NO cross-feature imports - Features are strictly isolated
- Public API exported via `index.ts` only
- MUST register in `features/_registry/index.ts`
- MUST have README.md and feature.config.ts

### Module vs Feature Decision Tree

```
Is logic used by 2+ features?
├── YES → Is it pure business logic (no UI)?
│   ├── YES → MODULE
│   └── NO → Reconsider architecture
└── NO → Is it specific to one feature?
    ├── YES → FEATURE (keep in feature/)
    └── NO → Review requirements

Does it have UI components?
├── YES → FEATURE
└── NO → Could be MODULE if reusable
```

**Examples**:
- Tax calculation used by checkout and orders → `modules/orders/services/tax.service.ts`
- Cart state specific to cart feature → `features/cart/logic/useCart.ts`
- Payment processing used by checkout and admin → `modules/payments/services/payment.service.ts`

### Modules/ Rules
Pure business logic, UI-agnostic:

```
src/modules/[module-name]/
├── README.md
├── services/
│   └── [module].service.ts   # kebab-case, NOT PascalCase
├── lib/
│   └── [external-api].client.ts
├── validators/
│   └── validate-[x].ts    # Zod schemas
├── types.ts               # REQUIRED
├── index.ts               # REQUIRED
└── constants.ts
```

**Module Rules**:
- NO React components, hooks, or JSX
- NO imports from `features/`, `app/`, `widgets/`, `payload/`, other `modules/`
- CAN import from `core/`, `shared/lib`, `shared/types`
- Pure TypeScript/Node.js logic only

### Feature Registry Rules

**Registration (MANDATORY)**:
Every new feature MUST be registered in `features/_registry/index.ts`

```typescript
// features/_registry/index.ts
import { cartConfig } from '../cart/feature.config'
import { checkoutConfig } from '../checkout/feature.config'
import { newFeatureConfig } from '../new-feature/feature.config'

export const FEATURES = {
  'cart': cartConfig,
  'checkout': checkoutConfig,
  'new-feature': newFeatureConfig, // ← Add new features here
} as const

export const DISABLED_FEATURES = [
  'product-reviews', // Temporarily disabled
] as const

export function isFeatureEnabled(featureId: string): boolean {
  return featureId in FEATURES && 
         !DISABLED_FEATURES.includes(featureId as any)
}

// Usage
import { isFeatureEnabled } from '@/features/_registry'

if (isFeatureEnabled('cart')) {
  // Render cart components
}
```

### Payload/ Rules
```
src/payload/
├── collections/           # Global collections (Users, Products, Categories, Media)
├── globals/               # Global settings
├── hooks/                 # Logic hooks (beforeChange, afterChange)
├── access/                # Access control functions
└── admin/                 # Admin panel customization
    ├── components/
    ├── graphics/
    └── views/
```

**Payload Rules**:
- Core collections in `collections/`, feature collections in `features/[name]/db/schema.ts`
- Hooks can import from `modules/`, `core/`, `shared/`
- Hooks CANNOT import from `features/`, `app/`, `widgets/`
- Admin components can import from `features/` (for widgets) and `shared/`

### Shared/ Rules
```
src/shared/
├── ui/                    # shadcn/ui primitives (Button, Input, Sheet)
├── lib/                   # Utilities (cn, format, validators)
├── hooks/                 # Generic hooks (use-media-query, use-debounce)
├── config/                # Shared constants
└── types/                 # Shared types
```

**Shared Rules**:
- Dumb UI primitives only - NO business logic
- External libraries only - NO internal imports
- Generic, reusable utilities

---

## Database Schema Rules (Neon PostgreSQL)

### Database Technology
- **Platform**: Neon PostgreSQL (serverless Postgres)
- **Connection**: Connection pooling with PgBouncer
- **Scaling**: Automatic serverless scaling
- **Features**: pgvector support available for future AI features

### Neon-Specific Considerations
- Use connection string with `?pgbouncer=true` for pooling
- Handle connection limits gracefully
- Use transactions for atomic operations
- Enable automated backups (point-in-time recovery)

### Existing Core Tables (MUST NOT Change Fundamentally)
- **brands** - Dedicated brand collection (name, slug, logo, is_active)
- **categories** - Product categories only (2-level hierarchy, no brands)
- **products** - Main product information (brand_id → brands table)
- **product_categories** - Pivot table for Many-to-Many relationship
- **product_variants** - Product variations with stock_quantity (NO reserved_quantity)
- **variant_options** - Helper table for autocomplete
- **orders** - Order headers with 4 statuses: pending, processing, completed, cancelled
- **order_items** - Individual line items with snapshot fields (product_name, variant_name, unit_price)

### Required Tables for Server-Side Cart (Relational Model)

**carts**
- `id` (uuid): Primary Key
- `session_id` (text): Unique, foreign key to session
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `expires_at` (timestamp) - 24h from last activity (extends on each update)

**cart_items** (separate table — NOT embedded array)
- `id` (integer): Primary Key
- `cart_id` (uuid): Foreign Key to carts
- `variant_id` (integer): Foreign Key to product_variants
- `quantity` (integer): Quantity in cart (max 10)
- `price_at_add` (decimal): Price when item was added (for live price change detection)
- `added_at` (timestamp)
- UNIQUE constraint on (cart_id, variant_id)

### Critical Schema Rules
- **stock_quantity** field MUST exist on product_variants
- **session_id** foreign keys REQUIRED for cart-related tables
- **Foreign Key constraints** must be enforced at database level
- **Indexes** REQUIRED on: session_id, cart_id, variant_id, order_id
- Use **UUID for orders and carts** (security/scale)
- Use **integer for internal IDs** (products, variants)

### Database Queries Pattern

```typescript
// features/checkout/db/queries.ts
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/types/payload-types'

/**
 * Get order by ID
 */
export async function getOrder(id: string): Promise<Order | null> {
  const payload = await getPayloadClient()
  
  try {
    const order = await payload.findByID({
      collection: 'orders',
      id,
      overrideAccess: false, // Enforce access control
    })
    return order
  } catch (error) {
    return null
  }
}

/**
 * Get orders by session
 */
export async function getOrdersBySession(sessionId: string): Promise<Order[]> {
  const payload = await getPayloadClient()
  
  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      session_id: { equals: sessionId },
    },
    overrideAccess: false,
  })
  
  return docs
}

// features/checkout/db/mutations.ts
import type { CreateOrderData } from '../types'

/**
 * Create new order
 */
export async function createOrder(data: CreateOrderData): Promise<Order> {
  const payload = await getPayloadClient()
  
  const order = await payload.create({
    collection: 'orders',
    data,
    overrideAccess: false, // Enforce access control
  })
  
  return order
}
```

### Transaction Handling with Neon

```typescript
// modules/orders/services/order.service.ts
export class OrderService {
  async createOrderWithStockUpdate(data: CreateOrderData) {
    const payload = await getPayloadClient()
    
    // Payload v3 Transaction API
    const transactionID = await payload.db.beginTransaction()
    try {
      // Check stock
      const variant = await payload.findByID({
        collection: 'product_variants',
        id: data.variantId,
        req: { transactionID },
      })
      
      if (variant.stock_quantity < data.quantity) {
        await payload.db.rollbackTransaction(transactionID)
        throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK')
      }
      
      // Create order
      const order = await payload.create({
        collection: 'orders',
        data,
        req: { transactionID },
      })
      
      // Atomic stock decrement
      await payload.update({
        collection: 'product_variants',
        id: data.variantId,
        data: {
          stock_quantity: variant.stock_quantity - data.quantity,
        },
        req: { transactionID },
      })
      
      await payload.db.commitTransaction(transactionID)
      return order
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID)
      throw error
    }
  }
}
```

### Data Integrity
- Stock validation MUST check current stock_quantity before order creation
- Cart expiration REQUIRED (auto-cleanup old carts)
- Order status transitions must be validated (no direct pending → cancelled without processing)

---

## Testing & Quality Assurance

### Testing Framework
- **Vitest** for unit and integration tests
- **Testing Library** for React component tests
- **Playwright** for E2E testing

### File Naming
- `[file-name].test.ts` co-located with source
- Integration tests in `tests/integration/`

### Complete Unit Test Example

```typescript
// modules/orders/services/TaxService.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { TaxService } from './TaxService'

describe('TaxService', () => {
  let service: TaxService
  
  beforeEach(() => {
    service = new TaxService()
  })
  
  describe('calculate', () => {
    it('should calculate 15% VAT correctly', () => {
      expect(service.calculate(100)).toBe(15)
      expect(service.calculate(200)).toBe(30)
    })
    
    it('should round to 2 decimal places', () => {
      expect(service.calculate(99.99)).toBe(15.00)
    })
    
    it('should throw on negative amounts', () => {
      expect(() => service.calculate(-100)).toThrow('Amount must be positive')
    })
  })
})
```

### Complete Integration Test Example

```typescript
// features/cart/tests/integration/cart-flow.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCart } from '../../logic/useCart'

describe('Cart Flow', () => {
  beforeEach(() => {
    // Clear persisted state before each test
    localStorage.clear()
  })
  
  it('should add, update, and remove items', async () => {
    const { result } = renderHook(() => useCart())
    
    // Wait for hydration
    await waitFor(() => expect(result.current.isHydrated).toBe(true))
    
    // Add item
    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 100, quantity: 1 })
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.total).toBe(100)
    
    // Update quantity
    act(() => {
      result.current.updateQuantity('1', 3)
    })
    
    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.total).toBe(300)
    
    // Remove item
    act(() => {
      result.current.removeItem('1')
    })
    
    expect(result.current.items).toHaveLength(0)
  })
})
```

### Testing Server Actions

```typescript
// features/cart/actions/add-to-cart.action.test.ts
import { describe, it, expect, vi } from 'vitest'
import { addToCart } from './add-to-cart.action'
import * as sessionModule from '@/core/auth/session'

describe('addToCart Action', () => {
  it('should return error when unauthorized', async () => {
    vi.spyOn(sessionModule, 'verifySession').mockResolvedValue(null)
    
    const result = await addToCart({ productId: '1', quantity: 1 })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })
  
  it('should validate input with Zod', async () => {
    vi.spyOn(sessionModule, 'verifySession').mockResolvedValue({ 
      isAuthenticated: true, 
      sessionId: 'test-session' 
    })
    
    const result = await addToCart({ invalid: 'data' })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Validation error')
  })
})
```

### Testing Zustand Stores with Persist

```typescript
// features/cart/logic/useCart.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCart } from './useCart'
import { act } from '@testing-library/react'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useCart Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })
  
  it('should handle hydration correctly', async () => {
    const store = useCart.getState()
    
    // Initially not hydrated
    expect(store.isHydrated).toBe(false)
    
    // Wait for persist middleware
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(useCart.getState().isHydrated).toBe(true)
  })
})
```

### What to Test (Priority Order)
1. **Module Services** (unit tests - MANDATORY)
2. **Validators** (unit tests - MANDATORY)
3. **Feature Flows** (integration tests - RECOMMENDED)
4. **UI Components** (optional)

---

## Environment Variables

### Complete core/config/env.ts Structure

```typescript
// core/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database - Neon PostgreSQL
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  
  // Payload
  PAYLOAD_SECRET: z.string().min(32),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
  
  // Authentication
  SESSION_SECRET: z.string().min(32),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Optional with defaults
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

/**
 * Validated environment variables
 * Throws error on startup if validation fails
 */
export const env = envSchema.parse(process.env)

// Type inference
export type Env = z.infer<typeof envSchema>
```

### Handling Optional vs Required Variables

```typescript
// For truly optional vars with defaults
const schema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  
  // Optional with default
  CACHE_TTL: z.string().default('3600'),
  
  // Optional (can be undefined)
  SENTRY_DSN: z.string().url().optional(),
  
  // Conditional based on NODE_ENV
  STRIPE_SECRET_KEY: z.string().optional().refine(
    (val) => process.env.NODE_ENV === 'development' || val,
    { message: 'Required in production' }
  ),
})
```

### Access Pattern

```typescript
// ✅ CORRECT - Use validated env
import { env } from '@/core/config/env'

const apiKey = env.PAYLOAD_SECRET

// ❌ WRONG - Direct access (no validation)
const apiKey = process.env.PAYLOAD_SECRET
```

---

## UI & Performance Rules

### Styling Framework
- **Tailwind CSS** + **shadcn/ui** only
- Use `cn()` helper for conditional classes
- **NO inline styles, CSS modules, styled-components, or emotion**

### cn() Helper Details

**Location**: `shared/lib/cn.ts`

**Implementation**:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage Examples**:
```typescript
import { cn } from '@/shared/lib/cn'

function Button({ variant, size, className, children }) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium",
        
        // Variant styles
        variant === "primary" && "bg-primary text-white hover:bg-primary/90",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        
        // Size styles
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4",
        size === "lg" && "h-12 px-6",
        
        // Allow overrides (must be last)
        className
      )}
    >
      {children}
    </button>
  )
}
```

### Placeholder-First Development
- Always implement placeholder/loading states first
- Skeleton screens for async data
- Error boundaries with fallback UI

### Mobile-First Responsive Design
- Default to mobile viewport in styling
- Progressive enhancement for larger screens
- Touch-friendly targets (min 44px)

### Accessibility (A11y)
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Color contrast compliance (WCAG 2.1 AA)

### Brand Colors Semantic Naming

**Tailwind Config**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#657f66',
          foreground: '#ffffff',
          50: '#f2f5f2',
          100: '#e1e8e1',
          // ... scale
        },
        accent: {
          DEFAULT: '#f8b97e',
          foreground: '#1a1a1a',
        },
        background: '#0a0a0a',
        foreground: '#ffffff',
      }
    }
  }
}
```

**Usage Guidelines**:
- **Primary (#657f66)**: Buttons, primary actions, headers, active states
- **Accent (#f8b97e)**: Highlights, CTAs, badges, special offers
- **Text (#ffffff)**: Primary text on dark backgrounds
- **Dark Mode**: Default dark theme with high contrast

### Performance Requirements
- Use `next/image` for all images with proper sizing and placeholder="blur"
- Dynamic imports for heavy components: `dynamic(() => import('./HeavyChart'), { ssr: false })`
- Server Components by default
- Caching via `unstable_cache` for expensive queries
- Bundle size optimization - avoid moment.js, use date-fns or native Intl

### Caching Strategy Details

**When to use unstable_cache** (expensive queries, static data):
```typescript
import { unstable_cache } from 'next/cache'

const getCachedProducts = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return payload.find({ collection: 'products' })
  },
  ['products-list'],
  { revalidate: 3600, tags: ['products'] }
)
```

**When to use React cache** (deduplication within request):
```typescript
import { cache } from 'react'

export const getProduct = cache(async (id: string) => {
  const payload = await getPayloadClient()
  return payload.findByID({ collection: 'products', id })
})

// Multiple calls in same request = single database query
```

**Cache Key Strategies**:
- Use descriptive keys: `['products', category, page]`
- Include version for breaking changes: `['v2', 'products']`
- Tag for invalidation: `{ tags: ['products', `product-${id}`] }`

**Revalidation Patterns**:
```typescript
// Time-based revalidation
{ revalidate: 3600 } // 1 hour

// On-demand revalidation
import { revalidateTag } from 'next/cache'
revalidateTag('products') // Clear all product caches
```

### Animation Guidelines
- Use Framer Motion for transitions and micro-interactions
- Respect `prefers-reduced-motion` media query
- Keep animations under 300ms for responsiveness
- Hardware-accelerated properties only (transform, opacity)

---

## Zustand State Management

### Cart UI State (CRITICAL: UI-Only, No Item Data)

**Rule**: The cart is **100% server-side** (database-backed). Zustand is used ONLY for UI state (drawer open/close, loading indicators). Cart item data is NEVER stored in Zustand or localStorage.

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

// NO items[], NO total, NO persist middleware, NO localStorage
```

```typescript
// Usage in component — cart data comes from server
'use client'

import { useCart } from '@/features/cart'

export function CartDrawer({ items, total }: CartDrawerProps) {
  const { isDrawerOpen, closeDrawer, isLoading } = useCart()
  
  // items and total are passed as props from Server Component
  // or fetched via server action, NOT from Zustand
  return (
    <Sheet open={isDrawerOpen} onOpenChange={closeDrawer}>
      {isLoading ? <CartSkeleton /> : (
        <div>
          {items.map(item => <CartItem key={item.id} {...item} />)}
          <div>Total: {formatUSD(total)}</div>
        </div>
      )}
    </Sheet>
  )
}
```

### Zustand Hydration Fix (For Other Stores)

If other features use Zustand with persist middleware, apply the hydration fix pattern:

```typescript
// Generic pattern for persisted stores (NOT for cart)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePersistedStore = create<StoreType>()(
  persist(
    (set) => ({
      isHydrated: false,
      // ... store state
    }),
    {
      name: 'store-key',
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true
      },
    }
  )
)
```

### Server State
- **Server Components** (Default for Next.js 14+)
- **React Query** (TanStack Query) - if needed for caching

### State Rules:
- ✅ State lives in `features/[name]/logic/`
- ❌ NO global state in `shared/`
- ✅ Use Zustand persist for localStorage
- ✅ Prefer Server Components over client state when possible

---

## Payload CMS Rules

### Collections Location

1. **Core Collections** (Users, Products, Categories, Media):
   - Location: `src/payload/collections/`
   - Shared across all features

2. **Feature Collections** (Orders, Reviews, AgeVerifications):
   - Location: `src/features/[name]/db/schema.ts`
   - Imported in `payload.config.ts`



### Payload Hooks Complete Examples

**beforeChange Hook**:
```typescript
// payload/hooks/beforeChange/calculate-tax.ts
import type { CollectionBeforeChangeHook } from 'payload/types'
import { TaxService } from '@/modules/orders'
import { Logger } from '@/core/logger'

export const calculateTax: CollectionBeforeChangeHook = async ({
  data,        // Document data being saved
  req,         // Payload request object (contains user, locale)
  operation,   // 'create' | 'update'
  originalDoc, // Original document (for updates)
}) => {
  const logger = new Logger()
  const taxService = new TaxService()
  
  // Access current user
  const user = req.user
  
  // Access locale
  const locale = req.locale
  
  logger.info('Calculating tax', { 
    operation, 
    user: user?.email,
    subtotal: data.subtotal 
  })
  
  data.tax = taxService.calculate(data.subtotal)
  data.total = data.subtotal + data.tax
  
  return data
}
```

**afterChange Hook**:
```typescript
// payload/hooks/afterChange/sync-to-external.ts
import type { CollectionAfterChangeHook } from 'payload/types'

export const syncToExternal: CollectionAfterChangeHook = async ({
  doc,         // Saved document
  req,         // Payload request
  operation,   // 'create' | 'update' | 'delete'
  previousDoc, // Previous document state
}) => {
  if (operation === 'create') {
    // Handle new document
    await externalApi.create(doc)
  } else if (operation === 'update') {
    // Handle update
    await externalApi.update(doc.id, doc)
  } else if (operation === 'delete') {
    // Handle deletion
    await externalApi.delete(previousDoc.id)
  }
}
```

**Hook Rules**:
- ✅ CAN import from `modules/`
- ✅ CAN import from `core/`
- ✅ CAN import from `shared/`
- ❌ CANNOT import from `features/`
- ❌ CANNOT import from other hooks
- ❌ CANNOT import from `app/`

---

## Session-based Cart Rules

### Cart-Session Relationship
- Cart linked to session via `session_id` foreign key
- Anonymous users supported (no user accounts)
- Cart persisted server-side only

### Cart Persistence Strategy (Relational Model)

**Architecture**: Two separate Payload collections — `carts` and `cart_items` (NOT embedded array).

```typescript
// features/cart/db/schema.ts
export const Carts: CollectionConfig = {
  slug: 'carts',
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
      defaultValue: () => {
        const date = new Date()
        date.setHours(date.getHours() + 24)
        return date
      },
    },
  ],
}

export const CartItems: CollectionConfig = {
  slug: 'cart_items',
  fields: [
    { name: 'cart', type: 'relationship', relationTo: 'carts', required: true },
    { name: 'variant', type: 'relationship', relationTo: 'product_variants', required: true },
    { name: 'quantity', type: 'number', required: true, min: 1, max: 10 },
    { name: 'price_at_add', type: 'number', required: true, min: 0 },
  ],
}
```

### Cart Operations (Relational)

```typescript
// features/cart/db/queries.ts
export async function getCartBySession(sessionId: string): Promise<Cart | null> {
  const payload = await getPayloadClient()
  
  const { docs } = await payload.find({
    collection: 'carts',
    where: {
      session_id: { equals: sessionId },
      expires_at: { greater_than: new Date() },
    },
  })
  
  return docs[0] || null
}

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  const payload = await getPayloadClient()
  
  const { docs } = await payload.find({
    collection: 'cart_items',
    where: { cart: { equals: cartId } },
    depth: 2, // Populate variant → product relationships
  })
  
  return docs
}

// features/cart/db/mutations.ts
export async function addItemToCart(
  sessionId: string,
  variantId: string,
  quantity: number,
  currentPrice: number
): Promise<CartItem> {
  const payload = await getPayloadClient()
  
  // Get or create cart
  let cart = await getCartBySession(sessionId)
  if (!cart) {
    cart = await payload.create({
      collection: 'carts',
      data: {
        session_id: sessionId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
  }
  
  // Check if variant already in cart
  const { docs: existing } = await payload.find({
    collection: 'cart_items',
    where: {
      cart: { equals: cart.id },
      variant: { equals: variantId },
    },
  })
  
  if (existing.length > 0) {
    // Update quantity (cap at MAX_QUANTITY = 10)
    const newQty = Math.min(existing[0].quantity + quantity, 10)
    return await payload.update({
      collection: 'cart_items',
      id: existing[0].id,
      data: { quantity: newQty },
    })
  }
  
  // Add new item
  const item = await payload.create({
    collection: 'cart_items',
    data: {
      cart: cart.id,
      variant: variantId,
      quantity,
      price_at_add: currentPrice,
    },
  })
  
  // Extend cart expiration
  await payload.update({
    collection: 'carts',
    id: cart.id,
    data: { expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  })
  
  return item
}
```

### Live Price Change Detection

```typescript
// features/cart/logic/cart.service.ts
export function detectPriceChanges(
  cartItems: CartItemWithVariant[]
): PriceChange[] {
  return cartItems
    .filter(item => item.price_at_add !== item.variant.price)
    .map(item => ({
      variantId: item.variant.id,
      variantName: item.variant.variantName,
      oldPrice: item.price_at_add,
      newPrice: item.variant.price,
    }))
}
// Display notification banner if priceChanges.length > 0
```

---

## COD-Specific Order Flow Rules

### Order Status Transitions
```
pending → processing → completed
   ↓          ↓
cancelled  cancelled
```

**Allowed Transitions**:
- `pending` → `processing` (admin confirms order)
- `pending` → `cancelled` (customer or admin cancels)
- `processing` → `completed` (order delivered)
- `processing` → `cancelled` (order cancelled during processing)

**FORBIDDEN Transitions**:
- `completed` → any state (final state)
- `cancelled` → any state (final state)
- `pending` → `completed` (must go through processing)

### Order Validation Rules
- **NO payment validation required** (COD only)
- Stock MUST be validated at order creation
- Customer info MUST include: name, phone, address
- Minimum order amount MUST be enforced

### Order Confirmation Flow
1. Customer submits checkout form
2. System validates stock and creates order (status: `pending`)
3. Admin reviews order in Payload admin
4. Admin marks as `processing` and prepares shipment
5. Upon delivery, admin marks as `completed`

### Cancellation Rules
- Customers can cancel orders in `pending` status only
- Admin can cancel orders in `pending` or `processing` status
- Cancellation reason MUST be logged
- Stock MUST be returned to inventory on cancellation

```typescript
// modules/orders/services/order.service.ts
export class OrderService {
  async cancelOrder(orderId: string, reason: string, cancelledBy: 'customer' | 'admin') {
    const payload = await getPayloadClient()
    
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
    })
    
    // Validate status allows cancellation
    if (order.status === 'completed') {
      throw new AppError('Cannot cancel completed order', 400, 'INVALID_STATUS')
    }
    
    if (order.status === 'cancelled') {
      throw new AppError('Order already cancelled', 400, 'ALREADY_CANCELLED')
    }
    
    // Return stock to inventory
    for (const item of order.items) {
      await this.returnStockToInventory(item.variant_id, item.quantity)
    }
    
    // Update order status
    return await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date(),
      },
    })
  }
}
```

---

## Production Rules

### Session Management Rules

**Implementation**:
```typescript
// core/auth/session.ts
import { cookies } from 'next/headers'
import { encrypt, decrypt } from './encryption'

const SESSION_DURATION = 24 * 60 * 60 * 1000       // 24 hours (default)
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function createSession(sessionId: string, rememberMe: boolean = false) {
  const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION
  const expires = new Date(Date.now() + duration)
  const session = await encrypt({ sessionId, isAuthenticated: true, expires })
  
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
```

**Requirements**:
- Stateless JWT in HTTP-Only cookies
- Default expiration: 24 hours
- "Remember Me" expiration: 30 days
- Secure flag in production
- SameSite: 'lax' protection

### Rate Limiting Rules

**Implementation**:
```typescript
// core/rate-limit.ts
import { LRUCache } from 'lru-cache'

type RateLimitConfig = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(config: RateLimitConfig) {
  const tokenCache = new LRUCache({
    max: config.uniqueTokenPerInterval || 500,
    ttl: config.interval || 60000,
  })

  return {
    check: (token: string, limit: number) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0]
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1])
      } else {
        tokenCount[0] += 1
        tokenCache.set(token, tokenCount)
      }
      
      if (tokenCount[0] > limit) {
        throw new Error('Rate limit exceeded')
      }
    },
  }
}

// Usage
const passwordLimiter = rateLimit({ interval: 60 * 1000 }) // 1 minute
const cartLimiter = rateLimit({ interval: 60 * 1000 })
const checkoutLimiter = rateLimit({ interval: 60 * 1000 })

// Password attempts: 5 per minute per IP
export async function verifyPassword(req: NextRequest) {
  const ip = req.ip ?? 'anonymous'
  passwordLimiter.check(ip, 5)
  // ... verify password
}

// Cart updates: 20 per minute per session
export async function updateCartAction(sessionId: string) {
  cartLimiter.check(sessionId, 20)
  // ... update cart
}

// Checkout: 3 per minute per session
export async function processCheckoutAction(sessionId: string) {
  checkoutLimiter.check(sessionId, 3)
  // ... process checkout
}
```

**Limits**:
- Password attempts: 5 per minute per IP
- Cart updates: 20 per minute per session
- Checkout: 3 per minute per session

### Cart Lifecycle Management

**Expiration**: 24 hours from last activity

**Automatic Cleanup**:
```typescript
// app/api/cron/cleanup-carts/route.ts
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const payload = await getPayloadClient()
  
  // Find and delete expired carts
  const expiredCarts = await payload.find({
    collection: 'carts',
    where: {
      expires_at: { less_than: new Date() },
    },
  })
  
  for (const cart of expiredCarts.docs) {
    // Delete cart
    await payload.delete({
      collection: 'carts',
      id: cart.id,
    })
  }
  
  return NextResponse.json({ 
    cleaned: expiredCarts.docs.length 
  })
}
```

**Cleanup Frequency**: Every 6 hours via cron job

### Stock Validation Pattern (Direct Decrement Model)

**Race Condition Prevention** — No reserved_quantity, stock is decremented atomically at order creation:
```typescript
```typescript
// modules/orders/services/stock.service.ts
export class StockService {
  async decrementStock(variantId: string, quantity: number, transactionID?: string): Promise<boolean> {
    const payload = await getPayloadClient()
    
    // If no external transaction, create one
    const txId = transactionID ?? await payload.db.beginTransaction()
    try {
      // Read within transaction (serializable isolation prevents race conditions)
      const variant = await payload.findByID({
        collection: 'product_variants',
        id: variantId,
        req: { transactionID: txId },
      })
      
      if (variant.stock_quantity < quantity) {
        if (!transactionID) await payload.db.rollbackTransaction(txId)
        return false // Insufficient stock
      }
      
      // Atomic decrement
      await payload.update({
        collection: 'product_variants',
        id: variantId,
        data: {
          stock_quantity: variant.stock_quantity - quantity,
        },
        req: { transactionID: txId },
      })
      
      if (!transactionID) await payload.db.commitTransaction(txId)
      return true
    } catch (error) {
      if (!transactionID) await payload.db.rollbackTransaction(txId)
      throw error
    }
  }
  
  async returnStock(variantId: string, quantity: number): Promise<void> {
    const payload = await getPayloadClient()
    const variant = await payload.findByID({
      collection: 'product_variants',
      id: variantId,
    })
    await payload.update({
      collection: 'product_variants',
      id: variantId,
      data: { stock_quantity: variant.stock_quantity + quantity },
    })
  }
}
```

**Transaction Handling (Payload v3 API)**:
- Use `payload.db.beginTransaction()` → returns `transactionID`
- Pass `req: { transactionID }` to ALL operations within the transaction
- Commit: `payload.db.commitTransaction(transactionID)`
- Rollback: `payload.db.rollbackTransaction(transactionID)`
- PostgreSQL serializable isolation prevents race conditions
- Explicit `SELECT FOR UPDATE` row locks NOT needed at current traffic levels

**Out-of-Stock Error Handling**:
```typescript
if (!await stockService.reserveStock(variantId, quantity)) {
  return {
    success: false,
    error: 'Insufficient stock',
    code: 'OUT_OF_STOCK',
    variantId,
    availableStock: await getCurrentStock(variantId),
  }
}
```

### Error Logging & Monitoring

**Production Error Tracking**:
```typescript
// core/logger/index.ts
import * as Sentry from '@sentry/nextjs'

export class Logger {
  error(error: Error, context?: Record<string, unknown>) {
    console.error(error, context)
    
    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: this.sanitizeContext(context),
      })
    }
  }
  
  private sanitizeContext(context?: Record<string, unknown>) {
    if (!context) return {}
    
    // Mask sensitive data
    const sanitized = { ...context }
    delete sanitized.password
    delete sanitized.creditCard
    delete sanitized.cvv
    
    if (sanitized.email) {
      sanitized.email = this.maskEmail(sanitized.email as string)
    }
    
    return sanitized
  }
  
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    return `${local.charAt(0)}***@${domain}`
  }
}
```

**Sensitive Data Masking**:
- Never log passwords, credit cards, CVV
- Mask email addresses (a***@domain.com)
- Mask phone numbers (last 4 digits only)

**Performance Monitoring**:
```typescript
// Track slow queries
const start = performance.now()
const result = await expensiveQuery()
const duration = performance.now() - start

if (duration > 1000) {
  logger.warn('Slow query detected', { duration, query: '...' })
}
```

### Backup & Disaster Recovery (Neon)

**Neon Automated Backups**:
- Point-in-time recovery available
- Default retention: 7 days
- Configurable up to 30 days

**Backup Strategy**:
1. **Automated**: Neon handles continuous backups
2. **Manual**: Export critical data weekly
3. **Testing**: Restore from backup monthly to verify

**Recovery Procedures**:
```bash
# Restore to point in time via Neon dashboard or API
# Recovery time: typically under 5 minutes
```

**Testing Schedule**:
- Monthly restore tests
- Quarterly disaster recovery drills

### Deployment Checklist

**Pre-Deployment Checks**:
- [ ] All tests passing (unit + integration + E2E)
- [ ] TypeScript strict mode: no errors
- [ ] Build completes successfully
- [ ] No console errors in development

**Security Checklist**:
- [ ] Environment variables validated
- [ ] Rate limiting enabled
- [ ] Session configuration secure
- [ ] CORS configured correctly
- [ ] No sensitive data in logs

**Performance Checklist**:
- [ ] Images optimized with next/image
- [ ] Bundle size analyzed
- [ ] Caching strategy implemented
- [ ] Database indexes verified
- [ ] CDN configured for static assets

**Monitoring Checklist**:
- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring enabled
- [ ] Health check endpoint implemented
- [ ] Alerting rules configured
- [ ] Log aggregation set up

### Development Workflow

**Local Setup Steps**:
1. Clone repository
2. Copy `.env.example` to `.env` and fill values
3. Run `npm install`
4. Start Neon PostgreSQL (or use connection string)
5. Run migrations: `npm run migrate`
6. Seed database: `npm run seed`
7. Start dev server: `npm run dev`

**Git Workflow**:
- Main branch: `main` (production)
- Feature branches: `feature/[feature-name]`
- Hotfix branches: `hotfix/[description]`
- Pull requests required for all changes
- Squash merge preferred

**Code Review Requirements**:
- [ ] Constitution rules followed
- [ ] Tests included
- [ ] README.md updated (if needed)
- [ ] No console.log statements
- [ ] TypeScript strict mode passes

**Pre-Commit Checklist**:
- [ ] No cross-feature imports
- [ ] No deep imports (using index.ts)
- [ ] Path aliases used (`@/`)
- [ ] All types explicit
- [ ] Zod validation for inputs
- [ ] Try-catch in server actions
- [ ] JSDoc on public functions
- [ ] README.md exists (for features/modules)
- [ ] Tests written (for services/validators)
- [ ] Registered in `_registry/` (for new features)

---

## Git Commit Standards

### Format

`[scope]: brief description`

### Scopes

- `[feature-name]`: For feature changes (e.g., `[cart]`, `[checkout]`)
- `[module-name]`: For module changes (e.g., `[orders]`, `[payments]`)
- `[core]`: For infrastructure changes
- `[shared]`: For shared utilities
- `[project]`: For project-wide changes

### Examples

**✅ CORRECT**:
```bash
[cart]: add remove item functionality
[checkout]: fix tax calculation rounding error
[orders]: integrate with admin panel
[core]: update logger to support structured logging
[shared]: add formatSAR currency helper
[project]: upgrade to Next.js 15
```

**❌ WRONG**:
```bash
fix bug                    # No scope, too vague
update code                # Meaningless
changes                    # No information
[cart] stuff               # Not descriptive
update checkout            # No scope bracket
```

### Commit Message Body (Optional but Recommended)

```bash
[checkout]: fix tax calculation rounding error

Tax was being calculated incorrectly due to floating point
precision issues. Now using Math.round() to ensure 2 decimal
places as required by regulations.

Fixes #123
```

---

## Governance

### Amendment Procedure
1. Proposed changes must be reviewed against existing code
2. Updates require version bump following semver:
   - MAJOR: Backward incompatible rule changes
   - MINOR: New sections or expanded guidance
   - PATCH: Clarifications, wording, typo fixes
3. Sync Impact Report must document all changes
4. All dependent templates must be updated

### Compliance Review
- Monthly review of constitution adherence
- Automated linting where possible
- Code review checklist includes constitution rules
- Violations block merge

### Version History
- **v1.0.0** (2026-02-15): Initial constitution based on project requirements
- **v1.1.0** (2026-02-16): Added 20+ missing rules, security updates (Next.js 15 CVE-2025-29927), Neon PostgreSQL migration, authentication DAL pattern, production sections
- **v1.2.0** (2026-02-17): Aligned with plan.md v2.0.0 — dedicated Brands collection, relational cart schema (no embedded arrays), UI-only Zustand (no cart items in localStorage), Direct Decrement stock model (no reserved_quantity), Remember Me (30-day session), fixed stock validation syntax error
- **v1.3.0** (2026-02-17): Audit fix alignment with plan.md v2.1.0 — fixed transaction API to Payload v3 pattern (beginTransaction/commitTransaction/rollbackTransaction), added getPayloadClient wrapper documentation, updated transaction handling notes
- **v1.4.0** (2026-02-17): Second-pass audit alignment with plan.md v2.2.0 — added PascalCase exception for .tsx component files, variant_options table now in plan.md schema, version references updated
