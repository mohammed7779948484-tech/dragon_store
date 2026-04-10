/**
 * Revalidate Cache Hook — afterChange
 *
 * Triggers Next.js page revalidation when catalog data changes.
 * Uses revalidateTag() to invalidate ISR cache for storefront pages.
 *
 * Used by: Products, Categories, Brands, ProductVariants
 *
 * NOTE: `revalidateTag` is imported dynamically to prevent Next.js from
 * bundling `next/cache` into the client bundle. This is required because
 * Payload hooks are loaded as part of the config, which is resolved in
 * both server and client contexts during the build phase.
 *
 * @see Next.js Docs: https://nextjs.org/docs/app/building-your-application/rendering/server-components
 * @see Payload Skill: HOOKS.md#nextjs-revalidation-with-context-control
 */

import type { CollectionAfterChangeHook } from 'payload'

export const revalidateCache: CollectionAfterChangeHook = async ({
    collection,
    doc,
    req,
    context,
}) => {
    // Prevent infinite loop if called from another hook
    if (context?.skipRevalidation) return doc

    const slug = collection.slug

    try {
        // Dynamic import keeps `next/cache` out of the client bundle.
        // This import is only resolved at runtime on the server.
        const { revalidateTag } = await import('next/cache')

        // Revalidate the collection tag
        revalidateTag(slug)

        // Revalidate specific item pages
        if (doc?.slug) {
            revalidateTag(`${slug}-${doc.slug}`)
        }

        // Revalidate home page (products grid)
        revalidateTag('home')

        req.payload.logger.info(
            `♻️ Cache revalidated for ${slug}${doc?.slug ? ` (${doc.slug})` : ''}`
        )
    } catch {
        // Revalidation may fail during build or in non-Next.js contexts
        // This is expected and safe to ignore
    }

    return doc
}
