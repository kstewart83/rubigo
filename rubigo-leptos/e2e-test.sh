#!/bin/bash

# e2e-test.sh - Run E2E tests against the refactored application
# Starts the dev server, waits for it, runs tests, then cleans up

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║          NETWORK SIMULATION - E2E TESTS                       ║"
echo "  ║     Running Playwright tests against refactored app           ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Kill any existing dev servers on our ports
cleanup() {
    echo -e "${YELLOW}► Cleaning up dev servers...${NC}"
    pkill -f "trunk serve --port 8080" 2>/dev/null || true
}
trap cleanup EXIT

# Process CSS modules
echo -e "${GREEN}► Processing CSS modules...${NC}"
stylance ./crates/ui-core

# Start the dev server in background
echo -e "${GREEN}► Starting Trunk dev server on port 8080...${NC}"
cd crates/ui-app
trunk serve --port 8080 &
DEV_SERVER_PID=$!
cd ../..

# Wait for server to be ready
echo -e "${YELLOW}► Waiting for dev server to start...${NC}"
MAX_WAIT=60
WAITED=0
while ! curl -s http://localhost:8080 > /dev/null 2>&1; do
    sleep 1
    WAITED=$((WAITED + 1))
    if [ $WAITED -gt $MAX_WAIT ]; then
        echo -e "${RED}✗ Dev server failed to start within ${MAX_WAIT}s${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ Dev server ready${NC}"

# Run the tests
echo -e "${GREEN}► Running Playwright tests...${NC}"
cd ui-tests
npx playwright test tests/refactor.spec.ts --reporter=list
TEST_EXIT_CODE=$?
cd ..

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

exit $TEST_EXIT_CODE
