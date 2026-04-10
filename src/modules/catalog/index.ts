/**
 * Catalog Module — Public API
 *
 * Barrel file for the catalog module.
 * Exports types and service functions for use by features and pages.
 *
 * @see Constitution: Import from index.ts only, no deep imports
 */

// Types
export type {
    CatalogBrand,
    CatalogCategory,
    CatalogVariant,
    CatalogProduct,
    ProductCardData,
    PaginatedResult,
    PaginationParams,
    ProductFilters,
} from './types'

// Services
export {
    getActiveProducts,
    getProductBySlug,
    getProductsByBrand,
    getProductsByCategory,
} from './services/product.service'

export {
    getActiveCategories,
    getCategoryBySlug,
    getRootCategories,
} from './services/category.service'

export {
    getActiveBrands,
    getBrandBySlug,
    getBrandsByCategory,
} from './services/brand.service'
