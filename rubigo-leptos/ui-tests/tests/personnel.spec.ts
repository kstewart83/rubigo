import { test, expect } from '@playwright/test';

test.describe('Personnel Module', () => {
    // Sign in before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        // Handle sign-in if needed
        const signInScreen = page.locator('.sign-in-screen');
        if (await signInScreen.isVisible({ timeout: 2000 }).catch(() => false)) {
            await page.locator('#sign-in-btn').click();
            await expect(page.locator('#dev-overlay')).toHaveClass(/open/);
            await page.locator('.persona-card').first().click();
            // Wait for page to reload after persona selection
            await page.waitForLoadState('domcontentloaded');
            // Small delay to ensure server has processed the session
            await page.waitForTimeout(500);
        }
    });

    test('shows employee directory', async ({ page }) => {
        await page.goto('/?tab=personnel');

        // Should show personnel header
        await expect(page.locator('.personnel-title')).toContainText('Personnel');

        // Should show employee cards
        const cards = page.locator('.employee-card');
        await expect(cards).toHaveCount(18); // 18 employees in the scenario

        // Should show Thomas Anderson (CEO)
        await expect(page.locator('.employee-name').filter({ hasText: 'Thomas Anderson' })).toBeVisible();
    });

    test('search filter works', async ({ page }) => {
        await page.goto('/?tab=personnel');

        // Search for "Chen"
        await page.fill('#employee-search', 'Chen');

        // Should show only matching employees (Mike Chen, Lisa Chen)
        const visibleCards = page.locator('.employee-card:visible');
        await expect(visibleCards).toHaveCount(2);
    });

    test('department filter works', async ({ page }) => {
        await page.goto('/?tab=personnel');

        // Filter by IT department
        await page.selectOption('#department-filter', 'IT');

        // Should show only IT employees (Mike Chen, Sarah Kim, Jason Wright)
        const visibleCards = page.locator('.employee-card:visible');
        await expect(visibleCards).toHaveCount(3);
    });

    test('details panel opens on card click', async ({ page }) => {
        await page.goto('/?tab=personnel');

        // Click on first employee card
        await page.locator('.employee-card').first().click();

        // Details panel should be visible
        await expect(page.locator('#details-panel.open')).toBeVisible();

        // Panel should show employee details
        await expect(page.locator('#panel-name')).not.toBeEmpty();
        await expect(page.locator('#panel-department')).not.toBeEmpty();
    });

    test('photo API returns image for employees with photos', async ({ page, request }) => {
        // First load the page to ensure database is seeded
        await page.goto('/?tab=personnel');

        // Get the list of people from API
        const peopleResponse = await request.get('/api/people');
        expect(peopleResponse.ok()).toBeTruthy();

        const people = await peopleResponse.json();

        // Find Thomas Anderson who should have a photo
        const thomas = people.find((p: any) => p.name === 'Thomas Anderson');
        expect(thomas).toBeTruthy();

        if (thomas && thomas.id) {
            // Extract ID from thing format (e.g., "person:abc123" -> "abc123")
            const idStr = typeof thomas.id === 'string' ? thomas.id : thomas.id.id?.String || thomas.id.id;

            // Try to get the photo
            const photoResponse = await request.get(`/api/people/${idStr}/photo`);

            // Should return an image (status 200) since Thomas has a photo
            expect(photoResponse.status()).toBe(200);
            expect(photoResponse.headers()['content-type']).toBe('image/png');
        }
    });

    test('employee cards show photos for employees with photos', async ({ page }) => {
        await page.goto('/?tab=personnel');

        // Find Thomas Anderson's card - he should have a photo
        const thomasCard = page.locator('.employee-card').filter({ hasText: 'Thomas Anderson' });
        await expect(thomasCard).toBeVisible();

        // The avatar should have the has-photo class
        const avatar = thomasCard.locator('.employee-avatar');
        await expect(avatar).toHaveClass(/has-photo/);

        // The avatar should have a background-image style
        const style = await avatar.getAttribute('style');
        expect(style).toContain('background-image');
        expect(style).toContain('/api/people/');
    });

    test('details panel shows location information', async ({ page }) => {
        await page.goto('/?tab=personnel');

        // Find Thomas Anderson's card - CEO located in Executive Suite
        const thomasCard = page.locator('.employee-card').filter({ hasText: 'Thomas Anderson' });
        await expect(thomasCard).toBeVisible();

        // Click to open details panel
        await thomasCard.click();

        // Details panel should be visible
        await expect(page.locator('#details-panel.open')).toBeVisible();

        // Building should be populated (not "Not assigned")
        const buildingValue = page.locator('#panel-building');
        await expect(buildingValue).toBeVisible();
        const buildingText = await buildingValue.textContent();
        expect(buildingText).toBeTruthy();
        expect(buildingText).not.toBe('Not assigned');
        expect(buildingText).toContain('HQ Main Building');

        // Floor should be populated
        const floorValue = page.locator('#panel-floor');
        await expect(floorValue).toBeVisible();
        const floorText = await floorValue.textContent();
        expect(floorText).toBeTruthy();
        expect(floorText).not.toBe('');

        // Office/Desk should be populated
        const locatorValue = page.locator('#panel-locator');
        await expect(locatorValue).toBeVisible();
        const locatorText = await locatorValue.textContent();
        expect(locatorText).toBeTruthy();
        expect(locatorText).not.toBe('');
        // Should contain locator "300" for Executive Suite
        expect(locatorText).toContain('300');
    });
});
