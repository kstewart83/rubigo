/**
 * Virtual Desktop Types
 *
 * TypeScript type definitions for the Virtual Desktop module.
 */

/**
 * Status of a virtual desktop instance
 */
export type DesktopStatus =
    | "creating"
    | "starting"
    | "running"
    | "stopping"
    | "stopped"
    | "error";

/**
 * Available desktop templates
 */
export type DesktopTemplate = "ubuntu-desktop" | "ubuntu-server" | "windows-11";

/**
 * Virtual desktop instance
 */
export interface VirtualDesktop {
    id: string;
    userId: string;
    name: string;
    template: DesktopTemplate;
    status: DesktopStatus;
    vncPort?: number;
    createdAt: string;
    lastAccessedAt?: string;
}

/**
 * Connection info for establishing a desktop session
 */
export interface DesktopConnection {
    /** WebSocket URL for Guacamole tunnel */
    tunnelUrl: string;
    /** Authentication token */
    token: string;
    /** Guacamole connection parameters */
    connectionParams: {
        hostname: string;
        port: number;
        protocol: "vnc" | "rdp" | "ssh";
        password?: string;
    };
}

/**
 * Template information for creating new desktops
 */
export interface DesktopTemplateInfo {
    id: DesktopTemplate;
    name: string;
    description: string;
    cpus: number;
    memoryMb: number;
    os: "linux" | "windows";
}

/**
 * Request to create a new desktop
 */
export interface CreateDesktopRequest {
    name: string;
    template: DesktopTemplate;
}

/**
 * Request to update desktop state
 */
export interface UpdateDesktopRequest {
    action: "start" | "stop" | "restart";
}
