#!/bin/bash
# Kills all cargo and project-related processes to free file locks

echo "Searching for lingering cargo/dev processes..."

# Kill cargo processes
pkill -f "cargo"
pkill -f "rustc"

# Kill the specific binaries if running
pkill -f "gui-server"
pkill -f "nexosim"

# Kill cargo-watch if used
pkill -f "cargo-watch"

echo "Cleanup complete. You can now try running ./dev.sh again."
