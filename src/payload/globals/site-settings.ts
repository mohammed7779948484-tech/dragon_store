/**
 * Site Settings Global
 * 
 * Singleton configuration for store-wide settings
 * Only Super Admin can modify these settings
 */

import type { GlobalConfig } from 'payload'
import { superAdminOnly, superAdminFieldAccess } from '../access/is-super-admin'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Configuration',
    description: 'Global store configuration. Only Super Admin can modify.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: superAdminOnly,
  },
  fields: [
    {
      name: 'gate_password',
      type: 'text',
      required: true,
      admin: {
        description: 'Bcrypt hashed password for site access gate',
        position: 'sidebar',
      },
      access: {
        update: superAdminFieldAccess,
      },
    },
    {
      name: 'whatsapp_number',
      type: 'text',
      required: true,
      // Validation handled in admin UI
      admin: {
        description: 'WhatsApp contact number (e.g., +15550199999)',
      },
    },
    {
      name: 'order_prefix',
      type: 'text',
      defaultValue: 'VX',
      admin: {
        description: 'Prefix for order numbers (e.g., VX-XXXXXX)',
      },
      // Validation handled in admin UI
    },
    {
      name: 'store_name',
      type: 'text',
      defaultValue: 'Puff puff pass',
      admin: {
        description: 'Store display name',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data }) => {
        // Hash the gate password if it's being updated and not already hashed
        if (data?.gate_password && !data.gate_password.startsWith('$2')) {
          const bcrypt = await import('bcrypt')
          data.gate_password = await bcrypt.hash(data.gate_password, 10)
        }
        return data
      },
    ],
  },
}
