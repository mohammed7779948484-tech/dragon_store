/**
 * Checkout Page
 *
 * Server Component — verifies session (DAL), fetches cart data, renders CheckoutForm.
 * Redirects to /gate if no session, redirects to /cart if cart is empty.
 *
 * @see Constitution Line 370: app/ can import from widgets/, features/, shared/
 * @see Constitution: DAL — verifySession at data access points
 * @see spec.md: US3 (Complete Checkout)
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { verifySession } from '@/core/auth/session'
import { getCartBySession, getCartItems } from '@/features/cart'
import { CheckoutForm } from '@/features/checkout/ui/CheckoutForm'
import type { CheckoutCartItem } from '@/features/checkout'

export const metadata: Metadata = {
    title: 'Checkout — Dragon',
    description: 'Complete your order with cash on delivery',
}

export default async function CheckoutPage(): Promise<React.ReactElement> {
    // Security: Verify session via DAL (NOT middleware)
    const session = await verifySession()
    if (!session) {
        redirect('/gate')
    }

    // Fetch cart data server-side
    const cart = await getCartBySession(session.sessionId)
    const cartItems = cart ? await getCartItems(cart.id) : []

    // Redirect to cart if empty
    if (cartItems.length === 0) {
        redirect('/cart')
    }

    // Map CartItemData → CheckoutCartItem for the checkout feature
    const checkoutItems: CheckoutCartItem[] = cartItems.map((item) => ({
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.currentPrice,
        totalPrice: Math.round(item.currentPrice * item.quantity * 100) / 100,
        isActive: item.isActive,
    }))

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6">
                <Link
                    href="/cart"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                    </svg>
                    Back to Cart
                </Link>
            </div>

            <h1 className="mb-8 text-2xl font-bold text-foreground">
                Checkout
            </h1>

            <CheckoutForm items={checkoutItems} />
        </div>
    )
}
