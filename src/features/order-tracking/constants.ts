/**
 * Order Tracking Feature Constants
 *
 * Re-exports primitive constants from modules/orders/constants directly
 * (NOT from the barrel `@/modules/orders`) to avoid pulling service classes
 * like OrderService and StockService into the client bundle.
 *
 * Why the deep path? The barrel `@/modules/orders` also exports server-only
 * classes (OrderService, StockService, OrderQueryService) that import
 * `bcrypt` and `payload`. When a 'use client' component (TrackOrderForm)
 * imports from this file, Webpack follows the entire import tree and tries
 * to bundle server-only Node.js modules — causing a build failure.
 *
 * Constants and types from modules/orders have zero server dependencies,
 * so this targeted import is safe and architecturally sound.
 *
 * @see Constitution: Features import from modules/ (downward dependency ✅)
 */

// Import only pure primitive constants (no server-only dependencies)
export {
    TRACKING_RATE_LIMIT,
    TRACKING_RATE_INTERVAL,
    ORDER_NUMBER_REGEX,
    CURRENCY_SYMBOL,
} from '@/modules/orders/constants'

/** Status display labels */
export const STATUS_LABELS = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
} as const

/** Status display descriptions (UI-specific, belongs in feature) */
export const STATUS_DESCRIPTIONS = {
    pending: 'Your order has been received and is waiting for admin review.',
    processing: 'Your order is being prepared for pickup.',
    completed: 'Your order has been picked up successfully.',
    cancelled: 'This order has been cancelled.',
} as const
