//! Quint model utilities
//!
//! Provides functions for working with Quint formal models:
//! - Writing Quint files for verification
//! - Generating ITF traces
//! - Cross-referencing CUE events with Quint actions

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::process::Command;

use crate::validation::validate_quint_model;

/// Write extracted quint file for verification
/// Returns the path to the written file if successful
pub fn write_quint_file(
    spec_name: &str,
    quint_code: &str,
    generated_dir: &Path,
) -> Result<std::path::PathBuf, String> {
    let quint_dir = generated_dir.join("quint");
    fs::create_dir_all(&quint_dir).map_err(|e| format!("Failed to create quint dir: {}", e))?;

    // Validate Quint model structure first
    let validation_errors = validate_quint_model(spec_name, quint_code);
    if !validation_errors.is_empty() {
        for error in &validation_errors {
            eprintln!(
                "[build.rs] ⚠️  Quint model warning for {}: {}",
                spec_name, error
            );
        }
    }

    let quint_file = quint_dir.join(format!("{}.qnt", spec_name));
    fs::write(&quint_file, quint_code).map_err(|e| format!("Failed to write Quint file: {}", e))?;

    Ok(quint_file)
}

/// Run quint typecheck on a file
/// Returns Ok(true) if passed, Ok(false) if failed, Err if quint not available
pub fn typecheck_quint(quint_file: &Path) -> Result<bool, String> {
    let output = Command::new("quint")
        .args(["typecheck", quint_file.to_str().unwrap_or("")])
        .output()
        .map_err(|e| format!("Failed to run quint: {}", e))?;

    Ok(output.status.success())
}

/// Generate ITF trace from validated Quint model
/// Returns the path to the generated ITF file if successful
pub fn generate_itf_trace(
    spec_name: &str,
    quint_file: &Path,
    generated_dir: &Path,
) -> Result<std::path::PathBuf, String> {
    let vectors_dir = generated_dir.join("test-vectors");
    fs::create_dir_all(&vectors_dir).map_err(|e| format!("Failed to create vectors dir: {}", e))?;

    let itf_file = vectors_dir.join(format!("{}.itf.json", spec_name));

    let output = Command::new("quint")
        .args([
            "run",
            quint_file.to_str().unwrap_or(""),
            "--max-samples=20",
            "--out-itf",
            itf_file.to_str().unwrap_or(""),
        ])
        .output()
        .map_err(|e| format!("Failed to run quint: {}", e))?;

    if output.status.success() {
        Ok(itf_file)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!(
            "Could not generate ITF trace: {}",
            stderr.lines().next().unwrap_or("unknown error")
        ))
    }
}

/// Cross-reference validate CUE events against Quint _action values
/// Returns warnings if events don't match between CUE state machine and Quint formal model
/// Events with identical (target, actions, guard) signatures are considered verified aliases
pub fn cross_reference_events(cue_content: &str, quint_code: &str) -> Vec<String> {
    let mut warnings = Vec::new();

    // Parse CUE transitions into (event, signature) pairs
    let mut cue_transitions: HashMap<String, String> = HashMap::new();

    for line in cue_content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("//") {
            continue;
        }
        if trimmed.contains(':') && trimmed.contains('{') {
            let parts: Vec<&str> = trimmed.splitn(2, ':').collect();
            if parts.len() == 2 {
                let event = parts[0].trim();
                if event.chars().all(|c| c.is_uppercase() || c == '_') && !event.is_empty() {
                    let transition_def = parts[1].trim();
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
    let quint_actions: HashSet<String> = quint_code
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.contains("_action'") && trimmed.contains('=') && trimmed.contains('"') {
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

    if cue_transitions.is_empty() || quint_actions.is_empty() {
        return warnings;
    }

    // Build reverse map: signature -> list of events with that signature
    let mut signature_to_events: HashMap<String, Vec<String>> = HashMap::new();
    for (event, sig) in &cue_transitions {
        signature_to_events
            .entry(sig.clone())
            .or_default()
            .push(event.clone());
    }

    // Check each CUE event
    let mut genuinely_missing: Vec<String> = Vec::new();

    for (event, signature) in &cue_transitions {
        if quint_actions.contains(event) {
            continue;
        }

        let events_with_same_sig = signature_to_events.get(signature).unwrap();
        let has_alias_in_quint = events_with_same_sig
            .iter()
            .any(|e| quint_actions.contains(e));

        if !has_alias_in_quint {
            genuinely_missing.push(event.clone());
        }
    }

    if !genuinely_missing.is_empty() {
        warnings.push(format!(
            "CUE events missing from Quint (not aliased): {:?}",
            genuinely_missing
        ));
    }

    let cue_event_set: HashSet<_> = cue_transitions.keys().cloned().collect();
    let missing_in_cue: Vec<_> = quint_actions.difference(&cue_event_set).collect();
    if !missing_in_cue.is_empty() {
        warnings.push(format!(
            "Quint _action values not in CUE events: {:?}",
            missing_in_cue
        ));
    }

    warnings
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cross_reference_finds_missing_events() {
        let cue = r#"
        FOCUS: {target: "focused"}
        BLUR: {target: "idle"}
        "#;
        let quint = r#"
        action focus = all { _action' = "focus" }
        "#;
        let warnings = cross_reference_events(cue, quint);
        // FOCUS and BLUR missing, FOCUS aliased by focus
        assert!(warnings.iter().any(|w| w.contains("BLUR")));
    }

    #[test]
    fn cross_reference_accepts_uppercase_match() {
        let cue = r#"
        TOGGLE: {target: "on"}
        "#;
        let quint = r#"
        action toggle = all { _action' = "toggle" }
        "#;
        let warnings = cross_reference_events(cue, quint);
        // TOGGLE matches toggle (case-insensitive)
        assert!(warnings.is_empty() || !warnings.iter().any(|w| w.contains("TOGGLE")));
    }

    #[test]
    fn cross_reference_handles_empty_inputs() {
        assert!(cross_reference_events("", "").is_empty());
        assert!(cross_reference_events("no events here", "no actions").is_empty());
    }
}
