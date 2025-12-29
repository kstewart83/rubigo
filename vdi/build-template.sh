#!/bin/bash
#
# VM Template Builder for Rubigo Virtual Desktop
#
# Creates Ubuntu 24.04 desktop images with LXQt + TigerVNC
# for use with Cloud Hypervisor.
#
# LXQt is lighter than XFCE (~419MB RAM at idle) for faster boot times.
#
# Usage: ./build-template.sh [template-name]
# Example: ./build-template.sh ubuntu-desktop
#

set -e

TEMPLATE_NAME="${1:-ubuntu-desktop}"
VDI_DIR="$(dirname "$0")"
IMAGES_DIR="${VDI_DIR}/images"
CACHE_DIR="${VDI_DIR}/.cache"
WORK_DIR="${VDI_DIR}/.work"

# Ubuntu 24.04 cloud image
UBUNTU_URL="https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img"
UBUNTU_IMG="ubuntu-24.04-cloud.qcow2"

# Template configuration
TEMPLATE_SIZE="20G"  # Resize disk to 20GB
VNC_PASSWORD="rubigo"

echo "=== Rubigo VM Template Builder ==="
echo "Template: ${TEMPLATE_NAME}"
echo "Desktop: LXQt (lightweight)"
echo ""

# Create directories
mkdir -p "${IMAGES_DIR}" "${CACHE_DIR}" "${WORK_DIR}"

# Step 1: Download Ubuntu cloud image
if [ ! -f "${CACHE_DIR}/${UBUNTU_IMG}" ]; then
    echo "[1/5] Downloading Ubuntu 24.04 cloud image..."
    wget -q --show-progress -O "${CACHE_DIR}/${UBUNTU_IMG}" "${UBUNTU_URL}"
else
    echo "[1/5] Using cached Ubuntu 24.04 cloud image"
fi

# Step 2: Copy and resize image
echo "[2/5] Preparing template disk..."
TEMPLATE_PATH="${IMAGES_DIR}/${TEMPLATE_NAME}.qcow2"
cp "${CACHE_DIR}/${UBUNTU_IMG}" "${TEMPLATE_PATH}"
qemu-img resize "${TEMPLATE_PATH}" "${TEMPLATE_SIZE}"

# Step 3: Create cloud-init configuration
echo "[3/5] Creating cloud-init configuration..."

cat > "${WORK_DIR}/meta-data" << EOF
instance-id: rubigo-template
local-hostname: rubigo-desktop
EOF

cat > "${WORK_DIR}/user-data" << EOF
#cloud-config
users:
  - name: rubigo
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    # Password: rubigo
    passwd: \$6\$khYzuIZ3/QzUgiDH\$x20Mh4XZ0UH435Vp7hV7fDKtG2lIjlK58eamu9MuFisxijv1BnIfHLqXiNOZjc.W5RiQDSoLqgxK0oTuA0oi/.
    ssh_authorized_keys:
      - $(cat ~/.ssh/id_ed25519.pub 2>/dev/null || cat ~/.ssh/id_rsa.pub 2>/dev/null || echo "# No SSH key found")

# Expand root filesystem
growpart:
  mode: auto
  devices: ['/']

# Install packages - LXQt is lighter than XFCE
packages:
  - lxqt
  - lxqt-core
  - openbox
  - tigervnc-standalone-server
  - dbus-x11
  - sddm
  - pcmanfm-qt
  - qterminal

# Run commands after boot
runcmd:
  # Set up VNC for rubigo user
  - mkdir -p /home/rubigo/.vnc
  - echo "${VNC_PASSWORD}" | vncpasswd -f > /home/rubigo/.vnc/passwd
  - chmod 600 /home/rubigo/.vnc/passwd
  - chown -R rubigo:rubigo /home/rubigo/.vnc
  
  # Create VNC xstartup script for LXQt
  - |
    cat > /home/rubigo/.vnc/xstartup << 'XSTARTUP'
    #!/bin/bash
    unset SESSION_MANAGER
    unset DBUS_SESSION_BUS_ADDRESS
    export XDG_SESSION_TYPE=x11
    export XDG_CURRENT_DESKTOP=LXQt
    exec startlxqt
    XSTARTUP
  - chmod +x /home/rubigo/.vnc/xstartup
  - chown rubigo:rubigo /home/rubigo/.vnc/xstartup
  
  # Create systemd service for VNC
  - |
    cat > /etc/systemd/system/vnc@.service << 'VNCSERVICE'
    [Unit]
    Description=TigerVNC Server on display %i
    After=network.target

    [Service]
    Type=simple
    User=rubigo
    PIDFile=/home/rubigo/.vnc/%H:%i.pid
    ExecStartPre=/usr/bin/vncserver -kill :%i > /dev/null 2>&1 || :
    ExecStart=/usr/bin/vncserver -localhost no -geometry 1920x1080 -depth 24 :%i
    ExecStop=/usr/bin/vncserver -kill :%i

    [Install]
    WantedBy=multi-user.target
    VNCSERVICE
  
  # Disable SDDM (we use VNC, not local display)
  - systemctl disable sddm || true
  
  # Enable VNC on display :1 (port 5901)
  - systemctl daemon-reload
  - systemctl enable vnc@1.service
  - systemctl start vnc@1.service

# Final message
final_message: "Rubigo Desktop template ready! VNC available on port 5901 (LXQt)"
EOF

# Step 4: Create cloud-init ISO
echo "[4/5] Creating cloud-init ISO..."
if command -v genisoimage &> /dev/null; then
    genisoimage -output "${WORK_DIR}/cloud-init.iso" -volid cidata -joliet -rock \
        "${WORK_DIR}/user-data" "${WORK_DIR}/meta-data"
elif command -v mkisofs &> /dev/null; then
    mkisofs -output "${WORK_DIR}/cloud-init.iso" -volid cidata -joliet -rock \
        "${WORK_DIR}/user-data" "${WORK_DIR}/meta-data"
else
    echo "ERROR: genisoimage or mkisofs is required"
    echo "Install with: sudo apt install genisoimage"
    exit 1
fi

# Step 5: Instructions for baking the image
echo "[5/5] Template prepared!"
echo ""
echo "=== Next Steps ==="
echo ""
echo "The template image is ready but needs to be booted once to apply cloud-init."
echo "You can do this with QEMU:"
echo ""
echo "  qemu-system-x86_64 -enable-kvm -m 4096 -smp 2 \\"
echo "    -drive file=${TEMPLATE_PATH},format=qcow2 \\"
echo "    -cdrom ${WORK_DIR}/cloud-init.iso \\"
echo "    -nographic"
echo ""
echo "Wait for the VM to finish setup (about 5-10 minutes), then:"
echo "  1. Login as 'rubigo' (password: rubigo)"
echo "  2. Verify VNC is running: systemctl status vnc@1"
echo "  3. Shutdown: sudo poweroff"
echo ""
echo "The template will then be ready for Cloud Hypervisor!"
echo ""
echo "Template location: ${TEMPLATE_PATH}"
