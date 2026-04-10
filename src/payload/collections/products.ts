/**
 * Products Collection
 *
 * Core product information with brand and category relationships.
 * Many-to-Many with categories, Many-to-One with brands.
 * One-to-Many with product_variants.
 *
 * @see data-model.md section 3 for schema specification
 */

import type { CollectionConfig } from 'payload'

import { generateSlug } from '../hooks/before-change/generate-slug'
import { revalidateCache } from '../hooks/after-change/revalidate-cache'

export const Products: CollectionConfig = {
    slug: 'products',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'brand', 'is_active', 'createdAt'],
        group: 'Catalog',
        description: 'Products with brand and category relationships',
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
                description: 'Product name',
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
            name: 'brand',
            type: 'relationship',
            relationTo: 'brands',
            index: true,
            admin: {
                description: 'Product brand/manufacturer',
            },
        },
        {
            name: 'categories',
            type: 'relationship',
            relationTo: 'categories',
            hasMany: true,
            admin: {
                description: 'Product categories (Many-to-Many)',
            },
        },
        {
            name: 'description',
            type: 'richText',
            admin: {
                description: 'Product description (rich text)',
            },
        },
        {
            name: 'unit_label',
            type: 'text',
            required: true,
            defaultValue: 'Unit',
            admin: {
                description: 'Unit label (e.g., "Piece", "Pack", "Bottle")',
            },
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Main product image',
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
                description: 'Inactive products are hidden from storefront',
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
