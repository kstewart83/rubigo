//! Database client and initialization

use anyhow::Result;
use surrealdb::engine::local::Mem;
use surrealdb::Surreal;

/// Type alias for the SurrealDB client
pub type DbClient = Surreal<surrealdb::engine::local::Db>;

/// Database wrapper providing connection and initialization
#[derive(Clone, Debug)]
pub struct Database {
    pub client: DbClient,
}

impl Database {
    /// Initialize an in-memory SurrealDB instance
    pub async fn init() -> Result<Self> {
        let client = Surreal::new::<Mem>(()).await?;
        
        // Select namespace and database
        client.use_ns("nexosim").use_db("main").await?;
        
        // Define tables as schemaless for flexibility
        client.query("DEFINE TABLE person SCHEMALESS;").await?;
        client.query("DEFINE TABLE site SCHEMALESS;").await?;
        client.query("DEFINE TABLE building SCHEMALESS;").await?;
        client.query("DEFINE TABLE floor SCHEMALESS;").await?;
        client.query("DEFINE TABLE space SCHEMALESS;").await?;
        client.query("DEFINE TABLE asset SCHEMALESS;").await?;
        client.query("DEFINE TABLE calendar_event SCHEMALESS;").await?;
        client.query("DEFINE TABLE component SCHEMALESS;").await?;
        
        tracing::info!("Database initialized (in-memory, schemaless)");
        
        Ok(Self { client })
    }
    
    /// Initialize with a specific namespace and database name
    pub async fn init_with_names(namespace: &str, database: &str) -> Result<Self> {
        let client = Surreal::new::<Mem>(()).await?;
        client.use_ns(namespace).use_db(database).await?;
        
        tracing::info!("Database initialized: {}/{}", namespace, database);
        
        Ok(Self { client })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn database_init() {
        let db = Database::init().await;
        assert!(db.is_ok());
    }
}
