#!/bin/bash
#
# Bake Image Script for Rubigo Virtual Desktop
#
# This script runs after the VM has booted and cloud-init has completed.
# It copies wallpapers and configures the LXQt desktop environment.
#
# Uses SSH key authentication (key is injected via cloud-init).
#
# Usage: ./bake-image.sh [vm-ip] [ssh-port]
# Example: ./bake-image.sh localhost 2222
#

set -e

VM_HOST="${1:-localhost}"
SSH_PORT="${2:-2222}"
SSH_USER="rubigo"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"

VDI_DIR="$(dirname "$0")"
ASSETS_DIR="${VDI_DIR}/assets"

echo "=== Rubigo VM Bake Script ==="
echo "Target: ${SSH_USER}@${VM_HOST}:${SSH_PORT}"
echo ""

# Wait for SSH to be available
echo "[1/5] Waiting for SSH..."
for i in {1..30}; do
    if ssh ${SSH_OPTS} -p ${SSH_PORT} ${SSH_USER}@${VM_HOST} "echo connected" 2>/dev/null; then
        echo "Connected!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Could not connect to VM via SSH"
        echo "Make sure your SSH key is in ~/.ssh/id_ed25519 or ~/.ssh/id_rsa"
        exit 1
    fi
    sleep 2
done

# Function to run SSH commands
ssh_cmd() {
    ssh ${SSH_OPTS} -p ${SSH_PORT} ${SSH_USER}@${VM_HOST} "$@"
}

# Function to copy files
scp_file() {
    scp ${SSH_OPTS} -P ${SSH_PORT} "$1" "${SSH_USER}@${VM_HOST}:$2"
}

# Step 2: Create directories and configure environment
echo "[2/5] Creating directories and configuring environment..."
ssh_cmd "mkdir -p ~/.local/share/wallpapers ~/.config/lxqt ~/.config/pcmanfm-qt/default"

# Add DISPLAY export to bashrc so terminal apps can access X11
ssh_cmd "grep -q 'DISPLAY=:1' ~/.bashrc || echo 'export DISPLAY=:1' >> ~/.bashrc"
ssh_cmd "grep -q 'xhost +local' ~/.bashrc || echo 'xhost +local: > /dev/null 2>&1' >> ~/.bashrc"

# Step 3: Copy wallpapers
echo "[3/5] Copying wallpapers..."
shopt -s nullglob
for wallpaper in "${ASSETS_DIR}"/*.png "${ASSETS_DIR}"/*.jpg "${ASSETS_DIR}"/*.jpeg; do
    if [ -f "$wallpaper" ]; then
        filename=$(basename "$wallpaper")
        echo "  - ${filename}"
        scp_file "$wallpaper" "~/.local/share/wallpapers/${filename}"
    fi
done
shopt -u nullglob

# Pick the first wallpaper as default
DEFAULT_WALLPAPER=$(find "${ASSETS_DIR}" -maxdepth 1 -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | head -1)
if [ -n "$DEFAULT_WALLPAPER" ]; then
    DEFAULT_WALLPAPER_NAME=$(basename "$DEFAULT_WALLPAPER")
    echo "  Default wallpaper: ${DEFAULT_WALLPAPER_NAME}"
fi

# Step 4: Configure LXQt desktop
echo "[4/5] Configuring LXQt desktop..."

# LXQt panel configuration
ssh_cmd "cat > ~/.config/lxqt/panel.conf" << 'PANEL_CONF'
[General]
__userfile__=true

[panel1]
alignment=0
animation-duration=0
background-color=@Variant(\0\0\0\x43\0\xff\xff\0\0\0\0\0\0\0\0)
background-image=
desktop=0
font-color=@Variant(\0\0\0\x43\0\xff\xff\xff\xff\xff\xff\xff\xff\0\0)
hidable=false
icon-size=22
lineCount=1
lockPanel=false
opacity=90
panelSize=32
position=Bottom
reserve-space=true
show-delay=0
visible-margin=true
width=100
width-percent=true

[panel1/plugins/desktopswitch]
alignment=Left
type=desktopswitch

[panel1/plugins/mainmenu]
alignment=Left
type=mainmenu

[panel1/plugins/quicklaunch]
alignment=Left
type=quicklaunch

[panel1/plugins/taskbar]
alignment=Left
type=taskbar

[panel1/plugins/tray]
alignment=Right
type=tray

[panel1/plugins/cpuload]
alignment=Right
type=cpuload

[panel1/plugins/worldclock]
alignment=Right
type=worldclock
PANEL_CONF

# LXQt session settings (pre-select Openbox window manager)
ssh_cmd "cat > ~/.config/lxqt/session.conf" << 'SESSION_CONF'
[General]
__userfile__=true
window_manager=openbox

[Environment]
TERM=xterm-256color

[Mouse]
cursor_size=24

[Keyboard]
use_numlockx=true
SESSION_CONF

# Desktop wallpaper configuration (pcmanfm-qt uses default profile in VNC mode)
if [ -n "$DEFAULT_WALLPAPER_NAME" ]; then
    echo "  Setting wallpaper in pcmanfm-qt default profile..."
    ssh_cmd "mkdir -p ~/.config/pcmanfm-qt/default"
    # Use sed to update the Wallpaper line in existing settings, or create new file
    ssh_cmd "if [ -f ~/.config/pcmanfm-qt/default/settings.conf ]; then
        sed -i 's|^Wallpaper=.*|Wallpaper=/home/rubigo/.local/share/wallpapers/${DEFAULT_WALLPAPER_NAME}|' ~/.config/pcmanfm-qt/default/settings.conf
    else
        cat > ~/.config/pcmanfm-qt/default/settings.conf << 'SETTINGS'
[Desktop]
Wallpaper=/home/rubigo/.local/share/wallpapers/${DEFAULT_WALLPAPER_NAME}
WallpaperMode=stretch
BgColor=#2e3440
FgColor=#d8dee9
ShadowColor=#000000
SETTINGS
    fi"
fi

# Step 5: Verify
echo "[5/5] Verifying installation..."
ssh_cmd "ls -la ~/.local/share/wallpapers/"
echo ""
echo "=== Bake Complete ==="
echo ""
echo "The VM is now customized with:"
echo "  - Rubigo wallpapers"
echo "  - LXQt panel configuration"
echo "  - Desktop settings"
echo ""
echo "To finalize, shutdown the VM:"
echo "  ssh -p ${SSH_PORT} ${SSH_USER}@${VM_HOST} 'sudo poweroff'"
echo ""
echo "Then the template image can be used for production VMs."
