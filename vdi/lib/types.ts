/**
 * VDI Types
 * 
 * Common type definitions for VDI orchestration.
 */

export interface VdiConfig {
    /** Directory containing VDI scripts and assets */
    vdiDir: string;
    /** Directory for VM images */
    imagesDir: string;
    /** Directory for work files (cloud-init ISO, etc) */
    workDir: string;
    /** Directory for cached downloads */
    cacheDir: string;
    /** Directory for VM disk files */
    vmsDir: string;
}

export interface TemplateConfig {
    /** Template name/ID */
    name: string;
    /** Display name */
    displayName: string;
    /** Base image URL */
    baseImageUrl: string;
    /** Disk size in GB */
    diskSizeGb: number;
    /** RAM in MB */
    memoryMb: number;
    /** Number of CPUs */
    cpus: number;
    /** Packages to install via cloud-init */
    packages: string[];
    /** VNC password */
    vncPassword: string;
    /** User account name */
    username: string;
    /** User password */
    password: string;
}

export interface CloudInitConfig {
    username: string;
    password: string;
    packages: string[];
    vncPassword: string;
    sshPublicKey?: string;
}

export interface BuildProgress {
    phase: "download" | "resize" | "cloud-init" | "complete";
    progress: number; // 0-100
    message: string;
}

export interface BakeProgress {
    phase: "waiting" | "ssh" | "directories" | "wallpapers" | "config" | "vnc-service" | "complete";
    progress: number;
    message: string;
}

export interface VmState {
    id: string;
    name: string;
    status: "stopped" | "starting" | "running" | "stopping";
    vncPort: number | null;
    sshPort: number | null;
    pid: number | null;
}

export type ProgressCallback = (progress: BuildProgress | BakeProgress) => void;

/** Default paths derived from this file's location */
export function getDefaultConfig(): VdiConfig {
    // Get the vdi directory from this file's location (vdi/lib/types.ts -> vdi/)
    const libDir = typeof import.meta.dirname !== 'undefined'
        ? import.meta.dirname
        : __dirname;
    const vdiDir = libDir.replace(/\/lib$/, '');
    return {
        vdiDir,
        imagesDir: `${vdiDir}/images`,
        workDir: `${vdiDir}/.work`,
        cacheDir: `${vdiDir}/.cache`,
        vmsDir: `${vdiDir}/vms`,
    };
}

/** Default template for Lubuntu LXQt desktop */
export function getDefaultTemplate(): TemplateConfig {
    return {
        name: "ubuntu-desktop",
        displayName: "Ubuntu Desktop (LXQt)",
        baseImageUrl: "https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img",
        diskSizeGb: 20,
        memoryMb: 4096,
        cpus: 2,
        packages: [
            "lxqt",
            "lxqt-core",
            "openbox",
            "tigervnc-standalone-server",
            "dbus-x11",
            "sddm",
            "pcmanfm-qt",
            "qterminal",
            "chromium-browser",
        ],
        vncPassword: "rubigo",
        username: "rubigo",
        password: "rubigo",
    };
}
