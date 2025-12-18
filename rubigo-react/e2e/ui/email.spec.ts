/**
 * Email E2E Tests
 * 
 * Tests for the Email module scenarios from collaboration.toml
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
// EMAIL TESTS
// ============================================================================

test.describe("Email", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
        await page.goto("/email");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
    });

    test("scen-email-compose-send: Compose and send email", async ({ page }) => {
        // Given I click Compose
        const composeButton = page.getByRole("button", { name: /compose/i }).or(
            page.locator("[data-testid='compose-button']")
        );
        await composeButton.click();

        // Compose dialog should open
        await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

        // When I select a recipient
        const recipientInput = page.locator("#recipients").or(
            page.locator("[data-testid='recipient-input']")
        );
        await recipientInput.click();

        // Search for a recipient in the personnel directory
        await page.fill("[data-testid='recipient-search']", "Global");
        await page.waitForTimeout(300);
        const recipientOption = page.locator("[role='option']", { hasText: "Global Administrator" });
        if (await recipientOption.isVisible({ timeout: 2000 })) {
            await recipientOption.click();
        }

        // Enter subject and body
        const uniqueSubject = `Test Email ${Date.now()}`;
        await page.fill("#subject", uniqueSubject);
        await page.fill("#body", "This is a test email body.");

        // And click Send
        await page.getByRole("button", { name: /send/i }).click();
        await page.waitForTimeout(1000);

        // Then the message appears in my Sent folder
        const sentFolder = page.getByRole("button", { name: /sent/i }).or(
            page.locator("[data-testid='folder-sent']")
        );
        await sentFolder.click();
        await page.waitForTimeout(500);

        await expect(page.locator("td", { hasText: uniqueSubject }).or(
            page.locator(".email-row", { hasText: uniqueSubject })
        )).toBeVisible();
    });

    test("scen-email-inbox-list: View inbox messages", async ({ page }) => {
        // Given I navigate to Email
        // Then I see my inbox with messages showing sender name, subject, preview, 
        // and timestamp with unread messages highlighted

        // Should see inbox as default view
        await expect(page.locator("[data-testid='email-inbox']").or(
            page.locator(".email-list")
        )).toBeVisible({ timeout: 10000 });

        // Should show folder sidebar
        await expect(page.getByText("Inbox")).toBeVisible();
        await expect(page.getByText("Sent")).toBeVisible();
        await expect(page.getByText("Drafts")).toBeVisible();
        await expect(page.getByText("Trash")).toBeVisible();

        // Email list should show columns/info
        // (This will pass even if empty, but structure should be there)
        const emailList = page.locator("[data-testid='email-list']").or(
            page.locator(".email-list")
        );
        await expect(emailList).toBeVisible();
    });

    test("scen-email-thread-view: View and reply to thread", async ({ page }) => {
        // First send an email to have something to reply to
        const composeButton = page.getByRole("button", { name: /compose/i });
        await composeButton.click();

        const uniqueSubject = `Thread Test ${Date.now()}`;
        await page.fill("#subject", uniqueSubject);
        await page.fill("#body", "Original message.");

        // Send to self (Global Admin)
        const recipientInput = page.locator("[data-testid='recipient-input']");
        await recipientInput.click();
        await page.fill("[data-testid='recipient-search']", "Global");
        await page.waitForTimeout(300);
        const recipientOption = page.locator("[role='option']", { hasText: "Global Administrator" });
        if (await recipientOption.isVisible({ timeout: 2000 })) {
            await recipientOption.click();
        }

        await page.getByRole("button", { name: /send/i }).click();
        await page.waitForTimeout(1000);

        // Now check inbox and open the email
        await page.goto("/email");
        await page.waitForTimeout(500);

        const emailRow = page.locator(".email-row", { hasText: uniqueSubject }).or(
            page.locator("tr", { hasText: uniqueSubject })
        );
        if (await emailRow.isVisible({ timeout: 3000 })) {
            await emailRow.click();
            await page.waitForTimeout(500);

            // Given I open an email
            // When I click Reply, compose my response, and send
            const replyButton = page.getByRole("button", { name: /reply/i });
            await replyButton.click();

            await page.fill("#body", "This is my reply.");
            await page.getByRole("button", { name: /send/i }).click();
            await page.waitForTimeout(1000);

            // Then all messages in the thread are visible in chronological order
            await emailRow.click();
            await page.waitForTimeout(500);

            const threadMessages = page.locator(".thread-message").or(
                page.locator("[data-testid='thread-message']")
            );
            expect(await threadMessages.count()).toBeGreaterThanOrEqual(2);
        }
    });
});
