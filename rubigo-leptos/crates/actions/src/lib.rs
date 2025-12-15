//! Actions -//! Transport-Agnostic Action System
//!
//! This crate provides the infrastructure for dispatching actions
//! to the backend regardless of the deployment environment.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────┐     ┌─────────────────┐
//! │   UI Component  │     │   UI Component  │
//! └────────┬────────┘     └────────┬────────┘
//!          │ dispatch()            │ dispatch()
//!          ▼                       ▼
//! ┌─────────────────────────────────────────┐
//! │            ActionBroker Trait           │
//! └─────────────────────────────────────────┘
//!          │                       │
//!    ┌─────┴─────┐           ┌─────┴─────┐
//!    │ HttpBroker│           │TauriBroker│
//!    │ (Browser) │           │ (Desktop) │
//!    └───────────┘           └───────────┘
//! ```

pub mod broker;
pub mod http_broker;
pub mod tauri_broker;
pub mod types;

pub use broker::{Action, ActionBroker, ActionError, NoOpBroker};
pub use http_broker::HttpBroker;
pub use tauri_broker::TauriBroker;
pub use types::*;
