#!/usr/bin/env tsx
/**
 * Seed Script
 * 
 * Creates the initial Super Admin user and SiteSettings.
 * Idempotent - safe to run multiple times.
 * 
 * Usage:
 *   npm run seed
 *   or
 *   npx tsx scripts/seed-admin.ts
 */

import { getPayload } from 'payload'
import config from '../src/payload/payload.config'
import bcrypt from 'bcrypt'

async function seed() {
  console.log('\n🌱 Starting seed process...\n')

  try {
    const payload = await getPayload({ config })

    // Check if super admin already exists
    const existingAdmins = await payload.find({
      collection: 'users',
      where: {
        role: {
          equals: 'super-admin',
        },
      },
    })

    if (existingAdmins.docs.length > 0) {
      console.log('✓ Super admin already exists:', existingAdmins.docs[0]?.email || 'unknown')
      console.log('  Skipping user creation.\n')
    } else {
      // Create super admin
      const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
      const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme123'

      const superAdmin = await payload.create({
        collection: 'users',
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Super Admin',
          role: 'super-admin',
          isActive: true,
        },
      })

      console.log('✓ Super admin created successfully!')
      console.log('  Email:', superAdmin.email)
      console.log('  Password: [hidden - set via SEED_ADMIN_PASSWORD env var]')
      console.log('  ⚠️  IMPORTANT: Change the password after first login!\n')
    }

    // Check if site settings exist
    const existingSettings = await payload.findGlobal({
      slug: 'site-settings',
    })

    if (existingSettings?.gate_password) {
      console.log('✓ Site settings already initialized')
      console.log('  Gate password: [configured]')
      console.log('  WhatsApp:', existingSettings.whatsapp_number || 'not set')
      console.log('  Store name:', existingSettings.store_name || 'Vape Store')
      console.log('  Skipping settings initialization.\n')
    } else {
      // Create initial site settings
      const gatePassword = process.env.GATE_PASSWORD

      if (!gatePassword) {
        console.error('❌ ERROR: GATE_PASSWORD environment variable is required')
        console.error('   Set it in .env.local and try again.\n')
        process.exit(1)
      }

      // Hash the gate password
      const hashedPassword = await bcrypt.hash(gatePassword, 10)

      const settings = await payload.updateGlobal({
        slug: 'site-settings',
        data: {
          gate_password: hashedPassword,
          whatsapp_number: process.env.WHATSAPP_NUMBER || '+15550199999',
          order_prefix: 'VX',
          store_name: 'Vape Store',
        },
      })

      console.log('✓ Site settings initialized successfully!')
      console.log('  Gate password: [hashed]')
      console.log('  WhatsApp:', settings.whatsapp_number)
      console.log('  Store name:', settings.store_name)
      console.log('  Order prefix:', settings.order_prefix)
      console.log('')
    }

    console.log('🎉 Seed completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Start the development server: npm run dev')
    console.log('  2. Navigate to http://localhost:3000/admin')
    console.log('  3. Log in with the super admin credentials')
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seed failed:')
    console.error(error)
    console.log('')
    process.exit(1)
  }
}

// Run seed (ESM-compatible — no require.main check needed)
seed()

export { seed }
