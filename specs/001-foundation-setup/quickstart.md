# Quickstart Guide

**Feature**: Phase 1 Foundation  
**Setup Time**: ~30 minutes  
**Prerequisites**: Node.js 20+, Git, Neon PostgreSQL account, Cloudinary account, Sentry account

## 1. Repository Setup

### Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd vape-store

# Switch to feature branch
git checkout 001-foundation-setup

# Install dependencies
npm install
```

### Environment Variables

Create `.env.local` file:

```bash
# Database - Neon PostgreSQL
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Payload CMS
PAYLOAD_SECRET="your-32-character-secret-key-here"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"

# Authentication
SESSION_SECRET="your-32-character-session-secret-here"
GATE_PASSWORD="your-site-access-password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Sentry
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Cron (generate random string)
CRON_SECRET="your-16-character-cron-secret"

# App
NODE_ENV="development"
PORT="3000"
LOG_LEVEL="info"
```

**Generate secrets**:
```bash
# PAYLOAD_SECRET and SESSION_SECRET (32+ chars)
openssl rand -base64 32

# CRON_SECRET (16+ chars)
openssl rand -base64 16
```

## 2. Database Setup

### Neon PostgreSQL

1. Create project at [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string to `DATABASE_URL`
4. **Important**: Add `?pgbouncer=true` for connection pooling

### Schema Initialization

```bash
# Payload will auto-create tables on first run
# No manual migration needed for Phase 1
```

## 3. External Services

### Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard
3. Add to `.env.local`
4. Create folder: `vape-store`

### Sentry

1. Create project at [sentry.io](https://sentry.io)
2. Select platform: Next.js
3. Copy DSN to `.env.local`
4. Both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`

## 4. Development

### Start Development Server

```bash
npm run dev
```

**Access Points**:
- Storefront: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- Gate Page: http://localhost:3000/gate

### First Time Setup

1. **Seed Super Admin**:
   ```bash
   npx tsx scripts/seed-admin.ts
   ```
   - Creates first super-admin user
   - Uses credentials from seed script output

2. **Access Admin Panel**:
   - Navigate to `/admin`
   - Login with seeded credentials
   - Verify collections visible: Users, Brands, Categories, Products, Variants, Media

3. **Test Password Gate**:
   - Open incognito window
   - Navigate to `/`
   - Should redirect to `/gate`
   - Enter `GATE_PASSWORD` from `.env.local`
   - Should redirect to home page

## 5. Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (payload)/         # Payload CMS admin routes
│   ├── (storefront)/      # Public storefront pages
│   │   ├── page.tsx       # Home page
│   │   ├── gate/          # Password gate
│   │   ├── brands/        # Brand pages
│   │   ├── categories/    # Category pages
│   │   └── products/      # Product pages
│   ├── api/               # API routes
│   │   └── cron/          # Cron jobs
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── widgets/               # Composite UI components
│   ├── header/
│   ├── footer/
│   ├── product-grid/
│   └── whatsapp-button/
│
├── features/              # Feature modules (FSD)
│   ├── _registry/         # Feature registration
│   ├── gate/              # Password gate feature
│   ├── products/          # Product feature
│   ├── cart/              # Cart feature (Phase 2)
│   ├── checkout/          # Checkout feature (Phase 2)
│   ├── order-tracking/    # Order tracking (Phase 2)
│   ├── search/            # Search feature (Phase 3)
│   └── filters/           # Filters feature (Phase 3)
│
├── modules/               # Shared business logic
│   ├── catalog/           # Catalog services
│   │   ├── services/
│   │   │   ├── product.service.ts
│   │   │   ├── category.service.ts
│   │   │   └── brand.service.ts
│   │   └── validators/
│   └── orders/            # Order services (Phase 2)
│
├── core/                  # Infrastructure
│   ├── auth/              # Authentication (DAL, session)
│   ├── config/            # Configuration (env, app)
│   ├── errors/            # Error handling
│   ├── logger/            # Logging
│   ├── rate-limit/        # Rate limiting
│   └── db/                # Database client
│
├── payload/               # Payload CMS config
│   ├── collections/       # Core collections
│   ├── globals/           # Global settings
│   ├── hooks/             # Collection hooks
│   ├── access/            # Access control
│   └── admin/             # Admin customization
│
└── shared/                # Shared utilities
    ├── ui/                # UI primitives (shadcn)
    ├── lib/               # Utilities
    ├── hooks/             # Generic hooks
    └── types/             # Shared types
```

## 6. Development Workflow

### Adding a New Feature

1. **Create feature directory**:
   ```bash
   mkdir -p src/features/my-feature/{ui,logic,actions,db,tests}
   ```

2. **Create required files**:
   - `feature.config.ts` - Feature metadata
   - `index.ts` - Public API exports
   - `README.md` - Feature documentation
   - `types.ts` - Feature types
   - `constants.ts` - Feature constants

3. **Register feature**:
   ```typescript
   // src/features/_registry/index.ts
   import { myFeatureConfig } from '../my-feature/feature.config'
   
   export const FEATURES = {
     // ... existing features
     'my-feature': myFeatureConfig,
   }
   ```

4. **Follow FSD rules**:
   - NO imports from other features
   - NO imports from app/, widgets/
   - CAN import from modules/, core/, shared/

### Creating a Server Action

```typescript
// features/my-feature/actions/my-action.action.ts
'use server'

import { z } from 'zod'
import { verifySession } from '@/core/auth/session'
import { Logger } from '@/core/logger'

const schema = z.object({
  // input validation
})

export async function myAction(input: unknown) {
  const logger = new Logger()
  
  try {
    // Verify session
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Validate input
    const data = schema.parse(input)
    
    // Business logic
    // ...
    
    return { success: true, data: result }
    
  } catch (error) {
    logger.error(error as Error, 'My action failed')
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation error',
        details: error.errors 
      }
    }
    
    return { 
      success: false, 
      error: 'An error occurred' 
    }
  }
}
```

### Creating a Service (Module)

```typescript
// src/modules/catalog/services/product.service.ts
import { getPayloadClient } from '@/lib/payload'
import type { Product } from '@/types/payload-types'

export class ProductService {
  async getById(id: number): Promise<Product | null> {
    const payload = await getPayloadClient()
    
    try {
      const product = await payload.findByID({
        collection: 'products',
        id,
        overrideAccess: false,
      })
      return product
    } catch {
      return null
    }
  }
  
  async getActive(params: { page?: number; limit?: number } = {}) {
    const payload = await getPayloadClient()
    
    const { docs, ...pagination } = await payload.find({
      collection: 'products',
      where: {
        is_active: { equals: true },
      },
      page: params.page,
      limit: params.limit,
      sort: '-created_at',
      overrideAccess: false,
    })
    
    return { products: docs, pagination }
  }
}
```

## 7. Testing

### Run Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Writing Tests

```typescript
// features/my-feature/actions/my-action.test.ts
import { describe, it, expect, vi } from 'vitest'
import { myAction } from './my-action.action'
import * as sessionModule from '@/core/auth/session'

describe('myAction', () => {
  it('should return error when unauthorized', async () => {
    vi.spyOn(sessionModule, 'verifySession').mockResolvedValue(null)
    
    const result = await myAction({ test: 'data' })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })
  
  it('should validate input', async () => {
    vi.spyOn(sessionModule, 'verifySession').mockResolvedValue({
      isAuthenticated: true,
      sessionId: 'test'
    })
    
    const result = await myAction({ invalid: 'data' })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Validation')
  })
})
```

## 8. Common Tasks

### Adding a New Collection

```typescript
// src/payload/collections/my-collection.ts
import type { CollectionConfig } from 'payload'

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // ... more fields
  ],
}
```

### Creating a Hook

```typescript
// src/payload/hooks/before-change/generate-slug.ts
import type { CollectionBeforeChangeHook } from 'payload'
import { slugify } from '@/shared/lib/slugify'

export const generateSlug: CollectionBeforeChangeHook = async ({ 
  data, 
  operation,
  originalDoc 
}) => {
  // Only generate if slug not provided or name changed
  if (operation === 'create' || data.name !== originalDoc?.name) {
    if (!data.slug && data.name) {
      data.slug = slugify(data.name)
    }
  }
  
  return data
}
```

### Adding Rate Limiting

```typescript
// core/rate-limit.ts
import { rateLimit } from '@/core/rate-limit'

const limiter = rateLimit({ interval: 60 * 1000 }) // 1 minute

export async function myProtectedAction(sessionId: string) {
  // Check rate limit
  try {
    limiter.check(sessionId, 10) // 10 requests per minute
  } catch {
    return { success: false, error: 'Rate limit exceeded' }
  }
  
  // ... action logic
}
```

## 9. Deployment

### Vercel Setup

1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Cron Job Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-carts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Production Checklist

- [ ] All environment variables set
- [ ] Database migrated (auto on first run)
- [ ] Super admin seeded
- [ ] Cloudinary folder created
- [ ] Sentry DSN configured
- [ ] Domain configured
- [ ] HTTPS enforced
- [ ] Cron jobs scheduled

## 10. Troubleshooting

### Common Issues

**Database connection errors**:
- Verify `DATABASE_URL` format
- Ensure `?sslmode=require` for Neon
- Check IP allowlist in Neon dashboard

**Payload admin 404**:
- Verify `PAYLOAD_SECRET` is set
- Check `NEXT_PUBLIC_SERVER_URL` matches actual URL

**Session not persisting**:
- Check browser cookies enabled
- Verify `SESSION_SECRET` is 32+ characters
- Check SameSite cookie settings

**Images not uploading**:
- Verify Cloudinary credentials
- Check Cloudinary folder exists
- Review upload size limits

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

### Getting Help

1. Check logs in Sentry dashboard
2. Review Vercel function logs
3. Check Neon database metrics
4. Review Cloudinary media library

---

## Next Steps

After Phase 1 Foundation is complete:

1. **Phase 2**: Implement cart, checkout, and order tracking
2. **Phase 3**: Add search and filters
3. **Phase 4**: Polish, test, and deploy

See `doc/vape-store-blueprint.md` for full roadmap.
