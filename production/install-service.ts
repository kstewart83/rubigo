#!/usr/bin/env bun
/**
 * install-service.ts
 * Installs the rubigo-react systemd user service with correct local paths.
 *
 * Usage:
 *   bun run production/install-service.ts [RUBIGO_DEPLOY_ROOT]
 *
 * If RUBIGO_DEPLOY_ROOT is not provided, it defaults to the parent directory
 * of the repository.
 */

import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

// Get script location and determine paths
const scriptDir = dirname(Bun.main);
const repoRoot = resolve(scriptDir, "..");

// Determine RUBIGO_DEPLOY_ROOT
const rubigoDeployRoot = Bun.argv[2] || dirname(repoRoot);

// Validate the path exists
if (!existsSync(rubigoDeployRoot)) {
  console.error(`❌ Error: RUBIGO_DEPLOY_ROOT does not exist: ${rubigoDeployRoot}`);
  process.exit(1);
}

console.log(`Using RUBIGO_DEPLOY_ROOT: ${rubigoDeployRoot}`);

// Paths
const templatePath = join(scriptDir, "rubigo-react.service.template");
if (!existsSync(templatePath)) {
  console.error(`❌ Error: Template not found: ${templatePath}`);
  process.exit(1);
}

const homeDir = process.env.HOME || process.env.USERPROFILE || "";
const serviceDir = join(homeDir, ".config", "systemd", "user");
const serviceName = "rubigo-react.service";
const serviceFile = join(serviceDir, serviceName);

// Create systemd user directory if needed
if (!existsSync(serviceDir)) {
  mkdirSync(serviceDir, { recursive: true });
}

// Read template and substitute placeholders
console.log("Generating service file...");
const templateContent = readFileSync(templatePath, "utf-8");
const serviceContent = templateContent.replaceAll("{{RUBIGO_DEPLOY_ROOT}}", rubigoDeployRoot);

writeFileSync(serviceFile, serviceContent);
console.log(`✅ Service file created: ${serviceFile}`);

// Reload systemd
console.log("Reloading systemd...");
await $`systemctl --user daemon-reload`;

// Enable service (start on login)
console.log("Enabling service...");
await $`systemctl --user enable ${serviceName}`;

console.log(`
✅ Installation complete!

Commands:
  Start:   systemctl --user start ${serviceName}
  Stop:    systemctl --user stop ${serviceName}
  Status:  systemctl --user status ${serviceName}
  Logs:    journalctl --user -u ${serviceName} -f

Environment variable set:
  RUBIGO_DEPLOY_ROOT=${rubigoDeployRoot}
`);
