#!/bin/bash

# showcase.sh - Component Showcase Development Server
# Launches a Storybook-style component explorer for ui-core primitives

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║           UI CORE COMPONENT SHOWCASE                          ║"
echo "  ║     Interactive component documentation & exploration         ║"
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

# Find a free port
get_free_port() {
    local port
    while true; do
        port=$(shuf -i 8080-9000 -n 1)
        if ! ss -lnt | grep -q ":$port "; then
            echo "$port"
            return 0
        fi
    done
}

PORT=${PORT:-$(get_free_port)}

echo ""
echo -e "${GREEN}► Starting showcase server...${NC}"
echo -e "${BLUE}  URL: http://localhost:$PORT${NC}"
echo ""
echo -e "${CYAN}  Features:${NC}"
echo "    • Component sidebar navigation"
echo "    • Props documentation tables"
echo "    • Interactive controls"
echo "    • Live preview"
echo ""

cd crates/ui-showcase
trunk serve --port $PORT --open
