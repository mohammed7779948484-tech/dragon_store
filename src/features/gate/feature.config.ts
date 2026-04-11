import type { FeatureConfig } from '@/features/_registry/types'

export const gateConfig: FeatureConfig = {
    id: 'gate',
    name: 'Password Gate',
    description: 'Site-wide password protection with session-based authentication',
    version: '1.0.0',
    dependencies: [],
    enabled: true,
}
