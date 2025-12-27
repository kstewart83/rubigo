/**
 * Pre-push validation script for Rubigo
 * Run before pushing to catch common issues
 * 
 * Usage: bun run scripts/pre-push-check.ts
 */

import { readdir, stat } from "fs/promises";
import { join, relative } from "path";
import { Glob } from "bun";
import { existsSync, readFileSync } from "fs";

interface CheckResult {
    errors: number;
    warnings: number;
}

interface Suppression {
    description: string;
    approved_by: string;
    patterns: string[];
}

interface SuppressionConfig {
    suppressions: {
        "console.log"?: Suppression;
        localhost?: Suppression;
    };
}

// Load suppressions
let suppressions: SuppressionConfig["suppressions"] = {};
const suppressionPath = ".preflight-suppressions.json";
if (existsSync(suppressionPath)) {
    try {
        const config = JSON.parse(readFileSync(suppressionPath, "utf-8")) as SuppressionConfig;
        suppressions = config.suppressions || {};
    } catch {
        console.warn("⚠️  Failed to parse .preflight-suppressions.json");
    }
}

function isFileSuppressed(filePath: string, suppressionKey: keyof typeof suppressions): boolean {
    const suppression = suppressions[suppressionKey];
    if (!suppression) return false;

    const relPath = relative(".", filePath);
    return suppression.patterns.some(pattern => {
        // Simple glob matching
        const regex = new RegExp("^" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$");
        return regex.test(relPath);
    });
}

const EXTENSIONS = ["ts", "tsx", "js", "json"];
const SRC_DIR = "src";
const E2E_DIR = "e2e";

async function getAllFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string) {
        try {
            const entries = await readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
                        await walk(fullPath);
                    }
                } else if (extensions.some(ext => entry.name.endsWith(`.${ext}`))) {
                    files.push(fullPath);
                }
            }
        } catch {
            // Directory doesn't exist, skip
        }
    }

    await walk(dir);
    return files;
}

async function checkLocalPaths(files: string[]): Promise<string[]> {
    const issues: string[] = [];
    const pattern = /\/Users\/|\/home\/|C:\\|D:\\/;

    for (const file of files) {
        const content = await Bun.file(file).text();
        const lines = content.split("\n");
        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                issues.push(`${relative(".", file)}:${index + 1}: ${line.trim().substring(0, 80)}`);
            }
        });
    }

    return issues;
}

async function checkSecrets(files: string[]): Promise<string[]> {
    const issues: string[] = [];
    const pattern = /(api_key|apikey|secret_key|secretkey|password|passwd|private_key|auth_token|bearer)\s*[:=]\s*['"][^'"]+['"]/i;

    for (const file of files.filter(f => !f.endsWith(".json"))) {
        const content = await Bun.file(file).text();
        const lines = content.split("\n");
        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                issues.push(`${relative(".", file)}:${index + 1}: ${line.trim().substring(0, 80)}`);
            }
        });
    }

    return issues;
}

async function checkDebugStatements(files: string[]): Promise<{ issues: string[]; suppressed: number }> {
    const issues: string[] = [];
    let suppressed = 0;
    const pattern = /console\.(log|debug|info)|debugger/;

    for (const file of files.filter(f => f.endsWith(".ts") || f.endsWith(".tsx"))) {
        if (isFileSuppressed(file, "console.log")) {
            // Count how many matches would have been found
            const content = await Bun.file(file).text();
            const matches = content.split("\n").filter(line => pattern.test(line)).length;
            suppressed += matches;
            continue;
        }
        const content = await Bun.file(file).text();
        const lines = content.split("\n");
        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                issues.push(`${relative(".", file)}:${index + 1}: ${line.trim().substring(0, 80)}`);
            }
        });
    }

    return { issues, suppressed };
}

async function checkTestOnlyPatterns(files: string[]): Promise<string[]> {
    const issues: string[] = [];
    // Only flag .only() calls - these always skip other tests and should never be committed
    // Note: .skip() with conditions like test.skip(!data, "reason") are legitimate
    const onlyPattern = /\.(only)\(/;
    const testFiles = files.filter(f => f.includes(".spec.") || f.includes(".test."));

    for (const file of testFiles) {
        const content = await Bun.file(file).text();
        const lines = content.split("\n");
        lines.forEach((line: string, index: number) => {
            if (onlyPattern.test(line)) {
                issues.push(`${relative(".", file)}:${index + 1}: ${line.trim().substring(0, 80)}`);
            }
        });
    }

    return issues;
}

async function checkLocalhostUrls(files: string[]): Promise<{ issues: string[]; suppressed: number }> {
    const issues: string[] = [];
    let suppressed = 0;
    const pattern = /localhost|127\.0\.0\.1/;

    for (const file of files.filter(f => f.endsWith(".ts") || f.endsWith(".tsx"))) {
        if (isFileSuppressed(file, "localhost")) {
            // Count how many matches would have been found
            const content = await Bun.file(file).text();
            const matches = content.split("\n").filter(line => pattern.test(line) && !line.includes("// allow-localhost")).length;
            suppressed += matches;
            continue;
        }
        const content = await Bun.file(file).text();
        const lines = content.split("\n");
        lines.forEach((line, index) => {
            if (pattern.test(line) && !line.includes("// allow-localhost")) {
                issues.push(`${relative(".", file)}:${index + 1}: ${line.trim().substring(0, 80)}`);
            }
        });
    }

    return { issues, suppressed };
}

async function checkLargeFiles(): Promise<string[]> {
    const issues: string[] = [];
    const ONE_MB = 1024 * 1024;

    async function walk(dir: string) {
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!["node_modules", ".next", ".git"].includes(entry.name)) {
                        await walk(fullPath);
                    }
                } else {
                    const stats = await stat(fullPath);
                    if (stats.size > ONE_MB) {
                        issues.push(`${relative(".", fullPath)} (${(stats.size / ONE_MB).toFixed(2)} MB)`);
                    }
                }
            }
        } catch {
            // Directory doesn't exist
        }
    }

    await walk(".");
    return issues;
}

async function checkEnvFiles(): Promise<string[]> {
    const issues: string[] = [];

    async function walk(dir: string) {
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== "node_modules") {
                        await walk(fullPath);
                    }
                } else if (entry.name.startsWith(".env") && entry.name !== ".env.example") {
                    issues.push(relative(".", fullPath));
                }
            }
        } catch {
            // Directory doesn't exist
        }
    }

    await walk(".");
    return issues;
}

async function runCheck(
    name: string,
    checkFn: () => Promise<string[]>,
    isError: boolean
): Promise<{ passed: boolean; isWarning: boolean }> {
    console.log(`Checking for ${name}...`);
    const issues = await checkFn();

    if (issues.length > 0) {
        const icon = isError ? "❌ ERROR" : "⚠️  WARNING";
        console.log(`${icon}: Found ${name}:`);
        issues.forEach(issue => console.log(`   ${issue}`));
        console.log();
        return { passed: false, isWarning: !isError };
    }

    console.log(`✅ No ${name} found`);
    console.log();
    return { passed: true, isWarning: false };
}

async function main() {
    console.log("🔍 Running pre-push checks...\n");

    // Get all source files
    const srcFiles = await getAllFiles(SRC_DIR, EXTENSIONS);
    const e2eFiles = await getAllFiles(E2E_DIR, ["ts"]);
    const allFiles = [...srcFiles, ...e2eFiles];

    let errors = 0;
    let warnings = 0;
    let totalSuppressed = 0;

    // Run standard checks (no suppressions)
    const standardChecks: Array<{ name: string; fn: () => Promise<string[]>; isError: boolean }> = [
        { name: "local paths", fn: () => checkLocalPaths(srcFiles), isError: true },
        { name: "potential secrets", fn: () => checkSecrets(srcFiles), isError: true },
        { name: "test-only patterns (.only/.skip)", fn: () => checkTestOnlyPatterns(allFiles), isError: true },
        { name: "large files (>1MB)", fn: checkLargeFiles, isError: false },
        { name: ".env files", fn: checkEnvFiles, isError: false },
    ];

    for (const check of standardChecks) {
        const result = await runCheck(check.name, check.fn, check.isError);
        if (!result.passed) {
            if (result.isWarning) {
                warnings++;
            } else {
                errors++;
            }
        }
    }

    // Run suppression-aware checks
    console.log("Checking for debug statements...");
    const debugResult = await checkDebugStatements(srcFiles);
    if (debugResult.issues.length > 0) {
        console.log(`⚠️  WARNING: Found debug statements:`);
        debugResult.issues.forEach(issue => console.log(`   ${issue}`));
        console.log();
        warnings++;
    } else {
        console.log(`✅ No debug statements found`);
    }
    if (debugResult.suppressed > 0) {
        console.log(`   (${debugResult.suppressed} suppressed in approved files)`);
    }
    console.log();
    totalSuppressed += debugResult.suppressed;

    console.log("Checking for localhost URLs...");
    const localhostResult = await checkLocalhostUrls(srcFiles);
    if (localhostResult.issues.length > 0) {
        console.log(`⚠️  WARNING: Found localhost URLs:`);
        localhostResult.issues.forEach(issue => console.log(`   ${issue}`));
        console.log();
        warnings++;
    } else {
        console.log(`✅ No localhost URLs found`);
    }
    if (localhostResult.suppressed > 0) {
        console.log(`   (${localhostResult.suppressed} suppressed in approved files)`);
    }
    console.log();
    totalSuppressed += localhostResult.suppressed;

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (totalSuppressed > 0) {
        console.log(`📋 ${totalSuppressed} warning(s) suppressed via .preflight-suppressions.json`);
    }
    if (errors === 0 && warnings === 0) {
        console.log("✅ All pre-push checks passed!");
        process.exit(0);
    } else if (errors === 0) {
        console.log(`⚠️  Found ${warnings} warning(s). Review before pushing.`);
        process.exit(0);
    } else {
        console.log(`❌ Found ${errors} error(s) and ${warnings} warning(s). Please fix errors before pushing.`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
