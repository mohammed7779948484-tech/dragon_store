# Feature Template

> Use this template when creating a **new feature** in the `src/features/` directory.
> A feature is a self-contained business unit with its own UI, actions, logic, and data layer.

---

## Pre-Creation Checklist

- [ ] Feature name is kebab-case (e.g., `order-tracking`, `product-reviews`)
- [ ] Is this truly a feature? (Has UI? → YES = Feature. Pure logic used by 2+ features? → Module instead)
- [ ] No duplicate logic exists in another feature
- [ ] Dependencies identified (which modules does this feature call?)

---

## Folder Structure

```
src/features/[feature-name]/
├── README.md              # REQUIRED — Purpose, dependencies, public API
├── feature.config.ts      # REQUIRED — Feature metadata
├── index.ts               # REQUIRED — Public API exports ONLY
├── ui/
│   ├── [MainComponent].tsx        # PascalCase for .tsx files
│   └── _components/               # Private components (NOT exported)
│       └── [SubComponent].tsx
├── actions/
│   └── [verb-noun].action.ts      # e.g., add-to-cart.action.ts
├── logic/
│   ├── use-[feature].ts           # Zustand store (UI state ONLY)
│   └── [feature].service.ts       # Feature-level business logic
├── db/
│   ├── schema.ts                  # Payload Collection Config (if feature owns a collection)
│   ├── queries.ts                 # Read operations
│   └── mutations.ts               # Write operations
├── types.ts               # REQUIRED — Feature-specific types/interfaces
├── constants.ts           # REQUIRED — Feature constants (UPPER_SNAKE_CASE)
└── tests/
    ├── unit/
    └── integration/
```

---

## Required Files

### 1. `feature.config.ts`

```typescript
import type { FeatureConfig } from '@/features/_registry/types'

export const [featureName]Config: FeatureConfig = {
  id: '[feature-name]',
  name: '[Feature Display Name]',
  description: '[Brief description of what this feature does]',
  dependencies: [], // e.g., ['modules/catalog', 'modules/orders']
  hasCollection: false, // true if this feature owns a Payload collection
  hasMiddleware: false, // true if this feature needs middleware
}
```

### 2. `index.ts` (Public API)

```typescript
// Public UI components
export { MainComponent } from './ui/MainComponent'

// Public hooks/stores (if any)
export { useFeatureName } from './logic/use-[feature]'

// Public types
export type { FeatureType } from './types'

// NEVER export _components — they are private
// NEVER export actions — they are called directly by the app layer
```

### 3. `README.md`

```markdown
# [Feature Name]

## Purpose
[One paragraph describing what this feature does]

## Dependencies
- `modules/[x]` — [why]

## Public API
| Export | Type | Description |
|---|---|---|
| `MainComponent` | Component | [description] |
| `useFeatureName` | Hook | [description] |

## Collections Owned
- `[collection_name]` — [description] (or "None")

## Notes
- [Any important implementation notes]
```

### 4. `types.ts`

```typescript
// Feature-specific types and interfaces
// Use 'interface' for expandable object shapes
// Use 'type' for unions, primitives, intersections

export interface FeatureItem {
  id: string
  // ...
}

export type FeatureStatus = 'active' | 'inactive'
```

### 5. `constants.ts`

```typescript
// Feature constants — UPPER_SNAKE_CASE
export const MAX_ITEMS = 10
export const FEATURE_CACHE_TTL = 60 * 5 // 5 minutes
```

---

## Server Action Template

```typescript
// actions/[verb-noun].action.ts
'use server'

import { z } from 'zod'
import { Logger } from '@/core/logger'
import { verifySession } from '@/core/auth/dal'
import { SomeService } from '@/modules/[module-name]'
import type { ActionResult } from '@/shared/types/common'

const inputSchema = z.object({
  // Define Zod schema here
})

export async function verbNounAction(input: unknown): Promise<ActionResult> {
  const logger = new Logger()

  try {
    // 1. Verify session via DAL (MANDATORY)
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // 2. Validate input with Zod
    const data = inputSchema.parse(input)

    // 3. Call module service for business logic (NO inline logic)
    const service = new SomeService()
    const result = await service.doSomething(data)

    // 4. Return structured result
    return { success: true, data: result }

  } catch (error) {
    logger.error(error as Error, '[verb-noun] action failed')

    if (error instanceof AppError) {
      return { success: false, error: error.message, code: error.code }
    }

    return { success: false, error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }
  }
}
```

---

## DB Query Template

```typescript
// db/queries.ts
import { getPayloadClient } from '@/lib/payload'
import type { CollectionType } from '@/types/payload-types'

/**
 * Get item by ID
 */
export async function getItemById(id: string): Promise<CollectionType | null> {
  const payload = await getPayloadClient()

  try {
    return await payload.findByID({
      collection: 'collection_slug',
      id,
      overrideAccess: false, // MANDATORY for user-facing operations
    })
  } catch {
    return null
  }
}

/**
 * Get paginated items
 */
export async function getItems(page: number = 1, limit: number = 12) {
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
```

---

## Import Rules Reminder

```typescript
// ✅ ALLOWED imports for features
import { SomeService } from '@/modules/[module-name]'  // Modules
import { Logger } from '@/core/logger'                  // Core
import { Button } from '@/shared/ui/button'             // Shared UI
import { formatUSD } from '@/shared/lib/format'         // Shared lib
import type { Product } from '@/types/payload-types'    // Payload types

// ❌ FORBIDDEN imports for features
import { X } from '@/features/other-feature'  // Other features
import { Y } from '@/app/some-page'           // App layer
import { Z } from '@/widgets/header'          // Widgets
import { W } from '@/payload/collections/x'   // Payload collections
```

---

## Registration (MANDATORY)

After creating the feature, register it in `features/_registry/index.ts`:

```typescript
import { newFeatureConfig } from '../[feature-name]/feature.config'

export const FEATURES = {
  // ... existing features
  '[feature-name]': newFeatureConfig,
} as const
```

---

## Final Checklist

- [ ] All files use **kebab-case** (except `.tsx` components → PascalCase)
- [ ] `feature.config.ts`, `index.ts`, `types.ts`, `constants.ts`, `README.md` all created
- [ ] Public API in `index.ts` — no deep imports
- [ ] Server actions have: Zod validation + try-catch + module calls + logger
- [ ] DB queries use `overrideAccess: false` for user-facing ops
- [ ] Session verified via DAL in every action
- [ ] Registered in `_registry/index.ts`
- [ ] No cross-feature imports
- [ ] Tests written for critical paths
