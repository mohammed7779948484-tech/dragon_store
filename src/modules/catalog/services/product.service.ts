/**
 * Product Service
 *
 * Business logic for product queries (read-only for storefront).
 * Uses Payload Local API with overrideAccess: true for public reads.
 *
 * @see Constitution: modules/ contain pure business logic, no UI
 * @see Constitution: CAN import from core/, shared/lib, shared/types
 */

import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'

import type {
    CatalogProduct,
    CatalogVariant,
    ProductCardData,
    ProductFilters,
    PaginatedResult,
    PaginationParams,
} from '../types'

/**
 * Transform raw Payload variant to CatalogVariant
 */
function toVariant(raw: Record<string, unknown>): CatalogVariant {
    // Extract images from the array field
    const rawImages = Array.isArray(raw.images) ? raw.images : []
    const images = rawImages
        .map((item: Record<string, unknown>) => extractImageUrl(item.image))
        .filter((url): url is string => url !== null)

    const cloudinaryPublicIds = rawImages
        .map((item: Record<string, unknown>) => extractCloudinaryPublicId(item.image))
        .filter((id): id is string => id !== null)

    return {
        id: raw.id as number,
        variantName: raw.variant_name as string,
        sku: raw.sku as string,
        price: raw.price as number,
        stockQuantity: raw.stock_quantity as number,
        images,
        cloudinaryPublicIds,
        optionValue: (raw.option_value as string) || null,
        isActive: raw.is_active as boolean,
    }
}

/**
 * Extract image URL from Payload upload field
 */
function extractImageUrl(image: unknown): string | null {
    if (!image) return null
    if (typeof image === 'object' && image !== null && 'url' in image) {
        return (image as Record<string, unknown>).url as string
    }
    return null
}

/**
 * Extract Cloudinary public_id from Payload upload field
 */
function extractCloudinaryPublicId(image: unknown): string | null {
    if (!image) return null
    if (typeof image === 'object' && image !== null && 'cloudinary_public_id' in image) {
        return (image as Record<string, unknown>).cloudinary_public_id as string
    }
    return null
}

/**
 * Transform raw Payload product to CatalogProduct
 */
function toProduct(raw: Record<string, unknown>): CatalogProduct {
    const variants = Array.isArray(raw.variants)
        ? raw.variants.map((v: Record<string, unknown>) => toVariant(v))
        : []

    const activeVariants = variants.filter((v) => v.isActive)
    const prices = activeVariants.map((v) => v.price)

    const brand = raw.brand as Record<string, unknown> | null
    const categories = Array.isArray(raw.categories)
        ? raw.categories.map((c: Record<string, unknown>) => ({
            id: c.id as number,
            name: c.name as string,
            slug: c.slug as string,
        }))
        : []

    return {
        id: raw.id as number,
        name: raw.name as string,
        slug: raw.slug as string,
        description: (raw.description as string) || null,
        unitLabel: (raw.unit_label as string) || 'Unit',
        imageUrl: extractImageUrl(raw.image),
        cloudinaryPublicId: extractCloudinaryPublicId(raw.image),
        brandName: brand ? (brand.name as string) : null,
        brandSlug: brand ? (brand.slug as string) : null,
        categories,
        variants: activeVariants,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        totalStock: activeVariants.reduce((sum, v) => sum + v.stockQuantity, 0),
        isActive: raw.is_active as boolean,
    }
}

/**
 * Transform to ProductCardData (lightweight for grids)
 */
function toCardData(raw: Record<string, unknown>): ProductCardData {
    const variants = Array.isArray(raw.variants)
        ? raw.variants.filter((v: Record<string, unknown>) => v.is_active)
        : []

    const prices = variants.map((v: Record<string, unknown>) => v.price as number)
    const totalStock = variants.reduce(
        (sum: number, v: Record<string, unknown>) => sum + (v.stock_quantity as number),
        0
    )

    const brand = raw.brand as Record<string, unknown> | null

    return {
        id: raw.id as number,
        name: raw.name as string,
        slug: raw.slug as string,
        imageUrl: extractImageUrl(raw.image),
        cloudinaryPublicId: extractCloudinaryPublicId(raw.image),
        brandName: brand ? (brand.name as string) : null,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        variantCount: variants.length,
        inStock: totalStock > 0,
    }
}

/**
 * Get active products with pagination and optional filters
 */
export async function getActiveProducts(
    params: PaginationParams & ProductFilters = { page: 1, limit: 12 }
): Promise<PaginatedResult<ProductCardData>> {
    const payload = await getPayloadClient()

    const where: Where = {
        is_active: { equals: true },
    }

    if (params.brandSlug) {
        where['brand.slug'] = { equals: params.brandSlug }
    }

    if (params.categorySlug) {
        where['categories.slug'] = { equals: params.categorySlug }
    }

    const result = await payload.find({
        collection: 'products',
        where,
        page: params.page,
        limit: params.limit,
        sort: 'sort_order',
        depth: 2, // Include brand and variants
        overrideAccess: true, // Public read
    })

    // Fetch variants for each product
    const productsWithVariants = await Promise.all(
        result.docs.map(async (product) => {
            const variants = await payload.find({
                collection: 'product_variants',
                where: {
                    product: { equals: product.id },
                    is_active: { equals: true },
                },
                sort: 'sort_order',
                limit: 100,
                depth: 1,
                overrideAccess: true,
            })

            return { ...product, variants: variants.docs } as unknown as Record<string, unknown>
        })
    )

    return {
        docs: productsWithVariants.map(toCardData),
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? 1,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
    }
}

/**
 * Get single product by slug with full details
 */
export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'products',
        where: {
            slug: { equals: slug },
            is_active: { equals: true },
        },
        depth: 2,
        limit: 1,
        overrideAccess: true,
    })

    if (result.docs.length === 0) return null

    const product = result.docs[0]
    if (!product) return null

    // Fetch variants
    const variants = await payload.find({
        collection: 'product_variants',
        where: {
            product: { equals: product.id },
        },
        sort: 'sort_order',
        limit: 100,
        depth: 1,
        overrideAccess: true,
    })

    return toProduct({
        ...product,
        variants: variants.docs,
    } as unknown as Record<string, unknown>)
}

/**
 * Get products by brand slug
 */
export async function getProductsByBrand(
    brandSlug: string,
    params: PaginationParams = { page: 1, limit: 12 }
): Promise<PaginatedResult<ProductCardData>> {
    return getActiveProducts({ ...params, brandSlug })
}

/**
 * Get products by category slug
 */
export async function getProductsByCategory(
    categorySlug: string,
    params: PaginationParams = { page: 1, limit: 12 }
): Promise<PaginatedResult<ProductCardData>> {
    return getActiveProducts({ ...params, categorySlug })
}
