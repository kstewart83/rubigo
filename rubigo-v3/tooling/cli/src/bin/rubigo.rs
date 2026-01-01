//! Rubigo CLI - Development tooling for Rubigo V3
//!
//! Subcommands:
//! - `spec-gen`: Generate JSON/types from spec files
//! - `kill-ports`: Kill processes on WIP port range (read from ../wip.toml)

use clap::{Parser, Subcommand};
use ignore::WalkBuilder;
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use std::process::{exit, Command};

// Import generation functions from rubigo-build library
use rubigo_build::{
    extract_component_api_typescript, generate_meta_json, generate_types_file,
    parse_typescript_interface,
};

#[derive(Parser)]
#[command(name = "rubigo")]
#[command(about = "Rubigo V3 development CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate JSON and types from spec files
    SpecGen {
        /// Path to rubigo.toml (default: rubigo.toml in current dir)
        #[arg(long)]
        config: Option<PathBuf>,
    },
    /// Kill all processes on the WIP port range
    KillPorts {
        /// Path to wip.toml (default: ../wip.toml relative to workspace)
        #[arg(long)]
        config: Option<PathBuf>,
    },
}

/// Rubigo configuration from rubigo.toml
#[derive(Deserialize)]
struct RubigoConfig {
    build: BuildConfig,
}

#[derive(Deserialize)]
struct BuildConfig {
    generated_output: String,
    spec_pattern: String,
}

/// WIP configuration file structure
#[derive(Deserialize)]
struct WipConfig {
    ports: PortConfig,
}

#[derive(Deserialize)]
struct PortConfig {
    base: u16,
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::SpecGen { config } => {
            let config_path = config.unwrap_or_else(|| PathBuf::from("rubigo.toml"));
            spec_gen(&config_path);
        }
        Commands::KillPorts { config } => {
            let config_path = config.unwrap_or_else(|| PathBuf::from("../wip.toml"));
            kill_ports(&config_path);
        }
    }
}

/// Generate JSON and types from spec files
fn spec_gen(config_path: &PathBuf) {
    // Get workspace root (current directory)
    let workspace_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    // Read rubigo.toml
    let config_content = match fs::read_to_string(config_path) {
        Ok(content) => content,
        Err(e) => {
            eprintln!("❌ Error: Cannot read {:?}: {}", config_path, e);
            eprintln!("   Using defaults: spec_pattern=*.sudo.md, generated_output=generated");
            // Use defaults
            String::from(
                r#"
                [build]
                generated_output = "generated"
                spec_pattern = "*.sudo.md"
            "#,
            )
        }
    };

    // Parse rubigo.toml
    let config: RubigoConfig = match toml::from_str(&config_content) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("⚠️  Warning: Failed to parse {:?}: {}", config_path, e);
            eprintln!("   Using defaults");
            RubigoConfig {
                build: BuildConfig {
                    generated_output: "generated".to_string(),
                    spec_pattern: "*.sudo.md".to_string(),
                },
            }
        }
    };

    let generated_dir = workspace_root.join(&config.build.generated_output);
    let spec_suffix = config
        .build
        .spec_pattern
        .strip_prefix("*")
        .unwrap_or(&config.build.spec_pattern);

    println!("📦 Generating JSON from specs...");
    println!("   Pattern: {}", config.build.spec_pattern);
    println!("   Output:  {}/", generated_dir.display());

    // Find all spec files using ignore crate (respects .gitignore)
    let walker = WalkBuilder::new(&workspace_root)
        .hidden(true)
        .git_ignore(true)
        .build();

    let mut processed = 0;

    for entry in walker.filter_map(|e| e.ok()) {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let path_str = path.to_string_lossy();
        if !path_str.ends_with(spec_suffix) {
            continue;
        }

        // Compute mirrored output directory
        let rel_path = path.strip_prefix(&workspace_root).unwrap_or(path);
        let parent = rel_path.parent().unwrap_or(std::path::Path::new(""));
        let name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(|s| s.trim_end_matches(".sudo"))
            .unwrap_or("unknown");

        let out_dir = generated_dir.join(parent).join(name);
        fs::create_dir_all(&out_dir).ok();

        println!(
            "  {} -> {}/",
            rel_path.display(),
            out_dir
                .strip_prefix(&workspace_root)
                .unwrap_or(&out_dir)
                .display()
        );

        // Create cue subfolder
        let cue_dir = out_dir.join("cue");
        fs::create_dir_all(&cue_dir).ok();

        // Read spec and extract cue blocks
        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(e) => {
                eprintln!("    ⚠️  Failed to read: {}", e);
                continue;
            }
        };

        // Extract cue blocks (between ```cue and ```)
        let mut cue_content = String::new();
        let mut in_cue_block = false;
        for line in content.lines() {
            if line.trim() == "```cue" {
                in_cue_block = true;
                continue;
            }
            if line.trim() == "```" && in_cue_block {
                in_cue_block = false;
                cue_content.push('\n');
                continue;
            }
            if in_cue_block {
                cue_content.push_str(line);
                cue_content.push('\n');
            }
        }

        if cue_content.trim().is_empty() {
            println!("    ⏭️  skipped (no cue blocks)");
            continue;
        }

        // Write cue file
        let cue_file = cue_dir.join(format!("{}.cue", name));
        if let Err(e) = fs::write(&cue_file, &cue_content) {
            eprintln!("    ⚠️  Failed to write cue: {}", e);
            continue;
        }

        // Run cue export
        let output = Command::new("cue")
            .args(["export", "--out", "json"])
            .arg(&cue_file)
            .output();

        match output {
            Ok(o) if o.status.success() => {
                let json_str = String::from_utf8_lossy(&o.stdout);
                if json_str.trim() == "{}" || json_str.trim().is_empty() {
                    println!("    ⏭️  skipped (schema-only, no data)");
                } else {
                    let json_path = out_dir.join(format!("{}.json", name));
                    if let Err(e) = fs::write(&json_path, &o.stdout) {
                        eprintln!("    ⚠️  Failed to write JSON: {}", e);
                    } else {
                        println!("    ✅ {}.json", name);
                        processed += 1;
                    }

                    // Generate meta.json and types.ts from Component API section
                    if let Some(typescript) = extract_component_api_typescript(&content) {
                        // Generate types.ts
                        let types_content = generate_types_file(name, &typescript);
                        let types_path = out_dir.join(format!("{}.types.ts", name));
                        if let Err(e) = fs::write(&types_path, types_content) {
                            eprintln!("    ⚠️  Failed to write types: {}", e);
                        } else {
                            println!("    ✅ {}.types.ts", name);
                        }

                        // Generate meta.json
                        let meta = parse_typescript_interface(name, &typescript);
                        let meta_json = generate_meta_json(&meta);
                        let meta_path = out_dir.join(format!("{}.meta.json", name));
                        if let Err(e) = fs::write(&meta_path, meta_json) {
                            eprintln!("    ⚠️  Failed to write meta: {}", e);
                        } else {
                            println!("    ✅ {}.meta.json", name);
                        }
                    }
                }
            }
            Ok(o) => {
                let stderr = String::from_utf8_lossy(&o.stderr);
                eprintln!(
                    "    ⚠️  cue export failed: {}",
                    stderr.lines().next().unwrap_or("unknown error")
                );
            }
            Err(e) => {
                eprintln!("    ⚠️  Failed to run cue: {}", e);
            }
        }
    }

    println!("✅ Processed {} specs", processed);
}

fn kill_ports(config_path: &PathBuf) {
    // Read wip.toml
    let config_content = match fs::read_to_string(config_path) {
        Ok(content) => content,
        Err(e) => {
            eprintln!("❌ Error: Cannot read {:?}: {}", config_path, e);
            eprintln!("   wip.toml is required to determine port range");
            eprintln!("   Make sure you're in a WIP worktree");
            exit(1);
        }
    };

    // Parse wip.toml
    let config: WipConfig = match toml::from_str(&config_content) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("❌ Error: Failed to parse {:?}: {}", config_path, e);
            exit(1);
        }
    };

    let base = config.ports.base;
    let range = 20u16; // Check 20 ports from base
    let end = base + range;

    println!(
        "🔪 Killing processes on WIP port range ({}-{})...",
        base, end
    );

    let mut killed = 0;

    for port in base..=end {
        // Use lsof to find PIDs on this port
        let output = Command::new("lsof")
            .args(["-ti", &format!(":{}", port)])
            .output();

        if let Ok(out) = output {
            if out.status.success() {
                let pids = String::from_utf8_lossy(&out.stdout);
                let pids: Vec<&str> = pids.trim().lines().collect();

                if !pids.is_empty() {
                    println!("  Killing port {}: {:?}", port, pids);

                    for pid in &pids {
                        let _ = Command::new("kill").args(["-9", pid]).status();
                    }
                    killed += 1;
                }
            }
        }
    }

    if killed == 0 {
        println!("  No processes found on ports {}-{}", base, end);
    } else {
        println!("✅ Killed processes on {} ports", killed);
    }
}
