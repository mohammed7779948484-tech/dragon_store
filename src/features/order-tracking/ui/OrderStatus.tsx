/**
 * Order Status Component
 *
 * Displays full order details with status timeline, items list, and total.
 * Used on the track-order page after successful order lookup.
 *
 * @see spec.md: FR-032 (status timeline), US4 acceptance criteria
 * @see Constitution: Tailwind only, no inline styles
 */

import { Separator } from '@/shared/ui/separator'

import { STATUS_LABELS, STATUS_DESCRIPTIONS, CURRENCY_SYMBOL } from '../constants'
import type { TrackedOrder, TimelineStep } from '../types'
import { StatusTimeline } from './_components/StatusTimeline'

interface OrderStatusProps {
    order: TrackedOrder
}

/** Ordered statuses for the timeline (excluding cancelled — handled separately) */
const TIMELINE_STATUSES = ['pending', 'processing', 'completed'] as const

function buildTimelineSteps(order: TrackedOrder): TimelineStep[] {
    const isCancelled = order.status === 'cancelled'

    if (isCancelled) {
        // Show: pending → cancelled
        return [
            {
                status: 'pending',
                label: STATUS_LABELS.pending,
                description: STATUS_DESCRIPTIONS.pending,
                isActive: false,
                isCompleted: true,
                timestamp: order.createdAt,
            },
            {
                status: 'cancelled',
                label: STATUS_LABELS.cancelled,
                description: STATUS_DESCRIPTIONS.cancelled,
                isActive: true,
                isCompleted: false,
            },
        ]
    }

    // Build normal progression timeline
    const statusIndex = TIMELINE_STATUSES.indexOf(
        order.status as (typeof TIMELINE_STATUSES)[number]
    )

    return TIMELINE_STATUSES.map((status, index) => ({
        status,
        label: STATUS_LABELS[status],
        description: STATUS_DESCRIPTIONS[status],
        isActive: index === statusIndex,
        isCompleted: index < statusIndex,
        ...(index === 0 ? { timestamp: order.createdAt } : {}),
    }))
}

export function OrderStatus({ order }: OrderStatusProps): React.ReactElement {
    const steps = buildTimelineSteps(order)

    return (
        <div className="space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Order {order.orderNumber}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                        {CURRENCY_SYMBOL}{order.totalAmount.toFixed(2)}
                    </p>
                </div>
            </div>

            <Separator />

            {/* Status Timeline */}
            <div>
                <h3 className="mb-4 text-lg font-semibold">Order Status</h3>
                <StatusTimeline steps={steps} />
            </div>

            <Separator />

            {/* Order Items */}
            <div>
                <h3 className="mb-3 text-lg font-semibold">Items Ordered</h3>
                <div className="space-y-3">
                    {order.items.map((item) => (
                        <div
                            key={`${item.productName}-${item.variantName}`}
                            className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
                        >
                            <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.variantName} × {item.quantity}
                                </p>
                            </div>
                            <p className="font-medium">
                                {CURRENCY_SYMBOL}{(item.unitPrice * item.quantity).toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                    {CURRENCY_SYMBOL}{order.totalAmount.toFixed(2)}
                </span>
            </div>
        </div>
    )
}
