/**
 * Brand Detail Page
 *
 * Displays a single brand with its products.
 */

import { notFound } from 'next/navigation'

import { getBrandBySlug, getProductsByBrand } from '@/features/products'
import { ProductGrid } from '@/widgets/product-grid'
import { Breadcrumb } from '@/shared/ui/breadcrumb'

import type { Metadata } from 'next'

interface BrandPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
    const { slug } = await params
    const brand = await getBrandBySlug(slug)
    if (!brand) return { title: 'Brand Not Found' }

    return {
        title: `${brand.name} — Dragon`,
        description: brand.description || `Shop ${brand.name} products at Dragon`,
    }
}

export const revalidate = 60

export default async function BrandPage({ params }: BrandPageProps): Promise<React.ReactElement> {
    const { slug } = await params
    const brand = await getBrandBySlug(slug)
    if (!brand) notFound()

    const products = await getProductsByBrand(slug, { page: 1, limit: 24 })

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            {/* Breadcrumb */}
            <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Brands', href: '/brands' },
                { label: brand.name },
            ]} />

            {/* Brand Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    {brand.name}
                </h1>
                {brand.description && (
                    <p className="mt-2 text-muted-foreground">
                        {brand.description}
                    </p>
                )}
            </div>

            {/* Products Grid */}
            <ProductGrid
                products={products.docs}
                emptyMessage={`No products from ${brand.name} yet.`}
            />
        </div>
    )
}
