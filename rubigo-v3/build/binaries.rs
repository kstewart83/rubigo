//! Binary validation functions

use std::process::Command;

/// Info message - only visible with `cargo build -vv`
macro_rules! info {
    ($($arg:tt)*) => {
        eprintln!("[build.rs] {}", format!($($arg)*));
    };
}

/// Warning/error message - always visible in build output
macro_rules! warn {
    ($($arg:tt)*) => {
        println!("cargo:warning={}", format!($($arg)*));
    };
}

/// Validate that required binaries are available with acceptable versions
pub fn validate_binaries() {
    // Check cue
    match Command::new("cue").arg("version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            if let Some(version) = extract_cue_version(&version_str) {
                info!("Found cue {}", version);
            }
        }
        _ => {
            warn!("cue CLI not found - spec validation will be skipped");
            warn!("Install with: brew install cue-lang/tap/cue");
        }
    }

    // Check just
    match Command::new("just").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            info!("Found {}", version_str.trim());
        }
        _ => {
            warn!("just CLI not found");
            warn!("Install with: cargo install just");
        }
    }

    // Check quint (optional - for formal verification)
    match Command::new("quint").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            info!("Found quint {}", version_str.trim());
        }
        _ => {
            warn!("quint CLI not found - formal verification disabled");
            warn!("Install with: npm install -g @informalsystems/quint");
        }
    }
}

/// Extract version number from cue version output
fn extract_cue_version(output: &str) -> Option<String> {
    // "cue version v0.15.1" -> "0.15.1"
    output
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(2))
        .map(|v| v.trim_start_matches('v').to_string())
}
