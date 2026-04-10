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
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Puff puff pass
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
