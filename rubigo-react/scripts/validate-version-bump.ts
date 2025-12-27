#!/usr/bin/env bun
/**
 * validate-version-bump.ts
 * 
 * Validates that version was bumped before merging to main.
 * Every merge to main triggers a deploy, so every merge needs a version.
 * 
 * Usage: bun run scripts/validate-version-bump.ts
 * 
 * Exit codes:
 *   0 - Version was bumped
 *   1 - Version not bumped (required)
 */

import { $ } from "bun";
import { readFileSync, existsSync } from "fs";

const VERSION_FILE = "rubigo.toml";

interface VersionInfo {
    major: number;
    minor: number;
    patch: number;
}

function parseVersion(versionStr: string): VersionInfo {
    const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
        throw new Error(`Invalid version format: ${versionStr}`);
    }
    return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]),
    };
}

function readVersionFromFile(filePath: string): string {
    if (!existsSync(filePath)) {
        throw new Error(`Version file not found: ${filePath}`);
    }
    const content = readFileSync(filePath, "utf-8");
    const match = content.match(/version\s*=\s*"([^"]+)"/);
    if (!match) {
        throw new Error(`Could not find version in ${filePath}`);
    }
    return match[1];
}

async function getVersionFromMain(): Promise<string> {
    try {
        const result = await $`git show origin/main:${VERSION_FILE}`.text();
        const match = result.match(/version\s*=\s*"([^"]+)"/);
        if (!match) {
            throw new Error(`Could not find version in origin/main:${VERSION_FILE}`);
        }
        return match[1];
    } catch {
        return "0.0.0";
    }
}

function isVersionBumped(mainVersion: VersionInfo, currentVersion: VersionInfo): boolean {
    if (currentVersion.major > mainVersion.major) return true;
    if (currentVersion.major === mainVersion.major && currentVersion.minor > mainVersion.minor) return true;
    if (
        currentVersion.major === mainVersion.major &&
        currentVersion.minor === mainVersion.minor &&
        currentVersion.patch > mainVersion.patch
    ) return true;
    return false;
}

async function main() {
    console.log("🔍 Validating version bump...\n");

    const mainVersionStr = await getVersionFromMain();
    const currentVersionStr = readVersionFromFile(VERSION_FILE);
    const mainVersion = parseVersion(mainVersionStr);
    const currentVersion = parseVersion(currentVersionStr);

    console.log(`Version on main:   ${mainVersionStr}`);
    console.log(`Version on branch: ${currentVersionStr}`);
    console.log("");

    if (isVersionBumped(mainVersion, currentVersion)) {
        console.log(`✅ Version bumped: ${mainVersionStr} → ${currentVersionStr}`);
        process.exit(0);
    }

    console.log(`❌ Version bump REQUIRED for all merges to main`);
    console.log(`\nSuggested:`);
    console.log(`  Patch: ${mainVersion.major}.${mainVersion.minor}.${mainVersion.patch + 1}`);
    console.log(`  Minor: ${mainVersion.major}.${mainVersion.minor + 1}.0`);
    console.log(`\nEdit ${VERSION_FILE} and amend your commit.`);
    process.exit(1);
}

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
