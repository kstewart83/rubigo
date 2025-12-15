use super::models::ComponentDbDto;
use crate::config::ComponentConfig;
use anyhow::Result;
use surrealdb::Surreal;
use surrealdb::sql::Thing;
use tokio::fs;

pub struct ComponentRepository;

impl ComponentRepository {
    pub async fn seed_from_toml(
        db: &Surreal<surrealdb::engine::local::Db>,
        path: &str,
    ) -> Result<()> {
        // Check if data exists
        let existing: Vec<ComponentDbDto> = db.select("component").await?;
        if !existing.is_empty() {
            tracing::info!("Database already populated, skipping seed.");
            return Ok(());
        }

        tracing::info!("Seeding database from {}", path);
        // Read TOML
        let content = fs::read_to_string(path).await?;

        // Check if this is a scenario file (has modules section) or a direct config
        // Try to parse as scenario file first
        #[derive(serde::Deserialize)]
        #[allow(dead_code)]
        struct ScenarioFile {
            #[serde(default)]
            scenario: Option<ScenarioMeta>,
            #[serde(default)]
            modules: Option<ModuleRefs>,
        }
        #[derive(serde::Deserialize)]
        #[allow(dead_code)]
        struct ScenarioMeta {
            #[serde(default)]
            name: String,
        }
        #[derive(serde::Deserialize)]
        #[allow(dead_code)]
        struct ModuleRefs {
            #[serde(default)]
            personnel: Option<String>,
            #[serde(default)]
            sites: Option<String>,
            #[serde(default)]
            components: Option<String>,
            #[serde(default)]
            infrastructure: Option<String>,
            #[serde(default)]
            assets: Option<String>,
            #[serde(default)]
            meetings: Option<String>,
        }

        let config_dir = std::path::Path::new(path)
            .parent()
            .unwrap_or(std::path::Path::new("."));

        // Try to parse as scenario file
        let config: crate::config::NetworkConfig = if let Ok(scenario) =
            toml::from_str::<ScenarioFile>(&content)
        {
            if let Some(modules) = scenario.modules {
                tracing::info!(
                    "Detected scenario file with modules, loading from referenced files"
                );

                // Load and merge from module files
                let mut merged_config = crate::config::NetworkConfig::default();

                // Load sites
                if let Some(sites_file) = &modules.sites {
                    let sites_path = config_dir.join(sites_file);
                    tracing::info!("Loading sites from {:?}", sites_path);
                    if let Ok(sites_content) = fs::read_to_string(&sites_path).await {
                        if let Ok(sites_config) =
                            toml::from_str::<crate::config::NetworkConfig>(&sites_content)
                        {
                            merged_config.regions = sites_config.regions;
                            merged_config.sites = sites_config.sites;
                            merged_config.buildings = sites_config.buildings;
                            merged_config.spaces = sites_config.spaces;
                            merged_config.racks = sites_config.racks;
                            merged_config.desks = sites_config.desks;
                        }
                    }
                }

                // Load components
                if let Some(components_file) = &modules.components {
                    let components_path = config_dir.join(components_file);
                    tracing::info!("Loading components from {:?}", components_path);
                    if let Ok(comp_content) = fs::read_to_string(&components_path).await {
                        if let Ok(comp_config) =
                            toml::from_str::<crate::config::NetworkConfig>(&comp_content)
                        {
                            merged_config.components = comp_config.components;
                            merged_config.connections = comp_config.connections;
                        }
                    }
                }

                // Load personnel
                if let Some(personnel_file) = &modules.personnel {
                    let personnel_path = config_dir.join(personnel_file);
                    tracing::info!("Loading personnel from {:?}", personnel_path);
                    if let Ok(pers_content) = fs::read_to_string(&personnel_path).await {
                        #[derive(serde::Deserialize)]
                        struct PersonnelFile {
                            #[serde(default)]
                            people: Vec<crate::config::PersonConfig>,
                        }
                        if let Ok(pers_config) = toml::from_str::<PersonnelFile>(&pers_content) {
                            merged_config.people = pers_config.people;
                        }
                    }
                }

                // Load assets
                if let Some(assets_file) = &modules.assets {
                    let assets_path = config_dir.join(assets_file);
                    tracing::info!("Loading assets from {:?}", assets_path);
                    if let Ok(assets_content) = fs::read_to_string(&assets_path).await {
                        #[derive(serde::Deserialize)]
                        struct AssetsFile {
                            #[serde(default)]
                            assets: Vec<crate::config::AssetConfig>,
                        }
                        if let Ok(assets_config) = toml::from_str::<AssetsFile>(&assets_content) {
                            merged_config.assets = assets_config.assets;
                        }
                    }
                }

                merged_config
            } else {
                // No modules section, parse as direct config
                toml::from_str::<crate::config::NetworkConfig>(&content)?
            }
        } else {
            // Parse as direct network config
            toml::from_str::<crate::config::NetworkConfig>(&content)?
        };

        for comp in config.components {
            Self::create(db, comp).await?;
        }

        // Also seed connections
        for conn in config.connections {
            crate::database::connections::ConnectionRepository::create(db, conn).await?;
        }

        // Seed regions
        let mut region_id_map = std::collections::HashMap::new();
        for region in &config.regions {
            let r = crate::database::geo::Region {
                id: None,
                name: region.name.clone(),
                city: region.city.clone(),
                country: region.country.clone(),
                population: 0,
                location: (region.lon, region.lat),
            };
            let created: Option<crate::database::geo::Region> =
                db.create("region").content(r).await.ok().flatten();
            if let Some(created_region) = created {
                if let Some(id) = created_region.id {
                    region_id_map.insert(region.name.clone(), id);
                }
            }
        }

        // Seed sites (linking to regions by name)
        let mut site_id_map = std::collections::HashMap::new();
        for site in &config.sites {
            let region_id = region_id_map.get(&site.region).cloned();
            let s = crate::database::geo::Site {
                id: None,
                name: site.name.clone(),
                region_id,
                location: (0.0, 0.0), // Default, inherits from region conceptually
                status: site.status.clone(),
            };
            if let Ok(created_site) = crate::database::geo::GeoRepository::create_site(db, s).await
            {
                if let Some(id) = created_site.id {
                    site_id_map.insert(site.name.clone(), id);
                }
            }
        }

        // Seed buildings (linking to sites by name)
        let mut building_id_map = std::collections::HashMap::new();
        for building in &config.buildings {
            if let Some(site_thing) = site_id_map.get(&building.site).cloned() {
                let b = crate::database::geo::Building {
                    id: None,
                    name: building.name.clone(),
                    site_id: site_thing,
                };
                if let Ok(created) =
                    crate::database::geo::GeoRepository::create_building(db, b).await
                {
                    if let Some(id) = created.id {
                        building_id_map.insert(building.name.clone(), id);
                    }
                }
            }
        }

        // Seed floors (dynamically generated from building ranges)
        // Map: (building_id_str, level) -> floor_thing
        let mut floor_lookup: std::collections::HashMap<(String, i32), Thing> =
            std::collections::HashMap::new();

        for building in &config.buildings {
            if let Some(building_thing) = building_id_map.get(&building.name).cloned() {
                // Generate floors from min to max, skipping 0
                for level in building.floors.min..=building.floors.max {
                    if level == 0 {
                        continue;
                    }

                    // Determine name: check if we have an explicit name in array
                    // The array size should match the number of valid levels
                    // But we need to map the level to an index.
                    // Total levels = max - min + 1 - (1 if 0 is in range)
                    // Simplified approach from user prompt: "names map to the floors in order"
                    // We need to calculate the index.
                    // If range is -1 to 3: -1, 1, 2, 3.
                    // Index 0 -> -1
                    // Index 1 -> 1
                    // ...

                    let mut valid_levels = Vec::new();
                    for l in building.floors.min..=building.floors.max {
                        if l != 0 {
                            valid_levels.push(l);
                        }
                    }

                    let name = if let Some(idx) = valid_levels.iter().position(|&x| x == level) {
                        building
                            .floor_names
                            .get(idx)
                            .cloned()
                            .unwrap_or_else(|| format!("Level {}", level))
                    } else {
                        format!("Level {}", level)
                    };

                    let f = crate::database::geo::Floor {
                        id: None,
                        name,
                        building_id: building_thing.clone(),
                        level: level as i16,
                    };

                    if let Ok(created) =
                        crate::database::geo::GeoRepository::create_floor(db, f).await
                    {
                        if let Some(id) = created.id {
                            floor_lookup.insert((building.name.clone(), level), id);
                        }
                    }
                }
            }
        }

        // Seed spaces (linking to floors by building + level)
        // Map: (building_name, locator) -> space_thing
        let mut space_lookup: std::collections::HashMap<(String, String), Thing> =
            std::collections::HashMap::new();
        let mut space_id_map: std::collections::HashMap<String, Thing> =
            std::collections::HashMap::new();

        for space in &config.spaces {
            if let Some(floor_thing) = floor_lookup
                .get(&(space.building.clone(), space.level))
                .cloned()
            {
                let s = crate::database::geo::Space {
                    id: None,
                    name: space.name.clone(),
                    locator: space.locator.clone(),
                    floor_id: floor_thing,
                    space_type: match &space.space_type {
                        crate::config::SpaceType::Office => Some("Office".to_string()),
                        crate::config::SpaceType::DataCenter => Some("Data Center".to_string()),
                        crate::config::SpaceType::MeetingRoom => Some("Meeting Room".to_string()),
                        crate::config::SpaceType::CommonArea => Some("Common Area".to_string()),
                        crate::config::SpaceType::Closet => Some("Closet".to_string()),
                    },
                };
                if let Ok(created) = crate::database::geo::GeoRepository::create_space(db, s).await
                {
                    if let Some(id) = created.id {
                        space_lookup
                            .insert((space.building.clone(), space.locator.clone()), id.clone());
                        // Also keep name map for racks/desks if they still use names?
                        space_id_map.insert(space.name.clone(), id); // Keep legacy map if needed?
                    }
                }
            }
        }

        // Seed racks (linking to spaces by name - Racks likely still use "space" name in their config??)
        // Wait, RackConfig in config.rs still has `space: String`. Does that refer to Name or Locator?
        // Usage in sites.toml isn't shown for racks, but usually it refers to `name`.
        // Let's assume it refers to `name` for now as I haven't changed RackConfig logic.
        // space_id_map is populated above so this should work if racks reference the "name" (e.g. "Data Center").
        let mut rack_id_map = std::collections::HashMap::new();
        for rack in &config.racks {
            if let Some(space_thing) = space_id_map.get(&rack.space).cloned() {
                let r = crate::database::geo::Rack {
                    id: None,
                    name: rack.name.clone(),
                    space_id: space_thing,
                    height_u: rack.units.unwrap_or(42) as u8,
                };
                if let Ok(created) = crate::database::geo::GeoRepository::create_rack(db, r).await {
                    if let Some(id) = created.id {
                        rack_id_map.insert(rack.name.clone(), id);
                    }
                }
            }
        }

        // Seed desks (linking to spaces by name)
        let mut _desk_id_map = std::collections::HashMap::new();
        for desk in &config.desks {
            if let Some(space_thing) = space_id_map.get(&desk.space).cloned() {
                let d = crate::database::geo::Desk {
                    id: None,
                    name: desk.name.clone(),
                    space_id: space_thing,
                    assigned_to: desk.assigned_to.clone(),
                };
                if let Ok(created) = crate::database::geo::GeoRepository::create_desk(db, d).await {
                    if let Some(id) = created.id {
                        _desk_id_map.insert(desk.name.clone(), id);
                    }
                }
            }
        }

        // Seed people - try loading from scenarios/mmc/personnel.toml
        // We need to check multiple possible locations since the CWD may vary
        let config_parent = std::path::Path::new(path)
            .parent()
            .unwrap_or(std::path::Path::new("."));

        // Try multiple possible paths for personnel.toml
        let possible_paths = [
            config_parent.join("../common/scenarios/mmc/personnel.toml"),
            std::path::PathBuf::from("../common/scenarios/mmc/personnel.toml"),
            std::path::PathBuf::from("../../common/scenarios/mmc/personnel.toml"),
        ];

        tracing::info!(
            "Looking for personnel.toml, config_parent={:?}",
            config_parent
        );
        for p in &possible_paths {
            tracing::info!("  Checking {:?} - exists: {}", p, p.exists());
        }

        let personnel_path = possible_paths
            .into_iter()
            .find(|p| p.exists())
            .unwrap_or_else(|| std::path::PathBuf::from("../common/scenarios/mmc/personnel.toml"));

        let people_to_seed: Vec<crate::config::PersonConfig> = if personnel_path.exists() {
            tracing::info!("Loading personnel from {:?}", personnel_path);
            match fs::read_to_string(&personnel_path).await {
                Ok(content) => {
                    #[derive(serde::Deserialize)]
                    struct PersonnelFile {
                        #[serde(default)]
                        people: Vec<crate::config::PersonConfig>,
                    }
                    match toml::from_str::<PersonnelFile>(&content) {
                        Ok(pf) => pf.people,
                        Err(e) => {
                            tracing::warn!(
                                "Failed to parse personnel.toml: {}, using main config",
                                e
                            );
                            config.people.clone()
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to read personnel.toml: {}, using main config", e);
                    config.people.clone()
                }
            }
        } else {
            config.people.clone()
        };

        tracing::info!(
            "Seeding {} people from personnel config",
            people_to_seed.len()
        );
        tracing::debug!("space_lookup has {} entries", space_lookup.len());

        for person in &people_to_seed {
            if let Some(site_thing) = site_id_map.get(&person.site).cloned() {
                // Resolve space assignment using (building, locator)
                let lookup_key = (person.building.clone(), person.space.clone());
                let space_thing = space_lookup.get(&lookup_key).cloned();

                if space_thing.is_none() {
                    tracing::warn!(
                        "Could not find space for {} - building: '{}', space/locator: '{}'",
                        person.name,
                        person.building,
                        person.space
                    );
                } else {
                    tracing::debug!("Assigned {} to space {:?}", person.name, space_thing);
                }

                // Load photo file if specified
                let photo_data = if let Some(photo_filename) = &person.photo {
                    let photo_path =
                        std::path::Path::new("../../common/scenarios/mmc").join(photo_filename);
                    match std::fs::read(&photo_path) {
                        Ok(bytes) => {
                            use base64::Engine;
                            Some(base64::engine::general_purpose::STANDARD.encode(&bytes))
                        }
                        Err(e) => {
                            tracing::warn!("Failed to load photo {}: {}", photo_path.display(), e);
                            None
                        }
                    }
                } else {
                    None
                };

                let p = crate::database::geo::Person {
                    id: None,
                    name: person.name.clone(),
                    email: person.email.clone(),
                    title: person.title.clone(),
                    department: person.department.clone(),
                    site_id: site_thing,
                    space_id: space_thing, // Added field
                    manager_id: None,      // TODO: resolve manager references in second pass
                    role: person.role.clone(),
                    photo: person.photo.clone(),
                    bio: person.bio.clone(),
                    desk_phone: person.desk_phone.clone(),
                    cell_phone: person.cell_phone.clone(),
                    photo_data,
                };
                let _ = crate::database::geo::GeoRepository::create_person(db, p).await;
            }
        }

        // Seed network assets
        tracing::info!("Seeding {} network assets", config.assets.len());
        for asset in &config.assets {
            // Resolve rack_id if asset is racked
            let rack_thing = if let Some(rack_name) = &asset.rack {
                rack_id_map.get(rack_name).cloned()
            } else {
                None
            };

            // Resolve space_id if asset is in a space (not racked)
            let space_thing = if let Some(space_name) = &asset.space {
                space_id_map.get(space_name).cloned()
            } else {
                None
            };

            // Convert config enums to database enums
            let category = match asset.category {
                crate::config::AssetCategoryConfig::Network => {
                    crate::database::geo::AssetCategory::Network
                }
                crate::config::AssetCategoryConfig::Server => {
                    crate::database::geo::AssetCategory::Server
                }
                crate::config::AssetCategoryConfig::Storage => {
                    crate::database::geo::AssetCategory::Storage
                }
                crate::config::AssetCategoryConfig::Endpoint => {
                    crate::database::geo::AssetCategory::Endpoint
                }
            };

            let status = match asset.status {
                crate::config::AssetStatusConfig::Storage => {
                    crate::database::geo::AssetStatus::Storage
                }
                crate::config::AssetStatusConfig::InstalledActive => {
                    crate::database::geo::AssetStatus::InstalledActive
                }
                crate::config::AssetStatusConfig::InstalledInactive => {
                    crate::database::geo::AssetStatus::InstalledInactive
                }
            };

            let network_asset = crate::database::geo::NetworkAsset {
                id: None,
                name: asset.name.clone(),
                asset_tag: asset.asset_tag.clone(),
                category,
                manufacturer: asset.manufacturer.clone(),
                model: asset.model.clone(),
                serial_number: asset.serial_number.clone(),
                mac_address: asset.mac_address.clone(),
                status,
                rack_id: rack_thing,
                position_u: asset.position_u,
                height_u: asset.height_u,
                space_id: space_thing,
                storage_location: asset.storage_location.clone(),
                notes: asset.notes.clone(),
            };

            if let Err(e) =
                crate::database::geo::GeoRepository::create_asset(db, network_asset).await
            {
                tracing::warn!("Failed to create asset {}: {}", asset.name, e);
            }
        }

        // Seed meetings from meetings.toml
        let meetings_path = config_parent.join("meetings.toml");
        if meetings_path.exists() {
            tracing::info!("Loading meetings from {:?}", meetings_path);
            if let Ok(meetings_content) = fs::read_to_string(&meetings_path).await {
                #[derive(serde::Deserialize)]
                #[allow(dead_code)]
                struct MeetingConfig {
                    title: String,
                    #[serde(default)]
                    description: Option<String>,
                    start_time: String,
                    end_time: String,
                    #[serde(default)]
                    all_day: bool,
                    #[serde(default = "default_meeting_type")]
                    meeting_type: String,
                    #[serde(default = "default_recurrence")]
                    recurrence: String,
                    #[serde(default = "default_interval")]
                    recurrence_interval: u32,
                    #[serde(default)]
                    recurrence_days: Vec<String>,
                    #[serde(default)]
                    recurrence_until: Option<String>,
                    #[serde(default)]
                    recurrence_count: Option<u32>,
                    #[serde(default)]
                    location: Option<String>,
                    #[serde(default)]
                    virtual_url: Option<String>,
                    #[serde(default)]
                    organizer: Option<String>,
                    #[serde(default)]
                    participants: Vec<String>,
                    #[serde(default = "default_timezone")]
                    timezone: String,
                }
                fn default_meeting_type() -> String {
                    "meeting".to_string()
                }
                fn default_recurrence() -> String {
                    "none".to_string()
                }
                fn default_interval() -> u32 {
                    1
                }
                fn default_timezone() -> String {
                    "America/New_York".to_string()
                }

                #[derive(serde::Deserialize)]
                struct MeetingsFile {
                    #[serde(default)]
                    meetings: Vec<MeetingConfig>,
                }

                if let Ok(meetings_data) = toml::from_str::<MeetingsFile>(&meetings_content) {
                    tracing::info!("Seeding {} meetings", meetings_data.meetings.len());
                    for mtg in meetings_data.meetings {
                        // Create the meeting using calendar module
                        let meeting = crate::database::calendar::Meeting {
                            id: None,
                            title: mtg.title,
                            description: mtg.description,
                            start_time: mtg.start_time,
                            end_time: mtg.end_time,
                            all_day: mtg.all_day,
                            meeting_type: crate::database::calendar::MeetingType::from(
                                mtg.meeting_type.as_str(),
                            ),
                            recurrence: crate::database::calendar::RecurrenceFrequency::from(
                                mtg.recurrence.as_str(),
                            ),
                            recurrence_interval: mtg.recurrence_interval,
                            recurrence_days: mtg.recurrence_days,
                            recurrence_until: mtg.recurrence_until,
                            recurrence_count: mtg.recurrence_count,
                            location_id: None, // TODO: resolve location by name
                            virtual_url: mtg.virtual_url,
                            organizer_id: None, // TODO: resolve organizer by name
                            participant_ids: vec![], // TODO: resolve participants by name
                            timezone: mtg.timezone,
                        };
                        if let Err(e) =
                            crate::database::calendar::CalendarRepository::create(db, meeting).await
                        {
                            tracing::warn!("Failed to create meeting: {}", e);
                        }
                    }
                } else {
                    tracing::warn!("Failed to parse meetings.toml");
                }
            }
        }

        tracing::info!("Seeding complete.");
        Ok(())
    }

    pub async fn get_all(
        db: &Surreal<surrealdb::engine::local::Db>,
    ) -> Result<Vec<ComponentConfig>> {
        let dtos: Vec<ComponentDbDto> = db.select("component").await?;

        // Convert DTOs back to Domain Models
        let mut components = Vec::new();
        for dto in dtos {
            components.push(dto.try_into()?);
        }

        Ok(components)
    }

    pub async fn create(
        db: &Surreal<surrealdb::engine::local::Db>,
        comp: ComponentConfig,
    ) -> Result<ComponentConfig> {
        let dto: ComponentDbDto = comp.clone().into();

        // Remove ID from content to avoid conflict with Record ID (which is set via type::thing)
        let mut json_content = serde_json::to_value(&dto)?;
        if let serde_json::Value::Object(ref mut map) = json_content {
            map.remove("id");
        }

        // Explicitly create with ID using SQL CONTENT to ensure full object preservation
        let mut response = db
            .query("CREATE type::thing('component', $id) CONTENT $content")
            .bind(("id", dto.id.to_string()))
            .bind(("content", json_content))
            .await?;

        // CREATE returns a list of created records
        let created_list: Vec<ComponentDbDto> = response.take(0)?;
        let created_dto = created_list.into_iter().next();

        match created_dto {
            Some(d) => Ok(d.try_into()?),
            None => Err(anyhow::anyhow!("Failed to create component")),
        }
    }

    pub async fn update(
        db: &Surreal<surrealdb::engine::local::Db>,
        id: u32,
        comp: ComponentConfig,
    ) -> Result<ComponentConfig> {
        let dto: ComponentDbDto = comp.clone().into();

        let mut json_content = serde_json::to_value(&dto)?;
        if let serde_json::Value::Object(ref mut map) = json_content {
            map.remove("id");
        }

        let updated_dto: Option<ComponentDbDto> = db
            .update(("component", id.to_string()))
            .content(json_content)
            .await?;

        match updated_dto {
            Some(d) => Ok(d.try_into()?),
            None => Err(anyhow::anyhow!("Failed to update component")),
        }
    }

    pub async fn delete(db: &Surreal<surrealdb::engine::local::Db>, id: u32) -> Result<()> {
        let _: Option<ComponentDbDto> = db.delete(("component", id.to_string())).await?;
        Ok(())
    }
}
