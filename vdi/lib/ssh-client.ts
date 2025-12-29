/**
 * SSH Client Utility
 * 
 * Simple SSH command execution using Bun's shell.
 */

import { $ } from "bun";

export interface SshConfig {
    host: string;
    port: number;
    username: string;
    /** Path to private key (optional, uses default if not set) */
    privateKeyPath?: string;
    /** Connection timeout in seconds */
    timeoutSeconds?: number;
}

/**
 * Execute a command over SSH
 */
export async function sshExec(
    config: SshConfig,
    command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { host, port, username, privateKeyPath, timeoutSeconds = 30 } = config;

    const sshArgs = [
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", `ConnectTimeout=${timeoutSeconds}`,
        "-p", port.toString(),
    ];

    if (privateKeyPath) {
        sshArgs.push("-i", privateKeyPath);
    }

    sshArgs.push(`${username}@${host}`, command);

    try {
        const result = await $`ssh ${sshArgs}`.quiet();
        return {
            stdout: result.stdout.toString(),
            stderr: result.stderr.toString(),
            exitCode: result.exitCode,
        };
    } catch (error: unknown) {
        const e = error as { stdout?: Buffer; stderr?: Buffer; exitCode?: number };
        return {
            stdout: e.stdout?.toString() || "",
            stderr: e.stderr?.toString() || "",
            exitCode: e.exitCode ?? 1,
        };
    }
}

/**
 * Copy a file to remote via SCP
 */
export async function scpTo(
    config: SshConfig,
    localPath: string,
    remotePath: string
): Promise<{ success: boolean; error?: string }> {
    const { host, port, username, privateKeyPath, timeoutSeconds = 30 } = config;

    const scpArgs = [
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", `ConnectTimeout=${timeoutSeconds}`,
        "-P", port.toString(),
    ];

    if (privateKeyPath) {
        scpArgs.push("-i", privateKeyPath);
    }

    scpArgs.push(localPath, `${username}@${host}:${remotePath}`);

    try {
        await $`scp ${scpArgs}`.quiet();
        return { success: true };
    } catch (error: unknown) {
        const e = error as { stderr?: Buffer };
        return { success: false, error: e.stderr?.toString() || "SCP failed" };
    }
}

/**
 * Wait for SSH to become available
 */
export async function waitForSsh(
    config: SshConfig,
    maxAttempts: number = 30,
    delaySeconds: number = 2
): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        const result = await sshExec({ ...config, timeoutSeconds: 5 }, "echo connected");
        if (result.exitCode === 0 && result.stdout.includes("connected")) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
    }
    return false;
}

/**
 * Get default SSH config for local VDI
 */
export function getLocalSshConfig(username: string = "rubigo"): SshConfig {
    return {
        host: "localhost",
        port: 2222,
        username,
        timeoutSeconds: 10,
    };
}
