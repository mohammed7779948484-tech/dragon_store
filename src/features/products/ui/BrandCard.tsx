/**
 * BrandCard Component
 *
 * Displays a brand card in the storefront grid.
 * Features luxurious glowHover interaction.
 */
'use client'

import Link from 'next/link'
import { CloudinaryImage } from '@/shared/ui/CloudinaryImage'
import { motion } from 'framer-motion'
import { glowHover, fadeUp } from '@/shared/ui/motion/variants'

import { PLACEHOLDER_IMAGE } from '../constants'

import type { BrandCardProps } from '../types'

const MotionLink = motion.create(Link)

export function BrandCard({ brand }: BrandCardProps): React.ReactElement {
    const { name, slug, logoUrl } = brand

    return (
        <motion.div variants={fadeUp}>
            <MotionLink
                href={`/brands/${slug}`}
                variants={glowHover}
                initial="rest"
                whileHover="hover"
                className="group flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-sm hover:border-primary/50 transition-all outline-none w-full h-full"
            >
                <div className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)] bg-muted">
                    <CloudinaryImage
                        src={logoUrl || PLACEHOLDER_IMAGE}
                        publicId={brand.cloudinaryPublicId}
                        alt={name}
                        fill
                        sizes="80px"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
                <h3 className="text-center text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {name}
                </h3>
            </MotionLink>
        </motion.div>
    )
}
