/**
 * Validate Parent Depth Hook — beforeChange
 *
 * Enforces max 2-level category hierarchy (parent → child only).
 * Prevents:
 * 1. Self-referencing (category pointing to itself)
 * 2. Depth > 2 (grandchild categories)
 *
 * Used by: Categories
 *
 * @see data-model.md section 2: Max 2 levels enforced in application hook
 */

import type { CollectionBeforeChangeHook } from 'payload'

export const validateParentDepth: CollectionBeforeChangeHook = async ({
    data,
    req,
    originalDoc,
    operation,
}) => {
    if (!data?.parent) return data

    const categoryId = originalDoc?.id

    // 1. Prevent self-reference
    if (categoryId && data.parent === categoryId) {
        throw new Error('A category cannot be its own parent')
    }

    // 2. Check if the parent already has a parent (would make this level 3)
    const payload = req.payload
    const parentCategory = await payload.findByID({
        collection: 'categories',
        id: data.parent as string | number,
        depth: 0,
        req,
    })

    if (parentCategory?.parent) {
        throw new Error(
            'Maximum category depth is 2 levels. The selected parent is already a subcategory.'
        )
    }

    // 3. On update: check if this category has children (can't become a child itself)
    if (operation === 'update' && categoryId) {
        const children = await payload.find({
            collection: 'categories',
            where: {
                parent: { equals: categoryId },
            },
            limit: 1,
            depth: 0,
            req,
        })

        if (children.totalDocs > 0 && data.parent) {
            throw new Error(
                'This category has subcategories and cannot become a subcategory itself. Remove its children first.'
            )
        }
    }

    return data
}
