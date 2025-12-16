#!/bin/bash
#
# E2E Test Runner
# Runs the full end-to-end test suite
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "========================================"
echo "🧪 Rubigo E2E Test Suite"
echo "========================================"
echo ""

# Step 1: Clean database
echo "📦 Step 1: Cleaning database..."
bun run db:clean
echo ""

# Step 2: Build production bundle
echo "🏗️  Step 2: Building production bundle..."
bun run build
echo ""

# Step 3: Start production server
echo "🚀 Step 3: Starting production server..."

# Kill any existing process on port 3100
lsof -ti:3100 | xargs kill -9 2>/dev/null || true

# Start server and capture output
PORT=3100 bun run start > .e2e-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "   Waiting for server to start..."
sleep 8

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start!"
    cat .e2e-server.log
    exit 1
fi
echo "   Server running on http://localhost:3100"
echo ""

# Step 4: Extract initialization token
echo "🔑 Step 4: Extracting initialization token..."
INIT_TOKEN=$(grep "INIT TOKEN:" .e2e-server.log | sed 's/.*INIT TOKEN: //')

if [ -z "$INIT_TOKEN" ]; then
    echo "❌ Failed to extract init token from logs!"
    cat .e2e-server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "   Token: $INIT_TOKEN"
echo ""

# Step 5: Run Playwright tests
echo "🎭 Step 5: Running Playwright E2E tests..."
echo ""

E2E_INIT_TOKEN="$INIT_TOKEN" bunx playwright test --reporter=list || TEST_EXIT_CODE=$?

echo ""

# Step 6: Cleanup
echo "🧹 Step 6: Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
rm -f .e2e-server.log

# Report results
echo ""
echo "========================================"
if [ "${TEST_EXIT_CODE:-0}" -eq 0 ]; then
    echo "✅ E2E Tests PASSED"
else
    echo "❌ E2E Tests FAILED (exit code: $TEST_EXIT_CODE)"
    echo ""
    echo "View HTML report: bunx playwright show-report e2e/test-results/html"
fi
echo "========================================"

exit ${TEST_EXIT_CODE:-0}
