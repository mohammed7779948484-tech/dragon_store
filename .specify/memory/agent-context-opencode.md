# Vape Store Development Guidelines

Auto-generated from Phase 1 Foundation plan. Last updated: 2026-02-17

## Active Technologies

### Core Stack
- **Framework**: Next.js 15+ with App Router
- **CMS**: Payload CMS v3
- **Language**: TypeScript 5.x (strict mode)
- **Database**: Neon PostgreSQL (serverless)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Framer Motion

### Key Libraries
- **Validation**: Zod
- **Authentication**: JWT in HTTP-only cookies
- **Rate Limiting**: lru-cache
- **Media**: Cloudinary (payload-cloudinary plugin)
- **Monitoring**: Sentry
- **Hashing**: bcrypt
- **Testing**: Vitest + Testing Library + Playwright

### Infrastructure
- **Deployment**: Vercel (serverless)
- **Cron Jobs**: Vercel Cron
- **Connection Pooling**: PgBouncer (Neon)

## Project Structure

```text
src/
├── app/                          # Next.js App Router
│   ├── (payload)/               # Payload CMS admin
│   │   └── admin/
│   ├── (storefront)/            # Public storefront
│   │   ├── page.tsx             # Home
│   │   ├── gate/                # Password gate
│   │   ├── brands/[slug]/       # Brand pages
│   │   ├── categories/[slug]/   # Category pages
│   │   └── products/[slug]/     # Product detail
│   ├── api/                     # API routes
│   │   └── cron/                # Cron jobs
│   ├── layout.tsx
│   └── globals.css
│
├── widgets/                     # Composite UI components
│   ├── header/
│   ├── footer/
│   ├── product-grid/
│   └── whatsapp-button/
│
├── features/                    # Feature modules (FSD)
│   ├── _registry/               # Feature registration
│   ├── gate/                    # Password gate
│   │   ├── ui/GateForm.tsx
│   │   └── actions/verify-password.action.ts
│   ├── products/                # Products feature
│   ├── cart/                    # Cart (Phase 2 - schema only)
│   ├── checkout/                # Checkout (Phase 2 - schema only)
│   └── order-tracking/          # Order tracking (Phase 2)
│
├── modules/                     # Shared business logic
│   └── catalog/                 # Catalog services
│       ├── services/
│       │   ├── product.service.ts
│       │   ├── category.service.ts
│       │   └── brand.service.ts
│       └── validators/
│
├── core/                        # Infrastructure
│   ├── auth/                    # DAL pattern, session
│   │   ├── session.ts           # verifySession, createSession
│   │   └── encryption.ts        # JWT encrypt/decrypt
│   ├── config/                  # Environment validation
│   │   └── env.ts               # Zod schema
│   ├── errors/                  # AppError class
│   ├── logger/                  # Sentry integration
│   ├── rate-limit/              # LRU rate limiter
│   └── db/                      # Database utilities
│
├── payload/                     # Payload CMS
│   ├── collections/             # Core collections
│   │   ├── users.ts
│   │   ├── brands.ts
│   │   ├── categories.ts
│   │   ├── products.ts
│   │   ├── product-variants.ts
│   │   └── media.ts
│   ├── globals/                 # Global settings
│   │   └── site-settings.ts
│   ├── hooks/                   # Collection hooks
│   │   ├── before-change/generate-slug.ts
│   │   ├── before-change/validate-parent-depth.ts
│   │   └── after-change/revalidate-cache.ts
│   ├── access/                  # Access control
│   └── admin/                   # Admin customization
│
└── shared/                      # Shared utilities
    ├── ui/                      # shadcn/ui primitives
    ├── lib/                     # Utilities (cn, format)
    ├── hooks/                   # Generic hooks
    ├── config/                  # Shared constants
    └── types/                   # Shared types
```

## Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
```

### Testing
```bash
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Code Quality
```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript check
```

### Database
```bash
npx tsx scripts/seed-admin.ts    # Seed super admin
```

## Code Style

### TypeScript
- **Strict mode**: Enabled, zero tolerance for `any`
- **Explicit returns**: All public functions must declare return types
- **Interfaces vs Types**: Use `interface` for objects, `type` for unions/primitives

### File Naming (CRITICAL)
- **Services**: `[name].service.ts` (e.g., `product.service.ts`)
- **Actions**: `[verb-noun].action.ts` (e.g., `verify-password.action.ts`)
- **Components**: `[Name].tsx` PascalCase (only exception to kebab-case)
- **Folders**: `kebab-case` always
- **Tests**: Co-located `[name].test.ts`

### Imports (CRITICAL)
- **Always use `@/`**: Never relative paths across layers
- **Public API only**: Import from feature/module index, not deep
- **Type imports**: Use `import type` for interfaces

```typescript
// ✅ CORRECT
import { Button } from '@/shared/ui/button'
import { useCart } from '@/features/cart'
import { ProductService } from '@/modules/catalog'

// ❌ WRONG
import { Button } from '../../../shared/ui/button'
import { ProductService } from '@/modules/catalog/services/product.service'
```

### Server Actions Pattern
```typescript
'use server'

import { z } from 'zod'
import { verifySession } from '@/core/auth/session'
import { Logger } from '@/core/logger'

const schema = z.object({ ... })

export async function myAction(input: unknown) {
  const logger = new Logger()
  
  try {
    // 1. Verify session
    const session = await verifySession()
    if (!session) return { success: false, error: 'Unauthorized' }
    
    // 2. Validate input
    const data = schema.parse(input)
    
    // 3. Call module service
    const result = await service.doSomething(data)
    
    return { success: true, data: result }
    
  } catch (error) {
    logger.error(error as Error)
    return { success: false, error: 'An error occurred' }
  }
}
```

### Security (CRITICAL)
- **NEVER use middleware for security** - CVE-2025-29927 vulnerability
- **ALWAYS use DAL pattern**: Verify session in Server Components/Actions
- **HTTP-only cookies**: JWT stored in secure, SameSite=Lax cookies
- **Rate limiting**: 5/min gate, 20/min cart, 3/min checkout

### FSD Architecture Rules
```
Dependency Flow (STRICT):
  app/ → widgets/ → features/ → modules/ → core/ → shared/

Features CANNOT:
  - Import from other features
  - Import from app/ or widgets/
  
Features CAN import from:
  - modules/, core/, shared/

Composition happens in:
  - Pages (app/)
  - Widgets (widgets/)
```

## Key Patterns

### DAL Pattern (Session Verification)
```typescript
// Server Component
export default async function Page() {
  const session = await verifySession()
  if (!session) redirect('/gate')
  // ... safe to proceed
}

// Server Action
export async function myAction() {
  const session = await verifySession()
  if (!session) return { success: false, error: 'Unauthorized' }
  // ... safe to proceed
}
```

### Cart Pattern (Server-Side Only)
```typescript
// ❌ WRONG - Never do this
const useCart = create(() => ({ items: [], total: 0 })) // Zustand with cart data

// ✅ CORRECT - UI state only
const useCartUI = create(() => ({ 
  isDrawerOpen: false,
  isLoading: false 
}))

// Cart data always from server/database
```

### Error Handling
```typescript
import { AppError } from '@/core/errors'

// In services
throw new AppError('Product not found', 404, 'NOT_FOUND')

// In actions
if (error instanceof AppError) {
  return { success: false, error: error.message, code: error.code }
}
return { success: false, error: 'Unknown error' }
```

## Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL="postgresql://..."
PAYLOAD_SECRET="32-char-min"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
SESSION_SECRET="32-char-min"
GATE_PASSWORD="site-password"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
SENTRY_DSN="..."
NEXT_PUBLIC_SENTRY_DSN="..."
CRON_SECRET="16-char-min"
NODE_ENV="development"
```

All validated at startup via Zod in `core/config/env.ts`.

## Recent Changes

### Phase 1 Foundation (Current)
- **Added**: Next.js 15 + Payload CMS v3 setup
- **Added**: FSD architecture with strict layering
- **Added**: DAL pattern for session-based authentication
- **Added**: Password gate with rate limiting
- **Added**: Core collections (Users, Brands, Categories, Products, Variants, Media)
- **Added**: SiteSettings global
- **Added**: Cloudinary media integration
- **Added**: Sentry error tracking
- **Added**: Neon PostgreSQL configuration

### Coming in Phase 2
- Cart functionality (server-side)
- Checkout flow (COD only)
- Order tracking
- Cart cleanup cron job

## Architecture Decisions

### Why DAL Instead of Middleware?
CVE-2025-29927 makes middleware bypass possible. Security verification MUST happen in Server Components/Actions via `verifySession()`.

### Why Server-Side Cart?
- Abandoned cart analytics
- No localStorage vulnerabilities
- Real-time stock validation
- Price change detection

### Why FSD?
- Clear dependency direction
- Enforced separation of concerns
- Features are independently testable
- Scalable architecture

## Testing Guidelines

### Unit Tests
- Test module services
- Test validators
- Co-located with source: `[name].test.ts`

### Integration Tests
- Test feature flows
- Test database operations

### E2E Tests
- Test complete user journeys
- Gate → Browse → Product flow

## Performance Targets

- Page load: < 2 seconds
- Gate verification: < 500ms
- Session creation: < 200ms
- API response: < 200ms
- Image upload: < 5 seconds (5MB)

## Accessibility Requirements

- WCAG 2.1 Level AA compliance
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Color contrast compliance

## Scale Targets

- Products: 100-500 (5x growth headroom)
- Concurrent users: 50
- Daily orders: 20

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
