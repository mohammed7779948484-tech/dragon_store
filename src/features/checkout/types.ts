/**
 * Checkout Feature Types
 *
 * Type definitions for checkout form, order creation, and confirmation.
 *
 * @see api-spec.md: CheckoutResult, process-checkout input/output
 * @see data-model.md: checkout validation schema
 */

import type { ActionResult, OrderStatus } from '@/modules/orders'

/** Re-export for convenience */
export type { ActionResult }

/** Checkout form input (before Zod validation) */
export interface CheckoutFormInput {
    customerName: string
    customerPhone: string
    notes?: string
    honeypotField?: string
}

/** Checkout result from server action */
export interface CheckoutResult {
    orderId: string
    orderNumber: string
}

/** Cart item with live price for checkout summary */
export interface CheckoutCartItem {
    variantId: number
    productName: string
    variantName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    isActive: boolean
}

/** Order confirmation page data */
export interface OrderConfirmationData {
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    customerName: string
    createdAt: string
    items: Array<{
        productName: string
        variantName: string
        quantity: number
        unitPrice: number
        totalPrice: number
    }>
}
