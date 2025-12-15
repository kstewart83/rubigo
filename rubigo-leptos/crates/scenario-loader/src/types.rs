//! Data types matching the scenario TOML structure

use serde::{Deserialize, Serialize};

/// A complete scenario with all modules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub name: String,
    pub short_name: String,
    pub industry: Option<String>,
    pub description: Option<String>,
    pub personnel: Vec<Person>,
    pub sites: Vec<Site>,
    pub buildings: Vec<Building>,
    pub floors: Vec<Floor>,
    pub spaces: Vec<Space>,
    pub assets: Vec<Asset>,
    #[serde(default)]
    pub events: Vec<Event>,
}

/// Person/employee record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    /// Unique identifier (6-char hex)
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    pub email: String,
    pub title: String,
    pub department: String,
    #[serde(default)]
    pub site: Option<String>,
    #[serde(default)]
    pub building: Option<String>,
    #[serde(default)]
    pub level: Option<i32>,
    #[serde(default)]
    pub space: Option<String>,
    #[serde(default)]
    pub manager: Option<String>,
    /// Photo URL (for external images)
    #[serde(default)]
    pub photo: Option<String>,
    /// Base64 encoded photo data (for embedded images)
    #[serde(default)]
    pub photo_data: Option<String>,
    #[serde(default)]
    pub desk_phone: Option<String>,
    #[serde(default)]
    pub cell_phone: Option<String>,
    #[serde(default)]
    pub bio: Option<String>,
}

/// Site (geographic location)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Site {
    pub name: String,
    #[serde(default)]
    pub city: Option<String>,
    #[serde(default)]
    pub state: Option<String>,
    #[serde(default)]
    pub address: Option<String>,
    #[serde(default)]
    pub site_type: Option<String>,
    #[serde(default)]
    pub timezone: Option<String>,
}

/// Building at a site
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Building {
    pub name: String,
    pub site: String,
    #[serde(default)]
    pub building_type: Option<String>,
    #[serde(default)]
    pub year_built: Option<i32>,
    #[serde(default)]
    pub square_feet: Option<i32>,
}

/// Floor in a building
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Floor {
    pub name: String,
    pub building: String,
    #[serde(default)]
    pub level: Option<i32>,
}

/// Space (room/office) on a floor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Space {
    pub name: String,
    #[serde(default)]
    pub locator: Option<String>,
    /// Building name (used to derive floor)
    pub building: String,
    /// Level number (floor)
    #[serde(default)]
    pub level: Option<i32>,
    #[serde(default, rename = "type")]
    pub space_type: Option<String>,
    #[serde(default)]
    pub capacity: Option<i32>,
}

/// Network/IT asset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
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
    pub rack: Option<String>,
    #[serde(default)]
    pub position_u: Option<i32>,
    #[serde(default)]
    pub height_u: Option<i32>,
    /// Space location (for non-racked items)
    #[serde(default)]
    pub space: Option<String>,
    #[serde(default)]
    pub storage_location: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
}

/// Calendar event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    pub start_time: String,
    pub end_time: String,
    #[serde(default)]
    pub event_type: Option<String>,
    #[serde(default)]
    pub all_day: Option<bool>,
    #[serde(default)]
    pub recurrence: Option<String>,
    #[serde(default)]
    pub recurrence_interval: Option<u32>,
    #[serde(default)]
    pub recurrence_days: Option<Vec<String>>,
    #[serde(default)]
    pub recurrence_until: Option<String>,
    #[serde(default)]
    pub organizer_id: Option<String>,
    #[serde(default)]
    pub participant_ids: Option<Vec<String>>,
    #[serde(default)]
    pub location: Option<String>,
    #[serde(default)]
    pub virtual_url: Option<String>,
    #[serde(default)]
    pub timezone: Option<String>,
}

impl Person {
    /// Get unique ID - uses explicit id if set, otherwise generates from email
    pub fn get_id(&self) -> String {
        self.id
            .clone()
            .unwrap_or_else(|| self.email.replace('@', "_").replace('.', "_"))
    }
}

impl Site {
    /// Generate unique ID from name
    pub fn id(&self) -> String {
        self.name.to_lowercase().replace(' ', "_")
    }
}

impl Building {
    /// Generate unique ID from name
    pub fn id(&self) -> String {
        self.name.to_lowercase().replace(' ', "_")
    }
}

impl Floor {
    /// Generate unique ID
    pub fn id(&self) -> String {
        format!(
            "{}_{}",
            self.building.to_lowercase().replace(' ', "_"),
            self.name.to_lowercase().replace(' ', "_")
        )
    }
}

impl Space {
    /// Generate unique ID
    pub fn id(&self) -> String {
        self.locator.clone().unwrap_or_else(|| self.name.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn person_id_explicit() {
        let person = Person {
            id: Some("abc123".to_string()),
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            title: "Developer".to_string(),
            department: "Engineering".to_string(),
            site: None,
            building: None,
            level: None,
            space: None,
            manager: None,
            photo: None,
            photo_data: None,
            desk_phone: None,
            cell_phone: None,
            bio: None,
        };
        assert_eq!(person.get_id(), "abc123");
    }

    #[test]
    fn person_id_fallback() {
        let person = Person {
            id: None,
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            title: "Developer".to_string(),
            department: "Engineering".to_string(),
            site: None,
            building: None,
            level: None,
            space: None,
            manager: None,
            photo: None,
            photo_data: None,
            desk_phone: None,
            cell_phone: None,
            bio: None,
        };
        assert_eq!(person.get_id(), "test_example_com");
    }
}
