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
 * Get the current git branch name
 * Returns null if not in a git repo or git command fails
 * Only active when RUBIGO_SHOW_COMMIT=true (set by dev scripts)
 */
export function getGitBranch(): string | null {
    if (process.env.RUBIGO_SHOW_COMMIT !== "true") {
        return null;
    }

    try {
        const branch = execSync("git branch --show-current", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        return branch || null;
    } catch {
        return null;
    }
}

/**
 * Get the application version string
 * Automatically includes git branch name in dev mode when RUBIGO_SHOW_COMMIT=true
 * Returns "0.1.4" in production or "0.1.4 (feature/foo)" in dev
 */
export function getVersion(): string {
    const version = getConfig().app.version;
    const branch = getGitBranch();

    if (branch) {
        return `${version} (${branch})`;
    }
    return version;
}

/**
 * Get the application name
 */
export function getAppName(): string {
    return getConfig().app.name;
}
