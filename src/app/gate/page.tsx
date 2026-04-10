/**
 * Gate Page — Password Entry
 *
 * Server Component that renders the password gate.
 * If user already has a valid session, redirects to home.
 *
 * Security: Session verified via DAL verifySession() (NOT middleware).
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { verifySession } from '@/core/auth/session'
import { GateScreen } from '@/features/gate'

export const metadata: Metadata = {
    title: 'Enter Password | Puff puff pass',
    robots: { index: false, follow: false },
}

export default async function GatePage(): Promise<React.ReactElement> {
    // If already authenticated, redirect to home
    const session = await verifySession()
    if (session) {
        redirect('/')
    }

    return <GateScreen />
}
