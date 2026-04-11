/**
 * Gate Layout
 *
 * Minimal layout for the password entry page.
 * Does not include storefront Header or Footer.
 */

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import '../globals.css'
import { Providers } from '../providers'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
})

export const metadata: Metadata = {
    title: 'Enter Password | Dragon',
    description: 'Private e-commerce platform for premium vape products',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export default function GateLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>): React.ReactElement {
    return (
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen bg-background font-sans text-foreground">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
