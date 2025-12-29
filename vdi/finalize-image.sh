#!/bin/bash
#
# Finalize Image Script for Rubigo Virtual Desktop
#
# Takes the currently baked VM image and creates a "golden" snapshot
# that can be used for fast boots without cloud-init processing.
#
# Prerequisites:
#   1. Run ./build-template.sh to create base image
#   2. Run ./start-vm.sh bake to apply cloud-init
#   3. Run ./bake-image.sh to apply desktop customizations
#   4. Shut down the VM cleanly (sudo shutdown -h now from inside)
#
# Usage:
#   ./finalize-image.sh              # Create golden image from current
#   ./finalize-image.sh --compress   # Create compressed golden image (slower, smaller)
#

set -e

VDI_DIR="$(dirname "$0")"
SOURCE_IMAGE="${VDI_DIR}/images/ubuntu-desktop.qcow2"
GOLDEN_IMAGE="${VDI_DIR}/images/ubuntu-desktop-golden.qcow2"
BACKUP_IMAGE="${VDI_DIR}/images/ubuntu-desktop-backup.qcow2"

echo "=== Finalize Rubigo Desktop Image ==="
echo ""

# --------------------------------------------------
# Validation
# --------------------------------------------------

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "ERROR: Source image not found: $SOURCE_IMAGE"
    echo "Run ./build-template.sh first."
    exit 1
fi

# Check if VM is still running
if pgrep -f "ubuntu-desktop.qcow2" > /dev/null; then
    echo "ERROR: VM is still running!"
    echo ""
    echo "Please shut down the VM cleanly first:"
    echo "  1. SSH: ssh -p 2222 rubigo@localhost 'sudo shutdown -h now'"
    echo "  2. Or from QEMU console: sudo shutdown -h now"
    echo ""
    echo "Wait for the qemu process to exit, then run this script again."
    exit 1
fi

# --------------------------------------------------
# Create Golden Image
# --------------------------------------------------

echo "Creating golden snapshot..."
echo "  Source: $SOURCE_IMAGE"
echo "  Output: $GOLDEN_IMAGE"
echo ""

# Backup existing golden image if present
if [ -f "$GOLDEN_IMAGE" ]; then
    echo "Backing up previous golden image..."
    mv "$GOLDEN_IMAGE" "$BACKUP_IMAGE"
fi

# Create the golden image
if [ "${1:-}" = "--compress" ]; then
    echo "Creating compressed image (this takes a while)..."
    qemu-img convert -O qcow2 -c "$SOURCE_IMAGE" "$GOLDEN_IMAGE"
else
    echo "Creating snapshot (fast copy)..."
    # Use qemu-img to create a clean copy with trimmed sparse areas
    qemu-img convert -O qcow2 "$SOURCE_IMAGE" "$GOLDEN_IMAGE"
fi

# Get file sizes
SOURCE_SIZE=$(du -h "$SOURCE_IMAGE" | cut -f1)
GOLDEN_SIZE=$(du -h "$GOLDEN_IMAGE" | cut -f1)

echo ""
echo "=== Golden Image Created ==="
echo ""
echo "  Source size:  $SOURCE_SIZE"
echo "  Golden size:  $GOLDEN_SIZE"
echo "  Location:     $GOLDEN_IMAGE"
echo ""
echo "To use the golden image:"
echo "  ./start-vm.sh run"
echo ""
echo "Note: The original image (ubuntu-desktop.qcow2) can be rebuilt"
echo "      from scratch with ./build-template.sh if needed."
