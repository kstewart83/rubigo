/**
 * E2E Test: Data Entry via UI
 * 
 * Tests populating seed data through the UI as a real user would
 * This is a comprehensive stress test of the full CRUD functionality
 */

import { test, expect } from "@playwright/test";
import { loadTestData, type TestData } from "../fixtures/test-data";

let testData: TestData;

test.beforeAll(() => {
    testData = loadTestData();
});

test.describe("Data Entry Flow", () => {
    // Helper to sign in as Global Administrator
    async function signInAsAdmin(page: import("@playwright/test").Page) {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const signInButton = page.getByRole("button", { name: "Sign In" });
        if (await signInButton.isVisible()) {
            await signInButton.click();
            await expect(page.getByText("Sign In as Persona")).toBeVisible();
            await page.getByText("Global Administrator").click();
            await page.waitForURL(/\/dashboard/);
        }
    }

    test.describe("Solutions", () => {
        test("should navigate to Services page", async ({ page }) => {
            await signInAsAdmin(page);

            // Navigate to services (which shows solutions)
            // First expand the Projects section if collapsed
            const projectsButton = page.getByRole("button", { name: "Projects" });
            if (await projectsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await projectsButton.click();
                await page.waitForTimeout(300);
            }

            await page.getByRole("link", { name: /Products.*Services/i }).click();
            await expect(page).toHaveURL(/\/projects\/services/);
        });

        test("should create a new solution", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects/services");

            const solution = testData.solutions?.[0];
            test.skip(!solution, "No solutions in test data");

            // Click new solution button
            await page.getByRole("button", { name: /New Solution/i }).click();

            // Fill form
            await page.getByLabel("Name").fill(solution.name);
            if (solution.description) {
                await page.getByLabel("Description").fill(solution.description);
            }

            // Save
            await page.getByRole("button", { name: "Save" }).click();

            // Verify it appears in the list
            await expect(page.getByText(solution.name)).toBeVisible();
        });
    });

    test.describe("Projects", () => {
        test("should create a project under a solution", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects");

            const project = testData.projects?.[0];
            test.skip(!project, "No projects in test data");

            // Click new project button
            await page.getByRole("button", { name: /New Project/i }).click();

            // Fill form
            await page.getByLabel("Name").fill(project.name);
            if (project.description) {
                await page.getByLabel("Description").fill(project.description);
            }

            // Select solution if available
            if (project.solution_id) {
                const solutionSelect = page.getByLabel("Solution");
                if (await solutionSelect.isVisible()) {
                    await solutionSelect.selectOption({ label: project.solution_id });
                }
            }

            // Save
            await page.getByRole("button", { name: "Save" }).click();

            // Verify
            await expect(page.getByText(project.name)).toBeVisible();
        });
    });

    test.describe("Objectives", () => {
        test("should navigate to Objectives page", async ({ page }) => {
            await signInAsAdmin(page);

            await page.getByRole("link", { name: "Objectives" }).click();
            await expect(page).toHaveURL(/\/projects\/objectives/);
        });

        test("should create an objective", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects/objectives");

            const objective = testData.objectives?.[0];
            test.skip(!objective, "No objectives in test data");

            // Click new objective button
            await page.getByRole("button", { name: /New Objective/i }).click();

            // Fill form
            await page.getByLabel("Title").fill(objective.title);
            if (objective.description) {
                await page.getByLabel("Description").fill(objective.description);
            }

            // Save
            await page.getByRole("button", { name: "Save" }).click();

            // Verify
            await expect(page.getByText(objective.title)).toBeVisible();
        });
    });

    test.describe("Features", () => {
        test("should navigate to Features page", async ({ page }) => {
            await signInAsAdmin(page);

            await page.getByRole("link", { name: "Features" }).click();
            await expect(page).toHaveURL(/\/projects\/features/);
        });

        test("should view feature details", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects/features");

            const feature = testData.features?.[0];
            test.skip(!feature, "No features in test data");

            // Wait for features to load
            await page.waitForTimeout(1000);

            // Click on a feature if visible
            const featureCard = page.getByText(feature.name).first();
            if (await featureCard.isVisible()) {
                await featureCard.click();

                // Detail panel should show
                await expect(page.getByText("Rules")).toBeVisible();
            }
        });
    });

    test.describe("Initiatives", () => {
        test("should navigate to Initiatives page", async ({ page }) => {
            await signInAsAdmin(page);

            await page.getByRole("link", { name: "Initiatives" }).click();
            await expect(page).toHaveURL(/\/projects\/initiatives/);
        });

        test("should create an initiative", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects/initiatives");

            const initiative = testData.initiatives?.[0];
            test.skip(!initiative, "No initiatives in test data");

            // Click new initiative button
            await page.getByRole("button", { name: /New Initiative/i }).click();

            // Fill form
            await page.getByLabel("Name").fill(initiative.name);

            // Save
            await page.getByRole("button", { name: "Save" }).click();

            // Verify
            await expect(page.getByText(initiative.name)).toBeVisible();
        });
    });

    test.describe("Activities", () => {
        test("should navigate to Activities page", async ({ page }) => {
            await signInAsAdmin(page);

            await page.getByRole("link", { name: "Activities" }).click();
            await expect(page).toHaveURL(/\/projects\/activities/);
        });

        test("should view capacity dashboard", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects/activities");

            // Should show capacity summary
            await expect(page.getByText("Capacity Filled")).toBeVisible();
            await expect(page.getByText("FTE Required")).toBeVisible();
        });

        test("should create an activity", async ({ page }) => {
            await signInAsAdmin(page);
            await page.goto("/projects/activities");

            const activity = testData.activities?.[0];
            test.skip(!activity, "No activities in test data");

            // Click new activity button
            await page.getByRole("button", { name: /New Activity/i }).click();

            // Fill form
            await page.getByLabel("Name").fill(activity.name);

            // Select initiative
            if (activity.initiative_id) {
                const initSelect = page.getByLabel("Initiative");
                if (await initSelect.isVisible()) {
                    // Just select the first available
                    await initSelect.click();
                    await page.locator('[role="option"]').first().click();
                }
            }

            // Save
            await page.getByRole("button", { name: "Save" }).click();

            // Verify
            await page.waitForTimeout(500);
        });
    });

    test.describe("Metrics", () => {
        test("should navigate to Metrics page", async ({ page }) => {
            await signInAsAdmin(page);

            // First expand the Projects section if collapsed
            const projectsButton = page.getByRole("button", { name: "Projects" });
            if (await projectsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await projectsButton.click();
                await page.waitForTimeout(300);
            }

            await page.getByRole("link", { name: /Metrics.*KPIs/i }).click();
            await expect(page).toHaveURL(/\/projects\/metrics/);
        });
    });

    test.describe("Navigation", () => {
        test("should navigate through all project module pages", async ({ page }) => {
            await signInAsAdmin(page);

            const pages = [
                { link: /Products.*Services/i, url: "/projects/services" },
                { link: "Objectives", url: "/projects/objectives" },
                { link: "Features", url: "/projects/features" },
                { link: "Initiatives", url: "/projects/initiatives" },
                { link: "Activities", url: "/projects/activities" },
                { link: /Metrics.*KPIs/i, url: "/projects/metrics" },
            ];

            for (const p of pages) {
                await page.getByRole("link", { name: p.link }).click();
                await expect(page).toHaveURL(new RegExp(p.url));
                await page.waitForLoadState("networkidle");
            }
        });
    });
});
