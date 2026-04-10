/**
 * Client-safe checkout constants
 *
 * Lightweight constants for client components.
 * These MUST NOT import from @/modules/orders or any server-only module
 * to avoid pulling server code into the client bundle.
 *
 * @see Constitution: Client components cannot import server-only modules
 */

export const CURRENCY_SYMBOL = '$'
