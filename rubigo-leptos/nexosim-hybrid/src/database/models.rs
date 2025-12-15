use crate::config::{ComponentConfig, ComponentType, DevicePlacement};
use serde::{Deserialize, Deserializer, Serialize};
use surrealdb::sql::Thing;

/// DTO for storing ComponentConfig in SurrealDB.
/// This separates the Domain Model (ComponentConfig) from the Persistence Model.
/// It explicitly handles the `component_type` serialization to avoid internal tagging issues.
#[derive(Debug, Serialize, Deserialize)]
pub struct ComponentDbDto {
    #[serde(skip_serializing)] // We don't verify serialization of ID here as we use keys
    #[serde(deserialize_with = "thing_to_u32")]
    pub id: u32,
    pub name: String,

    // We store the enum variant string and the data separately
    pub type_name: String,
    pub type_data: serde_json::Value,

    // Device placement information
    #[serde(default)]
    pub placement_type: String,
    #[serde(default)]
    pub placement_data: serde_json::Value,
}

fn thing_to_u32<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    let t = Thing::deserialize(deserializer)?;
    match t.id {
        surrealdb::sql::Id::Number(n) => Ok(n as u32),
        surrealdb::sql::Id::String(s) => s.parse::<u32>().map_err(serde::de::Error::custom),
        _ => Err(serde::de::Error::custom(format!(
            "Unsupported ID type: {}",
            t.id
        ))),
    }
}

impl From<ComponentConfig> for ComponentDbDto {
    fn from(config: ComponentConfig) -> Self {
        let (type_name, type_data) = match &config.component_type {
            ComponentType::Router => ("Router".to_string(), serde_json::json!({})),
            ComponentType::Switch => ("Switch".to_string(), serde_json::json!({})),
            ComponentType::Firewall => ("Firewall".to_string(), serde_json::json!({})),
            ComponentType::Server => ("Server".to_string(), serde_json::json!({})),
            ComponentType::Workstation => ("Workstation".to_string(), serde_json::json!({})),
            ComponentType::AccessPoint => ("AccessPoint".to_string(), serde_json::json!({})),
            ComponentType::Phone => ("Phone".to_string(), serde_json::json!({})),
            ComponentType::Printer => ("Printer".to_string(), serde_json::json!({})),
            ComponentType::PacketGenerator {
                dest_id,
                inter_arrival_params,
            } => (
                "PacketGenerator".to_string(),
                serde_json::json!({ "dest_id": dest_id, "inter_arrival_params": inter_arrival_params }),
            ),
            ComponentType::WasmModule { wasm_file } => (
                "WasmModule".to_string(),
                serde_json::json!({ "wasm_file": wasm_file }),
            ),
        };

        let (placement_type, placement_data) = match &config.placement {
            DevicePlacement::Rack { rack, u_position } => (
                "Rack".to_string(),
                serde_json::json!({ "rack": rack, "u_position": u_position }),
            ),
            DevicePlacement::Desk { desk } => {
                ("Desk".to_string(), serde_json::json!({ "desk": desk }))
            }
            DevicePlacement::Standalone => ("Standalone".to_string(), serde_json::json!({})),
        };

        Self {
            id: config.id,
            name: config.name,
            type_name,
            type_data,
            placement_type,
            placement_data,
        }
    }
}

impl TryFrom<ComponentDbDto> for ComponentConfig {
    type Error = anyhow::Error;

    fn try_from(dto: ComponentDbDto) -> Result<Self, Self::Error> {
        let component_type = match dto.type_name.as_str() {
            "Router" => ComponentType::Router,
            "Switch" => ComponentType::Switch,
            "Firewall" => ComponentType::Firewall,
            "Server" => ComponentType::Server,
            "Workstation" => ComponentType::Workstation,
            "AccessPoint" => ComponentType::AccessPoint,
            "Phone" => ComponentType::Phone,
            "Printer" => ComponentType::Printer,
            "PacketGenerator" => {
                let dest_id = dto
                    .type_data
                    .get("dest_id")
                    .and_then(|v| v.as_u64().or_else(|| v.as_f64().map(|f| f as u64)))
                    .ok_or_else(|| {
                        anyhow::anyhow!("Missing or invalid dest_id in {:?}", dto.type_data)
                    })? as u32;

                let inter_arrival_params = dto
                    .type_data
                    .get("inter_arrival_params")
                    .and_then(|v| serde_json::from_value(v.clone()).ok())
                    .ok_or_else(|| anyhow::anyhow!("Invalid inter_arrival_params"))?;

                ComponentType::PacketGenerator {
                    dest_id,
                    inter_arrival_params,
                }
            }
            "WasmModule" => {
                let wasm_file = dto
                    .type_data
                    .get("wasm_file")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow::anyhow!("Missing wasm_file"))?
                    .to_string();

                ComponentType::WasmModule { wasm_file }
            }
            _ => return Err(anyhow::anyhow!("Unknown component type: {}", dto.type_name)),
        };

        let placement = match dto.placement_type.as_str() {
            "Rack" => {
                let rack = dto
                    .placement_data
                    .get("rack")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let u_position = dto
                    .placement_data
                    .get("u_position")
                    .and_then(|v| v.as_u64())
                    .map(|n| n as u32);
                DevicePlacement::Rack { rack, u_position }
            }
            "Desk" => {
                let desk = dto
                    .placement_data
                    .get("desk")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                DevicePlacement::Desk { desk }
            }
            _ => DevicePlacement::Standalone,
        };

        Ok(Self {
            id: dto.id,
            name: dto.name,
            component_type,
            placement,
        })
    }
}
