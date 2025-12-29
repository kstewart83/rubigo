#!/usr/bin/env bun
/**
 * VDI Library Test Script
 * 
 * Tests the TypeScript VDI orchestration library.
 * 
 * Usage:
 *   bun run vdi/lib/test.ts             # Run all tests
 *   bun run vdi/lib/test.ts status      # Check VM status
 *   bun run vdi/lib/test.ts start       # Start VM from golden
 *   bun run vdi/lib/test.ts stop        # Stop VM
 *   bun run vdi/lib/test.ts bake        # Bake running VM
 *   bun run vdi/lib/test.ts finalize    # Finalize to golden
 */

import {
    getDefaultConfig,
    getDefaultTemplate,
    getVmStatus,
    startVmFromGolden,
    startVmDevMode,
    stopVm,
    waitForVmReady,
    isVmRunning,
    bakeImage,
    verifyBake,
    finalizeImage,
    getImageInfo,
    getLocalSshConfig,
} from "./index";

const config = getDefaultConfig();
const template = getDefaultTemplate();

async function main() {
    const command = process.argv[2] || "status";

    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║          VDI Library Test Script                  ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log();

    switch (command) {
        case "status":
            await showStatus();
            break;

        case "start":
            await startVm();
            break;

        case "start-dev":
            await startVmDev();
            break;

        case "stop":
            await stopVmCmd();
            break;

        case "bake":
            await bakeVm();
            break;

        case "finalize":
            await finalizeVm();
            break;

        case "test-ssh":
            await testSsh();
            break;

        default:
            console.log("Unknown command:", command);
            console.log("Available: status, start, start-dev, stop, bake, finalize, test-ssh");
    }
}

async function showStatus() {
    console.log("📊 System Status");
    console.log("─".repeat(50));

    // Image info
    const images = getImageInfo(config);
    console.log("\n📁 Images:");
    console.log(`  Work:   ${images.work.exists ? `✅ ${images.work.size}` : "❌ Not found"}`);
    console.log(`  Golden: ${images.golden.exists ? `✅ ${images.golden.size}` : "❌ Not found"}`);
    console.log(`  Backup: ${images.backup.exists ? `✅ ${images.backup.size}` : "❌ Not found"}`);

    // VM status
    console.log("\n🖥️ VM Status:");
    const vmStatus = await getVmStatus();
    if (vmStatus) {
        console.log(`  Status: ✅ Running (PID: ${vmStatus.pid})`);
        console.log(`  VNC:    localhost:${vmStatus.vncPort}`);
        console.log(`  SSH:    ssh -p ${vmStatus.sshPort} rubigo@localhost`);
    } else {
        console.log("  Status: ⏹️ Stopped");
    }
}

async function startVm() {
    console.log("🚀 Starting VM from golden image...\n");

    try {
        const state = await startVmFromGolden(config);
        console.log("\n✅ VM started successfully!");
        console.log(`  PID: ${state.pid}`);
        console.log(`  VNC: localhost:${state.vncPort}`);
        console.log(`  SSH: ssh -p ${state.sshPort} rubigo@localhost`);
    } catch (error) {
        console.error("❌ Failed to start VM:", error);
    }
}

async function startVmDev() {
    console.log("🚀 Starting VM from work image (dev mode)...\n");

    try {
        const state = await startVmDevMode(config);
        console.log("\n✅ VM started successfully!");
        console.log(`  PID: ${state.pid}`);
    } catch (error) {
        console.error("❌ Failed to start VM:", error);
    }
}

async function stopVmCmd() {
    console.log("⏹️ Stopping VM...\n");

    await stopVm(true);
    console.log("✅ VM stopped");
}

async function bakeVm() {
    console.log("🎂 Baking VM image...\n");

    // Check if VM is running
    if (!(await isVmRunning("ubuntu-desktop"))) {
        console.log("❌ No VM running. Start one first with: bun run vdi/lib/test.ts start-dev");
        return;
    }

    // Wait for SSH
    console.log("Waiting for SSH...");
    const ready = await waitForVmReady(60);
    if (!ready) {
        console.log("❌ VM not ready via SSH");
        return;
    }

    const sshConfig = getLocalSshConfig();

    await bakeImage(config, sshConfig, {}, (progress) => {
        console.log(`  [${progress.phase}] ${progress.progress}% - ${progress.message}`);
    });

    // Verify
    console.log("\n📋 Verifying bake...");
    const verification = await verifyBake(sshConfig);
    console.log(`  Wallpapers: ${verification.wallpapers ? "✅" : "❌"}`);
    console.log(`  VNC Service: ${verification.vncService ? "✅" : "❌"}`);
    console.log(`  LXQt Config: ${verification.lxqtConfig ? "✅" : "❌"}`);

    if (verification.wallpapers && verification.vncService && verification.lxqtConfig) {
        console.log("\n✅ Bake complete! Now:\n");
        console.log("  1. Shutdown VM: bun run vdi/lib/test.ts stop");
        console.log("  2. Finalize:    bun run vdi/lib/test.ts finalize");
    }
}

async function finalizeVm() {
    console.log("📦 Finalizing golden image...\n");

    try {
        const result = await finalizeImage(config, "ubuntu-desktop", { compress: false });

        console.log("\n✅ Golden image created!");
        console.log(`  Path:   ${result.goldenImagePath}`);
        console.log(`  Source: ${result.sourceSize}`);
        console.log(`  Golden: ${result.goldenSize}`);
        if (result.backupPath) {
            console.log(`  Backup: ${result.backupPath}`);
        }
    } catch (error) {
        console.error("❌ Failed to finalize:", error);
    }
}

async function testSsh() {
    console.log("🔐 Testing SSH connection...\n");

    const { sshExec, waitForSsh, getLocalSshConfig } = await import("./ssh-client");
    const sshConfig = getLocalSshConfig();

    console.log(`Connecting to ${sshConfig.username}@${sshConfig.host}:${sshConfig.port}...`);

    const connected = await waitForSsh(sshConfig, 5, 1);
    if (!connected) {
        console.log("❌ Could not connect via SSH");
        return;
    }

    console.log("✅ SSH connected!\n");

    // Test commands
    const uptime = await sshExec(sshConfig, "uptime");
    console.log(`Uptime: ${uptime.stdout.trim()}`);

    const vnc = await sshExec(sshConfig, "ss -tlnp | grep 5901 | head -1");
    console.log(`VNC:    ${vnc.stdout.trim() || "Not listening"}`);
}

main().catch(console.error);
