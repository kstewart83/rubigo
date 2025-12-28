/**
 * Cloud Hypervisor Binary Management
 *
 * Self-managing binary lifecycle:
 * - Auto-download latest releases from GitHub
 * - Version tracking and updates
 * - Binary health checks
 */

import { spawn } from "child_process";
import { existsSync, mkdirSync, chmodSync } from "fs";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";

// Configuration
const CH_RELEASES_URL = "https://api.github.com/repos/cloud-hypervisor/cloud-hypervisor/releases/latest";
const BINARIES_DIR = process.env.CH_BINARIES_DIR || join(process.cwd(), ".vdi", "bin");
const VERSION_FILE = join(BINARIES_DIR, "version.json");

interface VersionInfo {
    version: string;
    downloadedAt: string;
    binaryPath: string;
}

interface GitHubRelease {
    tag_name: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

/**
 * Ensure binaries directory exists
 */
function ensureBinDir(): void {
    if (!existsSync(BINARIES_DIR)) {
        mkdirSync(BINARIES_DIR, { recursive: true });
    }
}

/**
 * Get current installed version info
 */
async function getCurrentVersion(): Promise<VersionInfo | null> {
    try {
        const data = await readFile(VERSION_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Save version info
 */
async function saveVersionInfo(info: VersionInfo): Promise<void> {
    await writeFile(VERSION_FILE, JSON.stringify(info, null, 2));
}

/**
 * Fetch latest release info from GitHub
 */
async function fetchLatestRelease(): Promise<GitHubRelease> {
    const response = await fetch(CH_RELEASES_URL, {
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Rubigo-VDI",
        },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Failed to fetch releases: ${response.status} ${response.statusText} - ${text}`);
    }

    const text = await response.text();
    if (!text) {
        throw new Error("Empty response from GitHub API");
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error(`Failed to parse GitHub response: ${text.substring(0, 200)}`);
    }
}

/**
 * Download Cloud Hypervisor binary
 */
async function downloadBinary(url: string, version: string): Promise<string> {
    console.log(`[CH] Downloading Cloud Hypervisor ${version}...`);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const binaryPath = join(BINARIES_DIR, `cloud-hypervisor-${version}`);

    await writeFile(binaryPath, Buffer.from(buffer));
    chmodSync(binaryPath, 0o755);

    console.log(`[CH] Downloaded to ${binaryPath}`);
    return binaryPath;
}

/**
 * Get the asset URL for the static binary
 */
function getStaticBinaryAsset(release: GitHubRelease): { name: string; url: string } | null {
    // Look for the static binary (no dynamic linking)
    const asset = release.assets.find(
        (a) => a.name === "cloud-hypervisor-static" || a.name.includes("static")
    );

    if (asset) {
        return { name: asset.name, url: asset.browser_download_url };
    }

    // Fallback to regular binary
    const regular = release.assets.find((a) => a.name === "cloud-hypervisor");
    if (regular) {
        return { name: regular.name, url: regular.browser_download_url };
    }

    return null;
}

/**
 * Ensure Cloud Hypervisor is installed and up to date
 * Returns path to the binary
 */
export async function ensureCloudHypervisor(): Promise<string> {
    ensureBinDir();

    const current = await getCurrentVersion();
    const release = await fetchLatestRelease();
    const latestVersion = release.tag_name;

    // Check if we have the latest version
    if (current && current.version === latestVersion && existsSync(current.binaryPath)) {
        console.log(`[CH] Cloud Hypervisor ${latestVersion} is up to date`);
        return current.binaryPath;
    }

    // Need to download
    const asset = getStaticBinaryAsset(release);
    if (!asset) {
        throw new Error("Could not find Cloud Hypervisor binary in release assets");
    }

    // Clean up old binary if exists
    if (current?.binaryPath && existsSync(current.binaryPath)) {
        await unlink(current.binaryPath);
    }

    const binaryPath = await downloadBinary(asset.url, latestVersion);

    await saveVersionInfo({
        version: latestVersion,
        downloadedAt: new Date().toISOString(),
        binaryPath,
    });

    return binaryPath;
}

/**
 * Get the path to Cloud Hypervisor binary (without auto-update)
 * Returns null if not installed
 */
export async function getCloudHypervisorPath(): Promise<string | null> {
    const current = await getCurrentVersion();
    if (current && existsSync(current.binaryPath)) {
        return current.binaryPath;
    }
    return null;
}

/**
 * Check if Cloud Hypervisor is installed
 */
export async function isCloudHypervisorInstalled(): Promise<boolean> {
    const path = await getCloudHypervisorPath();
    return path !== null;
}

/**
 * Get Cloud Hypervisor version info
 */
export async function getCloudHypervisorInfo(): Promise<{
    installed: boolean;
    version?: string;
    binaryPath?: string;
    latestVersion?: string;
}> {
    const current = await getCurrentVersion();

    try {
        const release = await fetchLatestRelease();
        return {
            installed: current !== null && existsSync(current?.binaryPath || ""),
            version: current?.version,
            binaryPath: current?.binaryPath,
            latestVersion: release.tag_name,
        };
    } catch {
        return {
            installed: current !== null && existsSync(current?.binaryPath || ""),
            version: current?.version,
            binaryPath: current?.binaryPath,
        };
    }
}

/**
 * Verify Cloud Hypervisor binary works
 */
export async function verifyCloudHypervisor(): Promise<boolean> {
    const binaryPath = await getCloudHypervisorPath();
    if (!binaryPath) return false;

    return new Promise((resolve) => {
        const proc = spawn(binaryPath, ["--version"], {
            timeout: 5000,
        });

        proc.on("close", (code) => {
            resolve(code === 0);
        });

        proc.on("error", () => {
            resolve(false);
        });
    });
}
