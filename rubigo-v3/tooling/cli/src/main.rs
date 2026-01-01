//! Workspace-level build script for Rubigo V3
//!
//! Responsibilities:
//! 1. Validate required binaries (cue, just) are available with acceptable versions
//! 2. Find all spec files matching spec_pattern from rubigo.toml
//! 3. Parse YAML frontmatter for spec type (component vs schema)
//! 4. Validate spec structure (component specs only)
//! 5. Validate specs with `cue vet`
//! 6. Export specs to JSON with `cue export`
//! 7. Output to mirrored directory structure

use ignore::WalkBuilder;
use serde::Deserialize;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Configuration from rubigo.toml
#[derive(Debug, Deserialize)]
struct RubigoConfig {
    build: BuildConfig,
}

#[derive(Debug, Deserialize)]
struct BuildConfig {
    generated_output: String,
    spec_pattern: String,
}

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
    // Test generation
    extract_aria_mapping,
    extract_component_api_typescript,
    extract_cue_blocks,
    extract_cue_version,
    extract_emit_mappings,
    extract_quint_block,
    extract_test_vectors,
    generate_component_tests,
    // Rust code generation
    generate_component_tests_rs,
    generate_emit_tests,
    generate_hook_tests,
    generate_keyboard_tests,
    generate_meta_json,
    // Rust test generation
    generate_rust_conformance_test,
    generate_rust_scaffold,
    generate_types_file,
    // Vectors
    generate_unified_vectors,
    // Extraction
    parse_frontmatter,
    parse_keyboard_interactions,
    parse_typescript_interface,
    // Validation
    validate_spec_structure,
    // Quint
    write_quint_file,
    // Types
    SpecType,
};

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());

    // 1. Parse rubigo.toml for configuration
    let config_path = manifest_dir.join("rubigo.toml");
    let config: RubigoConfig = if config_path.exists() {
        let config_content = fs::read_to_string(&config_path).expect("Failed to read rubigo.toml");
        toml::from_str(&config_content).expect("Failed to parse rubigo.toml")
    } else {
        // Fallback defaults
        RubigoConfig {
            build: BuildConfig {
                generated_output: "generated".to_string(),
                spec_pattern: "*.sudo.md".to_string(),
            },
        }
    };

    // Create generated directory at workspace root
    let generated_dir = manifest_dir.join(&config.build.generated_output);
    fs::create_dir_all(&generated_dir).ok();

    // Extract spec suffix from pattern (e.g., "*.sudo.md" -> ".sudo.md")
    let spec_suffix = config
        .build
        .spec_pattern
        .strip_prefix("*")
        .unwrap_or(&config.build.spec_pattern);

    info!(
        "Using spec pattern: {} (suffix: {})",
        config.build.spec_pattern, spec_suffix
    );

    // 2. Validate required binaries
    validate_binaries();

    // 3. Find all spec files using ignore crate (respects .gitignore)
    let mut spec_files: Vec<PathBuf> = Vec::new();
    let walker = WalkBuilder::new(&manifest_dir)
        .hidden(true) // Skip hidden files
        .git_ignore(true) // Respect .gitignore (skips node_modules, target, etc.)
        .build();

    for entry in walker.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() && path.to_string_lossy().ends_with(spec_suffix) {
            spec_files.push(path.to_path_buf());
        }
    }

    info!("Found {} spec files", spec_files.len());

    // 4. Process each spec file with mirrored output paths
    for spec_path in &spec_files {
        process_spec_file(spec_path, &manifest_dir, &generated_dir);
    }

    // 5. Generate interactions manifest (updated for new structure)
    // TODO: update generate_interactions_manifest to use new paths

    // 6. Generate keyboard interaction tests
    let interactions_path = generated_dir.join("interactions.json");
    if interactions_path.exists() {
        if let Ok(interactions_json) = fs::read_to_string(&interactions_path) {
            let keyboard_mappings = parse_keyboard_interactions(&interactions_json);
            let tests_dir = manifest_dir.join("impl/ts/tests");

            if tests_dir.exists() {
                for (component, mappings) in &keyboard_mappings {
                    let keyboard_test = generate_keyboard_tests(component, mappings);
                    let test_path = tests_dir.join(format!("{}.keyboard.test.ts", component));
                    if let Err(e) = fs::write(&test_path, keyboard_test) {
                        warn!("Failed to write keyboard test for {}: {}", component, e);
                    } else {
                        info!("Generated keyboard test: {}.keyboard.test.ts", component);
                    }
                }
            }
        }
    }

    // 7. Generate Rust test mod.rs (updated path)
    let rust_tests_dir = manifest_dir.join("impl/rust/statechart/tests/generated");
    if rust_tests_dir.exists() {
        let mut mod_content = String::from(
            "//! Generated Rust Conformance Tests\n\
             //!\n\
             //! AUTO-GENERATED by rubigo-build - do not edit\n\n",
        );

        if let Ok(entries) = fs::read_dir(&rust_tests_dir) {
            let mut modules: Vec<String> = entries
                .filter_map(|e| e.ok())
                .filter_map(|e| {
                    let name = e.file_name().to_string_lossy().to_string();
                    if name.ends_with("_conformance.rs") && name != "mod.rs" {
                        Some(name.trim_end_matches(".rs").to_string())
                    } else {
                        None
                    }
                })
                .collect();

            modules.sort();

            for module in &modules {
                mod_content.push_str(&format!("pub mod {};\n", module));
            }

            let mod_path = rust_tests_dir.join("mod.rs");
            if let Err(e) = fs::write(&mod_path, &mod_content) {
                warn!("Failed to write Rust test mod.rs: {}", e);
            } else {
                info!("Generated Rust test mod.rs with {} modules", modules.len());
            }
        }
    }

    // Re-run triggers
    println!("cargo:rerun-if-changed=rubigo.toml");
    println!("cargo:rerun-if-changed=shared");
    println!("cargo:rerun-if-changed=apps");
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

/// Compute the output directory for a spec file, mirroring the spec's location
/// e.g., shared/primitives/button.sudo.md -> generated/shared/primitives/button/
fn compute_output_dir(spec_path: &Path, workspace_root: &Path, generated_root: &Path) -> PathBuf {
    // Get relative path from workspace root
    let rel = spec_path.strip_prefix(workspace_root).unwrap_or(spec_path);
    let parent = rel.parent().unwrap_or(Path::new(""));

    // Get spec name without .sudo.md suffix
    let spec_name = spec_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.trim_end_matches(".sudo"))
        .unwrap_or("unknown");

    // Mirror: generated/{parent}/{spec_name}/
    generated_root.join(parent).join(spec_name)
}

/// Process a single spec file with mirrored output paths
fn process_spec_file(spec_path: &Path, workspace_root: &Path, generated_root: &Path) {
    let spec_name = spec_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.trim_end_matches(".sudo"))
        .unwrap_or("unknown");

    // Compute output directory that mirrors the spec location
    let output_dir = compute_output_dir(spec_path, workspace_root, generated_root);
    fs::create_dir_all(&output_dir).ok();

    println!("cargo:rerun-if-changed={}", spec_path.display());
    info!(
        "Processing spec: {} -> {}",
        spec_path.display(),
        output_dir.display()
    );

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

    // Extract and write Quint block (for formal verification) - into component folder
    if let Some(quint_code) = extract_quint_block(&content) {
        let quint_dir = output_dir.join("quint");
        fs::create_dir_all(&quint_dir).ok();
        if let Err(e) = write_quint_file(spec_name, &quint_code, &quint_dir) {
            warn!("Failed to write Quint file for {}: {}", spec_name, e);
        }
    }

    // Extract and write test vectors - into component folder
    if let Some(vectors) = extract_test_vectors(&content) {
        let vectors_dir = output_dir.join("test-vectors");
        fs::create_dir_all(&vectors_dir).ok();
        if let Err(e) = generate_unified_vectors(spec_name, &vectors, &vectors_dir) {
            warn!(
                "Failed to generate unified vectors for {}: {}",
                spec_name, e
            );
        }
    }

    // Extract and generate TypeScript types from Component API section
    if let Some(typescript) = extract_component_api_typescript(&content) {
        let types_content = generate_types_file(spec_name, &typescript);
        let types_path = output_dir.join(format!("{}.types.ts", spec_name));
        if let Err(e) = fs::write(&types_path, types_content) {
            warn!("Failed to write types file for {}: {}", spec_name, e);
        } else {
            info!("Generated TypeScript types: {}.types.ts", spec_name);
        }

        // Also generate metadata JSON for dynamic controls
        let meta = parse_typescript_interface(spec_name, &typescript);
        let meta_json = generate_meta_json(&meta);
        let meta_path = output_dir.join(format!("{}.meta.json", spec_name));
        if let Err(e) = fs::write(&meta_path, meta_json) {
            warn!("Failed to write meta file for {}: {}", spec_name, e);
        } else {
            info!(
                "Generated metadata: {}.meta.json ({} props)",
                spec_name,
                meta.props.len()
            );
        }

        // Generate hook tests from metadata - into component folder
        let tests_dir = output_dir.join("tests");

        if tests_dir.exists() {
            let hook_test = generate_hook_tests(spec_name, &meta);
            let hook_test_path = tests_dir.join(format!("{}.hook.test.ts", spec_name));
            if let Err(e) = fs::write(&hook_test_path, hook_test) {
                warn!("Failed to write hook test for {}: {}", spec_name, e);
            } else {
                info!("Generated hook test: {}.hook.test.ts", spec_name);
            }
        }
    }

    // Generate component ARIA tests from spec ARIA Mapping section
    let aria_mappings = extract_aria_mapping(&content);
    if !aria_mappings.is_empty() {
        let tests_dir = output_dir.join("tests");

        if tests_dir.exists() {
            let component_test = generate_component_tests(spec_name, &aria_mappings);
            let component_test_path = tests_dir.join(format!("{}.component.test.ts", spec_name));
            if let Err(e) = fs::write(&component_test_path, component_test) {
                warn!("Failed to write component test for {}: {}", spec_name, e);
            } else {
                info!("Generated component test: {}.component.test.ts", spec_name);
            }
        }
    }

    // Generate emit callback tests from Actions section mutation→emit pairs
    let emit_mappings = extract_emit_mappings(&content);
    if !emit_mappings.is_empty() {
        let tests_dir = output_dir.join("tests");

        if tests_dir.exists() {
            let emit_test = generate_emit_tests(spec_name, &emit_mappings);
            let emit_test_path = tests_dir.join(format!("{}.emit.test.ts", spec_name));
            if let Err(e) = fs::write(&emit_test_path, emit_test) {
                warn!("Failed to write emit test for {}: {}", spec_name, e);
            } else {
                info!("Generated emit test: {}.emit.test.ts", spec_name);
            }
        }
    }

    // Generate Rust conformance tests - into component folder
    let rust_tests_dir = output_dir.join("rust-tests");

    // Create directory if it doesn't exist
    fs::create_dir_all(&rust_tests_dir).ok();

    let rust_conformance = generate_rust_conformance_test(spec_name);
    let rust_test_path = rust_tests_dir.join(format!("{}_conformance.rs", spec_name));
    if let Err(e) = fs::write(&rust_test_path, rust_conformance) {
        warn!(
            "Failed to write Rust conformance test for {}: {}",
            spec_name, e
        );
    } else {
        info!("Generated Rust test: {}_conformance.rs", spec_name);
    }

    // Generate Rust component scaffold at components-rs/components/{name}/src/main.rs
    // Only generate for primitive specs (skip schema, compound, presentational)
    if meta.spec_type == SpecType::Primitive {
        let component_dir = output_dir.join("rust-scaffold/src");

        fs::create_dir_all(&component_dir).ok();

        let scaffold = generate_rust_scaffold(spec_name, &content);
        let main_rs_path = component_dir.join("main.rs");

        // Only write if main.rs doesn't exist (don't overwrite existing implementations)
        if !main_rs_path.exists() {
            if let Err(e) = fs::write(&main_rs_path, scaffold) {
                warn!("Failed to write scaffold for {}: {}", spec_name, e);
            } else {
                info!("Generated Rust component: {}/src/main.rs", spec_name);
            }
        }

        // Always generate/regenerate tests.rs from spec (tests are regeneratable)
        let tests_rs = generate_component_tests_rs(spec_name, &content);
        let tests_rs_path = component_dir.join("tests.rs");
        if let Err(e) = fs::write(&tests_rs_path, tests_rs) {
            warn!("Failed to write tests for {}: {}", spec_name, e);
        } else {
            info!("Generated Rust tests: {}/src/tests.rs", spec_name);
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

    // Create cue directory inside component folder
    let cue_dir = output_dir.join("cue");
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
                let json_path = output_dir.join(format!("{}.json", spec_name));
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
