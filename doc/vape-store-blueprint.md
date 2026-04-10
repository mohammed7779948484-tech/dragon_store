# Vape Store - Implementation Blueprint

**Version**: 1.0.0
**Date**: 2026-02-17
**Status**: Ready for Implementation
**Constitution**: v1.4.0
**Source**: Migrated from plan.md v2.2.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Decisions](#key-decisions)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Authentication & Password Gate](#authentication)
6. [Logic Pipelines](#logic-pipelines)
7. [Server Actions Specification](#server-actions)
8. [Security & Fraud Prevention](#security)
9. [Admin Panel Customization](#admin-panel)
10. [Frontend Structure](#frontend-structure)
11. [Build Order](#build-order)
12. [Environment Variables](#environment-variables)
13. [Verification Checklist](#verification-checklist)
14. [Files to Create](#files-to-create)

---

## Executive Summary

Private, mobile-first e-commerce platform for vape products with site-wide password protection, server-side relational cart (database-backed for abandoned cart analytics), and Cash on Delivery (COD) only payment. No shipping logistics, no tax, no user accounts, no SEO.

### Core Product Rules

- **Access**: Site-wide password gate (shared password, no user accounts)
- **Cart**: Server-side relational model (`carts` + `cart_items` tables, session-linked)
- **Payment**: Cash on Delivery only — no payment gateway
- **Stock**: Direct Decrement model — atomic transaction at order creation
- **Pricing**: Live fetch; no tax, no shipping, no minimum order
- **Currency**: USD only (`$`, 2 decimals)
- **Language**: English only — no i18n
- **Target**: Mobile-first (primary device)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | Session-based (24h / 30d) | HTTP-only cookies + JWT + "Remember Me" checkbox |
| Password management | Env default + Admin override | `.env` sets initial password, admin can change via SiteSettings |
| Admin structure | Super Admin + Regular Admin | Role-based access with invitation system |
| Admin creation | Hybrid | First admin via seed script, rest via invitation |
| Categories | 2-level hierarchy | Main + Subcategories (dedicated collection, not product field) |
| Brands | Dedicated collection | Separate table from categories (eliminates `type` field confusion) |
| Product variants | Cards/badges on detail | Click updates image + stock display (client-side state swap) |
| Variant flavor count | Virtual field + batch query | Detail: `afterRead` hook. Listings: separate `count()` query |
| Cart model | Server-side relational | `carts` + `cart_items` tables — NOT embedded array |
| Cart UI state | Zustand (drawer only) | Zustand stores UI state only (open/close). NO cart items in Zustand |
| Cart pricing | Live fetch | Prices fetched fresh from DB; `price_at_add` stored for change detection |
| Stock model | Direct Decrement | No `reserved_quantity`. Atomic decrement at order creation |
| Stock concurrency | PostgreSQL serializable isolation | No explicit row locks needed — serializable prevents race conditions |
| Order number format | `VX-XXXXXX` (alphanumeric) | ~729M combos, <0.007% collision at 10K orders, retry guarantees uniqueness |
| Checkout fields | Name + Phone + Address + Notes | Phone: strict `+1` US format. Honeypot integrated into Zod schema |
| Order statuses | 4 statuses | `pending → processing → completed \| cancelled` |
| Fraud prevention | Multi-layer | Honeypot (Zod `.max(0)`) + Rate Limiting (LRU) + Manual Approval |
| Media storage | Cloudinary | Community plugin: `payload-cloudinary` |
| Pagination | Infinite scroll | Offset-based (`page: N`) for all product listings |
| Home page layout | Multi-section | Brands Grid + Categories Grid + New Products |
| Order tracking | By Order Number or Phone | Dedicated page, no authentication required |
| Cart expiration | 24h cron job | Vercel cron (`vercel.json`) + Bearer `CRON_SECRET` header |
| Monitoring | Sentry | Error tracking from launch |
| Deployment | Vercel | `*.vercel.app` subdomain for testing |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Edge + Serverless)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js 15 (App Router)                │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ (storefront) │  │  (payload)   │  │    api/      │   │  │
│  │  │  Public UI   │  │ Admin Panel  │  │  Webhooks    │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │  │
│  │         │                 │                  │           │  │
│  │         ▼                 ▼                  ▼           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Payload CMS v3 (Local API)            │  │  │
│  │  │  • Collections  • Hooks  • Access Control          │  │  │
│  │  └──────────────────────┬─────────────────────────────┘  │  │
│  └─────────────────────────┼────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐ ┌─────────────┐ ┌─────────────┐
│ Neon PostgreSQL  │ │ Cloudinary  │ │   Sentry    │
│ (Serverless DB)  │ │  (Media)    │ │ (Monitoring)│
│                  │ │             │ │             │
│ • 12 tables      │ │ • Images    │ │ • Errors    │
│ • Transactions   │ │ • WebP/CDN  │ │ • Traces    │
│ • Connection     │ │ • Auto      │ │             │
│   pooling        │ │   optimize  │ │             │
└──────────────────┘ └─────────────┘ └─────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| UI State | Zustand (drawer open/close only) |
| Animation | Framer Motion |
| CMS | Payload CMS v3 (Local API) |
| Database | Neon PostgreSQL (serverless, connection pooling) |
| ORM | Drizzle (via Payload adapter) |
| Auth | Custom session-based (JWT in HTTP-only cookies) |
| Media | Cloudinary via `payload-cloudinary` plugin |
| Monitoring | Sentry |
| Deployment | Vercel (auto deploy on git push) |

### Architecture Layers (FSD)

```
┌─────────────────────────────────────────────────┐
│  app/              Composer Layer (Pages)        │  ← Connects features
│  widgets/          Composite UI (Header, Footer) │  ← Composes features
│  features/         Business Units (Cart, Gate)   │  ← Self-contained, isolated
│  modules/          Shared Logic (Orders, Catalog)│  ← Pure TS, no UI
│  core/             Infrastructure (Logger, Auth) │  ← Foundation
│  payload/          CMS Config (Collections)      │  ← Data layer
│  shared/           Toolkit (UI, Utils, Types)    │  ← Dumb primitives
└─────────────────────────────────────────────────┘

Dependency Flow:  app → widgets → features → modules → core → shared
                  (STRICTLY downward — no upward or cross-layer imports)
```

### Schema Principles

- Use PostgreSQL native types — `UUID` for orders/carts, `SERIAL` for internal IDs
- Foreign key constraints enforced at database level
- Indexes REQUIRED on all foreign keys and query-hot columns
- `created_at` / `updated_at` timestamps on all mutable tables
- No soft deletes — hard delete with cascading FK rules
- Atomic transactions for stock operations (Payload v3 API)
- `price_at_add` stored for live price change detection
- No `reserved_quantity` — Direct Decrement model only

---

## Database Schema

### Tables

#### 1. brands

```sql
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,                            -- Cloudinary URL
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_active ON brands(is_active);
```

#### 2. categories

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,                            -- Cloudinary URL
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Max 2 levels: parent → child only (enforced in application hook)
  CHECK (parent_id IS NULL OR parent_id != id)  -- No self-reference
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

#### 3. products

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  unit_label TEXT NOT NULL DEFAULT 'Unit',
  image_url TEXT,                            -- Main image (Cloudinary URL)
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_created ON products(created_at DESC);
```

#### 4. product_categories (M:N pivot)

```sql
-- Many-to-many: one product can belong to multiple categories
CREATE TABLE product_categories (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_product_categories_category ON product_categories(category_id);
```

#### 5. product_variants

```sql
-- NO reserved_quantity — Direct Decrement model
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,                -- e.g., "Strawberry Ice"
  sku TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,                            -- Variant-specific image (Cloudinary)
  option_value TEXT,                         -- Filter label (e.g., "Small", "6mg")
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_active ON product_variants(is_active);
```

#### 6. orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(10) NOT NULL UNIQUE,  -- Format: "VX-7K3M2P"
  session_id TEXT NOT NULL,
  customer_name VARCHAR(255) NOT NULL CHECK (char_length(btrim(customer_name)) >= 2),
  customer_phone VARCHAR(50) NOT NULL,       -- +1 US format
  delivery_address TEXT NOT NULL CHECK (char_length(btrim(delivery_address)) >= 10),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  cancellation_reason TEXT,
  cancelled_by VARCHAR(20)                   -- 'customer' | 'admin'
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin')),
  cancelled_at TIMESTAMP,
  honeypot_field TEXT,                       -- MUST be empty (bot detection)
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Status consistency: cancelled fields only when cancelled
  CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
    OR
    (status != 'cancelled' AND cancelled_at IS NULL AND cancellation_reason IS NULL AND cancelled_by IS NULL)
  )
);

CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_number ON orders(order_number);
```

#### 7. order_items

```sql
-- Prices are SNAPSHOT at order creation — never change after insert
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id),
  product_name TEXT NOT NULL,                -- Snapshot (product may change later)
  variant_name TEXT NOT NULL,                -- Snapshot (variant may change later)
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Computed consistency
  CHECK (total_price = unit_price * quantity)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
```

#### 8. carts

```sql
-- Server-side relational cart — NOT embedded array, NOT localStorage
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,           -- Links to gate session
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL              -- 24h from last activity
);

CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_expires ON carts(expires_at);
```

#### 9. cart_items

```sql
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 10),
  price_at_add DECIMAL(10,2) NOT NULL,       -- Price when added (change detection)
  added_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_variant ON cart_items(variant_id);
-- One variant per cart only — upsert on duplicate
CREATE UNIQUE INDEX idx_cart_items_unique ON cart_items(cart_id, variant_id);
```

#### 10. store_settings

```sql
CREATE TABLE store_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO store_settings (key, value, description) VALUES
  ('gate_password', '$2a$10$...', 'Bcrypt-hashed password for site access gate'),
  ('whatsapp_number', '+15550199999', 'WhatsApp contact number');
```

#### 11. variant_options

```sql
-- Helper table for admin autocomplete when creating variants
CREATE TABLE variant_options (
  id SERIAL PRIMARY KEY,
  option_name TEXT NOT NULL,                 -- e.g., "Flavor", "Size", "Nicotine"
  option_value TEXT NOT NULL,                -- e.g., "Strawberry Ice", "50ml", "6mg"
  UNIQUE (option_name, option_value)
);

CREATE INDEX idx_variant_options_name ON variant_options(option_name);
```

#### 12. users (Payload built-in)

```sql
-- Auto-created by Payload CMS — configured via Users collection
-- Admins only (no customer accounts)
-- Fields: email, password (hashed), name, role, isActive, lastLogin
-- Roles: 'super-admin' | 'admin'
```

### Key Schema Decisions

| Decision | Rationale |
|----------|-----------|
| Dedicated `brands` table | Eliminates admin confusion from mixed `type` column in categories |
| `price_at_add` in cart_items | Enables live price change detection (`current_price != price_at_add`) |
| `order_number` VARCHAR(10) | Short, user-friendly, memorable for phone lookup and screenshots |
| Snapshots in order_items | `product_name`, `variant_name`, `unit_price` frozen at order time |
| `honeypot_field` in orders | Hidden form field for bot detection — must be empty |
| `customer_phone` indexed | Enables order history lookup by phone number |
| No `reserved_quantity` | Direct Decrement model — simpler, sufficient for COD |
| No `subtotal`/`tax`/`shipping` | No tax, no shipping — `total_amount` is the only price field |
| UUID for orders/carts | Security (unguessable) + scalability |
| Integer for products/variants | Performance for frequent queries |
| `cart_items` UNIQUE constraint | One variant per cart — upsert on duplicate |
| `total_price` CHECK constraint | DB-level enforcement: `total_price = unit_price * quantity` |

### Order Status Transitions (Enforced)

```
                    ┌──────────────┐
                    │   pending    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌──────────────┐         ┌──────────────┐
     │  processing  │         │  cancelled   │
     └──────┬───────┘         └──────────────┘
            │                   (final state)
   ┌────────┼────────┐
   ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  completed   │  │  cancelled   │
└──────────────┘  └──────────────┘
  (final state)     (final state)

Allowed:  pending → processing ✅
          pending → cancelled ✅
          processing → completed ✅
          processing → cancelled ✅
Blocked:  completed → (any) ❌
          cancelled → (any) ❌
```

---

## Authentication & Password Gate

### Gate Architecture Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────────┐
│  User    │────▶│  Middleware   │────▶│  Cookie exists?     │
│ visits   │     │  (UX ONLY)   │     │                     │
└──────────┘     └──────────────┘     └──────┬──────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼                              ▼
                    ┌──────────────┐             ┌──────────────────┐
                    │  YES: Allow  │             │  NO: Redirect    │
                    │  (verify in  │             │  to /gate        │
                    │  DAL later)  │             └──────────────────┘
                    └──────────────┘

⚠️  CRITICAL (CVE-2025-29927): Middleware is UX redirect ONLY.
    Security verification MUST happen in Server Components/Actions via DAL.
```

### Session Management

```typescript
interface GateSession {
  isAuthenticated: boolean
  sessionId: string        // UUID — links to cart
  createdAt: Date
  expiresAt: Date          // 24h (default) or 30 days (remember me)
}

// Cookie: 'gate-session'
// Security: httpOnly, secure (production), sameSite: 'lax'
// Default expiration: 24 hours
// Remember Me: 30 days
```

### Password Resolution Order

```
Priority:  Database > Environment

1. Check store_settings WHERE key = 'gate_password'
2. If found → use DB value (bcrypt hash)
3. If not found → use process.env.GATE_PASSWORD (plain text, hash on compare)
4. Admin can override via SiteSettings global in admin panel
```

### Admin Roles

```
┌─────────────────────────────────────────────────────────┐
│                    Super Admin                           │
│  • Full access to everything                            │
│  • Create/delete admins (invitation system)             │
│  • Change site settings (including gate password)       │
│  • Delete orders                                        │
│  • Creation: seed script only                           │
├─────────────────────────────────────────────────────────┤
│                    Regular Admin                         │
│  • Manage products, categories, brands                  │
│  • Manage orders (except delete)                        │
│  • View dashboard                                       │
│  • Cannot create/delete admins                          │
│  • Cannot change critical settings                      │
│  • Creation: invitation from Super Admin                │
└─────────────────────────────────────────────────────────┘
```

---

## Logic Pipelines

### Pipeline 1: Password Gate Verification

```python
async def verify_password(
    password: str,
    remember_me: bool,
    client_ip: str
) -> ActionResult:
    """
    Verify site access password and create session.

    Steps:
    1. Rate limit check
    2. Resolve password source
    3. Compare with bcrypt
    4. Create session or reject
    """
    # 1. Rate limit check (5 attempts/min/IP)
    if rate_limiter.is_limited(client_ip, limit=5, window="1m"):
        return ActionResult(success=False, error="Too many attempts. Try again later.")

    # 2. Resolve password (DB takes priority over env)
    db_password = await get_setting("gate_password")  # bcrypt hash or None
    if db_password:
        password_hash = db_password
    else:
        password_hash = bcrypt.hash(env.GATE_PASSWORD)

    # 3. Compare
    is_valid = bcrypt.compare(password, password_hash)

    if not is_valid:
        return ActionResult(success=False, error="Invalid password")

    # 4. Create session
    session_id = uuid4()
    expiry = timedelta(days=30) if remember_me else timedelta(hours=24)

    token = jwt.encode({
        "sessionId": session_id,
        "isAuthenticated": True,
        "createdAt": now(),
        "expiresAt": now() + expiry,
    }, env.SESSION_SECRET)

    set_cookie("gate-session", token, {
        "httpOnly": True,
        "secure": env.NODE_ENV == "production",
        "sameSite": "lax",
        "maxAge": expiry.total_seconds(),
    })

    return ActionResult(success=True)
```

### Pipeline 2: Add to Cart

```python
async def add_to_cart(
    variant_id: int,
    quantity: int,
    session_id: str
) -> CartResult:
    """
    Add item to server-side cart.

    Steps:
    1. Verify session via DAL
    2. Validate variant exists and is active
    3. Check stock availability
    4. Get or create cart
    5. Upsert cart item
    6. Extend expiration
    7. Return updated cart
    """
    # 1. Verify session
    session = await dal.verify_session()
    if not session:
        raise AppError(401, "Session expired")

    # 2. Validate variant
    variant = await payload.findByID("product_variants", variant_id, {
        "overrideAccess": False,
        "depth": 1,  # include parent product
    })
    if not variant or not variant.is_active:
        raise AppError(404, "Variant not found or inactive")
    if not variant.product.is_active:
        raise AppError(400, "Product is no longer available")

    # 3. Check stock
    if variant.stock_quantity < quantity:
        raise AppError(400, f"Only {variant.stock_quantity} available")

    # 4. Get or create cart
    cart = await payload.find("carts", {
        "where": { "session_id": { "equals": session.sessionId } },
        "limit": 1,
    })
    if not cart.docs:
        cart = await payload.create("carts", {
            "session_id": session.sessionId,
            "expires_at": now() + timedelta(hours=24),
        })
    else:
        cart = cart.docs[0]

    # 5. Upsert cart item
    existing = await payload.find("cart_items", {
        "where": {
            "and": [
                { "cart_id": { "equals": cart.id } },
                { "variant_id": { "equals": variant_id } },
            ]
        }
    })

    if existing.docs:
        new_qty = min(existing.docs[0].quantity + quantity, 10)  # MAX_QUANTITY: 10
        await payload.update("cart_items", existing.docs[0].id, {
            "quantity": new_qty,
        })
    else:
        await payload.create("cart_items", {
            "cart_id": cart.id,
            "variant_id": variant_id,
            "quantity": min(quantity, 10),
            "price_at_add": variant.price,  # Store current price for change detection
        })

    # 6. Extend cart expiration
    await payload.update("carts", cart.id, {
        "expires_at": now() + timedelta(hours=24),
    })

    # 7. Revalidate and return
    revalidatePath("/cart")
    return CartResult(success=True)
```

### Pipeline 3: Live Price Detection (Cart View)

```python
async def get_cart_with_live_prices(
    session_id: str
) -> CartDisplay:
    """
    Fetch cart items with current variant prices.
    Detect price changes since item was added.

    Steps:
    1. Get cart items with variant JOIN
    2. Compare current vs stored price
    3. Detect inactive items
    4. Return display data
    """
    # 1. Get cart items with current variant data
    cart = await get_cart_by_session(session_id)
    items = await payload.find("cart_items", {
        "where": { "cart_id": { "equals": cart.id } },
        "depth": 2,  # Include variant → product
    })

    display_items = []
    price_changes = []
    inactive_items = []

    for item in items.docs:
        variant = item.variant
        product = variant.product

        # 2. Price change detection
        current_price = variant.price
        stored_price = item.price_at_add

        if current_price != stored_price:
            price_changes.append({
                "variant_name": variant.variant_name,
                "old_price": stored_price,
                "new_price": current_price,
            })

        # 3. Inactive detection
        if not variant.is_active or not product.is_active:
            inactive_items.append(item.id)

        display_items.append({
            "id": item.id,
            "product_name": product.name,
            "variant_name": variant.variant_name,
            "quantity": item.quantity,
            "current_price": current_price,     # Always show LIVE price
            "is_available": variant.is_active and product.is_active,
            "image": variant.image_url or product.image_url,
        })

    return CartDisplay(
        items=display_items,
        price_changes=price_changes,        # "⚠️ Price for X changed from $A to $B"
        inactive_items=inactive_items,       # Greyed out, must remove before checkout
        total=sum(i["current_price"] * i["quantity"] for i in display_items
                  if i["is_available"]),
    )
```

### Pipeline 4: Checkout (Atomic Transaction)

```python
async def process_checkout(
    form_data: CheckoutInput,
    session_id: str
) -> CheckoutResult:
    """
    Process checkout with atomic stock decrement.

    Steps:
    1. Rate limit check
    2. Validate input (Zod + honeypot)
    3. Re-fetch cart with live prices
    4. Check for inactive items
    5. BEGIN TRANSACTION
    6. Verify + decrement stock
    7. Generate order number
    8. Create order + order_items (snapshots)
    9. COMMIT
    10. Delete cart
    11. Return order info
    """
    # 1. Rate limit (3/min/session)
    if rate_limiter.is_limited(session_id, limit=3, window="1m"):
        raise AppError(429, "Too many requests")

    # 2. Validate with Zod
    validated = checkout_schema.parse(form_data)
    # Honeypot check — silent reject (fake success to not reveal detection)
    if validated.honeypot_field:
        return CheckoutResult(success=True, order_number="FAKE")  # Bot trapped

    # 3. Re-fetch cart with live prices
    cart_items = await get_cart_items_with_variants(session_id)
    if not cart_items:
        raise AppError(400, "Cart is empty")

    # 4. Check for inactive items
    inactive = [i for i in cart_items if not i.variant.is_active or not i.variant.product.is_active]
    if inactive:
        raise AppError(400, "Remove unavailable items before checking out")

    # 5. BEGIN TRANSACTION (Payload v3 API)
    transaction_id = await payload.db.begin_transaction()

    try:
        # 6. Verify + decrement stock for each item
        for item in cart_items:
            variant = await payload.findByID("product_variants", item.variant_id, {
                "req": { "transactionID": transaction_id },
            })

            if variant.stock_quantity < item.quantity:
                raise AppError(400, f"Insufficient stock for {variant.variant_name}: "
                               f"requested {item.quantity}, available {variant.stock_quantity}")

            await payload.update("product_variants", item.variant_id, {
                "stock_quantity": variant.stock_quantity - item.quantity,
            }, {
                "req": { "transactionID": transaction_id },
            })

        # 7. Generate unique order number
        order_number = await generate_order_number(transaction_id)

        # 8. Calculate total (live prices)
        total = sum(item.variant.price * item.quantity for item in cart_items)

        # 9. Create order
        order = await payload.create("orders", {
            "order_number": order_number,
            "session_id": session_id,
            "customer_name": validated.customer_name,
            "customer_phone": validated.customer_phone,
            "delivery_address": validated.delivery_address,
            "notes": validated.notes,
            "status": "pending",
            "total_amount": total,
            "honeypot_field": validated.honeypot_field,
        }, {
            "req": { "transactionID": transaction_id },
        })

        # 10. Create order_items (SNAPSHOT prices)
        for item in cart_items:
            await payload.create("order_items", {
                "order_id": order.id,
                "variant_id": item.variant_id,
                "product_name": item.variant.product.name,       # Snapshot
                "variant_name": item.variant.variant_name,       # Snapshot
                "quantity": item.quantity,
                "unit_price": item.variant.price,                # Locked price
                "total_price": item.variant.price * item.quantity,
            }, {
                "req": { "transactionID": transaction_id },
            })

        # COMMIT
        await payload.db.commit_transaction(transaction_id)

    except Exception as e:
        # ROLLBACK on any failure
        await payload.db.rollback_transaction(transaction_id)
        raise e

    # 11. Delete cart + cart_items (CASCADE)
    await payload.delete("carts", cart.id)

    # 12. Return result
    return CheckoutResult(
        success=True,
        order_id=order.id,
        order_number=order_number,
    )
    # → Redirect to /order-confirmation/[orderId]
```

### Pipeline 5: Order Number Generation

```python
async def generate_order_number(
    transaction_id: str = None
) -> str:
    """
    Generate unique, human-friendly order number.

    Format: VX-XXXXXX
    Charset: 23456789ABCDEFGHJKMNPQRSTUVWXYZ (30 chars, no ambiguous 0/O/1/I/L)
    Combinations: 30^6 = ~729 million
    Collision: <0.007% at 10K orders, retry guarantees uniqueness
    """
    CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"  # 30 chars
    MAX_RETRIES = 3

    # Get prefix from settings (default: "VX")
    prefix = await get_setting("order_prefix") or "VX"

    for attempt in range(MAX_RETRIES):
        # Generate 6 random characters
        random_part = "".join(random.choice(CHARSET) for _ in range(6))
        order_number = f"{prefix}-{random_part}"

        # Check uniqueness
        existing = await payload.find("orders", {
            "where": { "order_number": { "equals": order_number } },
            "limit": 1,
        })

        if not existing.docs:
            return order_number

    # If all retries collide (astronomically unlikely), raise error
    raise AppError(500, "Failed to generate unique order number")
```

### Pipeline 6: Order Cancellation (Stock Return)

```python
async def cancel_order(
    order_id: str,
    reason: str,
    cancelled_by: str  # 'customer' | 'admin'
) -> OrderResult:
    """
    Cancel order and return stock.

    Steps:
    1. Validate order exists and is cancellable
    2. Validate status transition
    3. Return stock for each item
    4. Update order status
    """
    # 1. Get order
    order = await payload.findByID("orders", order_id)
    if not order:
        raise AppError(404, "Order not found")

    # 2. Validate transition (only pending/processing can be cancelled)
    if order.status in ("completed", "cancelled"):
        raise AppError(400, f"Cannot cancel order with status '{order.status}'")

    # 3. Return stock
    order_items = await payload.find("order_items", {
        "where": { "order_id": { "equals": order_id } },
    })

    for item in order_items.docs:
        if item.variant_id:
            variant = await payload.findByID("product_variants", item.variant_id)
            if variant:
                await payload.update("product_variants", item.variant_id, {
                    "stock_quantity": variant.stock_quantity + item.quantity,
                })

    # 4. Update order
    await payload.update("orders", order_id, {
        "status": "cancelled",
        "cancellation_reason": reason,
        "cancelled_by": cancelled_by,
        "cancelled_at": now(),
    })

    return OrderResult(success=True)
```

### Pipeline 7: Cart Cleanup (Cron Job)

```python
async def cleanup_expired_carts() -> CleanupResult:
    """
    Delete expired carts. Runs every 6 hours via Vercel cron.

    Endpoint: GET /api/cron/cleanup-carts
    Schedule: 0 */6 * * * (every 6 hours)
    Auth: Authorization: Bearer ${CRON_SECRET}
    """
    # 1. Verify cron secret
    auth_header = request.headers.get("Authorization")
    if auth_header != f"Bearer {env.CRON_SECRET}":
        return Response(status=401)

    # 2. Find and delete expired carts
    expired = await payload.find("carts", {
        "where": {
            "expires_at": { "less_than": now() },
        },
        "limit": 1000,
    })

    deleted_count = 0
    for cart in expired.docs:
        await payload.delete("carts", cart.id)  # CASCADE deletes cart_items
        deleted_count += 1

    # 3. Log result
    logger.info(f"Cart cleanup: deleted {deleted_count} expired carts")

    return CleanupResult(deleted=deleted_count)
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-carts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Pipeline 8: Variant Selection (Client-Side)

```typescript
// Client-side state swap — NO server fetch on variant click
// All variants are pre-loaded with depth: 2 on initial page load

interface VariantDisplay {
  id: number
  variantName: string
  price: number
  stockQuantity: number
  imageUrl: string | null
}

// On variant click:
function handleVariantSelect(variant: VariantDisplay, product: Product) {
  // 1. Update displayed image (instant — no fetch)
  //    Fallback chain: variant.imageUrl → product.imageUrl → placeholder
  const displayImage = variant.imageUrl || product.imageUrl || PLACEHOLDER_IMAGE

  // 2. Update price display
  const displayPrice = variant.price

  // 3. Update stock status
  //    > 10: "In Stock"
  //    1-10: "Low Stock (X left)"
  //    0: "Out of Stock" (disable "Add to Cart")

  // 4. Update quantity selector max
  const maxQuantity = Math.min(variant.stockQuantity, 10)
}
```

---

## Server Actions Specification

### Feature: Gate

| Action | File | Input | Output | Rate Limit |
|--------|------|-------|--------|------------|
| Verify Password | `verify-password.action.ts` | `{ password: string, rememberMe: boolean }` | `{ success: boolean, error?: string }` | 5/min/IP |

**Zod Schema:**
```typescript
const gateSchema = z.object({
  password: z.string().min(1, "Password required"),
  rememberMe: z.boolean().default(false),
})
```

### Feature: Cart

| Action | File | Input | Output | Rate Limit |
|--------|------|-------|--------|------------|
| Add to Cart | `add-to-cart.action.ts` | `{ variantId: number, quantity: number }` | `{ success: boolean, error?: string }` | 20/min/session |
| Update Quantity | `update-quantity.action.ts` | `{ cartItemId: number, quantity: number }` | `{ success: boolean }` | 20/min/session |
| Remove Item | `remove-item.action.ts` | `{ cartItemId: number }` | `{ success: boolean }` | 20/min/session |
| Clear Cart | `clear-cart.action.ts` | `{}` | `{ success: boolean }` | 20/min/session |

**Zod Schema:**
```typescript
const addToCartSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
})

const updateQuantitySchema = z.object({
  cartItemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
})
```

### Feature: Checkout

| Action | File | Input | Output | Rate Limit |
|--------|------|-------|--------|------------|
| Process Checkout | `process-checkout.action.ts` | `CheckoutInput` | `{ success: boolean, orderId?: string, orderNumber?: string }` | 3/min/session |

**Zod Schema:**
```typescript
const checkoutSchema = z.object({
  customerName: z.string().min(2).max(255),
  customerPhone: z.string().regex(/^\+1\d{10}$/, "Must be +1 US format"),
  deliveryAddress: z.string().min(10).max(500),
  notes: z.string().max(1000).optional(),
  honeypotField: z.string().max(0).optional(),  // Must be empty — bot detection
})
```

### Feature: Order Tracking

| Action | File | Input | Output | Rate Limit |
|--------|------|-------|--------|------------|
| Track by Number | `track-order.action.ts` | `{ orderNumber: string }` | `{ order: OrderDisplay }` | — |
| Lookup by Phone | `lookup-orders.action.ts` | `{ phone: string }` | `{ orders: OrderDisplay[] }` | — |

### Feature: Search

| Action | File | Input | Output | Rate Limit |
|--------|------|-------|--------|------------|
| Search Products | `search-products.action.ts` | `{ query: string, page?: number }` | `{ results: Product[], hasMore: boolean }` | — |

### Module: Catalog — Service API

| Method | Signature | Description |
|--------|-----------|-------------|
| `getActiveProducts` | `({ page, limit }) → PaginatedResult` | Paginated active products |
| `getProductsByCategory` | `(categoryId, { page, limit }) → PaginatedResult` | Products filtered by category |
| `getProductsByBrand` | `(brandId, { page, limit }) → PaginatedResult` | Products filtered by brand |
| `getNewProducts` | `(limit) → Product[]` | Latest products by `created_at DESC` |
| `getFlavorCount` | `(productId) → number` | Count of active variants |
| `searchProducts` | `(query, { page, limit }) → PaginatedResult` | Full-text search |
| `getCategoryTree` | `() → CategoryTree` | Hierarchical category structure |
| `getCategoryWithProducts` | `(slug) → { category, products }` | Category + its products |
| `getAllBrands` | `() → Brand[]` | Active brands for home page |
| `getBrandWithProducts` | `(slug) → { brand, products }` | Brand + its products |
| `getSuggestions` | `(query) → string[]` | Autocomplete top 5 |

### Module: Orders — Service API

| Method | Signature | Description |
|--------|-----------|-------------|
| `createOrder` | `(data) → Order` | Atomic: validate → decrement → create |
| `updateOrderStatus` | `(id, status) → Order` | Validates transition rules |
| `cancelOrder` | `(id, reason, cancelledBy) → Order` | Returns stock on cancel |
| `getOrderByNumber` | `(orderNumber) → Order` | For customer tracking |
| `getOrdersByPhone` | `(phone) → Order[]` | Order history by phone |
| `generateOrderNumber` | `() → string` | Unique VX-XXXXXX |
| `validateStatusTransition` | `(from, to) → boolean` | Enforces allowed transitions |
| `checkAvailability` | `(items[]) → AvailabilityResult` | Verify stock for all items |
| `decrementStock` | `(items[], txId) → void` | Atomic within transaction |
| `returnStock` | `(items[]) → void` | On cancellation |

---

## Payload Collection Specifications

### Collections

| Collection | Slug | Location | Auth | Access |
|-----------|------|----------|------|--------|
| Users | `users` | `payload/collections/users.ts` | ✅ Payload built-in | Read: Admins, Create/Delete: Super Admin |
| Brands | `brands` | `payload/collections/brands.ts` | — | Read: Public + Admin, CUD: Admin |
| Categories | `categories` | `payload/collections/categories.ts` | — | Read: Public + Admin, CUD: Admin |
| Products | `products` | `payload/collections/products.ts` | — | Read: Public + Admin, CUD: Admin |
| ProductVariants | `product_variants` | `payload/collections/product-variants.ts` | — | Read: Public + Admin, CU: Admin, Delete: Super |
| Media | `media` | `payload/collections/media.ts` | — | Read: Public, CUD: Admin |
| Carts | `carts` | `features/cart/db/schema.ts` | — | Feature-owned |
| CartItems | `cart_items` | `features/cart/db/schema.ts` | — | Feature-owned |
| Orders | `orders` | `features/checkout/db/schema.ts` | — | Feature-owned |
| OrderItems | `order_items` | `features/checkout/db/schema.ts` | — | Feature-owned |

### Globals

| Global | Slug | Location | Access |
|--------|------|----------|--------|
| SiteSettings | `site-settings` | `payload/globals/site-settings.ts` | Read: Admin, Update: Super Admin |

### Hooks

| Hook | Type | Collection | Purpose |
|------|------|-----------|---------|
| `generate-slug` | `beforeChange` | Products, Categories, Brands | Auto-generate slug from name |
| `validate-parent-depth` | `beforeChange` | Categories | Max 2 levels (parent → child) |
| `revalidate-cache` | `afterChange` | Products, Categories, Brands | Clear Next.js cache on data change |

### Cloudinary Plugin Config

```typescript
import { cloudinaryPlugin } from 'payload-cloudinary'

plugins: [
  cloudinaryPlugin({
    credentials: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    },
    collections: {
      media: {
        folder: 'vape-store',
        disableLocalStorage: true,
      },
    },
  }),
]

// Cloudinary Transformations (via Next.js <Image> + Cloudinary URLs):
// thumbnail: 200x200, crop
// medium:    800x800, fit
// large:     1600x1600, fit
// format:    f_auto,q_auto (automatic WebP + quality)
```

---

## Security & Fraud Prevention

### Multi-Layer Protection

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Honeypot Field                         │
│  • Hidden input (CSS: display:none)             │
│  • If filled → silent reject (fake success)     │
│  • Zod: z.string().max(0).optional()            │
├─────────────────────────────────────────────────┤
│  Layer 2: Rate Limiting (LRU-Cache)             │
│  • Gate: 5 attempts/min/IP                      │
│  • Cart: 20 ops/min/session                     │
│  • Checkout: 3 attempts/min/session             │
├─────────────────────────────────────────────────┤
│  Layer 3: Input Validation (Zod)                │
│  • Phone: +1 US regex                           │
│  • Name: 2-255 chars                            │
│  • Address: 10-500 chars                        │
│  • All fields server-side validated             │
├─────────────────────────────────────────────────┤
│  Layer 4: Manual Approval                       │
│  • ALL orders start as 'pending'                │
│  • Admin reviews before 'processing'            │
│  • Suspicious patterns → admin cancels          │
└─────────────────────────────────────────────────┘
```

### Session Security

| Property | Value |
|----------|-------|
| Token type | JWT |
| Storage | HTTP-only cookie |
| Secure flag | `true` in production |
| SameSite | `lax` |
| Verification | DAL at every data access point |
| Middleware role | UX redirects ONLY (NOT security) |

---

## Admin Panel Customization

### Dashboard Components

```
┌─────────────────────────────────────────────────┐
│  📊 Admin Dashboard                             │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ 🔔 New   │  │ 💰 Sales    │  │ ⚠️ Low  │  │
│  │ Orders   │  │ Summary     │  │ Stock    │  │
│  │  (badge) │  │ day/wk/mo   │  │ Alerts   │  │
│  └──────────┘  └──────────────┘  └──────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  📋 Recent Orders Table                 │    │
│  │  Order # | Customer | Status | Amount   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Quick Actions: [Create Product] [View Orders]  │
└─────────────────────────────────────────────────┘
```

### Custom Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `OrderStatusBadge.tsx` | `payload/admin/components/` | Colored: pending=yellow, processing=blue, completed=green, cancelled=red |
| `StockIndicator.tsx` | `payload/admin/components/` | Green >10, Yellow 1-10, Red 0 |
| `QuickEditStock.tsx` | `payload/admin/components/` | Inline stock editor on variant list |
| `Icon.tsx` | `payload/admin/graphics/` | Custom admin panel icon |
| `Logo.tsx` | `payload/admin/graphics/` | Custom admin panel logo |
| `Dashboard.tsx` | `payload/admin/views/` | Custom dashboard view |

---

## Frontend Structure

### Route Map

```
(storefront)/
├── layout.tsx                    Storefront layout (Header, Footer, WhatsApp)
├── page.tsx                      Home: Brands Grid + Categories Grid + New Products
├── gate/page.tsx                 Password Gate form
├── brands/[slug]/page.tsx        Brand products (infinite scroll)
├── categories/[slug]/page.tsx    Category products (infinite scroll)
├── products/
│   ├── page.tsx                  All Products (infinite scroll + filters)
│   └── [slug]/page.tsx           Product Detail (variant cards, image swap)
├── search/page.tsx               Search Results (infinite scroll)
├── cart/page.tsx                  Cart Page (full view)
├── checkout/page.tsx             Checkout Form (COD)
├── order-confirmation/
│   └── [orderId]/page.tsx        Order Success + screenshot prompt
└── track-order/page.tsx          Track by Order Number or Phone

(payload)/
└── admin/[[...segments]]/page.tsx Payload Admin Panel

api/
└── cron/cleanup-carts/route.ts   Cart cleanup cron endpoint
```

### Key UI Components

| Component | Feature | Behavior |
|-----------|---------|----------|
| `GateForm` | gate | Password + Remember Me + rate limit warning |
| `ProductCard` | products | Image, name, brand, "X Flavors" count → link to detail |
| `ProductDetail` | products | Variant cards, image swap, quantity selector, Add to Cart |
| `VariantSelector` | products | Cards/badges showing name, price, stock status |
| `BrandCard` / `BrandGrid` | products | Logo + name → link to brand page |
| `CategoryCard` / `CategoryGrid` | products | Image + name → link to category page |
| `CartDrawer` | cart | Slide-out panel from right (Sheet component) |
| `CartButton` | cart | Header icon with item count badge |
| `CartItem` | cart | Image, name, price, quantity controls, remove |
| `PriceChangeNotice` | cart | "⚠️ Price changed from $X to $Y" banner |
| `CheckoutForm` | checkout | Customer fields + honeypot + COD disclaimer |
| `OrderConfirmation` | checkout | Order number (large) + items + "📸 Screenshot" prompt |
| `TrackOrderForm` | order-tracking | Order number OR phone number input |
| `StatusTimeline` | order-tracking | 3-step visual: Pending → Processing → Completed |
| `SearchBar` | search | Debounced (300ms) with autocomplete (top 5) |
| `FilterPanel` | filters | Category, Brand, Price Range, Stock Status |
| `SortDropdown` | filters | Newest, Price Low→High, Price High→Low, A-Z |
| `Header` | widget | Logo, search, cart button, navigation |
| `Footer` | widget | Links, contact info |
| `ProductGrid` | widget | Responsive grid with infinite scroll |
| `WhatsAppButton` | widget | Floating button (bottom-right) |

### Zustand Store (UI Only)

```typescript
// features/cart/logic/use-cart.ts
interface CartUIState {
  isDrawerOpen: boolean
  isLoading: boolean
  openDrawer: () => void
  closeDrawer: () => void
  setLoading: (loading: boolean) => void
}
// NO items[], NO total, NO localStorage persistence
// Cart data is ALWAYS fetched from server
```

---

## Build Order

### Phase 1: Foundation (Week 1, Days 1-5)

| Step | Task | Description |
|------|------|-------------|
| 1.1 | Project Init | Next.js 15 + Payload v3 + TypeScript strict |
| 1.2 | Tooling | Tailwind CSS + shadcn/ui + Framer Motion |
| 1.3 | FSD Structure | Create all `src/` directories per architecture |
| 1.4 | Database | Configure Neon PostgreSQL + connection pooling |
| 1.5 | Media | Configure Cloudinary plugin |
| 1.6 | Monitoring | Configure Sentry (client + server) |
| 1.7 | Env Validation | Zod schema for all env vars (`core/config/env.ts`) |
| 1.8 | Core: Errors | `AppError` hierarchy (`core/errors/`) |
| 1.9 | Core: Logger | Logger class with Sentry integration (`core/logger/`) |
| 1.10 | Core: Rate Limit | LRU-cache rate limiter (`core/rate-limit/`) |
| 1.11 | Collections | Users, Brands, Categories, Products, ProductVariants, Media |
| 1.12 | Globals | SiteSettings |
| 1.13 | Hooks | `generate-slug`, `validate-parent-depth`, `revalidate-cache` |
| 1.14 | Access Control | `is-admin.ts`, `is-super-admin.ts` |
| 1.15 | Seed Script | `scripts/seed-admin.ts` (Super Admin) |
| 1.16 | Auth | Session management + DAL + encryption (`core/auth/`) |
| 1.17 | Gate Feature | Password gate with Remember Me + rate limiting |
| 1.18 | Middleware | UX redirect to `/gate` (NOT security) |

> **Checkpoint 1**: Admin can log in. Gate protects storefront. Collections exist in admin panel. Media uploads to Cloudinary.

### Phase 2: Core Features (Week 2, Days 6-10)

| Step | Task | Description |
|------|------|-------------|
| 2.1 | Catalog Module | `product.service.ts`, `category.service.ts`, `brand.service.ts` |
| 2.2 | Home Page | Brands Grid + Categories Grid + New Products |
| 2.3 | Brand Page | `/brands/[slug]` with infinite scroll |
| 2.4 | Category Page | `/categories/[slug]` with infinite scroll |
| 2.5 | Product Detail | Variant cards, image swap, stock display, breadcrumbs |
| 2.6 | All Products | `/products` with infinite scroll |
| 2.7 | FlavorCount | Virtual field (afterRead) + batch query for listings |
| 2.8 | Cart Collections | Carts + CartItems (feature-owned) |
| 2.9 | Cart Actions | Add, update, remove, clear (all server actions) |
| 2.10 | Cart UI | CartDrawer + CartButton + Zustand (UI state only) |
| 2.11 | Live Price | Price change detection + notification banner |
| 2.12 | Inactive Items | Grey out unavailable items, block checkout |
| 2.13 | Cart Cron | Cleanup expired carts (`/api/cron/cleanup-carts`) |
| 2.14 | WhatsApp | Floating button widget |
| 2.15 | Orders Module | `order.service.ts`, `stock.service.ts` |
| 2.16 | Checkout Form | Customer fields + honeypot + COD disclaimer |
| 2.17 | Checkout Action | Atomic transaction (validate → decrement → create) |
| 2.18 | Order Confirm | Success page with order number + screenshot prompt |
| 2.19 | Order Tracking | Track by order number or phone number |

> **Checkpoint 2**: Full customer flow works: Gate → Browse → Cart → Checkout → Track. All server actions tested. Stock decrements atomically.

### Phase 3: Enhanced Features (Week 3, Days 11-14)

| Step | Task | Description |
|------|------|-------------|
| 3.1 | Search Feature | Debounced search + autocomplete (top 5) |
| 3.2 | Search Results | `/search?q=` with infinite scroll |
| 3.3 | Filter Panel | Category, Brand, Price Range, Stock Status |
| 3.4 | Sort Options | Newest, Price Low→High, Price High→Low, A-Z |
| 3.5 | URL Filters | Filter state in URL search params (shareable) |
| 3.6 | Order Management | Enhanced admin orders view + status transitions |
| 3.7 | Cancel Order | Cancel with reason + stock return |
| 3.8 | Order Badge | New orders badge/counter in admin |
| 3.9 | Stock Indicators | Admin: Green >10, Yellow 1-10, Red 0 |
| 3.10 | Low Stock Alerts | Dashboard alert for low stock items |
| 3.11 | Quick Edit Stock | Inline stock editor on variant list |

> **Checkpoint 3**: Search and filters work. Admin can manage orders with status transitions. Stock management operational.

### Phase 4: Polish & Deploy (Week 4, Days 15-20)

| Step | Task | Description |
|------|------|-------------|
| 4.1 | Unit Tests | Module services, validators |
| 4.2 | Integration Tests | Cart flow, checkout flow |
| 4.3 | E2E Tests | Gate → browse → cart → checkout → track |
| 4.4 | Admin Dashboard | Custom dashboard view with stats |
| 4.5 | Error Pages | 404 and 500 custom pages |
| 4.6 | Loading States | Skeletons for all data-loading pages |
| 4.7 | Mobile Audit | Responsive design verification |
| 4.8 | Accessibility | WCAG 2.1 AA compliance check |
| 4.9 | Vercel Setup | Environment variables, domain |
| 4.10 | DB Migration | Neon PostgreSQL production setup |
| 4.11 | Cron Setup | Cart cleanup in `vercel.json` |
| 4.12 | Sentry Verify | Error tracking confirmation |
| 4.13 | Media Test | Cloudinary upload/delete cycle |
| 4.14 | Performance | <2s page load target |
| 4.15 | Go Live | Deploy to `*.vercel.app` |

> **Checkpoint 4**: All tests passing. Performance validated. Production deployed and monitored.

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Payload CMS
PAYLOAD_SECRET="min-32-char-random-string-here..."
NEXT_PUBLIC_SERVER_URL="https://your-app.vercel.app"

# Authentication
SESSION_SECRET="min-32-char-random-string-here..."
GATE_PASSWORD="your-site-access-password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Sentry
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"

# Cron
CRON_SECRET="min-16-char-random-string"

# App
NODE_ENV="development"  # development | production | test
PORT="3000"
LOG_LEVEL="info"        # debug | info | warn | error
```

```typescript
// core/config/env.ts — Zod validated at startup
const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  PAYLOAD_SECRET: z.string().min(32),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  GATE_PASSWORD: z.string().min(6),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  SENTRY_DSN: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url(),
  CRON_SECRET: z.string().min(16),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})
```

---

## Verification Checklist

### Definition of Done

- [ ] Site accessible only through password gate
- [ ] "Remember Me" creates 30-day session
- [ ] Home page shows Brands Grid + Categories Grid + New Products
- [ ] Products display with variant cards (image swap, stock status)
- [ ] FlavorCount shows on product cards
- [ ] Cart operates server-side (no localStorage, no Zustand items)
- [ ] Cart shows live prices with change notifications
- [ ] Inactive items greyed out and block checkout
- [ ] Cart expires 24h from last activity
- [ ] Checkout validates all fields (Zod) with honeypot
- [ ] Checkout uses atomic transaction (Payload v3 API)
- [ ] Stock decrements atomically within transaction
- [ ] Order number is unique, human-friendly (VX-XXXXXX)
- [ ] Order confirmation shows screenshot prompt
- [ ] Track order by number or phone number
- [ ] Search returns results with debounce and autocomplete
- [ ] Filters work: category, brand, price range, stock status
- [ ] All product listings use infinite scroll
- [ ] Admin can manage products, categories, brands, orders
- [ ] Super Admin can manage admins and settings
- [ ] Sentry captures errors

### Data Integrity

- [ ] No orphaned cart_items (FK CASCADE)
- [ ] No negative stock_quantity (CHECK constraint)
- [ ] order_items.total_price = unit_price × quantity (CHECK constraint)
- [ ] cart_items max quantity is 10 (CHECK constraint)
- [ ] Unique variant per cart (UNIQUE INDEX)
- [ ] Order numbers are unique (UNIQUE constraint)
- [ ] Cancelled orders have cancelled_at, reason, cancelled_by
- [ ] Non-cancelled orders have NULL cancellation fields
- [ ] Price snapshots in order_items never change after creation

### Security

- [ ] Middleware used for UX redirects ONLY (NOT security)
- [ ] Every Server Component/Action verifies session via DAL
- [ ] JWT stored in HTTP-only, secure, SameSite cookie
- [ ] Rate limiting active on gate (5/min), cart (20/min), checkout (3/min)
- [ ] Honeypot field silently rejects bots (fake success)
- [ ] Phone number validated as +1 US format
- [ ] `overrideAccess: false` for all user-facing Payload queries
- [ ] Admin access control enforced (Super Admin vs Regular Admin)
- [ ] Cron endpoint authenticated with CRON_SECRET bearer token

### Performance

- [ ] Page load < 2 seconds
- [ ] Infinite scroll loads without jank
- [ ] Variant selection is instant (client-side, no fetch)
- [ ] Product images optimized via Cloudinary (WebP, auto quality)
- [ ] No N+1 queries in product listings

---

## Files to Create

```
project-root/
│
├── .ai/
│   ├── rules.md                          # Constitution v1.4.0
│   ├── feature-template.md
│   ├── module-template.md
│   └── prompts/
│       ├── create-feature.md
│       ├── modify-feature.md
│       └── debug-feature.md
│
├── src/
│   ├── app/
│   │   ├── (payload)/
│   │   │   └── admin/
│   │   │       └── [[...segments]]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (storefront)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  # Home
│   │   │   ├── gate/page.tsx
│   │   │   ├── brands/[slug]/page.tsx
│   │   │   ├── categories/[slug]/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx              # All Products
│   │   │   │   └── [slug]/page.tsx       # Product Detail
│   │   │   ├── search/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── order-confirmation/
│   │   │   │   └── [orderId]/page.tsx
│   │   │   └── track-order/page.tsx
│   │   │
│   │   ├── api/
│   │   │   └── cron/
│   │   │       └── cleanup-carts/
│   │   │           └── route.ts
│   │   │
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── widgets/
│   │   ├── header/
│   │   │   ├── Header.tsx
│   │   │   └── index.ts
│   │   ├── footer/
│   │   │   ├── Footer.tsx
│   │   │   └── index.ts
│   │   ├── product-grid/
│   │   │   ├── ProductGrid.tsx
│   │   │   └── index.ts
│   │   └── whatsapp-button/
│   │       ├── WhatsAppButton.tsx
│   │       └── index.ts
│   │
│   ├── features/
│   │   ├── _registry/
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── gate/
│   │   │   ├── README.md
│   │   │   ├── feature.config.ts
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── GateForm.tsx
│   │   │   │   └── _components/GateError.tsx
│   │   │   ├── actions/verify-password.action.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── tests/
│   │   │
│   │   ├── products/
│   │   │   ├── README.md
│   │   │   ├── feature.config.ts
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductDetail.tsx
│   │   │   │   ├── VariantSelector.tsx
│   │   │   │   ├── BrandCard.tsx
│   │   │   │   ├── BrandGrid.tsx
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   ├── CategoryGrid.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── ProductImage.tsx
│   │   │   │       ├── PriceDisplay.tsx
│   │   │   │       ├── StockBadge.tsx
│   │   │   │       └── FlavorCount.tsx
│   │   │   ├── db/queries.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── tests/
│   │   │
│   │   ├── cart/
│   │   │   ├── README.md
│   │   │   ├── feature.config.ts
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── CartDrawer.tsx
│   │   │   │   ├── CartButton.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── CartItem.tsx
│   │   │   │       ├── CartSummary.tsx
│   │   │   │       ├── EmptyCart.tsx
│   │   │   │       └── PriceChangeNotice.tsx
│   │   │   ├── actions/
│   │   │   │   ├── add-to-cart.action.ts
│   │   │   │   ├── update-quantity.action.ts
│   │   │   │   ├── remove-item.action.ts
│   │   │   │   └── clear-cart.action.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts             # Carts + CartItems collections
│   │   │   │   ├── queries.ts
│   │   │   │   └── mutations.ts
│   │   │   ├── logic/
│   │   │   │   ├── use-cart.ts           # Zustand UI state only
│   │   │   │   └── cart.service.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts              # MAX_QUANTITY: 10
│   │   │   └── tests/
│   │   │
│   │   ├── checkout/
│   │   │   ├── README.md
│   │   │   ├── feature.config.ts
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── CheckoutForm.tsx
│   │   │   │   ├── OrderConfirmation.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── CustomerFields.tsx
│   │   │   │       ├── OrderSummary.tsx
│   │   │   │       └── CodDisclaimer.tsx
│   │   │   ├── actions/process-checkout.action.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts             # Orders + OrderItems collections
│   │   │   │   ├── queries.ts
│   │   │   │   └── mutations.ts
│   │   │   ├── logic/checkout.service.ts
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   │
│   │   ├── order-tracking/
│   │   │   ├── README.md
│   │   │   ├── feature.config.ts
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── TrackOrderForm.tsx
│   │   │   │   ├── OrderStatus.tsx
│   │   │   │   └── _components/StatusTimeline.tsx
│   │   │   ├── actions/
│   │   │   │   ├── track-order.action.ts
│   │   │   │   └── lookup-orders.action.ts
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   │
│   │   ├── search/
│   │   │   ├── README.md
│   │   │   ├── feature.config.ts
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   └── _components/SearchSuggestions.tsx
│   │   │   ├── actions/search-products.action.ts
│   │   │   ├── logic/search.service.ts
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   │
│   │   └── filters/
│   │       ├── README.md
│   │       ├── feature.config.ts
│   │       ├── index.ts
│   │       ├── ui/
│   │       │   ├── FilterPanel.tsx
│   │       │   ├── SortDropdown.tsx
│   │       │   └── _components/
│   │       │       ├── CategoryFilter.tsx
│   │       │       ├── BrandFilter.tsx
│   │       │       ├── PriceRangeFilter.tsx
│   │       │       └── ActiveFilters.tsx
│   │       ├── logic/filter.service.ts
│   │       ├── types.ts
│   │       └── tests/
│   │
│   ├── modules/
│   │   ├── catalog/
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── services/
│   │   │   │   ├── product.service.ts
│   │   │   │   ├── category.service.ts
│   │   │   │   ├── brand.service.ts
│   │   │   │   └── search.service.ts
│   │   │   ├── validators/validate-product.ts
│   │   │   └── types.ts
│   │   │
│   │   └── orders/
│   │       ├── README.md
│   │       ├── index.ts
│   │       ├── services/
│   │       │   ├── order.service.ts
│   │       │   └── stock.service.ts
│   │       ├── validators/validate-order.ts
│   │       └── types.ts
│   │
│   ├── core/
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   ├── database.config.ts
│   │   │   └── env.ts                    # Zod validation
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   ├── encryption.ts
│   │   │   └── dal.ts
│   │   ├── logger/index.ts               # Sentry integration
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   └── error-handler.ts
│   │   ├── rate-limit/index.ts
│   │   └── db/client.ts
│   │
│   ├── payload/
│   │   ├── collections/
│   │   │   ├── users.ts
│   │   │   ├── products.ts
│   │   │   ├── product-variants.ts
│   │   │   ├── categories.ts
│   │   │   ├── brands.ts
│   │   │   └── media.ts
│   │   ├── globals/site-settings.ts
│   │   ├── hooks/
│   │   │   ├── before-change/generate-slug.ts
│   │   │   ├── before-change/validate-parent-depth.ts
│   │   │   └── after-change/revalidate-cache.ts
│   │   ├── access/
│   │   │   ├── is-admin.ts
│   │   │   └── is-super-admin.ts
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   ├── OrderStatusBadge.tsx
│   │   │   │   ├── StockIndicator.tsx
│   │   │   │   └── QuickEditStock.tsx
│   │   │   ├── graphics/
│   │   │   │   ├── Icon.tsx
│   │   │   │   └── Logo.tsx
│   │   │   └── views/Dashboard.tsx
│   │   └── payload.config.ts
│   │
│   ├── shared/
│   │   ├── ui/                           # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   ├── lib/
│   │   │   ├── cn.ts
│   │   │   ├── format.ts                 # formatUSD, formatDate
│   │   │   └── validators.ts
│   │   ├── hooks/
│   │   │   ├── use-media-query.ts
│   │   │   ├── use-debounce.ts
│   │   │   └── use-infinite-scroll.ts
│   │   ├── config/constants.ts
│   │   └── types/common.ts
│   │
│   ├── types/payload-types.ts            # Auto-generated
│   └── lib/payload.ts
│
├── public/
│   ├── images/
│   └── icons/
│
├── scripts/
│   ├── seed-admin.ts
│   └── cleanup-carts.ts
│
├── tests/
│   └── e2e/
│       ├── gate.spec.ts
│       ├── cart.spec.ts
│       └── checkout.spec.ts
│
├── .env.example
├── .env.local
├── middleware.ts                         # Gate redirect (UX only)
├── next.config.ts
├── package.json
├── sentry.client.config.ts
├── sentry.server.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                          # Cron config
└── vitest.config.ts
```

---

## Success Metrics

| Phase | Metric |
|-------|--------|
| **MVP** | Site accessible via gate, home page renders, cart works, orders create, tracking works |
| **Enhanced** | Search returns results, filters work, infinite scroll performant, <2s page load |
| **Launch** | All tests passing, mobile responsive, WCAG 2.1 AA, deployed on Vercel, zero critical bugs |

---

**✅ Blueprint v1.0.0 Complete — Ready for Implementation**

Migrated from `plan.md` v2.2.0. Aligned with `constitution.md` v1.4.0.
All details preserved. No content skipped.

### Git Commit Format

```
[scope]: brief description

Scopes: [gate], [products], [cart], [checkout], [order-tracking],
        [search], [filters], [catalog], [orders], [core], [shared], [project]
```

