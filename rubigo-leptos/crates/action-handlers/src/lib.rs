//! Action Handlers
//!
//! Server-side handlers that process actions and interact with the database.
//! Used by both Axum (gui-server) and Tauri backends.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────┐
//! │   ActionBroker  │  (HTTP or Tauri IPC)
//! └────────┬────────┘
//!          │
//!          ▼
//! ┌─────────────────┐
//! │ ActionDispatcher│  (this crate)
//! └────────┬────────┘
//!          │
//!          ▼
//! ┌─────────────────┐
//! │   db::Database  │
//! └─────────────────┘
//! ```
//!
//! # Usage
//!
//! ```ignore
//! use action_handlers::ActionDispatcher;
//! use db::Database;
//!
//! let db = Database::init().await?;
//! let dispatcher = ActionDispatcher::new(db);
//!
//! // Handle an action JSON blob
//! let response = dispatcher.handle_json("personnel.list", payload).await?;
//! ```

mod assets;
mod dispatcher;
mod personnel;

pub use dispatcher::ActionDispatcher;
