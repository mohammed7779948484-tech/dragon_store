/**
 * Generate Slug Hook — beforeChange
 *
 * Auto-generates a URL-friendly slug from the 'name' field
 * if slug is empty or not provided. Reusable across collections.
 *
 * Used by: Brands, Categories, Products
 *
 * @see Constitution: Hooks can import from modules/, core/, shared/
 */

import type { CollectionBeforeChangeHook } from 'payload'

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/[\s_]+/g, '-')  // Replace spaces/underscores with hyphens
        .replace(/-+/g, '-')      // Collapse multiple hyphens
        .replace(/^-+|-+$/g, '')  // Trim leading/trailing hyphens
}

export const generateSlug: CollectionBeforeChangeHook = ({
    data,
}) => {
    // Only generate slug if one is not already provided
    // This allows migration scripts and manual slug setting to work correctly
    if (data && !data.slug) {
        if (data.name && typeof data.name === 'string') {
            data.slug = slugify(data.name)
        }
    }

    return data
}
