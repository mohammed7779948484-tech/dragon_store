import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'

// ---- Config ----
const OLD_CLOUD_NAME = 'dhfepd9we'
const ROOT_ASSET_FOLDER = 'tobacco_store_products'
const OUTPUT_FILE = path.resolve(process.cwd(), 'migration-data.json')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure: true,
})

// ---- SQL Parser ----
function extractInsertData(sqlContent: string, tableName: string): any[][] {
    const regex = new RegExp(
        `INSERT INTO "public"\\."${tableName}" \\(([^)]+)\\) VALUES\\s*([\\s\\S]*?);`,
        'g'
    )
    const match = regex.exec(sqlContent)
    if (!match) return []

    const valuesBlock = match[2]!
    const rows: any[][] = []

    let i = 0
    while (i < valuesBlock.length) {
        const start = valuesBlock.indexOf('(', i)
        if (start === -1) break

        let depth = 0
        let inString = false
        let j = start
        for (; j < valuesBlock.length; j++) {
            const ch = valuesBlock[j]
            if (inString) {
                if (ch === "'" && valuesBlock[j + 1] === "'") j++
                else if (ch === "'") inString = false
            } else {
                if (ch === "'") inString = true
                else if (ch === '(') depth++
                else if (ch === ')') {
                    depth--
                    if (depth === 0) break
                }
            }
        }

        const rowContent = valuesBlock.slice(start + 1, j)
        const parts = rowContent
            .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
            .map((p) => {
                p = p.trim()
                if (p === 'NULL') return null
                if (p.startsWith("'") && p.endsWith("'")) return p.slice(1, -1).replace(/''/g, "'")
                if (p === 'true') return true
                if (p === 'false') return false
                if (!isNaN(Number(p))) return Number(p)
                return p
            })
        rows.push(parts)
        i = j + 1
    }
    return rows
}

function extractSubfolder(publicId: string): string {
    if (!publicId) return ''
    let cleaned = publicId
    if (cleaned.startsWith(`${ROOT_ASSET_FOLDER}/`)) {
        cleaned = cleaned.slice(ROOT_ASSET_FOLDER.length + 1)
    }
    const parts = cleaned.split('/')
    if (parts.length <= 1) return ''
    return parts.slice(0, -1).join('/')
}

function parseImageUrlsArray(raw: string | null): string[] {
    if (!raw || raw === '{}') return []
    let inner = String(raw).replace(/^{|}$/g, '').trim()
    if (!inner) return []
    return inner.split(',').map((s) => s.replace(/"/g, '').trim()).filter((s) => s.length > 0)
}

// Memory cache to avoid re-uploading the same image
const uploadedImages = new Map<string, any>()

// Attempt to load existing migration-data to resume if interrupted
let existingData: any = { brands: [], categories: [], products: [], productCategories: [], variants: [] }
if (fs.existsSync(OUTPUT_FILE)) {
    try {
        existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
        console.log('📦 Found existing migration-data.json, will use it to skip already uploaded images.')

        // Populate cache from existing data
        const allMedia = [
            ...existingData.brands.map((b: any) => b.media),
            ...existingData.categories.map((c: any) => c.media),
            ...existingData.products.map((p: any) => p.media),
            ...existingData.variants.flatMap((v: any) => v.mediaArray)
        ].filter(Boolean)

        for (const item of allMedia) {
            if (item.oldPublicId) {
                uploadedImages.set(item.oldPublicId, item)
            }
        }
        console.log(`♻️ Loaded ${uploadedImages.size} previously uploaded images into cache.`)
    } catch (e) {
        console.log('⚠️ Could not parse existing migration-data.json, starting fresh.')
    }
}

async function uploadToCloudinary(oldPublicId: string | null): Promise<any | null> {
    if (!oldPublicId || typeof oldPublicId !== 'string') return null
    if (uploadedImages.has(oldPublicId)) return uploadedImages.get(oldPublicId)

    const oldUrl = `https://res.cloudinary.com/${OLD_CLOUD_NAME}/image/upload/${oldPublicId}`
    const subfolder = extractSubfolder(oldPublicId)
    const filename = oldPublicId.split('/').pop() || 'image'
    const newFolder = subfolder ? `media/${subfolder}` : 'media'

    try {
        console.log(`⏳ Uploading: ${oldPublicId}...`)

        // Offset timestamp by +2 hours to combat local clock being behind real time
        const serverTimestamp = Math.floor(Date.now() / 1000) + 7200

        const result = await cloudinary.uploader.upload(oldUrl, {
            folder: newFolder,
            public_id: filename,
            resource_type: 'auto',
            overwrite: false,
            timestamp: serverTimestamp
        })

        const mediaData = {
            oldPublicId: oldPublicId,
            alt: `migrated:${oldPublicId}`,
            url: result.secure_url,
            cloudinary_public_id: result.public_id,
            cloudinary_secure_url: result.secure_url,
            filename: `${filename}.${result.format || 'jpg'}`,
            mimeType: `image/${result.format || 'jpeg'}`,
            filesize: result.bytes,
            width: result.width,
            height: result.height,
        }

        uploadedImages.set(oldPublicId, mediaData)
        return mediaData
    } catch (err: any) {
        console.error(`❌ Failed to migrate image "${oldPublicId}":`, err.message)
        return null
    }
}

async function run() {
    console.log('\n🚀 Starting Data Extraction & Image Uploads...')

    const sqlPath = path.resolve(process.cwd(), 'seedsql.txt')
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ seedsql.txt not found!')
        process.exit(1)
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    const dataObj = {
        brands: [] as any[],
        categories: [] as any[],
        products: [] as any[],
        productCategories: [] as any[], // Join table
        variants: [] as any[]
    }

    // --- 1. Brands & Categories ---
    const rawCategories = extractInsertData(sqlContent, 'categories')
    const brandRows = rawCategories.filter((r) => r[3] === 'brand')
    const categoryRows = rawCategories.filter((r) => r[3] !== 'brand')

    for (const row of brandRows) {
        const [oldId, name, slug, , imageUrl, , sortOrder, isActive] = row
        const media = await uploadToCloudinary(imageUrl)
        dataObj.brands.push({
            oldId: Number(oldId),
            name: String(name).trim(),
            slug: String(slug).trim(),
            sort_order: Number(sortOrder) || 0,
            is_active: Boolean(isActive),
            media,
        })
    }

    for (const row of categoryRows) {
        const [oldId, name, slug, , imageUrl, parentOldId, sortOrder, isActive] = row
        const media = await uploadToCloudinary(imageUrl)
        dataObj.categories.push({
            oldId: Number(oldId),
            name: String(name).trim(),
            slug: String(slug).trim(),
            parentOldId: parentOldId ? Number(parentOldId) : null,
            sort_order: Number(sortOrder) || 0,
            is_active: Boolean(isActive),
            media,
        })
    }

    // --- 2. Products ---
    const rawProducts = extractInsertData(sqlContent, 'products')
    for (const row of rawProducts) {
        const [oldId, brandOldId, name, slug, _description, unitLabel, imageUrl, sortOrder, isActive] = row
        const media = await uploadToCloudinary(imageUrl)
        dataObj.products.push({
            oldId: Number(oldId),
            brandOldId: brandOldId ? Number(brandOldId) : null,
            name: String(name).trim(),
            slug: String(slug).trim(),
            unit_label: unitLabel ? String(unitLabel).trim() : 'Unit',
            sort_order: Number(sortOrder) || 0,
            is_active: Boolean(isActive),
            media,
        })
    }

    // --- 3. Product Categories Map (Join Table) ---
    const rawProductCats = extractInsertData(sqlContent, 'product_categories')
    for (const row of rawProductCats) {
        dataObj.productCategories.push({
            productOldId: Number(row[0]),
            categoryOldId: Number(row[1])
        })
    }

    // --- 4. Variants ---
    const rawVariants = extractInsertData(sqlContent, 'product_variants')
    for (const row of rawVariants) {
        const [oldId, prodOldId, variantName, sku, price, stockQty, , isActive, sortOrder, , imageUrlsRaw, optionValue] = row

        const imagePublicIds = parseImageUrlsArray(String(imageUrlsRaw))
        const mediaArray: any[] = []
        for (const pid of imagePublicIds) {
            const media = await uploadToCloudinary(pid)
            if (media) mediaArray.push(media)
        }

        dataObj.variants.push({
            oldId: Number(oldId),
            productOldId: Number(prodOldId),
            variant_name: String(variantName).trim(),
            sku: String(sku).trim(),
            price: Number(price) || 0,
            stock_quantity: Number(stockQty) || 0,
            option_value: optionValue ? String(optionValue).trim() : null,
            sort_order: Number(sortOrder) || 0,
            is_active: Boolean(isActive),
            mediaArray,
        })
    }

    // --- Write File ---
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataObj, null, 2))
    console.log(`\n🎉 Done! All data saved to: ${OUTPUT_FILE}`)
    console.log(`📊 Stats:`)
    console.log(`   - Brands: ${dataObj.brands.length}`)
    console.log(`   - Categories: ${dataObj.categories.length}`)
    console.log(`   - Products: ${dataObj.products.length}`)
    console.log(`   - Product-Category Links: ${dataObj.productCategories.length}`)
    console.log(`   - Variants: ${dataObj.variants.length}`)
    console.log(`   - Total Images Processed: ${uploadedImages.size}`)
}

run()
