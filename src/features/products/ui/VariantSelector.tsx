/**
 * VariantSelector Component
 *
 * Client Component — displays variant options as cards with thumbnails,
 * per-variant quantity steppers, and injected action buttons.
 * Style inspired by major e-commerce stores with card-per-variant layout.
 */

'use client'

import { useState } from 'react'
import { CloudinaryImage } from '@/shared/ui/CloudinaryImage'
import { motion, AnimatePresence } from 'framer-motion'
import { glowHover } from '@/shared/ui/motion/variants'

import { CURRENCY_SYMBOL, PLACEHOLDER_IMAGE } from '../constants'

import type { VariantSelectorProps } from '../types'

export function VariantSelector({
    variants,
    selectedVariantId,
    onSelect,
    ActionComponent,
}: VariantSelectorProps): React.ReactElement {
    // Track quantity per variant independently
    const [quantities, setQuantities] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {}
        for (const v of variants) {
            initial[v.id] = 1
        }
        return initial
    })

    const updateQuantity = (variantId: number, delta: number, max: number) => {
        setQuantities((prev) => {
            const current = prev[variantId] ?? 1
            const next = Math.max(1, Math.min(max, current + delta))
            return { ...prev, [variantId]: next }
        })
    }

    if (variants.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No options available.
            </p>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    Select Variant
                </h3>
                <span className="text-xs text-muted-foreground">
                    {variants.length} Options
                </span>
            </div>

            <div className="space-y-3 relative">
                {variants.map((variant) => {
                    const isSelected = variant.id === selectedVariantId
                    const inStock = variant.stockQuantity > 0
                    const thumbnailUrl = variant.images[0] || PLACEHOLDER_IMAGE
                    const qty = quantities[variant.id] ?? 1

                    return (
                        <motion.div
                            key={variant.id}
                            variants={glowHover}
                            initial="rest"
                            whileHover={!isSelected && inStock ? "hover" : "rest"}
                            className={`relative rounded-[var(--radius-xl)] border-2 ${isSelected
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-border bg-card'
                                }`}
                        >
                            {/* Smooth layout transition for the selected active border/glow */}
                            {isSelected && (
                                <motion.div
                                    layoutId="variantActiveRing"
                                    className="absolute inset-0 rounded-[calc(var(--radius-xl)-2px)] border border-primary pointer-events-none"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* Top row: clickable area for selection */}
                            <button
                                type="button"
                                onClick={() => onSelect(variant.id)}
                                className="flex w-full items-center gap-3 p-3 text-left outline-none"
                            >
                                {/* Variant Thumbnail */}
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-muted">
                                    <CloudinaryImage
                                        src={thumbnailUrl}
                                        publicId={variant.cloudinaryPublicIds?.[0] || null}
                                        alt={variant.variantName}
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                    />
                                </div>

                                {/* Variant Info */}
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold truncate transition-colors ${isSelected
                                        ? 'text-primary'
                                        : 'text-foreground'
                                        }`}>
                                        {variant.variantName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-base font-bold text-foreground">
                                            {CURRENCY_SYMBOL}{variant.price.toFixed(2)}
                                        </span>
                                        <span className={`text-xs font-medium ${inStock
                                            ? 'text-primary'
                                            : 'text-destructive'
                                            }`}>
                                            {inStock ? `${variant.stockQuantity} in stock` : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>

                                {/* Selected Indicator / Sold Out Badge */}
                                {!inStock ? (
                                    <span className="shrink-0 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                        Sold Out
                                    </span>
                                ) : (
                                    <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-transparent border border-border'}`}>
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.svg
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={3}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </motion.svg>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </button>

                            {/* Bottom row: Quantity stepper + Add to Cart (only if in stock) */}
                            <AnimatePresence>
                                {inStock && isSelected && ActionComponent && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3 border-t border-border px-3 pb-3 pt-2">
                                            {/* Quantity Stepper */}
                                            <div className="flex items-center rounded-lg border border-border">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateQuantity(variant.id, -1, variant.stockQuantity)
                                                    }}
                                                    disabled={qty <= 1}
                                                    className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 rounded-l-[var(--radius-lg)]"
                                                >
                                                    <span className="text-lg font-bold">−</span>
                                                </button>
                                                <span className="flex h-9 w-10 items-center justify-center border-x border-border text-sm font-semibold text-foreground">
                                                    {qty}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateQuantity(variant.id, 1, variant.stockQuantity)
                                                    }}
                                                    disabled={qty >= variant.stockQuantity}
                                                    className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 rounded-r-[var(--radius-lg)]"
                                                >
                                                    <span className="text-lg font-bold">+</span>
                                                </button>
                                            </div>

                                            {/* Injected Action Button */}
                                            <div className="flex-1">
                                                <ActionComponent
                                                    variantId={variant.id}
                                                    price={variant.price}
                                                    stockQuantity={variant.stockQuantity}
                                                    quantity={qty}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
