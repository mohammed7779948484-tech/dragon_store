# API Contracts

**Feature**: Phase 1 Foundation  
**Created**: 2026-02-17  
**Format**: OpenAPI 3.0 style specification

## Base URL

```
Development: http://localhost:3000
Production: https://{deployment-url}.vercel.app
```

## Authentication

### Session-Based Authentication

All customer-facing endpoints require a valid session cookie. The session is established via the password gate.

**Cookie**: `session` (HTTP-only, Secure, SameSite=Lax)
**Token**: JWT containing { sessionId, isAuthenticated, expiresAt }

### Admin Authentication

Admin panel uses Payload CMS built-in authentication.

**Cookie**: `payload-token` (set by Payload)
**Access**: Role-based (super-admin, admin)

---

## Server Actions

### Gate Feature

#### verify-password.action.ts

Verifies site access password and creates session.

**Input**:
```typescript
{
  password: string        // Site access password
  rememberMe: boolean     // Extend session to 30 days
}
```

**Output**:
```typescript
{
  success: boolean
  error?: string          // Present if success = false
}
```

**Rate Limit**: 5 attempts per minute per IP

**Errors**:
- `RATE_LIMITED`: Too many attempts
- `INVALID_PASSWORD`: Password mismatch
- `SYSTEM_ERROR`: Internal error

**Side Effects**:
- Sets `session` cookie on success
- Creates cart record linked to session_id

---

### Cart Feature (UI State Only in Phase 1)

Cart data is server-side only. Zustand used for UI state (drawer open/close).

**Note**: Full cart actions (add, update, remove) implemented in Phase 2

---

### Catalog Module (Service API)

#### getActiveProducts

Retrieves paginated list of active products.

**Input**:
```typescript
{
  page?: number      // Default: 1
  limit?: number     // Default: 20, Max: 50
}
```

**Output**:
```typescript
{
  docs: Product[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
}
```

**Product Structure**:
```typescript
{
  id: number
  name: string
  slug: string
  description: string
  brand: Brand
  categories: Category[]
  variants: ProductVariant[]
  image_url: string
  is_active: boolean
  created_at: string
}
```

---

#### getProductsByCategory

Retrieves products filtered by category.

**Input**:
```typescript
{
  categoryId: number
  page?: number
  limit?: number
}
```

**Output**: Same as getActiveProducts

---

#### getProductsByBrand

Retrieves products filtered by brand.

**Input**:
```typescript
{
  brandId: number
  page?: number
  limit?: number
}
```

**Output**: Same as getActiveProducts

---

#### getNewProducts

Retrieves recently added products.

**Input**:
```typescript
{
  limit?: number     // Default: 10
}
```

**Output**: Product[]

---

#### getProductBySlug

Retrieves single product with full details.

**Input**:
```typescript
{
  slug: string
}
```

**Output**:
```typescript
{
  id: number
  name: string
  slug: string
  description: string
  unit_label: string
  brand: Brand
  categories: Category[]
  variants: ProductVariant[]
  image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

#### getCategoryTree

Retrieves hierarchical category structure.

**Input**: None

**Output**:
```typescript
{
  categories: CategoryNode[]
}

// CategoryNode:
{
  id: number
  name: string
  slug: string
  image_url: string
  children: CategoryNode[]
  productCount: number
}
```

---

#### getAllBrands

Retrieves all active brands.

**Input**: None

**Output**:
```typescript
{
  brands: Brand[]
}

// Brand:
{
  id: number
  name: string
  slug: string
  logo_url: string
  description: string
  productCount: number
}
```

---

## API Routes

### Health Check

#### GET /api/health

Returns API health status.

**Response**:
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
}
```

---

### Cron Jobs

#### GET /api/cron/cleanup-carts

Deletes expired shopping carts. Called by Vercel Cron.

**Headers**:
```
Authorization: Bearer {CRON_SECRET}
```

**Response**:
```typescript
{
  cleaned: number     // Number of carts deleted
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized (invalid cron secret)
- 500: Server error

**Schedule**: Every 6 hours (0 */6 * * *)

---

## Payload CMS Admin API

### Collections

All collections accessible via Payload's REST API at `/api/{collection}`

#### Users

**Endpoints**:
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Super Admin only)
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Super Admin only)

**Fields**: email, password, name, role, isActive, lastLogin

---

#### Brands

**Endpoints**:
- `GET /api/brands` - List brands (Public, Admin)
- `POST /api/brands` - Create brand (Admin)
- `GET /api/brands/:id` - Get brand
- `PATCH /api/brands/:id` - Update brand (Admin)
- `DELETE /api/brands/:id` - Delete brand (Admin)

**Access Control**:
- Read: Public (active only), Admin (all)
- Create/Update/Delete: Admin only

---

#### Categories

**Endpoints**:
- `GET /api/categories` - List categories (Public, Admin)
- `POST /api/categories` - Create category (Admin)
- `GET /api/categories/:id` - Get category
- `PATCH /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

**Access Control**: Same as Brands

**Hooks**: 
- `validate-parent-depth`: Enforces max 2-level hierarchy

---

#### Products

**Endpoints**:
- `GET /api/products` - List products (Public, Admin)
- `POST /api/products` - Create product (Admin)
- `GET /api/products/:id` - Get product
- `PATCH /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

**Access Control**: Same as Brands

**Hooks**:
- `generate-slug`: Auto-generates slug from name
- `revalidate-cache`: Clears Next.js cache on change

---

#### Product Variants

**Endpoints**:
- `GET /api/product_variants` - List variants (Public, Admin)
- `POST /api/product_variants` - Create variant (Admin)
- `GET /api/product_variants/:id` - Get variant
- `PATCH /api/product_variants/:id` - Update variant (Admin)
- `DELETE /api/product_variants/:id` - Delete variant (Super Admin)

**Access Control**:
- Read: Public (active only), Admin (all)
- Create/Update: Admin
- Delete: Super Admin only

---

#### Carts

**Endpoints**:
- `GET /api/carts` - List carts (Admin only)
- `GET /api/carts/:id` - Get cart (Session owner or Admin)
- `DELETE /api/carts/:id` - Delete cart (Admin only)

**Note**: Cart creation and modification handled via Server Actions, not direct API

---

#### Cart Items

**Endpoints**:
- `GET /api/cart_items` - List cart items (Admin only)

**Note**: Cart item operations handled via Server Actions

---

#### Orders

**Endpoints**:
- `GET /api/orders` - List orders (Admin only)
- `GET /api/orders/:id` - Get order (Session owner or Admin)
- `PATCH /api/orders/:id` - Update order status (Admin)

**Note**: Order creation handled via checkout Server Action

---

### Globals

#### Site Settings

**Endpoint**: `GET/POST /api/globals/site-settings`

**Fields**:
- gate_password (hashed, Super Admin only)
- whatsapp_number
- order_prefix
- store_name

**Access Control**:
- Read: Admin
- Update: Super Admin only

---

## Error Response Format

All errors follow this structure:

```typescript
{
  errors: [
    {
      message: string
      code?: string
      field?: string       // For validation errors
    }
  ]
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (no valid session)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Gate (verify-password) | 5 attempts | 1 minute per IP |
| Cart operations | 20 requests | 1 minute per session |
| Checkout | 3 attempts | 1 minute per session |
| API (general) | 100 requests | 1 minute per IP |

**Rate Limit Response** (429):
```typescript
{
  errors: [{
    message: 'Rate limit exceeded. Please try again later.',
    code: 'RATE_LIMITED'
  }]
}
```

---

## CORS & Security

**CORS**: Not required (same-origin)
**CSRF Protection**: SameSite=Lax cookies
**XSS Prevention**: HTTP-only session cookies, input sanitization

---

## Pagination

All list endpoints support cursor-style pagination:

**Request**:
```typescript
{
  page: number      // 1-based
  limit: number     // Items per page
}
```

**Response**:
```typescript
{
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}
```

**Defaults**:
- page: 1
- limit: 20 (max: 50)

---

## Data Types

### Core Types

```typescript
interface Brand {
  id: number
  name: string
  slug: string
  logo_url?: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
  slug: string
  image_url?: string
  parent_id?: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Product {
  id: number
  brand_id?: number
  name: string
  slug: string
  description?: string
  unit_label: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  brand?: Brand
  categories?: Category[]
  variants?: ProductVariant[]
}

interface ProductVariant {
  id: number
  product_id: number
  variant_name: string
  sku: string
  price: number
  stock_quantity: number
  image_url?: string
  option_value?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  product?: Product
}

interface Cart {
  id: string  // UUID
  session_id: string
  created_at: string
  updated_at: string
  expires_at: string
  items?: CartItem[]
}

interface CartItem {
  id: number
  cart_id: string
  variant_id: number
  quantity: number
  price_at_add: number
  added_at: string
  variant?: ProductVariant
}

interface Order {
  id: string  // UUID
  order_number: string
  session_id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  notes?: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  cancellation_reason?: string
  cancelled_by?: 'customer' | 'admin'
  cancelled_at?: string
  total_amount: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: number
  order_id: string
  variant_id?: number
  product_name: string
  variant_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

interface User {
  id: number
  email: string
  name: string
  role: 'super-admin' | 'admin'
  isActive: boolean
  lastLogin?: string
  created_at: string
  updated_at: string
}
```
