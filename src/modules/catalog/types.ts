/**
 * Catalog Module — Types
 *
 * Shared types for the catalog module (products, categories, brands).
 * Used by services, features, and pages.
 *
 * @see Constitution: modules/ contain pure business logic, no UI
 */

/** Serialized brand for storefront display */
export interface CatalogBrand {
    id: number
    name: string
    slug: string
    logoUrl: string | null
    cloudinaryPublicId: string | null
    description: string | null
    productCount?: number
}

/** Serialized category for storefront display */
export interface CatalogCategory {
    id: number
    name: string
    slug: string
    imageUrl: string | null
    cloudinaryPublicId: string | null
    parentId: number | null
    parentSlug: string | null
    children?: CatalogCategory[]
}

/** Serialized product variant for storefront display */
export interface CatalogVariant {
    id: number
    variantName: string
    sku: string
    price: number
    stockQuantity: number
    images: string[]
    cloudinaryPublicIds: string[]
    optionValue: string | null
    isActive: boolean
}

/** Serialized product for storefront display */
export interface CatalogProduct {
    id: number
    name: string
    slug: string
    description: string | null
    unitLabel: string
    imageUrl: string | null
    cloudinaryPublicId: string | null
    brandName: string | null
    brandSlug: string | null
    categories: Array<{ id: number; name: string; slug: string }>
    variants: CatalogVariant[]
    minPrice: number
    maxPrice: number
    totalStock: number
    isActive: boolean
}

/** Product card data (lightweight for grids) */
export interface ProductCardData {
    id: number
    name: string
    slug: string
    imageUrl: string | null
    cloudinaryPublicId: string | null
    brandName: string | null
    minPrice: number
    maxPrice: number
    variantCount: number
    inStock: boolean
}

/** Pagination parameters */
export interface PaginationParams {
    page: number
    limit: number
}

/** Paginated response */
export interface PaginatedResult<T> {
    docs: T[]
    totalDocs: number
    totalPages: number
    page: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

/** Filter parameters for product queries */
export interface ProductFilters {
    brandSlug?: string
    categorySlug?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    search?: string
}
