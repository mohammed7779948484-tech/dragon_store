/**
 * Cart Feature Constants
 *
 * Re-exports cart-related constants from modules/orders.
 * Features CAN import from modules (downward dependency).
 *
 * @see Constitution: Features import from modules layer
 */

export {
    MAX_QUANTITY,
    MAX_CART_ITEMS,
    CART_EXPIRY_HOURS,
    CART_EXPIRY_MS,
    MIN_QUANTITY,
    CART_FULL_MESSAGE,
    CART_RATE_LIMIT,
    CART_RATE_INTERVAL,
} from '@/modules/orders/constants'
