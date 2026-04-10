/**
 * Footer Widget
 *
 * Site footer with links and copyright.
 * Implements FSD tokens and luxurious slow staggering.
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/shared/ui/motion/variants'

export function Footer(): React.ReactElement {
    const currentYear = new Date().getFullYear()

    return (
        <motion.footer
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="border-t border-border bg-muted/20"
        >
            <div className="mx-auto max-w-7xl px-4 py-12">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <motion.div variants={fadeUp}>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] overflow-hidden">
                                <img src="/logo.png" alt="Dragon Logo" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-base font-bold text-foreground">
                                Dragon
                            </span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm text-foreground/60 leading-relaxed font-medium">
                            Premium vape products.
                        </p>
                    </motion.div>

                    {/* Shop */}
                    <motion.div variants={fadeUp}>
                        <h3 className="mb-3 text-sm font-semibold text-foreground">
                            Shop
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    All Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/brands" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    Brands
                                </Link>
                            </li>
                            <li>
                                <Link href="/categories" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    Categories
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Support */}
                    <motion.div variants={fadeUp}>
                        <h3 className="mb-3 text-sm font-semibold text-foreground">
                            Support
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/track-order" className="text-sm font-medium text-primary/80 transition-colors hover:text-primary">
                                    Track Order
                                </Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                                Pay on Pickup
                            </li>
                            <li>
                                <span className="text-sm text-muted-foreground">
                                    Contact via WhatsApp
                                </span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Legal */}
                    <motion.div variants={fadeUp}>
                        <h3 className="mb-3 text-sm font-semibold text-foreground">
                            Legal
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Age-restricted products. Must be 21+ to purchase.
                        </p>
                    </motion.div>
                </div>

                {/* Bottom bar */}
                <motion.div variants={fadeUp} className="mt-10 border-t border-border pt-6">
                    <p className="text-center text-xs text-muted-foreground">
                        © {currentYear} Dragon. All rights reserved.
                    </p>
                </motion.div>
            </div>
        </motion.footer>
    )
}
