/**
 * Media Collection
 *
 * File uploads stored locally (Cloudinary integration Phase 6+).
 * Used by brands (logo), categories (image), products (image),
 * and product_variants (image).
 *
 * @see data-model.md section 12 for schema specification
 */

import type { CollectionConfig } from 'payload'
import { env } from '@/core/config/env'

export const Media: CollectionConfig = {
    slug: 'media',
    admin: {
        useAsTitle: 'filename',
        defaultColumns: ['filename', 'mimeType', 'filesize', 'createdAt'],
        group: 'Media',
        description: 'Uploaded images and files',
    },
    access: {
        read: () => true, // Public read for storefront images
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => Boolean(user),
    },
    upload: {
        disableLocalStorage: true,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        adminThumbnail: ({ doc }) => {
            const publicId = doc?.cloudinary_public_id as string | undefined;
            if (publicId && env.CLOUDINARY_CLOUD_NAME) {
                // Force Cloudinary to serve an optimized 300x300 thumbnail for the admin panel
                return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_300,h_300,q_auto,f_auto/${publicId}`;
            }
            return (doc?.url as string) || null;
        }
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            admin: {
                description: 'Alt text for accessibility',
            },
        },
        {
            name: 'url',
            type: 'text',
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'Standard URL mapping for Payload Admin previews',
            },
        },
        {
            name: 'folder_path',
            type: 'text',
            admin: {
                position: 'sidebar',
                description: 'Folder path for admin panel filtering',
            },
        },
        {
            name: 'cloudinary_public_id',
            type: 'text',
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'Generated dynamically by Cloudinary Serverless Adapter',
            },
        },
        {
            name: 'cloudinary_secure_url',
            type: 'text',
            admin: {
                position: 'sidebar',
                readOnly: true,
            },
        },
    ],
    timestamps: true,
}
