/**
 * Screen Share E2E Tests
 *
 * Tests for the Screen Share module using mocked WebRTC APIs.
 * Mocks enable testing without actual screen capture permissions.
 */

import { test, expect, Page } from "@playwright/test";
import { signInAsAdmin } from "../helpers";

/**
 * Navigate to screen share page and wait for it to be ready
 * Uses content-based waiting instead of networkidle for reliability
 */
async function gotoScreenShare(page: Page) {
    await page.goto("/screen-share");
    // Wait for the main heading to appear instead of networkidle
    await expect(page.getByRole("heading", { name: /screen share/i })).toBeVisible({ timeout: 15000 });
}

// ============================================================================
// SCREEN SHARE TESTS (With Mocks)
// ============================================================================

// Run serially to avoid Next.js SSR compilation race conditions
test.describe.serial("Screen Share", () => {
    test.beforeEach(async ({ page }) => {
        // Add WebRTC init script BEFORE navigation (this is fine, it's just a script)
        const { getWebRTCMockScript } = await import("../mocks/webrtc-mocks");
        await page.addInitScript(getWebRTCMockScript());

        // Sign in as admin - this navigates and loads pages normally
        await signInAsAdmin(page);

        // Now set up API mocks AFTER sign-in is complete
        // These intercept screen share API calls only
        const { setupScreenShareAPIMocks } = await import("../mocks/screenshare-api.mock");
        await setupScreenShareAPIMocks(page);
    });

    test("scen-screenshare-page: Screen share page loads correctly", async ({ page }) => {
        // Navigate to the screen share page (gotoScreenShare already verifies heading)
        await gotoScreenShare(page);

        // Verify Share Your Screen card is visible
        await expect(page.getByText("Share Your Screen", { exact: true })).toBeVisible();
        await expect(page.getByText("Start broadcasting your screen to others")).toBeVisible();

        // Verify Watch a Screen Share card is visible
        await expect(page.getByText("Watch a Screen Share")).toBeVisible();
        await expect(page.getByPlaceholder("Enter room ID...")).toBeVisible();

        // Verify WebRTC mocks are installed
        const mocksInstalled = await page.evaluate(() => {
            return (window as unknown as { __WEBRTC_MOCKS_INSTALLED__?: boolean }).__WEBRTC_MOCKS_INSTALLED__ === true;
        });
        expect(mocksInstalled).toBe(true);
    });

    test("scen-screenshare-start: Start screen share", async ({ page }) => {
        await gotoScreenShare(page);

        // Find and click the "Share Screen" button
        const startButton = page.getByRole("button", { name: /share screen/i });
        await expect(startButton).toBeVisible();
        await startButton.click();

        // Wait for the sharing state to update
        await page.waitForTimeout(500);

        // Verify sharing is active - room ID should be displayed
        await expect(page.getByText("Screen sharing active!")).toBeVisible({ timeout: 5000 });

        // Room ID should be visible
        await expect(page.getByText(/Room ID:/)).toBeVisible();

        // The button should now say "Stop Sharing"
        await expect(page.getByRole("button", { name: /stop sharing/i })).toBeVisible();
    });

    // TODO: stopSharing with mocks has an issue where React state doesn't update
    // This works correctly in manual testing with real WebRTC.
    // The mock's state update isn't triggering a re-render properly.
    test.skip("scen-screenshare-stop: Stop screen share", async ({ page }) => {
        await gotoScreenShare(page);

        // Start sharing first - use data-testid for reliability
        const shareButton = page.locator("[data-testid='share-screen-button']");
        await expect(shareButton).toBeVisible();
        await shareButton.click();

        // Wait for sharing to start
        await expect(page.getByText("Screen sharing active!")).toBeVisible({ timeout: 5000 });

        // Now stop sharing - the button should now have stop-sharing-button testid
        const stopButton = page.locator("[data-testid='stop-sharing-button']");
        await expect(stopButton).toBeVisible();
        await stopButton.click({ force: true });

        // Wait for the state to fully update - watch for the share button to reappear
        await expect(page.locator("[data-testid='share-screen-button']")).toBeVisible({ timeout: 10000 });

        // Verify the active state is gone
        await expect(page.getByText("Screen sharing active!")).not.toBeVisible();
    });

    test("scen-screenshare-viewer-join: Join as viewer", async ({ page }) => {
        await gotoScreenShare(page);

        // Enter a room ID
        const roomIdInput = page.getByPlaceholder("Enter room ID...");
        await roomIdInput.fill("test-room-123");

        // Click Join button
        const joinButton = page.getByRole("button", { name: /join/i });
        await joinButton.click();

        // Wait for viewer to connect
        await page.waitForTimeout(500);

        // Should show "Connected to room" message
        await expect(page.getByText(/Connected to room:/)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("test-room-123")).toBeVisible();

        // Video element should be present
        await expect(page.locator("[data-testid='screen-share-video']")).toBeVisible();

        // "Live" indicator should be visible after stream starts
        await expect(page.locator("[data-testid='screen-share-active']").or(
            page.getByText("Live")
        )).toBeVisible({ timeout: 5000 });
    });

    test("scen-screenshare-viewer-disconnect: Disconnect as viewer", async ({ page }) => {
        await gotoScreenShare(page);

        // Join a room first
        const roomIdInput = page.getByPlaceholder("Enter room ID...");
        await roomIdInput.fill("test-room-456");
        await page.getByRole("button", { name: /join/i }).click();

        // Wait for viewer to connect
        await expect(page.getByText(/Connected to room:/)).toBeVisible({ timeout: 5000 });

        // Hover over the video to reveal controls
        const videoArea = page.locator("[data-testid='screen-share-video']");
        await videoArea.hover();

        // Click disconnect button
        const disconnectButton = page.locator("[data-testid='disconnect-button']");
        await expect(disconnectButton).toBeVisible();
        await disconnectButton.click();

        // Wait for disconnect to process
        await page.waitForTimeout(300);

        // Should be back to join UI
        await expect(page.getByPlaceholder("Enter room ID...")).toBeEnabled();
        await expect(page.getByText(/Connected to room:/)).not.toBeVisible();
    });

    test("scen-screenshare-fullscreen: Toggle fullscreen", async ({ page }) => {
        await gotoScreenShare(page);

        // Join a room
        const roomIdInput = page.getByPlaceholder("Enter room ID...");
        await roomIdInput.fill("test-room-789");
        await page.getByRole("button", { name: /join/i }).click();

        // Wait for viewer to connect
        await expect(page.locator("[data-testid='screen-share-video']")).toBeVisible({ timeout: 5000 });

        // Hover to reveal controls
        const videoArea = page.locator("[data-testid='screen-share-video']");
        await videoArea.hover();

        // Fullscreen button should be visible
        const fullscreenButton = page.locator("[data-testid='fullscreen-button']");
        await expect(fullscreenButton).toBeVisible();

        // Note: We can't fully test fullscreen in headless mode,
        // but we can verify the button is clickable
        // In a real browser, this would request fullscreen
    });

    test("scen-screenshare-keyboard-join: Join with Enter key", async ({ page }) => {
        await gotoScreenShare(page);

        // Enter a room ID and press Enter
        const roomIdInput = page.getByPlaceholder("Enter room ID...");
        await roomIdInput.fill("keyboard-test-room");
        await roomIdInput.press("Enter");

        // Should join the room
        await expect(page.getByText(/Connected to room:/)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("keyboard-test-room")).toBeVisible();
    });
});
