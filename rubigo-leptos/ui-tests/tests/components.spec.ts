import { test, expect } from '@playwright/test';

test.describe('Component Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?tab=components');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should display component table with data', async ({ page }) => {
        // Verify component table is visible
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // Should have at least one row with component data
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/components-list.png' });
    });

    test('should display component types in table', async ({ page }) => {
        // Check that table header has expected columns
        await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();

        // Screenshot of full component list
        await page.screenshot({ path: 'test-results/components-types.png' });
    });

    test('should have add component form', async ({ page }) => {
        // Verify form elements exist
        await expect(page.locator('input[name="id"]')).toBeVisible();
        await expect(page.locator('input[name="name"]')).toBeVisible();
        // Type is a combobox (select without name)
        await expect(page.locator('select, [role="combobox"]').first()).toBeVisible();
        await expect(page.locator('button:has-text("Add Component")')).toBeVisible();

        await page.screenshot({ path: 'test-results/components-form.png' });
    });
});
