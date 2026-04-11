/**
 * Checkout Feature Constants
 *
 * Re-exports checkout-related constants from modules/orders.
 * Features CAN import from modules (downward dependency).
 *
 * @see Constitution: Features import from modules layer
 */

export {
    CHECKOUT_RATE_LIMIT,
    CHECKOUT_RATE_INTERVAL,
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
} from '@/modules/orders'
