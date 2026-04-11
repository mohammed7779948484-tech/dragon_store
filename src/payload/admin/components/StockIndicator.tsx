/**
 * StockIndicator — Payload Admin Custom Component
 *
 * Visual stock level indicator for ProductVariants list view.
 * Shows colored badge based on stock_quantity:
 * - Green: In Stock (>5)
 * - Amber: Low Stock (1-5)
 * - Red: Out of Stock (0)
 *
 * @see Constitution: NO inline styles — Tailwind CSS only
 * @see data-model.md: product_variants.stock_quantity (INTEGER >= 0)
 */
'use client'

import React from 'react'

/** Low stock threshold */
const LOW_STOCK_THRESHOLD = 5

interface StockIndicatorProps {
    stockQuantity: number
}

export function StockIndicator({ stockQuantity }: StockIndicatorProps): React.ReactElement {
    const quantity = Math.max(0, Math.floor(stockQuantity))

    if (quantity === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Out of Stock
            </span>
        )
    }

    if (quantity <= LOW_STOCK_THRESHOLD) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Low Stock ({quantity})
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            In Stock ({quantity})
        </span>
    )
}

export default StockIndicator
