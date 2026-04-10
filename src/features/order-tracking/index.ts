/**
 * Order Tracking Feature — Public API
 *
 * All exports from this feature must go through this barrel file.
 * External code imports from '@/features/order-tracking', NOT deep paths.
 *
 * @see Constitution Line 126: Import from index.ts only
 * @see Constitution Line 452: index.ts — REQUIRED — Public API exports only
 */

// ─── UI Components ────────────────────────────────────────────
export { OrderStatus } from './ui/OrderStatus'
export { TrackOrderForm } from './ui/TrackOrderForm'

// ─── Actions ──────────────────────────────────────────────────
export { trackOrderAction } from './actions/track-order.action'
export { lookupOrdersAction } from './actions/lookup-orders.action'

// ─── Constants (UI-specific) ─────────────────────────────────
export { STATUS_LABELS, STATUS_DESCRIPTIONS } from './constants'

// ─── Types ────────────────────────────────────────────────────
export type {
    TrackOrderInput,
    LookupOrdersInput,
    TrackedOrder,
    OrderListItem,
    TimelineStep,
    TrackOrderResult,
    LookupOrdersResult,
} from './types'
