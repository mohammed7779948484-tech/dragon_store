'use client'

/**
 * HeroSection Widget
 *
 * Welcome banner for the storefront home page.
 * Uses Framer Motion for luxurious staggering and fadeUp entrances.
 * Designed with a premium Glassmorphic VIP aesthetic.
 */

import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, scaleTap } from '@/shared/ui/motion/variants'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'

export function HeroSection(): React.ReactElement {
    return (
        <motion.section
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="relative mb-16 overflow-hidden rounded-[var(--radius-xl)] bg-card/30 backdrop-blur-2xl border border-border/50 shadow-2xl"
        >
            {/* VIP Luxury Ambient Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.15, scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-purple blur-[120px]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.05, scale: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
                    className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-foreground blur-[100px]"
                />
            </div>

            <div className="relative z-10 px-6 py-16 md:px-12 md:py-24 flex flex-col items-center md:items-start text-center md:text-left">
                <motion.div variants={fadeUp} className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse mr-2"></span>
                    Premium Selection
                </motion.div>

                <motion.h1
                    variants={fadeUp}
                    className="mb-6 max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-foreground"
                >
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Dragon</span>
                </motion.h1>

                <motion.p
                    variants={fadeUp}
                    className="mb-10 max-w-2xl text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed"
                >
                    Discover the ultimate luxury in vape products. Quality you can trust, curated for the true connoisseur.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
                    <motion.div variants={scaleTap} initial="rest" whileHover="hover" whileTap="tap">
                        <Button asChild size="lg" className="h-14 px-8 w-full sm:w-auto text-base font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/20%)] border border-primary/20 rounded-[var(--radius-lg)]">
                            <Link href="#products">EXPLORE COLLECTION</Link>
                        </Button>
                    </motion.div>
                    <motion.div variants={scaleTap} initial="rest" whileHover="hover" whileTap="tap">
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 w-full sm:w-auto text-base font-semibold border-border/60 hover:bg-muted/50 rounded-[var(--radius-lg)]">
                            <Link href="/categories">View Categories</Link>
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Minimalist Grid Pattern Overlay */}
            <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDEwaDQwdjFIMHptMTAgMHY0MEg5VjB6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPgo8L3N2Zz4=')] opacity-30 pointer-events-none"></div>
        </motion.section>
    )
}
