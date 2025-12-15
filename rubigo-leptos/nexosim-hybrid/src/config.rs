use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type")]
pub enum ComponentType {
    Router,
    Switch,
    Firewall,
    Server,
    Workstation,
    AccessPoint,
    Phone,
    Printer,
    PacketGenerator {
        dest_id: u32,
        inter_arrival_params: Vec<f64>,
    },
    WasmModule {
        wasm_file: String,
    },
}

/// Where a device is physically located
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Default)]
#[serde(tag = "placement_type")]
pub enum DevicePlacement {
    Rack {
        rack: String,
        u_position: Option<u32>,
    },
    Desk {
        desk: String,
    },
    #[default]
    Standalone,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentConfig {
    pub id: u32,
    pub name: String,
    #[serde(flatten)]
    pub component_type: ComponentType,
    #[serde(default)]
    pub placement: DevicePlacement,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionConfig {
    pub from: u32,
    pub to: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RegionConfig {
    pub name: String,
    pub city: String,
    pub country: String,
    pub lat: f64,
    pub lon: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SiteConfig {
    pub name: String,
    pub region: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildingConfig {
    pub name: String,
    pub site: String,
    pub address: Option<String>,
    pub floors: FloorRange,
    #[serde(default)]
    pub floor_names: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FloorRange {
    pub min: i32,
    pub max: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpaceConfig {
    pub name: String, // Friendly name, optional in concept but required in struct for now, TOML has it.
    pub building: String,
    pub level: i32,
    pub locator: String,
    #[serde(default, rename = "type")]
    pub space_type: SpaceType,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Default)]
pub enum SpaceType {
    #[default]
    Office,
    #[serde(rename = "Data Center")]
    DataCenter,
    #[serde(rename = "Meeting Room")]
    MeetingRoom,
    #[serde(rename = "Common Area")]
    CommonArea,
    Closet,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RackConfig {
    pub name: String,
    pub space: String,
    pub units: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeskConfig {
    pub name: String,
    pub space: String,
    pub assigned_to: Option<String>,
}

// =============================================================================
// Asset Configuration (for TOML parsing)
// =============================================================================

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Default)]
pub enum AssetCategoryConfig {
    #[default]
    Network,
    Server,
    Storage,
    Endpoint,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Default)]
pub enum AssetStatusConfig {
    #[default]
    #[serde(rename = "storage")]
    Storage,
    #[serde(rename = "installed:active")]
    InstalledActive,
    #[serde(rename = "installed:inactive")]
    InstalledInactive,
}

/// Network asset configuration for TOML parsing
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetConfig {
    pub name: String,
    #[serde(default)]
    pub asset_tag: Option<String>,
    #[serde(default)]
    pub category: AssetCategoryConfig,
    pub manufacturer: String,
    pub model: String,
    pub serial_number: String,
    #[serde(default)]
    pub mac_address: Option<String>,
    #[serde(default)]
    pub status: AssetStatusConfig,
    // Location: either rack-based or space-based
    #[serde(default)]
    pub rack: Option<String>, // Rack name
    #[serde(default)]
    pub position_u: Option<u8>, // Starting U position
    #[serde(default)]
    pub height_u: Option<u8>, // Height in U (default 1)
    #[serde(default)]
    pub space: Option<String>, // Space name (for unracked items)
    #[serde(default)]
    pub storage_location: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
}

/// User roles for role-based dashboard and permissions
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Default)]
pub enum RoleType {
    #[default]
    Employee,
    ITAdmin,
    Executive,
    ComplianceOfficer,
    Engineer,
    HRManager,
    SecurityAnalyst,
    ProjectManager,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PersonConfig {
    pub name: String,
    pub email: String,
    pub title: String,
    pub department: String,
    pub site: String,
    pub building: String,
    pub level: i32,
    pub space: String, // This is now the locator
    pub manager: Option<String>,
    #[serde(default)]
    pub role: RoleType,
    #[serde(default)]
    pub photo: Option<String>,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub desk_phone: Option<String>,
    #[serde(default)]
    pub cell_phone: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct NetworkConfig {
    #[serde(default)]
    pub components: Vec<ComponentConfig>,
    #[serde(default)]
    pub connections: Vec<ConnectionConfig>,
    #[serde(default)]
    pub regions: Vec<RegionConfig>,
    #[serde(default)]
    pub sites: Vec<SiteConfig>,
    #[serde(default)]
    pub buildings: Vec<BuildingConfig>,
    #[serde(default)]
    pub spaces: Vec<SpaceConfig>,
    #[serde(default)]
    pub racks: Vec<RackConfig>,
    #[serde(default)]
    pub desks: Vec<DeskConfig>,
    #[serde(default)]
    pub people: Vec<PersonConfig>,
    #[serde(default)]
    pub assets: Vec<AssetConfig>,
}
