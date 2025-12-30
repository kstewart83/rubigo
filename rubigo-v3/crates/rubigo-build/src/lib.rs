//! Rubigo Build Utilities
//!
//! This crate provides parsing, validation, and generation utilities
//! for processing Rubigo V3 component specifications.
//!
//! ## Modules
//! - `types` - Core types: SpecType, SpecMeta, constants
//! - `extraction` - Parse frontmatter and extract code blocks
//! - `validation` - Validate spec structure and Quint models
//! - `vectors` - Parse ITF traces and generate unified test vectors
//! - `quint` - Quint file generation and ITF trace generation
//! - `interactions` - Generate interactions manifest

pub mod extraction;
pub mod types;
pub mod validation;

// Re-export common types
pub use extraction::{
    extract_cue_blocks, extract_quint_block, extract_test_vectors, parse_frontmatter,
};
pub use types::{SpecMeta, SpecType, SPEC_SUFFIX};
pub use validation::{validate_quint_model, validate_spec_structure};
