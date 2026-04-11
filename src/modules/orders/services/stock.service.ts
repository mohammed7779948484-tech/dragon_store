/**
 * Stock Service
 *
 * Atomic stock decrement and return operations.
 * Uses Payload v3 transaction API for race-condition-safe operations.
 *
 * @see Constitution Lines 706-751: Transaction pattern with req threading
 * @see Constitution Lines 1725-1789: Direct Decrement model, class-based
 * @see Payload Skill: Pass req to operations for transaction atomicity
 * @see spec.md: FR-022 (decrementStock, returnStock)
 */

import { getPayloadClient } from '@/lib/payload'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import type { PayloadRequest } from 'payload'

const logger = new Logger()

/** Result from a stock check */
interface StockCheckResult {
    variantId: number
    available: number
    requested: number
    sufficient: boolean
}

/** Result from a variant info lookup */
interface VariantInfo {
    productName: string
    variantName: string
    price: number
    stockQuantity: number
    isActive: boolean
}

/**
 * Stock service — class-based per constitution pattern.
 *
 * @see Constitution Line 1731: export class StockService
 */
export class StockService {
    /**
     * Get variant details for cart display and validation.
     *
     * @param variantId - The variant ID to look up
     * @returns Variant info or null if not found
     */
    async getVariantInfo(variantId: number): Promise<VariantInfo | null> {
        const payload = await getPayloadClient()

        try {
            const variant = await payload.findByID({
                collection: 'product_variants',
                id: variantId,
                depth: 1, // Resolve product relationship
                overrideAccess: true, // System operation
            })

            if (!variant) return null

            // Resolve the parent product (depth: 1 populates the relationship)
            const product = typeof variant.product === 'object' ? variant.product : null
            const productName = product?.name ?? 'Unknown Product'
            const isProductActive = product?.is_active !== false
            const isVariantActive = (variant.is_active as boolean) !== false

            return {
                productName,
                variantName: (variant.name as string) ?? 'Default',
                price: (variant.price as number) ?? 0,
                stockQuantity: (variant.stock_quantity as number) ?? 0,
                isActive: isProductActive && isVariantActive,
            }
        } catch (error) {
            logger.error(error as Error, { context: `getVariantInfo(${variantId})` })
            return null
        }
    }

    /**
     * Decrement stock for multiple variants atomically within a transaction.
     *
     * @param items - Array of { variantId, quantity } to decrement
     * @param req - Payload request object with active transaction
     * @returns Array of stock check results
     * @throws AppError if any variant has insufficient stock
     *
     * @see Constitution: All data writes through Payload Local API
     * @see Constitution: PostgreSQL serializable isolation prevents race conditions
     */
    async decrementStock(
        items: Array<{ variantId: number; quantity: number }>,
        req: PayloadRequest
    ): Promise<StockCheckResult[]> {
        const payload = await getPayloadClient()
        const results: StockCheckResult[] = []

        const variantIds = items.map((item) => item.variantId)

        // Fetch all variants in a single query to prevent N+1 queries in transaction
        const variantsResult = await payload.find({
            collection: 'product_variants',
            where: {
                id: { in: variantIds },
            },
            limit: 100, // Safe limit for typical carts
            depth: 0,
            overrideAccess: true, // System operation
            req,
        })

        const variantsMap = new Map(variantsResult.docs.map((doc: any) => [typeof doc.id === 'string' ? parseInt(doc.id, 10) : doc.id as number, doc as Record<string, unknown>]))

        for (const item of items) {
            const variant = variantsMap.get(item.variantId)

            if (!variant) {
                throw new AppError(
                    `Variant ${item.variantId} not found`,
                    404,
                    'NOT_FOUND'
                )
            }

            const currentStock = (variant.stock_quantity as number) ?? 0
            const sufficient = currentStock >= item.quantity

            results.push({
                variantId: item.variantId,
                available: currentStock,
                requested: item.quantity,
                sufficient,
            })

            if (!sufficient) {
                throw new AppError(
                    `Insufficient stock for variant ${item.variantId}. Available: ${currentStock}, Requested: ${item.quantity}`,
                    400,
                    'INSUFFICIENT_STOCK'
                )
            }

            // Atomic decrement within transaction
            await payload.update({
                collection: 'product_variants',
                id: item.variantId,
                data: {
                    stock_quantity: currentStock - item.quantity,
                },
                overrideAccess: true, // System operation
                depth: 0, // CRITICAL: Prevent slow read-after-write population queries
                context: { skipRevalidation: true }, // Prevent slow Next.js revalidateTag inside DB transaction
                req,
            })

            logger.info(`Stock decremented: variant ${item.variantId}, ${currentStock} → ${currentStock - item.quantity}`)
        }

        return results
    }

    /**
     * Return stock for variants (used on order cancellation).
     * Best-effort — does not throw on failure.
     *
     * @param items - Array of { variantId, quantity } to return
     */
    async returnStock(
        items: Array<{ variantId: number; quantity: number }>
    ): Promise<void> {
        const payload = await getPayloadClient()

        for (const item of items) {
            try {
                const variant = await payload.findByID({
                    collection: 'product_variants',
                    id: item.variantId,
                    depth: 0,
                    overrideAccess: true, // System operation
                })

                if (variant) {
                    const currentStock = (variant.stock_quantity as number) ?? 0
                    await payload.update({
                        collection: 'product_variants',
                        id: item.variantId,
                        data: {
                            stock_quantity: currentStock + item.quantity,
                        },
                        overrideAccess: true, // System operation
                        depth: 0,
                        context: { skipRevalidation: true },
                    })

                    logger.info(`Stock returned: variant ${item.variantId}, ${currentStock} → ${currentStock + item.quantity}`)
                }
            } catch (error) {
                // Log but don't throw — stock return is best-effort
                logger.error(error as Error, { context: `Failed to return stock for variant ${item.variantId}` })
            }
        }
    }
}
