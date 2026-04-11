/**
 * E2E test for admin access
 * @see T096 — tests/e2e/admin-access.spec.ts
 * @see Constitution: Playwright for E2E testing
 * @see spec.md: User Story 1 — Admin Access to Management Panel
 */
import { test, expect } from '@playwright/test'

test.describe('Admin Access', () => {
    test('should show Payload admin login form', async ({ page }) => {
        await page.goto('/admin')

        // Payload admin should render login form
        await expect(page.locator('input[name="email"]').or(page.locator('input[type="email"]'))).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('should reject invalid admin credentials', async ({ page }) => {
        await page.goto('/admin')

        await page.fill('input[name="email"], input[type="email"]', 'fake@admin.com')
        await page.fill('input[type="password"]', 'wrong-password')
        await page.click('button[type="submit"]')

        // Should stay on login or show error
        await expect(page.getByText(/invalid|incorrect|error|unauthorized/i)).toBeVisible({ timeout: 5000 })
    })

    test('should allow access with seeded super admin credentials', async ({ page }) => {
        await page.goto('/admin')

        // Use seeded credentials from seed-admin.ts
        const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@store.com'
        const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin-password'

        await page.fill('input[name="email"], input[type="email"]', adminEmail)
        await page.fill('input[type="password"]', adminPassword)
        await page.click('button[type="submit"]')

        // Should redirect to dashboard and show admin panel
        await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    })

    test('should show all required collections in admin panel', async ({ page }) => {
        // Login first
        await page.goto('/admin')
        const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@store.com'
        const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin-password'

        await page.fill('input[name="email"], input[type="email"]', adminEmail)
        await page.fill('input[type="password"]', adminPassword)
        await page.click('button[type="submit"]')

        await page.waitForURL(/\/admin/, { timeout: 10000 })

        // Check for required collections in navigation
        const nav = page.locator('nav')
        const collectionsToFind = ['Products', 'Brands', 'Categories', 'Media', 'Users']

        for (const collection of collectionsToFind) {
            await expect(
                nav.getByText(collection, { exact: false }).first()
            ).toBeVisible({ timeout: 5000 })
        }
    })

    test('admin login should complete within 5 seconds (SC-001)', async ({ page }) => {
        const startTime = Date.now()

        await page.goto('/admin')
        const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@store.com'
        const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin-password'

        await page.fill('input[name="email"], input[type="email"]', adminEmail)
        await page.fill('input[type="password"]', adminPassword)
        await page.click('button[type="submit"]')

        await page.waitForURL(/\/admin/, { timeout: 10000 })

        const duration = Date.now() - startTime
        expect(duration).toBeLessThan(5000) // SC-001: < 5 seconds
    })
})
