use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Region {
    pub id: Option<Thing>,
    pub name: String,
    pub city: String,
    pub country: String,
    pub population: u64,
    pub location: (f64, f64),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct City {
    pub id: Option<Thing>,
    pub name: String,
    pub country: String,
    pub population: u64,
    pub location: (f64, f64),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Site {
    pub id: Option<Thing>,
    pub name: String,
    pub region_id: Option<Thing>,
    pub location: (f64, f64),
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Building {
    pub id: Option<Thing>,
    pub name: String,
    pub site_id: Thing,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Floor {
    pub id: Option<Thing>,
    pub name: String,
    pub building_id: Thing,
    pub level: i16, // Use i16 for floor number (can be negative for basements)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Space {
    pub id: Option<Thing>,
    pub name: String,
    pub floor_id: Thing,
    pub locator: String,
    pub space_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Rack {
    pub id: Option<Thing>,
    pub name: String,
    pub space_id: Thing,
    pub height_u: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Device {
    pub id: Option<Thing>,
    pub name: String,
    pub rack_id: Thing,
    pub position_u: u8,
    pub component_id: Option<Thing>,
}

// =============================================================================
// Network Asset Management
// =============================================================================

/// High-level asset category
#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
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
#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub enum AssetStatus {
    #[default]
    Storage,
    InstalledActive,
    InstalledInactive,
}

impl std::fmt::Display for AssetStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AssetStatus::Storage => write!(f, "Storage"),
            AssetStatus::InstalledActive => write!(f, "Installed (Active)"),
            AssetStatus::InstalledInactive => write!(f, "Installed (Inactive)"),
        }
    }
}

/// Network infrastructure asset (switches, servers, storage, etc.)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkAsset {
    pub id: Option<Thing>,
    pub name: String, // Friendly name, e.g. "HQ-Core-SW-01"
    #[serde(default)]
    pub asset_tag: Option<String>, // Company asset tag
    #[serde(default)]
    pub category: AssetCategory,
    pub manufacturer: String,
    pub model: String,
    pub serial_number: String,
    #[serde(default)]
    pub mac_address: Option<String>,
    #[serde(default)]
    pub status: AssetStatus,

    // Physical location: either racked OR in a space
    #[serde(default)]
    pub rack_id: Option<Thing>, // If racked
    #[serde(default)]
    pub position_u: Option<u8>, // Starting U position (1 = bottom)
    #[serde(default)]
    pub height_u: Option<u8>, // How many U tall (default 1)
    #[serde(default)]
    pub space_id: Option<Thing>, // If not racked, which space
    #[serde(default)]
    pub storage_location: Option<String>, // Free text for stored items

    #[serde(default)]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Desk {
    pub id: Option<Thing>,
    pub name: String,
    pub space_id: Thing,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Person {
    pub id: Option<Thing>,
    pub name: String,
    pub email: String,
    pub title: String,
    pub department: String,
    pub site_id: Thing,
    pub space_id: Option<Thing>,
    pub manager_id: Option<Thing>,
    #[serde(default)]
    pub role: crate::config::RoleType,
    #[serde(default)]
    pub photo: Option<String>,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub desk_phone: Option<String>,
    #[serde(default)]
    pub cell_phone: Option<String>,
    /// Base64 encoded photo data
    #[serde(default)]
    pub photo_data: Option<String>,
}

/// Geographic feature representing a country, state, or other boundary
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeoFeature {
    pub id: Option<Thing>,
    pub name: String,
    pub feature_type: String,        // "country", "state"
    pub iso_code: Option<String>,    // ISO country/state code
    pub geometry: serde_json::Value, // GeoJSON geometry object
}

pub struct GeoRepository;

impl GeoRepository {
    pub async fn import_cities(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        file_path: &std::path::Path,
    ) -> anyhow::Result<usize> {
        let mut reader = csv::Reader::from_path(file_path)?;
        let mut count = 0;

        // "city","city_ascii","lat","lng","country","iso2","iso3","admin_name","capital","population","id"
        // We use a temporary struct to deserialize CSV rows safely
        #[derive(Debug, Deserialize)]
        struct CityRow {
            city_ascii: String,
            country: String,
            lat: f64,
            lng: f64,
            population: Option<f64>, // CSV population might be empty or float
        }

        // Batch insert/create logic could be optimized, but loop is fine for in-mem MVP
        // Consider batching if too slow.
        for result in reader.deserialize() {
            let record: CityRow = result?;

            let city = City {
                id: None,
                name: record.city_ascii,
                country: record.country,
                population: record.population.unwrap_or(0.0) as u64,
                location: (record.lng, record.lat),
            };

            let _: Option<City> = db.create("city").content(city.clone()).await?;
            count += 1;
        }

        Ok(count)
    }

    /// Import geographic features from a GeoJSON file
    pub async fn import_geojson(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        file_path: &std::path::Path,
        feature_type: &str,
    ) -> anyhow::Result<usize> {
        use geojson::GeoJson;

        let content = std::fs::read_to_string(file_path)?;
        let geojson: GeoJson = content.parse()?;

        let features = match geojson {
            GeoJson::FeatureCollection(fc) => fc.features,
            _ => anyhow::bail!("Expected a FeatureCollection"),
        };

        let mut count = 0;
        for feature in features {
            // Extract name from properties
            let name = feature
                .properties
                .as_ref()
                .and_then(|p| p.get("name").or_else(|| p.get("NAME")))
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string();

            // Extract ISO code if available
            let iso_code = feature
                .properties
                .as_ref()
                .and_then(|p| p.get("iso_a3").or_else(|| p.get("STATE")))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            // Get geometry as JSON value
            let geometry = match &feature.geometry {
                Some(g) => serde_json::to_value(g)?,
                None => continue, // Skip features without geometry
            };

            let geo_feature = GeoFeature {
                id: None,
                name,
                feature_type: feature_type.to_string(),
                iso_code,
                geometry,
            };

            let _: Option<GeoFeature> = db.create("geo_feature").content(geo_feature).await?;
            count += 1;
        }

        tracing::info!(
            "Imported {} {} features from {:?}",
            count,
            feature_type,
            file_path
        );
        Ok(count)
    }

    /// Import all cities from a full CSV file (high-fidelity, ~48K cities)
    /// This clears existing cities and imports fresh data
    pub async fn import_cities_full(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        file_path: &std::path::Path,
    ) -> anyhow::Result<usize> {
        tracing::info!("Starting high-fidelity city import from {:?}", file_path);

        // Clear existing cities
        let _: Vec<City> = db.delete("city").await?;
        tracing::info!("Cleared existing cities for high-fidelity import");

        let mut reader = csv::Reader::from_path(file_path)?;
        let mut count = 0;

        #[derive(Debug, serde::Deserialize)]
        struct CityRow {
            city_ascii: String,
            country: String,
            lat: f64,
            lng: f64,
            population: Option<f64>,
        }

        // Process in batches for progress logging
        for result in reader.deserialize() {
            let record: CityRow = result?;

            let city = City {
                id: None,
                name: record.city_ascii,
                country: record.country,
                population: record.population.unwrap_or(0.0) as u64,
                location: (record.lng, record.lat),
            };

            let _: Option<City> = db.create("city").content(city).await?;
            count += 1;

            // Log progress every 10000 entries
            if count % 10000 == 0 {
                tracing::info!("High-fidelity city import progress: {} cities", count);
            }
        }

        tracing::info!(
            "Completed high-fidelity city import: {} cities total",
            count
        );
        Ok(count)
    }

    /// Import high-fidelity GeoJSON features (replaces existing features of same type)
    pub async fn import_geojson_high_fidelity(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        file_path: &std::path::Path,
        feature_type: &str,
    ) -> anyhow::Result<usize> {
        use geojson::GeoJson;

        tracing::info!(
            "Starting high-fidelity {} import from {:?}",
            feature_type,
            file_path
        );

        // Delete existing features of this type
        let sql = "DELETE FROM geo_feature WHERE feature_type = $ft";
        db.query(sql).bind(("ft", feature_type.to_string())).await?;
        tracing::info!(
            "Cleared existing {} features for high-fidelity import",
            feature_type
        );

        let content = std::fs::read_to_string(file_path)?;
        let geojson: GeoJson = content.parse()?;

        let features = match geojson {
            GeoJson::FeatureCollection(fc) => fc.features,
            _ => anyhow::bail!("Expected a FeatureCollection"),
        };

        let mut count = 0;
        for feature in features {
            let name = feature
                .properties
                .as_ref()
                .and_then(|p| p.get("name").or_else(|| p.get("NAME")))
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string();

            let iso_code = feature
                .properties
                .as_ref()
                .and_then(|p| p.get("iso_a3").or_else(|| p.get("STATE")))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let geometry = match &feature.geometry {
                Some(g) => serde_json::to_value(g)?,
                None => continue,
            };

            let geo_feature = GeoFeature {
                id: None,
                name,
                feature_type: feature_type.to_string(),
                iso_code,
                geometry,
            };

            let _: Option<GeoFeature> = db.create("geo_feature").content(geo_feature).await?;
            count += 1;
        }

        tracing::info!(
            "Completed high-fidelity {} import: {} features from {:?}",
            feature_type,
            count,
            file_path
        );
        Ok(count)
    }

    /// Get all geographic features of a given type
    pub async fn list_geo_features(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        feature_type: Option<&str>,
    ) -> anyhow::Result<Vec<GeoFeature>> {
        let features: Vec<GeoFeature> = match feature_type {
            Some(ft) => {
                let sql = "SELECT * FROM geo_feature WHERE feature_type = $ft";
                let mut result = db.query(sql).bind(("ft", ft.to_string())).await?;
                result.take(0)?
            }
            None => db.select("geo_feature").await?,
        };
        Ok(features)
    }

    pub async fn create_site(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        site: Site,
    ) -> anyhow::Result<Site> {
        let created: Option<Site> = db.create("site").content(site).await?;
        Ok(created.unwrap())
    }

    pub async fn list_sites(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Site>> {
        let sites: Vec<Site> = db.select("site").await?;
        Ok(sites)
    }

    pub async fn search_regions(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        query: &str,
    ) -> anyhow::Result<Vec<Region>> {
        // Simple search by name
        // Use a parameterized query for safety
        let sql = "SELECT * FROM region WHERE string::lowercase(name) CONTAINS string::lowercase($query) LIMIT 20";
        let mut result = db.query(sql).bind(("query", query.to_string())).await?;
        let regions: Vec<Region> = result.take(0)?;
        Ok(regions)
    }

    pub async fn search_cities(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        query: &str,
    ) -> anyhow::Result<Vec<City>> {
        let sql = "SELECT * FROM city WHERE string::lowercase(name) CONTAINS string::lowercase($query) LIMIT 20";
        let mut result = db.query(sql).bind(("query", query.to_string())).await?;
        let cities: Vec<City> = result.take(0)?;
        Ok(cities)
    }

    pub async fn list_regions(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Region>> {
        let regions: Vec<Region> = db.select("region").await?;
        Ok(regions)
    }

    pub async fn create_rack(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        rack: Rack,
    ) -> anyhow::Result<Rack> {
        let created: Option<Rack> = db.create("rack").content(rack).await?;
        Ok(created.unwrap())
    }

    pub async fn list_racks(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        space_id: &str,
    ) -> anyhow::Result<Vec<Rack>> {
        let sql = "SELECT * FROM rack WHERE space_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", space_id.to_string())).await?;
        let racks: Vec<Rack> = result.take(0)?;
        Ok(racks)
    }

    // New methods for hierarchy
    pub async fn create_building(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        building: Building,
    ) -> anyhow::Result<Building> {
        let created: Option<Building> = db.create("building").content(building).await?;
        Ok(created.unwrap())
    }

    pub async fn list_all_buildings(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Building>> {
        let buildings: Vec<Building> = db.select("building").await?;
        Ok(buildings)
    }

    pub async fn list_buildings(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        site_id: &str,
    ) -> anyhow::Result<Vec<Building>> {
        let sql = "SELECT * FROM building WHERE site_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", site_id.to_string())).await?;
        let buildings: Vec<Building> = result.take(0)?;
        Ok(buildings)
    }

    pub async fn create_floor(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        floor: Floor,
    ) -> anyhow::Result<Floor> {
        let created: Option<Floor> = db.create("floor").content(floor).await?;
        Ok(created.unwrap())
    }

    pub async fn list_floors(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        building_id: &str,
    ) -> anyhow::Result<Vec<Floor>> {
        let sql = "SELECT * FROM floor WHERE building_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", building_id.to_string())).await?;
        let floors: Vec<Floor> = result.take(0)?;
        Ok(floors)
    }

    pub async fn list_all_floors(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Floor>> {
        let floors: Vec<Floor> = db.select("floor").await?;
        Ok(floors)
    }

    pub async fn create_space(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        space: Space,
    ) -> anyhow::Result<Space> {
        let created: Option<Space> = db.create("space").content(space).await?;
        Ok(created.unwrap())
    }

    pub async fn list_spaces(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        floor_id: &str,
    ) -> anyhow::Result<Vec<Space>> {
        let sql = "SELECT * FROM space WHERE floor_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", floor_id.to_string())).await?;
        let spaces: Vec<Space> = result.take(0)?;
        Ok(spaces)
    }

    pub async fn list_all_spaces(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Space>> {
        let spaces: Vec<Space> = db.select("space").await?;
        Ok(spaces)
    }

    pub async fn create_device(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        device: Device,
    ) -> anyhow::Result<Device> {
        let created: Option<Device> = db.create("device").content(device).await?;
        Ok(created.unwrap())
    }

    pub async fn list_devices(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        rack_id: &str,
    ) -> anyhow::Result<Vec<Device>> {
        let sql = "SELECT * FROM device WHERE rack_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", rack_id.to_string())).await?;
        let devices: Vec<Device> = result.take(0)?;
        Ok(devices)
    }

    // Desk methods
    pub async fn create_desk(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        desk: Desk,
    ) -> anyhow::Result<Desk> {
        let created: Option<Desk> = db.create("desk").content(desk).await?;
        Ok(created.unwrap())
    }

    pub async fn list_desks(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        space_id: &str,
    ) -> anyhow::Result<Vec<Desk>> {
        let sql = "SELECT * FROM desk WHERE space_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", space_id.to_string())).await?;
        let desks: Vec<Desk> = result.take(0)?;
        Ok(desks)
    }

    pub async fn list_all_desks(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Desk>> {
        let desks: Vec<Desk> = db.select("desk").await?;
        Ok(desks)
    }

    // Person methods
    pub async fn create_person(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        person: Person,
    ) -> anyhow::Result<Person> {
        let created: Option<Person> = db.create("person").content(person).await?;
        Ok(created.unwrap())
    }

    pub async fn list_people(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        site_id: &str,
    ) -> anyhow::Result<Vec<Person>> {
        let sql = "SELECT * FROM person WHERE site_id = type::thing($id)";
        let mut result = db.query(sql).bind(("id", site_id.to_string())).await?;
        let people: Vec<Person> = result.take(0)?;
        Ok(people)
    }

    pub async fn list_all_people(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Person>> {
        let people: Vec<Person> = db.select("person").await?;
        Ok(people)
    }

    pub async fn get_person_by_id(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        id: &str,
    ) -> anyhow::Result<Option<Person>> {
        let person: Option<Person> = db.select(("person", id)).await?;
        Ok(person)
    }

    // =========================================================================
    // Network Asset methods
    // =========================================================================

    pub async fn create_asset(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        asset: NetworkAsset,
    ) -> anyhow::Result<NetworkAsset> {
        let created: Option<NetworkAsset> = db.create("network_asset").content(asset).await?;
        Ok(created.unwrap())
    }

    pub async fn list_all_assets(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<NetworkAsset>> {
        let assets: Vec<NetworkAsset> = db.select("network_asset").await?;
        Ok(assets)
    }

    pub async fn get_asset_by_id(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        id: &str,
    ) -> anyhow::Result<Option<NetworkAsset>> {
        let asset: Option<NetworkAsset> = db.select(("network_asset", id)).await?;
        Ok(asset)
    }

    pub async fn update_asset(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        id: &str,
        asset: NetworkAsset,
    ) -> anyhow::Result<Option<NetworkAsset>> {
        let updated: Option<NetworkAsset> = db.update(("network_asset", id)).content(asset).await?;
        Ok(updated)
    }

    pub async fn delete_asset(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        id: &str,
    ) -> anyhow::Result<Option<NetworkAsset>> {
        let deleted: Option<NetworkAsset> = db.delete(("network_asset", id)).await?;
        Ok(deleted)
    }

    pub async fn list_assets_in_rack(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
        rack_id: &str,
    ) -> anyhow::Result<Vec<NetworkAsset>> {
        let sql =
            "SELECT * FROM network_asset WHERE rack_id = type::thing($id) ORDER BY position_u ASC";
        let mut result = db.query(sql).bind(("id", rack_id.to_string())).await?;
        let assets: Vec<NetworkAsset> = result.take(0)?;
        Ok(assets)
    }

    pub async fn list_all_racks(
        db: &surrealdb::Surreal<surrealdb::engine::local::Db>,
    ) -> anyhow::Result<Vec<Rack>> {
        let racks: Vec<Rack> = db.select("rack").await?;
        Ok(racks)
    }
}
