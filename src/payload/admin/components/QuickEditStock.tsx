/**
 * QuickEditStock — Payload Admin Custom Component
 *
 * Inline stock adjustment with +/- buttons for ProductVariants.
 * Uses Payload REST API to update stock_quantity without full page reload.
 *
 * Features:
 * - Increment/decrement with single-click buttons
 * - Custom quantity input for manual entry
 * - Saving state indicator
 * - Error handling with user feedback
 *
 * @see Constitution: NO inline styles — Tailwind CSS only
 * @see Constitution: `'use client'` required for interactive admin components
 * @see data-model.md: product_variants.stock_quantity >= 0
 */
'use client'

import React, { useState, useCallback } from 'react'

interface QuickEditStockProps {
    variantId: number | string
    initialStock: number
    serverUrl?: string
}

export function QuickEditStock({
    variantId,
    initialStock,
    serverUrl = '',
}: QuickEditStockProps): React.ReactElement {
    const [stock, setStock] = useState<number>(Math.max(0, Math.floor(initialStock)))
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const updateStock = useCallback(async (newStock: number): Promise<void> => {
        const clampedStock = Math.max(0, Math.floor(newStock))
        setStock(clampedStock)
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch(`${serverUrl}/api/product_variants/${variantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ stock_quantity: clampedStock }),
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({})) as { message?: string }
                throw new Error(data.message ?? `Failed to update stock (${response.status})`)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed')
            setStock(initialStock)
        } finally {
            setIsSaving(false)
        }
    }, [variantId, initialStock, serverUrl])

    const handleDecrement = useCallback((): void => {
        if (stock > 0 && !isSaving) {
            void updateStock(stock - 1)
        }
    }, [stock, isSaving, updateStock])

    const handleIncrement = useCallback((): void => {
        if (!isSaving) {
            void updateStock(stock + 1)
        }
    }, [stock, isSaving, updateStock])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            void updateStock(value)
        }
    }, [updateStock])

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
                {/* Decrement */}
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={stock === 0 || isSaving}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 bg-white text-sm font-medium transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    aria-label="Decrease stock"
                >
                    −
                </button>

                {/* Stock input */}
                <input
                    type="number"
                    value={stock}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    min={0}
                    className="h-7 w-16 rounded-md border border-neutral-300 bg-white px-2 text-center text-sm tabular-nums disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-800"
                    aria-label="Stock quantity"
                />

                {/* Increment */}
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={isSaving}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 bg-white text-sm font-medium transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    aria-label="Increase stock"
                >
                    +
                </button>

                {/* Saving indicator */}
                {isSaving && (
                    <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Saving…
                    </span>
                )}
            </div>

            {/* Error message */}
            {error && (
                <span className="text-xs text-red-600 dark:text-red-400">
                    {error}
                </span>
            )}
        </div>
    )
}

export default QuickEditStock
