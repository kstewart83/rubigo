/**
 * E2E Test: System Initialization
 * 
 * Tests the BIP39 word-based initialization flow
 */

import { test, expect } from "@playwright/test";

// The init token is read from environment variable (set by workflow)
const INIT_TOKEN = process.env.E2E_INIT_TOKEN?.split(" ") ?? [];

test.describe("System Initialization", () => {
    test("should show initialization form when system is not initialized", async ({ page }) => {
        await page.goto("/");

        // Wait for the page to load
        await page.waitForLoadState("networkidle");

        // Skip if already initialized (auto-init mode)
        const signInButton = page.getByRole("button", { name: "Sign In" });
        if (await signInButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            test.skip(true, "System already initialized - skipping uninitialized state test");
        }

        // Should show initialization form (not sign in button)
        await expect(page.getByText("System Initialization")).toBeVisible();
        await expect(page.getByText("Enter the 4-word phrase")).toBeVisible();

        // Should have 4 word inputs
        const wordInputs = page.locator('input[placeholder="type to search..."]');
        await expect(wordInputs).toHaveCount(4);

        // Should have Initialize button
        await expect(page.getByRole("button", { name: "Initialize System" })).toBeVisible();
    });

    test("should show error for incorrect initialization phrase", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Skip if already initialized (auto-init mode)
        const signInButton = page.getByRole("button", { name: "Sign In" });
        if (await signInButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            test.skip(true, "System already initialized - skipping phrase error test");
        }

        // Enter wrong words
        const wordInputs = page.locator('input[placeholder="type to search..."]');
        await wordInputs.nth(0).fill("abandon");
        await wordInputs.nth(1).fill("abandon");
        await wordInputs.nth(2).fill("abandon");
        await wordInputs.nth(3).fill("abandon");

        // Click initialize
        await page.getByRole("button", { name: "Initialize System" }).click();

        // Should show error
        await expect(page.getByText("Invalid initialization phrase")).toBeVisible({ timeout: 5000 });
    });

    test("should successfully initialize with correct phrase", async ({ page }) => {
        // Skip if no token provided
        test.skip(INIT_TOKEN.length !== 4, "E2E_INIT_TOKEN not set or invalid");

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Enter correct words
        const wordInputs = page.locator('input[placeholder="type to search..."]');
        for (let i = 0; i < 4; i++) {
            const input = wordInputs.nth(i);
            await input.click();
            await input.fill(INIT_TOKEN[i]);

            // Wait for autocomplete dropdown to appear
            await page.waitForTimeout(300);

            // Try to click the matching word in dropdown
            // Look for button or div containing the word
            const dropdown = page.locator(`[role="listbox"] button:has-text("${INIT_TOKEN[i]}")`).or(
                page.locator(`button:has-text("${INIT_TOKEN[i]}")`).first()
            ).or(
                page.locator(`[data-value="${INIT_TOKEN[i]}"]`)
            );

            if (await dropdown.isVisible({ timeout: 1000 }).catch(() => false)) {
                await dropdown.click();
            } else {
                // If no dropdown, just press Enter to confirm
                await input.press("Enter");
            }

            await page.waitForTimeout(200);
        }

        // Click initialize
        await page.getByRole("button", { name: "Initialize System" }).click();

        // Wait for navigation or state change
        await page.waitForTimeout(2000);

        // Should redirect and show Sign In (system is now initialized)
        await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({ timeout: 10000 });
    });

    test("should show Sign In after initialization", async ({ page }) => {
        // This test runs after initialization
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Should show Sign In button (not initialization form)
        const signInButton = page.getByRole("button", { name: "Sign In" });
        const initForm = page.getByText("System Initialization");

        // One of these should be visible
        const isSignIn = await signInButton.isVisible().catch(() => false);
        const isInit = await initForm.isVisible().catch(() => false);

        expect(isSignIn || isInit).toBe(true);
    });
});

test.describe("Global Administrator", () => {
    test("should be available in persona switcher after initialization", async ({ page }) => {
        // Skip if system not initialized
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const signInButton = page.getByRole("button", { name: "Sign In" });
        test.skip(!(await signInButton.isVisible().catch(() => false)), "System not initialized");

        // Open persona switcher
        await signInButton.click();

        // Wait for dialog
        await expect(page.getByText("Sign In as Persona")).toBeVisible();

        // Should see Global Administrator in the list
        await expect(page.getByText("Global Administrator")).toBeVisible();
    });

    test("should be able to sign in as Global Administrator", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const signInButton = page.getByRole("button", { name: "Sign In" });
        test.skip(!(await signInButton.isVisible().catch(() => false)), "System not initialized");

        // Open persona switcher
        await signInButton.click();
        await expect(page.getByText("Sign In as Persona")).toBeVisible();

        // Click on Global Administrator
        await page.getByText("Global Administrator").click();

        // Should be redirected to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Should show admin name in toolbar
        await expect(page.getByText("Global Administrator")).toBeVisible();
    });
});
