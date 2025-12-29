#!/bin/bash
#
# VM Start Script for Rubigo Virtual Desktop
#
# Manages QEMU parameters for running the Ubuntu desktop VM.
#
# Usage:
#   ./start-vm.sh              # Start VM with default settings
#   ./start-vm.sh bake         # Boot for cloud-init baking (first boot)
#   ./start-vm.sh --help       # Show help
#

set -e

VDI_DIR="$(dirname "$0")"
IMAGE="${VDI_DIR}/images/ubuntu-desktop.qcow2"
CLOUD_INIT_ISO="${VDI_DIR}/.work/cloud-init.iso"

# --------------------------------------------------
# QEMU Configuration
# --------------------------------------------------

# System resources
MEMORY="4096"                    # RAM in MB
CPUS="2"                         # Number of CPU cores

# VNC Configuration
QEMU_VNC_DISPLAY=":0"            # QEMU console VNC (port 5900)

# Network / Port Forwarding
# The VM runs TigerVNC on port 5901 (display :1)
# We forward host port 15901 -> guest port 5901
HOST_VNC_PORT="15901"
GUEST_VNC_PORT="5901"

# --------------------------------------------------
# Helper Functions
# --------------------------------------------------

show_help() {
    echo "VM Start Script for Rubigo Virtual Desktop"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (default)   Start the VM with standard settings"
    echo "  bake        Boot with cloud-init ISO attached (first boot setup)"
    echo "  --help      Show this help message"
    echo ""
    echo "VNC Access:"
    echo "  QEMU Console:   localhost:5900  (raw VM display, no password)"
    echo "  XFCE Desktop:   localhost:15901 (TigerVNC, password: rubigo)"
    echo ""
    echo "VM Credentials:"
    echo "  Username: rubigo"
    echo "  Password: rubigo"
}

check_image() {
    if [ ! -f "$IMAGE" ]; then
        echo "ERROR: VM image not found: $IMAGE"
        echo "Run ./build-template.sh first to create the template."
        exit 1
    fi
}

check_existing() {
    if pgrep -f "ubuntu-desktop.qcow2" > /dev/null; then
        echo "WARNING: A VM is already running with this image."
        echo "Kill it first with: pkill -f 'ubuntu-desktop.qcow2'"
        exit 1
    fi
}

# --------------------------------------------------
# Main
# --------------------------------------------------

case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    
    bake)
        # First boot - apply cloud-init configuration
        echo "=== Baking VM Template (First Boot) ==="
        check_image
        check_existing
        
        if [ ! -f "$CLOUD_INIT_ISO" ]; then
            echo "ERROR: Cloud-init ISO not found: $CLOUD_INIT_ISO"
            echo "Run ./build-template.sh first."
            exit 1
        fi
        
        echo "Starting VM with cloud-init..."
        echo "This will install packages and configure VNC (~5-10 minutes)."
        echo ""
        echo "VNC Access: localhost:5900 (QEMU console)"
        echo "Login: rubigo / rubigo"
        echo ""
        
        qemu-system-x86_64 \
            -enable-kvm \
            -cpu host \
            -m "$MEMORY" \
            -smp "$CPUS" \
            -drive file="$IMAGE",format=qcow2 \
            -cdrom "$CLOUD_INIT_ISO" \
            -vga std \
            -vnc "$QEMU_VNC_DISPLAY" \
            -nic user,hostfwd=tcp::${HOST_VNC_PORT}-:${GUEST_VNC_PORT},hostfwd=tcp::2222-:22
        ;;
    
    *)
        # Standard run - no cloud-init ISO
        echo "=== Starting Rubigo Desktop VM ==="
        check_image
        check_existing
        
        echo "VNC Access:"
        echo "  QEMU Console: localhost:5900"
        echo "  XFCE Desktop: localhost:15901 (password: rubigo)"
        echo ""
        
        qemu-system-x86_64 \
            -enable-kvm \
            -cpu host \
            -m "$MEMORY" \
            -smp "$CPUS" \
            -drive file="$IMAGE",format=qcow2 \
            -vnc "$QEMU_VNC_DISPLAY" \
            -nic user,hostfwd=tcp::${HOST_VNC_PORT}-:${GUEST_VNC_PORT} &
        
        echo "VM started in background (PID: $!)"
        echo "To stop: pkill -f 'ubuntu-desktop.qcow2'"
        ;;
esac
