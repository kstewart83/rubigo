//! UI Core - Shared Component Library
//!
//! This crate provides reusable UI components built with Leptos 0.8.
//! Components are organized in a hierarchy:
//!
//! - `primitives` - Atomic building blocks (Button, Input, Checkbox, etc.)
//! - `elements` - Composed components (Card, Table, Modal, Tabs)
//! - `layout` - Structural components (Header, Sidebar, Layout)
//! - `features` - Domain-specific compositions (Personnel, Assets, etc.)
//! - `pages` - Full page layouts

pub mod elements;
pub mod features;
pub mod layout;
pub mod primitives;

// Re-export commonly used items
pub use elements::*;
pub use features::*;
pub use layout::*;
pub use primitives::*;
