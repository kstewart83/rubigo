import { parse } from "@iarna/toml";
import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export interface AppConfig {
    app: {
        name: string;
        version: string;
        description: string;
    };
}

let cachedConfig: AppConfig | null = null;

/**
 * Get the application configuration from rubigo.toml
 * Caches the result for subsequent calls
 */
export function getConfig(): AppConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    const configPath = join(process.cwd(), "rubigo.toml");
    const content = readFileSync(configPath, "utf-8");
    cachedConfig = parse(content) as unknown as AppConfig;

    return cachedConfig;
}

/**
 * Get the current git commit short hash (first 6 chars)
 * Returns null if not in a git repo or git command fails
 * Only active when RUBIGO_SHOW_COMMIT=true (set by dev scripts)
 */
export function getGitCommit(): string | null {
    if (process.env.RUBIGO_SHOW_COMMIT !== "true") {
        return null;
    }

    try {
        const commit = execSync("git rev-parse --short=6 HEAD", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        return commit || null;
    } catch {
        return null;
    }
}

/**
 * Get the application version string
 * Automatically includes git commit hash in dev mode when RUBIGO_SHOW_COMMIT=true
 * Returns "0.1.4" in production or "0.1.4 (abc123)" in dev
 */
export function getVersion(): string {
    const version = getConfig().app.version;
    const commit = getGitCommit();

    if (commit) {
        return `${version} (${commit})`;
    }
    return version;
}

/**
 * Get the application name
 */
export function getAppName(): string {
    return getConfig().app.name;
}
