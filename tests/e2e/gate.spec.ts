/**
 * E2E test for gate flow
 * @see T095 — tests/e2e/gate.spec.ts
 * @see Constitution: Playwright for E2E testing
 * @see spec.md: User Story 2 — Store Access via Password Gate
 */
import { test, expect } from '@playwright/test'

test.describe('Gate Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear cookies to ensure no session
        await page.context().clearCookies()
    })

    test('should redirect unauthenticated users to /gate', async ({ page }) => {
        await page.goto('/')
        // Middleware should redirect to /gate
        await expect(page).toHaveURL(/\/gate/)
    })

    test('should show gate form with password input', async ({ page }) => {
        await page.goto('/gate')
        await expect(page.locator('input[type="password"]')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show error for incorrect password', async ({ page }) => {
        await page.goto('/gate')

        await page.fill('input[type="password"]', 'wrong-password-123')
        await page.click('button[type="submit"]')

        // Should show error message
        await expect(page.locator('[role="alert"]').or(page.getByText(/invalid|incorrect|wrong/i))).toBeVisible()
    })

    test('should show rate limit message after too many attempts', async ({ page }) => {
        await page.goto('/gate')

        // Attempt 6 times (limit is 5)
        for (let i = 0; i < 6; i++) {
            await page.fill('input[type="password"]', `wrong-attempt-${i}`)
            await page.click('button[type="submit"]')
            await page.waitForTimeout(300)
        }

        // Should show rate limit message
        await expect(page.getByText(/too many|rate limit|try again/i)).toBeVisible()
    })

    test('should grant access with correct password and redirect to home', async ({ page }) => {
        await page.goto('/gate')

        // Use the correct gate password (set via seed or .env)
        await page.fill('input[type="password"]', process.env.GATE_PASSWORD ?? 'test-password')
        await page.click('button[type="submit"]')

        // Should redirect to home page
        await expect(page).toHaveURL('/')
    })

    test('should maintain session after successful authentication', async ({ page }) => {
        await page.goto('/gate')

        await page.fill('input[type="password"]', process.env.GATE_PASSWORD ?? 'test-password')
        await page.click('button[type="submit"]')

        await expect(page).toHaveURL('/')

        // Navigate to another page — should not redirect to gate
        await page.goto('/products')
        await expect(page).not.toHaveURL(/\/gate/)
    })
})
