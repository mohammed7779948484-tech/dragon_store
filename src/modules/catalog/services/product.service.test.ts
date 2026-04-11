/**
 * Integration test for product service
 * @see T094 — src/modules/catalog/services/product.service.test.ts
 * @see Constitution: Module services are MANDATORY test targets
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Payload client
const mockPayloadFind = vi.fn()
const mockPayloadFindByID = vi.fn()

vi.mock('@/lib/payload', () => ({
    getPayloadClient: vi.fn().mockResolvedValue({
        find: mockPayloadFind,
        findByID: mockPayloadFindByID,
    }),
}))

import {
    getActiveProducts,
    getProductBySlug,
    getProductsByBrand,
    getProductsByCategory,
} from './product.service'

/** Helper to create a mock product record */
function createMockProduct(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product',
        unit_label: 'Pack',
        image: { url: 'https://cdn.example.com/image.jpg' },
        brand: { id: 1, name: 'Test Brand', slug: 'test-brand' },
        categories: [{ id: 1, name: 'Category A', slug: 'category-a' }],
        is_active: true,
        sort_order: 0,
        ...overrides,
    }
}

/** Helper to create a mock variant record */
function createMockVariant(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 101,
        variant_name: 'Strawberry Ice',
        sku: 'TST-STRW-001',
        price: 25.99,
        stock_quantity: 50,
        images: [],
        option_value: '50mg',
        is_active: true,
        sort_order: 0,
        ...overrides,
    }
}

describe('Product Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getActiveProducts', () => {
        it('should return paginated product card data', async () => {
            const mockProduct = createMockProduct()

            // First call: find products
            mockPayloadFind.mockResolvedValueOnce({
                docs: [mockProduct],
                totalDocs: 1,
                totalPages: 1,
                page: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })

            // Second call: find variants for product
            mockPayloadFind.mockResolvedValueOnce({
                docs: [createMockVariant()],
            })

            const result = await getActiveProducts({ page: 1, limit: 12 })

            expect(result.docs).toHaveLength(1)
            const firstProduct = result.docs[0]
            expect(firstProduct).toBeDefined()
            expect(firstProduct!.name).toBe('Test Product')
            expect(firstProduct!.slug).toBe('test-product')
            expect(firstProduct!.brandName).toBe('Test Brand')
            expect(firstProduct!.inStock).toBe(true)
            expect(result.totalDocs).toBe(1)
        })

        it('should filter by brand slug when provided', async () => {
            mockPayloadFind.mockResolvedValue({
                docs: [],
                totalDocs: 0,
                totalPages: 0,
                page: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })

            await getActiveProducts({ page: 1, limit: 12, brandSlug: 'test-brand' })

            expect(mockPayloadFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        'brand.slug': { equals: 'test-brand' },
                    }),
                })
            )
        })

        it('should filter by category slug when provided', async () => {
            mockPayloadFind.mockResolvedValue({
                docs: [],
                totalDocs: 0,
                totalPages: 0,
                page: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })

            await getActiveProducts({ page: 1, limit: 12, categorySlug: 'category-a' })

            expect(mockPayloadFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        'categories.slug': { equals: 'category-a' },
                    }),
                })
            )
        })
    })

    describe('getProductBySlug', () => {
        it('should return full product when found', async () => {
            const mockProduct = createMockProduct()

            mockPayloadFind.mockResolvedValueOnce({
                docs: [mockProduct],
            })

            mockPayloadFind.mockResolvedValueOnce({
                docs: [createMockVariant()],
            })

            const result = await getProductBySlug('test-product')

            expect(result).not.toBeNull()
            expect(result?.name).toBe('Test Product')
            expect(result?.slug).toBe('test-product')
            expect(result?.variants).toHaveLength(1)
            expect(result?.minPrice).toBe(25.99)
        })

        it('should return null when product not found', async () => {
            mockPayloadFind.mockResolvedValueOnce({ docs: [] })

            const result = await getProductBySlug('non-existent')
            expect(result).toBeNull()
        })
    })

    describe('getProductsByBrand', () => {
        it('should delegate to getActiveProducts with brandSlug', async () => {
            mockPayloadFind.mockResolvedValue({
                docs: [],
                totalDocs: 0,
                totalPages: 0,
                page: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })

            await getProductsByBrand('test-brand')

            expect(mockPayloadFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        'brand.slug': { equals: 'test-brand' },
                    }),
                })
            )
        })
    })

    describe('getProductsByCategory', () => {
        it('should delegate to getActiveProducts with categorySlug', async () => {
            mockPayloadFind.mockResolvedValue({
                docs: [],
                totalDocs: 0,
                totalPages: 0,
                page: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })

            await getProductsByCategory('category-a')

            expect(mockPayloadFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        'categories.slug': { equals: 'category-a' },
                    }),
                })
            )
        })
    })
})
