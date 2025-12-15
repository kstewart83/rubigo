#!/bin/bash
set -e

# Cleanup on exit
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping server (PID $SERVER_PID)..."
    kill $SERVER_PID || true
  fi
}
trap cleanup SIGINT SIGTERM EXIT

# Function to find a free port
get_free_port() {
    local port
    while true; do
        # Generate a random port between 10000 and 65000
        port=$(shuf -i 10000-65000 -n 1)
        # Check if port is in use
        if ! ss -lnt | grep -q ":$port "; then
            echo "$port"
            return 0
        fi
    done
}

# 1. Get Free Port
echo "Finding free port..."
PORT=$(get_free_port)
echo "Using PORT=$PORT"

# 2. Start Server
echo "Starting gui-server..."
# We use cargo run --release for speed if possible, or just build
cd gui-server
DEV_MODE=true CITIES_DB_PATH="../worldcities_dev.csv" PORT=$PORT cargo run &
SERVER_PID=$!
cd ..

# 3. Wait for Server
echo "Waiting for server at http://localhost:$PORT..."
for i in {1..120}; do
  # Check if process is still alive
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Server process died unexpectedly."
    exit 1
  fi

  if curl -s http://localhost:$PORT > /dev/null; then
    echo "Server is up!"
    break
  fi
  sleep 1
  if [ $i -eq 120 ]; then
    echo "Time out waiting for server."
    exit 1
  fi
done

# 4. Run Tests
echo "Running UI Tests..."
cd ui-tests
export BASE_URL="http://localhost:$PORT"
npx playwright test

echo "Tests completed successfully."
echo "Screenshots and reports are available in: ui-tests/test-results"
