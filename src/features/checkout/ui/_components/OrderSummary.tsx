/**
 * OrderSummary Component
 *
 * Private component displaying cart items summary in checkout.
 * Shows product names, quantities, prices, and total.
 * Uses live prices from server (not stored prices).
 *
 * @see spec.md: FR-029 (CheckoutForm with order summary)
 * @see constitution: Tailwind CSS only, no inline styles
 * @see constitution: Private components in ui/_components/
 */

import { Separator } from '@/shared/ui/separator'
import { CURRENCY_SYMBOL } from './constants'
import type { CheckoutCartItem } from '../../types'

interface OrderSummaryProps {
    items: CheckoutCartItem[]
}

export function OrderSummary({ items }: OrderSummaryProps): React.ReactElement {
    const subtotal = items
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + item.totalPrice, 0)

    const hasInactiveItems = items.some((item) => !item.isActive)

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
                Order Summary
            </h2>

            {hasInactiveItems && (
                <div className="rounded-[var(--radius-md)] border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">
                        Some items in your cart are no longer available. Please return to your cart and remove unavailable items before checkout.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.variantId}
                        className={`flex items-start justify-between gap-4 ${!item.isActive ? 'opacity-50 line-through' : ''}`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {item.productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {item.variantName} × {item.quantity}
                            </p>
                        </div>
                        <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {CURRENCY_SYMBOL}{item.totalPrice.toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">
                    {CURRENCY_SYMBOL}{subtotal.toFixed(2)}
                </p>
            </div>
        </div>
    )
}
