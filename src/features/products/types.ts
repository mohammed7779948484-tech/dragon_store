/**
 * Products Feature Types
 *
 * Re-exports catalog module types for feature consumers.
 * Feature-specific UI types defined here.
 */

export type {
    CatalogProduct,
    CatalogVariant,
    CatalogBrand,
    CatalogCategory,
    ProductCardData,
} from '@/modules/catalog'

/** Props for ProductCard component */
export interface ProductCardProps {
    product: import('@/modules/catalog').ProductCardData
}

/** Props for ProductDetail component */
export interface ProductDetailProps {
    product: import('@/modules/catalog').CatalogProduct
}

/** Props for VariantSelector component */
export interface VariantSelectorProps {
    variants: import('@/modules/catalog').CatalogVariant[]
    selectedVariantId: number | null
    onSelect: (variantId: number) => void
    ActionComponent?: React.ComponentType<{ variantId: number; price: number; stockQuantity: number; quantity: number }> | undefined
}

/** Props for BrandCard component */
export interface BrandCardProps {
    brand: import('@/modules/catalog').CatalogBrand
}

/** Props for BrandGrid component */
export interface BrandGridProps {
    brands: import('@/modules/catalog').CatalogBrand[]
}

/** Props for CategoryCard component */
export interface CategoryCardProps {
    category: import('@/modules/catalog').CatalogCategory
}

/** Props for CategoryGrid component */
export interface CategoryGridProps {
    categories: import('@/modules/catalog').CatalogCategory[]
}
