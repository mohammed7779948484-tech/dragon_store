/**
 * ProductGrid Widget
 *
 * Reusable product grid that composes ProductCard from features/products.
 * Orchestrates staggered entrance animations for product items.
 *
 * @see Constitution: widgets/ combine features into reusable UI blocks
 */
'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/shared/ui/motion/variants'
import { ProductCard } from '@/features/products/ui/ProductCard'

import type { ProductCardData } from '@/modules/catalog/types'

interface ProductGridProps {
    products: ProductCardData[]
    emptyMessage?: string
}

export function ProductGrid({
    products,
    emptyMessage = 'No products found.',
}: ProductGridProps): React.ReactElement {
    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
            >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                    {emptyMessage}
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
            {products.map((product) => (
                <motion.div key={product.id} variants={fadeUp}>
                    <ProductCard product={product} />
                </motion.div>
            ))}
        </motion.div>
    )
}
