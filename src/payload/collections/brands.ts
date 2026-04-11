/**
 * Brands Collection
 *
 * Product manufacturer/brand information.
 * Separated into a dedicated collection (not a category type).
 *
 * @see data-model.md section 1 for schema specification
 */

import type { CollectionConfig } from 'payload'

import { generateSlug } from '../hooks/before-change/generate-slug'
import { revalidateCache } from '../hooks/after-change/revalidate-cache'

export const Brands: CollectionConfig = {
    slug: 'brands',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'is_active', 'sort_order'],
        group: 'Catalog',
        description: 'Product brands and manufacturers',
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
                description: 'Brand display name',
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
            name: 'logo',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Brand logo image',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'Optional brand description',
            },
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
                description: 'Inactive brands are hidden from storefront',
                position: 'sidebar',
            },
        },
    ],
    hooks: {
        beforeChange: [generateSlug],
        afterChange: [revalidateCache],
    },
    timestamps: true,
}
