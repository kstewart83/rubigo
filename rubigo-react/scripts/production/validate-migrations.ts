#!/usr/bin/env bun
/**
 * validate-migrations.ts
 * Validates Drizzle migrations before deployment to catch common issues.
 *
 * Usage:
 *   bun run production/validate-migrations.ts [rubigo-react-path]
 *
 * Checks:
 * 1. Statement breakpoint format (--> statement-breakpoint with space)
 * 2. No duplicate migration numbers
 * 3. Journal consistency (all referenced migrations exist)
 * 4. No orphan migrations (all files referenced in journal)
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { basename, dirname, join, resolve } from "path";

// Get paths
const scriptDir = dirname(Bun.main);
const repoRoot = resolve(scriptDir, "..");
const rubigoReactPath = Bun.argv[2] || join(repoRoot, "rubigo-react");
const drizzlePath = join(rubigoReactPath, "drizzle");
const journalPath = join(drizzlePath, "meta", "_journal.json");

let errors: string[] = [];
let warnings: string[] = [];

console.log("🔍 Validating migrations...\n");

// Check if drizzle folder exists
if (!existsSync(drizzlePath)) {
  console.log("⚠️ No drizzle folder found - skipping migration validation");
  process.exit(0);
}

// Get all SQL migration files
const sqlFiles = existsSync(drizzlePath)
  ? readdirSync(drizzlePath).filter(f => f.endsWith(".sql"))
  : [];

console.log(`Found ${sqlFiles.length} migration files\n`);

// 1. Check statement breakpoint format
console.log("## Check 1: Statement Breakpoint Format");
for (const file of sqlFiles) {
  const content = readFileSync(join(drizzlePath, file), "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for invalid format: "-->" followed immediately by non-space
    if (line.match(/^-->[^ ]/)) {
      errors.push(`${file}:${i + 1} - Invalid breakpoint format. Use "--> statement-breakpoint" (with space after -->)`);
    }
  }
}
if (errors.length === 0) {
  console.log("✅ All migrations use correct breakpoint format\n");
} else {
  console.log("❌ Breakpoint format errors found\n");
}

// 2. Check for duplicate migration numbers
console.log("## Check 2: Duplicate Migration Numbers");
const prefixes = sqlFiles.map(f => f.split("_")[0]);
const prefixCounts = prefixes.reduce((acc, p) => {
  acc[p] = (acc[p] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const duplicates = Object.entries(prefixCounts).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  for (const [prefix, count] of duplicates) {
    const dupeFiles = sqlFiles.filter(f => f.startsWith(`${prefix}_`));
    errors.push(`Duplicate migration number ${prefix}: ${dupeFiles.join(", ")}`);
  }
  console.log("❌ Duplicate migration numbers found\n");
} else {
  console.log("✅ No duplicate migration numbers\n");
}

// 3. Check journal consistency
console.log("## Check 3: Journal Consistency");
if (existsSync(journalPath)) {
  try {
    const journal = JSON.parse(readFileSync(journalPath, "utf-8"));
    const journalEntries = journal.entries || [];

    // Check that all journal entries have corresponding files
    for (const entry of journalEntries) {
      const expectedFile = `${entry.tag}.sql`;
      if (!sqlFiles.includes(expectedFile)) {
        errors.push(`Journal references missing file: ${expectedFile}`);
      }
    }

    // Check that all SQL files are in the journal
    const journalTags = journalEntries.map((e: { tag: string }) => `${e.tag}.sql`);
    for (const file of sqlFiles) {
      if (!journalTags.includes(file)) {
        warnings.push(`Migration file not in journal: ${file}`);
      }
    }

    if (errors.filter(e => e.includes("Journal")).length === 0) {
      console.log("✅ Journal entries match migration files\n");
    } else {
      console.log("❌ Journal consistency errors found\n");
    }
  } catch (e) {
    errors.push(`Failed to parse journal: ${e}`);
  }
} else {
  console.log("⚠️ No journal file found at " + journalPath + "\n");
}

// 4. Check for sequential numbering gaps
console.log("## Check 4: Migration Numbering Sequence");
const numericPrefixes = prefixes.map(p => parseInt(p, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
if (numericPrefixes.length > 0) {
  for (let i = 1; i < numericPrefixes.length; i++) {
    if (numericPrefixes[i] !== numericPrefixes[i - 1] + 1 && numericPrefixes[i] !== numericPrefixes[i - 1]) {
      warnings.push(`Gap in migration sequence: ${numericPrefixes[i - 1]} -> ${numericPrefixes[i]}`);
    }
  }
  if (warnings.filter(w => w.includes("Gap")).length === 0) {
    console.log("✅ Migration numbering is sequential\n");
  } else {
    console.log("⚠️ Gaps found in migration sequence\n");
  }
}

// 5. Check migration timestamp ordering (CRITICAL for drizzle-orm)
// Drizzle-orm uses journal 'when' timestamps to determine pending migrations.
// If a new migration has a timestamp OLDER than existing ones, it will be skipped!
console.log("## Check 5: Migration Timestamp Ordering (Critical)");
if (existsSync(journalPath)) {
  try {
    const journal = JSON.parse(readFileSync(journalPath, "utf-8"));
    const journalEntries: Array<{ idx: number; when: number; tag: string }> = journal.entries || [];

    // Sort by idx to get intended order
    const sortedByIdx = [...journalEntries].sort((a, b) => a.idx - b.idx);

    let timestampErrors = 0;
    for (let i = 1; i < sortedByIdx.length; i++) {
      const prev = sortedByIdx[i - 1];
      const curr = sortedByIdx[i];

      if (curr.when <= prev.when) {
        errors.push(
          `Migration timestamp ordering error: ${curr.tag} (idx=${curr.idx}, when=${curr.when}) ` +
          `has timestamp <= ${prev.tag} (idx=${prev.idx}, when=${prev.when}). ` +
          `Drizzle-orm will SKIP this migration! ` +
          `Fix: Update 'when' in journal to be > ${prev.when}`
        );
        timestampErrors++;
      }
    }

    if (timestampErrors === 0) {
      console.log("✅ Migration timestamps are strictly ascending\n");
    } else {
      console.log("❌ CRITICAL: Migration timestamp ordering errors found!\n");
      console.log("   Drizzle-orm uses 'when' timestamps to determine pending migrations.");
      console.log("   New migrations must have timestamps AFTER the last applied migration.\n");
    }
  } catch (e) {
    // Already caught in Check 3
  }
}

// 6. Check for destructive operations (warnings only)
// These are valid but should require explicit acknowledgment
console.log("## Check 6: Destructive Operations");
const destructivePatterns = [
  { pattern: /\bDROP\s+TABLE\b/i, desc: "DROP TABLE" },
  { pattern: /\bDROP\s+INDEX\b/i, desc: "DROP INDEX" },
  { pattern: /\bDELETE\s+FROM\b/i, desc: "DELETE FROM" },
  { pattern: /\bTRUNCATE\b/i, desc: "TRUNCATE" },
  { pattern: /\bALTER\s+TABLE\s+\w+\s+DROP\s+COLUMN\b/i, desc: "DROP COLUMN" },
];

let destructiveFound = 0;
for (const file of sqlFiles) {
  const content = readFileSync(join(drizzlePath, file), "utf-8");

  for (const { pattern, desc } of destructivePatterns) {
    if (pattern.test(content)) {
      warnings.push(`${file} contains ${desc} - ensure this is intentional`);
      destructiveFound++;
    }
  }
}

if (destructiveFound === 0) {
  console.log("✅ No destructive operations found\n");
} else {
  console.log(`⚠️ Found ${destructiveFound} destructive operation(s) - review required\n`);
}

// Summary
console.log("─".repeat(50));
console.log("\n## Summary\n");

if (warnings.length > 0) {
  console.log("⚠️ Warnings:");
  for (const w of warnings) {
    console.log(`   - ${w}`);
  }
  console.log();
}

if (errors.length > 0) {
  console.log("❌ Errors:");
  for (const e of errors) {
    console.log(`   - ${e}`);
  }
  console.log("\n❌ Migration validation FAILED");
  process.exit(1);
} else {
  console.log("✅ Migration validation PASSED");
  process.exit(0);
}
