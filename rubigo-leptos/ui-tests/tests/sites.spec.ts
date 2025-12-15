import { test, expect } from '@playwright/test';

test.describe('Sites Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        // Handle sign-in if needed
        const signInScreen = page.locator('.sign-in-screen');
        if (await signInScreen.isVisible({ timeout: 2000 }).catch(() => false)) {
            await page.locator('#sign-in-btn').click();
            await expect(page.locator('#dev-overlay')).toHaveClass(/open/);
            await page.locator('.persona-card').first().click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(500);
        }
        await page.goto('/?tab=sites');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should display sites container with maps', async ({ page }) => {
        // Verify main container
        await expect(page.locator('.sites-container')).toBeVisible();

        // Verify 2D map section exists
        await expect(page.locator('.map-views-container')).toBeVisible();

        // Verify map SVG is rendered
        const mapSvg = page.locator('.map-view svg');
        await expect(mapSvg).toBeVisible();

        // Verify globe SVG is rendered
        const globeSvg = page.locator('.globe-view svg');
        await expect(globeSvg).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/geospatial-main.png' });
    });

    test('should display regions table with data', async ({ page }) => {
        // Verify regions table exists
        const regionsTable = page.locator('.data-table');
        await expect(regionsTable).toBeVisible();

        // Should have at least one region row
        const rows = page.locator('.data-table tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        // Take screenshot
        await page.screenshot({ path: 'test-results/geospatial-regions.png' });
    });

    test('should navigate to region detail', async ({ page }) => {
        // Click View button on first region
        const viewButton = page.locator('.data-table a.btn:has-text("View")').first();
        await viewButton.click();

        await page.waitForLoadState('domcontentloaded');

        // Should show breadcrumb navigation
        await expect(page.getByText('Regions /')).toBeVisible();

        // Should show sites table
        await expect(page.locator('.data-table')).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/geospatial-region-detail.png' });
    });

    test('should navigate to create region form', async ({ page }) => {
        // Click Create Region button  
        await page.click('a:has-text("+ Create Region")');

        await page.waitForLoadState('domcontentloaded');

        // Verify form elements
        await expect(page.locator('form[action="/regions/create"]')).toBeVisible();
        await expect(page.locator('#city-search')).toBeVisible();
        await expect(page.locator('input[name="name"]')).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/geospatial-create-region.png' });
    });

    test('should render SVG map with country paths', async ({ page }) => {
        // Wait for SVG to render
        await page.waitForSelector('.map-view svg path');

        // Count paths (countries should produce many paths)
        const pathCount = await page.locator('.map-view svg path').count();
        expect(pathCount).toBeGreaterThan(50);

        await page.screenshot({ path: 'test-results/geospatial-map-paths.png' });
    });

    test('should render 3D globe', async ({ page }) => {
        // Verify globe container
        await expect(page.locator('.globe-view').first()).toBeVisible();

        // Wait for globe SVG paths
        await page.waitForSelector('.globe-view svg path');

        // Check for globe circle (ocean)
        const circles = page.locator('.globe-view svg circle');
        const circleCount = await circles.count();
        expect(circleCount).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/geospatial-globe.png' });
    });
});
