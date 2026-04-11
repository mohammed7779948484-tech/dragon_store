import type { FeatureConfig } from '@/features/_registry/types'

export const checkoutConfig: FeatureConfig = {
    id: 'checkout',
    name: 'Checkout',
    description: 'COD checkout with atomic stock decrement, order creation, and honeypot anti-bot protection',
    version: '1.0.0',
    dependencies: ['gate', 'cart'],
    enabled: true,
}
