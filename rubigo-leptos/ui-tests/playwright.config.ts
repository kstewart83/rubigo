import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30 * 1000,
    expect: {
        timeout: 5000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }]],
    use: {
        trace: 'on-first-retry',
        screenshot: 'on',
    },
    projects: [
        {
            name: 'legacy',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.BASE_URL || 'http://localhost:3000',
            },
            testMatch: /^(?!.*refactor).*\.spec\.ts$/,
        },
        {
            name: 'refactored',
            use: {
                ...devices['Desktop Chrome'],
                // Use REFACTOR_URL env var or default to 8080
                baseURL: process.env.REFACTOR_URL || 'http://localhost:8080',
            },
            // Match both refactor.spec.ts and globe.spec.ts for refactored app
            testMatch: /(refactor|globe)\.spec\.ts$/,
        },
    ],
    outputDir: 'test-results/',
});

