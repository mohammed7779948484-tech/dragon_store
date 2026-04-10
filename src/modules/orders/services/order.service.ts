/**
 * Order Service
 *
 * Business logic for order creation, status management, and order number generation.
 * Class-based per constitution pattern. Used by checkout and order-tracking features.
 *
 * @see Constitution Lines 708, 1537: Class-based service pattern
 * @see Constitution Lines 706-751: Transaction with req threading
 * @see spec.md: FR-021 (createOrder, updateOrderStatus, cancelOrder)
 * @see spec.md: FR-023 (order number VX-XXXXXX with 30 char charset)
 * @see spec.md: FR-024 (status transition validation)
 */

import { getPayloadClient } from '@/lib/payload'
import { AppError } from '@/core/errors'
import { Logger } from '@/core/logger'
import type { PayloadRequest } from 'payload'

import {
    ORDER_STATUS,
    ALLOWED_TRANSITIONS,
    ORDER_PREFIX,
    ORDER_NUMBER_LENGTH,
    ORDER_CHARSET,
    ORDER_MAX_RETRIES,
} from '../constants'
import type { OrderStatus, CancelledBy } from '../constants'
import type { CreateOrderInput } from '../types'

const logger = new Logger()

/**
 * Order service — class-based per constitution pattern.
 *
 * @see Constitution Line 1537: export class OrderService
 */
export class OrderService {
    /**
     * Generate a unique order number in VX-XXXXXX format.
     *
     * Uses charset without ambiguous characters (0/O/1/I/L).
     * Retries up to 3 times if collision detected (extremely rare).
     *
     * @see research.md: 30^6 ≈ 729M combinations, <0.007% collision at 10K orders
     */
    async generateOrderNumber(): Promise<string> {
        const payload = await getPayloadClient()

        for (let attempt = 0; attempt < ORDER_MAX_RETRIES; attempt++) {
            const randomPart = Array.from({ length: ORDER_NUMBER_LENGTH }, () =>
                ORDER_CHARSET[Math.floor(Math.random() * ORDER_CHARSET.length)]
            ).join('')

            const orderNumber = `${ORDER_PREFIX}-${randomPart}`

            // Check if order number already exists
            const existing = await payload.find({
                collection: 'orders',
                where: {
                    order_number: { equals: orderNumber },
                },
                limit: 1,
                overrideAccess: true, // System check
            })

            if (existing.totalDocs === 0) {
                return orderNumber
            }

            logger.warn(`Order number collision on attempt ${attempt + 1}: ${orderNumber}`)
        }

        throw new AppError(
            'Failed to generate unique order number after maximum retries',
            500,
            'UNKNOWN_ERROR'
        )
    }

    /**
     * Validate that a status transition is allowed.
     *
     * @param from - Current order status
     * @param to - Desired new status
     * @returns true if transition is allowed
     * @throws AppError if transition is not allowed
     *
     * @see data-model.md: Status Transition Constraints
     */
    validateStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
        const allowed = ALLOWED_TRANSITIONS[from]

        if (!allowed || !(allowed as readonly string[]).includes(to)) {
            throw new AppError(
                `Cannot transition order from "${from}" to "${to}"`,
                400,
                'VALIDATION_ERROR'
            )
        }

        return true
    }

    /**
     * Create a new order with order items within a transaction.
     *
     * @param input - Validated checkout input with items
     * @param req - Payload request with active transaction
     * @returns Created order with generated order number
     *
     * @see Constitution: Pass req to ALL operations within transaction
     * @see spec.md: FR-025 (atomic transaction)
     */
    async createOrder(
        input: CreateOrderInput,
        req: PayloadRequest
    ): Promise<{ orderId: string; orderNumber: string }> {
        const payload = await getPayloadClient()

        const orderNumber = await this.generateOrderNumber()

        // Calculate total amount
        const totalAmount = input.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        )

        // Create order within transaction
        const order = await payload.create({
            collection: 'orders',
            data: {
                order_number: orderNumber,
                session_id: input.sessionId,
                customer_name: input.customerName,
                customer_phone: input.customerPhone,
                notes: input.notes ?? null,
                status: ORDER_STATUS.PENDING,
                total_amount: Math.round(totalAmount * 100) / 100,
            },
            overrideAccess: true, // System creation
            depth: 0, // CRITICAL: Stop read-after-write extra queries
            context: { skipRevalidation: true },
            req,
        })

        // Create order items (snapshots of prices at checkout time) sequentially
        // CRITICAL: Must be sequential! Drizzle ORM transactions bind to a single connection.
        // Concurrent Promise.all on the same transaction connection causes a 10-second deadlock!
        for (const item of input.items) {
            await payload.create({
                collection: 'order_items',
                data: {
                    order: order.id,
                    variant: item.variantId,
                    product_name: item.productName,
                    variant_name: item.variantName,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total_price: Math.round(item.unitPrice * item.quantity * 100) / 100,
                },
                overrideAccess: true, // System creation
                depth: 0,
                context: { skipRevalidation: true },
                req,
            })
        }

        logger.info(`Order created: ${orderNumber} (${input.items.length} items, $${totalAmount.toFixed(2)})`)

        return {
            orderId: String(order.id),
            orderNumber,
        }
    }

    /**
     * Update order status with transition validation.
     *
     * @param orderId - Order UUID
     * @param newStatus - Target status
     * @param cancelInfo - Optional cancellation info (required for cancelled status)
     */
    async updateOrderStatus(
        orderId: string,
        newStatus: OrderStatus,
        cancelInfo?: { reason: string; cancelledBy: CancelledBy }
    ): Promise<void> {
        const payload = await getPayloadClient()

        const order = await payload.findByID({
            collection: 'orders',
            id: orderId,
            overrideAccess: true, // System operation
        })

        if (!order) {
            throw new AppError('Order not found', 404, 'NOT_FOUND')
        }

        const currentStatus = order.status as OrderStatus
        this.validateStatusTransition(currentStatus, newStatus)

        const updateData: Record<string, unknown> = { status: newStatus }

        if (newStatus === ORDER_STATUS.CANCELLED && cancelInfo) {
            updateData.cancellation_reason = cancelInfo.reason
            updateData.cancelled_by = cancelInfo.cancelledBy
            updateData.cancelled_at = new Date().toISOString()
        }

        await payload.update({
            collection: 'orders',
            id: orderId,
            data: updateData,
            overrideAccess: true, // Admin operation
            depth: 0,
            context: { skipRevalidation: true },
        })

        logger.info(`Order ${order.order_number} status: ${currentStatus} → ${newStatus}`)
    }

    /**
     * Cancel an order and return stock.
     *
     * @param orderId - Order UUID
     * @param reason - Cancellation reason
     * @param cancelledBy - Who cancelled (customer or admin)
     */
    async cancelOrder(
        orderId: string,
        reason: string,
        cancelledBy: CancelledBy
    ): Promise<void> {
        const payload = await getPayloadClient()

        // Update status
        await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, {
            reason,
            cancelledBy,
        })

        // Return stock for all order items
        const orderItems = await payload.find({
            collection: 'order_items',
            where: {
                order: { equals: orderId },
            },
            limit: 100,
            overrideAccess: true, // System operation
        })

        const stockService = new StockService()

        const stockReturns = orderItems.docs
            .filter((item: any) => item.variant)
            .map((item: any) => ({
                variantId: typeof item.variant === 'number' ? item.variant : (item.variant as { id: number }).id,
                quantity: item.quantity as number,
            }))

        if (stockReturns.length > 0) {
            await stockService.returnStock(stockReturns)
        }

        logger.info(`Order ${orderId} cancelled by ${cancelledBy}: ${reason}`)
    }
}

// Import StockService at bottom to avoid circular dependency
import { StockService } from './stock.service'
