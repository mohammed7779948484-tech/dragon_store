/**
 * Cart & CartItems Collections
 *
 * Server-side cart persistence using relational model.
 * Carts are linked to gate sessions via session_id.
 * CartItems are separate rows (NOT embedded arrays).
 *
 * @see data-model.md sections 7-8 for schema specification
 */

import type { CollectionConfig } from 'payload'

/**
 * Carts Collection
 *
 * Session-linked shopping cart.
 * - UUID primary key for security/scale
 * - Unique session_id links to gate session
 * - Expires after 24h of inactivity
 * - Cleaned up by automated cron job
 */
export const Carts: CollectionConfig = {
    slug: 'carts',
    admin: {
        useAsTitle: 'session_id',
        defaultColumns: ['session_id', 'expires_at', 'createdAt'],
        group: 'Commerce',
    },
    access: {
        read: ({ req: { user } }) => Boolean(user),
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => Boolean(user && user.role === 'super-admin'),
    },
    fields: [
        {
            name: 'session_id',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'Links to gate session (UUID)',
            },
        },
        {
            name: 'expires_at',
            type: 'date',
            required: true,
            index: true,
            admin: {
                description: '24h from last activity — extended on each cart update',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
    ],
    timestamps: true,
}

/**
 * CartItems Collection
 *
 * Individual items within a cart (relational, NOT embedded).
 * - One variant per cart only (upsert on duplicate)
 * - price_at_add captures price at time of addition for live change detection
 * - Cascading delete when parent cart is removed
 */
export const CartItems: CollectionConfig = {
    slug: 'cart_items',
    admin: {
        useAsTitle: 'id',
        defaultColumns: ['cart', 'variant', 'quantity', 'price_at_add'],
        group: 'Commerce',
    },
    access: {
        read: ({ req: { user } }) => Boolean(user),
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => Boolean(user),
    },
    fields: [
        {
            name: 'cart',
            type: 'relationship',
            relationTo: 'carts',
            required: true,
            index: true,
            admin: {
                description: 'Parent cart',
            },
        },
        {
            name: 'variant',
            type: 'relationship',
            relationTo: 'product_variants',
            required: true,
            index: true,
            admin: {
                description: 'Product variant added to cart',
            },
        },
        {
            name: 'quantity',
            type: 'number',
            required: true,
            min: 1,
            max: 10,
            defaultValue: 1,
            admin: {
                description: 'Quantity in cart (max 10 per item)',
            },
        },
        {
            name: 'price_at_add',
            type: 'number',
            required: true,
            min: 0,
            admin: {
                description: 'Price when item was added (for live price change detection)',
            },
        },
    ],
    timestamps: true,
}
