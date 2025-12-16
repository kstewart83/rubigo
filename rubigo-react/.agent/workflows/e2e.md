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
```bash
bunx playwright install chromium
```

## Workflow Steps

// turbo-all

### Step 1: Clean the database

Remove all existing data to start fresh:

```bash
bun run db:clean
```

### Step 2: Build production bundle

Build the Next.js application for production:

```bash
bun run build
```

### Step 3: Start production server

Start the server on port 3100 and capture the init token from logs:

```bash
# Kill any existing process on port 3100
lsof -ti:3100 | xargs kill -9 2>/dev/null || true

# Start server and capture output
PORT=3100 bun run start 2>&1 | tee .e2e-server.log &

# Wait for server to be ready
sleep 8
```

### Step 4: Extract initialization token

Get the BIP39 words from the server log:

```bash
INIT_TOKEN=$(grep "INIT TOKEN:" .e2e-server.log | sed 's/.*INIT TOKEN: //')
echo "Init Token: $INIT_TOKEN"
```

### Step 5: Run Playwright E2E tests

Run the full test suite with the initialization token:

```bash
E2E_INIT_TOKEN="$INIT_TOKEN" bunx playwright test --reporter=list
```

### Step 6: Stop server and cleanup

Terminate the server process:

```bash
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
rm -f .e2e-server.log
```

### Step 7: Review results

Check the test results in `e2e/test-results/`:

```bash
ls -la e2e/test-results/
```

If tests failed, view the HTML report:

```bash
bunx playwright show-report e2e/test-results/html
```

## Quick Run (Single Command)

For a quick E2E run without step-by-step execution:

```bash
./scripts/run-e2e.sh
```

## Notes

- The initialization token is randomly generated on each server start
- Tests are run in serial order to ensure proper data state
- Video recordings are saved only on test failure
- Screenshots are captured on failure for debugging
