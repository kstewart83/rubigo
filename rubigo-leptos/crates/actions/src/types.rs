//! Action Type Definitions
//!
//! Actions are CRUD-grouped by entity type.
//! Each action contains all data needed for the backend to process it.

use crate::broker::Action;
use serde::{Deserialize, Serialize};

// =============================================================================
// Asset Actions
// =============================================================================

/// Actions for network asset management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssetAction {
    /// Create a new asset
    Create(CreateAssetData),
    /// Update an existing asset
    Update(String, UpdateAssetData),
    /// Delete an asset by ID
    Delete(String),
    /// List assets with optional filters
    List(AssetListQuery),
    /// Get a single asset by ID
    Get(String),
}

impl Action for AssetAction {
    type Response = AssetResponse;

    fn action_type(&self) -> &'static str {
        match self {
            AssetAction::Create(_) => "asset.create",
            AssetAction::Update(_, _) => "asset.update",
            AssetAction::Delete(_) => "asset.delete",
            AssetAction::List(_) => "asset.list",
            AssetAction::Get(_) => "asset.get",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAssetData {
    pub name: String,
    pub manufacturer: String,
    pub model: String,
    pub serial_number: String,
    pub category: String,
    pub mac_address: Option<String>,
    pub status: String,
    pub rack_id: Option<String>,
    pub position_u: Option<u8>,
    pub height_u: Option<u8>,
    pub space_id: Option<String>,
    pub storage_location: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAssetData {
    pub name: Option<String>,
    pub status: Option<String>,
    pub rack_id: Option<String>,
    pub position_u: Option<u8>,
    pub notes: Option<String>,
    // Add other updatable fields as needed
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AssetListQuery {
    pub category: Option<String>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssetResponse {
    /// Single asset returned
    Single(AssetData),
    /// List of assets
    List(Vec<AssetData>),
    /// Operation succeeded with no data
    Success,
    /// Operation failed
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetData {
    pub id: String,
    pub name: String,
    pub manufacturer: String,
    pub model: String,
    pub serial_number: String,
    pub category: String,
    pub status: String,
    // Extend as needed
}

// =============================================================================
// Personnel Actions
// =============================================================================

/// Actions for personnel management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PersonnelAction {
    /// List all personnel
    List(PersonnelListQuery),
    /// Get a single person by ID
    Get(String),
}

impl Action for PersonnelAction {
    type Response = PersonnelResponse;

    fn action_type(&self) -> &'static str {
        match self {
            PersonnelAction::List(_) => "personnel.list",
            PersonnelAction::Get(_) => "personnel.get",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PersonnelListQuery {
    pub search: Option<String>,
    pub department: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PersonnelResponse {
    Single(PersonData),
    List(Vec<PersonData>),
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonData {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub department: Option<String>,
    pub title: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn asset_action_types() {
        let create = AssetAction::Create(CreateAssetData {
            name: "Test".to_string(),
            manufacturer: "Cisco".to_string(),
            model: "C9500".to_string(),
            serial_number: "ABC123".to_string(),
            category: "Network".to_string(),
            mac_address: None,
            status: "storage".to_string(),
            rack_id: None,
            position_u: None,
            height_u: None,
            space_id: None,
            storage_location: None,
            notes: None,
        });
        assert_eq!(create.action_type(), "asset.create");

        let delete = AssetAction::Delete("123".to_string());
        assert_eq!(delete.action_type(), "asset.delete");
    }
}
