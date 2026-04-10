'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/shared/ui/motion/variants'

import { CartButton } from '@/features/cart/ui/CartButton'
import { CartDrawer } from '@/features/cart/ui/CartDrawer'
import { MobileNav } from './MobileNav'
import type { CartItemData, PriceChange } from '@/features/cart/types'

interface HeaderUIProps {
    cartItemCount: number
    cartItems: CartItemData[]
    priceChanges: PriceChange[]
}

export function HeaderUI({ cartItemCount, cartItems, priceChanges }: HeaderUIProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 outline-none group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C7.58 2 4 5.58 4 10v8a4 4 0 004 4h8a4 4 0 004-4v-8c0-4.42-3.58-8-8-8zm0 2c3.31 0 6 2.69 6 6v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8c0-3.31 2.69-6 6-6z" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                        Puff puff pass
                    </span>
                </Link>

                {/* Navigation */}
                <motion.nav
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="hidden items-center gap-6 md:flex"
                >
                    <motion.div variants={fadeUp}>
                        <Link
                            href="/products"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md px-2 py-1"
                        >
                            Products
                        </Link>
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <Link
                            href="/brands"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md px-2 py-1"
                        >
                            Brands
                        </Link>
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <Link
                            href="/categories"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md px-2 py-1"
                        >
                            Categories
                        </Link>
                    </motion.div>
                    <div className="hidden md:block h-4 w-px bg-border/50 mx-1"></div>
                    <motion.div variants={fadeUp}>
                        <Link
                            href="/track-order"
                            className="text-sm font-semibold text-primary/80 transition-colors hover:text-primary outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md px-2 py-1 flex items-center gap-1"
                        >
                            Track Order
                        </Link>
                    </motion.div>
                </motion.nav>

                {/* Right section: Cart + Mobile menu */}
                <div className="flex items-center gap-2">
                    {/* Cart button */}
                    <CartButton itemCount={cartItemCount} />

                    {/* Mobile menu button */}
                    <MobileNav />
                </div>
            </div>

            {/* CartDrawer (renders Portal via Sheet) */}
            <CartDrawer items={cartItems} priceChanges={priceChanges} />
        </header >
    )
}
