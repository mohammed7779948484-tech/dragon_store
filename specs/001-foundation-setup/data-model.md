# Data Model Specification

**Feature**: Phase 1 Foundation  
**Created**: 2026-02-17  
**Database**: Neon PostgreSQL

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   brands    │◄────┤  products   ├────►│  categories │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   product   │
                    │  variants   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐      ┌────┴────┐     ┌─────┴─────┐
    │  carts  │◄────►│cart_items│     │order_items│
    └────┬────┘      └─────────┘     └─────┬─────┘
         │                                  │
         │                            ┌────┴────┐
         │                            │  orders │
         │                            └─────────┘
         │                                  │
    ┌────┴────┐                      ┌─────┴─────┐
│   users   │                      │site_settings│
└───────────┘                      └─────────────┘
```

## Core Collections

### 1. brands

Product manufacturer/brand information.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| name | TEXT | Yes | - | Display name |
| slug | TEXT | Yes | UNIQUE, indexed | URL-friendly identifier |
| logo_url | TEXT | No | - | Cloudinary URL |
| description | TEXT | No | - | Optional brand description |
| sort_order | INTEGER | Yes | DEFAULT 0 | Display order |
| is_active | BOOLEAN | Yes | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |
| updated_at | TIMESTAMP | Yes | DEFAULT NOW() | Auto-updated |

**Indexes**: 
- idx_brands_slug (slug)
- idx_brands_active (is_active)

**Hooks**: generate-slug

---

### 2. categories

2-level hierarchical product categorization.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| name | TEXT | Yes | - | Display name |
| slug | TEXT | Yes | UNIQUE, indexed | URL-friendly identifier |
| image_url | TEXT | No | - | Cloudinary URL |
| parent_id | INTEGER | No | FK → categories(id), ON DELETE SET NULL | Max depth: 1 |
| sort_order | INTEGER | Yes | DEFAULT 0 | Display order |
| is_active | BOOLEAN | Yes | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |
| updated_at | TIMESTAMP | Yes | DEFAULT NOW() | Auto-updated |

**Indexes**:
- idx_categories_parent (parent_id)
- idx_categories_slug (slug)

**Constraints**:
- CHECK (parent_id IS NULL OR parent_id != id) -- No self-reference
- Max 2 levels enforced in application hook

**Hooks**: generate-slug, validate-parent-depth

---

### 3. products

Core product information.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| brand_id | INTEGER | No | FK → brands(id) | Nullable for uncategorized |
| name | TEXT | Yes | - | Product name |
| slug | TEXT | Yes | UNIQUE, indexed | URL-friendly identifier |
| description | TEXT | No | - | Rich text description |
| unit_label | TEXT | Yes | DEFAULT 'Unit' | e.g., "Piece", "Pack" |
| image_url | TEXT | No | - | Cloudinary URL (main image) |
| sort_order | INTEGER | Yes | DEFAULT 0 | Display order |
| is_active | BOOLEAN | Yes | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |
| updated_at | TIMESTAMP | Yes | DEFAULT NOW() | Auto-updated |

**Indexes**:
- idx_products_brand (brand_id)
- idx_products_slug (slug)
- idx_products_active (is_active)
- idx_products_created (created_at DESC)

**Relationships**:
- Many-to-Many with categories via product_categories pivot
- One-to-Many with product_variants

**Hooks**: generate-slug, revalidate-cache

---

### 4. product_categories (Pivot Table)

Many-to-Many relationship between products and categories.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| product_id | INTEGER | Yes | FK → products(id), ON DELETE CASCADE | - |
| category_id | INTEGER | Yes | FK → categories(id), ON DELETE CASCADE | - |

**Primary Key**: (product_id, category_id)

**Indexes**:
- idx_product_categories_category (category_id)

---

### 5. product_variants

Product variations (flavors, sizes, etc.).

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| product_id | INTEGER | Yes | FK → products(id), ON DELETE CASCADE | Parent product |
| variant_name | TEXT | Yes | - | e.g., "Strawberry Ice" |
| sku | TEXT | Yes | UNIQUE, indexed | Stock keeping unit |
| price | DECIMAL(10,2) | Yes | CHECK (price >= 0) | Unit price in USD |
| stock_quantity | INTEGER | Yes | DEFAULT 0, CHECK >= 0 | Current inventory |
| image_url | TEXT | No | - | Cloudinary URL (variant-specific) |
| option_value | TEXT | No | - | Filter label e.g., "6mg" |
| sort_order | INTEGER | Yes | DEFAULT 0 | Display order |
| is_active | BOOLEAN | Yes | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |
| updated_at | TIMESTAMP | Yes | DEFAULT NOW() | Auto-updated |

**Indexes**:
- idx_variants_product (product_id)
- idx_variants_sku (sku)
- idx_variants_active (is_active)

**Relationships**:
- Many-to-One with products
- Referenced by cart_items and order_items

---

### 6. variant_options (Helper Table)

Autocomplete helper for variant creation in admin.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| option_name | TEXT | Yes | - | e.g., "Flavor", "Size" |
| option_value | TEXT | Yes | - | e.g., "Strawberry Ice" |

**Constraints**:
- UNIQUE (option_name, option_value)

**Indexes**:
- idx_variant_options_name (option_name)

---

## Feature Collections

### 7. carts (Server-Side Cart)

Session-linked shopping cart.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK, DEFAULT gen_random_uuid() | Security/scale |
| session_id | TEXT | Yes | UNIQUE, indexed | Links to gate session |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |
| updated_at | TIMESTAMP | Yes | DEFAULT NOW() | Auto-updated |
| expires_at | TIMESTAMP | Yes | - | 24h from last activity |

**Indexes**:
- idx_carts_session (session_id)
- idx_carts_expires (expires_at)

**Cleanup**: Automated cron job deletes expired carts

---

### 8. cart_items

Items within a cart (relational, NOT embedded).

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| cart_id | UUID | Yes | FK → carts(id), ON DELETE CASCADE | Parent cart |
| variant_id | INTEGER | Yes | FK → product_variants(id) | Product variant |
| quantity | INTEGER | Yes | CHECK (> 0 AND <= 10) | Max 10 per item |
| price_at_add | DECIMAL(10,2) | Yes | - | Price when added to cart |
| added_at | TIMESTAMP | Yes | DEFAULT NOW() | - |

**Indexes**:
- idx_cart_items_cart (cart_id)
- idx_cart_items_variant (variant_id)
- idx_cart_items_unique (cart_id, variant_id) UNIQUE

**Business Logic**:
- One variant per cart only (upsert on duplicate)
- price_at_add used for live price change detection

---

### 9. orders

Customer orders.

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK, DEFAULT gen_random_uuid() | Security/scale |
| order_number | VARCHAR(10) | Yes | UNIQUE, indexed | Format: "VX-XXXXXX" |
| session_id | TEXT | Yes | indexed | Links to gate session |
| customer_name | VARCHAR(255) | Yes | CHECK (length >= 2) | - |
| customer_phone | VARCHAR(50) | Yes | - | +1 US format |
| delivery_address | TEXT | Yes | CHECK (length >= 10) | - |
| notes | TEXT | No | - | Customer notes |
| status | VARCHAR(20) | Yes | DEFAULT 'pending' | pending, processing, completed, cancelled |
| cancellation_reason | TEXT | No | - | Required if cancelled |
| cancelled_by | VARCHAR(20) | No | - | 'customer' or 'admin' |
| cancelled_at | TIMESTAMP | No | - | Set on cancellation |
| honeypot_field | TEXT | No | - | Bot detection (must be empty) |
| total_amount | DECIMAL(10,2) | Yes | CHECK (>= 0) | Order total in USD |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |
| updated_at | TIMESTAMP | Yes | DEFAULT NOW() | Auto-updated |

**Indexes**:
- idx_orders_session (session_id)
- idx_orders_status (status)
- idx_orders_created (created_at DESC)
- idx_orders_phone (customer_phone)
- idx_orders_number (order_number)

**Constraints**:
- CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
- CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin'))
- Status consistency: cancelled fields only when status = 'cancelled'

**State Transitions**:
```
pending → processing → completed
    ↓          ↓
cancelled  cancelled
```

---

### 10. order_items

Line items within an order (snapshots at creation time).

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | SERIAL | Yes | PK | Auto-increment |
| order_id | UUID | Yes | FK → orders(id), ON DELETE CASCADE | Parent order |
| variant_id | INTEGER | No | FK → product_variants(id) | Nullable for deleted variants |
| product_name | TEXT | Yes | - | Snapshot at order time |
| variant_name | TEXT | Yes | - | Snapshot at order time |
| quantity | INTEGER | Yes | CHECK (> 0) | Units ordered |
| unit_price | DECIMAL(10,2) | Yes | CHECK (>= 0) | Price per unit (snapshot) |
| total_price | DECIMAL(10,2) | Yes | CHECK (>= 0) | quantity × unit_price |
| created_at | TIMESTAMP | Yes | DEFAULT NOW() | - |

**Indexes**:
- idx_order_items_order (order_id)
- idx_order_items_variant (variant_id)

**Constraints**:
- CHECK (total_price = unit_price * quantity)

**Important**: All values are SNAPSHOTS - never change after creation, even if product/variant changes later.

---

## System Collections

### 11. users (Payload Built-in)

Store administrators (no customer accounts).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | SERIAL | Yes | PK |
| email | TEXT | Yes | UNIQUE, login identifier |
| password | TEXT | Yes | Bcrypt hashed |
| name | TEXT | Yes | Display name |
| role | ENUM | Yes | 'super-admin' or 'admin' |
| isActive | BOOLEAN | Yes | Account status |
| lastLogin | TIMESTAMP | No | Last successful login |

**Roles**:
- **super-admin**: Full access, can create/delete admins, change critical settings
- **admin**: Manage products, categories, brands, orders (except delete)

---

### 12. media (Payload + Cloudinary)

Media files stored in Cloudinary.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | SERIAL | Yes | PK |
| filename | TEXT | Yes | Original filename |
| mimeType | TEXT | Yes | e.g., "image/webp" |
| filesize | INTEGER | Yes | Bytes |
| width | INTEGER | No | Image width |
| height | INTEGER | No | Image height |
| url | TEXT | Yes | Cloudinary URL |
| thumbnailURL | TEXT | No | Optimized thumbnail URL |

**Storage**: Cloudinary via payload-cloudinary plugin
**Folder**: 'vape-store'

---

## Global Settings

### 13. site_settings (Payload Global)

Singleton configuration object.

| Key | Type | Required | Notes |
|-----|------|----------|-------|
| gate_password | TEXT | Yes | Bcrypt hashed site access password |
| whatsapp_number | TEXT | Yes | Contact number (+1 format) |
| order_prefix | TEXT | No | Default: "VX" |
| store_name | TEXT | No | Default: "Vape Store" |

**Access**: Read: Admin, Update: Super Admin only

---

## Data Integrity Rules

### Foreign Key Constraints
- All FK relationships enforce referential integrity
- ON DELETE CASCADE for: cart_items, order_items, product_categories
- ON DELETE SET NULL for: categories.parent_id

### Check Constraints
- product_variants.price >= 0
- product_variants.stock_quantity >= 0
- cart_items.quantity > 0 AND <= 10
- order_items.quantity > 0
- order_items.total_price = unit_price * quantity
- orders.total_amount >= 0

### Unique Constraints
- brands.slug
- categories.slug
- products.slug
- product_variants.sku
- carts.session_id
- orders.order_number
- cart_items (cart_id, variant_id)
- site_settings.key

### Indexes Summary
All foreign keys indexed for join performance
Query-hot columns indexed (slug, status, created_at)
Composite indexes for common query patterns

## Validation Rules

### Product Creation
- Slug auto-generated from name if not provided
- At least one variant required (enforced in UI)
- Brand optional but recommended

### Category Creation
- Max depth: 2 levels (parent → child only)
- No self-referencing allowed
- Slug auto-generated from name

### Variant Creation
- SKU must be unique across all variants
- Price must be >= 0
- Stock quantity must be >= 0

### Order Creation
- Customer phone must match +1 US format
- Customer name minimum 2 characters
- Delivery address minimum 10 characters
- Honeypot field must be empty
- All items must have sufficient stock

## Data Lifecycle

### Carts
- Created on first add-to-cart action
- Expires 24 hours from last activity
- Extended on each cart modification
- Deleted by automated cron job after expiration

### Orders
- Created with status 'pending'
- Stock atomically decremented at creation
- Status transitions controlled by business logic
- Cancellation returns stock to inventory
- Final states: 'completed', 'cancelled' (no further changes)

### Products/Categories/Brands
- Soft delete via is_active flag
- Hard delete possible via Super Admin
- Cascading deletes for related variants (configurable)
