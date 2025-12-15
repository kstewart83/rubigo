// use super::Database;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use surrealdb::Surreal;
use surrealdb::engine::local::Db;

use surrealdb::sql::Thing;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SimulationRun {
    pub id: Option<Thing>,
    pub started_at: String,
    pub status: String,
    pub logs: Vec<String>,
}

pub struct SimulationRepository;

impl SimulationRepository {
    pub async fn create(db: &Surreal<Db>, run: SimulationRun) -> Result<SimulationRun> {
        // Let SurrealDB generate the ID
        let created: SimulationRun = db
            .create("run")
            .content(run)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to create simulation run"))?;
        Ok(created)
    }

    pub async fn get_all(db: &Surreal<Db>) -> Result<Vec<SimulationRun>> {
        let mut runs: Vec<SimulationRun> = db.select("run").await?;
        // Sort by started_at desc
        runs.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        Ok(runs)
    }

    pub async fn get_by_id(db: &Surreal<Db>, id: &str) -> Result<Option<SimulationRun>> {
        let run: Option<SimulationRun> = db.select(("run", id)).await?;
        Ok(run)
    }

    pub async fn delete(db: &Surreal<Db>, id: &str) -> Result<()> {
        let _deleted: Option<SimulationRun> = db.delete(("run", id)).await?;
        Ok(())
    }
}
