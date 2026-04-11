# Research & Technical Decisions

**Feature**: Phase 1 Foundation
**Created**: 2026-02-17
**Status**: Complete

## Architecture Decisions

### Decision: Next.js 15 + Payload CMS v3 Stack
**Decision**: Use Next.js 15 with App Router + Payload CMS v3 as the core stack
**Rationale**:
- Next.js 15 provides React Server Components, improved performance, and App Router architecture
- Payload CMS v3 offers headless CMS with built-in admin panel, PostgreSQL support, and Local API
- Both frameworks use TypeScript natively and support strict mode
- Payload's Local API allows direct database operations without HTTP overhead
**Alternatives considered**: 
- Strapi (less TypeScript-native)
- Directus (smaller ecosystem)
- Custom Express backend (more maintenance overhead)

### Decision: Neon PostgreSQL (Serverless)
**Decision**: Use Neon PostgreSQL for serverless database hosting
**Rationale**:
- Serverless scaling matches Vercel's serverless functions
- Built-in connection pooling (PgBouncer) handles connection limits
- Point-in-time recovery and automated backups
- Branching for development/staging environments
**Alternatives considered**:
- AWS RDS (higher cost, more complex)
- Supabase (good alternative, but Neon has better Vercel integration)
- PlanetScale (MySQL-based, less ideal for Payload)

### Decision: FSD (Feature-Sliced Design) Architecture
**Decision**: Implement strict FSD layering: app → widgets → features → modules → core → shared
**Rationale**:
- Clear dependency direction prevents circular dependencies
- Enforces separation of concerns
- Features are self-contained and independently testable
- Aligns with Payload CMS's modular approach
**Implementation**:
- Each feature has its own README, types, constants, and public API
- Cross-feature composition only in widgets/ and app/
- Modules contain pure business logic (no UI)

## Session & Authentication Pattern

### Decision: DAL (Data Access Layer) Pattern for Security
**Decision**: Implement DAL pattern for session verification instead of middleware-based security
**Rationale**:
- CVE-2025-29927 vulnerability makes middleware bypass possible
- DAL ensures session verification at every data access point
- Middleware used ONLY for UX redirects, not security
**Implementation**:
```typescript
// Verify in Server Components, Server Actions, and API routes
const session = await verifySession()
if (!session) return { success: false, error: 'Unauthorized' }
```

### Decision: JWT in HTTP-Only Cookies
**Decision**: Store session tokens as JWT in HTTP-only, secure, SameSite cookies
**Rationale**:
- XSS protection via HTTP-only flag
- CSRF protection via SameSite=lax
- No localStorage/sessionStorage (vulnerable to XSS)
- Stateless sessions scale horizontally
**Token contents**: { sessionId, isAuthenticated, expiresAt }
**Duration**: 24 hours (default), 30 days (Remember Me)

## Database Schema Decisions

### Decision: Relational Cart Model (Separate Tables)
**Decision**: Use separate `carts` and `cart_items` tables (NOT embedded array)
**Rationale**:
- Enables complex queries and joins
- Better data integrity with foreign keys
- Supports abandoned cart analytics
- Aligns with Payload CMS collection model
**Schema**:
- carts: id (UUID), session_id, expires_at
- cart_items: id, cart_id (FK), variant_id (FK), quantity, price_at_add

### Decision: Direct Decrement Stock Model
**Decision**: Use Direct Decrement model (no reserved_quantity field)
**Rationale**:
- Simpler than reservation-based systems
- Sufficient for COD-only payment (no payment timeout concerns)
- Atomic decrement at order creation via PostgreSQL transactions
- Serializable isolation prevents race conditions
**Alternative rejected**: Reservation model adds complexity without benefit for COD

### Decision: Price Snapshot Pattern
**Decision**: Store `price_at_add` in cart_items for live price change detection
**Rationale**:
- Compare current price vs stored price on cart view
- Show notifications when prices change
- Prevents surprise pricing at checkout
- Required per specification

## Media & Storage

### Decision: Cloudinary for Image Storage
**Decision**: Use Cloudinary via `payload-cloudinary` plugin
**Rationale**:
- Automatic WebP conversion and optimization
- CDN delivery for fast global access
- Image transformations (resize, crop, quality)
- Direct integration with Payload CMS
- No local storage management needed
**Transformations**: f_auto,q_auto (auto format, auto quality)

## Rate Limiting Strategy

### Decision: In-Memory LRU Cache for Rate Limiting
**Decision**: Use LRU cache (lru-cache package) for rate limiting (not Redis)
**Rationale**:
- Simpler infrastructure (no Redis dependency)
- Sufficient for single-instance/small scale
- Fast in-memory checks (<50ms)
- Vercel serverless functions have isolated memory
**Limits**:
- Gate: 5 attempts/min per IP
- Cart: 20 operations/min per session
- Checkout: 3 attempts/min per session

**Note**: If scaling beyond single instance, migrate to Redis or Vercel Edge Config.

## Error Handling & Monitoring

### Decision: Hierarchical Error Handling with AppError
**Decision**: Implement AppError class extending Error with code and status
**Rationale**:
- Consistent error structure across application
- Differentiate between user-facing and internal errors
- Enable proper HTTP status codes in API responses
**Structure**: { message, code, status, cause? }

### Decision: Sentry for Error Tracking
**Decision**: Integrate Sentry for client and server error monitoring
**Rationale**:
- Automatic error capture with stack traces
- Performance monitoring (traces)
- Release tracking and regression detection
- Free tier sufficient for small-medium scale
**Implementation**: @sentry/nextjs package

## UI & Styling

### Decision: Tailwind CSS + shadcn/ui
**Decision**: Use Tailwind CSS with shadcn/ui component library
**Rationale**:
- Utility-first CSS enables rapid development
- shadcn/ui provides accessible, customizable primitives
- Consistent with Payload CMS admin styling
- No runtime CSS-in-JS overhead
**Pattern**: Use `cn()` helper for conditional class merging

### Decision: Framer Motion for Animations
**Decision**: Use Framer Motion for UI animations
**Rationale**:
- React-native animation library
- Hardware-accelerated transforms
- Reduced motion support via prefers-reduced-motion
- Small bundle size for basic transitions

## Environment Validation

### Decision: Zod Schema for Environment Variables
**Decision**: Validate all environment variables with Zod at startup
**Rationale**:
- Fail fast on missing/invalid configuration
- Type-safe access throughout application
- Clear error messages for misconfiguration
- Single source of truth for env requirements

## State Management

### Decision: Zustand for UI State Only (NOT Cart Data)
**Decision**: Use Zustand ONLY for UI state (drawer open/close, loading states)
**Rationale**:
- Cart data is 100% server-side (database-backed)
- No localStorage persistence for cart
- Zustand is lightweight and simple for UI state
- Prevents hydration mismatches
**Forbidden**: Storing cart items, totals, or quantities in Zustand

## Security Considerations

### Decision: Bcrypt for Password Hashing
**Decision**: Use bcrypt for gate password hashing (SiteSettings) and admin passwords
**Rationale**:
- Industry standard for password hashing
- Adaptive cost factor (configurable rounds)
- Resistant to rainbow table attacks
- Built into Payload CMS for admin users

### Decision: Honeypot Field for Bot Detection
**Decision**: Implement hidden honeypot field in checkout form
**Rationale**:
- Simple bot detection without CAPTCHA friction
- Field hidden via CSS (display: none)
- Zod validation: z.string().max(0) - must be empty
- Silent reject (fake success) to avoid revealing detection

## Testing Strategy

### Decision: Vitest + Testing Library + Playwright
**Decision**: Use Vitest for unit/integration, Playwright for E2E
**Rationale**:
- Vitest is fast and compatible with Jest APIs
- Testing Library for React component testing
- Playwright for realistic E2E browser testing
- Aligns with Next.js 15 testing best practices

## Deployment & Infrastructure

### Decision: Vercel for Hosting
**Decision**: Deploy on Vercel platform
**Rationale**:
- Native Next.js support with zero configuration
- Automatic preview deployments
- Serverless functions scaling
- Edge network for static assets
- Cron job support via vercel.json

### Decision: Daily Automated Backups (Neon)
**Decision**: Rely on Neon's built-in daily backups with 7-day retention
**Rationale**:
- Managed by Neon (no custom scripts needed)
- Point-in-time recovery available
- Sufficient for small business scale
- Documented restore procedures

## Open Questions Resolved

All clarifications from `/speckit.clarify` have been incorporated:
- ✅ Data retention: Indefinite (no automatic deletion)
- ✅ Scale targets: 100-500 products, 50 concurrent users, 20 daily orders
- ✅ Backup strategy: Daily automated backups, 7-day retention
- ✅ Accessibility: WCAG 2.1 Level AA compliance

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Middleware bypass (CVE-2025-29927) | DAL pattern for session verification |
| Database connection limits | Neon connection pooling + PgBouncer |
| Stock race conditions | PostgreSQL serializable isolation + atomic decrement |
| Session fixation | Regenerate session ID on password verification |
| XSS attacks | HTTP-only cookies, input sanitization |
| Price change surprises | price_at_add comparison in cart view |

## Technology Versions

- Next.js: 15.x
- React: 19.x
- Payload CMS: 3.x
- TypeScript: 5.x (strict mode)
- PostgreSQL: 15+ (Neon)
- Node.js: 20.x LTS
