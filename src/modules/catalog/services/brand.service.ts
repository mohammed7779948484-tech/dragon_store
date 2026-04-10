/**
 * Brand Service
 *
 * Business logic for brand queries (read-only for storefront).
 *
 * @see Constitution: modules/ contain pure business logic, no UI
 */

import { getPayloadClient } from '@/lib/payload'

import type { CatalogBrand } from '../types'

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
 * Transform raw Payload brand to CatalogBrand
 */
function toBrand(raw: Record<string, unknown>): CatalogBrand {
    return {
        id: raw.id as number,
        name: raw.name as string,
        slug: raw.slug as string,
        logoUrl: extractImageUrl(raw.logo),
        cloudinaryPublicId: extractCloudinaryPublicId(raw.logo),
        description: (raw.description as string) || null,
    }
}

/**
 * Get all active brands sorted by sort_order
 */
export async function getActiveBrands(): Promise<CatalogBrand[]> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'brands',
        where: {
            is_active: { equals: true },
        },
        sort: 'sort_order',
        limit: 100,
        depth: 1,
        overrideAccess: true,
    })

    return result.docs.map(
        (doc) => toBrand(doc as unknown as Record<string, unknown>)
    )
}

/**
 * Get single brand by slug
 */
export async function getBrandBySlug(slug: string): Promise<CatalogBrand | null> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'brands',
        where: {
            slug: { equals: slug },
            is_active: { equals: true },
        },
        depth: 1,
        limit: 1,
        overrideAccess: true,
    })

    if (result.docs.length === 0) return null

    return toBrand(result.docs[0] as unknown as Record<string, unknown>)
}

/**
 * Get brands that have active products in a specific category
 */
export async function getBrandsByCategory(categorySlug: string): Promise<CatalogBrand[]> {
    const payload = await getPayloadClient()

    // Fetch products in this category to find their brands
    const products = await payload.find({
        collection: 'products',
        where: {
            'categories.slug': { equals: categorySlug },
            is_active: { equals: true },
        },
        depth: 1, // Include brand data
        limit: 200,
        overrideAccess: true,
    })

    // Extract unique brands from products
    const brandMap = new Map<number, CatalogBrand>()

    for (const product of products.docs) {
        const raw = product as unknown as Record<string, unknown>
        const brand = raw.brand as Record<string, unknown> | null
        if (brand && brand.id && !brandMap.has(brand.id as number)) {
            brandMap.set(brand.id as number, toBrand(brand))
        }
    }

    return Array.from(brandMap.values())
}
