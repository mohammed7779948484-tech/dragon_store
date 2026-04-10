import type { Metadata } from 'next'

import { TrackOrderForm } from '@/features/order-tracking'

export const metadata: Metadata = {
    title: 'Track Order — Puff puff pass',
    description: 'Track your order status by order number or phone number',
}

/**
 * Track Order Page
 *
 * Public page — no session verification required.
 * Renders the TrackOrderForm client component for searching orders.
 *
 * @see spec.md: FR-031 (track order page)
 * @see Constitution: Default to Server Components
 */
export default function TrackOrderPage(): React.ReactElement {
    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Track Your Order</h1>
            <p className="mb-8 text-muted-foreground">
                Search by order number or phone number to check your order status.
            </p>

            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                <TrackOrderForm />
            </div>
        </div>
    )
}
