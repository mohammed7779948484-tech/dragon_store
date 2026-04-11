'use client'

/**
 * GateScreen Component
 * 
 * Client Component acting as the entry gate for the store.
 * Incorporates Framer Motion staggering and matches the site's subtle luxury aesthetics.
 */

import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/shared/ui/motion/variants'
import { GateForm } from './GateForm'

export function GateScreen(): React.ReactElement {
    return (
        <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 overflow-hidden">
            {/* Subtle luxurious ambient glow behind the form, matching HeroSection */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.05, scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="h-[500px] w-[500px] rounded-full bg-primary blur-[120px]"
                />
            </div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="relative z-10 w-full max-w-md space-y-8"
            >
                {/* Brand Identity / Welcome */}
                <motion.div variants={fadeUp} className="text-center space-y-4">
                    <div className="mx-auto flex justify-center">
                        <img src="/logo.png" alt="Dragon Logo" className="h-28 w-auto object-contain drop-shadow-lg" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Dragon
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Please enter the password to access the store.
                        </p>
                    </div>
                </motion.div>

                {/* Gate Form Card */}
                <motion.div
                    variants={fadeUp}
                    className="rounded-[var(--radius-xl)] bg-card border border-border p-6 sm:p-8 shadow-sm"
                >
                    <GateForm />
                </motion.div>

                {/* Footer Security Note */}
                <motion.div variants={fadeUp} className="text-center">
                    <p className="text-xs text-muted-foreground/70">
                        This is a private storefront.
                    </p>
                </motion.div>
            </motion.div>
        </main>
    )
}
