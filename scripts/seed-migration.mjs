import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getPayload } from 'payload'
import config from '../src/payload/payload.config'
import fs from 'fs'
import path from 'path'

async function runSeed() {
    console.log('🚀 Starting Data Seeding from migration-data.json...')

    // 1. Read JSON file
    const dataPath = path.resolve(process.cwd(), 'migration-data.json')
    if (!fs.existsSync(dataPath)) {
        console.error('❌ migration-data.json not found! Run preparation script first.')
        process.exit(1)
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    console.log(`📦 Loaded Data: ${data.brands.length} Brands, ${data.categories.length} Categories, ${data.products.length} Products, ${data.variants.length} Variants`)

    // 2. Initialize Payload safely
    const payload = await getPayload({ config })
    console.log('✅ Payload CMS Initialized')

    // Maps to store new DB IDs based on old SQL IDs
    const oldMediaToNewId = new Map()
    const oldBrandToNewId = new Map()
    const oldCatToNewId = new Map()
    const oldProductToNewId = new Map()

    // Helper: Find or Create Media
    async function getOrCreateMedia(mediaObj, entityName) {
        if (!mediaObj || !mediaObj.oldPublicId) return null

        if (oldMediaToNewId.has(mediaObj.oldPublicId)) {
            return oldMediaToNewId.get(mediaObj.oldPublicId)
        }

        // Check DB via secure URL in case of re-runs
        const existing = await payload.find({
            collection: 'media',
            where: { cloudinary_secure_url: { equals: mediaObj.cloudinary_secure_url } },
            limit: 1,
        })

        if (existing.docs.length > 0) {
            const id = existing.docs[0].id
            oldMediaToNewId.set(mediaObj.oldPublicId, id)
            return id
        }

        try {
            // Extract folder path from cloudinary_public_id
            const parts = mediaObj.cloudinary_public_id.split('/')
            const folderPath = parts.length > 1 ? parts.slice(0, -1).join('/') : 'media'

            const mediaDoc = await payload.create({
                collection: 'media',
                data: {
                    alt: entityName,
                    url: '/api/media/file/' + mediaObj.filename,
                    folder_path: folderPath,
                    cloudinary_public_id: mediaObj.cloudinary_public_id,
                    cloudinary_secure_url: mediaObj.cloudinary_secure_url,
                    filename: mediaObj.filename,
                    mimeType: mediaObj.mimeType,
                    filesize: mediaObj.filesize,
                    width: mediaObj.width,
                    height: mediaObj.height,
                },
            })
            const id = mediaDoc.id
            oldMediaToNewId.set(mediaObj.oldPublicId, id)
            return id
        } catch (err) {
            console.error(`❌ Failed to create Media for ${mediaObj.oldPublicId}:`, err.message)
            return null
        }
    }

    // --- PHASE 1: Brands ---
    console.log('\n🏭 Seeding Brands...')
    let brandSort = 1
    for (const b of data.brands) {
        const logoId = await getOrCreateMedia(b.media, b.name)
        try {
            const brand = await payload.create({
                collection: 'brands',
                data: {
                    name: b.name,
                    slug: b.slug,
                    logo: logoId || undefined,
                    sort_order: brandSort++,
                    is_active: b.is_active,
                },
            })
            oldBrandToNewId.set(b.oldId, brand.id)
            console.log(`  ✅ Brand: ${b.name}`)
        } catch (err) {
            console.error(`  ❌ Failed Brand ${b.name}: ${err.message}`)
        }
    }

    // --- PHASE 2: Categories ---
    console.log('\n🗂️ Seeding Categories...')
    const topLevelCats = data.categories.filter((c) => c.parentOldId === null)
    const childCats = data.categories.filter((c) => c.parentOldId !== null)

    let catSort = 1
    for (const c of topLevelCats) {
        const imageId = await getOrCreateMedia(c.media, c.name)
        try {
            const cat = await payload.create({
                collection: 'categories',
                data: {
                    name: c.name,
                    slug: c.slug,
                    image: imageId || undefined,
                    sort_order: catSort++,
                    is_active: c.is_active,
                },
            })
            oldCatToNewId.set(c.oldId, cat.id)
            console.log(`  ✅ Category (Parent): ${c.name}`)
        } catch (err) {
            console.error(`  ❌ Failed Category ${c.name}: ${err.message}`)
        }
    }

    for (const c of childCats) {
        const imageId = await getOrCreateMedia(c.media, c.name)
        const parentNewId = oldCatToNewId.get(c.parentOldId)
        try {
            const cat = await payload.create({
                collection: 'categories',
                data: {
                    name: c.name,
                    slug: c.slug,
                    image: imageId || undefined,
                    parent: parentNewId || undefined,
                    sort_order: catSort++,
                    is_active: c.is_active,
                },
            })
            oldCatToNewId.set(c.oldId, cat.id)
            console.log(`  ✅ Category (Child): ${c.name}`)
        } catch (err) {
            console.error(`  ❌ Failed Category ${c.name}: ${err.message}`)
        }
    }

    // --- PHASE 3: Products ---
    console.log('\n📦 Seeding Products...')
    const prodCatMap = new Map()
    for (const link of data.productCategories) {
        if (!prodCatMap.has(link.productOldId)) {
            prodCatMap.set(link.productOldId, [])
        }
        prodCatMap.get(link.productOldId).push(link.categoryOldId)
    }

    let prodSort = 1
    for (const p of data.products) {
        const imageId = await getOrCreateMedia(p.media, p.name)
        const brandNewId = oldBrandToNewId.get(p.brandOldId)

        const oldCatIds = prodCatMap.get(p.oldId) || []
        const newCatIds = oldCatIds.map((old) => oldCatToNewId.get(old)).filter(Boolean)

        try {
            const product = await payload.create({
                collection: 'products',
                data: {
                    name: p.name,
                    slug: p.slug,
                    unit_label: p.unit_label,
                    image: imageId || undefined,
                    brand: brandNewId || undefined,
                    categories: newCatIds,
                    sort_order: prodSort++,
                    is_active: p.is_active,
                },
            })
            oldProductToNewId.set(p.oldId, product.id)
            console.log(`  ✅ Product: ${p.name}`)
        } catch (err) {
            console.error(`  ❌ Failed Product ${p.name}: ${err.message}`)
        }
    }

    // --- PHASE 4: Variants ---
    console.log('\n🏷️ Seeding Variants...')

    const variantSortByProduct = new Map()

    for (const v of data.variants) {
        const prodNewId = oldProductToNewId.get(v.productOldId)
        if (!prodNewId) {
            console.warn(`  ⚠️ Skipping Variant ${v.variant_name} (Product not found)`)
            continue
        }

        const imagesArray = []
        let imageCounter = 1
        for (const m of v.mediaArray || []) {
            const altText = v.mediaArray.length > 1 ? `${v.variant_name} Image ${imageCounter++}` : v.variant_name
            const mediaId = await getOrCreateMedia(m, altText)
            if (mediaId) imagesArray.push({ image: mediaId })
        }

        if (!variantSortByProduct.has(prodNewId)) {
            variantSortByProduct.set(prodNewId, 1)
        }

        const currentSort = variantSortByProduct.get(prodNewId)
        variantSortByProduct.set(prodNewId, currentSort + 1)

        try {
            await payload.create({
                collection: 'product_variants',
                data: {
                    product: prodNewId,
                    variant_name: v.variant_name,
                    sku: v.sku,
                    price: v.price === 0 ? 1 : v.price,
                    stock_quantity: v.stock_quantity === 0 ? 1 : v.stock_quantity,
                    images: imagesArray,
                    option_value: v.option_value || undefined,
                    sort_order: currentSort,
                    is_active: v.is_active,
                },
            })
            console.log(`  ✅ Variant: ${v.variant_name}`)
        } catch (err) {
            console.error(`  ❌ Failed Variant ${v.variant_name}: ${err.message}`)
        }
    }

    console.log('\n🎉 SEED COMPLETE! Please check your Payload Admin Panel. 🚀')
    process.exit(0)
}

runSeed()
