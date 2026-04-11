/**
 * Track Order Form Component
 *
 * Dual-mode form: search by order number OR phone number.
 * Client component for managing form state, tab switching, and displaying results.
 *
 * @see spec.md: FR-031 (track order page with order number OR phone lookup)
 * @see spec.md: US4 acceptance criteria
 * @see Constitution: 'use client' only when required (state, effects)
 */

'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/utils'

import { STATUS_LABELS, CURRENCY_SYMBOL } from '../constants'
import type { TrackedOrder, OrderListItem } from '../types'
import { trackOrderAction } from '../actions/track-order.action'
import { lookupOrdersAction } from '../actions/lookup-orders.action'
import { OrderStatus } from './OrderStatus'

type SearchMode = 'order-number' | 'phone'

export function TrackOrderForm(): React.ReactElement {
    const [mode, setMode] = useState<SearchMode>('order-number')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Results state
    const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null)
    const [orderList, setOrderList] = useState<OrderListItem[] | null>(null)

    function handleModeSwitch(newMode: SearchMode): void {
        setMode(newMode)
        setError(null)
        setTrackedOrder(null)
        setOrderList(null)
    }

    function handleSubmit(formData: FormData): void {
        setError(null)
        setTrackedOrder(null)
        setOrderList(null)

        startTransition(async () => {
            if (mode === 'order-number') {
                const orderNumber = (formData.get('orderNumber') as string)?.trim()
                const result = await trackOrderAction({ orderNumber })

                if (result.success && result.data) {
                    setTrackedOrder(result.data.order)
                } else if (!result.success) {
                    setError(result.error ?? 'Order not found')
                }
            } else {
                const phone = (formData.get('phone') as string)?.trim()
                const result = await lookupOrdersAction({ phone })

                if (result.success && result.data) {
                    setOrderList(result.data.orders)
                } else if (!result.success) {
                    setError(result.error ?? 'Lookup failed')
                }
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="flex gap-2 rounded-lg bg-muted p-1">
                <button
                    type="button"
                    onClick={() => handleModeSwitch('order-number')}
                    className={cn(
                        'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                        mode === 'order-number'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    Order Number
                </button>
                <button
                    type="button"
                    onClick={() => handleModeSwitch('phone')}
                    className={cn(
                        'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                        mode === 'phone'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    Phone Number
                </button>
            </div>

            {/* Search Form */}
            <form action={handleSubmit} className="space-y-4">
                {mode === 'order-number' ? (
                    <div className="space-y-2">
                        <Label htmlFor="orderNumber">Order Number</Label>
                        <Input
                            id="orderNumber"
                            name="orderNumber"
                            type="text"
                            placeholder="VX-XXXXXX"
                            required
                            disabled={isPending}
                            autoComplete="off"
                            className="uppercase tracking-wider"
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter your order number (e.g., VX-7K3M2P)
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+15551234567"
                            required
                            disabled={isPending}
                            autoComplete="tel"
                        />
                        <p className="text-xs text-muted-foreground">
                            US format: +1 followed by 10 digits
                        </p>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full"
                >
                    {isPending ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Searching...
                        </span>
                    ) : (
                        'Search'
                    )}
                </Button>
            </form>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Results */}
            {trackedOrder && (
                <>
                    <Separator />
                    <OrderStatus order={trackedOrder} />
                </>
            )}

            {orderList !== null && (
                <>
                    <Separator />
                    {orderList.length === 0 ? (
                        <div className="rounded-lg border border-border/50 p-8 text-center">
                            <p className="text-muted-foreground">
                                No orders found for this phone number.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                                Found {orderList.length} order{orderList.length > 1 ? 's' : ''}
                            </h3>
                            {orderList.map((order) => (
                                <div
                                    key={order.orderNumber}
                                    className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 transition-colors hover:bg-muted/50"
                                >
                                    <div>
                                        <p className="font-mono font-semibold tracking-wider">
                                            {order.orderNumber}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">
                                            {CURRENCY_SYMBOL}{order.totalAmount.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {STATUS_LABELS[order.status]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
