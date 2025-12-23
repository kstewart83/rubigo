/**
 * E2E Test Helpers
 * 
 * Shared utility functions for E2E tests across all modules.
 * Use these helpers to ensure consistent behavior and reduce duplication.
 */

import { Page, expect } from "@playwright/test";
import { getWebRTCMockScript, setupScreenShareAPIMocks } from "./mocks";

// ============================================================================
// PERSONA HELPERS
// ============================================================================

/**
 * Sign in as a specific persona
 * 
 * @param page - Playwright page
 * @param personaName - Name of the persona to sign in as (e.g., "Global Administrator")
 * @returns Promise that resolves when sign-in is complete
 */
export async function signInAsPersona(page: Page, personaName: string): Promise<void> {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const signInButton = page.getByRole("button", { name: /sign in/i });
    if (await signInButton.isVisible({ timeout: 3000 })) {
        await signInButton.click();
        await expect(page.getByText("Sign In as Persona")).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(500);

        const personaButton = page.locator("button").filter({ hasText: personaName }).first();
        await expect(personaButton).toBeVisible({ timeout: 5000 });
        await personaButton.click();

        await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        await page.waitForLoadState("networkidle");
    }
}

/**
 * Sign in as Global Administrator
 * Convenience function for the most common sign-in case
 */
export async function signInAsAdmin(page: Page): Promise<void> {
    return signInAsPersona(page, "Global Administrator");
}

/**
 * Switch to a different persona while already signed in
 * 
 * @param page - Playwright page
 * @param personaName - Name of the persona to switch to
 */
export async function switchPersona(page: Page, personaName: string): Promise<void> {
    // Click on persona switcher in toolbar
    const personaSwitcher = page.locator("[data-testid='persona-switcher']").or(
        page.getByRole("button", { name: /Global Administrator|Switch Persona/i })
    );
    await personaSwitcher.click();

    await expect(page.getByText("Sign In as Persona")).toBeVisible({ timeout: 5000 });

    const personaButton = page.locator("button").filter({ hasText: personaName }).first();
    await personaButton.click();

    await page.waitForLoadState("networkidle");
}

/**
 * Get current persona name from the UI
 */
export async function getCurrentPersona(page: Page): Promise<string | null> {
    const personaSwitcher = page.locator("[data-testid='persona-name']").or(
        page.locator("[data-testid='current-persona']")
    );

    if (await personaSwitcher.isVisible({ timeout: 2000 })) {
        return personaSwitcher.textContent();
    }
    return null;
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to a module and wait for it to load
 */
export async function navigateToModule(page: Page, modulePath: string, waitForSelector?: string): Promise<void> {
    await page.goto(modulePath);
    if (waitForSelector) {
        await expect(page.locator(waitForSelector)).toBeVisible({ timeout: 10000 });
    } else {
        await page.waitForLoadState("networkidle");
    }
}

// ============================================================================
// DIALOG HELPERS  
// ============================================================================

/**
 * Wait for and interact with a confirmation dialog
 */
export async function confirmDialog(page: Page, buttonText: string = "OK"): Promise<void> {
    const dialog = page.locator("[role='dialog']").or(page.locator("[role='alertdialog']"));
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: buttonText }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
}

/**
 * Cancel a confirmation dialog
 */
export async function cancelDialog(page: Page): Promise<void> {
    const dialog = page.locator("[role='dialog']").or(page.locator("[role='alertdialog']"));
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
}

// ============================================================================
// WEBRTC MOCK HELPERS
// ============================================================================

/**
 * Setup WebRTC mocks for Screen Share E2E tests
 * 
 * This injects mock implementations of RTCPeerConnection, MediaStream, and
 * navigator.mediaDevices.getDisplayMedia into the browser context, along with
 * API route mocks for the SFU endpoints.
 * 
 * @param page - Playwright page instance
 */
export async function setupWebRTCMocks(page: Page): Promise<void> {
    // Inject WebRTC API mocks into browser context
    await page.addInitScript(getWebRTCMockScript());

    // Setup API route mocks
    await setupScreenShareAPIMocks(page);
}

/**
 * Verify that WebRTC mocks are installed in the browser
 * 
 * @param page - Playwright page instance
 * @returns true if mocks are installed
 */
export async function verifyWebRTCMocksInstalled(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
        return (window as unknown as { __WEBRTC_MOCKS_INSTALLED__?: boolean }).__WEBRTC_MOCKS_INSTALLED__ === true;
    });
}

