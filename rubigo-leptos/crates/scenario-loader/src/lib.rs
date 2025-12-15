//! Scenario Loader
//!
//! Parses scenario TOML files into structured data types.
//! Supports both runtime loading (from files) and compile-time embedding.
//!
//! # Usage
//!
//! ## Runtime loading (for servers)
//! ```no_run
//! use scenario_loader::Scenario;
//! let scenario = Scenario::load_from_path("scenarios/mmc")?;
//! ```
//!
//! ## Compile-time embedding (for WASM)
//! Enable the `embed-mmc` feature:
//! ```toml
//! scenario-loader = { path = "../scenario-loader", features = ["embed-mmc"] }
//! ```
//! Then use:
//! ```no_run
//! use scenario_loader::embedded;
//! let personnel = embedded::mmc::personnel();
//! ```

mod parser;
mod types;

#[cfg(feature = "embed-mmc")]
pub mod embedded;

pub use parser::*;
pub use types::*;
