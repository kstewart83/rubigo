#!/usr/bin/env bun
/**
 * Optional: Install launchd service for rubigo-react
 * Run with: bun production/scripts/install-service.ts
 */

import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

const PRODUCTION_ROOT = dirname(dirname(Bun.main));
const SERVICE_NAME = "net.kwip.rubigo-react";
const PLIST_PATH = join(homedir(), "Library/LaunchAgents", `${SERVICE_NAME}.plist`);

// Get dynamic values
const bunPath = Bun.which("bun") || `${homedir()}/.bun/bin/bun`;
const workDir = join(PRODUCTION_ROOT, "rubigo-react/current");
const dbPath = join(PRODUCTION_ROOT, "rubigo-react/data/rubigo.db");

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${bunPath}</string>
        <string>run</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${workDir}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>4430</string>
        <key>DATABASE_URL</key>
        <string>${dbPath}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${PRODUCTION_ROOT}/rubigo-react/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${PRODUCTION_ROOT}/rubigo-react/stderr.log</string>
</dict>
</plist>`;

console.log("📦 Rubigo React Service Installer\n");

if (existsSync(PLIST_PATH)) {
  console.log("⚠️  Service already exists. Unload first:");
  console.log(`   launchctl unload ${PLIST_PATH}`);
  process.exit(1);
}

writeFileSync(PLIST_PATH, plist);
console.log(`✅ Created: ${PLIST_PATH}`);
console.log("\n🚀 To start the service:");
console.log(`   launchctl load ${PLIST_PATH}`);
console.log("\n🛑 To stop the service:");
console.log(`   launchctl unload ${PLIST_PATH}`);
