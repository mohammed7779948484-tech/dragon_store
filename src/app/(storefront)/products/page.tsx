/**
 * Products Listing Page
 *
 * All products with pagination.
 */

import Link from 'next/link'
import { getActiveProducts } from '@/features/products'
import { ProductGrid } from '@/widgets/product-grid'

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'All Products — Puff puff pass',
    description: 'Browse our full catalog of premium vape products',
}

export const revalidate = 60

interface ProductsPageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps): Promise<React.ReactElement> {
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams?.page) || 1

    const products = await getActiveProducts({ page, limit: 12 })

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    All Products
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {products.totalDocs} products available
                </p>
            </div>

            <ProductGrid products={products.docs} />

            {/* Pagination */}
            {products.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    {products.hasPrevPage && (
                        <Link
                            href={`/products?page=${page - 1}`}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Previous
                        </Link>
                    )}
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                        Page {products.page} of {products.totalPages}
                    </span>
                    {products.hasNextPage && (
                        <Link
                            href={`/products?page=${page + 1}`}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Next
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
