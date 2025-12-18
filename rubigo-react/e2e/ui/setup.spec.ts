/**
 * E2E Setup - System Initialization
 * 
 * This test MUST run first and successfully initialize the system
 * before any other E2E tests can proceed. It uses the API for reliable
 * initialization since the BIP39 autocomplete UI is complex to automate.
 */

import { test, expect } from "@playwright/test";

// The init token is read from environment variable (set by run-e2e.ts script)
const INIT_TOKEN = process.env.E2E_INIT_TOKEN ?? "";
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("System Setup", () => {
    test("initialize system via API", async ({ request }) => {
        // This test MUST pass for other tests to run
        const tokenWords = INIT_TOKEN.split(" ");
        test.fail(tokenWords.length !== 4, `E2E_INIT_TOKEN invalid: "${INIT_TOKEN}"`);

        // Check if system is already initialized
        const statusResponse = await request.get(`${BASE_URL}/api/init`);
        const statusData = await statusResponse.json();

        if (statusData.initialized) {
            // Already initialized, skip
            return;
        }

        // Initialize via API
        const initResponse = await request.post(`${BASE_URL}/api/init`, {
            data: { words: tokenWords },
        });

        expect(initResponse.ok()).toBe(true);
        const initData = await initResponse.json();
        expect(initData.success).toBe(true);

        // Verify initialization
        const verifyResponse = await request.get(`${BASE_URL}/api/init`);
        const verifyData = await verifyResponse.json();
        expect(verifyData.initialized).toBe(true);
    });

    test("verify Sign In is available", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const signInButton = page.getByRole("button", { name: "Sign In" });
        await expect(signInButton).toBeVisible({ timeout: 10000 });
    });

    test("sign in as Global Administrator", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const signInButton = page.getByRole("button", { name: "Sign In" });
        await expect(signInButton).toBeVisible({ timeout: 5000 });

        await signInButton.click();
        await expect(page.getByText("Sign In as Persona")).toBeVisible({ timeout: 5000 });

        const adminButton = page.locator("button").filter({ hasText: "Global Administrator" }).first();
        await adminButton.click();

        await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
        await expect(page.getByText("Global Administrator")).toBeVisible();
    });
});
