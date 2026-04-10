/**
 * Orders Module Constants
 *
 * Status values, transitions, validation constraints, and configuration
 * for the orders system. All validation constants live HERE (module layer)
 * so validators can import them without violating FSD rules.
 *
 * @see Constitution: Use const objects, NOT enums
 * @see Constitution Line 519: modules/ CANNOT import from features/
 * @see data-model.md: Order status state machine
 * @see research.md: Order number generation algorithm
 */

// ─── Order Status ─────────────────────────────────────────────

/** Order status values (const object, NOT enum per constitution) */
export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/**
 * Allowed order status transitions
 *
 * pending → processing ✅
 * pending → cancelled ✅
 * processing → completed ✅
 * processing → cancelled ✅
 * completed → (any) ❌ (final state)
 * cancelled → (any) ❌ (final state)
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
} as const

/** Cancelled-by options */
export const CANCELLED_BY = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
} as const

export type CancelledBy = (typeof CANCELLED_BY)[keyof typeof CANCELLED_BY]

// ─── Order Number Generation ──────────────────────────────────

export const ORDER_PREFIX = 'VX'
export const ORDER_NUMBER_LENGTH = 6
export const ORDER_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' // 30 chars, no ambiguous 0/O/1/I/L
export const ORDER_MAX_RETRIES = 3

// ─── Validation Constraints (used by validators in same module) ─

/** US phone format regex: +1 followed by exactly 10 digits */
export const US_PHONE_REGEX = /^\+1\d{10}$/

/** Phone format error message */
export const PHONE_FORMAT_MESSAGE = 'Phone must be +1 US format (e.g., +15551234567)'

/** Customer name constraints */
export const CUSTOMER_NAME_MIN = 2
export const CUSTOMER_NAME_MAX = 255

/** Delivery address constraints */
export const ADDRESS_MIN = 10
export const ADDRESS_MAX = 500

/** Notes max length */
export const NOTES_MAX = 1000

/** Fake order number returned for bot detection */
export const FAKE_ORDER_NUMBER = 'VX-FAKE00'
export const FAKE_ORDER_ID = 'fake-id'

/** Currency formatting */
export const CURRENCY = 'USD'
export const CURRENCY_SYMBOL = '$'
export const CURRENCY_DECIMALS = 2

// ─── Rate Limits ──────────────────────────────────────────────

/** Rate limit for cart operations per session */
export const CART_RATE_LIMIT = 20
export const CART_RATE_INTERVAL = 60_000

/** Rate limit for checkout attempts per session */
export const CHECKOUT_RATE_LIMIT = 3
export const CHECKOUT_RATE_INTERVAL = 60_000

/** Rate limit for order tracking lookups per IP */
export const TRACKING_RATE_LIMIT = 10
export const TRACKING_RATE_INTERVAL = 60_000

// ─── Cart Constraints ─────────────────────────────────────────

/** Maximum quantity per variant per cart */
export const MAX_QUANTITY = 10

/** Maximum number of distinct items (variants) per cart */
export const MAX_CART_ITEMS = 50

/** Cart expiration time in hours from last activity */
export const CART_EXPIRY_HOURS = 24

/** Cart expiration time in milliseconds */
export const CART_EXPIRY_MS = CART_EXPIRY_HOURS * 60 * 60 * 1000

/** Minimum quantity for a cart item */
export const MIN_QUANTITY = 1

/** Cart full error message */
export const CART_FULL_MESSAGE = 'Cart is full (50 items max). Remove items to add more.'

// ─── Order Number Validation ──────────────────────────────────

/** Order number validation regex (VX-XXXXXX with allowed charset) */
export const ORDER_NUMBER_REGEX = /^VX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/
