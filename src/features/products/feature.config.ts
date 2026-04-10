/**
 * Products Feature Configuration
 */

import type { FeatureConfig } from '@/features/_registry/types'

export const productsConfig: FeatureConfig = {
    id: 'products',
    name: 'Products',
    description: 'Product catalog browsing, brand/category filtering, variant selection',
    version: '1.0.0',
    dependencies: [],
    enabled: true,
}
