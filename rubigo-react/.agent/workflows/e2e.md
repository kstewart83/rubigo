---
description: Run full E2E test suite with initialization and data verification
---

# E2E Test Suite

This workflow runs the complete end-to-end test suite, including:
1. Database cleanup
2. Production build and server launch
3. BIP39 initialization flow
4. Full UI data entry tests
5. API verification

## Prerequisites

Ensure Playwright is installed:
```
bunx playwright install chromium
```

## Quick Run (Recommended)

// turbo
Run the full E2E suite with a single command:
```
bun run test:e2e:full
```

This TypeScript script handles all steps automatically:
- Cleans the database
- Builds the production bundle
- Starts the server and extracts the init token
- Runs Playwright tests
- Cleans up when done

## Manual Steps (If Needed)

### Step 1: Clean the database

```
bun run db:clean
```

### Step 2: Build production bundle

```
bun run build
```

### Step 3: Start production server

Start the server on port 3100:
```
PORT=3100 bun run start
```

Look for the `INIT TOKEN: <words>` in the output.

### Step 4: Run Playwright tests

In a separate terminal:
```
E2E_INIT_TOKEN="<token-from-step-3>" bunx playwright test --reporter=list
```

### Step 5: Review results

If tests failed, view the HTML report:
```
bunx playwright show-report e2e/test-results/html
```

## Notes

- The initialization token is randomly generated on each server start
- Tests are run in serial order to ensure proper data state
- Video recordings are saved only on test failure
- Screenshots are captured on failure for debugging
