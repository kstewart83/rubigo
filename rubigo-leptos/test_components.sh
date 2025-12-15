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
        port=$(shuf -i 10000-65000 -n 1)
        if ! ss -lnt | grep -q ":$port "; then
            echo "$port"
            return 0
        fi
    done
}

echo "Finding free port..."
PORT=$(get_free_port)
echo "Using PORT=$PORT"

echo "Starting gui-server..."
cd gui-server
CITIES_DB_PATH="../worldcities_dev.csv" PORT=$PORT cargo run &
SERVER_PID=$!
cd ..

echo "Waiting for server at http://localhost:$PORT..."
for i in {1..60}; do
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Server process died unexpectedly."
    exit 1
  fi
  if curl -s http://localhost:$PORT > /dev/null; then
    echo "Server is up!"
    break
  fi
  sleep 1
done

echo "Running All UI Tests..."
cd ui-tests
export BASE_URL="http://localhost:$PORT"
npx playwright test > ../test_output.log 2>&1
