/**
 * Order Confirmation Page
 *
 * Server Component — fetches order by ID and displays confirmation.
 * No session required (order ID is the access token for this page).
 *
 * @see Constitution Line 370: app/ can import from widgets/, features/, shared/
 * @see spec.md: FR-030 (order confirmation page after checkout)
 * @see api-spec.md: Server Component: Order Confirmation pattern
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getOrderById } from '@/features/checkout'
import { OrderConfirmation } from '@/features/checkout/ui/OrderConfirmation'
import type { OrderConfirmationData } from '@/features/checkout'

export const metadata: Metadata = {
    title: 'Order Confirmed — Dragon',
    description: 'Your order has been placed successfully',
}

interface OrderConfirmationPageProps {
    params: Promise<{
        orderId: string
    }>
}

export default async function OrderConfirmationPage({
    params,
}: OrderConfirmationPageProps): Promise<React.ReactElement> {
    const { orderId } = await params

    // Fetch order by ID
    const order = await getOrderById(orderId)

    if (!order) {
        notFound()
    }

    // Map to OrderConfirmationData
    const confirmationData: OrderConfirmationData = {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
        })),
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            <OrderConfirmation order={confirmationData} />
        </div>
    )
}
