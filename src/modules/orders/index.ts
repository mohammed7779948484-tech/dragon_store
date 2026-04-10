/**
 * Orders Module — Public API
 *
 * All exports from this module must go through this barrel file.
 * Features import from '@/modules/orders', NOT from deep paths.
 *
 * @see Constitution Line 126: Import from index.ts only
 */

// ─── Constants ────────────────────────────────────────────────
export {
    ORDER_STATUS,
    ALLOWED_TRANSITIONS,
    CANCELLED_BY,
    ORDER_PREFIX,
    ORDER_NUMBER_LENGTH,
    ORDER_CHARSET,
    ORDER_MAX_RETRIES,
    US_PHONE_REGEX,
    PHONE_FORMAT_MESSAGE,
    CUSTOMER_NAME_MIN,
    CUSTOMER_NAME_MAX,
    ADDRESS_MIN,
    ADDRESS_MAX,
    NOTES_MAX,
    FAKE_ORDER_NUMBER,
    FAKE_ORDER_ID,
    CURRENCY,
    CURRENCY_SYMBOL,
    CURRENCY_DECIMALS,
    CART_RATE_LIMIT,
    CART_RATE_INTERVAL,
    CHECKOUT_RATE_LIMIT,
    CHECKOUT_RATE_INTERVAL,
    TRACKING_RATE_LIMIT,
    TRACKING_RATE_INTERVAL,
    MAX_QUANTITY,
    MAX_CART_ITEMS,
    CART_EXPIRY_HOURS,
    CART_EXPIRY_MS,
    MIN_QUANTITY,
    CART_FULL_MESSAGE,
    ORDER_NUMBER_REGEX,
} from './constants'

// ─── Types ────────────────────────────────────────────────────
export type { OrderStatus, CancelledBy } from './constants'
export type {
    ActionResult,
    OrderRecord,
    OrderItemRecord,
    CreateOrderInput,
    StockDecrementResult,
    CheckoutResult,
    TrackOrderResult,
    LookupOrdersResult,
} from './types'

// ─── Services ─────────────────────────────────────────────────
export { OrderService } from './services/order.service'
export { StockService } from './services/stock.service'
export { OrderQueryService } from './services/order-query.service'
export type { OrderWithItems, OrderSummary } from './services/order-query.service'

// ─── Validators ───────────────────────────────────────────────
export {
    checkoutSchema,
    addToCartSchema,
    updateQuantitySchema,
    removeItemSchema,
    trackOrderSchema,
    lookupOrdersSchema,
} from './validators/validate-checkout'
export type {
    CheckoutInput,
    AddToCartInput,
    UpdateQuantityInput,
    RemoveItemInput,
    TrackOrderInput,
    LookupOrdersInput,
} from './validators/validate-checkout'
