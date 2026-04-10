/**
 * CategoryCard Component
 *
 * Displays a category card in the storefront grid.
 * Features luxurious glowHover interaction.
 */
'use client'

import Link from 'next/link'
import { CloudinaryImage } from '@/shared/ui/CloudinaryImage'
import { motion } from 'framer-motion'
import { glowHover, fadeUp } from '@/shared/ui/motion/variants'

import { PLACEHOLDER_IMAGE } from '../constants'

import type { CategoryCardProps } from '../types'

const MotionLink = motion.create(Link)

export function CategoryCard({ category }: CategoryCardProps): React.ReactElement {
    const { name, slug, imageUrl } = category

    return (
        <motion.div variants={fadeUp}>
            <MotionLink
                href={`/categories/${slug}`}
                variants={glowHover}
                initial="rest"
                whileHover="hover"
                className="group relative block overflow-hidden rounded-[var(--radius-xl)] border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:border-primary/50 transition-all outline-none w-full h-full"
            >
                <div className="relative aspect-[4/3] bg-muted">
                    <CloudinaryImage
                        src={imageUrl || PLACEHOLDER_IMAGE}
                        publicId={category.cloudinaryPublicId}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-foreground drop-shadow-lg transition-colors group-hover:text-primary">
                        {name}
                    </h3>
                </div>
            </MotionLink>
        </motion.div>
    )
}
