/**
 * Image Baker
 * 
 * Applies desktop customizations to a running VM via SSH.
 * Replaces bake-image.sh functionality.
 */

import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { sshExec, scpTo, waitForSsh, type SshConfig } from "./ssh-client";
import type { VdiConfig, BakeProgress, ProgressCallback } from "./types";

export interface BakeOptions {
    /** Directory containing wallpaper images */
    wallpapersDir?: string;
    /** Default wallpaper filename */
    defaultWallpaper?: string;
}

/**
 * Bake customizations into a running VM
 */
export async function bakeImage(
    config: VdiConfig,
    sshConfig: SshConfig,
    options: BakeOptions = {},
    onProgress?: ProgressCallback
): Promise<void> {
    const report = (phase: BakeProgress["phase"], progress: number, message: string) => {
        onProgress?.({ phase, progress, message });
        console.log(`[ImageBaker] ${message}`);
    };

    const wallpapersDir = options.wallpapersDir || join(config.vdiDir, "assets", "wallpapers");

    // Step 1: Wait for SSH
    report("waiting", 0, "Waiting for SSH connection...");

    const connected = await waitForSsh(sshConfig, 30, 2);
    if (!connected) {
        throw new Error("Could not establish SSH connection to VM");
    }

    report("ssh", 10, "SSH connection established");

    // Step 2: Create directories and configure environment
    report("directories", 20, "Creating directories and configuring environment...");

    await sshExec(sshConfig, `mkdir -p ~/.local/share/rubigo/wallpapers`);
    await sshExec(sshConfig, `mkdir -p ~/.config/lxqt`);
    await sshExec(sshConfig, `mkdir -p ~/.config/pcmanfm-qt/default`);

    // Add DISPLAY to .bashrc for terminal apps
    await sshExec(sshConfig, `grep -q "export DISPLAY" ~/.bashrc || echo 'export DISPLAY=:1' >> ~/.bashrc`);
    await sshExec(sshConfig, `grep -q "xhost +local" ~/.bashrc || echo 'xhost +local: 2>/dev/null || true' >> ~/.bashrc`);

    report("directories", 30, "Directories created");

    // Step 3: Copy wallpapers
    report("wallpapers", 40, "Copying wallpapers...");

    let defaultWallpaperPath = "";

    if (existsSync(wallpapersDir)) {
        const wallpapers = readdirSync(wallpapersDir).filter((f) =>
            /\.(jpg|jpeg|png|webp)$/i.test(f)
        );

        for (const wallpaper of wallpapers) {
            const localPath = join(wallpapersDir, wallpaper);
            const remotePath = `~/.local/share/rubigo/wallpapers/${wallpaper}`;

            const result = await scpTo(sshConfig, localPath, remotePath);
            if (result.success) {
                console.log(`  Copied: ${wallpaper}`);

                // Set default wallpaper
                if (!defaultWallpaperPath || wallpaper === options.defaultWallpaper) {
                    defaultWallpaperPath = `/home/${sshConfig.username}/.local/share/rubigo/wallpapers/${wallpaper}`;
                }
            }
        }
    }

    report("wallpapers", 60, "Wallpapers copied");

    // Step 4: Configure LXQt desktop
    report("config", 70, "Configuring LXQt desktop...");

    // Set window manager to openbox
    await sshExec(sshConfig, `
mkdir -p ~/.config/lxqt
cat > ~/.config/lxqt/session.conf << 'EOF'
[General]
window_manager=openbox
EOF
`);

    // Configure wallpaper in pcmanfm-qt
    if (defaultWallpaperPath) {
        await sshExec(sshConfig, `
mkdir -p ~/.config/pcmanfm-qt/default
cat > ~/.config/pcmanfm-qt/default/settings.conf << EOF
[Desktop]
Wallpaper=${defaultWallpaperPath}
WallpaperMode=stretch
BgColor=#1a1a2e
EOF
`);
        report("config", 80, `Wallpaper set to: ${defaultWallpaperPath}`);
    }

    // Step 5: Update VNC service
    report("vnc-service", 85, "Updating VNC systemd service...");

    await sshExec(sshConfig, `
cat > /tmp/vnc.service << 'EOF'
[Unit]
Description=TigerVNC Server on display %i
After=network.target

[Service]
Type=forking
User=${sshConfig.username}
Environment=HOME=/home/${sshConfig.username}
WorkingDirectory=/home/${sshConfig.username}
ExecStart=/usr/bin/vncserver -localhost no -geometry 1920x1080 -depth 24 :%i
ExecStop=/usr/bin/vncserver -kill :%i
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo cp /tmp/vnc.service /etc/systemd/system/vnc@.service
sudo systemctl daemon-reload
sudo systemctl enable vnc@1.service
`);

    report("vnc-service", 95, "VNC service configured");

    report("complete", 100, "Bake complete! VM is customized.");
}

/**
 * Verify bake was successful
 */
export async function verifyBake(sshConfig: SshConfig): Promise<{
    wallpapers: boolean;
    vncService: boolean;
    lxqtConfig: boolean;
}> {
    const wallpapersResult = await sshExec(sshConfig, "ls ~/.local/share/rubigo/wallpapers/*.jpeg 2>/dev/null | wc -l");
    const vncResult = await sshExec(sshConfig, "systemctl is-enabled vnc@1.service 2>/dev/null");
    const lxqtResult = await sshExec(sshConfig, "test -f ~/.config/lxqt/session.conf && echo ok");

    return {
        wallpapers: parseInt(wallpapersResult.stdout.trim()) > 0,
        vncService: vncResult.stdout.trim() === "enabled",
        lxqtConfig: lxqtResult.stdout.trim() === "ok",
    };
}
