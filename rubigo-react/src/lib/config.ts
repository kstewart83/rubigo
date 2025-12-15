import { parse } from "@iarna/toml";
import { readFileSync } from "fs";
import { join } from "path";

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
 * Get the application version string
 */
export function getVersion(): string {
    return getConfig().app.version;
}

/**
 * Get the application name
 */
export function getAppName(): string {
    return getConfig().app.name;
}
