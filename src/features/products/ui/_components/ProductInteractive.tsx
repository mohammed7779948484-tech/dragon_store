'use client'

import { useState } from 'react'
import { CloudinaryImage } from '@/shared/ui/CloudinaryImage'

import { CURRENCY_SYMBOL, PLACEHOLDER_IMAGE } from '../../constants'
import { VariantSelector } from '../VariantSelector'

import type { CatalogVariant } from '../../types'

export interface ProductInteractiveProps {
    variants: CatalogVariant[]
    totalStock: number
    minPrice: number
    maxPrice: number
    unitLabel?: string
    imageUrl?: string | null
    cloudinaryPublicId?: string | null
    productName: string
    brandName?: string | null
    description?: string | null
    ActionComponent?: React.ComponentType<{ variantId: number; price: number; stockQuantity: number; quantity: number }> | undefined
}

export function ProductInteractive({
    variants,
    minPrice,
    maxPrice,
    totalStock,
    unitLabel,
    imageUrl,
    cloudinaryPublicId,
    productName,
    brandName,
    description,
    ActionComponent,
}: ProductInteractiveProps): React.ReactElement {
    // Default to the first active variant
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        variants[0]?.id ?? null
    )

    // Active gallery image index
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    const selectedVariant = variants.find((v) => v.id === selectedVariantId)

    // Reset gallery index when variant changes
    const handleVariantSelect = (variantId: number) => {
        setSelectedVariantId(variantId)
        setActiveImageIndex(0)
    }

    // Build image galleries mapping for both raw URLs (fallback) and explicit public IDs (primary)
    const galleryImages: string[] = selectedVariant && selectedVariant.images.length > 0
        ? selectedVariant.images
        : imageUrl
            ? [imageUrl]
            : [PLACEHOLDER_IMAGE]

    const galleryPublicIds: (string | null)[] = selectedVariant && selectedVariant.cloudinaryPublicIds && selectedVariant.cloudinaryPublicIds.length > 0
        ? selectedVariant.cloudinaryPublicIds
        : [cloudinaryPublicId || null]

    // Determine currently displayed items
    const displayImage = galleryImages[activeImageIndex] || galleryImages[0] || PLACEHOLDER_IMAGE
    const displayPublicId = galleryPublicIds[activeImageIndex] || galleryPublicIds[0] || null

    // Dynamic title: "Product Name - Variant Name"
    const displayTitle = selectedVariant
        ? `${productName} - ${selectedVariant.variantName}`
        : productName

    // Dynamic price
    const displayPrice = selectedVariant
        ? `${CURRENCY_SYMBOL}${selectedVariant.price.toFixed(2)}`
        : minPrice === maxPrice
            ? `${CURRENCY_SYMBOL}${minPrice.toFixed(2)}`
            : `From ${CURRENCY_SYMBOL}${minPrice.toFixed(2)}`

    const displayStock = selectedVariant ? selectedVariant.stockQuantity : totalStock

    return (
        <div className="grid gap-8 md:grid-cols-2">
            {/* Left: Dynamic Image Gallery */}
            <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-[var(--radius-xl)] bg-muted">
                    <CloudinaryImage
                        src={displayImage}
                        publicId={displayPublicId}
                        alt={displayTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-all duration-300"
                        priority
                    />
                </div>

                {/* Thumbnail Gallery (only if more than 1 image) */}
                {galleryImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {galleryImages.map((img, index) => {
                            const pId = galleryPublicIds[index] || null;
                            return (
                                <button
                                    key={`thumb-${index}`}
                                    type="button"
                                    onClick={() => setActiveImageIndex(index)}
                                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border-2 transition-all duration-200 ${index === activeImageIndex
                                        ? 'border-primary ring-1 ring-primary'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <CloudinaryImage
                                        src={img}
                                        publicId={pId}
                                        alt={`${displayTitle} - Image ${index + 1}`}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Viewing indicator */}
                {selectedVariant && (
                    <p className="text-center text-xs text-muted-foreground">
                        Viewing: {selectedVariant.variantName}
                    </p>
                )}
            </div>

            {/* Right: Info + Interactive */}
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    {brandName && (
                        <p className="text-sm font-medium uppercase tracking-wider text-primary">
                            {brandName}
                        </p>
                    )}
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                        {displayTitle}
                    </h1>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">
                        {displayPrice}
                    </p>
                    {unitLabel && unitLabel !== 'Unit' && (
                        <span className="text-sm text-muted-foreground">
                            / {unitLabel}
                        </span>
                    )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${displayStock > 0 ? 'bg-primary' : 'bg-destructive'
                            }`}
                    />
                    <span className="text-sm font-medium text-foreground">
                        {displayStock > 0 ? `In Stock (${displayStock} ${unitLabel}s)` : 'Out of Stock'}
                    </span>
                </div>

                {/* Variants with per-variant Action Buttons */}
                {variants.length > 0 && (
                    <VariantSelector
                        variants={variants}
                        selectedVariantId={selectedVariantId}
                        onSelect={handleVariantSelect}
                        ActionComponent={ActionComponent}
                    />
                )}

                {/* Description */}
                {description && (
                    <div className="mt-4 border-t border-border pt-6">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">
                            Description
                        </h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                            {typeof description === 'string' ? (
                                <p>{description}</p>
                            ) : (
                                <p>See full details above.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

