/**
 * Categories Collection
 *
 * 2-level hierarchical product categorization.
 * Max depth enforced by validate-parent-depth hook.
 *
 * @see data-model.md section 2 for schema specification
 */

import type { CollectionConfig } from 'payload'

import { generateSlug } from '../hooks/before-change/generate-slug'
import { validateParentDepth } from '../hooks/before-change/validate-parent-depth'
import { revalidateCache } from '../hooks/after-change/revalidate-cache'

export const Categories: CollectionConfig = {
    slug: 'categories',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'parent', 'is_active', 'sort_order'],
        group: 'Catalog',
        description: 'Product categories (max 2 levels)',
    },
    access: {
        read: () => true, // Public read for storefront
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => user?.role === 'super-admin',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                description: 'Category display name',
            },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'URL-friendly identifier (auto-generated from name)',
                position: 'sidebar',
            },
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Category image',
            },
        },
        {
            name: 'parent',
            type: 'relationship',
            relationTo: 'categories',
            index: true,
            admin: {
                description: 'Parent category (max 2 levels: parent → child only)',
            },
            // Self-reference validation handled by validate-parent-depth hook
        },
        {
            name: 'sort_order',
            type: 'number',
            required: true,
            defaultValue: 0,
            admin: {
                description: 'Display order (lower = first)',
                position: 'sidebar',
            },
        },
        {
            name: 'is_active',
            type: 'checkbox',
            required: true,
            defaultValue: true,
            admin: {
                description: 'Inactive categories are hidden from storefront',
                position: 'sidebar',
            },
        },
    ],
    hooks: {
        beforeChange: [generateSlug, validateParentDepth],
        afterChange: [revalidateCache],
    },
    timestamps: true,
}
