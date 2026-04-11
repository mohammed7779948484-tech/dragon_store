/**
 * OrderConfirmation Component
 *
 * Displays order success details after checkout.
 * Shows order number prominently with screenshot prompt.
 *
 * @see spec.md: FR-030 (order confirmation with order number and screenshot prompt)
 * @see constitution: Tailwind CSS only, no inline styles
 * @see constitution: Server Components default — this is a presentational component
 */

import { Separator } from '@/shared/ui/separator'
import { CURRENCY_SYMBOL } from './_components/constants'
import type { OrderConfirmationData } from '../types'

interface OrderConfirmationProps {
    order: OrderConfirmationData
}

export function OrderConfirmation({ order }: OrderConfirmationProps): React.ReactElement {
    return (
        <div className="mx-auto max-w-lg space-y-8 text-center">
            {/* Success Icon */}
            <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                    <svg
                        className="h-10 w-10 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                    Order Confirmed!
                </h1>
                <p className="text-muted-foreground">
                    Thank you, {order.customerName}. Your order has been placed successfully.
                </p>
            </div>

            {/* Order Number Card */}
            <div className="rounded-[var(--radius-lg)] border border-brand-gold/20 bg-brand-gold/5 p-6">
                <p className="text-sm text-muted-foreground">Your Order Number</p>
                <p className="mt-2 text-3xl font-bold tracking-wider text-brand-gold">
                    {order.orderNumber}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                    📸 Please take a screenshot of this order number for your records
                </p>
            </div>

            {/* Order Details */}
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6 text-left">
                <h2 className="text-lg font-semibold text-foreground">Order Details</h2>

                <Separator className="my-4" />

                <div className="space-y-3">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex items-start justify-between gap-4">
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

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">
                        {CURRENCY_SYMBOL}{order.totalAmount.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Status */}
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 text-left">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-brand-gold animate-pulse" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            Status: Pending
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Our team will review your order shortly
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Notice */}
            <div className="rounded-[var(--radius-lg)] border border-brand-gold/20 bg-brand-gold/5 p-4 text-left">
                <p className="text-sm text-brand-gold font-medium">
                    💵 Cash on Delivery
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Payment will be collected upon delivery. Please have {CURRENCY_SYMBOL}{order.totalAmount.toFixed(2)} ready.
                </p>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                    href="/track-order"
                    className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    Track Your Order
                </a>
                <a
                    href="/"
                    className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Continue Shopping
                </a>
            </div>
        </div>
    )
}
