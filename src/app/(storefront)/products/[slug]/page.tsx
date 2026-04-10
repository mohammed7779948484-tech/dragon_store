/**
 * Product Detail Page
 *
 * Full product view with variants, image gallery, and breadcrumb navigation.
 * @see Constitution: Pages are pure composers — import from features/ and shared/
 */

import { notFound } from 'next/navigation'

import { getProductBySlug, ProductDetail } from '@/features/products'
import { AddToCartButton } from '@/features/cart'
import { Breadcrumb } from '@/shared/ui/breadcrumb'

import type { Metadata } from 'next'

interface ProductPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { slug } = await params
    const product = await getProductBySlug(slug)
    if (!product) return { title: 'Product Not Found' }

    return {
        title: `${product.name} — Dragon`,
        description: `${product.brandName ? `${product.brandName} — ` : ''}${product.name}. From $${product.minPrice.toFixed(2)}`,
    }
}

export const revalidate = 60

export default async function ProductPage({ params }: ProductPageProps): Promise<React.ReactElement> {
    const { slug } = await params
    const product = await getProductBySlug(slug)
    if (!product) notFound()

    // Build breadcrumb: Home > Category (first) > Brand > Product
    const firstCategory = product.categories[0] ?? null
    const crumbs: Array<{ label: string; href?: string | undefined }> = [
        { label: 'Home', href: '/' },
    ]

    // Add first category if available
    if (firstCategory) {
        crumbs.push({
            label: firstCategory.name,
            href: `/categories/${firstCategory.slug}`,
        })
    }

    // Add brand if available
    if (product.brandName && product.brandSlug) {
        crumbs.push({
            label: product.brandName,
            href: `/brands/${product.brandSlug}`,
        })
    }

    // Current product (no href = non-link)
    crumbs.push({ label: product.name })

    return (
        <div className="mx-auto max-w-6xl px-4 pt-4">
            <Breadcrumb items={crumbs} />
            <ProductDetail product={product} ActionComponent={AddToCartButton} />
        </div>
    )
}
