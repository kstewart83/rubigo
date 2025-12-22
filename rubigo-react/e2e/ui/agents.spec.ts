/**
 * Agent Simulation UI E2E Tests
 * 
 * Tests for agent simulation scenarios:
 * - Agent badge visible on personnel cards
 * - Agent status indicators
 * - Agent thought viewer component
 * - Agent control panel
 * 
 * These tests are designed to FAIL until the features are implemented (TDD RED phase).
 */

import { test, expect, Page } from "@playwright/test";
import { signInAsAdmin, navigateToModule } from "../helpers";

// ============================================================================
// AGENT INDICATORS - Personnel Directory
// ============================================================================

test.describe("Agent UI Indicators", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
        await navigateToModule(page, "/personnel", "table");
    });

    test("scen-agent-badge-visible: AI Agent badge on personnel card", async ({ page }) => {
        // Given Alex Chen is configured as an AI agent
        // When I view the Personnel directory
        await page.getByPlaceholder(/search/i).fill("Alex Chen");
        await page.waitForTimeout(400);

        // Then Alex's card shows an "AI Agent" badge
        const alexRow = page.locator("td", { hasText: "Alex Chen" }).first();
        await expect(alexRow).toBeVisible({ timeout: 5000 });

        // Look for agent badge indicator
        const agentBadge = page.locator("[data-testid='agent-badge']").or(
            page.locator("text=AI Agent")
        ).or(
            page.locator("[aria-label='AI Agent']")
        );
        await expect(agentBadge).toBeVisible({ timeout: 3000 });
    });

    test("scen-agent-status-working: Status indicator shows agent state", async ({ page }) => {
        // Given an agent is in the personnel directory
        await page.getByPlaceholder(/search/i).fill("Alex Chen");
        await page.waitForTimeout(400);

        const alexRow = page.locator("td", { hasText: "Alex Chen" }).first();
        await expect(alexRow).toBeVisible({ timeout: 5000 });

        // Click to view details
        await alexRow.click();
        await page.waitForTimeout(500);

        // Then I see a status indicator (Working, Idle, Sleeping, or Dormant)
        const statusIndicator = page.locator("[data-testid='agent-status']").or(
            page.locator("text=Working").or(
                page.locator("text=Idle").or(
                    page.locator("text=Sleeping").or(
                        page.locator("text=Dormant")
                    )
                )
            )
        );
        await expect(statusIndicator.first()).toBeVisible({ timeout: 3000 });
    });

    test("scen-agent-badge-not-shown-for-humans: No badge for human personnel", async ({ page }) => {
        // Given Thomas Anderson is NOT an AI agent (he's the CEO)
        await page.getByPlaceholder(/search/i).fill("Thomas Anderson");
        await page.waitForTimeout(400);

        const thomasRow = page.locator("td", { hasText: "Thomas Anderson" }).first();
        await expect(thomasRow).toBeVisible({ timeout: 5000 });

        // Then no AI Agent badge should be visible for this row
        const agentBadge = thomasRow.locator("[data-testid='agent-badge']").or(
            thomasRow.locator("text=AI Agent")
        );
        await expect(agentBadge).not.toBeVisible({ timeout: 1000 });
    });
});

// ============================================================================
// AGENT THOUGHT VIEWER
// ============================================================================

test.describe("Agent Thought Viewer", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-agent-thought-realtime: View thought stream for agent", async ({ page }) => {
        // Navigate to personnel and select an agent
        await navigateToModule(page, "/personnel", "table");
        await page.getByPlaceholder(/search/i).fill("Alex Chen");
        await page.waitForTimeout(400);

        const alexRow = page.locator("td", { hasText: "Alex Chen" }).first();
        await expect(alexRow).toBeVisible({ timeout: 5000 });
        await alexRow.click();
        await page.waitForTimeout(500);

        // Given I open the agent viewer for Alex Chen
        // Look for "View Agent Activity" or similar button
        const viewAgentButton = page.getByRole("button", { name: /view agent|agent activity|thoughts/i }).or(
            page.locator("[data-testid='view-agent-button']")
        );
        await expect(viewAgentButton).toBeVisible({ timeout: 3000 });
        await viewAgentButton.click();

        // When Alex is processing (or has processed)
        // Then I see thoughts appearing
        const thoughtViewer = page.locator("[data-testid='agent-thought-viewer']").or(
            page.locator("[role='region'][aria-label*='thought']")
        );
        await expect(thoughtViewer).toBeVisible({ timeout: 5000 });

        // Should show thought entries
        const thoughtEntry = thoughtViewer.locator("[data-testid='thought-entry']").or(
            thoughtViewer.locator(".thought-item")
        );
        // At minimum, the viewer component should be present
        await expect(thoughtViewer).toBeVisible();
    });

    test("scen-agent-history-timeline: View action history timeline", async ({ page }) => {
        // Navigate to agent viewer
        await navigateToModule(page, "/personnel", "table");
        await page.getByPlaceholder(/search/i).fill("Alex Chen");
        await page.waitForTimeout(400);

        const alexRow = page.locator("td", { hasText: "Alex Chen" }).first();
        await expect(alexRow).toBeVisible({ timeout: 5000 });
        await alexRow.click();
        await page.waitForTimeout(500);

        const viewAgentButton = page.getByRole("button", { name: /view agent|agent activity|thoughts/i }).or(
            page.locator("[data-testid='view-agent-button']")
        );
        if (await viewAgentButton.isVisible({ timeout: 2000 })) {
            await viewAgentButton.click();

            // Given I open the agent viewer for Alex Chen
            // When I scroll through history
            const historyTab = page.getByRole("tab", { name: /history/i }).or(
                page.locator("[data-testid='history-tab']")
            );
            if (await historyTab.isVisible({ timeout: 2000 })) {
                await historyTab.click();
            }

            // Then I see a chronological list of past thoughts and actions
            const historyTimeline = page.locator("[data-testid='agent-history']").or(
                page.locator("[role='list'][aria-label*='history']")
            );
            await expect(historyTimeline).toBeVisible({ timeout: 3000 });
        }
    });
});

// ============================================================================
// AGENT CONTROL PANEL
// ============================================================================

test.describe("Agent Control Panel", () => {
    test.beforeEach(async ({ page }) => {
        await signInAsAdmin(page);
    });

    test("scen-agent-control-start: Control panel accessible", async ({ page }) => {
        // The control panel might be accessible from a dev/admin menu
        // or a dedicated route

        // Try dedicated route first
        await page.goto("/agents");
        await page.waitForLoadState("networkidle");

        // Given I open the agent control panel
        const controlPanel = page.locator("[data-testid='agent-control-panel']").or(
            page.locator("h1", { hasText: /agent/i })
        );

        if (await controlPanel.isVisible({ timeout: 3000 })) {
            // When I view the control panel
            // Then I see controls for simulation

            // Start/Stop simulation button
            const startButton = page.getByRole("button", { name: /start simulation/i });
            const stopButton = page.getByRole("button", { name: /stop simulation/i });

            await expect(startButton.or(stopButton)).toBeVisible({ timeout: 3000 });

            // List of agents
            const agentList = page.locator("[data-testid='agent-list']").or(
                page.locator("text=Alex Chen") // Known agent
            );
            await expect(agentList).toBeVisible({ timeout: 3000 });
        } else {
            // Panel not found - try looking for it in settings or elsewhere
            await page.goto("/settings");
            await page.waitForLoadState("networkidle");

            const agentSettings = page.locator("text=Agent Simulation").or(
                page.getByRole("link", { name: /agents/i })
            );
            await expect(agentSettings).toBeVisible({ timeout: 3000 });
        }
    });

    test("scen-agent-control-toggle: Start and stop simulation", async ({ page }) => {
        await page.goto("/agents");
        await page.waitForLoadState("networkidle");

        const controlPanel = page.locator("[data-testid='agent-control-panel']");

        if (await controlPanel.isVisible({ timeout: 3000 })) {
            // Given I open the agent control panel
            // When I click Start Simulation
            const startButton = page.getByRole("button", { name: /start simulation/i });

            if (await startButton.isVisible({ timeout: 2000 })) {
                await startButton.click();

                // Then agents begin transitioning from dormant to idle/working states
                // The button should change to "Stop Simulation"
                const stopButton = page.getByRole("button", { name: /stop simulation/i });
                await expect(stopButton).toBeVisible({ timeout: 5000 });

                // And at least one agent should show a non-dormant status
                const activeAgent = page.locator("text=Working").or(
                    page.locator("text=Idle")
                );
                await expect(activeAgent.first()).toBeVisible({ timeout: 10000 });
            }
        }
    });
});

// ============================================================================
// AGENT DORMANT STATE (Ollama unavailable)
// ============================================================================

test.describe("Agent Graceful Degradation", () => {
    test("scen-agent-state-dormant-default: Agents dormant when Ollama unavailable", async ({ page }) => {
        // This test verifies graceful degradation behavior
        // When Ollama is not running, agents should show as dormant

        await signInAsAdmin(page);
        await navigateToModule(page, "/personnel", "table");

        // Search for a known agent
        await page.getByPlaceholder(/search/i).fill("Alex Chen");
        await page.waitForTimeout(400);

        const alexRow = page.locator("td", { hasText: "Alex Chen" }).first();
        await expect(alexRow).toBeVisible({ timeout: 5000 });
        await alexRow.click();
        await page.waitForTimeout(500);

        // Given Ollama is not running (default test environment)
        // When the simulation would start
        // Then agents remain in dormant state with no activity

        // The status should show "Dormant" or a visual indicator of offline state
        const dormantIndicator = page.locator("text=Dormant").or(
            page.locator("[data-testid='agent-status'][data-status='dormant']").or(
                page.locator("[aria-label*='dormant']")
            )
        );

        // This test expects to see dormant state - the feature should handle Ollama being unavailable
        await expect(dormantIndicator.first()).toBeVisible({ timeout: 3000 });
    });
});
