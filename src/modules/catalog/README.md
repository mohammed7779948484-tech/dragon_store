# Catalog Module

Shared business logic for product catalog queries — products, brands, categories.

## Purpose

Provides read-only data access functions for the storefront. Features consume
these services via re-exports in `features/products/index.ts`.

## Services

| Service | Functions |
|---------|-----------|
| `product.service.ts` | `getActiveProducts`, `getProductBySlug`, `getProductsByBrand`, `getProductsByCategory` |
| `brand.service.ts` | `getActiveBrands`, `getBrandBySlug`, `getBrandsByCategory` |
| `category.service.ts` | `getActiveCategories`, `getCategoryBySlug`, `getRootCategories` |

## Dependencies

- `@/lib/payload` — Payload Local API client

## Rules

- NO React components, hooks, or JSX
- NO imports from `features/`, `app/`, `widgets/`, `payload/`, other `modules/`
- Pure TypeScript/Node.js logic only
