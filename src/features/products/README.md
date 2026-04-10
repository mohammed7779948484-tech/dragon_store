# Products Feature

## Purpose

Product catalog browsing for the storefront. Provides UI components for displaying products, brands, and categories in grid and detail views, with interactive variant selection, image gallery, and category-brand filtering.

Also re-exports `modules/catalog` service functions so pages never import from `modules/` directly (FSD constitution compliance).

## Dependencies

- `@/modules/catalog` — Business logic for product, brand, and category queries (read-only)
- `@/shared/ui/breadcrumb` — Breadcrumb UI primitive (imported by pages, not by this feature)

## Public API

### UI Components

| Export | Type | Description |
|--------|------|-------------|
| `ProductCard` | Server Component | Product card with **variant count badge** ("X Flavors") |
| `ProductDetail` | Client Component | Product detail with **image gallery** (clickable thumbnails), dynamic title, and variant viewer indicator |
| `VariantSelector` | Client Component | Variant picker as card rows — thumbnail, price, stock, ✓ indicator, Sold Out badge |
| `BrandCard` | Server Component | Brand card with logo and name |
| `BrandGrid` | Server Component | Responsive grid of `BrandCard` components |
| `CategoryCard` | Server Component | Category card with gradient overlay image |
| `CategoryGrid` | Server Component | Responsive grid of `CategoryCard` components |
| `CategoryBrandFilter` | Server Component | **[New]** Brand filter grid for category detail page — highlights active brand, uses `next/image`, query-param driven |

### Re-exported Service Functions (from `modules/catalog`)

Pages import these from `@/features/products`, not from `@/modules/catalog` directly.

| Export | Description |
|--------|-------------|
| `getActiveProducts(params)` | Products with pagination + filters (brandSlug, categorySlug) |
| `getProductBySlug(slug)` | Single product with full detail |
| `getProductsByBrand(brandSlug)` | Products by brand |
| `getProductsByCategory(categorySlug)` | Products by category |
| `getActiveBrands()` | All active brands |
| `getBrandBySlug(slug)` | Single brand |
| `getBrandsByCategory(categorySlug)` | **[New]** Brands that have products in a given category |
| `getActiveCategories()` | Category tree |
| `getCategoryBySlug(slug)` | Single category with children |
| `getRootCategories()` | Top-level categories only |

### Re-exported Types (from `modules/catalog`)

`CatalogBrand`, `CatalogCategory`, `CatalogVariant`, `CatalogProduct`, `ProductCardData`, `PaginatedResult`

### Component Prop Types

`ProductCardProps`, `ProductDetailProps`, `VariantSelectorProps`, `BrandCardProps`, `BrandGridProps`, `CategoryCardProps`, `CategoryGridProps`

### Constants

| Export | Value | Description |
|--------|-------|-------------|
| `PRODUCTS_PER_PAGE` | 12 | Default pagination limit |
| `CURRENCY_SYMBOL` | `$` | Currency display symbol |
| `PLACEHOLDER_IMAGE` | `/media/placeholder.webp` | Fallback image path |

## Collections Owned

None — data managed by core Payload collections (`products`, `brands`, `categories`, `product_variants`).

## Notes

- **Server Components** used for cards and filter components (SSR)
- **`ProductDetail`** is Client Component to manage selected variant state (price, image gallery, stock)
- **`VariantSelector`** displays variants as card rows — each with 48px thumbnail, name, price, stock badge
- **`ProductDetail`** supports multi-image gallery per variant — clicking a thumbnail sets the main image; switching variants resets gallery to image index 0
- **`CatalogVariant.images`** is `string[]` (array) — not a single URL — to support multiple images per variant
- **`CategoryBrandFilter`** receives brands as props from the page — no direct module imports inside the component
- No Server Actions in this feature (read-only catalog)

## Files

```
src/features/products/
├── README.md                   # This file
├── feature.config.ts           # Feature metadata
├── index.ts                    # Public API (components + re-exported catalog functions)
├── types.ts                    # Component prop interfaces
├── constants.ts                # Pagination limits, currency symbol
└── ui/
    ├── ProductCard.tsx          # Product card + variant count badge (Server)
    ├── ProductDetail.tsx        # Product detail + image gallery + dynamic title (Client)
    ├── VariantSelector.tsx      # Variant card rows with thumbnail/price/stock (Client)
    ├── BrandCard.tsx            # Brand card (Server)
    ├── BrandGrid.tsx            # Brand grid layout (Server)
    ├── CategoryCard.tsx         # Category card (Server)
    ├── CategoryGrid.tsx         # Category grid layout (Server)
    └── CategoryBrandFilter.tsx  # [New] Brand filter for category page (Server)
```

## Integration & Component Injection (Adding Actions)

To maintain FSD isolation, `features/products` does **not** import from `features/cart` or any other feature. Instead, it uses the **Component Injection Pattern**.

If you need to add an action button (like "Add to Cart") to the `ProductDetail` view, pass it via the `ActionComponent` prop from the Page level:

```tsx
// app/(storefront)/products/[slug]/page.tsx
import { ProductDetail } from '@/features/products'
import { AddToCartButton } from '@/features/cart'

export default async function ProductPage({ params }) {
  // ...
  return (
    <ProductDetail 
      product={product} 
      ActionComponent={AddToCartButton} 
    />
  )
}
```

This enforces that:
1. `ProductDetail` remains a clean Server Component.
2. The interactive client state is managed internally via `ProductInteractive`.
3. Feature isolation is preserved perfectly without cross-imports.
