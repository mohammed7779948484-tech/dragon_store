/**
 * EmptyCart Component
 *
 * Shown when the cart has no items.
 * Provides visual feedback and CTA to browse products.
 *
 * @see Constitution: Tailwind CSS only, semantic HTML, a11y
 */

import Link from 'next/link'
import { useCart } from '../../logic/cart.store'

/**
 * Empty state for cart drawer and cart page.
 * Shows shopping icon and link to products page.
 */
export function EmptyCart(): React.ReactElement {
    const { closeDrawer } = useCart()

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {/* Shopping bag icon */}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg
                    className="h-8 w-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                </svg>
            </div>

            <h3 className="mb-1 text-lg font-semibold text-foreground">
                Your cart is empty
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
                Browse our products and find something you like.
            </p>

            <Link
                href="/products"
                onClick={closeDrawer}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
                Browse Products
            </Link>
        </div>
    )
}
