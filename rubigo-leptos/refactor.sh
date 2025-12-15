#!/bin/bash

# refactor.sh - Launch the refactored application
# Runs the new Leptos CSR application with ui-core components
#
# Usage: ./refactor.sh [PORT] [--no-open]
#   PORT: Port to run on (default: 8080 for E2E test compatibility)
#   --no-open: Don't auto-open browser (useful for CI/testing)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
OPEN_BROWSER="--open"
for arg in "$@"; do
    case $arg in
        --no-open)
            OPEN_BROWSER=""
            shift
            ;;
        [0-9]*)
            PORT="$arg"
            shift
            ;;
    esac
done

# Default port is 8080 for E2E test compatibility
PORT=${PORT:-8080}

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║           NETWORK SIMULATION - REFACTORED                     ║"
echo "  ║     Leptos 0.8 CSR with reactive architecture                 ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for trunk
if ! command -v trunk &> /dev/null; then
    echo -e "${YELLOW}⚠ Trunk not found. Installing...${NC}"
    cargo install trunk
fi

# Check for wasm32 target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo -e "${YELLOW}⚠ wasm32 target not found. Installing...${NC}"
    rustup target add wasm32-unknown-unknown
fi

# Run stylance first
echo -e "${GREEN}► Processing CSS modules with Stylance...${NC}"
stylance ./crates/ui-core

echo ""
echo -e "${GREEN}► Starting refactored application...${NC}"
echo -e "${BLUE}  URL: http://localhost:$PORT${NC}"
echo ""

cd crates/ui-app
trunk serve --port $PORT $OPEN_BROWSER

