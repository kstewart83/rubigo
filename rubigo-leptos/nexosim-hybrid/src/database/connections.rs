use crate::config::ConnectionConfig;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use surrealdb::Surreal;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionDbDto {
    #[serde(skip_serializing)]
    pub id: Option<surrealdb::sql::Thing>,
    pub from: u32,
    pub to: u32,
}

impl From<ConnectionConfig> for ConnectionDbDto {
    fn from(config: ConnectionConfig) -> Self {
        Self {
            id: None,
            from: config.from,
            to: config.to,
        }
    }
}

impl TryFrom<ConnectionDbDto> for ConnectionConfig {
    type Error = anyhow::Error;

    fn try_from(dto: ConnectionDbDto) -> Result<Self> {
        Ok(Self {
            from: dto.from,
            to: dto.to,
        })
    }
}

pub struct ConnectionRepository;

impl ConnectionRepository {
    pub async fn get_all(
        db: &Surreal<surrealdb::engine::local::Db>,
    ) -> Result<Vec<ConnectionConfig>> {
        let dtos: Vec<ConnectionDbDto> = db.select("connection").await?;
        let mut connections = Vec::new();
        for dto in dtos {
            connections.push(dto.try_into()?);
        }
        Ok(connections)
    }

    pub async fn create(
        db: &Surreal<surrealdb::engine::local::Db>,
        config: ConnectionConfig,
    ) -> Result<ConnectionConfig> {
        let dto: ConnectionDbDto = config.clone().into();

        // Use composite ID for uniqueness: connection:from-to
        let id_str = format!("{}-{}", config.from, config.to);

        let mut json_content = serde_json::to_value(&dto)?;
        if let serde_json::Value::Object(ref mut map) = json_content {
            map.remove("id");
        }

        let mut response = db
            .query("CREATE type::thing('connection', $id) CONTENT $content")
            .bind(("id", id_str))
            .bind(("content", json_content))
            .await?;

        let created_list: Vec<ConnectionDbDto> = response.take(0)?;
        match created_list.into_iter().next() {
            Some(d) => Ok(d.try_into()?),
            None => Err(anyhow::anyhow!("Failed to create connection")),
        }
    }

    pub async fn delete(
        db: &Surreal<surrealdb::engine::local::Db>,
        from: u32,
        to: u32,
    ) -> Result<()> {
        let id_str = format!("{}-{}", from, to);
        let _: Option<ConnectionDbDto> = db.delete(("connection", id_str)).await?;
        Ok(())
    }
}
