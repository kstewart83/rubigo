#!/bin/bash

# tauri-dev.sh - Development mode for Tauri desktop app
# Uses Trunk as the frontend dev server with hot reload

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║          NETWORK SIMULATION - TAURI DESKTOP DEV               ║"
echo "  ║     Hot reload via Trunk + Tauri dev server                   ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Process CSS modules first
echo -e "${GREEN}► Processing CSS modules with Stylance...${NC}"
stylance ./crates/ui-core

# Tauri dev will run trunk serve via beforeDevCommand
echo -e "${GREEN}► Starting Tauri dev server (Trunk starts automatically)...${NC}"
cd gui-tauri
SKIP_SERVER_BUILD=1 cargo tauri dev
