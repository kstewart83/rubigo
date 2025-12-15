//! Asset models - Network equipment, servers, storage

use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// High-level asset category
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub enum AssetCategory {
    #[default]
    Network,
    Server,
    Storage,
    Endpoint,
}

impl std::fmt::Display for AssetCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AssetCategory::Network => write!(f, "Network"),
            AssetCategory::Server => write!(f, "Server"),
            AssetCategory::Storage => write!(f, "Storage"),
            AssetCategory::Endpoint => write!(f, "Endpoint"),
        }
    }
}

/// Physical installation status
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub enum AssetStatus {
    #[default]
    Storage,
    InstalledActive,
    InstalledInactive,
}

impl std::fmt::Display for AssetStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AssetStatus::Storage => write!(f, "storage"),
            AssetStatus::InstalledActive => write!(f, "installed:active"),
            AssetStatus::InstalledInactive => write!(f, "installed:inactive"),
        }
    }
}

/// Network infrastructure asset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAsset {
    pub id: Option<Thing>,
    pub name: String,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub manufacturer: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub serial_number: Option<String>,
    #[serde(default)]
    pub mac_address: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    /// Rack location (for racked items)
    #[serde(default)]
    pub rack_id: Option<Thing>,
    #[serde(default)]
    pub position_u: Option<i32>,
    #[serde(default)]
    pub height_u: Option<i32>,
    /// Space location (for non-racked items)
    #[serde(default)]
    pub space_id: Option<Thing>,
    #[serde(default)]
    pub storage_location: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
}
