# Feature Specification: Phase 1 Foundation

**Feature Branch**: `001-foundation-setup`  
**Created**: 2026-02-17  
**Status**: Draft  
**Input**: User description: "Phase 1 Foundation: Project initialization with Next.js 15 + Payload v3 + TypeScript, password gate with session management, core collections (Users, Brands, Categories, Products, ProductVariants, Media), SiteSettings global, database configuration with Neon PostgreSQL, Cloudinary media storage, Sentry monitoring, FSD architecture structure, access control, hooks, and seed scripts"

## Clarifications

### Session 2026-02-17

- **Q**: What data protection compliance requirements apply (GDPR, CCPA, etc.) and what retention/deletion policies should be implemented? → **A**: No formal compliance required; store data indefinitely unless manually deleted by admin
- **Q**: What are the expected scale parameters for initial launch - number of products, concurrent users, and daily orders? → **A**: Small business scale: 100-500 products, 50 concurrent users, 20 daily orders (with 5x growth headroom)
- **Q**: What are the backup and disaster recovery requirements for the store data? → **A**: Daily automated backups with 7-day retention, 24-hour RPO (Recovery Point Objective), manual restore process documented
- **Q**: What accessibility compliance level is required for the store? → **A**: WCAG 2.1 Level AA compliance for all customer-facing pages

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Access to Management Panel (Priority: P1)

As a store administrator, I want to log in to the admin panel so that I can manage products, orders, and store settings.

**Why this priority**: Without admin access, no store management is possible. This is the foundational capability that enables all other administrative functions.

**Independent Test**: Can be fully tested by attempting to access `/admin`, logging in with seeded credentials, and verifying dashboard access.

**Acceptance Scenarios**:

1. **Given** the admin panel is deployed, **When** I navigate to `/admin`, **Then** I see a login form
2. **Given** I have valid super admin credentials from the seed script, **When** I submit the login form, **Then** I am authenticated and redirected to the admin dashboard
3. **Given** I am logged in as an admin, **When** I view the admin panel, **Then** I can see collections for Users, Brands, Categories, Products, Product Variants, and Media

---

### User Story 2 - Store Access via Password Gate (Priority: P1)

As a customer, I want to enter a password to access the store so that I can browse products in this private e-commerce site.

**Why this priority**: The password gate is the entry point for all customers. Without it, no one can access the storefront.

**Independent Test**: Can be fully tested by visiting the site, being redirected to `/gate`, entering the correct password, and gaining access to the storefront.

**Acceptance Scenarios**:

1. **Given** I visit the storefront without a valid session, **When** the middleware processes my request, **Then** I am redirected to the `/gate` page
2. **Given** I am on the gate page, **When** I enter the correct password and submit, **Then** a session cookie is created and I am redirected to the home page
3. **Given** I checked "Remember Me" on the gate, **When** I return after closing the browser, **Then** my session persists for up to 30 days
4. **Given** I enter an incorrect password, **When** I submit the form, **Then** I see an error message and my attempt is rate-limited (max 5/min)

---

### User Story 3 - Product Data Management (Priority: P2)

As an admin, I want to create and manage products with categories, brands, and variants so that customers can browse and purchase items.

**Why this priority**: Products are the core offering of the store. This story enables the catalog management that makes the store functional.

**Independent Test**: Can be fully tested by creating a brand, category, product, and variant in the admin panel, then verifying they appear in the storefront.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I create a new brand with name and logo, **Then** it appears in the brands list with an auto-generated slug
2. **Given** I am logged in as an admin, **When** I create a category with a parent category, **Then** the system enforces the 2-level hierarchy maximum
3. **Given** I am logged in as an admin, **When** I create a product with multiple variants, **Then** each variant has its own SKU, price, and stock quantity
4. **Given** I upload product images, **When** the upload completes, **Then** images are stored in Cloudinary and URLs are saved to the database

---

### User Story 4 - Site Configuration Management (Priority: P3)

As a super admin, I want to manage site-wide settings like the gate password and contact information so that I can control store access and customer communication.

**Why this priority**: Site settings provide operational control. While important, the store can function with default environment values initially.

**Independent Test**: Can be fully tested by accessing SiteSettings in the admin panel, changing the gate password, and verifying the change takes effect on the next gate access.

**Acceptance Scenarios**:

1. **Given** I am logged in as a super admin, **When** I access SiteSettings, **Then** I can view and edit the gate password
2. **Given** I change the gate password in SiteSettings, **When** a new user attempts to access the gate, **Then** the new password is required for entry
3. **Given** no password is set in the database, **When** a user attempts to access the gate, **Then** the system falls back to the environment variable `GATE_PASSWORD`

---

### Edge Cases

| Scenario | System Behavior |
|----------|----------------|
| Database connection fails during gate authentication | Show user-friendly error message: "Unable to verify access. Please try again later." Log error to Sentry with context. |
| Concurrent slug generation for products with same name | Hook automatically appends incremental number (e.g., "product-name-2", "product-name-3") to ensure uniqueness. |
| Category parent set to itself | Hook validation prevents self-reference with error: "A category cannot be its own parent." |
| Expired session access attempt | DAL verification fails, user redirected to `/gate` with `?redirect=` parameter preserving intended destination. |
| Cloudinary upload failure | Error returned to user: "Image upload failed. Please try again." Admin notified via Sentry with upload context. |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize with Next.js 15, Payload CMS v3, and TypeScript in strict mode
- **FR-002**: System MUST configure Neon PostgreSQL with connection pooling for serverless deployment
- **FR-003**: System MUST integrate Cloudinary for media storage via `payload-cloudinary` plugin
- **FR-004**: System MUST integrate Sentry for error monitoring on both client and server
- **FR-005**: System MUST validate all environment variables using Zod schema at startup
- **FR-006**: System MUST implement hierarchical error handling with `AppError` class
- **FR-007**: System MUST provide centralized logging with Sentry integration
- **FR-008**: System MUST implement rate limiting using LRU cache for gate (5/min/IP), cart (20/min/session), and checkout (3/min/session)
- **FR-009**: System MUST create Payload collections: Users, Brands, Categories, Products, ProductVariants, Media
- **FR-010**: System MUST create SiteSettings global for store-wide configuration
- **FR-011**: System MUST implement `generate-slug` hook for Products, Categories, and Brands
- **FR-012**: System MUST implement `validate-parent-depth` hook to enforce maximum 2-level category hierarchy
- **FR-013**: System MUST implement `revalidate-cache` hook to clear Next.js cache on data changes
- **FR-014**: System MUST implement role-based access control with Super Admin and Regular Admin roles
- **FR-015**: System MUST create seed script to initialize the first Super Admin user
- **FR-016**: System MUST implement session-based authentication with JWT stored in HTTP-only cookies
- **FR-017**: System MUST create Data Access Layer (DAL) for session verification in Server Components and Actions
- **FR-018**: System MUST implement password gate at `/gate` with "Remember Me" option (24h default, 30d with Remember Me)
- **FR-019**: System MUST implement middleware for UX redirects to gate (NOT security - security handled in DAL). ⚠️ **CRITICAL**: Due to CVE-2025-29927, middleware bypass is possible. Middleware MUST NOT be used for security-critical authentication. All security verification MUST happen in Server Components/Actions via DAL.
- **FR-020**: System MUST resolve gate password priority: Database (SiteSettings) > Environment Variable
- **FR-021**: System MUST establish FSD architecture: `app/` → `widgets/` → `features/` → `modules/` → `core/` → `shared/`
- **FR-022**: System MUST persist all order and customer data indefinitely unless explicitly deleted by an admin (no automatic data expiration or anonymization)
- **FR-023**: System MUST implement daily automated database backups with 7-day retention and document manual restore procedures
- **FR-024**: System MUST meet WCAG 2.1 Level AA accessibility standards for all customer-facing pages

### Key Entities *(include if feature involves data)*

- **User**: Store administrators only (no customer accounts). Attributes: email, password (hashed), name, role (super-admin | admin), isActive, lastLogin. Super Admin can create/delete admins via invitation. Regular Admin manages products and orders.

- **Brand**: Product manufacturer/brand. Attributes: name, slug (unique), logo_url (Cloudinary), description, sort_order, is_active. Used for filtering and display on home page.

- **Category**: 2-level hierarchical product categorization. Attributes: name, slug (unique), image_url (Cloudinary), parent_id (self-reference, max depth 1), sort_order, is_active. Products can belong to multiple categories via M:N pivot.

- **Product**: Core product information. Attributes: brand_id (FK), name, slug (unique), description, unit_label, image_url (Cloudinary), sort_order, is_active, created_at, updated_at. Has many Variants.

- **ProductVariant**: Specific product variants (flavors, sizes). Attributes: product_id (FK), variant_name, sku (unique), price, stock_quantity, image_url (Cloudinary), option_value, sort_order, is_active. Stock managed via Direct Decrement model.

- **SiteSettings**: Global configuration singleton. Key settings: gate_password (bcrypt hashed), whatsapp_number. Only Super Admin can modify.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can log in to `/admin` within 5 seconds of page load
- **SC-002**: Gate page loads and accepts passwords with <2 second response time
- **SC-003**: Password verification succeeds in <500ms (including bcrypt comparison)
- **SC-004**: Session creation and cookie setting completes in <200ms
- **SC-005**: Site-wide password protection blocks 100% of unauthenticated access attempts to storefront
- **SC-006**: Media uploads to Cloudinary succeed in >99% of attempts with <5 second upload time for images under 5MB
- **SC-007**: All database schema migrations execute successfully without data loss
- **SC-008**: FSD architecture directories are created and import rules enforced (no upward/cross-layer imports)
- **SC-009**: Error tracking captures 100% of unhandled exceptions with context (user, URL, stack trace)
- **SC-010**: Rate limiting blocks requests exceeding thresholds within 50ms (in-memory LRU cache)
- **SC-011**: Seed script creates Super Admin successfully on first run in <3 seconds
- **SC-012**: System supports target scale of 500 products, 50 concurrent users, and 20 daily orders with <20% performance degradation at 2x load
- **SC-013**: All customer-facing pages pass automated WCAG 2.1 Level AA accessibility audits with 0 critical or serious violations

## Assumptions

- **Database**: Neon PostgreSQL serverless instance will be provisioned with appropriate connection limits
- **Cloudinary**: Account exists with sufficient storage and transformation quotas
- **Sentry**: Project is configured and DSN is available
- **Environment**: All required environment variables will be provided in `.env.local`
- **Deployment**: Target platform is Vercel with serverless functions
- **Security**: HTTPS enforced in production environment
- **Media**: Images will be optimized via Cloudinary (WebP, automatic quality)
- **Performance**: Database connection pooling handles serverless cold starts
- **Data Retention**: No automatic data deletion or anonymization required; manual deletion by admin only
- **Scale Targets**: System designed for 100-500 products, 50 concurrent users, 20 daily orders with 5x growth headroom
- **Backup & Recovery**: Daily automated backups configured with 7-day retention; 24-hour RPO; manual restore procedures documented
- **Accessibility**: All customer-facing pages must meet WCAG 2.1 Level AA standards

## Dependencies

- Next.js 15 with App Router
- Payload CMS v3
- TypeScript 5.x (strict mode)
- Tailwind CSS + shadcn/ui
- Neon PostgreSQL
- Cloudinary (via payload-cloudinary plugin)
- Sentry SDK
- bcrypt (password hashing)
- Zod (validation)
- JWT (session tokens)

## Out of Scope

- Customer user accounts (Phase 1 is gate-only access)
- Shopping cart functionality (Phase 2)
- Checkout flow (Phase 2)
- Order management (Phase 2)
- Search functionality (Phase 3)
- Product filters (Phase 3)
- Payment gateway integration (COD only, Phase 2)
- Shipping logistics (out of scope for entire project)
- Tax calculation (out of scope for entire project)
- Multi-language support (English only)
- SEO optimization (intentionally disabled)
- Automated privacy compliance (GDPR, CCPA) or data retention policies
- Customer right-to-deletion or data portability features
