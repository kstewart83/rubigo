import { test, expect } from '@playwright/test';

test('homepage has title and basic navigation', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Rubigo/);

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'test-results/homepage.png' });

    // Click on Components in sidebar using href selector
    await page.locator('a[href="/?tab=components"]').first().click();
    await expect(page).toHaveURL(/tab=components/);

    // Take a screenshot of components
    await page.screenshot({ path: 'test-results/components.png' });
});
