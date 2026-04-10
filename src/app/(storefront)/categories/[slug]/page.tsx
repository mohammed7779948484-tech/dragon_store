/**
 * Category Detail Page
 *
 * Shows a category with its brands and products.
 * Flow: Category → Brand cards → Products filtered by selected brand.
 * Brand filter uses query param: /categories/[slug]?brand=brand-slug
 * @see Constitution: Pages are pure composers — UI in features/
 */

import { notFound } from 'next/navigation'

import { getCategoryBySlug, getActiveProducts, getBrandsByCategory, CategoryGrid, CategoryBrandFilter } from '@/features/products'
import { ProductGrid } from '@/widgets/product-grid'
import { Breadcrumb } from '@/shared/ui/breadcrumb'

import type { Metadata } from 'next'

interface CategoryPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ brand?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params
    const category = await getCategoryBySlug(slug)
    if (!category) return { title: 'Category Not Found' }

    return {
        title: `${category.name} — Dragon`,
        description: `Browse ${category.name} products at Dragon`,
    }
}

export const revalidate = 60

export default async function CategoryPage({ params, searchParams }: CategoryPageProps): Promise<React.ReactElement> {
    const { slug } = await params
    const { brand: selectedBrandSlug } = await searchParams
    const category = await getCategoryBySlug(slug)
    if (!category) notFound()

    // Fetch brands that have products in this category
    const brands = await getBrandsByCategory(slug)

    // Fetch products — filtered by brand if selected
    const products = selectedBrandSlug
        ? await getActiveProducts({ page: 1, limit: 24, categorySlug: slug, brandSlug: selectedBrandSlug })
        : null

    const selectedBrand = brands.find((b) => b.slug === selectedBrandSlug)

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            {/* Breadcrumb */}
            <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Categories', href: '/categories' },
                { label: category.name },
            ]} />

            {/* Category Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    {category.name}
                </h1>
                {selectedBrand && (
                    <p className="mt-1 text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{selectedBrand.name}</span> products
                    </p>
                )}
            </div>

            {/* Subcategories */}
            {category.children && category.children.length > 0 && !selectedBrandSlug && (
                <section className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">
                        Subcategories
                    </h2>
                    <CategoryGrid categories={category.children} />
                </section>
            )}

            {/* Brand Filter */}
            <CategoryBrandFilter
                categorySlug={slug}
                brands={brands}
                selectedBrandSlug={selectedBrandSlug}
            />

            {/* Products Grid (only shown when a brand is selected) */}
            {selectedBrandSlug && products && (
                <section>
                    <h2 className="mb-4 text-xl font-semibold">
                        {selectedBrand?.name} — {category.name}
                    </h2>
                    <ProductGrid
                        products={products.docs}
                        emptyMessage={`No ${selectedBrand?.name || ''} products in ${category.name} yet.`}
                    />
                </section>
            )}

            {/* Prompt to select brand */}
            {!selectedBrandSlug && brands.length > 0 && (!category.children || category.children.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">
                        Select a brand above to view products
                    </p>
                </div>
            )}

            {/* No brands at all */}
            {brands.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <p className="text-sm text-muted-foreground">
                        No products in {category.name} yet.
                    </p>
                </div>
            )}
        </div>
    )
}
