/**
 * Storefront Home Page
 *
 * Displays featured brands, categories, and products.
 * Page composes features and widgets only — no inline UI.
 * @see Constitution: Pages are pure composers
 */

import { getActiveProducts, getActiveBrands, getActiveCategories, BrandGrid, CategoryGrid } from '@/features/products'
import { HeroSection } from '@/widgets/hero'
import { ProductGrid } from '@/widgets/product-grid'
import { TrackOrderSection } from '@/widgets/track-order-section'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export default async function HomePage(): Promise<React.ReactElement> {
    const [products, brands, categories] = await Promise.all([
        getActiveProducts({ page: 1, limit: 8 }),
        getActiveBrands(),
        getActiveCategories(),
    ])

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
            {/* Hero */}
            <HeroSection />

            {/* Brands Section */}
            {brands.length > 0 && (
                <section className="mb-20">
                    <div className="mb-8 flex flex-col items-center justify-center text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Curated Brands
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-lg">
                            Explore our selection from the world's most distinguished vape manufacturers.
                        </p>
                    </div>
                    <BrandGrid brands={brands} />
                </section>
            )}

            {/* Categories Section */}
            {categories.length > 0 && (
                <section className="mb-20">
                    <div className="mb-8 flex flex-col items-center justify-center text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Shop by Category
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-lg">
                            Find exactly what you're looking for, from premium hardware to exquisite juices.
                        </p>
                    </div>
                    <CategoryGrid categories={categories} />
                </section>
            )}

            {/* Products Section */}
            <section className="mb-20">
                <div className="mb-8 flex flex-col items-center justify-center text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Latest Arrivals
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-lg">
                        The newest additions to our carefully curated collection.
                    </p>
                </div>
                <ProductGrid products={products.docs} emptyMessage="No products yet. Check back soon!" />
            </section>

            {/* Track Order Section */}
            <TrackOrderSection />
        </div>
    )
}
