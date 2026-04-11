# Module Template

> Use this template when creating a **new module** in the `src/modules/` directory.
> A module is **pure business logic** shared by 2+ features. It has NO UI, NO React, NO JSX.

---

## Pre-Creation Checklist

- [ ] Module name is kebab-case (e.g., `catalog`, `orders`, `payments`)
- [ ] Is this truly a module? (Pure logic, no UI, used by 2+ features → YES = Module)
- [ ] No duplicate logic exists in another module
- [ ] Consumers identified (which features will call this module?)

---

## Folder Structure

```
src/modules/[module-name]/
├── README.md              # REQUIRED — Purpose, consumers, API surface
├── index.ts               # REQUIRED — Public API exports ONLY
├── services/
│   └── [module].service.ts        # kebab-case (e.g., product.service.ts)
├── validators/
│   └── validate-[entity].ts       # Zod schemas (e.g., validate-order.ts)
├── lib/                           # Optional — external API clients
│   └── [external-api].client.ts
├── types.ts               # REQUIRED — Module-specific types
└── constants.ts           # Optional — Module constants
```

---

## Required Files

### 1. `index.ts` (Public API)

```typescript
// Public services
export { ProductService } from './services/product.service'
export { CategoryService } from './services/category.service'

// Public validators
export { validateProduct } from './validators/validate-product'

// Public types
export type { CreateProductData, UpdateProductData } from './types'

// NEVER export internal helpers or private logic
```

### 2. Service Template (`services/[module].service.ts`)

```typescript
// services/[module].service.ts
import { getPayloadClient } from '@/lib/payload'
import { Logger } from '@/core/logger'
import { AppError } from '@/core/errors/app-error'
import type { PayloadTypes } from '@/types/payload-types'

/**
 * [Module] Service
 *
 * Handles [brief description of what this service does].
 * Used by: features/[feature-1], features/[feature-2]
 */
export class ModuleService {
  private logger = new Logger()

  /**
   * Get paginated items
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default: 12)
   */
  async getItems(page: number = 1, limit: number = 12) {
    const payload = await getPayloadClient()

    return await payload.find({
      collection: 'collection_slug',
      where: { is_active: { equals: true } },
      page,
      limit,
      sort: '-created_at',
      overrideAccess: false,
    })
  }

  /**
   * Create item with validation
   * @throws {AppError} If validation fails or item already exists
   */
  async create(data: CreateData): Promise<ItemType> {
    const payload = await getPayloadClient()

    try {
      return await payload.create({
        collection: 'collection_slug',
        data,
        overrideAccess: false,
      })
    } catch (error) {
      this.logger.error(error as Error, 'Failed to create item')
      throw new AppError('Failed to create item', 500, 'CREATE_FAILED')
    }
  }
}
```

### 3. Service with Transactions (`services/[module].service.ts`)

```typescript
/**
 * Atomic operation with Payload v3 Transaction API
 *
 * IMPORTANT:
 * - Use payload.db.beginTransaction() → returns transactionID
 * - Pass req: { transactionID } to ALL operations in the transaction
 * - Commit: payload.db.commitTransaction(transactionID)
 * - Rollback: payload.db.rollbackTransaction(transactionID)
 */
async createWithTransaction(data: CreateData): Promise<ResultType> {
  const payload = await getPayloadClient()
  const transactionID = await payload.db.beginTransaction()

  try {
    // Step 1: Validate preconditions
    const item = await payload.findByID({
      collection: 'items',
      id: data.itemId,
      req: { transactionID },
    })

    if (!item) {
      await payload.db.rollbackTransaction(transactionID)
      throw new AppError('Item not found', 404, 'NOT_FOUND')
    }

    // Step 2: Perform mutation
    const result = await payload.create({
      collection: 'results',
      data: { ...data },
      req: { transactionID },
    })

    // Step 3: Update related records
    await payload.update({
      collection: 'items',
      id: data.itemId,
      data: { status: 'processed' },
      req: { transactionID },
    })

    // Commit
    await payload.db.commitTransaction(transactionID)
    return result

  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    this.logger.error(error as Error, 'Transaction failed')
    throw error
  }
}
```

### 4. Validator Template (`validators/validate-[entity].ts`)

```typescript
// validators/validate-[entity].ts
import { z } from 'zod'

/**
 * Schema for creating a new [entity]
 */
export const createEntitySchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  // Add fields as needed
})

/**
 * Schema for updating an existing [entity]
 */
export const updateEntitySchema = createEntitySchema.partial()

/**
 * Validate and parse create data
 * @throws {ZodError} If validation fails
 */
export function validateCreateEntity(data: unknown) {
  return createEntitySchema.parse(data)
}

// Export inferred types
export type CreateEntityData = z.infer<typeof createEntitySchema>
export type UpdateEntityData = z.infer<typeof updateEntitySchema>
```

### 5. `types.ts`

```typescript
// Module-specific types
// Use 'interface' for expandable shapes, 'type' for unions/primitives

export interface CreateItemData {
  name: string
  description?: string
}

export interface UpdateItemData {
  name?: string
  description?: string
}

export type ItemStatus = 'active' | 'inactive' | 'archived'
```

### 6. `README.md`

```markdown
# [Module Name] Module

## Purpose
[One paragraph describing the business logic this module encapsulates]

## Consumers
| Feature/Layer | Usage |
|---|---|
| `features/[feature-1]` | [how it uses this module] |
| `features/[feature-2]` | [how it uses this module] |
| `payload/hooks/` | [if used by hooks] |

## Public API
| Export | Type | Description |
|---|---|---|
| `ModuleService` | Class | [description] |
| `validateEntity` | Function | [description] |
| `CreateEntityData` | Type | [description] |

## Dependencies
- `core/logger` — Error logging
- `core/errors` — AppError hierarchy
- `shared/lib` — Utility functions

## Notes
- [Important implementation details]
- [Performance considerations]
- [Edge cases to be aware of]
```

---

## Import Rules Reminder

```typescript
// ✅ ALLOWED imports for modules
import { Logger } from '@/core/logger'                 // Core
import { AppError } from '@/core/errors/app-error'     // Core errors
import { getPayloadClient } from '@/lib/payload'       // Payload client
import { formatUSD } from '@/shared/lib/format'        // Shared lib
import type { Product } from '@/types/payload-types'   // Payload types

// ❌ FORBIDDEN imports for modules
import { CartDrawer } from '@/features/cart'           // Features
import { Header } from '@/widgets/header'              // Widgets
import { Page } from '@/app/some-page'                 // App layer
import { Products } from '@/payload/collections/products'  // Payload collections
import { OtherService } from '@/modules/other-module'  // Other modules
```

---

## Error Handling Pattern

```typescript
// Modules throw AppError — features/actions catch them
import { AppError } from '@/core/errors/app-error'

// Throw specific errors with codes
throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK')
throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
throw new AppError('Invalid status transition', 422, 'INVALID_TRANSITION')

// NEVER return { success, error } from modules
// That pattern is for Server Actions only
```

---

## Final Checklist

- [ ] All files use **kebab-case** (`product.service.ts`, NOT `ProductService.ts`)
- [ ] `index.ts`, `types.ts`, `README.md` all created
- [ ] Public API in `index.ts` — no deep imports
- [ ] NO React, JSX, hooks, or UI code anywhere
- [ ] NO imports from `features/`, `app/`, `widgets/`, `payload/`, other `modules/`
- [ ] Services throw `AppError` (not return `{ success, error }`)
- [ ] Transactions use Payload v3 API (`beginTransaction`/`commitTransaction`/`rollbackTransaction`)
- [ ] All public functions have JSDoc comments
- [ ] `overrideAccess: false` for user-facing operations
- [ ] Tests written for service methods
