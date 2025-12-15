//! Geographic models - Sites, Buildings, Floors, Spaces

use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// A geographic site/location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Site {
    pub id: Option<Thing>,
    pub name: String,
    #[serde(default)]
    pub region: Option<String>,
    #[serde(default)]
    pub city: Option<String>,
    #[serde(default)]
    pub country: Option<String>,
    #[serde(default)]
    pub address: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub lat: Option<f64>,
    #[serde(default)]
    pub lon: Option<f64>,
}

/// A building at a site
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Building {
    pub id: Option<Thing>,
    pub name: String,
    pub site_id: Option<Thing>,
    #[serde(default)]
    pub address: Option<String>,
    #[serde(default)]
    pub floors_min: Option<i32>,
    #[serde(default)]
    pub floors_max: Option<i32>,
}

/// A floor in a building
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Floor {
    pub id: Option<Thing>,
    pub name: String,
    pub building_id: Option<Thing>,
    #[serde(default)]
    pub level: Option<i32>,
}

/// A space (room/office) on a floor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Space {
    pub id: Option<Thing>,
    pub name: String,
    pub floor_id: Option<Thing>,
    #[serde(default)]
    pub locator: Option<String>,
    #[serde(default)]
    pub space_type: Option<String>,
    #[serde(default)]
    pub capacity: Option<i32>,
}

/// A rack in a space (for data centers, network closets)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rack {
    pub id: Option<Thing>,
    pub name: String,
    pub space_id: Option<Thing>,
    #[serde(default)]
    pub height_u: Option<i32>,
}
