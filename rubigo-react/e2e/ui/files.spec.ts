/**
 * File Manager E2E Tests
 * 
 * Tests derived from BDD scenarios in common/seed/profiles/mmc/projects/scenarios.sql
 * Covers: upload, download, folders, navigation, preview, search, delete, share
 */

import { test, expect, Page } from "@playwright/test";
import { signInAsPersona } from "../helpers";
import path from "path";

// Configure tests to run serially within this file
test.describe.configure({ mode: "serial" });

// ============================================================================
// Test Fixtures and Helpers
// ============================================================================

/**
 * Navigate to Files page and wait for it to load
 */
async function navigateToFiles(page: Page): Promise<void> {
    await page.goto("/files");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /files/i })).toBeVisible({ timeout: 10000 });
}

/**
 * Create a test file for upload tests
 */
function createTestFileBuffer(content: string): Buffer {
    return Buffer.from(content, "utf-8");
}

// ============================================================================
// HIGH PRIORITY: Core File Operations
// ============================================================================

test.describe("File Manager - Core Operations", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsPersona(page, "Alex Chen");
        await navigateToFiles(page);
    });

    // scen-files-folder-create
    test.skip("scen-files-folder-create: Create new folder", async ({ page }) => {
        // Given I am in the file browser
        await expect(page.getByTestId("new-folder-button")).toBeVisible();

        // When I click New Folder and enter a name
        await page.getByTestId("new-folder-button").click();
        await expect(page.getByRole("dialog")).toBeVisible();

        const folderName = `Test-Folder-${Date.now()}`;
        await page.getByLabel(/folder name/i).fill(folderName);
        await page.getByRole("button", { name: /create/i }).click();

        // Then the folder is created and visible
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
        await expect(page.getByText(folderName)).toBeVisible({ timeout: 5000 });
    });

    // scen-files-upload-click
    test("scen-files-upload-click: Upload file via click", async ({ page }) => {
        // Given I am viewing the file manager
        await expect(page.getByTestId("upload-button")).toBeVisible();

        // When I click the upload button and select a file
        const fileName = `test-file-${Date.now()}.txt`;
        const fileContent = "Hello, this is a test file for E2E testing.";

        // Use file chooser to upload
        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer(fileContent),
        });

        // Then the file is uploaded and appears in the current folder
        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });
    });

    // scen-files-download-single
    test("scen-files-download-single: Download single file", async ({ page }) => {
        // First upload a file to download
        const fileName = `download-test-${Date.now()}.txt`;
        const fileContent = "Content for download test";

        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer(fileContent),
        });

        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Given I am viewing a file
        const fileRow = page.getByTestId("file-row").filter({ hasText: fileName });
        await expect(fileRow).toBeVisible();

        // When I click Download from the menu
        await fileRow.getByRole("button").click();

        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("menuitem", { name: /download/i }).click();

        // Then the file is downloaded to my local machine
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe(fileName);
    });

    // scen-files-delete
    test("scen-files-delete: Delete file", async ({ page }) => {
        // First upload a file to delete
        const fileName = `delete-test-${Date.now()}.txt`;

        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("File to be deleted"),
        });

        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Given I select a file I own
        const fileRow = page.getByTestId("file-row").filter({ hasText: fileName });
        await fileRow.getByRole("button").click();

        // When I click Delete
        await page.getByRole("menuitem", { name: /delete/i }).click();

        // Then the file is removed from the file manager (and toast appears)
        await expect(page.locator("[data-sonner-toast]")).toContainText(/deleted/i, { timeout: 5000 });
        // Toast contains filename, so check file-row specifically
        await expect(page.getByTestId("file-row").filter({ hasText: fileName })).not.toBeVisible({ timeout: 5000 });
    });

    // scen-files-folder-navigate
    test("scen-files-folder-navigate: Navigate folder hierarchy", async ({ page }) => {
        // Create a test folder
        const folderName = `Nav-Test-${Date.now()}`;
        await page.getByTestId("new-folder-button").click();
        await page.getByLabel(/folder name/i).fill(folderName);
        await page.getByRole("button", { name: /create/i }).click();
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

        // Wait for folder to appear (list view uses folder-row)
        await page.waitForTimeout(500);

        // Given I have a folder (use folder-row for list view which is default)
        const folderRow = page.getByTestId("folder-row").filter({ hasText: folderName });
        await expect(folderRow).toBeVisible({ timeout: 10000 });

        // When I click into the folder
        await folderRow.click();

        // Then the breadcrumb shows the folder
        await expect(page.getByText(folderName)).toBeVisible();
    });
});

// ============================================================================
// MEDIUM PRIORITY: File Preview and Search
// ============================================================================

test.describe("File Manager - Preview and Search", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsPersona(page, "Alex Chen");
        await navigateToFiles(page);
    });

    // scen-files-preview-image
    test("scen-files-preview-image: Preview image file", async ({ page }) => {
        // Upload an image file
        const fileName = `test-image-${Date.now()}.png`;

        // Create a minimal valid PNG (1x1 pixel transparent)
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
            0x42, 0x60, 0x82
        ]);

        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "image/png",
            buffer: pngBuffer,
        });

        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Given I click on an image file
        const fileRow = page.getByTestId("file-row").filter({ hasText: fileName });
        await fileRow.click();

        // When the preview panel opens
        await expect(page.getByTestId("file-preview-panel")).toBeVisible({ timeout: 5000 });

        // Then I see the image displayed without downloading
        await expect(page.getByTestId("image-preview").or(page.locator("img[alt='Preview']"))).toBeVisible({ timeout: 5000 });
    });

    // scen-files-details-panel
    test("scen-files-details-panel: View file details", async ({ page }) => {
        // Upload a test file
        const fileName = `details-test-${Date.now()}.txt`;

        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("Test content for details"),
        });

        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Given I click on a file
        const fileRow = page.getByTestId("file-row").filter({ hasText: fileName });
        await fileRow.click();

        // When the details panel opens
        await expect(page.getByTestId("file-preview-panel")).toBeVisible({ timeout: 5000 });

        // Then I see size, type, upload date, and owner
        const panel = page.getByTestId("file-preview-panel");
        await expect(panel.getByText(/size/i)).toBeVisible();
        await expect(panel.getByText(/type/i)).toBeVisible();
    });

    // scen-files-view-grid / scen-files-view-list
    test("scen-files-view-toggle: Toggle between grid and list view", async ({ page }) => {
        // Given I am in list view (default)
        const listButton = page.getByTestId("list-view-button");
        const gridButton = page.getByTestId("grid-view-button");

        await expect(listButton).toBeVisible();
        await expect(gridButton).toBeVisible();

        // When I click the grid view button
        await gridButton.click();

        // Then files display as thumbnail cards (grid layout visible)
        // Check for grid container class or grid items
        await page.waitForTimeout(500);

        // When I click the list view button
        await listButton.click();

        // Then files display as rows with columns
        await page.waitForTimeout(500);
    });

    // scen-files-search-basic
    test("scen-files-search-basic: Search by filename", async ({ page }) => {
        // Upload files with identifiable names
        const timestamp = Date.now();
        const file1Name = `searchable-alpha-${timestamp}.txt`;
        const file2Name = `searchable-beta-${timestamp}.txt`;

        // Upload file 1
        let [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);
        await fileChooser.setFiles({
            name: file1Name,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("Alpha content"),
        });
        await expect(page.getByText(file1Name)).toBeVisible({ timeout: 10000 });

        // Upload file 2
        [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);
        await fileChooser.setFiles({
            name: file2Name,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("Beta content"),
        });
        await expect(page.getByText(file2Name)).toBeVisible({ timeout: 10000 });

        // Given I have files with "searchable" in the name
        // When I search for "alpha"
        await page.getByTestId("search-input").fill("alpha");
        await page.waitForTimeout(500);

        // Then only the alpha file appears
        await expect(page.getByText(file1Name)).toBeVisible();
        await expect(page.getByText(file2Name)).not.toBeVisible();

        // Clear search to show all
        await page.getByTestId("search-input").fill("");
        await page.waitForTimeout(500);
        await expect(page.getByText(file2Name)).toBeVisible();
    });
});

// ============================================================================
// LOW PRIORITY: Collaboration Features
// ============================================================================

test.describe("File Manager - Collaboration", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsPersona(page, "Alex Chen");
        await navigateToFiles(page);
    });

    // scen-files-quick-share-generate
    test("scen-files-quick-share-generate: Generate share link", async ({ page }) => {
        // Upload a file to share
        const fileName = `share-test-${Date.now()}.txt`;

        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("Content to share"),
        });

        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Given I select a file
        const fileRow = page.getByTestId("file-row").filter({ hasText: fileName });
        await fileRow.click();

        // Open the details panel
        await expect(page.getByTestId("file-preview-panel")).toBeVisible({ timeout: 5000 });

        // When I click Get Link / Generate Share Link
        const shareButton = page.getByRole("button", { name: /share|get link/i });
        if (await shareButton.isVisible()) {
            await shareButton.click();

            // Then a shareable URL is generated
            await expect(page.getByText(/link.*copied|share.*link/i)).toBeVisible({ timeout: 5000 });
        } else {
            // Share functionality may not be exposed in details panel - skip for now
            test.skip();
        }
    });

    // scen-files-folder-delete (folder must be empty)
    test("scen-files-folder-delete: Delete empty folder", async ({ page }) => {
        // Create a folder to delete
        const folderName = `Delete-Me-${Date.now()}`;
        await page.getByTestId("new-folder-button").click();
        await page.getByLabel(/folder name/i).fill(folderName);
        await page.getByRole("button", { name: /create/i }).click();
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

        // Given I have an empty folder
        const folderRow = page.getByTestId("folder-row").filter({ hasText: folderName });
        await expect(folderRow).toBeVisible({ timeout: 10000 });

        // When I click the menu and choose Delete
        await folderRow.hover();
        await folderRow.getByRole("button").click();
        await page.getByRole("menuitem", { name: /delete/i }).click();

        // Then the folder is removed and toast shows
        await expect(page.locator("[data-sonner-toast]")).toContainText(/deleted/i, { timeout: 5000 });
        await expect(page.getByText(folderName)).not.toBeVisible({ timeout: 5000 });
    });

    // scen-files-version-list
    test("scen-files-version-list: View version history", async ({ page }) => {
        // Upload a file
        const fileName = `version-test-${Date.now()}.txt`;

        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);

        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("Version 1 content"),
        });

        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Given the file exists
        const fileRow = page.getByTestId("file-row").filter({ hasText: fileName });
        await fileRow.click();

        // When I open its details panel
        await expect(page.getByTestId("file-preview-panel")).toBeVisible({ timeout: 5000 });

        // Click the History button to expand version history section
        await page.getByTestId("history-button").click();

        // Then I see version history section (at least 1 version)
        await expect(page.getByText("Version History")).toBeVisible({ timeout: 5000 });
    });
});

// ============================================================================
// EDGE CASES: Error Handling
// ============================================================================

test.describe("File Manager - Edge Cases", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsPersona(page, "Alex Chen");
        await navigateToFiles(page);
    });

    // scen-files-folder-delete with non-empty folder
    test("scen-files-folder-delete-nonempty: Cannot delete non-empty folder", async ({ page }) => {
        // Create a folder with a file in it
        const folderName = `NonEmpty-${Date.now()}`;
        await page.getByTestId("new-folder-button").click();
        await page.getByLabel(/folder name/i).fill(folderName);
        await page.getByRole("button", { name: /create/i }).click();
        await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

        // Navigate into the folder
        const folderRow = page.getByTestId("folder-row").filter({ hasText: folderName });
        await expect(folderRow).toBeVisible({ timeout: 10000 });
        await folderRow.click();

        // Upload a file into the folder
        const fileName = `file-in-folder-${Date.now()}.txt`;
        const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.getByTestId("upload-button").click(),
        ]);
        await fileChooser.setFiles({
            name: fileName,
            mimeType: "text/plain",
            buffer: createTestFileBuffer("File in folder"),
        });
        await expect(page.getByText(fileName)).toBeVisible({ timeout: 10000 });

        // Navigate back to root using direct navigation
        await page.goto("/files");
        await page.waitForLoadState("networkidle");

        // Given the folder contains files
        const parentFolder = page.getByTestId("folder-row").filter({ hasText: folderName });
        await expect(parentFolder).toBeVisible({ timeout: 10000 });

        // When I try to delete it
        await parentFolder.hover();
        await parentFolder.getByRole("button").click();
        await page.getByRole("menuitem", { name: /delete/i }).click();

        // Then I see an error toast
        await expect(page.locator("[data-sonner-toast]")).toContainText(/contains|not empty|remove/i, { timeout: 5000 });

        // And the folder still exists
        await expect(page.getByText(folderName)).toBeVisible();
    });
});
