#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping processes..."
    if [ -n "$SERVER_PID" ]; then
        kill $SERVER_PID
    fi
    if [ -f "gui-tauri/src-tauri/tauri.dev.tmp.json" ]; then
        rm "gui-tauri/src-tauri/tauri.dev.tmp.json"
    fi
    exit
}

trap cleanup SIGINT SIGTERM EXIT

# Cross-platform port check
is_port_in_use() {
    local port=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        lsof -iTCP:$port -sTCP:LISTEN -P -n >/dev/null 2>&1
    else
        ss -lnt | grep -q ":$port "
    fi
}

# Function to find a free port
get_free_port() {
    local port
    while true; do
        # Generate a random port between 10000 and 65000
        if [[ "$OSTYPE" == "darwin"* ]]; then
            port=$((RANDOM % 55000 + 10000))
        else
            port=$(shuf -i 10000-65000 -n 1)
        fi
        # Check if port is in use
        if ! is_port_in_use $port; then
            echo "$port"
            return 0
        fi
    done
}

# Determine Port
# If PORT is already set by user, use it. Otherwise find a free one.
if [ -z "$PORT" ]; then
    PORT=$(get_free_port)
fi

echo "Environment initialized with PORT=$PORT"

# Start gui-server
echo "Starting gui-server in watch mode on port $PORT..."
cd gui-server
DEV_MODE=true CITIES_DB_PATH="../worldcities_dev.csv" PORT=$PORT cargo watch -x run &
SERVER_PID=$!
cd ..

echo "Waiting for backend on http://localhost:$PORT..."
# Wait for server to respond
# We retry for up to 120 seconds (extended for first-time builds)
for i in {1..120}; do
    if curl -s http://localhost:$PORT > /dev/null; then
        echo "Backend is up!"
        break
    fi
    sleep 1
    if [ $i -eq 120 ]; then
        echo "Timed out waiting for backend."
        cleanup
    fi
done

echo "Preparing Tauri Configuration..."
cd gui-tauri

# robustly replace the port in the config
# We assume "http://localhost:3000" is what needs changing.
# If the file has a different port, this sed might fail to match, but for now 3000 is hardcoded in source.
sed "s|localhost:3000|localhost:$PORT|g" src-tauri/tauri.dev.json > src-tauri/tauri.dev.tmp.json

# Start Tauri
export SKIP_SERVER_BUILD=1
rm -f src-tauri/gui-server-*-*-*

echo "Launching Tauri..."
export BEVY_ASSET_PATH="$(pwd)/../crates/ui-app/assets"
cargo tauri dev --config src-tauri/tauri.dev.tmp.json
