//! Database Layer
//!
//! Provides SurrealDB-backed persistence for the network simulation.
//!
//! # Architecture
//!
//! - **client**: Database connection and initialization
//! - **models**: Data structures for entities (Person, Site, Asset, etc.)
//! - **repositories**: CRUD operations for each entity type
//! - **seed**: Populate database from scenario-loader data
//!
//! # Usage
//!
//! ```ignore
//! use db::Database;
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     let db = Database::init().await?;
//!     
//!     // Seed from scenario
//!     db::seed::from_scenario(&db, "scenarios/mmc").await?;
//!     
//!     // Query data
//!     let people = db::repositories::PersonRepository::list_all(&db.client).await?;
//!     Ok(())
//! }
//! ```

pub mod client;
pub mod models;
pub mod repositories;
pub mod seed;

pub use client::Database;
