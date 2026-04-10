/**
 * CategoryBrandFilter Component
 *
 * Displays brands as clickable filter cards within a category page.
 * The active brand is highlighted. Uses query params for filtering.
 * Server Component — no client-side state needed.
 */

import Link from 'next/link'
import Image from 'next/image'

import { PLACEHOLDER_IMAGE } from '../constants'

import type { CatalogBrand } from '@/modules/catalog'

interface CategoryBrandFilterProps {
    categorySlug: string
    brands: CatalogBrand[]
    selectedBrandSlug?: string | undefined
}

export function CategoryBrandFilter({
    categorySlug,
    brands,
    selectedBrandSlug,
}: CategoryBrandFilterProps): React.ReactElement {
    if (brands.length === 0) return <></>;

    return (
        <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Brands
                </h2>
                {selectedBrandSlug && (
                    <Link
                        href={`/categories/${categorySlug}`}
                        className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                        ← Show all brands
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {brands.map((brand) => {
                    const isActive = brand.slug === selectedBrandSlug

                    return (
                        <Link
                            key={brand.id}
                            href={`/categories/${categorySlug}?brand=${brand.slug}`}
                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 ${isActive
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                                }`}
                        >
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-background">
                                <Image
                                    src={brand.logoUrl || PLACEHOLDER_IMAGE}
                                    alt={brand.name}
                                    fill
                                    sizes="48px"
                                    className="object-contain p-1"
                                />
                            </div>
                            <span className={`text-center text-xs font-medium ${isActive
                                ? 'text-primary'
                                : 'text-foreground'
                                }`}>
                                {brand.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
