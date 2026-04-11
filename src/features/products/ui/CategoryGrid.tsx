/**
 * CategoryGrid Component
 *
 * Displays categories in a responsive grid.
 * Infused with Framer Motion for luxurious staggered load.
 */
'use client'

import { motion } from 'framer-motion'
import { staggerContainer } from '@/shared/ui/motion/variants'
import { CategoryCard } from './CategoryCard'

import type { CategoryGridProps } from '../types'

export function CategoryGrid({ categories }: CategoryGridProps): React.ReactElement {
    if (categories.length === 0) {
        return (
            <p className="py-8 text-center text-muted-foreground">
                No categories available yet.
            </p>
        )
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
            ))}
        </motion.div>
    )
}
