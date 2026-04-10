/**
 * Feature Registry Types
 *
 * Defines the shape of feature configuration objects used throughout
 * the feature registry system. Every feature MUST export a FeatureConfig
 * from its feature.config.ts file.
 */

export interface FeatureConfig {
    /** Unique kebab-case identifier for the feature */
    id: string
    /** Human-readable display name */
    name: string
    /** Brief description of what the feature provides */
    description: string
    /** Semantic version string */
    version: string
    /** IDs of features this feature depends on */
    dependencies: readonly string[]
    /** Whether the feature is currently active */
    enabled: boolean
}

export interface FeatureRegistry {
    [featureId: string]: FeatureConfig
}
