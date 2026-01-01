//! Build script for rubigo-v3-components
//!
//! This script:
//! 1. Scans for .sudo.md spec files
//! 2. Extracts Cue code blocks
//! 3. Writes them to temp .cue files
//! 4. Calls `cue export` to generate validated JSON
//! 5. Makes the JSON available to component code via include_str!

use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());

    // Check if cue is available
    let cue_available = Command::new("cue")
        .arg("version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    // Find all component directories (contain .sudo.md files)
    let components = find_component_specs(&manifest_dir);

    for (name, spec_path) in &components {
        // Re-run if spec changes
        println!("cargo:rerun-if-changed={}", spec_path.display());

        // Parse the spec
        let spec_content = fs::read_to_string(spec_path)
            .expect(&format!("Failed to read {}", spec_path.display()));

        // Extract Cue blocks by section
        let cue_blocks = extract_cue_blocks(&spec_content);

        // Generate machine JSON using cue CLI or fallback parser
        let machine_json = if cue_available {
            generate_with_cue_cli(name, &cue_blocks, &out_dir).unwrap_or_else(|e| {
                println!(
                    "cargo:warning=cue export failed for {}: {}, falling back to basic parser",
                    name, e
                );
                generate_machine_json_fallback(name, &cue_blocks)
            })
        } else {
            println!(
                "cargo:warning=cue CLI not found, using basic parser for {}",
                name
            );
            generate_machine_json_fallback(name, &cue_blocks)
        };

        // Write to OUT_DIR
        let json_path = out_dir.join(format!("{}_machine.json", name));
        fs::write(&json_path, &machine_json)
            .expect(&format!("Failed to write {}", json_path.display()));

        eprintln!(
            "[build.rs] Generated {} from {}",
            json_path.display(),
            spec_path.display()
        );
    }

    // Re-run if build.rs changes
    println!("cargo:rerun-if-changed=build.rs");
}

/// Find all .sudo.md files in component directories
fn find_component_specs(manifest_dir: &Path) -> Vec<(String, PathBuf)> {
    let mut specs = Vec::new();

    if let Ok(entries) = fs::read_dir(manifest_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                if let Ok(files) = fs::read_dir(&path) {
                    for file in files.filter_map(|f| f.ok()) {
                        let file_path = file.path();
                        if file_path.extension().map(|e| e == "md").unwrap_or(false) {
                            if let Some(stem) = file_path.file_stem() {
                                let stem_str = stem.to_string_lossy();
                                if stem_str.ends_with(".sudo") {
                                    let component_name =
                                        stem_str.trim_end_matches(".sudo").to_string();
                                    specs.push((component_name, file_path));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    specs
}

/// Extract ```cue code blocks from markdown, keyed by preceding header
fn extract_cue_blocks(content: &str) -> HashMap<String, String> {
    let mut blocks = HashMap::new();
    let mut in_cue_block = false;
    let mut current_block = String::new();
    let mut block_index = 0;
    let mut last_header = String::new();

    for line in content.lines() {
        if line.starts_with("## ") {
            last_header = line[3..].trim().to_string();
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
            blocks.insert(key, current_block.trim().to_string());
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

/// Generate machine JSON using the cue CLI
fn generate_with_cue_cli(
    name: &str,
    cue_blocks: &HashMap<String, String>,
    out_dir: &Path,
) -> Result<String, String> {
    // Create a temp directory for cue files
    let cue_dir = out_dir.join(format!("{}_cue", name));
    fs::create_dir_all(&cue_dir).map_err(|e| e.to_string())?;

    // Combine all Cue blocks into one file with proper structure
    let mut combined_cue = String::new();
    combined_cue.push_str("// Auto-generated from ");
    combined_cue.push_str(&format!("{}.sudo.md\n\n", name));

    // Add the blocks in a logical order
    let order = [
        "context_schema",
        "state_machine",
        "guards",
        "actions",
        "events_emitted",
        "invariants",
    ];

    for section in &order {
        if let Some(block) = cue_blocks.get(*section) {
            combined_cue.push_str(&format!("// == {} ==\n", section));
            combined_cue.push_str(block);
            combined_cue.push_str("\n\n");
        }
    }

    // Add any remaining blocks
    for (key, block) in cue_blocks {
        if !order.contains(&key.as_str()) {
            combined_cue.push_str(&format!("// == {} ==\n", key));
            combined_cue.push_str(block);
            combined_cue.push_str("\n\n");
        }
    }

    // Write combined Cue file
    let cue_file = cue_dir.join(format!("{}.cue", name));
    fs::write(&cue_file, &combined_cue).map_err(|e| e.to_string())?;

    // Run cue export
    let output = Command::new("cue")
        .args(["export", "--out", "json"])
        .arg(&cue_file)
        .output()
        .map_err(|e| format!("Failed to run cue: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("cue export failed: {}", stderr));
    }

    // Parse the output and add metadata
    let cue_json: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Failed to parse cue output: {}", e))?;

    // Create final machine JSON with metadata
    let mut machine = serde_json::json!({
        "id": name,
        "generated_from": format!("{}.sudo.md", name),
        "cue_validated": true,
    });

    // Merge in the evaluated Cue
    if let serde_json::Value::Object(map) = cue_json {
        if let serde_json::Value::Object(ref mut m) = machine {
            for (k, v) in map {
                // Convert Cue definition names (remove #)
                let key = k.trim_start_matches('#');
                m.insert(key.to_string(), v);
            }
        }
    }

    serde_json::to_string_pretty(&machine).map_err(|e| e.to_string())
}

/// Fallback parser when cue CLI is not available
fn generate_machine_json_fallback(name: &str, cue_blocks: &HashMap<String, String>) -> String {
    let mut machine = serde_json::json!({
        "id": name,
        "generated_from": format!("{}.sudo.md", name),
        "cue_validated": false,
        "cue_blocks": cue_blocks.keys().collect::<Vec<_>>(),
    });

    // Extract basic info from state_machine block
    if let Some(sm_block) = cue_blocks.get("state_machine") {
        if let Some(initial) = extract_quoted_field(sm_block, "initial:") {
            machine["initial"] = serde_json::Value::String(initial);
        }
    }

    // Include raw guards and actions for later processing
    if let Some(guards_block) = cue_blocks.get("guards") {
        machine["guards_raw"] = serde_json::Value::String(guards_block.clone());
    }

    if let Some(actions_block) = cue_blocks.get("actions") {
        machine["actions_raw"] = serde_json::Value::String(actions_block.clone());
    }

    serde_json::to_string_pretty(&machine).unwrap()
}

/// Extract a quoted field value
fn extract_quoted_field(content: &str, field: &str) -> Option<String> {
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with(field) {
            let value = trimmed[field.len()..].trim().trim_matches('"');
            return Some(value.to_string());
        }
    }
    None
}
