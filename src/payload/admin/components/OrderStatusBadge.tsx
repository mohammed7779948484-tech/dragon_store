/**
 * OrderStatusBadge — Payload Admin Custom Component
 *
 * Color-coded badge for order status display in admin list views.
 * Designed for future Orders collection `defaultColumns`.
 *
 * Status colors:
 * - pending: amber/yellow
 * - processing: blue
 * - completed: green
 * - cancelled: red
 *
 * @see Constitution: Order status transitions (pending → processing → completed/cancelled)
 * @see Constitution: Payload admin components CAN import from features/ and shared/
 * @see Constitution: NO inline styles — Tailwind CSS only
 */
'use client'

import React from 'react'

/** Order status type per constitution — 4 states only */
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

interface OrderStatusBadgeProps {
    status: OrderStatus
}

/** Status → Tailwind classes mapping */
const STATUS_STYLES: Record<OrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

/** Status → Display label */
const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps): React.ReactElement {
    const validStatus = (Object.keys(STATUS_STYLES) as OrderStatus[]).includes(status)
        ? status
        : 'pending'

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[validStatus]}`}
        >
            {STATUS_LABELS[validStatus]}
        </span>
    )
}

export default OrderStatusBadge
