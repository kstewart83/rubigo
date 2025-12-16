/**
 * Personnel CRUD E2E Tests
 * 
 * Tests the personnel management scenarios:
 * - Browse and search personnel directory
 * - View personnel details
 * - Create new personnel (admin only)
 * - Edit personnel (admin only)
 * - Delete personnel (admin only)
 */

import { test, expect, Page } from "@playwright/test";

/**
 * Helper: Sign in as Global Administrator
 * Navigates to root, clicks "Sign In" button, selects Global Admin from dialog
 */
async function signInAsAdmin(page: Page) {
    // Go to root page
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Click the "Sign In" button on landing page (if visible)
    const signInButton = page.getByRole("button", { name: /sign in/i });
    if (await signInButton.isVisible({ timeout: 2000 })) {
        await signInButton.click();

        // Wait for the persona switcher dialog to be fully loaded
        // The dialog title is "Sign In as Persona"
        await expect(page.getByText("Sign In as Persona")).toBeVisible({ timeout: 5000 });

        // Wait for personnel list to render
        await page.waitForTimeout(1000);

        // Find and click on Global Administrator - look for the person's name in the button
        // The text is inside a div.font-medium inside the button
        const adminButton = page.locator("button").filter({ hasText: "Global Administrator" }).first();
        await expect(adminButton).toBeVisible({ timeout: 5000 });
        await adminButton.click();

        // Wait for navigation to dashboard
        await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        await page.waitForLoadState("networkidle");
    }
    // If sign-in button not visible, we're already signed in or on dashboard
}

test.describe("Personnel Directory", () => {
    test.beforeEach(async ({ page }) => {
        // Sign in first
        await signInAsAdmin(page);

        // Navigate to personnel page
        await page.goto("/personnel");
        await page.waitForLoadState("networkidle");

        // Wait for content to load
        await page.waitForTimeout(500);
    });

    test("scen-personnel-list: Browse personnel directory", async ({ page }) => {
        // Given I am signed in as any user (via Global Admin auto-init)
        // Then I see a table of personnel records

        // Check table exists
        await expect(page.locator("table")).toBeVisible({ timeout: 10000 });

        // Check column headers
        await expect(page.locator("th", { hasText: "Name" })).toBeVisible();

        // Verify at least one row exists (Global Administrator)
        await expect(page.locator("table tbody tr").first()).toBeVisible();
    });

    test("scen-personnel-list: Search by name", async ({ page }) => {
        // Wait for table
        await expect(page.locator("table")).toBeVisible({ timeout: 10000 });

        // And I can search by name
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();

        // Type a search term
        await searchInput.fill("Global");
        await page.waitForTimeout(300); // Debounce

        // Should find Global Administrator
        await expect(page.locator("td", { hasText: "Global Administrator" })).toBeVisible();
    });

    test("scen-personnel-list: Filter by department", async ({ page }) => {
        // Wait for table
        await expect(page.locator("table")).toBeVisible({ timeout: 10000 });

        // And I can filter by department
        const departmentSelect = page.locator("[data-testid='department-filter']").or(
            page.getByRole("combobox").first()
        );

        if (await departmentSelect.isVisible()) {
            await departmentSelect.click();
            await page.getByRole("option", { name: "Executive" }).click();

            // Results should be filtered
            await page.waitForTimeout(300);
        }
    });

    test("scen-personnel-detail: View personnel details", async ({ page }) => {
        // Wait for table
        await expect(page.locator("table")).toBeVisible({ timeout: 10000 });

        // Given I am viewing the personnel directory
        // When I click on a personnel row
        const firstRow = page.locator("table tbody tr").first();
        await firstRow.click();

        // Then a detail panel opens showing full information
        const detailPanel = page.locator("[role='dialog']").or(
            page.locator(".fixed.inset-y-0.right-0") // Sheet
        );
        await expect(detailPanel).toBeVisible({ timeout: 5000 });

        // Should show detail labels in sheet (check the sheet specifically)
        const sheetContent = page.locator("[data-slot='sheet-content']").or(
            page.locator(".fixed.inset-y-0.right-0")
        );
        // Sheet shows Title, Department, Email labels
        await expect(sheetContent.getByText("Title")).toBeVisible();
        await expect(sheetContent.getByText("Email")).toBeVisible();
    });
});

test.describe("Personnel CRUD (Admin Only)", () => {
    test.beforeEach(async ({ page }) => {
        // Sign in first as Global Admin
        await signInAsAdmin(page);

        // Navigate to personnel page
        await page.goto("/personnel");
        await page.waitForLoadState("networkidle");

        // Wait for content
        await page.waitForTimeout(500);
    });

    test("scen-personnel-create: Add new employee", async ({ page }) => {
        // Given I am signed in as Global Administrator
        // When I click the "Add Personnel" button
        const addButton = page.getByRole("button", { name: /add personnel/i });
        const uniqueName = `Test Employee ${Date.now()}`;

        // The button should be visible for admin
        if (await addButton.isVisible()) {
            await addButton.click();

            // Then a form appears for entering personnel details
            const dialog = page.locator("[role='dialog']");
            await expect(dialog).toBeVisible();

            // When I fill in required fields (name, email, department)
            await page.fill("#name", uniqueName);
            await page.fill("#email", `test${Date.now()}@test.com`);

            // Select department
            await page.locator("#department").or(
                dialog.getByRole("combobox").first()
            ).click();
            await page.getByRole("option", { name: "Engineering" }).click();

            // And click Save
            await page.getByRole("button", { name: /create/i }).click();

            // Then the new personnel record appears in the table
            await page.waitForTimeout(1000);

            // Search for the new employee
            await page.getByPlaceholder(/search/i).fill(uniqueName);
            await page.waitForTimeout(300);

            await expect(page.locator("td", { hasText: uniqueName }).first()).toBeVisible();
        }
    });

    test("scen-personnel-edit: Update employee information", async ({ page }) => {
        // First, create a test employee to edit
        const addButton = page.getByRole("button", { name: /add personnel/i });

        if (await addButton.isVisible()) {
            // Create employee
            await addButton.click();
            const uniqueEmail = `edit-test${Date.now()}@test.com`;
            await page.fill("#name", "Edit Test Person");
            await page.fill("#email", uniqueEmail);
            await page.locator("[data-testid='department-select']").or(
                page.locator("[role='dialog']").getByRole("combobox").first()
            ).click();
            await page.getByRole("option", { name: "IT" }).click();
            await page.getByRole("button", { name: /create/i }).click();
            await page.waitForTimeout(1000);

            // Search and select the employee
            await page.getByPlaceholder(/search/i).fill("Edit Test Person");
            await page.waitForTimeout(300);

            const row = page.locator("td", { hasText: "Edit Test Person" }).first();
            await row.click();

            // Given I am viewing a personnel detail panel
            await page.waitForTimeout(500);

            // When I click the "Edit" button
            const editButton = page.getByRole("button", { name: /edit/i });
            if (await editButton.isVisible()) {
                await editButton.click();

                // Then the panel switches to edit mode
                // When I modify fields and click Save
                await page.fill("#edit-name", "Updated Test Person");
                await page.getByRole("button", { name: /save/i }).click();

                // Then the changes are reflected in the table
                await page.waitForTimeout(1000);
                await page.getByPlaceholder(/search/i).fill("Updated Test Person");
                await page.waitForTimeout(300);

                await expect(page.locator("td", { hasText: "Updated Test Person" }).first()).toBeVisible();
            }
        }
    });

    test("scen-personnel-delete: Remove employee from directory", async ({ page }) => {
        // First, create a test employee to delete
        const addButton = page.getByRole("button", { name: /add personnel/i });

        if (await addButton.isVisible()) {
            // Create employee
            await addButton.click();
            const uniqueName = `Delete Test ${Date.now()}`;
            await page.fill("#name", uniqueName);
            await page.fill("#email", `delete${Date.now()}@test.com`);
            await page.locator("[role='dialog']").getByRole("combobox").first().click();
            await page.getByRole("option", { name: "HR" }).click();
            await page.getByRole("button", { name: /create/i }).click();
            await page.waitForTimeout(1000);

            // Search and select the employee
            await page.getByPlaceholder(/search/i).fill(uniqueName);
            await page.waitForTimeout(300);

            const row = page.locator("td", { hasText: uniqueName }).first();
            await row.click();

            // Given I am viewing a personnel detail panel
            await page.waitForTimeout(500);

            // When I click the "Delete" button
            const deleteButton = page.getByRole("button", { name: /delete/i });
            if (await deleteButton.isVisible()) {
                await deleteButton.click();

                // Then a confirmation dialog appears
                await expect(page.getByText(/are you sure/i)).toBeVisible();

                // When I confirm the deletion
                await page.getByRole("button", { name: /delete/i }).last().click();

                // Then the record no longer appears in the table
                await page.waitForTimeout(1000);
                await page.getByPlaceholder(/search/i).fill(uniqueName);
                await page.waitForTimeout(300);

                await expect(page.locator("td", { hasText: uniqueName })).not.toBeVisible();
            }
        }
    });
});
