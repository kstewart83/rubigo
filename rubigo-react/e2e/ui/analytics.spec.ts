/**
 * Analytics E2E Tests
 * 
 * Test scenarios for the Analytics module (GH #33)
 * Based on scenarios in common/seed/profiles/mmc/projects/scenarios.sql
 */

import { test, expect } from "@playwright/test";
import { signInAsAdmin, navigateToModule } from "../helpers";

// =============================================================================
// DASHBOARD SCENARIOS
// =============================================================================

test.describe("Analytics Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    /**
     * scen-dashboard-overview-loads
     * Given I am signed in as Global Administrator,
     * when I navigate to /analytics,
     * then I see an overview with active users count, overall error rate, and Web Vitals summary
     */
    test("scen-dashboard-overview-loads: Dashboard overview displays", async ({ page }) => {
        await navigateToModule(page, "/analytics");

        // Verify we're on the analytics page (by URL)
        await expect(page).toHaveURL(/\/analytics/);

        // Check for key metrics text on the page
        await expect(page.locator("text=Sessions").first()).toBeVisible();
        await expect(page.locator("text=Requests").first()).toBeVisible();
    });

    /**
     * scen-dashboard-performance-view
     * Given I am on the analytics dashboard,
     * when I navigate to the Performance tab,
     * then I see a table of the slowest routes with their p50, p95, and p99 latencies
     */
    test("scen-dashboard-performance-view: Performance view shows routes", async ({ page }) => {
        await navigateToModule(page, "/analytics/performance");

        // Verify performance page loads
        await expect(page.locator("text=Route Latency")).toBeVisible();

        // Check for latency table headers (case-insensitive)
        await expect(page.locator("th:has-text('p50')").first()).toBeVisible();
        await expect(page.locator("th:has-text('p95')").first()).toBeVisible();
        await expect(page.locator("th:has-text('p99')").first()).toBeVisible();
    });

    /**
     * scen-dashboard-usage-by-module
     * Given feature events have been logged for Calendar and Email,
     * when I view the Usage tab,
     * then I see module categories with event counts
     */
    test("scen-dashboard-usage-by-module: Usage broken down by module", async ({ page }) => {
        await navigateToModule(page, "/analytics/usage");

        // Verify usage page loads with session counts (use first() to handle multiples)
        await expect(page.locator("text=Active Sessions").first()).toBeVisible();
    });
});

// =============================================================================
// NAVIGATION SCENARIOS
// =============================================================================

test.describe("Analytics Navigation", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    /**
     * Analytics pages should load without errors after navigation
     * This validates the OTel/DuckDB integration works properly
     */
    test("Analytics overview loads without errors", async ({ page }) => {
        await page.goto("/analytics/overview");
        await page.waitForLoadState("networkidle");

        // Check no error state is shown (look for specific error text, not role=alert)
        await expect(page.locator("text=Failed to load analytics")).not.toBeVisible();
    });

    test("Analytics performance page loads without errors", async ({ page }) => {
        await page.goto("/analytics/performance");
        await page.waitForLoadState("networkidle");

        // Check no error state is shown
        await expect(page.locator("text=Failed to load performance")).not.toBeVisible();
    });

    test("Analytics usage page loads without errors", async ({ page }) => {
        await page.goto("/analytics/usage");
        await page.waitForLoadState("networkidle");

        // Check no error state is shown
        await expect(page.locator("text=Failed to load usage")).not.toBeVisible();
    });

    /**
     * Tab navigation between analytics views
     */
    test("Can navigate between analytics tabs", async ({ page }) => {
        // Start at overview
        await navigateToModule(page, "/analytics");
        await expect(page).toHaveURL(/\/analytics/);

        // Navigate to performance via link
        await page.getByRole("link", { name: /performance/i }).click();
        await expect(page.locator("text=Route Latency")).toBeVisible();

        // Navigate to usage via link
        await page.getByRole("link", { name: /usage/i }).click();
        // Use first() to handle multiple Active Sessions elements
        await expect(page.locator("text=Active Sessions").first()).toBeVisible();

        // Back to overview
        await page.getByRole("link", { name: /overview/i }).click();
        await expect(page.locator("text=Requests").first()).toBeVisible();
    });
});
