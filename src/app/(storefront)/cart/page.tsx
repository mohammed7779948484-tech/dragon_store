/**
 * Cart Page
 *
 * Full-page cart view. Server Component — verifies session (DAL).
 * Imports ONLY from public feature APIs (barrel files), NOT private _components.
 *
 * @see Constitution Line 370: app/ can import from widgets/, features/, shared/
 * @see Constitution Line 216-234: Private _components/ are NOT importable from outside
 * @see Constitution: DAL — verifySession at data access points
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { verifySession } from '@/core/auth/session'
import {
    getCartBySession,
    getCartItems,
    detectPriceChanges,
    CartPageContent,
} from '@/features/cart'

export const metadata: Metadata = {
    title: 'Shopping Cart — Dragon',
    description: 'Review items in your shopping cart',
}

export default async function CartPage(): Promise<React.ReactElement> {
    // Security: Verify session via DAL (NOT middleware)
    const session = await verifySession()
    if (!session) {
        redirect('/gate')
    }

    // Fetch cart data server-side
    const cart = await getCartBySession(session.sessionId)
    const items = cart ? await getCartItems(cart.id) : []
    const priceChanges = detectPriceChanges(items)

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold text-foreground">
                Shopping Cart
            </h1>
            <CartPageContent items={items} priceChanges={priceChanges} />
        </div>
    )
}
