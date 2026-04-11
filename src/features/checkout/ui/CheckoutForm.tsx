/**
 * CheckoutForm Component
 *
 * Main checkout form composing CustomerFields, OrderSummary, and CodDisclaimer.
 * Handles form submission via processCheckoutAction server action.
 * Uses useTransition for non-blocking UI during form submission.
 *
 * @see spec.md: FR-029 (CheckoutForm with customer fields, order summary, COD disclaimer)
 * @see constitution: 'use client' only when required (state, effects)
 * @see constitution: Tailwind CSS only, no inline styles
 */

'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/shared/ui/button'

import { processCheckoutAction } from '../actions/process-checkout.action'
import { CustomerFields } from './_components/CustomerFields'
import { OrderSummary } from './_components/OrderSummary'
import { CodDisclaimer } from './_components/CodDisclaimer'
import type { CheckoutCartItem } from '../types'

interface CheckoutFormProps {
    items: CheckoutCartItem[]
}

export function CheckoutForm({ items }: CheckoutFormProps): React.ReactElement {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [globalError, setGlobalError] = useState<string | null>(null)

    const hasInactiveItems = items.some((item) => !item.isActive)
    const isCartEmpty = items.length === 0

    async function handleSubmit(formData: FormData): Promise<void> {
        setErrors({})
        setGlobalError(null)

        const input = {
            customerName: formData.get('customerName') as string,
            customerPhone: formData.get('customerPhone') as string,
            notes: (formData.get('notes') as string) || undefined,
            honeypotField: (formData.get('honeypotField') as string) || undefined,
        }

        startTransition(async () => {
            const result = await processCheckoutAction(input)

            if (result.success && result.data) {
                // Redirect to order confirmation page
                router.push(`/order-confirmation/${result.data.orderId}`)
            } else if (!result.success) {
                if (result.code === 'VALIDATION_ERROR') {
                    // Try to map to specific field errors
                    setGlobalError(result.error ?? 'Validation failed')
                } else {
                    setGlobalError(result.error ?? 'An unexpected error occurred')
                }
            }
        })
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            {globalError && (
                <div className="rounded-[var(--radius-md)] border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{globalError}</p>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column: Customer Information */}
                <div className="space-y-6">
                    <CustomerFields errors={errors} disabled={isPending} />
                    <CodDisclaimer />
                </div>

                {/* Right Column: Order Summary */}
                <div className="space-y-6">
                    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
                        <OrderSummary items={items} />

                        <div className="mt-6">
                            <Button
                                type="submit"
                                disabled={isPending || hasInactiveItems || isCartEmpty}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                                size="lg"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4 animate-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Processing Order...
                                    </span>
                                ) : (
                                    'Place Order — Pay on Pickup'
                                )}
                            </Button>

                            {hasInactiveItems && (
                                <p className="mt-2 text-center text-xs text-destructive">
                                    Remove unavailable items to proceed
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
