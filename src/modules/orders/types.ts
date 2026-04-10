/**
 * Orders Module Types
 *
 * Shared type definitions for order creation, tracking, and management.
 * Used by both checkout and order-tracking features.
 *
 * @see data-model.md: orders and order_items collection schemas
 * @see api-spec.md: ActionResult, CheckoutResult, TrackOrderResult
 */

import type { OrderStatus, CancelledBy } from './constants'

/** Standard server action response */
export interface ActionResult<T = unknown> {
    success: boolean
    data?: T
    error?: string
    code?: string
}

/** Order record from database */
export interface OrderRecord {
    id: string
    orderNumber: string
    sessionId: string
    customerName: string
    customerPhone: string
    deliveryAddress: string
    notes: string | null
    status: OrderStatus
    cancellationReason: string | null
    cancelledBy: CancelledBy | null
    cancelledAt: string | null
    totalAmount: number
    createdAt: string
    updatedAt: string
}

/** Order item snapshot (immutable after creation) */
export interface OrderItemRecord {
    id: number
    orderId: string
    variantId: number | null
    productName: string
    variantName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    createdAt: string
}

/** Input for order creation (after Zod validation) */
export interface CreateOrderInput {
    sessionId: string
    customerName: string
    customerPhone: string
    notes?: string
    items: Array<{
        variantId: number
        productName: string
        variantName: string
        quantity: number
        unitPrice: number
    }>
}

/** Result from stock decrement operation */
export interface StockDecrementResult {
    success: boolean
    variantId: number
    requestedQuantity: number
    availableStock?: number
}

/** Result from checkout process */
export interface CheckoutResult {
    orderId: string
    orderNumber: string
}

/** Result from order tracking lookup */
export interface TrackOrderResult {
    order: {
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
}

/** Result from phone number lookup */
export interface LookupOrdersResult {
    orders: Array<{
        orderNumber: string
        status: OrderStatus
        totalAmount: number
        createdAt: string
    }>
}
