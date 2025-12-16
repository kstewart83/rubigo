#!/usr/bin/env bun
/**
 * Production Setup Script
 * Creates directory structure and validates environment
 */

import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const PRODUCTION_ROOT = dirname(dirname(Bun.main));
const RUBIGO_REACT = join(PRODUCTION_ROOT, "rubigo-react");

const directories = [
  join(RUBIGO_REACT, "builds"),
  join(RUBIGO_REACT, "data"),
];

console.log("🚀 Rubigo Production Setup\n");
console.log(`   Production root: ${PRODUCTION_ROOT}\n`);

// Create directories
for (const dir of directories) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`⏭️  Exists: ${dir}`);
  }
}

// Validate requirements
console.log("\n📋 Environment Checks:");

const bunVersion = Bun.version;
console.log(`✅ Bun ${bunVersion}`);

try {
  const git = Bun.spawnSync(["git", "--version"]);
  console.log(`✅ ${new TextDecoder().decode(git.stdout).trim()}`);
} catch {
  console.log("❌ Git not found");
}

console.log("\n✨ Setup complete!");
console.log(`   App builds: ${RUBIGO_REACT}/builds`);
console.log(`   Database:   ${RUBIGO_REACT}/data/rubigo.db`);
