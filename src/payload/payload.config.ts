/**
 * Payload Configuration
 * Main configuration file for Payload CMS
 */

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { env } from '@/core/config/env'

// Collections
import { Users } from './collections/users'
import { Brands } from './collections/brands'
import { Categories } from './collections/categories'
import { Products } from './collections/products'
import { ProductVariants } from './collections/product-variants'
import { Media } from './collections/media'
import { Carts, CartItems } from '@/features/cart/db/schema'
import { Orders, OrderItems } from '@/features/checkout/db/schema'

// Globals
import { SiteSettings } from './globals/site-settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { cloudinaryAdapter } from './adapters/cloudinary'

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Icon: '@/payload/admin/graphics/Icon#Icon',
        Logo: '@/payload/admin/graphics/Logo#Logo',
      },
      views: {
        dashboard: {
          Component: '@/payload/admin/views/Dashboard#Dashboard',
        },
      },
    },
  },
  collections: [
    Users,
    Brands,
    Categories,
    Products,
    ProductVariants,
    Media,
    Carts,
    CartItems,
    Orders,
    OrderItems,
  ],
  globals: [
    SiteSettings,
  ],
  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter(),
          disableLocalStorage: true,
        },
      },
    }),
  ],
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    push: process.env.NODE_ENV !== 'production',
  }),
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  /**
   * Auto-seed on first initialization
   * Seeds gate_password from GATE_PASSWORD env var and creates first admin user
   */
  onInit: async (payload) => {
    try {
      // Seed gate_password if not already set
      const settings = await payload.findGlobal({
        slug: 'site-settings',
        overrideAccess: true,
      })
      if (!settings?.gate_password) {
        const gatePassword = env.GATE_PASSWORD
        if (gatePassword) {
          const bcrypt = await import('bcrypt')
          const hashedPassword = await bcrypt.hash(gatePassword, 10)
          await payload.updateGlobal({
            slug: 'site-settings',
            overrideAccess: true,
            data: {
              gate_password: hashedPassword,
              store_name: 'Dragon',
              whatsapp_number: process.env.WHATSAPP_NUMBER || '+15550199999',
              order_prefix: 'VX',
            },
          })
          payload.logger.info('✅ Gate password seeded from GATE_PASSWORD env var')
        } else {
          payload.logger.warn('⚠️ No GATE_PASSWORD env var set — gate login will fail!')
        }
      }

      // Create first admin user if none exist
      const existingUsers = await payload.find({
        collection: 'users',
        limit: 1,
        overrideAccess: true,
      })

      if (existingUsers.totalDocs === 0) {
        const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
        const password = process.env.SEED_ADMIN_PASSWORD || 'changeme123'

        await payload.create({
          collection: 'users',
          overrideAccess: true,
          data: {
            email,
            password,
            name: 'Admin',
            role: 'super-admin',
          } as Record<string, unknown>,
        })

        payload.logger.info(`✅ First admin user created: ${email}`)
      }
    } catch (error) {
      payload.logger.error(`❌ Seed failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
})
