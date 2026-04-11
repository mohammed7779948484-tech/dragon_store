/**
 * Gate Feature Constants
 *
 * Configuration constants for the password gate feature.
 */

/** Maximum password attempts per minute per IP */
export const GATE_RATE_LIMIT = 5

/** Rate limit window in milliseconds (1 minute) */
export const GATE_RATE_INTERVAL = 60_000

/** Session cookie name */
export const GATE_COOKIE_NAME = 'session'

/** Default session duration in milliseconds (24 hours) */
export const GATE_SESSION_DURATION = 24 * 60 * 60 * 1000

/** Extended session duration for "Remember Me" (30 days) */
export const GATE_REMEMBER_DURATION = 30 * 24 * 60 * 60 * 1000
