import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 * 
 * Test structure:
 * - e2e/ui/ - Browser-based UI tests (setup runs first, then modules)
 * - e2e/api/ - API tests using Playwright's request context
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    /* Global setup - starts server and initializes system */
    globalSetup: "./e2e/global-setup.ts",

    /* Run tests in files in parallel (within a project) */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Use default workers (half of CPU cores) */
    workers: undefined,

    /* Reporter to use */
    reporter: [
        ["html", { outputFolder: "e2e/test-results/html", open: "never" }],
        ["list"],
    ],

    /* Shared settings for all projects */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: process.env.E2E_BASE_URL || "http://localhost:3100",

        /* Collect trace when retrying the failed test */
        trace: "on-first-retry",

        /* Screenshot on failure */
        screenshot: "only-on-failure",

        /* Video recording */
        video: "retain-on-failure",
    },

    /* Configure projects - setup runs first, then modules, then API */
    projects: [
        // Setup project - runs initialization first
        {
            name: "setup",
            testDir: "./e2e/ui",
            testMatch: /setup\.spec\.ts/,
            fullyParallel: false, // Run setup tests serially
            use: { ...devices["Desktop Chrome"] },
        },
        // UI Tests - Browser-based tests (depends on setup)
        {
            name: "ui",
            testDir: "./e2e/ui",
            testIgnore: /setup\.spec\.ts/,
            dependencies: ["setup"], // Wait for setup to complete
            use: { ...devices["Desktop Chrome"] },
        },
        // API Tests - Direct HTTP request tests
        {
            name: "api",
            testDir: "./e2e/api",
            use: {
                // API tests don't need a browser
                baseURL: process.env.RUBIGO_API_URL || "http://localhost:3600",
            },
        },
    ],

    /* Folder for test artifacts such as screenshots, videos, traces, etc. */
    outputDir: "e2e/test-results",

    /* Run your local dev server before starting the tests */
    // Note: For E2E workflow, we start the server separately to capture init token
    // webServer: {
    //     command: "bun run start",
    //     url: "http://localhost:3000",
    //     reuseExistingServer: !process.env.CI,
    // },
});
