/**
 * BrandGrid Component
 *
 * Displays brands in a responsive grid.
 * Infused with Framer Motion for luxurious staggered load.
 */
'use client'

import { motion } from 'framer-motion'
import { staggerContainer } from '@/shared/ui/motion/variants'
import { BrandCard } from './BrandCard'

import type { BrandGridProps } from '../types'

export function BrandGrid({ brands }: BrandGridProps): React.ReactElement {
    if (brands.length === 0) {
        return (
            <p className="py-8 text-center text-muted-foreground">
                No brands available yet.
            </p>
        )
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
            {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
            ))}
        </motion.div>
    )
}
