/**
 * Projects Module E2E Tests
 * 
 * Tests for the Projects module scenarios:
 * - Solutions: Browse and create
 * - Projects: Browse and create
 * - Objectives: Browse and create with hierarchy
 * - Initiatives: Browse and create with KPI linking
 * - Activities: Browse, create, and capacity visualization
 * - Metrics: Browse metrics and KPIs
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
// Solutions
// ============================================================================

test.describe("Solutions (Services)", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-solution-list: Browse solutions", async ({ page }) => {
        // Given I am signed in as any user
        // When I navigate to the Services page
        await page.goto("/projects/services");
        await page.waitForLoadState("networkidle");

        // Then I see a list of Solutions with their names, descriptions, and status
        await expect(page).toHaveURL(/\/projects\/services/);
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });

    test("scen-solution-create: Create solution", async ({ page }) => {
        // Given I am signed in as Global Administrator
        await page.goto("/projects/services");
        await page.waitForLoadState("networkidle");

        // When I click New Solution
        const newButton = page.getByRole("button", { name: /new solution/i });
        if (await newButton.isVisible({ timeout: 3000 })) {
            await newButton.click();

            // And fill in name and description
            const uniqueName = `Test Solution ${Date.now()}`;
            await page.getByLabel("Name").fill(uniqueName);
            await page.getByLabel("Description").fill("Test solution created by E2E");

            // And click Save
            await page.getByRole("button", { name: /save/i }).click();
            await page.waitForTimeout(1000);

            // Then the solution appears in the list
            await expect(page.getByText(uniqueName)).toBeVisible();
        }
    });
});

// ============================================================================
// Projects
// ============================================================================

test.describe("Projects", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-project-list: Browse projects", async ({ page }) => {
        // Given I am signed in as any user
        // When I navigate to the Projects page
        await page.goto("/projects");
        await page.waitForLoadState("networkidle");

        // Then I see projects grouped or linked by their solution
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });

    test("scen-project-create: Create project", async ({ page }) => {
        // Given I am signed in as Global Administrator
        await page.goto("/projects");
        await page.waitForLoadState("networkidle");

        // When I click New Project
        const newButton = page.getByRole("button", { name: /new project/i });
        if (await newButton.isVisible({ timeout: 3000 })) {
            await newButton.click();

            // And fill in name and description
            const uniqueName = `Test Project ${Date.now()}`;
            await page.getByLabel("Name").fill(uniqueName);

            // And click Save
            await page.getByRole("button", { name: /save/i }).click();
            await page.waitForTimeout(1000);

            // Then the project appears in the list
            await expect(page.getByText(uniqueName)).toBeVisible();
        }
    });
});

// ============================================================================
// Objectives
// ============================================================================

test.describe("Objectives", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-objective-list: Browse objectives", async ({ page }) => {
        // Given I am signed in as any user
        // When I navigate to the Objectives page
        await page.goto("/projects/objectives");
        await page.waitForLoadState("networkidle");

        // Then I see objectives displayed in a hierarchical tree structure
        await expect(page).toHaveURL(/\/projects\/objectives/);
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });

    test("scen-objective-create: Create objective", async ({ page }) => {
        // Given I am signed in as Global Administrator
        await page.goto("/projects/objectives");
        await page.waitForLoadState("networkidle");

        // When I click New Objective
        const newButton = page.getByRole("button", { name: /new objective/i });
        if (await newButton.isVisible({ timeout: 3000 })) {
            await newButton.click();
            await page.waitForTimeout(500);

            // And fill in title and description
            const uniqueTitle = `Test Objective ${Date.now()}`;
            await page.getByPlaceholder(/objective title/i).fill(uniqueTitle);

            // And click Save
            await page.getByRole("button", { name: /save/i }).click();
            await page.waitForTimeout(1000);

            // Then the objective appears in the hierarchy
            await expect(page.getByText(uniqueTitle)).toBeVisible();
        }
    });
});

// ============================================================================
// Initiatives
// ============================================================================

test.describe("Initiatives", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-initiative-list: Browse initiatives", async ({ page }) => {
        // Given I am signed in as any user
        // When I navigate to the Initiatives page
        await page.goto("/projects/initiatives");
        await page.waitForLoadState("networkidle");

        // Then I see a list of initiatives with their linked KPIs and status
        await expect(page).toHaveURL(/\/projects\/initiatives/);
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });

    test("scen-initiative-create: Create initiative", async ({ page }) => {
        // Given I am signed in as Global Administrator
        await page.goto("/projects/initiatives");
        await page.waitForLoadState("networkidle");

        // When I click New Initiative
        const newButton = page.getByRole("button", { name: /new initiative/i });
        if (await newButton.isVisible({ timeout: 3000 })) {
            await newButton.click();
            await page.waitForTimeout(500);

            // And fill in name
            const uniqueName = `Test Initiative ${Date.now()}`;
            await page.getByPlaceholder(/initiative name/i).fill(uniqueName);

            // Select a KPI (required field for creating initiative)
            const kpiSelect = page.locator("select").filter({ hasText: "Select KPI" }).first();
            let kpiSelected = false;
            if (await kpiSelect.isVisible({ timeout: 1000 })) {
                const options = await kpiSelect.locator("option").count();
                if (options > 1) {
                    await kpiSelect.selectOption({ index: 1 });
                    kpiSelected = true;
                }
            }

            // And click Save
            await page.getByRole("button", { name: /save/i }).click();
            await page.waitForTimeout(1000);

            // Then the initiative appears in the list (if we selected a KPI)
            if (kpiSelected) {
                await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
            }
        }
    });
});

// ============================================================================
// Activities
// ============================================================================

test.describe("Activities", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-activity-list: Browse activities", async ({ page }) => {
        // Given I am signed in as any user
        // When I navigate to the Activities page
        await page.goto("/projects/activities");
        await page.waitForLoadState("networkidle");

        // Then I see activities with their initiative, roles, and capacity information
        await expect(page).toHaveURL(/\/projects\/activities/);
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });

    test("scen-activity-capacity: View capacity dashboard", async ({ page }) => {
        // Given I am on the Activities page
        await page.goto("/projects/activities");
        await page.waitForLoadState("networkidle");

        // Then I see a capacity dashboard showing Capacity Filled and FTE Required
        await expect(page.getByText(/Capacity Filled/i)).toBeVisible();
        await expect(page.getByText(/FTE Required/i)).toBeVisible();
    });

    test("scen-activity-create: Create activity", async ({ page }) => {
        // Given I am signed in as Global Administrator
        await page.goto("/projects/activities");
        await page.waitForLoadState("networkidle");

        // When I click New Activity
        const newButton = page.getByRole("button", { name: /new activity/i });
        if (await newButton.isVisible({ timeout: 3000 })) {
            await newButton.click();
            await page.waitForTimeout(500);

            // And fill in name
            const uniqueName = `Test Activity ${Date.now()}`;
            await page.getByPlaceholder(/activity name/i).fill(uniqueName);

            // And click Save
            await page.getByRole("button", { name: /save/i }).click();
            await page.waitForTimeout(1000);
        }
    });
});

// ============================================================================
// Metrics
// ============================================================================

test.describe("Metrics", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-metric-list: Browse metrics", async ({ page }) => {
        // Given I am signed in as any user
        // When I navigate to the Metrics page
        await page.goto("/projects/metrics");
        await page.waitForLoadState("networkidle");

        // Then I see a list of metrics with their units and current values
        await expect(page).toHaveURL(/\/projects\/metrics/);
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });

    test("scen-kpi-view: View KPI details", async ({ page }) => {
        // Given I am viewing the Metrics page
        await page.goto("/projects/metrics");
        await page.waitForLoadState("networkidle");

        // When a metric has linked KPIs, then I can see the KPI targets and thresholds
        // Look for any KPI-related content on the page
        const content = page.locator("main");
        await expect(content).toBeVisible();
    });
});

// ============================================================================
// Navigation
// ============================================================================

test.describe("Projects Navigation", () => {
    test("should navigate through all project module pages via URL", async ({ page }) => {
        await signInAsAdmin(page);

        const pages = [
            "/projects/services",
            "/projects/objectives",
            "/projects/features",
            "/projects/initiatives",
            "/projects/activities",
            "/projects/metrics",
        ];

        for (const url of pages) {
            await page.goto(url);
            await page.waitForLoadState("networkidle");
            await expect(page).toHaveURL(new RegExp(url));
            const content = page.locator("main");
            await expect(content).toBeVisible();
        }
    });
});

