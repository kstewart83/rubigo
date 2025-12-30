//! Workspace-level build script for Rubigo V3
//!
//! Responsibilities:
//! 1. Validate required binaries (cue, just) are available with acceptable versions
//! 2. Find all spec files matching SPEC_SUFFIX
//! 3. Parse YAML frontmatter for spec type (component vs schema)
//! 4. Validate spec structure (component specs only)
//! 5. Validate specs with `cue vet`
//! 6. Export specs to JSON with `cue export`

use std::env;
use std::fs;
use std::path::{Path, PathBuf};
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

// Import types and functions from rubigo-build library
use rubigo_build::{
    cross_reference_events,
    extract_cue_blocks,
    extract_quint_block,
    extract_test_vectors,
    // Interactions
    generate_interactions_manifest,
    // Vectors
    generate_unified_vectors,
    // Extraction
    parse_frontmatter,
    // Validation
    validate_spec_structure,
    // Quint
    write_quint_file,
    // Types
    SpecType,
    SPEC_SUFFIX,
};

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());

    // Create generated directory at workspace root
    let generated_dir = manifest_dir.join("generated");
    fs::create_dir_all(&generated_dir).ok();

    // 1. Validate required binaries
    validate_binaries();

    // 2. Find and process specs
    let spec_dir = manifest_dir.join("specifications");
    if spec_dir.exists() {
        process_specs(&spec_dir, &generated_dir);

        // 3. Generate interactions manifest for all specs
        if let Err(e) = generate_interactions_manifest(&spec_dir, &generated_dir) {
            warn!("Failed to generate interactions manifest: {}", e);
        }
    }

    // Re-run triggers
    println!("cargo:rerun-if-changed=build/main.rs");
    println!("cargo:rerun-if-changed=build");
    println!("cargo:rerun-if-changed=specifications");
}

/// Validate that required binaries are available with acceptable versions
fn validate_binaries() {
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

/// Process all spec files in the spec directory
fn process_specs(spec_dir: &Path, generated_dir: &Path) {
    info!("Processing specs from: {}", spec_dir.display());
    // Find all directories containing spec files
    if let Ok(entries) = fs::read_dir(spec_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                // Look for spec files in this directory
                if let Ok(files) = fs::read_dir(&path) {
                    for file in files.filter_map(|f| f.ok()) {
                        let file_path = file.path();
                        if file_path.to_string_lossy().ends_with(SPEC_SUFFIX) {
                            info!("Processing: {}", file_path.display());
                            process_spec_file(&file_path, generated_dir);
                        }
                    }
                }
            }
        }
    }
}
/// Process a single spec file
fn process_spec_file(spec_path: &Path, generated_dir: &Path) {
    let spec_name = spec_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.trim_end_matches(".sudo"))
        .unwrap_or("unknown");

    println!("cargo:rerun-if-changed={}", spec_path.display());
    info!("Processing spec: {}", spec_path.display());

    // Read spec content
    let content = match fs::read_to_string(spec_path) {
        Ok(c) => c,
        Err(e) => {
            warn!("Failed to read {}: {}", spec_path.display(), e);
            return;
        }
    };

    // Parse frontmatter
    let (meta, rest_content) = parse_frontmatter(&content);
    let type_str = match meta.spec_type {
        SpecType::Primitive => "primitive",
        SpecType::Compound => "compound",
        SpecType::Presentational => "presentational",
        SpecType::Schema => "schema",
    };
    info!("Spec type: {} ({})", spec_name, type_str);

    // Validate spec structure (skip for schema-only specs without state machine)
    if meta.spec_type != SpecType::Schema {
        if let Err(errors) = validate_spec_structure(rest_content, meta.spec_type) {
            for error in errors {
                warn!("Spec validation error in {}: {}", spec_name, error);
            }
            // Continue anyway to allow incremental development
        } else {
            info!("Spec structure validated: {}", spec_name);
        }
    } else {
        info!(
            "Skipping structure validation for schema spec: {}",
            spec_name
        );
    }

    // Extract and write Quint block (for formal verification)
    if let Some(quint_code) = extract_quint_block(&content) {
        if let Err(e) = write_quint_file(spec_name, &quint_code, generated_dir) {
            warn!("Failed to write Quint file for {}: {}", spec_name, e);
        }
    }

    // Extract and write test vectors
    if let Some(vectors) = extract_test_vectors(&content) {
        if let Err(e) = generate_unified_vectors(spec_name, &vectors, generated_dir) {
            warn!(
                "Failed to generate unified vectors for {}: {}",
                spec_name, e
            );
        }
    }

    // Extract Cue blocks (use full content to include any frontmatter cue blocks)
    let cue_blocks = extract_cue_blocks(&content);

    // Cross-reference validate CUE events against Quint _action values
    if let Some(quint_code) = extract_quint_block(&content) {
        // Combine CUE blocks for cross-reference checking
        let combined_cue: String = cue_blocks.iter().map(|(_, block)| block.as_str()).collect();
        let xref_warnings = cross_reference_events(&combined_cue, &quint_code);
        for warning in &xref_warnings {
            warn!("⚠️  Cross-reference mismatch in {}: {}", spec_name, warning);
        }
    }

    // Create temp directory for cue processing
    let cue_dir = generated_dir.join(format!("{}_cue", spec_name));
    fs::create_dir_all(&cue_dir).ok();

    // Combine Cue blocks into a single file
    let mut combined_cue = format!("// Generated from {}\n", spec_path.display());
    combined_cue.push_str(&format!("// Type: {}\n\n", type_str));
    for (section, block) in &cue_blocks {
        combined_cue.push_str(&format!("// == {} ==\n", section));
        combined_cue.push_str(block);
        combined_cue.push_str("\n\n");
    }

    let cue_file = cue_dir.join(format!("{}.cue", spec_name));
    if let Err(e) = fs::write(&cue_file, &combined_cue) {
        warn!("Failed to write Cue file: {}", e);
        return;
    }

    // Run cue export
    let output = Command::new("cue")
        .args(["export", "--out", "json"])
        .arg(&cue_file)
        .output();

    match output {
        Ok(o) if o.status.success() => {
            // Check if output is empty or just {}
            let json_str = String::from_utf8_lossy(&o.stdout);
            if json_str.trim() == "{}" || json_str.trim().is_empty() {
                info!("Skipping empty JSON output for schema: {}", spec_name);
            } else {
                let json_path = generated_dir.join(format!("{}.json", spec_name));
                if let Err(e) = fs::write(&json_path, &o.stdout) {
                    warn!("Failed to write JSON: {}", e);
                } else {
                    info!("Generated {}", json_path.display());
                }
            }
        }
        Ok(o) => {
            let stderr = String::from_utf8_lossy(&o.stderr);
            warn!("cue export failed for {}: {}", spec_name, stderr);
        }
        Err(e) => {
            warn!("Failed to run cue: {}", e);
        }
    }
}
