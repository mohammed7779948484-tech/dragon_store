/**
 * Category Service
 *
 * Business logic for category queries (read-only for storefront).
 *
 * @see Constitution: modules/ contain pure business logic, no UI
 */

import { getPayloadClient } from '@/lib/payload'

import type { CatalogCategory } from '../types'

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
 * Transform raw Payload category to CatalogCategory
 */
function toCategory(raw: Record<string, unknown>): CatalogCategory {
    const parent = raw.parent as Record<string, unknown> | null

    return {
        id: raw.id as number,
        name: raw.name as string,
        slug: raw.slug as string,
        imageUrl: extractImageUrl(raw.image),
        cloudinaryPublicId: extractCloudinaryPublicId(raw.image),
        parentId: parent ? (parent.id as number) : null,
        parentSlug: parent ? (parent.slug as string) : null,
    }
}

/**
 * Get all active categories organized as tree (parent → children)
 */
export async function getActiveCategories(): Promise<CatalogCategory[]> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'categories',
        where: {
            is_active: { equals: true },
        },
        sort: 'sort_order',
        limit: 200,
        depth: 1,
        overrideAccess: true,
    })

    const allCategories = result.docs.map(
        (doc) => toCategory(doc as unknown as Record<string, unknown>)
    )

    // Build tree: root categories with children nested
    const roots = allCategories.filter((c) => !c.parentId)
    const children = allCategories.filter((c) => c.parentId)

    return roots.map((root) => ({
        ...root,
        children: children.filter((c) => c.parentId === root.id),
    }))
}

/**
 * Get single category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<CatalogCategory | null> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'categories',
        where: {
            slug: { equals: slug },
            is_active: { equals: true },
        },
        depth: 1,
        limit: 1,
        overrideAccess: true,
    })

    if (result.docs.length === 0) return null

    const category = toCategory(result.docs[0] as unknown as Record<string, unknown>)

    // Fetch children
    const childResult = await payload.find({
        collection: 'categories',
        where: {
            parent: { equals: category.id },
            is_active: { equals: true },
        },
        sort: 'sort_order',
        depth: 0,
        limit: 50,
        overrideAccess: true,
    })

    return {
        ...category,
        children: childResult.docs.map(
            (doc) => toCategory(doc as unknown as Record<string, unknown>)
        ),
    }
}

/**
 * Get root categories only (no parent)
 */
export async function getRootCategories(): Promise<CatalogCategory[]> {
    const payload = await getPayloadClient()

    const result = await payload.find({
        collection: 'categories',
        where: {
            is_active: { equals: true },
            parent: { exists: false },
        },
        sort: 'sort_order',
        limit: 50,
        depth: 0,
        overrideAccess: true,
    })

    return result.docs.map(
        (doc) => toCategory(doc as unknown as Record<string, unknown>)
    )
}
