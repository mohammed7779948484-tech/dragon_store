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
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] shadow-sm transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                        <img src="/logo.png" alt="Dragon Logo" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                        Dragon
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
