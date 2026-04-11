/**
 * Products Feature — Public API
 *
 * Barrel file exporting all public components, types, and constants.
 * Also re-exports catalog module functions so pages import from
 * features/ only (never directly from modules/).
 * @see Constitution: Import from index.ts only, no deep imports
 */

// UI Components
export { ProductCard } from './ui/ProductCard'
export { ProductDetail } from './ui/ProductDetail'
export { VariantSelector } from './ui/VariantSelector'
export { BrandCard } from './ui/BrandCard'
export { BrandGrid } from './ui/BrandGrid'
export { CategoryCard } from './ui/CategoryCard'
export { CategoryGrid } from './ui/CategoryGrid'
export { CategoryBrandFilter } from './ui/CategoryBrandFilter'

// Types
export type {
    ProductCardProps,
    ProductDetailProps,
    VariantSelectorProps,
    BrandCardProps,
    BrandGridProps,
    CategoryCardProps,
    CategoryGridProps,
} from './types'

// Constants
export {
    PRODUCTS_PER_PAGE,
    CURRENCY_SYMBOL,
    PLACEHOLDER_IMAGE,
} from './constants'

// Re-export catalog module functions for page consumption
// Pages MUST import these from here, not from @/modules/catalog
export {
    getActiveProducts,
    getProductBySlug,
    getProductsByBrand,
    getProductsByCategory,
    getActiveBrands,
    getBrandBySlug,
    getBrandsByCategory,
    getActiveCategories,
    getCategoryBySlug,
    getRootCategories,
} from '@/modules/catalog'

// Re-export catalog types for page consumption
export type {
    CatalogBrand,
    CatalogCategory,
    CatalogVariant,
    CatalogProduct,
    ProductCardData,
    PaginatedResult,
} from '@/modules/catalog'

