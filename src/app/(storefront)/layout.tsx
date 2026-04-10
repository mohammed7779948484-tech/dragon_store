/**
 * Storefront Layout
 *
 * Main layout for the public storefront.
 * Includes Header, Footer, WhatsApp button.
 * Verifies session via DAL (NOT middleware).
 */

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { redirect } from 'next/navigation'

import '../globals.css'
import { Providers } from '../providers'
import { Header } from '@/widgets/header'
import { Footer } from '@/widgets/footer'
import { WhatsAppButton } from '@/widgets/whatsapp-button'
import { verifySession } from '@/core/auth/session'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Dragon — Premium Vape Products',
  description: 'Private e-commerce platform for premium vape products',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): Promise<React.ReactElement> {
  // Security: Verify session via DAL
  const session = await verifySession()
  if (!session) {
    redirect('/gate')
  }

  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased text-base">
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Footer />
          <WhatsAppButton phoneNumber={process.env.WHATSAPP_NUMBER || '+15550199999'} />
        </Providers>
      </body>
    </html>
  )
}
