//! Person model

use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// A person/employee record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    pub id: Option<Thing>,
    /// Short unique identifier (e.g., 6-char hex)
    #[serde(default)]
    pub short_id: Option<String>,
    pub name: String,
    pub email: String,
    pub title: String,
    pub department: String,
    #[serde(default)]
    pub site_id: Option<Thing>,
    #[serde(default)]
    pub building_id: Option<Thing>,
    #[serde(default)]
    pub space_id: Option<Thing>,
    #[serde(default)]
    pub manager_id: Option<Thing>,
    #[serde(default)]
    pub photo: Option<String>,
    #[serde(default)]
    pub desk_phone: Option<String>,
    #[serde(default)]
    pub cell_phone: Option<String>,
    #[serde(default)]
    pub bio: Option<String>,
}
