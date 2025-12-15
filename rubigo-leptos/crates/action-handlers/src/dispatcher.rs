//! Action Dispatcher
//!
//! Routes actions to the appropriate handler based on action type.

use crate::personnel;
use crate::assets;
use actions::{PersonnelAction, PersonnelResponse, AssetAction, AssetResponse};
use db::Database;
use serde_json::Value;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DispatchError {
    #[error("Unknown action type: {0}")]
    UnknownAction(String),
    #[error("Failed to deserialize action: {0}")]
    Deserialize(String),
    #[error("Failed to serialize response: {0}")]
    Serialize(String),
    #[error("Database error: {0}")]
    Database(String),
}

/// Server-side action dispatcher
pub struct ActionDispatcher {
    db: Database,
}

impl ActionDispatcher {
    /// Create a new dispatcher with a database connection
    pub fn new(db: Database) -> Self {
        Self { db }
    }
    
    /// Get a reference to the database
    pub fn database(&self) -> &Database {
        &self.db
    }
    
    /// Handle a personnel action
    pub async fn handle_personnel(&self, action: PersonnelAction) -> Result<PersonnelResponse, DispatchError> {
        personnel::handle(&self.db.client, action)
            .await
            .map_err(|e| DispatchError::Database(e.to_string()))
    }
    
    /// Handle an asset action
    pub async fn handle_asset(&self, action: AssetAction) -> Result<AssetResponse, DispatchError> {
        assets::handle(&self.db.client, action)
            .await
            .map_err(|e| DispatchError::Database(e.to_string()))
    }
    
    /// Handle a raw JSON action by action type string
    /// Returns JSON response
    pub async fn handle_json(&self, action_type: &str, payload: Value) -> Result<Value, DispatchError> {
        match action_type {
            // Personnel actions
            "personnel.list" | "personnel.get" => {
                let action: PersonnelAction = serde_json::from_value(payload)
                    .map_err(|e| DispatchError::Deserialize(e.to_string()))?;
                let response = self.handle_personnel(action).await?;
                serde_json::to_value(response)
                    .map_err(|e| DispatchError::Serialize(e.to_string()))
            }
            
            // Asset actions
            "asset.list" | "asset.get" | "asset.create" | "asset.update" | "asset.delete" => {
                let action: AssetAction = serde_json::from_value(payload)
                    .map_err(|e| DispatchError::Deserialize(e.to_string()))?;
                let response = self.handle_asset(action).await?;
                serde_json::to_value(response)
                    .map_err(|e| DispatchError::Serialize(e.to_string()))
            }
            
            _ => Err(DispatchError::UnknownAction(action_type.to_string())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn dispatch_personnel_list() {
        let db = Database::init().await.unwrap();
        let dispatcher = ActionDispatcher::new(db);
        
        let payload = json!({"List": {"search": null, "department": null}});
        let result = dispatcher.handle_json("personnel.list", payload).await;
        
        // Should succeed (empty list is fine)
        assert!(result.is_ok());
    }
}
