/**
 * Orders & OrderItems Collections
 *
 * Feature-owned collection definitions for the checkout feature.
 * Orders hold customer info and status; OrderItems hold immutable price snapshots.
 *
 * @see data-model.md: orders and order_items collection schemas
 * @see spec.md: FR-017/FR-018/FR-019/FR-020 (collection constraints)
 */

import type { CollectionConfig } from 'payload'

/**
 * Orders Collection
 *
 * Customer order record with human-readable order_number (VX-XXXXXX).
 * Session-linked for tracking. Status state machine enforced at app layer.
 */
export const Orders: CollectionConfig = {
    slug: 'orders',
    admin: {
        useAsTitle: 'order_number',
        defaultColumns: ['order_number', 'customer_name', 'status', 'total_amount', 'createdAt'],
        group: 'Commerce',
        description: 'Customer orders with COD payment',
    },
    access: {
        read: ({ req: { user } }) => Boolean(user),     // Locked down, storefront uses Local API
        create: ({ req: { user } }) => Boolean(user),   // Locked down
        update: ({ req: { user } }) => Boolean(user),   // Admin status updates
        delete: ({ req: { user } }) => Boolean(user && (user as Record<string, unknown>).role === 'super-admin'),
    },
    fields: [
        {
            name: 'order_number',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'Human-readable order number (VX-XXXXXX)',
                readOnly: true,
            },
        },
        {
            name: 'session_id',
            type: 'text',
            required: true,
            index: true,
            admin: {
                description: 'Session at order time',
            },
        },
        {
            name: 'customer_name',
            type: 'text',
            required: true,
            admin: {
                description: 'Customer name (2-255 chars)',
            },
        },
        {
            name: 'customer_phone',
            type: 'text',
            required: true,
            index: true,
            admin: {
                description: 'Customer phone (+1 US format)',
            },
        },
        {
            name: 'notes',
            type: 'textarea',
            admin: {
                description: 'Optional order notes (max 1000 chars)',
            },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
            index: true,
            admin: {
                description: 'Order status (pending → processing → completed | cancelled)',
            },
        },
        {
            name: 'cancellation_reason',
            type: 'textarea',
            admin: {
                description: 'Why the order was cancelled',
                condition: (_data, siblingData) => siblingData?.status === 'cancelled',
            },
        },
        {
            name: 'cancelled_by',
            type: 'select',
            options: [
                { label: 'Customer', value: 'customer' },
                { label: 'Admin', value: 'admin' },
            ],
            admin: {
                description: 'Who cancelled the order',
                condition: (_data, siblingData) => siblingData?.status === 'cancelled',
            },
        },
        {
            name: 'cancelled_at',
            type: 'date',
            admin: {
                description: 'When the order was cancelled',
                condition: (_data, siblingData) => siblingData?.status === 'cancelled',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
        {
            name: 'honeypot_field',
            type: 'text',
            admin: {
                hidden: true,
            },
        },
        {
            name: 'total_amount',
            type: 'number',
            required: true,
            min: 0,
            admin: {
                description: 'Order total in USD',
            },
        },
    ],
    timestamps: true,
}

/**
 * OrderItems Collection
 *
 * Line items in orders. Immutable price snapshots — never change after creation.
 * variant_id may be NULL if variant deleted after order.
 */
export const OrderItems: CollectionConfig = {
    slug: 'order_items',
    admin: {
        defaultColumns: ['order', 'product_name', 'variant_name', 'quantity', 'total_price'],
        group: 'Commerce',
        description: 'Line items in orders (immutable snapshots)',
    },
    access: {
        read: ({ req: { user } }) => Boolean(user),
        create: ({ req: { user } }) => Boolean(user),
        update: () => false,       // Immutable after creation
        delete: () => false,       // Immutable after creation
    },
    fields: [
        {
            name: 'order',
            type: 'relationship',
            relationTo: 'orders',
            required: true,
            index: true,
        },
        {
            name: 'variant',
            type: 'relationship',
            relationTo: 'product_variants',
            // Not required — variant may be deleted after order
        },
        {
            name: 'product_name',
            type: 'text',
            required: true,
            admin: {
                description: 'Product name snapshot at order time',
                readOnly: true,
            },
        },
        {
            name: 'variant_name',
            type: 'text',
            required: true,
            admin: {
                description: 'Variant name snapshot at order time',
                readOnly: true,
            },
        },
        {
            name: 'quantity',
            type: 'number',
            required: true,
            min: 1,
            admin: {
                readOnly: true,
            },
        },
        {
            name: 'unit_price',
            type: 'number',
            required: true,
            min: 0,
            admin: {
                description: 'Price per unit at order time',
                readOnly: true,
            },
        },
        {
            name: 'total_price',
            type: 'number',
            required: true,
            min: 0,
            admin: {
                description: 'unit_price × quantity',
                readOnly: true,
            },
        },
    ],
    timestamps: false,
}
