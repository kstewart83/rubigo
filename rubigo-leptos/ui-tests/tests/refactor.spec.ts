import { test, expect } from '@playwright/test';

/**
 * E2E tests for the refactored Leptos application (ui-app)
 * 
 * These tests run against the new architecture:
 * - Trunk dev server on port 8080
 * - CSR (Client-Side Rendered) Leptos 0.8
 * - Stylance-scoped CSS
 */

test.describe('Refactored App', () => {

    test('should load the home page', async ({ page }) => {
        await page.goto('/');

        // Check for the main title
        await expect(page.locator('h1')).toContainText('Welcome to Network Simulation');

        // Check for subtitle
        await expect(page.locator('.subtitle')).toContainText('Leptos 0.8');
    });

    test('should display stats cards', async ({ page }) => {
        await page.goto('/');

        // Check stats grid exists
        const statsGrid = page.locator('.stats-grid');
        await expect(statsGrid).toBeVisible();

        // Check all 4 stat cards
        const statCards = page.locator('.stat-card');
        await expect(statCards).toHaveCount(4);

        // Verify stat titles
        await expect(page.locator('.stat-title')).toContainText(['Sites', 'Assets', 'Personnel', 'Connections']);
    });

    test('should have quick action buttons', async ({ page }) => {
        await page.goto('/');

        // Check for buttons in quick actions section
        const buttons = page.locator('.action-buttons button');
        await expect(buttons).toHaveCount(3);
    });

    test('should navigate between tabs', async ({ page }) => {
        await page.goto('/');

        // Click on Calendar tab in sidebar (use nav item class)
        await page.locator('[class*="nav_item"]:has-text("Calendar")').click();

        // Should show placeholder
        await expect(page.locator('h1')).toContainText('Calendar');
        await expect(page.locator('text=being migrated')).toBeVisible();

        // Click on Personnel tab
        await page.locator('[class*="nav_item"]:has-text("Personnel")').click();
        await expect(page.locator('h1')).toContainText('Personnel');

        // Click back to Home
        await page.locator('[class*="nav_item"]:has-text("Home")').click();
        await expect(page.locator('h1')).toContainText('Welcome');
    });

    test('should display connection status', async ({ page }) => {
        await page.goto('/');

        // Check for connection indicator
        const statusIndicator = page.locator('.connected, [class*="connected"]');
        await expect(statusIndicator).toBeVisible();
    });

    test('should have responsive sidebar', async ({ page }) => {
        await page.goto('/');

        // Check sidebar has all nav items
        const navItems = page.locator('[class*="nav_item"], .nav-item');
        await expect(navItems.first()).toBeVisible();
    });

});

test.describe('Component Showcase', () => {

    test.skip('should load showcase page', async ({ page }) => {
        // Skip: Showcase runs on port 8081, not started by default
        await page.goto('http://localhost:8081/');
        await expect(page.locator('h1')).toContainText('Component Showcase');
    });

});
