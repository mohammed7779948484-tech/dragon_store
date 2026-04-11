/**
 * Order Query Service
 *
 * Read-only queries for orders. Used by both checkout (order confirmation)
 * and order-tracking features. Lives in modules/ because it is shared
 * business logic consumed by 2+ features.
 *
 * @see Constitution Line 482: Logic used by 2+ features → MODULE
 * @see Constitution Line 257: overrideAccess: true for system queries
 * @see data-model.md: orders and order_items collections
 * @see api-spec.md: TrackOrderResult, LookupOrdersResult
 */

import { getPayloadClient } from '@/lib/payload'
import { Logger } from '@/core/logger'

import type { OrderStatus } from '../constants'

const logger = new Logger()

/** Order with items for tracking / confirmation display */
export interface OrderWithItems {
    id: string
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    customerName: string
    customerPhone: string
    deliveryAddress: string
    notes: string | null
    createdAt: string
    items: Array<{
        productName: string
        variantName: string
        quantity: number
        unitPrice: number
        totalPrice: number
    }>
}

/** Lightweight order for list display */
export interface OrderSummary {
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    createdAt: string
}

/**
 * Order Query Service — class-based per constitution pattern.
 *
 * Pure read operations. No mutations, no transactions.
 */
export class OrderQueryService {
    /**
     * Get order by UUID ID with items.
     *
     * @param orderId - Order UUID
     * @returns Order with items or null
     */
    async getOrderById(orderId: string): Promise<OrderWithItems | null> {
        const payload = await getPayloadClient()

        try {
            const order = await payload.findByID({
                collection: 'orders',
                id: orderId,
                overrideAccess: true, // System execution
            })

            if (!order) return null

            const items = await payload.find({
                collection: 'order_items',
                where: {
                    order: { equals: order.id },
                },
                limit: 100,
                overrideAccess: true, // System execution
            })

            return {
                id: String(order.id),
                orderNumber: order.order_number as string,
                status: order.status as OrderStatus,
                totalAmount: order.total_amount as number,
                customerName: order.customer_name as string,
                customerPhone: order.customer_phone as string,
                deliveryAddress: order.delivery_address as string,
                notes: (order.notes as string) ?? null,
                createdAt: order.createdAt as string,
                items: items.docs.map((item) => ({
                    productName: item.product_name as string,
                    variantName: item.variant_name as string,
                    quantity: item.quantity as number,
                    unitPrice: item.unit_price as number,
                    totalPrice: item.total_price as number,
                })),
            }
        } catch (error) {
            logger.error(error as Error, { context: 'OrderQueryService.getOrderById', orderId })
            return null
        }
    }

    /**
     * Get order by order number (VX-XXXXXX).
     *
     * @param orderNumber - Human-readable order number
     * @returns Order with items or null
     */
    async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
        const payload = await getPayloadClient()

        const result = await payload.find({
            collection: 'orders',
            where: {
                order_number: { equals: orderNumber },
            },
            limit: 1,
            overrideAccess: true, // System execution
        })

        const order = result.docs[0]
        if (!order) return null

        return this.getOrderById(String(order.id))
    }

    /**
     * Get all orders for a phone number (for phone lookup).
     *
     * @param phone - Customer phone in +1 US format
     * @returns Array of order summaries sorted by date desc
     */
    async getOrdersByPhone(phone: string): Promise<OrderSummary[]> {
        const payload = await getPayloadClient()

        const result = await payload.find({
            collection: 'orders',
            where: {
                customer_phone: { equals: phone },
            },
            sort: '-createdAt',
            limit: 50,
            overrideAccess: true, // System execution
        })

        return result.docs.map((order) => ({
            orderNumber: order.order_number as string,
            status: order.status as OrderStatus,
            totalAmount: order.total_amount as number,
            createdAt: order.createdAt as string,
        }))
    }
}
