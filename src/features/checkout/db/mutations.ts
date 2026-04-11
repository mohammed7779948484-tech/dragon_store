/**
 * Checkout Mutations
 *
 * Write operations for order data. Thin wrappers around the class-based
 * OrderService from modules/orders.
 *
 * @see Constitution: Features delegate to modules for business logic
 * @see Constitution: Import from index.ts (public API), not deep paths
 * @see Constitution: Pass req for transaction atomicity (Payload Skill)
 * @see spec.md: FR-025 (atomic transaction for checkout)
 */

import { OrderService } from '@/modules/orders'
import type { CreateOrderInput } from '@/modules/orders'
import type { PayloadRequest } from 'payload'

const orderService = new OrderService()

/**
 * Create order via orders module service.
 * Delegates to module layer for business logic.
 *
 * @param input - Validated checkout data with items
 * @param req - Payload request with active transaction
 */
export async function createOrder(
    input: CreateOrderInput,
    req: PayloadRequest
): Promise<{ orderId: string; orderNumber: string }> {
    return orderService.createOrder(input, req)
}
