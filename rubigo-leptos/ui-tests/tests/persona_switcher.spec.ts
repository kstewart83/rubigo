import { test, expect } from '@playwright/test';

test.describe('User Session UI', () => {
    test.beforeEach(async ({ page }) => {
        // Clear persona by calling DELETE endpoint
        await page.request.delete('http://localhost:3000/api/persona').catch(() => { });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should show sign-in screen when not authenticated', async ({ page }) => {
        // Sign-in screen should be visible
        await expect(page.locator('.sign-in-screen')).toBeVisible();
        await expect(page.locator('.sign-in-title')).toContainText('Welcome to Rubigo');
        await expect(page.locator('#sign-in-btn')).toBeVisible();

        await page.screenshot({ path: 'test-results/sign-in-screen.png' });
    });

    test('should open persona selector when clicking Sign In', async ({ page }) => {
        // Click Sign In button
        await page.locator('#sign-in-btn').click();

        // Persona overlay should open
        await expect(page.locator('#dev-overlay')).toHaveClass(/open/);
        await expect(page.locator('.dev-overlay-header h2')).toContainText('Select Identity');

        await page.screenshot({ path: 'test-results/persona-selector-open.png' });
    });

    test('should close persona selector with close button', async ({ page }) => {
        // Open the overlay
        await page.locator('#sign-in-btn').click();
        await expect(page.locator('#dev-overlay')).toHaveClass(/open/);

        // Click close button
        await page.locator('#dev-overlay-close').click();

        // Overlay should close
        await expect(page.locator('#dev-overlay')).not.toHaveClass(/open/);
    });

    test('should close persona selector with Escape key', async ({ page }) => {
        // Open the overlay
        await page.locator('#sign-in-btn').click();
        await expect(page.locator('#dev-overlay')).toHaveClass(/open/);

        // Press Escape
        await page.keyboard.press('Escape');

        // Overlay should close
        await expect(page.locator('#dev-overlay')).not.toHaveClass(/open/);
    });

    test('should toggle persona selector with Ctrl+Shift+D', async ({ page }) => {
        // Press Ctrl+Shift+D to open
        await page.keyboard.press('Control+Shift+D');

        // Overlay should open
        await expect(page.locator('#dev-overlay')).toHaveClass(/open/);

        // Press again to close
        await page.keyboard.press('Control+Shift+D');

        // Overlay should close
        await expect(page.locator('#dev-overlay')).not.toHaveClass(/open/);
    });

    test('should select persona and show user session widget', async ({ page }) => {
        // Click Sign In button
        await page.locator('#sign-in-btn').click();
        await expect(page.locator('#dev-overlay')).toHaveClass(/open/);

        // Click first persona card
        await page.locator('.persona-card').first().click();

        // Wait for page reload
        await page.waitForLoadState('domcontentloaded');

        // User session widget should be visible in header
        await expect(page.locator('#user-session-widget')).toBeVisible();
        await expect(page.locator('.user-name')).toBeVisible();

        // Sign-in screen should not be visible
        await expect(page.locator('.sign-in-screen')).not.toBeVisible();

        await page.screenshot({ path: 'test-results/signed-in-state.png' });
    });

    test('should open user dropdown menu', async ({ page }) => {
        // First sign in
        await page.locator('#sign-in-btn').click();
        await page.locator('.persona-card').first().click();
        await page.waitForLoadState('domcontentloaded');

        // Click user session trigger
        await page.locator('#user-session-trigger').click();

        // Dropdown should be visible
        await expect(page.locator('#user-dropdown')).toHaveClass(/open/);
        await expect(page.locator('#switch-persona-btn')).toBeVisible();
        await expect(page.locator('#sign-out-btn')).toBeVisible();

        await page.screenshot({ path: 'test-results/user-dropdown-open.png' });
    });

    test('should open persona selector from Switch Persona button', async ({ page }) => {
        // Sign in first
        await page.locator('#sign-in-btn').click();
        await page.locator('.persona-card').first().click();
        await page.waitForLoadState('domcontentloaded');

        // Open dropdown and click Switch Persona
        await page.locator('#user-session-trigger').click();
        await page.locator('#switch-persona-btn').click();

        // Persona overlay should open
        await expect(page.locator('#dev-overlay')).toHaveClass(/open/);
    });

    test('should sign out and return to sign-in screen', async ({ page }) => {
        // Sign in first
        await page.locator('#sign-in-btn').click();
        await page.locator('.persona-card').first().click();
        await page.waitForLoadState('domcontentloaded');

        // Open dropdown and click Sign Out
        await page.locator('#user-session-trigger').click();
        await page.locator('#sign-out-btn').click();

        // Wait for page reload
        await page.waitForLoadState('domcontentloaded');

        // Sign-in screen should be visible again
        await expect(page.locator('.sign-in-screen')).toBeVisible();

        await page.screenshot({ path: 'test-results/signed-out-state.png' });
    });
});
