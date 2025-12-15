import { test, expect } from '@playwright/test';

test.describe('Connection Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?tab=connections');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should display connections page', async ({ page }) => {
        // Verify page loaded - main heading
        await expect(page.locator('h2:has-text("Connections")')).toBeVisible();

        // Verify table exists
        const table = page.locator('table');
        await expect(table).toBeVisible();

        await page.screenshot({ path: 'test-results/connections-list.png' });
    });

    test('should have component selectors', async ({ page }) => {
        // Verify the from/to selects exist (comboboxes)
        const selects = page.locator('select, [role="combobox"]');
        const selectCount = await selects.count();
        expect(selectCount).toBeGreaterThanOrEqual(2);

        // Verify Add Connection button exists
        await expect(page.locator('button:has-text("Add Connection")')).toBeVisible();

        await page.screenshot({ path: 'test-results/connections-selectors.png' });
    });

    test('should display existing connections in table', async ({ page }) => {
        // Verify table has headers
        await expect(page.getByRole('columnheader', { name: 'From' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'To' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();

        // Verify we have at least one connection row
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/connections-table.png' });
    });
});
