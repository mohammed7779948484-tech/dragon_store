/**
 * ProductCard Component
 *
 * Displays a product card in the storefront grid.
 * Infused with Framer Motion for luxurious hover glowing states.
 */
'use client'

import Link from 'next/link'
import { CloudinaryImage } from '@/shared/ui/CloudinaryImage'
import { motion } from 'framer-motion'
import { glowHover } from '@/shared/ui/motion/variants'
import { CURRENCY_SYMBOL, PLACEHOLDER_IMAGE } from '../constants'

import type { ProductCardProps } from '../types'

// Wrap Next Link with motion for animation
const MotionLink = motion.create(Link)

export function ProductCard({ product }: ProductCardProps): React.ReactElement {
    const { name, slug, imageUrl, brandName, minPrice, maxPrice, variantCount, inStock } = product

    const priceDisplay =
        minPrice === maxPrice
            ? `${CURRENCY_SYMBOL}${minPrice.toFixed(2)}`
            : `${CURRENCY_SYMBOL}${minPrice.toFixed(2)} – ${CURRENCY_SYMBOL}${maxPrice.toFixed(2)}`

    return (
        <MotionLink
            href={`/products/${slug}`}
            variants={glowHover}
            initial="rest"
            whileHover="hover"
            className="group block overflow-hidden rounded-[var(--radius-xl)] border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:border-primary/50 transition-all outline-none"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-card/20 pb-0">
                <CloudinaryImage
                    src={imageUrl || PLACEHOLDER_IMAGE}
                    publicId={product.cloudinaryPublicId}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Variant Count Badge */}
                {variantCount > 1 && (
                    <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm shadow-sm border border-border/50">
                        {variantCount} Flavors
                    </span>
                )}
                {!inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
                        <span className="rounded-full bg-destructive/90 px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="p-4">
                {brandName && (
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {brandName}
                    </p>
                )}
                <h3 className="mb-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {name}
                </h3>
                <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-foreground">
                        {priceDisplay}
                    </p>
                    {variantCount > 1 && (
                        <span className="text-xs text-muted-foreground animate-pulse">
                            {variantCount} options
                        </span>
                    )}
                </div>
            </div>
        </MotionLink>
    )
}
