//! Workspace-level build script for Rubigo V3
//!
//! Responsibilities:
//! 1. Validate required binaries (cue, just) are available with acceptable versions
//! 2. Find all spec files matching SPEC_SUFFIX
//! 3. Parse YAML frontmatter for spec type (component vs schema)
//! 4. Validate spec structure (component specs only)
//! 5. Validate specs with `cue vet`
//! 6. Export specs to JSON with `cue export`

use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Configurable suffix for spec files
const SPEC_SUFFIX: &str = ".sudo.md";

/// Required H2 sections that must have ```cue blocks (for component specs)
const REQUIRED_SECTIONS: &[&str] = &["Context Schema", "State Machine", "Guards", "Actions"];

/// Spec type determined from frontmatter
#[derive(Debug, PartialEq, Clone, Copy)]
enum SpecType {
    Component, // Full validation (default)
    Schema,    // Schema-only, no required sections
}

/// Frontmatter metadata
#[derive(Debug)]
struct SpecMeta {
    spec_type: SpecType,
    description: Option<String>,
}

impl Default for SpecMeta {
    fn default() -> Self {
        Self {
            spec_type: SpecType::Component,
            description: None,
        }
    }
}

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
    }

    // Re-run triggers
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=specifications");
}

/// Validate that required binaries are available with acceptable versions
fn validate_binaries() {
    // Check cue
    match Command::new("cue").arg("version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            if let Some(version) = extract_cue_version(&version_str) {
                println!("cargo:warning=Found cue {}", version);
            }
        }
        _ => {
            println!("cargo:warning=cue CLI not found - spec validation will be skipped");
            println!("cargo:warning=Install with: brew install cue-lang/tap/cue");
        }
    }

    // Check just
    match Command::new("just").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            println!("cargo:warning=Found {}", version_str.trim());
        }
        _ => {
            println!("cargo:warning=just CLI not found");
            println!("cargo:warning=Install with: cargo install just");
        }
    }

    // Check quint (optional - for formal verification)
    match Command::new("quint").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version_str = String::from_utf8_lossy(&output.stdout);
            println!("cargo:warning=Found quint {}", version_str.trim());
        }
        _ => {
            println!("cargo:warning=quint CLI not found - formal verification disabled");
            println!("cargo:warning=Install with: npm install -g @informalsystems/quint");
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
                            process_spec_file(&file_path, generated_dir);
                        }
                    }
                }
            }
        }
    }
}

/// Parse YAML frontmatter from markdown content
/// Frontmatter is enclosed in --- markers at the start of the file
fn parse_frontmatter(content: &str) -> (SpecMeta, &str) {
    let content = content.trim_start();

    if !content.starts_with("---") {
        return (SpecMeta::default(), content);
    }

    // Find the closing ---
    let after_first = &content[3..];
    if let Some(end_pos) = after_first.find("\n---") {
        let frontmatter = &after_first[..end_pos];
        let rest = &after_first[end_pos + 4..]; // Skip \n---

        let mut meta = SpecMeta::default();

        for line in frontmatter.lines() {
            let line = line.trim();
            if line.starts_with("type:") {
                let value = line.trim_start_matches("type:").trim();
                meta.spec_type = match value {
                    "schema" => SpecType::Schema,
                    "component" | _ => SpecType::Component,
                };
            } else if line.starts_with("description:") {
                let value = line.trim_start_matches("description:").trim();
                meta.description = Some(value.to_string());
            }
        }

        return (meta, rest);
    }

    (SpecMeta::default(), content)
}

/// Process a single spec file
fn process_spec_file(spec_path: &Path, generated_dir: &Path) {
    let spec_name = spec_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.trim_end_matches(".sudo"))
        .unwrap_or("unknown");

    println!("cargo:rerun-if-changed={}", spec_path.display());
    println!("cargo:warning=Processing spec: {}", spec_path.display());

    // Read spec content
    let content = match fs::read_to_string(spec_path) {
        Ok(c) => c,
        Err(e) => {
            println!(
                "cargo:warning=Failed to read {}: {}",
                spec_path.display(),
                e
            );
            return;
        }
    };

    // Parse frontmatter
    let (meta, rest_content) = parse_frontmatter(&content);
    let type_str = match meta.spec_type {
        SpecType::Component => "component",
        SpecType::Schema => "schema",
    };
    println!("cargo:warning=Spec type: {} ({})", spec_name, type_str);

    // Validate spec structure (only for component specs)
    if meta.spec_type == SpecType::Component {
        if let Err(errors) = validate_spec_structure(rest_content) {
            for error in errors {
                println!(
                    "cargo:warning=Spec validation error in {}: {}",
                    spec_name, error
                );
            }
            // Continue anyway to allow incremental development
        } else {
            println!("cargo:warning=Spec structure validated: {}", spec_name);
        }
    } else {
        println!(
            "cargo:warning=Skipping structure validation for schema spec: {}",
            spec_name
        );
    }

    // Extract and write Quint block (for formal verification)
    if let Some(quint_code) = extract_quint_block(&content) {
        write_quint_file(spec_name, &quint_code, generated_dir);
    }

    // Extract and write test vectors
    if let Some(vectors) = extract_test_vectors(&content) {
        write_test_vectors(spec_name, &vectors, generated_dir);
    }

    // Extract Cue blocks (use full content to include any frontmatter cue blocks)
    let cue_blocks = extract_cue_blocks(&content);

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
        println!("cargo:warning=Failed to write Cue file: {}", e);
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
                println!(
                    "cargo:warning=Skipping empty JSON output for schema: {}",
                    spec_name
                );
            } else {
                let json_path = generated_dir.join(format!("{}.json", spec_name));
                if let Err(e) = fs::write(&json_path, &o.stdout) {
                    println!("cargo:warning=Failed to write JSON: {}", e);
                } else {
                    println!("cargo:warning=Generated {}", json_path.display());
                }
            }
        }
        Ok(o) => {
            let stderr = String::from_utf8_lossy(&o.stderr);
            println!(
                "cargo:warning=cue export failed for {}: {}",
                spec_name, stderr
            );
        }
        Err(e) => {
            println!("cargo:warning=Failed to run cue: {}", e);
        }
    }
}

/// Validate spec markdown structure
///
/// Checks (for component specs):
/// 1. H1 title exists
/// 2. Required H2 sections exist (with fuzzy matching for typos)
/// 3. Each required section has ```cue block (not json/yaml)
fn validate_spec_structure(content: &str) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // Track what we find
    let mut found_h1 = false;
    let mut current_h2: Option<String> = None;
    let mut sections_with_cue: HashSet<String> = HashSet::new();
    let mut sections_with_wrong_block: Vec<(String, String)> = Vec::new(); // (section, block_type)
    let mut found_sections: HashSet<String> = HashSet::new();

    for line in content.lines() {
        if line.starts_with("# ") && !line.starts_with("## ") {
            found_h1 = true;
        } else if line.starts_with("## ") {
            let section = line.trim_start_matches("## ").trim();
            current_h2 = Some(section.to_string());
            found_sections.insert(section.to_string());
        } else if line.trim() == "```cue" {
            if let Some(ref section) = current_h2 {
                sections_with_cue.insert(section.clone());
            }
        } else if line.trim().starts_with("```") && line.trim() != "```" {
            // Detected a code block with a language tag
            let block_type = line.trim().trim_start_matches("```").trim();
            if let Some(ref section) = current_h2 {
                // Check if this is a required section that should have cue
                if REQUIRED_SECTIONS.contains(&section.as_str()) && block_type != "cue" {
                    sections_with_wrong_block.push((section.clone(), block_type.to_string()));
                }
            }
        }
    }

    // Check H1 exists
    if !found_h1 {
        errors.push(format!(
            "SPEC ERROR: Missing H1 title\n\
             \n\
             FIX: Add a title at the top of your spec:\n\
             \n\
                 # Component Name"
        ));
    }

    // Check required sections exist and have cue blocks
    for &required in REQUIRED_SECTIONS {
        if !found_sections.contains(required) {
            // Check for fuzzy matches
            let suggestion = find_similar_section(&found_sections, required);
            let fix = if let Some(similar) = suggestion {
                format!("FIX: Rename '## {}' to '## {}'", similar, required)
            } else {
                format!(
                    "FIX: Add this section with a ```cue block:\n\
                     \n\
                         ## {}\n\
                     \n\
                         ```cue\n\
                         {}: {{\n\
                             // your config here\n\
                         }}\n\
                         ```",
                    required,
                    section_key(required)
                )
            };
            errors.push(format!(
                "SPEC ERROR: Missing required section: ## {}\n\
                 \n\
                 {}",
                required, fix
            ));
        } else if !sections_with_cue.contains(required) {
            // Check if it has a wrong block type
            let wrong_type = sections_with_wrong_block
                .iter()
                .find(|(s, _)| s == required)
                .map(|(_, t)| t.as_str());

            if let Some(bad_type) = wrong_type {
                errors.push(format!(
                    "SPEC ERROR: Section '{}' uses wrong block type\n\
                     \n\
                     Found:    ```{}\n\
                     Expected: ```cue\n\
                     \n\
                     FIX: Convert {} to CUE syntax:\n\
                     - Remove quotes around keys\n\
                     - Remove commas between fields\n\
                     - Use colons for assignment\n\
                     \n\
                     Example:\n\
                         ```cue\n\
                         {}: {{\n\
                             key: \"value\"\n\
                         }}\n\
                         ```",
                    required,
                    bad_type,
                    bad_type,
                    section_key(required)
                ));
            } else {
                errors.push(format!(
                    "SPEC ERROR: Section '{}' missing ```cue code block\n\
                     \n\
                     FIX: Add a cue block to this section:\n\
                     \n\
                         ```cue\n\
                         {}: {{\n\
                             // your config here\n\
                         }}\n\
                         ```",
                    required,
                    section_key(required)
                ));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Find a section name that's similar to the required one (fuzzy match)
fn find_similar_section(found: &HashSet<String>, target: &str) -> Option<String> {
    let target_lower = target.to_lowercase();
    let target_words: HashSet<&str> = target_lower.split_whitespace().collect();

    for section in found {
        let section_lower = section.to_lowercase();

        // Check if section contains key words from target
        let section_words: HashSet<&str> = section_lower.split_whitespace().collect();
        let common: HashSet<_> = target_words.intersection(&section_words).collect();

        // If there's significant word overlap, suggest it
        if !common.is_empty() && common.len() >= target_words.len() / 2 {
            return Some(section.clone());
        }

        // Check for common substitutions
        if (target == "State Machine" && section.contains("Machine"))
            || (target == "Context Schema" && section.contains("Context"))
            || (target == "Guards" && section.contains("Guard"))
            || (target == "Actions" && section.contains("Action"))
        {
            return Some(section.clone());
        }
    }
    None
}

/// Convert section name to CUE key
fn section_key(section: &str) -> &str {
    match section {
        "Context Schema" => "context",
        "State Machine" => "machine",
        "Guards" => "guards",
        "Actions" => "actions",
        _ => "config",
    }
}

/// Extract ```cue code blocks from markdown, keyed by preceding header
fn extract_cue_blocks(content: &str) -> Vec<(String, String)> {
    let mut blocks = Vec::new();
    let mut in_cue_block = false;
    let mut current_block = String::new();
    let mut block_index = 0;
    let mut last_header = String::new();

    for line in content.lines() {
        if line.starts_with("## ") || line.starts_with("### ") {
            last_header = line.trim_start_matches('#').trim().to_string();
        }

        if line.trim() == "```cue" {
            in_cue_block = true;
            current_block.clear();
            continue;
        }

        if in_cue_block && line.trim() == "```" {
            in_cue_block = false;
            let key = if !last_header.is_empty() {
                last_header.to_lowercase().replace(' ', "_")
            } else {
                format!("block_{}", block_index)
            };
            blocks.push((key, current_block.trim().to_string()));
            block_index += 1;
            continue;
        }

        if in_cue_block {
            current_block.push_str(line);
            current_block.push('\n');
        }
    }

    blocks
}

/// Extract ```quint code block from markdown (returns first block found)
fn extract_quint_block(content: &str) -> Option<String> {
    let mut in_quint_block = false;
    let mut quint_code = String::new();

    for line in content.lines() {
        if line.trim() == "```quint" {
            in_quint_block = true;
            quint_code.clear();
            continue;
        }

        if in_quint_block && line.trim() == "```" {
            return Some(quint_code.trim().to_string());
        }

        if in_quint_block {
            quint_code.push_str(line);
            quint_code.push('\n');
        }
    }

    None
}

/// Extract ```test-vectors block from markdown (returns first block found)
fn extract_test_vectors(content: &str) -> Option<String> {
    let mut in_vectors_block = false;
    let mut vectors = String::new();

    for line in content.lines() {
        if line.trim() == "```test-vectors" {
            in_vectors_block = true;
            vectors.clear();
            continue;
        }

        if in_vectors_block && line.trim() == "```" {
            return Some(vectors.trim().to_string());
        }

        if in_vectors_block {
            vectors.push_str(line);
            vectors.push('\n');
        }
    }

    None
}

/// Write extracted quint file for verification
fn write_quint_file(spec_name: &str, quint_code: &str, generated_dir: &Path) {
    let quint_dir = generated_dir.join("quint");
    fs::create_dir_all(&quint_dir).ok();

    let quint_file = quint_dir.join(format!("{}.qnt", spec_name));
    if let Err(e) = fs::write(&quint_file, quint_code) {
        println!("cargo:warning=Failed to write Quint file: {}", e);
    } else {
        println!("cargo:warning=Extracted Quint: {}", quint_file.display());

        // Optionally run quint typecheck if available
        if let Ok(output) = Command::new("quint")
            .args(["typecheck", quint_file.to_str().unwrap()])
            .output()
        {
            if output.status.success() {
                println!("cargo:warning=Quint typecheck passed: {}", spec_name);
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                println!(
                    "cargo:warning=Quint typecheck failed for {}: {}",
                    spec_name, stderr
                );
            }
        }
    }
}

/// Write extracted test vectors file
fn write_test_vectors(spec_name: &str, vectors: &str, generated_dir: &Path) {
    let vectors_dir = generated_dir.join("test-vectors");
    fs::create_dir_all(&vectors_dir).ok();

    let vectors_file = vectors_dir.join(format!("{}.vectors.yaml", spec_name));
    if let Err(e) = fs::write(&vectors_file, vectors) {
        println!("cargo:warning=Failed to write test vectors: {}", e);
    } else {
        println!(
            "cargo:warning=Extracted test vectors: {}",
            vectors_file.display()
        );
    }
}
