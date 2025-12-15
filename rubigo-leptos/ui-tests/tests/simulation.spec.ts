import { test, expect } from '@playwright/test';

test.describe('Simulation Control', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?tab=simulation');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should run simulation and view logs', async ({ page }) => {
        // 1. Start Simulation
        await page.click('button:has-text("Start Simulation")');

        // Wait for reload/navigation back to tab
        await page.waitForURL('**/?tab=simulation');
        await page.waitForLoadState('domcontentloaded');

        // Give page time to show the new run
        await page.waitForTimeout(2000);
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // 2. Verify Run appeared - look for View Logs button
        const viewLogsButton = page.getByText('View Logs').first();
        await expect(viewLogsButton).toBeVisible({ timeout: 10000 });

        // Take screenshot of simulation runs
        await page.screenshot({ path: 'test-results/simulation-runs.png' });

        // 3. View Logs
        await viewLogsButton.click();

        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);

        // 4. Verify logs are displayed - page should update
        await page.screenshot({ path: 'test-results/simulation-logs.png' });
    });

    test('should display simulation tab', async ({ page }) => {
        // Verify simulation tab is accessible
        await expect(page.locator('button:has-text("Start Simulation")')).toBeVisible();
        await expect(page.locator('h2:has-text("Simulation")')).toBeVisible();
        await expect(page.locator('h3:has-text("Previous Runs")')).toBeVisible();

        await page.screenshot({ path: 'test-results/simulation-tab.png' });
    });
});
