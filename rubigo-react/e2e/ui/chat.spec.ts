/**
 * Chat E2E Tests
 * 
 * Tests for the Chat module scenarios from collaboration.toml
 * Following TDD approach - tests written before implementation
 */

import { test, expect, Page } from "@playwright/test";

/**
 * Helper: Sign in as Global Administrator
 */
async function signInAsAdmin(page: Page) {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const signInButton = page.getByRole("button", { name: /sign in/i });
    if (await signInButton.isVisible({ timeout: 2000 })) {
        await signInButton.click();
        await expect(page.getByText("Sign In as Persona")).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(1000);
        const adminButton = page.locator("button").filter({ hasText: "Global Administrator" }).first();
        await expect(adminButton).toBeVisible({ timeout: 5000 });
        await adminButton.click();
        await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        await page.waitForLoadState("networkidle");
    }
}

// ============================================================================
// CHAT TESTS
// ============================================================================

test.describe("Chat", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
        await page.goto("/chat");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
    });

    test("scen-chat-dm-conversation: Start direct message", async ({ page }) => {
        // Given I click New Message
        const newMessageButton = page.getByRole("button", { name: /new message|new dm/i }).or(
            page.locator("[data-testid='new-dm-button']")
        );
        await newMessageButton.click();

        // When I select a colleague
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

        const personSearch = page.locator("[data-testid='person-search']").or(
            page.getByPlaceholder(/search.*person/i)
        );
        await personSearch.fill("Global Administrator");
        await page.waitForTimeout(300);

        const personOption = page.locator("[role='option']", { hasText: "Global Administrator" }).or(
            page.locator("button", { hasText: "Global Administrator" })
        );
        await personOption.click();
        await page.waitForTimeout(500);

        // And send a message
        const uniqueMessage = `Test DM ${Date.now()}`;
        const messageInput = page.locator("[data-testid='message-input']").or(
            page.getByPlaceholder(/message/i)
        );
        await messageInput.fill(uniqueMessage);

        const sendButton = page.getByRole("button", { name: /send/i }).or(
            page.locator("[data-testid='send-button']")
        );
        await sendButton.click();
        await page.waitForTimeout(500);

        // Then a DM conversation is created and the message appears
        await expect(page.locator(".chat-message", { hasText: uniqueMessage }).or(
            page.locator("[data-testid='message-bubble']", { hasText: uniqueMessage })
        )).toBeVisible();
    });

    test("scen-chat-channel-create: Create new channel", async ({ page }) => {
        // Given I click Create Channel
        const createChannelButton = page.getByRole("button", { name: /create channel|new channel/i }).or(
            page.locator("[data-testid='create-channel-button']")
        );
        await createChannelButton.click();

        // When I enter a name and description
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

        const uniqueChannelName = `test-channel-${Date.now()}`;
        await page.fill("#channel-name", uniqueChannelName);
        await page.fill("#channel-description", "A test channel for E2E testing");

        await page.getByRole("button", { name: /create/i }).click();
        await page.waitForTimeout(1000);

        // Then the channel appears in my channel list
        const channelList = page.locator("[data-testid='channel-list']").or(
            page.locator(".channel-list")
        );
        await expect(channelList.locator("text=" + uniqueChannelName)).toBeVisible();
    });

    test("scen-chat-react: React to message", async ({ page }) => {
        // First, ensure we have a DM or channel with a message
        // Navigate to an existing conversation or create one
        const newMessageButton = page.getByRole("button", { name: /new message|new dm/i });
        await newMessageButton.click();

        const personSearch = page.locator("[data-testid='person-search']");
        await personSearch.fill("Global Administrator");
        await page.waitForTimeout(300);
        await page.locator("[role='option']", { hasText: "Global Administrator" }).click();
        await page.waitForTimeout(500);

        // Send a message to react to
        const testMessage = `React to me ${Date.now()}`;
        const messageInput = page.locator("[data-testid='message-input']");
        await messageInput.fill(testMessage);
        await page.getByRole("button", { name: /send/i }).click();
        await page.waitForTimeout(500);

        // Given I hover over a message
        const messageBubble = page.locator(".chat-message", { hasText: testMessage }).or(
            page.locator("[data-testid='message-bubble']", { hasText: testMessage })
        );
        await messageBubble.hover();

        // When I click Add Reaction and select an emoji
        const addReactionButton = page.locator("[data-testid='add-reaction']").or(
            page.getByRole("button", { name: /react|emoji/i })
        );
        await addReactionButton.click();

        // Select an emoji (e.g., thumbs up)
        const thumbsUp = page.locator("[data-emoji='👍']").or(
            page.locator("button", { hasText: "👍" })
        );
        await thumbsUp.click();
        await page.waitForTimeout(500);

        // Then the reaction appears under the message
        await expect(page.locator(".reaction", { hasText: "👍" }).or(
            page.locator("[data-testid='reaction']", { hasText: "👍" })
        )).toBeVisible();
    });

    test("scen-chat-thread: Reply in thread", async ({ page }) => {
        // First, create a message to reply to
        const newMessageButton = page.getByRole("button", { name: /new message|new dm/i });
        await newMessageButton.click();

        const personSearch = page.locator("[data-testid='person-search']");
        await personSearch.fill("Global Administrator");
        await page.waitForTimeout(300);
        await page.locator("[role='option']", { hasText: "Global Administrator" }).click();
        await page.waitForTimeout(500);

        const parentMessage = `Thread parent ${Date.now()}`;
        const messageInput = page.locator("[data-testid='message-input']");
        await messageInput.fill(parentMessage);
        await page.getByRole("button", { name: /send/i }).click();
        await page.waitForTimeout(500);

        // Given I click Reply on a message
        const messageBubble = page.locator(".chat-message", { hasText: parentMessage });
        await messageBubble.hover();

        const replyButton = page.locator("[data-testid='reply-in-thread']").or(
            page.getByRole("button", { name: /reply.*thread/i })
        );
        await replyButton.click();
        await page.waitForTimeout(500);

        // When I type and send my response
        const threadReply = `Thread reply ${Date.now()}`;
        const threadInput = page.locator("[data-testid='thread-input']").or(
            page.locator(".thread-panel").getByPlaceholder(/reply/i)
        );
        await threadInput.fill(threadReply);

        const sendThreadButton = page.locator(".thread-panel").getByRole("button", { name: /send/i });
        await sendThreadButton.click();
        await page.waitForTimeout(500);

        // Then it appears in a threaded view under the original message
        const threadPanel = page.locator("[data-testid='thread-panel']").or(
            page.locator(".thread-panel")
        );
        await expect(threadPanel.locator("text=" + parentMessage)).toBeVisible();
        await expect(threadPanel.locator("text=" + threadReply)).toBeVisible();
    });
});
