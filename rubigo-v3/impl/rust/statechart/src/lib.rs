//! # Rubigo Statechart
//! 
//! Minimal statechart interpreter with:
//! - Flat state machines (primitives)
//! - Parallel regions (orthogonal states)
//! - Component communication (parent/child messaging)
//!
//! No hierarchy within a single machine - hierarchy is achieved
//! by composing components at boundaries.

mod machine;
mod types;
mod region;

pub use machine::Machine;
pub use types::*;
pub use region::Region;

#[cfg(feature = "wasm")]
mod wasm;

#[cfg(feature = "wasm")]
pub use wasm::*;
