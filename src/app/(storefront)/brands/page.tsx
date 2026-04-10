/**
 * Brands Listing Page
 *
 * Displays all active brands in a grid.
 */

import { getActiveBrands } from '@/features/products'
import { BrandGrid } from '@/features/products'

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'All Brands — Puff puff pass',
    description: 'Browse our premium vape brands',
}

export const revalidate = 60

export default async function BrandsPage(): Promise<React.ReactElement> {
    const brands = await getActiveBrands()

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    All Brands
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {brands.length} brands available
                </p>
            </div>

            {brands.length > 0 ? (
                <BrandGrid brands={brands} />
            ) : (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No brands yet. Check back soon!
                    </p>
                </div>
            )}
        </div>
    )
}
