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

/// Configurable suffix for spec files
const SPEC_SUFFIX: &str = ".sudo.md";

// Required sections for primitive specs (full statechart)
const PRIMITIVE_SECTIONS: &[&str] = &["Context Schema", "State Machine", "Guards", "Actions"];
// Required sections for compound specs (orchestration + imports)
const COMPOUND_SECTIONS: &[&str] = &["Composition", "Context Schema"];
// Required sections for presentational specs (design only)
const PRESENTATIONAL_SECTIONS: &[&str] = &["Design Guidelines"];
// Required sections for schema specs (types only)
const SCHEMA_SECTIONS: &[&str] = &["Context Schema"];

/// Spec type determined from frontmatter
#[derive(Debug, PartialEq, Clone, Copy)]
enum SpecType {
    Primitive,      // Full statechart + Quint (default for components)
    Compound,       // Orchestration state + child imports
    Presentational, // Design/styling only, no state machine
    Schema,         // Data types only, no UI
}

impl SpecType {
    /// Get required sections for this spec type
    fn required_sections(&self) -> &'static [&'static str] {
        match self {
            SpecType::Primitive => PRIMITIVE_SECTIONS,
            SpecType::Compound => COMPOUND_SECTIONS,
            SpecType::Presentational => PRESENTATIONAL_SECTIONS,
            SpecType::Schema => SCHEMA_SECTIONS,
        }
    }

    /// Get sections that require ```cue blocks (excludes presentational sections)
    fn sections_requiring_cue(&self) -> &'static [&'static str] {
        match self {
            SpecType::Primitive => PRIMITIVE_SECTIONS, // All require cue
            SpecType::Compound => &["Context Schema"], // Only Context Schema needs cue
            SpecType::Presentational => &[],           // Design Guidelines uses sudolang
            SpecType::Schema => SCHEMA_SECTIONS,       // Context Schema needs cue
        }
    }

    /// Get forbidden sections for this spec type (statechart sections not allowed)
    fn forbidden_sections(&self) -> &'static [&'static str] {
        match self {
            SpecType::Primitive => &[], // All sections allowed
            SpecType::Compound => &[],  // All sections allowed (may have orchestration state)
            SpecType::Presentational => &[
                "State Machine",
                "Guards",
                "Actions",
                "Formal Model",
                "Test Vectors",
            ],
            SpecType::Schema => &[
                "State Machine",
                "Guards",
                "Actions",
                "Formal Model",
                "Test Vectors",
            ],
        }
    }

    /// Parse from frontmatter type string
    fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "primitive" => SpecType::Primitive,
            "compound" => SpecType::Compound,
            "presentational" => SpecType::Presentational,
            "schema" => SpecType::Schema,
            "component" => SpecType::Primitive, // Legacy: treat component as primitive
            _ => SpecType::Primitive,
        }
    }
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
            spec_type: SpecType::Primitive,
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

        // 3. Generate interactions manifest for all specs
        generate_interactions_manifest(&spec_dir, &generated_dir);
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
                meta.spec_type = SpecType::from_str(value);
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
        write_quint_file(spec_name, &quint_code, generated_dir);
    }

    // Extract and write test vectors
    if let Some(vectors) = extract_test_vectors(&content) {
        generate_unified_vectors(spec_name, &vectors, generated_dir);
    }

    // Extract Cue blocks (use full content to include any frontmatter cue blocks)
    let cue_blocks = extract_cue_blocks(&content);

    // Cross-reference validate CUE events against Quint _action values
    if let Some(quint_code) = extract_quint_block(&content) {
        // Combine CUE blocks for cross-reference checking
        let combined_cue: String = cue_blocks.iter().map(|(_, block)| block.as_str()).collect();
        let xref_warnings = cross_reference_events(spec_name, &combined_cue, &quint_code);
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

/// Validate spec markdown structure
///
/// Checks based on spec type:
/// 1. H1 title exists
/// 2. Required H2 sections exist (with fuzzy matching for typos)
/// 3. Each required section has ```cue block (not json/yaml)
/// 4. Forbidden sections are not present (for presentational/schema types)
fn validate_spec_structure(content: &str, spec_type: SpecType) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    let required_sections = spec_type.required_sections();
    let cue_required_sections = spec_type.sections_requiring_cue();
    let forbidden_sections = spec_type.forbidden_sections();

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
                // Check if this is a section that should have cue (not all required sections need cue)
                if cue_required_sections.contains(&section.as_str()) && block_type != "cue" {
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

    // Check for forbidden sections (presentational/schema shouldn't have statechart sections)
    for &forbidden in forbidden_sections {
        if found_sections.contains(forbidden) {
            let type_name = match spec_type {
                SpecType::Presentational => "presentational",
                SpecType::Schema => "schema",
                _ => "this type",
            };
            errors.push(format!(
                "SPEC ERROR: Section '{}' is not allowed for {} specs\n\
                 \n\
                 FIX: Remove this section, or change the frontmatter type:\n\
                 - For statechart components, use: type: primitive\n\
                 - For composed components, use: type: compound",
                forbidden, type_name
            ));
        }
    }

    // Check required sections exist
    for &required in required_sections {
        if !found_sections.contains(required) {
            // Check for fuzzy matches
            let suggestion = find_similar_section(&found_sections, required);
            let needs_cue = cue_required_sections.contains(&required);
            let fix = if let Some(similar) = suggestion {
                format!("FIX: Rename '## {}' to '## {}'", similar, required)
            } else if needs_cue {
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
            } else {
                format!("FIX: Add this section:\n\n    ## {}", required)
            };
            errors.push(format!(
                "SPEC ERROR: Missing required section: ## {}\n\
                 \n\
                 {}",
                required, fix
            ));
        }
    }

    // Check cue blocks only for sections that require them
    for &required in cue_required_sections {
        if found_sections.contains(required) && !sections_with_cue.contains(required) {
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

    // Validate Quint model structure first
    let validation_errors = validate_quint_model(spec_name, quint_code);
    if !validation_errors.is_empty() {
        warn!("⚠️  Quint model validation warnings for {}:", spec_name);
        for error in &validation_errors {
            warn!("    - {}", error);
        }
    }

    let quint_file = quint_dir.join(format!("{}.qnt", spec_name));
    if let Err(e) = fs::write(&quint_file, quint_code) {
        warn!("Failed to write Quint file: {}", e);
    } else {
        info!("Extracted Quint: {}", quint_file.display());

        // Run quint typecheck if available
        if let Ok(output) = Command::new("quint")
            .args(["typecheck", quint_file.to_str().unwrap()])
            .output()
        {
            if output.status.success() {
                info!("Quint typecheck passed: {}", spec_name);

                // If model is valid and typecheck passes, generate ITF trace
                if validation_errors.is_empty() {
                    generate_itf_trace(spec_name, &quint_file, generated_dir);
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!("Quint typecheck failed for {}: {}", spec_name, stderr);
            }
        }
    }
}

/// Validate Quint model has required elements for ITF generation
fn validate_quint_model(spec_name: &str, quint_code: &str) -> Vec<String> {
    let mut errors = Vec::new();

    // 1. Check module declaration
    let module_pattern = format!("module {}", spec_name);
    if !quint_code.contains(&module_pattern) {
        errors.push(format!(
            "Missing 'module {} {{ ... }}' declaration",
            spec_name
        ));
    }

    // 2. Check for var declarations
    if !quint_code.contains("var ") {
        errors.push("Missing state variable declarations (var)".into());
    }

    // 3. Check for action init
    if !quint_code.contains("action init") {
        errors.push("Missing 'action init' for initial state".into());
    }

    // 4. Check for action step (required for quint run)
    if !quint_code.contains("action step") {
        errors.push("Missing 'action step' (required for 'quint run' to generate traces)".into());
    }

    // 5. Check for _action variable (required for ITF trace event names)
    if !quint_code.contains("var _action: str") && !quint_code.contains("var _action:str") {
        errors.push(
            "Missing 'var _action: str' (required for ITF traces to include action names)".into(),
        );
    }

    // 6. Check for invariants (val with some condition)
    if !quint_code.contains("val ") {
        errors.push("Missing invariant definitions (val)".into());
    }

    errors
}

/// Cross-reference validate CUE events against Quint _action values
/// Returns warnings if events don't match between CUE state machine and Quint formal model
/// Events with identical (target, actions, guard) signatures are considered verified aliases
fn cross_reference_events(_spec_name: &str, cue_content: &str, quint_code: &str) -> Vec<String> {
    let mut warnings = Vec::new();

    // Parse CUE transitions into (event, signature) pairs
    // Signature = normalized string of "{target, actions, guard}"
    let mut cue_transitions: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();

    for line in cue_content.lines() {
        let trimmed = line.trim();
        // Skip comments
        if trimmed.starts_with("//") {
            continue;
        }
        // Look for lines like "EVENT_NAME: {target: ..."
        if trimmed.contains(':') && trimmed.contains('{') {
            let parts: Vec<&str> = trimmed.splitn(2, ':').collect();
            if parts.len() == 2 {
                let event = parts[0].trim();
                // Only uppercase event names
                if event.chars().all(|c| c.is_uppercase() || c == '_') && !event.is_empty() {
                    // Extract the transition definition (everything after the colon)
                    let transition_def = parts[1].trim();
                    // Normalize: lowercase, remove whitespace
                    let signature = transition_def
                        .to_lowercase()
                        .chars()
                        .filter(|c| !c.is_whitespace())
                        .collect::<String>();
                    cue_transitions.insert(event.to_string(), signature);
                }
            }
        }
    }

    // Extract Quint _action values
    let quint_actions: std::collections::HashSet<String> = quint_code
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.contains("_action'") && trimmed.contains("=") && trimmed.contains('"') {
                let start = trimmed.find('"')? + 1;
                let end = trimmed[start..].find('"')? + start;
                let action = &trimmed[start..end];
                if action != "init" {
                    return Some(action.to_uppercase());
                }
            }
            None
        })
        .collect();

    // Skip if we couldn't extract anything from either
    if cue_transitions.is_empty() || quint_actions.is_empty() {
        return warnings;
    }

    // Build reverse map: signature -> list of events with that signature
    let mut signature_to_events: std::collections::HashMap<String, Vec<String>> =
        std::collections::HashMap::new();
    for (event, sig) in &cue_transitions {
        signature_to_events
            .entry(sig.clone())
            .or_default()
            .push(event.clone());
    }

    // Check each CUE event
    let mut genuinely_missing: Vec<String> = Vec::new();
    let mut verified_aliases: Vec<String> = Vec::new();

    for (event, signature) in &cue_transitions {
        if quint_actions.contains(event) {
            // Event is directly present in Quint - good!
            continue;
        }

        // Event not in Quint - check if there's an alias
        let events_with_same_sig = signature_to_events.get(signature).unwrap();
        let has_alias_in_quint = events_with_same_sig
            .iter()
            .any(|e| quint_actions.contains(e));

        if has_alias_in_quint {
            // Find which event is the alias
            let alias = events_with_same_sig
                .iter()
                .find(|e| quint_actions.contains(*e))
                .unwrap();
            verified_aliases.push(format!("{} (aliases {})", event, alias));
        } else {
            genuinely_missing.push(event.clone());
        }
    }

    // Report verified aliases (informational, not warnings)
    if !verified_aliases.is_empty() {
        // These are OK - no warning needed
        // Could log as info: "Verified CUE aliases: {:?}", verified_aliases
    }

    // Report genuinely missing events
    if !genuinely_missing.is_empty() {
        warnings.push(format!(
            "CUE events missing from Quint (not aliased): {:?}",
            genuinely_missing
        ));
    }

    // Find actions in Quint but not in CUE
    let cue_event_set: std::collections::HashSet<_> = cue_transitions.keys().cloned().collect();
    let missing_in_cue: Vec<_> = quint_actions.difference(&cue_event_set).collect();
    if !missing_in_cue.is_empty() {
        warnings.push(format!(
            "Quint _action values not in CUE events: {:?}",
            missing_in_cue
        ));
    }

    warnings
}

/// Generate ITF trace from validated Quint model
fn generate_itf_trace(spec_name: &str, quint_file: &Path, generated_dir: &Path) {
    let vectors_dir = generated_dir.join("test-vectors");
    fs::create_dir_all(&vectors_dir).ok();

    let itf_file = vectors_dir.join(format!("{}.itf.json", spec_name));

    // Run quint simulation to generate ITF trace
    if let Ok(output) = Command::new("quint")
        .args([
            "run",
            quint_file.to_str().unwrap(),
            "--max-samples=20",
            "--out-itf",
            itf_file.to_str().unwrap(),
        ])
        .output()
    {
        if output.status.success() {
            info!("Generated ITF trace: {}", itf_file.display());
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Don't fail build, just warn - some models may have constraints that prevent traces
            warn!(
                "Could not generate ITF trace for {} (this may be normal): {}",
                spec_name,
                stderr.lines().next().unwrap_or("unknown error")
            );
        }
    }
}

/// Generate unified test vectors JSON from spec test-vectors block + ITF traces
fn generate_unified_vectors(spec_name: &str, yaml_content: &str, generated_dir: &Path) {
    let vectors_dir = generated_dir.join("test-vectors");
    fs::create_dir_all(&vectors_dir).ok();

    // Parse YAML test vectors (simple line-by-line parsing)
    let yaml_scenarios = parse_test_vectors_yaml(spec_name, yaml_content);

    // Load ITF traces if they exist
    let itf_file = vectors_dir.join(format!("{}.itf.json", spec_name));
    let itf_scenarios = if itf_file.exists() {
        parse_itf_trace(spec_name, &itf_file)
    } else {
        Vec::new()
    };

    // Build unified JSON structure
    let unified = serde_json::json!({
        "component": spec_name,
        "generated": chrono::Utc::now().to_rfc3339(),
        "sources": {
            "yaml": yaml_scenarios.len(),
            "itf": itf_scenarios.len()
        },
        "scenarios": yaml_scenarios.into_iter().chain(itf_scenarios).collect::<Vec<_>>()
    });

    let unified_file = vectors_dir.join(format!("{}.unified.json", spec_name));
    match serde_json::to_string_pretty(&unified) {
        Ok(json_str) => {
            if let Err(e) = fs::write(&unified_file, json_str) {
                warn!("Failed to write unified vectors: {}", e);
            } else {
                let total = unified["sources"]["yaml"].as_u64().unwrap_or(0)
                    + unified["sources"]["itf"].as_u64().unwrap_or(0);
                info!(
                    "Generated unified vectors: {} ({} scenarios)",
                    unified_file.display(),
                    total
                );
            }
        }
        Err(e) => {
            warn!("Failed to serialize unified vectors: {}", e);
        }
    }
}

/// Parse YAML test vectors into scenario JSON objects
fn parse_test_vectors_yaml(_spec_name: &str, yaml_content: &str) -> Vec<serde_json::Value> {
    let mut scenarios = Vec::new();
    let mut current_scenario: Option<serde_json::Map<String, serde_json::Value>> = None;
    let mut in_given = false;
    let mut in_then = false;
    let mut given_context = serde_json::Value::Null;
    let mut given_state = String::new();
    let mut then_context = serde_json::Value::Null;
    let mut then_state = String::new();
    let mut event_name = String::new();
    let mut payload: Option<serde_json::Value> = None;

    for line in yaml_content.lines() {
        let trimmed = line.trim();

        // Skip comments and empty lines
        if trimmed.starts_with('#') || trimmed.is_empty() {
            continue;
        }

        // New scenario
        if trimmed.starts_with("- scenario:") {
            // Save previous scenario
            if current_scenario.is_some() && !event_name.is_empty() {
                let mut step = serde_json::json!({
                    "event": event_name,
                    "before": { "context": given_context, "state": given_state },
                    "after": { "context": then_context, "state": then_state }
                });
                if let Some(p) = &payload {
                    step["payload"] = p.clone();
                }
                let scenario_json = serde_json::json!({
                    "name": current_scenario.as_ref().unwrap().get("name").and_then(|v| v.as_str()).unwrap_or(""),
                    "source": "yaml",
                    "steps": [step]
                });
                scenarios.push(scenario_json);
            }
            // Start new scenario
            let name = trimmed
                .strip_prefix("- scenario:")
                .unwrap()
                .trim()
                .trim_matches('"');
            let mut map = serde_json::Map::new();
            map.insert("name".into(), serde_json::Value::String(name.to_string()));
            current_scenario = Some(map);
            in_given = false;
            in_then = false;
            payload = None;
            event_name.clear();
        } else if trimmed.starts_with("given:") {
            in_given = true;
            in_then = false;
        } else if trimmed.starts_with("when:") {
            event_name = trimmed.strip_prefix("when:").unwrap().trim().to_uppercase();
            in_given = false;
            in_then = false;
        } else if trimmed.starts_with("payload:") {
            // Parse inline payload like: payload: { id: "tab-0" }
            let payload_str = trimmed.strip_prefix("payload:").unwrap().trim();
            if let Ok(v) = parse_inline_json(payload_str) {
                payload = Some(v);
            }
            in_given = false;
            in_then = false;
        } else if trimmed.starts_with("then:") {
            in_then = true;
            in_given = false;
        } else if trimmed.starts_with("context:") {
            let ctx_str = trimmed.strip_prefix("context:").unwrap().trim();
            if let Ok(ctx) = parse_inline_json(ctx_str) {
                if in_given {
                    given_context = ctx;
                } else if in_then {
                    then_context = ctx;
                }
            }
        } else if trimmed.starts_with("state:") {
            let state = trimmed
                .strip_prefix("state:")
                .unwrap()
                .trim()
                .trim_matches('"');
            if in_given {
                given_state = state.to_string();
            } else if in_then {
                then_state = state.to_string();
            }
        }
    }

    // Don't forget the last scenario
    if current_scenario.is_some() && !event_name.is_empty() {
        let mut step = serde_json::json!({
            "event": event_name,
            "before": { "context": given_context, "state": given_state },
            "after": { "context": then_context, "state": then_state }
        });
        if let Some(p) = &payload {
            step["payload"] = p.clone();
        }
        let scenario_json = serde_json::json!({
            "name": current_scenario.as_ref().unwrap().get("name").and_then(|v| v.as_str()).unwrap_or(""),
            "source": "yaml",
            "steps": [step]
        });
        scenarios.push(scenario_json);
    }

    scenarios
}

/// Parse inline JSON-like object { key: value, ... }
fn parse_inline_json(s: &str) -> Result<serde_json::Value, ()> {
    // Convert { key: value } to { "key": value } for JSON parsing
    let mut json_str = s.to_string();
    // Add quotes around unquoted keys
    json_str = json_str
        .replace("{ ", "{")
        .replace(" }", "}")
        .replace(": ", ":");
    // Use regex-like replacement for keys
    let mut result = String::new();
    let mut chars = json_str.chars().peekable();
    let mut in_string = false;

    while let Some(c) = chars.next() {
        if c == '"' {
            in_string = !in_string;
            result.push(c);
        } else if !in_string && (c.is_alphabetic() || c == '_') {
            // Start of a key - collect it
            let mut key = String::from(c);
            while let Some(&next) = chars.peek() {
                if next.is_alphanumeric() || next == '_' {
                    key.push(chars.next().unwrap());
                } else {
                    break;
                }
            }
            // Check if followed by colon (it's a key)
            if chars.peek() == Some(&':') {
                result.push('"');
                result.push_str(&key);
                result.push('"');
            } else {
                // It's a value like true/false
                result.push_str(&key);
            }
        } else {
            result.push(c);
        }
    }

    serde_json::from_str(&result).map_err(|_| ())
}

/// Parse ITF trace file into scenario JSON objects
fn parse_itf_trace(spec_name: &str, itf_file: &Path) -> Vec<serde_json::Value> {
    let content = match fs::read_to_string(itf_file) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let itf: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };

    // ITF format has "states" array
    let states = match itf.get("states").and_then(|s| s.as_array()) {
        Some(s) => s,
        None => return Vec::new(),
    };

    if states.len() < 2 {
        return Vec::new();
    }

    // Convert ITF states to steps
    let mut steps = Vec::new();
    for i in 1..states.len() {
        let before = &states[i - 1];
        let after = &states[i];

        // Extract context values (ITF uses different key names)
        let before_ctx = extract_itf_context(before);
        let after_ctx = extract_itf_context(after);

        // Use _action from ITF state if present, otherwise infer from state changes
        let event = after
            .get("_action")
            .and_then(|v| v.as_str())
            .map(|s| s.to_uppercase())
            .unwrap_or_else(|| infer_event_from_change(&before_ctx, &after_ctx));

        // Extract state from Quint's state variable (if present, otherwise default to idle)
        let before_state = before
            .get("state")
            .and_then(|v| v.as_str())
            .unwrap_or("idle");
        let after_state = after
            .get("state")
            .and_then(|v| v.as_str())
            .unwrap_or("idle");

        // Derive payload for actions that need it (e.g., SELECT_TAB needs id)
        let payload = if event == "SELECT_TAB" {
            // For tabs, derive payload.id from the selectedId in the after state
            after
                .get("selectedId")
                .map(|id| serde_json::json!({"id": id}))
        } else {
            None
        };

        let mut step = serde_json::json!({
            "event": event,
            "before": { "context": before_ctx, "state": before_state },
            "after": { "context": after_ctx, "state": after_state }
        });

        // Add payload if present
        if let Some(p) = payload {
            step.as_object_mut()
                .unwrap()
                .insert("payload".to_string(), p);
        }

        steps.push(step);
    }

    vec![serde_json::json!({
        "name": format!("itf-trace-{}", spec_name),
        "source": "itf",
        "steps": steps
    })]
}

/// Extract context from ITF state
fn extract_itf_context(state: &serde_json::Value) -> serde_json::Value {
    // ITF states have various formats - try to extract relevant fields
    let mut ctx = serde_json::Map::new();

    // Common fields across components
    for field in [
        "checked",
        "disabled",
        "readOnly",
        "focused",
        "indeterminate",
        "loading",
        "pressed",
        "selectedId",
        "focusedId",
    ] {
        if let Some(v) = state.get(field) {
            ctx.insert(field.to_string(), v.clone());
        }
    }

    serde_json::Value::Object(ctx)
}

/// Infer event name from context changes
fn infer_event_from_change(before: &serde_json::Value, after: &serde_json::Value) -> String {
    // Check for common state transitions
    if before.get("checked") != after.get("checked") {
        return "TOGGLE".into();
    }
    if before.get("focused") != after.get("focused") {
        let focused_after = after
            .get("focused")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        return if focused_after { "FOCUS" } else { "BLUR" }.into();
    }
    if before.get("pressed") != after.get("pressed") {
        let pressed_after = after
            .get("pressed")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        return if pressed_after {
            "PRESS_DOWN"
        } else {
            "PRESS_UP"
        }
        .into();
    }
    if before.get("loading") != after.get("loading") {
        let loading_after = after
            .get("loading")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        return if loading_after {
            "START_LOADING"
        } else {
            "STOP_LOADING"
        }
        .into();
    }
    if before.get("selectedId") != after.get("selectedId") {
        return "SELECT_TAB".into();
    }
    if before.get("focusedId") != after.get("focusedId") {
        return "FOCUS_NEXT".into();
    }
    if before.get("indeterminate") != after.get("indeterminate") {
        return "SET_INDETERMINATE".into();
    }

    "UNKNOWN".into()
}

/// Generate interactions manifest from all specs
/// Outputs generated/interactions.json with events and keyboard mappings for each component
fn generate_interactions_manifest(spec_dir: &Path, generated_dir: &Path) {
    use serde_json::{json, Map, Value};

    let mut components: Map<String, Value> = Map::new();

    // Find all spec files
    if let Ok(entries) = fs::read_dir(spec_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                if let Ok(files) = fs::read_dir(&path) {
                    for file in files.filter_map(|f| f.ok()) {
                        let file_path = file.path();
                        if file_path.to_string_lossy().ends_with(SPEC_SUFFIX) {
                            if let Ok(content) = fs::read_to_string(&file_path) {
                                let spec_name = file_path
                                    .file_stem()
                                    .and_then(|s| s.to_str())
                                    .map(|s| s.replace(".sudo", ""))
                                    .unwrap_or_default();

                                if let Some(component_info) =
                                    extract_component_interactions(&content)
                                {
                                    components.insert(spec_name, component_info);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Write interactions.json
    let manifest = json!({
        "version": "1.0",
        "generated": chrono_lite_now(),
        "components": components
    });

    let manifest_path = generated_dir.join("interactions.json");
    if let Ok(json_str) = serde_json::to_string_pretty(&manifest) {
        fs::write(&manifest_path, json_str).ok();
        println!(
            "cargo:warning=Generated interactions manifest: {}",
            manifest_path.display()
        );
    }
}

/// Get current timestamp in ISO format (simple implementation)
fn chrono_lite_now() -> String {
    // Use build-time env var for reproducibility, or fallback
    std::env::var("SOURCE_DATE_EPOCH")
        .ok()
        .unwrap_or_else(|| "2024-01-01T00:00:00Z".to_string())
}

/// Extract component interactions from spec content
fn extract_component_interactions(content: &str) -> Option<serde_json::Value> {
    use serde_json::{json, Map, Value};

    let (meta, _) = parse_frontmatter(content);

    // Skip presentational and schema types - they don't have interactions
    if meta.spec_type == SpecType::Presentational || meta.spec_type == SpecType::Schema {
        return None;
    }

    let mut info: Map<String, Value> = Map::new();

    // Extract events from Quint model
    let events = extract_quint_events(content);
    if !events.is_empty() {
        info.insert("events".to_string(), json!(events));
    }

    // Extract keyboard mappings from Keyboard Interaction section
    let keyboard = extract_keyboard_mappings(content);
    if !keyboard.is_empty() {
        info.insert("keyboard".to_string(), json!(keyboard));
    }

    // Extract mouse events from Requirements/Design sections
    let mouse = extract_mouse_events(content);
    if !mouse.is_empty() {
        info.insert("mouse".to_string(), json!(mouse));
    }

    if info.is_empty() {
        None
    } else {
        Some(Value::Object(info))
    }
}

/// Extract event names from Quint 'action' definitions
fn extract_quint_events(content: &str) -> Vec<String> {
    let mut events = Vec::new();

    if let Some(quint_code) = extract_quint_block(content) {
        // Find all 'action NAME = ' definitions
        let action_re = regex::Regex::new(r"action\s+(\w+)\s*=").unwrap();
        for cap in action_re.captures_iter(&quint_code) {
            let action_name = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            // Skip init and step actions (internal)
            if action_name != "init" && action_name != "step" && !action_name.is_empty() {
                events.push(action_name.to_string());
            }
        }
    }

    events.sort();
    events.dedup();
    events
}

/// Extract keyboard mappings from "Keyboard Interaction" section
fn extract_keyboard_mappings(content: &str) -> serde_json::Map<String, serde_json::Value> {
    use serde_json::json;

    let mut keyboard: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();

    // Find Keyboard Interaction section
    let section_re = regex::Regex::new(r"(?m)^Keyboard Interaction:\s*\n((?:  - .+\n?)+)").unwrap();

    if let Some(caps) = section_re.captures(content) {
        let section_content = caps.get(1).map(|m| m.as_str()).unwrap_or("");

        // Parse each line like "  - Tab: Focus/unfocus"
        let line_re = regex::Regex::new(r"  - ([^:]+):\s*(.+)").unwrap();
        for line_cap in line_re.captures_iter(section_content) {
            let key = line_cap.get(1).map(|m| m.as_str().trim()).unwrap_or("");
            let action = line_cap.get(2).map(|m| m.as_str().trim()).unwrap_or("");

            if !key.is_empty() && !action.is_empty() {
                keyboard.insert(key.to_string(), json!(action));
            }
        }
    }

    keyboard
}

/// Extract mouse events mentioned in content
fn extract_mouse_events(content: &str) -> Vec<String> {
    let mut mouse_events = Vec::new();

    // Common mouse event patterns
    let patterns = [
        ("click", "click"),
        ("mousedown", "mouseDown"),
        ("mouseup", "mouseUp"),
        ("pointer_enter", "pointerEnter"),
        ("pointer_leave", "pointerLeave"),
        ("mouseleave", "mouseLeave"),
        ("mouseenter", "mouseEnter"),
        ("drag", "drag"),
        ("hover", "hover"),
    ];

    let content_lower = content.to_lowercase();
    for (pattern, name) in patterns {
        if content_lower.contains(pattern) {
            mouse_events.push(name.to_string());
        }
    }

    mouse_events.sort();
    mouse_events.dedup();
    mouse_events
}
