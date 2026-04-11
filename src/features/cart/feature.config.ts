import type { FeatureConfig } from '@/features/_registry/types'

export const cartConfig: FeatureConfig = {
    id: 'cart',
    name: 'Shopping Cart',
    description: 'Server-side relational cart with session linking, quantity management, and price change detection',
    version: '1.0.0',
    dependencies: ['gate'],
    enabled: true,
}
