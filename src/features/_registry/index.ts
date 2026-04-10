/**
 * Feature Registry
 *
 * Central registry for all features in the application.
 * Every feature MUST be registered here to be recognized by the system.
 */

import type { FeatureConfig, FeatureRegistry } from './types'

import { gateConfig } from '../gate/feature.config'
import { productsConfig } from '../products/feature.config'
import { cartConfig } from '../cart/feature.config'
import { checkoutConfig } from '../checkout/feature.config'
import { orderTrackingConfig } from '../order-tracking/feature.config'

export const FEATURES: FeatureRegistry = {
    gate: gateConfig,
    products: productsConfig,
    cart: cartConfig,
    checkout: checkoutConfig,
    'order-tracking': orderTrackingConfig,
} as const

export const DISABLED_FEATURES: readonly string[] = [] as const

/**
 * Check if a feature is enabled.
 *
 * A feature is enabled if:
 * 1. It exists in the FEATURES registry
 * 2. Its config has `enabled: true`
 * 3. It is NOT in the DISABLED_FEATURES list
 */
export function isFeatureEnabled(featureId: string): boolean {
    const config = FEATURES[featureId] as FeatureConfig | undefined
    if (!config) return false
    if (!config.enabled) return false
    if (DISABLED_FEATURES.includes(featureId)) return false
    return true
}

export type { FeatureConfig, FeatureRegistry }
