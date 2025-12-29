/**
 * Template Builder
 * 
 * Creates base VM template images with cloud-init configuration.
 * Replaces build-template.sh functionality.
 */

import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { writeFile, readFile } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";
import type { VdiConfig, TemplateConfig, CloudInitConfig, BuildProgress, ProgressCallback } from "./types";

/**
 * Build a VM template from cloud image
 */
export async function buildTemplate(
    config: VdiConfig,
    template: TemplateConfig,
    onProgress?: ProgressCallback
): Promise<string> {
    const report = (phase: BuildProgress["phase"], progress: number, message: string) => {
        onProgress?.({ phase, progress, message });
        console.log(`[TemplateBuilder] ${message}`);
    };

    // Ensure directories
    [config.imagesDir, config.workDir, config.cacheDir].forEach((dir) => {
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    });

    const imageName = `${template.name}.qcow2`;
    const imagePath = join(config.imagesDir, imageName);
    const cachedImagePath = join(config.cacheDir, basename(template.baseImageUrl));

    // Step 1: Download base image if not cached
    report("download", 0, "Checking for cached base image...");

    if (!existsSync(cachedImagePath)) {
        report("download", 10, `Downloading base image from ${template.baseImageUrl}...`);
        await $`wget -q --show-progress -O ${cachedImagePath} ${template.baseImageUrl}`;
        report("download", 40, "Download complete");
    } else {
        report("download", 40, "Using cached base image");
    }

    // Step 2: Create and resize image
    report("resize", 50, `Creating ${template.diskSizeGb}GB disk image...`);

    await $`qemu-img convert -f qcow2 -O qcow2 ${cachedImagePath} ${imagePath}`;
    await $`qemu-img resize ${imagePath} ${template.diskSizeGb}G`;

    report("resize", 60, "Disk image created and resized");

    // Step 3: Create cloud-init ISO
    report("cloud-init", 70, "Generating cloud-init configuration...");

    const cloudInitConfig: CloudInitConfig = {
        username: template.username,
        password: template.password,
        packages: template.packages,
        vncPassword: template.vncPassword,
        sshPublicKey: await getSshPublicKey(),
    };

    await createCloudInitIso(config.workDir, cloudInitConfig);

    report("cloud-init", 90, "Cloud-init ISO created");

    report("complete", 100, `Template built: ${imagePath}`);

    return imagePath;
}

/**
 * Get user's SSH public key if available
 */
async function getSshPublicKey(): Promise<string | undefined> {
    const keyPaths = [
        join(homedir(), ".ssh", "id_ed25519.pub"),
        join(homedir(), ".ssh", "id_rsa.pub"),
    ];

    for (const keyPath of keyPaths) {
        if (existsSync(keyPath)) {
            const key = await readFile(keyPath, "utf-8");
            return key.trim();
        }
    }
    return undefined;
}

/**
 * Create cloud-init ISO with user-data and meta-data
 */
async function createCloudInitIso(
    workDir: string,
    config: CloudInitConfig
): Promise<string> {
    const isoPath = join(workDir, "cloud-init.iso");
    const dataDir = join(workDir, "cloud-init-data");

    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    // Generate user-data YAML
    const userData = generateUserData(config);
    const metaData = generateMetaData();

    await writeFile(join(dataDir, "user-data"), userData);
    await writeFile(join(dataDir, "meta-data"), metaData);

    // Create ISO
    await $`genisoimage -output ${isoPath} -volid cidata -joliet -rock ${join(dataDir, "user-data")} ${join(dataDir, "meta-data")}`.quiet();

    return isoPath;
}

/**
 * Generate cloud-init user-data YAML
 */
function generateUserData(config: CloudInitConfig): string {
    const sshKeysYaml = config.sshPublicKey
        ? `ssh_authorized_keys:\n    - ${config.sshPublicKey}`
        : "";

    const packagesYaml = config.packages.map((p) => `  - ${p}`).join("\n");

    return `#cloud-config
hostname: rubigo-desktop
manage_etc_hosts: true

users:
  - name: ${config.username}
    groups: sudo, users
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    lock_passwd: false
    passwd: $(openssl passwd -6 ${config.password})
    ${sshKeysYaml}

growpart:
  mode: auto
  devices: ['/']

packages:
${packagesYaml}

runcmd:
  # Set up VNC for user
  - mkdir -p /home/${config.username}/.vnc
  - echo "${config.vncPassword}" | vncpasswd -f > /home/${config.username}/.vnc/passwd
  - chmod 600 /home/${config.username}/.vnc/passwd
  - chown -R ${config.username}:${config.username} /home/${config.username}/.vnc
  
  # Create VNC xstartup script for LXQt
  - |
    cat > /home/${config.username}/.vnc/xstartup << 'XSTARTUP'
    #!/bin/bash
    unset SESSION_MANAGER
    unset DBUS_SESSION_BUS_ADDRESS
    export XDG_SESSION_TYPE=x11
    export XDG_CURRENT_DESKTOP=LXQt
    exec startlxqt
    XSTARTUP
  - chmod +x /home/${config.username}/.vnc/xstartup
  - chown ${config.username}:${config.username} /home/${config.username}/.vnc/xstartup
  
  # Create systemd service for VNC
  - |
    cat > /etc/systemd/system/vnc@.service << 'VNCSERVICE'
    [Unit]
    Description=TigerVNC Server on display %i
    After=network.target

    [Service]
    Type=forking
    User=${config.username}
    Environment=HOME=/home/${config.username}
    WorkingDirectory=/home/${config.username}
    ExecStart=/usr/bin/vncserver -localhost no -geometry 1920x1080 -depth 24 :%i
    ExecStop=/usr/bin/vncserver -kill :%i
    Restart=on-failure
    RestartSec=5

    [Install]
    WantedBy=multi-user.target
    VNCSERVICE
  
  # Disable SDDM (we use VNC, not local display)
  - systemctl disable sddm || true
  
  # Enable VNC on display :1 (port 5901)
  - systemctl daemon-reload
  - systemctl enable vnc@1.service
  - systemctl start vnc@1.service

final_message: "Rubigo Desktop template ready! VNC available on port 5901"
`;
}

/**
 * Generate cloud-init meta-data
 */
function generateMetaData(): string {
    return `instance-id: rubigo-desktop-001
local-hostname: rubigo-desktop
`;
}

/**
 * Check if template image exists
 */
export function templateExists(
    config: VdiConfig,
    template: TemplateConfig
): boolean {
    const imagePath = join(config.imagesDir, `${template.name}.qcow2`);
    return existsSync(imagePath);
}

/**
 * Get path to template image
 */
export function getTemplatePath(
    config: VdiConfig,
    template: TemplateConfig
): string {
    return join(config.imagesDir, `${template.name}.qcow2`);
}
