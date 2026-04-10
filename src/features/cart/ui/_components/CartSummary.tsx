/**
 * CartSummary Component
 *
 * Shows cart totals, item count, and checkout button.
 * Data passed as props from server (NOT from Zustand).
 *
 * @see Constitution: Tailwind CSS only, no inline styles
 * @see spec.md: Cart summary with real-time totals
 */

'use client'

import Link from 'next/link'
import { Separator } from '@/shared/ui/separator'
import { useCart } from '../../logic/cart.store'

/** Props for CartSummary */
interface CartSummaryProps {
    itemCount: number
    subtotal: number
    hasInactiveItems: boolean
}

/**
 * Cart summary section with price totals and checkout CTA.
 *
 * Checkout button is disabled when cart has inactive items (FR-015).
 */
export function CartSummary({
    itemCount,
    subtotal,
    hasInactiveItems,
}: CartSummaryProps): React.ReactElement {
    const { closeDrawer } = useCart()

    return (
        <div className="space-y-3 pt-2">
            <Separator />

            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Items ({itemCount})</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
            </div>

            {hasInactiveItems && (
                <p className="text-xs text-destructive">
                    Remove unavailable items before proceeding to checkout.
                </p>
            )}

            <Link
                href="/checkout"
                className={
                    hasInactiveItems
                        ? 'block w-full rounded-lg bg-muted py-3 text-center text-sm font-medium text-muted-foreground'
                        : 'block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
                }
                aria-disabled={hasInactiveItems}
                tabIndex={hasInactiveItems ? -1 : undefined}
                onClick={(e) => {
                    if (hasInactiveItems) {
                        e.preventDefault()
                    } else {
                        closeDrawer()
                    }
                }}
            >
                Proceed to Checkout
            </Link>

            <Link
                href="/cart"
                onClick={closeDrawer}
                className="block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                View Full Cart
            </Link>
        </div>
    )
}
