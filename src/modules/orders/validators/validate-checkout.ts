/**
 * Checkout Validator
 *
 * Zod schemas for checkout input validation.
 * All constants imported from modules/orders (NOT from features/).
 *
 * @see Constitution Line 519: modules/ CANNOT import from features/
 * @see spec.md: FR-026 (customerName, customerPhone, deliveryAddress, notes, honeypot)
 * @see data-model.md: Validation Schemas section
 * @see api-spec.md: process-checkout input schema
 */

import { z } from 'zod'

import {
    CUSTOMER_NAME_MIN,
    CUSTOMER_NAME_MAX,
    US_PHONE_REGEX,
    PHONE_FORMAT_MESSAGE,
    NOTES_MAX,
    MAX_QUANTITY,
    ORDER_NUMBER_REGEX,
} from '../constants'

/**
 * Checkout form validation schema
 *
 * Validates customer information for order creation.
 * honeypotField must be empty (bot detection).
 */
export const checkoutSchema = z.object({
    customerName: z
        .string()
        .min(CUSTOMER_NAME_MIN, `Name must be at least ${CUSTOMER_NAME_MIN} characters`)
        .max(CUSTOMER_NAME_MAX, `Name must be less than ${CUSTOMER_NAME_MAX} characters`),

    customerPhone: z
        .string()
        .regex(US_PHONE_REGEX, PHONE_FORMAT_MESSAGE),

    notes: z
        .string()
        .max(NOTES_MAX, `Notes must be less than ${NOTES_MAX} characters`)
        .optional(),

    honeypotField: z
        .string()
        .max(0, 'Invalid submission')
        .optional(),
})

/** Validated checkout input type */
export type CheckoutInput = z.infer<typeof checkoutSchema>

/**
 * Add to cart validation schema
 */
export const addToCartSchema = z.object({
    variantId: z.number().int().positive('Invalid product variant'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QUANTITY, `Maximum ${MAX_QUANTITY} per item`).default(1),
})

/** Validated add-to-cart input type */
export type AddToCartInput = z.infer<typeof addToCartSchema>

/**
 * Update quantity validation schema
 */
export const updateQuantitySchema = z.object({
    cartItemId: z.number().int().positive('Invalid cart item'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QUANTITY, `Maximum ${MAX_QUANTITY} per item`),
})

/** Validated update quantity input type */
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>

/**
 * Remove item validation schema
 */
export const removeItemSchema = z.object({
    cartItemId: z.number().int().positive('Invalid cart item'),
})

/** Validated remove item input type */
export type RemoveItemInput = z.infer<typeof removeItemSchema>

/**
 * Track order validation schema
 */
export const trackOrderSchema = z.object({
    orderNumber: z.string().regex(ORDER_NUMBER_REGEX, 'Invalid order number format'),
})

/** Validated track order input type */
export type TrackOrderInput = z.infer<typeof trackOrderSchema>

/**
 * Lookup orders validation schema
 */
export const lookupOrdersSchema = z.object({
    phone: z.string().regex(US_PHONE_REGEX, PHONE_FORMAT_MESSAGE),
})

/** Validated lookup orders input type */
export type LookupOrdersInput = z.infer<typeof lookupOrdersSchema>
