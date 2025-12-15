#!/bin/bash

# Production script for network-simulation web server
# Runs on localhost:3000 with release build

set -e

PORT=${PORT:-3000}
ROOT_DIR=$(pwd)

echo "=========================================="
echo "  Network Simulation - Production Build"
echo "=========================================="
echo ""

# Build release binary first (minimizes downtime)
echo "Building release binary..."
cd gui-server
cargo build --release
cd "$ROOT_DIR"

# Kill any existing process on the port
if ss -lnt | grep -q ":$PORT "; then
    echo "Stopping existing process on port $PORT..."
    PID=$(lsof -t -i:$PORT 2>/dev/null || fuser $PORT/tcp 2>/dev/null | awk '{print $1}')
    if [ -n "$PID" ]; then
        kill $PID 2>/dev/null || true
        sleep 1
    fi
fi

echo ""
echo "Starting production server on http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo ""

# Run the production server
cd gui-server
PORT=$PORT "$ROOT_DIR/gui-server/target/release/gui-server"
