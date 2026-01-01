//! Rubigo V3 Components
//!
//! This crate provides UI components as separate WASM binary targets.
//! Each component lives in its own folder with:
//! - `component.sudo.md` - SudoLang + Cue specification
//! - `src/main.rs` - Rust WASM implementation
//!
//! Components:
//! - `switch` - Binary toggle control

pub mod common;
