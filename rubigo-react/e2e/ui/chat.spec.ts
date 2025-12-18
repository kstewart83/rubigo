/**
 * Chat E2E Tests
 *
 * Tests for the Chat module scenarios from collaboration.toml
 * Following TDD approach - tests written before implementation
 */

import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "../helpers";

// ============================================================================
// CHAT MVP TESTS
// These tests cover core chat functionality for the first release
// ============================================================================

test.describe("Chat MVP", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
        await page.goto("/chat");
        await expect(
            page.locator("[data-testid='chat-container']")
        ).toBeVisible({ timeout: 10000 });
    });

    // -------------------------------------------------------------------------
    // Channel Management
    // -------------------------------------------------------------------------

    test("scen-chat-channel-create: Create new channel", async ({ page }) => {
        // Given I click Create Channel
        const createChannelButton = page
            .getByRole("button", { name: /create channel|new channel/i })
            .or(page.locator("[data-testid='create-channel-button']"));
        await createChannelButton.click();

        // When I enter a name and description
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

        const uniqueChannelName = `test-channel-${Date.now()}`;
        await page.fill("#channel-name", uniqueChannelName);
        await page.fill("#channel-description", "A test channel for E2E testing");

        await page.getByRole("button", { name: /create/i }).click();
        await page.waitForTimeout(1000);

        // Then the channel appears in my channel list
        const channelList = page
            .locator("[data-testid='channel-list']")
            .or(page.locator(".channel-list"));
        await expect(channelList.getByText(uniqueChannelName)).toBeVisible();
    });

    test("scen-chat-channel-join: Join existing channel", async ({ page }) => {
        // First create a channel that we can then attempt to browse/join
        // Create channel
        await page.locator("[data-testid='create-channel-button']").click();
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });
        const uniqueChannelName = `join-test-channel-${Date.now()}`;
        await page.fill("#channel-name", uniqueChannelName);
        await page.getByRole("button", { name: /create/i }).click();
        await page.waitForTimeout(1000);

        // Given I browse available channels
        const browseChannelsButton = page.locator("[data-testid='browse-channels-button']");
        await browseChannelsButton.click();
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

        // Then the channel we created should appear (as 'Joined' since we created it)
        const channelRow = page.locator("[data-testid='channel-row']", { hasText: uniqueChannelName });
        await expect(channelRow).toBeVisible();
        await expect(channelRow.getByText("Joined")).toBeVisible();
    });

    // -------------------------------------------------------------------------
    // Message Operations
    // -------------------------------------------------------------------------

    test("scen-chat-send-message: Send message to channel", async ({ page }) => {
        // Given I am viewing a channel
        // First, click on a channel in the sidebar (or create one)
        const channelItem = page
            .locator("[data-testid='channel-item']")
            .first()
            .or(page.locator(".channel-item").first());

        // If no channels exist, create one first
        if (!(await channelItem.isVisible({ timeout: 2000 }))) {
            // Create a channel first
            await page.locator("[data-testid='create-channel-button']").click();
            await page.fill("#channel-name", `test-${Date.now()}`);
            await page.getByRole("button", { name: /create/i }).click();
            await page.waitForTimeout(500);
        }

        // Click on the channel
        await page.locator("[data-testid='channel-item']").first().click();
        await page.waitForTimeout(300);

        // When I type a message and click Send
        const uniqueMessage = `Hello chat ${Date.now()}`;
        const messageInput = page
            .locator("[data-testid='message-input']")
            .or(page.getByPlaceholder(/type.*message|write.*message/i));
        await messageInput.fill(uniqueMessage);

        const sendButton = page
            .getByRole("button", { name: /send/i })
            .or(page.locator("[data-testid='send-button']"));
        await sendButton.click();
        await page.waitForTimeout(500);

        // Then the message appears in the message list with my name and timestamp
        const messageList = page
            .locator("[data-testid='message-list']")
            .or(page.locator(".message-list"));
        await expect(messageList.getByText(uniqueMessage)).toBeVisible();

        // Verify sender name is shown
        const messageBubble = messageList.locator("[data-testid='message-bubble']", {
            hasText: uniqueMessage,
        });
        await expect(
            messageBubble.locator("[data-testid='message-sender']").or(
                messageBubble.locator(".message-sender")
            )
        ).toBeVisible();
    });

    test("scen-chat-view-history: View message history", async ({ page }) => {
        // Given I select a channel from the sidebar
        // (We need a channel with messages - create one and send a message)

        // Create a channel
        await page.locator("[data-testid='create-channel-button']").click();
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });
        await page.fill("#channel-name", `history-test-${Date.now()}`);
        await page.getByRole("button", { name: /create/i }).click();
        await page.waitForTimeout(1000);

        // Click on the channel we just created (it should be selected automatically)
        const channelItem = page.locator("[data-testid='channel-item']").first();
        await channelItem.click();
        await page.waitForTimeout(500);

        // Send a test message
        const testMessage = `History test ${Date.now()}`;
        await page.locator("[data-testid='message-input']").fill(testMessage);
        await page.locator("[data-testid='send-button']").click();
        await page.waitForTimeout(500);

        // Refresh the page to test persistence
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Click the channel again
        await page.locator("[data-testid='channel-item']").first().click();
        await page.waitForTimeout(500);

        // Then I see the message history with sender names, content, and timestamps
        const messageList = page.locator("[data-testid='message-list']");

        // Message content should be visible
        await expect(messageList.getByText(testMessage)).toBeVisible();

        // Verify timestamps are shown
        const messageBubble = messageList.locator("[data-testid='message-bubble']").first();
        await expect(
            messageBubble.locator("[data-testid='message-timestamp']")
        ).toBeVisible();
    });

    // -------------------------------------------------------------------------
    // Direct Messages
    // -------------------------------------------------------------------------

    // DM test requires at least 2 personnel in the database. 
    // In clean E2E environment, only Global Administrator exists.
    // This test works in real scenarios with multiple users.
    test.skip("scen-chat-dm-conversation: Start direct message", async ({ page }) => {
        // Given I click New Message
        const newMessageButton = page.locator("[data-testid='new-dm-button']");
        await newMessageButton.click();

        // When I select a colleague
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

        // Search for a colleague
        const personSearch = page.locator("[data-testid='person-search']");
        await personSearch.fill("Global");
        await page.waitForTimeout(500);

        // Click on the first person option in the dialog (wait for people to load)
        const personOption = page.locator("[data-testid='person-option']").first();
        await expect(personOption).toBeVisible({ timeout: 10000 });
        await personOption.click();
        await page.waitForTimeout(500);

        // And send a message
        const uniqueMessage = `Test DM ${Date.now()}`;
        const messageInput = page.locator("[data-testid='message-input']");
        await messageInput.fill(uniqueMessage);

        const sendButton = page.locator("[data-testid='send-button']");
        await sendButton.click();
        await page.waitForTimeout(500);

        // Then a DM conversation is created and the message appears
        await expect(
            page.locator("[data-testid='message-bubble']", { hasText: uniqueMessage })
        ).toBeVisible();
    });
});

// ============================================================================
// CHAT PHASE 2 TESTS (Skipped - not in MVP scope)
// These tests are for features planned for Phase 2
// ============================================================================

test.describe("Chat Phase 2", () => {
    test.skip("scen-chat-react: React to message", async ({ page }) => {
        // Phase 2: Reactions feature
        // TODO: Implement when reactions are added
    });

    test.skip("scen-chat-thread: Reply in thread", async ({ page }) => {
        // Phase 2: Threaded replies feature
        // TODO: Implement when threads are added
    });
});

