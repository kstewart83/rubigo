#!/bin/bash

# tauri-prod.sh - Build production Tauri binary
# Creates an all-in-one distributable desktop application

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║          NETWORK SIMULATION - TAURI PRODUCTION BUILD          ║"
echo "  ║     Building distributable desktop application                ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Process CSS modules
echo -e "${GREEN}► Processing CSS modules with Stylance...${NC}"
stylance ./crates/ui-core

# Tauri build will run trunk build --release via beforeBuildCommand
echo -e "${GREEN}► Building production Tauri binary...${NC}"
echo -e "${YELLOW}  This may take a few minutes on first build.${NC}"
echo -e "${YELLOW}  Note: Skipping gui-server sidecar (set SKIP_SERVER_BUILD=0 to include)${NC}"
cd gui-tauri
SKIP_SERVER_BUILD=1 cargo tauri build

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "   Binary location: target/release/bundle/"
