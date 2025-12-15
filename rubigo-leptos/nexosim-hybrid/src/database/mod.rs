pub mod calendar;
pub mod components;
pub mod connections;
pub mod geo;
pub mod models;
pub mod simulation;

use anyhow::Result;
use surrealdb::Surreal;
use surrealdb::engine::local::Mem;

pub type DbClient = Surreal<surrealdb::engine::local::Db>;

#[derive(Clone, Debug)]
pub struct Database {
    pub client: DbClient,
}

impl Database {
    pub async fn init() -> Result<Self> {
        // Initialize SurrealDB (In-Memory for now)
        let client = Surreal::new::<Mem>(()).await?;

        // Select namespace and database
        client.use_ns("nexosim").use_db("gui").await?;

        // Define explicit schema (make it SCHEMALESS for flexibility with JSON content)
        client.query("DEFINE TABLE component SCHEMALESS;").await?;

        tracing::info!("Database schema initialized (Schemaless).");

        Ok(Self { client })
    }
}
