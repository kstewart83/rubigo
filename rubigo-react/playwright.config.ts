import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 * 
 * Test structure:
 * - e2e/ui/ - Browser-based UI tests
 * - e2e/api/ - API tests using Playwright's request context
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ["html", { outputFolder: "e2e/test-results/html" }],
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

    /* Configure projects for different test types */
    projects: [
        // UI Tests - Browser-based tests
        {
            name: "ui",
            testDir: "./e2e/ui",
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

