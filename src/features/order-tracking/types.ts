/**
 * Order Tracking Feature Types
 *
 * Type definitions for order lookup and status display.
 *
 * @see api-spec.md: TrackOrderResult, LookupOrdersResult
 */

import type { ActionResult, OrderStatus } from '@/modules/orders'

/** Re-export for convenience */
export type { ActionResult }

/** Order summary for tracking display */
export interface TrackedOrder {
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    createdAt: string
    items: Array<{
        productName: string
        variantName: string
        quantity: number
        unitPrice: number
    }>
}

/** Order list item for phone lookup */
export interface OrderListItem {
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    createdAt: string
}

/** Result from track-order action */
export interface TrackOrderResult {
    order: TrackedOrder
}

/** Result from lookup-orders action */
export interface LookupOrdersResult {
    orders: OrderListItem[]
}

/** Track order form input */
export interface TrackOrderInput {
    orderNumber: string
}

/** Lookup orders form input */
export interface LookupOrdersInput {
    phone: string
}

/** Status timeline step for visual display */
export interface TimelineStep {
    status: OrderStatus
    label: string
    description: string
    isActive: boolean
    isCompleted: boolean
    timestamp?: string
}
