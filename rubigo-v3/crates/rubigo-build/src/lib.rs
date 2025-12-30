//! Rubigo Build Utilities
//!
//! This crate provides parsing, validation, and generation utilities
//! for processing Rubigo V3 component specifications.
//!
//! ## Modules
//! - `types` - Core types: SpecType, SpecMeta, constants
//! - `extraction` - Parse frontmatter and extract code blocks
//! - `validation` - Validate spec structure and Quint models
//! - `quint` - Quint file generation and ITF trace generation
//! - `vectors` - Parse ITF traces and generate unified test vectors
//! - `interactions` - Generate interactions manifest

pub mod extraction;
pub mod interactions;
pub mod quint;
pub mod types;
pub mod validation;
pub mod vectors;

// Re-export common types
pub use extraction::{
    extract_cue_blocks, extract_cue_version, extract_quint_block, extract_test_vectors,
    parse_frontmatter,
};
pub use interactions::{
    extract_component_interactions, extract_keyboard_mappings, extract_mouse_events,
    extract_quint_events, generate_interactions_manifest,
};
pub use quint::{cross_reference_events, generate_itf_trace, write_quint_file};
pub use types::{SpecMeta, SpecType, SPEC_SUFFIX};
pub use validation::{validate_quint_model, validate_spec_structure};
pub use vectors::{
    extract_itf_context, generate_unified_vectors, infer_event_from_change, parse_inline_json,
    parse_itf_trace, parse_test_vectors_yaml,
};
