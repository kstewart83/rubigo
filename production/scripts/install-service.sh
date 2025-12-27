#!/usr/bin/env bash
# install-service.sh
# Installs the rubigo-react systemd user service with correct local paths.
#
# Usage:
#   ./production/scripts/install-service.sh [RUBIGO_DEPLOY_ROOT]
#
# If RUBIGO_DEPLOY_ROOT is not provided, it defaults to the parent directory
# of the repository (assumes repo is at $RUBIGO_DEPLOY_ROOT/rubigo).

set -euo pipefail

# Get script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Determine RUBIGO_DEPLOY_ROOT
if [ -n "${1:-}" ]; then
    RUBIGO_DEPLOY_ROOT="$1"
else
    # Default: parent of the repo directory
    RUBIGO_DEPLOY_ROOT="$(dirname "$REPO_ROOT")"
fi

# Validate the path exists
if [ ! -d "$RUBIGO_DEPLOY_ROOT" ]; then
    echo "❌ Error: RUBIGO_DEPLOY_ROOT does not exist: $RUBIGO_DEPLOY_ROOT"
    exit 1
fi

echo "Using RUBIGO_DEPLOY_ROOT: $RUBIGO_DEPLOY_ROOT"

# Paths
TEMPLATE="$REPO_ROOT/rubigo-react.service.template"
if [ ! -f "$TEMPLATE" ]; then
    # Try from script location if not in repo root
    TEMPLATE="$(dirname "$SCRIPT_DIR")/../rubigo-react.service.template"
    # Fallback: check worktree location
    if [ ! -f "$TEMPLATE" ]; then
        echo "❌ Error: Template not found. Run from repo root or provide correct path."
        exit 1
    fi
fi

SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_NAME="rubigo-react.service"
SERVICE_FILE="$SERVICE_DIR/$SERVICE_NAME"

# Create systemd user directory if needed
mkdir -p "$SERVICE_DIR"

# Generate service file from template
echo "Generating service file..."
sed "s|{{RUBIGO_DEPLOY_ROOT}}|$RUBIGO_DEPLOY_ROOT|g" "$TEMPLATE" > "$SERVICE_FILE"

echo "✅ Service file created: $SERVICE_FILE"

# Reload systemd
echo "Reloading systemd..."
systemctl --user daemon-reload

# Enable service (start on login)
echo "Enabling service..."
systemctl --user enable "$SERVICE_NAME"

echo ""
echo "✅ Installation complete!"
echo ""
echo "Commands:"
echo "  Start:   systemctl --user start $SERVICE_NAME"
echo "  Stop:    systemctl --user stop $SERVICE_NAME"
echo "  Status:  systemctl --user status $SERVICE_NAME"
echo "  Logs:    journalctl --user -u $SERVICE_NAME -f"
echo ""
echo "Environment variable set:"
echo "  RUBIGO_DEPLOY_ROOT=$RUBIGO_DEPLOY_ROOT"
