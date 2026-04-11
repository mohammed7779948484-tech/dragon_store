/**
 * Users Collection
 * 
 * Store administrators only (no customer accounts).
 * Roles: 'super-admin' | 'admin'
 * 
 * Super Admin:
 * - Full access to everything
 * - Create/delete admins (invitation system)
 * - Change site settings (including gate password)
 * - Delete orders
 * 
 * Regular Admin:
 * - Manage products, categories, brands
 * - Manage orders (except delete)
 * - View dashboard
 * - Cannot create/delete admins
 * - Cannot change critical settings
 */

import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Administration',
  },
  auth: {
    tokenExpiration: 7200, // 2 hours
    cookies: {
      sameSite: 'Lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // Only admins can read users
    read: ({ req: { user } }) => {
      return Boolean(user)
    },
    // Only super-admins can create users
    create: ({ req: { user } }) => {
      return user?.role === 'super-admin'
    },
    // Users can update themselves, super-admins can update anyone
    update: ({ req: { user }, id }) => {
      if (user?.role === 'super-admin') return true
      return user?.id === id
    },
    // Only super-admins can delete users
    delete: ({ req: { user } }) => {
      return user?.role === 'super-admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the admin user',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        {
          label: 'Super Admin',
          value: 'super-admin',
        },
        {
          label: 'Admin',
          value: 'admin',
        },
      ],
      admin: {
        description: 'Super Admin has full access including user management',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive users cannot log in',
      },
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last successful login timestamp',
      },
    },
  ],
  hooks: {
    beforeLogin: [
      async ({ user, req }) => {
        // Check if user is active
        if (!user.isActive) {
          throw new Error('Account is disabled. Contact a super admin.')
        }

        // Update last login (pass req for transaction atomicity)
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: {
            lastLogin: new Date().toISOString(),
          },
          req,
        })
      },
    ],
  },
}
