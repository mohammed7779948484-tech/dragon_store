/**
 * Gate Feature Types
 *
 * Type definitions for the password gate feature.
 * Used by actions, UI components, and the gate page.
 */

/** Form data submitted by the gate form */
export interface GateFormData {
    password: string
    rememberMe: boolean
}

/** Result returned by the verify-password server action */
export interface GateActionResult {
    success: boolean
    error?: string
    code?: string
}
