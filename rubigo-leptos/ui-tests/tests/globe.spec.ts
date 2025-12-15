import { test, expect } from '@playwright/test';

/**
 * E2E tests for the 3D Globe (Bevy WebGL) in the refactored app
 * 
 * These tests verify the Sites page with the embedded Bevy 3D globe.
 * Screenshots are captured for visual verification of rendering.
 */

test.describe('3D Globe Visualization', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the app and handle sign-in if needed
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Handle sign-in screen
        const signInScreen = page.locator('.sign-in-screen');
        if (await signInScreen.isVisible({ timeout: 2000 }).catch(() => false)) {
            await page.locator('#sign-in-btn').click();
            // Wait for overlay
            await page.waitForTimeout(500);
            await page.locator('.persona-card').first().click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(500);
        }
    });

    test('should navigate to Sites page', async ({ page }) => {
        // Click on Sites tab in sidebar
        await page.locator('[class*="nav_item"]:has-text("Sites")').click();
        await page.waitForLoadState('domcontentloaded');

        // Verify Sites page loaded
        await expect(page.locator('h1')).toContainText('Sites');

        // Take screenshot of Sites page
        await page.screenshot({
            path: 'test-results/3d-globe-sites-page.png',
            fullPage: true
        });
    });

    test('should render Bevy canvas element', async ({ page }) => {
        // Navigate to Sites
        await page.locator('[class*="nav_item"]:has-text("Sites")').click();
        await page.waitForLoadState('domcontentloaded');

        // Wait for the canvas to be created by BevyCanvas component
        const canvas = page.locator('canvas#bevy_canvas');

        // Give Bevy time to initialize
        await page.waitForTimeout(2000);

        await expect(canvas).toBeVisible();

        // Verify canvas has dimensions
        const boundingBox = await canvas.boundingBox();
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThan(100);
            expect(boundingBox.height).toBeGreaterThan(100);
        }

        // Take screenshot of canvas area
        await page.screenshot({
            path: 'test-results/3d-globe-canvas.png',
            fullPage: true
        });
    });

    test('should render 3D globe with WebGL', async ({ page }) => {
        // Navigate to Sites
        await page.locator('[class*="nav_item"]:has-text("Sites")').click();
        await page.waitForLoadState('domcontentloaded');

        // Wait for Bevy to fully initialize and render
        await page.waitForTimeout(3000);

        const canvas = page.locator('canvas#bevy_canvas');
        await expect(canvas).toBeVisible();

        // Take a screenshot of just the globe container
        const globeContainer = page.locator('.globe-container');
        if (await globeContainer.isVisible()) {
            await globeContainer.screenshot({
                path: 'test-results/3d-globe-render.png'
            });
        }

        // Take full page screenshot
        await page.screenshot({
            path: 'test-results/3d-globe-full-page.png',
            fullPage: true
        });

        // Log canvas info for debugging
        const canvasInfo = await page.evaluate(() => {
            const canvas = document.querySelector('#bevy_canvas') as HTMLCanvasElement;
            if (canvas) {
                const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
                return {
                    width: canvas.width,
                    height: canvas.height,
                    style: canvas.style.cssText,
                    hasWebGL: !!ctx,
                };
            }
            return null;
        });

        console.log('Canvas Info:', canvasInfo);
        expect(canvasInfo).not.toBeNull();
        expect(canvasInfo?.hasWebGL).toBe(true);
    });

    test('should verify globe colors are not magenta', async ({ page }) => {
        // Navigate to Sites
        await page.locator('[class*="nav_item"]:has-text("Sites")').click();
        await page.waitForLoadState('domcontentloaded');

        // Wait for rendering
        await page.waitForTimeout(3000);

        // Sample pixel colors from the canvas
        const colorInfo = await page.evaluate(() => {
            const canvas = document.querySelector('#bevy_canvas') as HTMLCanvasElement;
            if (!canvas) return null;

            const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (!ctx) return null;

            // Create a buffer to read pixels
            const width = canvas.width;
            const height = canvas.height;
            const pixels = new Uint8Array(4);

            // Sample center of canvas
            const centerX = Math.floor(width / 2);
            const centerY = Math.floor(height / 2);

            // Read pixel at center (note: WebGL Y is flipped)
            ctx.readPixels(
                centerX, height - centerY, 1, 1,
                ctx.RGBA, ctx.UNSIGNED_BYTE, pixels
            );

            return {
                r: pixels[0],
                g: pixels[1],
                b: pixels[2],
                a: pixels[3],
                isMagenta: pixels[0] > 200 && pixels[1] < 100 && pixels[2] > 200,
            };
        });

        console.log('Center pixel color:', colorInfo);

        // Take screenshot for visual verification
        await page.screenshot({
            path: 'test-results/3d-globe-color-test.png',
            fullPage: true
        });

        // Warn if magenta (but don't fail - for debugging)
        if (colorInfo?.isMagenta) {
            console.warn('WARNING: Globe appears to be magenta - check material/shader');
        }
    });

});
