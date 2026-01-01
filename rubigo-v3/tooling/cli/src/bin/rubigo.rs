//! Rubigo CLI - Development tooling for Rubigo V3
//!
//! Subcommands:
//! - `kill-ports`: Kill processes on WIP port range (read from ../wip.toml)

use clap::{Parser, Subcommand};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use std::process::{exit, Command};

#[derive(Parser)]
#[command(name = "rubigo")]
#[command(about = "Rubigo V3 development CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Kill all processes on the WIP port range
    KillPorts {
        /// Path to wip.toml (default: ../wip.toml relative to workspace)
        #[arg(long)]
        config: Option<PathBuf>,
    },
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
        Commands::KillPorts { config } => {
            let config_path = config.unwrap_or_else(|| PathBuf::from("../wip.toml"));
            kill_ports(&config_path);
        }
    }
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
