/**
 * Gate Feature — Public API
 *
 * All imports from the gate feature MUST use this file.
 * Deep imports are forbidden per the Constitution.
 */

// UI Components
export { GateScreen } from './ui/GateScreen'
export { GateForm } from './ui/GateForm'

// Types
export type { GateFormData, GateActionResult } from './types'

// Constants
export {
    GATE_RATE_LIMIT,
    GATE_RATE_INTERVAL,
    GATE_COOKIE_NAME,
    GATE_SESSION_DURATION,
    GATE_REMEMBER_DURATION,
} from './constants'

// Actions
export { verifyPassword } from './actions/verify-password.action'
